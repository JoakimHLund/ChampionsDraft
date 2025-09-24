import { db } from './db.js';
import {
  collection, getDocs, writeBatch, doc
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

export function initUpdatePickedCount() {
  const btn = document.getElementById('update-picked-count-btn');
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
    log('🔄 Updating picked counts for all teams…');

    try {
      // Get all players
      const playersSnap = await getDocs(collection(db, 'players'));
      const players = playersSnap.docs.map(d => d.data());

      // Build map: teamName -> count
      const pickedCounts = {};

      for (const p of players) {
        const allPicks = [
          ...(Array.isArray(p.selectedChampions) ? p.selectedChampions : []),
          ...(Array.isArray(p.selectedEuropa) ? p.selectedEuropa : []),
          ...(Array.isArray(p.selectedConference) ? p.selectedConference : [])
        ];

        for (const entry of allPicks) {
          const name = String(entry?.name || '').trim();
          if (!name) continue;
          pickedCounts[name] = (pickedCounts[name] ?? 0) + 1;
        }
      }

      // Update across all competitions
      const leagues = [
        { coll: 'CLTeams', label: 'Champions League' },
        { coll: 'ELTeams', label: 'Europa League' },
        { coll: 'ECTeams', label: 'Conference League' }
      ];

      let totalUpdated = 0;

      for (const { coll, label } of leagues) {
        const snap = await getDocs(collection(db, coll));
        const batch = writeBatch(db);

        snap.docs.forEach(d => {
          const team = d.data();
          const teamName = String(team?.Name || '').trim();
          if (!teamName) return;

          const count = pickedCounts[teamName] ?? 0;
          batch.update(doc(db, coll, d.id), { selectedBy: count });
          totalUpdated++;
        });

        await batch.commit();
        log(`✅ Updated ${snap.size} teams in ${label}`, 'ok');
      }

      log(`🎉 Finished updating picked counts (${totalUpdated} teams total).`, 'ok');
    } catch (err) {
      console.error(err);
      log(`Error: ${err.message}`, 'err');
    }
  });
}
