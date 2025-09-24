import { db } from './updatescripts/db.js';
import { collection, getDocs, query, where } 
  from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Get team name from URL param ?team=...
const params = new URLSearchParams(window.location.search);
const teamName = params.get("team");

const nameEl = document.getElementById("team-name");
const logoEl = document.getElementById("team-logo");
const potEl = document.getElementById("team-pot");
const multEl = document.getElementById("team-multiplier");
const lpEl = document.getElementById("team-leaguepoints");
const tsEl = document.getElementById("team-totalscore");
const gpEl = document.getElementById("team-gamesplayed");
const matchesTable = document.querySelector("#matches-table tbody");
const pickedByList = document.getElementById("picked-by-list");

async function loadTeamInfo() {
  if (!teamName) {
    nameEl.textContent = "No team specified";
    return;
  }
  nameEl.textContent = teamName;

  // Try across all team collections
  const collections = ["CLTeams", "ELTeams", "ECTeams"];
  let teamDoc = null;
  for (const coll of collections) {
    const q = query(collection(db, coll), where("Name", "==", teamName));
    const snap = await getDocs(q);
    if (!snap.empty) {
      teamDoc = snap.docs[0].data();
      break;
    }
  }

  if (!teamDoc) {
    potEl.textContent = "Not found";
    return;
  }

  potEl.textContent = teamDoc.pot ?? "-";
  multEl.textContent = teamDoc.multiplier ?? "-";
  lpEl.textContent = teamDoc.leaguepoints ?? 0;
  tsEl.textContent = teamDoc.totalScore ?? 0;
  gpEl.textContent = teamDoc.gamesplayed ?? 0;

  // Always show logo from img/logos
  if (teamDoc.logo) {
    logoEl.src = "img/logos/" + teamDoc.logo;
    logoEl.alt = teamName + " logo";
  } else {
    logoEl.style.display = "none";
  }
}

async function loadPickedBy() {
  if (!teamName) return;

  const playersSnap = await getDocs(collection(db, "players"));
  const players = playersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const pickedPlayers = [];

  for (const p of players) {
    const allPicks = [
      ...(Array.isArray(p.selectedChampions) ? p.selectedChampions : []),
      ...(Array.isArray(p.selectedEuropa) ? p.selectedEuropa : []),
      ...(Array.isArray(p.selectedConference) ? p.selectedConference : [])
    ];

    if (allPicks.some(entry => String(entry?.name || "").trim() === teamName)) {
      // Display with department
      let displayName = p.Name;
      if (p.Department && p.Department.trim() !== '') {
        displayName = `[${p.Department}] ${displayName}`;
      }

      pickedPlayers.push({
        displayName,
        linkName: p.Name // only player name goes in the URL param
      });
    }
  }

  // Sort alphabetically by display name
  pickedPlayers.sort((a, b) => a.displayName.localeCompare(b.displayName));

  const container = document.getElementById("picked-by-list");
  const countEl = document.getElementById("picked-count");
  countEl.textContent = `(${pickedPlayers.length})`;

  if (pickedPlayers.length === 0) {
    container.innerHTML = "<p>None</p>";
  } else {
    pickedPlayers.forEach(pl => {
      const div = document.createElement("div");
      div.className = "picked-player";

      const link = document.createElement("a");
      link.href = "player.html?playername=" + encodeURIComponent(pl.linkName);
      link.textContent = pl.displayName;

      div.appendChild(link);
      container.appendChild(div);
    });
  }
}



async function loadTeamMatches() {
  if (!teamName) return;

  const matchCollections = ["CLMatches", "ELMatches", "ECMatches"];
  let allMatches = [];

  for (const coll of matchCollections) {
    const q1 = query(collection(db, coll), where("homeTeam", "==", teamName));
    const q2 = query(collection(db, coll), where("awayTeam", "==", teamName));
    const snap1 = await getDocs(q1);
    const snap2 = await getDocs(q2);
    snap1.forEach(d => allMatches.push(d.data()));
    snap2.forEach(d => allMatches.push(d.data()));
  }

  allMatches.sort((a, b) => (a.matchday ?? 0) - (b.matchday ?? 0));

  for (const m of allMatches) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${m.matchday ?? "-"}</td>
      <td>${m.homeTeam}</td>
      <td>${m.scoreText ?? m.dateText ?? "-"}</td>
      <td>${m.awayTeam}</td>
    `;
    matchesTable.appendChild(row);
  }
}

loadTeamInfo();
loadPickedBy();
loadTeamMatches();
