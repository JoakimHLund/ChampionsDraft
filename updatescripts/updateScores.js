// updatescripts/updateScores.js
import { db } from './db.js';
import {
  collection, getDocs, doc, writeBatch
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const BONUS_VALUES = {
  playoffbonus: 5,
  qfbonus: 4,
  sfbonus: 6,
  finalbonus: 8,
  winnerbonus: 10
};

export function initUpdateScores() {
  const logEl = document.getElementById('log');
  const log = (msg, cls = '') => {
    const p = document.createElement('div');
    if (cls) p.className = cls;
    p.textContent = msg;
    logEl.appendChild(p);
  };

  const toNameKey = (s) => (s ?? '').toString().trim();
  const isTruthy = (v) => v === true || v === 1 || v === 'true' || v === '1';

  function calcBonusPoints(teamDoc) {
    let sum = 0;
    for (const [field, pts] of Object.entries(BONUS_VALUES)) {
      if (isTruthy(teamDoc?.[field])) sum += pts;
    }
    return sum;
  }

  async function updateCompetitionScores(compName, teamColl, matchColl) {
    log(`🔄 Updating ${compName} team scores…`);

    // Fetch teams
    const teamsSnap = await getDocs(collection(db, teamColl));
    const teams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Fetch matches
    const matchesSnap = await getDocs(collection(db, matchColl));
    const matches = matchesSnap.docs.map(d => d.data());

    // Init maps
    const teamScores = {};
    const gamesPlayed = {};
    for (const t of teams) {
      const k = toNameKey(t.Name);
      teamScores[k] = 0;
      gamesPlayed[k] = 0;
    }

    // League phase only
    for (const m of matches) {
      if (m?.stage !== "League phase") continue;

      const hg = m.homeGoals, ag = m.awayGoals;
      if (hg == null || ag == null) continue; // not played

      const home = toNameKey(m.homeTeam);
      const away = toNameKey(m.awayTeam);
      if (!home || !away) continue;

      // Count games played (league phase only)
      gamesPlayed[home] = (gamesPlayed[home] ?? 0) + 1;
      gamesPlayed[away] = (gamesPlayed[away] ?? 0) + 1;

      // Assign points (league phase)
      if (hg > ag) {
        teamScores[home] = (teamScores[home] ?? 0) + 3;
      } else if (hg < ag) {
        teamScores[away] = (teamScores[away] ?? 0) + 3;
      } else {
        teamScores[home] = (teamScores[home] ?? 0) + 1;
        teamScores[away] = (teamScores[away] ?? 0) + 1;
      }
    }

    // Batch update: leaguepoints, gamesplayed, bonuspoints, totalScore
    const batch = writeBatch(db);
    let updated = 0;

    for (const team of teams) {
      const nameKey = toNameKey(team.Name);

      const leaguepoints = teamScores[nameKey] ?? 0;
      const played = gamesPlayed[nameKey] ?? 0;

      const bonuspoints = calcBonusPoints(team);
      const multiplier = Number(team.multiplier ?? 1.0);

      const totalScore = (leaguepoints + bonuspoints) * multiplier;

      batch.update(doc(db, teamColl, team.id), {
        leaguepoints,
        gamesplayed: played,
        bonuspoints,
        totalScore
      });

      updated++;
    }

    await batch.commit();
    log(`✅ ${compName}: Updated ${updated} teams.`, 'ok');
  }

  const setups = [
    { id: 'update-cl-scores-btn', comp: 'Champions League', teams: 'CLTeams', matches: 'CLMatches' },
    { id: 'update-el-scores-btn', comp: 'Europa League',    teams: 'ELTeams', matches: 'ELMatches' },
    { id: 'update-ec-scores-btn', comp: 'Conference League',teams: 'ECTeams', matches: 'ECMatches' }
  ];

  setups.forEach(({ id, comp, teams, matches }) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('click', async () => {
      logEl.innerHTML = '';
      try {
        await updateCompetitionScores(comp, teams, matches);
      } catch (err) {
        console.error(err);
        log(`Error: ${err.message}`, 'err');
      }
    });
  });
}
