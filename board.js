class Board {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.nodes = [];
        this.edges = [];
        this.initializeBoard();
    }

    initializeBoard() {
        // Set canvas size based on window size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Create the hexagonal circuits
        this.createHexagonalCircuits();
    }

    resizeCanvas() {
        const size = Math.min(window.innerWidth * 0.8, window.innerHeight * 0.8);
        this.canvas.width = size;
        this.canvas.height = size;
        this.centerX = size / 2;
        this.centerY = size / 2;
    }

    createHexagonalCircuits() {
        // Create three concentric hexagons
        const radiuses = [0.8, 0.6, 0.4]; // Relative to canvas size
        const weights = [[1, 2, 1], [4, 5, 6], [8, 9, 8]]; // Edge weights for each circuit

        radiuses.forEach((radius, circuitIndex) => {
            const nodes = [];
            const actualRadius = (this.canvas.width / 2) * radius;
            
            // Create 6 nodes for each hexagon
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i - Math.PI / 6;
                const x = this.centerX + actualRadius * Math.cos(angle);
                const y = this.centerY + actualRadius * Math.sin(angle);
                
                nodes.push({
                    x,
                    y,
                    circuit: circuitIndex,
                    index: i,
                    occupied: null
                });
            }

            // Connect nodes with edges
            for (let i = 0; i < 6; i++) {
                const weight = weights[circuitIndex][i % 3];
                this.edges.push({
                    start: nodes[i],
                    end: nodes[(i + 1) % 6],
                    weight,
                    controlled: null
                });
            }

            this.nodes.push(...nodes);
        });

        // Create connecting edges between circuits
        for (let circuit = 0; circuit < 2; circuit++) {
            for (let i = 0; i < 6; i++) {
                const startNode = this.nodes[circuit * 6 + i];
                const endNode = this.nodes[(circuit + 1) * 6 + i];
                const weight = weights[circuit + 1][i % 3];
                
                this.edges.push({
                    start: startNode,
                    end: endNode,
                    weight,
                    controlled: null
                });
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw edges
        this.edges.forEach(edge => {
            this.ctx.beginPath();
            this.ctx.moveTo(edge.start.x, edge.start.y);
            this.ctx.lineTo(edge.end.x, edge.end.y);
            this.ctx.strokeStyle = edge.controlled ? 
                (edge.controlled === 'red' ? '#ff4444' : '#4444ff') : 
                '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Calculate edge weight position with offset
            const midX = (edge.start.x + edge.end.x) / 2;
            const midY = (edge.start.y + edge.end.y) / 2;
            
            // Calculate angle of the edge
            const angle = Math.atan2(edge.end.y - edge.start.y, edge.end.x - edge.start.x);
            
            // Add perpendicular offset to prevent overlapping
            const offset = 20; // Adjust this value as needed
            const weightX = midX + Math.cos(angle + Math.PI/2) * offset;
            const weightY = midY + Math.sin(angle + Math.PI/2) * offset;

            // Draw weight with background for better visibility
            this.ctx.fillStyle = '#1a1a1a';
            this.ctx.beginPath();
            this.ctx.arc(weightX, weightY, 12, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw edge weight
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(edge.weight.toString(), weightX, weightY);
        });

        // Draw nodes
        this.nodes.forEach(node => {
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, 10, 0, Math.PI * 2);
            this.ctx.fillStyle = node.occupied ? 
                (node.occupied === 'red' ? '#ff4444' : '#4444ff') : 
                '#ffffff';
            this.ctx.fill();
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });

        // Add circuit highlight if in placement phase
        if (window.game && window.game.phase === 'placement') {
            this.drawCircuitHighlight();
        }
    }

    drawCircuitHighlight() {
        // Calculate which circuit is unlocked
        const getNodesInCircuit = (circuitNum) => {
            return this.nodes.filter(n => n.circuit === circuitNum && n.occupied).length;
        };

        const outerCircuitFilled = getNodesInCircuit(0) === 6;
        const middleCircuitFilled = getNodesInCircuit(1) === 6;

        // Determine which circuit to highlight
        let activeCircuit = 0;
        if (outerCircuitFilled && !middleCircuitFilled) {
            activeCircuit = 1;
        } else if (outerCircuitFilled && middleCircuitFilled) {
            activeCircuit = 2;
        }

        // Highlight nodes of the active circuit
        this.nodes.forEach(node => {
            if (node.circuit === activeCircuit && !node.occupied) {
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, 15, 0, Math.PI * 2);
                this.ctx.strokeStyle = '#00ff00';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
        });
    }

    getNodeAtPosition(x, y) {
        return this.nodes.find(node => {
            const dx = node.x - x;
            const dy = node.y - y;
            return Math.sqrt(dx * dx + dy * dy) <= 10;
        });
    }

    getAdjacentNodes(node) {
        return this.edges
            .filter(edge => edge.start === node || edge.end === node)
            .map(edge => edge.start === node ? edge.end : edge.start);
    }
} 