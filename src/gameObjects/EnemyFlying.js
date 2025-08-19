import ASSETS from '../assets.js';
import EnemyBullet from './EnemyBullet.js';

export default class EnemyFlying extends Phaser.Physics.Arcade.Sprite {
    fireCounterMin = 100; // minimum fire rate
    fireCounterMax = 300; // maximum fire rate
    fireCounter;
    power = 1; // enemy strength

    // path coordinates for enemy to follow
    paths = [
        [[200, -50], [1080, 160], [200, 340], [1080, 520], [200, 700], [1080, 780]],
        [[-50, 200], [1330, 200], [1330, 400], [-50, 400], [-50, 600], [1330, 600]],
        [[-50, 360], [640, 50], [1180, 360], [640, 670], [50, 360], [640, 50], [1180, 360], [640, 670], [-50, 360]],
        [[1330, 360], [640, 50], [50, 360], [640, 670], [1180, 360], [640, 50], [50, 360], [640, 670], [1330, 360]],
    ]

    constructor(scene, enemyType, pathId, speed, power, health = 1, color = 0xffffff) {
        // enemyType is now an object with id, name, shootPattern, fireRate
        super(scene, 500, 500, ASSETS.spritesheet.ships.key, enemyType.id);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.enemyType = enemyType;
        this.power = power;
        this.health = health; // Set scaled health
        this.maxHealth = health; // Store original health for damage effects

        // Reduce collision damage for early levels
        this.collisionPower = Math.min(power, 2); // Enemies do max 2 collision damage

        // Set fire rate based on enemy type
        this.fireCounterMin = enemyType.fireRate[0];
        this.fireCounterMax = enemyType.fireRate[1];
        this.fireCounter = Phaser.Math.RND.between(this.fireCounterMin, this.fireCounterMax);

        // Special properties for different enemy types
        this.burstCount = 0; // For burst fire
        this.burstMax = 3; // Number of shots in burst
        this.spreadAngle = 30; // Angle for spread shots

        this.setFlipY(true); // flip image vertically
        this.setDepth(10);
        this.scene = scene;

        // Apply difficulty-based color tint
        if (color !== 0xffffff) {
            this.setTint(color);
        }

        this.initPath(pathId, speed); // choose path to follow

        console.log(`Created ${enemyType.name} enemy with ${enemyType.shootPattern} pattern, collision power: ${this.collisionPower}`);
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        if (this.pathIndex > 1) return; // stop updating if reached end of path

        this.path.getPoint(this.pathIndex, this.pathVector); // get current coordinate based on percentage moved

        this.setPosition(this.pathVector.x, this.pathVector.y); // set position of this enemy

        this.pathIndex += this.pathSpeed; // increment percentage moved by pathSpeed

        if (this.pathIndex > 1) this.die();

        // update firing interval
        if (this.fireCounter > 0) this.fireCounter--;
        else {
            this.fire();
        }
    }

    hit(damage) {
        this.health -= damage;

        // Show damage effect
        this.showDamageEffect();

        if (this.health <= 0) {
            this.die();
        } else {
            // Show floating damage text
            this.showDamageText(damage);
        }
    }

    showDamageEffect() {
        // Flash red when hit
        const originalTint = this.tintTopLeft;
        this.setTint(0xff0000);

        this.scene.time.delayedCall(100, () => {
            if (this.active) {
                this.setTint(originalTint);
            }
        });

        // Screen shake for strong enemies
        if (this.maxHealth >= 5) {
            this.scene.cameras.main.shake(100, 0.005);
        }
    }

    showDamageText(damage) {
        const damageText = this.scene.add.text(this.x, this.y - 20, `-${damage}`, {
            fontFamily: 'Arial Black',
            fontSize: 16,
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(30);

        this.scene.tweens.add({
            targets: damageText,
            y: damageText.y - 30,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => damageText.destroy()
        });
    }

    die() {
        // Bigger explosion for stronger enemies
        this.scene.addExplosion(this.x, this.y);

        if (this.maxHealth >= 3) {
            // Add extra explosion effects for tough enemies
            this.scene.addExplosion(this.x + 15, this.y + 15);
            this.scene.addExplosion(this.x - 15, this.y - 15);
        }

        // Higher score for tougher enemies
        const baseScore = 10;
        const scoreMultiplier = Math.max(1, Math.floor(this.maxHealth / 2));
        const totalScore = baseScore * scoreMultiplier;

        this.scene.updateScore(totalScore);

        // Show score text
        if (scoreMultiplier > 1) {
            this.scene.showFloatingText(this.x, this.y, `+${totalScore}`, 0xffff00, 18);
        }

        this.scene.removeEnemy(this);
    }

    fire() {
        this.fireCounter = Phaser.Math.RND.between(this.fireCounterMin, this.fireCounterMax);

        // Simple shooting pattern - just create bullets directly
        if (this.scene.fireEnemyBullet) {
            // Use scene method if it exists
            this.scene.fireEnemyBullet(this.x, this.y, this.power);
        } else {
            // Create bullet directly if method doesn't exist
            const bullet = new EnemyBullet(this.scene, this.x, this.y, this.power);
            if (this.scene.enemyBulletGroup) {
                this.scene.enemyBulletGroup.add(bullet);
            }
        }
    }

    // Simple burst fire pattern
    fireBurst() {
        this.burstCount = 0;
        const burstInterval = 150; // 150ms between burst shots

        for (let i = 0; i < this.burstMax; i++) {
            this.scene.time.delayedCall(i * burstInterval, () => {
                if (this.active) {
                    if (this.scene.fireEnemyBullet) {
                        this.scene.fireEnemyBullet(this.x, this.y, this.power);
                    } else {
                        const bullet = new EnemyBullet(this.scene, this.x, this.y, this.power);
                        if (this.scene.enemyBulletGroup) {
                            this.scene.enemyBulletGroup.add(bullet);
                        }
                    }
                }
            });
        }
    }

    // Simple spread fire (just multiple bullets)
    fireSpread() {
        // Fire 3 bullets slightly offset
        if (this.scene.fireEnemyBullet) {
            this.scene.fireEnemyBullet(this.x, this.y, this.power);
            this.scene.fireEnemyBullet(this.x - 10, this.y, this.power);
            this.scene.fireEnemyBullet(this.x + 10, this.y, this.power);
        } else {
            for (let i = -1; i <= 1; i++) {
                const bullet = new EnemyBullet(this.scene, this.x + (i * 10), this.y, this.power);
                if (this.scene.enemyBulletGroup) {
                    this.scene.enemyBulletGroup.add(bullet);
                }
            }
        }
    }

    // Simple aimed shot (just regular bullet)
    fireAimedShot() {
        if (this.scene.fireEnemyBullet) {
            this.scene.fireEnemyBullet(this.x, this.y, this.power + 1);
        } else {
            const bullet = new EnemyBullet(this.scene, this.x, this.y, this.power + 1);
            if (this.scene.enemyBulletGroup) {
                this.scene.enemyBulletGroup.add(bullet);
            }
        }
    }

    // Simple bomber pattern (multiple bullets)
    fireBomber() {
        for (let i = 0; i < 5; i++) {
            this.scene.time.delayedCall(i * 50, () => {
                if (this.active) {
                    if (this.scene.fireEnemyBullet) {
                        this.scene.fireEnemyBullet(this.x + Phaser.Math.Between(-20, 20), this.y, this.power);
                    } else {
                        const bullet = new EnemyBullet(this.scene, this.x + Phaser.Math.Between(-20, 20), this.y, this.power);
                        if (this.scene.enemyBulletGroup) {
                            this.scene.enemyBulletGroup.add(bullet);
                        }
                    }
                }
            });
        }
    }

    // Simple elite pattern (just rapid fire)
    fireElite() {
        this.fireAimedShot();

        this.scene.time.delayedCall(200, () => {
            if (this.active) {
                this.fireSpread();
            }
        });
    }

    initPath(pathId, speed) {
        const points = this.paths[pathId];

        this.path = new Phaser.Curves.Spline(points);
        this.pathVector = new Phaser.Math.Vector2(); // current coordinates along path in pixels
        this.pathIndex = 0; // percentage of position moved along path, 0 = beginning, 1 = end
        this.pathSpeed = speed; // speed of movement

        this.path.getPoint(0, this.pathVector); // get coordinates based on pathIndex

        this.setPosition(this.pathVector.x, this.pathVector.y);
    }

    getPower() {
        return this.collisionPower || 1; // Use collision power for ramming damage
    }

    remove() {
        this.scene.removeEnemy(this);
    }
}