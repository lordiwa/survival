// src/scenes/Game.js - Main Game Scene (Refactored)
import ASSETS from '../assets.js';
import ANIMATION from '../animation.js';
import GameState from '../managers/GameState.js';
import PlayerManager from '../managers/PlayerManager.js';
import EnemyManager from '../managers/EnemyManager.js';
import BossManager from '../managers/BossManager.js';
import ControllerManager from '../managers/ControllerManager.js';
import UIManager from '../managers/UIManager.js';
import LevelManager from '../managers/LevelManager.js';
import PhysicsManager from '../managers/PhysicsManager.js';
import MapManager from '../managers/MapManager.js';
import PowerUpManager from '../gameObjects/PowerUpManager.js';

export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    create() {
        console.log('Game scene created');
        console.log('Scene scale:', this.scale.width, 'x', this.scale.height);

        // Initialize all managers
        this.initManagers();
        this.initAnimations();

        // Set up the game
        this.physicsManager.initPhysics();
        this.mapManager.initMap();
        this.uiManager.initGameUI();
        this.controllerManager.initControllers();
    }

    initManagers() {
        // Core game state
        this.gameState = new GameState(this);

        // Manager instances
        this.playerManager = new PlayerManager(this);
        this.enemyManager = new EnemyManager(this);
        this.bossManager = new BossManager(this);
        this.controllerManager = new ControllerManager(this);
        this.uiManager = new UIManager(this);
        this.levelManager = new LevelManager(this);
        this.physicsManager = new PhysicsManager(this);
        this.mapManager = new MapManager(this);
        this.powerUpManager = new PowerUpManager(this);

        // Cross-references for managers that need each other
        this.physicsManager.setPowerUpManager(this.powerUpManager);
        this.levelManager.setPlayerManager(this.playerManager);
        this.levelManager.setBossManager(this.bossManager);
    }

    initAnimations() {
        this.anims.create({
            key: ANIMATION.explosion.key,
            frames: this.anims.generateFrameNumbers(ANIMATION.explosion.texture, ANIMATION.explosion.config),
            frameRate: ANIMATION.explosion.frameRate,
            repeat: ANIMATION.explosion.repeat
        });
    }

    update() {
        // Update map scrolling
        this.mapManager.updateMap();

        // Check for new controllers if game started
        if (this.gameState.gameStarted) {
            this.controllerManager.checkForNewPlayers();
        }

        if (!this.gameState.gameStarted) return;

        // Update all active players
        this.playerManager.updatePlayers();

        // Update enemy spawning
        this.enemyManager.update();

        // Update power-ups
        this.powerUpManager.update(this.game.loop.delta);

        // Performance optimization
        this.cleanupExcessBullets();

        // Check for game over
        this.checkGameOver();
    }

    // Performance optimization
    cleanupExcessBullets() {
        this.gameState.bulletCleanupTimer++;

        if (this.gameState.bulletCleanupTimer >= 60) {
            this.gameState.bulletCleanupTimer = 0;
            const totalBullets = this.playerBulletGroup.children.size + this.enemyBulletGroup.children.size;

            if (totalBullets > this.gameState.maxBullets) {
                const excessCount = totalBullets - this.gameState.maxBullets;
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

    // Start the game
    startGame() {
        if (this.gameState.gameStarted) return;

        this.gameState.gameStarted = true;
        this.gameState.waitingForStart = false;

        this.uiManager.hideStartInstructions();
        this.playerManager.addPlayersToPhysicsGroup();
        this.uiManager.updatePlayersAliveUI();
        this.enemyManager.startSpawning();

        console.log(`Game started with ${this.gameState.activePlayers} players!`);
    }

    // Weapon firing methods
    fireBullet(x, y, power = 1, isExplosive = false) {
        return this.playerManager.fireBullet(x, y, power, isExplosive);
    }

    fireDiagonalBullet(x, y, angleDegrees, power = 1) {
        return this.playerManager.fireDiagonalBullet(x, y, angleDegrees, power);
    }

    fireEnemyBullet(x, y, power) {
        if (this.enemyManager && this.enemyManager.fireEnemyBullet) {
            return this.enemyManager.fireEnemyBullet(x, y, power);
        } else {
            // Fallback: create bullet directly
            const EnemyBullet = require('./gameObjects/EnemyBullet.js').default;
            const bullet = new EnemyBullet(this, x, y, power);
            if (this.enemyBulletGroup) {
                this.enemyBulletGroup.add(bullet);
            }
            return bullet;
        }
    }

    fireEnemyBulletAngled(x, y, power, angleDegrees) {
        return this.enemyManager.fireEnemyBulletAngled(x, y, power, angleDegrees);
    }

    // Bullet cleanup methods
    removeBullet(bullet) {
        this.playerBulletGroup.remove(bullet, true, true);
    }

    removeEnemyBullet(bullet) {
        this.enemyBulletGroup.remove(bullet, true, true);
    }

    // Enemy management
    removeEnemy(enemy) {
        this.enemyGroup.remove(enemy, true, true);
    }

    removeBoss(boss) {
        this.bossManager.removeBoss(boss);
    }

    // Visual effects
    addExplosion(x, y) {
        this.enemyManager.addExplosion(x, y);
    }

    showFloatingText(x, y, text, color, fontSize = 20) {
        this.uiManager.showFloatingText(x, y, text, color, fontSize);
    }

    // Score and progression
    updateScore(points) {
        this.levelManager.updateScore(points);
    }

    // Physics collision handlers
    hitPlayer(player, obstacle) {
        this.physicsManager.hitPlayer(player, obstacle);
    }

    hitEnemy(bullet, enemy) {
        this.physicsManager.hitEnemy(bullet, enemy);
    }

    hitBoss(bullet, boss) {
        this.physicsManager.hitBoss(bullet, boss);
    }

    collectPowerUp(player, powerUp) {
        this.physicsManager.collectPowerUp(player, powerUp);
    }

    // Player management delegates
    onPlayerDeath(playerId) {
        this.playerManager.onPlayerDeath(playerId);
    }

    updatePlayerHealthUI(playerId, currentHealth, maxHealth) {
        this.uiManager.updatePlayerHealthUI(playerId, currentHealth, maxHealth);
    }

    // Game over logic
    checkGameOver() {
        const alivePlayers = this.playerManager.getAlivePlayers();
        this.uiManager.updatePlayersAliveUI();

        if (alivePlayers.length === 0 && this.gameState.gameStarted) {
            this.time.delayedCall(1000, () => {
                this.GameOver();
            });
        }
    }

    GameOver() {
        this.gameState.gameStarted = false;
        this.uiManager.showGameOver();

        // Keyboard restart
        const spaceKeyHandler = () => {
            this.scene.restart();
        };

        this.input.keyboard.once('keydown-SPACE', spaceKeyHandler);

        // Controller restart - check for START button on any connected controller
        const checkControllerRestart = () => {
            if (!navigator.getGamepads) return;

            const gamepads = navigator.getGamepads();
            let restartPressed = false;

            // Check all connected controllers for START button
            for (let i = 0; i < gamepads.length; i++) {
                const gamepad = gamepads[i];
                if (gamepad && gamepad.buttons[9] && gamepad.buttons[9].pressed) {
                    restartPressed = true;
                    break;
                }
            }

            if (restartPressed) {
                // Remove keyboard listener to prevent double restart
                this.input.keyboard.off('keydown-SPACE', spaceKeyHandler);
                this.scene.restart();
            } else {
                // Continue checking if game is still over
                if (!this.gameState.gameStarted) {
                    this.time.delayedCall(100, checkControllerRestart);
                }
            }
        };

        // Start checking for controller input
        checkControllerRestart();

        console.log('Game Over - All players defeated! Press SPACE or START button to restart.');
    }

    // Getters for managers to access groups and state
    get playerGroup() { return this.physicsManager.playerGroup; }
    get enemyGroup() { return this.physicsManager.enemyGroup; }
    get playerBulletGroup() { return this.physicsManager.playerBulletGroup; }
    get enemyBulletGroup() { return this.physicsManager.enemyBulletGroup; }
    get bossGroup() { return this.physicsManager.bossGroup; }

    // State getters
    get difficultyLevel() { return this.gameState.difficultyLevel; }
    get score() { return this.gameState.score; }
    get players() { return this.gameState.players; }
    get activePlayers() { return this.gameState.activePlayers; }
}