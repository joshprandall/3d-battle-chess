# Deploy 3D Battle Chess to Joshua Randall's OSU website

This procedure deploys the standalone web game without overwriting the live portfolio, Qubit project, Evil Wizard or shared navigation.

## A. Download the current GitHub build

1. Open https://github.com/joshprandall/3d-battle-chess .
2. Choose **Code → Download ZIP**.
3. Extract the ZIP on your PC. Confirm that `index.html`, `styles.css`, `battle.js` and `engine.js` are present.
4. Keep the extracted game separate from your existing website files.

## B. Open your OSU web folder

5. Connect to the OSU campus network or VPN if you are off campus. OSU's official help is at https://it.engineering.oregonstate.edu/accessing-engineering-file-space .
6. On Windows, open File Explorer and enter `\\stak.engr.oregonstate.edu\users\randjosh\public_html` in its address bar. OSU also documents the Engineering Windows share at `\\depot.engr.oregonstate.edu\users\randjosh` (then open `public_html`). If neither works, use your normal Engineering network drive connection rather than changing an unfamiliar folder.
7. Copy or download a backup of your current `public_html` directory before changing anything.
8. Inside `public_html`, open the existing `games` folder, or create it if absent.
9. Create a NEW directory named `3d-battle-chess` inside `games`.
10. Copy only the four game files (`index.html`, `styles.css`, `battle.js`, `engine.js`) into `public_html/games/3d-battle-chess/`.
11. Do NOT move the game's `index.html` or `styles.css` into the root `public_html` folder. Do not replace root `app.js`, Qubit assets or any other game files.

## C. Verify before adding a portfolio link

12. Open `https://web.engr.oregonstate.edu/~randjosh/games/3d-battle-chess/` in a modern browser with internet access.
13. Confirm the 3D board loads with 32 pieces, you can play `e2e4`, the computer responds, the theme selector changes the set, and touch/mouse navigation works. Use local two-player mode to verify captures and undo.
14. Open your existing homepage and Qubit project in separate tabs. Check that they still load and that navigation works on a phone or tablet.
15. If the game does not load, check that `battle.js` and `engine.js` are in the same directory as the game's `index.html`, and check whether your network/browser blocks the pinned three.js CDN modules. Do not modify shared website CSS or scripts to troubleshoot the isolated game.

## D. Add one link to your existing portfolio

16. Make a backup copy of your live `projects.html`.
17. In the actual current live `projects.html`, add an independent project card or link in its existing projects section. The game's URL is `games/3d-battle-chess/` (relative to `public_html/projects.html`). Its GitHub repository is `https://github.com/joshprandall/3d-battle-chess`.
18. Do not replace `projects.html` with a copy from another repository unless you first verify it is exactly the live version. Keep all existing cards, Qubit links, project data attributes and navigation intact.
19. Check the Projects page and new game again on desktop and mobile. If a link-only change affects another project, restore your backed-up `projects.html`.

## Optional: link-only markup with no shared CSS changes

`<p><a href="games/3d-battle-chess/">Play 3D Battle Chess</a> · <a href="https://github.com/joshprandall/3d-battle-chess">View source on GitHub</a></p>`

The OSU filesystem is not connected for direct publishing through this chat, so committing to GitHub does not automatically upload files to `public_html`.
