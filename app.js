/* =====================================================
   SPIN v0.17.1
   - Match Quality Score
   - Seasonal graph overlays
   - Restored Season Selector
   - Restored Head-to-Head
   - Click graph line to select season
===================================================== */

let season = 1;
let players = [];
let seasonHistory = [];

const K = 32;
const BASE_MMR = 1500;
const app = document.getElementById("app");

/* ---------- TIERS (v0.20) ---------- */

function getTier(rating) {
  if (rating >= 2000) return "💎 Diamond";
  if (rating >= 1800) return "🔥 Platinum";
  if (rating >= 1650) return "🥇 Gold";
  if (rating >= 1500) return "🥈 Silver";
  if (rating >= 1350) return "🥉 Bronze";
  return "🪨 Rookie";
}

window.addEventListener("hashchange", render);
window.addEventListener("load", render);

/* ---------- PLAYER ---------- */

function createPlayer(name) {
  return {
    name,
    rating: BASE_MMR,
    uncertainty: 350, // NEW
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
  return Math.max(0, 1 - diff / 800);
}

function qualityLabel(q) {
  if (q > 0.9) return "🔥 Elite";
  if (q > 0.75) return "⚖️ Competitive";
  if (q > 0.5) return "📉 Uneven";
  return "🚨 Mismatch";
}

/* ---------- UNCERTAINTY ---------- */

function getEffectiveK(player) {
  const baseK = 32;

  // Scale K based on uncertainty (max at 350)
  return baseK * (player.uncertainty / 350);
}

/* ---------- MATCH ---------- */

function simulateMatch() {
  if (players.length < 2) return;

  const p1 = shuffle([...players])[0];
  const p2 = findBestOpponent(p1);

  if (!p2) return;

  const r1Before = p1.rating;
  const r2Before = p2.rating;

  const p1Expected = expectedScore(r1Before, r2Before);
  const winner = Math.random() < p1Expected ? p1 : p2;
  const loser = winner === p1 ? p2 : p1;

  const winnerK = getEffectiveK(winner);
  const loserK = getEffectiveK(loser);

  // Apply rating updates
  winner.rating += winnerK * (1 - expectedScore(winner.rating, loser.rating));
  loser.rating += loserK * (0 - expectedScore(loser.rating, winner.rating));

  // 🔥 NEW: rating deltas
  const p1Change = p1.rating - r1Before;
  const p2Change = p2.rating - r2Before;

  /* ---------- UNCERTAINTY DECAY ---------- */
  winner.uncertainty = Math.max(60, winner.uncertainty * 0.97);
  loser.uncertainty = Math.max(60, loser.uncertainty * 0.97);

  winner.eloHistory.push({ season, rating: winner.rating });
  loser.eloHistory.push({ season, rating: loser.rating });

  recordWin(winner, loser);

  const quality = calculateMatchQuality(r1Before, r2Before);

  currentSeason().matches.push({
    season,
    winner: winner.name,
    loser: loser.name,
    quality,
    p1: p1.name,
    p2: p2.name,
    p1Change,
    p2Change,
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
    <h1>🎾 SPIN v.0.24</h1>

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
          <th>Tier</th>
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
            <td>${getTier(p.rating)}</td>
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
    const value = input.value.trim();
    if (!value) return;

    addPlayer(value);
    input.value = "";

    render();

    // Re-focus after re-render
    setTimeout(() => {
      const newInput = document.getElementById("playerInput");
      newInput.focus();
    }, 0);
  }

  input.focus();

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submit();
  });

  btn.addEventListener("click", submit);
}

/* ---------- PROFILE ---------- */

function renderProfile(name) {
  const player = players.find((p) => p.name === name);
  if (!player) return (location.hash = "#league");

  const selectedSeason =
    window.selectedSeason !== undefined ? window.selectedSeason : season; // default to current season

  const availableSeasons = [
    ...new Set(
      seasonHistory.flatMap((s) =>
        (s.matches || [])
          .filter((m) => m.winner === name || m.loser === name)
          .map(() => s.season),
      ),
    ),
  ].sort((a, b) => b - a);

  const matches = seasonHistory.flatMap((s) =>
    (s.matches || [])
      .filter((m) => m.winner === name || m.loser === name)
      .map((m) => ({ ...m, season: s.season })),
  );

  const totalMatches = player.careerWins + player.careerLosses;
  const winPct = totalMatches
    ? ((player.careerWins / totalMatches) * 100).toFixed(1)
    : "—";

  app.innerHTML = `
    <button onclick="location.hash='#league'; window.selectedSeason=undefined">← Back</button>

    <h1>${player.name}</h1>

    <div class="profile-header">
      <div class="profile-stats">
        <p><strong>Tier:</strong> ${getTier(player.rating)}</p>
        <p><strong>MMR:</strong> ${player.rating.toFixed(1)}</p>
        <p><strong>Uncertainty:</strong> ±${player.uncertainty.toFixed(0)}</p>
        <p><strong>Career:</strong> ${player.careerWins}-${player.careerLosses}</p>
        <p><strong>Win %:</strong> ${winPct}%</p>
      </div>

      <div class="profile-chart">
        <canvas id="eloChart"></canvas>
      </div>
    </div>

    <div class="profile-section">
      <h3>Head-to-Head</h3>

      <select id="seasonSelect">
  ${availableSeasons
    .map(
      (s) => `
    <option value="${s}" ${selectedSeason === s ? "selected" : ""}>
      Season ${s}
    </option>
  `,
    )
    .join("")}
  <option value="career" ${selectedSeason === "career" ? "selected" : ""}>
    Career
  </option>
</select>


      ${renderHeadToHead(name, selectedSeason)}
    </div>

    <div class="profile-section">
      <h3>Match History</h3>
      <ul>
        ${
          matches
            .filter(
              (m) => selectedSeason === "career" || m.season === selectedSeason,
            )
            .map(
              (m) => `
            <li>
              Season ${m.season}: 
              ${m.winner === name ? "Won vs" : "Lost to"} 
              ${m.winner === name ? m.loser : m.winner}
              ${formatRatingChange(m, name)}
            • ${qualityLabel(m.quality)} (${(m.quality * 100).toFixed(0)}%)
            </li>
          `,
            )
            .join("") || "<li>No matches</li>"
        }
      </ul>
    </div>
  `;

  document.getElementById("seasonSelect").addEventListener("change", (e) => {
    const value = e.target.value;
    window.selectedSeason = value === "career" ? "career" : Number(value);
    renderProfile(name);
  });

  renderEloChart(player, availableSeasons, name);
}

function renderHeadToHead(name, selectedSeason) {
  const h2h = {};

  seasonHistory.forEach((s) => {
    (s.matches || []).forEach((m) => {
      if (m.winner !== name && m.loser !== name) return;
      if (selectedSeason !== "career" && m.season !== selectedSeason) return;

      const opponent = m.winner === name ? m.loser : m.winner;

      if (!h2h[opponent]) {
        h2h[opponent] = { wins: 0, losses: 0 };
      }

      if (m.winner === name) h2h[opponent].wins++;
      else h2h[opponent].losses++;
    });
  });

  const rows = Object.entries(h2h)
    .map(([opponent, record]) => {
      const total = record.wins + record.losses;
      const pct = total ? ((record.wins / total) * 100).toFixed(1) : "—";

      return `
        <tr>
          <td>${opponent}</td>
          <td>${record.wins}-${record.losses}</td>
          <td>${pct}%</td>
        </tr>
      `;
    })
    .join("");

  return `
    <table>
      <tr>
        <th>Opponent</th>
        <th>Record</th>
        <th>Win %</th>
      </tr>
      ${rows || `<tr><td colspan="3">No matches</td></tr>`}
    </table>
  `;
}

/* ---------- CHART ---------- */

function renderEloChart(player, seasons, playerName) {
  const ctx = document.getElementById("eloChart").getContext("2d");

  if (window.eloChartInstance) {
    window.eloChartInstance.destroy();
  }

  const selectedSeason =
    window.selectedSeason !== undefined ? window.selectedSeason : season;

  const palette = [
    "#60a5fa",
    "#f97316",
    "#22c55e",
    "#e11d48",
    "#a855f7",
    "#14b8a6",
  ];

  const datasets = seasons
    .map((s, index) => {
      const seasonData = player.eloHistory.filter((h) => h.season === s);

      const ratings = seasonData.map((h) => h.rating);

      if (!ratings.length) return null;

      const peakValue = Math.max(...ratings);
      const peakIndex = ratings.indexOf(peakValue);

      const baseColor = palette[index % palette.length];

      const isSelected =
        selectedSeason === "career" ? true : s === selectedSeason;

      return {
        label: `Season ${s}`,
        data: ratings,
        borderWidth: isSelected ? 4 : 1.5,
        borderColor: isSelected ? baseColor : baseColor + "55",
        tension: 0.3,
        pointRadius: (ctx) =>
          ctx.dataIndex === peakIndex
            ? isSelected
              ? 7
              : 5
            : isSelected
              ? 3
              : 2,
        pointBackgroundColor: (ctx) =>
          ctx.dataIndex === peakIndex
            ? baseColor
            : isSelected
              ? baseColor
              : baseColor + "55",
        pointBorderWidth: (ctx) => (ctx.dataIndex === peakIndex ? 2 : 0),
        pointBorderColor: "#ffffff",
        order: isSelected ? 0 : 1,
      };
    })
    .filter(Boolean);

  window.eloChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: player.eloHistory.map((_, i) => `Match ${i + 1}`),
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
        tooltip: {
          callbacks: {
            afterLabel: function (context) {
              const dataset = context.dataset;
              const seasonNumber = dataset.label.split(" ")[1];
              const currentValue = context.parsed.y;

              const seasonRatings = dataset.data;
              const peak = Math.max(...seasonRatings);

              if (currentValue === peak) {
                return "🔥 Season Peak";
              }
            },
          },
        },
      },
      onClick: (evt, elements, chart) => {
        if (!elements.length) return;

        const datasetIndex = elements[0].datasetIndex;
        const label = chart.data.datasets[datasetIndex].label;
        const seasonNumber = Number(label.split(" ")[1]);

        window.selectedSeason = seasonNumber;
        renderProfile(playerName);
      },
      scales: {
        y: { beginAtZero: false },
      },
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

function formatRatingChange(match, playerName) {
  let change;

  if (match.p1 === playerName) {
    change = match.p1Change;
  } else if (match.p2 === playerName) {
    change = match.p2Change;
  }

  if (change === undefined) return "";

  const rounded = Math.round(change);
  const sign = rounded > 0 ? "+" : "";

  return ` (${sign}${rounded})`;
}

/* ---------- MATCHMAKING (SPIN) ---------- */

function findBestOpponent(player) {
  let bestOpponent = null;
  let smallestDiff = Infinity;

  players.forEach((p) => {
    if (p === player) return;

    const diff = Math.abs(p.rating - player.rating);

    if (diff < smallestDiff) {
      smallestDiff = diff;
      bestOpponent = p;
    }
  });

  return bestOpponent;
}
