import ASSETS from '../assets.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    velocityIncrement = 50;
    velocityMax = 500;
    drag = 1000;
    fireRate = 10;
    fireCounter = 0;
    maxHealth = 5; // Maximum health points
    health = 5; // Current health points
    playerId = 1; // Player ID for multiplayer support later
    invulnerabilityTime = 1000; // 1 second of invulnerability after being hit
    invulnerable = false;
    flashTimer = 0;
    flashDuration = 100; // Flash every 100ms when invulnerable
    bulletPower = 1; // Bullet damage power
    baseDamage = 1; // Base damage bonus from leveling up

    constructor(scene, x, y, shipId, playerId = 1) {
        super(scene, x, y, ASSETS.spritesheet.ships.key, shipId);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.playerId = playerId;
        this.setCollideWorldBounds(true); // prevent ship from leaving the screen
        this.setDepth(100); // make ship appear on top of other game objects
        this.scene = scene;
        this.setMaxVelocity(this.velocityMax); // limit maximum speed of ship
        this.setDrag(this.drag);

        // Initialize health UI
        this.scene.updatePlayerHealthUI(this.playerId, this.health, this.maxHealth);
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        if (this.fireCounter > 0) this.fireCounter--;

        // Handle invulnerability flashing
        if (this.invulnerable) {
            this.flashTimer -= delta;
            if (this.flashTimer <= 0) {
                this.setVisible(!this.visible);
                this.flashTimer = this.flashDuration;
            }
        }

        this.checkInput();
    }

    checkInput() {
        const cursors = this.scene.cursors; // get cursors object from Game scene
        const leftKey = cursors.left.isDown;
        const rightKey = cursors.right.isDown;
        const upKey = cursors.up.isDown;
        const downKey = cursors.down.isDown;
        const spaceKey = cursors.space.isDown;

        const moveDirection = { x: 0, y: 0 }; // default move direction

        if (leftKey) moveDirection.x--;
        if (rightKey) moveDirection.x++;
        if (upKey) moveDirection.y--;
        if (downKey) moveDirection.y++;
        if (spaceKey) this.fire();

        this.body.velocity.x += moveDirection.x * this.velocityIncrement; // increase horizontal velocity
        this.body.velocity.y += moveDirection.y * this.velocityIncrement; // increase vertical velocity
    }

    fire() {
        if (this.fireCounter > 0) return;

        this.fireCounter = this.fireRate;

        // Calculate total damage with stronger early game boost
        const level = this.scene.difficultyLevel || 1;
        let baseDamage = (this.baseDamage || 1) + (this.bulletPower - 1);

        // Early game damage boost to help with initial difficulty
        if (level <= 5) {
            baseDamage *= 2.0; // Double damage at early levels
        } else if (level <= 10) {
            baseDamage *= 1.7; // 70% boost at mid levels
        } else {
            baseDamage *= 1.5; // 50% boost at higher levels
        }

        const totalDamage = Math.floor(baseDamage);

        // Check for special firing patterns first (simple boolean checks)
        if (this.hasExplosiveCircular) {
            this.fireExplosiveCircular(totalDamage);
        } else if (this.hasConeSpray) {
            this.fireConeSpray(totalDamage);
        } else if (this.hasCircularPattern) {
            this.fireCircularPattern(totalDamage);
        } else if (this.bulletPower >= 2) {
            // Regular multi-shot
            this.fireMultiShot(totalDamage);
        } else {
            // Single bullet
            this.scene.fireBullet(this.x, this.y, totalDamage);
        }
    }

    // Fire explosive circular pattern (12 bullets in 360°)
    fireExplosiveCircular(totalDamage) {
        const bulletCount = 12;
        for (let i = 0; i < bulletCount; i++) {
            const angle = (360 / bulletCount) * i;
            this.scene.fireDiagonalBullet(this.x, this.y, angle, totalDamage);
        }
    }

    // Fire cone spray pattern (15 bullets in 90° cone, half damage)
    fireConeSpray(totalDamage) {
        const bulletCount = 15;
        const coneAngle = 90;
        const coneDamage = Math.max(1, Math.floor(totalDamage * 0.5)); // Half damage

        for (let i = 0; i < bulletCount; i++) {
            const angle = -45 + (90 / (bulletCount - 1)) * i; // -45° to +45°
            this.scene.fireDiagonalBullet(this.x, this.y, angle, coneDamage);
        }
    }

    // Fire circular pattern (8 bullets in 360°)
    fireCircularPattern(totalDamage) {
        const bulletCount = 8;
        for (let i = 0; i < bulletCount; i++) {
            const angle = (360 / bulletCount) * i;
            this.scene.fireDiagonalBullet(this.x, this.y, angle, totalDamage);
        }
    }

    fireMultiShot(totalDamage) {
        const bulletSpeed = 1000;
        const diagonalAngle = 15; // Degrees for diagonal shots

        if (this.bulletPower === 2) {
            // Triple shot: center + 2 diagonal
            this.scene.fireBullet(this.x, this.y, totalDamage); // Center bullet
            this.scene.fireDiagonalBullet(this.x, this.y, -diagonalAngle, totalDamage); // Left diagonal
            this.scene.fireDiagonalBullet(this.x, this.y, diagonalAngle, totalDamage);  // Right diagonal
        }
        else if (this.bulletPower === 3) {
            // Five shot: center + 4 diagonal (wider spread)
            this.scene.fireBullet(this.x, this.y, totalDamage); // Center bullet
            this.scene.fireDiagonalBullet(this.x, this.y, -diagonalAngle, totalDamage); // Left diagonal
            this.scene.fireDiagonalBullet(this.x, this.y, diagonalAngle, totalDamage);  // Right diagonal
            this.scene.fireDiagonalBullet(this.x, this.y, -diagonalAngle * 2, totalDamage); // Far left
            this.scene.fireDiagonalBullet(this.x, this.y, diagonalAngle * 2, totalDamage);  // Far right
        }
        else if (this.bulletPower >= 4) {
            // Seven shot: center + 6 diagonal (full spread)
            this.scene.fireBullet(this.x, this.y, totalDamage + 1); // Center bullet (extra powerful)
            this.scene.fireDiagonalBullet(this.x, this.y, -10, totalDamage);
            this.scene.fireDiagonalBullet(this.x, this.y, 10, totalDamage);
            this.scene.fireDiagonalBullet(this.x, this.y, -20, totalDamage);
            this.scene.fireDiagonalBullet(this.x, this.y, 20, totalDamage);
            this.scene.fireDiagonalBullet(this.x, this.y, -30, totalDamage);
            this.scene.fireDiagonalBullet(this.x, this.y, 30, totalDamage);
        }
    }

    hit(damage) {
        // Don't take damage if invulnerable
        if (this.invulnerable) return;

        // Cap damage based on level to prevent early game one-shots
        const level = this.scene.difficultyLevel || 1;
        let cappedDamage = damage;

        if (level <= 3) {
            cappedDamage = Math.min(damage, 1); // Max 1 damage at levels 1-3
        } else if (level <= 7) {
            cappedDamage = Math.min(damage, 2); // Max 2 damage at levels 4-7
        } else if (level <= 12) {
            cappedDamage = Math.min(damage, 3); // Max 3 damage at levels 8-12
        }
        // After level 12, no damage cap

        this.health -= cappedDamage;

        // Update health UI
        this.scene.updatePlayerHealthUI(this.playerId, this.health, this.maxHealth);

        if (this.health <= 0) {
            this.die();
        } else {
            // Make player temporarily invulnerable
            this.makeInvulnerable();

            // Add visual feedback for taking damage
            this.scene.addExplosion(this.x + Phaser.Math.Between(-20, 20), this.y + Phaser.Math.Between(-20, 20));

            // Screen shake effect
            this.scene.cameras.main.shake(200, 0.01);

            console.log(`Player took ${cappedDamage} damage (was ${damage}) at level ${level}`);
        }
    }

    makeInvulnerable() {
        this.invulnerable = true;
        this.flashTimer = 0;

        // End invulnerability after set time
        this.scene.time.delayedCall(this.invulnerabilityTime, () => {
            this.invulnerable = false;
            this.setVisible(true); // Make sure player is visible when invulnerability ends
        });
    }

    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
        this.scene.updatePlayerHealthUI(this.playerId, this.health, this.maxHealth);
    }

    increaseMaxHealth(amount = 1) {
        this.maxHealth += amount;
        console.log(`Max health increased to: ${this.maxHealth}`);
    }

    fullHeal() {
        this.health = this.maxHealth;
        this.scene.updatePlayerHealthUI(this.playerId, this.health, this.maxHealth);
        console.log(`Player fully healed to: ${this.health}/${this.maxHealth}`);
    }

    improveFireRate(speedIncrease) {
        const minFireRate = 2; // Attack speed cap - minimum fire rate (fastest possible)
        const level = this.scene.difficultyLevel || 1;

        // Much more gradual speed improvement scaling
        let actualSpeedIncrease;
        if (level <= 8) {
            actualSpeedIncrease = Math.max(0.5, speedIncrease * 0.3); // Only 30% at early levels
        } else if (level <= 12) {
            actualSpeedIncrease = Math.max(0.7, speedIncrease * 0.5); // 50% at mid levels
        } else if (level <= 15) {
            actualSpeedIncrease = Math.max(1, speedIncrease * 0.8); // 80% approaching level 15
        } else {
            actualSpeedIncrease = speedIncrease; // Full speed at 15+
        }

        const oldFireRate = this.fireRate;
        this.fireRate = Math.max(minFireRate, this.fireRate - actualSpeedIncrease);

        // Calculate and display current attack speed as a percentage
        const maxFireRate = 10; // Starting fire rate
        const speedPercentage = Math.round(((maxFireRate - this.fireRate) / (maxFireRate - minFireRate)) * 100);

        // Show speed improvement message
        this.scene.showFloatingText(this.x, this.y - 40,
            `ATTACK SPEED: ${speedPercentage}%`, 0x00ffff, 20);

        console.log(`Fire rate improved from ${oldFireRate} to ${this.fireRate} (Speed: ${speedPercentage}%) - Level ${level} scaling: ${actualSpeedIncrease}`);
        return this.fireRate;
    }

    getHealthPercentage() {
        return this.health / this.maxHealth;
    }

    die() {
        this.scene.addExplosion(this.x, this.y);
        this.scene.GameOver();
        this.destroy(); // destroy sprite so it is no longer updated
    }

    getPlayerId() {
        return this.playerId;
    }

    getCurrentHealth() {
        return this.health;
    }
}