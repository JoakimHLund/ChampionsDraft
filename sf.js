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
let rawLeague = urlParams.get("league");
const league = rawLeague ? rawLeague.charAt(0).toUpperCase() + rawLeague.slice(1).toLowerCase() : null;

if (!league) {
    alert("No league specified in URL!");
} else {
    document.getElementById("league-title").innerText = `${league} Semifinal Matches`;
    loadMatches();
}

// Load matches from Firestore
async function loadMatches() {
    try {
        const matchesSnapshot = await db.collection("semifinalmatches")
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
        const teamsSnapshot = await teamsRef.get();

        let teams = [];
        teamsSnapshot.forEach(doc => {
            let teamData = doc.data();
            if (!teamData.eliminated) {
                teams.push({ id: doc.id, name: teamData.originalTeamName });
            }
        });

        console.log("Filtered teams (not eliminated):", teams);
        createMatchdayUI("matchday1", "matchday2", teams, existingMatches);
    } catch (error) {
        console.error("Error fetching teams:", error);
    }
}

// Create Matchday UI
function createMatchdayUI(matchday1ContainerId, matchday2ContainerId, teams, existingMatches) {
    const matchday1Container = document.getElementById(matchday1ContainerId);
    const matchday2Container = document.getElementById(matchday2ContainerId);

    for (let i = 0; i < 2; i++) {
        let match1Div = document.createElement("div");
        let match2Div = document.createElement("div");

        let existingMatch1 = existingMatches[i] && existingMatches[i][1];
        let existingMatch2 = existingMatches[i] && existingMatches[i][2];

        match1Div.innerHTML = `
            <select class="team-select team1" ${existingMatch1 ? "disabled" : ""}>
                ${teams.map(team =>
                    `<option value="${team.id}" ${existingMatch1 && existingMatch1.team1 === team.id ? "selected" : ""}>${team.name}</option>`
                ).join("")}
            </select>
            vs.
            <select class="team-select team2" ${existingMatch1 ? "disabled" : ""}>
                ${teams.map(team =>
                    `<option value="${team.id}" ${existingMatch1 && existingMatch1.team2 === team.id ? "selected" : ""}>${team.name}</option>`
                ).join("")}
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

        let matchContainer1 = document.createElement("div");
        matchContainer1.classList.add("match-container");

        let matchContainer2 = document.createElement("div");
        matchContainer2.classList.add("match-container", "matchday2-container");

        matchContainer1.appendChild(match1Div);
        matchContainer2.appendChild(match2Div);

        matchday1Container.appendChild(matchContainer1);
        matchday2Container.appendChild(matchContainer2);

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
                    const match1Ref = await db.collection("semifinalmatches").add({
                        league: league,
                        matchday: 1,
                        matchIndex: i,
                        team1: team1,
                        team2: team2
                    });

                    const match2Ref = await db.collection("semifinalmatches").add({
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

                    console.log(`Semifinal Match ${i} set: ${team1Text} vs. ${team2Text}`);
                } catch (error) {
                    console.error("Error saving match:", error);
                }
            });
        }

        match1Div.querySelector(".set-winner").addEventListener("click", async function () {
            let winnerSelect = match1Div.querySelector(".winner-select");
            let winner = winnerSelect.value;

            if (!winner) {
                alert("Please select a winner.");
                return;
            }

            await db.collection("semifinalmatches").doc(existingMatch1?.id).update({ winner });

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

            await db.collection("semifinalmatches").doc(existingMatch2?.id).update({ winner });

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

document.getElementById("update-table").addEventListener("click", async function () {
    await updateEndgameMatchPoints();
});

async function updateEndgameMatchPoints() {
    try {
        const collections = ["roundof16matches", "quarterfinalmatches", "semifinalmatches", "playoffmatches"];
        let teamPoints = {};
        let processedMatches = {};

        for (const collection of collections) {
            const matchesSnapshot = await db.collection(collection)
                .where("league", "==", league)
                .get();

            for (const doc of matchesSnapshot.docs) {
                let data = doc.data();

                if (!data.winner || !data.team1 || !data.team2) continue;

                const combinedKey = `${collection}_${data.matchIndex}`;
                if (processedMatches[combinedKey]) continue;
                if (data.pointsUpdated) continue;

                processedMatches[combinedKey] = true;

                if (data.winner === data.team1) {
                    teamPoints[data.team1] = (teamPoints[data.team1] || 0) + 3;
                } else if (data.winner === data.team2) {
                    teamPoints[data.team2] = (teamPoints[data.team2] || 0) + 3;
                } else if (data.winner === "draw") {
                    teamPoints[data.team1] = (teamPoints[data.team1] || 0) + 1;
                    teamPoints[data.team2] = (teamPoints[data.team2] || 0) + 1;
                }

                await db.collection(collection).doc(doc.id).update({ pointsUpdated: true });
            }
        }

        for (const [teamId, points] of Object.entries(teamPoints)) {
            const teamRef = db.collection(`${league}Teams`).doc(teamId);
            const teamDoc = await teamRef.get();

            if (!teamDoc.exists) continue;

            let teamData = teamDoc.data();
            let newEndgamePoints = (teamData.EndgameMatchPoints || 0) + points;
            let basePoints = teamData.points || 0;
            let bonusPoints = teamData.bonuspoints || 0;
            let potMultiplier = potMultipliers[teamData.pot] || 1;

            let finalScore = (basePoints + bonusPoints + newEndgamePoints) * potMultiplier;

            await teamRef.update({
                EndgameMatchPoints: newEndgamePoints,
                score: finalScore.toFixed(1)
            });

            console.log(`Updated ${teamData.originalTeamName}: EndgameMatchPoints = ${newEndgamePoints}, score = ${finalScore.toFixed(1)}`);
        }

        alert("EndgameMatchPoints and scores updated successfully!");
    } catch (error) {
        console.error("Error updating points:", error);
        alert("Error updating table. See console for details.");
    }
}
