// src/managers/LevelManager.js - Level progression and difficulty scaling
export default class LevelManager {
    constructor(scene) {
        this.scene = scene;
        this.gameState = scene.gameState;
        this.playerManager = null;
        this.bossManager = null;
    }

    setPlayerManager(playerManager) {
        this.playerManager = playerManager;
    }

    setBossManager(bossManager) {
        this.bossManager = bossManager;
    }

    updateScore(points) {
        // Scale down the points awarded
        const scaledPoints = Math.floor(points * 0.5);
        this.gameState.incrementScore(scaledPoints);
        this.scene.uiManager.updateScore(this.gameState.score);

        // Check for difficulty level up
        this.checkDifficultyLevelUp();
    }

    checkDifficultyLevelUp() {
        const nextThreshold = this.gameState.getNextScoreThreshold();

        if (this.gameState.score >= nextThreshold) {
            this.levelUp();

            // Check for boss spawn after level up
            this.checkBossSpawn();
        }

        // Update progress text
        const currentThreshold = this.gameState.getNextScoreThreshold();
        this.scene.uiManager.updateProgress(currentThreshold);
    }

    levelUp() {
        const oldLevel = this.gameState.difficultyLevel;
        this.gameState.incrementLevel();

        // Update UI
        this.scene.uiManager.updateLevel(this.gameState.difficultyLevel);

        // Change player ship every 6 levels for ALL players
        if (this.gameState.difficultyLevel % 6 === 1 && this.gameState.difficultyLevel > 1) {
            this.playerManager.upgradeAllPlayerShips();
        }

        // All players get bonuses when leveling up
        this.playerManager.giveAllPlayersLevelUpBonus();

        // Visual celebration
        this.scene.uiManager.showLevelUpEffect();

        console.log(`LEVEL UP! ${oldLevel} → ${this.gameState.difficultyLevel}`);
        console.log(`Enemy health now: ${this.gameState.getCurrentEnemyHealth()}`);
        console.log(`Enemy color: ${this.gameState.getCurrentEnemyColor().toString(16)}`);
    }

    checkBossSpawn() {
        if (this.gameState.difficultyLevel % 5 === 0 &&
            this.gameState.difficultyLevel > this.gameState.lastBossLevel &&
            !this.gameState.currentBoss) {

            this.bossManager.spawnBoss();
            this.gameState.lastBossLevel = this.gameState.difficultyLevel;
        }
    }
}