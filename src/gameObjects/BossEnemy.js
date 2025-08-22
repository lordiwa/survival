// src/gameObjects/BossEnemy.js
import ASSETS from '../assets.js';
import EnemyFlying from './EnemyFlying.js';

export default class BossEnemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, bossType, level) {
        // Use different ship sprites for different boss types
        const shipId = bossType.shipId;
        super(scene, scene.scale.width / 2, -100, ASSETS.spritesheet.ships.key, shipId);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene = scene;
        this.bossType = bossType;
        this.level = level;

        // Boss stats based on level
        this.maxHealth = this.calculateBossHealth(level);
        this.health = this.maxHealth;
        this.power = Math.min(2 + Math.floor(level / 4), 6); // Reduced power scaling

        // Boss scaling - smaller visual but same intimidation
        const scale = 2.0 + (level * 0.05); // Reduced scaling to help with hitbox
        this.setScale(scale);
        this.setDepth(20);
        this.setTint(bossType.color);

        // Fixed hitbox sizing for higher levels
        if (level >= 10) {
            // For high level bosses, use a larger, more reliable hitbox
            this.body.setSize(120, 120);
        } else {
            // For early bosses, smaller hitbox
            this.body.setSize(80, 80);
        }

        // Movement properties
        this.moveSpeed = 100;
        this.direction = 1;
        this.centerX = scene.scale.width / 2;
        this.targetY = 150; // Boss hover position
        this.isPositioned = false;

        // Attack properties
        this.attackTimer = 0;
        this.attackCooldown = bossType.attackCooldown;
        this.phaseChangeThreshold = [0.75, 0.5, 0.25]; // Health % for phase changes
        this.currentPhase = 0;

        // Spawner boss specific
        this.spawnTimer = 0;
        this.spawnCooldown = 3000; // 3 seconds between spawns (was 2)

        // Initialize movement to center
        this.setVelocity(0, this.moveSpeed);

        // Create health bar
        this.createHealthBar();

        console.log(`Boss spawned: ${bossType.name} (Level ${level}) - Health: ${this.health}`);
    }

    calculateBossHealth(level) {
        // Simple linear scaling: 10k, 20k, 30k, 40k, etc.
        return (level / 5) * 10000; // Level 5 = 10k, Level 10 = 20k, Level 15 = 30k, etc.
    }

    createHealthBar() {
        const barWidth = 400;
        const barHeight = 20;
        const x = this.scene.scale.width / 2 - barWidth / 2;
        const y = 30;

        // Background
        this.healthBarBg = this.scene.add.rectangle(x, y, barWidth, barHeight, 0x333333)
            .setOrigin(0, 0)
            .setStrokeStyle(2, 0xffffff)
            .setDepth(200);

        // Fill
        this.healthBarFill = this.scene.add.rectangle(x + 2, y + 2, barWidth - 4, barHeight - 4, 0xff0000)
            .setOrigin(0, 0)
            .setDepth(201);

        // Text
        this.healthBarText = this.scene.add.text(this.scene.scale.width / 2, y + barHeight / 2,
            `${this.bossType.name} Boss`, {
                fontFamily: 'Arial Black',
                fontSize: 16,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2,
            }).setOrigin(0.5).setDepth(202);

        // Boss name
        this.bossNameText = this.scene.add.text(this.scene.scale.width / 2, y - 25,
            this.bossType.name.toUpperCase(), {
                fontFamily: 'Arial Black',
                fontSize: 24,
                color: Phaser.Display.Color.IntegerToRGB(this.bossType.color),
                stroke: '#000000',
                strokeThickness: 4,
            }).setOrigin(0.5).setDepth(202);
    }

    updateHealthBar() {
        if (!this.healthBarFill) return;

        const healthPercentage = this.health / this.maxHealth;
        const maxWidth = 396; // barWidth - 4
        this.healthBarFill.width = maxWidth * healthPercentage;

        // Change color based on health
        let color = 0xff0000; // Red
        if (healthPercentage > 0.6) color = 0x00ff00; // Green
        else if (healthPercentage > 0.3) color = 0xffff00; // Yellow

        this.healthBarFill.setFillStyle(color);

        this.healthBarText.setText(`${this.health}/${this.maxHealth}`);
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        // Move to position
        if (!this.isPositioned) {
            if (this.y >= this.targetY) {
                this.setVelocity(0, 0);
                this.y = this.targetY;
                this.isPositioned = true;
            }
            return;
        }

        // Update movement pattern
        this.updateMovement(delta);

        // Update attack pattern
        this.updateAttack(delta);

        // Check for phase changes
        this.checkPhaseChange();
    }

    updateMovement(delta) {
        // Side-to-side movement
        this.x += this.direction * (this.moveSpeed * 0.5) * (delta / 1000);

        if (this.x <= 100 || this.x >= this.scene.scale.width - 100) {
            this.direction *= -1;
        }
    }

    updateAttack(delta) {
        this.attackTimer += delta;

        if (this.attackTimer >= this.attackCooldown) {
            this.performAttack();
            this.attackTimer = 0;

            // Reduce cooldown in later phases
            const phaseMultiplier = 1 - (this.currentPhase * 0.15);
            this.attackCooldown = this.bossType.attackCooldown * phaseMultiplier;
        }

        // Handle spawner boss
        if (this.bossType.name === 'Spawner') {
            this.spawnTimer += delta;
            if (this.spawnTimer >= this.spawnCooldown) {
                this.spawnMinion();
                this.spawnTimer = 0;
            }
        }
    }

    performAttack() {
        switch (this.bossType.name) {
            case 'Destroyer':
                this.destroyerAttack();
                break;
            case 'Spreader':
                this.spreaderAttack();
                break;
            case 'Pulsar':
                this.pulsarAttack();
                break;
            case 'Spawner':
                // Spawner attacks by spawning minions (handled in updateAttack)
                this.spawnerAttack();
                break;
        }
    }

    // DESTROYER: Fires powerful focused beams
    destroyerAttack() {
        const shotCount = 2 + this.currentPhase; // Reduced from 3
        const interval = 300; // Increased from 200ms

        for (let i = 0; i < shotCount; i++) {
            this.scene.time.delayedCall(i * interval, () => {
                if (this.active) {
                    // Fire powerful beam at player
                    this.scene.fireEnemyBullet(this.x, this.y + 40, this.power + 1); // Reduced power bonus

                    // Add side shots in later phases
                    if (this.currentPhase >= 2) { // Only in phase 2+ instead of 1+
                        this.scene.fireEnemyBullet(this.x - 30, this.y + 40, this.power);
                        this.scene.fireEnemyBullet(this.x + 30, this.y + 40, this.power);
                    }
                }
            });
        }
    }

    // SPREADER: Fires wide bullet spreads
    spreaderAttack() {
        const angles = [-60, -30, -15, 0, 15, 30, 60];
        const additionalAngles = [-45, -22.5, 22.5, 45]; // Extra shots in later phases

        // Base spread
        angles.forEach((angle, index) => {
            this.scene.time.delayedCall(index * 50, () => {
                if (this.active) {
                    this.scene.fireEnemyBulletAngled(this.x, this.y + 40, this.power, angle);
                }
            });
        });

        // Additional spread in phase 2+
        if (this.currentPhase >= 1) {
            additionalAngles.forEach((angle, index) => {
                this.scene.time.delayedCall(350 + (index * 50), () => {
                    if (this.active) {
                        this.scene.fireEnemyBulletAngled(this.x, this.y + 40, this.power, angle);
                    }
                });
            });
        }
    }

    // PULSAR: Fires rotating bullet waves
    pulsarAttack() {
        const waveCount = 2 + this.currentPhase;
        const bulletsPerWave = 8;

        for (let wave = 0; wave < waveCount; wave++) {
            this.scene.time.delayedCall(wave * 300, () => {
                if (this.active) {
                    const rotationOffset = wave * 22.5; // Rotate each wave

                    for (let i = 0; i < bulletsPerWave; i++) {
                        const angle = (360 / bulletsPerWave) * i + rotationOffset;
                        this.scene.fireEnemyBulletAngled(this.x, this.y + 20, this.power, angle);
                    }
                }
            });
        }
    }

    // SPAWNER: Light attack since it spawns minions
    spawnerAttack() {
        // Light bullet attack
        this.scene.fireEnemyBullet(this.x, this.y + 40, this.power);

        // Triple shot in later phases
        if (this.currentPhase >= 1) {
            this.scene.fireEnemyBullet(this.x - 20, this.y + 40, this.power);
            this.scene.fireEnemyBullet(this.x + 20, this.y + 40, this.power);
        }
    }

    spawnMinion() {
        if (!this.active) return;

        // Spawn positions around the boss
        const spawnPositions = [
            { x: this.x - 80, y: this.y },
            { x: this.x + 80, y: this.y },
            { x: this.x - 120, y: this.y + 60 },
            { x: this.x + 120, y: this.y + 60 }
        ];

        const spawnPos = Phaser.Math.RND.pick(spawnPositions);

        // Create a smaller enemy as minion
        const minionType = this.scene.enemyShipTypes[0]; // Basic enemy type
        const minion = new EnemyFlying(this.scene, minionType, 0, 0.001, this.power - 1,
            Math.max(1, this.level), this.bossType.color);

        // Position the minion
        minion.setPosition(spawnPos.x, spawnPos.y);
        minion.setScale(0.7); // Smaller than normal

        // Override minion's path system - make it move down
        minion.pathIndex = 2; // Skip path following
        minion.setVelocityY(150);

        this.scene.enemyGroup.add(minion);

        console.log('Boss spawned minion at', spawnPos);
    }

    checkPhaseChange() {
        const healthPercentage = this.health / this.maxHealth;
        const newPhase = this.phaseChangeThreshold.findIndex(threshold => healthPercentage > threshold);
        const targetPhase = newPhase === -1 ? this.phaseChangeThreshold.length : newPhase;

        if (targetPhase > this.currentPhase) {
            this.currentPhase = targetPhase;
            this.enterPhaseTransition();
            console.log(`Boss phase change: ${this.currentPhase}`);
        }
    }

    enterPhaseTransition() {
        // Make boss temporarily invulnerable during phase change
        this.isInvulnerable = true;
        this.setTint(0xffffff); // White tint to show invulnerability

        // Visual invulnerability effect - pulsing white
        this.invulnerabilityTween = this.scene.tweens.add({
            targets: this,
            alpha: 0.3,
            duration: 200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Show epic phase change effects
        this.showPhaseChangeEffect();

        // Spawn minion ships during phase transition
        this.spawnPhaseTransitionMinions();

        // End invulnerability after 3 seconds
        this.scene.time.delayedCall(3000, () => {
            this.endPhaseTransition();
        });
    }

    endPhaseTransition() {
        this.isInvulnerable = false;
        this.setTint(this.bossType.color); // Return to boss color
        this.setAlpha(1); // Return to full opacity

        // Stop invulnerability animation
        if (this.invulnerabilityTween) {
            this.invulnerabilityTween.stop();
            this.invulnerabilityTween = null;
        }

        console.log('Boss phase transition ended - now vulnerable');
    }

    spawnPhaseTransitionMinions() {
        const minionCount = 6 + (this.currentPhase * 2); // More minions per phase
        const spawnRadius = 150;

        console.log(`Spawning ${minionCount} phase transition minions`);

        for (let i = 0; i < minionCount; i++) {
            // Delay spawning to create a wave effect
            this.scene.time.delayedCall(i * 150, () => {
                if (!this.scene || !this.active) return; // Safety check

                // Calculate spawn position around the boss
                const angle = (360 / minionCount) * i;
                const angleRad = Phaser.Math.DegToRad(angle);
                const spawnX = this.x + Math.cos(angleRad) * spawnRadius;
                const spawnY = this.y + Math.sin(angleRad) * spawnRadius;

                // Get enemy type from GameState instead of scene
                const minionType = this.scene.gameState ?
                    this.scene.gameState.enemyShipTypes[0] :
                    { id: 12, name: 'Basic', shootPattern: 'single', fireRate: [100, 300] }; // Fallback

                // Create minion using the enemy manager
                let minion;
                if (this.scene.enemyManager && this.scene.enemyManager.addEnemy) {
                    // Use enemy manager if available
                    minion = this.scene.enemyManager.addEnemy(
                        minionType,
                        0, // pathId (will be overridden)
                        0.001, // speed
                        Math.max(1, this.power - 2), // Weaker than boss
                        Math.max(1, Math.floor(this.level / 2)), // Less health
                        this.bossType.color
                    );
                } else {
                    // Fallback: create directly using the old method
                    const EnemyFlying = this.scene.EnemyFlying ||
                        (typeof window !== 'undefined' && window.EnemyFlying);

                    if (EnemyFlying) {
                        minion = new EnemyFlying(
                            this.scene,
                            minionType,
                            0, // pathId
                            0.001, // speed
                            Math.max(1, this.power - 2), // power
                            Math.max(1, Math.floor(this.level / 2)), // health
                            this.bossType.color
                        );

                        // Add to enemy group
                        if (this.scene.enemyGroup) {
                            this.scene.enemyGroup.add(minion);
                        }
                    }
                }

                // Position and customize the minion
                if (minion) {
                    minion.setPosition(spawnX, spawnY);
                    minion.setScale(0.6); // Smaller than normal
                    minion.setTint(this.bossType.color);

                    // Override minion's path system - make it move toward player
                    minion.pathIndex = 2; // Skip path following

                    // Set velocity toward player or downward
                    if (this.scene.gameState && this.scene.gameState.players) {
                        // Find first alive player
                        const alivePlayer = this.scene.gameState.players.find(p => p && p.active && p.health > 0);

                        if (alivePlayer) {
                            const dx = alivePlayer.x - spawnX;
                            const dy = alivePlayer.y - spawnY;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            const speed = 100;
                            minion.setVelocity((dx / distance) * speed, (dy / distance) * speed);
                        } else {
                            minion.setVelocityY(150); // Move downward if no players
                        }
                    } else {
                        minion.setVelocityY(150); // Move downward as fallback
                    }

                    // Add spawn effect
                    const spawnFlash = this.scene.add.circle(spawnX, spawnY, 30, this.bossType.color, 0.8);
                    spawnFlash.setDepth(25);

                    this.scene.tweens.add({
                        targets: spawnFlash,
                        scaleX: 2,
                        scaleY: 2,
                        alpha: 0,
                        duration: 400,
                        ease: 'Power2',
                        onComplete: () => spawnFlash.destroy()
                    });
                }
            });
        }
    }

    showPhaseChangeEffect() {
        // Store position for centered effects
        const centerX = this.scene.scale.width / 2;
        const centerY = this.scene.scale.height / 2;

        // Full screen flash effect
        const screenFlash = this.scene.add.rectangle(centerX, centerY,
            this.scene.scale.width, this.scene.scale.height, 0xff0000, 0.6);
        screenFlash.setDepth(1000);

        this.scene.tweens.add({
            targets: screenFlash,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => screenFlash.destroy()
        });

        // Boss flash effect
        const bossFlash = this.scene.add.circle(this.x, this.y, 200, 0xffffff, 0.9);
        bossFlash.setDepth(999);

        this.scene.tweens.add({
            targets: bossFlash,
            scaleX: 4,
            scaleY: 4,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => bossFlash.destroy()
        });

        // WARNING text at top of screen
        const warningText = this.scene.add.text(centerX, centerY - 100, 'WARNING!', {
            fontFamily: 'Arial Black',
            fontSize: 64,
            color: '#ff0000',
            stroke: '#ffffff',
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(1002);

        // PHASE text in center of screen
        const phaseText = this.scene.add.text(centerX, centerY, `PHASE ${this.currentPhase + 1}`, {
            fontFamily: 'Arial Black',
            fontSize: 72,
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 10,
            align: 'center'
        }).setOrigin(0.5).setDepth(1002);

        // Boss name at bottom
        const bossNameText = this.scene.add.text(centerX, centerY + 100, this.bossType.name.toUpperCase(), {
            fontFamily: 'Arial Black',
            fontSize: 48,
            color: Phaser.Display.Color.IntegerToRGB(this.bossType.color),
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5).setDepth(1002);

        // Animate all text elements
        [warningText, phaseText, bossNameText].forEach((text, index) => {
            // Start scaled down and fade in
            text.setScale(0.1);
            text.setAlpha(0);

            this.scene.tweens.add({
                targets: text,
                scaleX: 1.2,
                scaleY: 1.2,
                alpha: 1,
                duration: 400,
                delay: index * 150, // Stagger the animations
                ease: 'Back.easeOut',
                onComplete: () => {
                    // Hold for a moment then fade out
                    this.scene.tweens.add({
                        targets: text,
                        scaleX: 0.8,
                        scaleY: 0.8,
                        alpha: 0,
                        duration: 600,
                        delay: 800,
                        ease: 'Power2',
                        onComplete: () => text.destroy()
                    });
                }
            });
        });

        // Multiple screen shakes
        this.scene.cameras.main.shake(500, 0.02);

        // Additional screen shake after delay
        this.scene.time.delayedCall(300, () => {
            this.scene.cameras.main.shake(300, 0.015);
        });

        console.log(`Boss phase change: ${this.currentPhase} - EPIC VISUAL EFFECT!`);
    }

    hit(damage) {
        // Don't take damage if invulnerable during phase transition
        if (this.isInvulnerable) {
            // Show invulnerability effect
            const immuneText = this.scene.add.text(this.x, this.y - 60, 'IMMUNE!', {
                fontFamily: 'Arial Black',
                fontSize: 20,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5).setDepth(30);

            this.scene.tweens.add({
                targets: immuneText,
                y: immuneText.y - 30,
                alpha: 0,
                duration: 800,
                ease: 'Power2',
                onComplete: () => immuneText.destroy()
            });

            return; // No damage taken
        }

        this.health -= damage;
        this.updateHealthBar();

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

        this.scene.time.delayedCall(150, () => {
            if (this.active) {
                this.setTint(originalTint);
            }
        });

        // Screen shake for boss hits
        this.scene.cameras.main.shake(150, 0.008);
    }

    showDamageText(damage) {
        const damageText = this.scene.add.text(this.x, this.y - 40, `-${damage}`, {
            fontFamily: 'Arial Black',
            fontSize: 24,
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(30);

        this.scene.tweens.add({
            targets: damageText,
            y: damageText.y - 50,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => damageText.destroy()
        });
    }

    die() {
        // Store position and scene reference before destruction
        const deathX = this.x;
        const deathY = this.y;
        const scene = this.scene;

        // Epic explosion sequence
        scene.addExplosion(deathX, deathY);

        // Multiple explosions
        for (let i = 0; i < 8; i++) {
            scene.time.delayedCall(i * 100, () => {
                const offsetX = Phaser.Math.Between(-60, 60);
                const offsetY = Phaser.Math.Between(-60, 60);
                scene.addExplosion(deathX + offsetX, deathY + offsetY);
            });
        }

        // Big score bonus
        const scoreBonus = 500 * this.level;
        scene.updateScore(scoreBonus);
        scene.showFloatingText(deathX, deathY, `+${scoreBonus}`, 0xffff00, 36);

        // Clean up health bar
        if (this.healthBarBg) this.healthBarBg.destroy();
        if (this.healthBarFill) this.healthBarFill.destroy();
        if (this.healthBarText) this.healthBarText.destroy();
        if (this.bossNameText) this.bossNameText.destroy();

        // Epic death effect
        scene.cameras.main.shake(1000, 0.02);

        // Remove from scene
        scene.removeBoss(this);
    }

    remove() {
        this.scene.removeBoss(this);
    }

    getPower() {
        return this.power;
    }
}

// Boss type definitions
export const BOSS_TYPES = [
    {
        name: 'Destroyer',
        shipId: 4, // Heavy ship
        color: 0xff0000, // Red
        attackCooldown: 2000,
        description: 'Fires devastating focused beams'
    },
    {
        name: 'Spreader',
        shipId: 6, // Bomber ship
        color: 0x00ff00, // Green
        attackCooldown: 1800,
        description: 'Unleashes wide bullet spreads'
    },
    {
        name: 'Pulsar',
        shipId: 7, // Elite ship
        color: 0x0088ff, // Blue
        attackCooldown: 2200,
        description: 'Creates rotating bullet waves'
    },
    {
        name: 'Spawner',
        shipId: 2, // Player ship variant
        color: 0xff00ff, // Magenta
        attackCooldown: 1500,
        description: 'Spawns minion enemies'
    }
];