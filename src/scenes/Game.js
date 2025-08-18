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

export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    create() {
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

        // NEW: Fibonacci scaling system
        this.difficultyLevel = 1;
        this.fibonacciSequence = [1000, 2000, 3000, 5000, 8000, 13000, 21000, 34000, 55000, 89000, 144000, 233000, 377000]; // Score thresholds
        this.enemyHealthByLevel = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377]; // Health scaling
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
        // Create tutorial text
        this.tutorialText = this.add.text(this.centreX, this.centreY, 'Tap to shoot!', {
            fontFamily: 'Arial Black', fontSize: 42, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        })
            .setOrigin(0.5)
            .setDepth(100);

        // Create score text
        this.scoreText = this.add.text(20, 20, 'Score: 0', {
            fontFamily: 'Arial Black', fontSize: 28, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
        })
            .setDepth(100);

        // NEW: Create difficulty level text
        this.levelText = this.add.text(20, 55, 'Level: 1', {
            fontFamily: 'Arial Black', fontSize: 20, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6,
        })
            .setDepth(100);

        // NEW: Create next level progress text
        this.progressText = this.add.text(20, 80, 'Next: 1000', {
            fontFamily: 'Arial Black', fontSize: 16, color: '#ffffff',
            stroke: '#000000', strokeThickness: 4,
        })
            .setDepth(100);

        // Create game over text
        this.gameOverText = this.add.text(this.scale.width * 0.5, this.scale.height * 0.5, 'Game Over', {
            fontFamily: 'Arial Black', fontSize: 64, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        })
            .setOrigin(0.5)
            .setDepth(100)
            .setVisible(false);

        // Initialize health bars for up to 4 players (positioned for future multiplayer)
        this.initPlayerHealthBars();
    }

    initPlayerHealthBars() {
        const healthBarWidth = 200;
        const healthBarHeight = 24;
        const margin = 20;
        const labelHeight = 30;

        // Positions for up to 4 players
        const positions = [
            { x: margin, y: this.scale.height - margin - healthBarHeight - labelHeight }, // Bottom left - Player 1
            { x: this.scale.width - margin - healthBarWidth, y: this.scale.height - margin - healthBarHeight - labelHeight }, // Bottom right - Player 2
            { x: margin, y: margin + labelHeight }, // Top left - Player 3
            { x: this.scale.width - margin - healthBarWidth, y: margin + labelHeight } // Top right - Player 4
        ];

        const colors = [
            0x00ff00, // Green for Player 1
            0x0066ff, // Blue for Player 2
            0xff6600, // Orange for Player 3
            0xff0066  // Pink for Player 4
        ];

        for (let i = 1; i <= 4; i++) {
            const pos = positions[i - 1];
            
            // Create player label
            const label = this.add.text(pos.x, pos.y - labelHeight, `Player ${i}`, {
                fontFamily: 'Arial Black', 
                fontSize: 18, 
                color: '#ffffff',
                stroke: '#000000', 
                strokeThickness: 4,
            })
                .setDepth(100)
                .setVisible(i === 1); // Only show Player 1 initially

            // Create health bar background
            const healthBarBg = this.add.rectangle(pos.x, pos.y, healthBarWidth, healthBarHeight, 0x333333)
                .setOrigin(0, 0)
                .setStrokeStyle(2, 0xffffff)
                .setDepth(100)
                .setVisible(i === 1);

            // Create health bar fill
            const healthBarFill = this.add.rectangle(pos.x + 2, pos.y + 2, healthBarWidth - 4, healthBarHeight - 4, colors[i - 1])
                .setOrigin(0, 0)
                .setDepth(101)
                .setVisible(i === 1);

            // Create health text
            const healthText = this.add.text(pos.x + healthBarWidth / 2, pos.y + healthBarHeight / 2, '5/5', {
                fontFamily: 'Arial Black', 
                fontSize: 14, 
                color: '#ffffff',
                stroke: '#000000', 
                strokeThickness: 2,
            })
                .setOrigin(0.5)
                .setDepth(102)
                .setVisible(i === 1);

            // Store references
            this.playerHealthBars[i] = {
                label: label,
                background: healthBarBg,
                fill: healthBarFill,
                text: healthText,
                maxWidth: healthBarWidth - 4,
                visible: i === 1
            };
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
        
        // Initialize power-up manager
        this.powerUpManager = new PowerUpManager(this);

        this.physics.add.overlap(this.player, this.enemyBulletGroup, this.hitPlayer, null, this);
        this.physics.add.overlap(this.playerBulletGroup, this.enemyGroup, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemyGroup, this.hitPlayer, null, this);
        this.physics.add.overlap(this.player, this.powerUpManager.getPowerUpGroup(), this.collectPowerUp, null, this);
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
        this.tutorialText.setVisible(false);
        this.addFlyingGroup();
    }

    fireBullet(x, y, power = 1) {
        const bullet = new PlayerBullet(this, x, y, power);
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

    fireEnemyBullet(x, y, power) {
        const bullet = new EnemyBullet(this, x, y, power);
        this.enemyBulletGroup.add(bullet);
    }

    // NEW: Fire enemy bullet at specific angle
    fireEnemyBulletAngled(x, y, power, angleDegrees) {
        const bullet = new EnemyBullet(this, x, y, power);
        
        // Convert angle to radians and calculate velocity components
        const angleRadians = Phaser.Math.DegToRad(angleDegrees);
        const speed = 200; // Enemy bullet speed
        const velocityX = Math.sin(angleRadians) * speed;
        const velocityY = Math.cos(angleRadians) * speed; // Positive because enemy bullets go down
        
        // Set the bullet's velocity
        bullet.setVelocity(velocityX, velocityY);
        
        this.enemyBulletGroup.add(bullet);
    }

    removeEnemyBullet(bullet) {
        this.enemyBulletGroup.remove(bullet, true, true); // Fixed: was removing from playerBulletGroup
    }

    // add a group of flying enemies with varied types
    addFlyingGroup() {
        this.spawnEnemyCounter = Phaser.Math.RND.between(5, 8) * 60; // spawn next group after x seconds
        
        // Choose enemy type based on difficulty level
        const availableEnemyTypes = this.getAvailableEnemyTypes();
        const randomEnemyType = Phaser.Math.RND.pick(availableEnemyTypes);
        
        const randomCount = Phaser.Math.RND.between(5, 15); // number of enemies to spawn
        const randomInterval = Phaser.Math.RND.between(8, 12) * 100; // delay between spawning of each enemy
        const randomPath = Phaser.Math.RND.between(0, 3); // choose a path, a group follows the same path
        const randomPower = Phaser.Math.RND.between(1, 4); // strength of the enemy to determine damage to inflict and selecting bullet image
        const randomSpeed = Phaser.Math.RND.realInRange(0.0001, 0.001); // increment of pathSpeed in enemy

        this.timedEvent = this.time.addEvent(
            {
                delay: randomInterval,
                callback: this.addEnemy,
                args: [randomEnemyType, randomPath, randomSpeed, randomPower], // parameters passed to addEnemy()
                callbackScope: this,
                repeat: randomCount
            }
        );
        
        console.log(`Spawning ${randomCount + 1} ${randomEnemyType.name} enemies (${randomEnemyType.shootPattern} pattern)`);
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
        enemy.hit(bullet.getPower());
    }

    updateScore(points) {
        this.score += points;
        this.scoreText.setText(`Score: ${this.score}`);
        
        // Check for difficulty level up
        this.checkDifficultyLevelUp();
    }

    // NEW: Check if player reached next Fibonacci threshold
    checkDifficultyLevelUp() {
        const nextThreshold = this.fibonacciSequence[this.difficultyLevel - 1];
        
        if (this.score >= nextThreshold && this.difficultyLevel < this.fibonacciSequence.length) {
            this.levelUp();
        }
        
        // Update progress text
        const currentThreshold = this.fibonacciSequence[this.difficultyLevel - 1] || 999999;
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
    upgradePlayerShip() {
        this.currentPlayerShipIndex = (this.currentPlayerShipIndex + 1) % this.playerShipTypes.length;
        const newShipId = this.playerShipTypes[this.currentPlayerShipIndex];
        
        // Store player stats including new scaling properties
        const playerStats = {
            health: this.player.health,
            maxHealth: this.player.maxHealth,
            bulletPower: this.player.bulletPower,
            fireRate: this.player.fireRate,
            baseDamage: this.player.baseDamage || 1,
            scaleX: this.player.scaleX,
            scaleY: this.player.scaleY,
            x: this.player.x,
            y: this.player.y
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
        const index = Math.min(this.difficultyLevel - 1, this.enemyHealthByLevel.length - 1);
        return this.enemyHealthByLevel[index];
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

    collectPowerUp(player, powerUp) {
        this.powerUpManager.handleCollision(player, powerUp);
    }
}