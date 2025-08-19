// Power-up system configuration
export const POWERUP_CONFIG = {
    SPAWN_INTERVAL: 8000, // Base spawn interval in milliseconds
    SPAWN_INTERVAL_VARIANCE: 3000, // ±3 seconds variance
    LIFESPAN: 10000, // How long power-ups stay on screen

    // Power-up spawn weights (higher = more common)
    WEIGHTS: {
        HEALTH: 25,                    // 25% - Health +2 HP
        ATTACK_SPEED: 10,              // 10% - Attack speed boost
        BULLET_POWER_2: 10,            // 10% - Triple shot
        BULLET_POWER_3: 10,            // 10% - Five shot
        BULLET_POWER_5: 5,             // 5% - Seven shot
        DAMAGE_BOOST: 10,              // 10% - +3 damage
        CIRCULAR_PATTERN: 10,          // 10% - 360° bullet ring
        EXPLOSIVE_BULLETS: 5,          // 5% - AOE explosions (slower fire)
        CONE_SPRAY: 10,                // 10% - Wide cone attack
        EXPLOSIVE_CIRCULAR: 5          // 5% - 360° explosive bullets
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
        },
        DAMAGE_BOOST: {
            DAMAGE_INCREASE: 3
        },
        CIRCULAR_PATTERN: {
            BULLET_COUNT: 8,
            DURATION: 10000 // 10 seconds
        },
        EXPLOSIVE_BULLETS: {
            FIRE_RATE_PENALTY: 0.5, // 50% slower
            EXPLOSION_RADIUS: 60,
            DURATION: 15000 // 15 seconds
        },
        CONE_SPRAY: {
            DAMAGE_MULTIPLIER: 0.5, // Half damage
            BULLET_COUNT: 15,
            CONE_ANGLE: 90, // 90 degree cone
            DURATION: 12000 // 12 seconds
        },
        EXPLOSIVE_CIRCULAR: {
            BULLET_COUNT: 12,
            FIRE_RATE_PENALTY: 0.3, // 70% slower
            EXPLOSION_RADIUS: 40,
            DURATION: 8000 // 8 seconds
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

    // Use tiles from your actual sprite sheet
    TILE_IDS: {
        HEALTH: 24,              // Red cross medical symbol
        ATTACK_SPEED: 25,        // Speed symbol
        BULLET_POWER_2: 20,      // Triple shot
        BULLET_POWER_3: 21,      // Five shot
        BULLET_POWER_5: 22,      // Seven shot
        DAMAGE_BOOST: 26,        // Damage boost
        CIRCULAR_PATTERN: 27,    // Circular pattern
        EXPLOSIVE_BULLETS: 23,   // Explosive bullets
        CONE_SPRAY: 31,          // Cone spray
        EXPLOSIVE_CIRCULAR: 7   // Explosive circular
    },

    // Color themes for each power-up type
    COLORS: {
        HEALTH: 0xff4444,           // Red for health
        ATTACK_SPEED: 0xffff44,     // Yellow for speed
        BULLET_POWER_2: 0x44ff44,   // Green for triple
        BULLET_POWER_3: 0x4444ff,   // Blue for five
        BULLET_POWER_5: 0xff44ff,   // Magenta for seven
        DAMAGE_BOOST: 0xff8844,     // Orange for damage
        CIRCULAR_PATTERN: 0x44ffff, // Cyan for circular
        EXPLOSIVE_BULLETS: 0xff4488, // Pink for explosive
        CONE_SPRAY: 0x88ff44,       // Lime for cone
        EXPLOSIVE_CIRCULAR: 0x8844ff // Purple for explosive circular
    }
};

// Helper function to get random spawn interval
export function getRandomSpawnInterval() {
    const base = POWERUP_CONFIG.SPAWN_INTERVAL;
    const variance = POWERUP_CONFIG.SPAWN_INTERVAL_VARIANCE;
    return base + Phaser.Math.Between(-variance, variance);
}