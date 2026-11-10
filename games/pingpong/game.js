
/* =================================
   ARCADEZONE - PING PONG
   PLAYER NAME + LOCAL LEADERBOARD
================================= */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const bestElement = document.getElementById("best");
const speedElement = document.getElementById("speed");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const overlayIcon = document.getElementById("overlayIcon");
const startButton = document.getElementById("startButton");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// =================================
// PLAYER NAME INPUT
// =================================

const nameLabel = document.createElement("label");
nameLabel.textContent = "PLAYER NAME";
nameLabel.style.display = "block";
nameLabel.style.color = "#b99aff";
nameLabel.style.fontWeight = "bold";
nameLabel.style.margin = "15px 0 8px";
nameLabel.style.letterSpacing = "2px";

const nameInput = document.createElement("input");
nameInput.type = "text";
nameInput.id = "playerNameInput";
nameInput.maxLength = 16;
nameInput.placeholder = "Írd be a neved...";
nameInput.autocomplete = "nickname";

nameInput.style.display = "block";
nameInput.style.width = "80%";
nameInput.style.maxWidth = "280px";
nameInput.style.boxSizing = "border-box";
nameInput.style.margin = "0 auto 15px";
nameInput.style.padding = "12px";
nameInput.style.border = "1px solid #925cff";
nameInput.style.borderRadius = "8px";
nameInput.style.background = "#17152b";
nameInput.style.color = "white";
nameInput.style.textAlign = "center";
nameInput.style.fontSize = "16px";

startButton.parentNode.insertBefore(nameLabel, startButton);
startButton.parentNode.insertBefore(nameInput, startButton);

let playerName = "";

try {
    playerName =
        localStorage.getItem("arcadezone_pingpong_name") || "";
} catch (error) {
    console.warn("Player name could not be loaded.");
}

nameInput.value = playerName;

// =================================
// GAME VARIABLES
// =================================

let running = false;
let gameOver = false;
let score = 0;
let best = 0;
let speedMultiplier = 1;

const paddle = {
    x: WIDTH / 2 - 75,
    y: HEIGHT - 45,
    width: 150,
    height: 13,
    speed: 9,
    targetX: WIDTH / 2
};

const ball = {
    x: WIDTH / 2,
    y: HEIGHT - 115,
    radius: 9,
    dx: 3,
    dy: -5
};

const keys = {
    left: false,
    right: false
};

let lastTime = 0;

// =================================
// LOAD BEST SCORE
// =================================

try {
    best = Number(
        localStorage.getItem("arcadezone_pingpong_best")
    ) || 0;
} catch (error) {
    best = 0;
}

bestElement.textContent = best;

// =================================
// SAVE PLAYER SCORE
// =================================

function savePlayerScore() {
    if (!playerName || score <= 0) {
        return;
    }

    try {
        const key = "arcadezone_pingpong_scores";

        let scores = JSON.parse(
            localStorage.getItem(key) || "[]"
        );

        if (!Array.isArray(scores)) {
            scores = [];
        }

        scores.push({
            name: playerName,
            score: score,
            date: new Date().toISOString()
        });

        scores.sort((a, b) => b.score - a.score);

        scores = scores.slice(0, 10);

        localStorage.setItem(
            key,
            JSON.stringify(scores)
        );

    } catch (error) {
        console.warn("Score could not be saved.", error);
    }
}

// =================================
// START GAME
// =================================

function startGame() {

    playerName = nameInput.value.trim();

    if (!playerName) {
        nameInput.placeholder = "Először írd be a neved!";
        nameInput.focus();
        return;
    }

    try {
        localStorage.setItem(
            "arcadezone_pingpong_name",
            playerName
        );
    } catch (error) {
        console.warn("Player name could not be saved.");
    }

    score = 0;
    speedMultiplier = 1;

    paddle.x = WIDTH / 2 - paddle.width / 2;
    paddle.targetX = WIDTH / 2;

    ball.x = WIDTH / 2;
    ball.y = HEIGHT - 115;

    ball.dx = (Math.random() > 0.5 ? 1 : -1) * 3;
    ball.dy = -5;

    scoreElement.textContent = score;
    speedElement.textContent = "1.0x";

    running = true;
    gameOver = false;

    overlay.classList.add("hidden");
}

// =================================
// GAME OVER
// =================================

function endGame() {

    if (!running) return;

    running = false;
    gameOver = true;

    savePlayerScore();

    if (score > best) {

        best = score;

        try {
            localStorage.setItem(
                "arcadezone_pingpong_best",
                best
            );
        } catch (error) {
            console.warn("Best score could not be saved.");
        }

        bestElement.textContent = best;
    }

    overlayIcon.textContent = "💥";
    overlayTitle.textContent = "GAME OVER";

    overlayText.textContent =
        `${playerName} - Your Score: ${score} | Best Score: ${best}`;

    startButton.textContent = "PLAY AGAIN →";

    overlay.classList.remove("hidden");
}

// =================================
// UPDATE SCORE
// =================================

function addPoint() {

    score++;

    speedMultiplier = Math.min(
        1 + score * 0.035,
        2.8
    );

    scoreElement.textContent = score;

    speedElement.textContent =
        speedMultiplier.toFixed(1) + "x";
}

// =================================
// UPDATE GAME
// =================================

function update(delta) {

    const frame = Math.min(delta / 16.667, 2);

    // PADDLE MOVEMENT

    if (keys.left) {
        paddle.targetX -= paddle.speed * frame;
    }

    if (keys.right) {
        paddle.targetX += paddle.speed * frame;
    }

    paddle.targetX = Math.max(
        paddle.width / 2,
        Math.min(
            WIDTH - paddle.width / 2,
            paddle.targetX
        )
    );

    paddle.x += (
        paddle.targetX - paddle.width / 2 - paddle.x
    ) * Math.min(1, 0.25 * frame);

    // BALL MOVEMENT

    ball.x += ball.dx * speedMultiplier * frame;
    ball.y += ball.dy * speedMultiplier * frame;

    // LEFT AND RIGHT WALLS

    if (ball.x - ball.radius <= 0) {
        ball.x = ball.radius;
        ball.dx = Math.abs(ball.dx);
    }

    if (ball.x + ball.radius >= WIDTH) {
        ball.x = WIDTH - ball.radius;
        ball.dx = -Math.abs(ball.dx);
    }

    // TOP WALL

    if (ball.y - ball.radius <= 0) {
        ball.y = ball.radius;
        ball.dy = Math.abs(ball.dy);
    }

    // PADDLE COLLISION

    const hitsPaddle =
        ball.dy > 0 &&
        ball.y + ball.radius >= paddle.y &&
        ball.y - ball.radius <= paddle.y + paddle.height &&
        ball.x + ball.radius >= paddle.x &&
        ball.x - ball.radius <= paddle.x + paddle.width;

    if (hitsPaddle) {

        ball.y = paddle.y - ball.radius;

        const paddleCenter = paddle.x + paddle.width / 2;

        const hitPosition =
            (ball.x - paddleCenter) / (paddle.width / 2);

        const angle = hitPosition * 1.05;

        const currentSpeed = Math.sqrt(
            ball.dx * ball.dx + ball.dy * ball.dy
        );

        ball.dx = Math.sin(angle) * currentSpeed;
        ball.dy = -Math.abs(Math.cos(angle) * currentSpeed);

        addPoint();
    }

    // GAME OVER

    if (ball.y - ball.radius > HEIGHT) {
        endGame();
    }
}

// =================================
// DRAW BACKGROUND
// =================================

function drawBackground() {

    ctx.fillStyle = "#0b0d1d";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.strokeStyle = "rgba(146,92,255,0.07)";
    ctx.lineWidth = 1;

    for (let x = 0; x < WIDTH; x += 45) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, HEIGHT);
        ctx.stroke();
    }

    for (let y = 0; y < HEIGHT; y += 45) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(WIDTH, y);
        ctx.stroke();
    }

    ctx.setLineDash([10, 15]);
    ctx.strokeStyle = "rgba(55,186,255,0.25)";

    ctx.beginPath();
    ctx.moveTo(0, HEIGHT / 2);
    ctx.lineTo(WIDTH, HEIGHT / 2);
    ctx.stroke();

    ctx.setLineDash([]);
}

// =================================
// DRAW PADDLE
// =================================

function drawPaddle() {

    ctx.save();

    ctx.shadowBlur = 25;
    ctx.shadowColor = "#925cff";

    const gradient = ctx.createLinearGradient(
        paddle.x,
        paddle.y,
        paddle.x + paddle.width,
        paddle.y
    );

    gradient.addColorStop(0, "#925cff");
    gradient.addColorStop(1, "#37baff");

    ctx.fillStyle = gradient;

    ctx.beginPath();

    ctx.roundRect(
        paddle.x,
        paddle.y,
        paddle.width,
        paddle.height,
        7
    );

    ctx.fill();
    ctx.restore();
}

// =================================
// DRAW BALL
// =================================

function drawBall() {

    ctx.save();

    ctx.shadowBlur = 30;
    ctx.shadowColor = "#37baff";

    ctx.fillStyle = "#ffffff";

    ctx.beginPath();

    ctx.arc(
        ball.x,
        ball.y,
        ball.radius,
        0,
        Math.PI * 2
    );

    ctx.fill();
    ctx.restore();
}

// =================================
// MAIN DRAW
// =================================

function draw() {
    drawBackground();
    drawPaddle();
    drawBall();
}

// =================================
// GAME LOOP
// =================================

function gameLoop(timestamp) {

    const delta = lastTime
        ? Math.min(timestamp - lastTime, 33.33)
        : 16.667;

    lastTime = timestamp;

    if (running) {
        update(delta);
    }

    draw();

    requestAnimationFrame(gameLoop);
}

// =================================
// MOUSE AND TOUCH CONTROL
// =================================

function movePaddle(event) {

    const rect = canvas.getBoundingClientRect();
    const scaleX = WIDTH / rect.width;

    const position =
        (event.clientX - rect.left) * scaleX;

    paddle.targetX = Math.max(
        paddle.width / 2,
        Math.min(
            WIDTH - paddle.width / 2,
            position
        )
    );
}

canvas.addEventListener("pointermove", movePaddle);

// =================================
// KEYBOARD CONTROL
// =================================

document.addEventListener("keydown", event => {

    if (
        ["ArrowLeft", "ArrowRight", "Space"].includes(event.code)
    ) {
        event.preventDefault();
    }

    if (
        event.code === "ArrowLeft" ||
        event.code === "KeyA"
    ) {
        keys.left = true;
    }

    if (
        event.code === "ArrowRight" ||
        event.code === "KeyD"
    ) {
        keys.right = true;
    }

    if (
        event.code === "Space" &&
        !running
    ) {
        startGame();
    }
});

document.addEventListener("keyup", event => {

    if (
        event.code === "ArrowLeft" ||
        event.code === "KeyA"
    ) {
        keys.left = false;
    }

    if (
        event.code === "ArrowRight" ||
        event.code === "KeyD"
    ) {
        keys.right = false;
    }
});

// =================================
// START BUTTON
// =================================

startButton.addEventListener("click", startGame);

// =================================
// INITIALIZE
// =================================

overlay.classList.remove("hidden");

draw();

requestAnimationFrame(gameLoop);

console.log("ArcadeZone Ping Pong loaded!");
