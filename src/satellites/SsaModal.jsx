import React from 'react';

export function TableModal({ isOpen, onClose, sats, currentViewFaction, getMaskedSatStatus, themeColor, title, isHangar, toggleOperational }) {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
      <div style={{ backgroundColor: '#0b101a', border: `1px solid ${themeColor}`, width: '100%', maxWidth: '1200px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', backgroundColor: '#131c2d', borderBottom: `1px solid ${themeColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: themeColor, margin: 0, letterSpacing: '2px' }}>{title}</h2>
          <button onClick={onClose} style={{ padding: '8px 15px', backgroundColor: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>FERMER</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left', color: '#e2e8f0' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                <th style={{ padding: '10px' }}>NOM DE CODE</th><th style={{ padding: '10px' }}>FACTION</th><th style={{ padding: '10px' }}>ORBITE</th>
                <th style={{ padding: '10px' }}>ALTITUDE</th><th style={{ padding: '10px' }}>MISSION</th><th style={{ padding: '10px' }}>STATUT</th>
                {!isHangar && <th style={{ padding: '10px' }}>ACTION (C2)</th>}
              </tr>
            </thead>
            <tbody>
              {sats.map(sat => {
                const isMine = sat.owner === currentViewFaction;
                const status = isHangar ? "Hangar" : getMaskedSatStatus(sat);
                return (
                  <tr key={sat.id} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '10px', color: sat.color, fontWeight: 'bold' }}>{sat.name}</td><td style={{ padding: '10px' }}>{sat.owner}</td>
                    <td style={{ padding: '10px' }}>{sat.orbit}</td><td style={{ padding: '10px' }}>{sat.currentRadius.toFixed(2)} Mm</td>
                    <td style={{ padding: '10px' }}>{status === 'Données cryptées' ? '???' : `${sat.mainMission} (${sat.secondaryMission})`}</td>
                    <td style={{ padding: '10px', color: status === 'Données cryptées' ? '#64748b' : '#10b981' }}>{status}</td>
                    {!isHangar && (
                      <td style={{ padding: '10px' }}>
                        {isMine && (
                          <button onClick={() => toggleOperational(sat.id)} style={{ padding: '4px 8px', fontSize: '10px', backgroundColor: sat.status === "Opérationnel" ? '#b91c1c' : '#15803d', color: '#fff', border: 'none', cursor: 'pointer' }}>
                            {sat.status === "Opérationnel" ? "Désactiver" : "Activer"}
                          </button>
                        )}
                      </td>
                    )}
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