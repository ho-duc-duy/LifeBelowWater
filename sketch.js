// Released under GPL3. More information: https://www.gnu.org/licenses/gpl-3.0.en.html
// References for inspiration:
// Interactive Ripple Grid – CodePen by VoXelo – https://codepen.io/VoXelo/pen/LEYaMbJ
// “p5.js Spiral Wave Pattern” – YouTube: https://www.youtube.com/watch?v=zR5onrdWCeY

// Global variables
let baseHue;
let ellipses = [];
let center;

let rotationSpeed;
let inwardSpeed;
let maxRadius = 0;
let twistAudio;

// Audio elements
let ambienceAudio, hoverSfxAudio;
let clickSfxAudio;
let clickCanvasAudio;
let ambienceStarted = false;
let hoverActive = false;
let hoverTimeout;
let isSfxEnabled = false;

// Ripple animation state
let rippleOffsets = [];
let clickRipples = [];

function setup() {
  let canvas = createCanvas(1920, 1080);
  canvas.parent('canvas-container');

  colorMode(HSB, 360, 100, 100);
  noFill();
  baseHue = random(200, 220);
  center = createVector(width / 2, height / 2);

  rotationSpeed = random(-0.001, 0.001);
  inwardSpeed = random(0.1, 0.3);

  // Random number and strokeweight of dashes
  for (let r = 50; r < min(width, height); r += 30) {
    ellipses.push({
      radius: r,
      dashCount: int(random(5, 100)),
      strokeWeight: random(1, 4),
      color: color(0, 0, 60),
    });
    if (r > maxRadius) {
      maxRadius = r;
    }
  }

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
  
  // Randomize the looping background sound
  // 1. Create an array of the possible sound paths.
  const loopingSoundPaths = [
    'assets/COMM2754-2025-S2-A2w08-LifeBelowWater-twist.wav',
    'assets/COMM2754-2025-S2-A2w08-LifeBelowWater-marineloop.wav'
  ];

  // 2. Randomly select one path from the array. The p5.js random() function can pick an item from an array directly.
  let chosenSoundPath = random(loopingSoundPaths);

  // 3. Initialize the twistAudio object using the randomly chosen sound path.
  twistAudio = new Audio(chosenSoundPath);
  twistAudio.loop = true;
  twistAudio.volume = 0.5;

  // Setup UI, bubbles, and scroll listener
  setupSfxButton();
  setupBubbles();
  window.addEventListener('scroll', handleScroll);
}

function draw() {
  background(baseHue, 80, 15);
  translate(center.x, center.y);

  for (let ripple of clickRipples) {
    ripple.radius += 20;
    ripple.strength *= 0.9;
  }
  clickRipples = clickRipples.filter(r => r.strength > 0.01);

  for (let e of ellipses) {
    e.radius -= inwardSpeed;
    if (e.radius < 50) {
      e.radius = maxRadius + random(0, 30);
    }
  }

  for (let eIndex = 0; eIndex < ellipses.length; eIndex++) {
    let e = ellipses[eIndex];
    strokeWeight(e.strokeWeight);
    let angleStep = TWO_PI / e.dashCount;

    for (let i = 0; i < e.dashCount; i++) {
      let angle = (angleStep * i) + (frameCount * rotationSpeed);
      let dashRadius = e.radius;
      let mx = mouseX - center.x;
      let my = mouseY - center.y;
      let baseX = cos(angle) * dashRadius;
      let baseY = sin(angle) * dashRadius;
      let d = dist(baseX, baseY, mx, my);
      //Radius of area of moving dashes around cursor
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
      
      //Calculate the starting point and the ending point of the dashes.
      let x = cos(angle) * finalRadius;
      let y = sin(angle) * finalRadius;
      let x2 = cos(angle + angleStep * 0.8) * finalRadius;
      let y2 = sin(angle + angleStep * 0.3) * finalRadius;
      //Radius of area of changing color aound cursor
      if (d < 200) {
        stroke(random(200, 240), 80, 100);
      } else {
        stroke(e.color);
      }
      line(x, y, x2, y2);
    }
  }
}

// Bubbles
function setupBubbles() {
  const bubbleContainer = document.querySelector('.bubble-background');
  const bubbleCount = 20;

  for (let i = 0; i < bubbleCount; i++) {
    const bubble = document.createElement('div');
    bubble.classList.add('bubble');
    
    const size = Math.random() * 80 + 20;
    const duration = Math.random() * 10 + 10;
    const delay = Math.random() * 15;

    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.left = `${Math.random() * 100}%`;
    bubble.style.bottom = `${-size}px`;
    bubble.style.animationDuration = `${duration}s`;
    bubble.style.animationDelay = `${delay}s`;
    
    bubble.style.backgroundColor = 'rgba(0, 150, 255, 0.2)';

    bubbleContainer.appendChild(bubble);
  }
}
// Parallax scroll
function handleScroll() {
  const bubbleContainer = document.querySelector('.bubble-background');
  const bubbles = document.querySelectorAll('.bubble');
  const canvasContainer = document.getElementById('canvas-container');
  const canvasRect = canvasContainer.getBoundingClientRect();

  bubbleContainer.style.transform = `translateY(${window.scrollY * 0.4}px)`;

  if (canvasRect.top < window.innerHeight / 2) {
    bubbles.forEach(bubble => {
      bubble.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    });
  } else {
    bubbles.forEach(bubble => {
      bubble.style.backgroundColor = 'rgba(0, 150, 255, 0.2)';
    });
  }
}

function mouseMoved() {
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
  const canvasRect = document.getElementById('defaultCanvas0').getBoundingClientRect();
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
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
      twistAudio.play().catch(e => console.error("Twist audio play failed:", e));
      ambienceStarted = true;
    } else {
      sfxButton.textContent = 'SFX: OFF';
      sfxButton.classList.remove('sfx-on');
      ambienceAudio.pause();
      hoverSfxAudio.pause();
      twistAudio.pause();
      hoverActive = false;
      clearTimeout(hoverTimeout);
    }
  });
}
