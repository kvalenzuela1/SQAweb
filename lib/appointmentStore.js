'use strict';

// In-memory appointment store. Each appointment assigns a doctor and a
// service (both resolved from their catalogs) to a client at a date/time.

const { findService } = require('./serviceCatalog');
const { findDoctor } = require('./doctorCatalog');

let appointments = [];
let nextId = 1;

function getAppointments() {
  return appointments.map((a) => ({ ...a }));
}

function getAppointment(id) {
  const appt = appointments.find((a) => a.id === id);
  return appt ? { ...appt } : null;
}

function addAppointment({ clientName, doctorId, serviceId, date, time }) {
  const trimmedName = (clientName || '').trim();
  if (!trimmedName) throw new Error('Client name is required');

  const doctor = findDoctor(doctorId);
  if (!doctor) throw new Error('A valid doctor must be selected');

  const service = findService(serviceId);
  if (!service) throw new Error('A valid service must be selected');

  if (!date) throw new Error('Date is required');
  if (!time) throw new Error('Time is required');

  const appt = {
    id: nextId++,
    clientName: trimmedName,
    doctorId,
    doctorName: doctor.name,
    serviceId,
    serviceName: service.name,
    price: service.price,
    date,
    time,
    durationMinutes: service.durationMinutes,
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
