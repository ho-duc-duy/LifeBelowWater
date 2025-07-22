//Inspirational references:
//Interactive Ripple Grid – CodePen by VoXelo – https://codepen.io/VoXelo/pen/LEYaMbJ
//“p5.js Spiral Wave Pattern” – YouTube video URL: https://www.youtube.com/watch?v=zR5onrdWCeY


let baseHue;
let ellipses = [];
let center;

// audio
let ambienceAudio, hoverSfxAudio;
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
  noFill();
  baseHue = random(200, 220); // blue-ish range
  center = createVector(width / 2, height / 2);

  // generate dashed ellipses
  for (let r = 50; r < min(width, height); r += 30) {
    ellipses.push({
      radius: r,
      dashCount: int(random(20, 100)), // random number of dashes per ring
      strokeWeight: random(1, 4),      // random stroke weight per ring
      color: color(0, 0, 60),
    });
  }

  //audio
  ambienceAudio = new Audio('assets/COMM2754-2025-S1-A1w02-Earth-HoDucDuy-ambience.wav');
  ambienceAudio.loop = true;
  ambienceAudio.volume = 0.3;

  hoverSfxAudio = new Audio('assets/COMM2754-2025-S1-A1w02-Earth-HoDucDuy-hover.wav');
  hoverSfxAudio.loop = true;
  hoverSfxAudio.volume = 0.6;

  clickSfxAudio = new Audio('assets/COMM2754-2025-S1-A1w02-Earth-HoDucDuy-click.wav');

  // Setup UI controls after DOM is ready
  setupModal();
  setupSfxButton();
}

function draw() {
  background(baseHue, 80, 15);
  translate(center.x, center.y);

  for (let e of ellipses) {
    strokeWeight(e.strokeWeight);
    let angleStep = TWO_PI / e.dashCount; //dash gap
    for (let i = 0; i < TWO_PI; i += angleStep * 2) { //dash effect
      let angle = i;
      let dashRadius = e.radius;
      let x = cos(angle) * dashRadius;
      let y = sin(angle) * dashRadius;

      let mx = mouseX - center.x; 
      let my = mouseY - center.y;
      let d = dist(x, y, mx, my); //calculate the distance from d to cursor

      if (d < 100) {
        stroke(random(200, 240), 80, 100);
      } else {
        stroke(e.color);
      }

      let x2 = cos(angle + angleStep) * dashRadius; //calculate the end point of dash
      let y2 = sin(angle + angleStep) * dashRadius;

      line(x, y, x2, y2); //draw a line between position (x, y) and (x2, y2)
    }
  }
}

//mouse interaction
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

//sound section
function playClickSound() {
  clickSfxAudio.currentTime = 0; // Rewind to the start
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
