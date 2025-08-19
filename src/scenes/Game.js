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
    this.initPlayer();
    this.initInput();
    this.initPhysics();
    this.initMap();
}

    update() {
        this.updateMap();

        if (!this.gameStarted) return;

        this.player.update();

        // Enemy spawning
        if (this.spawnEnemyCounter > 0) this.spawnEnemyCounter--;
        else this.addFlyingGroup();

        // Power-up spawning
        this.powerUpManager.update(this.game.loop.delta);
    }

    initVariables() {
        this.score = 0;
        this.centreX = this.scale.width * 0.5;
        this.centreY = this.scale.height * 0.5;
        this.currentBoss = null;
        this.bossGroup = null;
        this.lastBossLevel = 0;
        this.bossTypeIndex = 0;
        // Player health UI configuration
        this.playerHealthBars = {}; // Store health bar references for each player

        // Power-up system
        this.powerUpManager = null;

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

        this.map; // reference to tile map
        this.groundLayer; // reference to ground layer of tile map
    }

    initGameUi() {
        try {
            // Create tutorial text
            this.tutorialText = this.add.text(this.centreX, this.centreY, 'Tap to shoot!', {
                fontFamily: 'Arial Black',
                fontSize: 42,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 8,
                align: 'center'
            });
            this.tutorialText.setOrigin(0.5);
            this.tutorialText.setDepth(100);
            this.temporaryPowerUps = {};
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
            this.progressText = this.add.text(20, 80, 'Next: 1000', {
                fontFamily: 'Arial Black',
                fontSize: 16,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4,
            });
            this.progressText.setDepth(100);

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

            console.log('Basic UI initialized successfully');

        } catch (error) {
            console.error('Error initializing UI:', error);

            // Create minimal fallback UI
            this.tutorialText = this.add.text(640, 360, 'Tap to shoot!', { fontSize: 32, color: '#ffffff' });
            this.scoreText = this.add.text(20, 20, 'Score: 0', { fontSize: 24, color: '#ffffff' });
            this.levelText = this.add.text(20, 50, 'Level: 1', { fontSize: 20, color: '#ffffff' });
            this.progressText = this.add.text(20, 75, 'Next: 1000', { fontSize: 16, color: '#ffffff' });
            this.gameOverText = this.add.text(640, 360, 'Game Over', { fontSize: 48, color: '#ffffff' });
            this.gameOverText.setVisible(false);
        }
    }




// NEW: Initialize the temporary power-up display
    initTemporaryPowerUpUI() {
        this.temporaryPowerUps = {}; // Track active temporary power-ups
        this.powerUpUIContainer = this.add.group(); // Container for all power-up UI elements

        console.log('Temporary power-up UI initialized');
    }

// NEW: Add a temporary power-up to the UI
    addTemporaryPowerUpUI(powerUpType, duration, color, displayName) {
        const startTime = Date.now();
        const endTime = startTime + duration;

        // Calculate position (stack them vertically on the right side)
        const activeCount = Object.keys(this.temporaryPowerUps).length;
        const x = this.scale.width - 20;
        const y = 120 + (activeCount * 40); // Start below level text, 40px apart

        // Create background bar
        const bgBar = this.add.rectangle(x, y, 180, 30, 0x000000, 0.7)
            .setOrigin(1, 0.5)
            .setDepth(150);

        // Create progress bar
        const progressBar = this.add.rectangle(x - 2, y, 176, 26, color, 0.8)
            .setOrigin(1, 0.5)
            .setDepth(151);

        // Create icon/symbol
        const icon = this.add.text(x - 170, y, this.getPowerUpIcon(powerUpType), {
            fontFamily: 'Arial Black',
            fontSize: 16,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0, 0.5).setDepth(152);

        // Create time text
        const timeText = this.add.text(x - 10, y, '10s', {
            fontFamily: 'Arial Black',
            fontSize: 14,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(1, 0.5).setDepth(152);

        // Create name text
        const nameText = this.add.text(x - 150, y, displayName, {
            fontFamily: 'Arial',
            fontSize: 12,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0, 0.5).setDepth(152);

        // Store the UI elements
        this.temporaryPowerUps[powerUpType] = {
            startTime: startTime,
            endTime: endTime,
            duration: duration,
            bgBar: bgBar,
            progressBar: progressBar,
            icon: icon,
            timeText: timeText,
            nameText: nameText,
            originalWidth: 176
        };

        // Add to container for easy management
        this.powerUpUIContainer.addMultiple([bgBar, progressBar, icon, timeText, nameText]);

        console.log(`Added temporary power-up UI: ${displayName} for ${duration/1000}s`);
    }

// NEW: Remove a temporary power-up from the UI
    removeTemporaryPowerUpUI(powerUpType) {
        const powerUpUI = this.temporaryPowerUps[powerUpType];
        if (!powerUpUI) return;

        // Destroy all UI elements
        powerUpUI.bgBar.destroy();
        powerUpUI.progressBar.destroy();
        powerUpUI.icon.destroy();
        powerUpUI.timeText.destroy();
        powerUpUI.nameText.destroy();

        // Remove from tracking
        delete this.temporaryPowerUps[powerUpType];

        // Reposition remaining power-ups
        this.repositionTemporaryPowerUpUI();

        console.log(`Removed temporary power-up UI: ${powerUpType}`);
    }

// NEW: Update all temporary power-up timers
    updateTemporaryPowerUpUI() {
        const currentTime = Date.now();

        Object.keys(this.temporaryPowerUps).forEach(powerUpType => {
            const powerUpUI = this.temporaryPowerUps[powerUpType];
            const timeRemaining = Math.max(0, powerUpUI.endTime - currentTime);
            const progress = timeRemaining / powerUpUI.duration;

            // Update progress bar width
            powerUpUI.progressBar.width = powerUpUI.originalWidth * progress;

            // Update time text
            const seconds = Math.ceil(timeRemaining / 1000);
            powerUpUI.timeText.setText(`${seconds}s`);

            // Change color based on time remaining
            if (progress <= 0.2) {
                powerUpUI.progressBar.setFillStyle(0xff4444); // Red when almost expired
                powerUpUI.timeText.setColor('#ff4444');
            } else if (progress <= 0.5) {
                powerUpUI.progressBar.setFillStyle(0xffaa44); // Orange when half expired
                powerUpUI.timeText.setColor('#ffaa44');
            }

            // Remove if expired
            if (timeRemaining <= 0) {
                this.removeTemporaryPowerUpUI(powerUpType);
            }
        });
    }

// NEW: Reposition power-up UIs after one is removed
    repositionTemporaryPowerUpUI() {
        let index = 0;
        Object.values(this.temporaryPowerUps).forEach(powerUpUI => {
            const newY = 120 + (index * 40);

            // Animate to new position
            this.tweens.add({
                targets: [powerUpUI.bgBar, powerUpUI.progressBar, powerUpUI.icon, powerUpUI.timeText, powerUpUI.nameText],
                y: newY,
                duration: 200,
                ease: 'Power2'
            });

            index++;
        });
    }

// NEW: Get icon for each power-up type
    getPowerUpIcon(powerUpType) {
        switch (powerUpType) {
            case 'circularPattern': return '⭕';
            case 'explosiveBullets': return '💥';
            case 'coneSpray': return '🌊';
            case 'explosiveCircular': return '💫';
            default: return '⚡';
        }
    }
    initPlayerHealthBars() {
        try {
            const healthBarWidth = 200;
            const healthBarHeight = 24;
            const margin = 20;
            const labelHeight = 30;

            // Position for Player 1 (bottom left)
            const pos = { x: margin, y: this.scale.height - margin - healthBarHeight - labelHeight };
            const color = 0x00ff00; // Green for Player 1

            // Create player label
            const label = this.add.text(pos.x, pos.y - labelHeight, 'Player 1', {
                fontFamily: 'Arial Black',
                fontSize: 18,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4,
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
                fontSize: 14,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2,
            });
            healthText.setOrigin(0.5);
            healthText.setDepth(102);

            // Store references for Player 1 only
            this.playerHealthBars = {
                1: {
                    label: label,
                    background: healthBarBg,
                    fill: healthBarFill,
                    text: healthText,
                    maxWidth: healthBarWidth - 4,
                    visible: true
                }
            };

            console.log('Player health bars initialized');

        } catch (error) {
            console.error('Error initializing health bars:', error);
            this.playerHealthBars = {};
        }
    }

    updatePlayerHealthUI(playerId, currentHealth, maxHealth) {
        const healthBar = this.playerHealthBars[playerId];
        if (!healthBar) return;

        const healthPercentage = currentHealth / maxHealth;
        const newWidth = healthBar.maxWidth * healthPercentage;

        // Update health bar fill width
        healthBar.fill.width = Math.max(0, newWidth);

        // Update health text
        healthBar.text.setText(`${currentHealth}/${maxHealth}`);

        // Change color based on health percentage
        let color;
        if (healthPercentage > 0.6) {
            color = 0x00ff00; // Green
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

    // Method to show/hide health bars for specific players (for future multiplayer)
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
        // Initialize power-up manager
        this.powerUpManager = new PowerUpManager(this);

        this.physics.add.overlap(this.player, this.enemyBulletGroup, this.hitPlayer, null, this);
        this.physics.add.overlap(this.playerBulletGroup, this.enemyGroup, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemyGroup, this.hitPlayer, null, this);
        this.physics.add.overlap(this.player, this.powerUpManager.getPowerUpGroup(), this.collectPowerUp, null, this);
        this.physics.add.overlap(this.playerBulletGroup, this.bossGroup, this.hitBoss, null, this);
        this.physics.add.overlap(this.player, this.bossGroup, this.hitPlayer, null, this);
    }
    hitBoss(bullet, boss) {
        bullet.remove();

        // Use the bullet's power directly (already boosted from player)
        boss.hit(bullet.getPower());

        // Don't give score for hitting boss (only when killed)
    }
    initPlayer() {
        const currentShipId = this.playerShipTypes[this.currentPlayerShipIndex];
        this.player = new Player(this, this.centreX, this.scale.height - 100, currentShipId, 1); // Pass player ID
    }

    initInput() {
        this.cursors = this.input.keyboard.createCursorKeys();

        // check for spacebar press only once
        this.cursors.space.once('down', (key, event) => {
            this.startGame();
        });
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
        this.gameStarted = true;

        // Check if tutorialText exists before trying to hide it
        if (this.tutorialText) {
            this.tutorialText.setVisible(false);
        }

        this.addFlyingGroup();
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
        this.enemyBulletGroup.remove(bullet, true, true); // Fixed: was removing from playerBulletGroup
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
        const randomPower = Math.min(1 + Math.floor(this.difficultyLevel / 5), 4); // Was: Math.min(1 + Math.floor(level / 2), 8)
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

        // Change player ship every 6 levels
        if (this.difficultyLevel % 6 === 1 && this.difficultyLevel > 1) {
            this.upgradePlayerShip();
        }

        // Player gets bonuses when leveling up
        this.givePlayerLevelUpBonus();

        // Visual celebration
        this.showLevelUpEffect();

        console.log(`LEVEL UP! ${oldLevel} → ${this.difficultyLevel}`);
        console.log(`Enemy health now: ${this.getCurrentEnemyHealth()}`);
        console.log(`Enemy color: ${this.getCurrentEnemyColor().toString(16)}`);
    }

    // NEW: Upgrade player ship every 6 levels with enhanced stats preservation
// UPDATE the upgradePlayerShip() method in Game.js to preserve attack types:

    upgradePlayerShip() {
        this.currentPlayerShipIndex = (this.currentPlayerShipIndex + 1) % this.playerShipTypes.length;
        const newShipId = this.playerShipTypes[this.currentPlayerShipIndex];

        // Store player stats - DON'T store scale values, recalculate them
        const playerStats = {
            health: this.player.health,
            maxHealth: this.player.maxHealth,
            bulletPower: this.player.bulletPower,
            fireRate: this.player.fireRate,
            baseDamage: this.player.baseDamage || 1,
            scaleX: this.player.scaleX,
            scaleY: this.player.scaleY,
            x: this.player.x,
            y: this.player.y,
            level: this.difficultyLevel, // Store level for scale calculation

            // PRESERVE ATTACK TYPES
            hasCircularPattern: this.player.hasCircularPattern,
            hasConeSpray: this.player.hasConeSpray,
            hasExplosiveCircular: this.player.hasExplosiveCircular,
            hasExplosiveBullets: this.player.hasExplosiveBullets,

            // PRESERVE FIRE RATE BACKUPS
            originalFireRate: this.player.originalFireRate,
            originalFireRateCircular: this.player.originalFireRateCircular
        };

        // Remove old player
        this.player.destroy();

        // Create new player with upgraded ship
        this.player = new Player(this, playerStats.x, playerStats.y, newShipId, 1);

        // Restore player stats
        this.player.health = playerStats.health;
        this.player.maxHealth = playerStats.maxHealth;
        this.player.bulletPower = playerStats.bulletPower;
        this.player.fireRate = playerStats.fireRate;
        this.player.baseDamage = playerStats.baseDamage;

        // Restore scaling
        this.player.setScale(playerStats.scaleX, playerStats.scaleY);

        // RESTORE ATTACK TYPES
        this.player.hasCircularPattern = playerStats.hasCircularPattern;
        this.player.hasConeSpray = playerStats.hasConeSpray;
        this.player.hasExplosiveCircular = playerStats.hasExplosiveCircular;
        this.player.hasExplosiveBullets = playerStats.hasExplosiveBullets;

        // RESTORE FIRE RATE BACKUPS
        this.player.originalFireRate = playerStats.originalFireRate;
        this.player.originalFireRateCircular = playerStats.originalFireRateCircular;

        // Update hitbox for current scale
        const hitboxScale = Math.min(playerStats.scaleX, 1.3);
        this.player.body.setSize(
            64 * hitboxScale, // Base ship size is 64x64
            64 * hitboxScale
        );

        // Update health UI
        this.updatePlayerHealthUI(this.player.playerId, this.player.health, this.player.maxHealth);

        // Reinitialize physics collision
        this.physics.add.overlap(this.player, this.enemyBulletGroup, this.hitPlayer, null, this);
        this.physics.add.overlap(this.player, this.enemyGroup, this.hitPlayer, null, this);
        this.physics.add.overlap(this.player, this.powerUpManager.getPowerUpGroup(), this.collectPowerUp, null, this);

        // Show ship upgrade effect
        this.showShipUpgradeEffect();

        console.log(`Player ship upgraded to type ${newShipId} (index ${this.currentPlayerShipIndex})`);
        console.log(`Ship scale: ${playerStats.scaleX.toFixed(2)}x, Base damage: ${playerStats.baseDamage}`);
        console.log(`Attack types preserved: Circular=${this.player.hasCircularPattern}, Cone=${this.player.hasConeSpray}, ExplosiveCirc=${this.player.hasExplosiveCircular}, ExplosiveBullets=${this.player.hasExplosiveBullets}`);
    }

    // NEW: Ship upgrade visual effect
    showShipUpgradeEffect() {
        // Bright flash around player
        const upgradeFlash = this.add.circle(this.player.x, this.player.y, 80, 0x00ffff, 0.8);
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
        this.showFloatingText(this.player.x, this.player.y - 50, 'SHIP UPGRADE!', 0x00ffff, 22);
    }

    // NEW: Give player bonuses on level up with progressive scaling
    givePlayerLevelUpBonus() {
        if (!this.player) return;

        // Scale player size every 2 levels (5% bigger)
        if (this.difficultyLevel % 2 === 0) {
            this.scalePlayerSize();
        }

        // Progressive health bonus (scales with level)
        const healthBonus = this.calculateHealthBonus();
        this.player.maxHealth += healthBonus;

        // Progressive damage bonus every 3 levels
        if (this.difficultyLevel % 3 === 0) {
            this.increasePlayerDamage();
        }

        // Full heal on level up
        this.player.health = this.player.maxHealth;

        // Update health UI
        this.updatePlayerHealthUI(this.player.playerId, this.player.health, this.player.maxHealth);

        // Show bonus text with all upgrades
        const bonusText = this.createLevelUpBonusText(healthBonus);
        this.showFloatingText(this.player.x, this.player.y - 30, bonusText, 0x00ff00, 24);

        console.log(`Level ${this.difficultyLevel} bonuses: +${healthBonus} HP, Scale: ${this.player.scaleX.toFixed(2)}x, Damage: ${this.player.baseDamage || 1}`);
    }

    // NEW: Scale player size by 5% every 2 levels
    scalePlayerSize() {
        const currentScale = this.player.scaleX;
        const newScale = currentScale * 1.05; // 5% bigger

        this.player.setScale(newScale);

        // Update hitbox proportionally (keep it fair)
        const hitboxScale = Math.min(newScale, 1.3); // Cap hitbox growth at 30%
        this.player.body.setSize(
            this.player.body.width * (hitboxScale / currentScale),
            this.player.body.height * (hitboxScale / currentScale)
        );

        console.log(`Player scaled to ${newScale.toFixed(2)}x (hitbox: ${hitboxScale.toFixed(2)}x)`);
    }

    // NEW: Calculate progressive health bonus
    calculateHealthBonus() {
        // Base bonus starts at 3, increases every 5 levels
        const baseBonus = 3;
        const levelTier = Math.floor((this.difficultyLevel - 1) / 5);
        const progressiveBonus = levelTier * 2; // +2 per tier

        return baseBonus + progressiveBonus;
    }

    // NEW: Increase player damage every 3 levels
    increasePlayerDamage() {
        if (!this.player.baseDamage) {
            this.player.baseDamage = 1; // Initialize base damage
        }

        this.player.baseDamage += 1;
        console.log(`Player base damage increased to ${this.player.baseDamage}`);
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
    collectPowerUp(player, powerUp) {
        this.powerUpManager.handleCollision(player, powerUp);
    }
}