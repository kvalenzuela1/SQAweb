'use strict';

const { getDoctors, findDoctor } = require('../lib/doctorCatalog');

test('getDoctors returns the doctor roster', () => {
  expect(getDoctors().length).toBeGreaterThan(0);
});

test('findDoctor returns null for an unknown id', () => {
  expect(findDoctor('does-not-exist')).toBeNull();
});
