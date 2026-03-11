import { useState, useEffect } from 'react';
import { initialSatellites } from '../satellites/satelliteData';
import { db } from './firebase'; 
import { ref, set, onValue, update } from 'firebase/database';
import { getManeuverCost, MAX_ACTION_POINTS } from '../rules/constants';

export function useGameEngine() {
  const [roomId, setRoomId] = useState(null);
  const [gameMode, setGameMode] = useState('hotseat'); 
  const [humanFaction, setHumanFaction] = useState('Mercure'); 
  const [gameStarted, setGameStarted] = useState(false);
  const [winner, setWinner] = useState(null);
  const [sats, setSats] = useState(initialSatellites);
  const [turn, setTurn] = useState(1);
  const [currentPlayer, setCurrentPlayer] = useState('Mercure'); 
  
  // Separation stricte PV (Victoire) et PP (Penalite)
  const [scores, setScores] = useState({ celtica: { pv: 0, pp: 0 }, mercure: { pv: 0, pp: 0 } });
  const [actionPoints, setActionPoints] = useState(MAX_ACTION_POINTS);
  
  const [intelUntil, setIntelUntil] = useState({ celtica: 0, mercure: 0 }); 
  const [logs, setLogs] = useState([{ id: 0, text: "[SYSTEME] Moteur C2 operationnel. 5 PA par tour.", color: "#9ca3af" }]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const room = urlParams.get('room');
    if (room) { setRoomId(room); setGameMode('online'); setGameStarted(true); }
  }, []);

  useEffect(() => {
    if (roomId && gameMode === 'online') {
      const roomRef = ref(db, 'rooms/' + roomId);
      const unsubscribe = onValue(roomRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          if (data.hostFaction && !humanFaction && gameMode === 'online') setHumanFaction(data.hostFaction === 'Celtica' ? 'Mercure' : 'Celtica');
          if(data.sats) setSats(data.sats); 
          if(data.scores) setScores(data.scores); 
          if(data.actionPoints !== undefined) setActionPoints(data.actionPoints);
          if(data.turn) setTurn(data.turn);
          if(data.currentPlayer) setCurrentPlayer(data.currentPlayer); 
          if(data.intelUntil) setIntelUntil(data.intelUntil);
          if(data.logs) setLogs(data.logs); 
          if(data.winner) setWinner(data.winner);
          setGameStarted(true);
        }
      });
      return () => unsubscribe();
    }
  }, [roomId, gameMode]);

  const syncState = (newStateUpdates) => {
    if (gameMode === 'online' && roomId) update(ref(db, 'rooms/' + roomId), newStateUpdates);
    else {
      if (newStateUpdates.sats !== undefined) setSats(newStateUpdates.sats);
      if (newStateUpdates.scores !== undefined) setScores(newStateUpdates.scores);
      if (newStateUpdates.actionPoints !== undefined) setActionPoints(newStateUpdates.actionPoints);
      if (newStateUpdates.turn !== undefined) setTurn(newStateUpdates.turn);
      if (newStateUpdates.currentPlayer !== undefined) setCurrentPlayer(newStateUpdates.currentPlayer);
      if (newStateUpdates.intelUntil !== undefined) setIntelUntil(newStateUpdates.intelUntil);
      if (newStateUpdates.logs !== undefined) setLogs(newStateUpdates.logs);
      if (newStateUpdates.winner !== undefined) setWinner(newStateUpdates.winner);
    }
  };

  const getLogArray = (newText, color) => [{ id: Date.now() + Math.random(), text: newText, color }, ...logs].slice(0, 50);

  const startGame = (mode = 'hotseat', faction) => {
    setGameMode(mode); setGameStarted(true); setCurrentPlayer('Mercure'); 
    if (mode === 'online') {
      setHumanFaction(faction);
      const newRoom = Math.random().toString(36).substring(2, 8).toUpperCase();
      setRoomId(newRoom); window.history.pushState({}, '', '?room=' + newRoom);
      const initialState = { hostFaction: faction, sats: initialSatellites, scores: { celtica: {pv: 0, pp: 0}, mercure: {pv: 0, pp: 0} }, actionPoints: MAX_ACTION_POINTS, turn: 1, currentPlayer: 'Mercure', winner: null, intelUntil: { celtica: 0, mercure: 0 }, logs: [{ id: Date.now(), text: `[C2] Salon ${newRoom} cree.`, color: "#38bdf8" }] };
      set(ref(db, 'rooms/' + newRoom), initialState);
    } else {
      setHumanFaction(faction || 'Mercure');
      syncState({ logs: getLogArray(`[C2] Deploiement initial.`, "#ef4444") });
    }
  };

  // Consommation des Points d'Action (PA)
  const consumePA = () => {
    if (actionPoints <= 0) {
      syncState({ logs: getLogArray(`[C2] REJET : Points d'Action epuises. Validez le tour.`, '#ef4444') });
      return false;
    }
    return true;
  };

  const applyErgolCost = (sat, newSats, targetOrbit = null) => {
    const cost = getManeuverCost(sat.orbit, targetOrbit);
    if (sat.ergol < cost) return false;
    newSats[sat.id].ergol -= cost;
    return true;
  };

  const toggleOperational = (satId) => {
    if (!consumePA()) return;
    let newSats = JSON.parse(JSON.stringify(sats));
    const newState = newSats[satId].status === "Opérationnel" ? "Non opérationnel" : "Opérationnel";
    newSats[satId].status = newState;
    syncState({ sats: newSats, actionPoints: actionPoints - 1, logs: getLogArray(`[C2] ${newSats[satId].name} passe en ${newState}. (-1 PA)`, newSats[satId].color) });
  };

  const launchSatellite = (satId, altitude, inclination) => {
    if (!consumePA()) return;
    let newSats = JSON.parse(JSON.stringify(sats));
    const delay = getManeuverCost(newSats[satId].orbit); 
    newSats[satId] = { ...newSats[satId], task: { type: 'LAUNCH', targetRadius: parseFloat(altitude), targetInclination: parseFloat(inclination), turnsLeft: delay }, status: `Préparation tir (${delay} t)` };
    syncState({ sats: newSats, actionPoints: actionPoints - 1, logs: getLogArray(`[ORDRE] Lancement programme (${delay} tours). (-1 PA)`, newSats[satId].color) });
  };

  const startRPO = (attackerId, targetId, customTurns) => {
    if (!consumePA()) return;
    let newSats = JSON.parse(JSON.stringify(sats));
    const attacker = newSats[attackerId]; 
    const target = newSats[targetId];

    if (!applyErgolCost(attacker, newSats, target.orbit)) { 
      syncState({ logs: getLogArray(`[C2] REJET : Ergol insuffisant pour cette manoeuvre.`, '#ef4444') }); 
      return; 
    }
    const duration = parseInt(customTurns, 10);
    newSats[attackerId] = { ...attacker, task: { type: 'RPO', targetId: targetId, expectedRadius: target.radius, turnsLeft: duration }, status: `Approche RPO` };
    syncState({ sats: newSats, actionPoints: actionPoints - 1, logs: getLogArray(`[C2] RPO ordonnee sur ${target.name}. (-1 PA)`, attacker.color) });
  };

  const startCollision = (attackerId, targetId, customTurns) => {
    if (!consumePA()) return;
    let newSats = JSON.parse(JSON.stringify(sats));
    const attacker = newSats[attackerId]; 
    const target = newSats[targetId];

    if (!applyErgolCost(attacker, newSats, target.orbit)) { 
      syncState({ logs: getLogArray(`[C2] REJET : Ergol insuffisant pour cette manoeuvre.`, '#ef4444') }); 
      return; 
    }
    const duration = parseInt(customTurns, 10);
    newSats[attackerId] = { ...attacker, task: { type: 'COLLISION', targetId: targetId, expectedRadius: target.radius, turnsLeft: duration }, status: `Trajectoire d'impact` };
    syncState({ sats: newSats, actionPoints: actionPoints - 1, logs: getLogArray(`[C2] Protocole destruction engage sur ${target.name}. (-1 PA)`, attacker.color) });
  };

  const startEvasion = (satId, newAltitude) => {
    if (!consumePA()) return;
    let newSats = JSON.parse(JSON.stringify(sats));
    const attacker = newSats[satId];
    if (!applyErgolCost(attacker, newSats)) {
      syncState({ logs: getLogArray(`[C2] REJET : Ergol insuffisant pour evasion.`, '#ef4444') }); 
      return;
    }
    const cost = getManeuverCost(newSats[satId].orbit);
    newSats[satId] = { ...newSats[satId], task: { type: 'EVASION', targetRadius: parseFloat(newAltitude), turnsLeft: cost }, status: `Évasion vers ${newAltitude}Mm` };
    syncState({ sats: newSats, actionPoints: actionPoints - 1, logs: getLogArray(`[C2] Evasion d'urgence initiee. (-1 PA)`, newSats[satId].color) });
  };

  const requestAllyIntel = () => {
    if (!consumePA()) return;
    let newSats = JSON.parse(JSON.stringify(sats));
    const allySat = Object.values(newSats).find(s => s.owner === 'Allié' && s.isActive && !s.task);
    if(allySat) {
      newSats[allySat.id] = { ...allySat, task: { type: 'ALLY_INTEL', requester: currentPlayer, turnsLeft: 2 }, status: "Analyse pour " + currentPlayer };
      syncState({ sats: newSats, actionPoints: actionPoints - 1, logs: getLogArray(`[C2] Requete d'intel envoyee aux Allies. (-1 PA)`, "#22c55e") });
    }
  };

  const processTurnResolution = (currentSats, currentScores, currentIntel, activePlayer) => {
    let nextSats = JSON.parse(JSON.stringify(currentSats)); 
    let nextScores = { 
      celtica: { pv: currentScores?.celtica?.pv || 0, pp: currentScores?.celtica?.pp || 0 }, 
      mercure: { pv: currentScores?.mercure?.pv || 0, pp: currentScores?.mercure?.pp || 0 } 
    }; 
    let nextIntel = { ...currentIntel }; let logsToAdd = [];

    Object.values(nextSats).forEach(sat => {
      if ((sat.owner === activePlayer || (activePlayer === 'Allié' && sat.owner === 'Allié')) && sat.task) {
        sat.task.turnsLeft -= 1;
        if (sat.task.turnsLeft <= 0) {
          const task = sat.task;
          const factionKey = sat.owner.toLowerCase();

          if (task.type === 'LAUNCH') { 
            sat.isActive = true; sat.radius = task.targetRadius; sat.currentRadius = task.targetRadius; sat.inclination = task.targetInclination * (Math.PI / 180); sat.status = "Opérationnel"; 
            if(nextScores[factionKey]) nextScores[factionKey].pv += 10;
            logsToAdd.push({ text: `[DEPLOIEMENT] ${sat.name} est en orbite ! (+10 PV)`, color: sat.color }); 
          }
          else if (task.type === 'EVASION') {
            sat.radius = task.targetRadius; sat.currentRadius = task.targetRadius; sat.speed *= 0.9; sat.status = "Opérationnel";
            if (sat.jammedBy) { 
              if (nextSats[sat.jammedBy]) { nextSats[sat.jammedBy].isRPO = false; nextSats[sat.jammedBy].targetId = null; nextSats[sat.jammedBy].status = "Opérationnel"; } 
              sat.jammedBy = null; 
              if(nextScores[factionKey]) nextScores[factionKey].pv += 10;
              logsToAdd.push({ text: `[DEFENSE] ${sat.name} a brise le verrouillage (+10 PV).`, color: sat.color }); 
            }
          }
          else if (task.type === 'RPO') {
            const target = nextSats[task.targetId];
            if (target && target.radius === task.expectedRadius && target.isActive && target.status !== "Non opérationnel") {
              sat.isRPO = true; sat.targetId = target.id; sat.currentRadius = target.radius + 0.08; sat.status = `En RPO`; target.jammedBy = sat.id; 
              if (sat.mainMission === 'Renseignement') {
                if (target.mainMission === 'Renseignement') logsToAdd.push({ text: `[INTEL] Protocoles de ${target.name} interceptes.`, color: sat.color });
                if (target.mainMission === 'Télécommunications') logsToAdd.push({ text: `[INTEL] Flux Telecom de ${target.name} decrypte.`, color: sat.color });
                if (target.mainMission === 'Scientifique') { 
                  if(nextScores[factionKey]) nextScores[factionKey].pv += 5; 
                  logsToAdd.push({ text: `[PIRATAGE] ${sat.name} siphone ${target.name} (+5 PV).`, color: sat.color }); 
                }
                target.status = `Espionné`;
              } else if (sat.mainMission === 'Militaire' && sat.secondaryMission === 'Menace') {
                target.status = `Non opérationnel`; logsToAdd.push({ text: `[SABOTAGE] ${sat.name} a mis hors ligne ${target.name} !`, color: '#ef4444' });
              } else { target.status = `Brouillé`; }
            } else { 
              sat.status = "Opérationnel"; 
              if(nextScores[factionKey]) nextScores[factionKey].pp += 10; // Penalite invisible
              logsToAdd.push({ text: `[ECHEC] RPO ratee, cible invalide.`, color: "#9ca3af" }); 
            }
          }
          else if (task.type === 'COLLISION') {
            const target = nextSats[task.targetId];
            if (target && target.radius === task.expectedRadius && target.isActive) {
              sat.isActive = false; target.isActive = false; sat.status = "DÉTRUIT"; target.status = "DÉTRUIT"; 
              if(nextScores[factionKey]) nextScores[factionKey].pv += 10;
              logsToAdd.push({ text: `[IMPACT] ${sat.name} a detruit sa cible (+10 PV).`, color: "#ef4444" });
            } else { 
              sat.status = "Opérationnel"; 
              if(nextScores[factionKey]) nextScores[factionKey].pp += 10; // Penalite invisible
              logsToAdd.push({ text: `[ECHEC] Frappe cinetique ratee.`, color: "#9ca3af" }); 
            }
          }
          else if (task.type === 'ALLY_INTEL') { sat.status = "Opérationnel"; nextIntel[task.requester.toLowerCase()] = turn + 2; logsToAdd.push({ text: `[ALLIES] Transmission envoyee a ${task.requester}.`, color: "#22c55e" }); }
          sat.task = null;
        }
      }
    });

    // Passif : Generation de PV scientifiques
    Object.values(nextSats).forEach(sat => {
      if (sat.owner === activePlayer && sat.isActive && sat.status === "Opérationnel" && !sat.task && !sat.jammedBy && sat.mainMission === "Scientifique") {
        if(nextScores[activePlayer.toLowerCase()]) nextScores[activePlayer.toLowerCase()].pv += 2;
      }
    });

    return { nextSats, nextScores, nextIntel, nextLogs: logsToAdd };
  };

  const endTurn = () => {
    if (gameMode === 'solo' && currentPlayer !== humanFaction) return;
    resolveTurnLoop(currentPlayer);
  };

  const resolveTurnLoop = (playerToResolve) => {
    const { nextSats, nextScores, nextIntel, nextLogs } = processTurnResolution(sats, scores, intelUntil, playerToResolve);
    let compiledLogs = [...logs];
    nextLogs.reverse().forEach(log => { compiledLogs = [{ id: Date.now() + Math.random(), text: log.text, color: log.color }, ...compiledLogs].slice(0,50) });

    let nextPlayer; let nextTurn = turn;
    if (playerToResolve === 'Mercure') nextPlayer = 'Celtica'; else if (playerToResolve === 'Celtica') nextPlayer = 'Allié'; else { nextPlayer = 'Mercure'; nextTurn += 1; }
    
    let nextWinner = winner;
    // Condition de Victoire (250 PV) ou Defaite adverse via penalite (100 PP)
    if (nextScores.mercure.pv >= 250 || nextScores.celtica.pp >= 100) nextWinner = "MERCURE"; 
    else if (nextScores.celtica.pv >= 250 || nextScores.mercure.pp >= 100) nextWinner = "CELTICA";

    // Recharge les points d'actions a 5 pour le joueur suivant
    syncState({ sats: nextSats, scores: nextScores, intelUntil: nextIntel, logs: compiledLogs, currentPlayer: nextPlayer, turn: nextTurn, winner: nextWinner, actionPoints: MAX_ACTION_POINTS });
  };

  useEffect(() => {
    if (gameStarted && !winner && ((gameMode === 'solo' && currentPlayer !== humanFaction && currentPlayer !== 'Allié') || currentPlayer === 'Allié')) {
      const aiTimer = setTimeout(() => {
        if (currentPlayer === 'Allié') { resolveTurnLoop('Allié'); return; }
        let clonedSats = JSON.parse(JSON.stringify(sats));
        const aiFaction = currentPlayer; const enemyFaction = humanFaction;
        const aiActive = Object.values(clonedSats).filter(s => s.owner === aiFaction && s.isActive);
        const aiInactive = Object.values(clonedSats).filter(s => s.owner === aiFaction && !s.isActive);
        const enemyActive = Object.values(clonedSats).filter(s => s.owner === enemyFaction && s.isActive);
        let actionTaken = false;

        aiActive.forEach(sat => {
          if (sat.jammedBy && !sat.task && sat.ergol >= getManeuverCost(sat.orbit)) {
            const cost = getManeuverCost(sat.orbit); sat.task = { type: 'EVASION', targetRadius: sat.radius + 0.5, turnsLeft: cost }; sat.status = `Évasion`; sat.ergol -= cost; actionTaken = true;
          }
        });

        if (aiInactive.length > 0 && !actionTaken) {
          const satToLaunch = aiInactive[0]; const targetRad = satToLaunch.orbit === 'GEO' ? 14.5 : (satToLaunch.orbit === 'MEO' ? 8.0 : 3.5);
          satToLaunch.task = { type: 'LAUNCH', targetRadius: targetRad, targetInclination: 25, turnsLeft: getManeuverCost(satToLaunch.orbit) }; satToLaunch.status = "Préparation tir"; actionTaken = true;
        }

        const military = aiActive.filter(s => s.canRPO && !s.jammedBy && !s.task && s.ergol >= getManeuverCost(s.orbit));
        const enemyScience = enemyActive.filter(s => s.mainMission === 'Scientifique' && !s.jammedBy && !s.task);
        if (military.length > 0 && enemyScience.length > 0 && !actionTaken) {
          const attacker = military[0]; const target = enemyScience[0]; const cost = getManeuverCost(attacker.orbit, target.orbit);
          if (attacker.ergol >= cost) {
            attacker.task = { type: 'RPO', targetId: target.id, expectedRadius: target.radius, turnsLeft: cost }; attacker.status = `Approche RPO`; attacker.ergol -= cost; actionTaken = true;
          }
        }

        const { nextSats, nextScores, nextIntel, nextLogs } = processTurnResolution(clonedSats, scores, intelUntil, aiFaction);
        let compiledLogs = [...logs]; nextLogs.reverse().forEach(log => { compiledLogs = [{ id: Date.now() + Math.random(), text: log.text, color: log.color }, ...compiledLogs].slice(0,50) });
        
        let nextPlayer = aiFaction === 'Mercure' ? 'Celtica' : 'Allié'; 
        let nextWinner = nextScores[aiFaction.toLowerCase()]?.pv >= 250 || nextScores[enemyFaction.toLowerCase()]?.pp >= 100 ? aiFaction.toUpperCase() : winner;
        syncState({ sats: nextSats, scores: nextScores, intelUntil: nextIntel, logs: compiledLogs, currentPlayer: nextPlayer, winner: nextWinner, actionPoints: MAX_ACTION_POINTS });
      }, 1500); 
      return () => clearTimeout(aiTimer);
    }
  }, [currentPlayer, gameStarted, gameMode, winner, humanFaction]);

  return { roomId, gameMode, humanFaction, gameStarted, winner, sats, turn, currentPlayer, scores, intelUntil, logs, actionPoints, getMinTurns: getManeuverCost, startGame, endTurn, toggleOperational, launchSatellite, startRPO, startCollision, startEvasion, requestAllyIntel };
}