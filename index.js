// ===== TEAM NAMES & EMOJIS =====
const TEAM_NAMES = [
  "Thunder Titans",
  "Phoenix Force",
  "Shadow Wolves",
  "Sky Hawks",
  "Dragon Slayers",
  "Apex Predators",
  "Cosmic Crushers",
  "Storm Breakers",
  "Iron Guardians",
  "Diamond Dynasty",
  "Battle Beasts",
  "Nova Knights",
  "Royal Lions",
  "Meteor Mavericks",
  "Jungle Kings",
  "Frost Giants",
  "Lava Legends",
  "Cyber Spartans",
  "Elite Strikers",
  "Chaos Kings"
];

const TEAM_EMOJIS = ["⚡", "🔥", "🐺", "🦅", "🐉", "🦈", "🚀", "🌪", "🛡", "💎", "🐻", "⭐", "👑", "☄️", "🦁", "❄️", "🌋", "🤖", "🔥", "👾"];

const TEAM_COLORS = ["#3498db", "#e74c3c", "#1abc9c", "#f39c12", "#9b59b6", "#2ecc71", "#e67e22", "#34495e", "#16a085", "#d35400", "#8e44ad", "#27ae60", "#c0392b", "#2980b9", "#f1c40f", "#7f8c8d", "#ff5722", "#795548", "#009688", "#673ab7"];

// ===== AVAILABLE PLAYERS =====
const AVAILABLE_PLAYERS = [
  "Abhishek Arigela",
  "Abhishek Pathak",
  "Akshay Devatha",
  "Anand Arava",
  "Anirudh Govardhanam",
  "Anshul Upadhyay",
  "Anudeepak Nallamothu",
  "Asish Jagana",
  "Chandrakala Bara",
  "Dheeraj Bhumanapalli",
  "Hari Rayavarapu",
  "Harsha Musuku",
  "Jayasri Madabhushi",
  "Jithendra Pakalapati",
  "Karthik Viyyuri",
  "Lavanya Shivanagari",
  "Mahathi Turubhatla",
  "Pavan Anna",
  "Poojitha Yerukala",
  "Raghuram Desireddy",
  "Saiteja Miriyala",
  "Satya Penmetsa",
  "Satyanarayana Kesanakurty",
  "Shubham Baranwal",
  "Sneha Joshi",
  "Sreevalli Bontha",
  "Srilekha Pakalapati",
  "Varun Gonisi",
  "Vasumithra Gorrepati",
  "Vinay Chintapally"
];

// ===== STATE =====
let currentTeams = null;
let lockedPlayers = new Set();
let swapMode = false;
let selectedForSwap = null;
let customPlayers = [];

// ===== STORAGE KEYS =====
const STORAGE_KEY_SELECTED = "teamgen_selected";
const STORAGE_KEY_LOCKED = "teamgen_locked";
const STORAGE_KEY_CUSTOM = "teamgen_custom_players";
const STORAGE_KEY_TEAM_COUNT = "teamgen_team_count";

// ===== DOM ELEMENTS =====
const playersList = document.getElementById("playersList");
const playerCountDisplay = document.getElementById("playerCountDisplay");
const generateBtn = document.getElementById("generateBtn");
const regenerateBtn = document.getElementById("regenerateBtn");
const copyBtn = document.getElementById("copyBtn");
const swapBtn = document.getElementById("swapBtn");
const clearBtn = document.getElementById("clearBtn");
const teamsContainer = document.getElementById("teamsContainer");
const newPlayerInput = document.getElementById("newPlayerInput");
const addPlayerBtn = document.getElementById("addPlayerBtn");
const teamCountInput = document.getElementById("teamCountInput");

/**
 * Get the full list of available players (built-in + custom-added)
 * @returns {Array} - Array of player names
 */
function getAllPlayers() {
  return [...AVAILABLE_PLAYERS, ...customPlayers];
}

// ===== FISHER-YATES SHUFFLE =====
/**
 * Shuffles an array using the Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} - Shuffled copy of array
 */
function fisherYatesShuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ===== TEAM GENERATION =====
/**
 * Reads and clamps the desired number of teams from the input
 * @returns {number} - Number of teams between 2 and TEAM_NAMES.length
 */
function getTeamCount() {
  const raw = parseInt(teamCountInput.value, 10);
  const count = Number.isNaN(raw) ? 2 : raw;
  return Math.max(2, Math.min(count, TEAM_NAMES.length));
}

/**
 * Generates N balanced teams with random names
 * @param {Array} players - List of player names
 * @param {number} numTeams - Number of teams to create
 * @returns {Object} - Object with a `teams` array
 */
function generateTeams(players, numTeams) {
  if (players.length === 0) return null;

  // Separate locked and unlocked players
  const lockedPlayersList = Array.from(players).filter(p => lockedPlayers.has(p));
  const unlockedPlayersList = Array.from(players).filter(p => !lockedPlayers.has(p));

  // Shuffle only unlocked players
  const shuffledUnlocked = fisherYatesShuffle(unlockedPlayersList);

  // Distribute players round-robin across the teams
  const groups = Array.from({ length: numTeams }, () => []);
  shuffledUnlocked.forEach((player, index) => {
    groups[index % numTeams].push(player);
  });
  lockedPlayersList.forEach((player, index) => {
    groups[index % numTeams].push(player);
  });

  // Get unique team names
  const selectedNames = getUniqueTeamNames(numTeams);

  return {
    teams: groups.map((teamPlayers, index) => ({
      name: selectedNames[index].name,
      emoji: selectedNames[index].emoji,
      color: selectedNames[index].color,
      players: teamPlayers
    }))
  };
}

/**
 * Gets unique random team names with emojis and colors
 * @param {number} count - Number of unique names needed
 * @returns {Array} - Array of {name, emoji, color} objects
 */
function getUniqueTeamNames(count) {
  const indices = new Set();
  while (indices.size < count) {
    indices.add(Math.floor(Math.random() * TEAM_NAMES.length));
  }

  return Array.from(indices).map(i => ({
    name: TEAM_NAMES[i],
    emoji: TEAM_EMOJIS[i],
    color: TEAM_COLORS[i]
  }));
}

// ===== EVENT LISTENERS =====
/**
 * Checkbox change listener
 */
document.addEventListener("change", (e) => {
  if (e.target.type === "checkbox" && e.target.name === "player-checkbox") {
    updatePlayerCount();
    localStorage.setItem(STORAGE_KEY_SELECTED, JSON.stringify(getSelectedPlayers()));
  }
});

/**
 * Generate Teams button click
 */
generateBtn.addEventListener("click", () => {
  const players = getSelectedPlayers();
  if (players.length === 0) return;

  currentTeams = generateTeams(players, getTeamCount());
  if (currentTeams) {
    renderTeams();
    triggerConfetti();
    showToast("Teams generated! 🎉");
    
    // Update button states
    regenerateBtn.disabled = false;
    copyBtn.disabled = false;
    swapBtn.disabled = false;
  }
});

/**
 * Regenerate Teams button click
 */
regenerateBtn.addEventListener("click", () => {
  const players = getSelectedPlayers();
  currentTeams = generateTeams(players, getTeamCount());
  if (currentTeams) {
    renderTeams();
    triggerConfetti();
    showToast("Teams regenerated! 🔄");
  }
});

/**
 * Copy Teams button click
 */
copyBtn.addEventListener("click", () => {
  if (!currentTeams) return;

  const fullText = currentTeams.teams
    .map(team => `${team.emoji} ${team.name}\n${team.players.join("\n")}`)
    .join("\n\n");

  navigator.clipboard.writeText(fullText).then(() => {
    showToast("Teams copied to clipboard! 📋");
  }).catch(() => {
    showToast("Failed to copy teams", false);
  });
});

/**
 * Team count input change
 */
teamCountInput.addEventListener("change", () => {
  const count = getTeamCount();
  teamCountInput.value = count;
  localStorage.setItem(STORAGE_KEY_TEAM_COUNT, String(count));
});

/**
 * Swap Mode button click
 */
swapBtn.addEventListener("click", () => {
  swapMode = !swapMode;
  selectedForSwap = null;
  
  if (swapMode) {
    swapBtn.textContent = "Exit Swap Mode";
    swapBtn.style.background = "linear-gradient(135deg, #ffc107 0%, #ff9800 100%)";
    showSwapIndicator();
  } else {
    swapBtn.textContent = "Swap Mode";
    swapBtn.style.background = "";
    removeSwapIndicator();
    renderTeams();
  }
});

/**
 * Add Player button click
 */
addPlayerBtn.addEventListener("click", () => {
  addPlayer(newPlayerInput.value);
});

/**
 * Add player on Enter key press
 */
newPlayerInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addPlayer(newPlayerInput.value);
  }
});

/**
 * Clear All button click
 */
clearBtn.addEventListener("click", () => {
  if (confirm("Unselect all players?")) {
    document.querySelectorAll("input[name='player-checkbox']").forEach(cb => {
      cb.checked = false;
    });
    lockedPlayers.clear();
    currentTeams = null;
    selectedForSwap = null;
    swapMode = false;
    
    // Update button states
    generateBtn.disabled = true;
    regenerateBtn.disabled = true;
    copyBtn.disabled = true;
    swapBtn.disabled = true;
    
    playerCountDisplay.textContent = "0 players selected";
    localStorage.removeItem(STORAGE_KEY_SELECTED);
    localStorage.removeItem(STORAGE_KEY_LOCKED);
    
    teamsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <p>Select player names and click "Generate Teams" to get started!</p>
      </div>
    `;
  }
});

// ===== HELPER FUNCTIONS =====
/**
 * Add a new player name to the list
 * @param {string} rawName - Player name to add
 */
function addPlayer(rawName) {
  const name = rawName.trim();

  if (!name) {
    showToast("Enter a name to add", false);
    return;
  }

  const isDuplicate = getAllPlayers().some(p => p.toLowerCase() === name.toLowerCase());
  if (isDuplicate) {
    showToast(`${name} is already in the list`, false);
    return;
  }

  customPlayers.push(name);
  localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(customPlayers));

  renderPlayerCheckboxes();

  const checkbox = document.querySelector(`input[value="${name}"]`);
  if (checkbox) checkbox.checked = true;

  updatePlayerCount();
  localStorage.setItem(STORAGE_KEY_SELECTED, JSON.stringify(getSelectedPlayers()));

  newPlayerInput.value = "";
  showToast(`${name} added! ✅`);
}

/**
 * Get selected players from checkboxes
 * @returns {Array} - Array of selected player names
 */
function getSelectedPlayers() {
  const checkboxes = document.querySelectorAll("input[name='player-checkbox']:checked");
  return Array.from(checkboxes).map(cb => cb.value);
}

/**
 * Update player count display
 */
function updatePlayerCount() {
  const players = getSelectedPlayers();
  playerCountDisplay.textContent = `${players.length} player${players.length !== 1 ? 's' : ''} selected`;
  
  // Enable/disable generate button
  generateBtn.disabled = players.length === 0;
}

/**
 * Render player checkboxes
 */
function renderPlayerCheckboxes() {
  const selectedPlayers = new Set(getSelectedPlayers());

  playersList.innerHTML = getAllPlayers().map(player => `
    <div class="player-checkbox">
      <input 
        type="checkbox" 
        id="player-${player}" 
        name="player-checkbox" 
        value="${player}"
        ${selectedPlayers.has(player) ? 'checked' : ''}
      />
      <label for="player-${player}">${player}</label>
    </div>
  `).join('');
  
  updatePlayerCount();
}

/**
 * Render teams to the DOM
 */
function renderTeams() {
  if (!currentTeams) return;

  const teamsHTML = currentTeams.teams.map((team, teamIndex) => `
    <div class="team-card" style="--team-color: ${team.color}; animation-delay: ${0.1 * (teamIndex + 1)}s;">
      <div class="team-header">
        <div class="team-icon" style="animation-delay: ${0.1 * teamIndex}s;">${team.emoji}</div>
        <div class="team-name">${team.name}</div>
      </div>
      <div class="team-count">
        ${team.players.length} players
      </div>
      <ul class="player-list" data-team="${teamIndex}">
        ${team.players.map((player, index) => `
          <li class="player-item ${lockedPlayers.has(player) ? 'locked' : ''}" data-player="${player}" data-index="${index}">
            <div class="player-info">
              <span class="player-name">${player}</span>
              ${lockedPlayers.has(player) ? '<span class="lock-icon">🔒</span>' : ''}
            </div>
            <div class="player-actions">
              <button class="player-btn lock-btn" data-player="${player}" title="Lock/Unlock player">
                ${lockedPlayers.has(player) ? '🔓' : '🔒'}
              </button>
              ${swapMode ? `<button class="player-btn swap-btn" data-player="${player}" title="Select to swap">Swap</button>` : ''}
            </div>
          </li>
        `).join('')}
      </ul>
    </div>
  `).join('');

  teamsContainer.innerHTML = teamsHTML;

  // Attach event listeners to dynamic elements
  attachDynamicListeners();
}

/**
 * Attach event listeners to dynamically created elements
 */
function attachDynamicListeners() {
  // Lock button listeners
  document.querySelectorAll(".lock-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const player = btn.dataset.player;
      toggleLockPlayer(player);
    });
  });
  
  // Swap button listeners
  if (swapMode) {
    document.querySelectorAll(".swap-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const player = btn.dataset.player;
        handleSwapSelection(player);
      });
    });
    
    document.querySelectorAll(".player-item").forEach(item => {
      item.addEventListener("click", (e) => {
        if (e.target.closest(".player-btn")) return;
        const player = item.dataset.player;
        handleSwapSelection(player);
      });
    });
  }
}

/**
 * Toggle lock status of a player
 * @param {string} player - Player name
 */
function toggleLockPlayer(player) {
  if (lockedPlayers.has(player)) {
    lockedPlayers.delete(player);
  } else {
    lockedPlayers.add(player);
  }
  
  // Save to localStorage
  localStorage.setItem(STORAGE_KEY_LOCKED, JSON.stringify(Array.from(lockedPlayers)));
  
  renderTeams();
  showToast(`${player} ${lockedPlayers.has(player) ? 'locked' : 'unlocked'} 🔒`);
}

/**
 * Handle player selection for swapping
 * @param {string} player - Player name
 */
function handleSwapSelection(player) {
  if (selectedForSwap === null) {
    // First player selected
    selectedForSwap = player;
    document.querySelector(`[data-player="${player}"]`).classList.add("swap-selected");
    showToast(`${player} selected. Click another player to swap! 🔄`);
  } else if (selectedForSwap === player) {
    // Deselect
    selectedForSwap = null;
    document.querySelector(`[data-player="${player}"]`).classList.remove("swap-selected");
    showToast("Selection cleared");
  } else {
    // Swap the players
    swapPlayers(selectedForSwap, player);
    selectedForSwap = null;
  }
}

/**
 * Swap two players between teams
 * @param {string} player1 - First player name
 * @param {string} player2 - Second player name
 */
function swapPlayers(player1, player2) {
  if (!currentTeams) return;

  const team1 = currentTeams.teams.find(t => t.players.includes(player1));
  const team2 = currentTeams.teams.find(t => t.players.includes(player2));
  if (!team1 || !team2 || team1 === team2) return;

  team1.players = team1.players.filter(p => p !== player1);
  team2.players = team2.players.filter(p => p !== player2);
  team1.players.push(player2);
  team2.players.push(player1);

  renderTeams();
  showToast(`Swapped ${player1} and ${player2}! 🔄`);
}

/**
 * Show swap mode indicator
 */
function showSwapIndicator() {
  const indicator = document.createElement("div");
  indicator.className = "swap-indicator";
  indicator.id = "swap-indicator";
  indicator.textContent = "🔄 Swap Mode: Click a player to select, then click another to swap";
  document.body.appendChild(indicator);
}

/**
 * Remove swap mode indicator
 */
function removeSwapIndicator() {
  const indicator = document.getElementById("swap-indicator");
  if (indicator) indicator.remove();
}

/**
 * Trigger confetti animation
 */
function triggerConfetti() {
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement("div");
    confetti.className = "confetti";
    confetti.style.left = Math.random() * 100 + "%";
    confetti.style.background = ["#3498db", "#e74c3c", "#1abc9c", "#f39c12"][Math.floor(Math.random() * 4)];
    confetti.style.setProperty("--tx", (Math.random() - 0.5) * 200 + "px");
    document.body.appendChild(confetti);
    
    setTimeout(() => confetti.remove(), 3000);
  }
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {boolean} isSuccess - Whether it's a success message
 */
function showToast(message, isSuccess = true) {
  const toast = document.createElement("div");
  toast.className = `toast ${isSuccess ? 'success' : ''}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = "slideUp 0.3s ease-out reverse";
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// ===== PUBLIC API =====
/**
 * Set selected players from an array
 * @param {Array<string>} playersArray - Array of player names to select
 */
window.setPlayers = function(playersArray) {
  if (!Array.isArray(playersArray)) {
    console.error("setPlayers expects an array of player names");
    return;
  }
  
  // Uncheck all first
  document.querySelectorAll("input[name='player-checkbox']").forEach(cb => {
    cb.checked = false;
  });
  
  // Check the specified players
  playersArray.forEach(playerName => {
    const checkbox = document.querySelector(`input[value="${playerName}"]`);
    if (checkbox) {
      checkbox.checked = true;
    }
  });
  
  updatePlayerCount();
  localStorage.setItem(STORAGE_KEY_SELECTED, JSON.stringify(getSelectedPlayers()));
  showToast(`Selected ${playersArray.length} player${playersArray.length !== 1 ? 's' : ''}`);
};

/**
 * Generate teams from an array directly
 * @param {Array<string>} playersArray - Array of player names
 */
window.generateTeamsFromArray = function(playersArray) {
  window.setPlayers(playersArray);
  setTimeout(() => {
    generateBtn.click();
  }, 100);
};

// ===== INITIALIZATION =====
/**
 * Load saved selections and locked players from localStorage
 */
function loadFromLocalStorage() {
  const savedSelected = localStorage.getItem(STORAGE_KEY_SELECTED);
  const savedLocked = localStorage.getItem(STORAGE_KEY_LOCKED);
  const savedCustom = localStorage.getItem(STORAGE_KEY_CUSTOM);
  const savedTeamCount = localStorage.getItem(STORAGE_KEY_TEAM_COUNT);

  if (savedTeamCount) {
    teamCountInput.value = savedTeamCount;
  }

  if (savedCustom) {
    try {
      customPlayers = JSON.parse(savedCustom);
    } catch (e) {
      customPlayers = [];
    }
  }

  renderPlayerCheckboxes();
  
  if (savedSelected) {
    try {
      const selectedPlayers = JSON.parse(savedSelected);
      selectedPlayers.forEach(player => {
        const checkbox = document.querySelector(`input[value="${player}"]`);
        if (checkbox) checkbox.checked = true;
      });
      updatePlayerCount();
    } catch (e) {
      // Failed to parse, select all by default
      selectAllPlayers();
    }
  } else {
    // No saved selection, select all by default
    selectAllPlayers();
  }
  
  if (savedLocked) {
    try {
      lockedPlayers = new Set(JSON.parse(savedLocked));
    } catch (e) {
      lockedPlayers = new Set();
    }
  }
}

/**
 * Select all players
 */
function selectAllPlayers() {
  document.querySelectorAll("input[name='player-checkbox']").forEach(cb => {
    cb.checked = true;
  });
  updatePlayerCount();
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  loadFromLocalStorage();
});