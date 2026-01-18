// ===== SPIN v0.9 CONFIG =====
const BASE_K = 32;
const RD_MAX = 350;
const RD_MIN = 60;
const RD_DECAY = 0.9;
const RD_INACTIVITY_PENALTY = 25;

const PLACEMENT_MATCHES = 5;
const H2H_DAMPENING_THRESHOLD = 3;

let season = 1;

// ===== PLAYER SETUP =====
const players = [
  createPlayer("Alice"),
  createPlayer("Bob"),
  createPlayer("Charlie"),
  createPlayer("Diana")
];

function createPlayer(name) {
  return {
    name,
    mmr: 1500,
    rd: RD_MAX,
    wins: 0,
    losses: 0,
    matchesPlayed: 0,
    lastPlayed: 0,
    h2h: {}
  };
}

// ===== CORE MATH =====
function expectedScore(a, b) {
  return 1 / (1 + Math.pow(10, (b.mmr - a.mmr) / 400));
}

function dynamicK(player) {
  let k = BASE_K * (player.rd / RD_MAX);

  if (player.matchesPlayed < PLACEMENT_MATCHES) {
    k *= 1.5; // provisional boost
  }

  return k;
}

// ===== MATCH SIM =====
function simulateMatch() {
  const [p1, p2] = pickTwoPlayers();

  handleInactivity(p1);
  handleInactivity(p2);

  const expected1 = expectedScore(p1, p2);
  const p1Wins = Math.random() < expected1;

  updateRatings(p1, p2, p1Wins);
  updateRatings(p2, p1, !p1Wins);

  updateH2H(p1, p2, p1Wins);
  updateH2H(p2, p1, !p1Wins);

  p1.lastPlayed = season;
  p2.lastPlayed = season;

  render();
}

// ===== RATING UPDATE =====
function updateRatings(player, opponent, won) {
  const expected = expectedScore(player, opponent);
  const actual = won ? 1 : 0;

  let K = dynamicK(player);

  // Anti-farming dampener
  const h2hGames = player.h2h[opponent.name]?.wins +
                   player.h2h[opponent.name]?.losses || 0;

  if (h2hGames >= H2H_DAMPENING_THRESHOLD) {
    K *= 0.7;
  }

  player.mmr += K * (actual - expected);
  player.rd = Math.max(RD_MIN, player.rd * RD_DECAY);

  player.matchesPlayed++;
  won ? player.wins++ : player.losses++;
}

// ===== INACTIVITY =====
function handleInactivity(player) {
  const inactiveSeasons = season - player.lastPlayed - 1;
  if (inactiveSeasons > 0) {
    player.rd = Math.min(RD_MAX, player.rd + inactiveSeasons * RD_INACTIVITY_PENALTY);
  }
}

// ===== H2H =====
function updateH2H(player, opponent, won) {
  if (!player.h2h[opponent.name]) {
    player.h2h[opponent.name] = { wins: 0, losses: 0 };
  }
  won
    ? player.h2h[opponent.name].wins++
    : player.h2h[opponent.name].losses++;
}

// ===== SEASON LOGIC =====
function nextSeason() {
  season++;

  players.forEach(p => {
    p.rd = Math.min(RD_MAX, p.rd + 40); // soft reset
  });

  render();
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
    .forEach(p => {
      const status =
        p.matchesPlayed < PLACEMENT_MATCHES
          ? "Placement"
          : p.rd > 150
            ? "Unstable"
            : "Established";

      const h2hSummary = Object.entries(p.h2h)
        .map(([opp, r]) => `${opp}:${r.wins}-${r.losses}`)
        .join(" ");

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${p.name}</td>
        <td>${p.mmr.toFixed(1)}</td>
        <td>${Math.round(p.rd)}</td>
        <td>${status}</td>
        <td>${p.wins}</td>
        <td>${p.losses}</td>
        <td>${h2hSummary || "-"}</td>
      `;
      tbody.appendChild(row);
    });
}

render();