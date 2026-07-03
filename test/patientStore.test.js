'use strict';

const patients = require('../lib/patientStore');

beforeEach(() => {
  patients.reset();
});

test('getPatients starts empty', () => {
  expect(patients.getPatients()).toEqual([]);
});

test('addPatient stores contact info, dob, address, and notes', () => {
  const patient = patients.addPatient({
    fullName: 'Jane Doe',
    phone: '0917-000-0000',
    email: 'jane@example.com',
    dob: '1990-05-01',
    address: '123 Rizal St., Manila',
    notes: 'Allergic to lidocaine',
  });
  expect(patient).toMatchObject({
    fullName: 'Jane Doe',
    phone: '0917-000-0000',
    email: 'jane@example.com',
    dob: '1990-05-01',
    address: '123 Rizal St., Manila',
    notes: 'Allergic to lidocaine',
  });
});

test('addPatient rejects a missing name', () => {
  expect(() => patients.addPatient({ fullName: '   ' })).toThrow(/name is required/i);
});

test('addPatient defaults optional fields to empty strings', () => {
  const patient = patients.addPatient({ fullName: 'Jane Doe' });
  expect(patient).toMatchObject({ phone: '', email: '', dob: '', address: '', notes: '' });
});

test('deletePatient removes the correct patient', () => {
  const a = patients.addPatient({ fullName: 'Keep' });
  const b = patients.addPatient({ fullName: 'Remove me' });
  expect(patients.deletePatient(b.id)).toBe(true);
  const remaining = patients.getPatients();
  expect(remaining).toHaveLength(1);
  expect(remaining[0].id).toBe(a.id);
});

test('deletePatient returns false for an unknown id', () => {
  expect(patients.deletePatient(9999)).toBe(false);
});
