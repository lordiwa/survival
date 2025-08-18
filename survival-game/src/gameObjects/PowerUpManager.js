import { POWERUP_CONFIG, getRandomSpawnInterval } from '../config/PowerUpConfig.js';
import { HealthPowerUp, AttackSpeedPowerUp, BulletPower2PowerUp, BulletPower3PowerUp, BulletPower5PowerUp } from './PowerUpTypes.js';

export default class PowerUpManager {
    constructor(scene) {
        this.scene = scene;
        this.powerUpGroup = scene.add.group();
        this.spawnTimer = 0;
        this.nextSpawnTime = getRandomSpawnInterval();
        
        // Initialize power-up types with weights
        this.powerUpTypes = [
            { class: HealthPowerUp, weight: POWERUP_CONFIG.WEIGHTS.HEALTH },
            { class: AttackSpeedPowerUp, weight: POWERUP_CONFIG.WEIGHTS.ATTACK_SPEED },
            { class: BulletPower2PowerUp, weight: POWERUP_CONFIG.WEIGHTS.BULLET_POWER_2 },
            { class: BulletPower3PowerUp, weight: POWERUP_CONFIG.WEIGHTS.BULLET_POWER_3 },
            { class: BulletPower5PowerUp, weight: POWERUP_CONFIG.WEIGHTS.BULLET_POWER_5 }
        ];
        
        this.weightedArray = this.createWeightedArray();
    }

    createWeightedArray() {
        const weightedArray = [];
        this.powerUpTypes.forEach(powerUpType => {
            for (let i = 0; i < powerUpType.weight; i++) {
                weightedArray.push(powerUpType.class);
            }
        });
        return weightedArray;
    }

    update(delta) {
        this.spawnTimer += delta;
        
        if (this.spawnTimer >= this.nextSpawnTime) {
            this.spawnRandomPowerUp();
            this.spawnTimer = 0;
            this.nextSpawnTime = getRandomSpawnInterval();
        }
    }

    spawnRandomPowerUp() {
        // Get player's current bullet power for dynamic rarity
        const player = this.scene.player;
        const currentPower = player ? player.bulletPower : 1;
        
        // Create dynamic weighted array based on player's current power
        const dynamicWeights = this.calculateDynamicWeights(currentPower);
        const weightedArray = this.createDynamicWeightedArray(dynamicWeights);
        
        // Pick random power-up type
        const PowerUpClass = Phaser.Math.RND.pick(weightedArray);
        
        // FIXED: Better spawn position - based on screen dimensions for easy catching
        const margin = 100; // Safe margin from screen edges
        const x = Phaser.Math.Between(margin, this.scene.scale.width - margin);
        const y = Phaser.Math.Between(this.scene.scale.height * 0.2, this.scene.scale.height * 0.4); // Spawn in top 20-40% of screen
        
        const powerUp = new PowerUpClass(this.scene, x, y);
        this.powerUpGroup.add(powerUp);
        
        console.log(`Spawned ${powerUp.getPowerUpType()} power-up at (${x}, ${y}) - Player power: ${currentPower}`);
    }

    // NEW: Calculate dynamic weights based on player's current power level
    calculateDynamicWeights(currentPower) {
        const baseWeights = POWERUP_CONFIG.WEIGHTS;
        let dynamicWeights = { ...baseWeights };
        
        // Reduce chances of getting same or lower power levels
        if (currentPower >= 2) {
            dynamicWeights.BULLET_POWER_2 = Math.floor(baseWeights.BULLET_POWER_2 * 0.3); // 70% reduction
        }
        
        if (currentPower >= 3) {
            dynamicWeights.BULLET_POWER_2 = Math.floor(baseWeights.BULLET_POWER_2 * 0.1); // 90% reduction
            dynamicWeights.BULLET_POWER_3 = Math.floor(baseWeights.BULLET_POWER_3 * 0.4); // 60% reduction
        }
        
        if (currentPower >= 5) {
            dynamicWeights.BULLET_POWER_2 = 1; // Almost never
            dynamicWeights.BULLET_POWER_3 = 1; // Almost never
            dynamicWeights.BULLET_POWER_5 = 1; // Almost never (already maxed)
            // Increase health and attack speed chances when maxed
            dynamicWeights.HEALTH = Math.floor(baseWeights.HEALTH * 1.5);
            dynamicWeights.ATTACK_SPEED = Math.floor(baseWeights.ATTACK_SPEED * 1.5);
        }
        
        console.log(`Dynamic weights for power ${currentPower}:`, dynamicWeights);
        return dynamicWeights;
    }

    // NEW: Create weighted array with dynamic weights
    createDynamicWeightedArray(weights) {
        const weightedArray = [];
        
        // Add HealthPowerUp
        for (let i = 0; i < weights.HEALTH; i++) {
            weightedArray.push(this.powerUpTypes[0].class);
        }
        
        // Add AttackSpeedPowerUp  
        for (let i = 0; i < weights.ATTACK_SPEED; i++) {
            weightedArray.push(this.powerUpTypes[1].class);
        }
        
        // Add BulletPower2PowerUp
        for (let i = 0; i < weights.BULLET_POWER_2; i++) {
            weightedArray.push(this.powerUpTypes[2].class);
        }
        
        // Add BulletPower3PowerUp
        for (let i = 0; i < weights.BULLET_POWER_3; i++) {
            weightedArray.push(this.powerUpTypes[3].class);
        }
        
        // Add BulletPower5PowerUp
        for (let i = 0; i < weights.BULLET_POWER_5; i++) {
            weightedArray.push(this.powerUpTypes[4].class);
        }
        
        return weightedArray;
    }

    handleCollision(player, powerUp) {
        powerUp.collect(player);
        this.powerUpGroup.remove(powerUp, true, true);
    }

    getPowerUpGroup() {
        return this.powerUpGroup;
    }

    // Method to manually spawn specific power-up (useful for testing)
    spawnSpecificPowerUp(powerUpType, x, y) {
        let powerUp;
        
        switch (powerUpType) {
            case 'health':
                powerUp = new HealthPowerUp(this.scene, x, y);
                break;
            case 'attackSpeed':
                powerUp = new AttackSpeedPowerUp(this.scene, x, y);
                break;
            case 'bulletPower2':
                powerUp = new BulletPower2PowerUp(this.scene, x, y);
                break;
            case 'bulletPower3':
                powerUp = new BulletPower3PowerUp(this.scene, x, y);
                break;
            case 'bulletPower5':
                powerUp = new BulletPower5PowerUp(this.scene, x, y);
                break;
        }
        
        if (powerUp) {
            this.powerUpGroup.add(powerUp);
            console.log(`Manually spawned ${powerUpType} at (${x}, ${y})`);
            return powerUp;
        }
        return null;
    }

    destroy() {
        this.powerUpGroup.clear(true, true);
        this.powerUpGroup.destroy();
    }
}