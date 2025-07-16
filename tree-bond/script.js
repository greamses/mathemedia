let currentNumber = 10;
let currentProblems = [];
let totalQuestions = 0;
let correctAnswers = 0;

document.addEventListener('DOMContentLoaded', function() {
  document.querySelector('[data-number="10"]').classList.add('active');
  generateNewProblems();
});

document.querySelectorAll('.number-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.number-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    
    currentNumber = parseInt(this.dataset.number);
    generateNewProblems();
  });
});

function generateNewProblems() {
  const container = document.getElementById('problemsContainer');
  container.innerHTML = '';
  currentProblems = [];
  
  const numProblems = 3;
  const usedPairs = new Set();
  
  for (let i = 0; i < numProblems; i++) {
    let part1, part2;
    let pairKey;
  
    do {
      if (currentNumber === 10 || currentNumber === 20) {
        part1 = Math.floor(Math.random() * (currentNumber - 1))+1;
      } else {
        part1 = (Math.floor(Math.random() * (currentNumber / 10 - 1)) * 10) + 10;
      }
      part2 = currentNumber - part1;
      pairKey = Math.min(part1, part2) + '-' + Math.max(part1, part2);
    } while (usedPairs.has(pairKey));
    
    usedPairs.add(pairKey);
    
    const hideIndex = Math.floor(Math.random() * 2);
    
    const problem = {
      part1: part1,
      part2: part2,
      hideIndex: hideIndex
    };
    
    currentProblems.push(problem);
    
    // Create the tree visualization
    const treeDiv = document.createElement('div');
    treeDiv.className = 'tree-container';
    
    treeDiv.innerHTML = `
                    <div class="tree-top">
                        <div class="target-number">${currentNumber}</div>
                    </div>
                    <div class="tree-trunk"></div>
                    <div class="tree-branches">
                        <div class="branch branch-left">
                            <div class="branch-line"></div>
                            <div class="leaf leaf-left">
                                ${hideIndex === 0 ? 
                                    `<input type="number" class="part-input" data-answer="${part1}" data-problem="${i}">` : 
                                    `<div class="leaf-part">${part1}</div>`
                                }
                            </div>
                        </div>
                        <div class="branch branch-right">
                            <div class="branch-line"></div>
                            <div class="leaf">
                                ${hideIndex === 1 ? 
                                    `<input type="number" class="part-input" data-answer="${part2}" data-problem="${i}">` : 
                                    `<div class="leaf-part">${part2}</div>`
                                }
                            </div>
                        </div>
                    </div>
                `;
    
    container.appendChild(treeDiv);
  }
  
  // Add input event listeners
  document.querySelectorAll('.part-input').forEach(input => {
    input.addEventListener('input', function() {
      this.classList.remove('correct', 'incorrect');
    });
    
    // For larger numbers, make the input wider
    if (currentNumber >= 100) {
      input.style.width = '90px';
      input.style.height = '90px';
      input.style.fontSize = '32px';
    }
  });
  
  // Clear feedback
  document.getElementById('feedback').textContent = '';
  document.getElementById('feedback').className = 'feedback';
}

function checkAnswers() {
  const inputs = document.querySelectorAll('.part-input');
  let allCorrect = true;
  let answeredCount = 0;
  
  inputs.forEach(input => {
    const userAnswer = parseInt(input.value);
    const correctAnswer = parseInt(input.dataset.answer);
    
    if (input.value.trim() === '') {
      return;
    }
    
    answeredCount++;
    
    if (userAnswer === correctAnswer) {
      input.classList.remove('incorrect');
      input.classList.add('correct');
    } else {
      input.classList.remove('correct');
      input.classList.add('incorrect');
      allCorrect = false;
    }
  });
  
  if (answeredCount > 0) {
    const feedback = document.getElementById('feedback');
    if (allCorrect && answeredCount === inputs.length) {
      feedback.innerHTML = '<span class="star">⭐</span> Great job! You found all the number bonds! <span class="star">⭐</span>';
      feedback.className = 'feedback correct';
      correctAnswers++;
    } else if (allCorrect && answeredCount < inputs.length) {
      feedback.innerHTML = '👍 Nice work! Keep going with the other branches!';
      feedback.className = 'feedback correct';
    } else {
      feedback.innerHTML = '🍃 Almost there! Check your number bonds again!';
      feedback.className = 'feedback incorrect';
    }
    
    if (answeredCount === inputs.length) {
      totalQuestions++;
      updateScore();
    }
  }
}

function updateScore() {
  const scoreDisplay = document.getElementById('scoreDisplay');
  scoreDisplay.textContent = `⭐ Score: ${correctAnswers} / ${totalQuestions} ⭐`;
}

// Allow Enter key to check answers
document.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    checkAnswers();
  }
});