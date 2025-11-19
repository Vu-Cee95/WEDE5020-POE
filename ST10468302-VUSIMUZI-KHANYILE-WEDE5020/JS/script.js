/* Cleaned unified script.js
   - Mobile menu, navbar, counters, gallery, etc. (kept minimal versions)
   - Centralised form validation for contact & enquiry
   - Reliable Formspree submission module (retry, localStorage outbox)
   - Debug logs to help testing (remove in production if desired)
*/

/* ----------------- UI Helpers (menu, navbar) ----------------- */
function showMenu() {
  const navLinks = document.getElementById("navLinks");
  if (navLinks) {
    navLinks.style.right = "0";
    document.addEventListener('click', closeMenuOnClickOutside);
  }
}
function hideMenu() {
  const navLinks = document.getElementById("navLinks");
  if (navLinks) {
    navLinks.style.right = "-200px";
    document.removeEventListener('click', closeMenuOnClickOutside);
  }
}
function closeMenuOnClickOutside(e) {
  const navLinks = document.getElementById("navLinks");
  const menuIcon = document.querySelector('.fa-bars');
  if (!navLinks || !menuIcon) return;
  if (!navLinks.contains(e.target) && !menuIcon.contains(e.target)) hideMenu();
}
function initNavbarScroll() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) nav.classList.add('scrolled'); else nav.classList.remove('scrolled');
  });
}
function initMobileMenuLinks() {
  const navLinks = document.querySelectorAll('.nav-links a');
  navLinks.forEach(link => link.addEventListener('click', () => { if (window.innerWidth <= 768) hideMenu(); }));
}
function initWindowResize() {
  window.addEventListener('resize', () => { if (window.innerWidth > 768) hideMenu(); });
}

/* ----------------- Basic interactive components (kept lightweight) ----------------- */
function initCounterAnimation() {
  const counters = document.querySelectorAll('.counter');
  if (!counters.length) return;
  const animate = (el, target) => {
    let current = 0;
    const step = Math.max(1, Math.floor(target / 100));
    const tick = setInterval(() => {
      current += step;
      if (current >= target) { el.textContent = target + '+'; clearInterval(tick); }
      else el.textContent = Math.floor(current) + '+';
    }, 20);
  };
  const first = counters[0];
  function check() { if (first && first.getBoundingClientRect().top < window.innerHeight) { counters.forEach(c => animate(c, parseInt(c.dataset.target || '0'))); window.removeEventListener('scroll', check); } }
  window.addEventListener('load', check); window.addEventListener('scroll', check);
}

/* ----------------- Utility validation functions ----------------- */
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}
function isValidPhone(phone) {
  const cleaned = phone.replace(/\s+/g,'');
  const re = /^(\+27|0)[6-8][0-9]{8}$/;
  return re.test(cleaned);
}

/* ----------------- FORM VALIDATION (specific to your form IDs) ----------------- */
function validateContactForm(form) {
  // returns { ok: boolean, errors: [] }
  const errors = [];
  const name = form.querySelector('#contactName')?.value || '';
  const email = form.querySelector('#contactEmail')?.value || '';
  const service = form.querySelector('#contactService')?.value || '';
  const message = form.querySelector('#contactMessage')?.value || '';
  const privacy = form.querySelector('#contactPrivacyConsent')?.checked;

  // Clear previous messages
  form.querySelectorAll('.error-message').forEach(e => e.textContent = '');

  if (!name || name.trim().length < 2) { errors.push({id:'contactNameError', msg:'Name must be at least 2 characters'}); }
  if (!email) { errors.push({id:'contactEmailError', msg:'Email is required'}); } else if (!isValidEmail(email)) { errors.push({id:'contactEmailError', msg:'Enter a valid email'}); }
  if (!service) { errors.push({id:'contactServiceError', msg:'Please select a service'}); }
  if (!message || message.trim().length < 10) { errors.push({id:'contactMessageError', msg:'Message must be at least 10 characters'}); }
  if (!privacy) { errors.push({id:'contactPrivacyError', msg:'You must agree to the privacy policy'}); }

  errors.forEach(e => { const el = document.getElementById(e.id); if (el) el.textContent = e.msg; });
  return { ok: errors.length === 0, errors };
}

function validateEnquiryForm(form) {
  const errors = [];
  const fullName = form.querySelector('#fullName')?.value || '';
  const email = form.querySelector('#email')?.value || '';
  const phone = form.querySelector('#phone')?.value || '';
  const enquiryType = form.querySelector('#enquiryType')?.value || '';
  const projectDescription = form.querySelector('#projectDescription')?.value || '';
  const timeline = form.querySelector('#timeline')?.value || '';
  const privacy = form.querySelector('#privacyPolicy')?.checked;

  form.querySelectorAll('.error-message').forEach(e => e.textContent = '');

  if (!fullName || fullName.trim().length < 2) { errors.push({id:'fullNameError', msg:'Full name must be at least 2 characters'}); }
  if (!email) { errors.push({id:'emailError', msg:'Email is required'}); } else if (!isValidEmail(email)) { errors.push({id:'emailError', msg:'Enter a valid email'}); }
  if (!phone || !isValidPhone(phone)) { errors.push({id:'phoneError', msg:'Please enter a valid phone number'}); }
  if (!enquiryType) { errors.push({id:'enquiryTypeError', msg:'Please select an enquiry type'}); }
  if (!projectDescription || projectDescription.trim().length < 10) { errors.push({id:'projectDescriptionError', msg:'Project description must be at least 10 characters'}); }
  if (!timeline) { errors.push({id:'timelineError', msg:'Please select a timeline'}); }
  if (!privacy) { errors.push({id:'privacyPolicyError', msg:'You must agree to the privacy policy'}); }

  errors.forEach(e => { const el = document.getElementById(e.id); if (el) el.textContent = e.msg; });
  return { ok: errors.length === 0, errors };
}

/* ----------------- Reliable Formspree Submission Module ----------------- */
const FORM_OUTBOX_KEY = 'form_outbox_v1';
const MAX_ATTEMPTS = 5;
const BASE_BACKOFF_MS = 1200;

function readOutbox() {
  try { return JSON.parse(localStorage.getItem(FORM_OUTBOX_KEY) || '[]'); } catch (e) { localStorage.removeItem(FORM_OUTBOX_KEY); return []; }
}
function writeOutbox(list) { localStorage.setItem(FORM_OUTBOX_KEY, JSON.stringify(list)); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,9); }
function enqueueItem(item) { const box = readOutbox(); box.push(item); writeOutbox(box); }
function removeOutboxItem(id) { writeOutbox(readOutbox().filter(i => i.id !== id)); }

async function postToFormspree(actionUrl, formData) {
  try {
    const r = await fetch(actionUrl, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Accept': 'application/json' },
      body: formData
    });
    let data;
    try { data = await r.json(); } catch (e) { data = await r.text(); }
    return { ok: r.ok, status: r.status, data };
  } catch (err) {
    return { ok: false, status: 0, error: String(err) };
  }
}

async function reliableSend(payload, uiCallback) {
  // payload: { id, action, fields: {k:v...}, attempts, queuedAt }
  payload.attempts = (payload.attempts || 0) + 1;
  uiCallback && uiCallback(`Attempt ${payload.attempts} to send...`, 'info');
  const fd = new FormData();
  for (const k in payload.fields) fd.append(k, payload.fields[k]);
  if (payload.queuedAt) fd.append('_queued_at', payload.queuedAt);

  const res = await postToFormspree(payload.action, fd);
  if (res.ok) {
    removeOutboxItem(payload.id);
    uiCallback && uiCallback('Message delivered to Formspree.', 'success');
    return { ok: true, res };
  } else {
    uiCallback && uiCallback(`Send failed (status ${res.status || 'network'})`, 'warn');
    if (payload.attempts >= MAX_ATTEMPTS) {
      // Store (or update) in outbox for later manual inspection/retry
      const box = readOutbox();
      const exists = box.find(i => i.id === payload.id);
      if (!exists) enqueueItem(payload);
      else {
        const updated = box.map(i => i.id === payload.id ? payload : i);
        writeOutbox(updated);
      }
      uiCallback && uiCallback('Message queued for later retry.', 'info');
      return { ok: false, res };
    } else {
      // exponential backoff then retry
      const delay = BASE_BACKOFF_MS * Math.pow(2, payload.attempts - 1);
      await new Promise(r => setTimeout(r, delay));
      return reliableSend(payload, uiCallback);
    }
  }
}

async function processOutbox(uiCallback) {
  const box = readOutbox();
  if (!box.length) return;
  for (const item of [...box]) {
    uiCallback && uiCallback(`Retrying queued message ${item.id} (attempts ${item.attempts || 0})`, 'info');
    await reliableSend(item, uiCallback);
  }
}

/* ----------------- Wire forms to reliable submit after validation ----------------- */
function wireForms() {
  // Contact form
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      console.log('[Form] contact submit triggered');
      const validation = validateContactForm(contactForm);
      if (!validation.ok) { console.warn('[Form] contact validation failed', validation.errors); return; }

      // Prepare payload
      const formFields = {};
      new FormData(contactForm).forEach((v,k) => formFields[k] = v);
      const payload = { id: uid(), action: contactForm.getAttribute('action') || contactForm.action, fields: formFields, attempts:0, queuedAt: new Date().toISOString() };

      // UI hooks
      const submitBtn = document.getElementById('contactSubmitBtn');
      const btnText = submitBtn && submitBtn.querySelector('.btn-text');
      const btnLoading = submitBtn && submitBtn.querySelector('.btn-loading');
      if (btnText) btnText.style.display = 'none';
      if (btnLoading) btnLoading.style.display = 'inline';
      if (submitBtn) submitBtn.disabled = true;

      reliableSend(payload, (msg, level) => {
        console.log('[contact]', level, msg);
      }).then(result => {
        if (result.ok) {
          contactForm.reset();
          if (typeof Swal !== 'undefined') {
            Swal.fire({ title: 'Message Sent', text: 'Thank you! We will get back to you soon.', icon: 'success' });
          } else { alert('Message sent successfully'); }
        } else {
          // queued or failed -> notify user
          if (typeof Swal !== 'undefined') {
            Swal.fire({ title: 'Message Queued', text: 'You are currently offline or the server is unavailable. Your message will be retried automatically.', icon: 'warning' });
          } else { alert('Message queued for retry.'); }
        }
      }).finally(() => {
        if (btnText) btnText.style.display = 'inline';
        if (btnLoading) btnLoading.style.display = 'none';
        if (submitBtn) submitBtn.disabled = false;
      });
    });
  }

  // Enquiry form
  const enquiryForm = document.getElementById('enquiryForm');
  if (enquiryForm) {
    enquiryForm.addEventListener('submit', function(e) {
      e.preventDefault();
      console.log('[Form] enquiry submit triggered');
      const validation = validateEnquiryForm(enquiryForm);
      if (!validation.ok) { console.warn('[Form] enquiry validation failed', validation.errors); return; }

      const formFields = {};
      new FormData(enquiryForm).forEach((v,k) => formFields[k] = v);
      const payload = { id: uid(), action: enquiryForm.getAttribute('action') || enquiryForm.action, fields: formFields, attempts:0, queuedAt: new Date().toISOString() };

      const submitBtn = document.getElementById('submitBtn');
      const btnText = submitBtn && submitBtn.querySelector('.btn-text');
      const btnLoading = submitBtn && submitBtn.querySelector('.btn-loading');
      if (btnText) btnText.style.display = 'none';
      if (btnLoading) btnLoading.style.display = 'inline';
      if (submitBtn) submitBtn.disabled = true;

      reliableSend(payload, (msg, level) => {
        console.log('[enquiry]', level, msg);
      }).then(result => {
        if (result.ok) {
          enquiryForm.reset();
          const updateDynamicFields = window.updateDynamicFields || function(){};
          try { updateDynamicFields(''); } catch(e){}
          if (typeof Swal !== 'undefined') {
            Swal.fire({ title: 'Message Sent', text: 'Thank you! We will get back to you soon.', icon: 'success' });
          } else { alert('Message sent successfully'); }
        } else {
          if (typeof Swal !== 'undefined') {
            Swal.fire({ title: 'Message Queued', text: 'You are currently offline or the server is unavailable. Your message will be retried automatically.', icon: 'warning' });
          } else { alert('Message queued for retry.'); }
        }
      }).finally(() => {
        if (btnText) btnText.style.display = 'inline';
        if (btnLoading) btnLoading.style.display = 'none';
        if (submitBtn) submitBtn.disabled = false;
      });
    });
  }
}

/* ----------------- Auto-run and online handling ----------------- */
window.addEventListener('load', function() {
  console.log('script.js loaded - initialising UI and forms');
  initNavbarScroll();
  initMobileMenuLinks();
  initWindowResize();
  initCounterAnimation();
  wireForms();
  // process any queued messages on load
  processOutbox((m,l) => console.log('[outbox]', l, m));
});

window.addEventListener('online', function() {
  console.log('Back online - processing outbox');
  processOutbox((m,l) => console.log('[outbox]', l, m));
});

/* ----------------- Expose for debugging (optional) ----------------- */
window.__form_helper = {
  readOutbox: readOutbox,
  writeOutbox: writeOutbox,
  processOutbox: processOutbox,
  reliableSend: reliableSend
};
