// updatescripts/checkNames.js
import { db } from './db.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

export function initCheckNames() {
  const btn = document.getElementById('check-names-btn');
  const logEl = document.getElementById('log');
  if (!btn) return;

  const log = (msg, cls = '') => {
    const p = document.createElement('div');
    if (cls) p.className = cls;
    p.textContent = msg;
    logEl.appendChild(p);
  };

  async function checkCompetition(compName, teamColl, matchColl) {
    log(`🔍 Checking ${compName}…`);

    // Get Teams
    const teamsSnap = await getDocs(collection(db, teamColl));
    const teamNames = teamsSnap.docs.map(d => d.data().Name?.trim()).filter(Boolean);

    // Get Matches
    const matchesSnap = await getDocs(collection(db, matchColl));
    const matchNames = new Set();
    matchesSnap.docs.forEach(d => {
      const m = d.data();
      if (m.homeTeam) matchNames.add(m.homeTeam.trim());
      if (m.awayTeam) matchNames.add(m.awayTeam.trim());
    });

    // Compare
    let missing = [];
    for (const name of teamNames) {
      if (!matchNames.has(name)) missing.push(name);
    }

    if (missing.length === 0) {
      log(`✅ All ${teamColl} are found in ${matchColl}.`, 'ok');
    } else {
      log(`⚠️ Missing teams in ${compName} (${missing.length}):`, 'warn');
      missing.forEach(n => log(` - ${n}`));
    }
  }

  btn.addEventListener('click', async () => {
    logEl.innerHTML = '';
    log('Checking names…');

    try {
      await checkCompetition('Champions League', 'CLTeams', 'CLMatches');
      await checkCompetition('Europa League', 'ELTeams', 'ELMatches');
      await checkCompetition('Conference League', 'ECTeams', 'ECMatches');
    } catch (err) {
      console.error(err);
      log(`Error: ${err.message}`, 'err');
    }
  });
}
