// Game configuration
const config = {
    width: window.innerWidth,
    height: window.innerHeight,
    playerSpeed: 3,
    playerSize: 30
};

// Game objects
let player, enemies = [];
let canvas, ctx, gameLoop, keys = {};

// UI Elements
let ui = {};

// Game state
let gameState = {
    level: 1,
    experience: 0,
    experienceToNext: 100,
    health: 100,
    maxHealth: 100,
    isGameOver: false,
    playerName: 'Player'
};

// Custom character state
let customCharState = {
    name: '',
    stats: { strength: 5, dexterity: 5, intelligence: 5 },
    points: 0, // Start with 0 points, stats are at default
    basePoints: 15,
    minStat: 1
};


// Initialize game
function init() {
    // Set up canvas
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    // Populate UI object
    ui = {
        // Screens
        titleScreen: document.getElementById('title-screen'),
        gameScreen: document.getElementById('game-screen'),
        optionsScreen: document.getElementById('options-screen'),
        characterCreationScreen: document.getElementById('character-creation-screen'),

        // Buttons
        newGameBtn: document.getElementById('new-game-btn'),
        loadGameBtn: document.getElementById('load-game-btn'),
        optionsBtn: document.getElementById('options-btn'),
        exitBtn: document.getElementById('exit-rpg-btn'),
        optionsBackBtn: document.getElementById('options-back-btn'),
        creationBackBtn: document.getElementById('creation-back-btn'),
        startGameBtn: document.getElementById('start-game-btn'),

        // Game UI
        levelEl: document.getElementById('level'),
        experienceEl: document.getElementById('experience'),
        healthEl: document.getElementById('health'),

        // Audio
        bgMusic: document.getElementById('bg-music'),
        sfxClick: document.getElementById('sfx-click'),
        musicVolumeSlider: document.getElementById('music-volume'),
        sfxVolumeSlider: document.getElementById('sfx-volume'),

        // Custom Char Modal
        customCharModal: document.getElementById('custom-char-modal'),
        charNameInput: document.getElementById('char-name-input'),
        pointsRemainingEl: document.getElementById('points-remaining'),
        strengthInput: document.getElementById('strength-input'),
        dexterityInput: document.getElementById('dexterity-input'),
        intelligenceInput: document.getElementById('intelligence-input'),
        confirmCharBtn: document.getElementById('confirm-char-btn'),
        cancelCharBtn: document.getElementById('cancel-char-btn'),
        attributeButtons: document.querySelectorAll('.btn-attribute'),
    };
    
    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Set up event listeners
    setupEventListeners();
    
    // Show title screen
    showScreen('title');

    // Populate character creation screen
    populateCharacterCreation();
    
    // Start game loop (paused until game starts)
    gameLoop = requestAnimationFrame(update);
}

// Audio control functions
function playClickSound() {
    if (ui.sfxClick) {
        ui.sfxClick.currentTime = 0;
        ui.sfxClick.play();
    }
}

function playBgMusic() {
    if (ui.bgMusic) {
        ui.bgMusic.play().catch(e => console.error("Audio autoplay failed: ", e));
    }
}

// Set up all event listeners
function setupEventListeners() {
    // Game controls
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // UI Buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('click', playClickSound);
    });

    ui.newGameBtn.addEventListener('click', () => showScreen('character-creation'));
    ui.loadGameBtn.addEventListener('click', () => {
        console.log('Load Game clicked - functionality to be implemented.');
        alert('Laden-Funktion noch nicht implementiert.');
    });
    ui.optionsBtn.addEventListener('click', () => {
        console.log("Options button clicked!");
        showScreen('options');
    });
    ui.optionsBackBtn.addEventListener('click', () => showScreen('title'));
    ui.creationBackBtn.addEventListener('click', () => showScreen('title'));
    ui.startGameBtn.addEventListener('click', () => showScreen('game'));
    ui.exitBtn.addEventListener('click', () => {
        window.close();
    });

    // Volume Sliders
    ui.musicVolumeSlider.addEventListener('input', (e) => {
        if(ui.bgMusic) ui.bgMusic.volume = e.target.value / 100;
    });
    ui.sfxVolumeSlider.addEventListener('input', (e) => {
        if(ui.sfxClick) ui.sfxClick.volume = e.target.value / 100;
    });

    // Custom Char Modal Listeners
    ui.cancelCharBtn.addEventListener('click', closeCustomCharModal);
    ui.confirmCharBtn.addEventListener('click', handleConfirmCustomChar);
    ui.attributeButtons.forEach(button => {
        button.addEventListener('click', handleAttributeChange);
    });
}

// Show a specific screen
function showScreen(screenId) {
    console.log(`showScreen called with: ${screenId}`);
    // Hide all screens
    if (ui.titleScreen) ui.titleScreen.style.display = 'none';
    if (ui.gameScreen) ui.gameScreen.style.display = 'none';
    if (ui.optionsScreen) ui.optionsScreen.style.display = 'none';
    if (ui.characterCreationScreen) ui.characterCreationScreen.style.display = 'none';
    
    // Show the requested screen
    switch(screenId) {
        case 'title':
            if (ui.titleScreen) ui.titleScreen.style.display = 'flex'; // Use flex to center content
            playBgMusic();
            break;
        case 'options':
            if (ui.optionsScreen) ui.optionsScreen.style.display = 'flex'; // Use flex to center content
            break;
        case 'character-creation':
            if (ui.characterCreationScreen) ui.characterCreationScreen.style.display = 'flex';
            break;
        case 'game':
            if (ui.gameScreen) ui.gameScreen.style.display = 'block';
            resetGame();
            break;
    }
}


// --- Custom Character Modal Functions ---
function openCustomCharModal() {
    // Reset to a clean state for point-buy
    customCharState.stats = { strength: 1, dexterity: 1, intelligence: 1 };
    customCharState.points = 12; // Total 15, 3 are spent on min 1 for each
    customCharState.name = '';
    ui.charNameInput.value = '';
    updateCustomCharModalUI();
    ui.customCharModal.style.display = 'flex';
}

function closeCustomCharModal() {
    ui.customCharModal.style.display = 'none';
}

function updateCustomCharModalUI() {
    ui.pointsRemainingEl.textContent = customCharState.points;
    ui.strengthInput.value = customCharState.stats.strength;
    ui.dexterityInput.value = customCharState.stats.dexterity;
    ui.intelligenceInput.value = customCharState.stats.intelligence;

    const noPointsLeft = customCharState.points <= 0;
    ui.attributeButtons.forEach(btn => {
        const action = btn.dataset.action;
        const stat = btn.dataset.stat;
        if (action === 'plus') {
            btn.disabled = noPointsLeft;
        } else if (action === 'minus') {
            btn.disabled = customCharState.stats[stat] <= customCharState.minStat;
        }
    });

    ui.confirmCharBtn.disabled = customCharState.points > 0;
}

function handleAttributeChange(event) {
    const action = event.target.dataset.action;
    const stat = event.target.dataset.stat;

    if (action === 'plus' && customCharState.points > 0) {
        customCharState.stats[stat]++;
        customCharState.points--;
    } else if (action === 'minus' && customCharState.stats[stat] > customCharState.minStat) {
        customCharState.stats[stat]--;
        customCharState.points++;
    }
    updateCustomCharModalUI();
}

function handleConfirmCustomChar() {
    const charName = ui.charNameInput.value.trim();
    if (charName.length < 3) {
        alert('Bitte gib einen Namen mit mindestens 3 Zeichen ein.');
        return;
    }
    if (customCharState.points > 0) {
        alert('Bitte verteile alle Attributspunkte.');
        return;
    }

    customCharState.name = charName;
    console.log('Custom character created:', customCharState);

    const customCard = document.querySelector('.character-card[data-iscustom="true"]');
    if (customCard) {
        customCard.querySelector('h3').textContent = customCharState.name;
        customCard.querySelectorAll('.gender-btn').forEach(btn => btn.disabled = true);

        document.querySelectorAll('.character-card').forEach(c => c.classList.remove('selected'));
        customCard.classList.add('selected');
    }

    closeCustomCharModal();
    ui.startGameBtn.disabled = false;
}

function populateCharacterCreation() {
    const classes = [
        {
            name: 'Krieger',
            description: 'Stark und widerstandsfähig, ein Meister des Nahkampfes.',
            img: { male: '/images/RPG/Krieger.png', female: '/images/RPG/Kriegerin.png' }
        },
        {
            name: 'Magier',
            description: 'Beherrscht die arkanen Künste, um Feinde aus der Ferne zu vernichten.',
            img: { male: '/images/RPG/Magier.png', female: '/images/RPG/Magierin.png' }
        },
        {
            name: 'Schurke',
            description: 'Ein listiger Kämpfer, der aus den Schatten zuschlägt.',
            img: { male: '/images/RPG/Schurke.png', female: '/images/RPG/Schurkin.png' }
        },
        {
            name: 'Bogenschütze',
            description: 'Ein Meisterschütze mit Pfeil und Bogen.',
            img: { male: '/images/RPG/Archer.png', female: '/images/RPG/Archerin.png' }
        },
        {
            name: 'Heiler',
            description: 'Ein heiliger Kleriker, der Verbündete heilt und schützt.',
            img: { male: '/images/RPG/Heiler.png', female: '/images/RPG/Heilerin.png' }
        },
        {
            name: 'Eigener Charakter',
            description: 'Erstelle einen Charakter mit frei verteilbaren Attributpunkten.',
            isCustom: true,
            img: { male: '/images/RPG/male_silhouette.svg', female: '/images/RPG/female_silhouette.svg' }
        }
    ];

    const container = document.getElementById('character-cards-container');
    container.innerHTML = ''; // Clear previous cards

    classes.forEach(classData => {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.dataset.gender = 'male';
        if (classData.isCustom) {
            card.dataset.iscustom = 'true';
        }

        card.innerHTML = `
            <img src="${classData.img.male}" alt="${classData.name}">
            <h3>${classData.name}</h3>
            <p>${classData.description}</p>
            <div class="gender-selector">
                <button class="gender-btn active" data-gender="male">Männlich</button>
                <button class="gender-btn" data-gender="female">Weiblich</button>
            </div>
        `;

        // Event listener for selecting the class card
        card.addEventListener('click', () => {
            if (classData.isCustom) {
                openCustomCharModal();
            } else {
                document.querySelectorAll('.character-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                ui.startGameBtn.disabled = false;
            }
        });

        // Event listeners for gender selection buttons
        const genderButtons = card.querySelectorAll('.gender-btn');
        genderButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent card selection when clicking gender

                const selectedGender = button.dataset.gender;
                card.dataset.gender = selectedGender;

                card.querySelector('.gender-btn.active').classList.remove('active');
                button.classList.add('active');

                const imgElement = card.querySelector('img');
                imgElement.src = classData.img[selectedGender];
            });
        });

        container.appendChild(card);
    });
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Game loop
function update(timestamp) {
    if (gameState.isGameOver) return;
    
    updatePlayer();
    updateEnemies();
    checkCollisions();
    draw();
    
    gameLoop = requestAnimationFrame(update);
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw player
    if (player) {
        ctx.fillStyle = '#8a6dff';
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
    
    // Draw enemies
    enemies.forEach(enemy => {
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });
    
    // Draw experience orbs
    if (Math.random() < 0.01) {
        const orb = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            width: 10,
            height: 10
        };
        enemies.push(orb);
    }
}

function updatePlayer() {
    if (!player) return;
    
    // Movement
    if (keys['ArrowLeft'] || keys['a']) {
        player.x = Math.max(0, player.x - config.playerSpeed);
    }
    if (keys['ArrowRight'] || keys['d']) {
        player.x = Math.min(canvas.width - player.width, player.x + config.playerSpeed);
    }
    if (keys['ArrowUp'] || keys['w']) {
        player.y = Math.max(0, player.y - config.playerSpeed);
    }
    if (keys['ArrowDown'] || keys['s']) {
        player.y = Math.min(canvas.height - player.height, player.y + config.playerSpeed);
    }
}

function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        // Move towards player
        if (player) {
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                enemy.x += (dx / distance) * 1;
                enemy.y += (dy / distance) * 1;
            }
        }
        
        // Remove if off screen
        if (enemy.x < -50 || enemy.x > canvas.width + 50 || 
            enemy.y < -50 || enemy.y > canvas.height + 50) {
            enemies.splice(i, 1);
        }
    }
}

function checkCollisions() {
    if (!player) return;
    
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        if (isColliding(player, enemy)) {
            // Check if it's an experience orb (smaller than enemies)
            if (enemy.width < 20) {
                // Experience orb
                gameState.experience += 10;
                if (gameState.experience >= gameState.experienceToNext) {
                    gameState.level++;
                    gameState.experience -= gameState.experienceToNext;
                    gameState.experienceToNext = Math.floor(gameState.experienceToNext * 1.2);
                    gameState.maxHealth += 10;
                    gameState.health = gameState.maxHealth;
                }
                enemies.splice(i, 1);
            } else {
                // Enemy collision
                gameState.health -= 10;
                enemies.splice(i, 1);
                
                if (gameState.health <= 0) {
                    gameOver();
                }
            }
        }
    }
    
    // Update UI
    ui.levelEl.textContent = `Level: ${gameState.level}`;
    ui.experienceEl.textContent = `Erfahrung: ${gameState.experience}/${gameState.experienceToNext}`;
    ui.healthEl.textContent = `Leben: ${gameState.health}/${gameState.maxHealth}`;
}

function isColliding(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

function gameOver() {
    gameState.isGameOver = true;
    // showScreen('gameOver'); // Game over screen not implemented yet
    console.log("Game Over!");
}

function resetGame() {
    gameState = {
        level: 1,
        experience: 0,
        experienceToNext: 100,
        health: 100,
        maxHealth: 100,
        isGameOver: false
    };
    
    player = {
        x: canvas.width / 2 - config.playerSize / 2,
        y: canvas.height / 2 - config.playerSize / 2,
        width: config.playerSize,
        height: config.playerSize
    };
    
    enemies = [];
    
    if (gameLoop) {
        cancelAnimationFrame(gameLoop);
    }
    gameLoop = requestAnimationFrame(update);
}

function handleKeyDown(e) {
    keys[e.key] = true;
    if (e.key === 'Escape') window.close();
}

function handleKeyUp(e) {
    keys[e.key] = false;
}

// Start the game
window.onload = init;
