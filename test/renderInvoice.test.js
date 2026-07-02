'use strict';

const { renderInvoiceHtml } = require('../lib/renderInvoice');

const sample = {
  invoiceNumber: 'INV-0001',
  clientName: 'Jane Doe',
  doctorName: 'Dr. Elena Cruz',
  serviceName: 'Botox Injections',
  price: 250,
  date: '2026-07-10',
};

test('renderInvoiceHtml includes the key invoice fields', () => {
  const html = renderInvoiceHtml(sample);
  expect(html).toContain('INV-0001');
  expect(html).toContain('Jane Doe');
  expect(html).toContain('250.00');
});

test('renderInvoiceHtml escapes client-supplied text to prevent XSS', () => {
  const html = renderInvoiceHtml({ ...sample, clientName: '<script>alert(1)</script>' });
  expect(html).not.toContain('<script>alert(1)</script>');
});
