(function () {
  const userName = Session.requireLogin();
  if (!userName) return;

  document.getElementById('whoName').textContent = userName;
  document.getElementById('logoutBtn').addEventListener('click', () => {
    Session.clear();
    window.location.href = 'index.html';
  });

  const listWrap = document.getElementById('listWrap');
  const fromDate = document.getElementById('fromDate');
  const toDate = document.getElementById('toDate');
  const mealFilter = document.getElementById('mealFilter');
  const filterBtn = document.getElementById('filterBtn');

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function formatDateMk(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}.${m}.${y}`;
  }

  function renderEntries(entries) {
    if (!entries.length) {
      listWrap.innerHTML = `
        <div class="empty-state">
          <div class="stamp-dot-lg"></div>
          <p>Нема пронајдени ставки за избраните филтри.</p>
        </div>`;
      return;
    }

    listWrap.innerHTML = `<div class="entries-list">${entries.map(entryTicketHtml).join('')}</div>`;
  }

  function entryTicketHtml(entry) {
    const itemsHtml = (entry.items || []).map(it =>
      `<span class="ticket-item-chip">${escapeHtml(it.grocery)} · ${it.quantity} ${escapeHtml(it.unit)}</span>`
    ).join('');

    return `
      <div class="entry-ticket">
        <div class="ticket-top">
          <span class="ticket-meal">${escapeHtml(entry.mealType)}</span>
          <span class="ticket-date mono">${formatDateMk(entry.date)}</span>
        </div>
        ${entry.description ? `<div class="ticket-desc">${escapeHtml(entry.description)}</div>` : ''}
        <div class="ticket-items">${itemsHtml}</div>
        <div class="ticket-bottom">
          <span>Внел: ${escapeHtml(entry.userName || '—')}</span>
          <span class="ticket-portions">
            <span>К: ${entry.portionsUsers ?? 0}</span>
            <span>В: ${entry.portionsEmployees ?? 0}</span>
          </span>
        </div>
      </div>
    `;
  }

  async function loadEntries() {
    listWrap.innerHTML = '<div class="spinner"></div>';
    try {
      const res = await Api.getEntries({
        dateFrom: fromDate.value || '',
        dateTo: toDate.value || '',
        mealType: mealFilter.value || ''
      });
      if (res.ok) {
        renderEntries(res.entries);
      } else {
        listWrap.innerHTML = `<div class="empty-state"><p>Грешка: ${escapeHtml(res.error || '')}</p></div>`;
      }
    } catch (err) {
      listWrap.innerHTML = `<div class="empty-state"><p>Нема врска со серверот.</p></div>`;
    }
  }

  filterBtn.addEventListener('click', loadEntries);
  loadEntries();
})();
