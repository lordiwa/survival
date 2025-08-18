// Power-up system configuration
export const POWERUP_CONFIG = {
    SPAWN_INTERVAL: 8000, // Base spawn interval in milliseconds
    SPAWN_INTERVAL_VARIANCE: 3000, // ±3 seconds variance
    LIFESPAN: 10000, // How long power-ups stay on screen
    
    // Power-up spawn weights (higher = more common)
    // Progressive rarity: Level 2 > Level 3 > Level 5
    WEIGHTS: {
        HEALTH: 35,           // Most common (35%)
        ATTACK_SPEED: 30,     // Very common (30%)
        BULLET_POWER_2: 25,   // Common - Triple shot (25%)
        BULLET_POWER_3: 8,    // Rare - Five shot (8%)
        BULLET_POWER_5: 2     // Very rare - Mega shot (2%)
    },

    // Power-up effects configuration
    EFFECTS: {
        HEALTH: {
            HEAL_AMOUNT: 2,
            MAX_HEALTH_CAP: 10
        },
        ATTACK_SPEED: {
            SPEED_INCREASE: 3,
            MIN_FIRE_RATE: 1
        },
        BULLET_POWER: {
            MAX_POWER: 5,
            POWER_2_INCREASE: 2,
            POWER_3_INCREASE: 3,
            POWER_5_INCREASE: 5
        }
    },

    // Visual effects configuration
    VISUAL: {
        BOB_AMOUNT: 10,
        BOB_SPEED: 2,
        GLOW_DURATION: 800,
        COLLECTION_FLASH_SIZE: 30,
        COLLECTION_FLASH_DURATION: 300
    },

    // FIXED: Use tiles that exist in your sprite sheet
    // Based on your existing game, using early tile indices that should exist
    TILE_IDS: {
        HEALTH: 0,        // Use tile 0 (should be first tile)
        ATTACK_SPEED: 1,  // Use tile 1 (should be second tile)
        BULLET_POWER_2: 2, // Use tile 2
        BULLET_POWER_3: 3, // Use tile 3  
        BULLET_POWER_5: 4  // Use tile 4
    },

    // Color themes for each power-up type
    COLORS: {
        HEALTH: 0xff6666,     // Red tint for health
        ATTACK_SPEED: 0xffff66, // Yellow tint for attack speed
        BULLET_POWER_2: 0x66ff66, // Green tint for +2 power (common)
        BULLET_POWER_3: 0x6666ff, // Blue tint for +3 power (rare)
        BULLET_POWER_5: 0xff66ff  // Magenta tint for +5 power (very rare)
    }
};

// Helper function to get random spawn interval
export function getRandomSpawnInterval() {
    const base = POWERUP_CONFIG.SPAWN_INTERVAL;
    const variance = POWERUP_CONFIG.SPAWN_INTERVAL_VARIANCE;
    return base + Phaser.Math.Between(-variance, variance);
}