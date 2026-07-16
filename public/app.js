// --- tab switching ---
const tabButtons = document.querySelectorAll('.tab-btn');
const tabs = document.querySelectorAll('.tab');

tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    tabButtons.forEach((b) => b.classList.remove('active'));
    tabs.forEach((t) => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
  });
});

// --- services ---
const serviceListEl = document.getElementById('service-list');
const apptServicesEl = document.getElementById('appt-services');
const apptServicesSummaryEl = apptServicesEl.querySelector('summary');
const apptServicesOptionsEl = document.getElementById('appt-services-options');
const apptPatientEl = document.getElementById('appt-patient');

async function loadServices() {
  const res = await fetch('/api/services');
  const services = await res.json();
  renderServiceList(services);
  renderServiceOptions(services);
}

function renderServiceList(services) {
  serviceListEl.innerHTML = '';
  for (const service of services) {
    const li = document.createElement('li');
    const name = document.createElement('span');
    name.textContent = `${service.name} (${service.durationMinutes} min)`;
    const price = document.createElement('span');
    price.className = 'service-price';
    price.textContent = `₱${service.price.toFixed(2)}`;
    li.appendChild(name);
    li.appendChild(price);
    serviceListEl.appendChild(li);
  }
}

function renderServiceOptions(services) {
  apptServicesOptionsEl.innerHTML = '';
  for (const service of services) {
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'appt-service';
    checkbox.value = service.id;
    checkbox.addEventListener('change', updateServicesSummary);
    label.appendChild(checkbox);
    label.append(` ${service.name} (₱${service.price.toFixed(2)})`);
    apptServicesOptionsEl.appendChild(label);
  }
  updateServicesSummary();
}

function getSelectedServiceIds() {
  return Array.from(apptServicesOptionsEl.querySelectorAll('input[name="appt-service"]:checked')).map((el) => el.value);
}

function updateServicesSummary() {
  const checked = Array.from(apptServicesOptionsEl.querySelectorAll('input[name="appt-service"]:checked'));
  apptServicesSummaryEl.textContent = checked.length
    ? checked.map((el) => el.parentElement.textContent.trim()).join(', ')
    : 'Select services';
}

function closeServicesDropdownIfOutside(target) {
  if (apptServicesEl.open && !apptServicesEl.contains(target)) {
    apptServicesEl.open = false;
  }
}
document.addEventListener('click', (e) => closeServicesDropdownIfOutside(e.target));
document.addEventListener('focusin', (e) => closeServicesDropdownIfOutside(e.target));

// --- doctors ---
const apptDoctorEl = document.getElementById('appt-doctor');

async function loadDoctors() {
  const res = await fetch('/api/doctors');
  const doctors = await res.json();
  apptDoctorEl.innerHTML = '';
  for (const doctor of doctors) {
    const opt = document.createElement('option');
    opt.value = doctor.id;
    opt.textContent = doctor.name;
    apptDoctorEl.appendChild(opt);
  }
}

// --- appointments ---
const apptListEl = document.getElementById('appointment-list');
const apptFormEl = document.getElementById('appointment-form');
const apptDateEl = document.getElementById('appt-date');
const apptTimeEl = document.getElementById('appt-time');
const apptErrorEl = document.getElementById('appointment-error');

async function loadAppointments() {
  const res = await fetch('/api/appointments');
  const appts = await res.json();
  renderAppointments(appts);
}

function renderAppointments(appts) {
  apptListEl.innerHTML = '';
  const sorted = [...appts].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  for (const appt of sorted) {
    const li = document.createElement('li');

    const info = document.createElement('span');
    const title = document.createElement('div');
    title.textContent = `${appt.clientName} — ${appt.serviceName}`;
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `${appt.doctorName} · ${appt.date} at ${appt.time} · ₱${appt.price.toFixed(2)}`;
    info.appendChild(title);
    info.appendChild(meta);

    const actions = document.createElement('span');
    actions.className = 'actions';

    const invoiceBtn = document.createElement('button');
    invoiceBtn.className = 'invoice';
    if (appt.invoiced) {
      invoiceBtn.textContent = 'Invoiced';
      invoiceBtn.disabled = true;
    } else {
      invoiceBtn.textContent = 'Generate Invoice';
      invoiceBtn.addEventListener('click', () => generateInvoice(appt.id));
    }

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'delete';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => cancelAppointment(appt.id));

    actions.appendChild(invoiceBtn);
    actions.appendChild(cancelBtn);

    li.appendChild(info);
    li.appendChild(actions);
    apptListEl.appendChild(li);
  }
}

async function cancelAppointment(id) {
  await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
  loadAppointments();
}

apptFormEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  apptErrorEl.textContent = '';
  const res = await fetch('/api/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patientId: Number(apptPatientEl.value),
      doctorId: apptDoctorEl.value,
      serviceIds: getSelectedServiceIds(),
      date: apptDateEl.value,
      time: apptTimeEl.value,
    }),
  });
  if (!res.ok) {
    const { error } = await res.json();
    apptErrorEl.textContent = error;
    return;
  }
  apptPatientEl.value = '';
  apptDateEl.value = '';
  apptTimeEl.value = '';
  apptServicesOptionsEl.querySelectorAll('input[name="appt-service"]:checked').forEach((el) => (el.checked = false));
  updateServicesSummary();
  apptServicesEl.open = false;
  loadAppointments();
});

// --- invoices ---
const invoiceListEl = document.getElementById('invoice-list');

async function loadInvoices() {
  const res = await fetch('/api/invoices');
  const invoices = await res.json();
  renderInvoices(invoices);
}

function renderInvoices(invoiceList) {
  invoiceListEl.innerHTML = '';
  const sorted = [...invoiceList].sort((a, b) => b.id - a.id);
  for (const invoice of sorted) {
    const li = document.createElement('li');

    const info = document.createElement('span');
    const title = document.createElement('div');
    title.textContent = `${invoice.invoiceNumber} — ${invoice.clientName}`;
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `${invoice.serviceName} · ${invoice.doctorName} · ₱${invoice.price.toFixed(2)}`;
    info.appendChild(title);
    info.appendChild(meta);

    const viewBtn = document.createElement('button');
    viewBtn.textContent = 'View / Print';
    viewBtn.addEventListener('click', () => window.open(`/invoice/${invoice.id}`, '_blank'));

    li.appendChild(info);
    li.appendChild(viewBtn);
    invoiceListEl.appendChild(li);
  }
}

async function generateInvoice(appointmentId) {
  const res = await fetch('/api/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appointmentId }),
  });
  if (!res.ok) {
    const { error } = await res.json();
    apptErrorEl.textContent = error;
    return;
  }
  const invoice = await res.json();
  await Promise.all([loadAppointments(), loadInvoices()]);
  window.open(`/invoice/${invoice.id}`, '_blank');
}

// --- patients ---
const patientListEl = document.getElementById('patient-list');
const patientFormEl = document.getElementById('patient-form');
const patientNameEl = document.getElementById('patient-name');
const patientPhoneEl = document.getElementById('patient-phone');
const patientEmailEl = document.getElementById('patient-email');
const patientDobEl = document.getElementById('patient-dob');
const patientAddressEl = document.getElementById('patient-address');
const patientNotesEl = document.getElementById('patient-notes');
const patientErrorEl = document.getElementById('patient-error');

async function loadPatients() {
  const res = await fetch('/api/patients');
  const patients = await res.json();
  renderPatients(patients);
}

function renderPatients(patients) {
  apptPatientEl.innerHTML = '<option value="">Select patient</option>';
  for (const patient of patients) {
    const option = document.createElement('option');
    option.value = patient.id;
    option.textContent = patient.phone
      ? patient.fullName + ' (' + patient.phone + ')'
      : patient.fullName;
    apptPatientEl.appendChild(option);
  }
  apptPatientEl.disabled = patients.length === 0;

  patientListEl.innerHTML = '';
  for (const patient of patients) {
    const li = document.createElement('li');

    const info = document.createElement('span');
    const title = document.createElement('div');
    title.textContent = patient.fullName;
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = [patient.phone, patient.email, patient.dob, patient.address]
      .filter(Boolean)
      .join(' · ');
    info.appendChild(title);
    info.appendChild(meta);
    if (patient.notes) {
      const notes = document.createElement('div');
      notes.className = 'meta';
      notes.textContent = `Notes: ${patient.notes}`;
      info.appendChild(notes);
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete';
    deleteBtn.textContent = 'Remove';
    deleteBtn.addEventListener('click', () => deletePatient(patient.id));

    li.appendChild(info);
    li.appendChild(deleteBtn);
    patientListEl.appendChild(li);
  }
}

async function deletePatient(id) {
  await fetch(`/api/patients/${id}`, { method: 'DELETE' });
  loadPatients();
}

patientFormEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  patientErrorEl.textContent = '';
  const res = await fetch('/api/patients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: patientNameEl.value,
      phone: patientPhoneEl.value,
      email: patientEmailEl.value,
      dob: patientDobEl.value,
      address: patientAddressEl.value,
      notes: patientNotesEl.value,
    }),
  });
  if (!res.ok) {
    const { error } = await res.json();
    patientErrorEl.textContent = error;
    return;
  }
  patientFormEl.reset();
  await loadPatients();
});

// --- init ---
loadServices();
loadDoctors();
loadAppointments();
loadInvoices();
loadPatients();
