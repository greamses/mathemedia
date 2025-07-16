let currentProblem = {};
let selectedTable = null;
let score = 0;
let gameOver = false;
let problemCount = 0;
let isGeneratingProblem = false;

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

const gameWidth = gameContainer.clientWidth;
const gameHeight = gameContainer.clientHeight;

canvas.setAttribute('width', gameWidth);
canvas.setAttribute('height', gameHeight);

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
  backgroundMusic.currentTime = 0;
}

function startGame(table) {
  selectedTable = table;
  startScreen.style.display = 'none';
  generateDivisionProblem(); // Changed to division
  startMusic();
  preloadSounds();
  canvas.setAttribute('height', gameHeight - 70);
}

function handleJump(e) {
  if (e.target.classList.contains('choice')) {
    return;
  }
  if (gameOver) {
    resetGame();
  } else if (selectedTable !== null) {
    bird.velocity = jump;
    jumpSound.currentTime = 0;
    jumpSound.play();
  }
}

function handleChoice(choice) {
  if (gameOver || isGeneratingProblem) return;
  
  disableChoices();
  
  if (choice === currentProblem.answer) {
    score++;
    correctSound.currentTime = 0;
    correctSound.play();
    updateScore();
    
    setTimeout(() => {
      enableChoices();
      generateDivisionProblem();
    }, 800);
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
  problemCount = 0;
  gameOver = false;
  gameOverScreen.style.display = 'none';
  updateScore();
  enableChoices();
  removeHighlight();
  
  // Reset problem generation
  isGeneratingProblem = false;
  generateSubtractionProblem();
  
  startMusic();
}

function createPipe() {
  let gapStart = Math.random() * (canvas.height - pipeGap - 100) + 50;
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

  if (bird.y - bird.radius < 0) {
    bird.y = bird.radius;
    bird.velocity = Math.abs(bird.velocity) * 0.8;
  }

  if (bird.y + bird.radius > canvas.height) {
    endGame();
  }

  pipes.forEach(pipe => {
    pipe.x -= pipeSpeed;

    if (checkCollision(bird, pipe)) {  
      endGame();  
    }  

    if (!pipe.passed && pipe.x + pipeWidth < bird.x) {  
      pipe.passed = true;  
      swooshSound.currentTime = 0;  
      swooshSound.play();
    }
  });

  pipes = pipes.filter(pipe => pipe.x > -pipeWidth);

  if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 300) {
    createPipe();
  }
}

function checkCollision(bird, pipe) {
  if (bird.x + bird.radius > pipe.x && bird.x - bird.radius < pipe.x + pipeWidth) {
    if (bird.y - bird.radius < pipe.topHeight-10) {
      hitSound.play();
      return true;
    }
    if (bird.y + bird.radius > canvas.height - pipe.bottomHeight) {
      hitSound.play();
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
    ctx.save();
    ctx.translate(pipe.x + pipeWidth / 2, pipe.topHeight / 2);
    ctx.rotate(Math.PI);
    ctx.drawImage(pipeImg, -pipeWidth / 2, -pipe.topHeight / 2, pipeWidth, pipe.topHeight);
    ctx.restore();

    ctx.drawImage(pipeImg, pipe.x, canvas.height - pipe.bottomHeight, pipeWidth, pipe.bottomHeight);
  });
}

function updateScore() {
  scoreElement.textContent = `Score: ${score}`;
}

function generateDivisionProblem() {
  if (selectedTable === null || isGeneratingProblem) return;
  
  isGeneratingProblem = true;
  problemCount++;
  
  // Generate valid division problem where:
  // dividend ÷ divisor = selectedTable (quotient)
  const divisor = Math.max(1, Math.floor(Math.random() * 10) + 1); // Random divisor between 1-10
  const dividend = selectedTable * divisor; // Ensure clean division
  
  console.log(`Problem ${problemCount}: ${dividend} ÷ ? = ${selectedTable} (Answer: ${divisor})`);
  
  mathProblemElement.textContent = `${dividend} ÷ ? = ${selectedTable}`;
  currentProblem = { answer: divisor }; // Player needs to select the divisor
  
  // Generate choices (including the correct divisor)
  let choices = [divisor];
  while (choices.length < 4) {
    let wrongChoice;
    // Generate plausible wrong answers
    if (Math.random() > 0.5) {
      // Nearby numbers
      wrongChoice = Math.max(1, divisor + Math.floor(Math.random() * 3) - 1);
    } else {
      // Random number between 1-10
      wrongChoice = Math.max(1, Math.floor(Math.random() * 10) + 1);
    }
    
    if (wrongChoice !== divisor && !choices.includes(wrongChoice)) {
      choices.push(wrongChoice);
    }
  }
  
  // Display choices
  choicesElement.innerHTML = '';
  choices.sort(() => Math.random() - 0.5).forEach((choice, index) => {
    const button = document.createElement('button');
    button.textContent = choice;
    button.classList.add('choice');
    button.onclick = () => handleChoice(choice);
    button.setAttribute('data-number', index + 1);
    choicesElement.appendChild(button);
  });
  
  isGeneratingProblem = false;
}

function handleKeyboardInput(e) {
  if (gameOver) return;

  if (['1', '2', '3', '4'].includes(e.key)) {
    const index = parseInt(e.key) - 1;
    const choices = document.querySelectorAll('.choice');
    if (choices[index]) {
      handleChoice(parseInt(choices[index].textContent));
    }
  } else if (e.key === ' ' || e.key === 'ArrowUp') {
    handleJump(e);
  }
}

function endGame() {
  gameOver = true;
  hitSound.currentTime = 0;
  hitSound.play();
  gameOverScreen.style.display = 'block';
  document.getElementById('finalScore').textContent = `Final Score: ${score}`;
  disableChoices();
  highlightCorrectAnswer();
  stopMusic();
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
  if (!gameOver && selectedTable !== null) {
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
    startGame(parseInt(button.getAttribute('data-table')));
  });
});

updateScore();
gameLoop();
