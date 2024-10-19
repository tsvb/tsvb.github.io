const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');
const gameOverMessage = document.getElementById('gameOverMessage');
const pausedMessage = document.getElementById('pausedMessage');

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let paused = false;
let gameOver = true;

context.scale(20, 20);

const player = {
    pos: { x: 0, y: 0 },
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
    const pieces = {
        'T': [
            [0, 1, 0],
            [1, 1, 1],
        ],
        'O': [
            [1, 1],
            [1, 1],
        ],
        'L': [
            [0, 0, 1],
            [1, 1, 1],
        ],
        'J': [
            [1, 0, 0],
            [1, 1, 1],
        ],
        'I': [
            [1, 1, 1, 1],
        ],
        'S': [
            [0, 1, 1],
            [1, 1, 0],
        ],
        'Z': [
            [1, 1, 0],
            [0, 1, 1],
        ],
    };
    return pieces[type];
}

function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawMatrix(arena, { x: 0, y: 0 });
    drawMatrix(player.matrix, player.pos);
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = 'red';
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
        gameOverMessage.style.display = 'block';
        startButton.disabled = false;
        pauseButton.disabled = true;
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
    if (player.score > parseInt(localStorage.getItem('tetrisHighScore')) || 0) {
        localStorage.setItem('tetrisHighScore', player.score);
        highScoreElement.innerText = player.score;
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

window.addEventListener('keydown', function(e) {
    if ([37, 38, 39, 40].includes(e.keyCode)) {
        e.preventDefault();
    }
});

document.addEventListener('keydown', event => {
    if (gameOver || paused) return;

    if (event.keyCode === 37) {
        playerMove(-1);
    } else if (event.keyCode === 39) {
        playerMove(1);
    } else if (event.keyCode === 40) {
        playerDrop();
    } else if (event.keyCode === 81) {
        playerRotate(-1);
    } else if (event.keyCode === 87) {
        playerRotate(1);
    }
});

startButton.addEventListener('click', () => {
    if (gameOver) {
        gameOver = false;
        paused = false;
        pausedMessage.style.display = 'none';
        gameOverMessage.style.display = 'none';
        startButton.disabled = true;
        pauseButton.disabled = false;
        player.score = 0;
        updateScore();
        playerReset();
        update();
    }
});

pauseButton.addEventListener('click', () => {
    if (gameOver) return;
    paused = !paused;
    pausedMessage.style.display = paused ? 'block' : 'none';
    pauseButton.textContent = paused ? 'Resume' : 'Pause';
    if (!paused) {
        lastTime = performance.now();
        update();
    }
});

highScoreElement.innerText = localStorage.getItem('tetrisHighScore') || 0;
playerReset();
updateScore();
