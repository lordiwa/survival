import ASSETS from '../assets.js';

export default class PlayerBullet extends Phaser.Physics.Arcade.Sprite {
    moveVelocity = 1000;

    constructor(scene, x, y, power = 1, isExplosive = false) {
        super(scene, x, y, ASSETS.spritesheet.tiles.key, Math.min(power - 1, 4)); // Use power to determine sprite frame (max frame 4)

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.power = power;
        this.isExplosive = isExplosive;
        this.setSize(12, 32); // resize hitbox to correctly fit image instead of using the entire tile size
        this.setDepth(10);
        this.scene = scene;
        this.setVelocityY(-this.moveVelocity); // bullet vertical speed

        // Add visual effects based on power level and explosive status
        this.addPowerEffects();
    }

    addPowerEffects() {
        // Add glow effect for more powerful bullets
        if (this.power >= 2 || this.isExplosive) {
            let glowColor = this.getPowerColor();

            // Explosive bullets get special orange glow
            if (this.isExplosive) {
                glowColor = 0xff4400;
                this.setTint(0xff6600); // Orange tint for explosive bullets

                // Add pulsing effect for explosive bullets
                this.scene.tweens.add({
                    targets: this,
                    alpha: 0.7,
                    duration: 200,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            } else {
                this.setTint(glowColor);
            }

            // Add trail effect for high-power bullets or explosive bullets
            if (this.power >= 3 || this.isExplosive) {
                this.addTrailEffect(glowColor);
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

    addTrailEffect(color) {
        // Create trail particles for high-power bullets
        const trailTimer = this.scene.time.addEvent({
            delay: this.isExplosive ? 30 : 50, // Faster trail for explosive bullets
            callback: () => {
                if (this.active) {
                    const trailSize = this.isExplosive ? 4 : 2;
                    const trail = this.scene.add.circle(
                        this.x + Phaser.Math.Between(-5, 5),
                        this.y + 20,
                        trailSize,
                        color,
                        0.6
                    );
                    trail.setDepth(9);

                    this.scene.tweens.add({
                        targets: trail,
                        alpha: 0,
                        scaleX: 0.1,
                        scaleY: 0.1,
                        duration: this.isExplosive ? 400 : 300,
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