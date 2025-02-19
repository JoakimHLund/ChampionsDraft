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
    document.getElementById("league-title").innerText = `${league} Playoff Matches`;
    loadMatches();
}

// Load matches from Firestore
async function loadMatches() {
    try {
        const matchesSnapshot = await db.collection("playoffmatches")
            .where("league", "==", league)
            .get();

        let existingMatches = {};

        if (matchesSnapshot.empty) {
            console.log("No existing matches found in Firestore.");
        } else {
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
                    winner: data.winner || "" // Store winner field
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
            .where("playoffbonus", "==", false)
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
                    const match1Ref = await db.collection("playoffmatches").add({
                        league: league,
                        matchday: 1,
                        matchIndex: i,
                        team1: team1,
                        team2: team2
                    });

                    const match2Ref = await db.collection("playoffmatches").add({
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

            await db.collection("playoffmatches").doc(existingMatch1?.id).update({ winner });

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

            await db.collection("playoffmatches").doc(existingMatch2?.id).update({ winner });

            winnerSelect.disabled = true;
            this.disabled = true;
            this.innerText = "Set";
        });
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

// Function to update EndgameMatchPoints and Score
async function updateEndgameMatchPoints() {
    try {
        const matchesSnapshot = await db.collection("playoffmatches")
            .where("league", "==", league)
            .get();

        if (matchesSnapshot.empty) {
            alert("No matches found to update.");
            return;
        }

        let teamPoints = {}; // Store points for each team

        for (const doc of matchesSnapshot.docs) {
            let data = doc.data();

            // Only process matches that have a winner set
            if (!data.winner || !data.team1 || !data.team2) continue;

            // Ensure points are initialized
            if (!teamPoints[data.team1]) teamPoints[data.team1] = 0;
            if (!teamPoints[data.team2]) teamPoints[data.team2] = 0;

            // Only count match once (check Firestore if it has already been counted)
            const matchRef = db.collection("playoffmatches").doc(doc.id);
            if (data.pointsUpdated) {
                console.log(`Match ${data.matchIndex} already counted.`);
                continue;
            }

            // Assign points based on result
            if (data.winner === data.team1) {
                teamPoints[data.team1] += 3;
            } else if (data.winner === data.team2) {
                teamPoints[data.team2] += 3;
            } else if (data.winner === "draw") {
                teamPoints[data.team1] += 1;
                teamPoints[data.team2] += 1;
            }

            // Mark match as counted
            await matchRef.update({ pointsUpdated: true });
        }

        // Update each team's EndgameMatchPoints and Score in Firestore
        for (const [teamId, points] of Object.entries(teamPoints)) {
            const teamRef = db.collection(`${league}Teams`).doc(teamId);
            const teamDoc = await teamRef.get();

            if (teamDoc.exists) {
                let teamData = teamDoc.data();
                let currentEndgamePoints = teamData.EndgameMatchPoints || 0;
                let newEndgamePoints = currentEndgamePoints + points;

                // Calculate score using (points + bonuspoints + EndgameMatchPoints) * multiplier
                let basePoints = teamData.points || 0;
                let bonusPoints = teamData.bonuspoints || 0;
                let potMultiplier = potMultipliers[teamData.pot] || 1; // Default to 1 if pot is missing

                let finalScore = (basePoints + bonusPoints + newEndgamePoints) * potMultiplier;

                // Update Firestore
                await teamRef.update({
                    EndgameMatchPoints: newEndgamePoints,
                    score: finalScore.toFixed(1) // Ensure consistent decimal formatting
                });

                console.log(`Updated ${teamData.originalTeamName} - EndgameMatchPoints: ${newEndgamePoints}, Score: ${finalScore.toFixed(1)}`);
            }
        }

        alert("EndgameMatchPoints and scores updated successfully!");

    } catch (error) {
        console.error("Error updating EndgameMatchPoints and scores:", error);
        alert("Error updating table. See console for details.");
    }
}
