import React from 'react';

export function TableModal({ isOpen, onClose, sats, currentViewFaction, getMaskedSatStatus, themeColor, title, isHangar, toggleOperational }) {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <div style={{ backgroundColor: '#0b101a', border: `1px solid ${themeColor}`, width: '100%', maxWidth: '1400px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: `0 0 20px rgba(0,0,0,0.8)` }}>
        <div style={{ padding: '20px', backgroundColor: '#131c2d', borderBottom: `1px solid ${themeColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: themeColor, margin: 0, letterSpacing: '3px', textTransform: 'uppercase' }}>{title}</h2>
          <button onClick={onClose} style={{ padding: '8px 20px', backgroundColor: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold', letterSpacing: '1px' }}>FERMER LA LIAISON</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left', color: '#e2e8f0', fontFamily: 'monospace' }}>
            <thead style={{ backgroundColor: '#1e293b', position: 'sticky', top: 0 }}>
              <tr>
                <th style={{ padding: '12px', borderBottom: '2px solid #334155' }}>ID NORAD</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #334155' }}>NOM DE CODE</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #334155' }}>FACTION</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #334155' }}>ORBITE</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #334155' }}>ALTITUDE</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #334155' }}>M. PRIMAIRE</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #334155' }}>M. SECONDAIRE</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #334155' }}>ERGOL</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #334155' }}>STATUT</th>
                {!isHangar && <th style={{ padding: '12px', borderBottom: '2px solid #334155' }}>C2</th>}
              </tr>
            </thead>
            <tbody>
              {sats.map(sat => {
                const isMine = sat.owner === currentViewFaction;
                const status = isHangar ? "Hangar" : getMaskedSatStatus(sat);
                const isEncrypted = status === 'Données cryptées';
                return (
                  <tr key={sat.id} style={{ borderBottom: '1px solid #1e293b', backgroundColor: isMine ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    <td style={{ padding: '10px', color: '#94a3b8' }}>{sat.noradId}</td>
                    <td style={{ padding: '10px', color: sat.color, fontWeight: 'bold' }}>{sat.name}</td>
                    <td style={{ padding: '10px' }}>{sat.owner}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{sat.orbit}</td>
                    <td style={{ padding: '10px' }}>{sat.realAltitudeKm.toFixed(0)} km</td>
                    <td style={{ padding: '10px' }}>{isEncrypted ? '???' : sat.mainMission}</td>
                    <td style={{ padding: '10px' }}>{isEncrypted ? '???' : sat.secondaryMission}</td>
                    <td style={{ padding: '10px', color: '#eab308' }}>{isEncrypted ? '???' : sat.ergol}</td>
                    <td style={{ padding: '10px', color: isEncrypted ? '#64748b' : (sat.status === 'Opérationnel' ? '#10b981' : '#ef4444') }}>{status}</td>
                    {!isHangar && (
                      <td style={{ padding: '10px' }}>
                        {isMine && (
                          <button onClick={() => toggleOperational(sat.id)} style={{ padding: '6px 12px', fontSize: '10px', backgroundColor: sat.status === "Opérationnel" ? '#7f1d1d' : '#166534', color: '#fff', border: 'none', cursor: 'pointer', textTransform: 'uppercase' }}>
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