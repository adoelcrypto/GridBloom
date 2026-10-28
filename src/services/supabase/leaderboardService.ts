/**
 * GridBloom - Leaderboard Service
 * Supports online Supabase leaderboards with offline/local fallback.
 */

import { getSupabaseClient, isSupabaseConfigured } from './client';
import { loadPlayerProfile, savePlayerProfile, PlayerProfile } from '../../storage/gameStorage';

export interface LeaderboardEntry {
  readonly id: string;
  readonly displayName: string;
  readonly score: number;
  readonly linesCleared: number;
  readonly maxCombo: number;
  readonly mode: 'classic' | 'daily';
  readonly createdAt: string;
  readonly isCurrentUser?: boolean;
}

export interface SubmitScoreParams {
  readonly score: number;
  readonly linesCleared: number;
  readonly maxCombo: number;
  readonly mode: 'classic' | 'daily';
  readonly dailyDate?: string;
}

export interface ServiceResult<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
  readonly isOffline?: boolean;
}

export class LeaderboardService {
  /**
   * Checks if online leaderboards are ready to use
   */
  public isOnlineAvailable(): boolean {
    return isSupabaseConfigured();
  }

  /**
   * Prompts user with plain explanation to enable online leaderboards
   */
  public async enableOnlineFeatures(): Promise<ServiceResult<PlayerProfile>> {
    const client = getSupabaseClient();
    const profile = loadPlayerProfile();

    if (!client) {
      return {
        success: false,
        error: 'Online leaderboard backend is not configured. Running in local offline mode.',
        isOffline: true,
      };
    }

    try {
      // Sign in anonymously if no session exists
      const { data: sessionData } = await client.auth.getSession();
      if (!sessionData.session) {
        const { error: authError } = await client.auth.signInAnonymously();
        if (authError) {
          return { success: false, error: authError.message };
        }
      }

      // Upsert profile
      const user = (await client.auth.getUser()).data.user;
      if (user) {
        await client.from('profiles').upsert({
          id: user.id,
          display_name: profile.displayName,
          updated_at: new Date().toISOString(),
        });
      }

      const updatedProfile: PlayerProfile = {
        ...profile,
        onlineEnabled: true,
      };
      savePlayerProfile(updatedProfile);

      return { success: true, data: updatedProfile };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to connect to online services',
        isOffline: true,
      };
    }
  }

  /**
   * Fetch top leaderboard scores
   */
  public async fetchLeaderboard(
    mode: 'classic' | 'daily',
    dailyDate?: string
  ): Promise<ServiceResult<LeaderboardEntry[]>> {
    const client = getSupabaseClient();
    if (!client) {
      return {
        success: false,
        error: 'Cloud leaderboard not configured. Local scores are stored on your device.',
        isOffline: true,
      };
    }

    try {
      let query = client
        .from('leaderboard_scores')
        .select(`
          id,
          score,
          lines_cleared,
          max_combo,
          mode,
          created_at,
          user_id,
          profiles (
            display_name
          )
        `)
        .eq('mode', mode)
        .order('score', { ascending: false })
        .limit(50);

      if (mode === 'daily' && dailyDate) {
        query = query.eq('daily_date', dailyDate);
      }

      const { data, error } = await query;
      if (error) {
        return { success: false, error: error.message };
      }

      const currentUserId = (await client.auth.getUser()).data.user?.id;

      const entries: LeaderboardEntry[] = (data || []).map((row: any) => ({
        id: row.id,
        displayName: row.profiles?.display_name || 'Anonymous Bloomer',
        score: row.score,
        linesCleared: row.lines_cleared,
        maxCombo: row.max_combo,
        mode: row.mode,
        createdAt: row.created_at,
        isCurrentUser: currentUserId ? row.user_id === currentUserId : false,
      }));

      return { success: true, data: entries };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Network error fetching leaderboards',
        isOffline: true,
      };
    }
  }

  /**
   * Submits a score securely. Uses Edge Function if present, or direct authenticated insert with RLS.
   */
  public async submitScore(params: SubmitScoreParams): Promise<ServiceResult<boolean>> {
    const client = getSupabaseClient();
    if (!client) {
      return {
        success: false,
        error: 'Supabase offline',
        isOffline: true,
      };
    }

    const profile = loadPlayerProfile();
    if (!profile.onlineEnabled) {
      return {
        success: false,
        error: 'Online score submission is not enabled in player settings.',
      };
    }

    try {
      const user = (await client.auth.getUser()).data.user;
      if (!user) {
        await this.enableOnlineFeatures();
      }

      const activeUser = (await client.auth.getUser()).data.user;
      if (!activeUser) {
        return { success: false, error: 'Authentication required for online score submission' };
      }

      // Try calling the Edge Function first
      const { error: fnError } = await client.functions.invoke('submit-score', {
        body: {
          score: params.score,
          lines_cleared: params.linesCleared,
          max_combo: params.maxCombo,
          mode: params.mode,
          daily_date: params.dailyDate || null,
        },
      });

      if (!fnError) {
        return { success: true, data: true };
      }

      // Fallback: direct insert with RLS validation
      const { error: insertError } = await client.from('leaderboard_scores').insert({
        user_id: activeUser.id,
        score: params.score,
        lines_cleared: params.linesCleared,
        max_combo: params.maxCombo,
        mode: params.mode,
        daily_date: params.dailyDate || null,
      });

      if (insertError) {
        return { success: false, error: insertError.message };
      }

      return { success: true, data: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Score submission failed',
        isOffline: true,
      };
    }
  }
}

export const leaderboardService = new LeaderboardService();
