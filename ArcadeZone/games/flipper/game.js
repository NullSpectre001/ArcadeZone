const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const bestElement = document.getElementById("best");
const livesElement = document.getElementById("lives");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const startButton = document.getElementById("startButton");

const W = canvas.width;
const H = canvas.height;

const BALL_RADIUS = 9;

let score = 0;
let best = 0;
let lives = 3;

let running = false;
let gameOver = false;

let leftPressed = false;
let rightPressed = false;

let ball;
let leftFlipper;
let rightFlipper;
let targets;

try {
    best = Number(localStorage.getItem("arcadezone_flipper_best")) || 0;
} catch (error) {
    best = 0;
}

bestElement.textContent = best;

function resetBall() {
    ball = {
        x: 430,
        y: 610,
        vx: 0,
        vy: 0,
        radius: BALL_RADIUS,
        launched: false
    };
}

function resetFlippers() {
    leftFlipper = {
        x: 155,
        y: 640,
        angle: -0.3,
        pressed: false
    };

    rightFlipper = {
        x: 345,
        y: 640,
        angle: Math.PI + 0.3,
        pressed: false
    };
}

function resetTargets() {
    targets = [
        { x: 115, y: 190, radius: 27, color: "#a855f7", active: true },
        { x: 250, y: 140, radius: 27, color: "#22d3ee", active: true },
        { x: 385, y: 190, radius: 27, color: "#ec4899", active: true },
        { x: 180, y: 310, radius: 19, color: "#facc15", active: true },
        { x: 320, y: 310, radius: 19, color: "#4ade80", active: true }
    ];
}

function updateStats() {
    scoreElement.textContent = score;
    bestElement.textContent = best;
    livesElement.textContent = lives;

    if (score > best) {
        best = score;
        bestElement.textContent = best;

        try {
            localStorage.setItem("arcadezone_flipper_best", best);
        } catch (error) {
            // A játék rekordmentés nélkül is működik.
        }
    }
}

function startGame() {
    score = 0;
    lives = 3;

    resetBall();
    resetFlippers();
    resetTargets();

    running = true;
    gameOver = false;

    overlay.classList.add("hidden");

    updateStats();
}

function endGame() {
    running = false;
    gameOver = true;

    overlayTitle.textContent = "GAME OVER";
    overlayText.textContent = "Elért pontszám: " + score;
    startButton.textContent = "ÚJRAJÁTSZÁS";

    overlay.classList.remove("hidden");
}

function launchBall() {
    if (!running || ball.launched) return;

    ball.launched = true;
    ball.vx = -2.8;
    ball.vy = -9;
}

function loseBall() {
    lives--;
    updateStats();

    if (lives <= 0) {
        endGame();
    } else {
        resetBall();
    }
}

function circleCollision(target) {
    const dx = ball.x - target.x;
    const dy = ball.y - target.y;

    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = ball.radius + target.radius;

    if (distance < minDistance) {
        const nx = dx / (distance || 1);
        const ny = dy / (distance || 1);

        ball.x = target.x + nx * minDistance;
        ball.y = target.y + ny * minDistance;

        const dot = ball.vx * nx + ball.vy * ny;

        ball.vx -= 2 * dot * nx;
        ball.vy -= 2 * dot * ny;

        ball.vx *= 1.08;
        ball.vy *= 1.08;

        target.active = false;
        score += 100;

        updateStats();
    }
}

function updateFlipperStates() {
    leftFlipper.pressed = leftPressed;
    rightFlipper.pressed = rightPressed;
}

function update() {
    if (!running) return;

    updateFlipperStates();

    if (!ball.launched) {
        ball.x = 430;
        ball.y = 610;
        return;
    }

    ball.vy += 0.16;

    ball.x += ball.vx;
    ball.y += ball.vy;

    // Oldalfalak
    if (ball.x < 25 + BALL_RADIUS) {
        ball.x = 25 + BALL_RADIUS;
        ball.vx = Math.abs(ball.vx) * 0.85;
    }

    if (ball.x > W - 25 - BALL_RADIUS) {
        ball.x = W - 25 - BALL_RADIUS;
        ball.vx = -Math.abs(ball.vx) * 0.85;
    }

    // Felső fal
    if (ball.y < 25 + BALL_RADIUS) {
        ball.y = 25 + BALL_RADIUS;
        ball.vy = Math.abs(ball.vy) * 0.85;
    }

    // Célpontok
    targets.forEach(target => {
        if (target.active) {
            circleCollision(target);
        }
    });

    // Ütők
    const leftHit = ball.x > 65 && ball.x < 245 &&
                    ball.y > 615 && ball.y < 685;

    const rightHit = ball.x > 255 && ball.x < 435 &&
                     ball.y > 615 && ball.y < 685;

    if (leftHit && leftPressed && ball.vy > 0) {
        ball.vy = -Math.abs(ball.vy) - 3;
        ball.vx -= 2;
        ball.y = 610;
    }

    if (rightHit && rightPressed && ball.vy > 0) {
        ball.vy = -Math.abs(ball.vy) - 3;
        ball.vx += 2;
        ball.y = 610;
    }

    // Alsó veszélyzóna
    if (ball.y > H + 20) {
        loseBall();
    }

    // Sebességhatár
    ball.vx = Math.max(-12, Math.min(12, ball.vx));
    ball.vy = Math.max(-15, Math.min(15, ball.vy));
}

function drawCircle(x, y, radius, color) {
    ctx.save();

    ctx.shadowColor = color;
    ctx.shadowBlur = 18;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawMachine() {
    ctx.fillStyle = "#0b0918";
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "#7136ad";
    ctx.lineWidth = 5;
    ctx.strokeRect(20, 20, W - 40, H - 40);

    // Díszítő vonalak
    ctx.strokeStyle = "rgba(168,85,247,0.25)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(60, 370);
    ctx.lineTo(155, 475);
    ctx.lineTo(250, 400);
    ctx.lineTo(345, 475);
    ctx.lineTo(440, 370);
    ctx.stroke();

    // Indítócsatorna
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(420, 35);
    ctx.lineTo(420, 640);
    ctx.stroke();

    // Célpontok
    targets.forEach(target => {
        if (target.active) {
            drawCircle(target.x, target.y, target.radius, target.color);
        }
    });

    // Ütők
    drawFlipper(155, 650, leftPressed, false);
    drawFlipper(345, 650, rightPressed, true);

    // Golyó
    drawCircle(ball.x, ball.y, ball.radius, "#ffffff");

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("ARCADEZONE", 250, 70);
}

function drawFlipper(x, y, pressed, rightSide) {
    ctx.save();

    ctx.translate(x, y);

    let angle;

    if (rightSide) {
        angle = pressed ? -0.6 : 0.3;
    } else {
        angle = pressed ? 0.6 : -0.3;
    }

    ctx.rotate(angle);

    ctx.fillStyle = "#a855f7";
    ctx.shadowColor = "#a855f7";
    ctx.shadowBlur = 15;

    ctx.beginPath();
    ctx.roundRect(-65, -9, 130, 18, 9);
    ctx.fill();

    ctx.restore();
}

function draw() {
    drawMachine();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

document.addEventListener("keydown", event => {
    if (["ArrowLeft", "ArrowRight", " ", "a", "d", "A", "D"].includes(event.key)) {
        event.preventDefault();
    }

    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        leftPressed = true;
    }

    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        rightPressed = true;
    }

    if (event.code === "Space") {
        launchBall();
    }
});

document.addEventListener("keyup", event => {
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        leftPressed = false;
    }

    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        rightPressed = false;
    }
});

startButton.addEventListener("click", startGame);

document.querySelectorAll(".mobile-controls button").forEach(button => {
    const action = button.dataset.action;

    button.addEventListener("pointerdown", event => {
        event.preventDefault();

        if (action === "left") leftPressed = true;
        if (action === "right") rightPressed = true;
        if (action === "launch") launchBall();
    });

    button.addEventListener("pointerup", () => {
        if (action === "left") leftPressed = false;
        if (action === "right") rightPressed = false;
    });

    button.addEventListener("pointerleave", () => {
        if (action === "left") leftPressed = false;
        if (action === "right") rightPressed = false;
    });

    button.addEventListener("pointercancel", () => {
        if (action === "left") leftPressed = false;
        if (action === "right") rightPressed = false;
    });
});

resetBall();
resetFlippers();
resetTargets();

draw();
requestAnimationFrame(gameLoop);