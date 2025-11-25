/* ----------------- ACCORDIONS (About / other sections) ----------------- */
function initAccordions() {
  const accordions = document.querySelectorAll('.accordion');
  if (!accordions.length) return;

  accordions.forEach(acc => {
    const header = acc.querySelector('.accordion-header') || acc;

    header.addEventListener('click', () => {
      const isActive = acc.classList.contains('active');

      document.querySelectorAll('.accordion').forEach(other => {
        other.classList.remove('active');
        const content = other.nextElementSibling;
        if (content && content.classList.contains('accordion-content')) {
          content.style.maxHeight = null;
        }
      });

      if (!isActive) {
        acc.classList.add('active');
        const content = acc.nextElementSibling;
        if (content && content.classList.contains('accordion-content')) {
          content.style.maxHeight = content.scrollHeight + 'px';
        }
      }
    });
  });
}

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

/* ----------------- SERVICES PAGE FUNCTIONALITY (Fixed Version) ----------------- */
function initServicesFunctionality() {
  // Only run on services page
  if (!document.querySelector('.our-services')) {
    console.log('Not on services page, skipping services initialization');
    return;
  }
  
  console.log('Initializing services functionality...');
  
  // Variables
  let currentTab = 'all';
  let currentSearch = '';
  let currentSort = 'name-asc';
  
  // Initialize
  updateServicesDisplay();
  
  // Tab functionality
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Update active tab
      tabButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // Update current tab
      currentTab = this.getAttribute('data-tab');
      console.log('Tab changed to:', currentTab);
      
      // Update display
      updateServicesDisplay();
    });
  });
  
  // Search functionality
  const searchInput = document.getElementById('serviceSearch');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      currentSearch = this.value.toLowerCase().trim();
      console.log('Search term:', currentSearch);
      
      // Show/hide clear button
      const clearButton = document.getElementById('clearSearch');
      if (clearButton) {
        if (currentSearch.length > 0) {
          clearButton.style.display = 'flex';
        } else {
          clearButton.style.display = 'none';
        }
      }
      
      // Update display
      updateServicesDisplay();
    });
  }
  
  // Clear search functionality
  const clearButton = document.getElementById('clearSearch');
  if (clearButton) {
    clearButton.addEventListener('click', function() {
      if (searchInput) {
        searchInput.value = '';
        currentSearch = '';
        this.style.display = 'none';
        console.log('Search cleared');
        updateServicesDisplay();
      }
    });
  }
  
  // Sort functionality
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', function() {
      currentSort = this.value;
      console.log('Sort changed to:', currentSort);
      updateServicesDisplay();
    });
  }
  
  // Reset filters functionality
  const resetButton = document.getElementById('resetFilters');
  if (resetButton) {
    resetButton.addEventListener('click', function() {
      // Reset all filters
      tabButtons.forEach(btn => btn.classList.remove('active'));
      const allTab = document.querySelector('.tab-btn[data-tab="all"]');
      if (allTab) allTab.classList.add('active');
      currentTab = 'all';
      
      if (searchInput) {
        searchInput.value = '';
        currentSearch = '';
      }
      
      if (clearButton) {
        clearButton.style.display = 'none';
      }
      
      if (sortSelect) {
        sortSelect.value = 'name-asc';
      }
      currentSort = 'name-asc';
      
      console.log('Filters reset');
      updateServicesDisplay();
    });
  }
  
  // Card flip functionality
  const serviceCards = document.querySelectorAll('.service-card');
  serviceCards.forEach(card => {
    card.addEventListener('click', function(e) {
      // Don't flip if clicking on a link
      if (e.target.tagName === 'A' || e.target.closest('a')) {
        return;
      }
      
      const cardInner = this.querySelector('.card-inner');
      if (cardInner) {
        // Toggle flipped state
        if (cardInner.classList.contains('flipped')) {
          cardInner.classList.remove('flipped');
        } else {
          cardInner.classList.add('flipped');
        }
      }
    });
  });
  
  // Prevent card flip when clicking on buttons/links
  const cardButtons = document.querySelectorAll('.service-card .btn');
  cardButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  });
  
  console.log('Services functionality initialized successfully');
}

function updateServicesDisplay() {
  let visibleCount = 0;
  
  // Get all service cards (exclude no-results message)
  const serviceCards = document.querySelectorAll('.service-card');
  const noResults = document.getElementById('noResults');
  
  console.log('Total service cards:', serviceCards.length);
  console.log('Current tab:', currentTab, 'Current search:', currentSearch);
  
  // Apply filters
  serviceCards.forEach(card => {
    if (card.id === 'noResults') return;
    
    const category = card.getAttribute('data-category');
    const title = card.querySelector('h2') ? card.querySelector('h2').textContent.toLowerCase() : '';
    const description = card.querySelector('.card-front p') ? card.querySelector('.card-front p').textContent.toLowerCase() : '';
    const backDescription = card.querySelector('.card-back p') ? card.querySelector('.card-back p').textContent.toLowerCase() : '';
    const features = card.querySelector('.card-back ul') ? card.querySelector('.card-back ul').textContent.toLowerCase() : '';
    
    // Check if card matches current tab
    const tabMatch = currentTab === 'all' || category === currentTab;
    
    // Check if card matches search
    let searchMatch = true;
    if (currentSearch) {
      searchMatch = title.includes(currentSearch) || 
                   description.includes(currentSearch) || 
                   backDescription.includes(currentSearch) ||
                   features.includes(currentSearch);
    }
    
    console.log('Card:', title, 'Tab match:', tabMatch, 'Search match:', searchMatch, 'Category:', category);
    
    // Show/hide card based on filters
    if (tabMatch && searchMatch) {
      card.classList.remove('hidden');
      card.classList.add('visible');
      visibleCount++;
      
      // Apply search highlighting if there's a search term
      if (currentSearch) {
        applySearchHighlighting(card, currentSearch);
      } else {
        removeSearchHighlighting(card);
      }
    } else {
      card.classList.remove('visible');
      card.classList.add('hidden');
    }
  });
  
  // Sort visible cards
  sortServiceCards();
  
  // Update results count
  updateResultsCount(visibleCount);
  
  // Show/hide no results message
  if (noResults) {
    if (visibleCount === 0) {
      noResults.style.display = 'block';
    } else {
      noResults.style.display = 'none';
    }
  }
  
  console.log('Final visible count:', visibleCount);
}

function applySearchHighlighting(card, searchTerm) {
  // Remove any existing highlights
  removeSearchHighlighting(card);
  
  // Escape special regex characters in search term
  const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escapedSearchTerm, 'gi');
  
  // Highlight in title
  const titles = card.querySelectorAll('h2, h3');
  titles.forEach(title => {
    const originalText = title.textContent;
    const highlightedText = originalText.replace(
      regex,
      match => `<span class="search-highlight">${match}</span>`
    );
    if (highlightedText !== originalText) {
      title.innerHTML = highlightedText;
    }
  });
  
  // Highlight in descriptions
  const descriptions = card.querySelectorAll('p');
  descriptions.forEach(desc => {
    const originalText = desc.textContent;
    const highlightedText = originalText.replace(
      regex,
      match => `<span class="search-highlight">${match}</span>`
    );
    if (highlightedText !== originalText) {
      desc.innerHTML = highlightedText;
    }
  });
  
  // Highlight in features
  const features = card.querySelectorAll('li');
  features.forEach(feature => {
    const originalText = feature.textContent;
    const highlightedText = originalText.replace(
      regex,
      match => `<span class="search-highlight">${match}</span>`
    );
    if (highlightedText !== originalText) {
      feature.innerHTML = highlightedText;
    }
  });
}

function removeSearchHighlighting(card) {
  const highlights = card.querySelectorAll('.search-highlight');
  highlights.forEach(highlight => {
    const text = highlight.textContent;
    highlight.replaceWith(text);
  });
}

function sortServiceCards() {
  const container = document.querySelector('.services-container');
  if (!container) return;
  
  const visibleCards = Array.from(document.querySelectorAll('.service-card.visible'));
  
  console.log('Sorting', visibleCards.length, 'cards by:', currentSort);
  
  // Sort based on current sort option
  switch (currentSort) {
    case 'name-asc':
      visibleCards.sort((a, b) => {
        const nameA = a.querySelector('h2') ? a.querySelector('h2').textContent.toLowerCase() : '';
        const nameB = b.querySelector('h2') ? b.querySelector('h2').textContent.toLowerCase() : '';
        return nameA.localeCompare(nameB);
      });
      break;
      
    case 'name-desc':
      visibleCards.sort((a, b) => {
        const nameA = a.querySelector('h2') ? a.querySelector('h2').textContent.toLowerCase() : '';
        const nameB = b.querySelector('h2') ? b.querySelector('h2').textContent.toLowerCase() : '';
        return nameB.localeCompare(nameA);
      });
      break;
      
    case 'price-asc':
      visibleCards.sort((a, b) => {
        const priceA = parseInt(a.getAttribute('data-price')) || 0;
        const priceB = parseInt(b.getAttribute('data-price')) || 0;
        return priceA - priceB;
      });
      break;
      
    case 'price-desc':
      visibleCards.sort((a, b) => {
        const priceA = parseInt(a.getAttribute('data-price')) || 0;
        const priceB = parseInt(b.getAttribute('data-price')) || 0;
        return priceB - priceA;
      });
      break;
      
    case 'category':
      visibleCards.sort((a, b) => {
        const categoryA = a.getAttribute('data-category') || '';
        const categoryB = b.getAttribute('data-category') || '';
        return categoryA.localeCompare(categoryB);
      });
      break;
  }
  
  // Reorder cards in container
  // First, remove all visible cards
  visibleCards.forEach(card => {
    card.remove();
  });
  
  // Then append them in sorted order
  visibleCards.forEach(card => {
    container.appendChild(card);
  });
  
  console.log('Cards sorted and reordered');
}

function updateResultsCount(count) {
  const resultsCount = document.getElementById('resultsCount');
  if (!resultsCount) return;
  
  // Update text based on count
  if (count === 0) {
    resultsCount.innerHTML = 'No services found';
  } else if (count === 1) {
    resultsCount.innerHTML = 'Showing <span class="highlight-count">1</span> service';
  } else {
    resultsCount.innerHTML = `Showing <span class="highlight-count">${count}</span> services`;
  }
  
  // Add animation
  resultsCount.classList.add('fade-in');
  setTimeout(() => {
    resultsCount.classList.remove('fade-in');
  }, 500);
  
  console.log('Results count updated:', count);
}

/* ----------------- LEAFLET MAP INITIALIZATION ----------------- */
function initMap() {
  // Check if map element exists
  const mapElement = document.getElementById('map');
  if (!mapElement) {
    console.log('Map container not found');
    return;
  }
  
  // Initialize the map with Carletonville coordinates
  const map = L.map('map').setView([-26.357, 27.394], 13);
  
  // Define different tile layers
  const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  });
  
  const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    maxZoom: 19
  });
  
  // Add default layer (street view)
  streetLayer.addTo(map);
  
  // Add marker for Trinity Tech Solutions location
  const marker = L.marker([-26.357, 27.394]).addTo(map);
  
  // Add popup to marker
  marker.bindPopup(`
    <div style="text-align: center;">
      <h4 style="margin: 0 0 10px 0; color: #000222;">Trinity Tech Solutions</h4>
      <p style="margin: 5px 0;">Khutsong South, Carletonville</p>
      <p style="margin: 5px 0;">Naledi Street 2499</p>
      <button class="popup-btn" onclick="window.open('https://maps.google.com/?q=-26.357,27.394', '_blank')" 
              style="background: red; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; margin-top: 10px;">
        Get Directions
      </button>
    </div>
  `).openPopup();
  
  // Add map control functionality
  const mapButtons = document.querySelectorAll('.map-btn');
  let currentLayer = streetLayer;
  
  mapButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Remove active class from all buttons
      mapButtons.forEach(btn => btn.classList.remove('active'));
      // Add active class to clicked button
      this.classList.add('active');
      
      const mapType = this.getAttribute('data-map-type');
      
      // Remove current layer
      map.removeLayer(currentLayer);
      
      // Add new layer based on selection
      if (mapType === 'satellite') {
        currentLayer = satelliteLayer;
      } else {
        currentLayer = streetLayer;
      }
      
      currentLayer.addTo(map);
    });
  });
  
  console.log('Leaflet map initialized successfully');
}

/* ----------------- UNIVERSAL ACCORDION FUNCTION (Handles both types) ----------------- */
function initAccordions() {
  // Handle .accordion elements (About page)
  const accordions = document.querySelectorAll('.accordion');
  accordions.forEach(acc => {
    const header = acc.querySelector('.accordion-header') || acc;
    header.addEventListener('click', () => {
      const isActive = acc.classList.contains('active');
      document.querySelectorAll('.accordion').forEach(other => {
        other.classList.remove('active');
        const content = other.nextElementSibling;
        if (content && content.classList.contains('accordion-content')) {
          content.style.maxHeight = null;
        }
      });
      if (!isActive) {
        acc.classList.add('active');
        const content = acc.nextElementSibling;
        if (content && content.classList.contains('accordion-content')) {
          content.style.maxHeight = content.scrollHeight + 'px';
        }
      }
    });
  });

  // Handle .faq-item elements (FAQ section)
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const header = item.querySelector('.faq-header');
    const content = item.querySelector('.faq-content');
    const icon = item.querySelector('.faq-icon');

    if (header && content) {
      header.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        // Close all other FAQ items
        faqItems.forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
            const otherContent = otherItem.querySelector('.faq-content');
            const otherIcon = otherItem.querySelector('.faq-icon');
            if (otherContent) otherContent.style.maxHeight = null;
            if (otherIcon) {
              otherIcon.classList.remove('fa-minus');
              otherIcon.classList.add('fa-plus');
            }
          }
        });

        // Toggle current item
        if (!isActive) {
          item.classList.add('active');
          content.style.maxHeight = content.scrollHeight + 'px';
          if (icon) {
            icon.classList.remove('fa-plus');
            icon.classList.add('fa-minus');
          }
        } else {
          item.classList.remove('active');
          content.style.maxHeight = null;
          if (icon) {
            icon.classList.remove('fa-minus');
            icon.classList.add('fa-plus');
          }
        }
      });
    }
  });
}  

/* ----------------- PROJECTS GALLERY FUNCTIONALITY ----------------- */
function initProjectsGallery() {
  const galleryContainer = document.querySelector('.gallery-container');
  const prevBtn = document.querySelector('.gallery-controls-previous');
  const nextBtn = document.querySelector('.gallery-controls-next');
  const navDots = document.querySelectorAll('.gallery-nav li');
  
  if (!galleryContainer || !prevBtn || !nextBtn) return;
  
  const items = document.querySelectorAll('.img-item');
  let currentIndex = 2; // Center item is active by default
  
  // Function to update gallery positions
  function updateGallery() {
    items.forEach((item, index) => {
      // Reset all items
      item.style.transform = '';
      item.style.opacity = '';
      item.style.zIndex = '';
      
      // Calculate position relative to current index
      const position = index - currentIndex;
      
      // Apply transformations based on position
      if (position === -2) {
        // Far left
        item.style.transform = 'translateX(-120%) scale(0.8)';
        item.style.opacity = '0.6';
        item.style.zIndex = '1';
      } else if (position === -1) {
        // Left
        item.style.transform = 'translateX(-60%) scale(0.9)';
        item.style.opacity = '0.8';
        item.style.zIndex = '2';
      } else if (position === 0) {
        // Center (active)
        item.style.transform = 'translateX(0) scale(1)';
        item.style.opacity = '1';
        item.style.zIndex = '3';
      } else if (position === 1) {
        // Right
        item.style.transform = 'translateX(60%) scale(0.9)';
        item.style.opacity = '0.8';
        item.style.zIndex = '2';
      } else if (position === 2) {
        // Far right
        item.style.transform = 'translateX(120%) scale(0.8)';
        item.style.opacity = '0.6';
        item.style.zIndex = '1';
      } else {
        // Hide items that are too far from center
        item.style.opacity = '0';
        item.style.zIndex = '0';
      }
    });
    
    // Update navigation dots
    updateNavDots();
  }
  
  // Function to update navigation dots
  function updateNavDots() {
    navDots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentIndex);
    });
  }
  
  // Function to go to next slide
  function nextSlide() {
    currentIndex = (currentIndex + 1) % items.length;
    updateGallery();
  }
  
  // Function to go to previous slide
  function prevSlide() {
    currentIndex = (currentIndex - 1 + items.length) % items.length;
    updateGallery();
  }
  
  // Function to go to specific slide
  function goToSlide(index) {
    currentIndex = index;
    updateGallery();
  }
  
  // Event listeners
  prevBtn.addEventListener('click', prevSlide);
  nextBtn.addEventListener('click', nextSlide);
  
  // Navigation dots click events
  navDots.forEach((dot, index) => {
    dot.addEventListener('click', () => goToSlide(index));
  });
  
  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      prevSlide();
    } else if (e.key === 'ArrowRight') {
      nextSlide();
    }
  });
  
  // Auto-advance (optional)
  let autoAdvance = setInterval(nextSlide, 5000);
  
  // Pause auto-advance on hover
  galleryContainer.addEventListener('mouseenter', () => {
    clearInterval(autoAdvance);
  });
  
  galleryContainer.addEventListener('mouseleave', () => {
    autoAdvance = setInterval(nextSlide, 5000);
  });
  
  // Initialize gallery
  updateGallery();
}

/* ----------------- PROJECT MODAL FUNCTIONALITY ----------------- */
function initProjectModal() {
  const modal = document.querySelector('.project-modal');
  const modalImg = document.querySelector('.project-modal-content');
  const modalTitle = document.querySelector('.project-modal-title');
  const modalDescription = document.querySelector('.project-modal-description');
  const modalCounter = document.querySelector('.project-modal-counter');
  const closeBtn = document.querySelector('.close-project-modal');
  const prevBtn = document.querySelector('.project-modal-btn:first-child');
  const nextBtn = document.querySelector('.project-modal-btn:last-child');
  
  if (!modal) return;
  
  const projectImages = [
    {
      src: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
      title: 'E-commerce Platform Development',
      description: 'Modern e-commerce solution with secure payment integration and responsive design.'
    },
    {
      src: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
      title: 'Mobile App Development',
      description: 'Cross-platform mobile application with native performance and modern UI/UX.'
    },
    {
      src: 'https://images.unsplash.com/photo-1547658719-da2b51169166?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
      title: 'Cloud Infrastructure Setup',
      description: 'Scalable cloud infrastructure with automated deployment and monitoring.'
    },
    {
      src: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
      title: 'Data Analytics Dashboard',
      description: 'Real-time data visualization and analytics platform for business intelligence.'
    },
    {
      src: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
      title: 'AI Integration Project',
      description: 'Artificial intelligence integration for automated workflows and smart insights.'
    }
  ];
  
  let currentModalIndex = 0;
  
  // Function to open modal
  function openModal(index) {
    currentModalIndex = index;
    updateModal();
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
  
  // Function to close modal
  function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
  
  // Function to update modal content
  function updateModal() {
    const project = projectImages[currentModalIndex];
    modalImg.src = project.src;
    modalImg.alt = project.title;
    modalTitle.textContent = project.title;
    modalDescription.textContent = project.description;
    modalCounter.textContent = `${currentModalIndex + 1} / ${projectImages.length}`;
  }
  
  // Function to go to next project in modal
  function nextProject() {
    currentModalIndex = (currentModalIndex + 1) % projectImages.length;
    updateModal();
  }
  
  // Function to go to previous project in modal
  function prevProject() {
    currentModalIndex = (currentModalIndex - 1 + projectImages.length) % projectImages.length;
    updateModal();
  }
  
  // Event listeners for gallery items
  const galleryItems = document.querySelectorAll('.img-item');
  galleryItems.forEach((item, index) => {
    item.addEventListener('click', () => openModal(index));
  });
  
  // Modal control events
  closeBtn.addEventListener('click', closeModal);
  prevBtn.addEventListener('click', prevProject);
  nextBtn.addEventListener('click', nextProject);
  
  // Close modal when clicking outside the image
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // Keyboard navigation for modal
  document.addEventListener('keydown', (e) => {
    if (modal.style.display === 'block') {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft') prevProject();
      if (e.key === 'ArrowRight') nextProject();
    }
  });
}

/* ----------------- SEAMLESS CAROUSEL INITIALIZATION ----------------- */
function initSeamlessCarousel() {
  const logos = document.querySelector('.logos');
  if (!logos) return;
  
  // Find the first logos-slide and duplicate it
  const firstSlide = document.querySelector('.logos-slide:first-child');
  if (firstSlide) {
    // Clone the first slide and append it for seamless looping
    const clonedSlide = firstSlide.cloneNode(true);
    clonedSlide.setAttribute('aria-hidden', 'true');
    logos.appendChild(clonedSlide);
    
    // Calculate total width for proper animation timing
    const totalLogos = firstSlide.children.length;
    const logoWidth = 150; // approximate width per logo
    const gap = 35; // gap between logos
    const totalWidth = (logoWidth + gap) * totalLogos;
    
    // Adjust animation duration based on content width for consistent speed
    const baseDuration = 35; // base duration in seconds
    const calculatedDuration = (totalWidth / 1000) * 2; // adjust based on content
    
    // Apply the animation
    const slides = document.querySelectorAll('.logos-slide');
    slides.forEach(slide => {
      slide.style.animation = `slide ${Math.max(baseDuration, calculatedDuration)}s infinite linear`;
    });
  }
}

/* ----------------- JQUERY ACCORDIONS (About Section) ----------------- */
function initJqueryAccordions() {
  // Handle .accordion-box elements (About page) with jQuery
  document.querySelectorAll('.accordion-box').forEach(accordion => {
    const header = accordion.querySelector('.accordion-header');
    const content = accordion.querySelector('.accordion-content');
    const icon = accordion.querySelector('.accordion-icon');
    
    // Initialize - close all accordions by default using CSS classes
    accordion.classList.remove('active');
    if (content) content.style.maxHeight = '0';
    
    if (header) {
      header.addEventListener('click', function() {
        const isActive = accordion.classList.contains('active');
        
        // Close all other accordions
        document.querySelectorAll('.accordion-box').forEach(other => {
          other.classList.remove('active');
          const otherContent = other.querySelector('.accordion-content');
          const otherIcon = other.querySelector('.accordion-icon');
          if (otherContent) otherContent.style.maxHeight = '0';
          if (otherIcon) {
            otherIcon.classList.remove('fa-chevron-up');
            otherIcon.classList.add('fa-chevron-down');
          }
        });
        
        // Open current accordion if it wasn't active
        if (!isActive) {
          accordion.classList.add('active');
          if (content) content.style.maxHeight = content.scrollHeight + 'px';
          if (icon) {
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
          }
        }
      });
    }
  });
}

/* ----------------- MAIN INITIALIZATION ----------------- */
window.addEventListener('load', function() {
  console.log('script.js loaded - initialising UI and forms');
  initNavbarScroll();
  initMobileMenuLinks();
  initWindowResize();
  initCounterAnimation();
  initAccordions();
  initProjectsGallery(); 
  initProjectModal();    
  wireForms();
  
  // Initialize services functionality
  initServicesFunctionality();
   // Initialize character counters for all forms
  initCharacterCounters();
  // Initialize map if on contact page
  if (document.getElementById('map')) {
    initMap();
  }
  
  // Initialize carousel if exists
  initSeamlessCarousel();
  
  // Initialize jQuery-style accordions
  initJqueryAccordions();
  
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
// services.js - jQuery implementation for services page functionality
$(document).ready(function() {
    // Only run on services page
    if (!$('.our-services').length) {
        console.log('Not on services page, skipping services initialization');
        return;
    }

    console.log('Initializing services functionality with jQuery...');

    // State variables
    let currentTab = 'all';
    let currentSearch = '';
    let currentSort = 'name-asc';

    // Initialize services display
    updateServicesDisplay();

    // Tab functionality
    $('.tab-btn').on('click', function() {
        // Update active tab
        $('.tab-btn').removeClass('active');
        $(this).addClass('active');
        
        // Update current tab
        currentTab = $(this).data('tab');
        console.log('Tab changed to:', currentTab);
        
        // Update display
        updateServicesDisplay();
    });

    // Search functionality
    $('#serviceSearch').on('input', function() {
        currentSearch = $(this).val().toLowerCase().trim();
        console.log('Search term:', currentSearch);
        
        // Show/hide clear button
        const clearButton = $('#clearSearch');
        if (currentSearch.length > 0) {
            clearButton.css('display', 'flex');
        } else {
            clearButton.css('display', 'none');
        }
        
        // Update display
        updateServicesDisplay();
    });

    // Clear search functionality
    $('#clearSearch').on('click', function() {
        $('#serviceSearch').val('');
        currentSearch = '';
        $(this).css('display', 'none');
        console.log('Search cleared');
        updateServicesDisplay();
    });

    // Sort functionality
    $('#sortSelect').on('change', function() {
        currentSort = $(this).val();
        console.log('Sort changed to:', currentSort);
        updateServicesDisplay();
    });

    // Reset filters functionality
    $('#resetFilters').on('click', function() {
        // Reset all filters
        $('.tab-btn').removeClass('active');
        $('.tab-btn[data-tab="all"]').addClass('active');
        currentTab = 'all';
        
        $('#serviceSearch').val('');
        currentSearch = '';
        
        $('#clearSearch').css('display', 'none');
        
        $('#sortSelect').val('name-asc');
        currentSort = 'name-asc';
        
        console.log('Filters reset');
        updateServicesDisplay();
    });

    // Card flip functionality
    $('.service-card').on('click', function(e) {
        // Don't flip if clicking on a link
        if ($(e.target).is('a') || $(e.target).closest('a').length) {
            return;
        }
        
        const cardInner = $(this).find('.card-inner');
        if (cardInner.length) {
            // Toggle flipped state
            cardInner.toggleClass('flipped');
        }
    });

    // Prevent card flip when clicking on buttons/links
    $('.service-card .btn').on('click', function(e) {
        e.stopPropagation();
    });

    console.log('Services functionality initialized successfully with jQuery');

    // Main function to update services display
    function updateServicesDisplay() {
        let visibleCount = 0;
        
        // Get all service cards (exclude no-results message)
        const serviceCards = $('.service-card').not('#noResults');
        const noResults = $('#noResults');
        
        console.log('Total service cards:', serviceCards.length);
        console.log('Current tab:', currentTab, 'Current search:', currentSearch);
        
        // Apply filters
        serviceCards.each(function() {
            const $card = $(this);
            const category = $card.data('category');
            const title = $card.find('h2').text().toLowerCase();
            const description = $card.find('.card-front p').text().toLowerCase();
            const backDescription = $card.find('.card-back p').text().toLowerCase();
            const features = $card.find('.card-back ul').text().toLowerCase();
            
            // Check if card matches current tab
            const tabMatch = currentTab === 'all' || category === currentTab;
            
            // Check if card matches search
            let searchMatch = true;
            if (currentSearch) {
                searchMatch = title.includes(currentSearch) || 
                             description.includes(currentSearch) || 
                             backDescription.includes(currentSearch) ||
                             features.includes(currentSearch);
            }
            
            console.log('Card:', title, 'Tab match:', tabMatch, 'Search match:', searchMatch, 'Category:', category);
            
            // Show/hide card based on filters
            if (tabMatch && searchMatch) {
                $card.removeClass('hidden').addClass('visible');
                visibleCount++;
                
                // Apply search highlighting if there's a search term
                if (currentSearch) {
                    applySearchHighlighting($card, currentSearch);
                } else {
                    removeSearchHighlighting($card);
                }
            } else {
                $card.removeClass('visible').addClass('hidden');
            }
        });
        
        // Sort visible cards
        sortServiceCards();
        
        // Update results count
        updateResultsCount(visibleCount);
        
        // Show/hide no results message
        if (visibleCount === 0) {
            noResults.css('display', 'block');
        } else {
            noResults.css('display', 'none');
        }
        
        console.log('Final visible count:', visibleCount);
    }

    // Apply search highlighting to matched text
    function applySearchHighlighting($card, searchTerm) {
        // Remove any existing highlights
        removeSearchHighlighting($card);
        
        // Escape special regex characters in search term
        const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedSearchTerm, 'gi');
        
        // Highlight in title
        $card.find('h2, h3').each(function() {
            const $title = $(this);
            const originalText = $title.text();
            const highlightedText = originalText.replace(
                regex,
                match => `<span class="search-highlight">${match}</span>`
            );
            if (highlightedText !== originalText) {
                $title.html(highlightedText);
            }
        });
        
        // Highlight in descriptions
        $card.find('p').each(function() {
            const $desc = $(this);
            const originalText = $desc.text();
            const highlightedText = originalText.replace(
                regex,
                match => `<span class="search-highlight">${match}</span>`
            );
            if (highlightedText !== originalText) {
                $desc.html(highlightedText);
            }
        });
        
        // Highlight in features
        $card.find('li').each(function() {
            const $feature = $(this);
            const originalText = $feature.text();
            const highlightedText = originalText.replace(
                regex,
                match => `<span class="search-highlight">${match}</span>`
            );
            if (highlightedText !== originalText) {
                $feature.html(highlightedText);
            }
        });
    }

    // Remove search highlighting
    function removeSearchHighlighting($card) {
        $card.find('.search-highlight').each(function() {
            const text = $(this).text();
            $(this).replaceWith(text);
        });
    }

    // Sort service cards based on current sort option
    function sortServiceCards() {
        const container = $('.services-container');
        if (!container.length) return;
        
        const visibleCards = $('.service-card.visible').get();
        
        console.log('Sorting', visibleCards.length, 'cards by:', currentSort);
        
        // Sort based on current sort option
        switch (currentSort) {
            case 'name-asc':
                visibleCards.sort((a, b) => {
                    const nameA = $(a).find('h2').text().toLowerCase();
                    const nameB = $(b).find('h2').text().toLowerCase();
                    return nameA.localeCompare(nameB);
                });
                break;
                
            case 'name-desc':
                visibleCards.sort((a, b) => {
                    const nameA = $(a).find('h2').text().toLowerCase();
                    const nameB = $(b).find('h2').text().toLowerCase();
                    return nameB.localeCompare(nameA);
                });
                break;
                
            case 'price-asc':
                visibleCards.sort((a, b) => {
                    const priceA = parseInt($(a).data('price')) || 0;
                    const priceB = parseInt($(b).data('price')) || 0;
                    return priceA - priceB;
                });
                break;
                
            case 'price-desc':
                visibleCards.sort((a, b) => {
                    const priceA = parseInt($(a).data('price')) || 0;
                    const priceB = parseInt($(b).data('price')) || 0;
                    return priceB - priceA;
                });
                break;
                
            case 'category':
                visibleCards.sort((a, b) => {
                    const categoryA = $(a).data('category') || '';
                    const categoryB = $(b).data('category') || '';
                    return categoryA.localeCompare(categoryB);
                });
                break;
        }
        
        // Reorder cards in container
        container.append(visibleCards);
        
        console.log('Cards sorted and reordered');
    }

    // Update results count display
    function updateResultsCount(count) {
        const resultsCount = $('#resultsCount');
        if (!resultsCount.length) return;
        
        // Update text based on count
        let html = '';
        if (count === 0) {
            html = 'No services found';
        } else if (count === 1) {
            html = 'Showing <span class="highlight-count">1</span> service';
        } else {
            html = `Showing <span class="highlight-count">${count}</span> services`;
        }
        
        resultsCount.html(html);
        
        // Add animation
        resultsCount.addClass('fade-in');
        setTimeout(() => {
            resultsCount.removeClass('fade-in');
        }, 500);
        
        console.log('Results count updated:', count);
    }
});

/* ----------------- FAQ ACCORDION FUNCTIONALITY ----------------- */
function initFAQAccordions() {
  const faqItems = document.querySelectorAll('.faq-item');
  
  faqItems.forEach(item => {
    const header = item.querySelector('.faq-header');
    const content = item.querySelector('.faq-content');
    const icon = item.querySelector('.faq-icon');

    if (header && content) {
      header.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        // Close all other FAQ items
        faqItems.forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
            const otherContent = otherItem.querySelector('.faq-content');
            const otherIcon = otherItem.querySelector('.faq-icon');
            if (otherContent) otherContent.style.maxHeight = null;
          }
        });

        // Toggle current item
        if (!isActive) {
          item.classList.add('active');
          content.style.maxHeight = content.scrollHeight + 'px';
          if (icon) {
            icon.style.transform = 'rotate(180deg)';
            icon.style.color = '#ff6b6b';
          }
        } else {
          item.classList.remove('active');
          content.style.maxHeight = null;
          if (icon) {
            icon.style.transform = 'rotate(0deg)';
            icon.style.color = 'red';
          }
        }
      });
    }
  });
}
/* ----------------- CHARACTER COUNTER FUNCTIONALITY ----------------- */
function initCharacterCounters() {
  console.log('Initializing character counters...');
  
  // Project Description counter in enquiry form
  const projectDesc = document.getElementById('projectDescription');
  if (projectDesc) {
    const counter = projectDesc.parentElement.querySelector('.char-counter');
    if (counter) {
      projectDesc.addEventListener('input', function() {
        const currentLength = this.value.length;
        const maxLength = this.getAttribute('maxlength') || 2000;
        counter.textContent = `${currentLength}/${maxLength} characters`;
        
        // Add warning class when approaching limit
        if (currentLength > maxLength * 0.9) {
          counter.classList.add('char-limit-warning');
        } else {
          counter.classList.remove('char-limit-warning');
        }
      });
      
      // Initialize counter on page load
      const initialLength = projectDesc.value.length;
      const maxLength = projectDesc.getAttribute('maxlength') || 2000;
      counter.textContent = `${initialLength}/${maxLength} characters`;
    }
  }
  
  // Contact Message counter in contact form
  const contactMsg = document.getElementById('contactMessage');
  if (contactMsg) {
    const counter = contactMsg.parentElement.querySelector('.char-counter');
    if (counter) {
      contactMsg.addEventListener('input', function() {
        const currentLength = this.value.length;
        const maxLength = this.getAttribute('maxlength') || 1000;
        counter.textContent = `${currentLength}/${maxLength} characters`;
        
        // Add warning class when approaching limit
        if (currentLength > maxLength * 0.9) {
          counter.classList.add('char-limit-warning');
        } else {
          counter.classList.remove('char-limit-warning');
        }
      });
      
      // Initialize counter on page load
      const initialLength = contactMsg.value.length;
      const maxLength = contactMsg.getAttribute('maxlength') || 1000;
      counter.textContent = `${initialLength}/${maxLength} characters`;
    }
  }
  
  // Contact form in index.html (the simple form)
  const indexContactMsg = document.querySelector('.ContactUs textarea[name="message"]');
  if (indexContactMsg && !indexContactMsg.id) {
    // Create counter element if it doesn't exist
    let counter = indexContactMsg.parentElement.querySelector('.char-counter');
    if (!counter) {
      counter = document.createElement('div');
      counter.className = 'char-counter';
      indexContactMsg.parentElement.appendChild(counter);
    }
    
    indexContactMsg.addEventListener('input', function() {
      const currentLength = this.value.length;
      const maxLength = 1000; // Default max length for index form
      counter.textContent = `${currentLength}/${maxLength} characters`;
      
      // Add warning class when approaching limit
      if (currentLength > maxLength * 0.9) {
        counter.classList.add('char-limit-warning');
      } else {
        counter.classList.remove('char-limit-warning');
      }
    });
    
    // Initialize counter on page load
    const initialLength = indexContactMsg.value.length;
    const maxLength = 1000;
    counter.textContent = `${initialLength}/${maxLength} characters`;
  }
  
  console.log('Character counters initialized');
}