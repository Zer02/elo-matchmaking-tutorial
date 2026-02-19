/* =====================================================
   SPIN v0.17
   - Match Quality Score
   - Seasonal MMR overlays
   - ratingBefore / ratingAfter stored
===================================================== */

let season = 1;
let players = [];
let seasonHistory = [];

const K = 32;
const BASE_MMR = 1500;
const app = document.getElementById("app");

window.addEventListener("hashchange", render);
window.addEventListener("load", render);

/* ---------- PLAYER ---------- */

function createPlayer(name) {
  return {
    name,
    rating: BASE_MMR,
    seasonWins: 0,
    seasonLosses: 0,
    careerWins: 0,
    careerLosses: 0,
    eloHistory: [{ season: 1, rating: BASE_MMR }],
  };
}

function addPlayer(name) {
  players.push(createPlayer(name));
}

function recordWin(winner, loser) {
  winner.seasonWins++;
  loser.seasonLosses++;
  winner.careerWins++;
  loser.careerLosses++;
}

/* ---------- ELO ---------- */

function expectedScore(a, b) {
  return 1 / (1 + Math.pow(10, (b - a) / 400));
}

function calculateMatchQuality(r1, r2) {
  const diff = Math.abs(r1 - r2);
  return Math.max(0, 1 - diff / 800); // normalized 0–1
}

function qualityLabel(q) {
  if (q > 0.9) return "🔥 Elite";
  if (q > 0.75) return "⚖️ Competitive";
  if (q > 0.5) return "📉 Uneven";
  return "🚨 Mismatch";
}

/* ---------- MATCH ---------- */

function simulateMatch() {
  if (players.length < 2) return;

  const [p1, p2] = shuffle([...players]).slice(0, 2);

  const r1Before = p1.rating;
  const r2Before = p2.rating;

  const p1Expected = expectedScore(r1Before, r2Before);
  const winner = Math.random() < p1Expected ? p1 : p2;
  const loser = winner === p1 ? p2 : p1;

  const winnerExpected = expectedScore(winner.rating, loser.rating);
  const loserExpected = expectedScore(loser.rating, winner.rating);

  winner.rating += K * (1 - winnerExpected);
  loser.rating += K * (0 - loserExpected);

  winner.eloHistory.push({ season, rating: winner.rating });
  loser.eloHistory.push({ season, rating: loser.rating });

  recordWin(winner, loser);

  const quality = calculateMatchQuality(r1Before, r2Before);

  currentSeason().matches.push({
    season,
    winner: winner.name,
    loser: loser.name,
    ratingBefore: {
      [p1.name]: r1Before,
      [p2.name]: r2Before,
    },
    ratingAfter: {
      [p1.name]: p1.rating,
      [p2.name]: p2.rating,
    },
    quality,
    timestamp: Date.now(),
  });

  render();
}

function nextSeason() {
  seasonHistory.push({
    season,
    records: players.map((p) => ({
      name: p.name,
      wins: p.seasonWins,
      losses: p.seasonLosses,
      rating: p.rating.toFixed(1),
    })),
    matches: [...currentSeason().matches],
  });

  season++;

  players.forEach((p) => {
    p.seasonWins = 0;
    p.seasonLosses = 0;
  });

  render();
}

function currentSeason() {
  let s = seasonHistory.find((s) => s.season === season);
  if (!s) {
    s = { season, matches: [] };
    seasonHistory.push(s);
  }
  return s;
}

/* ---------- RENDER ---------- */

function render() {
  const hash = location.hash || "#league";
  if (hash.startsWith("#player/")) {
    renderProfile(decodeURIComponent(hash.split("/")[1]));
  } else {
    renderLeague();
  }
}

function renderLeague() {
  app.innerHTML = `
    <h1>🎾 SPIN v0.17</h1>

    <section>
      <input id="playerInput" placeholder="Add player name" />
      <button id="addPlayerBtn">Add Player</button>
    </section>

    <section>
      <button onclick="simulateMatch()">Simulate Match</button>
      <button onclick="nextSeason()">Next Season</button>
      <div class="muted">Season ${season} · Persistent MMR</div>
    </section>

    <section>
      <h2>Standings</h2>
      <table>
        <tr>
          <th>Player</th>
          <th>MMR</th>
          <th>Season W-L</th>
          <th>Career W-L</th>
        </tr>
        ${players
          .sort((a, b) => b.rating - a.rating)
          .map(
            (p) => `
          <tr>
            <td><a href="#player/${encodeURIComponent(p.name)}">${p.name}</a></td>
            <td>${p.rating.toFixed(1)}</td>
            <td>${p.seasonWins}-${p.seasonLosses}</td>
            <td>${p.careerWins}-${p.careerLosses}</td>
          </tr>
        `,
          )
          .join("")}
      </table>
    </section>
  `;

  const input = document.getElementById("playerInput");
  const btn = document.getElementById("addPlayerBtn");

  function submit() {
    if (!input.value.trim()) return;
    addPlayer(input.value.trim());
    input.value = "";
    render();
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submit();
  });
  btn.addEventListener("click", submit);
}

/* ---------- PROFILE ---------- */

function renderProfile(name) {
  const player = players.find((p) => p.name === name);
  if (!player) return (location.hash = "#league");

  const seasons = [...new Set(player.eloHistory.map((h) => h.season))].sort(
    (a, b) => a - b,
  );

  app.innerHTML = `
    <button onclick="location.hash='#league'">← Back</button>
    <h1>${player.name}</h1>

    <div style="height:300px;">
      <canvas id="eloChart"></canvas>
    </div>

    <h3>Match History</h3>
    <ul>
      ${
        seasonHistory
          .flatMap((s) => s.matches || [])
          .filter((m) => m.winner === name || m.loser === name)
          .map(
            (m) => `
        <li>
          Season ${m.season}:
          ${m.winner === name ? "Won vs" : "Lost to"}
          ${m.winner === name ? m.loser : m.winner}
          • ${qualityLabel(m.quality)} (${(m.quality * 100).toFixed(0)}%)
        </li>
      `,
          )
          .join("") || "<li>No matches</li>"
      }
    </ul>
  `;

  renderEloChart(player, seasons);
}

/* ---------- CHART ---------- */

function renderEloChart(player, seasons) {
  const ctx = document.getElementById("eloChart").getContext("2d");

  const datasets = seasons.map((s, i) => {
    const seasonData = player.eloHistory.filter((h) => h.season === s);
    return {
      label: `Season ${s}`,
      data: seasonData.map((h) => h.rating),
      borderWidth: 2,
      tension: 0.3,
    };
  });

  new Chart(ctx, {
    type: "line",
    data: {
      labels: player.eloHistory.map((_, i) => `Match ${i}`),
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true } },
      scales: { y: { beginAtZero: false } },
    },
  });
}

/* ---------- UTIL ---------- */

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
