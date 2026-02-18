let season = 1;
let players = [];
let seasonHistory = [];

const K = 32;
const app = document.getElementById("app");

window.addEventListener("hashchange", render);
window.addEventListener("load", render);

/* ---------- PLAYER + STATS ---------- */

function createPlayer(name) {
  return {
    name,
    rating: 1500,
    seasonWins: 0,
    seasonLosses: 0,
    careerWins: 0,
    careerLosses: 0,
    eloHistory: [{ season: 1, rating: 1500 }],
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

/* ---------- MATCH LOGIC ---------- */

function expectedScore(a, b) {
  return 1 / (1 + Math.pow(10, (b - a) / 400));
}

function simulateMatch() {
  if (players.length < 2) return;

  const [p1, p2] = shuffle([...players]).slice(0, 2);
  const p1Expected = expectedScore(p1.rating, p2.rating);
  const winner = Math.random() < p1Expected ? p1 : p2;
  const loser = winner === p1 ? p2 : p1;

  winner.rating += K * (1 - expectedScore(winner.rating, loser.rating));
  loser.rating += K * (0 - expectedScore(loser.rating, winner.rating));

  winner.eloHistory.push({ season, rating: winner.rating });
  loser.eloHistory.push({ season, rating: loser.rating });

  recordWin(winner, loser);

  currentSeason().matches.push({
    season,
    winner: winner.name,
    loser: loser.name,
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
    <h1>🎾 SPIN v0.14.4</h1>

    <section>
      <input id="playerInput" placeholder="Add player name" />
      <button id="addPlayerBtn">Add Player</button>
    </section>

    <section>
      <button onclick="simulateMatch()">Simulate Match</button>
      <button onclick="nextSeason()">Next Season</button>
      <div class="muted">Season ${season} · MMR persists</div>
    </section>

    <section>
      <h2>Standings</h2>
      <table>
        <tr>
          <th>Player</th>
          <th>MMR</th>
          <th>Season W-L</th>
          <th>Career W-L</th>
          <th>Win %</th>
        </tr>
        ${players
          .sort((a, b) => b.rating - a.rating)
          .map((p) => {
            const total = p.careerWins + p.careerLosses;
            const winPct = total
              ? ((p.careerWins / total) * 100).toFixed(1)
              : "—";
            return `
              <tr>
                <td><a href="#player/${encodeURIComponent(p.name)}">${p.name}</a></td>
                <td>${p.rating.toFixed(1)}</td>
                <td>${p.seasonWins}-${p.seasonLosses}</td>
                <td>${p.careerWins}-${p.careerLosses}</td>
                <td>${winPct}%</td>
              </tr>
            `;
          })
          .join("")}
      </table>
    </section>

    <section>
      <h2>Season History</h2>
      ${seasonHistory
        .filter((s) => s.records)
        .map(
          (s) => `
          <h3>Season ${s.season}</h3>
          <ul>
            ${s.matches.map((m) => `<li>${m.winner} beat ${m.loser}</li>`).join("")}
          </ul>
        `,
        )
        .join("")}
    </section>
  `;

  const input = document.getElementById("playerInput");
  const btn = document.getElementById("addPlayerBtn");

  function submit() {
    if (!input.value.trim()) return;
    addPlayer(input.value.trim());
    input.value = "";
    input.focus();
    render();
  }

  input.focus();
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submit();
  });
  btn.addEventListener("click", submit);
}

function calculateHeadToHead(playerName, selectedSeason = "career") {
  const h2h = {};

  seasonHistory.forEach((s) => {
    (s.matches || []).forEach((m) => {
      if (m.winner !== playerName && m.loser !== playerName) return;

      if (selectedSeason !== "career" && m.season !== selectedSeason) return;

      const opponent = m.winner === playerName ? m.loser : m.winner;

      if (!h2h[opponent]) {
        h2h[opponent] = {
          opponent,
          wins: 0,
          losses: 0,
        };
      }

      if (m.winner === playerName) {
        h2h[opponent].wins++;
      } else {
        h2h[opponent].losses++;
      }
    });
  });

  return Object.values(h2h).sort(
    (a, b) => b.wins + b.losses - (a.wins + a.losses),
  );
}

function renderProfile(name) {
  const player = players.find((p) => p.name === name);
  if (!player) return (location.hash = "#league");

  // Reset dropdown to current season if undefined
  const selectedSeason = window.selectedSeason || season;

  // Available seasons where the player has matches
  const availableSeasons = [
    ...new Set(
      seasonHistory.flatMap((s) =>
        (s.matches || [])
          .filter((m) => m.winner === name || m.loser === name)
          .map(() => s.season),
      ),
    ),
  ].sort((a, b) => b - a);

  const h2h = calculateHeadToHead(name, selectedSeason);

  // Matches only for this player
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
    <button onclick="location.hash='#league'; window.selectedSeason=undefined;">← Back</button>

    <h1>${player.name}</h1>

    <div class="profile-header">
      <div class="profile-stats">
        <p><strong>MMR:</strong> ${player.rating.toFixed(1)}</p>
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
        <option value="career" ${selectedSeason === "career" ? "selected" : ""}>Career</option>
      </select>

      ${availableSeasons
        .filter((s) => selectedSeason === "career" || s === selectedSeason)
        .map((s) => {
          const seasonH2H = calculateHeadToHead(
            name,
            selectedSeason === "career" ? s : selectedSeason,
          );
          return `
            <div class="season-h2h">
              <h4>Season ${s}</h4>
              <table>
                <tr>
                  <th>Opponent</th>
                  <th>Record</th>
                  <th>Win %</th>
                </tr>
                ${
                  seasonH2H
                    .map((r) => {
                      const total = r.wins + r.losses;
                      const pct = total
                        ? ((r.wins / total) * 100).toFixed(1)
                        : "—";
                      return `
                    <tr>
                      <td>${r.opponent}</td>
                      <td>${r.wins}-${r.losses}</td>
                      <td>${pct}%</td>
                    </tr>
                  `;
                    })
                    .join("") ||
                  `
                  <tr>
                    <td colspan="3">No matches</td>
                  </tr>
                `
                }
              </table>
            </div>
          `;
        })
        .join("")}
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

  renderEloChart(player);
}

/* ---------- CHART ---------- */

function renderEloChart(player) {
  const ctx = document.getElementById("eloChart").getContext("2d");

  new Chart(ctx, {
    type: "line",
    data: {
      labels: player.eloHistory.map((_, i) => `Match ${i}`),
      datasets: [
        {
          data: player.eloHistory.map((h) => h.rating),
          borderWidth: 2,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
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
