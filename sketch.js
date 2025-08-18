// Released under GPL3. More information: https://www.gnu.org/licenses/gpl-3.0.en.html
// References for inspiration:
// Interactive Ripple Grid – CodePen by VoXelo – https://codepen.io/VoXelo/pen/LEYaMbJ
// “p5.js Spiral Wave Pattern” – YouTube: https://www.youtube.com/watch?v=zR5onrdWCeY

// Global variables
let baseHue;                   // Base hue value for background
let ellipses = [];             // Array of concentric ellipse data
let center;                    // Center point of canvas

// --- MODIFIED: Added variables for continuous animation ---
let rotationSpeed;             // Overall rotation speed of the pattern
let inwardSpeed;               // Speed at which rings move towards the center
let maxRadius = 0;             // The largest radius, used for resetting rings
let twistAudio;                // The new sound for the animation

// Audio elements
let ambienceAudio, hoverSfxAudio;
let clickSfxAudio;
let clickCanvasAudio;
let ambienceStarted = false;
let hoverActive = false;
let hoverTimeout;
let isModalOpen = false;
let isSfxEnabled = false;

// Ripple animation state
let rippleOffsets = [];        // Stores offset for hover ripples per dash
let clickRipples = [];         // Stores ripple data for click animation

function setup() {
  // Create canvas and configure color mode
  createCanvas(1920, 1080);
  colorMode(HSB, 360, 100, 100);
  noFill();
  baseHue = random(200, 220); // Background hue (blueish)
  center = createVector(width / 2, height / 2);

  // --- MODIFIED: Initialize random speeds for the animation ---
  rotationSpeed = random(-0.001, 0.001);
  inwardSpeed = random(0.1, 0.3);

  // Generate concentric dashed ellipses
  for (let r = 50; r < min(width, height); r += 30) {
    ellipses.push({
      radius: r,
      dashCount: int(random(20, 100)),   // Random number of dashes
      strokeWeight: random(1, 4),        // Random stroke weight
      color: color(0, 0, 60),            // Grey stroke color
    });
    // --- MODIFIED: Keep track of the largest starting radius ---
    if (r > maxRadius) {
      maxRadius = r;
    }
  }

  // Initialize ripple offsets for each dash
  for (let e of ellipses) {
    rippleOffsets.push(new Array(e.dashCount).fill(0));
  }

  // Load and configure audio assets
  ambienceAudio = new Audio('assets/COMM2754-2025-S2-A2w08-LifeBelowWater-ambience.wav');
  ambienceAudio.loop = true;
  ambienceAudio.volume = 0.3;

  hoverSfxAudio = new Audio('assets/COMM2754-2025-S2-A2w08-LifeBelowWater-hover.wav');
  hoverSfxAudio.loop = true;
  hoverSfxAudio.volume = 0.6;

  clickSfxAudio = new Audio('assets/COMM2754-2025-S2-A2w08-LifeBelowWater-click.wav');

  clickCanvasAudio = new Audio('assets/COMM2754-2025-S2-A2w08-LifeBelowWater-clickcanvas.wav');
  clickCanvasAudio.volume = 0.7;

  // --- MODIFIED: Load and configure the new twist sound ---
  twistAudio = new Audio('assets/COMM2754-2025-S2-A2w08-LifeBelowWater-twist.wav');
  twistAudio.loop = true;
  twistAudio.volume = 0.5;

  // Setup modal and SFX button interaction
  setupModal();
  setupSfxButton();
}

function draw() {
  background(baseHue, 80, 15);
  translate(center.x, center.y);

  // Update click ripples
  for (let ripple of clickRipples) {
    ripple.radius += 20;
    ripple.strength *= 0.9;
  }
  clickRipples = clickRipples.filter(r => r.strength > 0.01);

  // --- MODIFIED: Update ellipse radii for inward flow and rotation ---
  // This loop handles the continuous "inward twist" animation.
  for (let e of ellipses) {
    // Move the ring inward
    e.radius -= inwardSpeed;

    // If a ring gets too close to the center, reset it to the outside
    if (e.radius < 50) {
      e.radius = maxRadius + random(0, 30); // Add randomness to avoid overlap
    }
  }


  for (let eIndex = 0; eIndex < ellipses.length; eIndex++) {
    let e = ellipses[eIndex];
    strokeWeight(e.strokeWeight);
    let angleStep = TWO_PI / e.dashCount;

    for (let i = 0; i < e.dashCount; i++) {
      // --- MODIFIED: Add time-based rotation to the angle calculation ---
      // The whole pattern rotates based on frameCount and the random rotationSpeed.
      let angle = (angleStep * i) + (frameCount * rotationSpeed);
      let dashRadius = e.radius;

      let mx = mouseX - center.x;
      let my = mouseY - center.y;
      let baseX = cos(angle) * dashRadius;
      let baseY = sin(angle) * dashRadius;
      let d = dist(baseX, baseY, mx, my);

      if (d < 100) {
        rippleOffsets[eIndex][i] = lerp(rippleOffsets[eIndex][i], -15, 0.2);
      } else {
        rippleOffsets[eIndex][i] = lerp(rippleOffsets[eIndex][i], 0, 0.1);
      }
      let offset = rippleOffsets[eIndex][i];

      for (let ripple of clickRipples) {
        let dClick = dist(baseX, baseY, ripple.x, ripple.y);
        if (dClick < ripple.radius) {
          offset += map(dClick, 0, ripple.radius, -ripple.strength, 0);
        }
      }
      let finalRadius = dashRadius + offset;
      
      let x = cos(angle) * finalRadius;
      let y = sin(angle) * finalRadius;
      let x2 = cos(angle + angleStep * 0.6) * finalRadius;
      let y2 = sin(angle + angleStep * 0.6) * finalRadius;

      if (d < 200) {
        stroke(random(200, 240), 80, 100);
      } else {
        stroke(e.color);
      }
      line(x, y, x2, y2);
    }
  }
}

function mouseMoved() {
  if (isModalOpen) return;

  if (isSfxEnabled) {
    if (!hoverActive) {
      hoverActive = true;
      hoverSfxAudio.currentTime = 0;
      hoverSfxAudio.play().catch(e => console.warn('Hover sound failed:', e));
    }

    clearTimeout(hoverTimeout);
    hoverTimeout = setTimeout(() => {
      hoverActive = false;
      hoverSfxAudio.pause();
      hoverSfxAudio.currentTime = 0;
    }, 200);
  }
}

function mousePressed() {
  if (!isModalOpen) {
    let cx = mouseX - center.x;
    let cy = mouseY - center.y;
    clickRipples.push({ x: cx, y: cy, radius: 0, strength: 80 });

    if (isSfxEnabled) {
      clickCanvasAudio.currentTime = 0;
      clickCanvasAudio.play().catch(e => console.warn('Canvas click sound failed:', e));
    }
  }
}

function playClickSound() {
  clickSfxAudio.currentTime = 0;
  clickSfxAudio.play().catch(e => console.warn("Click SFX failed to play:", e));
}

function setupSfxButton() {
  const sfxButton = document.getElementById('sfx-button');

  sfxButton.addEventListener('click', () => {
    playClickSound();
    isSfxEnabled = !isSfxEnabled;

    if (isSfxEnabled) {
      sfxButton.textContent = 'SFX: ON';
      sfxButton.classList.add('sfx-on');

      ambienceAudio.play().catch(e => console.error("Ambience play failed:", e));
      // --- MODIFIED: Play the twist sound when SFX are enabled ---
      twistAudio.play().catch(e => console.error("Twist audio play failed:", e));
      ambienceStarted = true;
    } else {
      sfxButton.textContent = 'SFX: OFF';
      sfxButton.classList.remove('sfx-on');

      ambienceAudio.pause();
      hoverSfxAudio.pause();
      // --- MODIFIED: Pause the twist sound when SFX are disabled ---
      twistAudio.pause();
      hoverActive = false;
      clearTimeout(hoverTimeout);
    }
  });
}

function setupModal() {
  const infoButton = document.getElementById('info-button');
  const modalOverlay = document.getElementById('info-modal-overlay');
  const closeButton = document.querySelector('.close-button');

  infoButton.addEventListener('click', () => {
    playClickSound();
    openModal();
  });

  closeButton.addEventListener('click', () => {
    playClickSound();
    closeModal();
  });

  modalOverlay.addEventListener('click', (event) => {
    if (event.target === modalOverlay) closeModal();
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isModalOpen) closeModal();
  });
}

function openModal() {
  const modalOverlay = document.getElementById('info-modal-overlay');
  modalOverlay.classList.add('visible');
  isModalOpen = true;
  noLoop();

  if (ambienceStarted) ambienceAudio.pause();
  hoverSfxAudio.pause();
  // --- MODIFIED: Pause the twist sound when the modal is open ---
  twistAudio.pause();
  clearTimeout(hoverTimeout);
  hoverActive = false;
}

function closeModal() {
  const modalOverlay = document.getElementById('info-modal-overlay');
  modalOverlay.classList.remove('visible');
  isModalOpen = false;
  loop();

  if (ambienceStarted && isSfxEnabled) {
    ambienceAudio.play().catch(e => console.warn(e));
    // --- MODIFIED: Resume the twist sound when the modal closes (if SFX are on) ---
    twistAudio.play().catch(e => console.warn(e));
  }
}
