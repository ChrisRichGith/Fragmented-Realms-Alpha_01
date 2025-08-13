const NPC_CLASSES = {
    'Krieger': { img: { male: '/images/RPG/Krieger.png', female: '/images/RPG/Kriegerin.png' } },
    'Schurke': { img: { male: '/images/RPG/Schurke.png', female: '/images/RPG/Schurkin.png' } },
    'Bogenschütze': { img: { male: '/images/RPG/Archer.png', female: '/images/RPG/Archerin.png' } },
    'Magier': { img: { male: '/images/RPG/Magier.png', female: '/images/RPG/Magierin.png' } },
    'Heiler': { img: { male: '/images/RPG/Heiler.png', female: '/images/RPG/Heilerin.png' } }
};

const LOCATIONS = {
    'location_1': {
        name: 'Location 1',
        coords: { top: '10%', left: '10%', width: '8%', height: '8%' },
        detailMap: null,
        actions: []
    },
    'location_2': {
        name: 'Location 2',
        coords: { top: '20%', left: '20%', width: '8%', height: '8%' },
        detailMap: null,
        actions: []
    },
    'location_3': {
        name: 'Location 3',
        coords: { top: '30%', left: '30%', width: '8%', height: '8%' },
        detailMap: null,
        actions: []
    },
    'location_4': {
        name: 'Location 4',
        coords: { top: '40%', left: '40%', width: '8%', height: '8%' },
        detailMap: null,
        actions: []
    },
    'location_5': {
        name: 'Location 5',
        coords: { top: '50%', left: '50%', width: '8%', height: '8%' },
        detailMap: null,
        actions: []
    },
    'location_6': {
        name: 'Location 6',
        coords: { top: '60%', left: '60%', width: '8%', height: '8%' },
        detailMap: null,
        actions: []
    },
    'location_7': {
        name: 'Location 7',
        coords: { top: '70%', left: '70%', width: '8%', height: '8%' },
        detailMap: null,
        actions: []
    },
    'location_8': {
        name: 'Location 8',
        coords: { top: '80%', left: '80%', width: '8%', height: '8%' },
        detailMap: null,
        actions: []
    },
    'location_9': {
        name: 'Location 9',
        coords: { top: '15%', left: '80%', width: '8%', height: '8%' },
        detailMap: null,
        actions: []
    }
};

const SECRET_CLASSES = [
    {
        name: 'Arkaner Komponist',
        requirements: { strength: 1, dexterity: 7, intelligence: 7 },
        message: 'Herzlichen Glückwunsch: Du hast den Arkanen Komponisten freigeschaltet.',
        img: {
            male: '/images/RPG/arkanerKomponist.png',
            female: '/images/RPG/arkaneKomponistin.png'
        }
    }
];

// Game objects
let keys = {};

// UI Elements
let ui = {};

// Custom character state
let customCharState = {
    name: '',
    stats: { strength: 5, dexterity: 5, intelligence: 5 },
    points: 0, // Start with 0 points, stats are at default
    basePoints: 15,
    minStat: 1
};

// Naming modal state
let namingContext = null;


// Initialize game
function init() {
    // Populate UI object
    ui = {
        // Screens
        titleScreen: document.getElementById('title-screen'),
        gameScreen: document.getElementById('game-screen'),
        optionsScreen: document.getElementById('options-screen'),
        characterCreationScreen: document.getElementById('character-creation-screen'),
        locationDetailScreen: document.getElementById('location-detail-screen'),

        // Buttons
        newGameBtn: document.getElementById('new-game-btn'),
        loadGameBtn: document.getElementById('load-game-btn'),
        optionsBtn: document.getElementById('options-btn'),
        exitBtn: document.getElementById('exit-rpg-btn'),
        optionsBackBtn: document.getElementById('options-back-btn'),
        creationBackBtn: document.getElementById('creation-back-btn'),
        startGameBtn: document.getElementById('start-game-btn'),
        startGameDirektBtn: document.getElementById('start-game-direkt-btn'),
        backToWorldMapBtn: document.getElementById('back-to-world-map-btn'),

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

        // Naming Modal
        nameCharModal: document.getElementById('name-char-modal'),
        predefCharNameInput: document.getElementById('predef-char-name-input'),
        confirmPredefNameBtn: document.getElementById('confirm-predef-name-btn'),
        cancelPredefNameBtn: document.getElementById('cancel-predef-name-btn'),
    };
    
    // Set up event listeners
    setupEventListeners();
    
    // Populate character creation screen
    populateCharacterCreation();
    
    // Check for direct start action
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'continue') {
        showScreen('game');
    } else {
        showScreen('title');
    }

    // Start game loop (paused until game starts)
    // gameLoop = requestAnimationFrame(update);
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
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
    
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
    ui.startGameDirektBtn.addEventListener('click', () => showScreen('game'));
    ui.backToWorldMapBtn.addEventListener('click', () => showScreen('game'));
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

    // Naming Modal Listeners
    ui.cancelPredefNameBtn.addEventListener('click', closeNameCharModal);
    ui.confirmPredefNameBtn.addEventListener('click', handleConfirmPredefName);
}

// Show a specific screen
function showScreen(screenId) {
    console.log(`showScreen called with: ${screenId}`);
    // Hide all screens
    if (ui.titleScreen) ui.titleScreen.style.display = 'none';
    if (ui.gameScreen) ui.gameScreen.style.display = 'none';
    if (ui.optionsScreen) ui.optionsScreen.style.display = 'none';
    if (ui.characterCreationScreen) ui.characterCreationScreen.style.display = 'none';
    if (ui.locationDetailScreen) ui.locationDetailScreen.style.display = 'none';
    
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
            if (ui.gameScreen) ui.gameScreen.style.display = 'flex';
            setupGameScreen();
            break;
        case 'location-detail':
            if (ui.locationDetailScreen) ui.locationDetailScreen.style.display = 'flex';
            break;
    }
}

function setupGameScreen() {
    const charCardContainer = document.getElementById('game-character-card-container');
    const charData = JSON.parse(localStorage.getItem('selectedCharacter'));

    if (!charData) {
        charCardContainer.innerHTML = '<p>Kein Charakter ausgewählt. Bitte erstelle einen Charakter.</p>';
        return;
    }

    charCardContainer.innerHTML = `
        <div class="character-card-game">
            <img src="${charData.image}" alt="${charData.name}">
            <h3>${charData.name}</h3>
            <div class="card-stats">
                <span>STÄ: ${charData.stats.strength}</span>
                <span>GES: ${charData.stats.dexterity}</span>
                <span>INT: ${charData.stats.intelligence}</span>
            </div>
        </div>
    `;

    setupNpcSelection();
    createLocationOverlays();
}

function setupNpcSelection() {
    const npcContainer = document.getElementById('npc-selection-container');
    npcContainer.innerHTML = ''; // Clear previous content

    for (let i = 0; i < 3; i++) {
        const card = document.createElement('div');
        card.className = 'npc-card';

        let options = '<option value="">- Klasse wählen -</option>';
        for (const className in NPC_CLASSES) {
            options += `<option value="${className}">${className}</option>`;
        }

        card.innerHTML = `
            <img src="/images/RPG/male_silhouette.svg" alt="NPC ${i + 1}">
            <div class="npc-card-details">
                <h4>Begleiter ${i + 1}</h4>
                <select class="npc-class-select" data-slot="${i}">
                    ${options}
                </select>
            </div>
        `;
        npcContainer.appendChild(card);
    }

    const npcSelects = document.querySelectorAll('.npc-class-select');
    npcSelects.forEach(select => {
        select.addEventListener('change', (event) => {
            const selectedClass = event.target.value;
            const slot = event.target.dataset.slot;
            const card = event.target.closest('.npc-card');
            const img = card.querySelector('img');

            if (selectedClass && NPC_CLASSES[selectedClass]) {
                // For now, let's assume a default gender, e.g., 'male'
                img.src = NPC_CLASSES[selectedClass].img.male;
            } else {
                img.src = '/images/RPG/male_silhouette.svg';
            }
        });
    });
}

function createLocationOverlays() {
    const overlayContainer = document.getElementById('location-overlay-container');
    overlayContainer.innerHTML = '';

    for (const locationId in LOCATIONS) {
        const location = LOCATIONS[locationId];
        const overlay = document.createElement('div');
        overlay.className = 'location-overlay';
        overlay.style.top = location.coords.top;
        overlay.style.left = location.coords.left;
        overlay.style.width = location.coords.width;
        overlay.style.height = location.coords.height;
        overlay.dataset.locationId = locationId;
        overlay.title = location.name; // Show name on hover

        overlay.addEventListener('click', (e) => {
            if (isDragging) {
                isDragging = false;
                return;
            }
            showLocationDetail(locationId);
        });

        overlay.addEventListener('mousedown', dragStart);

        overlayContainer.appendChild(overlay);
    }
}

function showLocationDetail(locationId) {
    const location = LOCATIONS[locationId];
    if (!location) return;

    showScreen('location-detail'); // A new case for showScreen

    const locationName = document.getElementById('location-name');
    const detailMap = document.getElementById('location-detail-map');
    const actionsContainer = document.getElementById('location-actions');

    locationName.textContent = location.name;

    if (location.detailMap) {
        detailMap.src = location.detailMap;
        detailMap.style.display = 'block';
    } else {
        detailMap.style.display = 'none';
    }

    actionsContainer.innerHTML = '';
    location.actions.forEach(action => {
        const actionButton = document.createElement('button');
        actionButton.className = 'action-btn';
        actionButton.textContent = action.replace('_', ' ');
        actionsContainer.appendChild(actionButton);
    });
}

let activeOverlay = null;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;

function dragStart(e) {
    isDragging = false;
    activeOverlay = e.target;
    offsetX = e.clientX - activeOverlay.getBoundingClientRect().left;
    offsetY = e.clientY - activeOverlay.getBoundingClientRect().top;
    activeOverlay.classList.add('dragging');
}

function drag(e) {
    if (!activeOverlay) return;
    isDragging = true;
    e.preventDefault();
    const parentRect = activeOverlay.parentElement.getBoundingClientRect();
    const x = e.clientX - parentRect.left - offsetX;
    const y = e.clientY - parentRect.top - offsetY;
    activeOverlay.style.left = `${x}px`;
    activeOverlay.style.top = `${y}px`;
}

function dragEnd(e) {
    if (!activeOverlay) return;

    const overlayContainer = document.getElementById('location-overlay-container');
    const containerRect = overlayContainer.getBoundingClientRect();
    const overlayRect = activeOverlay.getBoundingClientRect();

    const top = ((overlayRect.top - containerRect.top) / containerRect.height) * 100;
    const left = ((overlayRect.left - containerRect.left) / containerRect.width) * 100;

    const locationId = activeOverlay.dataset.locationId;
    const locationName = LOCATIONS[locationId].name;

    // Update the in-memory LOCATIONS object
    LOCATIONS[locationId].coords.top = `${top.toFixed(2)}%`;
    LOCATIONS[locationId].coords.left = `${left.toFixed(2)}%`;

    const display = document.getElementById('coordinate-display');
    display.innerHTML = `<strong>${locationName}:</strong><br>top: '${top.toFixed(2)}%', left: '${left.toFixed(2)}%'`;

    activeOverlay.classList.remove('dragging');
    activeOverlay = null;
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

    // Check for secret class unlock
    let unlockedClass = null;
    for (const secretClass of SECRET_CLASSES) {
        const reqs = secretClass.requirements;
        const stats = customCharState.stats;
        if (stats.strength === reqs.strength &&
            stats.dexterity === reqs.dexterity &&
            stats.intelligence === reqs.intelligence) {
            unlockedClass = secretClass;
            break;
        }
    }

    if (customCard) {
        customCard.querySelector('h3').textContent = customCharState.name;

        if (unlockedClass) {
            alert(unlockedClass.message);
            const selectedGender = customCard.dataset.gender;
            customCard.querySelector('img').src = unlockedClass.img[selectedGender];
        }

        customCard.querySelectorAll('.gender-btn').forEach(btn => btn.disabled = true);

        document.querySelectorAll('.character-card').forEach(c => c.classList.remove('selected'));
        customCard.classList.add('selected');
    }

    closeCustomCharModal();
    ui.startGameBtn.disabled = false;
}

// --- Naming Modal Functions ---
function openNameCharModal(classData, card) {
    namingContext = { classData, card };
    ui.predefCharNameInput.value = '';
    ui.nameCharModal.style.display = 'flex';
    ui.predefCharNameInput.focus();
}

function closeNameCharModal() {
    namingContext = null;
    ui.nameCharModal.style.display = 'none';
}

function handleConfirmPredefName() {
    const charName = ui.predefCharNameInput.value.trim();
    if (charName.length < 3) {
        alert('Bitte gib einen Namen mit mindestens 3 Zeichen ein.');
        return;
    }

    if (!namingContext) return;

    const { classData, card } = namingContext;
    const charData = {
        name: charName,
        image: classData.img[card.dataset.gender],
        stats: classData.stats
    };

    if (window.opener) {
        window.opener.postMessage({ type: 'character-selected', data: charData }, '*');
    } else {
        alert('Hauptfenster nicht gefunden. Charakterauswahl kann nicht gesendet werden.');
    }

    closeNameCharModal();
}


function populateCharacterCreation() {
    const classes = [
        {
            name: 'Krieger',
            description: 'Stark und widerstandsfähig, ein Meister des Nahkampfes.',
            stats: { strength: 8, dexterity: 4, intelligence: 3 },
            img: { male: '/images/RPG/Krieger.png', female: '/images/RPG/Kriegerin.png' }
        },
        {
            name: 'Magier',
            description: 'Beherrscht die arkanen Künste, um Feinde aus der Ferne zu vernichten.',
            stats: { strength: 2, dexterity: 5, intelligence: 8 },
            img: { male: '/images/RPG/Magier.png', female: '/images/RPG/Magierin.png' }
        },
        {
            name: 'Schurke',
            description: 'Ein listiger Kämpfer, der aus den Schatten zuschlägt.',
            stats: { strength: 4, dexterity: 8, intelligence: 3 },
            img: { male: '/images/RPG/Schurke.png', female: '/images/RPG/Schurkin.png' }
        },
        {
            name: 'Bogenschütze',
            description: 'Ein Meisterschütze mit Pfeil und Bogen.',
            stats: { strength: 4, dexterity: 8, intelligence: 3 },
            img: { male: '/images/RPG/Archer.png', female: '/images/RPG/Archerin.png' }
        },
        {
            name: 'Heiler',
            description: 'Ein heiliger Kleriker, der Verbündete heilt und schützt.',
            stats: { strength: 3, dexterity: 4, intelligence: 8 },
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

        let statsHtml = '';
        if (classData.stats) {
            statsHtml = `
                <div class="card-stats">
                    <span>STÄ: ${classData.stats.strength}</span>
                    <span>GES: ${classData.stats.dexterity}</span>
                    <span>INT: ${classData.stats.intelligence}</span>
                </div>
            `;
        }

        card.innerHTML = `
            <img src="${classData.img.male}" alt="${classData.name}">
            <h3>${classData.name}</h3>
            <p>${classData.description}</p>
            ${statsHtml}
            <div class="gender-selector">
                <button class="gender-btn active" data-gender="male">Männlich</button>
                <button class="gender-btn" data-gender="female">Weiblich</button>
            </div>
            <button class="btn-apply-char">Übernehmen</button>
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

        // Event listener for the apply button
        const applyBtn = card.querySelector('.btn-apply-char');
        applyBtn.addEventListener('click', (event) => {
            event.stopPropagation();

            if (classData.isCustom) {
                // For custom characters, confirmation happens inside the modal.
                // This button acts as a final "send to main screen" after confirmation.
                if (!customCharState.name) {
                    alert('Bitte erstelle zuerst deinen Charakter über das Modal.');
                    openCustomCharModal(); // Re-open if they haven't confirmed
                    return;
                }
                const charData = {
                    name: customCharState.name,
                    image: card.querySelector('img').src,
                    stats: customCharState.stats
                };
                if (window.opener) {
                    window.opener.postMessage({ type: 'character-selected', data: charData }, '*');
                } else {
                    alert('Hauptfenster nicht gefunden.');
                }
            } else {
                // For predefined classes, open the naming modal.
                openNameCharModal(classData, card);
            }
        });

        container.appendChild(card);
    });
}


function handleKeyDown(e) {
    keys[e.key] = true;
    if (e.key === 'Escape') {
        if (ui.gameScreen.style.display === 'block') {
            showScreen('title');
        }
    }
}

function handleKeyUp(e) {
    keys[e.key] = false;
}

// Start the game
window.onload = init;
