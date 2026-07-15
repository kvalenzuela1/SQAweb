'use strict';

// Static catalog of aesthetics services offered by O Aisthetikos.
// Price is in PHP; durationMinutes drives appointment-slot conflict checks.

const SERVICES = [
  { id: 'botox', name: 'Botox Injections', price: 250, durationMinutes: 30 },
  { id: 'filler', name: 'Dermal Fillers', price: 450, durationMinutes: 45 },
  { id: 'peel', name: 'Chemical Peel', price: 150, durationMinutes: 30 },
  { id: 'laser', name: 'Laser Hair Removal', price: 120, durationMinutes: 30 },
  { id: 'microneedling', name: 'Microneedling', price: 200, durationMinutes: 45 },
  { id: 'hydrafacial', name: 'HydraFacial', price: 175, durationMinutes: 60 },
];

function getServices() {
  return SERVICES.map((s) => ({ ...s }));
}

function findService(id) {
  return SERVICES.find((s) => s.id === id) || null;
}

module.exports = { getServices, findService };
