'use strict';

const appointments = require('../lib/appointmentStore');
const patients = require('../lib/patientStore');

let patientId;
beforeEach(() => {
  appointments.reset();
  patients.reset();
  patientId = patients.addPatient({ fullName: 'Jane Doe' }).id;
});

test('getAppointments starts empty', () => {
  expect(appointments.getAppointments()).toEqual([]);
});

test('addAppointment resolves doctor and service details from the catalogs', () => {
  const appt = appointments.addAppointment({
    patientId,
    doctorId: 'dr-nieto',
    serviceIds: ['botox'],
    date: '2026-07-10',
    time: '10:00',
  });
  expect(appt).toMatchObject({
    patientId,
    clientName: 'Jane Doe',
    doctorName: 'Dr. Rhodora Nieto',
    serviceName: 'Botox Injections',
    price: 250,
    invoiced: false,
  });
});

test('addAppointment sums price and duration across multiple selected services', () => {
  const appt = appointments.addAppointment({
    patientId,
    doctorId: 'dr-nieto',
    serviceIds: ['botox', 'peel'],
    date: '2026-07-10',
    time: '10:00',
  });
  expect(appt).toMatchObject({
    serviceName: 'Botox Injections, Chemical Peel',
    price: 400,
    durationMinutes: 60,
  });
});

test('addAppointment rejects an empty service selection', () => {
  expect(() =>
    appointments.addAppointment({ patientId, doctorId: 'dr-nieto', serviceIds: [], date: '2026-07-10', time: '10:00' })
  ).toThrow(/at least one service/i);
});

test('addAppointment blocks a doctor for the full combined duration of multiple services', () => {
  appointments.addAppointment({
    patientId,
    doctorId: 'dr-nieto',
    serviceIds: ['botox', 'peel'],
    date: '2026-07-10',
    time: '09:00',
  });
  expect(() =>
    appointments.addAppointment({ patientId, doctorId: 'dr-nieto', serviceIds: ['botox'], date: '2026-07-10', time: '09:45' })
  ).toThrow(/overlap/i);
});

test('addAppointment rejects an unknown doctor', () => {
  expect(() =>
    appointments.addAppointment({ patientId, doctorId: 'nope', serviceIds: ['botox'], date: '2026-07-10', time: '10:00' })
  ).toThrow();
});

test('addAppointment rejects an unknown service', () => {
  expect(() =>
    appointments.addAppointment({ patientId, doctorId: 'dr-nieto', serviceIds: ['nope'], date: '2026-07-10', time: '10:00' })
  ).toThrow();
});

test('cancelAppointment removes the correct appointment', () => {
  const a = appointments.addAppointment({ patientId, doctorId: 'dr-nieto', serviceIds: ['botox'], date: '2026-07-10', time: '09:00' });
  const b = appointments.addAppointment({ patientId, doctorId: 'dr-nieto', serviceIds: ['peel'], date: '2026-07-10', time: '11:00' });
  expect(appointments.cancelAppointment(b.id)).toBe(true);
  const remaining = appointments.getAppointments();
  expect(remaining).toHaveLength(1);
  expect(remaining[0].id).toBe(a.id);
});

test('addAppointment rejects an overlapping time slot for the same doctor', () => {
  appointments.addAppointment({ patientId, doctorId: 'dr-nieto', serviceIds: ['botox'], date: '2026-07-10', time: '10:00' });
  expect(() =>
    appointments.addAppointment({ patientId, doctorId: 'dr-nieto', serviceIds: ['peel'], date: '2026-07-10', time: '10:15' })
  ).toThrow(/overlap/i);
});

test('addAppointment allows the same time slot on a different date', () => {
  appointments.addAppointment({ patientId, doctorId: 'dr-nieto', serviceIds: ['botox'], date: '2026-07-06', time: '09:00' });
  expect(() =>
    appointments.addAppointment({ patientId, doctorId: 'dr-nieto', serviceIds: ['botox'], date: '2026-07-07', time: '09:00' })
  ).not.toThrow();
});

test('addAppointment rejects an unknown patient', () => {
  expect(() =>
    appointments.addAppointment({ patientId: 9999, doctorId: 'dr-nieto', serviceIds: ['botox'], date: '2026-07-10', time: '10:00' })
  ).toThrow(/valid patient/i);
});
