// updatescripts/loadTeams.js
import { db } from './db.js';
import { doc, setDoc, collection, writeBatch } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

function toId(s) {
  return (s || '').normalize('NFKD')
    .replace(/[^\w\-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 500);
}

// Pot → multiplier
const potMultipliers = { 1: 1.0, 2: 1.5, 3: 2.0, 4: 2.5, 5: 3.0, 6: 3.5 };

/**
 * Generic loader: reads teams from JSON and writes to the given collection.
 * @param {string} jsonPath   e.g. 'teams.json' | 'europa.json' | 'conference.json'
 * @param {string} collName   e.g. 'CLTeams' | 'ELTeams' | 'ECTeams'
 */
async function loadLeagueTeamsFromJson(jsonPath, collName) {
  const res = await fetch(jsonPath);
  if (!res.ok) throw new Error(`Failed to fetch ${jsonPath}: ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error(`${jsonPath} is not an array`);

  const chunkSize = 400;
  let written = 0;

  for (let i = 0; i < data.length; i += chunkSize) {
    const batch = writeBatch(db);
    for (const t of data.slice(i, i + chunkSize)) {
      const name = (t.name || '').trim();
      if (!name) continue;

      const pot = Number(t.pot ?? null);
      const multiplier = potMultipliers[pot] ?? 1.0;
      const docId = toId(name);

      batch.set(doc(collection(db, collName), docId), {
        Name: name,
        pot,
        country: (t.country || '').trim(),
        logo: (t.logo || '').trim(),
        leaguepoints: 0,
        multiplier
      }, { merge: true });
    }
    await batch.commit();
    written += Math.min(chunkSize, data.length - i);
  }
  return written;
}

// Public inits – each wires a button if present
export function initLoadTeams() {
  wireLoaderButton('load-teams-btn', 'teams.json', 'CLTeams', 'CL');
  wireLoaderButton('load-el-teams-btn', 'europa.json', 'ELTeams', 'EL');
  wireLoaderButton('load-ec-teams-btn', 'conference.json', 'ECTeams', 'EC');
}

// Helper to attach a click handler if the button exists
function wireLoaderButton(btnId, jsonPath, collName, label) {
  const btn = document.getElementById(btnId);
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
    log(`Loading ${label} teams from ${jsonPath} …`);
    try {
      const written = await loadLeagueTeamsFromJson(jsonPath, collName);
      log(`Wrote/updated ${written} docs in ${collName} (with multipliers).`, 'ok');
    } catch (err) {
      console.error(err);
      log(`Error: ${err.message}`, 'err');
    }
  });
}
