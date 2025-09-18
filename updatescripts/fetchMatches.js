// updatescripts/fetchMatches.js
import { db } from './db.js';
import { doc, setDoc, collection, writeBatch } 
  from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

function cleanCellText(td) {
  const clone = td.cloneNode(true);
  clone.querySelectorAll('img, .flagicon').forEach(n => n.remove());
  return (clone.textContent || '').replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseScoreOrDate(text) {
  const t = (text || '').trim();
  const scoreLike = /^(\d+)\s*[–-]\s*(\d+)$/;
  if (scoreLike.test(t)) {
    const m = t.match(scoreLike);
    return { kind: 'score', homeGoals: +m[1], awayGoals: +m[2], raw: t };
  }
  return { kind: 'date', raw: t };
}

async function fetchMatchdayTables() {
  const restUrl = 'https://en.wikipedia.org/api/rest_v1/page/html/2025%E2%80%9326_UEFA_Champions_League';
  const res = await fetch(restUrl, { headers: { 'Accept': 'text/html' } });
  if (!res.ok) throw new Error(`Failed to fetch Wikipedia HTML: ${res.status}`);
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');

  const tables = [...doc.querySelectorAll('table')]
    .filter(t => /Matchday\s+\d+/i.test(t.querySelector('caption')?.textContent || ''));

  const allMatches = [];
  for (const table of tables) {
    const mdMatch = table.querySelector('caption')?.textContent.match(/Matchday\s+(\d+)/i);
    const matchday = mdMatch ? +mdMatch[1] : null;
    const rows = [...table.querySelectorAll('tbody tr')]
      .filter(r => !r.querySelector('th') && r.querySelectorAll('td').length >= 3);

    for (const r of rows) {
      const [homeTd, midTd, awayTd] = r.querySelectorAll('td');
      const home = cleanCellText(homeTd);
      const mid = cleanCellText(midTd);
      const away = cleanCellText(awayTd);
      if (!home || !away) continue;
      const sd = parseScoreOrDate(mid);
      allMatches.push({
        season: '2025-26',
        stage: 'League phase',
        matchday,
        homeTeam: home,
        awayTeam: away,
        status: sd.kind === 'score' ? 'played' : 'scheduled',
        scoreText: sd.kind === 'score' ? sd.raw : null,
        homeGoals: sd.kind === 'score' ? sd.homeGoals : null,
        awayGoals: sd.kind === 'score' ? sd.awayGoals : null,
        dateText: sd.kind === 'date' ? sd.raw : null,
        importedAt: new Date().toISOString()
      });
    }
  }
  return allMatches;
}

async function writeMatchesToFirestore(matches) {
  // Firestore v9+ uses doc(), setDoc() etc. If you prefer batch, import writeBatch
  const { doc, setDoc, collection, writeBatch } = await import("https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js");
  const chunkSize = 400;
  let written = 0;
  for (let i = 0; i < matches.length; i += chunkSize) {
    const batch = writeBatch(db);
    const chunk = matches.slice(i, i + chunkSize);
    for (const m of chunk) {
      const id = `${m.season}_md${m.matchday}_${m.homeTeam}_vs_${m.awayTeam}`.replace(/[^\w\-]+/g, '_');
      batch.set(doc(collection(db, 'CLMatches'), id), m, { merge: true });
    }
    await batch.commit();
    written += chunk.length;
  }
  return written;
}

export function initUpdatePage() {
  const btn = document.getElementById('fetch-btn');
  const logEl = document.getElementById('log');
  if (!btn) return;

  const log = (msg, cls = '') => {
    const p = document.createElement('div'); if (cls) p.className = cls;
    p.textContent = msg; logEl.appendChild(p);
  };

  btn.addEventListener('click', async () => {
    logEl.innerHTML = ''; log('Fetching Wikipedia…');
    try {
      const matches = await fetchMatchdayTables();
      log(`Parsed ${matches.length} matches.`);
      const written = await writeMatchesToFirestore(matches);
      log(`Wrote ${written} docs into CLMatches.`, 'ok');
    } catch (err) {
      console.error(err); log(`Error: ${err.message}`, 'err');
    }
  });
}
