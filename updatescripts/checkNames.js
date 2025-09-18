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

  btn.addEventListener('click', async () => {
    logEl.innerHTML = '';
    log('Checking names…');

    try {
      // Get all CLTeams
      const teamsSnap = await getDocs(collection(db, 'CLTeams'));
      const teamNames = teamsSnap.docs.map(d => d.data().Name?.trim()).filter(Boolean);

      // Get all CLMatches
      const matchesSnap = await getDocs(collection(db, 'CLMatches'));
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
        log('✅ All CLTeams are found in CLMatches.', 'ok');
      } else {
        log(`⚠️ Missing teams (${missing.length}):`, 'warn');
        missing.forEach(n => log(` - ${n}`));
      }

    } catch (err) {
      console.error(err);
      log(`Error: ${err.message}`, 'err');
    }
  });
}
