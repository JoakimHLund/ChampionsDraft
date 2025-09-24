// updatescripts/updateLeaderboard.js
import { db } from './db.js';
import {
  collection, getDocs, writeBatch, doc
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

export function initUpdateLeaderboard() {
  const btn = document.getElementById('update-leaderboard-btn');
  const logEl = document.getElementById('log');
  if (!btn || !logEl) return;

  const log = (msg, cls = '') => {
    const p = document.createElement('div');
    if (cls) p.className = cls;
    p.textContent = msg;
    logEl.appendChild(p);
  };

  btn.addEventListener('click', async () => {
    logEl.innerHTML = '';
    log('Updating leaderboards (CL, EL, EC)…');

    try {
      // Load all teams
      const loadTeams = async (coll) => {
        const snap = await getDocs(collection(db, coll));
        const map = new Map();
        snap.docs.forEach(d => {
          const t = d.data();
          if (!t?.Name) return;
          map.set(String(t.Name).trim(), Number(t.totalScore ?? 0));
        });
        log(`Loaded ${map.size} from ${coll}.`);
        return map;
      };

      const clByName = await loadTeams('CLTeams');
      const elByName = await loadTeams('ELTeams');
      const ecByName = await loadTeams('ECTeams');

      // Load all players
      const playersSnap = await getDocs(collection(db, 'players'));
      const players = playersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      log(`Loaded ${players.length} players.`);

      // Batch updates
      let processed = 0;
      const chunkSize = 400;
      for (let i = 0; i < players.length; i += chunkSize) {
        const batch = writeBatch(db);
        const chunk = players.slice(i, i + chunkSize);

        for (const p of chunk) {
          // Champions League
          const picksCL = Array.isArray(p.selectedChampions) ? p.selectedChampions : [];
          let championspoints = 0;
          for (const entry of picksCL) {
            const teamName = String(entry?.name || '').trim();
            if (!teamName) continue;
            championspoints += Number(clByName.get(teamName) ?? 0);
          }
          championspoints = Number(championspoints.toFixed(1));

          // Europa League
          const picksEL = Array.isArray(p.selectedEuropa) ? p.selectedEuropa : [];
          let europapoints = 0;
          for (const entry of picksEL) {
            const teamName = String(entry?.name || '').trim();
            if (!teamName) continue;
            europapoints += Number(elByName.get(teamName) ?? 0);
          }
          europapoints = Number(europapoints.toFixed(1));

          // Conference League
          const picksEC = Array.isArray(p.selectedConference) ? p.selectedConference : [];
          let conferencepoints = 0;
          for (const entry of picksEC) {
            const teamName = String(entry?.name || '').trim();
            if (!teamName) continue;
            conferencepoints += Number(ecByName.get(teamName) ?? 0);
          }
          conferencepoints = Number(conferencepoints.toFixed(1));

          const totalpoints = championspoints + europapoints + conferencepoints;

          batch.update(doc(db, 'players', p.id), {
            championspoints,
            europapoints,
            conferencepoints,
            totalpoints
          });
          processed++;
        }

        await batch.commit();
      }

      log(`✅ Updated ${processed} players (CL, EL, EC points & total).`, 'ok');
    } catch (err) {
      console.error(err);
      log(`Error: ${err.message}`, 'err');
    }
  });
}
