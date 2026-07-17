(function () {
  const userName = Session.requireLogin();
  if (!userName) return;

  document.getElementById('whoName').textContent = userName;
  document.getElementById('logoutBtn').addEventListener('click', () => {
    Session.clear();
    window.location.href = 'index.html';
  });

  document.getElementById('entryDate').valueAsDate = new Date();

  const toast = document.getElementById('toast');
  function showToast(msg, isError) {
    toast.textContent = msg;
    toast.classList.toggle('error', !!isError);
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2600);
  }

  let groceries = []; // [{name, units:[...]}]
  let selectedMeal = null;
  let rowCount = 0;

  // ---- Meal picker ----
  const mealPicker = document.getElementById('mealPicker');
  mealPicker.addEventListener('click', (e) => {
    const chip = e.target.closest('.meal-chip');
    if (!chip) return;
    mealPicker.querySelectorAll('.meal-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    selectedMeal = chip.dataset.meal;
  });

  // ---- Ingredient rows ----
  const rowsWrap = document.getElementById('ingredientRows');

  function groceryOptionsHtml(selectedName) {
    return groceries.map(g =>
      `<option value="${escapeHtml(g.name)}" ${g.name === selectedName ? 'selected' : ''}>${escapeHtml(g.name)}</option>`
    ).join('');
  }

  function unitOptionsHtml(groceryName, selectedUnit) {
    const g = groceries.find(g => g.name === groceryName);
    const units = g ? g.units : [];
    return units.map(u =>
      `<option value="${escapeHtml(u)}" ${u === selectedUnit ? 'selected' : ''}>${escapeHtml(u)}</option>`
    ).join('');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function addRow() {
    if (!groceries.length) return;
    rowCount++;
    const id = 'row' + rowCount;
    const div = document.createElement('div');
    div.className = 'ingredient-row';
    div.id = id;
    const firstGrocery = groceries[0].name;
    div.innerHTML = `
      <select class="ing-grocery">${groceryOptionsHtml(firstGrocery)}</select>
      <input type="number" class="ing-qty" placeholder="0" min="0" step="any" inputmode="decimal">
      <select class="ing-unit">${unitOptionsHtml(firstGrocery)}</select>
      <button type="button" class="row-remove" aria-label="Отстрани">×</button>
    `;
    rowsWrap.appendChild(div);

    const grocerySelect = div.querySelector('.ing-grocery');
    const unitSelect = div.querySelector('.ing-unit');

    grocerySelect.addEventListener('change', () => {
      unitSelect.innerHTML = unitOptionsHtml(grocerySelect.value);
    });

    div.querySelector('.row-remove').addEventListener('click', () => {
      div.remove();
    });
  }

  document.getElementById('addIngredientBtn').addEventListener('click', addRow);

  // ---- Load groceries ----
  async function loadGroceries() {
    try {
      const res = await Api.getGroceries();
      if (res.ok) {
        groceries = res.groceries;
        addRow(); // start with one row
      } else {
        showToast('Не можат да се вчитаат намирниците', true);
      }
    } catch (err) {
      showToast('Нема врска со серверот', true);
    }
  }
  loadGroceries();

  // ---- Submit ----
  const submitBtn = document.getElementById('submitBtn');
  let submitting = false;

  submitBtn.addEventListener('click', async () => {
    if (submitting) return;

    if (!selectedMeal) {
      showToast('Избери оброк', true);
      return;
    }

    const rows = Array.from(rowsWrap.querySelectorAll('.ingredient-row'));
    const items = rows.map(r => ({
      grocery: r.querySelector('.ing-grocery').value,
      quantity: parseFloat(r.querySelector('.ing-qty').value) || 0,
      unit: r.querySelector('.ing-unit').value
    })).filter(it => it.quantity > 0);

    if (!items.length) {
      showToast('Внеси количина за барем една состојка', true);
      return;
    }

    const date = document.getElementById('entryDate').value;
    const description = document.getElementById('descInput').value.trim();
    const portionsUsers = parseInt(document.getElementById('portionsUsers').value, 10) || 0;
    const portionsEmployees = parseInt(document.getElementById('portionsEmployees').value, 10) || 0;

    submitting = true;
    submitBtn.textContent = 'Се зачувува...';

    try {
      const res = await Api.addEntry({
        date, mealType: selectedMeal, description, userName,
        portionsUsers, portionsEmployees, items
      });
      if (res.ok) {
        showToast('Ставката е зачувана ✓');
        resetForm();
      } else {
        showToast(res.error || 'Грешка при зачувување', true);
      }
    } catch (err) {
      showToast('Нема врска со серверот', true);
    } finally {
      submitting = false;
      submitBtn.textContent = 'Зачувај ставка';
    }
  });

  function resetForm() {
    mealPicker.querySelectorAll('.meal-chip').forEach(c => c.classList.remove('active'));
    selectedMeal = null;
    document.getElementById('descInput').value = '';
    document.getElementById('portionsUsers').value = 0;
    document.getElementById('portionsEmployees').value = 0;
    document.getElementById('entryDate').valueAsDate = new Date();
    rowsWrap.innerHTML = '';
    addRow();
  }
})();
