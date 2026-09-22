// Translate king-to-rook and rook-to-king taps into the legal two-square king move.
// This does not relax the chess engine's castling safety/rights checks.
export function castleAttempt(game, selected, x, y) {
  if (!selected || (game.turn !== 'w' && game.turn !== 'b')) return null;
  const home = game.turn === 'w' ? 7 : 0;
  if (selected.y !== home || y !== home) return null;
  const own = p => p?.c === game.turn;
  const first = game.piece(selected.x, selected.y);
  const clicked = game.piece(x, y);
  let rookX;
  if (selected.x === 4 && own(first) && first.t === 'k' && (x === 0 || x === 7) && own(clicked) && clicked.t === 'r') rookX = x;
  else if ((selected.x === 0 || selected.x === 7) && own(first) && first.t === 'r' && x === 4 && own(clicked) && clicked.t === 'k') rookX = selected.x;
  else return null;
  const nx = rookX === 7 ? 6 : 2;
  const move = game.legalMoves(4, home).find(m => m.nx === nx && m.ny === home) || null;
  return {move, side: rookX === 7 ? 'kingside' : 'queenside'};
}
export function castleNotation(game, input) {
  const text = input.trim().toLowerCase().replaceAll('0', 'o');
  const side = text === 'o-o' ? 7 : text === 'o-o-o' ? 0 : null;
  if (side === null) return null;
  const y = game.turn === 'w' ? 7 : 0;
  const attempt = castleAttempt(game, {x:4,y}, side, y);
  return attempt || {move:null,side:side===7?'kingside':'queenside'};
}
