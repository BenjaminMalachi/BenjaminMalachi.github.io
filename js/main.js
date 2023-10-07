// DOM elements
const canvas = document.getElementById("gameCanvas"); // Canvas where the game will be drawn
const ctx = canvas.getContext("2d"); // Context to draw on the canvas
const healthDisplay = document.getElementById("health"); // Display for player's health
const scoreDisplay = document.getElementById("score"); // Display for player's score
const wpmDisplay = document.getElementById("wpm"); // Display for words per minute
const startButton = document.getElementById("startButton"); // Button to start the game

// Game variables
let gameInterval = null; // Interval for the main game loop
let health = 3; // Player's health
let score = 0; // Player's score
let wpm = 0; // Words per minute
let gamePaused = false; // Is the game paused?
let words = []; // Array containing active words in the game
let currentWord = ""; // The current word being typed
let currentInput = ""; // Player's current input
let spawnRate = 0.5; // Rate at which words are spawned
let stage = "stage1"; // Current stage of the game
let timeElapsed = 0; // Time elapsed since game started
let lastSpawnRateIncreaseTime = 0; // Last time when spawn rate was increased
let spawnInterval; // Interval for spawning words
let spawnRateAdjustInterval; // Interval for adjusting spawn rate
let gameStartTime = Date.now();  // Time when the game was started
let gameActive = false; // Is the game currently active?
let backupWordPositions = []; // Backup for word positions when game is paused
let totalTimeSpentTyping = 0; // Total time taken to type words
let totalWordsTyped = 0; // Track the total number of words typed

// Updates the game screen by drawing words and checking their positions
function updateGameArea() {
  if (gamePaused) return; // If game is paused, don't update
  
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas for fresh drawing
  
  const now = Date.now(); // Get the current time

  // Iterate through each word
  words.forEach((word, index) => {
    const elapsedSeconds = (now - word.spawnTime) / 1000; // Calculate time since word spawned
    
    // Update word's position based on its direction
    if (word.direction === "left") word.x = elapsedSeconds * word.speed;
    else if (word.direction === "right") word.x = canvas.width - elapsedSeconds * word.speed;
    else if (word.direction === "top") word.y = elapsedSeconds * word.speed;
    else if (word.direction === "bottom") word.y = canvas.height - elapsedSeconds * word.speed;
    else word.x = canvas.width - elapsedSeconds * word.speed; // Default direction

    ctx.font = '20px Arial'; // Set font for drawing the word
    
    const correctSubstring = word.text.substring(0, word.input.length); // Substring of word that has been correctly typed
    const remainingSubstring = word.text.substring(word.input.length); // Remaining part of the word
    
    const correctWidth = ctx.measureText(correctSubstring).width; // Width of the correctly typed part
    
    // Draw the word, color matched characters if it's being typed
    if (word.isBeingTyped) {
      ctx.fillStyle = '#00FF00'; // Color for matched characters
      ctx.fillText(correctSubstring, word.x, word.y); 
      
      ctx.fillStyle = '#87CEFA'; // Color for remaining characters
      ctx.fillText(remainingSubstring, word.x + correctWidth, word.y);
    } else {
      ctx.fillStyle = word.color || 'lightgrey'; // Default color if none specified
      ctx.fillText(word.text, word.x, word.y); // Draw the word
    }
    
    // Check if word has moved out of the screen
    const isOffScreenX = word.direction === 'right' ? word.x + ctx.measureText(word.text).width < 0 : word.x > canvas.width;
    const isOffScreenY = word.direction === 'bottom' ? word.y - ctx.measureText(word.text).height < 0 : word.y > canvas.height;
    
    // Handle the word if it has moved out of screen without being typed
    if(isOffScreenX || isOffScreenY) handleWordMiss(index);
  });

  requestAnimationFrame(updateGameArea); // Request the next frame for smooth animations
}

// Initializes or restarts the game
function startGame() {
  // Clear intervals to ensure fresh start
  if (gameInterval) clearInterval(gameInterval);
  if (spawnInterval) clearInterval(spawnInterval);
  if (spawnRateAdjustInterval) clearInterval(spawnRateAdjustInterval);

  // Reset game variables
  health = 3;
  score = 0;
  wpm = 0;
  words = [];
  currentWord = "";
  spawnRate = 0.5;
  stage = "stage1";
  timeElapsed = 0;
  lastSpawnRateIncreaseTime = 0;

  // Set initial displays
  healthDisplay.innerText = "♥♥♥"; // Display initial health
  scoreDisplay.innerText = score; // Display initial score
  wpmDisplay.innerText = wpm; // Display initial WPM

  gamePaused = false; // Ensure game is not paused

  spawnInterval = setInterval(spawnWords, 1000 / spawnRate); // Set interval to spawn words based on spawnRate

  // Adjust the spawn rate periodically
  spawnRateAdjustInterval = setInterval(() => {
    spawnRate += 0.05; // Increment spawn rate
    clearInterval(spawnInterval); // Clear the old spawn interval
    spawnInterval = setInterval(spawnWords, 1000 / spawnRate); // Set new spawn interval based on updated rate
  }, 10000); // Adjust rate every 10 seconds

  gameInterval = setInterval(updateGameArea, 1000 / 144); // Main game loop at 144 FPS

  // Schedule stage transitions
  setTimeout(() => stage = "stage2", 15000); // Transition to stage2 after 15 seconds
  setTimeout(() => stage = "stage3", 30000); // Transition to stage3 after 30 seconds
  setTimeout(() => stage = "stage4", 45000); // Transition to stage4 after 45 seconds
  setTimeout(() => stage = "stage5", 60000); // Transition to stage5 after 60 seconds
}

// End the game
function endGame() {
  // Clear intervals
  clearInterval(gameInterval);
  clearInterval(spawnInterval);
  clearInterval(spawnRateAdjustInterval);

  gamePaused = true; // Set game to paused state

  // Display the final statistics
  document.getElementById('finalScore').innerText = "Final Score: " + score;
  document.getElementById('finalWPM').innerText = "Final WPM: " + Math.floor(wpm);

  showGameOverDialog(); // Display the game over dialog
}

function showGameOverDialog() {
  document.getElementById('pauseDialog').classList.add('hidden'); // Hide the pause content
  document.getElementById('gameOverDialog').classList.remove('hidden'); // Show the Game Over dialog content
}

// Function to display the final score
function displayFinalScore() {
  document.getElementById('dialogTitle').innerText = "Game Over!";
  document.getElementById('finalScore').innerText = "Final Score: " + score;
  document.getElementById('finalWPM').innerText = "Final WPM: " + wpm;
  document.getElementById('finalScore').classList.remove('hidden');
  document.getElementById('finalWPM').classList.remove('hidden');
  document.getElementById('resumeButton').classList.add('hidden'); // Hide the resume button
  showPauseDialog();
}

// Spawn words at intervals
async function spawnWords() {
  if (gamePaused) return; // If game is paused, don't spawn
  
  // Fetch the list of words from the given file
  const wordList = await fetch('en_uk.txt')
    .then(response => response.text())
    .then(data => data.split('\n').map(word => word.trim()))
    .catch(error => {
      console.error('Error reading wordlist:', error);
      return [];
    });

  let wordLength;
  let minWordLength = 2;
  let maxWordLength = 20;

  // Determine word length based on game stage
  switch (stage) {
    case "stage1":
      wordLength = Math.floor(Math.random() * (4 - minWordLength + 1)) + minWordLength; // 2 to 4 characters
      break;
    case "stage2":
      wordLength = Math.floor(Math.random() * (6 - 4 + 1)) + 4; // 4 to 6 characters
      break;
    case "stage3":
      wordLength = Math.floor(Math.random() * (8 - 6 + 1)) + 6; // 6 to 8 characters
      break;
    case "stage4":
      wordLength = Math.floor(Math.random() * (maxWordLength - 8 + 1)) + 8; // 8 to maxWordLength characters
      break;
    case "stage5":
      wordLength = Math.floor(Math.random() * (maxWordLength - minWordLength + 1)) + minWordLength; // Any word length between minWordLength and maxWordLength
      break;
    default:
      console.error('Invalid Stage:', stage);
      return;
  }

  const filteredWords = wordList.filter(word => word.length === wordLength); // Filter the wordlist based on desired word length

  if (filteredWords.length === 0) {
    console.error('No words found with the specified length:', wordLength);
    return;
  }

  // Determine direction based on game stage
  let direction = 'right'; 
  if (stage === "stage2" || stage === "stage3") {
    direction = Math.random() < 0.5 ? "left" : "right";
  } else if (stage === "stage4" || stage === "stage5") {
    direction = ["left", "right", "top", "bottom"][Math.floor(Math.random() * 4)];
  }

  const randomIndex = Math.floor(Math.random() * filteredWords.length); // Pick a random word
  currentWord = filteredWords[randomIndex] || "";

  // Push the new word to the active words array with initial properties
  words.push({
    text: currentWord,
    x: canvas.width,
    y: Math.floor(Math.random() * (canvas.height - 30)) + 15, // Random y-coordinate within canvas
    speed: calculateWordSpeed(currentWord.length), // Set speed based on word length
    color: "lightgrey",
    spawnTime: Date.now(),
    input: "",
    isBeingTyped: false,
    direction: direction,
  });
}

// Calculate speed for the word based on its length
function calculateWordSpeed() {
  const totalTime = 5 * 1000; // Total time for the word to travel across the screen
  const pixelPerSecond = canvas.width / totalTime; // Calculate speed in pixels per second
  return canvas.width / 5; // Return the speed value
}

// Handle key presses while typing
function handleKeyPress(event) {
  if (gamePaused) return; // If game is paused, ignore input
  
  const pressedKey = event.key; // Detect which key was pressed
  
  // Validate the key press (only alphabetic characters)
  if (!/^[a-zA-Z]$/.test(pressedKey)) return;

  checkInput(pressedKey); // Process the key press in the game logic
}

// Process player input against the active words
function checkInput(pressedKey) {
  let isAnyWordBeingTyped = false; // Flag to track if any word is being typed

  words.forEach((word, index) => {
    if (word.text.startsWith(word.input + pressedKey)) { // Check if the key press matches the next character in any word
      word.input += pressedKey;
      word.isBeingTyped = true; // Mark this word as being typed
      isAnyWordBeingTyped = true;
      if (word.input === word.text) handleCorrectWord(index); // If the entire word is typed, handle it
    } else {
      word.isBeingTyped = false; // This word is not being typed
    }
  });

  // Handle incorrect input if no word is being typed
  if (!isAnyWordBeingTyped) handleIncorrectInput();
}

// Handle correctly typed word
function handleCorrectWord(index) {
  const stageNumber = parseInt(stage.replace('stage', '')); // Extract stage number
  score += words[index].input.length * stageNumber; // Increase score based on word length and stage number
  scoreDisplay.innerText = score; // Update score display
  
  currentInput = ""; // Reset current input
  words[index].input = ""; // Reset word's input
  words[index].isBeingTyped = false; // Mark word as not being typed
  
  // Calculate time taken to type the current word and add to totalTimeSpentTyping
  const timeTakenForCurrentWord = Date.now() - words[index].spawnTime;
  totalTimeSpentTyping += timeTakenForCurrentWord;
  
  totalWordsTyped++; // Increment total words typed count
  
  words.splice(index, 1); // Remove the word from the active words

  // Calculate and display WPM
  const minutesSpentTyping = totalTimeSpentTyping / 60000; // Convert milliseconds to minutes
  wpm = totalWordsTyped / minutesSpentTyping;
  wpmDisplay.innerText = Math.floor(wpm);
}

// Reset input if it doesn't match any word
function handleIncorrectInput() {    
  currentInput = "";
}

// Handle when a word exits the screen without being typed
function handleWordMiss(index) {
  if (gamePaused) return; // If game is paused, don't handle

  health--; // Reduce health
  healthDisplay.innerText = "♥".repeat(health); // Update health display
  flashScreenRed(); // Show visual feedback for damage
  
  currentInput = ""; // Reset current input
  
  words.splice(index, 1); // Remove the word from active words
  
  if (health <= 0) endGame(); // End game if health is depleted
}

// Flash the game screen red as a feedback for damage
function flashScreenRed() {
  canvas.style.backgroundColor = 'rgba(255, 0, 0, 0.3)'; // Set to red
  setTimeout(() => {
      canvas.style.backgroundColor = ''; // Reset after a short delay
  }, 200);
}

// Toggle game pause state
function togglePauseGame() {
  gamePaused = !gamePaused; // Toggle pause state

  if (gamePaused) {
      backupWordPositions = words.map(word => ({ x: word.x, y: word.y })); // Backup word positions
      pauseStartTime = Date.now(); // Mark the time when game was paused
      showPauseDialog(); // Display the pause dialog
  } else {
      resumeGame(); // Resume the game
  }
}

// Show the pause dialog
function showPauseDialog() {
  document.getElementById('pauseDialog').classList.remove('hidden'); // Display pause dialog
  document.getElementById('gameOverDialog').classList.add('hidden'); // Hide game over dialog if it's visible
}

// Hide the pause dialog
function hidePauseDialog() {
  document.getElementById('pauseDialog').classList.add('hidden');
}

// Show the game over dialog
function showGameOverDialog() {
  document.getElementById('gameOverDialog').classList.remove('hidden'); // Display game over dialog
  document.getElementById('pauseDialog').classList.add('hidden'); // Hide pause dialog if it's visible

  // Add a click event listener to restart the game from the dialog
  document.getElementById('restartFromDialog').addEventListener('click', function() {
    document.getElementById('gameOverDialog').classList.add('hidden');
    resetGame();
  });
}

// Handle game resume to ensure consistent game state
function resumeGame() {
  const pauseDuration = Date.now() - pauseStartTime; // Calculate pause duration
  words.forEach(word => {
      word.spawnTime += pauseDuration; // Adjust word's spawn time based on pause duration
  });

  // Restore positions of words from the backup
  words.forEach((word, index) => {
      word.x = backupWordPositions[index].x;
      word.y = backupWordPositions[index].y;
  });

  backupWordPositions = []; // Clear the backup

  gamePaused = false; // Set game to running state
  
  hidePauseDialog(); // Hide the pause dialog
  
  updateGameArea(); // Refresh the game area
}

// Reset the game to its initial state
function resetGame() {
  // Clear any active intervals
  clearInterval(gameInterval);
  clearInterval(spawnInterval);
  clearInterval(spawnRateAdjustInterval);

  clearCanvas(); // Clear the game canvas

  // Reset game state variables
  words = [];
  score = 0;
  health = 3;
  stage = 1;

  // Update the UI
  document.getElementById('score').textContent = score;
  document.getElementById('health').textContent = '♥'.repeat(health);

  gamePaused = false; // Ensure game is unpaused
  
  hidePauseDialog(); // Hide pause dialog

  gameStartTime = Date.now(); // Reset the game timer

  startGame(); // Restart the game
}

// Clear the game canvas
function clearCanvas() {
  let canvas = document.getElementById('gameCanvas');
  let ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear entire canvas area
}

// Event listeners to handle various user interactions
startButton.addEventListener("click", startGame);
document.addEventListener("keydown", handleKeyPress);
document.getElementById('startButton').addEventListener('click', function() {
  if (!gameActive) {
      gameActive = true;
      spawnWords();
      updateGameArea();
  }
});
document.addEventListener('keydown', function(event) {
  if (event.key === "Escape") togglePauseGame(); // Pause or unpause the game with 'Escape' key
});
document.getElementById('resumeButtonFromPause').addEventListener('click', function() {
  togglePauseGame(); // Resume the game
});
document.getElementById('resetButtonFromPause').addEventListener('click', function() {
  resetGame();
  hidePauseDialog(); // Hide the pause dialog after resetting
});
document.getElementById('restartFromDialog').addEventListener('click', function() {
  resetGame(); // Restart the game
  hidePauseDialog();
});