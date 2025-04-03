const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const nicknameInput = document.getElementById('nickname');
const leaderboardList = document.getElementById('leaderboardList');

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [{ x: 10, y: 10 }];
let food = { x: 15, y: 15 };
let dx = 0;
let dy = 0;
let score = 0;
let speed = 100;
let gameLoop;
let playerName = '';

// Firebase veritabanı referansı
const db = firebase.database();
const leaderboardRef = db.ref('leaderboard');

// Skorları Firebase'dan yükle
leaderboardRef.on('value', (snapshot) => {
    const data = snapshot.val();
    const leaderboard = data ? Object.values(data) : [];
    leaderboard.sort((a, b) => b.score - a.score);
    updateLeaderboard(leaderboard.slice(0, 10));
});

document.addEventListener('keydown', changeDirection);

function startGame() {
    playerName = nicknameInput.value.trim();
    if (!playerName) {
        alert('Lütfen bir nick giriniz!');
        return;
    }
    if (gameLoop) clearInterval(gameLoop);
    snake = [{ x: 10, y: 10 }];
    dx = 0;
    dy = 0;
    score = 0;
    speed = 100;
    scoreElement.textContent = score;
    spawnFood();
    gameLoop = setInterval(drawGame, speed);
}

function drawGame() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        spawnFood();
        if (score % 50 === 0 && speed > 20) speed -= 10;
        clearInterval(gameLoop);
        gameLoop = setInterval(drawGame, speed);
    } else {
        snake.pop();
    }

    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount || snakeCollision(head)) {
        clearInterval(gameLoop);
        saveScore(playerName, score);
        alert(`Oyun Bitti! Puanın: ${score}`);
        return;
    }

    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    snake.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? '#00ffcc' : '#00cc99';
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
    });

    ctx.fillStyle = '#ff0066';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
}

function spawnFood() {
    food.x = Math.floor(Math.random() * tileCount);
    food.y = Math.floor(Math.random() * tileCount);
    if (snake.some(segment => segment.x === food.x && segment.y === food.y)) {
        spawnFood();
    }
}

function changeDirection(event) {
    const LEFT = 37, UP = 38, RIGHT = 39, DOWN = 40;
    switch (event.keyCode) {
        case LEFT: if (dx !== 1) { dx = -1; dy = 0; } break;
        case UP: if (dy !== 1) { dx = 0; dy = -1; } break;
        case RIGHT: if (dx !== -1) { dx = 1; dy = 0; } break;
        case DOWN: if (dy !== -1) { dx = 0; dy = 1; } break;
    }
}

function snakeCollision(head) {
    return snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y);
}

function saveScore(name, score) {
    const newScore = { name, score };
    const scoreId = Date.now(); // Benzersiz bir ID için timestamp kullanıyoruz
    leaderboardRef.child(scoreId).set(newScore);
}

function updateLeaderboard(leaderboard) {
    leaderboardList.innerHTML = '';
    leaderboard.forEach((entry, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${entry.name}: ${entry.score}`;
        leaderboardList.appendChild(li);
    });
}