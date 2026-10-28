/**
 * GridBloom - Phaser Game React Wrapper Component
 * Isolated canvas lifecycle, zero memory leaks, responsive ResizeObserver integration.
 */

import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { GridBloomScene, SceneCallbacks } from './GridBloomScene';
import { GameState, PulseTarget } from '../engine/rules';

interface PhaserGameProps {
  gameState: GameState;
  reducedMotion: boolean;
  onMoveAttempt: (trayPieceId: string, anchorRow: number, anchorCol: number) => void;
  onPulseTargetSelect: (target: PulseTarget) => void;
}

export const PhaserGame: React.FC<PhaserGameProps> = ({
  gameState,
  reducedMotion,
  onMoveAttempt,
  onPulseTargetSelect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<GridBloomScene | null>(null);
  const callbacksRef = useRef<SceneCallbacks>({ onMoveAttempt, onPulseTargetSelect });

  // Keep callbacks ref updated to avoid stale closures
  useEffect(() => {
    callbacksRef.current = { onMoveAttempt, onPulseTargetSelect };
    if (sceneRef.current) {
      sceneRef.current.setCallbacks(callbacksRef.current);
    }
  }, [onMoveAttempt, onPulseTargetSelect]);

  // Reduced motion sync
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setReducedMotion(reducedMotion);
    }
  }, [reducedMotion]);

  // Sync game state to Phaser scene
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.updateGameState(gameState);
    }
  }, [gameState]);

  // Initialize Phaser Game instance once
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 360;
    const height = containerRef.current.clientHeight || 560;

    const scene = new GridBloomScene(
      {
        onMoveAttempt: (id, r, c) => callbacksRef.current.onMoveAttempt(id, r, c),
        onPulseTargetSelect: (t) => callbacksRef.current.onPulseTargetSelect(t),
      },
      gameState
    );
    scene.setReducedMotion(reducedMotion);
    sceneRef.current = scene;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width,
      height,
      transparent: true,
      backgroundColor: '#00000000',
      physics: {
        default: 'none',
      },
      scene: [scene],
      scale: {
        mode: Phaser.Scale.NONE,
        autoCenter: Phaser.Scale.NO_CENTER,
      },
      render: {
        antialias: true,
        pixelArt: false,
        powerPreference: 'high-performance',
      },
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    // ResizeObserver for clean responsive handling
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newWidth, height: newHeight } = entry.contentRect;
        if (newWidth > 0 && newHeight > 0 && gameRef.current?.isBooted && sceneRef.current) {
          sceneRef.current.handleResize(newWidth, newHeight);
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
        sceneRef.current = null;
      }
    };
  }, []); // Run once on mount

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative select-none touch-none overflow-hidden"
      style={{ touchAction: 'none' }}
      data-testid="phaser-game-canvas"
    />
  );
};
