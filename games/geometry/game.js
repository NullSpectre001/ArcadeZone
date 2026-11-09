const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const bestElement = document.getElementById("best");
const speedElement = document.getElementById("speed");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const startButton = document.getElementById("startButton");
const mobileJump = document.getElementById("mobileJump");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GROUND = 340;

const BASE_SPEED = 330;
const BASE_GRAVITY = 1900;
const JUMP_HEIGHT = 125;

let running = false;
let gameOver = false;
let lastTime = 0;

let score = 0;
let distance = 0;
let speed = BASE_SPEED;

let best = Number(localStorage.getItem("arcadezone_geometry_best")) || 0;

let obstacles = [];
let particles = [];
let stars = [];

let spawnTimer = 0;
let groundOffset = 0;

const player = {
    x: 135,
    y: GROUND - 38,
    size: 38,
    vy: 0,
    grounded: true,
    jumpGravity: BASE_GRAVITY,
    jumpVelocity: 0,
    rotation: 0
};

bestElement.textContent = best;

// Háttércsillagok
for (let i = 0; i < 65; i++) {
    stars.push({
        x: Math.random() * WIDTH,
        y: Math.random() * 290,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.4 + 0.2
    });
}

function startGame() {
    score = 0;
    distance = 0;
    speed = BASE_SPEED;

    obstacles = [];
    particles = [];

    spawnTimer = 1.1;
    groundOffset = 0;

    player.y = GROUND - player.size;
    player.vy = 0;
    player.grounded = true;
    player.rotation = 0;

    running = true;
    gameOver = false;

    overlay.classList.add("hidden");

    scoreElement.textContent = "0";
    speedElement.textContent = "1.0x";

    lastTime = performance.now();
}

function endGame() {
    running = false;
    gameOver = true;

    if (score > best) {
        best = score;
        localStorage.setItem("arcadezone_geometry_best", best);
        bestElement.textContent = best;
    }

    overlayTitle.textContent = "Játék vége!";
    overlayText.textContent = `Pontszámod: ${score} • Rekord: ${best}`;
    startButton.textContent = "ÚJRAJÁTSZÁS";

    overlay.classList.remove("hidden");
}

function jump() {
    if (!running || !player.grounded) return;

    // A pálya gyorsulásával az ugrás is gyorsul,
    // de a magassága változatlan marad.
    const speedFactor = speed / BASE_SPEED;

    player.jumpGravity = BASE_GRAVITY * speedFactor * speedFactor;
    player.jumpVelocity = Math.sqrt(
        2 * player.jumpGravity * JUMP_HEIGHT
    );

    player.vy = -player.jumpVelocity;
    player.grounded = false;

    createParticles(
        player.x + player.size / 2,
        GROUND,
        9
    );
}

function createParticles(x, y, amount) {
    for (let i = 0; i < amount; i++) {
        particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 220,
            vy: -Math.random() * 170,
            life: 0.4 + Math.random() * 0.3,
            maxLife: 0.7,
            size: Math.random() * 4 + 2
        });
    }
}

function spawnObstacle() {
    const types = [
        { width: 28, height: 38, type: "spike" },
        { width: 42, height: 42, type: "block" },
        { width: 65, height: 35, type: "double" },
        { width: 30, height: 62, type: "tall" }
    ];

    const choice = types[Math.floor(Math.random() * types.length)];

    obstacles.push({
        x: WIDTH + 30,
        y: GROUND - choice.height,
        width: choice.width,
        height: choice.height,
        type: choice.type
    });
}

function update(dt) {
    if (!running) return;

    speed = Math.min(BASE_SPEED + distance * 1.15, 680);

    const speedFactor = speed / BASE_SPEED;

    distance += speed * dt / 10;
    score = Math.floor(distance);

    scoreElement.textContent = score;
    speedElement.textContent = speedFactor.toFixed(1) + "x";

    groundOffset += speed * dt;

    // Ugrás és gravitáció
    if (!player.grounded) {
        player.vy += player.jumpGravity * dt;
        player.y += player.vy * dt;
        player.rotation += 5 * dt;

        if (player.y + player.size >= GROUND) {
            player.y = GROUND - player.size;
            player.vy = 0;
            player.grounded = true;
            player.rotation = 0;

            createParticles(
                player.x + player.size / 2,
                GROUND,
                5
            );
        }
    }

    // Akadályok létrehozása
    spawnTimer -= dt;

    if (spawnTimer <= 0) {
        spawnObstacle();

        const difficulty = Math.min(speedFactor, 2);
        spawnTimer = (1.15 + Math.random() * 0.55) / difficulty;
    }

    // Akadályok mozgatása
    for (const obstacle of obstacles) {
        obstacle.x -= speed * dt;
    }

    obstacles = obstacles.filter(
        obstacle => obstacle.x + obstacle.width > -20
    );

    // Ütközésvizsgálat
    const padding = 6;

    const px = player.x + padding;
    const py = player.y + padding;
    const pw = player.size - padding * 2;
    const ph = player.size - padding * 2;

    for (const obstacle of obstacles) {
        const ox = obstacle.x + 3;
        const oy = obstacle.y + 3;
        const ow = obstacle.width - 6;
        const oh = obstacle.height - 3;

        if (
            px < ox + ow &&
            px + pw > ox &&
            py < oy + oh &&
            py + ph > oy
        ) {
            endGame();
            return;
        }
    }

    // Részecskék
    for (const particle of particles) {
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vy += 450 * dt;
        particle.life -= dt;
    }

    particles = particles.filter(p => p.life > 0);
}

function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    gradient.addColorStop(0, "#11112c");
    gradient.addColorStop(1, "#19122d");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Csillagok
    ctx.fillStyle = "#aaa3ff";

    for (const star of stars) {
        let x = (star.x - groundOffset * star.speed) % WIDTH;
        if (x < 0) x += WIDTH;

        ctx.globalAlpha = 0.3 + star.size / 5;
        ctx.fillRect(x, star.y, star.size, star.size);
    }

    ctx.globalAlpha = 1;

    // Háttérvonalak
    ctx.strokeStyle = "#35305c";
    ctx.lineWidth = 1;

    for (let x = -groundOffset % 60; x < WIDTH; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, GROUND);
        ctx.stroke();
    }

    // Talaj
    ctx.fillStyle = "#211a3e";
    ctx.fillRect(0, GROUND, WIDTH, HEIGHT - GROUND);

    ctx.strokeStyle = "#9b75ff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GROUND);
    ctx.lineTo(WIDTH, GROUND);
    ctx.stroke();

    // Talajcsíkok
    ctx.fillStyle = "#6650a9";

    for (let x = -groundOffset % 45; x < WIDTH; x += 45) {
        ctx.fillRect(x, GROUND + 18, 22, 3);
    }
}

function drawPlayer() {
    ctx.save();

    ctx.translate(
        player.x + player.size / 2,
        player.y + player.size / 2
    );

    ctx.rotate(player.rotation);

    ctx.shadowBlur = 20;
    ctx.shadowColor = "#a58bff";
    ctx.fillStyle = "#a58bff";

    ctx.fillRect(
        -player.size / 2,
        -player.size / 2,
        player.size,
        player.size
    );

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffffff";

    ctx.fillRect(-9, -8, 6, 6);
    ctx.fillRect(4, -8, 6, 6);

    ctx.restore();
}

function drawObstacles() {
    for (const obstacle of obstacles) {
        ctx.save();

        ctx.shadowBlur = 15;
        ctx.shadowColor = "#ff4f9a";
        ctx.fillStyle = "#ff4f9a";

        if (obstacle.type === "spike") {
            ctx.beginPath();
            ctx.moveTo(obstacle.x, GROUND);
            ctx.lineTo(
                obstacle.x + obstacle.width / 2,
                obstacle.y
            );
            ctx.lineTo(
                obstacle.x + obstacle.width,
                GROUND
            );
            ctx.closePath();
            ctx.fill();
        } else if (obstacle.type === "double") {
            const half = obstacle.width / 2;

            for (let i = 0; i < 2; i++) {
                const x = obstacle.x + i * half;

                ctx.beginPath();
                ctx.moveTo(x, GROUND);
                ctx.lineTo(x + half / 2, obstacle.y);
                ctx.lineTo(x + half, GROUND);
                ctx.closePath();
                ctx.fill();
            }
        } else {
            ctx.fillRect(
                obstacle.x,
                obstacle.y,
                obstacle.width,
                obstacle.height
            );
        }

        ctx.restore();
    }
}

function drawParticles() {
    for (const particle of particles) {
        ctx.globalAlpha = Math.max(
            0,
            particle.life / particle.maxLife
        );

        ctx.fillStyle = "#bba5ff";
        ctx.fillRect(
            particle.x,
            particle.y,
            particle.size,
            particle.size
        );
    }

    ctx.globalAlpha = 1;
}

function draw() {
    drawBackground();
    drawObstacles();
    drawParticles();
    drawPlayer();
}

function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.033);
    lastTime = timestamp;

    update(dt);
    draw();

    requestAnimationFrame(gameLoop);
}

// Billentyűzet
document.addEventListener("keydown", event => {
    if (
        event.code === "Space" ||
        event.code === "ArrowUp" ||
        event.code === "KeyW"
    ) {
        event.preventDefault();

        if (!running && !gameOver) {
            startGame();
        } else {
            jump();
        }
    }
});

// Kattintás és mobil
canvas.addEventListener("pointerdown", () => {
    if (!running && !gameOver) {
        startGame();
    } else {
        jump();
    }
});

mobileJump.addEventListener("pointerdown", event => {
    event.preventDefault();

    if (!running && !gameOver) {
        startGame();
    } else {
        jump();
    }
});

startButton.addEventListener("click", startGame);

// Kezdőképernyő és első rajzolás
bestElement.textContent = best;
draw();
requestAnimationFrame(timestamp => {
    lastTime = timestamp;
    gameLoop(timestamp);
});