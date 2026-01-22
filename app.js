// =======================
// SPIN v0.9 Core State
// =======================

let currentSeason = 1;

let players = [
  { id: 1, name: "Swift Hawk", elo: 1500, wins: 0, losses: 0 },
  { id: 2, name: "Iron Wolf", elo: 1500, wins: 0, losses: 0 },
  { id: 3, name: "Shadow Fox", elo: 1500, wins: 0, losses: 0 },
];

let seasons = [{ season: 1, matches: [] }];

// =======================
// Elo Math
// =======================

const K = 32;

function expectedScore(rA, rB) {
  return 1 / (1 + Math.pow(10, (rB - rA) / 400));
}

function updateElo(winner, loser) {
  const eW = expectedScore(winner.elo, loser.elo);
  const eL = expectedScore(loser.elo, winner.elo);

  winner.elo += K * (1 - eW);
  loser.elo += K * (0 - eL);

  winner.elo = Number(winner.elo.toFixed(1));
  loser.elo = Number(loser.elo.toFixed(1));
}

// =======================
// Match Simulation
// =======================

function simulateMatch() {
  const [a, b] = shuffle(players).slice(0, 2);

  const winner = Math.random() > 0.5 ? a : b;
  const loser = winner === a ? b : a;

  winner.wins++;
  loser.losses++;

  updateElo(winner, loser);

  const season = seasons.find((s) => s.season === currentSeason);

  season.matches.push({
    winner: winner.name,
    loser: loser.name,
    winnerElo: winner.elo,
    loserElo: loser.elo,
  });

  render();
}

// =======================
// Seasons
// =======================

function nextSeason() {
  currentSeason++;

  seasons.push({
    season: currentSeason,
    matches: [],
  });

  render();
}

// =======================
// Rendering
// =======================

function render() {
  document.getElementById("season").textContent = currentSeason;

  const tbody = document.getElementById("players");
  tbody.innerHTML = "";

  players
    .sort((a, b) => b.elo - a.elo)
    .forEach((p) => {
      tbody.innerHTML += `
        <tr>
          <td>${p.name}</td>
          <td>${p.elo}</td>
          <td>${p.wins}</td>
          <td>${p.losses}</td>
        </tr>
      `;
    });

  renderSeasons();
}

function renderSeasons() {
  const container = document.getElementById("seasons");
  container.innerHTML = "<h2>Season History</h2>";

  seasons.forEach((season) => {
    let html = `
      <div class="season">
        <h3>Season ${season.season}</h3>
        <ul>
    `;

    if (season.matches.length === 0) {
      html += "<li>No matches played</li>";
    } else {
      season.matches.forEach((m) => {
        html += `<li>${m.winner} def. ${m.loser}</li>`;
      });
    }

    html += "</ul></div>";
    container.innerHTML += html;
  });
}

// =======================
// Helpers
// =======================

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

// Initial render
render();
