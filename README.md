# Rock Paper Scissors

A multiplayer rock paper scissors game utilizing firebase
Deployed: benoctopus.github.io/rock-paper-scissors

## Instructions

Game is playable by two players over the internet. both players must choose a username. After both players have chosen, they will autimaticly be taken to the game screen.

Ingame players must choose a symbol by clicking on it's icon (rock, paper, scissors) and then wait for the opposing player to choose. once both players have chosen, their choices will be evaluated and a winner will be chosen. this cycle repeats until one player has accrued three wins. After completion, the winner will be displayed and the app will reset after three seconds.

note: this app uses local storage to keep track of local players. if you wish to test the multiplayer functionality by yourself on one machine you may need to use two seperate web browsers.

##Dependencies
This project uses extensively:

- Bootstrap4
- Jquery3
- Firebase-database

Internet not included

## attributions

icons liscensed under creative commons:

    from thenounproject.com:
    - rock by Studio Fibonacci from the Noun Project
    - Paper by Studio Fibonacci from the Noun Project
    - Scissors by Studio Fibonacci from the Noun Project
    
## Known issues

- The "Spectate" function is not yet operational.
- section elements will reload occasionally for no reason.