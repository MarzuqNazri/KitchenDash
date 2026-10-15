# Kitchen Dash — Phaser 3

A complete, single-directory 2D browser arcade game. It uses Phaser 3 and draws the game graphics in code, so no image or audio assets are required.

## Files
- `index.html` — responsive page shell, instructions and Phaser CDN
- `main.js` — commented Phaser scene, controls, scoring, hazards, particle bursts and restart

## Play instructions
- Press **Space** or tap the game once to dismiss the start screen.
- Move between the three lanes with **← / →** or **A / D**.
- On touch devices, tap the left or right half of the game area to move.
- Collect ingredient plates for **+10 points**.
- Avoid hot-pan/flame hazards. One collision ends the shift.
- Press **Restart run** below the game, click **RESTART RUN** after game over, or press **Enter** to restart.

## Run locally
Keep `index.html` and `main.js` in the same folder. Open `index.html` in a modern browser with internet access, because Phaser 3 is loaded from jsDelivr CDN. No build command or server is required for this game.

## Publish on GitHub Pages
1. Create a repository and upload both files to its root.
2. Open **Settings → Pages**.
3. Select **Deploy from a branch**, branch `main`, folder `/(root)`, then save.
4. Open the URL GitHub Pages provides.

## Notes
- Best score is saved in the browser's `localStorage` on that device/browser.
- The game is designed for a 900 × 560 logical canvas and scales to fit the available area.
- The game uses emoji as ingredient/hazard icons and vector shapes for the chef, lanes and interface.
- No full browser-play test was performed in this generation environment; check the manual controls and collision feel in your target browser.
