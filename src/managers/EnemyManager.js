// Enhanced EnemyManager.js with varied movement patterns
import EnemyFlying from '../gameObjects/EnemyFlying.js';
import EnemyBullet from '../gameObjects/EnemyBullet.js';
import Explosion from '../gameObjects/Explosion.js';

export default class EnemyManager {
    constructor(scene) {
        this.scene = scene;
        this.gameState = scene.gameState;

        // Movement pattern weights based on difficulty
        this.movementPatterns = [
            { id: 0, name: 'straight', weight: 25, minLevel: 1 },
            { id: 1, name: 'sine_wave', weight: 20, minLevel: 1 },
            { id: 2, name: 'spiral', weight: 15, minLevel: 2 },
            { id: 3, name: 'zigzag', weight: 18, minLevel: 2 },
            { id: 4, name: 'circle', weight: 12, minLevel: 3 },
            { id: 5, name: 'bounce', weight: 10, minLevel: 3 },
            { id: 6, name: 'seek_player', weight: 8, minLevel: 4 },
            { id: 7, name: 'orbital', weight: 8, minLevel: 4 },
            { id: 8, name: 'figure_eight', weight: 6, minLevel: 5 },
            { id: 9, name: 'random_walk', weight: 10, minLevel: 5 },
            { id: 10, name: 'accelerating', weight: 5, minLevel: 6 },
            { id: 11, name: 'stuttering', weight: 7, minLevel: 6 }
        ];
    }

    update() {
        if (this.gameState.spawnEnemyCounter > 0) {
            this.gameState.spawnEnemyCounter--;
        } else {
            this.addFlyingGroup();
        }
    }

    startSpawning() {
        this.addFlyingGroup();
    }

    addFlyingGroup() {
        // Don't spawn regular enemies if boss is active
        if (this.gameState.currentBoss) return;

        this.gameState.spawnEnemyCounter = Phaser.Math.RND.between(3, 6) * 60;

        // Choose enemy type based on difficulty level
        const availableEnemyTypes = this.gameState.getAvailableEnemyTypes();
        const randomEnemyType = Phaser.Math.RND.pick(availableEnemyTypes);

        // Determine group composition
        const groupComposition = this.determineGroupComposition();

        console.log(`Spawning ${groupComposition.totalEnemies} enemies with varied movement patterns`);

        // Spawn enemies with different movement patterns
        this.spawnEnemyGroup(randomEnemyType, groupComposition);
    }

    determineGroupComposition() {
        const level = this.gameState.difficultyLevel;
        const baseCount = Phaser.Math.RND.between(6, 12);

        // Increase group size with level
        const levelMultiplier = 1 + (level * 0.1);
        const totalEnemies = Math.floor(baseCount * levelMultiplier);

        // Determine how many different movement patterns to use
        const patternVariety = Math.min(
            Math.floor(level / 2) + 1, // More variety at higher levels
            this.getAvailablePatterns().length
        );

        return {
            totalEnemies: totalEnemies,
            patternVariety: patternVariety,
            spawnInterval: Phaser.Math.RND.between(200, 800) // Stagger spawning
        };
    }

    spawnEnemyGroup(enemyType, composition) {
        const availablePatterns = this.getAvailablePatterns();
        const selectedPatterns = this.selectMovementPatterns(availablePatterns, composition.patternVariety);

        // Enemy power scaling
        const randomPower = Math.min(1 + Math.floor(this.gameState.difficultyLevel / 5), 4);
        const randomSpeed = Phaser.Math.RND.realInRange(0.8, 2.2); // Increased speed range

        let enemiesSpawned = 0;
        const enemiesPerPattern = Math.ceil(composition.totalEnemies / selectedPatterns.length);

        // Spawn enemies in waves with different patterns
        selectedPatterns.forEach((pattern, patternIndex) => {
            const enemiesForThisPattern = Math.min(
                enemiesPerPattern,
                composition.totalEnemies - enemiesSpawned
            );

            for (let i = 0; i < enemiesForThisPattern; i++) {
                const spawnDelay = (patternIndex * enemiesPerPattern + i) * composition.spawnInterval;

                this.scene.time.delayedCall(spawnDelay, () => {
                    // Add some variation to speed for each enemy
                    const speedVariation = Phaser.Math.RND.realInRange(0.8, 1.2);
                    const finalSpeed = randomSpeed * speedVariation;

                    this.addEnemy(enemyType, pattern.id, finalSpeed, randomPower);
                });
            }

            enemiesSpawned += enemiesForThisPattern;
        });

        console.log(`Scheduled ${composition.totalEnemies} ${enemyType.name} enemies with patterns:`,
            selectedPatterns.map(p => p.name).join(', '));
    }

    getAvailablePatterns() {
        const currentLevel = this.gameState.difficultyLevel;
        return this.movementPatterns.filter(pattern => pattern.minLevel <= currentLevel);
    }

    selectMovementPatterns(availablePatterns, count) {
        // Create weighted array for pattern selection
        const weightedPatterns = [];
        availablePatterns.forEach(pattern => {
            for (let i = 0; i < pattern.weight; i++) {
                weightedPatterns.push(pattern);
            }
        });

        const selectedPatterns = [];
        const usedPatternIds = new Set();

        // Select unique patterns
        while (selectedPatterns.length < count && selectedPatterns.length < availablePatterns.length) {
            const pattern = Phaser.Math.RND.pick(weightedPatterns);
            if (!usedPatternIds.has(pattern.id)) {
                selectedPatterns.push(pattern);
                usedPatternIds.add(pattern.id);
            }
        }

        return selectedPatterns;
    }

    addEnemy(enemyType, movementPatternId, speed, power) {
        const enemyHealth = this.gameState.getCurrentEnemyHealth();
        const enemyColor = this.gameState.getCurrentEnemyColor();

        const enemy = new EnemyFlying(this.scene, enemyType, movementPatternId, speed, power, enemyHealth, enemyColor);
        this.scene.enemyGroup.add(enemy);
        return enemy;
    }

    // Special formation spawning for variety
    spawnFormation(formationType = 'random') {
        const formations = {
            'arrow': this.spawnArrowFormation.bind(this),
            'circle': this.spawnCircleFormation.bind(this),
            'wall': this.spawnWallFormation.bind(this),
            'spiral': this.spawnSpiralFormation.bind(this)
        };

        const formation = formations[formationType] || formations['random'];
        if (formation) {
            formation();
        }
    }

    spawnArrowFormation() {
        const enemyType = Phaser.Math.RND.pick(this.gameState.getAvailableEnemyTypes());
        const centerX = this.scene.scale.width / 2;
        const baseY = -50;
        const spacing = 60;

        // Arrow formation: 1 at front, 2 behind, 3 at back
        const positions = [
            { x: centerX, y: baseY },
            { x: centerX - spacing, y: baseY - spacing },
            { x: centerX + spacing, y: baseY - spacing },
            { x: centerX - spacing * 2, y: baseY - spacing * 2 },
            { x: centerX, y: baseY - spacing * 2 },
            { x: centerX + spacing * 2, y: baseY - spacing * 2 }
        ];

        positions.forEach((pos, index) => {
            this.scene.time.delayedCall(index * 200, () => {
                const enemy = new EnemyFlying(this.scene, enemyType, 0, 1.5, 2,
                    this.gameState.getCurrentEnemyHealth(), this.gameState.getCurrentEnemyColor());
                enemy.setPosition(pos.x, pos.y);
                this.scene.enemyGroup.add(enemy);
            });
        });

        console.log('Spawned arrow formation');
    }

    spawnCircleFormation() {
        const enemyType = Phaser.Math.RND.pick(this.gameState.getAvailableEnemyTypes());
        const centerX = this.scene.scale.width / 2;
        const centerY = -100;
        const radius = 80;
        const enemyCount = 8;

        for (let i = 0; i < enemyCount; i++) {
            const angle = (Math.PI * 2 / enemyCount) * i;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            this.scene.time.delayedCall(i * 150, () => {
                const enemy = new EnemyFlying(this.scene, enemyType, 4, 1.2, 2, // Circle movement pattern
                    this.gameState.getCurrentEnemyHealth(), this.gameState.getCurrentEnemyColor());
                enemy.setPosition(x, y);
                this.scene.enemyGroup.add(enemy);
            });
        }

        console.log('Spawned circle formation');
    }

    spawnWallFormation() {
        const enemyType = Phaser.Math.RND.pick(this.gameState.getAvailableEnemyTypes());
        const startX = 150;
        const endX = this.scene.scale.width - 150;
        const y = -50;
        const spacing = 80;
        const enemyCount = Math.floor((endX - startX) / spacing);

        for (let i = 0; i < enemyCount; i++) {
            const x = startX + (i * spacing);

            this.scene.time.delayedCall(i * 100, () => {
                // Alternate between straight and sine wave movement
                const movementPattern = i % 2 === 0 ? 0 : 1;
                const enemy = new EnemyFlying(this.scene, enemyType, movementPattern, 1.0, 1,
                    this.gameState.getCurrentEnemyHealth(), this.gameState.getCurrentEnemyColor());
                enemy.setPosition(x, y);
                this.scene.enemyGroup.add(enemy);
            });
        }

        console.log('Spawned wall formation');
    }

    spawnSpiralFormation() {
        const enemyType = Phaser.Math.RND.pick(this.gameState.getAvailableEnemyTypes());
        const centerX = this.scene.scale.width / 2;
        const centerY = -50;
        const enemyCount = 12;

        for (let i = 0; i < enemyCount; i++) {
            const angle = (Math.PI * 2 / enemyCount) * i;
            const radius = 30 + (i * 15); // Increasing radius
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            this.scene.time.delayedCall(i * 120, () => {
                const enemy = new EnemyFlying(this.scene, enemyType, 2, 1.5, 2, // Spiral movement
                    this.gameState.getCurrentEnemyHealth(), this.gameState.getCurrentEnemyColor());
                enemy.setPosition(x, y);
                this.scene.enemyGroup.add(enemy);
            });
        }

        console.log('Spawned spiral formation');
    }

    // Chance to spawn special formations at higher levels
    shouldSpawnFormation() {
        const level = this.gameState.difficultyLevel;
        const formationChance = Math.min(level * 2, 25); // Max 25% chance
        return Phaser.Math.RND.between(1, 100) <= formationChance;
    }

    // Enhanced addFlyingGroup with formation support
    addFlyingGroupEnhanced() {
        if (this.gameState.currentBoss) return;

        // Check if we should spawn a special formation
        if (this.shouldSpawnFormation()) {
            const formations = ['arrow', 'circle', 'wall', 'spiral'];
            const randomFormation = Phaser.Math.RND.pick(formations);
            this.spawnFormation(randomFormation);

            // Set longer cooldown after formation
            this.gameState.spawnEnemyCounter = Phaser.Math.RND.between(8, 12) * 60;
        } else {
            // Regular varied enemy group
            this.addFlyingGroup();
        }
    }

    // Boss phase enemy spawning with specific movement patterns
    spawnBossPhaseEnemies(bossLevel) {
        const enemyType = this.gameState.getAvailableEnemyTypes()[0]; // Use basic enemies
        const patterns = [6, 9]; // Seek player and random walk for chaos
        const enemyCount = 4 + Math.floor(bossLevel / 5);

        for (let i = 0; i < enemyCount; i++) {
            const pattern = Phaser.Math.RND.pick(patterns);

            this.scene.time.delayedCall(i * 300, () => {
                const enemy = new EnemyFlying(this.scene, enemyType, pattern, 1.8, 1,
                    Math.floor(this.gameState.getCurrentEnemyHealth() * 0.5), // Weaker than normal
                    0xff6666); // Special color for boss minions
                this.scene.enemyGroup.add(enemy);
            });
        }

        console.log(`Spawned ${enemyCount} boss phase enemies`);
    }

    fireEnemyBullet(x, y, power) {
        const bullet = new EnemyBullet(this.scene, x, y, power);
        this.scene.enemyBulletGroup.add(bullet);
        return bullet;
    }

    fireEnemyBulletAngled(x, y, power, angleDegrees) {
        const bullet = new EnemyBullet(this.scene, x, y, power);

        const angleRadians = Phaser.Math.DegToRad(angleDegrees);
        const speed = 200 * (0.5 + power * 0.1);
        const velocityX = Math.sin(angleRadians) * speed;
        const velocityY = Math.cos(angleRadians) * speed;

        bullet.setVelocity(velocityX, velocityY);
        this.scene.enemyBulletGroup.add(bullet);

        return bullet;
    }

    addExplosion(x, y) {
        return new Explosion(this.scene, x, y);
    }

    removeEnemy(enemy) {
        this.scene.enemyGroup.remove(enemy, true, true);
    }

    stopSpawning() {
        if (this.timedEvent) {
            this.timedEvent.destroy();
            this.timedEvent = null;
        }
    }

    resumeSpawning() {
        this.scene.time.delayedCall(2000, () => {
            if (!this.gameState.currentBoss) {
                // Use enhanced spawning after boss
                this.addFlyingGroupEnhanced();
            }
        });
    }

    // Debug method to test specific movement patterns
    testMovementPattern(patternId) {
        const enemyType = this.gameState.getAvailableEnemyTypes()[0];
        const enemy = new EnemyFlying(this.scene, enemyType, patternId, 1.5, 1, 3, 0xff00ff);
        this.scene.enemyGroup.add(enemy);
        console.log(`Spawned test enemy with pattern ID: ${patternId}`);
    }

    // Get movement pattern statistics for debugging
    getMovementPatternStats() {
        const availablePatterns = this.getAvailablePatterns();
        console.log('Available movement patterns for level', this.gameState.difficultyLevel + ':');
        availablePatterns.forEach(pattern => {
            console.log(`- ${pattern.name} (Weight: ${pattern.weight}, Min Level: ${pattern.minLevel})`);
        });
        return availablePatterns;
    }
}