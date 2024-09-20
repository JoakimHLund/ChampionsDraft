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
                      case "M. Tel-Aviv":
                          europaTeam.name = "Maccabi Tel Aviv";
                          updated = true;
                          break;
                      case "Ludogorets":
                          europaTeam.name = "Ludogorets Razgrad";
                          updated = true;
                          break;
                      case "Hoffenheim":
                          europaTeam.name = "TSG Hoffenheim";
                          updated = true;
                          break;
                      case "Elfsborg":
                          europaTeam.name = "Elfsborg";
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
                      case "Heidenheim":
                          conferenceTeam.name = "1. FC Heidenheim";
                          updated = true;
                          break;
                      case "Helsinki":
                          conferenceTeam.name = "HJK";
                          updated = true;
                          break;
                      case "Hearts of Midlothian":
                          conferenceTeam.name = "Heart of Midlothian";
                          updated = true;
                          break;
                      case "Petrocub":
                          conferenceTeam.name = "Petrocub Hîncești";
                          updated = true;
                          break;
                      case "Jagiellonia":
                          conferenceTeam.name = "Jagiellonia Białystok";
                          updated = true;
                          break;
                      case "Víkingur":
                          conferenceTeam.name = "Víkingur Reykjavík";
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

// Function to fetch and parse teams data (now accepts a filename)
async function getTeamsData(filename) {
  try {
      const response = await fetch(filename); // Fetch the specified JSON file
      const teams = await response.json();
      return teams;
  } catch (error) {
      console.error(`Error fetching ${filename}: `, error);
      return [];
  }
}

// Function to add or update team in Firestore (now includes sanitization)
async function addOrUpdateTeamInFirestore(teamData, collectionName) {
  // Sanitize the team name for use as a document ID
  const sanitizedTeamName = teamData.team.replace(/\//g, '_');

  const teamRef = db.collection(collectionName).doc(sanitizedTeamName);

  // Check if the document for the team already exists
  const doc = await teamRef.get();
  if (doc.exists) {
      // If the document exists, update the points and score
      await teamRef.update({
          points: teamData.points,
          played: teamData.played,
          score: teamData.score,
          pot: teamData.pot, // Optionally update the pot and logo as well
          logo: teamData.logo,
          originalTeamName: teamData.team // Store the original team name
      });
      console.log(`Updated team ${teamData.team} in ${collectionName} with points: ${teamData.points}, score: ${teamData.score}`);
  } else {
      // If the document doesn't exist, create a new one
      await teamRef.set({
          team: teamData.team,
          points: teamData.points,
          played: teamData.played,
          score: teamData.score,
          pot: teamData.pot,
          logo: teamData.logo,
          originalTeamName: teamData.team // Store the original team name
      });
      console.log(`Created new team entry for ${teamData.team} in ${collectionName}`);
  }
}


// Common function to fetch and process league data
async function fetchLeagueData(leagueName, url, teamsJson, collectionName, buttonId) {
  document.getElementById(buttonId).addEventListener('click', async () => {
      try {
          const statusElement = document.getElementById('update-status');
          statusElement.textContent = `Fetching ${leagueName} results...`;

          // Cache-busting parameter
          const cacheBuster = new Date().getTime();

          // Fetch the Wikipedia page through CORS proxy with cache-busting
          const response = await fetch(`https://corsproxy.io/?${url}?_=${cacheBuster}`);
          const html = await response.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');

          // Fetch teams data from the specified JSON file
          const teamsData = await getTeamsData(teamsJson);

          // Select all wikitable sortable tables
          const tables = doc.querySelectorAll('.wikitable');

          // Identify the specific tables based on headers or unique structure
          const targetTables = [];
          tables.forEach(table => {
              const headerRow = table.querySelector('tr');
              if (headerRow && headerRow.innerText.includes("Pos")) {
                  targetTables.push(table);
              }
          });

          if (targetTables.length === 0) {
              throw new Error("No matching tables found!");
          }

          const results = [];

          // Loop through each target table
          for (const targetTable of targetTables) {
              // Parse the table rows and extract data
              const rows = targetTable.querySelectorAll('tr');

              for (const row of rows) {
                  const cells = row.querySelectorAll('td, th');

                  if (cells.length >= 10) {
                      const teamCell = cells[1];  // Team name is in the second cell

                      // Check if the <a> tag exists within the cell
                      const links = teamCell.querySelectorAll('a');
                      const teamLink = links[links.length - 1];
                      if (teamLink) {
                          const team = teamLink.innerText.trim();

                          if (team && team !== "GD" && team !== "e") {
                              const playedText = cells[2].innerText.trim();
                              const played = parseFloat(playedText) || 0;
                              const pointsText = cells[9].innerText.trim(); // Points are in the 10th column
                              const points = parseFloat(pointsText) || 0;

                              // Find the matching team in the teams data
                              const teamData = teamsData.find(t => t.name === team);

                              if (teamData) {
                                  // Calculate the score using the pot multiplier
                                  const multiplier = potMultipliers[teamData.pot] || 1;
                                  const score = points * multiplier;

                                  const teamResult = {
                                      team: teamData.name,
                                      points: points,
                                      played:played,
                                      pot: teamData.pot,
                                      logo: teamData.logo,
                                      score: score.toFixed(1) // Keep the score to 1 decimal place
                                  };

                                  // Add or update the team in Firebase Firestore
                                  await addOrUpdateTeamInFirestore(teamResult, collectionName);

                                  results.push(teamResult);
                              } else {
                                  console.warn(`Team ${team} not found in ${teamsJson}`);
                                  results.push({ team, points });
                              }
                          }
                      }
                  }
              }
          }

          // Log the final results with team name, points, pot, logo, and score
          console.log(`${leagueName} Results with Pot, Logo, and Score:`, results);

          statusElement.textContent = `${leagueName} results fetched successfully!`;
      } catch (error) {
          console.error(`Error fetching ${leagueName} results: `, error);
          document.getElementById('update-status').textContent = `Failed to fetch ${leagueName} results!`;
      }
  });
}

// Champions League
fetchLeagueData(
  "Champions League",
  "https://en.wikipedia.org/wiki/2024–25_UEFA_Champions_League",
  "teams.json",
  "ChampionsTeams",
  "update-champions-button"
);

// Europa League
fetchLeagueData(
  "Europa League",
  "https://en.wikipedia.org/wiki/2024–25_UEFA_Europa_League",
  "europa.json",
  "EuropaTeams",
  "update-europa-button"
);

// Conference League
fetchLeagueData(
  "Conference League",
  "https://en.wikipedia.org/wiki/2024–25_UEFA_Europa_Conference_League",
  "conference.json",
  "ConferenceTeams",
  "update-conference-button"
);

// Function to update leaderboard by calculating points
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
          let europapoints = 0;
          let conferencepoints = 0;

          // Loop through each selected Champions League team for the player
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

          // Loop through each selected Europa League team for the player
          if (playerData.selectedEuropa) {
              for (const europa of playerData.selectedEuropa) {
                  // Find the same team in the EuropaTeams collection
                  const teamDoc = await db.collection('EuropaTeams').doc(europa.name).get();

                  if (teamDoc.exists) {
                      const teamData = teamDoc.data();
                      europapoints += parseFloat(teamData.score); // Add the team's score to europapoints
                  }
              }
          }

          // Loop through each selected Conference League team for the player
          if (playerData.selectedConference) {
              for (const conference of playerData.selectedConference) {
                  // Find the same team in the ConferenceTeams collection
                  const teamDoc = await db.collection('ConferenceTeams').doc(conference.name).get();

                  if (teamDoc.exists) {
                      const teamData = teamDoc.data();
                      conferencepoints += parseFloat(teamData.score); // Add the team's score to conferencepoints
                  }
              }
          }

          // Calculate totalpoints (sum of championspoints, europapoints, and conferencepoints)
          const totalpoints = championspoints + europapoints + conferencepoints;

          // Update the player's points in Firestore
          await db.collection('players').doc(playerDoc.id).update({
              championspoints: championspoints,
              europapoints: europapoints,
              conferencepoints: conferencepoints,
              totalpoints: totalpoints
          });

          console.log(`Updated player ${playerData.name} with championspoints: ${championspoints}, europapoints: ${europapoints}, conferencepoints: ${conferencepoints}, and totalpoints: ${totalpoints}`);
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
