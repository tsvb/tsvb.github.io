// Add event listener to navigation links
document.querySelectorAll('nav a').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    const targetId = link.getAttribute('href').slice(1);
    const targetSection = document.getElementById(targetId);
    targetSection.scrollIntoView({ behavior: 'smooth' });
  });
});
// ... (rest of the JavaScript remains the same)

const puzzlePieces = document.querySelectorAll('.puzzle-piece');
const solvePuzzleButton = document.getElementById('solve-puzzle');
const puzzleSolution = document.getElementById('puzzle-solution');

let puzzleSolved = false;

puzzlePieces.forEach((piece, index) => {
  piece.addEventListener('click', () => {
    if (!puzzleSolved) {
      piece.style.transform = `rotate(${index * 90}deg)`;
      if (index === 3) {
        puzzleSolved = true;
        solvePuzzleButton.disabled = false;
      }
    }
  });
});

solvePuzzleButton.addEventListener('click', () => {
  puzzleSolution.style.display = 'block';
  // Log user interaction data here
  console.log('Puzzle solved!');
  // You can also send the data to a server or analytics tool here
});
