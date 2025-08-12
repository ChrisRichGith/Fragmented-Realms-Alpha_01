// Game configuration
const config = {
    width: window.innerWidth,
    height: window.innerHeight,
    playerSpeed: 5,
    bulletSpeed: 7,
    enemySpeed: 2,
    bossSpeed: 1.5,
    bossHealth: 10,
    playerHealth: 10,
    spawnRate: 1000,
    bossInterval: 30000,
    playerWidth: 50,
    playerHeight: 50,
    enemyBulletSpeed: 3,
    bossBulletSpeed: 4,
    backgroundScrollSpeed: 1, // Speed of the background scroll
    tile_size: 256 // The size of one background tile
};

// Game objects
let player, bullets = [], enemies = [], enemyBullets = [];
let explosions = [];
let canvas, ctx, gameLoop, keys = {};
let bossSpawnTimer = config.bossInterval;
let playerImage = new Image();
let enemyImage = new Image();
let bossImage = new Image();
let powerUpImages = {
    addlife: new Image(),
    bombe: new Image(),
    doppelschuss: new Image(),
    rakete: new Image(),
    schnellschuss: new Image(),
    streuschuss: new Image()
};
let explosionImage = new Image();
let backgroundImage = new Image();
let backgroundY = 0;


// Power-up system
let powerUps = [];
let activePowerUps = {
    doppelschuss: false,
    schnellschuss: false,
    bombe: false,
    extraLives: 0,
    rakete: false,
    streuschuss: false
};

let powerUpTimers = {
    doppelschuss: 0,
    schnellschuss: 0,
    bombe: 0,
    rakete: 0,
    streuschuss: 0
};

// UI Elements
const ui = {
    // Screens
    titleScreen: document.getElementById('title-screen'),
    gameScreen: document.getElementById('game-screen'),
    highscoresScreen: document.getElementById('highscores-screen'),
    gameOverScreen: document.getElementById('game-over'),

    // Buttons
    startBtn: document.getElementById('start-btn'),
    highscoresBtn: document.getElementById('highscores-btn'),
    backBtn: document.getElementById('back-btn'),
    restartBtn: document.getElementById('restart-btn'),
    toHighscoresBtn: document.getElementById('to-highscores-btn'),
    exitBtn: document.getElementById('exit-btn'),
    exitToMenuBtn: document.getElementById('exit-to-menu-btn'),

    // Game UI
    scoreEl: document.getElementById('score'),
    livesEl: document.getElementById('lives'),
    bossTimerEl: document.getElementById('boss-timer'),
    finalScoreEl: document.getElementById('final-score'),
    newHighscoreEl: document.getElementById('new-highscore'),
    playerNameInput: document.getElementById('player-name'),
    personalHighscoresEl: document.getElementById('personal-highscores'),
    globalHighscoresEl: document.getElementById('global-highscores')
};

// Game state
let gameState = {
    score: 0,
    lives: config.playerHealth,
    isGameOver: false,
    bossActive: false,
    bossSpawnTime: 0,
    lastEnemySpawn: 0,
    playerName: 'Player',
    bossDirection: 1 // 1 for right, -1 for left
};

// Initialize game
function init() {
    // Set up canvas
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Load images
    playerImage.src = '../../images/Space-Shooter/Player.png';
    enemyImage.src = '../../images/Space-Shooter/Gegner.png';
    bossImage.src = '../../images/Space-Shooter/Boss_01.png';
    explosionImage.src = '../../images/Space-Shooter/explosion.png';

    // Load power-up images
    for (const key in powerUpImages) {
        powerUpImages[key].src = `../../images/Space-Shooter/${key}.png`;
    }

    // Load background tile
    backgroundImage.src = '../../images/Space-Shooter/Kachel01.png';

    // Set up event listeners
    setupEventListeners();

    // Show title screen
    showScreen('title');

    // Ensure background image is loaded before starting the game loop
    backgroundImage.onload = () => {
        // Start game loop (paused until game starts)
        gameLoop = requestAnimationFrame(update);
    };
}

// Set up all event listeners
function setupEventListeners() {
    // Game controls
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // UI Buttons
    ui.startBtn.addEventListener('click', () => showScreen('game'));
    ui.highscoresBtn.addEventListener('click', () => showScreen('highscores'));
    ui.backBtn.addEventListener('click', () => showScreen('title'));
    ui.exitBtn.addEventListener('click', () => window.close());
    ui.exitToMenuBtn.addEventListener('click', () => {
        reportScoreAndExit();
        showScreen('title');
    });

    ui.restartBtn.addEventListener('click', () => {
        reportScoreAndExit(); // Report score before restarting
        if (ui.newHighscoreEl.style.display === 'block' && ui.playerNameInput.value.trim() !== '') {
            submitHighscore(ui.playerNameInput.value.trim(), gameState.score).then(() => {
                resetGame();
                showScreen('game');
            });
        } else {
            resetGame();
            showScreen('game');
        }
    });

    ui.toHighscoresBtn.addEventListener('click', () => {
        reportScoreAndExit(); // Report score before showing highscores
        if (ui.newHighscoreEl.style.display === 'block' && ui.playerNameInput.value.trim() !== '') {
            submitHighscore(ui.playerNameInput.value.trim(), gameState.score).then(() => {
                showScreen('highscores');
            });
        } else {
            showScreen('highscores');
        }
    });
}

// Show a specific screen
function showScreen(screenId) {
    // Hide all screens
    ui.titleScreen.style.display = 'none';
    ui.gameScreen.style.display = 'none';
    ui.highscoresScreen.style.display = 'none';
    ui.gameOverScreen.style.display = 'none';

    // Show the requested screen
    switch(screenId) {
        case 'title':
            ui.titleScreen.style.display = 'block';
            break;
        case 'game':
            resetGame(); // Reset game state before showing screen
            ui.gameScreen.style.display = 'block';
            break;
        case 'highscores':
            ui.highscoresScreen.style.display = 'block';
            loadHighscores();
            break;
        case 'gameOver':
            ui.gameOverScreen.style.display = 'block';
            ui.finalScoreEl.textContent = gameState.score;
            checkHighscore();
            break;
    }
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Background Logic
function updateBackground() {
    backgroundY += config.backgroundScrollSpeed;
}

function drawBackground() {
    if (!backgroundImage.complete || backgroundImage.naturalHeight === 0) {
        ctx.fillStyle = '#000'; // Fallback if image not loaded
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;
    }

    const tileW = config.tile_size;
    const tileH = config.tile_size;
    const numCols = Math.ceil(canvas.width / tileW);
    const numRows = Math.ceil(canvas.height / tileH) + 1;

    // Calculate the offset for the entire grid, wrapped by tile height
    const yOffset = backgroundY % tileH;

    for (let y = 0; y < numRows; y++) {
        for (let x = 0; x < numCols; x++) {
            // Start drawing one tile above the screen and shift by the offset
            const yPos = (y - 1) * tileH + yOffset;
            ctx.drawImage(backgroundImage, x * tileW, yPos, tileW, tileH);
        }
    }
}

// Game loop
function update() {
    if (gameState.isGameOver) {
        cancelAnimationFrame(gameLoop);
        return;
    }

    // Only update game logic if we're in the game screen
    if (ui.gameScreen.style.display === 'block') {
        const now = Date.now();
        updateBackground();
        updatePlayer(now);
        updateBullets();
        updateEnemyBullets(now);
        updateEnemies(now);
        updateBossTimer();
        updatePowerUps();
        updateFloatingScores();
        checkCollisions();
        updatePowerUpTimers(now);

        // Update UI
        ui.scoreEl.textContent = `Punkte: ${gameState.score}`;
        ui.livesEl.textContent = `Leben: ${gameState.lives}`;
    }

    draw();

    gameLoop = requestAnimationFrame(update);
}

function createExplosion(x, y, size) {
    explosions.push({
        x: x - size / 2,
        y: y - size / 2,
        size: size,
        frame: 0,
        maxFrames: 10
    });
}

function draw() {
    // Draw background first
    drawBackground();

    // Draw explosions
    for (let i = explosions.length - 1; i >= 0; i--) {
        const exp = explosions[i];
        if (explosionImage.complete && explosionImage.naturalHeight !== 0) {
            ctx.globalAlpha = 1 - (exp.frame / exp.maxFrames);
            ctx.drawImage(explosionImage, exp.x, exp.y, exp.size, exp.size);
            ctx.globalAlpha = 1.0;
        }
        exp.frame++;
        if (exp.frame > exp.maxFrames) {
            explosions.splice(i, 1);
        }
    }

    // Draw player
    if (player) {
        if (playerImage.complete && playerImage.naturalHeight !== 0) {
            ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
        } else {
            ctx.fillStyle = '#3498db';
            ctx.fillRect(player.x, player.y, player.width, player.height);
        }
    }

    // Draw bullets, enemies, etc. only if the game screen is active
    if (ui.gameScreen.style.display === 'block') {
        bullets.forEach(bullet => {
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });

        enemyBullets.forEach(bullet => {
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });

        enemies.forEach(enemy => {
            const img = enemy.isBoss ? bossImage : enemyImage;
            if (img.complete && img.naturalHeight !== 0) {
                ctx.drawImage(img, enemy.x, enemy.y, enemy.width, enemy.height);
            } else {
                ctx.fillStyle = enemy.isBoss ? '#8e44ad' : '#f00';
                ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            }

            if (enemy.isBoss) {
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(enemy.x, enemy.y - 15, enemy.width, 5);
                ctx.fillStyle = '#00ff00';
                ctx.fillRect(enemy.x, enemy.y - 15, (enemy.width * enemy.health) / config.bossHealth, 5);
            }
        });

        powerUps.forEach(powerUp => {
            const img = powerUpImages[powerUp.type];
            if (img && img.complete && img.naturalHeight !== 0) {
                ctx.drawImage(img, powerUp.x, powerUp.y, powerUp.width, powerUp.height);
            } else {
                 ctx.fillStyle = '#00ff00'; // Fallback color
                 ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
            }
        });
    }

    drawFloatingScores();
}

function updatePlayer(now) {
    if (!player) return;

    if (keys['ArrowLeft'] && player.x > 0) player.x -= config.playerSpeed;
    if (keys['ArrowRight'] && player.x + player.width < canvas.width) player.x += config.playerSpeed;
    if (keys['ArrowUp'] && player.y > 0) player.y -= config.playerSpeed;
    if (keys['ArrowDown'] && player.y + player.height < canvas.height) player.y += config.playerSpeed;

    const shootDelay = activePowerUps.schnellschuss ? 100 : 250;
    if (keys[' '] && now - (player.lastShot || 0) > shootDelay) {
        shoot();
        player.lastShot = now;
    }

    if (keys['b'] || keys['B']) {
        activateScreenBomb();
    }
}

function shoot() {
    if (!player) return;
    if (activePowerUps.doppelschuss) {
        bullets.push({ x: player.x + 5, y: player.y, width: 5, height: 15, speed: config.bulletSpeed });
        bullets.push({ x: player.x + player.width - 10, y: player.y, width: 5, height: 15, speed: config.bulletSpeed });
    } else if (activePowerUps.streuschuss) {
        bullets.push({ x: player.x + player.width / 2 - 2.5, y: player.y, width: 5, height: 15, speed: config.bulletSpeed });
        bullets.push({ x: player.x + player.width / 2 - 2.5, y: player.y, width: 5, height: 15, speed: config.bulletSpeed, angle: -0.3 });
        bullets.push({ x: player.x + player.width / 2 - 2.5, y: player.y, width: 5, height: 15, speed: config.bulletSpeed, angle: 0.3 });
    } else {
        bullets.push({ x: player.x + player.width / 2 - 2.5, y: player.y, width: 5, height: 15, speed: config.bulletSpeed });
    }
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        if (bullet.angle) {
            bullet.x += Math.sin(bullet.angle) * bullet.speed;
            bullet.y -= Math.cos(bullet.angle) * bullet.speed;
        } else {
            bullet.y -= bullet.speed;
        }
        if (bullet.y < -bullet.height) bullets.splice(i, 1);
    }
}

function updateEnemyBullets(now) {
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        bullet.y += bullet.speed;
        if (bullet.y > canvas.height) {
            enemyBullets.splice(i, 1);
        }
    }
}

function spawnEnemy(isBoss = false) {
    const size = isBoss ? 60 : 30;
    const enemy = {
        x: Math.random() * (canvas.width - size),
        y: isBoss ? 50 : -size,
        width: size,
        height: size,
        speed: isBoss ? config.bossSpeed : config.enemySpeed,
        isBoss: isBoss,
        health: isBoss ? config.bossHealth : 1,
        lastShot: 0,
        shootDelay: isBoss ? 1000 : 2000
    };
    enemies.push(enemy);
    if (isBoss) {
        gameState.bossActive = true;
        gameState.bossSpawnTime = Date.now();
    }
}

function updateEnemies(now) {
    if (now - gameState.lastEnemySpawn > config.spawnRate && !gameState.bossActive) {
        spawnEnemy();
        gameState.lastEnemySpawn = now;
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        if (enemy.isBoss) {
            enemy.x += enemy.speed * gameState.bossDirection;
            if (enemy.x <= 0 || enemy.x + enemy.width >= canvas.width) {
                gameState.bossDirection *= -1;
            }
            if (now - enemy.lastShot > enemy.shootDelay) {
                enemyShoot(enemy);
                enemy.lastShot = now;
            }
        } else {
            enemy.y += enemy.speed;
            if (now - enemy.lastShot > enemy.shootDelay) {
                enemyShoot(enemy);
                enemy.lastShot = now;
            }
            if (enemy.y > canvas.height) {
                enemies.splice(i, 1);
            }
        }
    }
}

function enemyShoot(enemy) {
    enemyBullets.push({
        x: enemy.x + enemy.width / 2 - 2.5,
        y: enemy.y + enemy.height,
        width: 5,
        height: 10,
        speed: enemy.isBoss ? config.bossBulletSpeed : config.enemyBulletSpeed
    });
}

function updateBossTimer() {
    if (!gameState.bossActive) {
        bossSpawnTimer -= 16; // ~60fps
        if (bossSpawnTimer <= 0) {
            spawnEnemy(true);
            bossSpawnTimer = config.bossInterval;
        }
    }
    ui.bossTimerEl.textContent = `Nächster Boss in: ${Math.ceil(bossSpawnTimer / 1000)}s`;
}

function checkCollisions() {
    if (!player) return;
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (isColliding(bullets[i], enemies[j])) {
                enemies[j].health--;
                bullets.splice(i, 1);
                if (enemies[j].health <= 0) {
                    createExplosion(enemies[j].x + enemies[j].width / 2, enemies[j].y + enemies[j].height / 2, enemies[j].width * 1.5);
                    gameState.score += enemies[j].isBoss ? 100 : 10;
                    createFloatingScore(enemies[j].x + enemies[j].width / 2, enemies[j].y + enemies[j].height / 2, enemies[j].isBoss ? 100 : 10);
                    if (enemies[j].isBoss) {
                        dropPowerUp(enemies[j].x + enemies[j].width / 2, enemies[j].y + enemies[j].height / 2);
                        gameState.bossActive = false;
                        bossSpawnTimer = config.bossInterval;
                    }
                    enemies.splice(j, 1);
                }
                break;
            }
        }
    }

    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        if (isColliding(enemyBullets[i], player)) {
            enemyBullets.splice(i, 1);
            takeDamage();
        }
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        if (isColliding(enemies[i], player)) {
            createExplosion(enemies[i].x + enemies[i].width / 2, enemies[i].y + enemies[i].height / 2, enemies[i].width * 1.5);
            enemies.splice(i, 1);
            takeDamage();
        }
    }

    for (let i = powerUps.length - 1; i >= 0; i--) {
        if (isColliding(powerUps[i], player)) {
            activatePowerUp(powerUps[i].type);
            powerUps.splice(i, 1);
        }
    }
}

function isColliding(obj1, obj2) {
    if (!obj1 || !obj2) return false;
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

let floatingScores = [];

function createFloatingScore(x, y, score) {
    floatingScores.push({ x: x, y: y, value: score, alpha: 1.0, ySpeed: -1 });
}

function updateFloatingScores() {
    for (let i = floatingScores.length - 1; i >= 0; i--) {
        const score = floatingScores[i];
        score.y += score.ySpeed;
        score.alpha -= 0.02;
        if (score.alpha <= 0) {
            floatingScores.splice(i, 1);
        }
    }
}

function drawFloatingScores() {
    ctx.save();
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    floatingScores.forEach(score => {
        ctx.fillStyle = `rgba(255, 255, 255, ${score.alpha})`;
        ctx.strokeText('+' + score.value, score.x, score.y);
        ctx.fillText('+' + score.value, score.x, score.y);
    });
    ctx.restore();
}

function takeDamage() {
    gameState.lives--;
    ui.livesEl.textContent = `Leben: ${gameState.lives}`;
    createExplosion(player.x + player.width / 2, player.y + player.height / 2, player.width * 1.5);
    if (gameState.lives <= 0) {
        gameOver();
    }
}

function gameOver() {
    gameState.isGameOver = true;
    showScreen('gameOver');
}

function resetGame() {
    gameState = {
        score: 0,
        lives: config.playerHealth,
        isGameOver: false,
        bossActive: false,
        bossSpawnTime: 0,
        lastEnemySpawn: 0,
        bossDirection: 1
    };

    player = {
        x: config.width / 2 - config.playerWidth / 2,
        y: config.height - 100,
        width: config.playerWidth,
        height: config.playerHeight
    };

    bullets = [];
    enemies = [];
    enemyBullets = [];
    powerUps = [];
    bossSpawnTimer = config.bossInterval;

    ui.scoreEl.textContent = `Punkte: 0`;
    ui.livesEl.textContent = `Leben: ${config.playerHealth}`;

    activePowerUps = { doppelschuss: false, schnellschuss: false, bombe: false, extraLives: 0, rakete: false, streuschuss: false };
    powerUpTimers = { doppelschuss: 0, schnellschuss: 0, bombe: 0, rakete: 0, streuschuss: 0 };

    if (gameLoop) cancelAnimationFrame(gameLoop);
    gameLoop = requestAnimationFrame(update);
}

function handleKeyDown(e) {
    keys[e.key] = true;
    if (e.key === 'Escape') {
        showScreen('title');
    }
}

function handleKeyUp(e) {
    keys[e.key] = false;
}

function dropPowerUp(x, y) {
    const powerUpTypes = ['doppelschuss', 'schnellschuss', 'bombe', 'extraLives', 'rakete', 'streuschuss'];
    const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    powerUps.push({ x: x - 15, y: y, width: 30, height: 30, type: randomType });
}

function activatePowerUp(type) {
    switch(type) {
        case 'doppelschuss':
            activePowerUps.doppelschuss = true;
            powerUpTimers.doppelschuss = Date.now() + 10000;
            break;
        case 'schnellschuss':
            activePowerUps.schnellschuss = true;
            powerUpTimers.schnellschuss = Date.now() + 8000;
            break;
        case 'bombe':
            activePowerUps.bombe = true;
            powerUpTimers.bombe = Date.now() + 5000;
            break;
        case 'extraLives':
            gameState.lives += 5;
            break;
        case 'rakete':
            activePowerUps.rakete = true;
            powerUpTimers.rakete = Date.now() + 12000;
            break;
        case 'streuschuss':
            activePowerUps.streuschuss = true;
            powerUpTimers.streuschuss = Date.now() + 15000;
            break;
    }
}

function activateScreenBomb() {
    if (!activePowerUps.bombe) return;
    enemies.forEach(enemy => {
        createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width * 1.5);
        gameState.score += enemy.isBoss ? 100 : 10;
    });
    enemies = [];
    enemyBullets = [];
    activePowerUps.bombe = false;
}

function updatePowerUps() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        powerUp.y += 2;
        if (powerUp.y > canvas.height) {
            powerUps.splice(i, 1);
        }
    }
}

function updatePowerUpTimers(now) {
    if (powerUpTimers.doppelschuss && now > powerUpTimers.doppelschuss) {
        activePowerUps.doppelschuss = false;
        powerUpTimers.doppelschuss = 0;
    }
    if (powerUpTimers.schnellschuss && now > powerUpTimers.schnellschuss) {
        activePowerUps.schnellschuss = false;
        powerUpTimers.schnellschuss = 0;
    }
    if (powerUpTimers.bombe && now > powerUpTimers.bombe) {
        activePowerUps.bombe = false;
        powerUpTimers.bombe = 0;
    }
    if (powerUpTimers.rakete && now > powerUpTimers.rakete) {
        activePowerUps.rakete = false;
        powerUpTimers.rakete = 0;
    }
    if (powerUpTimers.streuschuss && now > powerUpTimers.streuschuss) {
        activePowerUps.streuschuss = false;
        powerUpTimers.streuschuss = 0;
    }
}

window.onload = init;

function loadHighscores() {
    const personalHighscores = JSON.parse(localStorage.getItem('spaceShooterPersonalHighscores') || '[]');
    displayHighscores(personalHighscores, ui.personalHighscoresEl);
    const globalHighscores = JSON.parse(localStorage.getItem('spaceShooterGlobalHighscores') || '[]');
    displayHighscores(globalHighscores, ui.globalHighscoresEl);
}

function displayHighscores(highscores, element) {
    element.innerHTML = '';
    if (highscores.length === 0) {
        element.innerHTML = '<li>Keine Highscores verfügbar</li>';
        return;
    }
    const topScores = highscores.sort((a, b) => b.score - a.score).slice(0, 10);
    topScores.forEach((entry, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${index + 1}. ${entry.name}</span><span>${entry.score}</span>`;
        element.appendChild(li);
    });
}

function checkHighscore() {
    const personalHighscores = JSON.parse(localStorage.getItem('spaceShooterPersonalHighscores') || '[]');
    const isNewPersonalHighscore = personalHighscores.length < 10 || gameState.score > (personalHighscores[personalHighscores.length - 1]?.score || 0);

    if (isNewPersonalHighscore) {
        ui.newHighscoreEl.style.display = 'block';
        ui.playerNameInput.focus();
    } else {
        ui.newHighscoreEl.style.display = 'none';
    }
}

async function submitHighscore(name, score) {
    const personalHighscores = JSON.parse(localStorage.getItem('spaceShooterPersonalHighscores') || '[]');
    personalHighscores.push({ name, score, date: new Date().toISOString() });
    const top10 = personalHighscores.sort((a, b) => b.score - a.score).slice(0, 10);
    localStorage.setItem('spaceShooterPersonalHighscores', JSON.stringify(top10));

    // TODO: Submit to server for global highscores
    return Promise.resolve();
}

function reportScoreAndExit() {
    if (gameState.score > 0) {
        const resourcesEarned = {
            gold: Math.floor(gameState.score / 100)
        };
        // This will send a message to the parent window (the main game client)
        if (window.parent) {
            window.parent.postMessage({
                type: 'game:score',
                payload: {
                    game: 'space-shooter',
                    resources: resourcesEarned
                }
            }, '*'); // In a real application, you should specify the exact origin instead of '*' for security.
        }
    }
}
