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
  -1 = ?
  0  = Empty
  1  = Sword
  2  = Gift/Coffer
  3  = Fox
  4  = Blocked
*/

const keybinds = [
  { button: 0, value: 1 },
  { button: 2, value: 0 },
  { button: 0, shift: true, value: 2 },
  { button: 2, shift: true, value: 3 },
  { button: 0, ctrl: true, value: -1 },
  { button: 2, ctrl: true, value: -1 },
]

const emojis = ['unk', 'empty', 'swords', 'gift', 'fox', 'lock'];

function renderCellType(value) {
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
  const [highlights, updateHighlights] = createSignal([]);

  // Initializing Grid
  updateGrid((currentGrid) => {
    return currentGrid.map(line => line.map(_ => createSignal(-1)))
  });

  function updateCellContent(x, y, value) {
    grid()[x][y][1](value);

    if (value === 4 || value === -1) {
      let blockedCount = 0;
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 6; j++) {
          if (grid()[i][j][0]() === 4) blockedCount++;
        }
      }


      setBlockedTilesCount(blockedCount);
      if (blockedCount == 0) {
        updateHighlights([]);
        return;
      }
    }


    const matchingPatterns = findMatchingPatterns(grid().map(line => line.map(cell => cell[0]())));
    const occurences = new Map();

    const ignoreList = [-1, 0];

    for (let i = 0; i < matchingPatterns.length; i++) {
      for (let j = 0; j < 6; j++) {
        for (let k = 0; k < 6; k++) {
          if (ignoreList.includes(matchingPatterns[i][j][k])) continue;

          if (blockedTilesCount() < 5 && (matchingPatterns[i][j][k] === 1 || matchingPatterns[i][j][k] === 2)) continue;
          if (matchingPatterns.length > 1 && matchingPatterns[i][j][k] === 3) continue;

          if (grid()[j][k][0]() === matchingPatterns[i][j][k]) continue;

          /*
          Show locks when 16 patterns
          swords & boxes when 5 locked

          */

          if (!occurences.has(matchingPatterns[i][j][k])) occurences.set(matchingPatterns[i][j][k], new Map());

          const mapKey = JSON.stringify([j, k]);

          if (!occurences.get(matchingPatterns[i][j][k]).has(mapKey)) {
            occurences.get(matchingPatterns[i][j][k]).set(mapKey, 1);
          } else {
            occurences.get(matchingPatterns[i][j][k]).set(mapKey, occurences.get(matchingPatterns[i][j][k]).get(mapKey) + 1)
          }
        }
      }
    }

    const occurenceEntires = [...occurences.entries()];

    let foundTops = [];

    for (let i = 0; i < occurenceEntires.length; i++) {
      const sign = occurenceEntires[i][0];
      const signOccurenceList = [...occurenceEntires[i][1]].sort((a, b) =>
        b[1] - a[1]
      );

      let topValue = signOccurenceList[0][1];
      let allTops = signOccurenceList.filter(value => value[1] === topValue).map(value => ({ type: sign, value: value[0] }));

      foundTops = foundTops.concat(allTops);
    }

    console.log(foundTops)

    updateHighlights(foundTops.map(top => {
      let parsedCoordinates = JSON.parse(top.value);

      return {
        x: parsedCoordinates[0],
        y: parsedCoordinates[1],
        type: top.type
      };
    }))

  }

  function tileClicked(x, y, value, event) {
    //TODO: Fix weird interaction when  blockedTilesCount < 5, not letting you reset anything else and more
    //TODO: check if grid == baseGrid and if so return

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
        <div class={styles.text}>

          <img draggable="false" height={60} src="/icons/lock.svg" alt="" />: {blockedTilesCount()} / 5
        </div>
        <div class={styles.container} onContextMenu={(e) => e.preventDefault()}>
          <For each={grid()}>
            {(gridLine, x) =>
              <For each={gridLine}>
                {(cell, y) => <div
                  class={
                    (() => {
                      const highlight = highlights().find(h => h.x == x() && h.y == y())

                      if (!highlight) return [styles[renderCellType(cell[0]())]];

                      return styles.highlight + ' ' + styles[renderCellType(highlight.type)];
                    })()
                  }
                  onContextMenu={(e) => e.preventDefault()}
                  onMouseDown={(e) => tileClicked(x(), y(), cell[0](), e)}
                >
                  <img draggable="false" src={`/icons/${renderCellType(cell[0]())}.svg`} alt="" />
                </div>}
              </For>
            }
          </For>
        </div>
      </header >
    </div >
  );
}

export default App;
