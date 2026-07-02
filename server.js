'use strict';

const express = require('express');
const path = require('path');
const services = require('./lib/serviceCatalog');
const doctors = require('./lib/doctorCatalog');
const appointments = require('./lib/appointmentStore');
const invoices = require('./lib/invoiceStore');
const { renderInvoiceHtml } = require('./lib/renderInvoice');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/services', (req, res) => {
  res.json(services.getServices());
});

app.get('/api/doctors', (req, res) => {
  res.json(doctors.getDoctors());
});

app.get('/api/appointments', (req, res) => {
  res.json(appointments.getAppointments());
});

app.post('/api/appointments', (req, res) => {
  try {
    const appt = appointments.addAppointment(req.body);
    res.status(201).json(appt);
  } catch (err) {
    const status = /overlap/i.test(err.message) ? 409 : 400;
    res.status(status).json({ error: err.message });
  }
});

app.delete('/api/appointments/:id', (req, res) => {
  const cancelled = appointments.cancelAppointment(Number(req.params.id));
  if (!cancelled) return res.status(404).json({ error: 'Appointment not found' });
  res.status(204).end();
});

app.get('/api/invoices', (req, res) => {
  res.json(invoices.getInvoices());
});

app.post('/api/invoices', (req, res) => {
  try {
    const invoice = invoices.generateInvoice(req.body.appointmentId);
    res.status(201).json(invoice);
  } catch (err) {
    const status = /not found/i.test(err.message) ? 404 : 409;
    res.status(status).json({ error: err.message });
  }
});

app.get('/invoice/:id', (req, res) => {
  const invoice = invoices.getInvoice(Number(req.params.id));
  if (!invoice) return res.status(404).send('Invoice not found');
  res.send(renderInvoiceHtml(invoice));
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`O Aisthetikos app listening on http://localhost:${PORT}`));
}

module.exports = app;
