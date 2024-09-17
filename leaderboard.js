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

// Function to fetch players data and populate the leaderboard
function loadLeaderboard() {
    db.collection("players").orderBy("totalpoints", "desc").get().then((querySnapshot) => {
        const leaderboardBody = document.getElementById('leaderboard-body');
        leaderboardBody.innerHTML = ''; // Clear existing content

        let rank = 1;

        querySnapshot.forEach((doc) => {
            const playerData = doc.data();

            // Format the name as "[Department] Name" if department is present
            let playerName = playerData.Name;
            if (playerData.Department && playerData.Department.trim() !== '') {
                playerName = `[${playerData.Department}] ${playerName}`;
            }

            // Create a table row
            const row = document.createElement('tr');

            // Create cells
            const rankCell = document.createElement('td');
            rankCell.textContent = rank;

            const nameCell = document.createElement('td');
            nameCell.textContent = playerName;

            // Champions Selection Cell
            const championsSelectionCell = document.createElement('td');
            const championsLogosContainer = createLogosContainer(playerData.selectedChampions);
            championsSelectionCell.appendChild(championsLogosContainer);

            // Europa Selection Cell
            const europaSelectionCell = document.createElement('td');
            const europaLogosContainer = createLogosContainer(playerData.selectedEuropa);
            europaSelectionCell.appendChild(europaLogosContainer);

            // Conference Selection Cell
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
            totalPointsCell.textContent = playerData.totalpoints || 0;

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

            rank++;
        });
    }).catch((error) => {
        console.error("Error getting documents: ", error);
    });
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
