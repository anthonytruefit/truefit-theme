customElements.define(
  'cart-swap-upsell-form',
  class CartSwapUpsellForm extends HTMLElement {
    constructor() {
      super();

      this.form = this.querySelector('form');
      this.form.querySelector('[name=id]').disabled = false;
      this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
      this.cart = document.querySelector('cart-drawer');
      this.submitButton = this.querySelector('[type="submit"]');

      if (!this.cart) {
        this.classList.add('hidden');
      } else {
        this.classList.remove('hidden');
        this.submitButton.disabled = false;
        this.submitButton.removeAttribute('aria-disabled');
      }
    }

    onSubmitHandler(evt) {
      evt.preventDefault();

      if (!this.cart) {
        return;
      }

      if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

      this.submitButton.setAttribute('aria-disabled', true);
      this.submitButton.disabled = true;
      this.submitButton.classList.add('loading');
      this.querySelector('.loading-overlay__spinner').classList.remove('hidden');

      const config = fetchConfig('javascript');
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
      delete config.headers['Content-Type'];

      const addFormData = new FormData(this.form);
      config.body = addFormData;

      const replaceQuantityUpdate = JSON.stringify({
        id: this.dataset.replaceVariant,
        quantity: parseInt(this.dataset.replaceVariantQuantity),
        sections_url: window.location.pathname,
        sections: this.cart.getSectionsToRender().map((section) => section.id),
      });

      fetch(`${routes.cart_add_url}`, config)
        .then((response) => response.json())
        .then((response) => {
          if (response.status) {
            // Failed to add bundle - likely sold out
            const soldOutMessage = this.submitButton.querySelector('.sold-out-message');
            if (!soldOutMessage) return;
            this.submitButton.setAttribute('aria-disabled', true);
            this.submitButton.disabled = true;
            this.submitButton.querySelectorAll('span').forEach((span) => span.classList.add('hidden'));
            soldOutMessage.classList.remove('hidden');
            this.error = true;
            return;
          }

          // Bundle was added successfully, so now we remove
          // the variant we're swapping it for + re-render the cart.
          this.cart.setActiveElement(document.activeElement);
          return fetch(`${routes.cart_change_url}`, {
            ...fetchConfig(),
            ...{ body: replaceQuantityUpdate },
          })
            .then((response) => response.json())
            .then((response) => {
              if (response.errors) {
                // Failed to change quantity on the original variant. It's
                // possible that this has now sold out. All we can do is
                // tell the cart to update itself.
                publish(PUB_SUB_EVENTS.cartUpdate, { source: 'product-form' });
              } else {
                publish(PUB_SUB_EVENTS.cartUpdate, {
                  source: this.cart.pubSubSource,
                });
                this.error = false;
                this.cart.renderContents(response);
                return;
              }
            });
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          this.submitButton.classList.remove('loading');
          if (this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
          if (!this.error) {
            this.submitButton.removeAttribute('aria-disabled');
            this.submitButton.disabled = false;
          }
          this.querySelector('.loading-overlay__spinner').classList.add('hidden');
        });
    }
  }
);
