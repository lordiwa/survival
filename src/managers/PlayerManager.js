// src/managers/PlayerManager.js - Player management and weapon systems
import Player from '../gameObjects/Player.js';
import PlayerBullet from '../gameObjects/PlayerBullet.js';

export default class PlayerManager {
    constructor(scene) {
        this.scene = scene;
        this.gameState = scene.gameState;
    }

    updatePlayers() {
        this.gameState.players.forEach(player => {
            if (player && player.active) {
                player.update();
            }
        });
    }

    addPlayersToPhysicsGroup() {
        this.gameState.players.forEach(player => {
            if (player) {
                this.scene.playerGroup.add(player);
            }
        });
    }

    createPlayer(playerId, gamepadIndex) {
        const position = this.gameState.playerStartPositions[playerId - 1];
        const currentShipId = this.gameState.playerShipTypes[this.gameState.currentPlayerShipIndex];

        const player = new Player(this.scene, position.x, position.y, currentShipId, playerId, gamepadIndex);
        player.setTint(this.gameState.playerColors[playerId - 1]);

        // Apply current level progression to new player
        this.applyCurrentProgressionToPlayer(player);

        this.gameState.setPlayer(playerId - 1, player);

        // Add to physics group if game is running
        if (this.gameState.gameStarted && this.scene.playerGroup) {
            this.scene.playerGroup.add(player);
        }

        // Update UI
        this.scene.uiManager.setPlayerHealthBarVisible(playerId, true);
        this.scene.uiManager.updatePlayerHealthUI(playerId, player.health, player.maxHealth);
        this.scene.uiManager.updatePlayersAliveUI();

        console.log(`Created Player ${playerId} at position (${position.x}, ${position.y})`);
        return player;
    }

    applyCurrentProgressionToPlayer(player) {
        const level = this.gameState.difficultyLevel;

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
        const player = this.gameState.players[playerId - 1];
        if (player) {
            if (this.scene.playerGroup) {
                this.scene.playerGroup.remove(player);
            }
            player.destroy();
            this.gameState.removePlayer(playerId - 1);

            this.scene.uiManager.setPlayerHealthBarVisible(playerId, false);
            this.scene.uiManager.updatePlayersAliveUI();

            console.log(`Removed Player ${playerId}`);
        }
    }

    onPlayerDeath(playerId) {
        console.log(`Player ${playerId} has died!`);

        this.scene.uiManager.setPlayerHealthBarVisible(playerId, false);

        const player = this.gameState.players[playerId - 1];
        if (player) {
            this.gameState.players[playerId - 1] = null;
        }

        this.scene.time.delayedCall(100, () => {
            this.scene.checkGameOver();
        });
    }

    // Ship upgrade system
    upgradeAllPlayerShips() {
        this.gameState.currentPlayerShipIndex = (this.gameState.currentPlayerShipIndex + 1) % this.gameState.playerShipTypes.length;
        const newShipId = this.gameState.playerShipTypes[this.gameState.currentPlayerShipIndex];

        this.gameState.players.forEach((player, index) => {
            if (player && player.active) {
                this.upgradePlayerShip(player, newShipId);
            }
        });

        console.log(`All players upgraded to ship type ${newShipId} (index ${this.gameState.currentPlayerShipIndex})`);
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
            hasCircularPattern: player.hasCircularPattern,
            hasConeSpray: player.hasConeSpray,
            hasExplosiveCircular: player.hasExplosiveCircular,
            hasExplosiveBullets: player.hasExplosiveBullets,
            originalFireRate: player.originalFireRate,
            originalFireRateCircular: player.originalFireRateCircular
        };

        // Remove and destroy old player
        this.scene.playerGroup.remove(player);
        player.destroy();

        // Create new player with upgraded ship
        const newPlayer = new Player(this.scene, playerStats.x, playerStats.y, newShipId, playerStats.playerId, playerStats.gamepadIndex);

        // Restore all stats
        Object.assign(newPlayer, playerStats);
        newPlayer.setScale(playerStats.scaleX, playerStats.scaleY);
        newPlayer.setTint(playerStats.tint);

        // Update hitbox for current scale
        const hitboxScale = Math.min(playerStats.scaleX, 1.3);
        newPlayer.body.setSize(64 * hitboxScale, 64 * hitboxScale);

        // Replace in players array and add to group
        this.gameState.players[playerStats.playerId - 1] = newPlayer;
        this.scene.playerGroup.add(newPlayer);

        // Update UI and show effect
        this.scene.uiManager.updatePlayerHealthUI(newPlayer.playerId, newPlayer.health, newPlayer.maxHealth);
        this.showShipUpgradeEffect(newPlayer);

        console.log(`Player ${playerStats.playerId} ship upgraded to type ${newShipId}`);
    }

    showShipUpgradeEffect(player) {
        const upgradeFlash = this.scene.add.circle(player.x, player.y, 80, 0x00ffff, 0.8);
        upgradeFlash.setDepth(150);

        this.scene.tweens.add({
            targets: upgradeFlash,
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            duration: 1000,
            ease: 'Power3',
            onComplete: () => upgradeFlash.destroy()
        });

        this.scene.showFloatingText(player.x, player.y - 50, 'SHIP UPGRADE!', 0x00ffff, 22);
    }

    // Weapon systems
    fireBullet(x, y, power = 1, isExplosive = false) {
        const bullet = new PlayerBullet(this.scene, x, y, power, isExplosive);
        this.scene.playerBulletGroup.add(bullet);
        return bullet;
    }

    fireDiagonalBullet(x, y, angleDegrees, power = 1) {
        const bullet = new PlayerBullet(this.scene, x, y, power);

        const angleRadians = Phaser.Math.DegToRad(angleDegrees);
        const speed = 1000;
        const velocityX = Math.sin(angleRadians) * speed;
        const velocityY = -Math.cos(angleRadians) * speed;

        bullet.setVelocity(velocityX, velocityY);
        this.scene.playerBulletGroup.add(bullet);

        return bullet;
    }

    // Level up bonuses
    giveAllPlayersLevelUpBonus() {
        this.gameState.players.forEach(player => {
            if (player && player.active) {
                this.givePlayerLevelUpBonus(player);
            }
        });
    }

    givePlayerLevelUpBonus(player) {
        if (!player) return;

        // Scale player size every 2 levels
        if (this.gameState.difficultyLevel % 2 === 0) {
            this.scalePlayerSize(player);
        }

        // Progressive health bonus
        const healthBonus = this.calculateHealthBonus();
        player.maxHealth += healthBonus;

        // Progressive damage bonus every 3 levels
        if (this.gameState.difficultyLevel % 3 === 0) {
            this.increasePlayerDamage(player);
        }

        // Full heal on level up
        player.health = player.maxHealth;

        // Update health UI
        this.scene.uiManager.updatePlayerHealthUI(player.playerId, player.health, player.maxHealth);

        // Show bonus text
        const bonusText = this.createLevelUpBonusText(healthBonus);
        this.scene.showFloatingText(player.x, player.y - 30, bonusText, 0x00ff00, 24);

        console.log(`Player ${player.playerId} Level ${this.gameState.difficultyLevel} bonuses: +${healthBonus} HP, Scale: ${player.scaleX.toFixed(2)}x, Damage: ${player.baseDamage || 1}`);
    }

    scalePlayerSize(player) {
        const currentScale = player.scaleX;
        const newScale = currentScale * 1.05;
        player.setScale(newScale);

        const hitboxScale = Math.min(newScale, 1.3);
        player.body.setSize(
            player.body.width * (hitboxScale / currentScale),
            player.body.height * (hitboxScale / currentScale)
        );

        console.log(`Player ${player.playerId} scaled to ${newScale.toFixed(2)}x (hitbox: ${hitboxScale.toFixed(2)}x)`);
    }

    calculateHealthBonus() {
        const baseBonus = 3;
        const levelTier = Math.floor((this.gameState.difficultyLevel - 1) / 5);
        const progressiveBonus = levelTier * 2;
        return baseBonus + progressiveBonus;
    }

    increasePlayerDamage(player) {
        if (!player.baseDamage) {
            player.baseDamage = 1;
        }
        player.baseDamage += 1;
        console.log(`Player ${player.playerId} base damage increased to ${player.baseDamage}`);
    }

    createLevelUpBonusText(healthBonus) {
        let bonusText = `LEVEL UP!\n+${healthBonus} MAX HP\nFULL HEAL!`;

        if (this.gameState.difficultyLevel % 2 === 0) bonusText += '\nSIZE UP!';
        if (this.gameState.difficultyLevel % 3 === 0) bonusText += '\nDAMAGE UP!';
        if (this.gameState.difficultyLevel % 6 === 1 && this.gameState.difficultyLevel > 1) bonusText += '\nNEW SHIP!';

        return bonusText;
    }

    getAlivePlayers() {
        return this.gameState.players.filter(player =>
            player && player.active && player.health > 0
        );
    }
}