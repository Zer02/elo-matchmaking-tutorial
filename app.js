// =====================
// Core Constants
// =====================

const BASE_MMR = 1500;
const K = 32;

// =====================
// League State
// =====================

let currentSeason = 1;
let nextPlayerId = 1;

const players = [];
const seasons = [];

// =====================
// Tournament State
// =====================

let tournamentPlayers = [];
let tournamentRounds = [];
let currentRound = 0;
let currentMatch = 0;

// =====================
// Navigation
// =====================

function showPage(page) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document.getElementById(page).classList.add("active");
}

// =====================
// Elo Math
// =====================

function expectedScore(a, b) {
  return 1 / (1 + Math.pow(10, (b - a) / 400));
}

function updateElo(winner, loser) {
  const ew = expectedScore(winner.elo, loser.elo);
  const el = expectedScore(loser.elo, winner.elo);

  winner.elo += K * (1 - ew);
  loser.elo += K * (0 - el);

  winner.elo = +winner.elo.toFixed(1);
  loser.elo = +loser.elo.toFixed(1);
}

// =====================
// League Logic
// =====================

function startSeason() {
  seasons.push({
    season: currentSeason,
    records: players.map((p) => ({
      playerId: p.id,
      wins: 0,
      losses: 0,
    })),
  });
}

startSeason();

function getCurrentSeason() {
  return seasons.find((s) => s.season === currentSeason);
}

function getRecord(season, playerId) {
  return season.records.find((r) => r.playerId === playerId);
}

function addPlayer() {
  const input = document.getElementById("playerName");
  const name = input.value.trim();
  if (!name) return;

  const player = { id: nextPlayerId++, name, elo: BASE_MMR };
  players.push(player);

  seasons.forEach((s) =>
    s.records.push({ playerId: player.id, wins: 0, losses: 0 }),
  );

  input.value = "";
  renderLeague();
}

function simulateMatch() {
  if (players.length < 2) return;

  const [a, b] = shuffle(players).slice(0, 2);
  const winner = Math.random() > 0.5 ? a : b;
  const loser = winner === a ? b : a;

  updateElo(winner, loser);

  const record = getCurrentSeason();
  getRecord(record, winner.id).wins++;
  getRecord(record, loser.id).losses++;

  renderLeague();
}

function nextSeason() {
  currentSeason++;
  startSeason();
  renderLeague();
}

// =====================
// Tournament Logic
// =====================

function addTournamentPlayer() {
  const input = document.getElementById("tournamentName");
  const name = input.value.trim();
  if (!name) return;

  tournamentPlayers.push(name);
  input.value = "";
  renderTournament();
}

function startTournament() {
  if (tournamentPlayers.length < 2) return;

  tournamentRounds = [];
  currentRound = 0;
  currentMatch = 0;

  let round = shuffle([...tournamentPlayers]).map((p) => ({ player: p }));
  tournamentRounds.push(round);

  while (round.length > 1) {
    const nextRound = [];
    for (let i = 0; i < round.length; i += 2) {
      nextRound.push({ player: null });
    }
    tournamentRounds.push(nextRound);
    round = nextRound;
  }

  renderTournament();
}

function playNextTournamentMatch() {
  if (currentRound >= tournamentRounds.length - 1) return;

  const round = tournamentRounds[currentRound];
  if (currentMatch >= round.length - 1) {
    currentRound++;
    currentMatch = 0;
    return;
  }

  const a = round[currentMatch].player;
  const b = round[currentMatch + 1].player;
  if (!a || !b) return;

  const winner = Math.random() > 0.5 ? a : b;
  tournamentRounds[currentRound + 1][Math.floor(currentMatch / 2)].player =
    winner;

  currentMatch += 2;
  renderTournament();
}

function resetTournament() {
  tournamentPlayers = [];
  tournamentRounds = [];
  currentRound = 0;
  currentMatch = 0;
  renderTournament();
}

// =====================
// Rendering
// =====================

function renderLeague() {
  document.getElementById("seasonNumber").textContent = currentSeason;

  const tbody = document.getElementById("leagueTable");
  tbody.innerHTML = "";

  const season = getCurrentSeason();

  players
    .slice()
    .sort((a, b) => b.elo - a.elo)
    .forEach((p) => {
      const r = getRecord(season, p.id);
      tbody.innerHTML += `
        <tr>
          <td>${p.name}</td>
          <td>${p.elo}</td>
          <td>${r.wins}</td>
          <td>${r.losses}</td>
        </tr>
      `;
    });

  renderSeasonHistory();
}

function renderSeasonHistory() {
  const div = document.getElementById("seasonHistory");
  div.innerHTML = "";

  seasons.forEach((s) => {
    let html = `<div class="season-block"><strong>Season ${s.season}</strong><table>
      <tr><th>Player</th><th>W</th><th>L</th></tr>`;

    s.records.forEach((r) => {
      const p = players.find((p) => p.id === r.playerId);
      html += `<tr><td>${p.name}</td><td>${r.wins}</td><td>${r.losses}</td></tr>`;
    });

    html += "</table></div>";
    div.innerHTML += html;
  });
}

function renderTournament() {
  const div = document.getElementById("bracket");
  div.innerHTML = "";

  tournamentRounds.forEach((round, i) => {
    let html = `<h4>Round ${i + 1}</h4><ul>`;
    round.forEach((m) => {
      html += `<li>${m.player ?? "—"}</li>`;
    });
    html += "</ul>";
    div.innerHTML += html;
  });
}

// =====================
// Utils
// =====================

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

renderLeague();
renderTournament();
