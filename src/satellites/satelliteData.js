import { altitudeTo3D } from '../rules/constants';

const getRealisticName = (faction, orbit, main, sub) => {
  if (faction === 'Celtica') {
    if (main === 'Renseignement' && sub === 'Ecoute') return 'CERES';
    if (main === 'Renseignement' && sub === 'Observation') return 'CSO';
    if (main === 'GNSS') return 'GALILEO';
    if (main === 'Télécommunications') return orbit === 'LEO' ? 'KINEIS' : 'SYRACUSE';
    if (main === 'Scientifique') return orbit === 'LEO' ? 'TARANIS' : 'YODA-SCI';
    if (main === 'Militaire') return 'TOUTATIS';
  }
  if (faction === 'Mercure') {
    if (main === 'Renseignement' && sub === 'Ecoute') return 'TSELINA';
    if (main === 'Renseignement' && sub === 'Observation') return 'YAOGAN';
    if (main === 'GNSS') return 'GLONASS';
    if (main === 'Télécommunications') return orbit === 'LEO' ? 'GONETS' : 'RADUGA';
    if (main === 'Scientifique') return orbit === 'LEO' ? 'LOMONOSOV' : 'SHIJIAN';
    if (main === 'Militaire') return 'KOSMOS';
  }
  if (faction === 'Allié') {
    if (main === 'Renseignement' && sub === 'Ecoute') return 'MENTOR';
    if (main === 'Renseignement' && sub === 'Observation') return 'KEYHOLE';
    if (main === 'GNSS') return 'NAVSTAR';
    if (main === 'Télécommunications') return orbit === 'LEO' ? 'IRIDIUM' : 'AEHF';
    if (main === 'Scientifique') return orbit === 'LEO' ? 'LANDSAT' : 'GSSAP';
    if (main === 'Militaire') return 'X-37B';
  }
  return 'SAT';
};

export const generateFleet = () => {
  const factions = [
    { name: 'Celtica', color: '#3b82f6' },
    { name: 'Mercure', color: '#ef4444' },
    { name: 'Allié', color: '#22c55e' }
  ];

  const fleet = {};
  let idCounter = 1000;
  let mercureMilitaireDeployed = false;

  factions.forEach(faction => {
    const templates = [
      { orbit: 'LEO', main: 'Renseignement', sub: 'Ecoute', active: true, defaultErgol: 15 },
      { orbit: 'LEO', main: 'Renseignement', sub: 'Observation', active: true, defaultErgol: 15 },
      { orbit: 'LEO', main: 'Télécommunications', sub: 'Civil', active: true, defaultErgol: 15 },
      { orbit: 'LEO', main: 'Scientifique', sub: 'Bras Robotisé', active: true, defaultErgol: 15 }, // INTEGRATION BRAS ROBOTISE
      { orbit: 'LEO', main: 'Militaire', sub: 'Protection', active: false, defaultErgol: 20 },
      { orbit: 'LEO', main: 'Militaire', sub: 'Menace', active: false, defaultErgol: 20 },
      
      { orbit: 'MEO', main: 'GNSS', sub: 'Militaire', active: true, defaultErgol: 5 },
      { orbit: 'MEO', main: 'Scientifique', sub: 'Recherche', active: true, defaultErgol: 15 },
      
      { orbit: 'GEO', main: 'Télécommunications', sub: 'Militaire', active: true, defaultErgol: 15 },
      { orbit: 'GEO', main: 'Scientifique', sub: 'Bras Robotisé', active: true, defaultErgol: 15 }, // INTEGRATION BRAS ROBOTISE
      { orbit: 'GEO', main: 'Militaire', sub: 'Protection', active: false, defaultErgol: 20 },
      { orbit: 'GEO', main: 'Militaire', sub: 'Menace', active: false, defaultErgol: 20 },
    ];

    templates.forEach(t => {
      for (let i = 0; i < 2; i++) {
        const id = `${faction.name.toLowerCase()}_${t.orbit.toLowerCase()}_${idCounter}`;
        
        let realAltitude = 0; let speed = 0;
        if (t.orbit === 'LEO') { realAltitude = 400 + Math.random() * 1100; speed = 0.8 + Math.random() * 0.4; }
        if (t.orbit === 'MEO') { realAltitude = 20000 + Math.random() * 4000; speed = 0.4 + Math.random() * 0.3; }
        if (t.orbit === 'GEO') { realAltitude = 35764 + (Math.random() * 50 - 25); speed = 0.2; }

        const radius3D = altitudeTo3D(realAltitude);
        const baseName = getRealisticName(faction.name, t.orbit, t.main, t.sub);
        const serialNumber = Math.floor(Math.random() * 900) + 10;

        let isActive = t.active;
        if (faction.name === 'Mercure' && t.main === 'Militaire' && !mercureMilitaireDeployed) {
          isActive = true; mercureMilitaireDeployed = true;
        }

        fleet[id] = {
          id: id, 
          noradId: `NORAD-${Math.floor(Math.random() * 80000) + 10000}`, // Ajout d'un ID de suivi
          name: `${baseName}-${serialNumber}`, 
          owner: faction.name, 
          color: faction.color,
          orbit: t.orbit, 
          realAltitudeKm: realAltitude,
          radius: radius3D, currentRadius: radius3D, inclination: (Math.random() * 45) * (Math.PI / 180), startAngle: Math.random() * Math.PI * 2, speed: speed, 
          mainMission: t.main, secondaryMission: t.sub, isActive: isActive, 
          status: isActive ? "Opérationnel" : "Hangar", 
          canRPO: t.main === 'Militaire' || t.main === 'Renseignement' || t.sub === 'Bras Robotisé',
          ergol: t.defaultErgol, task: null, jammedBy: null, isRPO: false, targetId: null
        };
        idCounter++;
      }
    });
  });

  return fleet;
};

export const initialSatellites = generateFleet();