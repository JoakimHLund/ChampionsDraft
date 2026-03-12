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
  setDoc,
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
  return `${league}-playoff-${p}__${q}`.replace(/[^a-z0-9_-]/g, '_');
}

function buildSelect() {
  const sel = document.createElement('select');
  const ph = document.createElement('option');
  ph.value = '';
  ph.textContent = 'Select team…';
  sel.appendChild(ph);
  return sel;
}

// Rows state so we can enforce "team only once" across all ties
let rows = [];
let allEligibleTeams = [];
let globallyUsedTeams = new Set();

function recomputeGlobalUsedTeams() {
  const used = new Set();

  // locked ties
  for (const r of rows) {
    if (r.locked) {
      if (r.a) used.add(r.a);
      if (r.b) used.add(r.b);
    }
  }

  // current picks in unlocked rows
  for (const r of rows) {
    if (!r.locked) {
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

async function registerLegResult(matchColl, docId, homeGoals, awayGoals) {
  await updateDoc(doc(db, matchColl, docId), {
    homeGoals,
    awayGoals,
    status: "played",
    updatedAt: serverTimestamp()
  });
}

function buildLegUI({ labelLeft, labelRight, existingHomeGoals, existingAwayGoals, onRegister }) {
  const wrap = document.createElement('div');
  wrap.className = 'leg';

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
  statusLine.className = 'leg-status';
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
  title.textContent = `Match ${idx + 1}`;

  const sub = document.createElement('div');
  sub.className = 'match-sub';
  sub.textContent = 'Creates 2 legs in Firestore';

  header.appendChild(title);
  header.appendChild(sub);
  root.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'match-grid';

  const selA = buildSelect();
  const selB = buildSelect();

  const matchupNumber = idx + 1;
  const setBtn = document.createElement('button');
  setBtn.textContent = 'Set';
  setBtn.disabled = true;

  const legs = document.createElement('div');
  legs.className = 'legs';
  legs.style.display = 'none'; // shown after set/lock

  const row = {
    idx,
    root,
    selA,
    selB,
    setBtn,
    legsEl: legs,
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
      // create legs
      const tieId = normalizeTieId(leagueEl.value, a, b);
      const leg1Id = `${tieId}-leg1`;
      const leg2Id = `${tieId}-leg2`;

      const batch = writeBatch(db);
      batch.set(doc(db, matchColl, leg1Id), {
        stage: "Playoff",
        round: "Playoff",
        tieId,
        matchupNumber,
        leg: 1,
        homeTeam: a,
        awayTeam: b,
        homeGoals: null,
        awayGoals: null,
        status: "scheduled",
        createdAt: serverTimestamp()
      }, { merge: true });

      batch.set(doc(db, matchColl, leg2Id), {
        stage: "Playoff",
        round: "Playoff",
        tieId,
        matchupNumber,
        leg: 2,
        homeTeam: b,
        awayTeam: a,
        homeGoals: null,
        awayGoals: null,
        status: "scheduled",
        createdAt: serverTimestamp()
      }, { merge: true });

      await batch.commit();

      // lock row
      lockRow(row, matchColl, a, b);

      log(`✅ Match ${idx + 1}: saved ${a} vs ${b}`, 'ok');
      refreshAllOptions();
    } catch (e) {
      console.error(e);
      log(`❌ Match ${idx + 1}: ${e.message}`, 'err');
      selA.disabled = false;
      selB.disabled = false;
      refreshAllOptions();
    }
  });

  grid.appendChild(selA);
  grid.appendChild(selB);
  grid.appendChild(setBtn);
  root.appendChild(grid);
  root.appendChild(legs);

  rows.push(row);
  return root;
}

async function loadLegData(matchColl, tieId) {
  const leg1Id = `${tieId}-leg1`;
  const leg2Id = `${tieId}-leg2`;

  const [d1, d2] = await Promise.all([
    getDoc(doc(db, matchColl, leg1Id)),
    getDoc(doc(db, matchColl, leg2Id))
  ]);

  const m1 = d1.exists() ? d1.data() : null;
  const m2 = d2.exists() ? d2.data() : null;

  return { leg1Id, leg2Id, m1, m2 };
}

async function renderLegEditors(row, matchColl) {
  const a = row.a;
  const b = row.b;
  const tieId = row.tieId;

  row.legsEl.innerHTML = '';
  row.legsEl.style.display = 'grid';

  const { leg1Id, leg2Id, m1, m2 } = await loadLegData(matchColl, tieId);

  // Leg 1: A home vs B away
  row.legsEl.appendChild(buildLegUI({
    labelLeft: a,
    labelRight: b,
    existingHomeGoals: m1?.homeGoals ?? null,
    existingAwayGoals: m1?.awayGoals ?? null,
    onRegister: async (hg, ag) => {
      await registerLegResult(matchColl, leg1Id, hg, ag);
      log(`✅ Saved Leg 1 result for ${a} vs ${b}: ${hg}-${ag}`, 'ok');
    }
  }));

  // Leg 2: B home vs A away
  row.legsEl.appendChild(buildLegUI({
    labelLeft: b,
    labelRight: a,
    existingHomeGoals: m2?.homeGoals ?? null,
    existingAwayGoals: m2?.awayGoals ?? null,
    onRegister: async (hg, ag) => {
      await registerLegResult(matchColl, leg2Id, hg, ag);
      log(`✅ Saved Leg 2 result for ${b} vs ${a}: ${hg}-${ag}`, 'ok');
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

  // show leg editor UI
  renderLegEditors(row, matchColl).catch(e => {
    console.error(e);
    log(`❌ Failed to load leg editors for ${a} vs ${b}: ${e.message}`, 'err');
  });
}

async function loadExistingPlayoffTies(matchColl) {
  const q = query(
    collection(db, matchColl),
    where('stage', '==', 'Playoff')
  );

  const snap = await getDocs(q);

  const ties = new Map(); // tieId -> { a, b, tieId, matchupNumber }

  snap.forEach(d => {
    const m = d.data() || {};
    const home = toKey(m.homeTeam);
    const away = toKey(m.awayTeam);
    const tieId = toKey(m.tieId);
    const matchupNumber = m.matchupNumber ?? 999;

    if (!home || !away || !tieId) return;

    if (!ties.has(tieId)) {
      ties.set(tieId, { a: home, b: away, tieId, matchupNumber });
    }
  });

  return [...ties.values()]
    .sort((x, y) => x.matchupNumber - y.matchupNumber);
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
    .filter(t => !isTruthy(t.eliminated) && !isTruthy(t.playoffbonus))
    .map(t => toKey(t.Name))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  log(`Loading existing playoff ties from ${matchColl}…`);
  const existingTies = await loadExistingPlayoffTies(matchColl);
  log(`Found ${existingTies.length} existing playoff ties.`, existingTies.length ? 'ok' : 'warn');

  // render 8
  for (let i = 0; i < 8; i++) {
    matchesEl.appendChild(renderMatchRow(i, matchColl));
  }

  // lock rows for existing ties (up to 8)
  const usedByExisting = new Set();
  for (let i = 0; i < Math.min(8, existingTies.length); i++) {
    const t = existingTies[i];
    const a = toKey(t.a);
    const b = toKey(t.b);
    if (!a || !b) continue;

    const row = rows[i];
    row.tieId = t.tieId; // use stored tieId
    lockRow(row, matchColl, a, b);

    usedByExisting.add(a);
    usedByExisting.add(b);
  }

  // remove already-used teams from pool
  allEligibleTeams = allEligibleTeams.filter(n => !usedByExisting.has(n));
  eligibleCountEl.textContent = `${allEligibleTeams.length} eligible teams (excluding already-used ties)`;

  refreshAllOptions();

  log(`Ready. Each team can only be used once. Locked ties show result inputs for both legs.`, 'ok');
}

loadBtn.addEventListener('click', () => {
  loadEligibleTeams().catch(e => {
    console.error(e);
    log(`❌ ${e.message}`, 'err');
  });
});
