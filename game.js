class TitanCrash {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.board = new Board(this.canvas);
        this.currentPlayer = 'red';
        this.phase = 'placement';
        this.scores = { red: 0, blue: 0 };
        this.selectedNode = null;
        this.titansPlaced = { red: 0, blue: 0 };
        this.gameStarted = false;
        
        // Initialize timers
        this.playerTimers = {
            red: new GameTimer(300, this.updatePlayerTimer.bind(this, 'red'), this.handleTimeUp.bind(this, 'red')),
            blue: new GameTimer(300, this.updatePlayerTimer.bind(this, 'blue'), this.handleTimeUp.bind(this, 'blue'))
        };

        this.setupEventListeners();
        this.board.draw(); // Initial draw without interaction
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => {
            if (!this.gameStarted) return;
            this.handleClick(e);
        });
        
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());
    }

    startGame() {
        this.gameStarted = true;
        this.currentPlayer = 'red';
        this.phase = 'placement';
        this.playerTimers[this.currentPlayer].start();
        
        // Hide start button and show other controls
        document.getElementById('start-btn').style.display = 'none';
        document.getElementById('pause-btn').disabled = false;
        document.getElementById('reset-btn').disabled = false;
        
        this.updateGameStatus();
    }

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const clickedNode = this.board.getNodeAtPosition(x, y);

        if (!clickedNode) return;

        if (this.phase === 'placement') {
            this.handlePlacementPhase(clickedNode);
        } else {
            this.handleMovementPhase(clickedNode);
        }

        this.board.draw();
        this.updateGameStatus();
    }

    handlePlacementPhase(node) {
        if (node.occupied) return;

        // Calculate how many nodes are occupied in the current circuit
        const getNodesInCircuit = (circuitNum) => {
            return this.board.nodes.filter(n => n.circuit === circuitNum && n.occupied).length;
        };

        // Determine which circuit is currently unlocked
        const outerCircuitFilled = getNodesInCircuit(0) === 6;
        const middleCircuitFilled = getNodesInCircuit(1) === 6;

        // Check if the clicked node is in a valid circuit
        if (
            (!outerCircuitFilled && node.circuit === 0) ||
            (outerCircuitFilled && !middleCircuitFilled && node.circuit === 1) ||
            (outerCircuitFilled && middleCircuitFilled && node.circuit === 2)
        ) {
            if (this.titansPlaced[this.currentPlayer] < 4) {
                node.occupied = this.currentPlayer;
                this.titansPlaced[this.currentPlayer]++;
                this.updateScores();
                
                // Check for game end before switching players
                if (!this.checkGameEnd()) {
                    this.switchPlayer();
                }

                if (this.titansPlaced.red === 4 && this.titansPlaced.blue === 4) {
                    this.phase = 'movement';
                }
            }
        }
    }

    handleMovementPhase(node) {
        // First click - Select a piece
        if (!this.selectedNode) {
            if (node.occupied === this.currentPlayer) {
                this.selectedNode = node;
            }
            return;
        }

        // Second click - Move the piece
        const adjacentNodes = this.board.getAdjacentNodes(this.selectedNode);
        
        // Basic move validation: must be adjacent and empty
        if (adjacentNodes.includes(node) && !node.occupied) {
            // Execute move
            node.occupied = this.currentPlayer;
            this.selectedNode.occupied = null;
            this.updateScores();
            this.checkCapture(node);
            
            if (!this.checkGameEnd()) {
                this.switchPlayer();
            }
        }

        // Clear selection
        this.selectedNode = null;
    }

    updateScores() {
        this.scores = { red: 0, blue: 0 };
        this.board.edges.forEach(edge => {
            if (edge.start.occupied && edge.start.occupied === edge.end.occupied) {
                this.scores[edge.start.occupied] += edge.weight;
                edge.controlled = edge.start.occupied;
            } else {
                edge.controlled = null;
            }
        });

        document.getElementById('red-score').textContent = this.scores.red;
        document.getElementById('blue-score').textContent = this.scores.blue;
    }

    checkCapture(node) {
        const adjacentNodes = this.board.getAdjacentNodes(node);
        adjacentNodes.forEach(adjNode => {
            if (adjNode.occupied && adjNode.occupied !== this.currentPlayer) {
                const adjToTarget = this.board.getAdjacentNodes(adjNode);
                const isSurrounded = adjToTarget.every(n => 
                    n.occupied === this.currentPlayer || n === node
                );
                
                if (isSurrounded) {
                    adjNode.occupied = null;
                }
            }
        });
    }

    switchPlayer() {
        this.playerTimers[this.currentPlayer].pause();
        this.currentPlayer = this.currentPlayer === 'red' ? 'blue' : 'red';
        this.playerTimers[this.currentPlayer].start();
        this.updateGameStatus();
        document.getElementById('current-player').style.color = this.currentPlayer === 'red' ? '#ff4444' : '#4444ff';
    }

    updateGameStatus() {
        document.getElementById('current-player').textContent = 
            this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1);
        document.getElementById('game-phase').textContent = 
            this.phase.charAt(0).toUpperCase() + this.phase.slice(1);
    }

    updatePlayerTimer(player, time) {
        document.getElementById(`${player}-timer`).textContent = time;
    }

    handleTimeUp(player) {
        const winner = player === 'red' ? 'Blue' : 'Red';
        const winnerScore = player === 'red' ? this.scores.blue : this.scores.red;
        alert(`Game Over! ${winner} wins by timeout with a score of ${winnerScore}!`);
        this.resetGame();
    }

    togglePause() {
        if (this.playerTimers[this.currentPlayer].paused) {
            this.playerTimers[this.currentPlayer].start();
            document.getElementById('pause-btn').textContent = 'Pause';
        } else {
            this.playerTimers[this.currentPlayer].pause();
            document.getElementById('pause-btn').textContent = 'Resume';
        }
    }

    resetGame() {
        this.gameStarted = false;
        this.currentPlayer = 'red';
        this.phase = 'placement';
        this.scores = { red: 0, blue: 0 };
        this.selectedNode = null;
        this.titansPlaced = { red: 0, blue: 0 };
        
        // Reset board
        this.board.nodes.forEach(node => node.occupied = null);
        this.board.edges.forEach(edge => edge.controlled = null);
        
        // Reset timers
        Object.values(this.playerTimers).forEach(timer => timer.reset());
        
        // Show start button and reset other controls
        document.getElementById('start-btn').style.display = 'block';
        document.getElementById('pause-btn').disabled = true;
        document.getElementById('reset-btn').disabled = true;
        
        // Update UI
        this.board.draw();
        this.updateScores();
        this.updateGameStatus();
    }

    checkGameEnd() {
        // Check if innermost hexagon is fully occupied
        const innermostNodes = this.board.nodes.filter(node => node.circuit === 2);
        const isInnerHexagonFull = innermostNodes.every(node => node.occupied);

        if (isInnerHexagonFull) {
            // Pause both timers
            this.playerTimers.red.pause();
            this.playerTimers.blue.pause();

            // Determine winner based on scores
            let winner;
            if (this.scores.red > this.scores.blue) {
                winner = 'Red';
            } else if (this.scores.blue > this.scores.red) {
                winner = 'Blue';
            } else {
                winner = 'It\'s a tie';
            }

            // Show game end message
            setTimeout(() => {
                alert(`Game Over! Inner hexagon is fully occupied!\n${winner} wins with a score of ${Math.max(this.scores.red, this.scores.blue)}!`);
                this.resetGame();
            }, 100);

            return true;
        }
        return false;
    }
}

// Initialize game when window loads
window.addEventListener('load', () => {
    window.game = new TitanCrash();
}); 