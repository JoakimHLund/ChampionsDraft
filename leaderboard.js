// Initialize Firebase (use your existing configuration)
const firebaseConfig = {
    apiKey: "AIzaSyCtkvwfwgZmCY7Ho1Uh1Itm8jDXhuff7_g",
    authDomain: "championsdraft25.firebaseapp.com",
    projectId: "championsdraft25",
    storageBucket: "championsdraft25.firebasestorage.app",
    messagingSenderId: "194206448130",
    appId: "1:194206448130:web:58358b48e25006f511c51b"
  };

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

function formatDisplayName(playerData) {
  const baseName = playerData?.Name || 'Unknown';
  const department = (playerData?.Department || '').trim();
  return department ? `[${department}] ${baseName}` : baseName;
}

function setTextById(id, text) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = text;
  }
}

function setHtmlById(id, html) {
  const el = document.getElementById(id);
  if (el) {
    el.innerHTML = html;
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function updateLeaderboardHighlights(docs) {
  const podiumEl = document.getElementById('podium');
  if (!podiumEl) return;

  const players = docs.map(d => d.data());
  const sortedByTotal = [...players].sort((a, b) => (b.totalpoints || 0) - (a.totalpoints || 0));
  const topThree = sortedByTotal.slice(0, 3);

  const podiumSlots = [
    { rankLabel: '2nd', emoji: '🥈', cssClass: 'podium-second', stepHeight: 56, player: topThree[1] },
    { rankLabel: '1st', emoji: '🥇', cssClass: 'podium-first', stepHeight: 88, player: topThree[0] },
    { rankLabel: '3rd', emoji: '🥉', cssClass: 'podium-third', stepHeight: 42, player: topThree[2] }
  ];

  podiumEl.innerHTML = podiumSlots.map(slot => {
    const player = slot.player;
    if (!player) {
      return `
        <div class="podium-place ${slot.cssClass}">
          <span class="podium-emoji">${slot.emoji}</span>
          <div class="podium-label">${slot.rankLabel}</div>
          <div class="podium-name">-</div>
          <div class="podium-points">0 pts</div>
          <div class="podium-step" style="height:${slot.stepHeight}px"></div>
        </div>
      `;
    }

    return `
      <div class="podium-place ${slot.cssClass}">
        <span class="podium-emoji">${slot.emoji}</span>
        <div class="podium-label">${slot.rankLabel}</div>
        <div class="podium-name">${escapeHtml(formatDisplayName(player))}</div>
        <div class="podium-points">${player.totalpoints || 0} pts</div>
        <div class="podium-step" style="height:${slot.stepHeight}px"></div>
      </div>
    `;
  }).join('');

  if (players.length === 0) {
    setHtmlById('cl-winner', '<img src="img/icons/championstrophy.png" alt="Champions Trophy" class="winner-icon trophy-icon champions">Champions league winner: -');
    setHtmlById('el-winner', '<img src="img/icons/europatrophy.png" alt="Europa Trophy" class="winner-icon trophy-icon europa">Europa league winner: -');
    setHtmlById('ecl-winner', '<img src="img/icons/conferencetrophy.png" alt="Conference Trophy" class="winner-icon trophy-icon conference">Conference league winners: -');
    return;
  }

  let clWinner = players[0];
  let elWinner = players[0];
  let maxConferencePoints = Number.NEGATIVE_INFINITY;

  players.forEach(player => {
    if ((player.championspoints || 0) > (clWinner.championspoints || 0)) {
      clWinner = player;
    }
    if ((player.europapoints || 0) > (elWinner.europapoints || 0)) {
      elWinner = player;
    }
    if ((player.conferencepoints || 0) > maxConferencePoints) {
      maxConferencePoints = player.conferencepoints || 0;
    }
  });

  const conferenceWinners = players
    .filter(player => (player.conferencepoints || 0) === maxConferencePoints)
    .map(formatDisplayName)
    .join(', ');

  setHtmlById(
    'cl-winner',
    `<img src="img/icons/championstrophy.png" alt="Champions Trophy" class="winner-icon trophy-icon champions">Champions league winner: ${escapeHtml(formatDisplayName(clWinner))} (${clWinner.championspoints || 0} pts)`
  );
  setHtmlById(
    'el-winner',
    `<img src="img/icons/europatrophy.png" alt="Europa Trophy" class="winner-icon trophy-icon europa">Europa league winner: ${escapeHtml(formatDisplayName(elWinner))} (${elWinner.europapoints || 0} pts)`
  );
  setHtmlById(
    'ecl-winner',
    `<img src="img/icons/conferencetrophy.png" alt="Conference Trophy" class="winner-icon trophy-icon conference">Conference league winners: ${escapeHtml(conferenceWinners || '-')} (${maxConferencePoints > Number.NEGATIVE_INFINITY ? maxConferencePoints : 0} pts)`
  );
}

// Global object to store eliminated status of teams by competition
const eliminatedStatus = {
    champions: {},
    europa: {},
    conference: {}
};

// Fetch eliminated status for all teams
async function fetchEliminatedStatus() {
  // Reset (so refreshes don't keep stale keys)
  eliminatedStatus.champions = {};
  eliminatedStatus.europa = {};
  eliminatedStatus.conference = {};

  const clSnap = await db.collection('CLTeams').get();
  clSnap.forEach(doc => {
    const d = doc.data() || {};
    const name = String(d.Name || doc.id).trim();
    eliminatedStatus.champions[name] = d.eliminated === true;
  });

  const elSnap = await db.collection('ELTeams').get();
  elSnap.forEach(doc => {
    const d = doc.data() || {};
    const name = String(d.Name || doc.id).trim();
    eliminatedStatus.europa[name] = d.eliminated === true;
  });

  const ecSnap = await db.collection('ECTeams').get();
  ecSnap.forEach(doc => {
    const d = doc.data() || {};
    const name = String(d.Name || doc.id).trim();
    eliminatedStatus.conference[name] = d.eliminated === true;
  });
}

async function loadLeaderboard(scope = 'global', groupMembers = []) {
  // First fetch eliminated statuses
  await fetchEliminatedStatus();

  const leaderboardBody = document.getElementById('leaderboard-body');
  leaderboardBody.innerHTML = '';

  let query = db.collection("players");
  let useClientFilter = false;
  let members = (groupMembers || []).map(s => s.trim()).filter(Boolean);

  if (scope === 'avinor') {
    query = query.where("WorksAtAvinor", "==", true);
  } else if (scope === 'group') {
    // If >10 members, Firestore 'in' cannot be used -> client filter
    if (members.length > 0 && members.length <= 10) {
      try {
        // Attempt server-side filter + order
        query = query.where("Department", "in", members)
                     .orderBy("totalpoints", "desc");
      } catch {
        // In case SDK throws early, fall back
        useClientFilter = true;
      }
    } else {
      useClientFilter = true;
    }
  }

  if (scope !== 'group') {
    query = query.orderBy("totalpoints", "desc");
  }

  try {
    let docs = [];
    if (useClientFilter) {
      // Get ordered globally, filter locally by Department ∈ members
      const snap = await db.collection("players")
                           .orderBy("totalpoints", "desc")
                           .get();
      docs = snap.docs.filter(d => members.includes((d.data().Department || '').trim()));
    } else {
      const snap = await query.get();
      docs = snap.docs;
    }

    updateLeaderboardHighlights(docs);

    // === First pass: top-per-league ===
    let highestChampionsPoints = 0;
    let highestEuropaPoints = 0;
    let highestConferencePoints = 0;

    docs.forEach(doc => {
      const p = doc.data();
      highestChampionsPoints = Math.max(highestChampionsPoints, p.championspoints || 0);
      highestEuropaPoints    = Math.max(highestEuropaPoints,    p.europapoints    || 0);
      highestConferencePoints= Math.max(highestConferencePoints,p.conferencepoints|| 0);
    });

    // === Second pass: render + rank (ties handled) ===
    let rank = 1;
    let previousPoints = null;
    let sameRankCount = 0;

    docs.forEach((doc) => {
      const playerData = doc.data();
      const currentPoints = playerData.totalpoints || 0;

      let playerName = playerData.Name;
      if (playerData.Department && playerData.Department.trim() !== '') {
        playerName = `[${playerData.Department}] ${playerName}`;
      }

      if (previousPoints !== null && currentPoints === previousPoints) {
        sameRankCount++;
      } else {
        rank += sameRankCount;
        sameRankCount = 1;
      }
      previousPoints = currentPoints;

      const row = document.createElement('tr');

      const rankCell = document.createElement('td');
      rankCell.classList.add('rank-cell');
      const rankContainer = document.createElement('div');
      rankContainer.classList.add('rank-container');

      if (playerData.championspoints === highestChampionsPoints && highestChampionsPoints > 0) {
        rankContainer.appendChild(createTrophyIcon('img/icons/championstrophy.png', 'Champions Trophy', 'champions'));
      }
      if (playerData.europapoints === highestEuropaPoints && highestEuropaPoints > 0) {
        rankContainer.appendChild(createTrophyIcon('img/icons/europatrophy.png', 'Europa Trophy', 'europa'));
      }
      if (playerData.conferencepoints === highestConferencePoints && highestConferencePoints > 0) {
        rankContainer.appendChild(createTrophyIcon('img/icons/conferencetrophy.png', 'Conference Trophy', 'conference'));
      }

      const rankNumber = document.createElement('span');
      rankNumber.textContent = rank;
      rankContainer.appendChild(rankNumber);
      rankCell.appendChild(rankContainer);

      const nameCell = document.createElement('td');
      const nameLink = document.createElement('a');
      nameLink.textContent = playerName;
      nameLink.href = 'player.html?playername=' + encodeURIComponent(playerData.Name);
      nameLink.className = 'player-link';
      nameCell.appendChild(nameLink);

      const championsSelectionCell = document.createElement('td');
      championsSelectionCell.appendChild(createLogosContainer(playerData.selectedChampions, 'champions'));

      const europaSelectionCell = document.createElement('td');
      europaSelectionCell.appendChild(createLogosContainer(playerData.selectedEuropa, 'europa'));

      const conferenceSelectionCell = document.createElement('td');
      conferenceSelectionCell.appendChild(createLogosContainer(playerData.selectedConference, 'conference'));

      const championsPointsCell = document.createElement('td');
      championsPointsCell.textContent = playerData.championspoints || 0;
      championsPointsCell.setAttribute('data-column', 'championspoints');

      const europaPointsCell = document.createElement('td');
      europaPointsCell.textContent = playerData.europapoints || 0;
      europaPointsCell.setAttribute('data-column', 'europapoints');

      const conferencePointsCell = document.createElement('td');
      conferencePointsCell.textContent = playerData.conferencepoints || 0;
      conferencePointsCell.setAttribute('data-column', 'conferencepoints');

      const totalPointsCell = document.createElement('td');
      totalPointsCell.textContent = currentPoints;
      totalPointsCell.setAttribute('data-column', 'totalpoints');

      row.appendChild(rankCell);
      row.appendChild(nameCell);
      row.appendChild(championsSelectionCell);
      row.appendChild(europaSelectionCell);
      row.appendChild(conferenceSelectionCell);
      row.appendChild(championsPointsCell);
      row.appendChild(europaPointsCell);
      row.appendChild(conferencePointsCell);
      row.appendChild(totalPointsCell);
      leaderboardBody.appendChild(row);
    });

    // keep your sortable headers
    document.querySelectorAll('th[data-column]').forEach(th => {
      th.addEventListener('click', () => sortTable(th.getAttribute('data-column')));
    });

  } catch (error) {
    // Handle composite index prompts or 'in' + order limitations gracefully
    console.error("Error getting documents: ", error);
    // Last-resort fallback: global ordered + local filter if group
    if (scope === 'group') {
      const snap = await db.collection("players").orderBy("totalpoints", "desc").get();
      const filtered = snap.docs.filter(d => members.includes((d.data().Department || '').trim()));
      // Re-run render path with filtered docs
      // Quick reuse: call loadLeaderboard again but with client-filter enforced
      await loadLeaderboard('group', members); // (already falls back above)
    }
  }
}


// Helper function to create a trophy icon
function createTrophyIcon(src, alt, className) {
    const icon = document.createElement('img');
    icon.src = src;
    icon.alt = alt;
    icon.className = `trophy-icon ${className}`;
    return icon;
}

// Modified helper function to create logos container with eliminated check
function createLogosContainer(teamArray, leagueName) {
    const logosContainer = document.createElement('div');
    logosContainer.className = 'logos-container';

    if (teamArray && teamArray.length > 0) {
        teamArray.sort((a, b) => a.name.localeCompare(b.name));

        teamArray.forEach(team => {
            const logoImg = document.createElement('img');
            logoImg.src = `img/logos/${team.logo}`;
            logoImg.className = 'small-logo';
            logoImg.title = team.name;

            // Check if eliminated and apply grayscale if true
            const key = String(team.name || '').trim();
            const isEliminated = eliminatedStatus[leagueName]?.[key] === true;

            if (isEliminated) {
                logoImg.classList.add('eliminated-logo'); // Add CSS class that applies grayscale
            }

            logosContainer.appendChild(logoImg);
        });
    } else {
        const noSelection = document.createElement('p');
        noSelection.textContent = 'No teams selected';
        logosContainer.appendChild(noSelection);
    }

    return logosContainer;
}

let currentSortColumn = 'totalpoints';
let sortAscending = false;

function sortTable(column) {
    if (currentSortColumn === column) {
        sortAscending = !sortAscending;
    } else {
        sortAscending = false;
    }
    currentSortColumn = column;

    const rows = Array.from(document.querySelectorAll('#leaderboard-body tr'));
    rows.sort((a, b) => {
        const valueA = parseFloat(a.querySelector(`td[data-column="${column}"]`).textContent) || 0;
        const valueB = parseFloat(b.querySelector(`td[data-column="${column}"]`).textContent) || 0;
        return sortAscending ? valueA - valueB : valueB - valueA;
    });

    rows.forEach(row => document.getElementById('leaderboard-body').appendChild(row));

    document.querySelectorAll('th').forEach(th => {
        th.classList.remove('sorted-asc', 'sorted-desc');
    });

    const currentTh = document.querySelector(`th[data-column="${column}"]`);
    currentTh.classList.add(sortAscending ? 'sorted-asc' : 'sorted-desc');
}

// Call the loadLeaderboard function after the eliminated status is fetched
loadLeaderboard('global');

// Scope toggle
document.addEventListener('DOMContentLoaded', async () => {
  const scopeSelect = document.getElementById('scope-select');

  // populate groups under the optgroup
  await populateTeamGroupsInScope();

  if (scopeSelect) {
    scopeSelect.addEventListener('change', async (e) => {
      const value = e.target.value; // 'global' | 'avinor' | 'group:<docId>'
      if (value.startsWith('group:')) {
        const id = value.split(':')[1];
        const doc = await db.collection('TeamGroups').doc(id).get();
        const members = (doc.data()?.members || [])
          .filter(x => typeof x === 'string' && x.trim() !== '');
        await loadLeaderboard('group', members);
      } else {
        await loadLeaderboard(value); // 'global' or 'avinor'
      }
    });
  }
});



async function populateTeamGroupsInScope() {
  const og = document.getElementById('groups-optgroup');
  if (!og) return;

  og.innerHTML = ''; // clear
  const snap = await db.collection('TeamGroups').orderBy('name').get();
  snap.forEach(doc => {
    const g = doc.data() || {};
    // value encodes the doc id; we’ll fetch members when selected
    const opt = document.createElement('option');
    opt.value = `group:${doc.id}`;
    opt.textContent = g.name || '(unnamed)';
    og.appendChild(opt);
  });
}
