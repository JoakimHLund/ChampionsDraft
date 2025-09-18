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
    log('Updating leaderboard (championspoints + totalpoints)…');

    try {
      // Load all CL teams into a lookup map
      const clSnap = await getDocs(collection(db, 'CLTeams'));
      const clByName = new Map();
      clSnap.docs.forEach(d => {
        const t = d.data();
        if (!t?.Name) return;
        clByName.set(String(t.Name).trim(), Number(t.totalScore ?? 0));
      });
      log(`Loaded ${clByName.size} CL teams.`);

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
          const picks = Array.isArray(p.selectedChampions) ? p.selectedChampions : [];
          let championspoints = 0;

          for (const entry of picks) {
            const teamName = String(entry?.name || '').trim();
            if (!teamName) continue;
            championspoints += Number(clByName.get(teamName) ?? 0);
          }
          championspoints = Number(championspoints.toFixed(1));

          // Keep existing europa/conference points
          const europapoints = Number(p.europapoints ?? 0);
          const conferencepoints = Number(p.conferencepoints ?? 0);

          const totalpoints = championspoints + europapoints + conferencepoints;

          batch.update(doc(db, 'players', p.id), {
            championspoints,
            totalpoints
          });
          processed++;
        }

        await batch.commit();
      }

      log(`✅ Updated ${processed} players (championspoints & totalpoints).`, 'ok');
    } catch (err) {
      console.error(err);
      log(`Error: ${err.message}`, 'err');
    }
  });
}
