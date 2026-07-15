'use strict';

// In-memory registry of patient records: contact info, date of birth,
// address, and free-text medical notes/allergies.

let patients = [];
let nextId = 1;

function getPatients() {
  return patients.map((p) => ({ ...p }));
}

function getPatient(id) {
  const patient = patients.find((p) => p.id === id);
  return patient ? { ...patient } : null;
}

function addPatient({ fullName, phone, email, dob, address, notes }) {
  const trimmedName = (fullName || '').trim();
  if (!trimmedName) throw new Error('Patient name is required');

  const patient = {
    id: nextId++,
    fullName: trimmedName,
    phone: (phone || '').trim(),
    email: (email || '').trim(),
    dob: dob || '',
    address: (address || '').trim(),
    notes: (notes || '').trim(),
  };
  patients.push(patient);
  return { ...patient };
}

function deletePatient(id) {
  const before = patients.length;
  patients = patients.filter((p) => p.id !== id);
  return patients.length < before;
}

function reset() {
  patients = [];
  nextId = 1;
}

module.exports = { getPatients, getPatient, addPatient, deletePatient, reset };
