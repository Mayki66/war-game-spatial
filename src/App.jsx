import React, { useState, Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera, PerspectiveCamera } from '@react-three/drei';

import { useGameEngine } from './engine/useGameEngine';
import { RulesModal } from './docs/RulesModal';
import { TableModal } from './satellites/SsaModal';
import { AnimatedSatellite } from './satellites/Satellite3D';
import { Stars, Sun, Moon, RealEarth } from './core/SceneEnvironment';

export default function App() {
  const game = useGameEngine();
  const earthRef = useRef();

  const [selectedSatInfo, setSelectedSatInfo] = useState(null);
  const [isRulesOpen, setIsRulesOpen] = useState(true);
  const [isSsaTableOpen, setIsSsaTableOpen] = useState(false);
  const [isHangarOpen, setIsHangarOpen] = useState(false);
  
  const [viewMode, setViewMode] = useState('3D'); 
  const [cartoFilter, setCartoFilter] = useState('ALL'); 

  const [activeMenu, setActiveMenu] = useState(null); 
  const [activeC2Tab, setActiveC2Tab] = useState(null); 
  const [activeSubAction, setActiveSubAction] = useState(null); 
  
  const [actionSatId, setActionSatId] = useState("");
  const [actionTargetId, setActionTargetId] = useState("");
  const [actionTurns, setActionTurns] = useState(""); 
  const [inputAltitude, setInputAltitude] = useState("");
  const [inputInclination, setInputInclination] = useState("");

  const isMyTurn = game.gameMode === 'hotseat' ? true : game.currentPlayer === game.humanFaction;
  const currentViewFaction = game.gameMode === 'hotseat' ? game.currentPlayer : game.humanFaction;
  const isMercureView = currentViewFaction === 'Mercure';
  
  const themeColor = isMercureView ? '#ef4444' : '#3b82f6';
  const themeBgDark = isMercureView ? '#1c0707' : '#0b101a';
  const themePanelBg = isMercureView ? '#140505' : '#131c2d';
  const themeBorder = isMercureView ? '#5c1a1a' : '#253552';

  const hasIntel = game.intelUntil[currentViewFaction.toLowerCase()] >= game.turn;

  const myActiveSats = Object.values(game.sats).filter(s => s.owner === currentViewFaction && s.isActive);
  const myInactiveSats = Object.values(game.sats).filter(s => s.owner === currentViewFaction && !s.isActive);
  const enemyActiveSats = Object.values(game.sats).filter(s => s.owner !== currentViewFaction && s.owner !== 'Allié' && s.isActive);

  const displayFilter = viewMode === '2D' ? 'GEO' : cartoFilter;
  const renderedSats = Object.values(game.sats).filter(sat => displayFilter === 'ALL' || sat.orbit === displayFilter);

  const btnStyle = { backgroundColor: '#1e293b', border: `1px solid ${themeBorder}`, color: '#e2e8f0', padding: '12px', fontSize: '11px', cursor: isMyTurn && game.actionPoints > 0 ? 'pointer' : 'not-allowed', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px', opacity: isMyTurn && game.actionPoints > 0 ? 1 : 0.5 };
  const tabStyle = { flex: 1, backgroundColor: '#0f172a', border: `1px solid ${themeBorder}`, color: '#94a3b8', padding: '8px', fontSize: '10px', cursor: isMyTurn ? 'pointer' : 'not-allowed', textTransform: 'uppercase' };

  const handleStart = (mode, faction) => { if (!game.gameStarted) game.startGame(mode, faction); setIsRulesOpen(false); }

  const getMaskedSatStatus = (sat) => {
    if (sat.owner === currentViewFaction || sat.owner === 'Allié') return sat.status;
    if (hasIntel) return sat.status;
    return "Donnees cryptees";
  };

  const executeAction = () => { setActiveMenu(null); setActiveC2Tab(null); setActiveSubAction(null); setActionSatId(""); setActionTargetId(""); setActionTurns(""); };

  const currentPVMercure = game.scores?.mercure?.pv || 0;
  const currentPVCeltica = game.scores?.celtica?.pv || 0;

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', backgroundColor: themeBgDark, color: '#94a3b8', fontFamily: '"Segoe UI", Roboto, Helvetica, sans-serif', overflow: 'hidden', position: 'relative' }}>
      
      {game.gameStarted && game.gameMode === 'online' && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', backgroundColor: themeColor, color: '#fff', textAlign: 'center', padding: '8px', zIndex: 50, fontSize: '12px', fontWeight: 'bold' }}>
          [RESEAU] SALON EN LIGNE ({currentViewFaction.toUpperCase()}) - Partager cette URL : <span style={{ backgroundColor: '#000', padding: '4px 8px', margin: '0 10px', borderRadius: '4px', userSelect: 'all' }}>{window.location.href}</span>
        </div>
      )}

      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} gameStarted={game.gameStarted} onStart={handleStart} />
      <TableModal isOpen={isSsaTableOpen} onClose={() => setIsSsaTableOpen(false)} sats={Object.values(game.sats).filter(s => s.isActive)} currentViewFaction={currentViewFaction} getMaskedSatStatus={getMaskedSatStatus} themeColor={themeColor} title="BASE DE DONNEES SSA" isHangar={false} toggleOperational={game.toggleOperational} />
      <TableModal isOpen={isHangarOpen} onClose={() => setIsHangarOpen(false)} sats={myInactiveSats} currentViewFaction={currentViewFaction} getMaskedSatStatus={getMaskedSatStatus} themeColor={themeColor} title="HANGAR (UNITES INACTIVES)" isHangar={true} toggleOperational={game.toggleOperational} />

      {/* PANNEAU GAUCHE - C2 (20%) */}
      <div style={{ width: '20%', backgroundColor: themePanelBg, borderRight: `1px solid ${themeBorder}`, display: 'flex', flexDirection: 'column', zIndex: 10, transition: 'opacity 0.3s', opacity: isMyTurn ? 1 : 0.6, marginTop: (game.gameMode === 'online') ? '32px' : '0' }}>
        
        {/* EN-TETE C2 AVEC POINTS D'ACTION */}
        <div style={{ padding: '15px 20px', borderBottom: `1px solid ${themeBorder}`, backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div style={{ fontSize: '14px', letterSpacing: '2px', color: themeColor, fontWeight: 'bold', textAlign: 'center', marginBottom: '15px' }}>CENTRE DE COMMANDEMENT</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '10px', color: '#fff' }}>FACTION : {currentViewFaction.toUpperCase()}</div>
            <div style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold', backgroundColor: '#1e293b', padding: '4px 8px', border: `1px solid ${themeColor}` }}>
              PA : <span style={{ color: themeColor }}>{game.actionPoints}/5</span>
            </div>
          </div>
        </div>

        <div style={{ padding: '15px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', pointerEvents: isMyTurn ? 'auto' : 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <button style={{...btnStyle, borderColor: activeMenu==='C2'?themeColor:themeBorder}} onClick={() => {if(isMyTurn) setActiveMenu(activeMenu === 'C2' ? null : 'C2')}}>Command & Control (C2)</button>
            <button style={{...btnStyle, borderColor: activeMenu==='LANCEMENTS'?themeColor:themeBorder}} onClick={() => {if(isMyTurn) setActiveMenu(activeMenu === 'LANCEMENTS' ? null : 'LANCEMENTS')}}>Lancements</button>
            <button style={{...btnStyle, borderColor: activeMenu==='SSA'?themeColor:themeBorder, opacity: isMyTurn ? 1 : 0.5}} onClick={() => {if(isMyTurn) setActiveMenu(activeMenu === 'SSA' ? null : 'SSA')}}>Systeme SSA</button>
          </div>

          {activeMenu === 'SSA' && (
            <div style={{ backgroundColor: '#000', padding: '15px', border: `1px solid ${themeBorder}`, marginBottom: '20px' }}>
              <button onClick={() => setIsSsaTableOpen(true)} style={{...btnStyle, width: '100%', marginBottom: '10px', backgroundColor: '#0f172a', opacity: 1}}>Ouvrir Tableau SSA</button>
              <button onClick={() => setIsHangarOpen(true)} style={{...btnStyle, width: '100%', marginBottom: '10px', backgroundColor: '#0f172a', opacity: 1}}>Ouvrir Hangar Faction</button>
              <div style={{ marginTop: '10px', borderTop: '1px solid #333', paddingTop: '10px' }}>
                <div style={{ color: '#fff', fontSize: '11px', marginBottom: '5px' }}>FILTRES CARTOGRAPHIE 3D :</div>
                <select value={cartoFilter} onChange={(e) => setCartoFilter(e.target.value)} disabled={viewMode === '2D'} style={{ width: '100%', padding: '8px', backgroundColor: '#1e293b', color: viewMode === '2D' ? '#64748b' : '#fff', border: 'none' }}>
                  <option value="ALL">Afficher toutes les orbites</option><option value="LEO">Orbite LEO uniquement</option><option value="MEO">Orbite MEO uniquement</option><option value="GEO">Orbite GEO uniquement</option>
                </select>
                {viewMode === '2D' && <div style={{ fontSize: '9px', color: '#ef4444', marginTop: '5px' }}>Le mode 2D verrouille l'affichage sur GEO.</div>}
              </div>
            </div>
          )}

          {activeMenu === 'LANCEMENTS' && (
            <div style={{ backgroundColor: '#000', padding: '15px', border: `1px solid ${themeBorder}`, marginBottom: '20px' }}>
              <div style={{ color: '#fff', marginBottom: '10px', fontSize: '12px' }}>PROGRAMMATION DE TIR</div>
              {myInactiveSats.length === 0 ? <p style={{color: '#666', fontSize:'11px'}}>Hangar vide.</p> : (
                <>
                  <select onChange={(e) => setActionSatId(e.target.value)} value={actionSatId} style={{ width: '100%', padding: '8px', backgroundColor: '#1e293b', color: '#fff', border: 'none', marginBottom: '10px' }}>
                    <option value="">-- Unite en Hangar --</option>
                    {myInactiveSats.map(s => <option key={s.id} value={s.id}>{s.name} ({s.orbit})</option>)}
                  </select>
                  <input type="number" placeholder="Altitude cible (Mm)" onChange={(e) => setInputAltitude(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: '#1e293b', color: '#fff', border: 'none', marginBottom: '10px', boxSizing: 'border-box' }} />
                  <input type="number" placeholder="Inclinaison (°)" onChange={(e) => setInputInclination(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: '#1e293b', color: '#fff', border: 'none', marginBottom: '15px', boxSizing: 'border-box' }} />
                  <button onClick={() => { game.launchSatellite(actionSatId, inputAltitude, inputInclination); executeAction(); }} disabled={!actionSatId || game.actionPoints <= 0} style={{...btnStyle, width: '100%', backgroundColor: themeColor}}>Ordonner Lancement (-1 PA)</button>
                </>
              )}
            </div>
          )}

          {activeMenu === 'C2' && (
            <div style={{ backgroundColor: '#000', border: `1px solid ${themeBorder}`, marginBottom: '20px' }}>
              <div style={{ display: 'flex', borderBottom: `1px solid ${themeBorder}` }}>
                <button style={{...tabStyle, backgroundColor: activeC2Tab==='MANOEUVRES'?themeColor:'#0f172a', color: activeC2Tab==='MANOEUVRES'?'#fff':'#94a3b8'}} onClick={() => {setActiveC2Tab('MANOEUVRES'); setActiveSubAction(null)}}>Manoeuvres</button>
                <button style={{...tabStyle, backgroundColor: activeC2Tab==='RENS'?themeColor:'#0f172a', color: activeC2Tab==='RENS'?'#fff':'#94a3b8'}} onClick={() => {setActiveC2Tab('RENS'); setActiveSubAction(null)}}>Rens.</button>
                <button style={{...tabStyle, backgroundColor: activeC2Tab==='MILITAIRE'?themeColor:'#0f172a', color: activeC2Tab==='MILITAIRE'?'#fff':'#94a3b8'}} onClick={() => {setActiveC2Tab('MILITAIRE'); setActiveSubAction(null)}}>Militaire</button>
              </div>

              <div style={{ padding: '15px' }}>
                {activeC2Tab === 'MANOEUVRES' && (
                  <>
                    <select onChange={(e) => setActiveSubAction(e.target.value)} value={activeSubAction || ""} style={{ width: '100%', padding: '8px', backgroundColor: '#1e293b', color: '#fff', border: 'none', marginBottom: '15px' }}>
                      <option value="">-- Type de Manoeuvre --</option><option value="RPO">RPO (Rapprochement)</option><option value="COLLISION">Collision</option><option value="EVASION">Evasion</option>
                    </select>

                    {(activeSubAction === 'RPO' || activeSubAction === 'COLLISION') && (
                      <div style={{ borderTop: '1px solid #333', paddingTop: '10px' }}>
                        <select onChange={(e) => { setActionSatId(e.target.value); if(e.target.value) setActionTurns(game.getMinTurns(game.sats[e.target.value].orbit)); else setActionTurns(""); }} value={actionSatId} style={{ width: '100%', padding: '8px', backgroundColor: '#1e293b', color: '#fff', border: 'none', marginBottom: '10px' }}>
                          <option value="">-- Satellite Attaquant --</option>
                          {myActiveSats.filter(s => s.canRPO && !s.task).map(s => <option key={s.id} value={s.id}>{s.name} ({s.ergol} Ergols)</option>)}
                        </select>
                        {actionSatId && (
                          <>
                            <select onChange={(e) => setActionTargetId(e.target.value)} value={actionTargetId} style={{ width: '100%', padding: '8px', backgroundColor: '#1e293b', color: '#fff', border: 'none', marginBottom: '10px' }}>
                              <option value="">-- Cible Ennemie --</option>
                              {enemyActiveSats.map(s => <option key={s.id} value={s.id}>{s.name} ({s.orbit})</option>)}
                            </select>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
                              <span style={{ color: '#94a3b8', fontSize: '10px' }}>Tours (Min {game.getMinTurns(game.sats[actionSatId].orbit, actionTargetId ? game.sats[actionTargetId].orbit : null)}) :</span>
                              <input type="number" min={game.getMinTurns(game.sats[actionSatId].orbit, actionTargetId ? game.sats[actionTargetId].orbit : null)} value={actionTurns} onChange={(e) => setActionTurns(e.target.value)} style={{ flex: 1, padding: '6px', backgroundColor: '#1e293b', color: '#fff', border: 'none' }} />
                            </div>
                            <button onClick={() => { activeSubAction === 'RPO' ? game.startRPO(actionSatId, actionTargetId, actionTurns) : game.startCollision(actionSatId, actionTargetId, actionTurns); executeAction(); }} disabled={!actionTargetId || game.actionPoints <= 0} style={{...btnStyle, width: '100%', backgroundColor: themeColor, color: '#fff'}}>Engager (-1 PA)</button>
                          </>
                        )}
                      </div>
                    )}

                    {activeSubAction === 'EVASION' && (
                      <div style={{ borderTop: '1px solid #333', paddingTop: '10px' }}>
                        <select onChange={(e) => setActionSatId(e.target.value)} value={actionSatId} style={{ width: '100%', padding: '8px', backgroundColor: '#1e293b', color: '#fff', border: 'none', marginBottom: '10px' }}>
                          <option value="">-- Unite a evader --</option>
                          {myActiveSats.filter(s => !s.task).map(s => <option key={s.id} value={s.id}>{s.name} ({s.ergol} Ergols)</option>)}
                        </select>
                        <input type="number" placeholder="Nouvelle Alt. (Mm)" onChange={(e) => setInputAltitude(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: '#1e293b', color: '#fff', border: 'none', marginBottom: '15px', boxSizing: 'border-box' }} />
                        <button onClick={() => { game.startEvasion(actionSatId, inputAltitude); executeAction(); }} disabled={!actionSatId || !inputAltitude || game.actionPoints <= 0} style={{...btnStyle, width: '100%', backgroundColor: '#ca8a04'}}>Executer Evasion (-1 PA)</button>
                      </div>
                    )}
                  </>
                )}

                {activeC2Tab === 'RENS' && (
                  <>
                    <button onClick={() => { game.requestAllyIntel(); executeAction(); }} disabled={game.actionPoints <= 0} style={{...btnStyle, width: '100%', backgroundColor: '#166534', marginBottom: '20px'}}>Demande aux Allies (2 Tours) (-1 PA)</button>
                    <div style={{ color: '#fff', fontSize: '11px', marginBottom: '10px', borderBottom: '1px solid #333', paddingBottom: '5px' }}>Satellites Operationnels (RPO Reussie)</div>
                    {myActiveSats.filter(s => s.mainMission === 'Renseignement' && s.isRPO).length === 0 ? <div style={{ fontSize: '10px', color: '#666' }}>Aucun agent en position.</div> : 
                      myActiveSats.filter(s => s.mainMission === 'Renseignement' && s.isRPO).map(s => <div key={s.id} style={{ fontSize: '11px', color: '#10b981', padding: '5px 0' }}>[OK] {s.name} en ecoute sur cible.</div>)
                    }
                  </>
                )}

                {activeC2Tab === 'MILITAIRE' && (
                  <>
                    <div style={{ color: '#fff', fontSize: '11px', marginBottom: '10px', borderBottom: '1px solid #333', paddingBottom: '5px' }}>Unites de Protection (Actives)</div>
                    {myActiveSats.filter(s => s.mainMission === 'Militaire' && s.secondaryMission === 'Protection' && s.isRPO).length === 0 ? <div style={{ fontSize: '10px', color: '#666', marginBottom: '15px' }}>Aucun bouclier deploye.</div> : 
                      myActiveSats.filter(s => s.mainMission === 'Militaire' && s.secondaryMission === 'Protection' && s.isRPO).map(s => <div key={s.id} style={{ fontSize: '11px', color: '#3b82f6', padding: '5px 0', marginBottom: '15px' }}>[PROTECTION] {s.name} protege la zone.</div>)
                    }
                    <div style={{ color: '#fff', fontSize: '11px', marginBottom: '10px', borderBottom: '1px solid #333', paddingBottom: '5px' }}>Unites de Menace (Actives)</div>
                    {myActiveSats.filter(s => s.mainMission === 'Militaire' && s.secondaryMission === 'Menace' && s.isRPO).length === 0 ? <div style={{ fontSize: '10px', color: '#666' }}>Aucune frappe en cours.</div> : 
                      myActiveSats.filter(s => s.mainMission === 'Militaire' && s.secondaryMission === 'Menace' && s.isRPO).map(s => <div key={s.id} style={{ fontSize: '11px', color: '#ef4444', padding: '5px 0' }}>[MENACE] {s.name} brouille la cible.</div>)
                    }
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <button onClick={game.endTurn} disabled={!isMyTurn} style={{ padding: '20px', backgroundColor: isMyTurn ? themeColor : '#1e293b', color: isMyTurn ? '#fff' : '#64748b', border: 'none', borderTop: `1px solid ${themeBorder}`, fontSize: '14px', fontWeight: 'bold', letterSpacing: '2px', cursor: isMyTurn ? 'pointer' : 'not-allowed' }}>
          {isMyTurn ? 'VALIDER LE TOUR' : (game.currentPlayer === 'Allié' ? 'LES ALLIES JOUENT...' : 'L\'ADVERSAIRE JOUE...')}
        </button>
      </div>

      {/* ZONE CENTRALE 3D (60%) */}
      <div style={{ width: '60%', position: 'relative', backgroundColor: '#000', marginTop: (game.gameMode === 'online') ? '32px' : '0' }}>
        
        {/* ZONE DES SCORES ET DU TOUR PURIFIEE */}
        <div style={{ position: 'absolute', top: '20px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '30px', zIndex: 20, pointerEvents: 'none' }}>
          <div style={{ backgroundColor: 'rgba(0,0,0,0.6)', border: `1px solid #ef4444`, padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '11px', letterSpacing: '2px', color: '#ef4444' }}>MERCURE</span>
            <span style={{ fontSize: '18px', color: '#fff' }}>{currentPVMercure} <span style={{fontSize: '11px', color:'#666'}}>/250 PV</span></span>
          </div>

          <div style={{ backgroundColor: 'rgba(0,0,0,0.8)', border: `1px solid ${themeBorder}`, padding: '8px 25px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(0,0,0,0.5)' }}>
            <span style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', letterSpacing: '3px' }}>TOUR {game.turn}</span>
          </div>

          <div style={{ backgroundColor: 'rgba(0,0,0,0.6)', border: `1px solid #3b82f6`, padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '18px', color: '#fff' }}>{currentPVCeltica} <span style={{fontSize: '11px', color:'#666'}}>/250 PV</span></span>
            <span style={{ fontSize: '11px', letterSpacing: '2px', color: '#3b82f6' }}>CELTICA</span>
          </div>
        </div>

        <Canvas onPointerMissed={() => setSelectedSatInfo(null)}>
          {viewMode === '2D' ? (
            <OrthographicCamera makeDefault position={[0, 60, 0]} zoom={12} rotation={[-Math.PI / 2, 0, 0]} />
          ) : (
            <PerspectiveCamera makeDefault position={[0, 15, 35]} fov={50} />
          )}
          <ambientLight intensity={0.2} />
          <directionalLight position={[200, 20, 100]} intensity={3.5} color="#fffdef" />
          <Suspense fallback={null}>
            {viewMode === '3D' && <Stars />}
            {viewMode === '3D' && <Sun />}
            {viewMode === '3D' && <Moon />}
            <RealEarth earthRef={earthRef} />
            {renderedSats.map(sat => (
              <AnimatedSatellite key={sat.id} data={sat} earthRef={earthRef} onSelect={setSelectedSatInfo} isHighlighted={selectedSatInfo?.id === sat.id} />
            ))}
          </Suspense>
          <OrbitControls enablePan={false} enableRotate={viewMode === '3D'} maxDistance={80} minDistance={2} />
        </Canvas>

        <div style={{ position: 'absolute', bottom: '20px', width: '100%', display: 'flex', justifyContent: 'center', zIndex: 20 }}>
          <button onClick={() => setViewMode(v => v === '3D' ? '2D' : '3D')} style={{ padding: '10px 20px', backgroundColor: '#1e293b', color: '#fff', border: `1px solid ${themeColor}`, cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px' }}>
            BASCULER EN VUE {viewMode === '3D' ? '2D (GEOBELT)' : '3D STANDARD'}
          </button>
        </div>
      </div>

      {/* PANNEAU DROIT (20%) */}
      <div style={{ width: '20%', backgroundColor: themePanelBg, borderLeft: `1px solid ${themeBorder}`, display: 'flex', flexDirection: 'column', zIndex: 10, marginTop: (game.gameMode === 'online') ? '32px' : '0' }}>
        <div style={{ padding: '15px', borderBottom: `1px solid ${themeBorder}`, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '11px', letterSpacing: '2px', color: '#fff' }}>JOURNAL TACTIQUE</div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button onClick={() => setIsRulesOpen(true)} style={{ backgroundColor: 'transparent', border: `1px solid ${themeColor}`, color: themeColor, padding: '4px 8px', fontSize: '9px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px', borderRadius: '3px' }}>Docs</button>
          </div>
        </div>
        
        <div style={{ flex: 1, padding: '15px', overflowY: 'auto', fontSize: '11px', fontFamily: 'monospace', lineHeight: '1.6' }}>
          {game.logs.map((log) => (
            <div key={log.id} style={{ color: log.color, marginBottom: '8px', borderBottom: '1px solid #1e293b', paddingBottom: '4px' }}>
              <span style={{ opacity: 0.5, marginRight: '5px' }}>&gt;</span>{log.text}
            </div>
          ))}
        </div>
        
        <div style={{ height: '35%', borderTop: `1px solid ${themeBorder}`, backgroundColor: '#000', padding: '15px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '10px', letterSpacing: '1px', marginBottom: '15px', color: '#fff' }}>ANALYSE CIBLE</div>
          {selectedSatInfo ? (
            <div style={{ fontSize: '11px', fontFamily: 'monospace', overflowY: 'auto' }}>
              <div style={{ color: selectedSatInfo.color, fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>{selectedSatInfo.name}</div>
              <div style={{ marginBottom: '10px' }}><span style={{ color: '#64748b' }}>Faction:</span> {selectedSatInfo.owner}</div>
              <div style={{ borderTop: `1px solid ${themeBorder}`, margin: '8px 0' }}></div>
              <div style={{ marginBottom: '4px' }}><span style={{ color: '#64748b' }}>Altitude:</span> {selectedSatInfo.realAltitudeKm ? selectedSatInfo.realAltitudeKm.toFixed(0) : (selectedSatInfo.currentRadius || selectedSatInfo.radius).toFixed(1)} {selectedSatInfo.realAltitudeKm ? 'km' : 'Mm'}</div>
              <div style={{ marginBottom: '4px' }}><span style={{ color: '#64748b' }}>Inclinaison:</span> {((selectedSatInfo.inclination || 0) * (180/Math.PI)).toFixed(0)}°</div>
              <div style={{ marginBottom: '4px' }}><span style={{ color: '#64748b' }}>Ergol:</span> {selectedSatInfo.ergol}</div>
              <div style={{ borderTop: `1px solid ${themeBorder}`, margin: '8px 0' }}></div>
              <div style={{ marginBottom: '4px' }}><span style={{ color: '#64748b' }}>Miss. Primaire:</span> {selectedSatInfo.mainMission}</div>
              <div style={{ marginBottom: '4px' }}><span style={{ color: '#64748b' }}>Miss. Secondaire:</span> {selectedSatInfo.secondaryMission}</div>
              <div style={{ borderTop: `1px solid ${themeBorder}`, margin: '8px 0' }}></div>
              <div style={{ color: getMaskedSatStatus(selectedSatInfo) === 'Donnees cryptees' ? '#9ca3af' : (selectedSatInfo.task ? '#eab308' : '#22c55e') }}>
                <span style={{ color: '#64748b' }}>Statut:</span> {getMaskedSatStatus(selectedSatInfo)}
              </div>
            </div>
          ) : (
            <div style={{ margin: 'auto', textAlign: 'center', color: '#334155', fontSize: '11px', fontStyle: 'italic' }}>Aucune cible.</div>
          )}
        </div>

        <button onClick={() => window.location.reload()} style={{ padding: '15px', backgroundColor: '#7f1d1d', color: '#fff', border: 'none', borderTop: `1px solid ${themeBorder}`, fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px', cursor: 'pointer' }}>
          [ARRET] QUITTER LA SIMULATION
        </button>
      </div>
    </div>
  )
}