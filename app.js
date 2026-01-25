// =======================
// SPIN v0.11 Core State
// =======================

let currentSeason = 1;
let nextPlayerId = 1;
const BASE_MMR = 1500;

let players = [];

let seasons = [createNewSeason(1)];

// =======================
// Season Helpers
// =======================

function createNewSeason(seasonNumber) {
  return {
    season: seasonNumber,
    records: players.map((p) => ({
      playerId: p.id,
      wins: 0,
      losses: 0,
    })),
    matches: [],
  };
}

function getSeason() {
  return seasons.find((s) => s.season === currentSeason);
}

function getRecord(playerId) {
  return getSeason().records.find((r) => r.playerId === playerId);
}

// =======================
// Elo Math
// =======================

const K = 32;

function expectedScore(a, b) {
  return 1 / (1 + Math.pow(10, (b - a) / 400));
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
// Player Management
// =======================

function addPlayer() {
  const input = document.getElementById("playerName");
  const name = input.value.trim();

  if (!name) return;

  const player = {
    id: nextPlayerId++,
    name,
    elo: BASE_MMR,
  };

  players.push(player);

  // Add record for current season
  getSeason().records.push({
    playerId: player.id,
    wins: 0,
    losses: 0,
  });

  input.value = "";
  render();
}

// =======================
// Match Simulation
// =======================

function simulateMatch() {
  if (players.length < 2) return;

  const [a, b] = shuffle(players).slice(0, 2);

  const winner = Math.random() > 0.5 ? a : b;
  const loser = winner === a ? b : a;

  updateElo(winner, loser);

  getRecord(winner.id).wins++;
  getRecord(loser.id).losses++;

  getSeason().matches.push({
    winnerId: winner.id,
    loserId: loser.id,
  });

  render();
}

// =======================
// Seasons
// =======================

function nextSeason() {
  currentSeason++;
  seasons.push(createNewSeason(currentSeason));
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
    .slice()
    .sort((a, b) => b.elo - a.elo)
    .forEach((p) => {
      const record = getRecord(p.id) || { wins: 0, losses: 0 };

      tbody.innerHTML += `
        <tr>
          <td>${p.name}</td>
          <td>${p.elo}</td>
          <td>${record.wins}</td>
          <td>${record.losses}</td>
        </tr>
      `;
    });

  renderSeasons();
}

function renderSeasons() {
  const container = document.getElementById("seasons");
  container.innerHTML = "<h2>Season History</h2>";

  seasons.forEach((season) => {
    let html = `<h3>Season ${season.season}</h3><ul>`;

    if (season.matches.length === 0) {
      html += "<li>No matches played</li>";
    } else {
      season.matches.forEach((m) => {
        const w = players.find((p) => p.id === m.winnerId)?.name;
        const l = players.find((p) => p.id === m.loserId)?.name;
        html += `<li>${w} vs ${l}</li>`;
      });
    }

    html += "</ul>";
    container.innerHTML += html;
  });
}

// =======================
// Utilities
// =======================

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

// Initial render
render();
