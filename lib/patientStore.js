'use strict';

let patients = [];
let nextId = 1;

// GET ALL PATIENTS
function getPatients() {
  return patients;
}

// ADD PATIENT
function addPatient(data) {
  const patient = {
    id: nextId++,
    firstName: data.firstName,
    lastName: data.lastName,
    dob: data.dob,
    gender: data.gender,
    contact: data.contact
  };

  patients.push(patient);
  return patient;
}

// FIND PATIENT
function findPatient(id) {
  return patients.find(p => p.id === Number(id)) || null;
}

// DELETE PATIENT
function deletePatient(id) {
  const index = patients.findIndex(p => p.id === Number(id));
  if (index === -1) return false;

  patients.splice(index, 1);
  return true;
}

// RESET (FOR TESTING)
function reset() {
  patients = [];
  nextId = 1;
}

// IMPORTANT EXPORTS
module.exports = {
  getPatients,
  addPatient,
  findPatient,
  deletePatient,
  reset
};