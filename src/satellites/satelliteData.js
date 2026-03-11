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

// Calcule la période orbitale en heures/minutes (Loi de Kepler)
const calculateOrbitalPeriod = (altitudeKm) => {
  const earthRadiusKm = 6371;
  const mu = 398600; // Constante gravitationnelle de la Terre (km^3/s^2)
  const a = earthRadiusKm + altitudeKm; // Demie-grand axe
  const periodSeconds = 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / mu);
  const hours = Math.floor(periodSeconds / 3600);
  const minutes = Math.floor((periodSeconds % 3600) / 60);
  return { a: Math.floor(a), periodText: `${hours}h ${minutes}m` };
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
      { orbit: 'LEO', main: 'Renseignement', sub: 'Ecoute', type: 'Militaire', active: true, defaultErgol: 15 },
      { orbit: 'LEO', main: 'Renseignement', sub: 'Observation', type: 'Militaire', active: true, defaultErgol: 15 },
      { orbit: 'LEO', main: 'Télécommunications', sub: 'Civil', type: 'Civil', active: true, defaultErgol: 15 },
      { orbit: 'LEO', main: 'Scientifique', sub: 'Bras Robotisé', type: 'Militaire', active: true, defaultErgol: 15 },
      { orbit: 'LEO', main: 'Militaire', sub: 'Protection', type: 'Militaire', active: false, defaultErgol: 20 },
      { orbit: 'LEO', main: 'Militaire', sub: 'Menace', type: 'Militaire', active: false, defaultErgol: 20 },
      
      { orbit: 'MEO', main: 'GNSS', sub: 'Militaire', type: 'Militaire', active: true, defaultErgol: 5 },
      { orbit: 'MEO', main: 'Scientifique', sub: 'Recherche', type: 'Civil', active: true, defaultErgol: 15 },
      
      { orbit: 'GEO', main: 'Télécommunications', sub: 'Militaire', type: 'Militaire', active: true, defaultErgol: 15 },
      { orbit: 'GEO', main: 'Scientifique', sub: 'Bras Robotisé', type: 'Militaire', active: true, defaultErgol: 15 },
      { orbit: 'GEO', main: 'Militaire', sub: 'Protection', type: 'Militaire', active: false, defaultErgol: 20 },
      { orbit: 'GEO', main: 'Militaire', sub: 'Menace', type: 'Militaire', active: false, defaultErgol: 20 },
    ];

    templates.forEach(t => {
      // 2 unités de chaque
      for (let i = 0; i < 2; i++) {
        const id = `${faction.name.toLowerCase()}_${t.orbit.toLowerCase()}_${idCounter}`;
        
        let realAltitude = 0; let speed = 0; let speedKmS = 0;
        if (t.orbit === 'LEO') { realAltitude = 400 + Math.random() * 1100; speed = 0.8 + Math.random() * 0.4; speedKmS = 7.5; }
        if (t.orbit === 'MEO') { realAltitude = 20000 + Math.random() * 4000; speed = 0.4 + Math.random() * 0.3; speedKmS = 3.8; }
        if (t.orbit === 'GEO') { realAltitude = 35764; speed = 0.2; speedKmS = 3.0; }

        const orbitalData = calculateOrbitalPeriod(realAltitude);
        const radius3D = altitudeTo3D(realAltitude);
        const baseName = getRealisticName(faction.name, t.orbit, t.main, t.sub);
        const serialNumber = Math.floor(Math.random() * 900) + 10;

        // Règle d'avantage Mercure
        let isActive = t.active;
        if (faction.name === 'Mercure' && t.main === 'Militaire' && !mercureMilitaireDeployed) {
          isActive = true; mercureMilitaireDeployed = true;
        }

        fleet[id] = {
          id: id, 
          name: `${baseName}-${serialNumber}`, 
          owner: faction.name, 
          color: faction.color,
          orbit: t.orbit, 
          realAltitudeKm: realAltitude,
          semiMajorAxis: orbitalData.a,
          orbitalPeriod: orbitalData.periodText,
          realSpeedKmS: speedKmS,
          radius: radius3D, 
          currentRadius: radius3D, 
          inclination: (Math.random() * 45) * (Math.PI / 180), 
          startAngle: Math.random() * Math.PI * 2, 
          speed: speed, 
          mainMission: t.main, 
          secondaryMission: t.sub, 
          typeDomain: t.type, // Civil / Militaire
          isActive: isActive, 
          etat: isActive ? "Opérationnel" : "Non Opérationnel", 
          statut: "-", // En RPO, Brouillé, etc.
          canRPO: t.main === 'Militaire' || t.main === 'Renseignement' || t.sub === 'Bras Robotisé',
          hasRoboticArm: t.sub === 'Bras Robotisé',
          ergol: t.defaultErgol, 
          maxErgol: t.defaultErgol,
          task: null, 
          jammedBy: null, 
          isRPO: false, 
          targetId: null
        };
        idCounter++;
      }
    });
  });

  return fleet;
};

export const initialSatellites = generateFleet();