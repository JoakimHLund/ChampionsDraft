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
              case "AC Milan":
                champion.name = "Milan";
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
    updatePlayers();
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

async function updateLeaderboard() {
    try {
        const statusElement = document.getElementById('update-status');
        statusElement.textContent = "Updating leaderboard...";

        // Fetch all players from the players collection
        const playersSnapshot = await db.collection('players').get();
        const players = playersSnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));

        // Collect all unique team names from all players
        const teamNames = {
            champions: new Set(),
            europa: new Set(),
            conference: new Set()
        };

        players.forEach(player => {
            if (player.data.selectedChampions) {
                player.data.selectedChampions.forEach(team => {
                    const sanitizedTeamName = team.name.replace(/\//g, '_');
                    teamNames.champions.add(sanitizedTeamName);
                });
            }
            if (player.data.selectedEuropa) {
                player.data.selectedEuropa.forEach(team => {
                    const sanitizedTeamName = team.name.replace(/\//g, '_');
                    teamNames.europa.add(sanitizedTeamName);
                });
            }
            if (player.data.selectedConference) {
                player.data.selectedConference.forEach(team => {
                    const sanitizedTeamName = team.name.replace(/\//g, '_');
                    teamNames.conference.add(sanitizedTeamName);
                });
            }
        });

        // Fetch all team documents in batch
        const [championsTeams, europaTeams, conferenceTeams] = await Promise.all([
            fetchTeamsInBatch('ChampionsTeams', teamNames.champions),
            fetchTeamsInBatch('EuropaTeams', teamNames.europa),
            fetchTeamsInBatch('ConferenceTeams', teamNames.conference)
        ]);

        // Create maps for quick lookup
        const championsTeamMap = createTeamMap(championsTeams);
        const europaTeamMap = createTeamMap(europaTeams);
        const conferenceTeamMap = createTeamMap(conferenceTeams);

        // Batch write to update players
        const batch = db.batch();

        players.forEach(player => {
            let championspoints = 0;
            let europapoints = 0;
            let conferencepoints = 0;

            if (player.data.selectedChampions) {
                player.data.selectedChampions.forEach(team => {
                    const sanitizedTeamName = team.name.replace(/\//g, '_');
                    const teamData = championsTeamMap[sanitizedTeamName];
                    if (teamData) {
                        championspoints += parseFloat(teamData.score);
                    }
                });
            }

            if (player.data.selectedEuropa) {
                player.data.selectedEuropa.forEach(team => {
                    const sanitizedTeamName = team.name.replace(/\//g, '_');
                    const teamData = europaTeamMap[sanitizedTeamName];
                    if (teamData) {
                        europapoints += parseFloat(teamData.score);
                    }
                });
            }

            if (player.data.selectedConference) {
                player.data.selectedConference.forEach(team => {
                    const sanitizedTeamName = team.name.replace(/\//g, '_');
                    const teamData = conferenceTeamMap[sanitizedTeamName];
                    if (teamData) {
                        conferencepoints += parseFloat(teamData.score);
                    }
                });
            }

            const totalpoints = championspoints + europapoints + conferencepoints;

            const playerRef = db.collection('players').doc(player.id);
            batch.update(playerRef, {
                championspoints: championspoints,
                europapoints: europapoints,
                conferencepoints: conferencepoints,
                totalpoints: totalpoints
            });
        });

        // Commit the batch
        await batch.commit();

        statusElement.textContent = "Leaderboard updated successfully!";
    } catch (error) {
        console.error("Error updating leaderboard: ", error);
        document.getElementById('update-status').textContent = "Error updating leaderboard!";
    }
}

// Helper function to fetch team documents in batch
async function fetchTeamsInBatch(collectionName, teamNamesSet) {
    const teamNamesArray = Array.from(teamNamesSet);
    const teamDocs = [];
    const batchSize = 10; // Firestore allows up to 10 in 'in' queries

    for (let i = 0; i < teamNamesArray.length; i += batchSize) {
        const batchNames = teamNamesArray.slice(i, i + batchSize);
        const querySnapshot = await db.collection(collectionName)
            .where(firebase.firestore.FieldPath.documentId(), 'in', batchNames)
            .get();
        teamDocs.push(...querySnapshot.docs);
    }

    return teamDocs;
}

// Helper function to create a map of team data
function createTeamMap(teamDocs) {
    const teamMap = {};
    teamDocs.forEach(doc => {
        teamMap[doc.id] = doc.data();
    });
    return teamMap;
}

  
  // Add event listener to the update leaderboard button
  document.getElementById('update-leaderboard-button').addEventListener('click', function () {
    updateLeaderboard();
  });
  

  // Function to update the 'selectedBy' count for each team
async function updateTeamSelectionCounts() {
    try {
      const statusElement = document.getElementById('update-status');
      statusElement.textContent = 'Updating team selection counts...';
  
      // Initialize counts for each team collection
      const championsTeamCounts = {};
      const europaTeamCounts = {};
      const conferenceTeamCounts = {};
  
      // Fetch all players
      const playersSnapshot = await db.collection('players').get();
  
      playersSnapshot.forEach(playerDoc => {
        const playerData = playerDoc.data();
  
        // Process selectedChampions
        if (playerData.selectedChampions) {
          playerData.selectedChampions.forEach(team => {
            const sanitizedTeamName = team.name.replace(/\//g, '_');
            if (championsTeamCounts[sanitizedTeamName]) {
              championsTeamCounts[sanitizedTeamName] += 1;
            } else {
              championsTeamCounts[sanitizedTeamName] = 1;
            }
          });
        }
  
        // Process selectedEuropa
        if (playerData.selectedEuropa) {
          playerData.selectedEuropa.forEach(team => {
            const sanitizedTeamName = team.name.replace(/\//g, '_');
            if (europaTeamCounts[sanitizedTeamName]) {
              europaTeamCounts[sanitizedTeamName] += 1;
            } else {
              europaTeamCounts[sanitizedTeamName] = 1;
            }
          });
        }
  
        // Process selectedConference
        if (playerData.selectedConference) {
          playerData.selectedConference.forEach(team => {
            const sanitizedTeamName = team.name.replace(/\//g, '_');
            if (conferenceTeamCounts[sanitizedTeamName]) {
              conferenceTeamCounts[sanitizedTeamName] += 1;
            } else {
              conferenceTeamCounts[sanitizedTeamName] = 1;
            }
          });
        }
      });
  
      // Function to update the teams in a collection with the counts
      async function updateTeamCountsInCollection(collectionName, teamCounts) {
        // Fetch all teams in the collection
        const teamsSnapshot = await db.collection(collectionName).get();
  
        const batch = db.batch();
  
        teamsSnapshot.forEach(teamDoc => {
          const teamId = teamDoc.id;
          const selectedByCount = teamCounts[teamId] || 0;
  
          batch.update(teamDoc.ref, { selectedBy: selectedByCount });
        });
  
        // Commit the batch update
        await batch.commit();
      }
  
      // Update counts in each collection
      await updateTeamCountsInCollection('ChampionsTeams', championsTeamCounts);
      await updateTeamCountsInCollection('EuropaTeams', europaTeamCounts);
      await updateTeamCountsInCollection('ConferenceTeams', conferenceTeamCounts);
  
      statusElement.textContent = 'Team selection counts updated successfully!';
    } catch (error) {
      console.error("Error updating team selection counts: ", error);
      document.getElementById('update-status').textContent = 'Error updating team selection counts';
    }
  }
  
  // Add event listener to the update team counts button
  document.getElementById('update-team-counts-button').addEventListener('click', function () {
    updateTeamSelectionCounts();
  });
  