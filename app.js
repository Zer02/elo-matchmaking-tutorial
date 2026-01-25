// =======================
// SPIN v0.12 Core State
// =======================

let currentSeason = 1;
let nextPlayerId = 1;
const BASE_MMR = 1500;

// -------- League --------

let players = [];

let seasons = [
  createNewSeason(1)
];

// -------- Tournament --------

let tournamentPlayers = [];

// =======================
// Navigation
// =======================

function showPage(page) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(page).classList.add("active");
}

// =======================
// Season Helpers
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
// League Players
// =======================

function addPlayer() {
  const input = document.getElementById("playerName");
  const name = input.value.trim();
  if (!name) return;

  const player = {
    id: nextPlayerId++,
    name,
    elo: BASE_MMR
  };

  players.push(player);
  getSeason().records.push({ playerId: player.id, wins: 0, losses: 0 });

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

  getSeason().matches.push({ winnerId: winner.id, loserId: loser.id });
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
// Tournament Setup
// =======================

function addTournamentPlayer() {
  const input = document.getElementById("tournamentPlayerName");
  const name = input.value.trim();
  if (!name) return;

  tournamentPlayers.push(name);
  input.value = "";
  renderTournament();
}

function resetTournament() {
  tournamentPlayers = [];
  renderTournament();
}

function renderTournament() {
  const list = document.getElementById("tournamentPlayers");
  list.innerHTML = "";

  tournamentPlayers.forEach((p, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}. ${p}`;
    list.appendChild(li);
  });
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
    .forEach(p => {
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
}

// =======================
// Utilities
// =======================

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

render();
