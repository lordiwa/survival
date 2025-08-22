// src/managers/MapManager.js - Background map scrolling management
import ASSETS from '../assets.js';

export default class MapManager {
    constructor(scene) {
        this.scene = scene;
        this.gameState = scene.gameState;

        // Map configuration
        this.tiles = [50, 50, 50, 50, 50, 50, 50, 50, 50, 110, 110, 110, 110, 110, 50, 50, 50, 50, 50, 50, 50, 50, 50, 110, 110, 110, 110, 110, 36, 48, 60, 72, 84];
        this.tileSize = 32;
        this.mapOffset = 10;
        this.mapTop = -this.mapOffset * this.tileSize;
        this.mapHeight = Math.ceil(this.scene.scale.height / this.tileSize) + this.mapOffset + 1;
        this.mapWidth = Math.ceil(this.scene.scale.width / this.tileSize);
        this.scrollSpeed = 1;
        this.scrollMovement = 0;
    }

    initMap() {
        const mapData = [];

        for (let y = 0; y < this.mapHeight; y++) {
            const row = [];

            for (let x = 0; x < this.mapWidth; x++) {
                const tileIndex = Phaser.Math.RND.weightedPick(this.tiles);
                row.push(tileIndex);
            }

            mapData.push(row);
        }

        this.map = this.scene.make.tilemap({
            data: mapData,
            tileWidth: this.tileSize,
            tileHeight: this.tileSize
        });

        const tileset = this.map.addTilesetImage(ASSETS.spritesheet.tiles.key);
        this.groundLayer = this.map.createLayer(0, tileset, 0, this.mapTop);
    }

    updateMap() {
        this.scrollMovement += this.scrollSpeed;

        if (this.scrollMovement >= this.tileSize) {
            // Create new row on top
            let tile;
            let prev;

            // Loop through map from bottom to top row
            for (let y = this.mapHeight - 2; y > 0; y--) {
                // Loop through map from left to right column
                for (let x = 0; x < this.mapWidth; x++) {
                    tile = this.map.getTileAt(x, y - 1);
                    prev = this.map.getTileAt(x, y);

                    prev.index = tile.index;

                    if (y === 1) { // If top row
                        tile.index = Phaser.Math.RND.weightedPick(this.tiles);
                    }
                }
            }

            this.scrollMovement -= this.tileSize; // Reset to 0
        }

        this.groundLayer.y = this.mapTop + this.scrollMovement; // Move one tile up
    }
}