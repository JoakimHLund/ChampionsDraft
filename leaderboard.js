// Initialize Firebase (use your existing configuration)
const firebaseConfig = {
    apiKey: "AIzaSyC36DXqx9qnp1TjMGNX32Nm1p9uGXp62ZA",
    authDomain: "championsdraft-403d0.firebaseapp.com",
    projectId: "championsdraft-403d0",
    storageBucket: "championsdraft-403d0.appspot.com",
    messagingSenderId: "766027841647",
    appId: "1:766027841647:web:99ef32b25549054b218d9a"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

function loadLeaderboard() {
    db.collection("players").orderBy("totalpoints", "desc").get().then((querySnapshot) => {
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

            // Format the name as "[Department] Name" if department is present
            let playerName = playerData.Name;
            if (playerData.Department && playerData.Department.trim() !== '') {
                playerName = `[${playerData.Department}] ${playerName}`;
            }

            // Adjust rank only if the current player's points are different from the previous player's points
            if (previousPoints !== null && currentPoints === previousPoints) {
                sameRankCount++;
            } else {
                rank += sameRankCount;
                sameRankCount = 1;
            }

            previousPoints = currentPoints;

            // Create a table row
            const row = document.createElement('tr');

            // Inside the loadLeaderboard function, where you create the rank cell
            const rankCell = document.createElement('td');
            rankCell.classList.add('rank-cell');

            const rankContainer = document.createElement('div');
            rankContainer.classList.add('rank-container');

            // Add trophy icons to the rank container
            if (playerData.championspoints === highestChampionsPoints) {
                const championsIcon = createTrophyIcon('img/icons/championstrophy.png', 'Champions Trophy', 'champions');
                rankContainer.appendChild(championsIcon);
            }
            if (playerData.europapoints === highestEuropaPoints) {
                const europaIcon = createTrophyIcon('img/icons/europatrophy.png', 'Europa Trophy', 'europa');
                rankContainer.appendChild(europaIcon);
            }
            if (playerData.conferencepoints === highestConferencePoints) {
                const conferenceIcon = createTrophyIcon('img/icons/conferencetrophy.png', 'Conference Trophy', 'conference');
                rankContainer.appendChild(conferenceIcon);
            }

            // Add the rank number as a separate element
            const rankNumber = document.createElement('span');
            rankNumber.textContent = rank;
            rankContainer.appendChild(rankNumber);

            // Append the rank container to the rank cell
            rankCell.appendChild(rankContainer);


            // Rest of the cells (name, selections, points)
            const nameCell = document.createElement('td');
            const nameLink = document.createElement('a');
            nameLink.textContent = playerName;
            nameLink.href = 'player.html?playername=' + encodeURIComponent(playerData.Name);
            nameLink.className = 'player-link';
            nameCell.appendChild(nameLink);

            const championsSelectionCell = document.createElement('td');
            const championsLogosContainer = createLogosContainer(playerData.selectedChampions);
            championsSelectionCell.appendChild(championsLogosContainer);

            const europaSelectionCell = document.createElement('td');
            const europaLogosContainer = createLogosContainer(playerData.selectedEuropa);
            europaSelectionCell.appendChild(europaLogosContainer);

            const conferenceSelectionCell = document.createElement('td');
            const conferenceLogosContainer = createLogosContainer(playerData.selectedConference);
            conferenceSelectionCell.appendChild(conferenceLogosContainer);

            const championsPointsCell = document.createElement('td');
            championsPointsCell.textContent = playerData.championspoints || 0;

            const europaPointsCell = document.createElement('td');
            europaPointsCell.textContent = playerData.europapoints || 0;

            const conferencePointsCell = document.createElement('td');
            conferencePointsCell.textContent = playerData.conferencepoints || 0;

            const totalPointsCell = document.createElement('td');
            totalPointsCell.textContent = currentPoints;

            // Append cells to the row
            row.appendChild(rankCell);
            row.appendChild(nameCell);
            row.appendChild(championsSelectionCell);
            row.appendChild(europaSelectionCell);
            row.appendChild(conferenceSelectionCell);
            row.appendChild(championsPointsCell);
            row.appendChild(europaPointsCell);
            row.appendChild(conferencePointsCell);
            row.appendChild(totalPointsCell);

            // Append row to the table body
            leaderboardBody.appendChild(row);
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


// Helper function to create logos container
function createLogosContainer(teamArray) {
    const logosContainer = document.createElement('div');
    logosContainer.className = 'logos-container';

    if (teamArray && teamArray.length > 0) {
        // Sort the team array alphabetically by team name
        teamArray.sort((a, b) => a.name.localeCompare(b.name));

        teamArray.forEach(team => {
            const logoImg = document.createElement('img');
            logoImg.src = `img/logos/${team.logo}`;
            logoImg.className = 'small-logo';

            // Add the club name as a tooltip
            logoImg.title = team.name;

            logosContainer.appendChild(logoImg);
        });
    } else {
        const noSelection = document.createElement('p');
        noSelection.textContent = 'No teams selected';
        logosContainer.appendChild(noSelection);
    }

    return logosContainer;
}



// Call the function to load the leaderboard
loadLeaderboard();
