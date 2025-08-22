// src/managers/BossManager.js - Boss spawning and management
import BossEnemy, { BOSS_TYPES } from '../gameObjects/BossEnemy.js';

export default class BossManager {
    constructor(scene) {
        this.scene = scene;
        this.gameState = scene.gameState;
    }

    spawnBoss() {
        if (this.gameState.currentBoss) return; // Don't spawn if boss already exists

        // Get the current boss type (rotates through all 4)
        const bossType = BOSS_TYPES[this.gameState.bossTypeIndex];
        this.gameState.bossTypeIndex = (this.gameState.bossTypeIndex + 1) % BOSS_TYPES.length;

        // Create the boss
        this.gameState.currentBoss = new BossEnemy(this.scene, bossType, this.gameState.difficultyLevel);
        this.scene.bossGroup.add(this.gameState.currentBoss);

        // Stop regular enemy spawning while boss is active
        this.scene.enemyManager.stopSpawning();

        // Show boss warning
        this.showBossWarning(bossType);

        console.log(`Boss spawned: ${bossType.name} at level ${this.gameState.difficultyLevel}`);
    }

    removeBoss(boss) {
        if (this.gameState.currentBoss === boss) {
            this.gameState.currentBoss = null;

            // Resume normal enemy spawning after a delay
            this.scene.enemyManager.resumeSpawning();

            console.log('Boss defeated! Resuming normal enemy spawning.');
        }

        this.scene.bossGroup.remove(boss, true, true);
    }

    showBossWarning(bossType) {
        // Warning text
        const warningText = this.scene.add.text(this.scene.scale.width / 2, this.scene.scale.height / 2,
            'WARNING!\nBOSS APPROACHING!', {
                fontFamily: 'Arial Black',
                fontSize: 48,
                color: '#ff0000',
                stroke: '#000000',
                strokeThickness: 8,
                align: 'center'
            }).setOrigin(0.5).setDepth(1000);

        // Boss type text
        const bossTypeText = this.scene.add.text(this.scene.scale.width / 2, this.scene.scale.height / 2 + 100,
            bossType.name.toUpperCase(), {
                fontFamily: 'Arial Black',
                fontSize: 32,
                color: Phaser.Display.Color.IntegerToRGB(bossType.color),
                stroke: '#000000',
                strokeThickness: 6,
                align: 'center'
            }).setOrigin(0.5).setDepth(1000);

        // Screen effects
        this.scene.cameras.main.shake(500, 0.01);

        // Flash effect
        const flash = this.scene.add.rectangle(this.scene.scale.width/2, this.scene.scale.height/2,
            this.scene.scale.width, this.scene.scale.height, 0xff0000, 0.3);
        flash.setDepth(999);

        // Animate warning
        this.scene.tweens.add({
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

        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => flash.destroy()
        });
    }
}