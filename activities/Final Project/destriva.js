// ============================================================
// DESTRIVA.JS — All interactive features for Destriva
// ============================================================


// ============================================================
// ACTIVE NAV LINK — highlights the current page in the nav
// ============================================================

function setActiveNav() {
  var currentPage = window.location.pathname.split('/').pop();
  document.querySelectorAll('.nav-links a').forEach(function(link) {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });
}


// ============================================================
// UPDATE COLUMN COUNTS & SUBTITLES
// ============================================================

function updateColumnCounts() {
  document.querySelectorAll('.kanban-column').forEach(function(col) {
    var countEl = col.querySelector('.column-count');
    if (!countEl) return;

    // The ALL column on the vendors page shows TOTAL vendors across all columns
    if (col.classList.contains('column-all')) {
      countEl.textContent = document.querySelectorAll('.vendor-card').length;
    } else {
      var cards = col.querySelectorAll('.guest-card, .vendor-card');
      countEl.textContent = cards.length;
    }
  });

  // Update the guest subtitle
  var guestSubtitle = document.getElementById('guest-subtitle');
  if (guestSubtitle) {
    var total     = document.querySelectorAll('.guest-card').length;
    var confirmed = document.querySelectorAll('.column-confirmed .guest-card').length;
    var favorites = document.querySelectorAll('.column-favorites .guest-card').length;
    guestSubtitle.textContent = total + ' guests added · ' + confirmed + ' confirmed · ' + favorites + ' favorites';
  }

  // Update the vendor subtitle
  var vendorSubtitle = document.getElementById('vendor-subtitle');
  if (vendorSubtitle) {
    var vTotal     = document.querySelectorAll('.vendor-card').length;
    var vConfirmed = document.querySelectorAll('.column-confirmed .vendor-card').length;
    var vContacted = document.querySelectorAll('.column-contacted .vendor-card').length;
    var vBackup    = document.querySelectorAll('.column-backup .vendor-card').length;
    vendorSubtitle.textContent = vTotal + ' vendors · ' + vConfirmed + ' confirmed · ' + vContacted + ' contacted · ' + vBackup + ' backup';
  }
}


// ============================================================
// DRAG AND DROP
// ============================================================

var draggedCard = null;

function setupDragAndDrop() {
  // Make all existing cards draggable
  document.querySelectorAll('.guest-card, .vendor-card').forEach(function(card) {
    makeDraggable(card);
  });

  // Make all columns drop zones
  document.querySelectorAll('.kanban-column').forEach(function(col) {
    makeDropZone(col);
  });
}

function makeDraggable(card) {
  card.setAttribute('draggable', true);

  card.addEventListener('dragstart', function(e) {
    draggedCard = card;
    // Small delay so the browser snapshot doesn't show the "dragging" style
    setTimeout(function() { card.classList.add('dragging'); }, 0);
    e.dataTransfer.effectAllowed = 'move';
  });

  card.addEventListener('dragend', function() {
    card.classList.remove('dragging');
    draggedCard = null;
    document.querySelectorAll('.kanban-column').forEach(function(col) {
      col.classList.remove('drag-over');
    });
    updateColumnCounts();
  });
}

function makeDropZone(column) {
  column.addEventListener('dragover', function(e) {
    e.preventDefault(); // needed to allow dropping
    if (draggedCard) {
      column.classList.add('drag-over');
    }
  });

  column.addEventListener('dragleave', function(e) {
    // Only remove the highlight if we really left the column
    if (!column.contains(e.relatedTarget)) {
      column.classList.remove('drag-over');
    }
  });

  column.addEventListener('drop', function(e) {
    e.preventDefault();
    column.classList.remove('drag-over');

    if (draggedCard) {
      column.appendChild(draggedCard); // moves the card to this column

      // If it's a vendor card, update its status badge
      if (draggedCard.classList.contains('vendor-card')) {
        updateVendorBadge(draggedCard, column);
      }

      updateColumnCounts();
    }
  });
}

// Update the status badge on a vendor card when it's moved to a new column
function updateVendorBadge(card, column) {
  var badge = card.querySelector('.vendor-status-badge');
  if (!badge) return;

  badge.className = 'vendor-status-badge'; // reset

  if (column.classList.contains('column-confirmed')) {
    badge.classList.add('badge-confirmed');
    badge.textContent = 'CONFIRMED';
  } else if (column.classList.contains('column-contacted')) {
    badge.classList.add('badge-contacted');
    badge.textContent = 'CONTACTED';
  } else if (column.classList.contains('column-backup')) {
    badge.classList.add('badge-backup');
    badge.textContent = 'BACKUP';
  } else {
    badge.classList.add('badge-new');
    badge.textContent = 'NEW';
  }
}


// ============================================================
// STAR BUTTONS (Guest page)
// ============================================================

function setupStars() {
  document.querySelectorAll('.star-btn').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation(); // don't trigger drag
      btn.classList.toggle('filled');
      btn.textContent = btn.classList.contains('filled') ? '★' : '☆';
      updateColumnCounts(); // favorites count updates
    });
  });
}

// Attach star click to a single card (used when adding new cards)
function attachStarToCard(card) {
  var btn = card.querySelector('.star-btn');
  if (!btn) return;
  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    btn.classList.toggle('filled');
    btn.textContent = btn.classList.contains('filled') ? '★' : '☆';
    updateColumnCounts();
  });
}


// ============================================================
// ADD GUEST MODAL
// ============================================================

function setupGuestModal() {
  var addBtn   = document.getElementById('add-guest-btn');
  var modal    = document.getElementById('guest-modal');
  var cancelBtn = document.getElementById('guest-cancel');
  var form     = document.getElementById('guest-form');

  if (!addBtn) return; // not on the guest page, do nothing

  addBtn.addEventListener('click', function() {
    modal.classList.add('open');
  });

  cancelBtn.addEventListener('click', function() {
    modal.classList.remove('open');
    form.reset();
  });

  // Click outside the modal box to close
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.classList.remove('open');
      form.reset();
    }
  });

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    var name       = document.getElementById('guest-name').value.trim();
    var colClass   = document.getElementById('guest-column').value;

    if (!name) return;

    var card = createGuestCard(name);
    var targetCol = document.querySelector('.' + colClass);
    if (targetCol) {
      targetCol.appendChild(card);
      makeDraggable(card);
      attachStarToCard(card);
    }

    modal.classList.remove('open');
    form.reset();
    updateColumnCounts();
  });
}

function createGuestCard(name) {
  var card = document.createElement('div');
  card.className = 'guest-card';
  card.innerHTML =
    '<button class="star-btn">&#9734;</button>' +
    '<span class="guest-name">' + name + '</span>' +
    '<button class="arrow-btn">&#8250;</button>';
  return card;
}


// ============================================================
// ADD VENDOR MODAL
// ============================================================

// We cycle through the 12 vendor images for new vendors
var vendorImages = [
  'images/1.png','images/2.png','images/3.png','images/4.png',
  'images/5.png','images/6.png','images/7.png','images/8.png',
  'images/9.png','images/10.png','images/11.png','images/12.png'
];
var nextImageIndex = 0;

function setupVendorModal() {
  var addBtn    = document.getElementById('add-vendor-btn');
  var modal     = document.getElementById('vendor-modal');
  var cancelBtn = document.getElementById('vendor-cancel');
  var form      = document.getElementById('vendor-form');

  if (!addBtn) return; // not on the vendors page

  addBtn.addEventListener('click', function() {
    modal.classList.add('open');
  });

  cancelBtn.addEventListener('click', function() {
    modal.classList.remove('open');
    form.reset();
  });

  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.classList.remove('open');
      form.reset();
    }
  });

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    var name     = document.getElementById('vendor-name').value.trim();
    var role     = document.getElementById('vendor-role').value.trim();
    var phone    = document.getElementById('vendor-phone').value.trim();
    var email    = document.getElementById('vendor-email').value.trim();
    var price    = document.getElementById('vendor-price').value.trim();
    var location = document.getElementById('vendor-location').value.trim();
    var status   = document.getElementById('vendor-status').value;

    if (!name) return;

    var img = vendorImages[nextImageIndex % vendorImages.length];
    nextImageIndex++;

    var card = createVendorCard(name, role, phone, email, price, location, status, img);

    // New vendor always goes into the ALL column first
    var allCol = document.querySelector('.column-all');
    if (allCol) {
      allCol.appendChild(card);
      makeDraggable(card);
    }

    modal.classList.remove('open');
    form.reset();
    updateColumnCounts();
  });
}

function createVendorCard(name, role, phone, email, price, location, status, img) {
  var badgeClass = 'badge-' + status;
  var badgeText  = status.toUpperCase();

  var card = document.createElement('div');
  card.className = 'vendor-card';
  card.innerHTML =
    '<img src="' + img + '" alt="' + name + '" class="vendor-card-image">' +
    '<span class="vendor-status-badge ' + badgeClass + '">' + badgeText + '</span>' +
    '<div class="vendor-card-body">' +
      '<h4>' + name + '</h4>' +
      '<p class="vendor-role">' + role + '</p>' +
      (phone ? '<div class="vendor-contact-row">📞 ' + phone + '</div>' : '') +
      (email ? '<div class="vendor-contact-row">✉ ' + email + '</div>' : '') +
      '<div class="vendor-footer">' +
        '<span class="vendor-price">$' + (price || '0') + '</span>' +
        '<span class="vendor-location">📍 ' + (location || '—') + '</span>' +
      '</div>' +
    '</div>';
  return card;
}


// ============================================================
// CALENDAR / TIMELINE
// ============================================================

// Starting events — feel free to change these!
var calendarEvents = [
  { id: 1, title: 'Venue Booking Deadline',  date: '2026-04-15', time: '09:00', description: 'Final payment due for the venue reservation.' },
  { id: 2, title: 'Florist Consultation',    date: '2026-04-20', time: '14:00', description: 'Meet with Leilani to discuss floral arrangements.' },
  { id: 3, title: 'Wedding Ceremony',        date: '2026-07-12', time: '11:00', description: 'Main ceremony at the beach venue.' },
  { id: 4, title: 'Wedding Reception',       date: '2026-07-12', time: '18:00', description: 'Reception dinner and dancing.' },
  { id: 5, title: 'Morning After Shoot',     date: '2026-07-13', time: '08:00', description: 'Sunrise photo session with Tama.' },
];

var currentMonth = new Date().getMonth(); // 0 = January
var currentYear  = new Date().getFullYear();

function setupCalendar() {
  if (!document.getElementById('calendar-container')) return;

  renderCalendar();

  document.getElementById('prev-month').addEventListener('click', function() {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderCalendar();
  });

  document.getElementById('next-month').addEventListener('click', function() {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderCalendar();
  });

  // Add event modal
  var addBtn    = document.getElementById('add-event-btn');
  var modal     = document.getElementById('event-modal');
  var cancelBtn = document.getElementById('event-cancel');
  var form      = document.getElementById('event-form');

  addBtn.addEventListener('click', function() {
    modal.classList.add('open');
  });

  cancelBtn.addEventListener('click', function() {
    modal.classList.remove('open');
    form.reset();
  });

  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.classList.remove('open');
      form.reset();
    }
  });

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    var title       = document.getElementById('event-title').value.trim();
    var date        = document.getElementById('event-date').value;
    var time        = document.getElementById('event-time').value;
    var description = document.getElementById('event-description').value.trim();

    if (!title || !date) return;

    calendarEvents.push({
      id: Date.now(),
      title: title,
      date: date,
      time: time || '',
      description: description
    });

    // Sort by date+time
    calendarEvents.sort(function(a, b) {
      return (a.date + a.time).localeCompare(b.date + b.time);
    });

    // Jump to the month of the new event
    var eventDate = new Date(date + 'T00:00:00');
    currentMonth  = eventDate.getMonth();
    currentYear   = eventDate.getFullYear();

    renderCalendar();
    modal.classList.remove('open');
    form.reset();
  });
}

function renderCalendar() {
  var monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  document.getElementById('current-month').textContent =
    monthNames[currentMonth] + ' ' + currentYear;

  var timeline = document.getElementById('timeline');
  timeline.innerHTML = ''; // clear old events

  // Filter events for the current month and year
  var monthEvents = calendarEvents.filter(function(ev) {
    var d = new Date(ev.date + 'T00:00:00');
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  if (monthEvents.length === 0) {
    timeline.innerHTML =
      '<div class="no-events">' +
        '<span>📅</span>' +
        'No events this month.<br>Click <strong>+ Add Event</strong> to add one!' +
      '</div>';
    return;
  }

  monthEvents.forEach(function(ev) {
    var d      = new Date(ev.date + 'T00:00:00');
    var dayStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    var item = document.createElement('div');
    item.className = 'timeline-event';
    item.innerHTML =
      '<span class="event-date-label">' + dayStr + '</span>' +
      '<span class="event-dot"></span>' +
      '<div class="event-card">' +
        '<h4>' + ev.title + '</h4>' +
        (ev.description ? '<p>' + ev.description + '</p>' : '') +
        (ev.time ? '<span class="event-time">🕐 ' + ev.time + '</span>' : '') +
      '</div>';

    timeline.appendChild(item);
  });
}


// ============================================================
// INIT — runs when the page has fully loaded
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
  setActiveNav();
  setupDragAndDrop();
  setupStars();
  setupGuestModal();
  setupVendorModal();
  setupCalendar();
  updateColumnCounts();
});
