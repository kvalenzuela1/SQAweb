'use strict';

const appointments = require('../lib/appointmentStore');
const invoices = require('../lib/invoiceStore');
const patients = require('../lib/patientStore');

beforeEach(() => {
  appointments.reset();
  invoices.reset();
  patients.reset();
});

test('generateInvoice creates an invoice from a booked appointment', () => {
  const patient = patients.addPatient({ fullName: 'Jane Doe' });
  const appt = appointments.addAppointment({
    patientId: patient.id,
    doctorId: 'dr-nieto',
    serviceIds: ['botox'],
    date: '2026-07-10',
    time: '10:00',
  });
  const invoice = invoices.generateInvoice(appt.id);
  expect(invoice).toMatchObject({
    invoiceNumber: 'INV-0001',
    clientName: 'Jane Doe',
    doctorName: 'Dr. Rhodora Nieto',
    serviceName: 'Botox Injections',
    price: 250,
  });
});

test('generateInvoice throws for an unknown appointment', () => {
  expect(() => invoices.generateInvoice(9999)).toThrow(/not found/i);
});

test('generateInvoice refuses to double-invoice the same appointment', () => {
  const patient = patients.addPatient({ fullName: 'Jane' });
  const appt = appointments.addAppointment({ patientId: patient.id, doctorId: 'dr-nieto', serviceIds: ['botox'], date: '2026-07-10', time: '10:00' });
  invoices.generateInvoice(appt.id);
  expect(() => invoices.generateInvoice(appt.id)).toThrow(/already/i);
});

test('invoice numbers increment across invoices', () => {
  const patientA = patients.addPatient({ fullName: 'A' });
  const patientB = patients.addPatient({ fullName: 'B' });
  const a = appointments.addAppointment({ patientId: patientA.id, doctorId: 'dr-nieto', serviceIds: ['botox'], date: '2026-07-10', time: '09:00' });
  const b = appointments.addAppointment({ patientId: patientB.id, doctorId: 'dr-nieto', serviceIds: ['peel'], date: '2026-07-10', time: '10:00' });
  expect(invoices.generateInvoice(a.id).invoiceNumber).toBe('INV-0001');
  expect(invoices.generateInvoice(b.id).invoiceNumber).toBe('INV-0002');
});
