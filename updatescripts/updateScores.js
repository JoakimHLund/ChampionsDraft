// updatescripts/updateScores.js
import { db } from './db.js';
import {
  collection, getDocs, doc, writeBatch
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

export function initUpdateScores() {
  const logEl = document.getElementById('log');
  const log = (msg, cls = '') => {
    const p = document.createElement('div');
    if (cls) p.className = cls;
    p.textContent = msg;
    logEl.appendChild(p);
  };

  async function updateCompetitionScores(compName, teamColl, matchColl) {
    log(`🔄 Updating ${compName} team scores…`);

    // Fetch teams
    const teamsSnap = await getDocs(collection(db, teamColl));
    const teams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Fetch matches
    const matchesSnap = await getDocs(collection(db, matchColl));
    const matches = matchesSnap.docs.map(d => d.data());

    // Compute raw league points per team
    const teamScores = {};
    for (const t of teams) teamScores[t.Name] = 0;

    for (const m of matches) {
      const hg = m.homeGoals, ag = m.awayGoals;
      if (hg == null || ag == null) continue; // not played

      const home = m.homeTeam?.trim();
      const away = m.awayTeam?.trim();
      if (!home || !away) continue;

      if (hg > ag) {
        teamScores[home] = (teamScores[home] ?? 0) + 3;
      } else if (hg < ag) {
        teamScores[away] = (teamScores[away] ?? 0) + 3;
      } else {
        teamScores[home] = (teamScores[home] ?? 0) + 1;
        teamScores[away] = (teamScores[away] ?? 0) + 1;
      }
    }

    // Batch update: leaguepoints (raw) and totalScore (raw * multiplier)
    const batch = writeBatch(db);
    let updated = 0;

    for (const team of teams) {
      const rawPoints = teamScores[team.Name] ?? 0;
      const multiplier = Number(team.multiplier ?? 1.0);
      const totalScore = rawPoints * multiplier;

      batch.update(doc(db, teamColl, team.id), {
        leaguepoints: rawPoints,
        totalScore: totalScore
      });
      updated++;
    }

    await batch.commit();
    log(`✅ ${compName}: Updated ${updated} teams.`, 'ok');
  }

  // Hook up 3 separate buttons
  const setups = [
    { id: 'update-cl-scores-btn', comp: 'Champions League', teams: 'CLTeams', matches: 'CLMatches' },
    { id: 'update-el-scores-btn', comp: 'Europa League',    teams: 'ELTeams', matches: 'ELMatches' },
    { id: 'update-ec-scores-btn', comp: 'Conference League',teams: 'ECTeams', matches: 'ECMatches' }
  ];

  setups.forEach(({ id, comp, teams, matches }) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('click', async () => {
      logEl.innerHTML = '';
      try {
        await updateCompetitionScores(comp, teams, matches);
      } catch (err) {
        console.error(err);
        log(`Error: ${err.message}`, 'err');
      }
    });
  });
}
