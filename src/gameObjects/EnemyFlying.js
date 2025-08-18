import ASSETS from '../assets.js';

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

    constructor(scene, shipId, pathId, speed, power, health = 1, color = 0xffffff) {
        const startingId = 12;
        super(scene, 500, 500, ASSETS.spritesheet.ships.key, startingId + shipId);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.power = power;
        this.health = health; // Set scaled health
        this.maxHealth = health; // Store original health for damage effects
        this.fireCounter = Phaser.Math.RND.between(this.fireCounterMin, this.fireCounterMax); // random firing interval
        this.setFlipY(true); // flip image vertically
        this.setDepth(10);
        this.scene = scene;

        // Apply difficulty-based color tint
        if (color !== 0xffffff) {
            this.setTint(color);
        }

        this.initPath(pathId, speed); // choose path to follow
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

    // NEW: Show visual damage effects
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

    // NEW: Show floating damage text
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
        this.scene.fireEnemyBullet(this.x, this.y, this.power);
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
        return this.power;
    }

    remove() {
        this.scene.removeEnemy(this);
    }

    // NEW: Get current health for UI or other systems
    getCurrentHealth() {
        return this.health;
    }

    getMaxHealth() {
        return this.maxHealth;
    }
}