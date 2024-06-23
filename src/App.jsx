import styles from './App.module.css';
import { createSignal } from 'solid-js';

import foxData from "./newdata.json";

const baseGrid = [
  [-1, -1, -1, -1, -1, -1],
  [-1, -1, -1, -1, -1, -1],
  [-1, -1, -1, -1, -1, -1],
  [-1, -1, -1, -1, -1, -1],
  [-1, -1, -1, -1, -1, -1],
  [-1, -1, -1, -1, -1, -1],
];

/*  
//  -1 = ?
//  0  = Empty
//  1  = Sword
//  2  = Gift/Coffer
//  3  = Fox
//  4  = Blocked
*/

const keybinds = [
  { button: 0, value: 1 },
  { button: 2, value: 0 },
  { button: 0, shift: true, value: 2 },
  { button: 2, shift: true, value: 3 },
  { button: 0, ctrl: true, value: -1 },
  { button: 2, ctrl: true, value: -1 },
]

const emojis = ['🟫', '⬜', '⚔️', '🎁', '🦊', '🔒'];

function renderEmoji(value) {
  return emojis[value + 1];
}

function matchPatterns(currentGrid, foxGrid) {
  for (let x = 0; x < 6; x++) {
    for (let y = 0; y < 6; y++) {
      if (currentGrid[x][y] === -1) continue;

      if (currentGrid[x][y] !== foxGrid[x][y]) return false;
    }
  }

  return true;
}

function findMatchingPatterns(currentGrid) {
  let results = [];

  for (let i = 0; i < foxData.length; i++) {
    if (matchPatterns(currentGrid, foxData[i])) results.push(foxData[i])
  }

  return results;
}

function App() {
  const [grid, updateGrid] = createSignal(baseGrid);
  const [blockedTilesCount, setBlockedTilesCount] = createSignal(0);

  // Initializing Grid
  updateGrid((currentGrid) => {
    return currentGrid.map(line => line.map(cell => createSignal(-1)))
  });

  function updateCellContent(x, y, value) {
    grid()[x][y][1](value);

    const matchingPatterns = findMatchingPatterns(grid().map(line => line.map(cell => cell[0]()))).map(pattern => pattern.map(line => line.map(cell => renderEmoji(cell))));

    const occurences = new Map();

    const ignoreList = [0, 3, 4];

    for (let i = 0; i < matchPatterns.length; i++) {
      for (let j = 0; j < matchPatterns.length; j++) {
        if (ignoreList.includes(matchPatterns[i][j])) continue;

        if (!occurences.has(matchPatterns[i][j])) occurences.set(matchPatterns[i][j], []);

        occurences.set(matchPatterns[i][j], [...occurences.get(matchPatterns[i][j]), [i, j]]);
      }
    }

    {
      ⚔️: [xy, xy, xy]
      🎁: [xy, xy, xy, xy]
    }

    if (value === 4 || value === -1) {
      let blockedCount = 0;
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 6; j++) {
          if (grid()[i][j][0]() === 4) blockedCount++;
        }
      }

      setBlockedTilesCount(blockedCount);
    }
  }

  function tileClicked(x, y, value, event) {
    if (event.button === 0 && blockedTilesCount() < 5 && value === -1) {
      updateCellContent(x, y, 4);
      return;
    }

    if (event.button === 0 && value === 4) {
      updateCellContent(x, y, -1);
      return;
    }

    if (blockedTilesCount() < 5) return;


    let found = keybinds.find(keybind => {
      if (keybind.button !== event.button) return false;
      if (event.shiftKey && !('shift' in keybind)) return false;
      if (event.ctrlKey && !('ctrl' in keybind)) return false;

      return true;
    })

    if (found) {
      if (found.value === value) {
        updateCellContent(x, y, -1);
        return;
      }

      updateCellContent(x, y, found.value);
      return;
    }
  }

  return (
    <div class={styles.App}>
      <header class={styles.header}>
        Blocked tiles placed: {blockedTilesCount()}
        <div class={styles.container} onContextMenu={(e) => e.preventDefault()}>
          <For each={grid()}>
            {(gridLine, x) =>
              <For each={gridLine}>
                {(cell, y) => <div
                  onContextMenu={(e) => e.preventDefault()}
                  onMouseDown={(e) => tileClicked(x(), y(), cell[0](), e)}
                >
                  {renderEmoji(cell[0]())}
                </div>}
              </For>

            }
          </For>
        </div>
      </header>
    </div>
  );
}

export default App;
