document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const profileBadge = document.querySelector('.profile-badge[data-user-name]');
  if (profileBadge) {
    const fullName = profileBadge.dataset.userName.trim();
    const nameParts = fullName.split(/\s+/);
    if (nameParts.length < 2) {
      throw new Error('The profile name must include a first and last name.');
    }

    const profileName = profileBadge.querySelector('.profile-name');
    const profileAvatar = profileBadge.querySelector('.profile-avatar');
    const greetingName = document.getElementById('greeting-name');
    const sidebarContext = document.querySelector('.sidebar-context');

    if (profileName) {
      profileName.textContent = fullName;
    }
    if (profileAvatar) {
      profileAvatar.textContent = `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`;
    }
    if (greetingName) {
      greetingName.textContent = nameParts.slice(0, 2).join(' ');
    }
    if (sidebarContext) {
      sidebarContext.textContent = `${fullName} · ${sidebarContext.textContent.trim()}`;
    }
  }

  /* ---------- Sidebar (collapsible on desktop, off-canvas drawer on mobile) ---------- */
  const menuToggle = document.querySelector('.menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.querySelector('.overlay');
  const mq = window.matchMedia('(min-width: 1024px)');
  const STORAGE_KEY = 'sidebarOpen';
  let isOpen = false;
  let closeMobileDrawer = () => {};

  function readDesktopState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === null ? true : saved === 'true';
    } catch (error) {
      console.warn('Unable to read the saved sidebar state.', error);
      return true;
    }
  }

  function saveDesktopState(open) {
    try {
      localStorage.setItem(STORAGE_KEY, String(open));
    } catch (error) {
      console.warn('Unable to save the sidebar state.', error);
    }
  }

  if (menuToggle && sidebar && overlay) {
    function setOpen(open, returnFocus = false) {
      isOpen = open;

      if (mq.matches) {
        sidebar.classList.remove('sidebar--open');
        overlay.classList.remove('overlay--open');
        overlay.hidden = true;
        document.body.classList.remove('no-scroll');
        document.body.classList.toggle('sidebar-collapsed', !open);
        saveDesktopState(open);
      } else if (open) {
        sidebar.classList.add('sidebar--open');
        overlay.classList.add('overlay--open');
        overlay.hidden = false;
        document.body.classList.add('no-scroll');

        const firstLink = sidebar.querySelector('.sidebar-link');
        if (firstLink) {
          firstLink.focus();
        }
      } else {
        sidebar.classList.remove('sidebar--open');
        overlay.classList.remove('overlay--open');
        overlay.hidden = true;
        document.body.classList.remove('no-scroll');
        if (returnFocus) {
          menuToggle.focus();
        }
      }

      menuToggle.setAttribute('aria-expanded', String(open));
      sidebar.setAttribute('aria-hidden', String(!open));
    }

    function resetForBreakpoint() {
      sidebar.classList.remove('sidebar--open');
      overlay.classList.remove('overlay--open');
      overlay.hidden = true;
      document.body.classList.remove('no-scroll');

      if (mq.matches) {
        isOpen = readDesktopState();
        document.body.classList.toggle('sidebar-collapsed', !isOpen);
      } else {
        isOpen = false;
        document.body.classList.remove('sidebar-collapsed');
      }

      menuToggle.setAttribute('aria-expanded', String(isOpen));
      sidebar.setAttribute('aria-hidden', String(!isOpen));
    }

    menuToggle.addEventListener('click', () => {
      setOpen(!isOpen, true);
    });

    overlay.addEventListener('click', () => {
      if (!mq.matches && isOpen) {
        setOpen(false, true);
      }
    });

    closeMobileDrawer = () => {
      if (!mq.matches && isOpen) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', (event) => {
      if (!isOpen || mq.matches) {
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false, true);
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusableEls = Array.from(
        sidebar.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
      ).filter((element) => element.getClientRects().length > 0);
      if (focusableEls.length === 0) {
        return;
      }

      const first = focusableEls[0];
      const last = focusableEls[focusableEls.length - 1];
      const focusIsInside = sidebar.contains(document.activeElement);
      if (event.shiftKey && (!focusIsInside || document.activeElement === first)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (!focusIsInside || document.activeElement === last)) {
        event.preventDefault();
        first.focus();
      }
    });

    mq.addEventListener('change', resetForBreakpoint);
    resetForBreakpoint();
  }

  /* ---------- Element references (form) ---------- */
  const requestForm = document.getElementById('request-form');
  const saveDraftBtn = document.getElementById('save-draft');
  const serviceCategory = document.getElementById('service-category');
  const requestDetails = document.getElementById('request-details');
  const pickupDate = document.getElementById('pickup-date');

  const charCounter = document.getElementById('char-counter');
  const formStatus = document.getElementById('form-status');
  const pendingValueEl = document.getElementById('metric-pending-value');
  const requestsTableBody = document.getElementById('requests-table-body');
  const dashboardRequestsTableBody = document.getElementById('dashboard-requests-table-body');
  const requestFilters = document.querySelector('.request-filters');

  const MAX_CHARS = 300;
  const MIN_DETAILS = 20;
  const REQUESTS_STORAGE_KEY = 'dsscRequests';
  const allowedStatuses = new Set(['pending', 'approved', 'rejected', 'for-pickup']);
  const defaultRequests = [
    { id: 'REQ-2026-0142', serviceType: 'Document Requisition', date: '2026-10-20', status: 'pending' },
    { id: 'REQ-2026-0138', serviceType: 'Subject Overload Permit', date: '2026-10-18', status: 'approved' },
    { id: 'REQ-2026-0131', serviceType: 'Certificate of Enrollment', date: '2026-10-15', status: 'rejected' },
    { id: 'REQ-2026-0124', serviceType: 'Good Moral Certificate', date: '2026-10-12', status: 'for-pickup' },
    { id: 'REQ-2026-0117', serviceType: 'Clearance Application', date: '2026-10-09', status: 'pending' }
  ];

  function isRequestRecord(value) {
    return value !== null
      && typeof value === 'object'
      && typeof value.id === 'string'
      && typeof value.serviceType === 'string'
      && typeof value.date === 'string'
      && /^\d{4}-\d{2}-\d{2}$/.test(value.date)
      && allowedStatuses.has(value.status);
  }

  function loadRequests() {
    try {
      const saved = localStorage.getItem(REQUESTS_STORAGE_KEY);
      if (saved === null) {
        return defaultRequests.slice();
      }

      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || !parsed.every(isRequestRecord)) {
        throw new TypeError('Saved requests have an invalid format.');
      }
      return parsed;
    } catch (error) {
      console.warn('Unable to load saved requests. Using the default request list.', error);
      return defaultRequests.slice();
    }
  }

  let requests = loadRequests();
  let activeRequestFilter = 'all';

  function createRequestRow(request) {
    const row = document.createElement('tr');
    const idCell = document.createElement('td');
    const serviceCell = document.createElement('td');
    const dateCell = document.createElement('td');
    const statusCell = document.createElement('td');
    const time = document.createElement('time');
    const badge = document.createElement('span');
    const dot = document.createElement('span');
    const statusText = document.createElement('span');
    const readableDate = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC'
    }).format(new Date(`${request.date}T00:00:00Z`));
    const readableStatus = request.status === 'for-pickup'
      ? 'For Pickup'
      : request.status.charAt(0).toUpperCase() + request.status.slice(1);

    idCell.dataset.label = 'Request ID';
    idCell.textContent = request.id;
    serviceCell.dataset.label = 'Service Type';
    serviceCell.textContent = request.serviceType;
    dateCell.dataset.label = 'Date Filed';
    time.dateTime = request.date;
    time.textContent = readableDate;
    dateCell.append(time);
    statusCell.dataset.label = 'Status';
    badge.className = `status-badge status-badge--${request.status}`;
    dot.className = 'status-dot';
    dot.setAttribute('aria-hidden', 'true');
    statusText.className = 'status-text';
    statusText.textContent = readableStatus;
    badge.append(dot, statusText);
    statusCell.append(badge);
    row.append(idCell, serviceCell, dateCell, statusCell);
    return row;
  }

  function renderTable() {
    const filteredRequests = activeRequestFilter === 'all'
      ? requests
      : requests.filter((request) => request.status === activeRequestFilter);

    if (requestsTableBody) {
      requestsTableBody.replaceChildren(...filteredRequests.map(createRequestRow));
    }
    if (dashboardRequestsTableBody) {
      dashboardRequestsTableBody.replaceChildren(...requests.slice(0, 5).map(createRequestRow));
    }
  }

  function renderMetrics() {
    if (pendingValueEl) {
      pendingValueEl.textContent = String(
        requests.filter((request) => request.status === 'pending').length
      );
    }
  }

  function saveRequests() {
    try {
      localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(requests));
    } catch (error) {
      console.warn('Unable to save requests. Changes remain available for this session.', error);
    }
  }

  if (requestFilters) {
    requestFilters.addEventListener('click', (event) => {
      const filterButton = event.target.closest('button[data-status]');
      if (!filterButton || !requestFilters.contains(filterButton)) {
        return;
      }

      activeRequestFilter = filterButton.dataset.status;
      requestFilters.querySelectorAll('button[data-status]').forEach((button) => {
        const isActive = button === filterButton;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
      });
      renderTable();
    });
  }

  renderMetrics();
  renderTable();

  /* ---------- Field error helpers ---------- */
  function getErrorEl(field) {
    const errorId = field
      .getAttribute('aria-describedby')
      .split(' ')
      .find((id) => id.endsWith('-error'));
    return document.getElementById(errorId);
  }

  function showError(field, message) {
    const errorEl = getErrorEl(field);
    field.classList.add('is-invalid');
    field.setAttribute('aria-invalid', 'true');
    if (errorEl) {
      errorEl.textContent = message;
    }
  }

  function clearFieldError(field) {
    const errorEl = getErrorEl(field);
    field.classList.remove('is-invalid');
    field.removeAttribute('aria-invalid');
    if (errorEl) {
      errorEl.textContent = '';
    }
  }

  // Clear errors live while the user types / changes a field
  [serviceCategory, requestDetails, pickupDate].forEach((field) => {
    field.addEventListener('input', () => clearFieldError(field));
    field.addEventListener('change', () => clearFieldError(field));
  });

  /* ---------- Live character counter ---------- */
  function updateCounter() {
    const length = requestDetails.value.length;
    charCounter.textContent = `${length} / ${MAX_CHARS}`;
    charCounter.classList.toggle('char-counter--warning', length >= MAX_CHARS * 0.8);
    // "Save Draft" enabled only when the textarea has text
    saveDraftBtn.disabled = length === 0;
  }
  requestDetails.addEventListener('input', updateCounter);

  // Initial state
  saveDraftBtn.disabled = requestDetails.value.length === 0;
  charCounter.textContent = `0 / ${MAX_CHARS}`;

  /* ---------- Form validation ---------- */
  function validateForm() {
    let firstInvalid = null;

    // Field 1: Service category must be selected
    if (!serviceCategory.value) {
      showError(serviceCategory, 'Please choose a service category.');
      if (!firstInvalid) {
        firstInvalid = serviceCategory;
      }
    }

    // Field 2: Details must be at least 20 characters
    if (requestDetails.value.trim().length < MIN_DETAILS) {
      showError(
        requestDetails,
        'Please enter at least 20 characters describing your request.'
      );
      if (!firstInvalid) {
        firstInvalid = requestDetails;
      }
    }

    return { valid: firstInvalid === null, firstInvalid };
  }

  /* ---------- Form submit ---------- */
  requestForm.addEventListener('submit', (event) => {
    event.preventDefault();

    // Reset feedback area
    formStatus.textContent = '';
    formStatus.className = 'form-status';
    formStatus.classList.remove('form-status--success');

    const result = validateForm();
    if (!result.valid) {
      // Move focus to the first invalid field
      result.firstInvalid.focus();
      return;
    }

    // --- Valid submission ---

    // Generate a reference number: REQ-2026-XXXX
    const refNumber = `REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    // Show success message in the aria-live region
    formStatus.textContent = `Request submitted! Your reference number is ${refNumber}.`;
    formStatus.classList.add('form-status--success');

    const today = new Date().toISOString().slice(0, 10);
    const selectedOption = serviceCategory.options[serviceCategory.selectedIndex];
    requests.unshift({
      id: refNumber,
      serviceType: selectedOption.text,
      date: today,
      status: 'pending'
    });
    saveRequests();
    renderMetrics();
    renderTable();

    // Reset form and derived UI state
    requestForm.reset();
    updateCounter(); // sets counter to 0 / 300 and disables Save Draft
    clearFieldError(serviceCategory);
    clearFieldError(requestDetails);
    clearFieldError(pickupDate);
  });

  /* ---------- SPA page router ---------- */
  const content = document.querySelector('.content');
  const pageNav = sidebar ? sidebar.querySelector('nav') : null;
  const pages = Array.from(document.querySelectorAll('main .page[data-page]'));
  const topbarTitle = document.querySelector('.site-header .page-title .site-title');
  const validPageNames = new Set(pages.map((page) => page.dataset.page));

  function showPage(name) {
    if (!validPageNames.has(name)) {
      return false;
    }

    let activePage;
    pages.forEach((page) => {
      const isActive = page.dataset.page === name;
      page.hidden = !isActive;
      page.classList.toggle('active', isActive);
      if (isActive) {
        activePage = page;
      }
    });

    if (pageNav) {
      pageNav.querySelectorAll('.sidebar-link[data-page]').forEach((link) => {
        const isActive = link.dataset.page === name;
        link.classList.toggle('active', isActive);
        if (isActive) {
          link.setAttribute('aria-current', 'page');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    }

    const heading = activePage.querySelector('h1');
    if (topbarTitle && heading) {
      topbarTitle.textContent = heading.textContent;
    }
    document.title = `${heading.textContent} | DSSC Academic Services Portal`;

    if (content) {
      content.scrollTo({ top: 0, behavior: 'auto' });
      content.scrollTop = 0;
    }
    if (heading) {
      heading.focus();
    }

    closeMobileDrawer();
    if (typeof renderMetrics === 'function') {
      renderMetrics();
    }
    if (typeof renderTable === 'function') {
      renderTable();
    }
    return true;
  }

  function syncPageFromLocation() {
    const requestedPage = window.location.hash.slice(1);
    const pageName = validPageNames.has(requestedPage) ? requestedPage : 'dashboard';
    if (requestedPage !== pageName) {
      window.history.replaceState(null, '', `#${pageName}`);
    }
    showPage(pageName);
  }

  if (pageNav) {
    pageNav.addEventListener('click', (event) => {
      const link = event.target.closest('.sidebar-link[data-page]');
      if (!link || !pageNav.contains(link) || !validPageNames.has(link.dataset.page)) {
        return;
      }

      event.preventDefault();
      const pageName = link.dataset.page;
      if (window.location.hash !== `#${pageName}`) {
        window.history.pushState(null, '', `#${pageName}`);
      }
      showPage(pageName);
    });
  }

  window.addEventListener('popstate', syncPageFromLocation);
  window.addEventListener('hashchange', syncPageFromLocation);
  syncPageFromLocation();
});