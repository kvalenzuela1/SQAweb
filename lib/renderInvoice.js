'use strict';

// Renders a printable invoice as a standalone HTML page. All invoice fields
// are escaped since clientName originates from user input.

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function renderInvoiceHtml(invoice) {
  const e = escapeHtml;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${e(invoice.invoiceNumber)} — O Aisthetikos</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; color: #2b2b2b; max-width: 480px; margin: 48px auto; padding: 0 16px; }
  h1 { color: #a67c52; margin-bottom: 0; }
  .tagline { color: #888; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 24px; }
  th, td { text-align: left; padding: 8px 0; border-bottom: 1px solid #eee; }
  tr.total th, tr.total td { font-weight: bold; font-size: 1.1rem; border-bottom: none; }
  button { margin-top: 24px; padding: 8px 16px; background: #a67c52; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 1rem; }
  @media print { button { display: none; } }
</style>
</head>
<body>
  <h1>O Aisthetikos</h1>
  <p class="tagline">Aesthetics &amp; Skin Clinic</p>
  <h2>Invoice ${e(invoice.invoiceNumber)}</h2>
  <p>Date: ${e(invoice.date)}</p>
  <table>
    <tr><th>Client</th><td>${e(invoice.clientName)}</td></tr>
    <tr><th>Doctor</th><td>${e(invoice.doctorName)}</td></tr>
    <tr><th>Service</th><td>${e(invoice.serviceName)}</td></tr>
    <tr class="total"><th>Total</th><td>$${Number(invoice.price).toFixed(2)}</td></tr>
  </table>
  <button onclick="window.print()">Print</button>
</body>
</html>`;
}

module.exports = { renderInvoiceHtml };
