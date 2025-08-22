// src/managers/UIManager.js - User interface management
export default class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.gameState = scene.gameState;
        this.playerHealthBars = {};
    }

    initGameUI() {
        try {
            this.createMainUI();
            this.initPlayerHealthBars();
            console.log('Multiplayer UI initialized successfully');
        } catch (error) {
            console.error('Error initializing UI:', error);
        }
    }

    createMainUI() {
        // Tutorial text
        const controllerCount = this.scene.controllerManager?.connectedControllers.length || 0;
        let tutorialText = 'Press SPACE or any START button to begin!';

        if (controllerCount > 0) {
            tutorialText = `${controllerCount} Controller(s) Connected!\nPress START button to join game!`;
        }

        this.tutorialText = this.scene.add.text(this.gameState.centreX, this.gameState.centreY, tutorialText, {
            fontFamily: 'Arial Black',
            fontSize: 32,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center'
        });
        this.tutorialText.setOrigin(0.5);
        this.tutorialText.setDepth(100);

        // Score text
        this.scoreText = this.scene.add.text(20, 20, 'Score: 0', {
            fontFamily: 'Arial Black',
            fontSize: 28,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
        });
        this.scoreText.setDepth(100);

        // Level text
        this.levelText = this.scene.add.text(20, 55, 'Level: 1', {
            fontFamily: 'Arial Black',
            fontSize: 20,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
        });
        this.levelText.setDepth(100);

        // Progress text
        this.progressText = this.scene.add.text(20, 80, 'Next: 500', {
            fontFamily: 'Arial Black',
            fontSize: 16,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
        });
        this.progressText.setDepth(100);

        // Players alive counter
        this.playersAliveText = this.scene.add.text(this.scene.scale.width - 20, 20, 'Players: 0', {
            fontFamily: 'Arial Black',
            fontSize: 20,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
        });
        this.playersAliveText.setOrigin(1, 0);
        this.playersAliveText.setDepth(100);

        // Game over text
        this.gameOverText = this.scene.add.text(this.scene.scale.width * 0.5, this.scene.scale.height * 0.5, 'Game Over', {
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
    }

    initPlayerHealthBars() {
        const healthBarWidth = 160;
        const healthBarHeight = 20;
        const margin = 20;
        const labelHeight = 25;

        const positions = [
            { x: margin, y: this.scene.scale.height - margin - healthBarHeight - labelHeight },
            { x: this.scene.scale.width - margin - healthBarWidth, y: this.scene.scale.height - margin - healthBarHeight - labelHeight },
            { x: margin, y: this.scene.scale.height - margin - (healthBarHeight + labelHeight) * 2 - 10 },
            { x: this.scene.scale.width - margin - healthBarWidth, y: this.scene.scale.height - margin - (healthBarHeight + labelHeight) * 2 - 10 }
        ];

        for (let i = 0; i < this.gameState.maxPlayers; i++) {
            const playerId = i + 1;
            const pos = positions[i];
            const color = this.gameState.playerColors[i];

            const label = this.scene.add.text(pos.x, pos.y - labelHeight, `Player ${playerId}`, {
                fontFamily: 'Arial Black',
                fontSize: 16,
                color: Phaser.Display.Color.IntegerToRGB(color),
                stroke: '#000000',
                strokeThickness: 3,
            });
            label.setDepth(100);

            const healthBarBg = this.scene.add.rectangle(pos.x, pos.y, healthBarWidth, healthBarHeight, 0x333333);
            healthBarBg.setOrigin(0, 0);
            healthBarBg.setStrokeStyle(2, 0xffffff);
            healthBarBg.setDepth(100);

            const healthBarFill = this.scene.add.rectangle(pos.x + 2, pos.y + 2, healthBarWidth - 4, healthBarHeight - 4, color);
            healthBarFill.setOrigin(0, 0);
            healthBarFill.setDepth(101);

            const healthText = this.scene.add.text(pos.x + healthBarWidth / 2, pos.y + healthBarHeight / 2, '5/5', {
                fontFamily: 'Arial Black',
                fontSize: 12,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2,
            });
            healthText.setOrigin(0.5);
            healthText.setDepth(102);

            this.playerHealthBars[playerId] = {
                label: label,
                background: healthBarBg,
                fill: healthBarFill,
                text: healthText,
                maxWidth: healthBarWidth - 4,
                visible: false
            };

            this.setPlayerHealthBarVisible(playerId, false);
        }

        console.log('Player health bars initialized for 4 players');
    }

    updatePlayerHealthUI(playerId, currentHealth, maxHealth) {
        const healthBar = this.playerHealthBars[playerId];
        if (!healthBar || !healthBar.visible) return;

        const healthPercentage = currentHealth / maxHealth;
        const newWidth = healthBar.maxWidth * healthPercentage;

        healthBar.fill.width = Math.max(0, newWidth);
        healthBar.text.setText(`${currentHealth}/${maxHealth}`);

        let color;
        if (healthPercentage > 0.6) {
            color = this.gameState.playerColors[playerId - 1];
        } else if (healthPercentage > 0.3) {
            color = 0xffff00;
        } else {
            color = 0xff0000;
        }

        healthBar.fill.setFillStyle(color);

        if (healthPercentage <= 0.3 && currentHealth > 0) {
            this.scene.tweens.add({
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

    updateScore(score) {
        this.scoreText.setText(`Score: ${score}`);
    }

    updateLevel(level) {
        this.levelText.setText(`Level: ${level}`);
    }

    updateProgress(nextThreshold) {
        this.progressText.setText(`Next: ${nextThreshold}`);
    }

    updatePlayersAliveUI() {
        const alivePlayers = this.gameState.players.filter(player =>
            player && player.active && player.health > 0
        ).length;

        if (this.playersAliveText) {
            this.playersAliveText.setText(`Players: ${alivePlayers}`);
        }
    }

    hideStartInstructions() {
        if (this.tutorialText) {
            this.tutorialText.setVisible(false);
        }
    }

    showGameOver() {
        this.gameOverText.setVisible(true);

        if (!this.restartText) {
            this.restartText = this.scene.add.text(this.scene.scale.width * 0.5, this.scene.scale.height * 0.5 + 80, 'Press SPACE to restart', {
                fontFamily: 'Arial Black',
                fontSize: 32,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 6,
                align: 'center'
            })
                .setOrigin(0.5)
                .setDepth(100);
        }
        this.restartText.setVisible(true);
    }

    showFloatingText(x, y, text, color, fontSize = 20) {
        const floatingText = this.scene.add.text(x, y, text, {
            fontFamily: 'Arial Black',
            fontSize: fontSize,
            color: Phaser.Display.Color.IntegerToRGB(color),
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5).setDepth(30);

        this.scene.tweens.add({
            targets: floatingText,
            y: floatingText.y - 60,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => floatingText.destroy()
        });
    }

    showLevelUpEffect() {
        // Screen flash
        const flash = this.scene.add.rectangle(this.scene.scale.width/2, this.scene.scale.height/2,
            this.scene.scale.width, this.scene.scale.height, 0xffffff, 0.3);
        flash.setDepth(1000);

        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => flash.destroy()
        });

        // Screen shake
        this.scene.cameras.main.shake(300, 0.02);

        // Level up text
        const levelUpText = this.scene.add.text(this.scene.scale.width * 0.5, this.scene.scale.height * 0.3,
            `LEVEL ${this.gameState.difficultyLevel}!`, {
                fontFamily: 'Arial Black',
                fontSize: 48,
                color: '#ffff00',
                stroke: '#000000',
                strokeThickness: 8,
                align: 'center'
            }).setOrigin(0.5).setDepth(1001);

        this.scene.tweens.add({
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
}