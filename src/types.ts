/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Difficulty = 'easy' | 'medium' | 'hard';

export type GameTheme = 'alpine_dawn' | 'valley_noon' | 'andes_sunset' | 'cosmic_night';

export type BalloonType = 'normal' | 'golden' | 'clock' | 'shield' | 'frozen';

export interface Balloon {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  speed: number;
  sway: number;
  swayOffset: number;
  type: BalloonType;
  explode: boolean;
  explodeSize: number;
  scoreValue: number;
}

export interface Condor {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  wing: number;
  dead: boolean;
  fallSpeed: number;
  flapSpeed: number;
  altitudeOffset: number;
  colorType: 'black' | 'brown' | 'golden';
}

export interface Cloud {
  id: string;
  x: number;
  y: number;
  radius: number;
  speed: number;
  layers: { dx: number; dy: number; r: number }[];
  opacity: number;
}

export interface WindParticle {
  x: number;
  y: number;
  speed: number;
  size: number;
  length: number;
}

export interface SparkleParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  type: 'sparkle' | 'feather' | 'dust';
}

export interface ShotEffect {
  id: string;
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
}

export interface HighScoreRecord {
  score: number;
  accuracy: number;
  difficulty: Difficulty;
  date: string;
}
