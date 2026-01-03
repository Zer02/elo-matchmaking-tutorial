// --- Initial League State ---
const players = {
  Alice: { rating: 1500, wins: 0, losses: 0 },
  Bob: { rating: 1500, wins: 0, losses: 0 },
  Carol: { rating: 1500, wins: 0, losses: 0 },
  Dave: { rating: 1500, wins: 0, losses: 0 },
};

// Head-to-head tracker
const h2h = {};

// Initialize H2H matrix
Object.keys(players).forEach((p1) => {
  h2h[p1] = {};
  Object.keys(players).forEach((p2) => {
    if (p1 !== p2) h2h[p1][p2] = { wins: 0, losses: 0 };
  });
});

// --- Elo Formula ---
function calculateElo(rA, rB, scoreA, k = 32) {
  const expectedA = 1 / (1 + Math.pow(10, (rB - rA) / 400));
  return rA + k * (scoreA - expectedA);
}

// --- DOM ---
const p1Select = document.getElementById("player1");
const p2Select = document.getElementById("player2");
const winnerSelect = document.getElementById("winner");
const simulateBtn = document.getElementById("simulate");
const leaderboardBody = document.getElementById("leaderboard");
const h2hDiv = document.getElementById("h2h");

// Populate dropdowns
function populateSelectors() {
  [p1Select, p2Select, winnerSelect].forEach((sel) => (sel.innerHTML = ""));
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
    .forEach(([name, stats]) => {
      leaderboardBody.innerHTML += `
        <tr>
          <td>${name}</td>
          <td>${stats.rating.toFixed(1)}</td>
          <td>${stats.wins}</td>
          <td>${stats.losses}</td>
        </tr>
      `;
    });
}

function updateH2H() {
  h2hDiv.innerHTML = "";
  Object.keys(h2h).forEach((p1) => {
    Object.keys(h2h[p1]).forEach((p2) => {
      const record = h2h[p1][p2];
      if (record.wins + record.losses > 0) {
        h2hDiv.innerHTML += `<p>${p1} vs ${p2}: ${record.wins}-${record.losses}</p>`;
      }
    });
  });
}

// --- Match Simulation ---
simulateBtn.addEventListener("click", () => {
  const p1 = p1Select.value;
  const p2 = p2Select.value;
  const winner = winnerSelect.value;

  if (p1 === p2) return alert("Players must be different");
  if (![p1, p2].includes(winner))
    return alert("Winner must be one of the players");

  const score1 = winner === p1 ? 1 : 0;
  const score2 = 1 - score1;

  const r1 = players[p1].rating;
  const r2 = players[p2].rating;

  players[p1].rating = calculateElo(r1, r2, score1);
  players[p2].rating = calculateElo(r2, r1, score2);

  // Update W/L
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

  updateLeaderboard();
  updateH2H();
});

// --- Init ---
populateSelectors();
updateLeaderboard();
updateH2H();
