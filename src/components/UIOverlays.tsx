/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Award,
  Clock,
  Target,
  Sliders,
  Sun,
  Moon,
  CloudSun,
  Sunset,
  Volume,
  Tv,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { Difficulty, GameTheme, HighScoreRecord } from '../types';

interface UIOverlaysProps {
  score: number;
  timeLeft: number;
  gameStarted: boolean;
  gameEnded: boolean;
  isPaused: boolean;
  difficulty: Difficulty;
  theme: GameTheme;
  highScores: HighScoreRecord[];
  finalAccuracy: number;
  newHighScore: boolean;

  onStartGame: () => void;
  onTogglePause: () => void;
  onRestartGame: () => void;
  onChangeDifficulty: (diff: Difficulty) => void;
  onChangeTheme: (theme: GameTheme) => void;
  onToggleMute: () => void;
  isMuted: boolean;
}

export const UIOverlays: React.FC<UIOverlaysProps> = ({
  score,
  timeLeft,
  gameStarted,
  gameEnded,
  isPaused,
  difficulty,
  theme,
  highScores,
  finalAccuracy,
  newHighScore,
  onStartGame,
  onTogglePause,
  onRestartGame,
  onChangeDifficulty,
  onChangeTheme,
  onToggleMute,
  isMuted,
}) => {
  // Format difficulty label in Spanish
  const getDifficultyLabel = (diff: Difficulty) => {
    switch (diff) {
      case 'easy': return 'FÁCIL';
      case 'medium': return 'MEDIO';
      case 'hard': return 'DIFÍCIL';
    }
  };

  // Spanish Theme Translation
  const getThemeLabel = (t: GameTheme) => {
    switch (t) {
      case 'alpine_dawn': return 'Amanecer Alpino';
      case 'valley_noon': return 'Mediodía Profundo';
      case 'andes_sunset': return 'Atardecer Andino';
      case 'cosmic_night': return 'Noche Cósmica';
    }
  };

  return (
    <div className="absolute inset-0 z-20 pointer-events-none font-sans select-none">
      
      {/* 1. TOP HUD ACCENTS (Visible during gameplay) */}
      {gameStarted && !gameEnded && (
        <div className="absolute top-0 inset-x-0 p-4 md:p-6 flex justify-between items-start pointer-events-auto">
          {/* Points & Stats */}
          <div className="flex flex-col gap-1.5 md:gap-2">
            <div className="bg-slate-900/90 border border-slate-700/50 backdrop-blur-md rounded-2xl px-5 py-2.5 shadow-xl flex items-center gap-3.5">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-semibold tracking-wider font-mono">PUNTOS</span>
                <span className="text-2xl md:text-3xl font-black text-white font-mono leading-none">{score}</span>
              </div>
            </div>
            {/* Best Run Tracker */}
            {highScores.length > 0 && (
              <div className="bg-slate-900/80 border border-slate-800/40 backdrop-blur-sm rounded-lg px-3 py-1 flex items-center gap-2 self-start">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] text-slate-300 font-bold font-mono">REC: {highScores[0].score}</span>
              </div>
            )}
          </div>

          {/* 60 Seconds Timer countdown indicator (Requested!) */}
          <div className="flex flex-col items-center">
            <div
              className={`transition-all duration-300 bg-slate-900/90 border-2 rounded-2xl px-5 py-2.5 shadow-2xl flex items-center gap-3.5 backdrop-blur-md ${
                timeLeft <= 10
                  ? 'border-red-500 text-red-500 animate-pulse scale-105 shadow-red-500/20'
                  : 'border-white/20 text-white'
              }`}
            >
              <Clock className={`w-5 h-5 ${timeLeft <= 10 ? 'animate-spin' : ''}`} />
              <div className="flex flex-col items-center">
                <span className="text-[10px] opacity-75 font-bold tracking-wider font-mono">TIEMPO</span>
                <span className="text-3xl font-black font-mono leading-none">
                  {timeLeft > 0 ? timeLeft : 0}s
                </span>
              </div>
            </div>
            
            {/* Linear Progress Bar for Visual Countdown */}
            <div className="w-32 h-1.5 bg-slate-900/50 rounded-full mt-2.5 overflow-hidden border border-white/10">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  timeLeft <= 10 ? 'bg-red-500' : timeLeft <= 25 ? 'bg-amber-400' : 'bg-cyan-400'
                }`}
                style={{ width: `${(timeLeft / 60) * 100}%` }}
              />
            </div>
          </div>

          {/* Controls Cluster */}
          <div className="flex gap-2.5">
            {/* Mute Button */}
            <button
              onClick={onToggleMute}
              className="bg-slate-900/80 hover:bg-slate-800 border border-slate-700/40 p-3 rounded-2xl shadow-lg transition-transform active:scale-95 cursor-pointer text-slate-200"
              title={isMuted ? "Activar Sonido" : "Silenciar"}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            {/* Pause Button */}
            <button
              onClick={onTogglePause}
              className="bg-slate-900/80 hover:bg-slate-800 border border-slate-700/40 p-3 rounded-2xl shadow-lg transition-transform active:scale-95 cursor-pointer text-slate-200"
            >
              {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}


      {/* 2. START MENU SCREENS */}
      <AnimatePresence>
        {!gameStarted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm pointer-events-auto flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: -10 }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full max-w-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-2xl overflow-y-auto max-h-[92vh] flex flex-col gap-6"
            >
              {/* Header Title (Outfit display typography with majestic custom shading) */}
              <div className="text-center">
                <span className="text-[11px] font-bold text-cyan-400 tracking-[0.25em] font-mono block mb-1">
                  CORDILLERA ANDINA EXTREMA
                </span>
                <h1 className="text-5xl md:text-7xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 select-none tracking-tight">
                  CONDOR DUCKS
                </h1>
                <p className="text-slate-300 font-sans mt-3 font-medium text-sm md:text-base max-w-md mx-auto">
                  ¡Pon a prueba tu agudeza visual! Dispara a los globos flotantes antes de que escapen de la cordillera, pero evita tocar los majestuosos cóndores.
                </p>
              </div>

              {/* Quick instructions banner */}
              <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/40 flex flex-col gap-2.5 items-center justify-center">
                <span className="text-xs font-bold text-slate-400 tracking-wider">REGLAS REGIONALES</span>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 mt-1 text-center font-mono">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
                    <span>POP DE REGISTRO (+10pts/+30pts)</span>
                  </div>
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
                    <span className="w-2.5 h-2.5 bg-rose-500 rounded-full" />
                    <span>CÓNDORES = DERROTA INSTANTÁNEA</span>
                  </div>
                  <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>RELOJ AZUL (+5s EXTRA)</span>
                  </div>
                </div>
              </div>

              {/* Configurations Panel (Difficulty & Environment Themes) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-1">
                {/* 2.1 DIFFICULTY SELECTOR */}
                <div className="flex flex-col gap-2.5">
                  <label className="text-xs text-slate-400 font-bold tracking-wider flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-orange-400" />
                    DIFICULTAD DE VUELO
                  </label>
                  <div className="grid grid-cols-3 gap-2 bg-slate-950 border border-slate-800 p-1.5 rounded-xl">
                    {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
                      <button
                        key={diff}
                        onClick={() => onChangeDifficulty(diff)}
                        className={`text-xs font-bold py-2 px-2 rounded-lg transition-all cursor-pointer ${
                          difficulty === diff
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md font-extrabold'
                            : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                        }`}
                      >
                        {getDifficultyLabel(diff)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2.2 IMPROVED ENVIRONMENTAL BACKGROUND SELECTOR (Requested!) */}
                <div className="flex flex-col gap-2.5">
                  <label className="text-xs text-slate-400 font-bold tracking-wider flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    ESTILO DEL PAISAJE (FONDO)
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 bg-slate-950 border border-slate-800 p-1.5 rounded-xl">
                    {(['alpine_dawn', 'valley_noon', 'andes_sunset', 'cosmic_night'] as GameTheme[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => onChangeTheme(t)}
                        className={`text-[10px] font-bold py-1.5 px-1 md:px-2 rounded-lg transition-all flex items-center gap-1.5 justify-center cursor-pointer ${
                          theme === t
                            ? 'bg-slate-800 text-cyan-400 border border-cyan-500/20 shadow-sm'
                            : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                        }`}
                      >
                        {t === 'alpine_dawn' && <CloudSun className="w-3.5 h-3.5 text-pink-400" />}
                        {t === 'valley_noon' && <Sun className="w-3.5 h-3.5 text-amber-300" />}
                        {t === 'andes_sunset' && <Sunset className="w-3.5 h-3.5 text-orange-400" />}
                        {t === 'cosmic_night' && <Moon className="w-3.5 h-3.5 text-indigo-300" />}
                        <span>{getThemeLabel(t).split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* High scores persistence display */}
              {highScores.length > 0 && (
                <div className="bg-slate-950/40 p-4 border border-slate-800/30 rounded-2xl">
                  <span className="text-xs font-bold text-slate-400 tracking-wider flex items-center gap-2 mb-2 justify-center">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    SALA DE RÉCORDS REGIONALES
                  </span>
                  <div className="max-h-24 overflow-y-auto space-y-1.5 font-mono text-xs">
                    {highScores.slice(0, 3).map((rec, idx) => (
                      <div key={idx} className="flex justify-between items-center text-slate-300 px-3 py-1 bg-slate-950/60 rounded border border-slate-900/50">
                        <div className="flex items-center gap-2">
                          <span className="text-amber-400 font-black">#{idx + 1}</span>
                          <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-bold uppercase">{getDifficultyLabel(rec.difficulty)}</span>
                        </div>
                        <div className="flex gap-4">
                          <span>Puntería: <b className="text-cyan-400">{rec.accuracy}%</b></span>
                          <span className="font-extrabold text-white">{rec.score} pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sound Controls Row & Core Start Trigger */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
                <button
                  onClick={onToggleMute}
                  className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors p-2 rounded-xl border border-slate-800 hover:border-slate-700 pointer-events-auto cursor-pointer"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                  <span>SONIDOS {isMuted ? 'DESACTIVADOS' : 'ACTIVOS'}</span>
                </button>

                <button
                  onClick={onStartGame}
                  className="w-full sm:w-auto bg-gradient-to-r from-yellow-400 via-orange-500 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 px-9 py-4 rounded-2xl font-black text-xl tracking-wide shadow-2xl active:scale-95 transition-transform flex items-center justify-center gap-2 cursor-pointer border-t border-white/20"
                >
                  <span>INICIAR</span>
                  <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* 3. PAUSED GAME NOTIFICATION SCREEN */}
      <AnimatePresence>
        {gameStarted && isPaused && !gameEnded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm pointer-events-auto flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="text-center flex flex-col gap-4 max-w-sm px-6"
            >
              <h2 className="text-4xl font-extrabold font-display text-white tracking-wide">
                BÚSQUEDA PAUSADA
              </h2>
              <p className="text-slate-300 text-sm font-medium">
                Los globos andinos están suspendidos. Toma un respiro y prepárate para reanudar la cacería.
              </p>
              <button
                onClick={onTogglePause}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-3.5 px-8 rounded-xl shadow-lg transition-transform active:scale-95 text-md cursor-pointer self-center"
              >
                REANUDAR JUEGO
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* 4. GAME OVER SUMMARY STATS PANEL */}
      <AnimatePresence>
        {gameEnded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/90 pointer-events-auto flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.85, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-md bg-slate-900 border border-red-500/20 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col gap-6 text-center shadow-red-950/15"
            >
              <div>
                <motion.span
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 2.5 }}
                  className="text-[10px] font-bold text-red-500 font-mono tracking-[0.25em] block mb-1"
                >
                  FIN DE LA SESIÓN
                </motion.span>
                <h2 className="text-4xl md:text-5xl font-black font-display text-white">
                  GAME OVER
                </h2>
              </div>

              {/* Confetti celebration banner if they broke their High Score! */}
              {newHighScore && (
                <div className="bg-amber-400/10 border border-amber-400/40 rounded-xl p-3 flex items-center justify-center gap-2.5 text-amber-300 animate-bounce">
                  <Award className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-bold font-mono uppercase tracking-wider">¡NUEVO RÉCORD INTEGRADO!</span>
                </div>
              )}

              {/* Comprehensive visual metrics layout */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col items-center">
                  <span className="text-[10px] text-slate-400 font-bold font-mono mb-1">SCORE TOTAL</span>
                  <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 font-mono leading-none">
                    {score}
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono mt-1">PUNTOS</span>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col items-center">
                  <span className="text-[10px] text-slate-400 font-bold font-mono mb-1">PUNTERÍA</span>
                  <div className="flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-cyan-400" />
                    <span className="text-2xl font-black text-white font-mono leading-none">
                      {finalAccuracy}%
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono mt-1">DE DISPAROS</span>
                </div>
              </div>

              {/* Short responsive feedback text based on performances */}
              <p className="text-slate-300 text-xs md:text-sm">
                {score >= 200
                  ? '¡Excelente puntería! Has dominado el viento y las corrientes de la cordillera.'
                  : score >= 80
                  ? 'Buen puntaje. Ten cuidado con las alas de los cóndores la próxima vez.'
                  : 'Sigue practicando para superar tu récord. Intenta apuntar a los globos con prudencia.'}
              </p>

              {/* Restart command */}
              <button
                onClick={onRestartGame}
                className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-white font-black py-4 px-6 rounded-2xl shadow-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 border-t border-white/20 hover:brightness-110"
              >
                <RotateCcw className="w-5 h-5" />
                <span>REINICIAR BÚSQUEDA</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
