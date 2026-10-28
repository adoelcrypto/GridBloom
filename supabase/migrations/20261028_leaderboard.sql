-- GridBloom Leaderboard & Profiles Schema
-- Version: 20261028_leaderboard

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL CHECK (char_length(display_name) >= 2 AND char_length(display_name) <= 30),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies:
-- Anyone can view display names for leaderboard display
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Users can insert and update their own profile
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- 2. Leaderboard Scores Table
CREATE TABLE IF NOT EXISTS public.leaderboard_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0),
  lines_cleared INTEGER NOT NULL CHECK (lines_cleared >= 0),
  max_combo INTEGER NOT NULL CHECK (max_combo >= 0),
  mode TEXT NOT NULL CHECK (mode IN ('classic', 'daily')),
  daily_date TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Indexes for fast leaderboard rank queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_scores_classic_rank
  ON public.leaderboard_scores (mode, score DESC)
  WHERE mode = 'classic';

CREATE INDEX IF NOT EXISTS idx_leaderboard_scores_daily_rank
  ON public.leaderboard_scores (mode, daily_date, score DESC)
  WHERE mode = 'daily';

CREATE INDEX IF NOT EXISTS idx_leaderboard_scores_user
  ON public.leaderboard_scores (user_id);

-- Enable RLS for leaderboard_scores
ALTER TABLE public.leaderboard_scores ENABLE ROW LEVEL SECURITY;

-- Leaderboard Scores Policies:
-- Anyone can view leaderboard entries
CREATE POLICY "Public leaderboard scores are viewable by everyone"
  ON public.leaderboard_scores
  FOR SELECT
  USING (true);

-- Authenticated players can insert their own verified score
CREATE POLICY "Authenticated users can submit their own score"
  ON public.leaderboard_scores
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND score >= 0
    AND lines_cleared >= 0
  );
