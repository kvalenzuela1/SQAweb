'use strict';

const appointments = require('../lib/appointmentStore');

beforeEach(() => {
  appointments.reset();
});

test('getAppointments starts empty', () => {
  expect(appointments.getAppointments()).toEqual([]);
});

test('addAppointment resolves doctor and service details from the catalogs', () => {
  const appt = appointments.addAppointment({
    clientName: 'Jane Doe',
    doctorId: 'dr-cruz',
    serviceId: 'botox',
    date: '2026-07-10',
    time: '10:00',
  });
  expect(appt).toMatchObject({
    clientName: 'Jane Doe',
    doctorName: 'Dr. Elena Cruz',
    serviceName: 'Botox Injections',
    price: 250,
    invoiced: false,
  });
});

test('addAppointment rejects an unknown doctor', () => {
  expect(() =>
    appointments.addAppointment({ clientName: 'Jane', doctorId: 'nope', serviceId: 'botox', date: '2026-07-10', time: '10:00' })
  ).toThrow();
});

test('addAppointment rejects an unknown service', () => {
  expect(() =>
    appointments.addAppointment({ clientName: 'Jane', doctorId: 'dr-cruz', serviceId: 'nope', date: '2026-07-10', time: '10:00' })
  ).toThrow();
});

test('cancelAppointment removes the correct appointment', () => {
  const a = appointments.addAppointment({ clientName: 'Keep', doctorId: 'dr-cruz', serviceId: 'botox', date: '2026-07-10', time: '09:00' });
  const b = appointments.addAppointment({ clientName: 'Cancel me', doctorId: 'dr-cruz', serviceId: 'peel', date: '2026-07-10', time: '11:00' });
  expect(appointments.cancelAppointment(b.id)).toBe(true);
  const remaining = appointments.getAppointments();
  expect(remaining).toHaveLength(1);
  expect(remaining[0].id).toBe(a.id);
});

test('addAppointment rejects an overlapping time slot for the same doctor', () => {
  appointments.addAppointment({ clientName: 'A', doctorId: 'dr-cruz', serviceId: 'botox', date: '2026-07-10', time: '10:00' });
  expect(() =>
    appointments.addAppointment({ clientName: 'B', doctorId: 'dr-cruz', serviceId: 'peel', date: '2026-07-10', time: '10:15' })
  ).toThrow(/overlap/i);
});

test('addAppointment allows the same time slot on a different date', () => {
  appointments.addAppointment({ clientName: 'Monday client', doctorId: 'dr-cruz', serviceId: 'botox', date: '2026-07-06', time: '09:00' });
  expect(() =>
    appointments.addAppointment({ clientName: 'Tuesday client', doctorId: 'dr-cruz', serviceId: 'botox', date: '2026-07-07', time: '09:00' })
  ).not.toThrow();
});
