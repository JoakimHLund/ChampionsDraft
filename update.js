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




document.getElementById('set-eliminated-button').addEventListener('click', function() {
  setEliminatedFalseForAllTeams();
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
          let teamCount = 0; // Count how many teams have been processed

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
                                  // Determine if this team gets playoffbonus
                                  let playoffbonus = false;
                                  if (leagueName === "Conference League" && teamCount < 8) {
                                      playoffbonus = true;
                                  }
                                  if (leagueName === "Champions League" && teamCount < 8) {
                                    playoffbonus = true;
                                  }
                                  if (leagueName === "Europa League" && teamCount < 8) {
                                    playoffbonus = true;
                                  }
                                  

                                  // If playoffbonus is true, bonuspoints = 5, else 0
                                  const bonuspoints = playoffbonus ? 5 : 0;

                                  // Calculate the score using the pot multiplier
                                  const multiplier = potMultipliers[teamData.pot] || 1;
                                  const score = (points * multiplier) + (bonuspoints * multiplier);

                                  const teamResult = {
                                      team: teamData.name,
                                      points: points,
                                      played: played,
                                      pot: teamData.pot,
                                      logo: teamData.logo,
                                      bonuspoints: bonuspoints,
                                      playoffbonus: playoffbonus,
                                      score: score.toFixed(1) // Keep the score to 1 decimal place
                                  };

                                  // Add or update the team in Firebase Firestore
                                  const sanitizedTeamName = teamResult.team.replace(/\//g, '_');
                                  const teamRef = db.collection(collectionName).doc(sanitizedTeamName);
                                  const doc = await teamRef.get();
                                  if (doc.exists) {
                                      await teamRef.update({
                                          points: teamResult.points,
                                          played: teamResult.played,
                                          pot: teamResult.pot,
                                          logo: teamResult.logo,
                                          originalTeamName: teamResult.team,
                                          playoffbonus: teamResult.playoffbonus,
                                          bonuspoints: teamResult.bonuspoints,
                                          score: teamResult.score
                                      });
                                      console.log(`Updated team ${teamResult.team} in ${collectionName} with points: ${teamResult.points}, score: ${teamResult.score}, playoffbonus: ${teamResult.playoffbonus}, bonuspoints: ${teamResult.bonuspoints}`);
                                  } else {
                                      await teamRef.set({
                                          team: teamResult.team,
                                          points: teamResult.points,
                                          played: teamResult.played,
                                          pot: teamResult.pot,
                                          logo: teamResult.logo,
                                          originalTeamName: teamResult.team,
                                          playoffbonus: teamResult.playoffbonus,
                                          bonuspoints: teamResult.bonuspoints,
                                          score: teamResult.score
                                      });
                                      console.log(`Created new team entry for ${teamResult.team} in ${collectionName} with playoffbonus: ${teamResult.playoffbonus}, bonuspoints: ${teamResult.bonuspoints}`);
                                  }

                                  results.push(teamResult);
                                  teamCount++; // Increment the team counter only if we actually found a matching team
                              } else {
                                  console.warn(`Team ${team} not found in ${teamsJson}`);
                                  results.push({ team, points });
                              }
                          }
                      }
                  }
              }
          }

          // Log the final results with team name, points, pot, logo, bonuspoints, playoffbonus, and score
          console.log(`${leagueName} Results:`, results);

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

  async function setEliminatedFalseForAllTeams() {
    const collections = ['ChampionsTeams', 'EuropaTeams', 'ConferenceTeams'];
  
    for (const collectionName of collections) {
      const snapshot = await db.collection(collectionName).get();
      const batch = db.batch();
      snapshot.forEach(doc => {
        batch.update(doc.ref, { eliminated: false });
      });
      await batch.commit();
      console.log(`Set eliminated = false for all teams in ${collectionName}`);
    }
  }
  
  // Add event listener to the update team counts button
  document.getElementById('update-team-counts-button').addEventListener('click', function () {
    updateTeamSelectionCounts();
  });
  