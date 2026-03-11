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
  const [scores, setScores] = useState({ celtica: { pv: 0, pp: 0 }, mercure: { pv: 0, pp: 0 } });
  const [actionPoints, setActionPoints] = useState(MAX_ACTION_POINTS);
  const [intelUntil, setIntelUntil] = useState({ celtica: 0, mercure: 0 }); 
  const [logs, setLogs] = useState([{ id: 0, text: "[SYSTEME] Protocoles de manoeuvres C2 engages.", color: "#9ca3af" }]);

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
          if(data.sats) setSats(data.sats); if(data.scores) setScores(data.scores); if(data.actionPoints !== undefined) setActionPoints(data.actionPoints);
          if(data.turn) setTurn(data.turn); if(data.currentPlayer) setCurrentPlayer(data.currentPlayer); 
          if(data.intelUntil) setIntelUntil(data.intelUntil); if(data.logs) setLogs(data.logs); if(data.winner) setWinner(data.winner);
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
      setHumanFaction(faction); const newRoom = Math.random().toString(36).substring(2, 8).toUpperCase();
      setRoomId(newRoom); window.history.pushState({}, '', '?room=' + newRoom);
      set(ref(db, 'rooms/' + newRoom), { hostFaction: faction, sats: initialSatellites, scores: { celtica: {pv: 0, pp: 0}, mercure: {pv: 0, pp: 0} }, actionPoints: MAX_ACTION_POINTS, turn: 1, currentPlayer: 'Mercure', winner: null, intelUntil: { celtica: 0, mercure: 0 }, logs: [{ id: Date.now(), text: `[C2] Salon ${newRoom} cree.`, color: "#38bdf8" }] });
    } else {
      setHumanFaction(faction || 'Mercure'); syncState({ logs: getLogArray(`[C2] Deploiement initial.`, "#ef4444") });
    }
  };

  const consumePA = () => {
    if (actionPoints <= 0) { syncState({ logs: getLogArray(`[REJET] Points d'Action epuises.`, '#ef4444') }); return false; }
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
    newSats[satId].status = newSats[satId].status === "Opérationnel" ? "Non opérationnel" : "Opérationnel";
    syncState({ sats: newSats, actionPoints: actionPoints - 1, logs: getLogArray(`[C2] ${newSats[satId].name} change de statut. (-1 PA)`, newSats[satId].color) });
  };

  const launchSatellite = (satId, altitude, inclination) => {
    if (!consumePA()) return;
    let newSats = JSON.parse(JSON.stringify(sats));
    const delay = getManeuverCost(newSats[satId].orbit); 
    newSats[satId] = { ...newSats[satId], task: { type: 'LAUNCH', targetRadius: parseFloat(altitude), targetInclination: parseFloat(inclination), turnsLeft: delay, initialTurns: delay }, status: `Lancement (Phase 1/${delay})` };
    syncState({ sats: newSats, actionPoints: actionPoints - 1, logs: getLogArray(`[ORDRE] Tir programme. (-1 PA)`, newSats[satId].color) });
  };

  // RPO fixe a 3 Tours (Acceleration, Avancee, Stabilisation)
  const startRPO = (attackerId, targetId) => {
    if (!consumePA()) return;
    let newSats = JSON.parse(JSON.stringify(sats));
    if (!applyErgolCost(newSats[attackerId], newSats, newSats[targetId].orbit)) { syncState({ logs: getLogArray(`[REJET] Ergol insuffisant.`, '#ef4444') }); return; }
    
    // Le nombre de tours est 3 strictement, + penalite de transfert d'orbite si applicable
    const duration = getManeuverCost(newSats[attackerId].orbit, newSats[targetId].orbit) === 1 ? 3 : 5;
    
    newSats[attackerId] = { ...newSats[attackerId], task: { type: 'RPO', targetId: targetId, expectedRadius: newSats[targetId].radius, turnsLeft: duration, initialTurns: duration }, status: `RPO : Accélération` };
    syncState({ sats: newSats, actionPoints: actionPoints - 1, logs: getLogArray(`[C2] RPO ordonnee sur ${newSats[targetId].name}. (-1 PA)`, newSats[attackerId].color) });
  };

  const startCollision = (attackerId, targetId) => {
    if (!consumePA()) return;
    let newSats = JSON.parse(JSON.stringify(sats));
    if (!applyErgolCost(newSats[attackerId], newSats, newSats[targetId].orbit)) { syncState({ logs: getLogArray(`[REJET] Ergol insuffisant.`, '#ef4444') }); return; }
    
    const duration = getManeuverCost(newSats[attackerId].orbit, newSats[targetId].orbit) === 1 ? 3 : 5;
    newSats[attackerId] = { ...newSats[attackerId], task: { type: 'COLLISION', targetId: targetId, expectedRadius: newSats[targetId].radius, turnsLeft: duration, initialTurns: duration }, status: `Impact : Accélération` };
    syncState({ sats: newSats, actionPoints: actionPoints - 1, logs: getLogArray(`[C2] Collision ordonnee sur ${newSats[targetId].name}. (-1 PA)`, newSats[attackerId].color) });
  };

  const startEvasion = (satId, newAltitude) => {
    if (!consumePA()) return;
    let newSats = JSON.parse(JSON.stringify(sats));
    if (!applyErgolCost(newSats[satId], newSats)) { syncState({ logs: getLogArray(`[REJET] Ergol insuffisant.`, '#ef4444') }); return; }
    const cost = getManeuverCost(newSats[satId].orbit);
    newSats[satId] = { ...newSats[satId], task: { type: 'EVASION', targetRadius: parseFloat(newAltitude), turnsLeft: cost, initialTurns: cost }, status: `Évasion initiée` };
    syncState({ sats: newSats, actionPoints: actionPoints - 1, logs: getLogArray(`[C2] Evasion d'urgence ordonnee. (-1 PA)`, newSats[satId].color) });
  };

  const requestAllyIntel = () => {
    if (!consumePA()) return;
    let newSats = JSON.parse(JSON.stringify(sats));
    const allySat = Object.values(newSats).find(s => s.owner === 'Allié' && s.isActive && !s.task);
    if(allySat) {
      newSats[allySat.id] = { ...allySat, task: { type: 'ALLY_INTEL', requester: currentPlayer, turnsLeft: 2, initialTurns: 2 }, status: "Analyse reseau" };
      syncState({ sats: newSats, actionPoints: actionPoints - 1, logs: getLogArray(`[C2] Requete d'intel envoyee aux Allies. (-1 PA)`, "#22c55e") });
    }
  };

  // NOUVELLE ACTION MILITAIRE : EJECTION PAR BRAS ROBOTISE
  const startEjection = (attackerId, targetId) => {
    if (!consumePA()) return;
    let newSats = JSON.parse(JSON.stringify(sats));
    const attacker = newSats[attackerId];
    const target = newSats[targetId];

    // Execution immediate car deja en RPO
    target.isActive = false;
    target.status = "DÉTRUIT (Éjecté)";
    attacker.status = "Opérationnel";
    attacker.isRPO = false;
    attacker.targetId = null;

    let nextScores = { ...scores };
    const factionKey = attacker.owner.toLowerCase();
    const targetKey = target.owner.toLowerCase();

    if(nextScores[factionKey]) nextScores[factionKey].pv += 20; // Recompense forte pour une action complexe
    if(nextScores[targetKey]) nextScores[targetKey].pp += 15; // Grosse penalite pour la perte d'un satellite

    syncState({ sats: newSats, scores: nextScores, actionPoints: actionPoints - 1, logs: getLogArray(`[MILITAIRE] Le bras robotise de ${attacker.name} a ejecte ${target.name} ! (+20 PV)`, attacker.color) });
  };

  const processTurnResolution = (currentSats, currentScores, currentIntel, activePlayer) => {
    let nextSats = JSON.parse(JSON.stringify(currentSats)); 
    let nextScores = { celtica: { pv: currentScores?.celtica?.pv || 0, pp: currentScores?.celtica?.pp || 0 }, mercure: { pv: currentScores?.mercure?.pv || 0, pp: currentScores?.mercure?.pp || 0 } }; 
    let nextIntel = { ...currentIntel }; let logsToAdd = [];

    Object.values(nextSats).forEach(sat => {
      if ((sat.owner === activePlayer || (activePlayer === 'Allié' && sat.owner === 'Allié')) && sat.task) {
        sat.task.turnsLeft -= 1;
        const current = sat.task.turnsLeft;
        const factionKey = sat.owner.toLowerCase();

        // GESTION DES PHASES DE MANOEUVRES
        if (current > 0) {
          if (sat.task.type === 'RPO' || sat.task.type === 'COLLISION') {
             if (current === 2) sat.status = "RPO : Avancée";
             else if (current === 1) sat.status = "RPO : Stabilisation";
             else sat.status = "RPO : Transfert d'orbite";
          }
        }
        
        if (current <= 0) {
          const task = sat.task;
          if (task.type === 'LAUNCH') { sat.isActive = true; sat.radius = task.targetRadius; sat.currentRadius = task.targetRadius; sat.inclination = task.targetInclination * (Math.PI / 180); sat.status = "Opérationnel"; if(nextScores[factionKey]) nextScores[factionKey].pv += 10; logsToAdd.push({ text: `[DEPLOIEMENT] ${sat.name} est en orbite ! (+10 PV)`, color: sat.color }); }
          else if (task.type === 'EVASION') { sat.radius = task.targetRadius; sat.currentRadius = task.targetRadius; sat.speed *= 0.9; sat.status = "Opérationnel"; if (sat.jammedBy) { if (nextSats[sat.jammedBy]) { nextSats[sat.jammedBy].isRPO = false; nextSats[sat.jammedBy].targetId = null; nextSats[sat.jammedBy].status = "Opérationnel"; } sat.jammedBy = null; if(nextScores[factionKey]) nextScores[factionKey].pv += 10; logsToAdd.push({ text: `[DEFENSE] ${sat.name} a brise le verrouillage (+10 PV).`, color: sat.color }); } }
          else if (task.type === 'RPO') {
            const target = nextSats[task.targetId];
            if (target && target.radius === task.expectedRadius && target.isActive && target.status !== "Non opérationnel") {
              sat.isRPO = true; sat.targetId = target.id; sat.currentRadius = target.radius + 0.08; sat.status = `En RPO`; target.jammedBy = sat.id; 
              if (sat.mainMission === 'Renseignement') {
                target.status = `Espionné`;
                if (target.mainMission === 'Scientifique') { if(nextScores[factionKey]) nextScores[factionKey].pv += 5; logsToAdd.push({ text: `[PIRATAGE] ${sat.name} siphone ${target.name} (+5 PV).`, color: sat.color }); }
                else { logsToAdd.push({ text: `[INTEL] ${sat.name} a infiltre les systemes de ${target.name}.`, color: sat.color }); }
              } else if (sat.mainMission === 'Militaire' && sat.secondaryMission === 'Menace') {
                target.status = `Non opérationnel`; logsToAdd.push({ text: `[SABOTAGE] ${sat.name} a mis hors ligne ${target.name} !`, color: '#ef4444' });
              } else if (sat.sub === 'Bras Robotisé') {
                logsToAdd.push({ text: `[MILITAIRE] ${sat.name} est en position d'ejection sur ${target.name}.`, color: sat.color });
              } else { target.status = `Brouillé`; }
            } else { sat.status = "Opérationnel"; if(nextScores[factionKey]) nextScores[factionKey].pp += 10; logsToAdd.push({ text: `[ECHEC] RPO ratee sur position vide.`, color: "#9ca3af" }); }
          }
          else if (task.type === 'COLLISION') {
            const target = nextSats[task.targetId];
            if (target && target.radius === task.expectedRadius && target.isActive) {
              sat.isActive = false; target.isActive = false; sat.status = "DÉTRUIT"; target.status = "DÉTRUIT"; if(nextScores[factionKey]) nextScores[factionKey].pv += 10; logsToAdd.push({ text: `[IMPACT] ${sat.name} a detruit sa cible (+10 PV).`, color: "#ef4444" });
            } else { sat.status = "Opérationnel"; if(nextScores[factionKey]) nextScores[factionKey].pp += 10; logsToAdd.push({ text: `[ECHEC] Frappe cinetique ratee.`, color: "#9ca3af" }); }
          }
          else if (task.type === 'ALLY_INTEL') { sat.status = "Opérationnel"; nextIntel[task.requester.toLowerCase()] = turn + 2; logsToAdd.push({ text: `[ALLIES] Transmission envoyee a ${task.requester}.`, color: "#22c55e" }); }
          sat.task = null;
        }
      }
    });

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
    let compiledLogs = [...logs]; nextLogs.reverse().forEach(log => { compiledLogs = [{ id: Date.now() + Math.random(), text: log.text, color: log.color }, ...compiledLogs].slice(0,50) });

    let nextPlayer; let nextTurn = turn;
    if (playerToResolve === 'Mercure') nextPlayer = 'Celtica'; else if (playerToResolve === 'Celtica') nextPlayer = 'Allié'; else { nextPlayer = 'Mercure'; nextTurn += 1; }
    
    let nextWinner = winner;
    if (nextScores.mercure.pv >= 250 || nextScores.celtica.pp >= 100) nextWinner = "MERCURE"; 
    else if (nextScores.celtica.pv >= 250 || nextScores.mercure.pp >= 100) nextWinner = "CELTICA";

    syncState({ sats: nextSats, scores: nextScores, intelUntil: nextIntel, logs: compiledLogs, currentPlayer: nextPlayer, turn: nextTurn, winner: nextWinner, actionPoints: MAX_ACTION_POINTS });
  };

  // IA simplifiee (omise par brieveite, garde les memes appels qu'avant mais sans input manuel de tours)
  // ... (Garde ta logique IA actuelle ou je peux te la redonner complete si besoin)

  return { roomId, gameMode, humanFaction, gameStarted, winner, sats, turn, currentPlayer, scores, intelUntil, logs, actionPoints, getMinTurns: getManeuverCost, startGame, endTurn, toggleOperational, launchSatellite, startRPO, startCollision, startEvasion, requestAllyIntel, startEjection };
}