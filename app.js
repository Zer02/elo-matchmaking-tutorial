// Initial player ratings and head-to-head stats
let players = {
  A: { rating: 1500, wins: 0, losses: 0 },
  B: { rating: 1500, wins: 0, losses: 0 },
};

// Elo calculation function
function calculateElo(playerRating, opponentRating, score, k = 32) {
  const expectedScore =
    1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  return playerRating + k * (score - expectedScore);
}

// DOM elements
const playerAInput = document.getElementById("playerA");
const playerBInput = document.getElementById("playerB");
const winnerSelect = document.getElementById("winner");
const calculateBtn = document.getElementById("calculate");
const leaderboard = document.getElementById("leaderboard");
const h2hList = document.getElementById("h2h");

// Function to update leaderboard
function updateLeaderboard() {
  leaderboard.innerHTML = "";
  Object.entries(players)
    .sort((a, b) => b[1].rating - a[1].rating) // sort descending by rating
    .forEach(([player, stats]) => {
      const li = document.createElement("li");
      li.textContent = `Player ${player}: ${stats.rating.toFixed(2)}`;
      leaderboard.appendChild(li);
    });
}

// Function to update H2H stats
function updateH2H() {
  h2hList.innerHTML = "";
  Object.entries(players).forEach(([player, stats]) => {
    const li = document.createElement("li");
    li.textContent = `Player ${player} - Wins: ${stats.wins}, Losses: ${stats.losses}`;
    h2hList.appendChild(li);
  });
}

// Event listener for button
calculateBtn.addEventListener("click", () => {
  const winner = winnerSelect.value;

  // Determine score: 1 for win, 0 for loss
  const scoreA = winner === "A" ? 1 : 0;
  const scoreB = winner === "B" ? 1 : 0;

  // Update Elo ratings
  players.A.rating = calculateElo(players.A.rating, players.B.rating, scoreA);
  players.B.rating = calculateElo(players.B.rating, players.A.rating, scoreB);

  // Update H2H stats
  if (winner === "A") {
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
