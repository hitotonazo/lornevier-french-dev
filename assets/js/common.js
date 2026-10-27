(() => {
  'use strict';

  const menuButton = document.querySelector('[data-menu-toggle]');
  const navigation = document.querySelector('[data-global-nav]');
  const resetButtons = document.querySelectorAll('[data-reset-open]');
  const resetDialog = document.querySelector('[data-reset-dialog]');
  const resetCancel = resetDialog?.querySelector('[data-reset-cancel]');
  const resetConfirm = resetDialog?.querySelector('[data-reset-confirm]');
  const mobileQuery = window.matchMedia('(max-width: 1360px)');

  const closeMenu = ({ restoreFocus = false } = {}) => {
    if (!menuButton || !navigation) return;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'メニューを開く');
    navigation.classList.remove('is-open');
    document.documentElement.classList.remove('is-menu-open');
    if (restoreFocus) menuButton.focus();
  };

  const openMenu = () => {
    if (!menuButton || !navigation) return;
    menuButton.setAttribute('aria-expanded', 'true');
    menuButton.setAttribute('aria-label', 'メニューを閉じる');
    navigation.classList.add('is-open');
    document.documentElement.classList.add('is-menu-open');
    navigation.querySelector('a')?.focus();
  };

  menuButton?.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    isOpen ? closeMenu() : openMenu();
  });

  navigation?.addEventListener('click', (event) => {
    if (event.target.closest('a') && mobileQuery.matches) closeMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
      closeMenu({ restoreFocus: true });
    }

    if (event.key === 'Tab' && menuButton?.getAttribute('aria-expanded') === 'true') {
      const focusable = [
        ...resetButtons,
        menuButton,
        ...navigation.querySelectorAll('a[href]')
      ].filter((element) => !element.disabled);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  mobileQuery.addEventListener('change', (event) => {
    if (!event.matches) closeMenu();
  });

  resetButtons.forEach((button) => button.addEventListener('click', () => {
    closeMenu();
    resetDialog?.showModal();
  }));

  resetCancel?.addEventListener('click', () => resetDialog.close());

  resetConfirm?.addEventListener('click', () => {
    resetDialog.close('confirm');
    document.dispatchEvent(new CustomEvent('lornevier:reset-requested'));
  });

  resetDialog?.addEventListener('click', (event) => {
    if (event.target === resetDialog) resetDialog.close();
  });
})();
