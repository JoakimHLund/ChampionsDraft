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

// Global object to store eliminated status of teams by competition
const eliminatedStatus = {
    champions: {},
    europa: {},
    conference: {}
};

// Fetch eliminated status for all teams
async function fetchEliminatedStatus() {
    const championsSnapshot = await db.collection('ChampionsTeams').get();
    championsSnapshot.forEach(doc => {
        eliminatedStatus.champions[doc.data().team] = doc.data().eliminated;
    });

    const europaSnapshot = await db.collection('EuropaTeams').get();
    europaSnapshot.forEach(doc => {
        eliminatedStatus.europa[doc.data().team] = doc.data().eliminated;
    });

    const conferenceSnapshot = await db.collection('ConferenceTeams').get();
    conferenceSnapshot.forEach(doc => {
        eliminatedStatus.conference[doc.data().team] = doc.data().eliminated;
    });
}

async function loadLeaderboard(scope = 'global') {
    // First fetch eliminated statuses
    await fetchEliminatedStatus();

    let query = db.collection("players");
    if (scope === 'avinor') {
        // Only employees with WorksAtAvinor = true
        query = query.where("WorksAtAvinor", "==", true);
    }
    // Order by total points for consistent ranking
    query = query.orderBy("totalpoints", "desc");

    query.get().then((querySnapshot) => {
        const leaderboardBody = document.getElementById('leaderboard-body');
        leaderboardBody.innerHTML = ''; // Clear existing content

        let highestChampionsPoints = 0;
        let highestEuropaPoints = 0;
        let highestConferencePoints = 0;

        // First pass: Determine highest score in each league
        querySnapshot.forEach(doc => {
            const playerData = doc.data();
            highestChampionsPoints = Math.max(highestChampionsPoints, playerData.championspoints || 0);
            highestEuropaPoints = Math.max(highestEuropaPoints, playerData.europapoints || 0);
            highestConferencePoints = Math.max(highestConferencePoints, playerData.conferencepoints || 0);
        });

        // Second pass: Build leaderboard with trophy icons for top scorers
        let rank = 1;
        let previousPoints = null;
        let sameRankCount = 0;

        querySnapshot.forEach((doc, index) => {
            const playerData = doc.data();
            const currentPoints = playerData.totalpoints || 0;

            let playerName = playerData.Name;
            if (playerData.Department && playerData.Department.trim() !== '') {
                playerName = `[${playerData.Department}] ${playerName}`;
            }

            // Adjust rank only if the current player's points differ from the previous player's
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

            // Add trophy icons for top scorers (only if > 0)
            if (playerData.championspoints === highestChampionsPoints && highestChampionsPoints > 0) {
                const championsIcon = createTrophyIcon('img/icons/championstrophy.png', 'Champions Trophy', 'champions');
                rankContainer.appendChild(championsIcon);
            }
            if (playerData.europapoints === highestEuropaPoints && highestEuropaPoints > 0) {
                const europaIcon = createTrophyIcon('img/icons/europatrophy.png', 'Europa Trophy', 'europa');
                rankContainer.appendChild(europaIcon);
            }
            if (playerData.conferencepoints === highestConferencePoints && highestConferencePoints > 0) {
                const conferenceIcon = createTrophyIcon('img/icons/conferencetrophy.png', 'Conference Trophy', 'conference');
                rankContainer.appendChild(conferenceIcon);
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

            // Create containers with league name for eliminated check
            const championsSelectionCell = document.createElement('td');
            const championsLogosContainer = createLogosContainer(playerData.selectedChampions, 'champions');
            championsSelectionCell.appendChild(championsLogosContainer);

            const europaSelectionCell = document.createElement('td');
            const europaLogosContainer = createLogosContainer(playerData.selectedEuropa, 'europa');
            europaSelectionCell.appendChild(europaLogosContainer);

            const conferenceSelectionCell = document.createElement('td');
            const conferenceLogosContainer = createLogosContainer(playerData.selectedConference, 'conference');
            conferenceSelectionCell.appendChild(conferenceLogosContainer);

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

            document.querySelectorAll('th[data-column]').forEach(th => {
                th.addEventListener('click', () => sortTable(th.getAttribute('data-column')));
            });
        });
    }).catch((error) => {
        console.error("Error getting documents: ", error);
    });
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
            const isEliminated = eliminatedStatus[leagueName][team.name] === true;
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
document.addEventListener('DOMContentLoaded', () => {
    const scopeSelect = document.getElementById('scope-select');
    if (scopeSelect) {
        scopeSelect.addEventListener('change', (e) => {
            const scope = e.target.value; // 'global' | 'avinor'
            loadLeaderboard(scope);
        });
    }
});