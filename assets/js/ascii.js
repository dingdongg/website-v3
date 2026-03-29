const container = document.getElementById("ascii-container");
const pauseButton = document.getElementById("ascii-toggle");
container.style.fontFamily = "monospace";
container.style.whiteSpace = "pre";
container.style.textAlign = "center";
container.style.fontSize = "3px";

const DESIRED_FPS = 30;
const FRAME_DURATION_MS = 1000 / DESIRED_FPS;
const LOCAL_STORAGE_KEY = "asciiFrames";
const collection = [{
  name: "sableye",
  frameCount: 44,
  lines: 69,
}, {
  name: "weavile",
  frameCount: 30,
  lines: 67,
}, {
  name: "scraggy",
  frameCount: 40,
  lines: 66,
}, {
  name: "gengar",
  frameCount: 40,
  lines: 50,
}, {
  name: "chandelure",
  frameCount: 70,
  lines: 48,
}, {
  name: "krookodile",
  frameCount: 80,
  lines: 56,
}];

const framePromises = [];
const randomizer = Math.floor(Math.random() * collection.length);
const pokemon = collection[randomizer];

function cacheGet(key) {
  if (!localStorage) return null;
  return localStorage.getItem(key);
}

function cacheSet(key, value) {
  if (!localStorage) return;
  localStorage.setItem(key, value);
}

async function loadFrames() {
  // retrieve from localstorage if available
  const cached = cacheGet(LOCAL_STORAGE_KEY);
  if (cached) return JSON.parse(cached);

  for (let i = 0; i < pokemon.frameCount; i += 1) {
    const path = `/assets/ascii_frames/${pokemon.name}/frame_${i.toString().padStart(4, "0")}.txt`;
    framePromises.push(
      fetch(path).then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load ${path}: HTTP ${response.status}`);
        }

        return response.text();
      }),
    );
  }

  const frames = await Promise.all(framePromises);
  cacheSet(LOCAL_STORAGE_KEY, JSON.stringify(frames));
  return frames;
}

function renderFrames(frames) {
  let frameIndex = 0;
  let lastTick = performance.now();
  let isPaused = false;

  container.textContent = frames[frameIndex];
  pauseButton.value = "pause";

  pauseButton.addEventListener("click", () => {
    isPaused = !isPaused;

    if (isPaused) {
      container.textContent = frames[frameIndex];
      pauseButton.value = "resume";
      return;
    }

    lastTick = performance.now();
    pauseButton.value = "pause";
  });

  function tick(now) {
    if (isPaused) {
      requestAnimationFrame(tick);
      return;
    }

    if (now - lastTick >= FRAME_DURATION_MS) {
      const framesToAdvance = Math.floor((now - lastTick) / FRAME_DURATION_MS);
      frameIndex = (frameIndex + framesToAdvance) % frames.length;
      container.textContent = frames[frameIndex];
      lastTick += framesToAdvance * FRAME_DURATION_MS;
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

async function main() {
  const frames = await loadFrames();

  if (frames.length === 0) {
    throw new Error("No ASCII frames were loaded.");
  }

  renderFrames(frames);
}

main().catch(console.error);
