/*
* Asset from: https://kenney.nl/assets/pixel-platformer
*
*/
import ASSETS from '../assets.js';
import ANIMATION from '../animation.js';
import Player from '../gameObjects/Player.js';
import PlayerBullet from '../gameObjects/PlayerBullet.js';
import EnemyFlying from '../gameObjects/EnemyFlying.js';
import EnemyBullet from '../gameObjects/EnemyBullet.js';
import Explosion from '../gameObjects/Explosion.js';
import PowerUpManager from '../gameObjects/PowerUpManager.js';
import BossEnemy, { BOSS_TYPES } from '../gameObjects/BossEnemy.js';

export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    create() {
        console.log('Game scene created');
        console.log('Scene scale:', this.scale.width, 'x', this.scale.height);

        this.initVariables();
        this.initGameUi();
        this.initAnimations();
        this.initControllers();
        this.initInput();
        this.initPhysics();
        this.initMap();

        // Don't initialize players yet - wait for START button
    }

    update() {
        this.updateMap();

        // Check for new controllers wanting to join
        if (this.gameStarted) {
            this.checkForNewPlayers();
        }

        if (!this.gameStarted) return;

        // Update all active players
        this.players.forEach(player => {
            if (player && player.active) {
                player.update();
            }
        });

        // Performance optimization - clean up excess bullets
        this.cleanupExcessBullets();

        // Enemy spawning
        if (this.spawnEnemyCounter > 0) this.spawnEnemyCounter--;
        else this.addFlyingGroup();

        // Power-up spawning
        this.powerUpManager.update(this.game.loop.delta);

        // Check for game over (all players dead)
        this.checkGameOver();
    }

    // NEW: Clean up bullets to prevent performance issues
    cleanupExcessBullets() {
        this.bulletCleanupTimer++;

        // Check every 60 frames (1 second at 60fps)
        if (this.bulletCleanupTimer >= 60) {
            this.bulletCleanupTimer = 0;

            const totalBullets = this.playerBulletGroup.children.size + this.enemyBulletGroup.children.size;

            if (totalBullets > this.maxBullets) {
                // Remove oldest player bullets first
                const excessCount = totalBullets - this.maxBullets;
                const bulletsToRemove = Math.min(excessCount, this.playerBulletGroup.children.size);

                for (let i = 0; i < bulletsToRemove; i++) {
                    const bullet = this.playerBulletGroup.children.entries[i];
                    if (bullet) {
                        this.playerBulletGroup.remove(bullet, true, true);
                    }
                }

                console.log(`Cleaned up ${bulletsToRemove} bullets for performance`);
            }
        }
    }

    initVariables() {
        this.score = 0;
        this.centreX = this.scale.width * 0.5;
        this.centreY = this.scale.height * 0.5;
        this.currentBoss = null;
        this.bossGroup = null;
        this.lastBossLevel = 0;
        this.bossTypeIndex = 0;

        // Game state
        this.gameStarted = false;
        this.waitingForStart = true;

        // Multiplayer variables
        this.players = new Array(4).fill(null); // Array to hold all players (max 4)
        this.activePlayers = 0; // Count of active players
        this.connectedControllers = []; // Track connected controllers
        this.maxPlayers = 4;
        this.lastControllerCheck = 0; // For checking new controllers

        // Player health UI configuration
        this.playerHealthBars = {}; // Store health bar references for each player

        // Power-up system
        this.powerUpManager = null;

        // Player starting positions for up to 4 players
        this.playerStartPositions = [
            { x: this.scale.width * 0.3, y: this.scale.height - 100 }, // Player 1 (left)
            { x: this.scale.width * 0.7, y: this.scale.height - 100 }, // Player 2 (right)
            { x: this.scale.width * 0.4, y: this.scale.height - 100 }, // Player 3 (center-left)
            { x: this.scale.width * 0.6, y: this.scale.height - 100 }  // Player 4 (center-right)
        ];

        // Player colors for differentiation
        this.playerColors = [
            0x00ff00, // Green
            0x0088ff, // Blue
            0xff8800, // Orange
            0xff00ff  // Magenta
        ];

        // NEW: Ship progression system
        this.playerShipTypes = [8, 9, 10, 11, 0, 1, 2, 3]; // Different ship sprites for player
        this.currentPlayerShipIndex = 0;

        // NEW: Enemy ship types with different behaviors
        this.enemyShipTypes = [
            { id: 12, name: 'Basic', shootPattern: 'single', fireRate: [100, 300] },
            { id: 13, name: 'Rapid', shootPattern: 'rapid', fireRate: [50, 150] },
            { id: 14, name: 'Burst', shootPattern: 'burst', fireRate: [200, 400] },
            { id: 15, name: 'Spread', shootPattern: 'spread', fireRate: [150, 250] },
            { id: 4, name: 'Heavy', shootPattern: 'heavy', fireRate: [300, 500] },
            { id: 5, name: 'Sniper', shootPattern: 'sniper', fireRate: [400, 600] },
            { id: 6, name: 'Bomber', shootPattern: 'bomber', fireRate: [250, 350] },
            { id: 7, name: 'Elite', shootPattern: 'elite', fireRate: [100, 200] }
        ];

        // NEW: Much stronger enemy scaling to balance powerful player
        this.difficultyLevel = 1;
        this.fibonacciSequence = [500, 700, 1000, 1400, 1900, 2500, 3300, 4300, 5600, 7200, 9200, 11800, 15000]; // Much slower level progression
        this.enemyHealthByLevel = [2, 3, 4, 6, 8, 12, 16, 22, 30, 40, 55, 70, 90]; // Further reduced health values
        this.enemyColorsByLevel = [
            0xffffff, // Level 1 - White (normal)
            0xffff00, // Level 2 - Yellow
            0xff8800, // Level 3 - Orange
            0xff0000, // Level 4 - Red
            0xff00ff, // Level 5 - Magenta
            0x8800ff, // Level 6 - Purple
            0x0088ff, // Level 7 - Blue
            0x00ffff, // Level 8 - Cyan
            0x00ff88, // Level 9 - Green
            0x88ff00, // Level 10 - Lime
            0xffffff, // Level 11 - Bright white
            0xff4444, // Level 12 - Bright red
            0x4444ff  // Level 13+ - Bright blue
        ];

        // list of tile ids in tiles.png
        // items nearer to the beginning of the array have a higher chance of being randomly chosen when using weighted()
        this.tiles = [50, 50, 50, 50, 50, 50, 50, 50, 50, 110, 110, 110, 110, 110, 50, 50, 50, 50, 50, 50, 50, 50, 50, 110, 110, 110, 110, 110, 36, 48, 60, 72, 84];
        this.tileSize = 32; // width and height of a tile in pixels

        this.mapOffset = 10; // offset (in tiles) to move the map above the top of the screen
        this.mapTop = -this.mapOffset * this.tileSize; // offset (in pixels) to move the map above the top of the screen
        this.mapHeight = Math.ceil(this.scale.height / this.tileSize) + this.mapOffset + 1; // height of the tile map (in tiles)
        this.mapWidth = Math.ceil(this.scale.width / this.tileSize); // width of the tile map (in tiles)
        this.scrollSpeed = 1; // background scrolling speed (in pixels)
        this.scrollMovement = 0; // current scroll amount
        this.spawnEnemyCounter = 0; // timer before spawning next group of enemies

        // CIRCULAR_PATTERN: {
        //     BULLET_COUNT: 6, // Reduced from 8
        //     DURATION: 10000 // 10 seconds
        // },
        // EXPLOSIVE_BULLETS: {
        //     FIRE_RATE_PENALTY: 0.6, // 40% slower instead of 50%
        //     EXPLOSION_RADIUS: 60,
        //     DURATION: 15000 // 15 seconds
        // },
        // CONE_SPRAY: {
        //     DAMAGE_MULTIPLIER: 0.6, // Increased from 0.5
        //     BULLET_COUNT: 10, // Reduced from 15
        //     CONE_ANGLE: 90, // 90 degree cone
        //     DURATION: 12000 // 12 seconds
        // },
        // EXPLOSIVE_CIRCULAR: {
        //     BULLET_COUNT: 8, // Reduced from 12
        //     FIRE_RATE_PENALTY: 0.4, // 60% slower instead of 70%
        //     EXPLOSION_RADIUS: 40,
        //     DURATION: 8000 // 8 seconds
        // }

        // Add performance optimization for bullet cleanup
        this.maxBullets = 200; // Limit total bullets on screen
        this.bulletCleanupTimer = 0;
    }

    initControllers() {
        // Initial controller detection
        this.updateConnectedControllers();

        // Listen for controller connection/disconnection
        window.addEventListener('gamepadconnected', (e) => {
            console.log(`Controller connected: ${e.gamepad.id} at index ${e.gamepad.index}`);
            this.updateConnectedControllers();
        });

        window.addEventListener('gamepaddisconnected', (e) => {
            console.log(`Controller disconnected: ${e.gamepad.id} at index ${e.gamepad.index}`);
            this.removeController(e.gamepad.index);
        });

        console.log(`${this.connectedControllers.length} controller(s) detected`);
    }

    updateConnectedControllers() {
        if (!navigator.getGamepads) return;

        const gamepads = navigator.getGamepads();
        const currentControllers = [];

        for (let i = 0; i < gamepads.length && currentControllers.length < this.maxPlayers; i++) {
            if (gamepads[i]) {
                currentControllers.push({
                    index: i,
                    gamepad: gamepads[i]
                });
            }
        }

        this.connectedControllers = currentControllers;
        console.log(`Updated controller list: ${this.connectedControllers.length} controllers`);
    }

    removeController(gamepadIndex) {
        // Find and remove player using this controller
        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i];
            if (player && player.gamepadIndex === gamepadIndex) {
                console.log(`Removing Player ${i + 1} due to controller disconnect`);
                this.removePlayer(i + 1);
                break;
            }
        }

        // Update connected controllers list
        this.updateConnectedControllers();
    }

    checkForNewPlayers() {
        // Only check every 100ms to avoid spam
        if (Date.now() - this.lastControllerCheck < 100) return;
        this.lastControllerCheck = Date.now();

        // Update controller list
        this.updateConnectedControllers();

        // Check for START button presses on unassigned controllers
        this.connectedControllers.forEach(controller => {
            const gamepad = controller.gamepad;
            if (!gamepad) return;

            // Check if this controller is already assigned to a player
            const alreadyAssigned = this.players.some(player =>
                player && player.gamepadIndex === controller.index
            );

            if (alreadyAssigned) return;

            // Check for START button press (button 9 on Xbox controllers)
            if (gamepad.buttons[9] && gamepad.buttons[9].pressed) {
                this.addNewPlayer(controller.index);
            }
        });
    }

    addNewPlayer(gamepadIndex) {
        // Find first available player slot
        for (let i = 0; i < this.maxPlayers; i++) {
            if (!this.players[i]) {
                const playerId = i + 1;
                console.log(`Adding new Player ${playerId} with controller ${gamepadIndex}`);

                this.createPlayer(playerId, gamepadIndex);

                // Show join message
                const position = this.playerStartPositions[i];
                this.showFloatingText(position.x, position.y - 50, `PLAYER ${playerId}\nJOINED!`, this.playerColors[i], 24);

                return;
            }
        }

        console.log('Cannot add new player - all slots full');
    }

    createPlayer(playerId, gamepadIndex) {
        const position = this.playerStartPositions[playerId - 1];
        const currentShipId = this.playerShipTypes[this.currentPlayerShipIndex];

        const player = new Player(this, position.x, position.y, currentShipId, playerId, gamepadIndex);

        // Set player color tint
        player.setTint(this.playerColors[playerId - 1]);

        // Apply current level progression to new player
        this.applyCurrentProgressionToPlayer(player);

        this.players[playerId - 1] = player;

        // Add to physics group if game is running
        if (this.gameStarted && this.playerGroup) {
            this.playerGroup.add(player);
        }

        // Show health bar for this player
        this.setPlayerHealthBarVisible(playerId, true);
        this.updatePlayerHealthUI(playerId, player.health, player.maxHealth);

        this.activePlayers++;
        this.updatePlayersAliveUI();

        console.log(`Created Player ${playerId} at position (${position.x}, ${position.y})`);
    }

    applyCurrentProgressionToPlayer(player) {
        // Apply current level scaling to new player
        const level = this.difficultyLevel;

        // Scale health based on current level
        const healthBonus = this.calculateHealthBonusForLevel(level);
        player.maxHealth += healthBonus;
        player.health = player.maxHealth;

        // Scale damage based on current level
        const damageBonus = Math.floor((level - 1) / 3);
        player.baseDamage += damageBonus;

        // Scale size based on current level
        const sizeBonus = Math.floor((level - 1) / 2) * 0.05;
        const newScale = 1 + sizeBonus;
        player.setScale(newScale);

        console.log(`Applied level ${level} progression to new player: ${player.health}/${player.maxHealth} HP, ${player.baseDamage} damage, ${newScale.toFixed(2)}x scale`);
    }

    calculateHealthBonusForLevel(level) {
        let totalBonus = 0;
        for (let i = 2; i <= level; i++) {
            const baseBonus = 3;
            const levelTier = Math.floor((i - 1) / 5);
            const progressiveBonus = levelTier * 2;
            totalBonus += baseBonus + progressiveBonus;
        }
        return totalBonus;
    }

    removePlayer(playerId) {
        const player = this.players[playerId - 1];
        if (player) {
            if (this.playerGroup) {
                this.playerGroup.remove(player);
            }
            player.destroy();
            this.players[playerId - 1] = null;

            // Hide health bar for this player
            this.setPlayerHealthBarVisible(playerId, false);

            this.activePlayers--;
            this.updatePlayersAliveUI();

            console.log(`Removed Player ${playerId}`);
        }
    }

    initGameUi() {
        try {
            // Create tutorial text with controller info
            const controllerCount = this.connectedControllers.length;
            let tutorialText = 'Press SPACE or any START button to begin!';

            if (controllerCount > 0) {
                tutorialText = `${controllerCount} Controller(s) Connected!\nPress START button to join game!`;
            }

            this.tutorialText = this.add.text(this.centreX, this.centreY, tutorialText, {
                fontFamily: 'Arial Black',
                fontSize: 32,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 8,
                align: 'center'
            });
            this.tutorialText.setOrigin(0.5);
            this.tutorialText.setDepth(100);

            // Create score text
            this.scoreText = this.add.text(20, 20, 'Score: 0', {
                fontFamily: 'Arial Black',
                fontSize: 28,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 8,
            });
            this.scoreText.setDepth(100);

            // Create difficulty level text
            this.levelText = this.add.text(20, 55, 'Level: 1', {
                fontFamily: 'Arial Black',
                fontSize: 20,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 6,
            });
            this.levelText.setDepth(100);

            // Create next level progress text
            this.progressText = this.add.text(20, 80, 'Next: 500', {
                fontFamily: 'Arial Black',
                fontSize: 16,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4,
            });
            this.progressText.setDepth(100);

            // Create players alive counter
            this.playersAliveText = this.add.text(this.scale.width - 20, 20, 'Players: 0', {
                fontFamily: 'Arial Black',
                fontSize: 20,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 6,
            });
            this.playersAliveText.setOrigin(1, 0);
            this.playersAliveText.setDepth(100);

            // Create game over text
            this.gameOverText = this.add.text(this.scale.width * 0.5, this.scale.height * 0.5, 'Game Over', {
                fontFamily: 'Arial Black',
                fontSize: 64,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 8,
                align: 'center'
            });
            this.gameOverText.setOrigin(0.5);
            this.gameOverText.setDepth(100);
            this.gameOverText.setVisible(false);

            // Initialize health bars for up to 4 players
            this.initPlayerHealthBars();

            console.log('Multiplayer UI initialized successfully');

        } catch (error) {
            console.error('Error initializing UI:', error);
        }
    }

    updatePlayersAliveUI() {
        const alivePlayers = this.players.filter(player => player && player.active && player.health > 0).length;
        if (this.playersAliveText) {
            this.playersAliveText.setText(`Players: ${alivePlayers}`);
        }
    }

    initPlayerHealthBars() {
        try {
            const healthBarWidth = 160;
            const healthBarHeight = 20;
            const margin = 20;
            const labelHeight = 25;

            // Positions for up to 4 players
            const positions = [
                { x: margin, y: this.scale.height - margin - healthBarHeight - labelHeight }, // Bottom left
                { x: this.scale.width - margin - healthBarWidth, y: this.scale.height - margin - healthBarHeight - labelHeight }, // Bottom right
                { x: margin, y: this.scale.height - margin - (healthBarHeight + labelHeight) * 2 - 10 }, // Above player 1
                { x: this.scale.width - margin - healthBarWidth, y: this.scale.height - margin - (healthBarHeight + labelHeight) * 2 - 10 } // Above player 2
            ];

            // Initialize health bars for all 4 potential players
            for (let i = 0; i < this.maxPlayers; i++) {
                const playerId = i + 1;
                const pos = positions[i];
                const color = this.playerColors[i];

                // Create player label
                const label = this.add.text(pos.x, pos.y - labelHeight, `Player ${playerId}`, {
                    fontFamily: 'Arial Black',
                    fontSize: 16,
                    color: Phaser.Display.Color.IntegerToRGB(color),
                    stroke: '#000000',
                    strokeThickness: 3,
                });
                label.setDepth(100);

                // Create health bar background
                const healthBarBg = this.add.rectangle(pos.x, pos.y, healthBarWidth, healthBarHeight, 0x333333);
                healthBarBg.setOrigin(0, 0);
                healthBarBg.setStrokeStyle(2, 0xffffff);
                healthBarBg.setDepth(100);

                // Create health bar fill
                const healthBarFill = this.add.rectangle(pos.x + 2, pos.y + 2, healthBarWidth - 4, healthBarHeight - 4, color);
                healthBarFill.setOrigin(0, 0);
                healthBarFill.setDepth(101);

                // Create health text
                const healthText = this.add.text(pos.x + healthBarWidth / 2, pos.y + healthBarHeight / 2, '5/5', {
                    fontFamily: 'Arial Black',
                    fontSize: 12,
                    color: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 2,
                });
                healthText.setOrigin(0.5);
                healthText.setDepth(102);

                // Store references
                this.playerHealthBars[playerId] = {
                    label: label,
                    background: healthBarBg,
                    fill: healthBarFill,
                    text: healthText,
                    maxWidth: healthBarWidth - 4,
                    visible: false // Start hidden
                };

                // Hide by default
                this.setPlayerHealthBarVisible(playerId, false);
            }

            console.log('Player health bars initialized for 4 players');

        } catch (error) {
            console.error('Error initializing health bars:', error);
            this.playerHealthBars = {};
        }
    }

    updatePlayerHealthUI(playerId, currentHealth, maxHealth) {
        const healthBar = this.playerHealthBars[playerId];
        if (!healthBar || !healthBar.visible) return;

        const healthPercentage = currentHealth / maxHealth;
        const newWidth = healthBar.maxWidth * healthPercentage;

        // Update health bar fill width
        healthBar.fill.width = Math.max(0, newWidth);

        // Update health text
        healthBar.text.setText(`${currentHealth}/${maxHealth}`);

        // Change color based on health percentage
        let color;
        if (healthPercentage > 0.6) {
            color = this.playerColors[playerId - 1]; // Original player color
        } else if (healthPercentage > 0.3) {
            color = 0xffff00; // Yellow
        } else {
            color = 0xff0000; // Red
        }

        healthBar.fill.setFillStyle(color);

        // Add pulse effect when health is low
        if (healthPercentage <= 0.3 && currentHealth > 0) {
            this.tweens.add({
                targets: [healthBar.fill, healthBar.text],
                alpha: 0.5,
                duration: 300,
                yoyo: true,
                repeat: 1
            });
        }
    }

    setPlayerHealthBarVisible(playerId, visible) {
        const healthBar = this.playerHealthBars[playerId];
        if (!healthBar) return;

        healthBar.label.setVisible(visible);
        healthBar.background.setVisible(visible);
        healthBar.fill.setVisible(visible);
        healthBar.text.setVisible(visible);
        healthBar.visible = visible;
    }

    initAnimations() {
        this.anims.create({
            key: ANIMATION.explosion.key,
            frames: this.anims.generateFrameNumbers(ANIMATION.explosion.texture, ANIMATION.explosion.config),
            frameRate: ANIMATION.explosion.frameRate,
            repeat: ANIMATION.explosion.repeat
        });
    }

    initPhysics() {
        this.enemyGroup = this.add.group();
        this.enemyBulletGroup = this.add.group();
        this.playerBulletGroup = this.add.group();
        this.bossGroup = this.add.group();
        this.playerGroup = this.add.group(); // Group for all players

        // Initialize power-up manager
        this.powerUpManager = new PowerUpManager(this);

        // Set up physics overlaps (will handle multiple players automatically through groups)
        this.physics.add.overlap(this.playerGroup, this.enemyBulletGroup, this.hitPlayer, null, this);
        this.physics.add.overlap(this.playerBulletGroup, this.enemyGroup, this.hitEnemy, null, this);
        this.physics.add.overlap(this.playerGroup, this.enemyGroup, this.hitPlayer, null, this);
        this.physics.add.overlap(this.playerGroup, this.powerUpManager.getPowerUpGroup(), this.collectPowerUp, null, this);
        this.physics.add.overlap(this.playerBulletGroup, this.bossGroup, this.hitBoss, null, this);
        this.physics.add.overlap(this.playerGroup, this.bossGroup, this.hitPlayer, null, this);
    }

    hitBoss(bullet, boss) {
        bullet.remove();
        boss.hit(bullet.getPower());
    }

    initInput() {
        this.cursors = this.input.keyboard.createCursorKeys();

        // Check for spacebar press to start game
        this.cursors.space.on('down', () => {
            if (this.waitingForStart) {
                this.startGame();
            }
        });

        // Check for controller START button to start game
        this.checkControllerStart();
    }

    checkControllerStart() {
        const checkStart = () => {
            if (!this.waitingForStart) return;

            // Update controller list
            this.updateConnectedControllers();

            // Check for START button on any controller
            this.connectedControllers.forEach(controller => {
                const gamepad = controller.gamepad;
                if (gamepad && gamepad.buttons[9] && gamepad.buttons[9].pressed) {
                    // Add the first player and start the game
                    this.createPlayer(1, controller.index);
                    this.startGame();
                    return;
                }
            });

            // Continue checking
            if (this.waitingForStart) {
                this.time.delayedCall(100, checkStart);
            }
        };

        checkStart();
    }

    // create tile map data
    initMap() {
        const mapData = [];

        for (let y = 0; y < this.mapHeight; y++) {
            const row = [];

            for (let x = 0; x < this.mapWidth; x++) {
                // randomly choose a tile id from this.tiles
                // weightedPick favours items earlier in the array
                const tileIndex = Phaser.Math.RND.weightedPick(this.tiles);

                row.push(tileIndex);
            }

            mapData.push(row);
        }
        this.map = this.make.tilemap({ data: mapData, tileWidth: this.tileSize, tileHeight: this.tileSize });
        const tileset = this.map.addTilesetImage(ASSETS.spritesheet.tiles.key);
        this.groundLayer = this.map.createLayer(0, tileset, 0, this.mapTop);
    }

    // scroll the tile map
    updateMap() {
        this.scrollMovement += this.scrollSpeed;

        if (this.scrollMovement >= this.tileSize) {
            //  Create new row on top
            let tile;
            let prev;

            // loop through map from bottom to top row
            for (let y = this.mapHeight - 2; y > 0; y--) {
                // loop through map from left to right column
                for (let x = 0; x < this.mapWidth; x++) {
                    tile = this.map.getTileAt(x, y - 1);
                    prev = this.map.getTileAt(x, y);

                    prev.index = tile.index;

                    if (y === 1) { // if top row
                        // randomly choose a tile id from this.tiles
                        // weightedPick favours items earlier in the array
                        tile.index = Phaser.Math.RND.weightedPick(this.tiles);
                    }
                }
            }

            this.scrollMovement -= this.tileSize; // reset to 0
        }

        this.groundLayer.y = this.mapTop + this.scrollMovement; // move one tile up
    }

    startGame() {
        if (this.gameStarted) return; // Prevent multiple starts

        this.gameStarted = true;
        this.waitingForStart = false;

        // Hide tutorial text
        if (this.tutorialText) {
            this.tutorialText.setVisible(false);
        }

        // Add all existing players to the player group for physics
        this.players.forEach(player => {
            if (player) {
                this.playerGroup.add(player);
            }
        });

        // Update UI
        this.updatePlayersAliveUI();

        this.addFlyingGroup();

        console.log(`Game started with ${this.activePlayers} players!`);
    }

    // Updated fireBullet method to handle explosive bullets
    fireBullet(x, y, power = 1, isExplosive = false) {
        const bullet = new PlayerBullet(this, x, y, power, isExplosive);
        this.playerBulletGroup.add(bullet);
    }

    // NEW: Fire diagonal bullets for multi-shot
    fireDiagonalBullet(x, y, angleDegrees, power = 1) {
        const bullet = new PlayerBullet(this, x, y, power);

        // Convert angle to radians and calculate velocity components
        const angleRadians = Phaser.Math.DegToRad(angleDegrees);
        const speed = 1000;
        const velocityX = Math.sin(angleRadians) * speed;
        const velocityY = -Math.cos(angleRadians) * speed; // Negative because Y increases downward

        // Set the bullet's velocity
        bullet.setVelocity(velocityX, velocityY);

        this.playerBulletGroup.add(bullet);
    }

    removeBullet(bullet) {
        this.playerBulletGroup.remove(bullet, true, true);
    }

    removeBoss(boss) {
        if (this.currentBoss === boss) {
            this.currentBoss = null;

            // Resume normal enemy spawning after a delay
            this.time.delayedCall(2000, () => {
                if (!this.currentBoss) { // Make sure no new boss spawned
                    this.addFlyingGroup();
                }
            });

            console.log('Boss defeated! Resuming normal enemy spawning.');
        }

        this.bossGroup.remove(boss, true, true);
    }

    fireEnemyBullet(x, y, power) {
        const bullet = new EnemyBullet(this, x, y, power);
        this.enemyBulletGroup.add(bullet);
    }

    // NEW: Fire enemy bullet at specific angle
    fireEnemyBulletAngled(x, y, power, angleDegrees) {
        const bullet = new EnemyBullet(this, x, y, power);

        // Convert angle to radians and calculate velocity components
        const angleRadians = Phaser.Math.DegToRad(angleDegrees);
        const speed = 200 * (0.5 + power * 0.1); // Slightly faster for higher power
        const velocityX = Math.sin(angleRadians) * speed;
        const velocityY = Math.cos(angleRadians) * speed; // Positive because enemy bullets go down

        // Set the bullet's velocity
        bullet.setVelocity(velocityX, velocityY);

        this.enemyBulletGroup.add(bullet);
    }

    removeEnemyBullet(bullet) {
        this.enemyBulletGroup.remove(bullet, true, true);
    }

    // add a group of flying enemies with varied types and higher difficulty
    addFlyingGroup() {
        // Don't spawn regular enemies if boss is active
        if (this.currentBoss) return;

        this.spawnEnemyCounter = Phaser.Math.RND.between(3, 6) * 60;

        // Choose enemy type based on difficulty level
        const availableEnemyTypes = this.getAvailableEnemyTypes();
        const randomEnemyType = Phaser.Math.RND.pick(availableEnemyTypes);

        const randomCount = Phaser.Math.RND.between(8, 20);
        const randomInterval = Phaser.Math.RND.between(6, 10) * 100;
        const randomPath = Phaser.Math.RND.between(0, 3);

        // FIXED: Much more gradual enemy power scaling
        const randomPower = Math.min(1 + Math.floor(this.difficultyLevel / 5), 4);
        const randomSpeed = Phaser.Math.RND.realInRange(0.0002, 0.002);

        this.timedEvent = this.time.addEvent({
            delay: randomInterval,
            callback: this.addEnemy,
            args: [randomEnemyType, randomPath, randomSpeed, randomPower],
            callbackScope: this,
            repeat: randomCount
        });

        console.log(`Spawning ${randomCount + 1} ${randomEnemyType.name} enemies (${randomEnemyType.shootPattern} pattern) with power ${randomPower}`);
    }

    // NEW: Get available enemy types based on difficulty level
    getAvailableEnemyTypes() {
        const maxTypeIndex = Math.min(Math.floor((this.difficultyLevel - 1) / 2), this.enemyShipTypes.length - 1);
        return this.enemyShipTypes.slice(0, maxTypeIndex + 1);
    }

    addEnemy(enemyType, pathId, speed, power) {
        // Use scaled health and color based on difficulty level
        const enemyHealth = this.getCurrentEnemyHealth();
        const enemyColor = this.getCurrentEnemyColor();

        const enemy = new EnemyFlying(this, enemyType, pathId, speed, power, enemyHealth, enemyColor);
        this.enemyGroup.add(enemy);
    }

    removeEnemy(enemy) {
        this.enemyGroup.remove(enemy, true, true);
    }

    addExplosion(x, y) {
        new Explosion(this, x, y);
    }

    hitPlayer(player, obstacle) {
        // Player now handles damage and invulnerability
        player.hit(obstacle.getPower());

        // Only destroy the obstacle if it's not an enemy (bullets should be destroyed, enemies shouldn't)
        if (obstacle instanceof EnemyBullet) {
            obstacle.die();
        }
    }

    hitEnemy(bullet, enemy) {
        this.updateScore(10);
        bullet.remove();

        // Use the bullet's power directly (already boosted from player)
        enemy.hit(bullet.getPower());
    }

    updateScore(points) {
        // Scale down the points awarded for each enemy
        const scaledPoints = Math.floor(points * 0.5); // Reduce score by 50%
        this.score += scaledPoints;
        this.scoreText.setText(`Score: ${this.score}`);

        // Check for difficulty level up
        this.checkDifficultyLevelUp();
    }

    checkDifficultyLevelUp() {
        const nextThreshold = this.calculateFibonacci(this.difficultyLevel);

        if (this.score >= nextThreshold) {
            this.levelUp();

            // Check for boss spawn after level up
            this.checkBossSpawn();
        }

        // Update progress text
        const currentThreshold = this.calculateFibonacci(this.difficultyLevel);
        this.progressText.setText(`Next: ${currentThreshold}`);
    }

    // NEW: Level up system with player bonuses and ship changes
    levelUp() {
        const oldLevel = this.difficultyLevel;
        this.difficultyLevel++;

        // Update UI
        this.levelText.setText(`Level: ${this.difficultyLevel}`);

        // Change player ship every 6 levels for ALL players
        if (this.difficultyLevel % 6 === 1 && this.difficultyLevel > 1) {
            this.upgradeAllPlayerShips();
        }

        // All players get bonuses when leveling up
        this.giveAllPlayersLevelUpBonus();

        // Visual celebration
        this.showLevelUpEffect();

        console.log(`LEVEL UP! ${oldLevel} → ${this.difficultyLevel}`);
        console.log(`Enemy health now: ${this.getCurrentEnemyHealth()}`);
        console.log(`Enemy color: ${this.getCurrentEnemyColor().toString(16)}`);
    }

    // NEW: Upgrade all player ships every 6 levels
    upgradeAllPlayerShips() {
        this.currentPlayerShipIndex = (this.currentPlayerShipIndex + 1) % this.playerShipTypes.length;
        const newShipId = this.playerShipTypes[this.currentPlayerShipIndex];

        this.players.forEach((player, index) => {
            if (player && player.active) {
                this.upgradePlayerShip(player, newShipId);
            }
        });

        console.log(`All players upgraded to ship type ${newShipId} (index ${this.currentPlayerShipIndex})`);
    }

    upgradePlayerShip(player, newShipId) {
        // Store player stats
        const playerStats = {
            health: player.health,
            maxHealth: player.maxHealth,
            bulletPower: player.bulletPower,
            fireRate: player.fireRate,
            baseDamage: player.baseDamage || 1,
            scaleX: player.scaleX,
            scaleY: player.scaleY,
            x: player.x,
            y: player.y,
            playerId: player.playerId,
            gamepadIndex: player.gamepadIndex,
            tint: player.tintTopLeft,

            // PRESERVE ATTACK TYPES
            hasCircularPattern: player.hasCircularPattern,
            hasConeSpray: player.hasConeSpray,
            hasExplosiveCircular: player.hasExplosiveCircular,
            hasExplosiveBullets: player.hasExplosiveBullets,

            // PRESERVE FIRE RATE BACKUPS
            originalFireRate: player.originalFireRate,
            originalFireRateCircular: player.originalFireRateCircular
        };

        // Remove old player from groups
        this.playerGroup.remove(player);

        // Destroy old player
        player.destroy();

        // Create new player with upgraded ship
        const newPlayer = new Player(this, playerStats.x, playerStats.y, newShipId, playerStats.playerId, playerStats.gamepadIndex);

        // Restore player stats
        newPlayer.health = playerStats.health;
        newPlayer.maxHealth = playerStats.maxHealth;
        newPlayer.bulletPower = playerStats.bulletPower;
        newPlayer.fireRate = playerStats.fireRate;
        newPlayer.baseDamage = playerStats.baseDamage;
        newPlayer.setScale(playerStats.scaleX, playerStats.scaleY);
        newPlayer.setTint(playerStats.tint);

        // RESTORE ATTACK TYPES
        newPlayer.hasCircularPattern = playerStats.hasCircularPattern;
        newPlayer.hasConeSpray = playerStats.hasConeSpray;
        newPlayer.hasExplosiveCircular = playerStats.hasExplosiveCircular;
        newPlayer.hasExplosiveBullets = playerStats.hasExplosiveBullets;

        // RESTORE FIRE RATE BACKUPS
        newPlayer.originalFireRate = playerStats.originalFireRate;
        newPlayer.originalFireRateCircular = playerStats.originalFireRateCircular;

        // Update hitbox for current scale
        const hitboxScale = Math.min(playerStats.scaleX, 1.3);
        newPlayer.body.setSize(64 * hitboxScale, 64 * hitboxScale);

        // Replace in players array
        this.players[playerStats.playerId - 1] = newPlayer;

        // Add to player group
        this.playerGroup.add(newPlayer);

        // Update health UI
        this.updatePlayerHealthUI(newPlayer.playerId, newPlayer.health, newPlayer.maxHealth);

        // Show ship upgrade effect
        this.showShipUpgradeEffect(newPlayer);

        console.log(`Player ${playerStats.playerId} ship upgraded to type ${newShipId}`);
    }

    // NEW: Ship upgrade visual effect for specific player
    showShipUpgradeEffect(player) {
        // Bright flash around player
        const upgradeFlash = this.add.circle(player.x, player.y, 80, 0x00ffff, 0.8);
        upgradeFlash.setDepth(150);

        this.tweens.add({
            targets: upgradeFlash,
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            duration: 1000,
            ease: 'Power3',
            onComplete: () => upgradeFlash.destroy()
        });

        // Ship upgrade text
        this.showFloatingText(player.x, player.y - 50, 'SHIP UPGRADE!', 0x00ffff, 22);
    }

    // NEW: Give all players bonuses on level up
    giveAllPlayersLevelUpBonus() {
        this.players.forEach(player => {
            if (player && player.active) {
                this.givePlayerLevelUpBonus(player);
            }
        });
    }

    givePlayerLevelUpBonus(player) {
        if (!player) return;

        // Scale player size every 2 levels (5% bigger)
        if (this.difficultyLevel % 2 === 0) {
            this.scalePlayerSize(player);
        }

        // Progressive health bonus (scales with level)
        const healthBonus = this.calculateHealthBonus();
        player.maxHealth += healthBonus;

        // Progressive damage bonus every 3 levels
        if (this.difficultyLevel % 3 === 0) {
            this.increasePlayerDamage(player);
        }

        // Full heal on level up
        player.health = player.maxHealth;

        // Update health UI
        this.updatePlayerHealthUI(player.playerId, player.health, player.maxHealth);

        // Show bonus text with all upgrades
        const bonusText = this.createLevelUpBonusText(healthBonus);
        this.showFloatingText(player.x, player.y - 30, bonusText, 0x00ff00, 24);

        console.log(`Player ${player.playerId} Level ${this.difficultyLevel} bonuses: +${healthBonus} HP, Scale: ${player.scaleX.toFixed(2)}x, Damage: ${player.baseDamage || 1}`);
    }

    // NEW: Scale specific player size by 5% every 2 levels
    scalePlayerSize(player) {
        const currentScale = player.scaleX;
        const newScale = currentScale * 1.05; // 5% bigger

        player.setScale(newScale);

        // Update hitbox proportionally (keep it fair)
        const hitboxScale = Math.min(newScale, 1.3); // Cap hitbox growth at 30%
        player.body.setSize(
            player.body.width * (hitboxScale / currentScale),
            player.body.height * (hitboxScale / currentScale)
        );

        console.log(`Player ${player.playerId} scaled to ${newScale.toFixed(2)}x (hitbox: ${hitboxScale.toFixed(2)}x)`);
    }

    // NEW: Calculate progressive health bonus
    calculateHealthBonus() {
        // Base bonus starts at 3, increases every 5 levels
        const baseBonus = 3;
        const levelTier = Math.floor((this.difficultyLevel - 1) / 5);
        const progressiveBonus = levelTier * 2; // +2 per tier

        return baseBonus + progressiveBonus;
    }

    // NEW: Increase specific player damage every 3 levels
    increasePlayerDamage(player) {
        if (!player.baseDamage) {
            player.baseDamage = 1; // Initialize base damage
        }

        player.baseDamage += 1;
        console.log(`Player ${player.playerId} base damage increased to ${player.baseDamage}`);
    }

    // NEW: Create comprehensive level up bonus text
    createLevelUpBonusText(healthBonus) {
        let bonusText = `LEVEL UP!\n+${healthBonus} MAX HP\nFULL HEAL!`;

        // Add size bonus text every 2 levels
        if (this.difficultyLevel % 2 === 0) {
            bonusText += '\nSIZE UP!';
        }

        // Add damage bonus text every 3 levels
        if (this.difficultyLevel % 3 === 0) {
            bonusText += '\nDAMAGE UP!';
        }

        // Add ship upgrade text every 6 levels
        if (this.difficultyLevel % 6 === 1 && this.difficultyLevel > 1) {
            bonusText += '\nNEW SHIP!';
        }

        return bonusText;
    }

    // NEW: Show level up visual effects
    showLevelUpEffect() {
        // Screen flash
        const flash = this.add.rectangle(this.scale.width/2, this.scale.height/2, this.scale.width, this.scale.height, 0xffffff, 0.3);
        flash.setDepth(1000);

        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => flash.destroy()
        });

        // Screen shake
        this.cameras.main.shake(300, 0.02);

        // Level up text
        const levelUpText = this.add.text(this.scale.width * 0.5, this.scale.height * 0.3, `LEVEL ${this.difficultyLevel}!`, {
            fontFamily: 'Arial Black', fontSize: 48, color: '#ffff00',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(1001);

        this.tweens.add({
            targets: levelUpText,
            scaleX: 1.2,
            scaleY: 1.2,
            alpha: 0,
            y: levelUpText.y - 50,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => levelUpText.destroy()
        });
    }

    // NEW: Get current enemy health based on difficulty level
    getCurrentEnemyHealth() {
        // Scale enemy health dynamically based on difficulty level
        return Math.floor(3 * Math.pow(1.6, this.difficultyLevel - 1));
    }

    calculateFibonacci(n) {
        // Dynamically calculate the nth Fibonacci number
        if (n <= 1) return 500;
        let a = 500, b = 700;
        for (let i = 2; i <= n; i++) {
            [a, b] = [b, a + b];
        }
        return b;
    }

    // NEW: Get current enemy color based on difficulty level
    getCurrentEnemyColor() {
        const index = Math.min(this.difficultyLevel - 1, this.enemyColorsByLevel.length - 1);
        return this.enemyColorsByLevel[index];
    }

    // NEW: Generic floating text method
    showFloatingText(x, y, text, color, fontSize = 20) {
        const floatingText = this.add.text(x, y, text, {
            fontFamily: 'Arial Black',
            fontSize: fontSize,
            color: Phaser.Display.Color.IntegerToRGB(color),
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5).setDepth(30);

        this.tweens.add({
            targets: floatingText,
            y: floatingText.y - 60,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => floatingText.destroy()
        });
    }

    // NEW: Player death handler
    onPlayerDeath(playerId) {
        console.log(`Player ${playerId} has died!`);

        // Hide health bar for dead player
        this.setPlayerHealthBarVisible(playerId, false);

        // Mark player as null in array but don't decrement activePlayers yet
        // (the destroyed player will be cleaned up automatically)
        const player = this.players[playerId - 1];
        if (player) {
            this.players[playerId - 1] = null;
        }

        // Use a small delay to ensure proper cleanup before checking game over
        this.time.delayedCall(100, () => {
            this.checkGameOver();
        });
    }

    // NEW: Check if all players are dead
    checkGameOver() {
        // Count actually alive players (not null and still active with health > 0)
        const alivePlayers = this.players.filter(player =>
            player &&
            player.active &&
            player.health > 0
        );

        // Update players alive counter
        this.updatePlayersAliveUI();

        console.log(`Alive players: ${alivePlayers.length}, Active players: ${this.activePlayers}`);

        // Game over if no players are alive AND game has started
        if (alivePlayers.length === 0 && this.gameStarted) {
            this.time.delayedCall(1000, () => {
                this.GameOver();
            });
        }
    }

    updatePlayersAliveUI() {
        const alivePlayers = this.players.filter(player =>
            player &&
            player.active &&
            player.health > 0
        ).length;

        if (this.playersAliveText) {
            this.playersAliveText.setText(`Players: ${alivePlayers}`);
        }
    }

    GameOver() {
        this.gameStarted = false;
        this.gameOverText.setVisible(true);

        // Add restart functionality
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.restart();
        });

        // Show restart instruction
        if (!this.restartText) {
            this.restartText = this.add.text(this.scale.width * 0.5, this.scale.height * 0.5 + 80, 'Press SPACE to restart', {
                fontFamily: 'Arial Black', fontSize: 32, color: '#ffffff',
                stroke: '#000000', strokeThickness: 6,
                align: 'center'
            })
                .setOrigin(0.5)
                .setDepth(100);
        }
        this.restartText.setVisible(true);

        console.log('Game Over - All players defeated!');
    }

    checkBossSpawn() {
        if (this.difficultyLevel % 5 === 0 && this.difficultyLevel > this.lastBossLevel && !this.currentBoss) {
            this.spawnBoss();
            this.lastBossLevel = this.difficultyLevel;
        }
    }

    showBossWarning(bossType) {
        // Warning text
        const warningText = this.add.text(this.scale.width / 2, this.scale.height / 2,
            'WARNING!\nBOSS APPROACHING!', {
                fontFamily: 'Arial Black',
                fontSize: 48,
                color: '#ff0000',
                stroke: '#000000',
                strokeThickness: 8,
                align: 'center'
            }).setOrigin(0.5).setDepth(1000);

        // Boss type text
        const bossTypeText = this.add.text(this.scale.width / 2, this.scale.height / 2 + 100,
            bossType.name.toUpperCase(), {
                fontFamily: 'Arial Black',
                fontSize: 32,
                color: Phaser.Display.Color.IntegerToRGB(bossType.color),
                stroke: '#000000',
                strokeThickness: 6,
                align: 'center'
            }).setOrigin(0.5).setDepth(1000);

        // Screen effects
        this.cameras.main.shake(500, 0.01);

        // Flash effect
        const flash = this.add.rectangle(this.scale.width/2, this.scale.height/2,
            this.scale.width, this.scale.height, 0xff0000, 0.3);
        flash.setDepth(999);

        // Animate warning
        this.tweens.add({
            targets: [warningText, bossTypeText],
            scaleX: 1.2,
            scaleY: 1.2,
            alpha: 0,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => {
                warningText.destroy();
                bossTypeText.destroy();
            }
        });

        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => flash.destroy()
        });
    }

    spawnBoss() {
        if (this.currentBoss) return; // Don't spawn if boss already exists

        // Get the current boss type (rotates through all 4)
        const bossType = BOSS_TYPES[this.bossTypeIndex];
        this.bossTypeIndex = (this.bossTypeIndex + 1) % BOSS_TYPES.length;

        // Create the boss
        this.currentBoss = new BossEnemy(this, bossType, this.difficultyLevel);
        this.bossGroup.add(this.currentBoss);

        // Stop regular enemy spawning while boss is active
        if (this.timedEvent) {
            this.timedEvent.destroy();
            this.timedEvent = null;
        }

        // Show boss warning
        this.showBossWarning(bossType);

        console.log(`Boss spawned: ${bossType.name} at level ${this.difficultyLevel}`);
    }

    collectPowerUp(player, powerUp) {
        this.powerUpManager.handleCollision(player, powerUp);
    }
}