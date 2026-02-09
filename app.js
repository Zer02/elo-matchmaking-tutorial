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
    careerLosses: 0
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
  const winner = Math.random() < expectedScore(p1.rating, p2.rating) ? p1 : p2;
  const loser = winner === p1 ? p2 : p1;

  winner.rating += K * (1 - expectedScore(winner.rating, loser.rating));
  loser.rating += K * (0 - expectedScore(loser.rating, winner.rating));

  recordWin(winner, loser);

  currentSeason().matches.push({
    season,
    winner: winner.name,
    loser: loser.name
  });

  render();
}

function nextSeason() {
  seasonHistory.push({
    season,
    records: players.map(p => ({
      name: p.name,
      wins: p.seasonWins,
      losses: p.seasonLosses,
      rating: p.rating.toFixed(1)
    })),
    matches: [...currentSeason().matches]
  });

  season++;
  players.forEach(p => {
    p.seasonWins = 0;
    p.seasonLosses = 0;
  });

  render();
}

function currentSeason() {
  let s = seasonHistory.find(s => s.season === season);
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
    <h1>🎾 SPIN v0.14.2</h1>

    <section>
      <input id="playerInput" placeholder="Add player and press Enter" />
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
          .map(p => {
            const total = p.careerWins + p.careerLosses;
            const winPct = total ? ((p.careerWins / total) * 100).toFixed(1) : "—";
            return `
              <tr>
                <td><a href="#player/${encodeURIComponent(p.name)}">${p.name}</a></td>
                <td>${p.rating.toFixed(1)}</td>
                <td>${p.seasonWins}-${p.seasonLosses}</td>
                <td>${p.careerWins}-${p.careerLosses}</td>
                <td>${winPct}%</td>
              </tr>
            `;
          }).join("")}
      </table>
    </section>

    <section>
      <h2>Season History</h2>
      ${seasonHistory
        .filter(s => s.records)
        .map(s => `
          <h3>Season ${s.season}</h3>
          <ul>
            ${s.matches.map(m => `<li>${m.winner} beat ${m.loser}</li>`).join("")}
          </ul>
        `).join("")}
    </section>
  `;

  const input = document.getElementById("playerInput");
  input.focus();
  input.addEventListener("keydown", e => {
    if (e.key === "Enter" && input.value.trim()) {
      addPlayer(input.value.trim());
      input.value = "";
      input.focus();
      render();
    }
  });
}

function renderProfile(name) {
  const player = players.find(p => p.name === name);
  if (!player) return location.hash = "#league";

  const totalMatches = player.careerWins + player.careerLosses;
  const winPct = totalMatches
    ? ((player.careerWins / totalMatches) * 100).toFixed(1)
    : "—";

  const matches = seasonHistory.flatMap(s =>
    (s.matches || []).filter(
      m => m.winner === name || m.loser === name
    ).map(m => ({ ...m, season: s.season }))
  );

  app.innerHTML = `
    <button onclick="location.hash='#league'">← Back</button>

    <h1>${player.name}</h1>
    <p><strong>MMR:</strong> ${player.rating.toFixed(1)}</p>
    <p><strong>Career:</strong> ${player.careerWins}-${player.careerLosses} (${winPct}%)</p>

    <section>
      <h2>Match History</h2>
      <ul>
        ${matches.map(m => `
          <li>
            Season ${m.season}: 
            ${m.winner === name ? "Won vs" : "Lost to"} 
            ${m.winner === name ? m.loser : m.winner}
          </li>
        `).join("") || "<li>No matches</li>"}
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
