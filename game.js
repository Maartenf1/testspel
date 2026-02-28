const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;
const PADDLE_WIDTH = 14;
const PADDLE_HEIGHT = 110;
const BALL_RADIUS = 10;
const PADDLE_SPEED = 520;
const BASE_BALL_SPEED = 370;
const BALL_SPEED_GAIN = 1.06;
const MAX_BALL_SPEED = 760;
const SERVE_DELAY_MS = 1000;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

const keys = {
  KeyW: false,
  KeyS: false,
  ArrowUp: false,
  ArrowDown: false,
};

const state = {
  leftScore: 0,
  rightScore: 0,
  paused: false,
  serveTimer: 0,
  serveDirection: 1,
  leftPaddle: {
    x: 28,
    y: GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2,
  },
  rightPaddle: {
    x: GAME_WIDTH - 28 - PADDLE_WIDTH,
    y: GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2,
  },
  ball: {
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT / 2,
    vx: BASE_BALL_SPEED,
    vy: 0,
    speed: BASE_BALL_SPEED,
  },
};

let audioCtx;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playBeep(type) {
  if (!audioCtx || audioCtx.state === "suspended") return;

  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  oscillator.connect(gain);
  gain.connect(audioCtx.destination);

  const now = audioCtx.currentTime;
  if (type === "hit") {
    oscillator.frequency.setValueAtTime(460, now);
  } else {
    oscillator.frequency.setValueAtTime(220, now);
    oscillator.frequency.exponentialRampToValueAtTime(160, now + 0.08);
  }

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.03, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

  oscillator.type = type === "hit" ? "square" : "sine";
  oscillator.start(now);
  oscillator.stop(now + 0.12);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function resetBall(direction = 1) {
  state.ball.x = GAME_WIDTH / 2;
  state.ball.y = GAME_HEIGHT / 2;
  state.ball.speed = BASE_BALL_SPEED;
  state.ball.vx = BASE_BALL_SPEED * direction;
  state.ball.vy = 0;
  state.serveDirection = direction;
  state.serveTimer = SERVE_DELAY_MS;
}

function resetGame() {
  state.leftScore = 0;
  state.rightScore = 0;
  state.paused = false;
  state.leftPaddle.y = GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2;
  state.rightPaddle.y = GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2;
  resetBall(Math.random() < 0.5 ? -1 : 1);
}

function handlePaddleMovement(dt) {
  if (keys.KeyW) state.leftPaddle.y -= PADDLE_SPEED * dt;
  if (keys.KeyS) state.leftPaddle.y += PADDLE_SPEED * dt;
  if (keys.ArrowUp) state.rightPaddle.y -= PADDLE_SPEED * dt;
  if (keys.ArrowDown) state.rightPaddle.y += PADDLE_SPEED * dt;

  state.leftPaddle.y = clamp(state.leftPaddle.y, 0, GAME_HEIGHT - PADDLE_HEIGHT);
  state.rightPaddle.y = clamp(state.rightPaddle.y, 0, GAME_HEIGHT - PADDLE_HEIGHT);
}

function addBallDeflection(paddle) {
  const paddleCenter = paddle.y + PADDLE_HEIGHT / 2;
  const relativeIntersect = (state.ball.y - paddleCenter) / (PADDLE_HEIGHT / 2);
  const normalized = clamp(relativeIntersect, -1, 1);
  const maxBounceAngle = Math.PI / 3;
  const bounceAngle = normalized * maxBounceAngle;

  state.ball.speed = Math.min(state.ball.speed * BALL_SPEED_GAIN, MAX_BALL_SPEED);
  const direction = paddle === state.leftPaddle ? 1 : -1;

  state.ball.vx = Math.cos(bounceAngle) * state.ball.speed * direction;
  state.ball.vy = Math.sin(bounceAngle) * state.ball.speed;
}

function checkPaddleCollision() {
  const left = state.leftPaddle;
  const right = state.rightPaddle;
  const ball = state.ball;

  const intersectsLeft =
    ball.x - BALL_RADIUS <= left.x + PADDLE_WIDTH &&
    ball.x > left.x &&
    ball.y + BALL_RADIUS >= left.y &&
    ball.y - BALL_RADIUS <= left.y + PADDLE_HEIGHT;

  const intersectsRight =
    ball.x + BALL_RADIUS >= right.x &&
    ball.x < right.x + PADDLE_WIDTH &&
    ball.y + BALL_RADIUS >= right.y &&
    ball.y - BALL_RADIUS <= right.y + PADDLE_HEIGHT;

  if (intersectsLeft && ball.vx < 0) {
    ball.x = left.x + PADDLE_WIDTH + BALL_RADIUS;
    addBallDeflection(left);
    playBeep("hit");
  } else if (intersectsRight && ball.vx > 0) {
    ball.x = right.x - BALL_RADIUS;
    addBallDeflection(right);
    playBeep("hit");
  }
}

function updateBall(dt) {
  if (state.serveTimer > 0) {
    state.serveTimer -= dt * 1000;
    if (state.serveTimer <= 0) {
      state.serveTimer = 0;
      state.ball.vx = BASE_BALL_SPEED * state.serveDirection;
      state.ball.vy = 0;
    }
    return;
  }

  state.ball.x += state.ball.vx * dt;
  state.ball.y += state.ball.vy * dt;

  if (state.ball.y - BALL_RADIUS <= 0) {
    state.ball.y = BALL_RADIUS;
    state.ball.vy *= -1;
    playBeep("hit");
  } else if (state.ball.y + BALL_RADIUS >= GAME_HEIGHT) {
    state.ball.y = GAME_HEIGHT - BALL_RADIUS;
    state.ball.vy *= -1;
    playBeep("hit");
  }

  checkPaddleCollision();

  if (state.ball.x + BALL_RADIUS < 0) {
    state.rightScore += 1;
    playBeep("score");
    resetBall(-1);
  } else if (state.ball.x - BALL_RADIUS > GAME_WIDTH) {
    state.leftScore += 1;
    playBeep("score");
    resetBall(1);
  }
}

function drawCourt() {
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.fillStyle = "#0b2f1f";
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.strokeStyle = "#d8f3dc";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, GAME_WIDTH - 4, GAME_HEIGHT - 4);

  ctx.setLineDash([14, 14]);
  ctx.beginPath();
  ctx.moveTo(GAME_WIDTH / 2, 12);
  ctx.lineTo(GAME_WIDTH / 2, GAME_HEIGHT - 12);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.arc(GAME_WIDTH / 2, GAME_HEIGHT / 2, 54, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#d8f3dc";
  ctx.beginPath();
  ctx.arc(GAME_WIDTH / 2, GAME_HEIGHT / 2, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawObjects() {
  ctx.fillStyle = "#f2fff4";
  ctx.fillRect(state.leftPaddle.x, state.leftPaddle.y, PADDLE_WIDTH, PADDLE_HEIGHT);
  ctx.fillRect(state.rightPaddle.x, state.rightPaddle.y, PADDLE_WIDTH, PADDLE_HEIGHT);

  ctx.beginPath();
  ctx.arc(state.ball.x, state.ball.y, BALL_RADIUS, 0, Math.PI * 2);
  ctx.fill();
}

function drawUi() {
  ctx.fillStyle = "#f2fff4";
  ctx.font = "bold 44px Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${state.leftScore} : ${state.rightScore}`, GAME_WIDTH / 2, 54);

  ctx.font = "20px Segoe UI, sans-serif";
  if (state.paused) {
    ctx.fillText("PAUZE", GAME_WIDTH / 2, 85);
  } else if (state.serveTimer > 0) {
    ctx.fillText("Serve...", GAME_WIDTH / 2, 85);
  }
}

let lastTime = 0;

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000 || 0, 0.02);
  lastTime = timestamp;

  if (!state.paused) {
    handlePaddleMovement(dt);
    updateBall(dt);
  }

  drawCourt();
  drawObjects();
  drawUi();

  requestAnimationFrame(gameLoop);
}

window.addEventListener("keydown", (event) => {
  if (event.code in keys) {
    keys[event.code] = true;
    event.preventDefault();
  }

  if (event.code === "Space") {
    initAudio();
    if (audioCtx?.state === "suspended") {
      audioCtx.resume();
    }
    state.paused = !state.paused;
    event.preventDefault();
  }

  if (event.code === "KeyR") {
    initAudio();
    if (audioCtx?.state === "suspended") {
      audioCtx.resume();
    }
    resetGame();
    event.preventDefault();
  }
});

window.addEventListener("keyup", (event) => {
  if (event.code in keys) {
    keys[event.code] = false;
    event.preventDefault();
  }
});

resetBall(Math.random() < 0.5 ? -1 : 1);
requestAnimationFrame(gameLoop);
