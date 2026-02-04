let season = 1;
let players = [];
let matches = [];

const K = 32;

function addPlayer() {
  const name = document.getElementById("playerName").value.trim();
  if (!name) return;

  players.push({
    name,
    rating: 1500,
    wins: 0,
    losses: 0
  });

  document.getElementById("playerName").value = "";
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

  matches.push({
    season,
    winner: winner.name,
    loser: loser.name
  });

  render();
}

function nextSeason() {
  season++;
  players.forEach(p => {
    p.wins = 0;
    p.losses = 0;
  });
  render();
}

function render() {
  document.getElementById("seasonNumber").textContent = season;

  renderStandings();
  renderSeasonRecords();
  renderMatchHistory();
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

function renderSeasonRecords() {
  const table = document.getElementById("seasonRecords");
  table.innerHTML = `
    <tr>
      <th>Player</th>
      <th>Wins</th>
      <th>Losses</th>
    </tr>
  `;

  players.forEach(p => {
    table.innerHTML += `
      <tr>
        <td>${p.name}</td>
        <td>${p.wins}</td>
        <td>${p.losses}</td>
      </tr>
    `;
  });
}

function renderMatchHistory() {
  const list = document.getElementById("matchHistory");
  list.innerHTML = "";

  matches
    .filter(m => m.season === season)
    .forEach(m => {
      const li = document.createElement("li");
      li.textContent = `${m.winner} beat ${m.loser}`;
      list.appendChild(li);
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
