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
        // Green sparkle effect around player
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
        
        // Use the new capped method instead of directly modifying fireRate
        const newFireRate = player.improveFireRate(speedIncrease);
        
        this.showFloatingText('RAPID FIRE!', 0xffff00);
        this.showSpeedEffect(player);
        console.log(`Attack speed power-up collected! New fire rate: ${newFireRate}`);
    }

    showSpeedEffect(player) {
        // Yellow energy rings around player
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

// Bullet Power +2 Power-up (Now gives triple shot)
export class BulletPower2PowerUp extends PowerUp {
    constructor(scene, x, y) {
        super(scene, x, y, POWERUP_CONFIG.TILE_IDS.BULLET_POWER_2, 'bulletPower2', POWERUP_CONFIG.COLORS.BULLET_POWER_2);
    }

    applyEffect(player) {
        // Set bullet power to 2 for triple shot
        player.bulletPower = 2;
        
        this.showFloatingText('TRIPLE SHOT!', 0x00ff00);
        this.showPowerEffect(player, 0x00ff00);
        console.log(`Triple shot unlocked! Bullet power: ${player.bulletPower}`);
    }

    showPowerEffect(player, color) {
        // Power-up burst effect
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

// Bullet Power +3 Power-up (Now gives five shot)
export class BulletPower3PowerUp extends PowerUp {
    constructor(scene, x, y) {
        super(scene, x, y, POWERUP_CONFIG.TILE_IDS.BULLET_POWER_3, 'bulletPower3', POWERUP_CONFIG.COLORS.BULLET_POWER_3);
    }

    applyEffect(player) {
        // Set bullet power to 3 for five shot
        player.bulletPower = 3;
        
        this.showFloatingText('FIVE SHOT!', 0x0066ff);
        this.showPowerEffect(player, 0x0066ff);
        console.log(`Five shot unlocked! Bullet power: ${player.bulletPower}`);
    }

    showPowerEffect(player, color) {
        // More intense power-up effect
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

// Bullet Power +5 Power-up (Now gives seven shot + more damage)
export class BulletPower5PowerUp extends PowerUp {
    constructor(scene, x, y) {
        super(scene, x, y, POWERUP_CONFIG.TILE_IDS.BULLET_POWER_5, 'bulletPower5', POWERUP_CONFIG.COLORS.BULLET_POWER_5);
    }

    applyEffect(player) {
        // Set bullet power to 5 for maximum spread
        player.bulletPower = 5;
        
        this.showFloatingText('MEGA SHOT!', 0xff00ff);
        this.showMegaPowerEffect(player);
        console.log(`Mega shot unlocked! Bullet power: ${player.bulletPower}`);
    }

    showMegaPowerEffect(player) {
        // Epic power-up effect with multiple rings and particles
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

        // Add sparkle particles
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