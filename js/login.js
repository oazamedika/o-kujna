(function () {
  const MAX_PIN_LEN = 4;
  let pin = '';
  let busy = false;

  const dotsWrap = document.getElementById('pinDisplay');
  const errorEl = document.getElementById('pinError');
  const pad = document.getElementById('pinPad');
  const toast = document.getElementById('toast');

  // Ако веќе е најавен, оди директно на внес
  if (Session.get()) {
    window.location.href = 'entry.html';
  }

  function renderDots() {
    const dots = dotsWrap.querySelectorAll('.pin-dot');
    dots.forEach((d, i) => d.classList.toggle('filled', i < pin.length));
  }

  function showToast(msg, isError) {
    toast.textContent = msg;
    toast.classList.toggle('error', !!isError);
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2600);
  }

  async function trySubmit() {
    if (busy) return;
    busy = true;
    errorEl.textContent = '';
    try {
      const res = await Api.login(pin);
      if (res.ok) {
        Session.set(res.userName);
        window.location.href = 'entry.html';
      } else {
        errorEl.textContent = res.error || 'Погрешен ПИН';
        pin = '';
        renderDots();
      }
    } catch (err) {
      errorEl.textContent = 'Нема врска со серверот. Провери интернет.';
    } finally {
      busy = false;
    }
  }

  pad.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    errorEl.textContent = '';

    if (btn.dataset.action === 'clear') {
      pin = '';
      renderDots();
      return;
    }
    if (btn.dataset.action === 'back') {
      pin = pin.slice(0, -1);
      renderDots();
      return;
    }
    if (btn.dataset.key !== undefined && pin.length < MAX_PIN_LEN) {
      pin += btn.dataset.key;
      renderDots();
      if (pin.length === MAX_PIN_LEN) {
        setTimeout(trySubmit, 120);
      }
    }
  });
})();
