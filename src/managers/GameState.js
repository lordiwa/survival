// src/managers/GameState.js - Centralized game state management
export default class GameState {
    constructor(scene) {
        this.scene = scene;
        this.initializeState();
    }

    initializeState() {
        // Core game state
        this.score = 0;
        this.difficultyLevel = 1;
        this.gameStarted = false;
        this.waitingForStart = true;

        // Multiplayer state
        this.players = new Array(4).fill(null);
        this.activePlayers = 0;
        this.maxPlayers = 4;

        // Boss state
        this.currentBoss = null;
        this.lastBossLevel = 0;
        this.bossTypeIndex = 0;

        // Performance optimization
        this.maxBullets = 200;
        this.bulletCleanupTimer = 0;

        // Player configuration
        this.playerStartPositions = [
            { x: this.scene.scale.width * 0.3, y: this.scene.scale.height - 100 },
            { x: this.scene.scale.width * 0.7, y: this.scene.scale.height - 100 },
            { x: this.scene.scale.width * 0.4, y: this.scene.scale.height - 100 },
            { x: this.scene.scale.width * 0.6, y: this.scene.scale.height - 100 }
        ];

        this.playerColors = [
            0x00ff00, // Green
            0x0088ff, // Blue
            0xff8800, // Orange
            0xff00ff  // Magenta
        ];

        // Ship progression
        this.playerShipTypes = [8, 9, 10, 11, 0, 1, 2, 3];
        this.currentPlayerShipIndex = 0;

        // Enemy configuration
        this.enemyShipTypes = [
            { id: 12, name: 'Basic', shootPattern: 'single', fireRate: [100, 300] },
            { id: 13, name: 'Rapid', shootPattern: 'rapid', fireRate: [50, 150] },
            { id: 14, name: 'Burst', shootPattern: 'burst', fireRate: [200, 400] },
            { id: 15, name: 'Spread', shootPattern: 'spread', fireRate: [150, 250] },
            { id: 4, name: 'Heavy', shootPattern: 'heavy', fireRate: [300, 500] },
            { id: 5, name: 'Sniper', shootPattern: 'sniper', fireRate: [400, 600] },
            { id: 6, name: 'Bomber', shootPattern: 'bomber', fireRate: [250, 350] },
            { id: 7, name: 'Elite', shootPattern: 'elite', fireRate: [100, 200] }
        ];

        // Difficulty scaling
        this.fibonacciSequence = [500, 700, 1000, 1400, 1900, 2500, 3300, 4300, 5600, 7200, 9200, 11800, 15000];
        this.enemyHealthByLevel = [2, 3, 4, 6, 8, 12, 16, 22, 30, 40, 55, 70, 90];
        this.enemyColorsByLevel = [
            0xffffff, 0xffff00, 0xff8800, 0xff0000, 0xff00ff,
            0x8800ff, 0x0088ff, 0x00ffff, 0x00ff88, 0x88ff00,
            0xffffff, 0xff4444, 0x4444ff
        ];

        // Spawn timing
        this.spawnEnemyCounter = 0;
    }

    // State modification methods
    incrementScore(points) {
        this.score += points;
    }

    incrementLevel() {
        this.difficultyLevel++;
    }

    setPlayer(index, player) {
        this.players[index] = player;
        if (player) {
            this.activePlayers++;
        }
    }

    removePlayer(index) {
        if (this.players[index]) {
            this.players[index] = null;
            this.activePlayers--;
        }
    }

    // Utility methods
    getNextScoreThreshold() {
        return this.calculateFibonacci(this.difficultyLevel);
    }

    getCurrentEnemyHealth() {
        return Math.floor(3 * Math.pow(1.6, this.difficultyLevel - 1));
    }

    getCurrentEnemyColor() {
        const index = Math.min(this.difficultyLevel - 1, this.enemyColorsByLevel.length - 1);
        return this.enemyColorsByLevel[index];
    }

    calculateFibonacci(n) {
        if (n <= 1) return 500;
        let a = 500, b = 700;
        for (let i = 2; i <= n; i++) {
            [a, b] = [b, a + b];
        }
        return b;
    }

    getAvailableEnemyTypes() {
        const maxTypeIndex = Math.min(Math.floor((this.difficultyLevel - 1) / 2), this.enemyShipTypes.length - 1);
        return this.enemyShipTypes.slice(0, maxTypeIndex + 1);
    }

    // Getters for common calculations
    get centreX() { return this.scene.scale.width * 0.5; }
    get centreY() { return this.scene.scale.height * 0.5; }
}