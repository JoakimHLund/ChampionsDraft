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
                        console.log(`Champion team: ${sanitizedTeamName}, Score: ${teamData.score}`);
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
            console.log('Player:', player.id, 'Champions points:', championspoints, 'Europa:', europapoints, 'Conference:', conferencepoints);

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

  document.getElementById('update-bonus-button').addEventListener('click', function () {
    updateAllTeamsBonusPoints();
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

  async function updateAllTeamsBonusPoints() {
    const collections = ['ChampionsTeams', 'EuropaTeams', 'ConferenceTeams'];
  
    for (const collectionName of collections) {
      const snapshot = await db.collection(collectionName).get();
      const batch = db.batch();
  
      snapshot.forEach(doc => {
        const teamData = doc.data();
        
        // If qfbonus doesn't exist, set it to false
        let qfbonus = (teamData.qfbonus === undefined) ? false : teamData.qfbonus;
        let sfbonus = (teamData.sfbonus === undefined) ? false : teamData.sfbonus;
        let finalbonus = (teamData.finalbonus === undefined) ? false : teamData.finalbonus;
        let winnerbonus = (teamData.winnerbonus === undefined) ? false : teamData.winnerbonus;
        let endgamepointS= (teamData.EndgameMatchPoints  === undefined)? 0 : teamData.EndgameMatchPoints;
        // Calculate bonus points
        let bonuspoints = 0;
        if (teamData.playoffbonus) bonuspoints += 5;
        if (qfbonus) bonuspoints += 4;
        if (sfbonus) bonuspoints += 6;
        if (finalbonus) bonuspoints += 8;
        if (winnerbonus) bonuspoints += 10;
  
        // Calculate new score
        const multiplier = potMultipliers[teamData.pot] || 1;
        const newScore = (teamData.points + bonuspoints + endgamepointS) * multiplier;

        // Log details to console
        console.log(`Team: ${doc.id}`);
        console.log(`  Points: ${teamData.points}`);
        console.log(`  Playoff Bonus: ${teamData.playoffbonus ? 5 : 0}`);
        console.log(`  QF Bonus: ${qfbonus ? 4 : 0}`);
        console.log(`  SF Bonus: ${sfbonus ? 6 : 0}`);
        console.log(`  Final Bonus: ${finalbonus ? 8 : 0}`);
        console.log(`  Winner Bonus: ${winnerbonus ? 10 : 0}`);
        console.log(`  Total Bonus Points: ${bonuspoints}`);
        console.log(`  Multiplier: ${multiplier}`);
        console.log(`  New Score: ${newScore.toFixed(1)}`);
  
        // Update the document in this batch
        batch.update(doc.ref, {
          qfbonus: qfbonus,
          bonuspoints: bonuspoints,
          score: newScore.toFixed(1) // keep one decimal
        });
      });
  
      // Commit the batch updates for this collection
      await batch.commit();
      console.log(`Bonus points updated for ${collectionName}`);
    }
  
    console.log("Bonus points updated for all teams!");
  }
  
  
  // Add event listener to the update team counts button
  document.getElementById('update-team-counts-button').addEventListener('click', function () {
    updateTeamSelectionCounts();
  });
  