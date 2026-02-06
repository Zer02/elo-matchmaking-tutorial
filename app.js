let season = 1;
let players = [];
let seasonHistory = [];

const K = 32;
const app = document.getElementById("app");

window.addEventListener("hashchange", render);
window.addEventListener("load", render);

function addPlayer(name) {
  players.push({
    name,
    rating: 1500,
    wins: 0,
    losses: 0,
  });
}

function expectedScore(a, b) {
  return 1 / (1 + Math.pow(10, (b - a) / 400));
}

function simulateMatch() {
  if (players.length < 2) return;

  const [p1, p2] = shuffle([...players]).slice(0, 2);
  const winner = Math.random() < expectedScore(p1.rating, p2.rating) ? p1 : p2;
  const loser = winner === p1 ? p2 : p1;

  winner.rating += K * (1 - expectedScore(winner.rating, loser.rating));
  loser.rating += K * (0 - expectedScore(loser.rating, winner.rating));

  winner.wins++;
  loser.losses++;

  currentSeason().matches.push({
    season,
    winner: winner.name,
    loser: loser.name,
  });

  render();
}

function nextSeason() {
  finalizeSeason();
  season++;

  players.forEach((p) => {
    p.wins = 0;
    p.losses = 0;
  });

  render();
}

function finalizeSeason() {
  seasonHistory.push({
    season,
    records: players.map((p) => ({
      name: p.name,
      wins: p.wins,
      losses: p.losses,
      rating: p.rating.toFixed(1),
    })),
    matches: [...currentSeason().matches],
  });
}

function currentSeason() {
  let s = seasonHistory.find((s) => s.season === season);
  if (!s) {
    s = { season, matches: [] };
    seasonHistory.push(s);
  }
  return s;
}

/* ---------- RENDERING ---------- */

function render() {
  const hash = location.hash || "#league";

  if (hash.startsWith("#player/")) {
    renderPlayerProfile(decodeURIComponent(hash.split("/")[1]));
  } else {
    renderLeague();
  }
}

function renderLeague() {
  app.innerHTML = `
    <h1>🎾 SPIN League – v0.14</h1>

    <section>
      <h2>Add Player</h2>
      <input id="playerInput" placeholder="Player name" />
      <button onclick="handleAdd()">Add</button>
    </section>

    <section>
      <h2>League Controls</h2>
      <button onclick="simulateMatch()">Simulate Match</button>
      <button onclick="nextSeason()">Next Season</button>
      <div class="muted">Season ${season} · MMR persists</div>
    </section>

    <section>
      <h2>Standings</h2>
      <table>
        <tr><th>Player</th><th>MMR</th><th>W</th><th>L</th></tr>
        ${players
          .sort((a, b) => b.rating - a.rating)
          .map(
            (p) => `
            <tr>
              <td><a href="#player/${encodeURIComponent(p.name)}">${p.name}</a></td>
              <td>${p.rating.toFixed(1)}</td>
              <td>${p.wins}</td>
              <td>${p.losses}</td>
            </tr>
          `,
          )
          .join("")}
      </table>
    </section>
  `;

  document.getElementById("playerInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleAdd();
  });
}

function handleAdd() {
  const input = document.getElementById("playerInput");
  if (!input.value.trim()) return;
  addPlayer(input.value.trim());
  input.value = "";
  render();
}

function renderPlayerProfile(name) {
  const player = players.find((p) => p.name === name);
  if (!player) {
    location.hash = "#league";
    return;
  }

  const matches = seasonHistory.flatMap((s) =>
    (s.matches || [])
      .filter((m) => m.winner === name || m.loser === name)
      .map((m) => ({ ...m, season: s.season })),
  );

  app.innerHTML = `
    <button onclick="location.hash='#league'">← Back to League</button>

    <h1>${player.name}</h1>
    <p><strong>Current MMR:</strong> ${player.rating.toFixed(1)}</p>

    <section>
      <h2>Match History</h2>
      <ul>
        ${
          matches
            .map(
              (m) => `
          <li>
            Season ${m.season}: 
            ${m.winner === name ? "Won vs" : "Lost to"} 
            ${m.winner === name ? m.loser : m.winner}
          </li>
        `,
            )
            .join("") || "<li>No matches yet</li>"
        }
      </ul>
    </section>
  `;
}

/* ---------- UTIL ---------- */

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
