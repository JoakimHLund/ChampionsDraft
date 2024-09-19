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


// Function to update the player's selectedChampions
async function updatePlayers() {
    try {
      const statusElement = document.getElementById('update-status');
      statusElement.textContent = 'Updating...';
      
      // Fetch all players
      const playersSnapshot = await db.collection('players').get();
      
      playersSnapshot.forEach(async (playerDoc) => {
        const playerData = playerDoc.data();
        
        // Check if selectedChampions exists
        if (playerData.selectedChampions) {
          let updated = false;
          const updatedChampions = playerData.selectedChampions.map(champion => {
            // Check for specific team names and update them
            switch(champion.name) {
              case "GNK Dinamo":
                champion.name = "Dinamo Zagreb";
                updated = true;
                break;
              case "Bayern München":
                champion.name = "Bayern Munich";
                updated = true;
                break;
              case "Inter":
                champion.name = "Inter Milan";
                updated = true;
                break;
              case "Dortmund":
                champion.name = "Borussia Dortmund";
                updated = true;
                break;
              case "Leipzig":
                champion.name = "RB Leipzig";
                updated = true;
                break;
              case "Leverkusen":
                champion.name = "Bayer Leverkusen";
                updated = true;
                break;
              case "Atlético de Madrid":
                champion.name = "Atlético Madrid";
                updated = true;
                break;
              case "Salzburg":
                champion.name = "Red Bull Salzburg";
                updated = true;
                break;
              case "Crvena Zvezda":
                champion.name = "Red Star Belgrade";
                updated = true;
                break;
              case "Sparta Praha":
                champion.name = "Sparta Prague";
                updated = true;
                break;
              case "Stuttgart":
                champion.name = "VfB Stuttgart";
                updated = true;
                break;
            }
            return champion;
          });
  
          // If any updates were made, update Firestore
          if (updated) {
            await db.collection('players').doc(playerDoc.id).update({
              selectedChampions: updatedChampions
            });
            console.log(`Updated player ${playerDoc.id}`);
          }
        }
      });
      
      statusElement.textContent = 'Update complete!';
    } catch (error) {
      console.error("Error updating players: ", error);
      document.getElementById('update-status').textContent = 'Error updating players';
    }
  }

 // Function to update the player's selectedEuropa
async function updatePlayersEuropa() {
  try {
      const statusElement = document.getElementById('update-status');
      statusElement.textContent = 'Updating Europa teams...';

      // Fetch all players
      const playersSnapshot = await db.collection('players').get();

      playersSnapshot.forEach(async (playerDoc) => {
          const playerData = playerDoc.data();

          // Check if selectedEuropa exists
          if (playerData.selectedEuropa) {
              let updated = false;
              const updatedEuropa = playerData.selectedEuropa.map(europaTeam => {
                  // Check for specific team names and update them
                  switch(europaTeam.name) {
                      case "Athletic Club":
                          europaTeam.name = "Athletic Bilbao";
                          updated = true;
                          break;
                      case "Frankfurt":
                          europaTeam.name = "Eintracht Frankfurt";
                          updated = true;
                          break;
                      case "AZ Alkmaar":
                          europaTeam.name = "AZ";
                          updated = true;
                          break;
                      case "Tottenham":
                          europaTeam.name = "Tottenham Hotspur";
                          updated = true;
                          break;
                      case "Slavia Praha":
                          europaTeam.name = "Slavia Prague";
                          updated = true;
                          break;
                      case "Union SG":
                          europaTeam.name = "Union Saint-Gilloise";
                          updated = true;
                          break;
                      case "Malmö":
                          europaTeam.name = "Malmö FF";
                          updated = true;
                          break;
                  }
                  return europaTeam;
              });

              // If any updates were made, update Firestore
              if (updated) {
                  await db.collection('players').doc(playerDoc.id).update({
                      selectedEuropa: updatedEuropa
                  });
                  console.log(`Updated player ${playerDoc.id} Europa teams`);
              }
          }
      });

      statusElement.textContent = 'Europa teams update complete!';
  } catch (error) {
      console.error("Error updating Europa teams: ", error);
      document.getElementById('update-status').textContent = 'Error updating Europa teams';
  }
}

async function updatePlayersConference() {
  try {
      const statusElement = document.getElementById('update-status');
      statusElement.textContent = 'Updating Conference teams...';

      // Fetch all players
      const playersSnapshot = await db.collection('players').get();

      playersSnapshot.forEach(async (playerDoc) => {
          const playerData = playerDoc.data();

          // Check if selectedConference exists
          if (playerData.selectedConference) {
              let updated = false;
              const updatedConference = playerData.selectedConference.map(conferenceTeam => {
                  // Check for specific team names and update them to the longer versions
                  switch(conferenceTeam.name) {
                      case "Başakşehir":
                          conferenceTeam.name = "İstanbul Başakşehir";
                          updated = true;
                          break;
                      case "Legia Warszawa":
                          conferenceTeam.name = "Legia Warsaw";
                          updated = true;
                          break;
                      case "Djurgården":
                          conferenceTeam.name = "Djurgårdens IF";
                          updated = true;
                          break;
                      case "SK Rapid":
                          conferenceTeam.name = "Rapid Wien";
                          updated = true;
                          break;
                      case "Omonoia":
                          conferenceTeam.name = "Omonia";
                          updated = true;
                          break;
                      case "Vitória SC":
                          conferenceTeam.name = "Vitória de Guimarães";
                          updated = true;
                          break;
                      case "Olimpija":
                          conferenceTeam.name = "Olimpija Ljubljana";
                          updated = true;
                          break;
                      case "Hearts":
                          conferenceTeam.name = "Heart of Midlothian";
                          updated = true;
                          break;
                      case "Borac":
                          conferenceTeam.name = "Borac Banja Luka";
                          updated = true;
                          break;
                      case "Dinamo-Minsk":
                          conferenceTeam.name = "Dinamo Minsk";
                          updated = true;
                          break;
                  }
                  return conferenceTeam;
              });

              // If any updates were made, update Firestore
              if (updated) {
                  await db.collection('players').doc(playerDoc.id).update({
                      selectedConference: updatedConference
                  });
                  console.log(`Updated player ${playerDoc.id} Conference teams`);
              }
          }
      });

      statusElement.textContent = 'Conference teams update complete!';
  } catch (error) {
      console.error("Error updating Conference teams: ", error);
      document.getElementById('update-status').textContent = 'Error updating Conference teams';
  }
}


  
  // Add event listener to the update button
  document.getElementById('update-names-button').addEventListener('click', function () {
    updatePlayersConference();
  });


// Pot multipliers based on the pot value
const potMultipliers = {
    1: 1,
    2: 1.5,
    3: 2,
    4: 2.5,
    5: 3,
    6: 3.5
};

// Function to fetch and parse teams.json
async function getTeamsData() {
    try {
        const response = await fetch('teams.json'); // Update the path to your actual teams.json location
        const teams = await response.json();
        return teams;
    } catch (error) {
        console.error("Error fetching teams.json: ", error);
        return [];
    }
}

// Function to add or update team in Firestore
async function addOrUpdateTeamInFirestore(teamData) {
    const teamRef = db.collection('ChampionsTeams').doc(teamData.team);

    // Check if the document for the team already exists
    const doc = await teamRef.get();
    if (doc.exists) {
        // If the document exists, update the points and score
        await teamRef.update({
            points: teamData.points,
            score: teamData.score,
            pot: teamData.pot, // Optionally update the pot and logo as well
            logo: teamData.logo
        });
        console.log(`Updated team ${teamData.team} with points: ${teamData.points}, score: ${teamData.score}`);
    } else {
        // If the document doesn't exist, create a new one
        await teamRef.set({
            team: teamData.team,
            points: teamData.points,
            score: teamData.score,
            pot: teamData.pot,
            logo: teamData.logo
        });
        console.log(`Created new team entry for ${teamData.team}`);
    }
}

// Modify the update-champions button event listener
document.getElementById('update-champions-button').addEventListener('click', async () => {
    try {
        const statusElement = document.getElementById('update-status');
        statusElement.textContent = "Fetching Champions League results...";

        // Cache-busting parameter
        const cacheBuster = new Date().getTime();

        // Fetch the Wikipedia page through CORS proxy with cache-busting
        const response = await fetch(`https://corsproxy.io/?https://en.wikipedia.org/wiki/2024–25_UEFA_Champions_League?_=${cacheBuster}`);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Fetch teams data from teams.json
        const teamsData = await getTeamsData();

        // Select the correct table by its class or position (adjust as needed)
        const tables = doc.querySelectorAll('.wikitable');
        let targetTable = null;

        // Identify the specific table based on headers or unique structure
        tables.forEach(table => {
            const headerRow = table.querySelector('tr');
            if (headerRow && headerRow.innerText.includes("Pos")) {
                targetTable = table;
            }
        });

        if (!targetTable) {
            throw new Error("Table not found!");
        }

        // Parse the table rows and extract data
        const rows = targetTable.querySelectorAll('tr');
        const results = [];

        rows.forEach(async (row, rowIndex) => {
            const cells = row.querySelectorAll('td, th');

            if (cells.length >= 9) {
                const teamCell = cells[1];  // Team name is in the second cell (usually a <th>)

                // Check if the <a> tag exists within the <th>
                const links = teamCell.querySelectorAll('a');
                const teamLink = links[links.length - 1];
                if (teamLink) {
                    const team = teamLink.innerText.trim();

                    if (team && team !== "GD" && team !== "e") {
                        const points = parseFloat(cells[9].innerText.trim()); // Points are in the ninth column and ensure it's a number
                        
                        // Find the matching team in teams.json
                        const teamData = teamsData.find(t => t.name === team);
                        
                        if (teamData) {
                            // Calculate the score using the pot multiplier
                            const multiplier = potMultipliers[teamData.pot] || 1;
                            const score = points * multiplier;

                            const teamResult = {
                                team: teamData.name,
                                points: points,
                                pot: teamData.pot,
                                logo: teamData.logo,
                                score: score.toFixed(1) // Keep the score to 1 decimal places
                            };

                            // Add or update the team in Firebase Firestore
                            await addOrUpdateTeamInFirestore(teamResult);

                            results.push(teamResult);
                        } else {
                            results.push({ team, points }); // In case the team is not found in teams.json
                        }
                    }
                }
            }
        });

        // Log the final results with team name, points, pot, logo, and score
        console.log("Final Results with Pot, Logo, and Score:", results);

        statusElement.textContent = "Results fetched successfully!";
    } catch (error) {
        console.error("Error fetching results: ", error);
        document.getElementById('update-status').textContent = "Failed to fetch results!";
    }
});


// Function to update leaderboard by calculating championspoints and totalpoints
async function updateLeaderboard() {
    try {
        const statusElement = document.getElementById('update-status');
        statusElement.textContent = "Updating leaderboard...";

        // Fetch all players from the players collection
        const playersSnapshot = await db.collection('players').get();
        
        // Loop through each player
        for (const playerDoc of playersSnapshot.docs) {
            const playerData = playerDoc.data();
            let championspoints = 0;

            // Loop through each selected champion team for the player
            if (playerData.selectedChampions) {
                for (const champion of playerData.selectedChampions) {
                    // Find the same team in the ChampionsTeams collection
                    const teamDoc = await db.collection('ChampionsTeams').doc(champion.name).get();
                    
                    if (teamDoc.exists) {
                        const teamData = teamDoc.data();
                        championspoints += parseFloat(teamData.score); // Add the team's score to championspoints
                    }
                }
            }

            // Calculate totalpoints (sum of championspoints, europapoints, and conferencepoints)
            const totalpoints = championspoints + (playerData.europapoints || 0) + (playerData.conferencepoints || 0);

            // Update the player's points in Firestore
            await db.collection('players').doc(playerDoc.id).update({
                championspoints: championspoints,
                totalpoints: totalpoints
            });

            console.log(`Updated player ${playerData.name} with championspoints: ${championspoints} and totalpoints: ${totalpoints}`);
        }

        statusElement.textContent = "Leaderboard updated successfully!";
    } catch (error) {
        console.error("Error updating leaderboard: ", error);
        document.getElementById('update-status').textContent = "Error updating leaderboard!";
    }
}

// Add event listener to the update leaderboard button
document.getElementById('update-leaderboard-button').addEventListener('click', function () {
    updateLeaderboard();
});
