// =======================
// SPIN v0.10 Core State
// =======================

let currentSeason = 1;

let players = [
  { id: 1, name: "Alice", elo: 1500 },
  { id: 2, name: "Bob", elo: 1500 },
  { id: 3, name: "Charlie", elo: 1500 }
];

let seasons = [
  createNewSeason(1)
];

// =======================
// Helpers
// =======================

function createNewSeason(seasonNumber) {
  return {
    season: seasonNumber,
    records: players.map(p => ({
      playerId: p.id,
      wins: 0,
      losses: 0
    })),
    matches: []
  };
}

function getSeason() {
  return seasons.find(s => s.season === currentSeason);
}

function getRecord(playerId) {
  return getSeason().records.find(r => r.playerId === playerId);
}

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

  updateElo(winner, loser);

  const season = getSeason();

  getRecord(winner.id).wins++;
  getRecord(loser.id).losses++;

  season.matches.push({
    winnerId: winner.id,
    loserId: loser.id
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

  const season = getSeason();

  players
    .slice()
    .sort((a, b) => b.elo - a.elo)
    .forEach(player => {
      const record = getRecord(player.id);

      tbody.innerHTML += `
        <tr>
          <td>${player.name}</td>
          <td>${player.elo}</td>
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

  seasons.forEach(season => {
    let html = `
      <div class="season">
        <h3>Season ${season.season}</h3>
        <ul>
    `;

    if (season.matches.length === 0) {
      html += "<li>No matches played</li>";
    } else {
      season.matches.forEach(m => {
        const w = players.find(p => p.id === m.winnerId).name;
        const l = players.find(p => p.id === m.loserId).name;
        html += `<li>${w} (${seasonRecord(w, season.season)}) vs ${l}</li>`;
      });
    }

    html += "</ul></div>";
    container.innerHTML += html;
  });
}

function seasonRecord(playerName, seasonNumber) {
  const season = seasons.find(s => s.season === seasonNumber);
  const player = players.find(p => p.name === playerName);
  const record = season.records.find(r => r.playerId === player.id);
  return `${record.wins}-${record.losses}`;
}

// =======================
// Utilities
// =======================

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

// Initial render
render();
