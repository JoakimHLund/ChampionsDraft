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
  const normStage = (s) => (s ?? '').toString().trim().toLowerCase();

  function calcBonusPoints(teamDoc) {
    let sum = 0;
    for (const [field, pts] of Object.entries(BONUS_VALUES)) {
      if (isTruthy(teamDoc?.[field])) sum += pts;
    }
    return sum;
  }

  function applyResult(pointsMap, home, away, hg, ag) {
    if (hg > ag) {
      pointsMap[home] = (pointsMap[home] ?? 0) + 3;
    } else if (hg < ag) {
      pointsMap[away] = (pointsMap[away] ?? 0) + 3;
    } else {
      pointsMap[home] = (pointsMap[home] ?? 0) + 1;
      pointsMap[away] = (pointsMap[away] ?? 0) + 1;
    }
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
    const leaguePoints = {};
    const matchPoints = {};
    const leagueGamesPlayed = {};
    const otherGamesPlayed = {}; // optional, useful for debugging

    for (const t of teams) {
      const k = toNameKey(t.Name);
      leaguePoints[k] = 0;
      matchPoints[k] = 0;
      leagueGamesPlayed[k] = 0;
      otherGamesPlayed[k] = 0;
    }

    for (const m of matches) {
      const hg = m.homeGoals, ag = m.awayGoals;
      if (hg == null || ag == null) continue; // only count played (score set)

      const home = toNameKey(m.homeTeam);
      const away = toNameKey(m.awayTeam);
      if (!home || !away) continue;

      const stage = normStage(m.stage);
      const isLeague = stage === 'league phase';

      if (isLeague) {
        leagueGamesPlayed[home] = (leagueGamesPlayed[home] ?? 0) + 1;
        leagueGamesPlayed[away] = (leagueGamesPlayed[away] ?? 0) + 1;
        applyResult(leaguePoints, home, away, hg, ag);
      } else {
        otherGamesPlayed[home] = (otherGamesPlayed[home] ?? 0) + 1;
        otherGamesPlayed[away] = (otherGamesPlayed[away] ?? 0) + 1;
        applyResult(matchPoints, home, away, hg, ag);
      }
    }

    // Batch update teams
    const batch = writeBatch(db);
    let updated = 0;

    for (const team of teams) {
      const nameKey = toNameKey(team.Name);

      const leaguepoints = leaguePoints[nameKey] ?? 0;
      const matchpoints  = matchPoints[nameKey] ?? 0;

      const gamesplayed = leagueGamesPlayed[nameKey] ?? 0; // keep this as league games
      const bonuspoints = calcBonusPoints(team);
      const multiplier = Number(team.multiplier ?? 1.0);

      const totalScore = (leaguepoints + matchpoints + bonuspoints) * multiplier;

      batch.update(doc(db, teamColl, team.id), {
        leaguepoints,
        matchpoints,
        gamesplayed,
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