# Elo Matchmaking 

## ChatGPT Tutorial
### v.0.1
**Can you build a simple JavaScript file (app.js) within an HTML file (index.html) to teach me how the Elo system works?**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Elo System Demo</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    input, button { margin: 5px; padding: 5px; }
    #results { margin-top: 20px; }
  </style>
</head>
<body>
  <h1>Elo Rating Demo</h1>

  <div>
    <label>Player A Rating: <input type="number" id="playerA" value="1500"></label><br>
    <label>Player B Rating: <input type="number" id="playerB" value="1500"></label><br>
    <label>Winner: 
      <select id="winner">
        <option value="A">Player A</option>
        <option value="B">Player B</option>
      </select>
    </label><br>
    <button id="calculate">Calculate New Ratings</button>
  </div>

  <div id="results"></div>

  <script src="app.js"></script>
</body>
</html>
```

```js
// Elo calculation function
function calculateElo(playerRating, opponentRating, score, k = 32) {
  // Expected score for player
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  // New rating
  const newRating = playerRating + k * (score - expectedScore);
  return newRating;
}

// DOM elements
const playerAInput = document.getElementById('playerA');
const playerBInput = document.getElementById('playerB');
const winnerSelect = document.getElementById('winner');
const calculateBtn = document.getElementById('calculate');
const resultsDiv = document.getElementById('results');

// Event listener for button
calculateBtn.addEventListener('click', () => {
  let ratingA = parseFloat(playerAInput.value);
  let ratingB = parseFloat(playerBInput.value);
  const winner = winnerSelect.value;

  // Determine score: 1 for win, 0 for loss
  const scoreA = winner === 'A' ? 1 : 0;
  const scoreB = winner === 'B' ? 1 : 0;

  // Calculate new ratings
  const newRatingA = calculateElo(ratingA, ratingB, scoreA);
  const newRatingB = calculateElo(ratingB, ratingA, scoreB);

  // Show results
  resultsDiv.innerHTML = `
    <p>New Player A Rating: <strong>${newRatingA.toFixed(2)}</strong></p>
    <p>New Player B Rating: <strong>${newRatingB.toFixed(2)}</strong></p>
  `;
});
```

<img width="917" height="605" alt="elo-mmr" src="img/elo-mmr.png" />


### v.0.2
**Can you update the code so it can keep simulating the rankings for each player for every time I press the button?**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Elo System Demo</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    input, button, select { margin: 5px; padding: 5px; }
    #results { margin-top: 20px; }
  </style>
</head>
<body>
  <h1>Elo Rating Simulation</h1>

  <div>
    <label>Player A Rating: <input type="number" id="playerA" value="1500"></label><br>
    <label>Player B Rating: <input type="number" id="playerB" value="1500"></label><br>
    <label>Winner: 
      <select id="winner">
        <option value="A">Player A</option>
        <option value="B">Player B</option>
      </select>
    </label><br>
    <button id="calculate">Simulate Match</button>
  </div>

  <div id="results">
    <h2>Leaderboard</h2>
    <ul id="leaderboard"></ul>
  </div>

  <script src="app.js"></script>
</body>
</html>
```

```js
// Initial player ratings
let players = {
  A: 1500,
  B: 1500
};

// Elo calculation function
function calculateElo(playerRating, opponentRating, score, k = 32) {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  return playerRating + k * (score - expectedScore);
}

// DOM elements
const playerAInput = document.getElementById('playerA');
const playerBInput = document.getElementById('playerB');
const winnerSelect = document.getElementById('winner');
const calculateBtn = document.getElementById('calculate');
const leaderboard = document.getElementById('leaderboard');

// Function to update leaderboard
function updateLeaderboard() {
  leaderboard.innerHTML = '';
  Object.entries(players)
    .sort((a, b) => b[1] - a[1]) // sort descending by rating
    .forEach(([player, rating]) => {
      const li = document.createElement('li');
      li.textContent = `Player ${player}: ${rating.toFixed(2)}`;
      leaderboard.appendChild(li);
    });
}

// Event listener for button
calculateBtn.addEventListener('click', () => {
  const winner = winnerSelect.value;

  // Determine score: 1 for win, 0 for loss
  const scoreA = winner === 'A' ? 1 : 0;
  const scoreB = winner === 'B' ? 1 : 0;

  // Calculate new ratings and update players object
  const newRatingA = calculateElo(players.A, players.B, scoreA);
  const newRatingB = calculateElo(players.B, players.A, scoreB);

  players.A = newRatingA;
  players.B = newRatingB;

  // Update input fields to show current ratings
  playerAInput.value = players.A.toFixed(2);
  playerBInput.value = players.B.toFixed(2);

  // Update leaderboard
  updateLeaderboard();
});

// Initialize leaderboard
updateLeaderboard();
```
✅ What’s new

Persistent ratings:

Player ratings are stored in the players object.

Each button click updates the ratings cumulatively.

Leaderboard:

Always sorts by rating and displays current standings.

Input fields update:

The input fields now reflect the latest ratings, so you can track progress visually.


### v.0.3 
**Can you keep a tally of their wins and losses in a h2h (head to head)?**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Elo System Demo</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    input, button, select { margin: 5px; padding: 5px; }
    #results { margin-top: 20px; }
  </style>
</head>
<body>
  <h1>Elo Rating Simulation</h1>

  <div>
    <label>Player A Rating: <input type="number" id="playerA" value="1500"></label><br>
    <label>Player B Rating: <input type="number" id="playerB" value="1500"></label><br>
    <label>Winner: 
      <select id="winner">
        <option value="A">Player A</option>
        <option value="B">Player B</option>
      </select>
    </label><br>
    <button id="calculate">Simulate Match</button>
  </div>

  <div id="results">
    <h2>Leaderboard</h2>
    <ul id="leaderboard"></ul>

    <h2>Head-to-Head (H2H)</h2>
    <ul id="h2h"></ul>
  </div>

  <script src="app.js"></script>
</body>
</html>
```

```js
// Initial player ratings and head-to-head stats
let players = {
  A: { rating: 1500, wins: 0, losses: 0 },
  B: { rating: 1500, wins: 0, losses: 0 }
};

// Elo calculation function
function calculateElo(playerRating, opponentRating, score, k = 32) {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  return playerRating + k * (score - expectedScore);
}

// DOM elements
const playerAInput = document.getElementById('playerA');
const playerBInput = document.getElementById('playerB');
const winnerSelect = document.getElementById('winner');
const calculateBtn = document.getElementById('calculate');
const leaderboard = document.getElementById('leaderboard');
const h2hList = document.getElementById('h2h');

// Function to update leaderboard
function updateLeaderboard() {
  leaderboard.innerHTML = '';
  Object.entries(players)
    .sort((a, b) => b[1].rating - a[1].rating) // sort descending by rating
    .forEach(([player, stats]) => {
      const li = document.createElement('li');
      li.textContent = `Player ${player}: ${stats.rating.toFixed(2)}`;
      leaderboard.appendChild(li);
    });
}

// Function to update H2H stats
function updateH2H() {
  h2hList.innerHTML = '';
  Object.entries(players).forEach(([player, stats]) => {
    const li = document.createElement('li');
    li.textContent = `Player ${player} - Wins: ${stats.wins}, Losses: ${stats.losses}`;
    h2hList.appendChild(li);
  });
}

// Event listener for button
calculateBtn.addEventListener('click', () => {
  const winner = winnerSelect.value;

  // Determine score: 1 for win, 0 for loss
  const scoreA = winner === 'A' ? 1 : 0;
  const scoreB = winner === 'B' ? 1 : 0;

  // Update Elo ratings
  players.A.rating = calculateElo(players.A.rating, players.B.rating, scoreA);
  players.B.rating = calculateElo(players.B.rating, players.A.rating, scoreB);

  // Update H2H stats
  if (winner === 'A') {
    players.A.wins += 1;
    players.B.losses += 1;
  } else {
    players.B.wins += 1;
    players.A.losses += 1;
  }

  // Update input fields to show current ratings
  playerAInput.value = players.A.rating.toFixed(2);
  playerBInput.value = players.B.rating.toFixed(2);

  // Update leaderboard and H2H
  updateLeaderboard();
  updateH2H();
});

// Initialize leaderboard and H2H
updateLeaderboard();
updateH2H();
```
✅ New Features

Persistent Elo ratings – same as before.

H2H stats:

Tracks wins and losses for Player A and Player B.

Updates automatically after each simulated match.

Leaderboard + H2H:

You can now see both the rating leaderboard and the head-to-head record at the same time.

If you want, the next upgrade could be to simulate multiple players, not just A vs B, and track a full league table with Elo rankings and H2H stats.

Do you want me to do that next?

<!-- 
FORMAT START

### v.0.
****
```html

```

```js

```

FORMAT END 
-->