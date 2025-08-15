const NPC_CLASSES = {
    'Krieger': { img: { male: '/images/RPG/Krieger.png', female: '/images/RPG/Kriegerin.png' } },
    'Schurke': { img: { male: '/images/RPG/Schurke.png', female: '/images/RPG/Schurkin.png' } },
    'Bogenschütze': { img: { male: '/images/RPG/Archer.png', female: '/images/RPG/Archerin.png' } },
    'Magier': { img: { male: '/images/RPG/Magier.png', female: '/images/RPG/Magierin.png' } },
    'Heiler': { img: { male: '/images/RPG/Heiler.png', female: '/images/RPG/Heilerin.png' } }
};

const LOCATIONS = {
    'city_1': {
        name: 'Varethyn',
        coords: { top: '11.24%', left: '26.06%', width: '10%', height: '15%' },
        detailMap: '/images/RPG/Citymap.png',
        actions: ['trade', 'quest', 'rest']
    },
    'village_2': {
        name: 'Dornhall',
        coords: { top: '38.06%', left: '16.24%', width: '8%', height: '8%' },
        detailMap: '/images/RPG/Villagemap.png',
        actions: ['quest', 'rest']
    },
    'village_3': {
        name: 'Myrrgarde',
        coords: { top: '48.12%', left: '31.15%', width: '8%', height: '8%' },
        detailMap: '/images/RPG/Villagemap.png',
        actions: ['quest', 'rest']
    },
    'forest_4': {
        name: 'Ysmereth',
        coords: { top: '25.25%', left: '45.77%', width: '15%', height: '15%' },
        detailMap: '/images/RPG/Wald.png',
        actions: ['explore', 'gather']
    },
    'village_5': {
        name: 'Elaris',
        coords: { top: '65.24%', left: '15.02%', width: '8%', height: '8%' },
        detailMap: '/images/RPG/Villagemap.png',
        actions: ['quest', 'rest']
    },
    'city_6': {
        name: 'Bruchhain',
        coords: { top: '65.92%', left: '35.78%', width: '10%', height: '10%' },
        detailMap: '/images/RPG/Citymap.png',
        actions: ['trade', 'quest', 'rest']
    },
    'city_7': {
        name: 'Tharvok',
        coords: { top: '52.8%', left: '67.05%', width: '13%', height: '13%' },
        detailMap: '/images/RPG/Citymap.png',
        actions: ['trade', 'quest', 'rest']
    },
    'dungeon_8': {
        name: 'Schattenfels',
        coords: { top: '68.45%', left: '72.44%', width: '9%', height: '9%' },
        detailMap: '/images/RPG/Dungeon.png',
        actions: ['enter_dungeon']
    },
    'village_9': {
        name: 'Kragmoor',
        coords: { top: '26.54%', left: '80.27%', width: '8%', height: '8%' },
        detailMap: '/images/RPG/Villagemap.png',
        actions: ['quest', 'rest']
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

// Party state
let npcParty = [null, null, null];
let currentLocationId = null;

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
        savePartyBtn: document.getElementById('save-party-btn'),
        loadPartyBtn: document.getElementById('load-party-btn'),
        rpgMenuToggleBtn: document.getElementById('rpg-menu-toggle-btn'),
        rpgMenuPopup: document.getElementById('rpg-menu-popup'),
        locationOverlayContainer: document.getElementById('location-overlay-container'),
        locationTitleDisplay: document.getElementById('location-title-display'),
        worldMapWrapper: document.getElementById('world-map-wrapper'),

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

        // Save Game Modal
        saveGameModal: document.getElementById('save-game-modal'),
        saveNameInput: document.getElementById('save-name-input'),
        confirmSaveBtn: document.getElementById('confirm-save-btn'),
        cancelSaveBtn: document.getElementById('cancel-save-btn'),

        // Load Game Modal
        loadGameModal: document.getElementById('load-game-modal'),
        saveSlotsContainer: document.getElementById('save-slots-container'),
        cancelLoadBtn: document.getElementById('cancel-load-btn'),
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
    
    // UI Buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('click', playClickSound);
    });

    ui.newGameBtn.addEventListener('click', () => showScreen('character-creation'));
    ui.optionsBtn.addEventListener('click', () => {
        console.log("Options button clicked!");
        showScreen('options');
    });
    ui.optionsBackBtn.addEventListener('click', () => showScreen('title'));
    ui.creationBackBtn.addEventListener('click', () => showScreen('title'));
    ui.startGameBtn.addEventListener('click', () => showScreen('game'));
    ui.startGameDirektBtn.addEventListener('click', () => showScreen('game'));
    ui.backToWorldMapBtn.addEventListener('click', () => {
        // Bring map wrapper to front so the closing animation is visible
        ui.worldMapWrapper.style.zIndex = 2;

        // Hide the location title
        ui.locationTitleDisplay.style.opacity = 0;

        // Remove the split class to trigger the closing animation
        const mapLeft = document.getElementById('world-map-left');
        const mapRight = document.getElementById('world-map-right');
        mapLeft.classList.remove('split');
        mapRight.classList.remove('split');

        // After the animation, hide the location detail screen and show overlays
        setTimeout(() => {
            ui.locationDetailScreen.style.display = 'none';
            ui.locationOverlayContainer.style.display = 'block';
            // Use a nested timeout to allow the display property to apply before adding the class for the transition
            setTimeout(() => {
                ui.locationOverlayContainer.classList.add('active');
            }, 20);
        }, 800); // Must match animation duration
    });
    ui.savePartyBtn.addEventListener('click', () => {
        ui.saveGameModal.style.display = 'flex';
    });
    ui.exitBtn.addEventListener('click', () => {
        window.close();
    });

    ui.rpgMenuToggleBtn.addEventListener('click', () => {
        ui.rpgMenuPopup.classList.toggle('hidden');
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

    // Save Game Modal Listeners
    ui.cancelSaveBtn.addEventListener('click', () => {
        ui.saveGameModal.style.display = 'none';
    });

    const showLoadGameModal = async () => {
        try {
            const response = await fetch('/api/gamesaves');
            if (!response.ok) {
                throw new Error('Failed to fetch save games.');
            }
            const saveFiles = await response.json();

            ui.saveSlotsContainer.innerHTML = ''; // Clear previous slots

            if (saveFiles.length === 0) {
                ui.saveSlotsContainer.innerHTML = '<p>Keine Spielstände gefunden.</p>';
            } else {
                saveFiles.forEach(fileName => {
                    const button = document.createElement('button');
                    button.textContent = fileName.replace('.json', '');
                    button.classList.add('save-slot-btn');
                    button.addEventListener('click', () => loadGame(fileName));
                    ui.saveSlotsContainer.appendChild(button);
                });
            }

            ui.loadGameModal.style.display = 'flex';
        } catch (error) {
            console.error('Error loading save games:', error);
            alert('Fehler beim Abrufen der Spielstände.');
        }
    };

    ui.loadGameBtn.addEventListener('click', showLoadGameModal);
    ui.loadPartyBtn.addEventListener('click', showLoadGameModal);

    ui.cancelLoadBtn.addEventListener('click', () => {
        ui.loadGameModal.style.display = 'none';
    });
    ui.confirmSaveBtn.addEventListener('click', async () => {
        const saveName = ui.saveNameInput.value.trim();
        if (saveName.length < 3 || !/^[a-zA-Z0-9_ -]+$/.test(saveName)) {
             alert('Bitte gib einen gültigen Namen mit mindestens 3 Zeichen ein (nur Buchstaben, Zahlen, Leerzeichen, _ und -).');
            return;
        }

        const charData = JSON.parse(localStorage.getItem('selectedCharacter'));
        const saveData = {
            name: saveName,
            character: charData,
            party: npcParty,
            location: currentLocationId
        };

        try {
            const response = await fetch('/api/gamesaves', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(saveData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save game.');
            }

            ui.saveNameInput.value = '';
            ui.saveGameModal.style.display = 'none';
            alert('Spielstand gespeichert!');

        } catch (error) {
            console.error('Error saving game:', error);
            alert(`Fehler beim Speichern: ${error.message}`);
        }
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

        const savedNpc = npcParty[i];
        const imgSrc = savedNpc ? NPC_CLASSES[savedNpc.className].img[savedNpc.gender] : '/images/RPG/male_silhouette.svg';

        card.innerHTML = `
            <img src="${imgSrc}" alt="NPC ${i + 1}">
            <div class="npc-card-details">
                <h4>Begleiter ${i + 1}</h4>
                <select class="npc-class-select" data-slot="${i}">
                    ${options}
                </select>
            </div>
        `;
        npcContainer.appendChild(card);

        if (savedNpc) {
            card.querySelector('.npc-class-select').value = savedNpc.className;
        }
    }

    const npcSelects = document.querySelectorAll('.npc-class-select');
    npcSelects.forEach(select => {
        select.addEventListener('change', (event) => {
            const selectedClass = event.target.value;
            const slot = parseInt(event.target.dataset.slot, 10);
            const card = event.target.closest('.npc-card');
            const img = card.querySelector('img');

            if (selectedClass && NPC_CLASSES[selectedClass]) {
                // For now, let's assume a default gender, e.g., 'male'
                img.src = NPC_CLASSES[selectedClass].img.male;
                npcParty[slot] = { className: selectedClass, gender: 'male' }; // Save selection
            } else {
                img.src = '/images/RPG/male_silhouette.svg';
                npcParty[slot] = null; // Clear selection
            }
        });
    });
}

function createLocationOverlays() {
    const overlayContainer = document.getElementById('location-overlay-container');
    overlayContainer.innerHTML = '';

    for (const locationId in LOCATIONS) {
        const location = LOCATIONS[locationId];

        // Create a container for each location spot
        const locationSpot = document.createElement('div');
        locationSpot.className = 'location-spot';
        locationSpot.style.top = location.coords.top;
        locationSpot.style.left = location.coords.left;
        locationSpot.style.width = location.coords.width;
        locationSpot.style.height = location.coords.height;
        locationSpot.dataset.locationId = locationId;
        locationSpot.title = location.name; // Show name on hover

        // The clickable overlay itself
        const overlay = document.createElement('div');
        overlay.className = 'location-overlay';
        overlay.addEventListener('click', () => {
            playClickSound();
            showLocationDetail(locationId);
        });

        // The name label
        const nameLabel = document.createElement('div');
        nameLabel.className = 'location-name-label';
        nameLabel.textContent = location.name;

        locationSpot.appendChild(overlay);
        locationSpot.appendChild(nameLabel);
        overlayContainer.appendChild(locationSpot);
    }
}

function showLocationDetail(locationId) {
    currentLocationId = locationId;
    const location = LOCATIONS[locationId];
    if (!location) return;

    // --- New Animation Logic ---

    // 1. Prepare the detail screen content
    const locationName = document.getElementById('location-name');
    const detailMap = document.getElementById('location-detail-map');
    const actionsContainer = document.getElementById('location-actions');
    if (location.detailMap) {
        detailMap.src = location.detailMap;
    }
    actionsContainer.innerHTML = '';
    location.actions.forEach(action => {
        const actionButton = document.createElement('button');
        actionButton.className = 'action-btn';
        actionButton.textContent = action.replace('_', ' ');
        actionsContainer.appendChild(actionButton);
    });

    // 2. Hide overlays and show title
    ui.locationOverlayContainer.classList.remove('active');
    ui.locationOverlayContainer.style.display = 'none';
    ui.locationTitleDisplay.textContent = location.name;
    ui.locationTitleDisplay.style.opacity = 1;

    // 3. Trigger the opening animation
    const mapLeft = document.getElementById('world-map-left');
    const mapRight = document.getElementById('world-map-right');
    mapLeft.classList.add('split');
    mapRight.classList.add('split');

    // 4. After the animation, show the detail screen and send map to back
    setTimeout(() => {
        ui.locationDetailScreen.style.display = 'block';
        ui.worldMapWrapper.style.zIndex = 0;
    }, 800); // Must match animation duration
}

async function loadGame(fileName) {
    try {
        // We get the filename with .json, but the API needs it without
        const saveName = fileName.replace('.json', '');
        const response = await fetch(`/api/gamesaves/${saveName}`);
        if (!response.ok) {
            throw new Error(`Failed to load game: ${saveName}`);
        }
        const saveData = await response.json();

        // Load main character data into localStorage
        localStorage.setItem('selectedCharacter', JSON.stringify(saveData.character));

        // Load NPC party
        npcParty = saveData.party || [null, null, null];

        // Load current location
        currentLocationId = saveData.location || null;

        // Refresh the game screen with the loaded data
        if (ui.gameScreen.style.display !== 'flex') {
            showScreen('game');
        } else {
            setupGameScreen();
        }

        console.log('Game loaded successfully:', saveData);
        ui.loadGameModal.style.display = 'none'; // Close modal on success

    } catch (error) {
        console.error('Error in loadGame:', error);
        alert('Fehler beim Laden des Spiels.');
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
