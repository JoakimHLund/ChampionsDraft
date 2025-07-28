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
    document.getElementById("league-title").innerText = `${league} Final Match`;
    loadMatch();
}

// Load final match if it exists
async function loadMatch() {
    try {
        const matchSnapshot = await db.collection("finalmatches")
            .where("league", "==", league)
            .limit(1)
            .get();

        let existingMatch = null;

        if (!matchSnapshot.empty) {
            const doc = matchSnapshot.docs[0];
            const data = doc.data();
            existingMatch = {
                id: doc.id,
                team1: data.team1,
                team2: data.team2,
                winner: data.winner || ""
            };
        }

        loadTeams(existingMatch);
    } catch (error) {
        console.error("Error fetching final match:", error);
    }
}

// Load teams from Firestore
async function loadTeams(existingMatch) {
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
        createFinalUI(teams, existingMatch);
    } catch (error) {
        console.error("Error fetching teams:", error);
    }
}

// Create final match UI
function createFinalUI(teams, existingMatch) {
    const container = document.getElementById("final-container");
    const div = document.createElement("div");

    div.innerHTML = `
        <select class="team-select team1" ${existingMatch ? "disabled" : ""}>
            ${teams.map(team =>
                `<option value="${team.id}" ${existingMatch?.team1 === team.id ? "selected" : ""}>${team.name}</option>`
            ).join("")}
        </select>
        vs.
        <select class="team-select team2" ${existingMatch ? "disabled" : ""}>
            ${teams.map(team =>
                `<option value="${team.id}" ${existingMatch?.team2 === team.id ? "selected" : ""}>${team.name}</option>`
            ).join("")}
        </select>
        <button class="set-match" ${existingMatch ? "disabled" : ""}>Set</button>

        <br><br>

        <select class="winner-select" ${existingMatch?.winner ? "disabled" : ""}>
            <option value="">Select Winner</option>
            <option value="${existingMatch?.team1 || ''}" ${existingMatch?.winner === existingMatch?.team1 ? "selected" : ""}>${teams.find(t => t.id === existingMatch?.team1)?.name || "Team 1"}</option>
            <option value="${existingMatch?.team2 || ''}" ${existingMatch?.winner === existingMatch?.team2 ? "selected" : ""}>${teams.find(t => t.id === existingMatch?.team2)?.name || "Team 2"}</option>
            <option value="draw" ${existingMatch?.winner === "draw" ? "selected" : ""}>Draw</option>
        </select>
        <button class="set-winner" ${existingMatch?.winner ? "disabled" : ""}>Set Winner</button>
    `;

    container.appendChild(div);

    if (!existingMatch) {
        div.querySelector(".set-match").addEventListener("click", async function () {
            const team1 = div.querySelector(".team1").value;
            const team2 = div.querySelector(".team2").value;

            if (team1 === team2) {
                alert("Teams must be different!");
                return;
            }

            await db.collection("finalmatches").add({
                league,
                matchIndex: 0,
                team1,
                team2
            });

            location.reload();
        });
    }

    div.querySelector(".set-winner").addEventListener("click", async function () {
        const winner = div.querySelector(".winner-select").value;
        if (!winner) {
            alert("Please select a winner.");
            return;
        }

        await db.collection("finalmatches").doc(existingMatch.id).update({ winner });

        div.querySelector(".winner-select").disabled = true;
        this.disabled = true;
        this.innerText = "Set";
    });
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

// Update button
document.getElementById("update-table").addEventListener("click", async () => {
    await updateEndgameMatchPoints();
});

async function updateEndgameMatchPoints() {
    try {
        const collections = ["roundof16matches", "quarterfinalmatches", "semifinalmatches", "finalmatches", "playoffmatches"];
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
