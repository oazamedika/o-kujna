(function () {
  const userName = Session.requireLogin();
  if (!userName) return;

  document.getElementById('whoName').textContent = userName;
  document.getElementById('logoutBtn').addEventListener('click', () => {
    Session.clear();
    window.location.href = 'index.html';
  });

  // ---- Force landscape ----
  function lockLandscape() {
    try {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {});
      }
    } catch (e) { /* not supported, rotate-overlay CSS handles the fallback */ }
  }
  lockLandscape();
  document.addEventListener('click', lockLandscape, { once: true }); // some browsers only allow lock after a user gesture

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

  const employeesBox = document.getElementById('employeesBox');
  const employeesInput = document.getElementById('portionsEmployees');

  function isSnack(meal) {
    return !!meal && meal.includes('Ужина');
  }

  function applyMealSideEffects(meal) {
    if (isSnack(meal)) {
      employeesBox.classList.add('disabled');
      employeesInput.value = 0;
      employeesInput.disabled = true;
    } else {
      employeesBox.classList.remove('disabled');
      employeesInput.disabled = false;
    }
  }

  // ---- Screen navigation (Step 1: pick meal -> Step 2: entry form) ----
  const topbarFull = document.getElementById('topbarFull');
  const topbarEntry = document.getElementById('topbarEntry');
  const screenMeal = document.getElementById('screenMeal');
  const screenEntry = document.getElementById('screenEntry');
  const mealNameDisplay = document.getElementById('mealNameDisplay');
  const backBtn = document.getElementById('backBtn');
  const mealPicker = document.getElementById('mealPicker');

  function goToMealScreen() {
    selectedMeal = null;
    screenEntry.hidden = true;
    screenMeal.hidden = false;
    topbarEntry.hidden = true;
    topbarFull.hidden = false;
    mealPicker.querySelectorAll('.meal-chip-lg').forEach(c => c.classList.remove('active'));
  }

  function goToEntryScreen(meal) {
    selectedMeal = meal;
    mealNameDisplay.textContent = meal;
    screenMeal.hidden = true;
    screenEntry.hidden = false;
    topbarFull.hidden = true;
    topbarEntry.hidden = false;
    applyMealSideEffects(meal);
  }

  mealPicker.addEventListener('click', (e) => {
    const chip = e.target.closest('.meal-chip-lg');
    if (!chip) return;
    goToEntryScreen(chip.dataset.meal);
  });

  backBtn.addEventListener('click', goToMealScreen);

  // ---- Portion steppers ----
  document.querySelectorAll('.step-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (input.disabled) return;
      const delta = parseInt(btn.dataset.delta, 10);
      const current = parseInt(input.value, 10) || 0;
      const next = Math.max(0, current + delta);
      input.value = next;
      input.closest('.field, .portion-box')?.classList.remove('invalid');
    });
  });

  // ---- Ingredient rows ----
  const rowsWrap = document.getElementById('ingredientRows');

  const TAP_TO_SELECT = 'Допри за да обереш состојка';

  function groceryOptionsHtml() {
    const placeholder = `<option value="" disabled selected>${TAP_TO_SELECT}</option>`;
    return placeholder + groceries.map(g =>
      `<option value="${escapeHtml(g.name)}">${escapeHtml(g.name)}</option>`
    ).join('');
  }

  // Unit select auto-selects the first available unit once a grocery is chosen,
  // so the user only has to tap it if they want a different one.
  function unitOptionsHtml(groceryName) {
    if (!groceryName) {
      return `<option value="" disabled selected></option>`;
    }
    const g = groceries.find(g => g.name === groceryName);
    const units = g ? g.units : [];
    if (!units.length) {
      return `<option value="" disabled selected></option>`;
    }
    return units.map((u, i) =>
      `<option value="${escapeHtml(u)}"${i === 0 ? ' selected' : ''}>${escapeHtml(u)}</option>`
    ).join('');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function refreshPlaceholderStyle(select) {
    select.classList.toggle('placeholder-selected', !select.value);
  }

  function addRow() {
    if (!groceries.length) return;
    rowCount++;
    const id = 'row' + rowCount;
    const div = document.createElement('div');
    div.className = 'ingredient-row';
    div.id = id;
    div.innerHTML = `
      <select class="ing-grocery placeholder-selected">${groceryOptionsHtml()}</select>
      <input type="number" class="ing-qty" placeholder="0" min="0" step="any" inputmode="decimal">
      <select class="ing-unit" disabled>${unitOptionsHtml('')}</select>
      <button type="button" class="row-remove" aria-label="Отстрани">×</button>
    `;
    rowsWrap.appendChild(div);

    const grocerySelect = div.querySelector('.ing-grocery');
    const unitSelect = div.querySelector('.ing-unit');

    grocerySelect.addEventListener('change', () => {
      refreshPlaceholderStyle(grocerySelect);
      unitSelect.disabled = !grocerySelect.value;
      unitSelect.innerHTML = unitOptionsHtml(grocerySelect.value);
      refreshPlaceholderStyle(unitSelect);
      div.classList.remove('invalid');
    });

    unitSelect.addEventListener('change', () => {
      refreshPlaceholderStyle(unitSelect);
      div.classList.remove('invalid');
    });

    div.querySelector('.ing-qty').addEventListener('input', () => {
      div.classList.remove('invalid');
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

  const descField = document.getElementById('descInput');
  const usersBox = document.getElementById('portionsUsers').closest('.portion-box');

  function clearAllInvalid() {
    rowsWrap.querySelectorAll('.ingredient-row').forEach(r => r.classList.remove('invalid'));
    descField.classList.remove('invalid');
    usersBox.classList.remove('invalid');
    employeesBox.classList.remove('invalid');
  }

  function validateForm() {
    clearAllInvalid();
    let firstInvalid = null;
    let ok = true;

    if (!selectedMeal) {
      ok = false;
    }

    const date = document.getElementById('entryDate').value;

    const description = descField.value.trim();
    if (!description) {
      descField.classList.add('invalid');
      ok = false;
      firstInvalid = firstInvalid || descField;
    }

    const rows = Array.from(rowsWrap.querySelectorAll('.ingredient-row'));
    if (!rows.length) {
      ok = false;
    }
    const items = [];
    rows.forEach(r => {
      const grocery = r.querySelector('.ing-grocery').value;
      const unit = r.querySelector('.ing-unit').value;
      const qty = parseFloat(r.querySelector('.ing-qty').value);
      const rowValid = grocery && unit && qty > 0;
      if (!rowValid) {
        r.classList.add('invalid');
        ok = false;
        firstInvalid = firstInvalid || r;
      } else {
        items.push({ grocery, quantity: qty, unit });
      }
    });

    const usersVal = document.getElementById('portionsUsers').value;
    if (usersVal === '' || usersVal === null) {
      usersBox.classList.add('invalid');
      ok = false;
      firstInvalid = firstInvalid || usersBox;
    }

    if (!employeesInput.disabled) {
      const empVal = employeesInput.value;
      if (empVal === '' || empVal === null) {
        employeesBox.classList.add('invalid');
        ok = false;
        firstInvalid = firstInvalid || employeesBox;
      }
    }

    return {
      ok, firstInvalid,
      date, description,
      portionsUsers: parseInt(usersVal, 10) || 0,
      portionsEmployees: employeesInput.disabled ? 0 : (parseInt(employeesInput.value, 10) || 0),
      items
    };
  }

  submitBtn.addEventListener('click', async () => {
    if (submitting) return;

    const v = validateForm();
    if (!v.ok) {
      showToast('Пополни ги сите задолжителни полиња', true);
      v.firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    submitting = true;
    submitBtn.textContent = 'Се зачувува...';

    try {
      const res = await Api.addEntry({
        date: v.date, mealType: selectedMeal, description: v.description, userName,
        portionsUsers: v.portionsUsers, portionsEmployees: v.portionsEmployees, items: v.items
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
    descField.value = '';
    document.getElementById('portionsUsers').value = 0;
    employeesInput.disabled = false;
    employeesInput.value = 0;
    employeesBox.classList.remove('disabled');
    document.getElementById('entryDate').valueAsDate = new Date();
    rowsWrap.innerHTML = '';
    addRow();
    clearAllInvalid();
    goToMealScreen();
  }
})();
