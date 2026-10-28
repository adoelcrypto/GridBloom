/**
 * GridBloom - Main Application Entry & State Machine Controller
 * Coordinates React Game Shell, pure game engine, Phaser 2D canvas, storage, audio, and ads.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TitleScreen } from './components/TitleScreen';
import { HudBar } from './components/HudBar';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { DailyChallengeModal } from './components/DailyChallengeModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { SettingsModal } from './components/SettingsModal';
import { TutorialModal } from './components/TutorialModal';
import { PhaserGame } from './game/phaser/PhaserGame';

import {
  GameState,
  PulseTarget,
  createInitialGameState,
  executeMove,
  executeBloomPulse,
  executeRescue,
} from './game/engine/rules';
import { createMulberry32, RandomSource } from './game/engine/random';
import { createDailyGameState, getTodayDateString } from './game/engine/daily';
import {
  loadSettings,
  saveSettings,
  loadStats,
  updateStatsOnRunEnd,
  loadActiveRun,
  saveActiveRun,
  clearSavedRun,
  saveDailyRecord,
  GameSettings,
  PlayerStats,
} from './storage/gameStorage';
import { soundManager } from './game/audio/soundManager';
import { adService } from './services/ads/adProvider';

type AppState = 'title' | 'playing' | 'paused' | 'gameover';

export default function App() {
  const [appState, setAppState] = useState<AppState>('title');
  const [gameMode, setGameMode] = useState<'classic' | 'daily'>('classic');

  // Persistence & settings
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [stats, setStats] = useState<PlayerStats>(() => loadStats());
  const [isNewBest, setIsNewBest] = useState(false);

  // Active game logic state
  const rngRef = useRef<RandomSource>(createMulberry32(Date.now()));
  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState(rngRef.current));
  const [dailyDate, setDailyDate] = useState<string>(getTodayDateString());

  // UI Overlays
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);

  // Keep document.body.dataset.state in sync with current state machine
  useEffect(() => {
    document.body.dataset.state = appState;
  }, [appState]);

  // Audio system sync
  useEffect(() => {
    soundManager.setEnabled(settings.soundEnabled);
    soundManager.setVolume(settings.soundVolume);
  }, [settings.soundEnabled, settings.soundVolume]);

  // Handle ?autostart=1 parameter and saved run detection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      startClassicGame();
    } else {
      // Check if there is an active saved run from earlier
      const savedRun = loadActiveRun();
      if (savedRun && !savedRun.isGameOver) {
        setGameState(savedRun);
      }
    }
  }, []);

  // Global keyboard shortcuts for game actions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.key === 'Escape' || e.key === 'p' || e.key === 'P') && appState === 'playing') {
        e.preventDefault();
        setAppState('paused');
      } else if (e.key === 'm' || e.key === 'M') {
        // Toggle sound mute
        setSettings((prev) => {
          const next = { ...prev, soundEnabled: !prev.soundEnabled };
          saveSettings(next);
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appState]);

  // Start Classic Game
  const startClassicGame = useCallback(() => {
    const newRng = createMulberry32(Date.now());
    rngRef.current = newRng;
    const initial = createInitialGameState(newRng);

    setGameState(initial);
    setGameMode('classic');
    setIsNewBest(false);
    adService.resetRunAdState();
    clearSavedRun();
    setAppState('playing');
  }, []);

  // Start Daily Challenge
  const startDailyGame = useCallback(() => {
    const today = getTodayDateString();
    setDailyDate(today);
    const { state: dailyState, rng: dailyRng } = createDailyGameState(today);

    rngRef.current = dailyRng;
    setGameState(dailyState);
    setGameMode('daily');
    setIsNewBest(false);
    adService.resetRunAdState();
    setShowDailyModal(false);
    setAppState('playing');
  }, []);

  // Handle piece drop move from Phaser
  const handleMoveAttempt = useCallback(
    (trayPieceId: string, anchorRow: number, anchorCol: number) => {
      setGameState((prevState) => {
        const { state: nextState, result } = executeMove(
          prevState,
          trayPieceId,
          anchorRow,
          anchorCol,
          rngRef.current
        );

        if (!result.success) {
          return prevState;
        }

        // Check if pulse charge reached 100 on this move
        if (
          prevState.pulseCharge < 100 &&
          nextState.pulseCharge >= 100
        ) {
          soundManager.playPulseReady();
        }

        // If game over
        if (nextState.isGameOver) {
          soundManager.playGameOver();
          clearSavedRun();
          adService.onRunCompleted();

          const prevBest = gameMode === 'classic' ? stats.personalBest : 0;
          const isBeaten = nextState.score > prevBest;
          setIsNewBest(isBeaten);

          const updatedStats = updateStatsOnRunEnd(
            nextState.score,
            nextState.linesClearedTotal,
            nextState.maxCombo
          );
          setStats(updatedStats);

          if (gameMode === 'daily') {
            saveDailyRecord(dailyDate, nextState.score);
          }

          // Delay gameover modal slightly for final beat
          setTimeout(() => {
            setAppState('gameover');
          }, 600);
        } else {
          // Save run progress
          if (gameMode === 'classic') {
            saveActiveRun(nextState);
          }
        }

        return nextState;
      });
    },
    [gameMode, stats.personalBest, dailyDate]
  );

  // Toggle Bloom Pulse targeting mode
  const handleTogglePulse = useCallback(() => {
    setGameState((prev) => {
      if (prev.pulseCharge < 100) return prev;
      return { ...prev, pulseActive: !prev.pulseActive };
    });
  }, []);

  // Select target row/column for Bloom Pulse
  const handlePulseTargetSelect = useCallback((target: PulseTarget) => {
    setGameState((prevState) => {
      const { state: nextState, result } = executeBloomPulse(prevState, target);
      if (!result.success) return prevState;

      if (nextState.isGameOver) {
        soundManager.playGameOver();
        clearSavedRun();
        adService.onRunCompleted();
        setAppState('gameover');
      } else if (gameMode === 'classic') {
        saveActiveRun(nextState);
      }

      return nextState;
    });
  }, [gameMode]);

  // Rewarded Rescue
  const handleRescue = useCallback(() => {
    setGameState((prev) => executeRescue(prev));
    setAppState('playing');
  }, []);

  // Update Settings
  const handleUpdateSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Reset local statistics
  const handleResetStats = () => {
    localStorage.removeItem('gridbloom_v1_stats');
    localStorage.removeItem('gridbloom_v1_saved_run');
    setStats(loadStats());
    setShowSettingsModal(false);
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-[#0B0F19] text-white flex flex-col items-center justify-between overflow-hidden">
      {/* 1. Title Screen */}
      {appState === 'title' && (
        <TitleScreen
          personalBest={stats.personalBest}
          onStartClassic={startClassicGame}
          onOpenDaily={() => setShowDailyModal(true)}
          onOpenLeaderboard={() => setShowLeaderboardModal(true)}
          onOpenTutorial={() => setShowTutorialModal(true)}
          onOpenSettings={() => setShowSettingsModal(true)}
        />
      )}

      {/* 2. Active Playing Screen */}
      {(appState === 'playing' || appState === 'paused' || appState === 'gameover') && (
        <div className="relative w-full h-full flex flex-col items-center justify-between select-none">
          {/* Top HUD Cluster */}
          <HudBar
            score={gameState.score}
            personalBest={stats.personalBest}
            combo={gameState.combo}
            pulseCharge={gameState.pulseCharge}
            pulseActive={gameState.pulseActive}
            isMuted={!settings.soundEnabled}
            gameMode={gameMode}
            onTogglePause={() => setAppState('paused')}
            onToggleMute={() => {
              handleUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled });
            }}
            onTogglePulse={handleTogglePulse}
          />

          {/* Interactive Phaser 2D Canvas Area */}
          <div className="flex-1 w-full max-w-md relative flex items-center justify-center overflow-hidden">
            <PhaserGame
              gameState={gameState}
              reducedMotion={settings.reducedMotion}
              onMoveAttempt={handleMoveAttempt}
              onPulseTargetSelect={handlePulseTargetSelect}
            />
          </div>
        </div>
      )}

      {/* 3. Pause Modal */}
      {appState === 'paused' && (
        <PauseModal
          onResume={() => setAppState('playing')}
          onRestart={gameMode === 'classic' ? startClassicGame : startDailyGame}
          onHome={() => setAppState('title')}
        />
      )}

      {/* 4. Game Over Modal */}
      {appState === 'gameover' && (
        <GameOverModal
          score={gameState.score}
          personalBest={stats.personalBest}
          isNewBest={isNewBest}
          linesCleared={gameState.linesClearedTotal}
          maxCombo={gameState.maxCombo}
          gameMode={gameMode}
          dailyDate={dailyDate}
          onPlayAgain={gameMode === 'classic' ? startClassicGame : startDailyGame}
          onHome={() => setAppState('title')}
          onRescue={handleRescue}
        />
      )}

      {/* 5. Daily Challenge Modal */}
      {showDailyModal && (
        <DailyChallengeModal
          onStartDaily={startDailyGame}
          onClose={() => setShowDailyModal(false)}
        />
      )}

      {/* 6. Leaderboard Modal */}
      {showLeaderboardModal && (
        <LeaderboardModal onClose={() => setShowLeaderboardModal(false)} />
      )}

      {/* 7. Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onReplayTutorial={() => setShowTutorialModal(true)}
          onResetStats={handleResetStats}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* 8. Tutorial Modal */}
      {showTutorialModal && (
        <TutorialModal
          onComplete={() => {
            handleUpdateSettings({ ...settings, tutorialCompleted: true });
            setShowTutorialModal(false);
          }}
          onClose={() => setShowTutorialModal(false)}
        />
      )}
    </div>
  );
}
