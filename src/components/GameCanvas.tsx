/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Balloon, Condor, Cloud, WindParticle, SparkleParticle, ShotEffect, Difficulty, GameTheme, BalloonType } from '../types';
import { sound } from '../sound';

interface GameCanvasProps {
  difficulty: Difficulty;
  theme: GameTheme;
  isPaused: boolean;
  gameStarted: boolean;
  gameEnded: boolean;
  onScoreChange: (score: number) => void;
  onTimeChange: (time: number) => void;
  onGameOver: (score: number, accuracy: number) => void;
  resetTrigger: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  difficulty,
  theme,
  isPaused,
  gameStarted,
  gameEnded,
  onScoreChange,
  onTimeChange,
  onGameOver,
  resetTrigger,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Keep references to game loop values to avoid React re-render lags
  const stateRef = useRef({
    score: 0,
    timeLeft: 60,
    gameStarted: false,
    gameEnded: false,
    isPaused: false,
    difficulty,
    theme,
    totalShots: 0,
    hitShots: 0,
    mouseX: 0,
    mouseY: 0,
    targetMouseX: 0,
    targetMouseY: 0,
    lastTime: 0,
    accumulatedSpawnTimeBalloon: 0,
    accumulatedSpawnTimeCondor: 0,
    lastSecondTick: 0,
  });

  // Entities stored inside refs for maximum 60FPS animation performance
  const entitiesRef = useRef<{
    balloons: Balloon[];
    condors: Condor[];
    clouds: Cloud[];
    windParticles: WindParticle[];
    particles: SparkleParticle[];
    shots: ShotEffect[];
  }>({
    balloons: [],
    condors: [],
    clouds: [],
    windParticles: [],
    particles: [],
    shots: [],
  });

  // Sync state parameters to ref securely
  useEffect(() => {
    stateRef.current.gameStarted = gameStarted;
    stateRef.current.gameEnded = gameEnded;
    stateRef.current.isPaused = isPaused;
    stateRef.current.difficulty = difficulty;
    stateRef.current.theme = theme;
  }, [gameStarted, gameEnded, isPaused, difficulty, theme]);

  // Reset trigger implementation
  useEffect(() => {
    if (resetTrigger > 0) {
      const state = stateRef.current;
      state.score = 0;
      state.timeLeft = 60;
      state.totalShots = 0;
      state.hitShots = 0;

      const entities = entitiesRef.current;
      entities.balloons = [];
      entities.condors = [];
      entities.particles = [];
      entities.shots = [];

      onScoreChange(0);
      onTimeChange(60);

      // Initialize wind and clouds if empty
      if (entities.clouds.length === 0) {
        initEnvironmentalEntities();
      }
    }
  }, [resetTrigger]);

  const spawnParticles = (x: number, y: number, color: string, type: 'sparkle' | 'feather' | 'dust', count = 12) => {
    const entities = entitiesRef.current;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = 1 + Math.random() * 4.5;
      entities.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - (type === 'feather' ? 1.5 : 0.5), // some upward momentum
        size: type === 'feather' ? 3 + Math.random() * 6 : 2 + Math.random() * 4,
        color,
        life: 0,
        maxLife: 25 + Math.floor(Math.random() * 30),
        type,
      });
    }
  };

  // Initialize atmospheric details
  const initEnvironmentalEntities = () => {
    const entities = entitiesRef.current;
    const canvas = canvasRef.current;
    const w = canvas ? canvas.width : window.innerWidth;
    const h = canvas ? canvas.height : window.innerHeight;

    // Create 6 fluffy driftable clouds
    entities.clouds = [];
    for (let i = 0; i < 6; i++) {
      const cloudRadius = 25 + Math.random() * 20;
      const numLayerCircles = 3 + Math.floor(Math.random() * 4);
      const layers = [];
      for (let j = 0; j < numLayerCircles; j++) {
        layers.push({
          dx: (j - (numLayerCircles - 1) / 2) * (cloudRadius * 0.75) + (Math.random() * 10 - 5),
          dy: Math.random() * 12 - 6,
          r: cloudRadius * (0.8 + Math.random() * 0.4),
        });
      }

      entities.clouds.push({
        id: `cloud-${Math.random()}`,
        x: Math.random() * w,
        y: 60 + Math.random() * (h * 0.35),
        radius: cloudRadius,
        speed: 0.12 + Math.random() * 0.25,
        layers,
        opacity: 0.4 + Math.random() * 0.4,
      });
    }

    // Create 15 wind gusts
    entities.windParticles = [];
    for (let i = 0; i < 15; i++) {
      entities.windParticles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        speed: 1.5 + Math.random() * 2.5,
        size: 1 + Math.random() * 2,
        length: 40 + Math.random() * 90,
      });
    }
  };

  // Set up listeners for parallax shifts
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      stateRef.current.targetMouseX = (e.clientX - centerX) / centerX; // Range -1 to 1
      stateRef.current.targetMouseY = (e.clientY - centerY) / centerY; // Range -1 to 1
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        stateRef.current.targetMouseX = (e.touches[0].clientX - centerX) / centerX;
        stateRef.current.targetMouseY = (e.touches[0].clientY - centerY) / centerY;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // Set up resize observer and start loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // Initial fill
    initEnvironmentalEntities();

    // Set up timer trigger
    let animationId: number;

    const createBalloon = (w: number, h: number) => {
      const colors = ['#ff4d4d', '#ffd24d', '#66ff66', '#4dd2ff', '#ff66ff', '#ff884d'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      // Determine balloon types with clean gamification weights
      const rand = Math.random();
      let type: BalloonType = 'normal';
      let radius = 25 + Math.random() * 15;
      let scoreValue = 10;
      let color = randomColor;

      if (rand < 0.08) {
        type = 'clock'; // Turquoise timer extension
        color = '#00f6ff';
        scoreValue = 15;
        radius = 28;
      } else if (rand < 0.16) {
        type = 'golden'; // Speed bonus
        color = '#ffcc00';
        scoreValue = 30;
        radius = 20;
      } else if (rand < 0.22) {
        type = 'frozen'; // Slow elements
        color = '#a0e8ff';
        scoreValue = 15;
        radius = 26;
      }

      // Base speeds based on difficulties
      let speedMult = 1.0;
      if (stateRef.current.difficulty === 'medium') speedMult = 1.4;
      if (stateRef.current.difficulty === 'hard') speedMult = 1.8;

      const entities = entitiesRef.current;
      entities.balloons.push({
        id: `balloon-${Math.random()}`,
        x: Math.random() * (w - 100) + 50,
        y: h + 100,
        radius,
        color,
        speed: (0.9 + Math.random() * 1.5) * speedMult,
        sway: 0.5 + Math.random() * 2.5,
        swayOffset: Math.random() * Math.PI * 2,
        type,
        explode: false,
        explodeSize: 0,
        scoreValue,
      });
    };

    const createCondor = (w: number, h: number) => {
      let speedMult = 1.0;
      if (stateRef.current.difficulty === 'medium') speedMult = 1.3;
      if (stateRef.current.difficulty === 'hard') speedMult = 1.7;

      const entities = entitiesRef.current;
      
      const colors: ('black' | 'brown' | 'golden')[] = ['black', 'brown'];
      if (Math.random() < 0.15) {
        colors.push('golden');
      }

      entities.condors.push({
        id: `condor-${Math.random()}`,
        x: w + 200,
        y: 80 + Math.random() * (h * 0.55),
        width: 140 + Math.random() * 80,
        height: 70 + Math.random() * 40,
        speed: (0.8 + Math.random() * 1.4) * speedMult,
        wing: Math.random() * 10,
        dead: false,
        fallSpeed: 0,
        flapSpeed: 0.1 + Math.random() * 0.12,
        altitudeOffset: Math.random() * Math.PI * 2,
        colorType: colors[Math.floor(Math.random() * colors.length)],
      });
    };



    // Main animation frame execution loop callback
    const loop = (timestamp: number) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;

      // Inertia on parallax coordinates
      const state = stateRef.current;
      state.mouseX += (state.targetMouseX - state.mouseX) * 0.08;
      state.mouseY += (state.targetMouseY - state.mouseY) * 0.08;

      if (!state.lastTime) state.lastTime = timestamp;
      const deltaTime = Math.min(timestamp - state.lastTime, 100); // Caps delta time at 100ms
      state.lastTime = timestamp;

      // Handle pause bounds and start limits
      if (state.gameStarted && !state.gameEnded && !state.isPaused) {
        // Ticking the count down beautifully
        state.lastSecondTick += deltaTime;
        if (state.lastSecondTick >= 1000) {
          state.timeLeft -= 1;
          onTimeChange(state.timeLeft);
          state.lastSecondTick -= 1000;

          // Sound cues for final seconds countdown warnings
          if (state.timeLeft <= 10 && state.timeLeft > 0) {
            sound.playLowTime(true);
          } else if (state.timeLeft === 15 || state.timeLeft === 20) {
            sound.playLowTime(false);
          }

          if (state.timeLeft <= 0) {
            // End the simulation
            triggerGameOver();
          }
        }

        // Entity Spawner Intervals calculated dynamically using float ticks
        let spawnBalloonInterval = 1000;
        let spawnCondorInterval = 2800;

        if (state.difficulty === 'medium') {
          spawnBalloonInterval = 800;
          spawnCondorInterval = 2300;
        } else if (state.difficulty === 'hard') {
          spawnBalloonInterval = 650;
          spawnCondorInterval = 1700;
        }

        state.accumulatedSpawnTimeBalloon += deltaTime;
        if (state.accumulatedSpawnTimeBalloon >= spawnBalloonInterval) {
          createBalloon(w, h);
          state.accumulatedSpawnTimeBalloon -= spawnBalloonInterval;
        }

        state.accumulatedSpawnTimeCondor += deltaTime;
        if (state.accumulatedSpawnTimeCondor >= spawnCondorInterval) {
          createCondor(w, h);
          state.accumulatedSpawnTimeCondor -= spawnCondorInterval;
        }
      }

      // Ensure canvas clears perfectly
      ctx.clearRect(0, 0, w, h);

      // Render the gorgeous background layers according to selected themes
      drawScenicBackground(ctx, w, h, state.theme, state.mouseX, state.mouseY);

      // Extract entities reference
      const entities = entitiesRef.current;

      // Ambient system: Drifting cloud physics
      entities.clouds.forEach(cloud => {
        if (!state.isPaused) {
          cloud.x += cloud.speed;
          if (cloud.x - cloud.radius * 3 > w) {
            cloud.x = -cloud.radius * 3;
            cloud.y = 50 + Math.random() * (h * 0.35);
          }
        }
        drawCloud(ctx, cloud, state.mouseX, state.mouseY);
      });

      // Ambient system: Drifting wind line drafts
      entities.windParticles.forEach(p => {
        if (!state.isPaused) {
          p.x -= p.speed;
          if (p.x < -p.length) {
            p.x = w + 10;
            p.y = Math.random() * h;
          }
        }
        ctx.strokeStyle = state.theme === 'cosmic_night' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.22)';
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.length, p.y);
        ctx.stroke();
      });

      // Simulation: Balloons handling & rising
      for (let i = entities.balloons.length - 1; i >= 0; i--) {
        const b = entities.balloons[i];

        if (!state.isPaused && !state.gameEnded) {
          if (!b.explode) {
            b.y -= b.speed;
            b.x += Math.sin((timestamp * 0.001) * b.sway + b.swayOffset) * 0.95;
            
            // Slowly increase speed as they ascend to create nice scaling pressure
            b.speed += 0.0006;
          } else {
            b.explodeSize += 4.5;
            if (b.explodeSize > b.radius * 1.8) {
              entities.balloons.splice(i, 1);
              continue;
            }
          }
        }

        // Render balloon or explosive flame ring
        if (b.explode) {
          ctx.beginPath();
          const flameGradient = ctx.createRadialGradient(b.x, b.y, 2, b.x, b.y, b.explodeSize);
          flameGradient.addColorStop(0, '#ffffff');
          flameGradient.addColorStop(0.3, '#ffea6d');
          flameGradient.addColorStop(0.7, '#ff5a00');
          flameGradient.addColorStop(1, 'rgba(255, 90, 0, 0)');
          ctx.fillStyle = flameGradient;
          ctx.arc(b.x, b.y, b.explodeSize, 0, Math.PI * 2);
          ctx.fill();
        } else {
          drawSingleBalloon(ctx, b);
        }

        // BOUNDARY CHECK: Balloon escaped the skyline triggers INSTANT game-over
        if (b.y < -b.radius * 2 && !b.explode) {
          if (state.gameStarted && !state.gameEnded) {
            triggerGameOver();
          }
        }
      }

      // Simulation: Majestic Condors
      for (let i = entities.condors.length - 1; i >= 0; i--) {
        const c = entities.condors[i];

        if (!state.isPaused && !state.gameEnded) {
          if (!c.dead) {
            c.x -= c.speed;
            
            // Majestic soaring sinusoidal motion
            c.y += Math.sin((timestamp * 0.001) * 1.8 + c.altitudeOffset) * 0.75;
            
            // Wing flap iteration
            c.wing += c.flapSpeed;
          } else {
            c.fallSpeed += 0.45;
            c.y += c.fallSpeed;
            c.x -= 0.6; // wind drag push-back
          }
        }

        // Drawing beautiful custom-designed condors
        drawScenicCondor(ctx, c);

        // Cleansing off obsolete out-of-bounds condors
        if (c.x < -c.width * 2 || c.y > h + 150) {
          entities.condors.splice(i, 1);
        }
      }

      // Sparkles and feather physics particle simulation
      for (let i = entities.particles.length - 1; i >= 0; i--) {
        const p = entities.particles[i];
        if (!state.isPaused) {
          p.life++;
          p.x += p.vx;
          p.y += p.vy;
          
          if (p.type === 'feather') {
            p.vx += Math.sin(p.life * 0.1) * 0.15; // fluttering wave effect
            p.vy *= 0.98; // terminal velocity
            p.vy += 0.05; // light gravity falling
          } else {
            p.vy += 0.06; // standard sparkle particle gravity drop
          }
        }

        const opacity = Math.max(0, 1 - p.life / p.maxLife);
        
        ctx.save();
        ctx.globalAlpha = opacity;
        
        if (p.type === 'feather') {
          // Drawing elongated feather strands
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.size, p.size * 0.4, p.life * 0.05, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Sparkling stars or light dots
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 4;
          ctx.shadowColor = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        if (p.life >= p.maxLife) {
          entities.particles.splice(i, 1);
        }
      }

      // Drawing target ripple shoot circles
      for (let i = entities.shots.length - 1; i >= 0; i--) {
        const s = entities.shots[i];
        if (!state.isPaused) {
          s.life--;
        }

        const lifeRatio = s.life / s.maxLife;
        ctx.strokeStyle = `rgba(255, 255, 255, ${lifeRatio})`;
        ctx.lineWidth = 3 * lifeRatio;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius * (1.8 - lifeRatio), 0, Math.PI * 2);
        ctx.stroke();

        if (s.life <= 0) {
          entities.shots.splice(i, 1);
        }
      }

      // Queue next rendering loop
      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Set up click/touch weapon gunshot handling
  const handleInputTrigger = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !stateRef.current.gameStarted || stateRef.current.gameEnded || stateRef.current.isPaused) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const state = stateRef.current;
    state.totalShots += 1;

    // Add immediate visual shotgun blast overlay rings
    entitiesRef.current.shots.push({
      id: `shot-${Math.random()}`,
      x,
      y,
      radius: 12,
      life: 11,
      maxLife: 11,
    });

    let balloonHit = false;
    let condorHit = false;

    const entities = entitiesRef.current;

    // Evaluate Balloon hits first
    for (let i = entities.balloons.length - 1; i >= 0; i--) {
      const b = entities.balloons[i];
      if (b.explode) continue;

      const dx = x - b.x;
      const dy = y - b.y;
      const distance = Math.hypot(dx, dy);

      // Hit success evaluate boundary
      if (distance < b.radius + 8) {
        balloonHit = true;
        b.explode = true;
        state.hitShots += 1;

        // Custom balloon power effect triggers
        if (b.type === 'clock') {
          state.timeLeft = Math.min(99, state.timeLeft + 5);
          sound.playClockExtra();
          spawnParticles(b.x, b.y, '#00f6ff', 'sparkle', 20);
        } else if (b.type === 'golden') {
          state.score += b.scoreValue;
          sound.playPop(b.color);
          spawnParticles(b.x, b.y, '#ffcc00', 'sparkle', 24);
        } else if (b.type === 'frozen') {
          // Slow down all ascending elements temporarily
          state.score += b.scoreValue;
          sound.playPop(b.color);
          spawnParticles(b.x, b.y, '#a0e8ff', 'sparkle', 15);
          entities.balloons.forEach(bal => {
            bal.speed *= 0.55;
          });
        } else {
          // Standard score increment
          state.score += b.scoreValue;
          sound.playPop(b.color);
          spawnParticles(b.x, b.y, b.color, 'sparkle', 12);
        }

        onScoreChange(state.score);
        
        // Haptic rumble
        if (navigator.vibrate) {
          navigator.vibrate([30, 15, 30]);
        }
        break; // break once first pop registered per tap
      }
    }

    // Evaluate Condor Hits if no balloon popped – user clicked a condor!
    if (!balloonHit) {
      for (let i = entities.condors.length - 1; i >= 0; i--) {
        const c = entities.condors[i];
        if (c.dead) continue;

        // Simplify complex bounding box mapping
        const hitL = c.x - c.width * 0.5;
        const hitR = c.x + c.width * 0.5;
        const hitT = c.y - c.height * 0.6;
        const hitB = c.y + c.height * 0.6;

        if (x >= hitL && x <= hitR && y >= hitT && y <= hitB) {
          condorHit = true;
          c.dead = true;
          state.hitShots += 1;

          // Play sad screech and trigger GAME OVER
          sound.playCondorHit();
          spawnParticles(c.x, c.y, '#1d1d1d', 'feather', 25);
          spawnParticles(c.x, c.y, '#bb6556', 'dust', 15);

          if (navigator.vibrate) {
            navigator.vibrate([180, 50, 180]);
          }

          // Delay slightly so feathers burst before menu drops
          setTimeout(() => {
            triggerGameOver();
          }, 850);
          break;
        }
      }
    }

    // Default physical gun snap cues on miss
    if (!balloonHit && !condorHit) {
      sound.playShot();
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    }
  };

  const triggerGameOver = () => {
    const s = stateRef.current;
    if (s.gameEnded) return;
    s.gameEnded = true;

    // Compute final statistics
    const total = s.totalShots;
    const hits = s.hitShots;
    const accuracy = total > 0 ? Math.round((hits / total) * 100) : 0;

    sound.playGameOver();
    onGameOver(s.score, accuracy);
  };

  // Touch and click binds
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleInputTrigger(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    handleInputTrigger(e.clientX, e.clientY);
  };

  return (
    <div className="absolute inset-0 select-none overflow-hidden touch-none z-10">
      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-crosshair"
        onTouchStart={handleTouchStart}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
};

//////////////////////////////////////////////////////
// SCENIC GRAPHIC GENERATORS FOR BACKGROUND MOUNTAINS
//////////////////////////////////////////////////////

const drawScenicBackground = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: GameTheme,
  parallaxX: number,
  parallaxY: number
) => {
  // 1. SKY GRADIENT GENERATION
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  let sunColor = '#ffd000';
  let sunRays = true;
  let sunSize = h * 0.16;
  let hasStars = false;

  switch (theme) {
    case 'alpine_dawn':
      skyGrad.addColorStop(0, '#101e3a'); // Dark indigo top
      skyGrad.addColorStop(0.3, '#303f6f'); // Majestic purple
      skyGrad.addColorStop(0.65, '#a1657c'); // Rosy warm glow
      skyGrad.addColorStop(1, '#ffd090'); // Golden light base
      sunColor = 'rgba(255, 235, 180, 0.9)';
      sunSize = h * 0.12;
      break;
    case 'valley_noon':
      skyGrad.addColorStop(0, '#2ea1ff'); // Brilliant cyan-blue
      skyGrad.addColorStop(0.6, '#aadcff'); // Air blue
      skyGrad.addColorStop(1, '#e3f7ff'); // Bright misty white
      sunColor = '#ffffff';
      sunSize = h * 0.15;
      break;
    case 'andes_sunset':
      skyGrad.addColorStop(0, '#200f35'); // Deep twilight dusk
      skyGrad.addColorStop(0.35, '#c73a4b'); // Intense fire crimson
      skyGrad.addColorStop(0.7, '#ff6030'); // Electric orange
      skyGrad.addColorStop(1, '#ffc040'); // Soft yellow mist
      sunColor = '#ffe3b0';
      sunSize = h * 0.18;
      break;
    case 'cosmic_night':
      skyGrad.addColorStop(0, '#040915'); // Abyssal cosmic black
      skyGrad.addColorStop(0.5, '#0c162c'); // Deep starspace blue
      skyGrad.addColorStop(1, '#1b2c4e'); // Midnight mountaintop horizon
      sunColor = '#e0f0ff'; // Soft pearly glowing moon
      sunRays = false;
      sunSize = h * 0.09;
      hasStars = true;
      break;
  }

  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // Twinkling stars for cosmic night
  if (hasStars) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (let i = 0; i < 30; i++) {
      const starX = (Math.sin(i * 123.45) * 0.5 + 0.5) * w;
      const starY = (Math.cos(i * 987.65) * 0.5 + 0.5) * (h * 0.5);
      const size = 1 + (Math.sin(Date.now() * 0.003 + i) * 0.5 + 0.5) * 2;
      ctx.beginPath();
      ctx.arc(starX, starY, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 2. SUN or MOON CELESTIAL RENDERER WITH PARALLAX ACCENTS
  const sunX = w * 0.75 - parallaxX * 22;
  const sunY = h * 0.28 - parallaxY * 12;

  // Outer radial soft glow halos
  const softGlow = ctx.createRadialGradient(sunX, sunY, 1, sunX, sunY, sunSize * 2.5);
  if (theme === 'cosmic_night') {
    softGlow.addColorStop(0, 'rgba(230, 245, 255, 0.22)');
    softGlow.addColorStop(1, 'rgba(230, 245, 255, 0)');
  } else {
    softGlow.addColorStop(0, 'rgba(255, 240, 180, 0.35)');
    softGlow.addColorStop(0.3, 'rgba(255, 210, 120, 0.15)');
    softGlow.addColorStop(1, 'rgba(255, 210, 120, 0)');
  }
  ctx.fillStyle = softGlow;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunSize * 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Draw Sun Core
  ctx.fillStyle = sunColor;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunSize, 0, Math.PI * 2);
  ctx.fill();

  // 3. LAYER: FAR DISTANT BLUE INDIGO ANDEAN RANGES (Parallax Factor: 20px)
  const mountainParallaxX = -parallaxX * 20;
  const mountainParallaxY = -parallaxY * 8;

  let farPeakColor = '#414d7a';
  let middlePeakColor = '#2b656b';
  let nearHillColor = '#3c704c';
  let baseGroundColor = '#295232';

  switch (theme) {
    case 'alpine_dawn':
      farPeakColor = '#222d5a';
      middlePeakColor = '#41355a';
      nearHillColor = '#724b69';
      baseGroundColor = '#3c253b';
      break;
    case 'valley_noon':
      farPeakColor = '#3a8eb5';
      middlePeakColor = '#2a7c64';
      nearHillColor = '#488c42';
      baseGroundColor = '#2c6126';
      break;
    case 'andes_sunset':
      farPeakColor = '#3e153e';
      middlePeakColor = '#6c223c';
      nearHillColor = '#ac413a';
      baseGroundColor = '#421626';
      break;
    case 'cosmic_night':
      farPeakColor = '#0b1220';
      middlePeakColor = '#0f182c';
      nearHillColor = '#13213c';
      baseGroundColor = '#0d1526';
      break;
  }

  // Draw Far Mountain Peaks
  ctx.fillStyle = farPeakColor;
  ctx.beginPath();
  ctx.moveTo(0, h);
  
  // Plotting nice rugged Andean silhouettes
  const numFarPoints = 6;
  const farXInterval = w / (numFarPoints - 1);
  const farPeaksHeights = [0.45, 0.58, 0.38, 0.52, 0.42, 0.48];
  
  for (let i = 0; i < numFarPoints; i++) {
    const x = i * farXInterval + mountainParallaxX * 0.5;
    const peakH = h - (h * farPeaksHeights[i]) + mountainParallaxY * 0.4;
    ctx.lineTo(x, peakH);
  }
  ctx.lineTo(w, h);
  ctx.fill();

  // 4. LAYER: MID MOUNTAINS WITH HIGH-RESOLUTION RELIEF JAGGED PEAKS & SNOW CAPS
  const midParallaxX = -parallaxX * 42;
  const midParallaxY = -parallaxY * 15;

  ctx.fillStyle = middlePeakColor;
  ctx.beginPath();
  ctx.moveTo(0, h);

  const midPointsCount = 7;
  const midXInterval = w / (midPointsCount - 1);
  const midPeakHeights = [
    { ry: 0.35, isPeak: true },
    { ry: 0.46, isPeak: true },
    { ry: 0.28, isPeak: false },
    { ry: 0.42, isPeak: true },
    { ry: 0.31, isPeak: false },
    { ry: 0.48, isPeak: true },
    { ry: 0.33, isPeak: false },
  ];

  const renderedPeaks: { x: number; y: number; isPeak: boolean }[] = [];

  for (let i = 0; i < midPointsCount; i++) {
    const pX = i * midXInterval + midParallaxX * 0.8;
    const pY = h - (h * midPeakHeights[i].ry) + midParallaxY * 0.7;
    renderedPeaks.push({ x: pX, y: pY, isPeak: midPeakHeights[i].isPeak });
    ctx.lineTo(pX, pY);
  }
  ctx.lineTo(w, h);
  ctx.fill();

  // Draw Snow Caps with shading on the majestic peaks!
  if (theme !== 'cosmic_night') {
    renderedPeaks.forEach((p, index) => {
      if (p.isPeak) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'; // Lit side
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - 30, p.y + 40);
        ctx.lineTo(p.x, p.y + 25);
        ctx.lineTo(p.x + 35, p.y + 45);
        ctx.closePath();
        ctx.fill();

        // Shaded side of the snow cap
        ctx.fillStyle = theme === 'andes_sunset' ? 'rgba(255, 180, 200, 0.4)' : 'rgba(160, 210, 255, 0.55)';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x, p.y + 25);
        ctx.lineTo(p.x + 35, p.y + 45);
        ctx.closePath();
        ctx.fill();
      }
    });
  }

  // 5. LAYER: CHRONOLOGY HILLS FOR GROUND INTEGRATION WITH SWAY FOREST PINES
  const hillParallaxX = -parallaxX * 68;
  const hillParallaxY = -parallaxY * 24;

  ctx.fillStyle = nearHillColor;
  ctx.beginPath();
  ctx.moveTo(0, h);
  
  const hillHeights = [0.18, 0.24, 0.15, 0.22, 0.17, 0.20];
  const hillCount = hillHeights.length;
  const hillXInterval = w / (hillCount - 1);

  for (let i = 0; i < hillCount; i++) {
    const x = i * hillXInterval + hillParallaxX;
    const y = h - (h * hillHeights[i]) + hillParallaxY;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h);
  ctx.fill();

  // Draw cute swaying Pine Tree vector profiles on our hills layer
  ctx.fillStyle = baseGroundColor;
  const pineTicks = 12;
  for (let i = 0; i < pineTicks; i++) {
    const pX = (i / (pineTicks - 1)) * w + hillParallaxX * 1.2;
    const baseH = h - 90 + Math.sin(i * 1.5) * 15 + hillParallaxY * 1.1;
    
    // Draw tree silhouette
    drawPineTree(ctx, pX, baseH, 30 + Math.sin(i + Date.now() * 0.001) * 2);
  }

  // 6. LAYER: CHERRY FLOOR FOR REVOLVING WEAPONS DISPLAY (HEIGHT = 90px)
  ctx.fillStyle = baseGroundColor;
  ctx.fillRect(0, h - 90, w, 90);

  // Swaying physical grass stalks detail
  ctx.strokeStyle = theme === 'cosmic_night' ? '#162e24' : '#5ba35a';
  ctx.lineWidth = 2.5;
  const grassSway = Math.sin(Date.now() * 0.005) * 6;
  for (let g = 10; g < w; g += 55) {
    const grassX = g;
    const grassHeight = 12 + Math.sin(g * 0.1) * 4;
    ctx.beginPath();
    ctx.moveTo(grassX, h - 90);
    ctx.quadraticCurveTo(grassX + grassSway * 0.5, h - 90 - grassHeight * 0.5, grassX + grassSway, h - 90 - grassHeight);
    ctx.stroke();
  }
};

const drawCloud = (ctx: CanvasRenderingContext2D, cloud: Cloud, px: number, py: number) => {
  // Puffy dynamic layers with small parallax offset
  ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity})`;
  cloud.layers.forEach(layer => {
    ctx.beginPath();
    const x = cloud.x + layer.dx - px * 10;
    const y = cloud.y + layer.dy - py * 5;
    ctx.arc(x, y, layer.r, 0, Math.PI * 2);
    ctx.fill();
  });
};

const drawPineTree = (ctx: CanvasRenderingContext2D, x: number, y: number, height: number) => {
  const w = height * 0.42;
  ctx.beginPath();
  // Draw layered tree cap
  ctx.moveTo(x, y - height);
  ctx.lineTo(x - w * 0.5, y - height * 0.5);
  ctx.lineTo(x - w * 0.25, y - height * 0.5);
  ctx.lineTo(x - w * 0.75, y - height * 0.15);
  ctx.lineTo(x - w * 0.35, y - height * 0.15);
  ctx.lineTo(x - w, y + 10);
  ctx.lineTo(x + w, y + 10);
  ctx.lineTo(x + w * 0.35, y - height * 0.15);
  ctx.lineTo(x + w * 0.75, y - height * 0.15);
  ctx.lineTo(x + w * 0.25, y - height * 0.5);
  ctx.lineTo(x + w * 0.5, y - height * 0.5);
  ctx.closePath();
  ctx.fill();
};

//////////////////////////////////////////////////////
// SPECIFIC VECTOR RENDERERS
//////////////////////////////////////////////////////

const drawSingleBalloon = (ctx: CanvasRenderingContext2D, b: Balloon) => {
  ctx.save();
  
  // Shadow depth
  ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = b.radius * 0.8;
  ctx.shadowOffsetX = b.radius * 0.2;

  // 1. BALLOON CORE
  ctx.fillStyle = b.color;
  ctx.beginPath();
  
  // Custom stretch profile for realistic teardrop balloon shapes!
  ctx.ellipse(b.x, b.y, b.radius, b.radius * 1.15, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // 2. HIGHLIGHT GLOW (3D SPECTOR VIBES)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.beginPath();
  ctx.ellipse(b.x - b.radius * 0.35, b.y - b.radius * 0.35, b.radius * 0.25, b.radius * 0.4, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // If clock type, draw tiny aesthetic dynamic ticking analog clock overlay!
  if (b.type === 'clock') {
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2.5;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.arc(b.x, b.y - 2, b.radius * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Clock hands ticking in real time
    const angleM = (Date.now() * 0.003) % (Math.PI * 2);
    const angleH = (Date.now() * 0.0003) % (Math.PI * 2);
    ctx.beginPath();
    ctx.moveTo(b.x, b.y - 2);
    ctx.lineTo(b.x + Math.cos(angleM) * (b.radius * 0.3), b.y - 2 + Math.sin(angleM) * (b.radius * 0.3));
    ctx.moveTo(b.x, b.y - 2);
    ctx.lineTo(b.x + Math.cos(angleH) * (b.radius * 0.18), b.y - 2 + Math.sin(angleH) * (b.radius * 0.18));
    ctx.stroke();
  }

  // If golden type, add some glowing sparkles!
  if (b.type === 'golden') {
    const pulseRadius = b.radius + Math.sin(Date.now() * 0.015) * 4;
    ctx.strokeStyle = 'rgba(255, 230, 0, 0.6)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(b.x, b.y, pulseRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  // If frozen type, add beautiful outer ice ring!
  if (b.type === 'frozen') {
    ctx.strokeStyle = 'rgba(160, 240, 255, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(b.x - b.radius, b.y - b.radius, b.radius * 2, b.radius * 2);
  }

  // 3. KNOT TIE BASE
  ctx.fillStyle = b.color;
  ctx.beginPath();
  ctx.moveTo(b.x, b.y + b.radius * 1.15);
  ctx.lineTo(b.x - 7, b.y + b.radius * 1.15 + 8);
  ctx.lineTo(b.x + 7, b.y + b.radius * 1.15 + 8);
  ctx.closePath();
  ctx.fill();

  // 4. FLOATING THREAD LINE
  ctx.strokeStyle = '#666666';
  ctx.lineWidth = 1.35;
  ctx.beginPath();
  ctx.moveTo(b.x, b.y + b.radius * 1.15 + 8);
  
  // Beautiful sine sway thread lines
  const swayOffset = Math.sin(Date.now() * 0.008) * 10;
  ctx.quadraticCurveTo(
    b.x + swayOffset * 0.5,
    b.y + b.radius * 1.15 + 28,
    b.x + swayOffset,
    b.y + b.radius * 1.15 + 45
  );
  ctx.stroke();
};

const drawScenicCondor = (ctx: CanvasRenderingContext2D, c: Condor) => {
  ctx.save();

  // Horizontal translation with dead-tumble support
  ctx.translate(c.x, c.y);

  if (c.dead) {
    ctx.rotate(c.fallSpeed * 0.08); // Spinning on dead tumble fallback
    ctx.scale(-1, 1);
  } else {
    // Face the flight direction (moving left, so scaled -1 to face left easily)
    ctx.scale(-1, 1);
  }

  // Determine feathers color base
  let primaryCol = '#141414';
  let secondaryCol = '#2a2a2a';
  let beakCol = '#e3b25f';
  let crestCol = '#b64e3c';

  if (c.colorType === 'brown') {
    primaryCol = '#3d251d';
    secondaryCol = '#56382c';
  } else if (c.colorType === 'golden') {
    primaryCol = '#4e3a0d';
    secondaryCol = '#a17822';
    beakCol = '#ffaa00';
    crestCol = '#ccaa22';
  }

  // 1. LEFT WING FEATHERS
  ctx.fillStyle = secondaryCol;
  ctx.beginPath();
  
  const wingRise = Math.sin(c.wing) * (c.height * 0.7);
  ctx.ellipse(-c.width * 0.35, wingRise, c.width * 0.42, c.height * 0.24, -0.15, 0, Math.PI * 2);
  ctx.fill();

  // 2. RIGHT WING FEATHERS
  ctx.beginPath();
  ctx.ellipse(c.width * 0.35, -wingRise, c.width * 0.42, c.height * 0.24, 0.15, 0, Math.PI * 2);
  ctx.fill();

  // 3. MAJESTIC CONTOUR TORSO
  ctx.fillStyle = primaryCol;
  ctx.beginPath();
  ctx.ellipse(0, 10, c.width * 0.3, c.height * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  // 4. WHITE NECK COLLAR (Distinctive Andean Condor aspect!)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(c.width * 0.28, -6, 13, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  // 5. REDDISH BALD CONDOR HEAD & MAJESTIC CREST
  ctx.fillStyle = crestCol;
  ctx.beginPath();
  ctx.arc(c.width * 0.40, -14, 11, 0, Math.PI * 2);
  ctx.fill();

  // Crest bulge
  ctx.fillStyle = crestCol;
  ctx.beginPath();
  ctx.arc(c.width * 0.38, -21, 6, 0, Math.PI * 2);
  ctx.fill();

  // 6. POWERFUL HOOKED BEAK
  ctx.fillStyle = beakCol;
  ctx.beginPath();
  const beakX = c.width * 0.48;
  ctx.moveTo(beakX, -16);
  ctx.lineTo(beakX + 16, -11);
  ctx.lineTo(beakX, -4);
  ctx.closePath();
  ctx.fill();

  // 7. BEADY EYE
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(c.width * 0.42, -15, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(c.width * 0.43, -15, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // 8. SOARING TAIL FEATHERS
  ctx.fillStyle = primaryCol;
  ctx.beginPath();
  ctx.moveTo(-c.width * 0.28, 14);
  ctx.lineTo(-c.width * 0.48, 10);
  ctx.lineTo(-c.width * 0.46, 26);
  ctx.closePath();
  ctx.fill();

  // 9. CONDOR GLIDE SHADOW
  ctx.fillStyle = 'rgba(0, 0, 0, 0.09)';
  ctx.beginPath();
  ctx.ellipse(0, c.height * 0.65, c.width * 0.28, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
};
