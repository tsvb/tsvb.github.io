// Improved Tetris script.js based on suggestions provided
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');

context.scale(20, 20);

// Tetromino shapes and colors
const pieceMap = {
    'I': [
        [1, 1, 1, 1],
    ],
    'O': [
        [1, 1],
        [1, 1],
    ],
    'Z': [
        [1, 1, 0],
        [0, 1, 1],
    ],
    'S': [
        [0, 1, 1],
        [1, 1, 0],
    ],
    'T': [
        [1, 1, 1],
        [0, 1, 0],
    ],
    'L': [
        [1, 1, 1],
        [1, 0, 0],
    ],
    'J': [
        [1, 1, 1],
        [0, 0, 1],
    ],
};

const colors = [
    null,
    '#FF0D72',
    '#0DC2FF',
    '#0DFF72',
    '#F538FF',
    '#FF8E0D',
    '#FFE138',
    '#3877FF',
];

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let paused = false;
let gameOver = true;

const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0,
};

const arena = createMatrix(12, 20);

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function createPiece(type) {
    return pieceMap[type];
}

function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawMatrix(arena, {x: 0, y: 0});
    drawMatrix(player.matrix, player.pos);
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }

    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

function playerMove(offset) {
    player.pos.x += offset;
    if (collide(arena, player)) {
        player.pos.x -= offset;
    }
}

function playerReset() {
    const pieces = 'TJLOSZI';
    player.matrix = createPiece(pieces[Math.floor(pieces.length * Math.random())]);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        gameOver = true;
        updateHighScore();
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function collide(arena, player) {
    const m = player.matrix;
    const o = player.pos;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (arena[y + o.y] &&
                arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }

        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;

        player.score += rowCount * 10;
        rowCount *= 2;
    }
}

function updateScore() {
    scoreElement.innerText = player.score;
}

function updateHighScore() {
    if (player.score > highScore) {
        highScore = player.score;
        highScoreElement.innerText = highScore;
        localStorage.setItem('tetrisHighScore', highScore);
    }
}

function update(time = 0) {
    if (gameOver || paused) return;

    const deltaTime = time - lastTime;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    lastTime = time;

    draw();
    requestAnimationFrame(update);
}

// Event listeners
const KEY_LEFT = 37;
const KEY_RIGHT = 39;
const KEY_DOWN = 40;
const KEY_ROTATE_CCW = 81;
const KEY_ROTATE_CW = 87;

document.addEventListener('keydown', event => {
    if (gameOver || paused) return;

    if (event.keyCode === KEY_LEFT) {
        playerMove(-1);
    } else if (event.keyCode === KEY_RIGHT) {
        playerMove(1);
    } else if (event.keyCode === KEY_DOWN) {
        playerDrop();
    } else if (event.keyCode === KEY_ROTATE_CCW) {
        playerRotate(-1);
    } else if (event.keyCode === KEY_ROTATE_CW) {
        playerRotate(1);
    }
});

startButton.addEventListener('click', () => {
    if (gameOver) {
        gameOver = false;
        player.score = 0;
        updateScore();
        playerReset();
        update();
    }
});

pauseButton.addEventListener('click', () => {
    paused = !paused;
    if (!paused) {
        lastTime = performance.now(); // Reset the timer to avoid skipping frames
        update();
    }
});

highScoreElement.innerText = highScore;
playerReset();
updateScore();
