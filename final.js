import { db } from './updatescripts/db.js';
import {
  collection,
  getDocs,
  doc,
  writeBatch,
  serverTimestamp,
  query,
  where,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const logEl = document.getElementById('log');
const matchesEl = document.getElementById('matches');
const leagueEl = document.getElementById('league');
const loadBtn = document.getElementById('load-teams-btn');
const eligibleCountEl = document.getElementById('eligible-count');

const log = (msg, cls = '') => {
  const div = document.createElement('div');
  if (cls) div.className = cls;
  div.textContent = msg;
  logEl.appendChild(div);
};
const clearLog = () => { logEl.innerHTML = ''; };

const toKey = (s) => (s ?? '').toString().trim();
const isTruthy = (v) => v === true || v === 1 || v === 'true' || v === '1';

function leagueToCollections(league) {
  if (league === 'CL') return { teamColl: 'CLTeams', matchColl: 'CLMatches' };
  if (league === 'EL') return { teamColl: 'ELTeams', matchColl: 'ELMatches' };
  if (league === 'EC') return { teamColl: 'ECTeams', matchColl: 'ECMatches' };
  throw new Error('Unknown league: ' + league);
}

function normalizeTieId(league, a, b) {
  const x = toKey(a).toLowerCase();
  const y = toKey(b).toLowerCase();
  const [p, q] = x < y ? [x, y] : [y, x];
  return `${league}-final-${p}__${q}`.replace(/[^a-z0-9_-]/g, '_');
}

function buildSelect() {
  const sel = document.createElement('select');
  const ph = document.createElement('option');
  ph.value = '';
  ph.textContent = 'Select team…';
  sel.appendChild(ph);
  return sel;
}

let rows = [];
let allEligibleTeams = [];
let globallyUsedTeams = new Set();

function recomputeGlobalUsedTeams() {
  const used = new Set();

  for (const r of rows) {
    if (r.locked) {
      if (r.a) used.add(r.a);
      if (r.b) used.add(r.b);
    } else {
      if (r.selA.value) used.add(r.selA.value);
      if (r.selB.value) used.add(r.selB.value);
    }
  }

  globallyUsedTeams = used;
}

function rebuildSelectOptions(sel) {
  const current = sel.value;
  while (sel.options.length > 1) sel.remove(1);

  for (const team of allEligibleTeams) {
    const opt = document.createElement('option');
    opt.value = team;
    opt.textContent = team;

    const used = globallyUsedTeams.has(team);
    const isCurrent = team === current;
    opt.disabled = used && !isCurrent;

    sel.appendChild(opt);
  }

  if (current) sel.value = current;
}

function refreshAllOptions() {
  recomputeGlobalUsedTeams();
  for (const r of rows) {
    if (r.locked) continue;
    rebuildSelectOptions(r.selA);
    rebuildSelectOptions(r.selB);
    updateSetButtonState(r);
  }
}

function updateSetButtonState(r) {
  const a = toKey(r.selA.value);
  const b = toKey(r.selB.value);
  r.setBtn.disabled = !(a && b && a !== b);
}

function parseGoals(inputEl) {
  const raw = inputEl.value.trim();
  if (raw === '') return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0 || n > 99) return NaN;
  return n;
}

async function registerMatchResult(matchColl, docId, homeGoals, awayGoals) {
  await updateDoc(doc(db, matchColl, docId), {
    homeGoals,
    awayGoals,
    status: "played",
    updatedAt: serverTimestamp()
  });
}

function buildResultUI({ labelLeft, labelRight, existingHomeGoals, existingAwayGoals, onRegister }) {
  const wrap = document.createElement('div');
  wrap.className = 'result-row';

  const left = document.createElement('div');
  left.className = 'teamlabel';
  left.textContent = labelLeft;

  const right = document.createElement('div');
  right.className = 'teamlabel';
  right.textContent = labelRight;

  const hg = document.createElement('input');
  hg.type = 'number';
  hg.min = '0';
  hg.max = '99';
  hg.className = 'goal';
  hg.value = (existingHomeGoals ?? '') === null ? '' : (existingHomeGoals ?? '');

  const ag = document.createElement('input');
  ag.type = 'number';
  ag.min = '0';
  ag.max = '99';
  ag.className = 'goal';
  ag.value = (existingAwayGoals ?? '') === null ? '' : (existingAwayGoals ?? '');

  const dash = document.createElement('div');
  dash.className = 'dash';
  dash.textContent = '-';

  const btn = document.createElement('button');
  btn.textContent = 'Register result';

  const statusLine = document.createElement('div');
  statusLine.className = 'result-status';
  statusLine.textContent = '';

  btn.addEventListener('click', async () => {
    const homeGoals = parseGoals(hg);
    const awayGoals = parseGoals(ag);

    if (Number.isNaN(homeGoals) || Number.isNaN(awayGoals) || homeGoals === null || awayGoals === null) {
      statusLine.textContent = 'Please enter valid non-negative integer goals for both teams.';
      return;
    }

    btn.disabled = true;
    statusLine.textContent = 'Saving…';

    try {
      await onRegister(homeGoals, awayGoals);
      statusLine.textContent = `Saved: ${homeGoals} - ${awayGoals}`;
    } catch (e) {
      console.error(e);
      statusLine.textContent = `Failed: ${e.message}`;
      btn.disabled = false;
      return;
    }

    btn.disabled = false;
  });

  wrap.appendChild(left);
  wrap.appendChild(hg);
  wrap.appendChild(dash);
  wrap.appendChild(ag);
  wrap.appendChild(right);
  wrap.appendChild(btn);
  wrap.appendChild(statusLine);

  return wrap;
}

function renderMatchRow(idx, matchColl) {
  const root = document.createElement('div');
  root.className = 'match';

  const header = document.createElement('div');
  header.className = 'match-header';

  const title = document.createElement('div');
  title.className = 'match-title';
  title.textContent = `Final Match`;

  const sub = document.createElement('div');
  sub.className = 'match-sub';
  sub.textContent = 'Creates 1 match document in Firestore';

  header.appendChild(title);
  header.appendChild(sub);
  root.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'match-grid';

  const selA = buildSelect();
  const selB = buildSelect();

  const setBtn = document.createElement('button');
  setBtn.textContent = 'Set';
  setBtn.disabled = true;

  const resultEl = document.createElement('div');
  resultEl.className = 'match-result';
  resultEl.style.display = 'none';

  const row = {
    idx,
    root,
    selA,
    selB,
    setBtn,
    resultEl,
    locked: false,
    a: '',
    b: '',
    tieId: ''
  };

  const onChange = () => refreshAllOptions();
  selA.addEventListener('change', onChange);
  selB.addEventListener('change', onChange);

  setBtn.addEventListener('click', async () => {
    const a = toKey(selA.value);
    const b = toKey(selB.value);

    if (!a || !b || a === b) return;

    setBtn.disabled = true;
    selA.disabled = true;
    selB.disabled = true;

    try {
      const tieId = normalizeTieId(leagueEl.value, a, b);

      const batch = writeBatch(db);
      // Final is a single match
      batch.set(doc(db, matchColl, tieId), {
        stage: "Final",
        round: "Final",
        tieId,
        matchupNumber: 1, // Only one match
        leg: 1,           // Kept for schema consistency, but there is no leg 2
        homeTeam: a,      // Administrative Home
        awayTeam: b,      // Administrative Away
        homeGoals: null,
        awayGoals: null,
        status: "scheduled",
        createdAt: serverTimestamp()
      }, { merge: true });

      await batch.commit();

      lockRow(row, matchColl, a, b);

      log(`✅ Final: saved ${a} vs ${b}`, 'ok');
      refreshAllOptions();
    } catch (e) {
      console.error(e);
      log(`❌ Final: ${e.message}`, 'err');
      selA.disabled = false;
      selB.disabled = false;
      refreshAllOptions();
    }
  });

  grid.appendChild(selA);
  grid.appendChild(selB);
  grid.appendChild(setBtn);
  root.appendChild(grid);
  root.appendChild(resultEl);

  rows.push(row);
  return root;
}

async function renderMatchEditor(row, matchColl) {
  const a = row.a;
  const b = row.b;
  const tieId = row.tieId;

  row.resultEl.innerHTML = '';
  row.resultEl.style.display = 'grid';

  const d = await getDoc(doc(db, matchColl, tieId));
  const m = d.exists() ? d.data() : null;

  // Single Match Result UI
  row.resultEl.appendChild(buildResultUI({
    labelLeft: a,
    labelRight: b,
    existingHomeGoals: m?.homeGoals ?? null,
    existingAwayGoals: m?.awayGoals ?? null,
    onRegister: async (hg, ag) => {
      await registerMatchResult(matchColl, tieId, hg, ag);
      log(`✅ Saved Final result for ${a} vs ${b}: ${hg}-${ag}`, 'ok');
    }
  }));
}

function lockRow(row, matchColl, a, b) {
  row.locked = true;
  row.a = a;
  row.b = b;
  row.tieId = normalizeTieId(leagueEl.value, a, b);

  row.selA.value = a;
  row.selB.value = b;
  row.selA.disabled = true;
  row.selB.disabled = true;
  row.setBtn.disabled = true;

  row.root.classList.add('locked');

  renderMatchEditor(row, matchColl).catch(e => {
    console.error(e);
    log(`❌ Failed to load match editor for ${a} vs ${b}: ${e.message}`, 'err');
  });
}

async function loadExistingFinalTie(matchColl) {
  const q = query(
    collection(db, matchColl),
    where('stage', '==', 'Final')
  );

  const snap = await getDocs(q);
  const ties = [];

  snap.forEach(d => {
    const m = d.data() || {};
    const home = toKey(m.homeTeam);
    const away = toKey(m.awayTeam);
    const tieId = toKey(m.tieId);

    if (!home || !away || !tieId) return;
    
    // Incase of duplicates, we push into an array, but we'll only take the first one
    ties.push({ a: home, b: away, tieId });
  });

  return ties;
}

async function loadEligibleTeams() {
  clearLog();
  matchesEl.innerHTML = '';
  eligibleCountEl.textContent = '';
  rows = [];
  allEligibleTeams = [];
  globallyUsedTeams = new Set();

  const league = leagueEl.value;
  const { teamColl, matchColl } = leagueToCollections(league);

  log(`Loading teams from ${teamColl}…`);
  const teamSnap = await getDocs(collection(db, teamColl));
  const allTeams = teamSnap.docs.map(d => d.data() || {});

  allEligibleTeams = allTeams
    .filter(t => !isTruthy(t.eliminated)) 
    .map(t => toKey(t.Name))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  log(`Loading existing Final tie from ${matchColl}…`);
  const existingTies = await loadExistingFinalTie(matchColl);
  log(existingTies.length ? `Found existing Final.` : `No existing Final found.`, existingTies.length ? 'ok' : 'warn');

  // Render 1 match only
  matchesEl.appendChild(renderMatchRow(0, matchColl));

  // Lock row if Final already exists
  const usedByExisting = new Set();
  if (existingTies.length > 0) {
    const t = existingTies[0]; // Take the first matching record
    const a = toKey(t.a);
    const b = toKey(t.b);
    if (a && b) {
      const row = rows[0];
      row.tieId = t.tieId;
      lockRow(row, matchColl, a, b);

      usedByExisting.add(a);
      usedByExisting.add(b);
    }
  }

  // Remove already-used teams from pool
  allEligibleTeams = allEligibleTeams.filter(n => !usedByExisting.has(n));
  eligibleCountEl.textContent = `${allEligibleTeams.length} eligible teams remaining.`;

  refreshAllOptions();

  log(`Ready. Select the 2 teams to play in the Final.`, 'ok');
}

loadBtn.addEventListener('click', () => {
  loadEligibleTeams().catch(e => {
    console.error(e);
    log(`❌ ${e.message}`, 'err');
  });
});