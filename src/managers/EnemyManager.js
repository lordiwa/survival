// src/managers/EnemyManager.js - Enemy spawning and management
import EnemyFlying from '../gameObjects/EnemyFlying.js';
import EnemyBullet from '../gameObjects/EnemyBullet.js';
import Explosion from '../gameObjects/Explosion.js';

export default class EnemyManager {
    constructor(scene) {
        this.scene = scene;
        this.gameState = scene.gameState;
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

        const randomCount = Phaser.Math.RND.between(8, 20);
        const randomInterval = Phaser.Math.RND.between(6, 10) * 100;
        const randomPath = Phaser.Math.RND.between(0, 3);

        // Enemy power scaling
        const randomPower = Math.min(1 + Math.floor(this.gameState.difficultyLevel / 5), 4);
        const randomSpeed = Phaser.Math.RND.realInRange(0.0002, 0.002);

        this.timedEvent = this.scene.time.addEvent({
            delay: randomInterval,
            callback: this.addEnemy,
            args: [randomEnemyType, randomPath, randomSpeed, randomPower],
            callbackScope: this,
            repeat: randomCount
        });

        console.log(`Spawning ${randomCount + 1} ${randomEnemyType.name} enemies (${randomEnemyType.shootPattern} pattern) with power ${randomPower}`);
    }

    addEnemy(enemyType, pathId, speed, power) {
        const enemyHealth = this.gameState.getCurrentEnemyHealth();
        const enemyColor = this.gameState.getCurrentEnemyColor();

        const enemy = new EnemyFlying(this.scene, enemyType, pathId, speed, power, enemyHealth, enemyColor);
        this.scene.enemyGroup.add(enemy);
        return enemy;
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
                this.addFlyingGroup();
            }
        });
    }
}