// src/managers/ControllerManager.js - Controller and input management
export default class ControllerManager {
    constructor(scene) {
        this.scene = scene;
        this.gameState = scene.gameState;
        this.connectedControllers = [];
        this.lastControllerCheck = 0;
    }

    initControllers() {
        this.updateConnectedControllers();
        this.setupControllerEventListeners();
        this.setupKeyboardInput();

        console.log(`${this.connectedControllers.length} controller(s) detected`);
    }

    setupControllerEventListeners() {
        window.addEventListener('gamepadconnected', (e) => {
            console.log(`Controller connected: ${e.gamepad.id} at index ${e.gamepad.index}`);
            this.updateConnectedControllers();
        });

        window.addEventListener('gamepaddisconnected', (e) => {
            console.log(`Controller disconnected: ${e.gamepad.id} at index ${e.gamepad.index}`);
            this.removeController(e.gamepad.index);
        });
    }

    setupKeyboardInput() {
        this.cursors = this.scene.input.keyboard.createCursorKeys();

        // Space bar to start game
        this.cursors.space.on('down', () => {
            if (this.gameState.waitingForStart) {
                this.scene.startGame();
            }
        });

        // Check for controller START button to start game
        this.checkControllerStart();
    }

    updateConnectedControllers() {
        if (!navigator.getGamepads) return;

        const gamepads = navigator.getGamepads();
        const currentControllers = [];

        for (let i = 0; i < gamepads.length && currentControllers.length < this.gameState.maxPlayers; i++) {
            if (gamepads[i]) {
                currentControllers.push({
                    index: i,
                    gamepad: gamepads[i]
                });
            }
        }

        this.connectedControllers = currentControllers;
        console.log(`Updated controller list: ${this.connectedControllers.length} controllers`);
    }

    removeController(gamepadIndex) {
        // Find and remove player using this controller
        for (let i = 0; i < this.gameState.players.length; i++) {
            const player = this.gameState.players[i];
            if (player && player.gamepadIndex === gamepadIndex) {
                console.log(`Removing Player ${i + 1} due to controller disconnect`);
                this.scene.playerManager.removePlayer(i + 1);
                break;
            }
        }

        this.updateConnectedControllers();
    }

    checkControllerStart() {
        const checkStart = () => {
            if (!this.gameState.waitingForStart) return;

            this.updateConnectedControllers();

            // Check for START button on any controller
            this.connectedControllers.forEach(controller => {
                const gamepad = controller.gamepad;
                if (gamepad && gamepad.buttons[9] && gamepad.buttons[9].pressed) {
                    // Add the first player and start the game
                    this.scene.playerManager.createPlayer(1, controller.index);
                    this.scene.startGame();
                    return;
                }
            });

            // Continue checking
            if (this.gameState.waitingForStart) {
                this.scene.time.delayedCall(100, checkStart);
            }
        };

        checkStart();
    }

    checkForNewPlayers() {
        // Only check every 100ms to avoid spam
        if (Date.now() - this.lastControllerCheck < 100) return;
        this.lastControllerCheck = Date.now();

        this.updateConnectedControllers();

        // Check for START button presses on unassigned controllers
        this.connectedControllers.forEach(controller => {
            const gamepad = controller.gamepad;
            if (!gamepad) return;

            // Check if this controller is already assigned to a player
            const alreadyAssigned = this.gameState.players.some(player =>
                player && player.gamepadIndex === controller.index
            );

            if (alreadyAssigned) return;

            // Check for START button press (button 9 on Xbox controllers)
            if (gamepad.buttons[9] && gamepad.buttons[9].pressed) {
                this.addNewPlayer(controller.index);
            }
        });
    }

    addNewPlayer(gamepadIndex) {
        // Find first available player slot
        for (let i = 0; i < this.gameState.maxPlayers; i++) {
            if (!this.gameState.players[i]) {
                const playerId = i + 1;
                console.log(`Adding new Player ${playerId} with controller ${gamepadIndex}`);

                this.scene.playerManager.createPlayer(playerId, gamepadIndex);

                // Show join message
                const position = this.gameState.playerStartPositions[i];
                this.scene.showFloatingText(position.x, position.y - 50,
                    `PLAYER ${playerId}\nJOINED!`, this.gameState.playerColors[i], 24);

                return;
            }
        }

        console.log('Cannot add new player - all slots full');
    }
}