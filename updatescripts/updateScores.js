// updatescripts/updateScores.js
import { db } from './db.js';
import {
  collection, getDocs, doc, writeBatch
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

export function initUpdateScores() {
  const btn = document.getElementById('update-scores-btn');
  const logEl = document.getElementById('log');
  if (!btn) return;

  const log = (msg, cls = '') => {
    const p = document.createElement('div');
    if (cls) p.className = cls;
    p.textContent = msg;
    logEl.appendChild(p);
  };

  btn.addEventListener('click', async () => {
    logEl.innerHTML = '';
    log('Updating CL team scores…');

    try {
      // Fetch teams
      const teamsSnap = await getDocs(collection(db, 'CLTeams'));
      const teams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Fetch matches
      const matchesSnap = await getDocs(collection(db, 'CLMatches'));
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

        batch.update(doc(db, 'CLTeams', team.id), {
          leaguepoints: rawPoints,
          totalScore: totalScore
        });
        updated++;
      }

      await batch.commit();
      log(`✅ Updated ${updated} teams: wrote leaguepoints and totalScore.`, 'ok');
    } catch (err) {
      console.error(err);
      log(`Error: ${err.message}`, 'err');
    }
  });
}
