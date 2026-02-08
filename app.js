let season = 1;
let players = [];
let seasonHistory = [];

const K = 32;
const app = document.getElementById("app");

window.addEventListener("hashchange", render);
window.addEventListener("load", render);

/* ---------- CORE ---------- */

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

  season++;
  players.forEach((p) => {
    p.wins = 0;
    p.losses = 0;
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
    <h1>🎾 SPIN v0.14.1</h1>

    <section>
      <input id="playerInput" placeholder="Add player" />
    </section>

    <section>
      <button onclick="simulateMatch()">Simulate Match</button>
      <button onclick="nextSeason()">Next Season</button>
      <div>Season ${season}</div>
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
  input.focus();
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && input.value.trim()) {
      addPlayer(input.value.trim());
      input.value = "";
      input.focus();
      render();
    }
  });
}

function renderProfile(name) {
  const matches = seasonHistory.flatMap((s) =>
    (s.matches || [])
      .filter((m) => m.winner === name || m.loser === name)
      .map((m) => ({ ...m, season: s.season })),
  );

  app.innerHTML = `
    <button onclick="location.hash='#league'">← Back</button>
    <h1>${name}</h1>

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
            .join("") || "<li>No matches</li>"
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
