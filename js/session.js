// Сесијата се чува во sessionStorage - се бришe кога ќе се затвори табот/апката.
const Session = {
  set(userName) {
    sessionStorage.setItem('kitchenLogUser', userName);
  },
  get() {
    return sessionStorage.getItem('kitchenLogUser');
  },
  clear() {
    sessionStorage.removeItem('kitchenLogUser');
  },
  requireLogin() {
    const u = this.get();
    if (!u) {
      window.location.href = 'index.html';
      return null;
    }
    return u;
  }
};
