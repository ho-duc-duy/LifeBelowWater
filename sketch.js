//Inspirational references:
//Interactive Ripple Grid – CodePen by VoXelo – https://codepen.io/VoXelo/pen/LEYaMbJ
//“p5.js Spiral Wave Pattern” – YouTube video URL: https://www.youtube.com/watch?v=zR5onrdWCeY


//get random values each time the sketch runs
let spiralTightness, spiralStrength, sizeFrequency;
let baseHue;

//variables
let cols, rows;
let gridSize = 15;
let colors;
let center;

let dots = [];
let ripples = [];
let defaultColor;

//audio
let ambienceAudio, hoverSfxAudio;
// --- MODIFIED: Added a variable for the click sound ---
let clickSfxAudio; 
let ambienceStarted = false;
let hoverActive = false;
let hoverTimeout;

// state variables
let isModalOpen = false;
let isSfxEnabled = false;

function setup() {
  createCanvas(1920, 1080);
  colorMode(HSB, 360, 100, 100);

  //random spiral props
  spiralTightness = random(0.005, 0.025);
  spiralStrength = random(0.05, 0.2);
  sizeFrequency = random(0.02, 0.08);

  baseHue = random(180, 240);
  colors = generatePalette();

  defaultColor = color(0, 0, 40);

  noStroke();
  cols = floor(width / gridSize);
  rows = floor(height / gridSize);
  center = createVector(width / 2, height / 2);

  // Generate dots using maths
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let baseX = x * gridSize + gridSize / 2;
      let baseY = y * gridSize + gridSize / 2;
      let pos = createVector(baseX, baseY);
      let dir = p5.Vector.sub(pos, center);
      let d = dir.mag();

      let angle = atan2(dir.y, dir.x) + d * spiralTightness;
      let r = d * spiralStrength;
      let offsetX = cos(angle) * r;
      let offsetY = sin(angle) * r;

      let originalPos = createVector(baseX + offsetX, baseY + offsetY);
      let dotSize = map(sin(d * sizeFrequency), -1, 1, 3, gridSize);

      dots.push({
        originalPos: originalPos,
        currentPos: originalPos.copy(),
        size: dotSize,
        originalColor: random(colors),
        currentColor: defaultColor,
      });
    }
  }

  //audio
  ambienceAudio = new Audio('assets/COMM2754-2025-S1-A1w02-Earth-HoDucDuy-ambience.wav');
  ambienceAudio.loop = true;
  ambienceAudio.volume = 0.3;

  hoverSfxAudio = new Audio('assets/COMM2754-2025-S1-A1w02-Earth-HoDucDuy-hover.wav');
  hoverSfxAudio.loop = true;
  hoverSfxAudio.volume = 0.6;
  
  // --- MODIFIED: Initialize the click sound ---
  clickSfxAudio = new Audio('assets/COMM2754-2025-S1-A1w02-Earth-HoDucDuy-click.wav');


  // Setup UI controls after DOM is ready
  setupModal();
  setupSfxButton();
}

function draw() {
  background(baseHue, 80, 15);
  //update ripples
  for (let i = ripples.length - 1; i >= 0; i--) {
    ripples[i].update();
    if (ripples[i].isDead()) {
      ripples.splice(i, 1);
    }
  }
  //update dots
  for (let dot of dots) {
    let activated = false;
    let totalDisplacement = createVector(0, 0);

    for (let ripple of ripples) {
      let d = dist(dot.originalPos.x, dot.originalPos.y, ripple.pos.x, ripple.pos.y);
      //push away
      if (d < ripple.radius) {
        let force = (1 - d / ripple.radius) * ripple.strength * 15;
        let direction = p5.Vector.sub(dot.originalPos, ripple.pos);
        direction.normalize();
        direction.mult(force);
        totalDisplacement.add(direction);
      }
      //color wave
      let waveWidth = 50;
      if (d > ripple.radius - waveWidth && d < ripple.radius) {
        dot.currentColor = dot.originalColor;
        activated = true;
      }
    }

    let targetPos = p5.Vector.add(dot.originalPos, totalDisplacement);
    dot.currentPos.lerp(targetPos, 0.1);

    if (!activated) {
      dot.currentColor = lerpColor(dot.currentColor, defaultColor, 0.05);
    }

    fill(dot.currentColor);
    ellipse(dot.currentPos.x, dot.currentPos.y, dot.size, dot.size);
  }
}

//make random color palette
function generatePalette() {
  let palette = [];
  for (let i = 0; i < 5; i++) {
    let newHue = (baseHue + random(-15, 15) + 360) % 360;
    let newSat = random(50, 90);
    let newBri = random(60, 100);
    palette.push(color(newHue, newSat, newBri));
  }
  return palette;
}

//mouse interaction
function mouseMoved() {
    if (isModalOpen) return;

    if (frameCount % 3 === 0) {
      ripples.push(new Ripple(createVector(mouseX, mouseY)));
    }

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
      }, 2000);
    }
}

//class ripple
class Ripple {
  constructor(pos) {
    this.pos = pos;
    this.radius = 0;
    this.maxRadius = 250;
    this.life = 1.0;
    this.strength = 1.0;
  }

  update() {
    this.radius += 4;
    this.life -= 0.015;
    this.strength = this.life;
  }

  isDead() {
    return this.life <= 0 || this.radius > this.maxRadius;
  }
}

// --- MODIFIED: Added a helper function to play the click sound ---
// This prevents having to rewrite the same two lines of code everywhere.
function playClickSound() {
    clickSfxAudio.currentTime = 0; // Rewind to the start
    clickSfxAudio.play().catch(e => console.warn("Click SFX failed to play:", e));
}

function setupSfxButton() {
  const sfxButton = document.getElementById('sfx-button');

  sfxButton.addEventListener('click', () => {
    // --- MODIFIED: Play click sound on interaction ---
    playClickSound();

    isSfxEnabled = !isSfxEnabled;

    if (isSfxEnabled) {
      sfxButton.textContent = 'SFX: ON';
      sfxButton.classList.add('sfx-on');
      
      ambienceAudio.play().catch(e => console.error("Ambience play failed:", e));
      ambienceStarted = true;

    } else {
      sfxButton.textContent = 'SFX: OFF';
      sfxButton.classList.remove('sfx-on');
      
      ambienceAudio.pause();
      hoverSfxAudio.pause();
      
      hoverActive = false;
      clearTimeout(hoverTimeout);
    }
  });
}

function setupModal() {
  const infoButton = document.getElementById('info-button');
  const modalOverlay = document.getElementById('info-modal-overlay');
  const closeButton = document.querySelector('.close-button');

  // --- MODIFIED: Updated listeners to play click sound ---
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
  }
}
