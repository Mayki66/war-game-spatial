import React from 'react';

export function TableModal({ isOpen, onClose, sats, currentViewFaction, getMaskedSatStatus, themeColor, title, isHangar, toggleOperational }) {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <div style={{ backgroundColor: '#0b101a', border: `1px solid ${themeColor}`, width: '100%', maxWidth: '1600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: `0 0 20px rgba(0,0,0,0.8)` }}>
        <div style={{ padding: '20px', backgroundColor: '#131c2d', borderBottom: `1px solid ${themeColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: themeColor, margin: 0, letterSpacing: '3px', textTransform: 'uppercase' }}>{title}</h2>
          <button onClick={onClose} style={{ padding: '8px 20px', backgroundColor: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold', letterSpacing: '1px' }}>FERMER LA LIAISON</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left', color: '#e2e8f0', fontFamily: 'monospace' }}>
            <thead style={{ backgroundColor: '#1e293b', position: 'sticky', top: 0 }}>
              <tr>
                <th style={{ padding: '10px', borderBottom: '2px solid #334155' }}>Nom</th>
                <th style={{ padding: '10px', borderBottom: '2px solid #334155' }}>Mission principale</th>
                <th style={{ padding: '10px', borderBottom: '2px solid #334155' }}>Mission secondaire</th>
                <th style={{ padding: '10px', borderBottom: '2px solid #334155' }}>Civil / Militaire</th>
                <th style={{ padding: '10px', borderBottom: '2px solid #334155' }}>Faction</th>
                <th style={{ padding: '10px', borderBottom: '2px solid #334155' }}>Altitude</th>
                <th style={{ padding: '10px', borderBottom: '2px solid #334155' }}>Demie-grand axe</th>
                <th style={{ padding: '10px', borderBottom: '2px solid #334155' }}>Période orbitale</th>
                <th style={{ padding: '10px', borderBottom: '2px solid #334155' }}>Vitesse</th>
                <th style={{ padding: '10px', borderBottom: '2px solid #334155' }}>Inclinaison</th>
                <th style={{ padding: '10px', borderBottom: '2px solid #334155' }}>Ergol (restant) / total</th>
                <th style={{ padding: '10px', borderBottom: '2px solid #334155' }}>État*</th>
                <th style={{ padding: '10px', borderBottom: '2px solid #334155' }}>Statut*</th>
                <th style={{ padding: '10px', borderBottom: '2px solid #334155' }}>Intéraction</th>
              </tr>
            </thead>
            <tbody>
              {sats.map(sat => {
                const isMine = sat.owner === currentViewFaction;
                const displayStatus = isHangar ? "-" : getMaskedSatStatus(sat);
                const displayEtat = isHangar ? "Non Opérationnel" : (sat.etat === "Opérationnel" && displayStatus !== "Données cryptées" ? "Opérationnel" : "Non Opérationnel");
                const isEncrypted = displayStatus === 'Données cryptées';
                
                return (
                  <tr key={sat.id} style={{ borderBottom: '1px solid #1e293b', backgroundColor: isMine ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    <td style={{ padding: '8px', color: sat.color, fontWeight: 'bold' }}>{sat.name}</td>
                    <td style={{ padding: '8px' }}>{isEncrypted ? '???' : sat.mainMission}</td>
                    <td style={{ padding: '8px' }}>{isEncrypted ? '???' : sat.secondaryMission}</td>
                    <td style={{ padding: '8px' }}>{isEncrypted ? '???' : sat.typeDomain}</td>
                    <td style={{ padding: '8px' }}>{sat.owner}</td>
                    <td style={{ padding: '8px' }}>{sat.realAltitudeKm.toFixed(0)} km</td>
                    <td style={{ padding: '8px' }}>{sat.semiMajorAxis} km</td>
                    <td style={{ padding: '8px' }}>{sat.orbitalPeriod}</td>
                    <td style={{ padding: '8px' }}>~{sat.realSpeedKmS.toFixed(1)} km/s</td>
                    <td style={{ padding: '8px' }}>{((sat.inclination || 0) * (180/Math.PI)).toFixed(0)}°</td>
                    <td style={{ padding: '8px', color: '#eab308' }}>{isEncrypted ? '???' : `${sat.ergol} / ${sat.maxErgol}`}</td>
                    <td style={{ padding: '8px', color: displayEtat === 'Opérationnel' ? '#10b981' : '#ef4444' }}>{isEncrypted ? '???' : displayEtat}</td>
                    <td style={{ padding: '8px', color: '#38bdf8' }}>{isEncrypted ? '???' : sat.statut}</td>
                    <td style={{ padding: '8px' }}>
                      {isMine && (
                        <button onClick={() => toggleOperational(sat.id)} style={{ padding: '6px 12px', fontSize: '10px', backgroundColor: sat.etat === "Opérationnel" ? '#7f1d1d' : '#166534', color: '#fff', border: 'none', cursor: 'pointer', textTransform: 'uppercase' }}>
                          {sat.etat === "Opérationnel" ? "Désactiver" : "Activer"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}