import ASSETS from '../assets.js';
import { POWERUP_CONFIG } from '../config/PowerUpConfig.js';

export default class PowerUp extends Phaser.Physics.Arcade.Sprite {
    moveVelocity = 100;
    
    constructor(scene, x, y, tileId, powerUpType, color) {
        super(scene, x, y, ASSETS.spritesheet.tiles.key, tileId);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.powerUpType = powerUpType;
        this.setSize(24, 24);
        this.setDepth(15);
        this.scene = scene;
        this.setTint(color);
        
        // Move downward slowly
        this.setVelocityY(this.moveVelocity);
        
        this.addVisualEffects();
        
        // Auto-destroy after lifespan
        this.scene.time.delayedCall(POWERUP_CONFIG.LIFESPAN, () => {
            if (this.active) this.destroy();
        });
    }

    addVisualEffects() {
        // Bobbing animation
        this.scene.tweens.add({
            targets: this,
            y: this.y + POWERUP_CONFIG.VISUAL.BOB_AMOUNT,
            duration: 1000 / POWERUP_CONFIG.VISUAL.BOB_SPEED,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        // Glow effect
        this.scene.tweens.add({
            targets: this,
            alpha: 0.7,
            duration: POWERUP_CONFIG.VISUAL.GLOW_DURATION,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        this.checkWorldBounds();
    }

    checkWorldBounds() {
        if (this.y > this.scene.scale.height + 50) {
            this.destroy();
        }
    }

    // Override this method in specific power-up classes
    applyEffect(player) {
        console.log(`Applied ${this.powerUpType} power-up to player ${player.getPlayerId()}`);
    }

    // Called when player collects this power-up
    collect(player) {
        this.applyEffect(player);
        this.showCollectionEffect();
        this.destroy();
    }

    showCollectionEffect() {
        const flash = this.scene.add.circle(this.x, this.y, POWERUP_CONFIG.VISUAL.COLLECTION_FLASH_SIZE, 0xffffff, 0.8);
        flash.setDepth(20);
        
        this.scene.tweens.add({
            targets: flash,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: POWERUP_CONFIG.VISUAL.COLLECTION_FLASH_DURATION,
            ease: 'Power2',
            onComplete: () => flash.destroy()
        });
    }

    showFloatingText(text, color) {
        const floatingText = this.scene.add.text(this.x, this.y, text, {
            fontFamily: 'Arial Black',
            fontSize: 20,
            color: Phaser.Display.Color.IntegerToRGB(color),
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(30);

        this.scene.tweens.add({
            targets: floatingText,
            y: floatingText.y - 50,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => floatingText.destroy()
        });
    }

    getPowerUpType() {
        return this.powerUpType;
    }
}