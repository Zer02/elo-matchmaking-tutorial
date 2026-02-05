let season = 1;
let players = [];
let seasonHistory = [];

const K = 32;

const input = document.getElementById("playerName");
input.addEventListener("keydown", e => {
  if (e.key === "Enter") addPlayer();
});

function addPlayer() {
  const name = input.value.trim();
  if (!name) return;

  players.push({
    name,
    rating: 1500,
    wins: 0,
    losses: 0
  });

  input.value = "";
  render();
}

function expectedScore(a, b) {
  return 1 / (1 + Math.pow(10, (b - a) / 400));
}

function simulateMatch() {
  if (players.length < 2) return;

  const [p1, p2] = shuffle([...players]).slice(0, 2);

  const e1 = expectedScore(p1.rating, p2.rating);
  const winner = Math.random() < e1 ? p1 : p2;
  const loser = winner === p1 ? p2 : p1;

  winner.rating += K * (1 - expectedScore(winner.rating, loser.rating));
  loser.rating += K * (0 - expectedScore(loser.rating, winner.rating));

  winner.wins++;
  loser.losses++;

  currentSeason().matches.push({
    winner: winner.name,
    loser: loser.name
  });

  render();
}

function nextSeason() {
  finalizeSeason();

  season++;
  players.forEach(p => {
    p.wins = 0;
    p.losses = 0;
  });

  seasonHistory.push({
    season,
    records: [],
    matches: []
  });

  render();
}

function finalizeSeason() {
  seasonHistory.push({
    season,
    records: players.map(p => ({
      name: p.name,
      wins: p.wins,
      losses: p.losses,
      rating: p.rating.toFixed(1)
    })),
    matches: [...currentSeason().matches]
  });
}

function currentSeason() {
  let s = seasonHistory.find(s => s.season === season);
  if (!s) {
    s = { season, records: [], matches: [] };
    seasonHistory.push(s);
  }
  return s;
}

function render() {
  document.getElementById("seasonNumber").textContent = season;
  renderStandings();
  renderSeasonHistory();
}

function renderStandings() {
  const table = document.getElementById("standings");
  table.innerHTML = `
    <tr>
      <th>Player</th>
      <th>MMR</th>
      <th>W</th>
      <th>L</th>
    </tr>
  `;

  [...players]
    .sort((a, b) => b.rating - a.rating)
    .forEach(p => {
      table.innerHTML += `
        <tr>
          <td>${p.name}</td>
          <td>${p.rating.toFixed(1)}</td>
          <td>${p.wins}</td>
          <td>${p.losses}</td>
        </tr>
      `;
    });
}

function renderSeasonHistory() {
  const container = document.getElementById("seasonHistory");
  container.innerHTML = "";

  seasonHistory
    .filter(s => s.records.length > 0)
    .forEach(s => {
      const div = document.createElement("div");
      div.innerHTML = `
        <h3>Season ${s.season}</h3>
        <table>
          <tr>
            <th>Player</th>
            <th>W</th>
            <th>L</th>
            <th>Final MMR</th>
          </tr>
          ${s.records.map(r => `
            <tr>
              <td>${r.name}</td>
              <td>${r.wins}</td>
              <td>${r.losses}</td>
              <td>${r.rating}</td>
            </tr>
          `).join("")}
        </table>
        <strong>Matches</strong>
        <ul>
          ${s.matches.map(m => `<li>${m.winner} beat ${m.loser}</li>`).join("")}
        </ul>
      `;
      container.appendChild(div);
    });
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

render();
