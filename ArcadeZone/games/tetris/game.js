const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const nextCanvas = document.getElementById("nextCanvas");
const nextCtx = nextCanvas.getContext("2d");

const scoreElement = document.getElementById("score");
const bestElement = document.getElementById("best");
const linesElement = document.getElementById("lines");
const levelElement = document.getElementById("level");

const startButton = document.getElementById("startButton");
const pauseButton = document.getElementById("pauseButton");

const COLS = 10;
const ROWS = 20;
const SIZE = 30;

const COLORS = [
    null,
    "#a855f7",
    "#22d3ee",
    "#facc15",
    "#4ade80",
    "#f97316",
    "#ec4899",
    "#6366f1"
];

const SHAPES = [
    [[1, 1, 1, 1]],
    [[2, 2], [2, 2]],
    [[0, 3, 0], [3, 3, 3]],
    [[4, 4, 0], [0, 4, 4]],
    [[0, 5, 5], [5, 5, 0]],
    [[6, 0, 0], [6, 6, 6]],
    [[0, 0, 7], [7, 7, 7]]
];

let board;
let player;
let nextPiece;

let score = 0;
let lines = 0;
let level = 1;
let best = 0;

let running = false;
let paused = false;
let gameOver = false;

let dropCounter = 0;
let lastTime = 0;

try {
    best = Number(localStorage.getItem("arcadezone_tetris_best")) || 0;
} catch (error) {
    best = 0;
}

bestElement.textContent = best;

function createBoard() {
    return Array.from(
        { length: ROWS },
        () => Array(COLS).fill(0)
    );
}

function randomPiece() {
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];

    return {
        matrix: shape.map(row => [...row]),
        x: Math.floor(COLS / 2) - Math.ceil(shape[0].length / 2),
        y: 0
    };
}

function collide(piece) {
    for (let y = 0; y < piece.matrix.length; y++) {
        for (let x = 0; x < piece.matrix[y].length; x++) {
            if (piece.matrix[y][x] === 0) continue;

            const newX = piece.x + x;
            const newY = piece.y + y;

            if (
                newX < 0 ||
                newX >= COLS ||
                newY >= ROWS ||
                (newY >= 0 && board[newY][newX] !== 0)
            ) {
                return true;
            }
        }
    }

    return false;
}

function merge() {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0 && player.y + y >= 0) {
                board[player.y + y][player.x + x] = value;
            }
        });
    });
}

function rotateMatrix(matrix) {
    return matrix[0].map((_, index) =>
        matrix.map(row => row[index]).reverse()
    );
}

function rotatePlayer() {
    if (!running || paused) return;

    const oldMatrix = player.matrix;
    const oldX = player.x;

    player.matrix = rotateMatrix(player.matrix);

    if (collide(player)) {
        player.x += 1;

        if (collide(player)) {
            player.x = oldX - 1;

            if (collide(player)) {
                player.matrix = oldMatrix;
                player.x = oldX;
            }
        }
    }
}

function clearLines() {
    let cleared = 0;

    outer:
    for (let y = ROWS - 1; y >= 0; y--) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x] === 0) {
                continue outer;
            }
        }

        board.splice(y, 1);
        board.unshift(Array(COLS).fill(0));
        cleared++;
        y++;
    }

    if (cleared > 0) {
        const points = [0, 100, 300, 500, 800];

        score += points[cleared] * level;
        lines += cleared;
        level = Math.floor(lines / 10) + 1;

        updateStats();
    }
}

function updateStats() {
    scoreElement.textContent = score;
    linesElement.textContent = lines;
    levelElement.textContent = "LEVEL " + level;

    if (score > best) {
        best = score;
        bestElement.textContent = best;

        try {
            localStorage.setItem("arcadezone_tetris_best", best);
        } catch (error) {
            // A játék rekordmentés nélkül is működik.
        }
    }
}

function spawnPiece() {
    player = nextPiece;
    nextPiece = randomPiece();

    drawNext();

    if (collide(player)) {
        endGame();
    }
}

function drop() {
    if (!running || paused) return;

    player.y++;

    if (collide(player)) {
        player.y--;
        merge();
        clearLines();
        spawnPiece();
    }

    dropCounter = 0;
}

function hardDrop() {
    if (!running || paused) return;

    let distance = 0;

    while (!collide(player)) {
        player.y++;
        distance++;
    }

    player.y--;
    score += Math.max(0, distance - 1) * 2;

    merge();
    clearLines();
    spawnPiece();
    updateStats();
}

function movePlayer(direction) {
    if (!running || paused) return;

    player.x += direction;

    if (collide(player)) {
        player.x -= direction;
    }
}

function drawCell(context, x, y, color, size) {
    context.fillStyle = color;
    context.fillRect(
        x * size + 1,
        y * size + 1,
        size - 2,
        size - 2
    );

    context.strokeStyle = "rgba(255,255,255,0.2)";
    context.lineWidth = 1;
    context.strokeRect(
        x * size + 1,
        y * size + 1,
        size - 2,
        size - 2
    );
}

function drawMatrix(context, matrix, offset, size) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                drawCell(
                    context,
                    x + offset.x,
                    y + offset.y,
                    COLORS[value],
                    size
                );
            }
        });
    });
}

function drawGrid() {
    ctx.strokeStyle = "rgba(255,255,255,0.045)";
    ctx.lineWidth = 1;

    for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * SIZE, 0);
        ctx.lineTo(x * SIZE, canvas.height);
        ctx.stroke();
    }

    for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * SIZE);
        ctx.lineTo(canvas.width, y * SIZE);
        ctx.stroke();
    }
}

function drawNext() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);

    if (!nextPiece) return;

    const matrix = nextPiece.matrix;
    const size = 24;

    const offsetX = (nextCanvas.width / size - matrix[0].length) / 2;
    const offsetY = (nextCanvas.height / size - matrix.length) / 2;

    drawMatrix(
        nextCtx,
        matrix,
        { x: offsetX, y: offsetY },
        size
    );
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawGrid();

    if (board) {
        drawMatrix(ctx, board, { x: 0, y: 0 }, SIZE);
    }

    if (player && !gameOver) {
        drawMatrix(
            ctx,
            player.matrix,
            { x: player.x, y: player.y },
            SIZE
        );
    }

    if (paused) {
        drawMessage("SZÜNET");
    } else if (gameOver) {
        drawMessage("GAME OVER");
    } else if (!running) {
        drawMessage("ARCADEZONE");
    }
}

function drawMessage(message) {
    ctx.fillStyle = "rgba(5, 5, 15, 0.72)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 27px Arial";
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

function startGame() {
    board = createBoard();

    score = 0;
    lines = 0;
    level = 1;

    running = true;
    paused = false;
    gameOver = false;

    dropCounter = 0;

    nextPiece = randomPiece();
    spawnPiece();

    updateStats();

    startButton.textContent = "ÚJRAKEZDÉS";
    pauseButton.textContent = "SZÜNET";

    draw();
}

function endGame() {
    running = false;
    gameOver = true;

    startButton.textContent = "ÚJRAJÁTSZÁS";

    draw();
}

function togglePause() {
    if (!running || gameOver) return;

    paused = !paused;

    pauseButton.textContent = paused ? "FOLYTATÁS" : "SZÜNET";

    draw();
}

function gameLoop(time = 0) {
    const delta = time - lastTime;
    lastTime = time;

    if (running && !paused) {
        dropCounter += delta;

        const dropInterval = Math.max(100, 800 - (level - 1) * 65);

        if (dropCounter > dropInterval) {
            drop();
        }
    }

    draw();
    requestAnimationFrame(gameLoop);
}

document.addEventListener("keydown", event => {
    if ([
        "ArrowLeft",
        "ArrowRight",
        "ArrowDown",
        "ArrowUp",
        " "
    ].includes(event.key)) {
        event.preventDefault();
    }

    if (event.key === "Enter" && !running) {
        startGame();
        return;
    }

    if (event.key.toLowerCase() === "p") {
        togglePause();
        return;
    }

    if (!running || paused) return;

    switch (event.key) {
        case "ArrowLeft":
        case "a":
        case "A":
            movePlayer(-1);
            break;

        case "ArrowRight":
        case "d":
        case "D":
            movePlayer(1);
            break;

        case "ArrowDown":
        case "s":
        case "S":
            drop();
            break;

        case "ArrowUp":
        case "w":
        case "W":
            rotatePlayer();
            break;

        case " ":
            hardDrop();
            break;
    }
});

startButton.addEventListener("click", startGame);
pauseButton.addEventListener("click", togglePause);

document.querySelectorAll(".mobile-controls button").forEach(button => {
    const action = button.dataset.action;

    button.addEventListener("click", () => {
        if (action === "left") movePlayer(-1);
        if (action === "right") movePlayer(1);
        if (action === "rotate") rotatePlayer();
        if (action === "down") drop();
        if (action === "drop") hardDrop();
    });
});

board = createBoard();
nextPiece = randomPiece();
drawNext();
draw();

requestAnimationFrame(gameLoop);