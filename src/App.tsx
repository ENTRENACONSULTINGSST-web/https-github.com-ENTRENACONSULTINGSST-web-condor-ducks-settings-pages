/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { UIOverlays } from './components/UIOverlays';
import { Difficulty, GameTheme, HighScoreRecord } from './types';
import { sound } from './sound';

export default function App() {
  // Sound Muting (Persisted in Local Storage)
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('condor_ducks_sound_muted');
      const parsed = stored ? JSON.parse(stored) === true : false;
      sound.setMute(parsed);
      return parsed;
    } catch {
      return false;
    }
  });

  // Base difficulty configs (Persisted in Local Storage)
  const [difficulty, setDifficulty] = useState<Difficulty>(() => {
    try {
      const stored = localStorage.getItem('condor_ducks_difficulty');
      return (stored as Difficulty) || 'easy';
    } catch {
      return 'easy';
    }
  });

  // Theme Configs (Persisted in Local Storage)
  const [theme, setTheme] = useState<GameTheme>(() => {
    try {
      const stored = localStorage.getItem('condor_ducks_theme');
      return (stored as GameTheme) || 'alpine_dawn';
    } catch {
      return 'alpine_dawn';
    }
  });

  // High Scores list records (Persisted in Local Storage)
  const [highScores, setHighScores] = useState<HighScoreRecord[]>(() => {
    try {
      const stored = localStorage.getItem('condor_ducks_high_scores');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Game Progression States
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [gameEnded, setGameEnded] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [finalAccuracy, setFinalAccuracy] = useState<number>(100);
  const [newHighScore, setNewHighScore] = useState<boolean>(false);
  const [resetTrigger, setResetTrigger] = useState<number>(0);

  // Synchronize dynamic mute values to soundness engines
  const handleToggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      sound.setMute(next);
      localStorage.setItem('condor_ducks_sound_muted', JSON.stringify(next));
      return next;
    });
  };

  // Synchronize difficulty and theme changes with local storage save
  const handleChangeDifficulty = (diff: Difficulty) => {
    setDifficulty(diff);
    localStorage.setItem('condor_ducks_difficulty', diff);
  };

  const handleChangeTheme = (newTheme: GameTheme) => {
    setTheme(newTheme);
    localStorage.setItem('condor_ducks_theme', newTheme);
  };

  // Triggering the start progression
  const handleStartGame = () => {
    sound.playStart();
    setScore(0);
    setTimeLeft(60);
    setGameStarted(true);
    setGameEnded(false);
    setIsPaused(false);
    setNewHighScore(false);
    setResetTrigger((prev) => prev + 1);
  };

  const handleRestartGame = () => {
    sound.playStart();
    setScore(0);
    setTimeLeft(60);
    setGameStarted(true);
    setGameEnded(false);
    setIsPaused(false);
    setNewHighScore(false);
    setResetTrigger((prev) => prev + 1);
  };

  const handleTogglePause = () => {
    setIsPaused((prev) => !prev);
  };

  // Receives feedback from the Canvas engine on game-over triggers
  const handleGameOver = (finalScore: number, accuracy: number) => {
    setFinalAccuracy(accuracy);
    setGameEnded(true);

    // Save and compare against high scores registry
    const newRecord: HighScoreRecord = {
      score: finalScore,
      accuracy,
      difficulty,
      date: new Date().toLocaleDateString('es-ES'),
    };

    const updated = [...highScores, newRecord];
    // Sort descending by score, secondarily descending by accuracy
    updated.sort((a, b) => b.score - a.score || b.accuracy - a.accuracy);
    
    // Cap at top 10 positions
    const topScores = updated.slice(0, 10);
    setHighScores(topScores);
    localStorage.setItem('condor_ducks_high_scores', JSON.stringify(topScores));

    // Evaluate if the current score is the absolute top record!
    if (topScores.length > 0 && topScores[0].score === finalScore && finalScore > 0) {
      setNewHighScore(true);
      setTimeout(() => {
        sound.playRecord();
      }, 500);
    }
  };

  return (
    <main className="relative w-screen h-screen bg-[#060b13] overflow-hidden select-none font-sans">
      
      {/* 1. FULL SCREEN HTML5 INTERACTIVE GAME CANVAS EMITTER SIMULATOR */}
      <GameCanvas
        difficulty={difficulty}
        theme={theme}
        isPaused={isPaused}
        gameStarted={gameStarted}
        gameEnded={gameEnded}
        onScoreChange={setScore}
        onTimeChange={setTimeLeft}
        onGameOver={handleGameOver}
        resetTrigger={resetTrigger}
      />

      {/* 2. STATS & CONTROL MODULE OVERLAYS (HUD, MENUS, GAME OVER) */}
      <UIOverlays
        score={score}
        timeLeft={timeLeft}
        gameStarted={gameStarted}
        gameEnded={gameEnded}
        isPaused={isPaused}
        difficulty={difficulty}
        theme={theme}
        highScores={highScores}
        finalAccuracy={finalAccuracy}
        newHighScore={newHighScore}
        onStartGame={handleStartGame}
        onTogglePause={handleTogglePause}
        onRestartGame={handleRestartGame}
        onChangeDifficulty={handleChangeDifficulty}
        onChangeTheme={handleChangeTheme}
        onToggleMute={handleToggleMute}
        isMuted={isMuted}
      />

      {/* 3. BRANDING WATERMARKS (CORPORATE SST IDENTITY) */}
      <div className="absolute bottom-4 inset-x-0 px-6 flex justify-between items-end pointer-events-none select-none z-10 font-sans">
        {/* Marca de agua 1: Empresa de Asesoría y Consultoría SST */}
        <div className="flex flex-col text-left transition-opacity duration-500 hover:opacity-40">
          <span className="text-[11px] md:text-sm font-black text-slate-100/30 tracking-[0.15em] leading-tight">
            ENTRENA CONSULTING SAS
          </span>
          <span className="text-[9px] md:text-[10px] font-bold text-slate-400/20 tracking-wider">
            Empresa de Asesoría y Consultoría SST
          </span>
        </div>

        {/* Marca de agua 2: Pausas Activas */}
        <div className="flex flex-col text-right">
          <span className="text-[11px] md:text-sm font-extrabold text-amber-500/25 tracking-[0.2em] font-mono leading-none">
            PAUSAS ACTIVAS
          </span>
          <span className="text-[8px] md:text-[9px] font-semibold text-slate-500/20 tracking-wider font-mono">
            SST BIENESTAR
          </span>
        </div>
      </div>

    </main>
  );
}
