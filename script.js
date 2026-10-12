const SIZE = 10;
const SHIP_LENGTHS = [5, 4, 3, 3, 2];

const playerBoardEl = document.getElementById("player-board");
const enemyBoardEl = document.getElementById("enemy-board");
const statusEl = document.getElementById("status");
const playerLeftEl = document.getElementById("player-left");
const enemyLeftEl = document.getElementById("enemy-left");
const shuffleBtn = document.getElementById("shuffle");
const restartBtn = document.getElementById("restart");

let player, enemy, started, gameOver, aiTargets;

// A fleet is a list of ships plus the set of cells that were already shot at.
function createFleet() {
  const ships = [];
  for (const length of SHIP_LENGTHS) {
    let cells;
    do {
      cells = randomShipCells(length);
    } while (cells.some((c) => shipAt(ships, c)));
    ships.push({ cells, hits: new Set() });
  }
  return { ships, shots: new Set() };
}

function randomShipCells(length) {
  const horizontal = Math.random() < 0.5;
  const row = randomInt(horizontal ? SIZE : SIZE - length + 1);
  const col = randomInt(horizontal ? SIZE - length + 1 : SIZE);
  const cells = [];
  for (let i = 0; i < length; i++) {
    cells.push(toIndex(horizontal ? row : row + i, horizontal ? col + i : col));
  }
  return cells;
}

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

function toIndex(row, col) {
  return row * SIZE + col;
}

function shipAt(ships, index) {
  return ships.find((ship) => ship.cells.includes(index));
}

function isSunk(ship) {
  return ship.hits.size === ship.cells.length;
}

function shipsLeft(fleet) {
  return fleet.ships.filter((ship) => !isSunk(ship)).length;
}

// Returns "miss", "hit" or "sunk".
function fire(fleet, index) {
  fleet.shots.add(index);
  const ship = shipAt(fleet.ships, index);
  if (!ship) return "miss";
  ship.hits.add(index);
  return isSunk(ship) ? "sunk" : "hit";
}

function render(boardEl, fleet, showShips) {
  boardEl.innerHTML = "";
  for (let i = 0; i < SIZE * SIZE; i++) {
    const cell = document.createElement(showShips ? "div" : "button");
    cell.className = "cell";
    cell.dataset.index = i;
    const ship = shipAt(fleet.ships, i);
    if (fleet.shots.has(i)) {
      if (!ship) {
        cell.classList.add("miss");
        cell.textContent = "•";
      } else {
        cell.classList.add(isSunk(ship) ? "sunk" : "hit");
        cell.textContent = "✕";
      }
    } else if (ship && (showShips || gameOver)) {
      cell.classList.add("ship");
    }
    boardEl.appendChild(cell);
  }
}

function renderAll() {
  render(playerBoardEl, player, true);
  render(enemyBoardEl, enemy, false);
  playerLeftEl.textContent = shipsLeft(player);
  enemyLeftEl.textContent = shipsLeft(enemy);
  shuffleBtn.disabled = started;
  enemyBoardEl.classList.toggle("locked", gameOver);
}

function newGame() {
  player = createFleet();
  enemy = createFleet();
  started = false;
  gameOver = false;
  aiTargets = [];
  statusEl.textContent = "לחצו על משבצת בלוח היריב כדי לירות";
  renderAll();
}

function playerTurn(index) {
  if (gameOver || enemy.shots.has(index)) return;
  started = true;

  const result = fire(enemy, index);
  if (shipsLeft(enemy) === 0) return endGame("ניצחתם! כל צוללות היריב טבעו 🎉");

  const reply = enemyTurn();
  if (shipsLeft(player) === 0) return endGame("הפסדתם... היריב הטביע את כל הצי שלכם");

  statusEl.textContent = `אתם: ${RESULT_TEXT[result]} | היריב: ${RESULT_TEXT[reply]}`;
  renderAll();
}

const RESULT_TEXT = { miss: "החטאה", hit: "פגיעה!", sunk: "צוללת טבעה!" };

// The computer shoots randomly until it hits, then tries the neighbouring cells.
function enemyTurn() {
  let index;
  do {
    index = aiTargets.length ? aiTargets.pop() : randomInt(SIZE * SIZE);
  } while (player.shots.has(index));

  const result = fire(player, index);
  if (result === "hit") aiTargets.push(...neighbours(index));
  if (result === "sunk") aiTargets = [];
  return result;
}

function neighbours(index) {
  const row = Math.floor(index / SIZE);
  const col = index % SIZE;
  const result = [];
  if (row > 0) result.push(toIndex(row - 1, col));
  if (row < SIZE - 1) result.push(toIndex(row + 1, col));
  if (col > 0) result.push(toIndex(row, col - 1));
  if (col < SIZE - 1) result.push(toIndex(row, col + 1));
  return result;
}

function endGame(message) {
  gameOver = true;
  statusEl.textContent = message;
  renderAll();
}

enemyBoardEl.addEventListener("click", (event) => {
  const cell = event.target.closest(".cell");
  if (cell) playerTurn(Number(cell.dataset.index));
});

shuffleBtn.addEventListener("click", () => {
  player = createFleet();
  renderAll();
});

restartBtn.addEventListener("click", newGame);

newGame();
