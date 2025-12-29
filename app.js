// Elo calculation function
function calculateElo(playerRating, opponentRating, score, k = 32) {
  // Expected score for player
  const expectedScore =
    1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  // New rating
  const newRating = playerRating + k * (score - expectedScore);
  return newRating;
}

// DOM elements
const playerAInput = document.getElementById("playerA");
const playerBInput = document.getElementById("playerB");
const winnerSelect = document.getElementById("winner");
const calculateBtn = document.getElementById("calculate");
const resultsDiv = document.getElementById("results");

// Event listener for button
calculateBtn.addEventListener("click", () => {
  let ratingA = parseFloat(playerAInput.value);
  let ratingB = parseFloat(playerBInput.value);
  const winner = winnerSelect.value;

  // Determine score: 1 for win, 0 for loss
  const scoreA = winner === "A" ? 1 : 0;
  const scoreB = winner === "B" ? 1 : 0;

  // Calculate new ratings
  const newRatingA = calculateElo(ratingA, ratingB, scoreA);
  const newRatingB = calculateElo(ratingB, ratingA, scoreB);

  // Show results
  resultsDiv.innerHTML = `
    <p>New Player A Rating: <strong>${newRatingA.toFixed(2)}</strong></p>
    <p>New Player B Rating: <strong>${newRatingB.toFixed(2)}</strong></p>
  `;
});
