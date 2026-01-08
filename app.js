// --- Players ---
const players = {
  Alice: { rating: 1500, wins: 0, losses: 0, matches: 0 },
  Bob: { rating: 1500, wins: 0, losses: 0, matches: 0 },
  Carol: { rating: 1500, wins: 0, losses: 0, matches: 0 },
  Dave: { rating: 1500, wins: 0, losses: 0, matches: 0 },
};

// --- Head-to-Head ---
const h2h = {};
Object.keys(players).forEach((p1) => {
  h2h[p1] = {};
  Object.keys(players).forEach((p2) => {
    if (p1 !== p2) h2h[p1][p2] = { wins: 0, losses: 0 };
  });
});

// --- Match History ---
const matches = [];
let matchId = 1;

// --- Dynamic K-Factor ---
function getKFactor(player) {
  return player.matches < 10 ? 40 : 20;
}

// --- Elo ---
function calculateElo(rA, rB, scoreA, k) {
  const expected = 1 / (1 + Math.pow(10, (rB - rA) / 400));
  return rA + k * (scoreA - expected);
}

// --- DOM ---
const p1Select = document.getElementById("player1");
const p2Select = document.getElementById("player2");
const winnerSelect = document.getElementById("winner");
const simulateBtn = document.getElementById("simulate");
const leaderboardBody = document.getElementById("leaderboard");
const h2hDiv = document.getElementById("h2h");
const historyDiv = document.getElementById("matchHistory");

// --- Populate Selectors ---
function populateSelectors() {
  [p1Select, p2Select, winnerSelect].forEach((s) => (s.innerHTML = ""));
  Object.keys(players).forEach((name) => {
    p1Select.add(new Option(name, name));
    p2Select.add(new Option(name, name));
    winnerSelect.add(new Option(name, name));
  });
}

// --- UI Updates ---
function updateLeaderboard() {
  leaderboardBody.innerHTML = "";
  Object.entries(players)
    .sort((a, b) => b[1].rating - a[1].rating)
    .forEach(([name, p]) => {
      leaderboardBody.innerHTML += `
        <tr>
          <td>${name}</td>
          <td>${p.rating.toFixed(1)}</td>
          <td>${p.wins}</td>
          <td>${p.losses}</td>
          <td>${p.matches}</td>
        </tr>`;
    });
}

function updateH2H() {
  h2hDiv.innerHTML = "";
  Object.keys(h2h).forEach((p1) => {
    Object.keys(h2h[p1]).forEach((p2) => {
      const r = h2h[p1][p2];
      if (r.wins + r.losses > 0) {
        h2hDiv.innerHTML += `<p>${p1} vs ${p2}: ${r.wins}-${r.losses}</p>`;
      }
    });
  });
}

function updateHistory() {
  historyDiv.innerHTML = "";
  matches
    .slice()
    .reverse()
    .forEach((m) => {
      historyDiv.innerHTML += `<div>#${m.id} ${m.player1} vs ${m.player2} → ${m.winner}</div>`;
    });
}

// --- Simulation ---
simulateBtn.addEventListener("click", () => {
  const p1 = p1Select.value;
  const p2 = p2Select.value;
  const winner = winnerSelect.value;

  if (p1 === p2) return alert("Players must be different");
  if (![p1, p2].includes(winner))
    return alert("Winner must be one of the players");

  const score1 = winner === p1 ? 1 : 0;
  const score2 = 1 - score1;

  const k1 = getKFactor(players[p1]);
  const k2 = getKFactor(players[p2]);

  const r1Before = players[p1].rating;
  const r2Before = players[p2].rating;

  players[p1].rating = calculateElo(r1Before, r2Before, score1, k1);
  players[p2].rating = calculateElo(r2Before, r1Before, score2, k2);

  players[p1].matches++;
  players[p2].matches++;

  if (winner === p1) {
    players[p1].wins++;
    players[p2].losses++;
    h2h[p1][p2].wins++;
    h2h[p2][p1].losses++;
  } else {
    players[p2].wins++;
    players[p1].losses++;
    h2h[p2][p1].wins++;
    h2h[p1][p2].losses++;
  }

  matches.push({
    id: matchId++,
    player1: p1,
    player2: p2,
    winner,
  });

  updateLeaderboard();
  updateH2H();
  updateHistory();
});

// --- Init ---
populateSelectors();
updateLeaderboard();
updateH2H();
updateHistory();
