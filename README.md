# Typing Game Overview
If you take this game too seriously, you need to touch some grass, I'm looking at you Andre. https://benjaminmalachi.github.io/

## Instructions
Click start and start typing the words that come onto the screen. Literally just that, there is nothing else, words get longer the longer you survive, words spawn in from more directions the longer you survive. Good luck.

## Technologies Used
1. HTML, CSS were used for the design of the website
2. Javascript was used to run the game mechanics

## Considerations
1. Words will spawn in from the left right top and bottom of the screen depending on stage
2. The spawn rate of the words will increase with the speed
3. upon pausing the game it will save the states of all words on the screen and when resuming the game, call back the state of each object (word)
4. When word is actively typed, light up
5. when the word is correctly typed it disappears from the screen
6. when 2 words of the same start is typed both words light up until the difference in letter e.g. applying | application

## Challenges
1. Finding out the right speed for the word to move across the screen was a nightmare
2. Figuring out how to pause the game was a nightmare, having to save the instance of the game state upon pausing it and calling it once the game had resumed.
3. Using stages to change the game logic conditions, i.e. spawn rate, and length of words spawned.

## Lessons Learnt
1. Functions galore the more the merrier.
