import ASSETS from '../assets.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    velocityIncrement = 50;
    velocityMax = 500;
    drag = 1000;
    fireRate = 10;
    fireCounter = 0;
    maxHealth = 5; // Maximum health points
    health = 5; // Current health points
    invulnerabilityTime = 1000; // 1 second of invulnerability after being hit
    invulnerable = false;
    flashTimer = 0;
    flashDuration = 100; // Flash every 100ms when invulnerable
    bulletPower = 1; // Bullet damage power
    baseDamage = 1; // Base damage bonus from leveling up

    // Controller support variables
    gamepadIndex = -1; // Specific gamepad index for this player
    deadzone = 0.15; // Deadzone for analog sticks
    triggerThreshold = 0.1; // Threshold for trigger sensitivity

    constructor(scene, x, y, shipId, playerId = 1, gamepadIndex = -1) {
        super(scene, x, y, ASSETS.spritesheet.ships.key, shipId);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.playerId = playerId;
        this.gamepadIndex = gamepadIndex; // Assign specific controller
        this.setCollideWorldBounds(true); // prevent ship from leaving the screen
        this.setDepth(100); // make ship appear on top of other game objects
        this.scene = scene;
        this.setMaxVelocity(this.velocityMax); // limit maximum speed of ship
        this.setDrag(this.drag);

        // Initialize health UI
        this.scene.updatePlayerHealthUI(this.playerId, this.health, this.maxHealth);

        console.log(`Player ${this.playerId} created with controller index ${this.gamepadIndex}`);
    }

    getGamepad() {
        if (this.gamepadIndex >= 0 && navigator.getGamepads) {
            const gamepads = navigator.getGamepads();
            return gamepads[this.gamepadIndex] || null;
        }
        return null;
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
        let moveDirection = { x: 0, y: 0 };
        let shouldFire = false;

        // Get input from assigned controller
        const gamepad = this.getGamepad();
        if (gamepad) {
            const controllerInput = this.getControllerInput(gamepad);
            moveDirection = controllerInput.movement;
            shouldFire = controllerInput.shouldFire;
        } else if (this.playerId === 1) {
            // Fallback to keyboard for Player 1 only if no controller
            const cursors = this.scene.cursors;
            const leftKey = cursors.left.isDown;
            const rightKey = cursors.right.isDown;
            const upKey = cursors.up.isDown;
            const downKey = cursors.down.isDown;
            const spaceKey = cursors.space.isDown;

            if (leftKey) moveDirection.x--;
            if (rightKey) moveDirection.x++;
            if (upKey) moveDirection.y--;
            if (downKey) moveDirection.y++;
            shouldFire = spaceKey;
        }

        // Apply movement
        this.body.velocity.x += moveDirection.x * this.velocityIncrement;
        this.body.velocity.y += moveDirection.y * this.velocityIncrement;

        // Handle firing
        if (shouldFire) {
            this.fire();
        }
    }

    getControllerInput(gamepad) {
        if (!gamepad) {
            return { movement: { x: 0, y: 0 }, shouldFire: false };
        }

        // Xbox 360 Controller mapping:
        // Left stick: axes[0] = X, axes[1] = Y
        const leftStickX = gamepad.axes[0] || 0;
        const leftStickY = gamepad.axes[1] || 0;

        // Handle movement with deadzone
        const movement = { x: 0, y: 0 };

        if (Math.abs(leftStickX) > this.deadzone) {
            movement.x = leftStickX;
        }

        if (Math.abs(leftStickY) > this.deadzone) {
            movement.y = leftStickY;
        }

        // Handle shooting - try multiple methods for trigger detection
        let triggerPressed = false;

        // Method 1: Try right trigger as button (index 7)
        if (gamepad.buttons[7] && gamepad.buttons[7].pressed) {
            triggerPressed = true;
        }

        // Method 2: Try right trigger as axis (usually axes[5] or axes[2])
        if (!triggerPressed) {
            // Check axes[5] (right trigger on some browsers)
            if (gamepad.axes[5] !== undefined && gamepad.axes[5] > this.triggerThreshold) {
                triggerPressed = true;
            }
            // Check axes[2] (alternative trigger mapping)
            else if (gamepad.axes[2] !== undefined && gamepad.axes[2] > this.triggerThreshold) {
                triggerPressed = true;
            }
        }

        // Method 3: Try A button as alternative (button 0)
        if (!triggerPressed && gamepad.buttons[0] && gamepad.buttons[0].pressed) {
            triggerPressed = true;
        }

        return {
            movement: movement,
            shouldFire: triggerPressed
        };
    }

    fire() {
        if (this.fireCounter > 0) return;

        // Apply fire rate penalties for special patterns
        let fireRateMultiplier = 1;

        if (this.hasExplosiveCircular || this.hasCircularPattern) {
            fireRateMultiplier = 2; // 2x slower for circular patterns
        } else if (this.hasConeSpray) {
            fireRateMultiplier = 1.5; // 1.5x slower for cone spray
        }

        this.fireCounter = this.fireRate * fireRateMultiplier;

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

    // Fire explosive circular pattern (8 bullets in 360° instead of 12)
    fireExplosiveCircular(totalDamage) {
        const bulletCount = 8; // Reduced from 12
        for (let i = 0; i < bulletCount; i++) {
            const angle = (360 / bulletCount) * i;
            this.scene.fireDiagonalBullet(this.x, this.y, angle, totalDamage);
        }
    }

    // Fire cone spray pattern (10 bullets in 90° cone instead of 15, half damage)
    fireConeSpray(totalDamage) {
        const bulletCount = 10; // Reduced from 15
        const coneAngle = 90;
        const coneDamage = Math.max(1, Math.floor(totalDamage * 0.6)); // Increased damage from 0.5 to 0.6

        for (let i = 0; i < bulletCount; i++) {
            const angle = -45 + (90 / (bulletCount - 1)) * i; // -45° to +45°
            this.scene.fireDiagonalBullet(this.x, this.y, angle, coneDamage);
        }
    }

    // Fire circular pattern (6 bullets in 360° instead of 8)
    fireCircularPattern(totalDamage) {
        const bulletCount = 6; // Reduced from 8
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

            // Add controller vibration feedback
            this.vibrateController(300, 0.7, 1.0);

            console.log(`Player ${this.playerId} took ${cappedDamage} damage (was ${damage}) at level ${level}`);
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
        console.log(`Player ${this.playerId} max health increased to: ${this.maxHealth}`);
    }

    fullHeal() {
        this.health = this.maxHealth;
        this.scene.updatePlayerHealthUI(this.playerId, this.health, this.maxHealth);
        console.log(`Player ${this.playerId} fully healed to: ${this.health}/${this.maxHealth}`);
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

        console.log(`Player ${this.playerId} fire rate improved from ${oldFireRate} to ${this.fireRate} (Speed: ${speedPercentage}%) - Level ${level} scaling: ${actualSpeedIncrease}`);
        return this.fireRate;
    }

    getHealthPercentage() {
        return this.health / this.maxHealth;
    }

    die() {
        console.log(`Player ${this.playerId} has died!`);

        // Store position and scene reference before destruction
        const deathX = this.x;
        const deathY = this.y;
        const scene = this.scene;

        // Create death explosion safely
        if (scene && scene.addExplosion) {
            scene.addExplosion(deathX, deathY);
        }

        // Show death message
        if (scene && scene.showFloatingText) {
            scene.showFloatingText(deathX, deathY - 50, `PLAYER ${this.playerId}\nDEFEAT!`, 0xff0000, 24);
        }

        // Screen effects
        if (scene && scene.cameras && scene.cameras.main) {
            scene.cameras.main.shake(400, 0.02);
        }

        // Controller vibration for death
        this.vibrateController(800, 1.0, 1.0);

        // Notify scene of player death BEFORE destroying
        if (scene && scene.onPlayerDeath) {
            scene.onPlayerDeath(this.playerId);
        }

        // Remove from player group
        if (scene && scene.playerGroup) {
            scene.playerGroup.remove(this);
        }

        // Multiple explosions for dramatic effect with safety checks
        for (let i = 1; i < 4; i++) {
            if (scene && scene.time) {
                scene.time.delayedCall(i * 150, () => {
                    // Double-check scene is still valid and active
                    if (scene && scene.addExplosion && scene.scene && scene.scene.isActive()) {
                        const offsetX = Phaser.Math.Between(-30, 30);
                        const offsetY = Phaser.Math.Between(-30, 30);
                        scene.addExplosion(deathX + offsetX, deathY + offsetY);
                    }
                });
            }
        }

        this.destroy(); // destroy sprite so it is no longer updated
    }

    getPlayerId() {
        return this.playerId;
    }

    getCurrentHealth() {
        return this.health;
    }

    // NEW: Get controller status for debugging
    getControllerStatus() {
        const gamepad = this.getGamepad();
        return {
            playerId: this.playerId,
            gamepadIndex: this.gamepadIndex,
            connected: !!gamepad,
            gamepadId: gamepad ? gamepad.id : 'None'
        };
    }

    // NEW: Vibrate controller if supported (for hit feedback)
    vibrateController(duration = 200, weakMagnitude = 0.5, strongMagnitude = 0.8) {
        const gamepad = this.getGamepad();
        if (gamepad && gamepad.vibrationActuator) {
            gamepad.vibrationActuator.playEffect('dual-rumble', {
                duration: duration,
                weakMagnitude: weakMagnitude,
                strongMagnitude: strongMagnitude
            }).catch(err => {
                // Vibration not supported, ignore silently
                console.log(`Vibration not supported for Player ${this.playerId}`);
            });
        }
    }
}