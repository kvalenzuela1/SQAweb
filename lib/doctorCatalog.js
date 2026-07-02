'use strict';

// Static roster of doctors who can be assigned to an appointment.

const DOCTORS = [
  { id: 'dr-cruz', name: 'Dr. Elena Cruz' },
  { id: 'dr-reyes', name: 'Dr. Marco Reyes' },
  { id: 'dr-bello', name: 'Dr. Aisha Bello' },
];

function getDoctors() {
  return DOCTORS.map((d) => ({ ...d }));
}

function findDoctor(id) {
  return DOCTORS.find((d) => d.id === id) || null;
}

module.exports = { getDoctors, findDoctor };
