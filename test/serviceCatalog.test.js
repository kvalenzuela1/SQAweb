'use strict';

const { getServices, findService } = require('../lib/serviceCatalog');

test('getServices returns the aesthetics service catalog', () => {
  const list = getServices();
  expect(list.length).toBeGreaterThan(0);
  expect(list.every((s) => typeof s.price === 'number' && typeof s.durationMinutes === 'number')).toBe(true);
});

test('findService returns the matching service', () => {
  expect(findService('botox')).toMatchObject({ name: 'Botox Injections' });
});

test('findService returns null for an unknown id', () => {
  expect(findService('does-not-exist')).toBeNull();
});
