const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const db = require('./db');
const bcrypt = require('bcrypt');

const GAMES_CONFIG = {
    'space-shooter': {
        displayName: 'Space Shooter',
        costs: {
            gold: 100,
            kristall: 25
        }
    }
};

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const connectedUsers = new Map(); // Stores username -> socket.id

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// --- Helper to send full user data ---
function emitUserData(socketOrUsername, user) {
    if (!user) return; // Safety check

    const payload = {
        resources: user.resources,
        unlockedGames: user.unlockedGames,
        rpg: user.rpg,
        selectedCharacter: user.selectedCharacter
    };

    const targetSocketId = typeof socketOrUsername === 'string'
        ? connectedUsers.get(socketOrUsername)
        // Note: The socket parameter is only available inside the 'connection' event.
        // This function will throw an error if called with a socket object outside of that scope.
        // However, the call from setInterval uses a username, so it's safe.
        : socketOrUsername.id;

    if (targetSocketId) {
        io.to(targetSocketId).emit('user data', payload);
    }
}

io.on('connection', (socket) => {
    console.log(`A user connected with socket id: ${socket.id}`);

    // --- Registration ---
    socket.on('register', async ({ username, email, password }) => {
        try {
            const isAdmin = (email === 'christiandittrich74@googlemail.com');
            const hashedPassword = await bcrypt.hash(password, 10);
            await db.createUser(username, email, hashedPassword, isAdmin);
            socket.emit('register success');
        } catch (error) {
            socket.emit('register failed', { message: error.message });
        }
    });

    // --- Login ---
    socket.on('login', async ({ identifier, password }) => {
        try {
            let user = db.findUserByUsername(identifier) || db.findUserByEmail(identifier);

            if (!user) {
                return socket.emit('login failed', { message: 'Benutzer nicht gefunden.' });
            }

            if (user.isBanned) {
                return socket.emit('login failed', { message: 'Dieses Konto wurde gesperrt.' });
            }

            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                return socket.emit('login failed', { message: 'Ungültiges Passwort.' });
            }

            // --- RPG Data Migration ---
            if (!user.rpg) {
                console.log(`User ${user.username} lacks RPG data. Creating defaults.`);
                const defaultRpgStats = { level: 1, xp: 0, strength: 5, dexterity: 5, intelligence: 5 };
                const updatedUser = await db.updateUser(user.username, { rpg: defaultRpgStats });
                if (updatedUser) {
                    user = updatedUser; // Ensure we're using the most up-to-date user object
                }
            }

            if (connectedUsers.has(user.username)) {
                const oldSocketId = connectedUsers.get(user.username);
                const oldSocket = io.sockets.sockets.get(oldSocketId);
                if (oldSocket) {
                    oldSocket.emit('force logout');
                    oldSocket.disconnect();
                }
            }

            socket.username = user.username;
            connectedUsers.set(user.username, socket.id);
            await db.setUserOnline(user.username, true);

            socket.emit('login success', {
                username: user.username,
                isAdmin: user.isAdmin,
            });

            emitUserData(socket, user);

            io.emit('user list', Array.from(connectedUsers.keys()));
            io.emit('chat message', { user: 'System', text: `${user.username} ist dem Spiel beigetreten.` });

        } catch (error) {
            console.error('Login error:', error);
            socket.emit('login failed', { message: 'Ein interner Fehler ist aufgetreten.' });
        }
    });

    // --- Chat ---
    socket.on('chat message', (msg) => {
        if (socket.username) {
            io.emit('chat message', {
                user: socket.username,
                text: msg.text,
                timestamp: new Date().toISOString()
            });
        }
    });

    // --- Logout & Disconnect ---
    const handleDisconnect = async () => {
        if (socket.username && connectedUsers.get(socket.username) === socket.id) {
            console.log(`User ${socket.username} disconnected.`);
            await db.setUserOnline(socket.username, false);
            connectedUsers.delete(socket.username);
            io.emit('user list', Array.from(connectedUsers.keys()));
            io.emit('chat message', { user: 'System', text: `${socket.username} hat das Spiel verlassen.` });
        }
    };

    socket.on('logout', handleDisconnect);
    socket.on('disconnect', handleDisconnect);

    // --- Admin Handlers ---
    function isAdmin(username) {
        const user = db.findUserByUsername(username);
        return user && user.isAdmin;
    }

    socket.on('admin:get-all-users', () => {
        if (isAdmin(socket.username)) {
            socket.emit('admin:all-users', db.getAllUsers());
        }
    });

    socket.on('admin:get-user-data', (username, callback) => {
        if (isAdmin(socket.username)) {
            callback(db.findUserByUsername(username));
        }
    });

    socket.on('admin:update-resources', async ({ targetUsername, resources }) => {
        if (isAdmin(socket.username)) {
            const updatedUser = await db.updateUser(targetUsername, { resources });
            if (updatedUser) {
                emitUserData(targetUsername, updatedUser);
            }
        }
    });

    socket.on('admin:update-games', async ({ targetUsername, unlockedGames }) => {
        if (isAdmin(socket.username)) {
            const updatedUser = await db.updateUser(targetUsername, { unlockedGames });
            if (updatedUser) {
                emitUserData(targetUsername, updatedUser);
            }
        }
    });

    socket.on('admin:reset-password', async ({ targetUsername, newPassword }) => {
        if (isAdmin(socket.username)) {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await db.updateUserPassword(targetUsername, hashedPassword);
        }
    });

    socket.on('admin:delete-user', async ({ targetUsername }) => {
        if (isAdmin(socket.username)) {
            await db.deleteUser(targetUsername);
            const targetSocketId = connectedUsers.get(targetUsername);
            if (targetSocketId) {
                const targetSocket = io.sockets.sockets.get(targetSocketId);
                if (targetSocket) {
                    targetSocket.emit('force logout');
                    targetSocket.disconnect();
                }
            }
            io.emit('user list', Array.from(connectedUsers.keys()));
        }
    });

    socket.on('admin:kick', (targetUsername) => {
        if (isAdmin(socket.username)) {
            const targetSocketId = connectedUsers.get(targetUsername);
            if (targetSocketId) {
                const targetSocket = io.sockets.sockets.get(targetSocketId);
                if (targetSocket) {
                    targetSocket.emit('force logout');
                    targetSocket.disconnect();
                }
            }
        }
    });

    socket.on('admin:ban', async (targetUsername) => {
        if (isAdmin(socket.username)) {
            await db.updateUser(targetUsername, { isBanned: true });
            const targetSocketId = connectedUsers.get(targetUsername);
            if (targetSocketId) {
                const targetSocket = io.sockets.sockets.get(targetSocketId);
                if (targetSocket) {
                    targetSocket.emit('force logout');
                    targetSocket.disconnect();
                }
            }
        }
    });

    // --- Game Handlers ---
    socket.on('game:unlock', async (gameId) => {
        if (!socket.username) return;
        if (!GAMES_CONFIG[gameId]) return;

        const user = db.findUserByUsername(socket.username);
        if (!user) return;
        if (user.unlockedGames.includes(gameId)) return;

        const costs = GAMES_CONFIG[gameId].costs;
        const hasEnoughResources = Object.keys(costs).every(
            resource => (user.resources[resource] || 0) >= costs[resource]
        );

        if (hasEnoughResources) {
            const newResources = { ...user.resources };
            Object.keys(costs).forEach(resource => {
                newResources[resource] -= costs[resource];
            });

            const newUnlockedGames = [...user.unlockedGames, gameId];

            const updatedUser = await db.updateUser(socket.username, {
                resources: newResources,
                unlockedGames: newUnlockedGames
            });

            emitUserData(socket, updatedUser);

        } else {
            socket.emit('game:unlock-failed', { message: 'Nicht genügend Ressourcen!' });
        }
    });

    socket.on('game:submit-score', async (payload) => {
        if (!socket.username) return;

        const user = db.findUserByUsername(socket.username);
        if (!user) return;

        const resourcesEarned = payload.resources || {};
        const newResources = { ...user.resources };

        for (const resource in resourcesEarned) {
            if (typeof resourcesEarned[resource] === 'number') {
                newResources[resource] = (newResources[resource] || 0) + resourcesEarned[resource];
            }
        }

        const updatedUser = await db.updateUser(socket.username, { resources: newResources });
        emitUserData(socket, updatedUser);
    });

    socket.on('resources:send', async ({ to, resources }) => {
        if (!socket.username) return;

        const sender = db.findUserByUsername(socket.username);
        const receiver = db.findUserByUsername(to);

        if (!receiver) {
            return socket.emit('resources:send-failed', { message: 'Empfänger nicht gefunden.' });
        }

        if (sender.username === receiver.username) {
            return socket.emit('resources:send-failed', { message: 'Du kannst keine Ressourcen an dich selbst senden.' });
        }

        const senderNewResources = { ...sender.resources };
        const receiverNewResources = { ...receiver.resources };
        let totalSent = 0;

        for (const resource in resources) {
            const amount = resources[resource];
            if (amount > 0) {
                if ((senderNewResources[resource] || 0) >= amount) {
                    senderNewResources[resource] -= amount;
                    receiverNewResources[resource] = (receiverNewResources[resource] || 0) + amount;
                    totalSent += amount;
                } else {
                    return socket.emit('resources:send-failed', { message: `Nicht genügend ${resource}.` });
                }
            }
        }

        if (totalSent > 0) {
            const updatedSender = await db.updateUser(sender.username, { resources: senderNewResources });
            const updatedReceiver = await db.updateUser(receiver.username, { resources: receiverNewResources });

            emitUserData(socket, updatedSender);
            socket.emit('resources:send-success', { message: 'Ressourcen erfolgreich gesendet!' });

            // Notify receiver if they are online
            emitUserData(receiver.username, updatedReceiver);
            const receiverSocketId = connectedUsers.get(receiver.username);
            if(receiverSocketId) {
                io.to(receiverSocketId).emit('chat message', { user: 'System', text: `Du hast Ressourcen von ${sender.username} erhalten!` });
            }
        } else {
            return socket.emit('resources:send-failed', { message: 'Keine gültige Menge zum Senden.' });
        }
    });

    // --- RPG Handlers ---
    const getLevelUpCost = (level) => ({
        xp: 100 * level,
        gold: 50 * level
    });

    socket.on('character:level-up', async () => {
        if (!socket.username) return;

        const user = db.findUserByUsername(socket.username);
        if (!user || !user.rpg) return;

        const cost = getLevelUpCost(user.rpg.level);

        if (user.rpg.xp < cost.xp) {
            return socket.emit('character:level-up-failed', { message: `Nicht genügend XP. Benötigt: ${cost.xp}` });
        }
        if ((user.resources.gold || 0) < cost.gold) {
            return socket.emit('character:level-up-failed', { message: `Nicht genügend Gold. Benötigt: ${cost.gold}` });
        }

        const newRpgStats = {
            ...user.rpg,
            level: user.rpg.level + 1,
            xp: user.rpg.xp - cost.xp,
            strength: user.rpg.strength + 1,
            dexterity: user.rpg.dexterity + 1,
            intelligence: user.rpg.intelligence + 1
        };

        const newResources = {
            ...user.resources,
            gold: user.resources.gold - cost.gold
        };

        const updatedUser = await db.updateUser(socket.username, {
            rpg: newRpgStats,
            resources: newResources
        });

        emitUserData(socket, updatedUser);
        socket.emit('character:level-up-success', { newLevel: newRpgStats.level });
    });

    socket.on('character:save', async (charData) => {
        if (socket.username) {
            try {
                await db.updateUser(socket.username, { selectedCharacter: charData });
                console.log(`Saved character for ${socket.username}:`, charData.name);
            } catch (error) {
                console.error(`Failed to save character for ${socket.username}:`, error);
            }
        }
    });
});

// --- Automatic Resource Generation ---
const RESOURCES = ['gold', 'holz', 'erz', 'kristall'];
let userResourceCycle = new Map();

setInterval(async () => {
    const onlineUsernames = Array.from(connectedUsers.keys());

    for (const username of onlineUsernames) {
        if (!connectedUsers.has(username)) continue;

        let receivedInCycle = userResourceCycle.get(username) || [];
        let availableResources = RESOURCES.filter(r => !receivedInCycle.includes(r));

        if (availableResources.length === 0) {
            receivedInCycle = [];
            availableResources = RESOURCES;
        }

        const resourceToGive = availableResources[Math.floor(Math.random() * availableResources.length)];

        receivedInCycle.push(resourceToGive);
        userResourceCycle.set(username, receivedInCycle);

        const user = db.findUserByUsername(username);
        if (user) {
            const newResources = { ...user.resources };
            newResources[resourceToGive] = (newResources[resourceToGive] || 0) + 1;
            const updatedUser = await db.updateUser(username, { resources: newResources });

            if (updatedUser) {
                emitUserData(username, updatedUser);
            }
        }
    }
}, 60000);


// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
