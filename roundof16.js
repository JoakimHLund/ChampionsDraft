// Firebase setup
const firebaseConfig = {
    apiKey: "AIzaSyC36DXqx9qnp1TjMGNX32Nm1p9uGXp62ZA",
    authDomain: "championsdraft-403d0.firebaseapp.com",
    projectId: "championsdraft-403d0",
    storageBucket: "championsdraft-403d0.appspot.com",
    messagingSenderId: "766027841647",
    appId: "1:766027841647:web:99ef32b25549054b218d9a"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Get league from URL
const urlParams = new URLSearchParams(window.location.search);
const league = urlParams.get("league");

if (!league) {
    alert("No league specified in URL!");
} else {
    document.getElementById("league-title").innerText = `${league} Round of 16 Matches`;
    loadMatches();
}

// Load matches from Firestore
async function loadMatches() {
    try {
        const matchesSnapshot = await db.collection("roundof16matches")
            .where("league", "==", league)
            .get();

        let existingMatches = {};

        if (!matchesSnapshot.empty) {
            matchesSnapshot.forEach(doc => {
                let data = doc.data();
                let matchIndex = data.matchIndex;

                if (!existingMatches[matchIndex]) {
                    existingMatches[matchIndex] = {};
                }
                existingMatches[matchIndex][data.matchday] = {
                    id: doc.id,
                    team1: data.team1,
                    team2: data.team2,
                    winner: data.winner || ""
                };
            });

            console.log("Existing matches fetched:", existingMatches);
        }

        loadTeams(existingMatches);
    } catch (error) {
        console.error("Error fetching matches:", error);
    }
}

// Load teams from Firestore
async function loadTeams(existingMatches) {
    try {
        const teamsRef = db.collection(`${league}Teams`);
        const teamsSnapshot = await teamsRef
            .get();

        let teams = [];
        teamsSnapshot.forEach(doc => {
            let teamData = doc.data();
            teams.push({ id: doc.id, name: teamData.originalTeamName });
        });

        console.log("Teams fetched:", teams);
        createMatchdayUI("matchday1", "matchday2", teams, existingMatches);
    } catch (error) {
        console.error("Error fetching teams:", error);
    }
}

// Create Matchday UI with Working "Set" and "Set Winner" Buttons
function createMatchdayUI(matchday1ContainerId, matchday2ContainerId, teams, existingMatches) {
    const matchday1Container = document.getElementById(matchday1ContainerId);
    const matchday2Container = document.getElementById(matchday2ContainerId);

    for (let i = 0; i < 8; i++) {
        let match1Div = document.createElement("div");
        let match2Div = document.createElement("div");

        let existingMatch1 = existingMatches[i] && existingMatches[i][1];
        let existingMatch2 = existingMatches[i] && existingMatches[i][2];

        // Matchday 1 UI
        match1Div.innerHTML = `
            <select class="team-select team1" ${existingMatch1 ? "disabled" : ""}>
                ${teams.map(team => 
                    `<option value="${team.id}" ${existingMatch1 && existingMatch1.team1 === team.id ? "selected" : ""}>
                        ${team.name}
                    </option>`).join("")}
            </select>
            vs.
            <select class="team-select team2" ${existingMatch1 ? "disabled" : ""}>
                ${teams.map(team => 
                    `<option value="${team.id}" ${existingMatch1 && existingMatch1.team2 === team.id ? "selected" : ""}>
                        ${team.name}
                    </option>`).join("")}
            </select>
            <button class="set-match" ${existingMatch1 ? "disabled" : ""}>Set</button>

            <select class="winner-select" ${existingMatch1?.winner ? "disabled" : ""}>
                <option value="">Select Winner</option>
                <option value="${existingMatch1?.team1 || ''}" ${existingMatch1?.winner === existingMatch1?.team1 ? "selected" : ""}>${existingMatch1 ? teams.find(t => t.id === existingMatch1.team1)?.name : "Team 1"}</option>
                <option value="${existingMatch1?.team2 || ''}" ${existingMatch1?.winner === existingMatch1?.team2 ? "selected" : ""}>${existingMatch1 ? teams.find(t => t.id === existingMatch1.team2)?.name : "Team 2"}</option>
                <option value="draw" ${existingMatch1?.winner === "draw" ? "selected" : ""}>Draw</option>
            </select>
            <button class="set-winner" ${existingMatch1?.winner ? "disabled" : ""}>Set Winner</button>
        `;

        // Matchday 2 UI (Reversed teams)
        match2Div.innerHTML = `
            <span class="team1-text">${existingMatch2 ? teams.find(t => t.id === existingMatch2.team2)?.name || "Team 2" : "Team 2"}</span> 
            vs. 
            <span class="team2-text">${existingMatch2 ? teams.find(t => t.id === existingMatch2.team1)?.name || "Team 1" : "Team 1"}</span>

            <select class="winner-select" ${existingMatch2?.winner ? "disabled" : ""}>
                <option value="">Select Winner</option>
                <option value="${existingMatch2?.team1 || ''}" ${existingMatch2?.winner === existingMatch2?.team1 ? "selected" : ""}>${existingMatch2 ? teams.find(t => t.id === existingMatch2.team1)?.name : "Team 1"}</option>
                <option value="${existingMatch2?.team2 || ''}" ${existingMatch2?.winner === existingMatch2?.team2 ? "selected" : ""}>${existingMatch2 ? teams.find(t => t.id === existingMatch2.team2)?.name : "Team 2"}</option>
                <option value="draw" ${existingMatch2?.winner === "draw" ? "selected" : ""}>Draw</option>
            </select>
            <button class="set-winner" ${existingMatch2?.winner ? "disabled" : ""}>Set Winner</button>
        `;

        // Wrap in a styled container
        let matchContainer1 = document.createElement("div");
        matchContainer1.classList.add("match-container");

        let matchContainer2 = document.createElement("div");
        matchContainer2.classList.add("match-container", "matchday2-container");

        matchContainer1.appendChild(match1Div);
        matchContainer2.appendChild(match2Div);

        matchday1Container.appendChild(matchContainer1);
        matchday2Container.appendChild(matchContainer2);

        // Attach Event Listener to "Set" Button
        if (!existingMatch1) {
            match1Div.querySelector(".set-match").addEventListener("click", async function () {
                const team1Select = match1Div.querySelector(".team1");
                const team2Select = match1Div.querySelector(".team2");

                const team1 = team1Select.value;
                const team2 = team2Select.value;
                const team1Text = team1Select.options[team1Select.selectedIndex].text;
                const team2Text = team2Select.options[team2Select.selectedIndex].text;

                if (team1 === team2) {
                    alert("Teams must be different!");
                    return;
                }

                try {
                    const match1Ref = await db.collection("roundof16matches").add({
                        league: league,
                        matchday: 1,
                        matchIndex: i,
                        team1: team1,
                        team2: team2
                    });

                    const match2Ref = await db.collection("roundof16matches").add({
                        league: league,
                        matchday: 2,
                        matchIndex: i,
                        team1: team2,
                        team2: team1
                    });

                    match2Div.querySelector(".team1-text").innerText = team2Text;
                    match2Div.querySelector(".team2-text").innerText = team1Text;

                    team1Select.disabled = true;
                    team2Select.disabled = true;
                    this.disabled = true;
                    this.innerText = "Set";

                    console.log(`Match ${i} set: ${team1Text} vs. ${team2Text}`);
                } catch (error) {
                    console.error("Error saving match:", error);
                }
            });
        }

        // Attach Event Listener to "Set Winner" Button
        match1Div.querySelector(".set-winner").addEventListener("click", async function () {
            let winnerSelect = match1Div.querySelector(".winner-select");
            let winner = winnerSelect.value;

            if (!winner) {
                alert("Please select a winner.");
                return;
            }

            await db.collection("roundof16matches").doc(existingMatch1?.id).update({ winner });

            winnerSelect.disabled = true;
            this.disabled = true;
            this.innerText = "Set";
        });

        match2Div.querySelector(".set-winner").addEventListener("click", async function () {
            let winnerSelect = match2Div.querySelector(".winner-select");
            let winner = winnerSelect.value;

            if (!winner) {
                alert("Please select a winner.");
                return;
            }

            await db.collection("roundof16matches").doc(existingMatch2?.id).update({ winner });

            winnerSelect.disabled = true;
            this.disabled = true;
            this.innerText = "Set";
        });
    }
}

// Update Eliminations button
const updateEliminationsBtn = document.createElement("button");
updateEliminationsBtn.id = "update-eliminations";
updateEliminationsBtn.innerText = "Update Eliminations";
document.body.appendChild(updateEliminationsBtn);

updateEliminationsBtn.addEventListener("click", async function () {
    await updateEliminations();
});

// Function to update eliminated teams
async function updateEliminations() {
    try {
        const matchesSnapshot = await db.collection("roundof16matches")
            .where("league", "==", league)
            .get();

        if (matchesSnapshot.empty) {
            alert("No matches found.");
            return;
        }

        let teamsInMatches = new Set();

        // Collect all teams that are in matches
        matchesSnapshot.forEach(doc => {
            let data = doc.data();
            teamsInMatches.add(data.team1);
            teamsInMatches.add(data.team2);
        });

        console.log("Teams in matches:", teamsInMatches);

        const teamsRef = db.collection(`${league}Teams`);
        const teamsSnapshot = await teamsRef.get();

        let eliminatedTeams = [];

        for (const doc of teamsSnapshot.docs) {
            let teamData = doc.data();
            let teamId = doc.id;

            if (!teamsInMatches.has(teamId)) {
                await teamsRef.doc(teamId).update({ eliminated: true });
                eliminatedTeams.push(teamData.originalTeamName);
            }
        }

        alert(`Eliminations updated. Eliminated teams: ${eliminatedTeams.join(", ")}`);
        console.log(`Eliminated teams:`, eliminatedTeams);
    } catch (error) {
        console.error("Error updating eliminations:", error);
        alert("Error updating eliminations. See console for details.");
    }
}

// Pot multipliers
const potMultipliers = {
    1: 1,
    2: 1.5,
    3: 2,
    4: 2.5,
    5: 3,
    6: 3.5
};

// Get the "Update Table" button
document.getElementById("update-table").addEventListener("click", async function () {
    await updateEndgameMatchPoints();
});

// Function to update EndgameMatchPoints and Score from both collections
async function updateEndgameMatchPoints() {
    try {
        const collections = ["playoffmatches", "roundof16matches"];
        let teamPoints = {}; 
        // Keeps track if a specific doc has been processed in this function call.
        // Key it by 'collection_matchIndex' so that "roundof16matches_3" is distinct 
        // from "playoffmatches_3".
        let processedMatches = {};

        for (const collection of collections) {
            const matchesSnapshot = await db.collection(collection)
                .where("league", "==", league)
                .get();

            if (matchesSnapshot.empty) {
                console.log(`No matches found in ${collection}.`);
                continue;
            }

            for (const doc of matchesSnapshot.docs) {
                let data = doc.data();

                // Skip if there's no winner/team info yet
                if (!data.winner || !data.team1 || !data.team2) continue;

                // Create a combined key so "roundof16matches_3" != "playoffmatches_3"
                const combinedKey = `${collection}_${data.matchIndex}`;
                
                // Skip if we've handled this doc in the *same* run 
                // (for safety if you re-run in one button click)
                if (processedMatches[combinedKey]) {
                    console.log(`Already processed ${combinedKey}; skipping...`);
                    continue;
                }

                // Also skip if this doc was previously updated in Firestore
                // (so we don't double-count across multiple runs)
                if (data.pointsUpdated) {
                    console.log(`Match ${data.matchIndex} in ${collection} was already counted previously.`);
                    continue;
                }

                // Make sure to record we've processed it *this run*, to avoid duplicates in the loop
                processedMatches[combinedKey] = true;

                // Award points
                if (data.winner === data.team1) {
                    teamPoints[data.team1] = (teamPoints[data.team1] || 0) + 3;
                } else if (data.winner === data.team2) {
                    teamPoints[data.team2] = (teamPoints[data.team2] || 0) + 3;
                } else if (data.winner === "draw") {
                    teamPoints[data.team1] = (teamPoints[data.team1] || 0) + 1;
                    teamPoints[data.team2] = (teamPoints[data.team2] || 0) + 1;
                }

                // Mark this doc so we don't process it again in future runs
                const matchRef = db.collection(collection).doc(doc.id);
                await matchRef.update({ pointsUpdated: true });
            }
        }

        // Now update EndgameMatchPoints / Score for each team
        for (const [teamId, points] of Object.entries(teamPoints)) {
            const teamRef = db.collection(`${league}Teams`).doc(teamId);
            const teamDoc = await teamRef.get();

            if (!teamDoc.exists) continue;

            let teamData = teamDoc.data();
            let currentEndgamePoints = teamData.EndgameMatchPoints || 0;
            let newEndgamePoints = currentEndgamePoints + points;

            let basePoints = teamData.points || 0;
            let bonusPoints = teamData.bonuspoints || 0;
            let potMultiplier = potMultipliers[teamData.pot] || 1;

            let finalScore = (basePoints + bonusPoints + newEndgamePoints) * potMultiplier;

            await teamRef.update({
                EndgameMatchPoints: newEndgamePoints,
                score: finalScore.toFixed(1)
            });

            console.log(`Updated ${teamData.originalTeamName}: 
                EndgameMatchPoints = ${newEndgamePoints}, 
                score = ${finalScore.toFixed(1)}`);
        }

        alert("EndgameMatchPoints and scores updated successfully!");
    } catch (error) {
        console.error("Error updating EndgameMatchPoints and scores:", error);
        alert("Error updating table. See console for details.");
    }
}

