let grid = [], startNode = null, endNode = null;
let currentAction = null, currentTerrain = 'normal';
const TERRAIN_COST = { normal: 1, grass: 2, water: 5, mountain: 10 };
const GRID_SIZE = 20;
const gridContainer = document.getElementById('grid-container');
const terrainSelect = document.getElementById('terrain-select');

function delay(ms) { return new Promise(res => setTimeout(res, ms)); }

// 1️⃣ Initialize grid
for(let i=0;i<GRID_SIZE;i++){
  let row=[];
  for(let j=0;j<GRID_SIZE;j++){
    const cellElem = document.createElement('div');
    cellElem.classList.add('cell');
    cellElem.dataset.row = i; cellElem.dataset.col = j;
    cellElem.dataset.terrain = 'normal';
    cellElem.addEventListener('mousedown', onCellMouseDown);
    cellElem.addEventListener('mouseenter', onCellMouseEnter);
    gridContainer.appendChild(cellElem);

    row.push({ element:cellElem, row:i, col:j, isObstacle:false, terrain:'normal', weight:1 });
  }
  grid.push(row);
}
document.addEventListener('mouseup', () => currentDrag=false);
let currentDrag=false;

function onCellMouseDown(e){
  currentDrag=true;
  const [r,c]=[+e.target.dataset.row, +e.target.dataset.col];
  handleCellAction(grid[r][c]);
}
function onCellMouseEnter(e){
  if(!currentDrag) return;
  const [r,c]=[+e.target.dataset.row, +e.target.dataset.col];
  handleCellAction(grid[r][c]);
}
function handleCellAction(cell){
  if(currentAction==='start'){
    if(startNode) startNode.element.classList.remove('start');
    startNode=cell; cell.element.classList.add('start');
  }
  else if(currentAction==='end'){
    if(endNode) endNode.element.classList.remove('end');
    endNode=cell; cell.element.classList.add('end');
  }
  else if(currentAction==='obstacle'){
    cell.isObstacle = !cell.isObstacle;
    cell.element.classList.toggle('obstacle');
  }
  else if(currentAction==='terrain'){
    cell.terrain=currentTerrain;
    cell.weight=TERRAIN_COST[currentTerrain];
    cell.element.dataset.terrain=currentTerrain;
  }
}

// 2️⃣ Control buttons
document.getElementById('set-start').onclick = () => currentAction='start';
document.getElementById('set-end').onclick = () => currentAction='end';
document.getElementById('add-obstacle').onclick = () => currentAction='obstacle';
document.getElementById('set-terrain').onclick = () => {
  currentTerrain = terrainSelect.value; currentAction='terrain';
};
document.getElementById('reset').onclick = resetGrid;
document.getElementById('find-path').onclick = () => findPath();
document.getElementById('export').onclick = exportGrid;
document.getElementById('import').onclick = () => document.getElementById('importFile').click();
document.getElementById('importFile').addEventListener('change', handleImport);

// 3️⃣ Reset helpers
function resetGrid(){
  startNode = endNode = null;
  grid.forEach(row=>row.forEach(cell=>{
    cell.isObstacle = false;
    cell.terrain='normal';
    cell.weight=TERRAIN_COST.normal;
    cell.element.className='cell';
    cell.element.dataset.terrain='normal';
  }));
}
function resetPath(){
  grid.forEach(row=>row.forEach(cell=>{
    cell.element.classList.remove('visited','path');
  }));
}

// 4️⃣ Export / Import
function exportGrid(){
  const g = grid.map(row=>row.map(c=>({isObstacle:c.isObstacle, terrain:c.terrain})));
  const data = { grid: g,
                 start: startNode ? {r:startNode.row, c:startNode.col} : null,
                 end: endNode ? {r:endNode.row, c:endNode.col} : null };
  const blob = new Blob([JSON.stringify(data)],{type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download='grid.json';
  a.click(); URL.revokeObjectURL(url);
}
function handleImport(e){
  const file=e.target.files[0];
  const reader = new FileReader();
  reader.onload = () => importGrid(JSON.parse(reader.result));
  reader.readAsText(file);
}
function importGrid(data){
  resetGrid();
  data.grid.forEach((r,ri)=>r.forEach((c, ci)=>{
    const cell = grid[ri][ci];
    cell.isObstacle = c.isObstacle;
    cell.terrain = c.terrain;
    cell.weight = TERRAIN_COST[c.terrain];
    cell.element.dataset.terrain = c.terrain;
    cell.element.classList.toggle('obstacle', c.isObstacle);
  }));
  if(data.start) startAt(data.start.r, data.start.c);
  if(data.end) endAt(data.end.r, data.end.c);
}
function startAt(r,c){ handleCellAction(grid[r][c]); }
function endAt(r,c){ handleCellAction(grid[r][c]); }

// 5️⃣ Pathfinding controllers
async function findPath(){
  if(!startNode||!endNode){ alert('Please set start & end'); return; }
  resetPath();
  const algo = document.getElementById('algorithm').value;
  let path;
  if(algo==='bfs') path = await bfs();
  else if(algo==='dijkstra') path = await dijkstra();
  else path = await aStar();
  if(!path){ alert('No path found'); return; }
  for(const node of path){
    if(node!==startNode && node!==endNode){
      node.element.classList.add('path');
      await delay(50);
    }
  }
}

// 6️⃣ Neighbor logic (8-way)
function getNeighbors(node){
  const list = [];
  const deltas = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
  for(const [dr,dc] of deltas){
    const r=node.row+dr, c=node.col+dc;
    if(r>=0 && r<GRID_SIZE && c>=0 && c<GRID_SIZE){
      const n = grid[r][c];
      if(!n.isObstacle) list.push(n);
    }
  }
  return list;
}

// 7️⃣ BFS
async function bfs() {
  const queue = [startNode];
  const visited = new Set([`${startNode.row},${startNode.col}`]);
  const prev = new Map();

  while (queue.length) {
    const node = queue.shift();

    if (node !== startNode && node !== endNode) {
      node.element.classList.add('visited');
      await delay(20);
    }

    if (node === endNode) return buildPath(prev);

    for (const neighbor of getNeighbors(node)) {
      const key = `${neighbor.row},${neighbor.col}`;
      if (!visited.has(key)) {
        visited.add(key);
        prev.set(neighbor, node);
        queue.push(neighbor);
      }
    }
  }
  return null;
}


// 8️⃣ Dijkstra
async function dijkstra(){
  const dist = Array.from({length:GRID_SIZE},()=>Array(GRID_SIZE).fill(Infinity));
  dist[startNode.row][startNode.col]=0;
  const pq = new PriorityQueue();
  const visited = new Set();
  const prev = new Map();
  pq.enqueue({node:startNode, dist:0});
  while(!pq.isEmpty()){
    const {node, dist:cd} = pq.dequeue();
    if(visited.has(node)) continue;
    visited.add(node);
    if(node!==startNode && node!==endNode){
      node.element.classList.add('visited');
      await delay(20);
    }
    if(node===endNode) return buildPath(prev);
    for(const n of getNeighbors(node)){
      if(visited.has(n)) continue;
      const nd = cd + n.weight;
      if(nd < dist[n.row][n.col]){
        dist[n.row][n.col]=nd;
        prev.set(n,node);
        pq.enqueue({node:n, dist:nd});
      }
    }
  }
  return null;
}

// 9️⃣ A*
async function aStar(){
  const g = Array.from({length:GRID_SIZE},()=>Array(GRID_SIZE).fill(Infinity));
  const f = Array.from({length:GRID_SIZE},()=>Array(GRID_SIZE).fill(Infinity));
  const prev = new Map();
  const visited = new Set();
  const pq = new PriorityQueue();

  g[startNode.row][startNode.col] = 0;
  f[startNode.row][startNode.col] = heuristic(startNode, endNode);
  pq.enqueue({node:startNode, dist:f[startNode.row][startNode.col]});

  while(!pq.isEmpty()){
    const {node} = pq.dequeue();
    if(visited.has(node)) continue;
    visited.add(node);
    if(node!==startNode && node!==endNode){
      node.element.classList.add('visited');
      await delay(20);
    }
    if(node===endNode) return buildPath(prev);
    for(const n of getNeighbors(node)){
      if(visited.has(n)) continue;
      const tentativeG = g[node.row][node.col] + n.weight;
      if(tentativeG < g[n.row][n.col]){
        g[n.row][n.col] = tentativeG;
        prev.set(n, node);
        f[n.row][n.col] = tentativeG + heuristic(n, endNode);
        pq.enqueue({node:n, dist:f[n.row][n.col]});
      }
    }
  }
  return null;
}

// 10️⃣ Utility functions
function buildPath(prev){
  const path = [];
  let cur = endNode;
  while(cur){
    path.push(cur);
    cur = prev.get(cur);
  }
  return path.reverse();
}
function heuristic(a, b){
  const dx=Math.abs(a.row-b.row), dy=Math.abs(a.col-b.col);
  return Math.max(dx, dy); // Chebyshev for 8-way
}

// PriorityQueue (min-heap)
class PriorityQueue {
  constructor(){
    this.items = [];
  }
  enqueue(el){
    this.items.push(el);
    this.items.sort((a,b)=>a.dist - b.dist);
  }
  dequeue(){
    return this.items.shift();
  }
  isEmpty(){
    return this.items.length === 0;
  }
}
