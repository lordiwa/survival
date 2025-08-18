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

        // Check if player has multi-shot capability
        if (this.bulletPower >= 2) {
            this.fireMultiShot();
        } else {
            this.scene.fireBullet(this.x, this.y, this.bulletPower);
        }
    }

    // NEW: Multi-shot firing system
    fireMultiShot() {
        const bulletSpeed = 1000;
        const diagonalAngle = 15; // Degrees for diagonal shots
        
        if (this.bulletPower === 2) {
            // Triple shot: center + 2 diagonal
            this.scene.fireBullet(this.x, this.y, 1); // Center bullet
            this.scene.fireDiagonalBullet(this.x, this.y, -diagonalAngle, 1); // Left diagonal
            this.scene.fireDiagonalBullet(this.x, this.y, diagonalAngle, 1);  // Right diagonal
        } 
        else if (this.bulletPower === 3) {
            // Five shot: center + 4 diagonal (wider spread)
            this.scene.fireBullet(this.x, this.y, 1); // Center bullet
            this.scene.fireDiagonalBullet(this.x, this.y, -diagonalAngle, 1); // Left diagonal
            this.scene.fireDiagonalBullet(this.x, this.y, diagonalAngle, 1);  // Right diagonal
            this.scene.fireDiagonalBullet(this.x, this.y, -diagonalAngle * 2, 1); // Far left
            this.scene.fireDiagonalBullet(this.x, this.y, diagonalAngle * 2, 1);  // Far right
        }
        else if (this.bulletPower >= 4) {
            // Seven shot: center + 6 diagonal (full spread)
            this.scene.fireBullet(this.x, this.y, 2); // Center bullet (more powerful)
            this.scene.fireDiagonalBullet(this.x, this.y, -10, 1);
            this.scene.fireDiagonalBullet(this.x, this.y, 10, 1);
            this.scene.fireDiagonalBullet(this.x, this.y, -20, 1);
            this.scene.fireDiagonalBullet(this.x, this.y, 20, 1);
            this.scene.fireDiagonalBullet(this.x, this.y, -30, 1);
            this.scene.fireDiagonalBullet(this.x, this.y, 30, 1);
        }
    }

    hit(damage) {
        // Don't take damage if invulnerable
        if (this.invulnerable) return;

        this.health -= damage;
        
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

    // NEW: Increase max health (used on level up)
    increaseMaxHealth(amount = 1) {
        this.maxHealth += amount;
        console.log(`Max health increased to: ${this.maxHealth}`);
    }

    // NEW: Full heal (used on level up)
    fullHeal() {
        this.health = this.maxHealth;
        this.scene.updatePlayerHealthUI(this.playerId, this.health, this.maxHealth);
        console.log(`Player fully healed to: ${this.health}/${this.maxHealth}`);
    }

    // FIXED: Add method to improve fire rate with cap
    improveFireRate(speedIncrease) {
        const minFireRate = 2; // ATTACK SPEED CAP - minimum fire rate (fastest possible)
        const oldFireRate = this.fireRate;
        
        this.fireRate = Math.max(minFireRate, this.fireRate - speedIncrease);
        
        console.log(`Fire rate improved from ${oldFireRate} to ${this.fireRate} (capped at ${minFireRate})`);
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

    getMaxHealth() {
        return this.maxHealth;
    }

    getBulletPower() {
        return this.bulletPower;
    }

    setBulletPower(power) {
        this.bulletPower = Math.max(1, Math.min(5, power)); // Clamp between 1 and 5
    }
}