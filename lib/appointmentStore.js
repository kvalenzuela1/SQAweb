'use strict';

// In-memory appointment store. Each appointment assigns a doctor and one or
// more services (resolved from their catalogs) to a client at a date/time.
// Price and duration are the sum across all selected services.

const { findService } = require('./serviceCatalog');
const { findDoctor } = require('./doctorCatalog');
const patientStore = require('./patientStore');

let appointments = [];
let nextId = 1;

function getAppointments() {
  return appointments.map((a) => ({ ...a }));
}

function getAppointment(id) {
  const appt = appointments.find((a) => a.id === id);
  return appt ? { ...appt } : null;
}

function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function overlaps(a, b) {
  if (a.date !== b.date || a.doctorId !== b.doctorId) return false;
  const aStart = timeToMinutes(a.time);
  const aEnd = aStart + a.durationMinutes;
  const bStart = timeToMinutes(b.time);
  const bEnd = bStart + b.durationMinutes;
  return aStart < bEnd && bStart < aEnd;
}

function addAppointment({ patientId, doctorId, serviceIds, date, time }) {
  const resolvedPatientId = Number(patientId);
  const patient = Number.isInteger(resolvedPatientId)
    ? patientStore.getPatient(resolvedPatientId)
    : null;
  if (!patient) throw new Error('A valid patient must be selected');

  const doctor = findDoctor(doctorId);
  if (!doctor) throw new Error('A valid doctor must be selected');

  const ids = Array.isArray(serviceIds) ? serviceIds : [serviceIds].filter(Boolean);
  if (ids.length === 0) throw new Error('At least one service must be selected');

  const services = ids.map((id) => findService(id));
  if (services.some((s) => !s)) throw new Error('A valid service must be selected');

  if (!date) throw new Error('Date is required');
  if (!time) throw new Error('Time is required');

  const durationMinutes = services.reduce((sum, s) => sum + s.durationMinutes, 0);
  const price = services.reduce((sum, s) => sum + s.price, 0);

  const candidate = { date, time, doctorId, durationMinutes };
  if (appointments.some((a) => overlaps(a, candidate))) {
    throw new Error(`${doctor.name} already has an appointment that overlaps this time`);
  }

  const appt = {
    id: nextId++,
    patientId: patient.id,
    clientName: patient.fullName,
    doctorId,
    doctorName: doctor.name,
    serviceIds: services.map((s) => s.id),
    serviceName: services.map((s) => s.name).join(', '),
    price,
    date,
    time,
    durationMinutes,
    invoiced: false,
  };
  appointments.push(appt);
  return { ...appt };
}

function cancelAppointment(id) {
  const before = appointments.length;
  appointments = appointments.filter((a) => a.id !== id);
  return appointments.length < before;
}

function markInvoiced(id) {
  const appt = appointments.find((a) => a.id === id);
  if (!appt) return null;
  appt.invoiced = true;
  return { ...appt };
}

function reset() {
  appointments = [];
  nextId = 1;
}

module.exports = { getAppointments, getAppointment, addAppointment, cancelAppointment, markInvoiced, reset };
