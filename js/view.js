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
      `<tr><td>${escapeHtml(it.grocery)}</td><td>${it.quantity}</td><td>${escapeHtml(it.unit)}</td></tr>`
    ).join('');
    const name = entry.description ? escapeHtml(entry.description) : escapeHtml(entry.mealType);
    return `
      <div class="entry-ticket">
        <div class="ticket-main">
          <div class="ticket-name">${name}</div>
          <div class="ticket-meta">${escapeHtml(entry.mealType)} &middot; ${formatDateMk(entry.date)}</div>
          <table class="ticket-table">
            <thead>
              <tr><th>Состојка</th><th>Количина</th><th>Единица</th></tr>
            </thead>
            <tbody>
              ${itemsHtml || `<tr><td colspan="3" class="ticket-empty-row">Нема состојки</td></tr>`}
            </tbody>
          </table>
        </div>
        <div class="ticket-stats">
          <div class="stat-block">
            <span class="stat-num">${entry.portionsUsers ?? 0}</span>
            <span class="stat-label">Корисници</span>
          </div>
          <div class="stat-block">
            <span class="stat-num">${entry.portionsEmployees ?? 0}</span>
            <span class="stat-label">Вработени</span>
          </div>
        </div>
        <div class="ticket-footer">Внел: ${escapeHtml(entry.userName || '—')}</div>
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
