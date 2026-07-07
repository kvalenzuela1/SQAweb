'use strict';

const patients = require('../lib/patientStore');

beforeEach(() => {
  patients.reset();
});

test('getPatients returns empty array initially', () => {
  expect(patients.getPatients()).toEqual([]);
});

test('addPatient creates a valid patient', () => {
  const p = patients.addPatient({
    firstName: 'Jenny',
    lastName: 'Cruz',
    dob: '2004-05-12',
    gender: 'Female',
    contact: '09171234567'
  });

  expect(p).toMatchObject({
    firstName: 'Jenny',
    lastName: 'Cruz',
    dob: '2004-05-12'
  });
});

test('addPatient throws error on missing fields', () => {
  expect(() =>
    patients.addPatient({ firstName: '', lastName: '', dob: '' })
  ).toThrow();
});

test('findPatient returns correct record', () => {
  const p = patients.addPatient({
    firstName: 'Test',
    lastName: 'User',
    dob: '2000-01-01'
  });

  expect(patients.findPatient(p.id)).toMatchObject({
    firstName: 'Test'
  });
});

test('deletePatient removes record', () => {
  const p = patients.addPatient({
    firstName: 'A',
    lastName: 'B',
    dob: '2000-01-01'
  });

  expect(patients.deletePatient(p.id)).toBe(true);
  expect(patients.getPatients()).toHaveLength(0);
});