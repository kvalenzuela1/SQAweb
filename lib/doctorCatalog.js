'use strict';

// Static roster of doctors who can be assigned to an appointment.

const DOCTORS = [
  { id: 'dr-nieto', name: 'Dr. Rhodora Nieto' },
];

function getDoctors() {
  return DOCTORS.map((d) => ({ ...d }));
}

function findDoctor(id) {
  return DOCTORS.find((d) => d.id === id) || null;
}

module.exports = { getDoctors, findDoctor };
