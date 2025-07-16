let currentProblem = {};
let selectedMaxNumber = null; // Changed from selectedTable to selectedMaxNumber
let score = 0;
let gameOver = false; // Track game over state

// Select DOM elements
const mathProblemElement = document.getElementById('mathProblem');
const gameContainer = document.querySelector('.game-container');
const choicesElement = document.getElementById('choices');
const scoreElement = document.getElementById('score');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOver');
const restartButton = document.getElementById('restartButton');
const canvas = document.getElementById('gameCanvas');
document.addEventListener('keydown', handleKeyboardInput);

const gameWidth = gameContainer.clientWidth
const gameHeight = gameContainer.clientHeight
const startScreenHeight = startScreen.clientHeight

canvas.setAttribute('width', gameWidth)
canvas.setAttribute('height', gameHeight)

const ctx = canvas.getContext('2d');

let bird = {
  x: 50,
  y: 300,
  velocity: 0,
  radius: 25
};
let pipes = [];

const gravity = 0.25;
const jump = -3;
const pipeWidth = 50;
const minPipeHeight = 100;
const maxPipeHeight = 250;
let pipeSpeed = 2;
let pipeGap = 250;

const birdImg = new Image();
birdImg.src = '../images/bird.png';

const pipeImg = new Image();
pipeImg.src = '../images/pipe.png';

const cloudImg = new Image();
cloudImg.src = '../images/cloud.png';

const backgroundImg = new Image();
backgroundImg.src = '../images/background.png';

let clouds = [
  { x: -100, y: 50, width: 120, height: 80, speed: 0.5 },
  { x: -200, y: 150, width: 100, height: 70, speed: 0.3 }
];

// Sound effects
const jumpSound = new Audio('audio/flap.mp3');
const hitSound = new Audio('audio/hit.mp3');
const wrongSound = new Audio('audio/die.mp3');
const correctSound = new Audio('audio/point.mp3');
const swooshSound = new Audio('audio/swoosh.mp3');

document.addEventListener('keydown', handleJump);
document.addEventListener('touchstart', handleJump);
canvas.addEventListener('click', handleJump);
restartButton.addEventListener('click', resetGame);

const backgroundMusic = document.getElementById('backgroundMusic');

function startMusic() {
  backgroundMusic.play();
}

function stopMusic() {
  backgroundMusic.pause();
  backgroundMusic.currentTime = 0; // Reset to the start
}

function startGame(maxNumber) {
  selectedMaxNumber = maxNumber;
  startScreen.style.display = 'none';
  generateSubtractionProblem(); // Changed from generateAdditionProblem
  startMusic();
  preloadSounds();
  canvas.setAttribute('height', gameHeight - 70)
}

function handleJump(e) {
  if (e.target.classList.contains('choice')) {
    return;
  }
  if (gameOver) {
    resetGame();
  } else if (selectedMaxNumber !== null) { // Only jump if maxNumber is selected
    bird.velocity = jump;
    jumpSound.currentTime = 0; // Reset the audio to the start
    jumpSound.play(); // Play the jump sound
  }
}

function handleChoice(choice) {
  if (gameOver) return;
  
  if (choice === currentProblem.answer) {
    score++;
    correctSound.currentTime = 0;
    correctSound.play();
    updateScore();
    generateSubtractionProblem(); // <-- THIS WAS MISSING! Regenerate problem.
  } else {
    wrongSound.currentTime = 0;
    wrongSound.play();
    endGame();
  }
}

function resetGame() {
  bird.y = 300;
  bird.velocity = 0;
  pipes = [];
  score = 0;
  gameOver = false;
  gameOverScreen.style.display = 'none';
  updateScore();
  generateSubtractionProblem(); // Changed from generateAdditionProblem
  enableChoices();
  removeHighlight();
  startMusic();
}

function createPipe() {
  let gapStart = Math.random() * (canvas.height - pipeGap - 100) + 50; // Ensure some space at top and bottom
  pipes.push({
    x: canvas.width,
    topHeight: gapStart,
    bottomHeight: canvas.height - gapStart - pipeGap,
    passed: false
  });
}

function updateGame() {
  bird.velocity += gravity;
  bird.y += bird.velocity;

  // Prevent bird from flying off the top of the screen
  if (bird.y - bird.radius < 0) {
    bird.y = bird.radius;
    bird.velocity = Math.abs(bird.velocity) * 0.8;
  }

  // End game if bird hits the bottom of the canvas
  if (bird.y + bird.radius > canvas.height) {
    endGame();
  }

  // Update pipes
  pipes.forEach(pipe => {
    pipe.x -= pipeSpeed;

    // Improved collision detection  
    if (checkCollision(bird, pipe)) {  
      endGame();  
    }  

    // Mark pipe as passed when bird crosses it  
    if (!pipe.passed && pipe.x + pipeWidth < bird.x) {  
      pipe.passed = true;  
      swooshSound.currentTime = 0;  
      swooshSound.play(); // Play swoosh sound when passing a pipe  
    }
  });

  // Remove pipes that are off-screen
  pipes = pipes.filter(pipe => pipe.x > -pipeWidth);

  // Create new pipe if needed
  if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 300) {
    createPipe();
  }
}

function checkCollision(bird, pipe) {
  // Check if bird is within the x-range of the pipe
  if (bird.x + bird.radius > pipe.x && bird.x - bird.radius < pipe.x + pipeWidth) {
    // Check if bird touches the top pipe
    if (bird.y - bird.radius < pipe.topHeight-10) {
      hitSound.play(); // Play the hit sound
      return true;
    }
    // Check if bird touches the bottom pipe
    if (bird.y + bird.radius > canvas.height - pipe.bottomHeight) {
      hitSound.play(); // Play the hit sound
      return true;
    }
  }
  return false;
}

function drawBird() {
  ctx.drawImage(birdImg, bird.x - bird.radius, bird.y - bird.radius, bird.radius * 2, bird.radius * 2);
}

function drawPipes() {
  pipes.forEach(pipe => {
    // Draw upper pipe
    ctx.save();
    ctx.translate(pipe.x + pipeWidth / 2, pipe.topHeight / 2);
    ctx.rotate(Math.PI);
    ctx.drawImage(pipeImg, -pipeWidth / 2, -pipe.topHeight / 2, pipeWidth, pipe.topHeight);
    ctx.restore();

    // Draw lower pipe  
    ctx.drawImage(pipeImg, pipe.x, canvas.height - pipe.bottomHeight, pipeWidth, pipe.bottomHeight);
  });
}

function updateScore() {
  scoreElement.textContent = `Score: ${score}`;
}

function generateSubtractionProblem() {
  if (selectedTable === null) return;
  
  // Generate a random minuend (number being subtracted from)
  const minuend = Math.floor(Math.random() * 9) + selectedTable + 1; // Ensures minuend > subtrahend
  
  // Sometimes use the table number itself, sometimes a multiple (for variety)
  const useTableDirectly = Math.random() > 0.5;
  const subtrahend = useTableDirectly ?
    selectedTable :
    selectedTable * (Math.floor(Math.random() * 5) + 1); // e.g., 5×1, 5×2, etc.
  
  // Ensure minuend > subtrahend
  if (minuend <= subtrahend) {
    return generateSubtractionProblem(); // Retry if invalid
  }
  
  const correctAnswer = minuend - subtrahend;
  
  // Display as "minuend - ? = subtrahend"
  mathProblemElement.textContent = `${minuend} - ? = ${subtrahend}`;
  currentProblem = { answer: correctAnswer };
  
  // Generate choices (correct answer + 3 wrong ones)
  let choices = [correctAnswer];
  while (choices.length < 4) {
    const offset = Math.floor(Math.random() * 5) - 2; // -2 to +2
    const wrongChoice = correctAnswer + offset;
    if (wrongChoice > 0 && !choices.includes(wrongChoice)) {
      choices.push(wrongChoice);
    }
  }
  
  // Shuffle and display choices
  choicesElement.innerHTML = '';
  choices.sort(() => Math.random() - 0.5).forEach((choice, index) => {
    const button = document.createElement('button');
    button.textContent = choice;
    button.classList.add('choice');
    button.onclick = () => handleChoice(choice);
    button.setAttribute('data-number', index + 1);
    choicesElement.appendChild(button);
  });
}

function handleKeyboardInput(e) {
  if (gameOver) return; // Ignore inputs if game is over

  if (['1', '2', '3', '4'].includes(e.key)) {
    const index = parseInt(e.key) - 1;
    const choices = document.querySelectorAll('.choice');
    if (choices[index]) {
      handleChoice(parseInt(choices[index].textContent));
    }
  } else if (e.key === ' ' || e.key === 'ArrowUp') {
    // Space and Arrow Up for jumping
    handleJump(e);
  }
}

function endGame() {
  gameOver = true;
  hitSound.currentTime = 0;
  hitSound.play(); // Play the hit sound when the game ends due to collision
  gameOverScreen.style.display = 'block';
  document.getElementById('finalScore').textContent = `Final Score: ${score}`;
  disableChoices(); // Disable choice buttons
  highlightCorrectAnswer(); // Highlight the correct answer
  stopMusic(); // Stop music when the game is over
}

function highlightCorrectAnswer() {
  document.querySelectorAll('.choice').forEach(button => {
    if (parseInt(button.textContent) === currentProblem.answer) {
      button.classList.add('correct-answer');
    }
  });
}

function drawClouds() {
  clouds.forEach(cloud => {
    cloud.x += cloud.speed;
    if (cloud.x > canvas.width) {
      cloud.x = -cloud.width;
    }
    ctx.drawImage(cloudImg, cloud.x, cloud.y, cloud.width, cloud.height);
  });
}

function drawGame() {
  ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

  drawClouds();
  drawPipes();
  drawBird();
}

function gameLoop() {
  if (!gameOver && selectedMaxNumber !== null) { // Changed condition to check selectedMaxNumber
    updateGame();
  }
  drawGame();
  requestAnimationFrame(gameLoop);
}

function disableChoices() {
  document.querySelectorAll('.choice').forEach(button => {
    button.disabled = true;
  });
}

function enableChoices() {
  document.querySelectorAll('.choice').forEach(button => {
    button.disabled = false;
  });
}

function removeHighlight() {
  document.querySelectorAll('.choice').forEach(button => {
    button.classList.remove('correct-answer');
  });
}

function preloadSounds() {
  jumpSound.load();
  hitSound.load();
  wrongSound.load();
  correctSound.load();
  swooshSound.load();
}

document.querySelectorAll('.tableChoice').forEach(button => {
  button.addEventListener('click', () => {
    selectedTable = parseInt(button.getAttribute('data-table'));
    startGame();
  });
});

updateScore();
gameLoop();
