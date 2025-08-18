// Released under GPL3. More information: https://www.gnu.org/licenses/gpl-3.0.en.html
// References for inspiration:
// Interactive Ripple Grid – CodePen by VoXelo – https://codepen.io/VoXelo/pen/LEYaMbJ
// “p5.js Spiral Wave Pattern” – YouTube: https://www.youtube.com/watch?v=zR5onrdWCeY

// GLOBAL VARIABLES

// Visual properties
let baseHue;                   // Base hue value for the background color, randomized on start.
let ellipses = [];             // An array to hold the data for each concentric, dashed ellipse.
let center;                    // A p5.Vector to store the center point of the canvas for calculations.

// Animation properties
let rotationSpeed;             // The overall rotation speed of the entire pattern, randomized on start.
let inwardSpeed;               // The speed at which rings move towards the center, randomized on start.
let maxRadius = 0;             // Stores the largest radius created, used for resetting rings that move to the center.
let twistAudio;                // The audio object for the continuous rotation/twist sound.

// Audio elements
let ambienceAudio, hoverSfxAudio;
let clickSfxAudio, clickCanvasAudio;

// State management
let ambienceStarted = false;   // Tracks if the main ambience has started playing.
let hoverActive = false;       // Tracks if the hover sound is currently playing.
let hoverTimeout;              // A timer to stop the hover sound when the mouse stops moving.
let isModalOpen = false;       // A boolean flag to check if the information modal is visible.
let isSfxEnabled = false;      // A master boolean flag to control all sound effects.

// Interactive ripple state
let rippleOffsets = [];        // A 2D array storing the hover-induced offset for each dash.
let clickRipples = [];         // An array storing active ripple animations triggered by mouse clicks on the canvas.


function setup() {
  // --- Canvas and rendering setup ---
  createCanvas(1920, 1080);
  colorMode(HSB, 360, 100, 100); // Use Hue-Saturation-Brightness color model.
  noFill(); // We are only drawing strokes, so no fill is needed globally.
  baseHue = random(200, 220); // Set a random blueish hue for the background.
  center = createVector(width / 2, height / 2);

  // --- Animation speed initialization ---
  rotationSpeed = random(-0.001, 0.001); // A very slow, random rotation speed.
  inwardSpeed = random(0.1, 0.3); // A slow, random speed for the inward flow.

  // --- Generate the concentric dashed ellipses ---
  for (let r = 50; r < min(width, height); r += 30) {
    ellipses.push({
      radius: r,
      dashCount: int(random(20, 100)),
      strokeWeight: random(1, 4),
      color: color(0, 0, 60), // Default color is a dark grey.
    });
    // Keep track of the largest starting radius to reset rings later.
    if (r > maxRadius) {
      maxRadius = r;
    }
  }

  // Initialize the ripple offset array to match the number of dashes in each ellipse.
  for (let e of ellipses) {
    rippleOffsets.push(new Array(e.dashCount).fill(0));
  }

  // --- Load and configure all audio assets ---
  ambienceAudio = new Audio('assets/COMM2754-2025-S2-A2w08-LifeBelowWater-ambience.wav');
  ambienceAudio.loop = true;
  ambienceAudio.volume = 0.3;

  hoverSfxAudio = new Audio('assets/COMM2754-2025-S2-A2w08-LifeBelowWater-hover.wav');
  hoverSfxAudio.loop = true;
  hoverSfxAudio.volume = 0.6;

  clickSfxAudio = new Audio('assets/COMM2754-2025-S2-A2w08-LifeBelowWater-click.wav');

  clickCanvasAudio = new Audio('assets/COMM2754-2025-S2-A2w08-LifeBelowWater-clickcanvas.wav');
  clickCanvasAudio.volume = 0.7;
  
  twistAudio = new Audio('assets/COMM2754-2025-S2-A2w08-LifeBelowWater-twist.wav');
  twistAudio.loop = true;
  twistAudio.volume = 0.5;

  // --- Setup UI event listeners ---
  setupModal();
  setupSfxButton();
}

function draw() {
  // Clear the canvas each frame with the background color.
  background(baseHue, 80, 15);
  // Move the origin (0,0) to the center of the canvas for easier calculations.
  translate(center.x, center.y);

  // --- Update and filter click ripples ---
  for (let ripple of clickRipples) {
    ripple.radius += 20; // The ripple expands.
    ripple.strength *= 0.9; // The ripple's strength (and effect) fades.
  }
  // Remove ripples that have faded out to improve performance.
  clickRipples = clickRipples.filter(r => r.strength > 0.01);

  // --- Update the main pattern's continuous animation ---
  for (let e of ellipses) {
    e.radius -= inwardSpeed; // Move the entire ring towards the center.
    // If a ring becomes too small, reset it to the outside to create an infinite flow.
    if (e.radius < 50) {
      e.radius = maxRadius + random(0, 30); // Add a small random value to prevent z-fighting.
    }
  }

  // --- Draw each dash of each ellipse ---
  for (let eIndex = 0; eIndex < ellipses.length; eIndex++) {
    let e = ellipses[eIndex];
    strokeWeight(e.strokeWeight);
    let angleStep = TWO_PI / e.dashCount; // Calculate the angle between each dash.

    for (let i = 0; i < e.dashCount; i++) {
      // Calculate the current angle, including the global rotation based on time (frameCount).
      let angle = (angleStep * i) + (frameCount * rotationSpeed);
      let dashRadius = e.radius;

      // Calculate mouse position relative to the centered canvas.
      let mx = mouseX - center.x;
      let my = mouseY - center.y;

      // Calculate the base position of the current dash.
      let baseX = cos(angle) * dashRadius;
      let baseY = sin(angle) * dashRadius;
      let d = dist(baseX, baseY, mx, my); // Distance from the mouse to this dash.

      // Calculate the hover ripple effect (pushing dashes away).
      if (d < 100) {
        // If mouse is close, push the dash outwards.
        rippleOffsets[eIndex][i] = lerp(rippleOffsets[eIndex][i], -15, 0.2);
      } else {
        // Otherwise, smoothly return the dash to its original position.
        rippleOffsets[eIndex][i] = lerp(rippleOffsets[eIndex][i], 0, 0.1);
      }
      let offset = rippleOffsets[eIndex][i];

      // Add the effect from any active click ripples.
      for (let ripple of clickRipples) {
        let dClick = dist(baseX, baseY, ripple.x, ripple.y);
        if (dClick < ripple.radius) {
          offset += map(dClick, 0, ripple.radius, -ripple.strength, 0);
        }
      }

      // Calculate the final radius including all interactive offsets.
      let finalRadius = dashRadius + offset;
      
      // Calculate the start and end points of the dash segment.
      let x = cos(angle) * finalRadius;
      let y = sin(angle) * finalRadius;
      let x2 = cos(angle + angleStep * 0.6) * finalRadius; // The 0.6 makes it a dash, not a dot.
      let y2 = sin(angle + angleStep * 0.6) * finalRadius;

      // Set the stroke color based on mouse proximity.
      if (d < 200) {
        stroke(random(200, 240), 80, 100); // Bright blue/cyan if close to the mouse.
      } else {
        stroke(e.color); // Default grey color.
      }
      // Finally, draw the dash.
      line(x, y, x2, y2);
    }
  }
}

//Handles the hover sound effect when the mouse moves over the canvas.
 
function mouseMoved() {
  if (isModalOpen) return; // Ignore interaction if the modal is open.

  if (isSfxEnabled) {
    // If the hover sound isn't already playing, start it.
    if (!hoverActive) {
      hoverActive = true;
      hoverSfxAudio.currentTime = 0;
      hoverSfxAudio.play().catch(e => console.warn('Hover sound failed:', e));
    }

    // Reset the timeout. If the mouse stops moving, the sound will stop after 200ms.
    clearTimeout(hoverTimeout);
    hoverTimeout = setTimeout(() => {
      hoverActive = false;
      hoverSfxAudio.pause();
      hoverSfxAudio.currentTime = 0;
    }, 200);
  }
}

//Creates a visual and audible ripple effect when the mouse is pressed on the canvas.
 
function mousePressed() {
  if (!isModalOpen) {
    // Get mouse coordinates relative to the center.
    let cx = mouseX - center.x;
    let cy = mouseY - center.y;
    // Add a new ripple object to the active ripples array.
    clickRipples.push({ x: cx, y: cy, radius: 0, strength: 80 });

    // Play the canvas click sound if SFX are enabled.
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
    isSfxEnabled = !isSfxEnabled; // Toggle the master sound flag.

    if (isSfxEnabled) {
      // Turn sounds ON.
      sfxButton.textContent = 'SFX: ON';
      sfxButton.classList.add('sfx-on');
      // Play all continuous background sounds.
      ambienceAudio.play().catch(e => console.error("Ambience play failed:", e));
      twistAudio.play().catch(e => console.error("Twist audio play failed:", e));
      ambienceStarted = true;
    } else {
      // Turn sounds OFF.
      sfxButton.textContent = 'SFX: OFF';
      sfxButton.classList.remove('sfx-on');
      // Pause all sounds.
      ambienceAudio.pause();
      hoverSfxAudio.pause();
      twistAudio.pause();
      // Reset hover sound state.
      hoverActive = false;
      clearTimeout(hoverTimeout);
    }
  });
}

function setupModal() {
  const infoButton = document.getElementById('info-button');
  const modalOverlay = document.getElementById('info-modal-overlay');
  const closeButton = document.querySelector('.close-button');

  // Open modal via the "More Info" button.
  infoButton.addEventListener('click', () => {
    playClickSound();
    openModal();
  });

  // Close modal via the 'X' button.
  closeButton.addEventListener('click', () => {
    playClickSound();
    closeModal();
  });

  // Close modal by clicking on the dark overlay background.
  modalOverlay.addEventListener('click', (event) => {
    if (event.target === modalOverlay) closeModal();
  });

  // Close modal by pressing the 'Escape' key.
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isModalOpen) closeModal();
  });
}

function openModal() {
  const modalOverlay = document.getElementById('info-modal-overlay');
  modalOverlay.classList.add('visible');
  isModalOpen = true;
  noLoop(); // Pauses the p5.js draw loop, freezing the animation.

  // Pause all playing audio.
  if (ambienceStarted) ambienceAudio.pause();
  hoverSfxAudio.pause();
  twistAudio.pause();
  clearTimeout(hoverTimeout);
  hoverActive = false;
}

function closeModal() {
  const modalOverlay = document.getElementById('info-modal-overlay');
  modalOverlay.classList.remove('visible');
  isModalOpen = false;
  loop(); // Resumes the p5.js draw loop.

  // Resume continuous audio only if SFX are still enabled.
  if (ambienceStarted && isSfxEnabled) {
    ambienceAudio.play().catch(e => console.warn(e));
    twistAudio.play().catch(e => console.warn(e));
  }
}
