// Enhanced EnemyFlying.js with varied movement patterns
import ASSETS from '../assets.js';
import EnemyBullet from './EnemyBullet.js';

export default class EnemyFlying extends Phaser.Physics.Arcade.Sprite {
    fireCounterMin = 100;
    fireCounterMax = 300;
    fireCounter;
    power = 1;

    constructor(scene, enemyType, movementPattern, speed, power, health = 1, color = 0xffffff) {
        super(scene, 500, 500, ASSETS.spritesheet.ships.key, enemyType.id);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.enemyType = enemyType;
        this.power = power;
        this.health = health;
        this.maxHealth = health;
        this.collisionPower = Math.min(power, 2);

        // Set fire rate based on enemy type
        this.fireCounterMin = enemyType.fireRate[0];
        this.fireCounterMax = enemyType.fireRate[1];
        this.fireCounter = Phaser.Math.RND.between(this.fireCounterMin, this.fireCounterMax);

        this.setFlipY(true);
        this.setDepth(10);
        this.scene = scene;

        if (color !== 0xffffff) {
            this.setTint(color);
        }

        // Initialize the new movement system
        this.initMovementPattern(movementPattern, speed);

        console.log(`Created ${enemyType.name} enemy with ${this.movementType} movement pattern`);
    }

    initMovementPattern(patternId, baseSpeed) {
        // Movement patterns with different behaviors
        const patterns = [
            { type: 'straight', name: 'Straight Down' },
            { type: 'sine_wave', name: 'Sine Wave' },
            { type: 'spiral', name: 'Spiral' },
            { type: 'zigzag', name: 'Zigzag' },
            { type: 'circle', name: 'Circular' },
            { type: 'bounce', name: 'Bouncing' },
            { type: 'seek_player', name: 'Player Seeking' },
            { type: 'orbital', name: 'Orbital' },
            { type: 'figure_eight', name: 'Figure Eight' },
            { type: 'random_walk', name: 'Random Walk' },
            { type: 'accelerating', name: 'Accelerating' },
            { type: 'stuttering', name: 'Stuttering' }
        ];

        // Use provided pattern or random
        const pattern = patterns[patternId] || Phaser.Math.RND.pick(patterns);
        this.movementType = pattern.type;
        this.movementName = pattern.name;

        // Common movement properties
        this.baseSpeed = baseSpeed * 300; // Convert to pixels per second
        this.startTime = Date.now();
        this.movementTimer = 0;
        this.isActive = true;

        // Choose spawn position based on movement type
        this.chooseSpawnPosition();

        // Initialize pattern-specific properties
        this.initPatternProperties();

        console.log(`Enemy spawned with ${this.movementName} pattern at (${this.x}, ${this.y})`);
    }

    chooseSpawnPosition() {
        const screenWidth = this.scene.scale.width;
        const screenHeight = this.scene.scale.height;
        const margin = 50;

        switch (this.movementType) {
            case 'straight':
            case 'sine_wave':
            case 'zigzag':
            case 'stuttering':
                // Spawn from top
                this.setPosition(
                    Phaser.Math.Between(margin, screenWidth - margin),
                    -margin
                );
                break;

            case 'spiral':
            case 'circle':
            case 'figure_eight':
                // Spawn from top center for symmetric patterns
                this.setPosition(screenWidth / 2, -margin);
                break;

            case 'bounce':
                // Spawn from either side
                const side = Phaser.Math.RND.pick(['left', 'right']);
                this.setPosition(
                    side === 'left' ? -margin : screenWidth + margin,
                    Phaser.Math.Between(100, screenHeight / 2)
                );
                break;

            case 'seek_player':
            case 'orbital':
            case 'random_walk':
                // Spawn from random edge
                const edge = Phaser.Math.RND.pick(['top', 'left', 'right']);
                switch (edge) {
                    case 'top':
                        this.setPosition(Phaser.Math.Between(margin, screenWidth - margin), -margin);
                        break;
                    case 'left':
                        this.setPosition(-margin, Phaser.Math.Between(50, screenHeight / 2));
                        break;
                    case 'right':
                        this.setPosition(screenWidth + margin, Phaser.Math.Between(50, screenHeight / 2));
                        break;
                }
                break;

            case 'accelerating':
                // Always spawn from top for acceleration effect
                this.setPosition(
                    Phaser.Math.Between(margin, screenWidth - margin),
                    -margin
                );
                break;

            default:
                // Default spawn from top
                this.setPosition(
                    Phaser.Math.Between(margin, screenWidth - margin),
                    -margin
                );
        }
    }

    initPatternProperties() {
        const screenWidth = this.scene.scale.width;
        const screenHeight = this.scene.scale.height;

        switch (this.movementType) {
            case 'sine_wave':
                this.amplitude = Phaser.Math.Between(80, 150);
                this.frequency = Phaser.Math.RND.realInRange(0.002, 0.008);
                this.centerX = this.x;
                break;

            case 'spiral':
                this.spiralRadius = 0;
                this.spiralRadiusIncrement = Phaser.Math.RND.realInRange(0.3, 0.8);
                this.spiralAngle = 0;
                this.spiralAngleIncrement = Phaser.Math.RND.realInRange(0.05, 0.15);
                this.spiralCenterX = this.x;
                this.spiralCenterY = this.y;
                break;

            case 'zigzag':
                this.zigzagDirection = Phaser.Math.RND.pick([-1, 1]);
                this.zigzagSpeed = Phaser.Math.Between(100, 200);
                this.zigzagChangeTimer = 0;
                this.zigzagChangeInterval = Phaser.Math.Between(500, 1500);
                break;

            case 'circle':
                this.circleRadius = Phaser.Math.Between(60, 120);
                this.circleAngle = Phaser.Math.RND.realInRange(0, Math.PI * 2);
                this.circleSpeed = Phaser.Math.RND.realInRange(0.02, 0.08);
                this.circleCenterX = screenWidth / 2;
                this.circleCenterY = 200;
                break;

            case 'bounce':
                this.bounceVelocityX = Phaser.Math.Between(100, 300) * (this.x < screenWidth / 2 ? 1 : -1);
                this.bounceVelocityY = Phaser.Math.Between(50, 150);
                this.setVelocity(this.bounceVelocityX, this.bounceVelocityY);
                break;

            case 'seek_player':
                this.seekForce = Phaser.Math.RND.realInRange(0.5, 1.5);
                this.maxSeekSpeed = this.baseSpeed * 1.5;
                this.lastPlayerPosition = { x: screenWidth / 2, y: screenHeight - 100 };
                break;

            case 'orbital':
                this.orbitRadius = Phaser.Math.Between(80, 150);
                this.orbitAngle = Phaser.Math.RND.realInRange(0, Math.PI * 2);
                this.orbitSpeed = Phaser.Math.RND.realInRange(0.02, 0.06);
                this.orbitCenterX = this.x;
                this.orbitCenterY = this.y + 100;
                break;

            case 'figure_eight':
                this.figureEightScale = Phaser.Math.Between(60, 100);
                this.figureEightT = 0;
                this.figureEightSpeed = Phaser.Math.RND.realInRange(0.01, 0.03);
                this.figureEightCenterX = this.x;
                this.figureEightCenterY = 200;
                break;

            case 'random_walk':
                this.randomWalkChangeTimer = 0;
                this.randomWalkChangeInterval = Phaser.Math.Between(300, 800);
                this.randomWalkVelocityX = Phaser.Math.Between(-150, 150);
                this.randomWalkVelocityY = Phaser.Math.Between(50, 150);
                break;

            case 'accelerating':
                this.accelerationRate = Phaser.Math.RND.realInRange(0.5, 2.0);
                this.currentSpeed = this.baseSpeed * 0.3; // Start slow
                break;

            case 'stuttering':
                this.stutterMoveTimer = 0;
                this.stutterPauseTimer = 0;
                this.stutterMoveTime = Phaser.Math.Between(200, 600);
                this.stutterPauseTime = Phaser.Math.Between(100, 400);
                this.stutterIsMoving = true;
                this.stutterVelocityY = this.baseSpeed;
                break;

            default: // straight
                this.setVelocityY(this.baseSpeed);
                break;
        }
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        if (!this.isActive) return;

        this.movementTimer += delta;

        // Update movement based on pattern
        this.updateMovementPattern(delta);

        // Check if enemy is off screen
        this.checkBounds();

        // Update firing
        if (this.fireCounter > 0) {
            this.fireCounter--;
        } else {
            this.fire();
        }
    }

    updateMovementPattern(delta) {
        const screenWidth = this.scene.scale.width;
        const screenHeight = this.scene.scale.height;

        switch (this.movementType) {
            case 'straight':
                // Already set velocity in init, just continue
                break;

            case 'sine_wave':
                this.y += (this.baseSpeed * delta) / 1000;
                this.x = this.centerX + Math.sin(this.movementTimer * this.frequency) * this.amplitude;
                break;

            case 'spiral':
                this.spiralRadius += this.spiralRadiusIncrement;
                this.spiralAngle += this.spiralAngleIncrement;
                this.spiralCenterY += (this.baseSpeed * delta) / 1000;

                this.x = this.spiralCenterX + Math.cos(this.spiralAngle) * this.spiralRadius;
                this.y = this.spiralCenterY + Math.sin(this.spiralAngle) * this.spiralRadius;
                break;

            case 'zigzag':
                this.zigzagChangeTimer += delta;
                if (this.zigzagChangeTimer >= this.zigzagChangeInterval) {
                    this.zigzagDirection *= -1;
                    this.zigzagChangeTimer = 0;
                    this.zigzagChangeInterval = Phaser.Math.Between(500, 1500);
                }

                this.setVelocity(
                    this.zigzagDirection * this.zigzagSpeed,
                    this.baseSpeed
                );
                break;

            case 'circle':
                this.circleAngle += this.circleSpeed;
                this.circleCenterY += (this.baseSpeed * delta) / 2000; // Move down slower

                this.x = this.circleCenterX + Math.cos(this.circleAngle) * this.circleRadius;
                this.y = this.circleCenterY + Math.sin(this.circleAngle) * this.circleRadius;
                break;

            case 'bounce':
                // Physics handles basic movement, just handle bouncing
                if (this.x <= 50 || this.x >= screenWidth - 50) {
                    this.bounceVelocityX *= -1;
                    this.setVelocityX(this.bounceVelocityX);
                }
                if (this.y <= 50) {
                    this.setVelocityY(Math.abs(this.body.velocity.y));
                }
                break;

            case 'seek_player':
                // Find nearest player
                const nearestPlayer = this.findNearestPlayer();
                if (nearestPlayer) {
                    this.lastPlayerPosition = { x: nearestPlayer.x, y: nearestPlayer.y };
                }

                // Calculate direction to player
                const dx = this.lastPlayerPosition.x - this.x;
                const dy = this.lastPlayerPosition.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > 0) {
                    const normalizedX = dx / distance;
                    const normalizedY = dy / distance;

                    // Apply seeking force
                    const forceX = normalizedX * this.seekForce * this.baseSpeed;
                    const forceY = normalizedY * this.seekForce * this.baseSpeed;

                    this.setVelocity(
                        Phaser.Math.Clamp(forceX, -this.maxSeekSpeed, this.maxSeekSpeed),
                        Phaser.Math.Clamp(forceY, -this.maxSeekSpeed, this.maxSeekSpeed)
                    );
                }
                break;

            case 'orbital':
                this.orbitAngle += this.orbitSpeed;
                this.orbitCenterY += (this.baseSpeed * delta) / 2000;

                this.x = this.orbitCenterX + Math.cos(this.orbitAngle) * this.orbitRadius;
                this.y = this.orbitCenterY + Math.sin(this.orbitAngle) * this.orbitRadius;
                break;

            case 'figure_eight':
                this.figureEightT += this.figureEightSpeed;
                this.figureEightCenterY += (this.baseSpeed * delta) / 3000;

                // Parametric equations for figure-8 (lemniscate)
                const scale = this.figureEightScale;
                const t = this.figureEightT;
                const sin_t = Math.sin(t);
                const cos_t = Math.cos(t);
                const denominator = 1 + sin_t * sin_t;

                this.x = this.figureEightCenterX + scale * cos_t / denominator;
                this.y = this.figureEightCenterY + scale * sin_t * cos_t / denominator;
                break;

            case 'random_walk':
                this.randomWalkChangeTimer += delta;
                if (this.randomWalkChangeTimer >= this.randomWalkChangeInterval) {
                    this.randomWalkVelocityX = Phaser.Math.Between(-150, 150);
                    this.randomWalkVelocityY = Phaser.Math.Between(50, 200);
                    this.randomWalkChangeTimer = 0;
                    this.randomWalkChangeInterval = Phaser.Math.Between(300, 800);
                }

                this.setVelocity(this.randomWalkVelocityX, this.randomWalkVelocityY);
                break;

            case 'accelerating':
                this.currentSpeed += this.accelerationRate * (delta / 1000);
                this.setVelocityY(this.currentSpeed);
                break;

            case 'stuttering':
                if (this.stutterIsMoving) {
                    this.stutterMoveTimer += delta;
                    this.setVelocityY(this.stutterVelocityY);

                    if (this.stutterMoveTimer >= this.stutterMoveTime) {
                        this.stutterIsMoving = false;
                        this.stutterMoveTimer = 0;
                        this.setVelocityY(0);
                    }
                } else {
                    this.stutterPauseTimer += delta;

                    if (this.stutterPauseTimer >= this.stutterPauseTime) {
                        this.stutterIsMoving = true;
                        this.stutterPauseTimer = 0;
                        this.stutterMoveTime = Phaser.Math.Between(200, 600);
                        this.stutterPauseTime = Phaser.Math.Between(100, 400);
                    }
                }
                break;
        }
    }

    findNearestPlayer() {
        if (!this.scene.gameState || !this.scene.gameState.players) return null;

        let nearestPlayer = null;
        let nearestDistance = Infinity;

        this.scene.gameState.players.forEach(player => {
            if (player && player.active && player.health > 0) {
                const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestPlayer = player;
                }
            }
        });

        return nearestPlayer;
    }

    checkBounds() {
        const screenWidth = this.scene.scale.width;
        const screenHeight = this.scene.scale.height;
        const margin = 100;

        // Remove enemy if too far off screen
        if (this.x < -margin || this.x > screenWidth + margin ||
            this.y > screenHeight + margin ||
            (this.y < -margin && this.movementType !== 'bounce')) {
            this.die();
        }
    }

    // Rest of the methods remain the same as original
    hit(damage) {
        this.health -= damage;
        this.showDamageEffect();

        if (this.health <= 0) {
            this.die();
        } else {
            this.showDamageText(damage);
        }
    }

    showDamageEffect() {
        const originalTint = this.tintTopLeft;
        this.setTint(0xff0000);

        this.scene.time.delayedCall(100, () => {
            if (this.active) {
                this.setTint(originalTint);
            }
        });

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
        this.scene.addExplosion(this.x, this.y);

        if (this.maxHealth >= 3) {
            this.scene.addExplosion(this.x + 15, this.y + 15);
            this.scene.addExplosion(this.x - 15, this.y - 15);
        }

        const baseScore = 10;
        const scoreMultiplier = Math.max(1, Math.floor(this.maxHealth / 2));
        const totalScore = baseScore * scoreMultiplier;

        this.scene.updateScore(totalScore);

        if (scoreMultiplier > 1) {
            this.scene.showFloatingText(this.x, this.y, `+${totalScore}`, 0xffff00, 18);
        }

        this.scene.removeEnemy(this);
    }

    fire() {
        this.fireCounter = Phaser.Math.RND.between(this.fireCounterMin, this.fireCounterMax);

        // Try multiple ways to fire enemy bullets to ensure compatibility
        if (this.scene.fireEnemyBullet) {
            // Method 1: Direct scene method (if available)
            this.scene.fireEnemyBullet(this.x, this.y, this.power);
        } else if (this.scene.enemyManager && this.scene.enemyManager.fireEnemyBullet) {
            // Method 2: Through enemy manager
            this.scene.enemyManager.fireEnemyBullet(this.x, this.y, this.power);
        } else {
            // Method 3: Create bullet directly (fallback for your current setup)
            try {
                const bullet = new EnemyBullet(this.scene, this.x, this.y, this.power);

                // Try to add to bullet group using different possible references
                if (this.scene.enemyBulletGroup) {
                    this.scene.enemyBulletGroup.add(bullet);
                } else if (this.scene.physicsManager && this.scene.physicsManager.enemyBulletGroup) {
                    this.scene.physicsManager.enemyBulletGroup.add(bullet);
                } else {
                    // Last resort - try to find the bullet group
                    const bulletGroup = this.scene.children.list.find(child =>
                        child.type === 'Group' && child.name === 'enemyBulletGroup'
                    );
                    if (bulletGroup) {
                        bulletGroup.add(bullet);
                    } else {
                        console.warn('Could not find enemy bullet group');
                    }
                }
            } catch (error) {
                console.error('Error creating enemy bullet:', error);
            }
        }
    }

    getPower() {
        return this.collisionPower || 1;
    }

    remove() {
        this.scene.removeEnemy(this);
    }
}