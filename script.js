let grid = [];
let startNode = null;
let endNode = null;
let currentAction = null;
let isDragging = false;
let mouseDown = false;

// Initialize the grid
const gridContainer = document.getElementById('grid-container');
for (let i = 0; i < 20; i++) {
    let row = [];
    for (let j = 0; j < 20; j++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.row = i;
        cell.dataset.col = j;
        cell.addEventListener('mousedown', onCellMouseDown);
        cell.addEventListener('mouseenter', onCellMouseEnter);
        gridContainer.appendChild(cell);
        row.push({ element: cell, row: i, col: j, isObstacle: false });
    }
    grid.push(row);
}

document.addEventListener('mouseup', onMouseUp);
document.addEventListener('mouseleave', onMouseUp);

function onCellMouseDown(event) {
    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);
    const cell = grid[row][col];

    mouseDown = true;
    isDragging = true;

    handleCellAction(cell);
}

function onCellMouseEnter(event) {
    if (!mouseDown) return;
    
    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);
    const cell = grid[row][col];

    handleCellAction(cell);
}

function onMouseUp() {
    mouseDown = false;
    isDragging = false;
}

function handleCellAction(cell) {
    if (currentAction === 'start') {
        if (startNode) startNode.element.classList.remove('start');
        startNode = cell;
        cell.element.classList.add('start');
    } else if (currentAction === 'end') {
        if (endNode) endNode.element.classList.remove('end');
        endNode = cell;
        cell.element.classList.add('end');
    } else if (currentAction === 'obstacle') {
        toggleObstacle(cell);
    }
}

function toggleObstacle(cell) {
    cell.isObstacle = !cell.isObstacle;
    cell.element.classList.toggle('obstacle');
}

document.getElementById('set-start').addEventListener('click', () => currentAction = 'start');
document.getElementById('set-end').addEventListener('click', () => currentAction = 'end');
document.getElementById('add-obstacle').addEventListener('click', () => currentAction = 'obstacle');
document.getElementById('find-path').addEventListener('click', findPath);
document.getElementById('reset').addEventListener('click', resetGrid);

function resetGrid() {
    startNode = null;
    endNode = null;
    grid.forEach(row => row.forEach(cell => {
        cell.isObstacle = false;
        cell.element.className = 'cell';
    }));
}

function findPath() {
    if (!startNode || !endNode) return alert('Please set both start and end points.');
    resetPath();

    const algorithm = document.getElementById('algorithm').value;
    let path;
    
    if (algorithm === 'dijkstra') {
        path = dijkstra(grid, startNode, endNode);
    } else if (algorithm === 'bfs') {
        path = bfs(grid, startNode, endNode);
    }

    if (!path) return alert('No path found.');
    path.forEach(node => {
        if (node !== startNode && node !== endNode) {
            node.element.classList.add('path');
        }
    });
}

// BFS algorithm
function bfs(grid, startNode, endNode) {
    const queue = [startNode];
    const visited = new Set();
    const previousNodeMap = new Map();

    visited.add(startNode);

    while (queue.length > 0) {
        const node = queue.shift();
        if (node === endNode) {
            let path = [];
            let current = endNode;
            while (current !== startNode) {
                path.push(current);
                current = previousNodeMap.get(current);
            }
            path.push(startNode);
            return path.reverse();
        }

        const neighbors = getNeighbors(grid, node);
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor) && !neighbor.isObstacle) {
                visited.add(neighbor);
                queue.push(neighbor);
                previousNodeMap.set(neighbor, node);
            }
        }
    }
    return null;
}

function resetPath() {
    grid.forEach(row => row.forEach(cell => {
        cell.element.classList.remove('path');
    }));
}


// Dijkstra's algorithm
function dijkstra(grid, startNode, endNode) {
    const distance = [];
    const visited = new Set();
    const pq = new PriorityQueue();

    for (let i = 0; i < 20; i++) {
        distance[i] = [];
        for (let j = 0; j < 20; j++) {
            distance[i][j] = Infinity;
        }
    }
    distance[startNode.row][startNode.col] = 0;
    pq.enqueue({ node: startNode, dist: 0 });

    while (!pq.isEmpty()) {
        const { node, dist } = pq.dequeue();
        const { row, col } = node;

        if (visited.has(node)) continue;
        visited.add(node);

        const neighbors = getNeighbors(grid, node);
        for (const neighbor of neighbors) {
            if (neighbor.isObstacle) continue;
            const newDist = dist + 1;
            if (newDist < distance[neighbor.row][neighbor.col]) {
                distance[neighbor.row][neighbor.col] = newDist;
                pq.enqueue({ node: neighbor, dist: newDist });
            }
        }

        if (node === endNode) {
            let path = [];
            let current = endNode;
            while (current !== startNode) {
                path.push(current);
                current = getPreviousNode(grid, current, distance);
            }
            path.push(startNode);
            return path.reverse();
        }
    }
    return null;
}

function getNeighbors(grid, node) {
    const { row, col } = node;
    const neighbors = [];
    if (row > 0) neighbors.push(grid[row - 1][col]);
    if (row < 19) neighbors.push(grid[row + 1][col]);
    if (col > 0) neighbors.push(grid[row][col - 1]);
    if (col < 19) neighbors.push(grid[row][col + 1]);
    return neighbors;
}

function getPreviousNode(grid, node, distance) {
    const { row, col } = node;
    let minDist = distance[row][col];
    let prevNode = node;

    const neighbors = getNeighbors(grid, node);
    for (const neighbor of neighbors) {
        if (distance[neighbor.row][neighbor.col] < minDist) {
            minDist = distance[neighbor.row][neighbor.col];
            prevNode = neighbor;
        }
    }
    return prevNode;
}

class PriorityQueue {
    constructor() {
        this.items = [];
    }

    enqueue(item) {
        this.items.push(item);
        this.items.sort((a, b) => a.dist - b.dist);
    }

    dequeue() {
        return this.items.shift();
    }

    isEmpty() {
        return this.items.length === 0;
    }
}
