# Elo Matchmaking 

## ChatGPT Tutorial
### v.0.0.1
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