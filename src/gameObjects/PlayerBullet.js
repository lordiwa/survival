import ASSETS from '../assets.js';

export default class PlayerBullet extends Phaser.Physics.Arcade.Sprite {
    moveVelocity = 1000;

    constructor(scene, x, y, power = 1) {
        super(scene, x, y, ASSETS.spritesheet.tiles.key, Math.min(power - 1, 4)); // Use power to determine sprite frame (max frame 4)

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.power = power;
        this.setSize(12, 32); // resize hitbox to correctly fit image instead of using the entire tile size
        this.setDepth(10);
        this.scene = scene;
        this.setVelocityY(-this.moveVelocity); // bullet vertical speed

        // Add visual effects based on power level
        this.addPowerEffects();
    }

    addPowerEffects() {
        // Add glow effect for more powerful bullets
        if (this.power >= 2) {
            const glowColor = this.getPowerColor();
            this.setTint(glowColor);
            
            // Add trail effect for high-power bullets
            if (this.power >= 3) {
                this.addTrailEffect();
            }
        }
    }

    getPowerColor() {
        switch (this.power) {
            case 1: return 0xffffff; // White (normal)
            case 2: return 0x66ff66; // Light green
            case 3: return 0x6666ff; // Light blue  
            case 4: return 0xffff66; // Yellow
            case 5: return 0xff66ff; // Magenta (max power)
            default: return 0xffffff;
        }
    }

    addTrailEffect() {
        // Create trail particles for high-power bullets
        const trailTimer = this.scene.time.addEvent({
            delay: 50, // Create trail particle every 50ms
            callback: () => {
                if (this.active) {
                    const trail = this.scene.add.circle(this.x + Phaser.Math.Between(-5, 5), this.y + 20, 2, this.getPowerColor(), 0.6);
                    trail.setDepth(9);
                    
                    this.scene.tweens.add({
                        targets: trail,
                        alpha: 0,
                        scaleX: 0.1,
                        scaleY: 0.1,
                        duration: 300,
                        ease: 'Power2',
                        onComplete: () => trail.destroy()
                    });
                } else {
                    trailTimer.destroy();
                }
            },
            repeat: -1
        });
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        this.checkWorldBounds();
    }

    getPower() {
        return this.power;
    }

    // is this bullet above the screen?
    checkWorldBounds() {
        if (this.y < 0) {
            this.remove();
        }
    }

    remove() {
        this.scene.removeBullet(this);
    }
}