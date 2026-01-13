// ===== SPIN v0.8 CONFIG =====
const BASE_K = 32;
const RD_MAX = 350;
const RD_MIN = 50;
const RD_DECAY = 0.9;

// ===== PLAYERS =====
const players = [
  createPlayer("Alice"),
  createPlayer("Bob"),
  createPlayer("Charlie"),
  createPlayer("Diana"),
];

function createPlayer(name) {
  return {
    name,
    mmr: 1500,
    rd: RD_MAX,
    wins: 0,
    losses: 0,
    h2h: {}, // opponentName -> { wins, losses }
  };
}

// ===== CORE MATH =====
function expectedScore(a, b) {
  return 1 / (1 + Math.pow(10, (b.mmr - a.mmr) / 400));
}

function dynamicK(player) {
  return BASE_K * (player.rd / RD_MAX);
}

// ===== MATCH SIM =====
function simulateMatch() {
  const [p1, p2] = pickTwoPlayers();

  const expected1 = expectedScore(p1, p2);
  const expected2 = 1 - expected1;

  // Random outcome weighted by expected score
  const roll = Math.random();
  const p1Wins = roll < expected1;

  updateRatings(p1, p2, p1Wins);
  updateRatings(p2, p1, !p1Wins);

  updateH2H(p1, p2, p1Wins);
  updateH2H(p2, p1, !p1Wins);

  render();
}

// ===== RATING UPDATE =====
function updateRatings(player, opponent, won) {
  const expected = expectedScore(player, opponent);
  const actual = won ? 1 : 0;

  const K = dynamicK(player);
  player.mmr += K * (actual - expected);

  player.rd = Math.max(RD_MIN, player.rd * RD_DECAY);

  if (won) player.wins++;
  else player.losses++;
}

// ===== H2H =====
function updateH2H(player, opponent, won) {
  if (!player.h2h[opponent.name]) {
    player.h2h[opponent.name] = { wins: 0, losses: 0 };
  }
  won ? player.h2h[opponent.name].wins++ : player.h2h[opponent.name].losses++;
}

// ===== MATCHMAKING =====
function pickTwoPlayers() {
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  return [shuffled[0], shuffled[1]];
}

// ===== UI =====
function render() {
  const tbody = document.getElementById("leaderboard");
  tbody.innerHTML = "";

  [...players]
    .sort((a, b) => b.mmr - a.mmr)
    .forEach((p) => {
      const h2hSummary = Object.entries(p.h2h)
        .map(([opp, r]) => `${opp}: ${r.wins}-${r.losses}`)
        .join(" | ");

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${p.name}</td>
        <td>${p.mmr.toFixed(1)}</td>
        <td>${Math.round(p.rd)}</td>
        <td>${p.wins}</td>
        <td>${p.losses}</td>
        <td>${h2hSummary || "-"}</td>
      `;
      tbody.appendChild(row);
    });
}

render();
