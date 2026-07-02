'use strict';

// Turns a completed appointment into a billing record. One invoice per
// appointment — generating twice for the same appointment is rejected.

const appointmentStore = require('./appointmentStore');

let invoices = [];
let nextId = 1;

function formatInvoiceNumber(id) {
  return `INV-${String(id).padStart(4, '0')}`;
}

function generateInvoice(appointmentId) {
  const appt = appointmentStore.getAppointment(appointmentId);
  if (!appt) throw new Error('Appointment not found');
  if (appt.invoiced) throw new Error('An invoice has already been generated for this appointment');

  const invoice = {
    id: nextId,
    invoiceNumber: formatInvoiceNumber(nextId),
    appointmentId: appt.id,
    clientName: appt.clientName,
    doctorName: appt.doctorName,
    serviceName: appt.serviceName,
    price: appt.price,
    date: appt.date,
    issuedAt: new Date().toISOString(),
  };
  nextId++;
  invoices.push(invoice);
  appointmentStore.markInvoiced(appt.id);
  return { ...invoice };
}

function getInvoices() {
  return invoices.map((i) => ({ ...i }));
}

function getInvoice(id) {
  const invoice = invoices.find((i) => i.id === id);
  return invoice ? { ...invoice } : null;
}

function reset() {
  invoices = [];
  nextId = 1;
}

module.exports = { generateInvoice, getInvoices, getInvoice, reset };
