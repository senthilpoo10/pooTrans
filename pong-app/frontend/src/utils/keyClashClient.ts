// import { NavigateFunction } from "react-router-dom";
// import { io } from "socket.io-client";
// import validator from 'validator';

// export default function KeyClashClient(container: HTMLElement, gameId: string, 
//                                         mode: "local" | "remote", type: "1v1" | "tournament",
//                                         navigate: NavigateFunction, name: string | null):() => void {
//   const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
//   const wasdKeys = ['w', 'a', 's', 'd'];

//   const arrowSymbols: Record<string, string> = {
//     ArrowUp: '↑',
//     ArrowDown: '↓',
//     ArrowLeft: '←',
//     ArrowRight: '→'
//   };

//   const wasdSymbols: Record<string, string> = {
//     w: '↑',
//     a: '←',
//     s: '↓',
//     d: '→'
//   };

//   // Query inside the container instead of the whole document
//   const prompt1 = container.querySelector('#prompt1') as HTMLDivElement;
//   const prompt2 = container.querySelector('#prompt2') as HTMLDivElement;
//   const score1El = container.querySelector('#score1') as HTMLDivElement;
//   const score2El = container.querySelector('#score2') as HTMLDivElement;
//   const timerEl = container.querySelector('#timer') as HTMLDivElement;
//   const startPrompt = container.querySelector('#start-prompt') as HTMLDivElement;
//   timerEl.style.whiteSpace = "pre-line";

//   const socket = io("/keyclash", {
//     path: '/socket.io',
//     transports: ['websocket'],
//     secure: true
//   });

//   function onKeyDown(e: KeyboardEvent) {
//     if (e.code === "Space" || e.key === "r")
//       socket.emit("setReady");
//     else if (arrowKeys.includes(e.key) || wasdKeys.includes(e.key))
//       socket.emit("keypress", { key: e.key });
//   }

//   window.addEventListener("keydown", onKeyDown);

//   socket.on('connect', () => {
//     socket.emit('join_game_room', gameId, mode, type, (callback: { error: string }) => {
//       if (callback.error) {
//         alert(callback.error);
//         if (type === "1v1")
//           navigate("/quickmatch");
//         else
//           navigate("/tournament");
//       }
//     });
//   });

//   socket.on("get_names", (existing) => {
//     let players: { player1: string | null,
//       player2: string | null,
//       player3: string | null,
//       player4: string | null
//     }
//     players = { player1: null, player2: null, player3: null, player4: null};
//     if (existing.length >= 1)
//       players.player1 = existing[0].name;
//     if (existing.length >= 2)
//       players.player2 = existing[1].name;
//     if (existing.length >= 3)
//       players.player3 = existing[2].name;
//     if (existing.length >= 4)
//       players.player4 = existing[3].name;         

//     if (!name)
//       players.player1 = getValidatedPlayerName("Enter name for player1:", "Guest", players);
//     else
//       players.player1 = name;
//     if (mode === "local") {
//       players.player2 = getValidatedPlayerName("Enter name for player2:", "Guest", players);
//       if (type === "tournament") {
//         players.player3 = getValidatedPlayerName("Enter name for player3:", "Guest", players);
//         players.player4 = getValidatedPlayerName("Enter name for player4:", "Guest", players);
//       }
//     }
//     socket.emit("names", players);
//   });

//   socket.on("gameStart", (state) => {
//     score1El.textContent = `${state.player1.name}: ${state.player1.score}`;
//     score2El.textContent = `${state.player2.name}: ${state.player2.score}`;
//     if (state.type === "1v1")
//       timerEl.textContent = `Time Left: ${state.timeLeft}s`;
//     else
//       timerEl.textContent = `Round ${state.round}/3\nTime Left: ${state.timeLeft}s`; 
//     prompt1.textContent = wasdSymbols[state.prompts[0]];
//     prompt2.textContent = arrowSymbols[state.prompts[1]];
//     startPrompt.textContent = "Good Luck!";
//   });

//   socket.on("gameState", (state) => {
//     score1El.textContent = `${state.player1.name}: ${state.player1.score}`;
//     score2El.textContent = `${state.player2.name}: ${state.player2.score}`;
//     if (state.status === "in-progress" || state.status === "starting") {
//       if (state.type === "1v1")
//         timerEl.textContent = `Time Left: ${state.timeLeft}s`;
//       else
//         timerEl.textContent = `Round ${state.round}/3\nTime Left: ${state.timeLeft}s`;        
//     }
//     if (state.type === "tournament" && state.status === "starting" && state.round === 1) {
//       timerEl.textContent = `Next up, Round ${state.round}/3:\n${state.matches[0].player1.name} vs ${state.matches[0].player2.name}`;
//       if (state.mode === "local") startPrompt.textContent = "Press SPACE to start the tournament!";
//     }
//     prompt1.textContent = wasdSymbols[state.prompts[0]];
//     prompt2.textContent = arrowSymbols[state.prompts[1]] ;
//     if (((state.players.length === 2 && state.type === "1v1") || 
//         (state.players.length === 4 && state.type === "tournament")) &&
//         state.status === "starting" && state.mode === "remote")
//     {
//       let readyCount = 0;
//       if (state.player1.ready) readyCount++;
//       if (state.player2.ready) readyCount++;
//       startPrompt.textContent = `Ready? Press SPACE (Players ready: ${readyCount}/2)`;
//     }
//   });

//   socket.on("waiting", (state) => {
//     if (state.type === "1v1")
//       startPrompt.textContent = "Waiting for opponent...";
//     else
//       startPrompt.textContent = `Waiting for opponents... (${state.players.length}/4)`;
//   });

//   socket.on("gameOver", (state) => {
//     let p1 = state.player1;
//     let p2 = state.player2;
//     if (state.type === "1v1") {
//       timerEl.textContent = `Time's Up! Final Score ${p1.name}: ${p1.score} | ${p2.name}: ${p2.score}`;
//       startPrompt.textContent = "Press SPACE to Restart";
//     }
//     else if (state.type === "tournament") {
//       const i = state.round - 2;
//       if (state.round <= 3) {
//         timerEl.textContent = `Round ${state.round - 1} over, ${state.matches[i].winner.name} wins!`;        
//         timerEl.textContent += `\nNext up, Round ${state.round}/3:\n${state.matches[i + 1].player1.name} vs ${state.matches[i + 1].player2.name}`;
//         if (mode === "remote") {
//           let readyCount = 0;
//           if (state.player1.ready) readyCount++;
//           if (state.player2.ready) readyCount++;
//           startPrompt.textContent = `Ready? Press SPACE (Players ready: ${readyCount}/2)`;
//         }
//         else
//           startPrompt.textContent = "Press SPACE to start next round";
//       }
//       else {
//         timerEl.textContent = `Tournament finished! The winner is: ${state.matches[i].winner.name}!`;
//         startPrompt.textContent = "Congratulations!";
//       }
//     }
//   });

//   socket.on("correctHit", ({ player }) => {
//     const el = container.querySelector(
//       player === 1 ? ".player:nth-child(1)" : ".player:nth-child(2)"
//     );
//     if (el) {
//       el.classList.add("correct");
//       setTimeout(() => el.classList.remove("correct"), 300);
//     }
//   });

//   socket.on('disconnection', () => {
//     alert("Tournament terminated (someone disconnected)");
//     navigate('/tournament');
//   });

//   // Return cleanup function
//   return () => {
//       window.removeEventListener("keydown", onKeyDown);
//       if (socket) {
//         socket.off();
//         socket.disconnect();
//       }
//   };
// }

// export function getValidatedPlayerName(message: string, placeholder: string, existing: {player1: string | null,
//   player2: string | null,
//   player3: string | null,
//   player4: string | null }) {

//   let name = prompt(message, placeholder);
//   if (!name) {
//     alert("Name can't be empty");
//     return getValidatedPlayerName(message, placeholder, existing);
//   }
//   name = name.trim();
//   if (!validator.isLength(name, {min: 1, max: 13})) {
//     alert("Name must be between 1-10 characters long");
//     return getValidatedPlayerName(message, placeholder, existing);    
//   }
//   if (!validator.isAlphanumeric(name)) {
//     alert("Name must be alphanumeric");
//     return getValidatedPlayerName(message, placeholder, existing);    
//   }
//   if (name === existing.player1 || name === existing.player2 ||
//     name === existing.player3 || name === existing.player3) {
//       alert("That name is already taken");
//       return getValidatedPlayerName(message, placeholder, existing);       
//     }
//   return name;
// }


import { NavigateFunction } from "react-router-dom";
import { io } from "socket.io-client";
import validator from 'validator';
import { saveGameResult, createGameResult, GameResult } from './gameDataManager';

export default function KeyClashClient(
  container: HTMLElement, 
  gameId: string, 
  mode: "local" | "remote", 
  type: "1v1" | "tournament",
  navigate: NavigateFunction, 
  name: string | null,
  gameState?: any // Navigation state from quickmatch
): () => void {
  const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  const wasdKeys = ['w', 'a', 's', 'd'];

  const arrowSymbols: Record<string, string> = {
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→'
  };

  const wasdSymbols: Record<string, string> = {
    w: '↑',
    a: '←',
    s: '↓',
    d: '→'
  };

  // Game state tracking for saving
  let gameStartTime: number = 0;
  let currentPlayer1Score: number = 0;
  let currentPlayer2Score: number = 0;
  let player1Name: string = '';
  let player2Name: string = '';
  let gameRounds: any[] = [];
  let userAvatar: string = '';
  let guestAvatar: string = '';

  // Extract avatar information from navigation state
  if (gameState) {
    userAvatar = gameState.userAvatar?.name || 'default';
    guestAvatar = gameState.guestAvatar?.name || 'default';
    console.log('KeyClash game state received:', gameState);
  }

  // Query inside the container instead of the whole document
  const prompt1 = container.querySelector('#prompt1') as HTMLDivElement;
  const prompt2 = container.querySelector('#prompt2') as HTMLDivElement;
  const score1El = container.querySelector('#score1') as HTMLDivElement;
  const score2El = container.querySelector('#score2') as HTMLDivElement;
  const timerEl = container.querySelector('#timer') as HTMLDivElement;
  const startPrompt = container.querySelector('#start-prompt') as HTMLDivElement;
  timerEl.style.whiteSpace = "pre-line";

  const socket = io("/keyclash", {
    path: '/socket.io',
    transports: ['websocket'],
    secure: true
  });

  function onKeyDown(e: KeyboardEvent) {
    if (e.code === "Space" || e.key === "r")
      socket.emit("setReady");
    else if (arrowKeys.includes(e.key) || wasdKeys.includes(e.key))
      socket.emit("keypress", { key: e.key });
  }

  function parseScoreText(scoreText: string): { name: string, score: number } {
    // Parse text like "Player1: 5"
    const match = scoreText.match(/(.+):\s*(\d+)/);
    if (match) {
      return {
        name: match[1].trim(),
        score: parseInt(match[2])
      };
    }
    return { name: '', score: 0 };
  }

  async function handleGameFinished(state: any) {
    try {
      // Only save for 1v1 games (skip tournaments for now)
      if (type === "tournament") {
        return;
      }

      const gameDuration = Math.floor((performance.now() - gameStartTime) / 1000);

      // Determine winner
      let player1Won = false;
      let player2Won = false;

      if (state.matches && state.matches.length > 0) {
        const winner = state.matches[state.round - 1]?.winner;
        if (winner) {
          player1Won = winner.name === player1Name;
          player2Won = winner.name === player2Name;
        }
      } else {
        // Fallback to score comparison
        player1Won = currentPlayer1Score > currentPlayer2Score;
        player2Won = currentPlayer2Score > currentPlayer1Score;
      }

      const gameResult = createGameResult(
        gameId,
        'keyclash',
        mode,
        player1Name,
        userAvatar,
        currentPlayer1Score,
        player2Name,
        guestAvatar,
        currentPlayer2Score,
        gameDuration,
        gameRounds
      );

      console.log('Saving keyclash game result:', gameResult);
      await saveGameResult(gameResult);
      
      showGameSavedMessage();

    } catch (error) {
      console.error('Failed to save keyclash game result:', error);
      showGameSaveError();
    }
  }

  function showGameSavedMessage() {
    const message = document.createElement('div');
    Object.assign(message.style, {
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'green',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      zIndex: '10000',
      fontSize: '16px'
    });
    message.textContent = '✅ Game saved successfully!';
    document.body.appendChild(message);
    
    setTimeout(() => {
      if (document.body.contains(message)) {
        document.body.removeChild(message);
      }
    }, 3000);
  }

  function showGameSaveError() {
    const message = document.createElement('div');
    Object.assign(message.style, {
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'red',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      zIndex: '10000',
      fontSize: '16px'
    });
    message.textContent = '❌ Failed to save game';
    document.body.appendChild(message);
    
    setTimeout(() => {
      if (document.body.contains(message)) {
        document.body.removeChild(message);
      }
    }, 3000);
  }

  window.addEventListener("keydown", onKeyDown);

  socket.on('connect', () => {
    socket.emit('join_game_room', gameId, mode, type, (callback: { error: string }) => {
      if (callback.error) {
        alert(callback.error);
        if (type === "1v1")
          navigate("/quickmatch");
        else
          navigate("/tournament");
      }
    });
  });

  socket.on("get_names", (existing) => {
    let players: { 
      player1: string | null,
      player2: string | null,
      player3: string | null,
      player4: string | null
    }
    players = { player1: null, player2: null, player3: null, player4: null};
    
    if (existing.length >= 1)
      players.player1 = existing[0].name;
    if (existing.length >= 2)
      players.player2 = existing[1].name;
    if (existing.length >= 3)
      players.player3 = existing[2].name;
    if (existing.length >= 4)
      players.player4 = existing[3].name;         

    if (!name)
      players.player1 = getValidatedPlayerName("Enter name for player1:", "Guest", players);
    else
      players.player1 = name;
    if (mode === "local") {
      players.player2 = getValidatedPlayerName("Enter name for player2:", "Guest", players);
      if (type === "tournament") {
        players.player3 = getValidatedPlayerName("Enter name for player3:", "Guest", players);
        players.player4 = getValidatedPlayerName("Enter name for player4:", "Guest", players);
      }
    }
    socket.emit("names", players);
  });

  socket.on("gameStart", (state) => {
    // Record game start time
    gameStartTime = performance.now();
    
    // Store player names
    player1Name = state.player1.name;
    player2Name = state.player2.name;
    
    score1El.textContent = `${state.player1.name}: ${state.player1.score}`;
    score2El.textContent = `${state.player2.name}: ${state.player2.score}`;
    
    if (state.type === "1v1")
      timerEl.textContent = `Time Left: ${state.timeLeft}s`;
    else
      timerEl.textContent = `Round ${state.round}/3\nTime Left: ${state.timeLeft}s`; 
    
    prompt1.textContent = wasdSymbols[state.prompts[0]];
    prompt2.textContent = arrowSymbols[state.prompts[1]];
    startPrompt.textContent = "Good Luck!";
  });

  socket.on("gameState", (state) => {
    // Update scores
    const player1Data = parseScoreText(`${state.player1.name}: ${state.player1.score}`);
    const player2Data = parseScoreText(`${state.player2.name}: ${state.player2.score}`);
    
    currentPlayer1Score = player1Data.score;
    currentPlayer2Score = player2Data.score;
    
    if (!player1Name) player1Name = player1Data.name;
    if (!player2Name) player2Name = player2Data.name;
    
    score1El.textContent = `${state.player1.name}: ${state.player1.score}`;
    score2El.textContent = `${state.player2.name}: ${state.player2.score}`;
    
    if (state.status === "in-progress" || state.status === "starting") {
      if (state.type === "1v1")
        timerEl.textContent = `Time Left: ${state.timeLeft}s`;
      else
        timerEl.textContent = `Round ${state.round}/3\nTime Left: ${state.timeLeft}s`;        
    }
    
    if (state.type === "tournament" && state.status === "starting" && state.round === 1) {
      timerEl.textContent = `Next up, Round ${state.round}/3:\n${state.matches[0].player1.name} vs ${state.matches[0].player2.name}`;
      if (state.mode === "local") startPrompt.textContent = "Press SPACE to start the tournament!";
    }
    
    prompt1.textContent = wasdSymbols[state.prompts[0]];
    prompt2.textContent = arrowSymbols[state.prompts[1]] ;
    
    if (((state.players.length === 2 && state.type === "1v1") || 
        (state.players.length === 4 && state.type === "tournament")) &&
        state.status === "starting" && state.mode === "remote")
    {
      let readyCount = 0;
      if (state.player1.ready) readyCount++;
      if (state.player2.ready) readyCount++;
      startPrompt.textContent = `Ready? Press SPACE (Players ready: ${readyCount}/2)`;
    }
  });

  socket.on("waiting", (state) => {
    if (state.type === "1v1")
      startPrompt.textContent = "Waiting for opponent...";
    else
      startPrompt.textContent = `Waiting for opponents... (${state.players.length}/4)`;
  });

  socket.on("gameOver", (state) => {
    let p1 = state.player1;
    let p2 = state.player2;
    
    // Handle game finished and save results
    if (state.status === "finished" && gameStartTime > 0) {
      handleGameFinished(state);
    }
    
    if (state.type === "1v1") {
      timerEl.textContent = `Time's Up! Final Score ${p1.name}: ${p1.score} | ${p2.name}: ${p2.score}`;
      startPrompt.textContent = "Press SPACE to Restart";
    }
    else if (state.type === "tournament") {
      const i = state.round - 2;
      if (state.round <= 3) {
        timerEl.textContent = `Round ${state.round - 1} over, ${state.matches[i].winner.name} wins!`;        
        timerEl.textContent += `\nNext up, Round ${state.round}/3:\n${state.matches[i + 1].player1.name} vs ${state.matches[i + 1].player2.name}`;
        if (mode === "remote") {
          let readyCount = 0;
          if (state.player1.ready) readyCount++;
          if (state.player2.ready) readyCount++;
          startPrompt.textContent = `Ready? Press SPACE (Players ready: ${readyCount}/2)`;
        }
        else
          startPrompt.textContent = "Press SPACE to start next round";
      }
      else {
        timerEl.textContent = `Tournament finished! The winner is: ${state.matches[i].winner.name}!`;
        startPrompt.textContent = "Congratulations!";
      }
    }
  });

  socket.on("correctHit", ({ player }) => {
    const el = container.querySelector(
      player === 1 ? ".player:nth-child(1)" : ".player:nth-child(2)"
    );
    if (el) {
      el.classList.add("correct");
      setTimeout(() => el.classList.remove("correct"), 300);
    }
  });

  socket.on('disconnection', () => {
    alert("Tournament terminated (someone disconnected)");
    navigate('/tournament');
  });

  // Return cleanup function
  return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (socket) {
        socket.off();
        socket.disconnect();
      }
  };
}

export function getValidatedPlayerName(
  message: string, 
  placeholder: string, 
  existing: {
    player1: string | null,
    player2: string | null,
    player3: string | null,
    player4: string | null 
  }
) {

  let name = prompt(message, placeholder);
  if (!name) {
    alert("Name can't be empty");
    return getValidatedPlayerName(message, placeholder, existing);
  }
  name = name.trim();
  if (!validator.isLength(name, {min: 1, max: 13})) {
    alert("Name must be between 1-13 characters long");
    return getValidatedPlayerName(message, placeholder, existing);    
  }
  if (!validator.isAlphanumeric(name)) {
    alert("Name must be alphanumeric");
    return getValidatedPlayerName(message, placeholder, existing);    
  }
  if (name === existing.player1 || name === existing.player2 ||
    name === existing.player3 || name === existing.player4) {
      alert("That name is already taken");
      return getValidatedPlayerName(message, placeholder, existing);       
    }
  return name;
}