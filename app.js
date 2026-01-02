// Initial player ratings
let players = {
  A: 1500,
  B: 1500,
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

// Function to update leaderboard
function updateLeaderboard() {
  leaderboard.innerHTML = "";
  Object.entries(players)
    .sort((a, b) => b[1] - a[1]) // sort descending by rating
    .forEach(([player, rating]) => {
      const li = document.createElement("li");
      li.textContent = `Player ${player}: ${rating.toFixed(2)}`;
      leaderboard.appendChild(li);
    });
}

// Event listener for button
calculateBtn.addEventListener("click", () => {
  const winner = winnerSelect.value;

  // Determine score: 1 for win, 0 for loss
  const scoreA = winner === "A" ? 1 : 0;
  const scoreB = winner === "B" ? 1 : 0;

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
