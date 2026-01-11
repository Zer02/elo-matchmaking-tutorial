// --- Constants ---
const ELO_K = 32;
const GLICKO_Q = Math.log(10) / 400;

// --- Players ---
const players = {
  Alice: { elo: 1500, mu: 1500, rd: 350, matches: 0 },
  Bob: { elo: 1500, mu: 1500, rd: 350, matches: 0 },
};

// --- DOM ---
const p1Sel = document.getElementById("p1");
const p2Sel = document.getElementById("p2");
const winnerSel = document.getElementById("winner");
const btn = document.getElementById("simulate");
const board = document.getElementById("leaderboard");

// --- Init selectors ---
function initSelectors() {
  [p1Sel, p2Sel, winnerSel].forEach((s) => (s.innerHTML = ""));
  Object.keys(players).forEach((p) => {
    p1Sel.add(new Option(p, p));
    p2Sel.add(new Option(p, p));
    winnerSel.add(new Option(p, p));
  });
}

// --- Elo ---
function eloUpdate(rA, rB, scoreA) {
  const expected = 1 / (1 + Math.pow(10, (rB - rA) / 400));
  return rA + ELO_K * (scoreA - expected);
}

// --- Glicko (single-match simplified) ---
function g(rd) {
  return 1 / Math.sqrt(1 + (3 * GLICKO_Q ** 2 * rd ** 2) / Math.PI ** 2);
}

function expected(muA, muB, rdB) {
  return 1 / (1 + Math.pow(10, (-g(rdB) * (muA - muB)) / 400));
}

function glickoUpdate(player, opponent, score) {
  const E = expected(player.mu, opponent.mu, opponent.rd);
  const gRD = g(opponent.rd);

  const d2 = 1 / (GLICKO_Q ** 2 * gRD ** 2 * E * (1 - E));
  const muNew =
    player.mu + (GLICKO_Q / (1 / player.rd ** 2 + 1 / d2)) * gRD * (score - E);
  const rdNew = Math.sqrt(1 / (1 / player.rd ** 2 + 1 / d2));

  player.mu = muNew;
  player.rd = rdNew;
}

// --- UI ---
function render() {
  board.innerHTML = "";
  Object.entries(players).forEach(([name, p]) => {
    board.innerHTML += `
      <tr>
        <td>${name}</td>
        <td>${p.elo.toFixed(1)}</td>
        <td>${p.mu.toFixed(1)}</td>
        <td>${p.rd.toFixed(1)}</td>
        <td>${p.matches}</td>
      </tr>`;
  });
}

// --- Simulation ---
btn.addEventListener("click", () => {
  const p1 = players[p1Sel.value];
  const p2 = players[p2Sel.value];
  const winner = winnerSel.value;

  if (p1Sel.value === p2Sel.value) return alert("Players must differ");

  const score1 = winner === p1Sel.value ? 1 : 0;
  const score2 = 1 - score1;

  // Elo
  const elo1 = eloUpdate(p1.elo, p2.elo, score1);
  const elo2 = eloUpdate(p2.elo, p1.elo, score2);

  // Glicko
  glickoUpdate(p1, p2, score1);
  glickoUpdate(p2, p1, score2);

  p1.elo = elo1;
  p2.elo = elo2;

  p1.matches++;
  p2.matches++;

  render();
});

// --- Init ---
initSelectors();
render();
