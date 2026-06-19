if (!customElements.get('floating-buy-button')) {
  customElements.define(
    'floating-buy-button',
    class FloatingBuyButton extends HTMLElement {
      constructor() {
        super();

        this.form = this.closest('form');
        this.button = this.firstElementChild;
        this.submitButton = this.form.querySelector('[type="submit"]');
        if (document.querySelector('cart-drawer')) this.setAttribute('aria-haspopup', 'dialog');

        this.addEventListener('click', this.onClickHandler.bind(this));
        const submitObserver = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            this.button.innerHTML = this.submitButton.innerHTML;
            if (mutation.attributeName == 'class' || mutation.attributeName === 'disabled') {
              this.button.className = this.submitButton.className;
              if (this.submitButton.disabled) {
                this.button.classList.add('disabled');
              } else {
                this.button.classList.remove('disabled');
              }
              this.button.setAttribute('aria-disabled', this.submitButton.disabled || false);
            }
          });
        });
        submitObserver.observe(this.submitButton, {
          attributes: true,
          subtree: true,
        });

        const intersectionObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                this.hide();
              } else if (this.submitButton.getBoundingClientRect().bottom < 0) {
                this.reveal();
              }
            });
          },
          {
            rootMargin: '0px',
            threshold: 0,
          }
        );
        intersectionObserver.observe(this.submitButton);
      }

      reveal() {
        this.classList.add('visible');
        document.documentElement.style.setProperty('--floating-cta-height', this.getBoundingClientRect().height + 'px');
      }

      hide() {
        this.classList.remove('visible');
        document.documentElement.style.setProperty('--floating-cta-height', '0px');
      }

      onClickHandler(evt) {
        this.submitButton.click();
      }
    }
  );
}
