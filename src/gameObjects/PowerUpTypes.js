// Fixed PowerUpTypes.js with proper pattern management
import PowerUp from './PowerUp.js';
import { POWERUP_CONFIG } from '../config/PowerUpConfig.js';

// Health Recovery Power-up
export class HealthPowerUp extends PowerUp {
    constructor(scene, x, y) {
        super(scene, x, y, POWERUP_CONFIG.TILE_IDS.HEALTH, 'health', POWERUP_CONFIG.COLORS.HEALTH);
    }

    applyEffect(player) {
        const healAmount = POWERUP_CONFIG.EFFECTS.HEALTH.HEAL_AMOUNT;
        const oldHealth = player.getCurrentHealth();
        player.heal(healAmount);
        const newHealth = player.getCurrentHealth();

        this.showFloatingText(`+${newHealth - oldHealth} HP`, 0x00ff00);
        this.showHealingEffect(player);
        console.log(`Healed player for ${newHealth - oldHealth} HP`);
    }

    showHealingEffect(player) {
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const distance = 40;
            const x = player.x + Math.cos(angle) * distance;
            const y = player.y + Math.sin(angle) * distance;

            const sparkle = this.scene.add.circle(x, y, 3, 0x00ff00);
            sparkle.setDepth(25);

            this.scene.tweens.add({
                targets: sparkle,
                x: player.x,
                y: player.y,
                alpha: 0,
                duration: 500,
                ease: 'Power2',
                onComplete: () => sparkle.destroy()
            });
        }
    }
}

// Attack Speed Power-up
export class AttackSpeedPowerUp extends PowerUp {
    constructor(scene, x, y) {
        super(scene, x, y, POWERUP_CONFIG.TILE_IDS.ATTACK_SPEED, 'attackSpeed', POWERUP_CONFIG.COLORS.ATTACK_SPEED);
    }

    applyEffect(player) {
        const speedIncrease = POWERUP_CONFIG.EFFECTS.ATTACK_SPEED.SPEED_INCREASE;
        const newFireRate = player.improveFireRate(speedIncrease);

        this.showFloatingText('RAPID FIRE!', 0xffff00);
        this.showSpeedEffect(player);
        console.log(`Attack speed power-up collected! New fire rate: ${newFireRate}`);
    }

    showSpeedEffect(player) {
        for (let i = 0; i < 3; i++) {
            const ring = this.scene.add.circle(player.x, player.y, 20 + (i * 15), 0xffff00, 0);
            ring.setStrokeStyle(3, 0xffff00, 0.8);
            ring.setDepth(25);

            this.scene.tweens.add({
                targets: ring,
                scaleX: 2 + i,
                scaleY: 2 + i,
                alpha: 0,
                duration: 600 + (i * 200),
                ease: 'Power2',
                onComplete: () => ring.destroy()
            });
        }
    }
}

// Bullet Power +2 Power-up (Triple shot) - RESETS PATTERNS
export class BulletPower2PowerUp extends PowerUp {
    constructor(scene, x, y) {
        super(scene, x, y, POWERUP_CONFIG.TILE_IDS.BULLET_POWER_2, 'bulletPower2', POWERUP_CONFIG.COLORS.BULLET_POWER_2);
    }

    applyEffect(player) {
        // CLEAR ALL SPECIAL PATTERNS when switching to multi-shot
        player.clearAllShootingPatterns();

        // Set bullet power to 2 for triple shot
        player.bulletPower = 2;

        this.showFloatingText('TRIPLE SHOT!', 0x00ff00);
        this.showPowerEffect(player, 0x00ff00);
        console.log(`Triple shot unlocked! Previous patterns cleared. Bullet power: ${player.bulletPower}`);
    }

    showPowerEffect(player, color) {
        const burst = this.scene.add.circle(player.x, player.y, 10, color, 0);
        burst.setStrokeStyle(4, color, 1);
        burst.setDepth(25);

        this.scene.tweens.add({
            targets: burst,
            scaleX: 4,
            scaleY: 4,
            alpha: 0,
            duration: 400,
            ease: 'Power3',
            onComplete: () => burst.destroy()
        });
    }
}

// Bullet Power +3 Power-up (Five shot) - RESETS PATTERNS
export class BulletPower3PowerUp extends PowerUp {
    constructor(scene, x, y) {
        super(scene, x, y, POWERUP_CONFIG.TILE_IDS.BULLET_POWER_3, 'bulletPower3', POWERUP_CONFIG.COLORS.BULLET_POWER_3);
    }

    applyEffect(player) {
        // CLEAR ALL SPECIAL PATTERNS when switching to multi-shot
        player.clearAllShootingPatterns();

        // Set bullet power to 3 for five shot
        player.bulletPower = 3;

        this.showFloatingText('FIVE SHOT!', 0x0066ff);
        this.showPowerEffect(player, 0x0066ff);
        console.log(`Five shot unlocked! Previous patterns cleared. Bullet power: ${player.bulletPower}`);
    }

    showPowerEffect(player, color) {
        for (let i = 0; i < 2; i++) {
            const burst = this.scene.add.circle(player.x, player.y, 15 + (i * 10), color, 0);
            burst.setStrokeStyle(5, color, 1);
            burst.setDepth(25);

            this.scene.tweens.add({
                targets: burst,
                scaleX: 4 + i,
                scaleY: 4 + i,
                alpha: 0,
                duration: 500 + (i * 100),
                ease: 'Power3',
                onComplete: () => burst.destroy()
            });
        }
    }
}

// Bullet Power +5 Power-up (Seven shot) - RESETS PATTERNS
export class BulletPower5PowerUp extends PowerUp {
    constructor(scene, x, y) {
        super(scene, x, y, POWERUP_CONFIG.TILE_IDS.BULLET_POWER_5, 'bulletPower5', POWERUP_CONFIG.COLORS.BULLET_POWER_5);
    }

    applyEffect(player) {
        // CLEAR ALL SPECIAL PATTERNS when switching to multi-shot
        player.clearAllShootingPatterns();

        // Set bullet power to 5 for maximum spread
        player.bulletPower = 5;

        this.showFloatingText('MEGA SHOT!', 0xff00ff);
        this.showMegaPowerEffect(player);
        console.log(`Mega shot unlocked! Previous patterns cleared. Bullet power: ${player.bulletPower}`);
    }

    showMegaPowerEffect(player) {
        for (let i = 0; i < 4; i++) {
            const ring = this.scene.add.circle(player.x, player.y, 20 + (i * 12), 0xff00ff, 0);
            ring.setStrokeStyle(4, 0xff00ff, 0.9);
            ring.setDepth(25);

            this.scene.tweens.add({
                targets: ring,
                scaleX: 5 + i,
                scaleY: 5 + i,
                alpha: 0,
                duration: 800 + (i * 150),
                ease: 'Power3',
                onComplete: () => ring.destroy()
            });
        }

        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const distance = 30;
            const x = player.x + Math.cos(angle) * distance;
            const y = player.y + Math.sin(angle) * distance;

            const sparkle = this.scene.add.circle(x, y, 4, 0xff00ff);
            sparkle.setDepth(26);

            this.scene.tweens.add({
                targets: sparkle,
                x: x + Math.cos(angle) * 80,
                y: y + Math.sin(angle) * 80,
                alpha: 0,
                duration: 1000,
                ease: 'Power2',
                onComplete: () => sparkle.destroy()
            });
        }
    }
}

// Damage Boost Power-up (PERMANENT)
export class DamageBoostPowerUp extends PowerUp {
    constructor(scene, x, y) {
        super(scene, x, y, POWERUP_CONFIG.TILE_IDS.DAMAGE_BOOST, 'damageBoost', POWERUP_CONFIG.COLORS.DAMAGE_BOOST);
    }

    applyEffect(player) {
        const damageIncrease = POWERUP_CONFIG.EFFECTS.DAMAGE_BOOST.DAMAGE_INCREASE;
        player.baseDamage = (player.baseDamage || 1) + damageIncrease;

        this.showFloatingText(`+${damageIncrease} DAMAGE!`, 0xff8844);
        this.showDamageEffect(player);
        console.log(`PERMANENT damage increased by ${damageIncrease}! New base damage: ${player.baseDamage}`);
    }

    showDamageEffect(player) {
        for (let i = 0; i < 6; i++) {
            const spark = this.scene.add.circle(player.x + Phaser.Math.Between(-30, 30),
                player.y + Phaser.Math.Between(-30, 30), 5, 0xff8844);
            spark.setDepth(25);

            this.scene.tweens.add({
                targets: spark,
                scaleX: 0.1,
                scaleY: 0.1,
                alpha: 0,
                duration: 800,
                ease: 'Power2',
                onComplete: () => spark.destroy()
            });
        }
    }
}

// Circular Pattern Power-up - REPLACES OTHER PATTERNS
export class CircularPatternPowerUp extends PowerUp {
    constructor(scene, x, y) {
        super(scene, x, y, POWERUP_CONFIG.TILE_IDS.CIRCULAR_PATTERN, 'circularPattern', POWERUP_CONFIG.COLORS.CIRCULAR_PATTERN);
    }

    applyEffect(player) {
        // CLEAR ALL PATTERNS and set circular as the active pattern
        player.clearAllShootingPatterns();
        player.hasCircularPattern = true;

        // Reset bullet power to 1 since we're using a special pattern
        player.bulletPower = 1;

        this.showFloatingText('CIRCULAR PATTERN!', 0x44ffff);
        this.showCircularEffect(player);

        console.log('Circular pattern activated! Previous patterns cleared.');
    }

    showCircularEffect(player) {
        for (let i = 0; i < 8; i++) {
            const angle = (360 / 8) * i;
            const angleRad = Phaser.Math.DegToRad(angle);
            const distance = 50;
            const x = player.x + Math.cos(angleRad) * distance;
            const y = player.y + Math.sin(angleRad) * distance;

            const orb = this.scene.add.circle(x, y, 6, 0x44ffff);
            orb.setDepth(25);

            this.scene.tweens.add({
                targets: orb,
                x: player.x,
                y: player.y,
                alpha: 0,
                duration: 1000,
                ease: 'Power2',
                onComplete: () => orb.destroy()
            });
        }
    }
}

// Explosive Bullets Power-up (TEMPORARY)
export class ExplosiveBulletsPowerUp extends PowerUp {
    constructor(scene, x, y) {
        super(scene, x, y, POWERUP_CONFIG.TILE_IDS.EXPLOSIVE_BULLETS, 'explosiveBullets', POWERUP_CONFIG.COLORS.EXPLOSIVE_BULLETS);
    }

    applyEffect(player) {
        const duration = POWERUP_CONFIG.EFFECTS.EXPLOSIVE_BULLETS.DURATION;

        if (!player.originalFireRate) {
            player.originalFireRate = player.fireRate;
        }

        player.fireRate = Math.max(2, Math.floor(player.fireRate / POWERUP_CONFIG.EFFECTS.EXPLOSIVE_BULLETS.FIRE_RATE_PENALTY));
        player.hasExplosiveBullets = true;
        player.explosiveBulletsEndTime = Date.now() + duration;

        this.showFloatingText('EXPLOSIVE BULLETS!', 0xff4488);

        // FIXED: Use working effect method
        this.createExplosiveEffect(player);

        const scene = this.scene;
        const playerId = player.playerId;

        scene.time.delayedCall(duration, () => {
            const currentPlayer = scene.gameState?.players?.[playerId - 1];
            if (currentPlayer && currentPlayer.active) {
                currentPlayer.hasExplosiveBullets = false;
                if (currentPlayer.originalFireRate) {
                    currentPlayer.fireRate = currentPlayer.originalFireRate;
                    currentPlayer.originalFireRate = null;
                }
                console.log('Explosive bullets expired');
            }
        });

        console.log(`Explosive bullets activated for ${duration/1000} seconds`);
    }

    // ADDED: Working explosive effect method
    createExplosiveEffect(player) {
        for (let i = 0; i < 5; i++) {
            const explosion = this.scene.add.circle(
                player.x + Phaser.Math.Between(-40, 40),
                player.y + Phaser.Math.Between(-40, 40),
                8,
                0xff4488,
                0.8
            );
            explosion.setDepth(25);

            this.scene.tweens.add({
                targets: explosion,
                scaleX: 3,
                scaleY: 3,
                alpha: 0,
                duration: 600,
                ease: 'Power2',
                onComplete: () => explosion.destroy()
            });
        }
    }
}

// Cone Spray Power-up - REPLACES OTHER PATTERNS
export class ConeSprayPowerUp extends PowerUp {
    constructor(scene, x, y) {
        super(scene, x, y, POWERUP_CONFIG.TILE_IDS.CONE_SPRAY, 'coneSpray', POWERUP_CONFIG.COLORS.CONE_SPRAY);
    }

    applyEffect(player) {
        // CLEAR ALL PATTERNS and set cone spray as the active pattern
        player.clearAllShootingPatterns();
        player.hasConeSpray = true;

        // Reset bullet power to 1 since we're using a special pattern
        player.bulletPower = 1;

        this.showFloatingText('CONE SPRAY!', 0x88ff44);
        this.showConeEffect(player);

        console.log('Cone spray activated! Previous patterns cleared.');
    }

    showConeEffect(player) {
        const bulletCount = 15;
        const coneAngle = 90;

        for (let i = 0; i < bulletCount; i++) {
            const angle = -coneAngle/2 + (coneAngle / (bulletCount - 1)) * i;
            const angleRad = Phaser.Math.DegToRad(angle);
            const distance = 60;
            const x = player.x + Math.sin(angleRad) * distance;
            const y = player.y - Math.cos(angleRad) * distance;

            const trail = this.scene.add.circle(x, y, 3, 0x88ff44);
            trail.setDepth(25);

            this.scene.tweens.add({
                targets: trail,
                y: trail.y - 40,
                alpha: 0,
                duration: 800,
                ease: 'Power2',
                onComplete: () => trail.destroy()
            });
        }
    }
}

// Explosive Circular Power-up (TEMPORARY) - REPLACES OTHER PATTERNS
export class ExplosiveCircularPowerUp extends PowerUp {
    constructor(scene, x, y) {
        super(scene, x, y, POWERUP_CONFIG.TILE_IDS.EXPLOSIVE_CIRCULAR, 'explosiveCircular', POWERUP_CONFIG.COLORS.EXPLOSIVE_CIRCULAR);
    }

    applyEffect(player) {
        const duration = POWERUP_CONFIG.EFFECTS.EXPLOSIVE_CIRCULAR.DURATION;

        player.clearAllShootingPatterns();

        if (!player.originalFireRateCircular) {
            player.originalFireRateCircular = player.fireRate;
        }

        player.fireRate = Math.max(3, Math.floor(player.fireRate / POWERUP_CONFIG.EFFECTS.EXPLOSIVE_CIRCULAR.FIRE_RATE_PENALTY));
        player.hasExplosiveCircular = true;
        player.bulletPower = 1;
        player.explosiveCircularEndTime = Date.now() + duration;

        this.showFloatingText('EXPLOSIVE RING!', 0x8844ff);

        // FIXED: Use working effect method
        this.createExplosiveCircularEffect(player);

        const scene = this.scene;
        const playerId = player.playerId;

        scene.time.delayedCall(duration, () => {
            const currentPlayer = scene.gameState?.players?.[playerId - 1];
            if (currentPlayer && currentPlayer.active) {
                currentPlayer.hasExplosiveCircular = false;
                if (currentPlayer.originalFireRateCircular) {
                    currentPlayer.fireRate = currentPlayer.originalFireRateCircular;
                    currentPlayer.originalFireRateCircular = null;
                }
                console.log('Explosive circular expired');
            }
        });

        console.log(`Explosive circular activated for ${duration/1000} seconds - previous patterns cleared`);
    }

    // ADDED: Working explosive circular effect method
    createExplosiveCircularEffect(player) {
        const bulletCount = 12;
        for (let i = 0; i < bulletCount; i++) {
            const angle = (360 / bulletCount) * i;
            const angleRad = Phaser.Math.DegToRad(angle);
            const distance = 45;
            const x = player.x + Math.cos(angleRad) * distance;
            const y = player.y + Math.sin(angleRad) * distance;

            const explosion = this.scene.add.circle(x, y, 6, 0x8844ff, 0.8);
            explosion.setDepth(25);

            this.scene.tweens.add({
                targets: explosion,
                scaleX: 2,
                scaleY: 2,
                alpha: 0,
                duration: 1000,
                ease: 'Power2',
                onComplete: () => explosion.destroy()
            });
        }
    }
}