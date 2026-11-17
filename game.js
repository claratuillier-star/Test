const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const bestElement = document.getElementById("best");
const overlay = document.getElementById("overlay");
const titleElement = document.getElementById("overlay-title");
const messageElement = document.getElementById("message");
const startButton = document.getElementById("start-button");

const TILE = 20;
const CELLS = canvas.width / TILE;
const STEP_MS = 115;
const directions = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

let snake = [];
let human = null;
let direction = { x: 1, y: 0 };
let queuedDirection = { x: 1, y: 0 };
let score = 0;
let best = Number(localStorage.getItem("snakeHumanEaterBest") || 0);
let running = false;
let lastStep = 0;
let animationId = null;

bestElement.textContent = best;

function randomEmptyCell() {
  const free = [];
  for (let y = 0; y < CELLS; y++) {
    for (let x = 0; x < CELLS; x++) {
      if (!snake.some(part => part.x === x && part.y === y)) free.push({ x, y });
    }
  }
  return free.length ? free[Math.floor(Math.random() * free.length)] : null;
}

function startGame() {
  cancelAnimationFrame(animationId);
  snake = [{ x: 15, y: 15 }, { x: 14, y: 15 }, { x: 13, y: 15 }];
  direction = { x: 1, y: 0 };
  queuedDirection = { x: 1, y: 0 };
  score = 0;
  scoreElement.textContent = score;
  human = randomEmptyCell();
  running = true;
  lastStep = 0;
  overlay.classList.add("hidden");
  draw();
  animationId = requestAnimationFrame(loop);
}

function setDirection(next) {
  if (!next || !running) return;
  if (next.x === -direction.x && next.y === -direction.y) return;
  queuedDirection = next;
}

function loop(timestamp) {
  if (!running) return;
  if (timestamp - lastStep >= STEP_MS) {
    update();
    lastStep = timestamp;
  }
  draw();
  if (running) animationId = requestAnimationFrame(loop);
}

function update() {
  direction = queuedDirection;
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
  const eating = human && head.x === human.x && head.y === human.y;

  if (head.x < 0 || head.x >= CELLS || head.y < 0 || head.y >= CELLS) {
    endGame();
    return;
  }

  // La dernière case se libère pendant un déplacement normal.
  const collisionBody = eating ? snake : snake.slice(0, -1);
  if (collisionBody.some(part => part.x === head.x && part.y === head.y)) {
    endGame();
    return;
  }

  snake.unshift(head);
  if (eating) {
    score += 10;
    scoreElement.textContent = score;
    if (score > best) {
      best = score;
      bestElement.textContent = best;
      localStorage.setItem("snakeHumanEaterBest", String(best));
    }
    human = randomEmptyCell();
    if (!human) {
      endGame("Bravo ! Tu as rempli toute la carte.");
      return;
    }
  } else {
    snake.pop();
  }
}

function endGame(message = "Le serpent a rencontré un obstacle.") {
  running = false;
  cancelAnimationFrame(animationId);
  titleElement.textContent = "GAME OVER";
  messageElement.textContent = message + " Score final : " + score;
  startButton.textContent = "REJOUER";
  overlay.classList.remove("hidden");
}

function draw() {
  ctx.fillStyle = "#0d1d17";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Quadrillage discret
  ctx.strokeStyle = "#ffffff09";
  ctx.lineWidth = 1;
  for (let i = 0; i <= CELLS; i++) {
    ctx.beginPath(); ctx.moveTo(i * TILE, 0); ctx.lineTo(i * TILE, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * TILE); ctx.lineTo(canvas.width, i * TILE); ctx.stroke();
  }

  if (human) {
    const cx = human.x * TILE + TILE / 2;
    const cy = human.y * TILE + TILE / 2;
    ctx.font = "17px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🧍", cx, cy);
  }

  snake.forEach((part, index) => {
    const inset = index === 0 ? 1 : 2;
    ctx.fillStyle = index === 0 ? "#a5ffd9" : "#00c982";
    ctx.beginPath();
    ctx.roundRect(part.x * TILE + inset, part.y * TILE + inset,
      TILE - inset * 2, TILE - inset * 2, 5);
    ctx.fill();
    if (index === 0) {
      ctx.fillStyle = "#073522";
      const eyeX = direction.x === 0 ? 6 : (direction.x > 0 ? 13 : 5);
      const eyeY = direction.y === 0 ? 6 : (direction.y > 0 ? 13 : 5);
      ctx.beginPath(); ctx.arc(part.x * TILE + eyeX, part.y * TILE + eyeY, 1.7, 0, Math.PI * 2); ctx.fill();
    }
  });
}

document.addEventListener("keydown", event => {
  const keyMap = {
    ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
    z: "up", Z: "up", w: "up", W: "up",
    s: "down", S: "down", q: "left", Q: "left", a: "left", A: "left",
    d: "right", D: "right"
  };
  if (event.code === "Space") {
    event.preventDefault();
    if (!running) startGame();
    return;
  }
  const name = keyMap[event.key];
  if (name) {
    event.preventDefault();
    setDirection(directions[name]);
  }
});

document.querySelectorAll("[data-direction]").forEach(button => {
  button.addEventListener("click", () => setDirection(directions[button.dataset.direction]));
});

startButton.addEventListener("click", startGame);
draw();

let swipeStart=null;
canvas.addEventListener("touchstart",event=>{if(event.touches.length){const t=event.touches[0];swipeStart={x:t.clientX,y:t.clientY};}},{passive:true});
canvas.addEventListener("touchend",event=>{if(!swipeStart||!event.changedTouches.length)return;const t=event.changedTouches[0];const dx=t.clientX-swipeStart.x,dy=t.clientY-swipeStart.y;swipeStart=null;if(Math.max(Math.abs(dx),Math.abs(dy))<22)return;if(Math.abs(dx)>Math.abs(dy))setDirection(directions[dx>0?"right":"left"]);else setDirection(directions[dy>0?"down":"up"]);},{passive:true});
