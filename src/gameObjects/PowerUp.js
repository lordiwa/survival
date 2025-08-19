import ASSETS from '../assets.js';
import { POWERUP_CONFIG } from '../config/PowerUpConfig.js';

export default class PowerUp extends Phaser.Physics.Arcade.Sprite {
    moveVelocity = 100;

    constructor(scene, x, y, tileId, powerUpType, color) {
        super(scene, x, y, ASSETS.spritesheet.tiles.key, tileId);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.powerUpType = powerUpType;

        // Make power-ups bigger and more noticeable
        this.setScale(2.0); // Double the size
        this.setSize(48, 48); // Update hitbox for bigger size
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
        // Enhanced bobbing animation
        this.scene.tweens.add({
            targets: this,
            y: this.y + POWERUP_CONFIG.VISUAL.BOB_AMOUNT * 1.5, // Bigger bobbing
            duration: 800, // Faster bobbing
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        // Enhanced glow effect - multiple layers
        this.scene.tweens.add({
            targets: this,
            alpha: 0.6,
            duration: POWERUP_CONFIG.VISUAL.GLOW_DURATION * 0.7, // Faster pulsing
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        // Spinning animation for extra shine
        this.scene.tweens.add({
            targets: this,
            angle: 360,
            duration: 3000, // 3-second full rotation
            ease: 'Linear',
            repeat: -1
        });

        // Scaling pulse effect
        this.scene.tweens.add({
            targets: this,
            scaleX: 2.2,
            scaleY: 2.2,
            duration: 1500,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        // Create glowing aura effect
        this.createGlowAura();
    }

    createGlowAura() {
        // Create multiple glow rings around the power-up
        for (let i = 0; i < 3; i++) {
            const glowRing = this.scene.add.circle(this.x, this.y, 25 + (i * 15), this.tintTopLeft, 0.3 - (i * 0.1));
            glowRing.setDepth(14); // Behind the power-up

            // Animate the glow rings
            this.scene.tweens.add({
                targets: glowRing,
                scaleX: 1.5 + (i * 0.3),
                scaleY: 1.5 + (i * 0.3),
                alpha: 0,
                duration: 2000 + (i * 500),
                ease: 'Power2',
                repeat: -1,
                delay: i * 200
            });

            // Make rings follow the power-up
            this.scene.tweens.add({
                targets: glowRing,
                y: this.y + POWERUP_CONFIG.VISUAL.BOB_AMOUNT * 1.5,
                duration: 800,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });

            // Store reference to destroy later
            if (!this.glowRings) this.glowRings = [];
            this.glowRings.push(glowRing);
        }

        // Create sparkle particles
        this.sparkleTimer = this.scene.time.addEvent({
            delay: 200, // Sparkle every 200ms
            callback: this.createSparkle,
            callbackScope: this,
            repeat: -1
        });
    }

    createSparkle() {
        if (!this.active) return;

        // Random sparkle position around the power-up
        const offsetX = Phaser.Math.Between(-40, 40);
        const offsetY = Phaser.Math.Between(-40, 40);

        const sparkle = this.scene.add.circle(this.x + offsetX, this.y + offsetY, 3, 0xffffff, 0.9);
        sparkle.setDepth(16);

        this.scene.tweens.add({
            targets: sparkle,
            scaleX: 0.1,
            scaleY: 0.1,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => sparkle.destroy()
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

    destroy() {
        // Clean up glow rings
        if (this.glowRings) {
            this.glowRings.forEach(ring => {
                if (ring && ring.active) ring.destroy();
            });
        }

        // Clean up sparkle timer
        if (this.sparkleTimer) {
            this.sparkleTimer.destroy();
        }

        super.destroy();
    }

    showCollectionEffect() {
        // Much bigger and more dramatic collection effect
        const flash = this.scene.add.circle(this.x, this.y, POWERUP_CONFIG.VISUAL.COLLECTION_FLASH_SIZE * 2, 0xffffff, 0.9);
        flash.setDepth(20);

        this.scene.tweens.add({
            targets: flash,
            scaleX: 4,
            scaleY: 4,
            alpha: 0,
            duration: POWERUP_CONFIG.VISUAL.COLLECTION_FLASH_DURATION,
            ease: 'Power2',
            onComplete: () => flash.destroy()
        });

        // Additional burst effect
        for (let i = 0; i < 8; i++) {
            const angle = (360 / 8) * i;
            const angleRad = Phaser.Math.DegToRad(angle);
            const distance = 60;
            const burstX = this.x + Math.cos(angleRad) * distance;
            const burstY = this.y + Math.sin(angleRad) * distance;

            const burst = this.scene.add.circle(this.x, this.y, 8, this.tintTopLeft, 0.8);
            burst.setDepth(21);

            this.scene.tweens.add({
                targets: burst,
                x: burstX,
                y: burstY,
                scaleX: 0.1,
                scaleY: 0.1,
                alpha: 0,
                duration: 600,
                ease: 'Power2',
                onComplete: () => burst.destroy()
            });
        }
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
}