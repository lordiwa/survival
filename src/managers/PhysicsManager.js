// src/managers/PhysicsManager.js - Physics groups and collision handling
import EnemyBullet from '../gameObjects/EnemyBullet.js';

export default class PhysicsManager {
    constructor(scene) {
        this.scene = scene;
        this.gameState = scene.gameState;
        this.powerUpManager = null;
    }

    setPowerUpManager(powerUpManager) {
        this.powerUpManager = powerUpManager;
    }

    initPhysics() {
        // Create physics groups
        this.enemyGroup = this.scene.add.group();
        this.enemyBulletGroup = this.scene.add.group();
        this.playerBulletGroup = this.scene.add.group();
        this.bossGroup = this.scene.add.group();
        this.playerGroup = this.scene.add.group();

        // Set up physics overlaps
        this.setupCollisions();
    }

    setupCollisions() {
        this.scene.physics.add.overlap(this.playerGroup, this.enemyBulletGroup, this.hitPlayer, null, this);
        this.scene.physics.add.overlap(this.playerBulletGroup, this.enemyGroup, this.hitEnemy, null, this);
        this.scene.physics.add.overlap(this.playerGroup, this.enemyGroup, this.hitPlayer, null, this);
        this.scene.physics.add.overlap(this.playerGroup, this.powerUpManager.getPowerUpGroup(), this.collectPowerUp, null, this);
        this.scene.physics.add.overlap(this.playerBulletGroup, this.bossGroup, this.hitBoss, null, this);
        this.scene.physics.add.overlap(this.playerGroup, this.bossGroup, this.hitPlayer, null, this);
    }

    hitPlayer(player, obstacle) {
        // Player handles damage and invulnerability
        player.hit(obstacle.getPower());

        // Only destroy the obstacle if it's a bullet
        if (obstacle instanceof EnemyBullet) {
            obstacle.die();
        }
    }

    hitEnemy(bullet, enemy) {
        this.scene.levelManager.updateScore(10);
        bullet.remove();
        enemy.hit(bullet.getPower());
    }

    hitBoss(bullet, boss) {
        bullet.remove();
        boss.hit(bullet.getPower());
    }

    collectPowerUp(player, powerUp) {
        this.powerUpManager.handleCollision(player, powerUp);
    }
}