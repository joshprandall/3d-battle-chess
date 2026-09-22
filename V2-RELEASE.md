# Battle Chess v2 — visual and combat upgrade

The five selectable sets now use custom procedural models in `pieces.js`; every chess role has its own shape within each theme. The `attacks.js` module animates six role-specific captures (pawn jab, knight leap, bishop beam, rook slam, queen vortex and king shockwave). Colors, particle shapes and cues vary by theme. The `battle.js` renderer supplies a brighter arena, board palettes and additional rim/fill lighting to make dark pieces visible.

The chess-rule engine (`engine.js`) and its rules were not changed. Persistent **Back to Projects** and **Website Home** navigation remains intact. These are lightweight procedural attack sequences, not fully rigged character-acted cinematic scenes.

## Update the already-live OSU game

In the **existing** `public_html/games/3d-battle-chess/` directory, back up `battle.js` and replace **only** `battle.js`, `pieces.js` and `attacks.js` with their latest matching versions from this repository. Leave `index.html`, `styles.css`, `engine.js`, the portfolio root, and other games alone. The successful GitHub Actions browser run also provides a full six-file deployment ZIP.

Use a modern WebGL-capable browser with internet access because three.js is loaded from a pinned CDN URL. In Chrome, use a new query parameter to bypass cached files if needed. If the new game does not render, restore the backed-up `battle.js` and remove the newly added modules; the previous four-file version will run as before.

The GitHub browser workflow covers all five set designs and six roles, a staged capture, desktop/mobile controls and the persistent return links. Test appearance and gestures on the actual phone as well.
