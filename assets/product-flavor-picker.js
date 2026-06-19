class ProductFlavorPicker extends HTMLElement {
  constructor() {
    super();

    Array.from(this.querySelectorAll('.product-flavor')).forEach((link) => {
      link.addEventListener('click', (e) => {
        if (e.ctrlKey || e.metaKey) {
          // Don't intercept attempts to open flavor
          // in a new tab/window.
          return;
        }

        this.saveScrollPosition(link.pathname);

        const accentColor = e.currentTarget.dataset.accentColor;
        if (accentColor) {
          document.documentElement.style.setProperty('--color-accent', accentColor);
        }
      });
    });
  }

  saveScrollPosition(pathname) {
    localStorage.setItem('pdpScrollRestoration', `${Date.now()};${document.documentElement.scrollTop};${pathname}`);
  }
}

customElements.define('product-flavor-picker', ProductFlavorPicker);
