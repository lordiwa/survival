import { POWERUP_CONFIG, getRandomSpawnInterval } from '../config/PowerUpConfig.js';
import {
    HealthPowerUp,
    AttackSpeedPowerUp,
    BulletPower2PowerUp,
    BulletPower3PowerUp,
    BulletPower5PowerUp,
    DamageBoostPowerUp,
    CircularPatternPowerUp,
    ExplosiveBulletsPowerUp,
    ConeSprayPowerUp,
    ExplosiveCircularPowerUp
} from './PowerUpTypes.js';

export default class PowerUpManager {
    constructor(scene) {
        this.scene = scene;
        this.powerUpGroup = scene.add.group();
        this.spawnTimer = 0;
        this.nextSpawnTime = getRandomSpawnInterval();

        // Initialize ALL power-up types with weights
        this.powerUpTypes = [
            { class: HealthPowerUp, weight: POWERUP_CONFIG.WEIGHTS.HEALTH, name: 'health' },
            { class: AttackSpeedPowerUp, weight: POWERUP_CONFIG.WEIGHTS.ATTACK_SPEED, name: 'attackSpeed' },
            { class: BulletPower2PowerUp, weight: POWERUP_CONFIG.WEIGHTS.BULLET_POWER_2, name: 'bulletPower2' },
            { class: BulletPower3PowerUp, weight: POWERUP_CONFIG.WEIGHTS.BULLET_POWER_3, name: 'bulletPower3' },
            { class: BulletPower5PowerUp, weight: POWERUP_CONFIG.WEIGHTS.BULLET_POWER_5, name: 'bulletPower5' },
            { class: DamageBoostPowerUp, weight: POWERUP_CONFIG.WEIGHTS.DAMAGE_BOOST, name: 'damageBoost' },
            { class: CircularPatternPowerUp, weight: POWERUP_CONFIG.WEIGHTS.CIRCULAR_PATTERN, name: 'circularPattern' },
            { class: ExplosiveBulletsPowerUp, weight: POWERUP_CONFIG.WEIGHTS.EXPLOSIVE_BULLETS, name: 'explosiveBullets' },
            { class: ConeSprayPowerUp, weight: POWERUP_CONFIG.WEIGHTS.CONE_SPRAY, name: 'coneSpray' },
            { class: ExplosiveCircularPowerUp, weight: POWERUP_CONFIG.WEIGHTS.EXPLOSIVE_CIRCULAR, name: 'explosiveCircular' }
        ];

        this.weightedArray = this.createWeightedArray();

        // Debug: Log the power-up types being registered
        console.log('PowerUpManager initialized with power-ups:', this.powerUpTypes.map(p => p.name));
        console.log('Weighted array length:', this.weightedArray.length);
    }

    createWeightedArray() {
        const weightedArray = [];
        this.powerUpTypes.forEach(powerUpType => {
            for (let i = 0; i < powerUpType.weight; i++) {
                weightedArray.push(powerUpType);
            }
        });

        // Debug: Log weighted array distribution
        console.log('Weighted array distribution:');
        const distribution = {};
        weightedArray.forEach(item => {
            distribution[item.name] = (distribution[item.name] || 0) + 1;
        });
        console.log(distribution);

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

        // For now, let's use static weights to test if new power-ups spawn
        // Create dynamic weighted array based on player's current power
        // const dynamicWeights = this.calculateDynamicWeights(currentPower);
        // const weightedArray = this.createDynamicWeightedArray(dynamicWeights);

        // Use static weighted array for testing
        const weightedArray = this.weightedArray;

        // Pick random power-up type
        const powerUpTypeData = Phaser.Math.RND.pick(weightedArray);
        const PowerUpClass = powerUpTypeData.class;

        // Better spawn position - based on screen dimensions for easy catching
        const margin = 100; // Safe margin from screen edges
        const x = Phaser.Math.Between(margin, this.scene.scale.width - margin);
        const y = Phaser.Math.Between(this.scene.scale.height * 0.2, this.scene.scale.height * 0.4); // Spawn in top 20-40% of screen

        const powerUp = new PowerUpClass(this.scene, x, y);
        this.powerUpGroup.add(powerUp);

        console.log(`Spawned ${powerUpTypeData.name} power-up at (${x}, ${y}) - Player power: ${currentPower}`);
    }

    // Calculate dynamic weights based on player's current power level
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

    // Create weighted array with dynamic weights
    createDynamicWeightedArray(weights) {
        const weightedArray = [];

        // Add HealthPowerUp
        for (let i = 0; i < weights.HEALTH; i++) {
            weightedArray.push(this.powerUpTypes[0]);
        }

        // Add AttackSpeedPowerUp
        for (let i = 0; i < weights.ATTACK_SPEED; i++) {
            weightedArray.push(this.powerUpTypes[1]);
        }

        // Add BulletPower2PowerUp
        for (let i = 0; i < weights.BULLET_POWER_2; i++) {
            weightedArray.push(this.powerUpTypes[2]);
        }

        // Add BulletPower3PowerUp
        for (let i = 0; i < weights.BULLET_POWER_3; i++) {
            weightedArray.push(this.powerUpTypes[3]);
        }

        // Add BulletPower5PowerUp
        for (let i = 0; i < weights.BULLET_POWER_5; i++) {
            weightedArray.push(this.powerUpTypes[4]);
        }

        // Add NEW power-ups
        for (let i = 0; i < weights.DAMAGE_BOOST; i++) {
            weightedArray.push(this.powerUpTypes[5]);
        }

        for (let i = 0; i < weights.CIRCULAR_PATTERN; i++) {
            weightedArray.push(this.powerUpTypes[6]);
        }

        for (let i = 0; i < weights.EXPLOSIVE_BULLETS; i++) {
            weightedArray.push(this.powerUpTypes[7]);
        }

        for (let i = 0; i < weights.CONE_SPRAY; i++) {
            weightedArray.push(this.powerUpTypes[8]);
        }

        for (let i = 0; i < weights.EXPLOSIVE_CIRCULAR; i++) {
            weightedArray.push(this.powerUpTypes[9]);
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
            case 'damageBoost':
                powerUp = new DamageBoostPowerUp(this.scene, x, y);
                break;
            case 'circularPattern':
                powerUp = new CircularPatternPowerUp(this.scene, x, y);
                break;
            case 'explosiveBullets':
                powerUp = new ExplosiveBulletsPowerUp(this.scene, x, y);
                break;
            case 'coneSpray':
                powerUp = new ConeSprayPowerUp(this.scene, x, y);
                break;
            case 'explosiveCircular':
                powerUp = new ExplosiveCircularPowerUp(this.scene, x, y);
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