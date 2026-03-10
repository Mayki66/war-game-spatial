import React, { useState, useEffect } from 'react';

const AccordionItem = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: '10px', border: '1px solid #253552', backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <button onClick={() => setIsOpen(!isOpen)} style={{ width: '100%', padding: '15px', backgroundColor: isOpen ? '#1e293b' : 'transparent', color: '#38bdf8', border: 'none', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>{title}</span>
        <span style={{ fontSize: '18px' }}>{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && <div style={{ padding: '20px', color: '#94a3b8', fontSize: '12px', lineHeight: '1.6', borderTop: '1px solid #253552' }}>{children}</div>}
    </div>
  );
};

export function RulesModal({ isOpen, onClose, gameStarted, onStart }) {
  const [selectedMode, setSelectedMode] = useState(null);
  const [selectedFaction, setSelectedFaction] = useState('Mercure');
  const [isJoining, setIsJoining] = useState(false);
  const [showDocs, setShowDocs] = useState(false);

  useEffect(() => { if (window.location.search.includes('room=')) setIsJoining(true); }, []);

  if (!isOpen) return null;

  if (showDocs || gameStarted) {
    return (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ backgroundColor: '#131c2d', padding: '30px', border: '1px solid #253552', width: '850px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 0 30px rgba(0,0,0,0.8)', background: 'linear-gradient(135deg, #131c2d 40%, #3f1515 100%)' }}>
          
          {/* Titre de la doc avec logo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '20px', borderBottom: '1px solid #253552', paddingBottom: '15px' }}>
            <img src="/cde-logo.png" alt="CDE" style={{ height: '30px', width: 'auto' }} />
            <h1 style={{ color: '#38bdf8', fontSize: '20px', margin: 0, textAlign: 'center', letterSpacing: '3px', textTransform: 'uppercase' }}>Documentation Strategique</h1>
          </div>
          
          <AccordionItem title="1. Philosophie et Objectifs du C2" defaultOpen={true}>
            <p style={{ marginBottom: '10px' }}>Le War Game Spatial simule un environnement operationnel multidomaine. Ses objectifs sont :</p>
            <ul style={{ paddingLeft: '20px', marginBottom: '10px' }}>
              <li><strong style={{ color: '#fff' }}>Apprentissage Accelere :</strong> Assimilation des mecaniques orbitales et des doctrines de reponse aux menaces.</li>
              <li><strong style={{ color: '#fff' }}>Analyse C2 (Command & Control) :</strong> Prise de decision sous contrainte de temps et de ressources (Ergol).</li>
              <li><strong style={{ color: '#fff' }}>Maitrise de la SSA :</strong> Comprendre l'importance de la Space Situational Awareness face au brouillard de guerre.</li>
            </ul>
          </AccordionItem>

          <AccordionItem title="2. Ordre des Operations et Brouillard de Guerre">
            <h3 style={{ color: '#fff', marginBottom: '5px' }}>Resolution des Tours</h3>
            <p style={{ marginBottom: '10px' }}>L'initiative tactique est asymetrique. L'ordre strict d'execution est : <strong>1. Mercure / 2. Celtica / 3. Reseau Allie</strong>.</p>
            
            <h3 style={{ color: '#fff', marginBottom: '5px' }}>Renseignement et SSA</h3>
            <p style={{ marginBottom: '10px' }}>Toute unite ennemie n'ayant pas fait l'objet d'une reconnaissance voit ses parametres (Mission, Statut) cryptes.</p>
            <ul style={{ paddingLeft: '20px', marginBottom: '15px' }}>
              <li><strong>Scan Radar (Scientifique) :</strong> Dissipe le brouillard pour 1 tour.</li>
              <li><strong>Soutien Allie (C2) :</strong> Le piratage ou la requete aupres du reseau allie dissipe le brouillard pour 2 tours, mais necessite un delai d'execution.</li>
            </ul>
          </AccordionItem>

          <AccordionItem title="3. Consommation Logistique (Ergol) et Echelles Tactiques">
            <p style={{ marginBottom: '10px' }}>La ressource principale de la simulation est l'Ergol. Chaque satellite deploie possede une reserve non-renouvelable de <strong>15 Ergols</strong>. Toute manoeuvre consomme cette ressource.</p>
            
            <h3 style={{ color: '#fff', marginBottom: '5px' }}>Manoeuvres Intra-orbitales (Meme Orbite) et Lancements</h3>
            <ul style={{ paddingLeft: '20px', marginBottom: '15px' }}>
              <li><strong style={{ color: '#38bdf8' }}>LEO (Low Earth Orbit) :</strong> 1 Tour / 1 Ergol.</li>
              <li><strong style={{ color: '#38bdf8' }}>MEO (Medium Earth Orbit) :</strong> 2 Tours / 2 Ergols.</li>
              <li><strong style={{ color: '#38bdf8' }}>GEO (Geostationary Orbit) :</strong> 3 Tours / 3 Ergols. (Les variations d'altitude en GEO sont reservees aux manoeuvres d'evasion).</li>
            </ul>

            <h3 style={{ color: '#fff', marginBottom: '5px' }}>Manoeuvres Inter-orbitales (Cross-Orbit)</h3>
            <p style={{ marginBottom: '10px' }}>Engager ou proteger une cible situee sur une orbite differente exige une projection de force complexe.</p>
            <ul style={{ paddingLeft: '20px', marginBottom: '15px' }}>
              <li><strong>Orbites Adjacentes (LEO ↔ MEO ou MEO ↔ GEO) :</strong> 3 Tours / 3 Ergols.</li>
              <li><strong>Orbites Distantes (LEO ↔ GEO) :</strong> 5 Tours / 5 Ergols.</li>
            </ul>
          </AccordionItem>

          <AccordionItem title="4. Nomenclatures, Missions et Regles de RPO">
            <p style={{ marginBottom: '10px' }}>Les unites sont divisees par missions. Les unites de type Renseignement et Militaire possedent une capacite de <strong>RPO (Rendez-vous and Proximity Operations)</strong>.</p>
            <ul style={{ paddingLeft: '20px', marginBottom: '0' }}>
              <li style={{ marginBottom: '10px' }}><strong style={{ color: '#fff' }}>Telecommunications (Civil/Militaire) :</strong> Assure la liaison C2.</li>
              <li style={{ marginBottom: '10px' }}><strong style={{ color: '#fff' }}>GNSS (Civil/Militaire) :</strong> Satellites de positionnement global.</li>
              <li style={{ marginBottom: '10px' }}><strong style={{ color: '#fff' }}>Scientifique (Recherche) :</strong> Genere 5 points par tour si actif et mene les operations de Scan Radar.</li>
              <li style={{ marginBottom: '10px' }}><strong style={{ color: '#fff' }}>Renseignement (Ecoute/Observation) :</strong> En RPO, il siphone les donnees de la cible :
                <ul style={{ paddingLeft: '20px', marginTop: '5px' }}>
                  <li>Sur Renseignement ennemi : Revele les postures defensives/offensives.</li>
                  <li>Sur Telecommunications : Revele les manoeuvres programmees.</li>
                  <li>Sur Scientifique : Siphone les donnees de recherche (+5 pts au detriment de l'ennemi).</li>
                </ul>
              </li>
              <li><strong style={{ color: '#fff' }}>Militaire (Protection/Menace) :</strong> Deploies depuis le Hangar uniquement.
                <ul style={{ paddingLeft: '20px', marginTop: '5px' }}>
                  <li>Protection : Une fois en position, neutralise l'effet des satellites de Menace adverses ciblant sa zone.</li>
                  <li>Menace : Brouille les capteurs de la cible et force son passage en etat "Non Operationnel".</li>
                </ul>
              </li>
            </ul>
          </AccordionItem>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button onClick={() => gameStarted ? onClose() : setShowDocs(false)} style={{ flex: 1, padding: '15px', backgroundColor: '#38bdf8', color: '#000', border: 'none', fontWeight: 'bold', letterSpacing: '2px', cursor: 'pointer', textTransform: 'uppercase' }}>
              {gameStarted ? 'RETOURNER AU POSTE DE COMMANDEMENT' : 'RETOUR AU MENU PRINCIPAL'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ backgroundColor: '#131c2d', padding: '40px', border: '1px solid #253552', width: '600px', boxShadow: '0 0 40px rgba(0,0,0,0.9)', background: 'linear-gradient(135deg, #131c2d 40%, #3f1515 100%)' }}>
        
        {/* TITRE PRINCIPAL AVEC LOGO CDE CORRIGE */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginBottom: '10px' }}>
          <img src="/cde-logo.png" alt="Logo CDE" style={{ height: '40px', width: 'auto' }} />
          <h1 style={{ color: '#fff', fontSize: '32px', margin: 0, textAlign: 'center', letterSpacing: '6px', textTransform: 'uppercase', textShadow: '0 0 10px rgba(255,255,255,0.2)' }}>WAR GAME SPATIAL</h1>
        </div>
        
        <p style={{ color: '#94a3b8', textAlign: 'center', fontStyle: 'italic', marginBottom: '30px', fontSize: '12px' }}>"Gerez l'ergol, percez le brouillard, dominez l'orbite."</p>
        
        {isJoining ? (
          <div style={{ textAlign: 'center', marginBottom: '30px', backgroundColor: 'rgba(0,0,0,0.5)', padding: '20px' }}>
            <h3 style={{ color: '#10b981', fontSize: '18px', marginBottom: '10px' }}>[RESEAU] Lien de communication etabli</h3>
            <p style={{ color: '#94a3b8' }}>Votre faction vous sera attribuee automatiquement par le createur du salon.</p>
            <button onClick={() => onStart('online', null)} style={{ width: '100%', padding: '15px', backgroundColor: '#10b981', color: '#000', border: 'none', fontWeight: 'bold', marginTop: '20px', cursor: 'pointer', letterSpacing: '2px' }}>REJOINDRE LE THEATRE D'OPERATION</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
            <div onClick={() => setSelectedMode('solo')} style={{ padding: '15px', border: `1px solid ${selectedMode === 'solo' ? '#fff' : '#253552'}`, backgroundColor: 'rgba(0,0,0,0.5)', cursor: 'pointer' }}>
              <h3 style={{ color: selectedMode === 'solo' ? '#fff' : '#94a3b8', fontSize: '16px', textAlign: 'center' }}>[1 JOUEUR] VS IA</h3>
              {selectedMode === 'solo' && (
                <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                  <button onClick={(e) => { e.stopPropagation(); setSelectedFaction('Mercure'); }} style={{ flex: 1, padding: '10px', backgroundColor: selectedFaction === 'Mercure' ? '#ef4444' : '#1e293b', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>MERCURE</button>
                  <button onClick={(e) => { e.stopPropagation(); setSelectedFaction('Celtica'); }} style={{ flex: 1, padding: '10px', backgroundColor: selectedFaction === 'Celtica' ? '#3b82f6' : '#1e293b', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>CELTICA</button>
                </div>
              )}
            </div>
            
            <div onClick={() => setSelectedMode('online')} style={{ padding: '15px', border: `1px solid ${selectedMode === 'online' ? '#fff' : '#253552'}`, backgroundColor: 'rgba(0,0,0,0.5)', cursor: 'pointer' }}>
              <h3 style={{ color: selectedMode === 'online' ? '#fff' : '#94a3b8', fontSize: '16px', textAlign: 'center' }}>[2 JOUEURS] EN LIGNE</h3>
              {selectedMode === 'online' && (
                <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                  <button onClick={(e) => { e.stopPropagation(); setSelectedFaction('Mercure'); }} style={{ flex: 1, padding: '10px', backgroundColor: selectedFaction === 'Mercure' ? '#ef4444' : '#1e293b', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '11px' }}>JOUER MERCURE</button>
                  <button onClick={(e) => { e.stopPropagation(); setSelectedFaction('Celtica'); }} style={{ flex: 1, padding: '10px', backgroundColor: selectedFaction === 'Celtica' ? '#3b82f6' : '#1e293b', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '11px' }}>JOUER CELTICA</button>
                </div>
              )}
            </div>
          </div>
        )}

        {!isJoining && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setShowDocs(true)} style={{ flex: 1, padding: '15px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #253552', fontWeight: 'bold', cursor: 'pointer' }}>
              DOCUMENTATION
            </button>
            <button onClick={() => onStart(selectedMode, selectedFaction)} disabled={!selectedMode} style={{ flex: 2, padding: '15px', backgroundColor: selectedMode ? (selectedFaction === 'Mercure' ? '#ef4444' : '#3b82f6') : '#1e293b', color: selectedMode ? '#fff' : '#64748b', border: 'none', fontWeight: 'bold', letterSpacing: '2px', cursor: selectedMode ? 'pointer' : 'not-allowed' }}>
              {selectedMode === 'online' ? 'GENERER LE LIEN' : 'DEMARRER'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}