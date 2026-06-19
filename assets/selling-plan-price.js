/**
 * Custom element that toggles between regular variant price and selling plan price
 * when a subscription option is selected via the ReCharge widget.
 */
if (!customElements.get('selling-plan-price')) {
  customElements.define(
    'selling-plan-price',
    class SellingPlanPrice extends HTMLElement {
      constructor() {
        super();
        this.regularView = this.querySelector('[data-price-view="regular"]');
        this.subscriptionView = this.querySelector('[data-price-view="subscription"]');
        this.comparePriceEl = this.querySelector('[data-compare-price]');
        this.sellingPlanPriceEl = this.querySelector('[data-selling-plan-price-display]');
        this.sellingPlanInput = null;
        this.variantInput = null;
        this.observer = null;
        this.inputObserver = null;
        this.boundFormChangeHandler = this.handleFormChange.bind(this);
        this.boundVariantChangeHandler = this.handleVariantChange.bind(this);
      }

      connectedCallback() {
        this.init();
      }

      disconnectedCallback() {
        this.cleanup();
      }

      init() {
        // Re-query elements in case they weren't found in constructor
        if (!this.regularView) {
          this.regularView = this.querySelector('[data-price-view="regular"]');
        }
        if (!this.subscriptionView) {
          this.subscriptionView = this.querySelector('[data-price-view="subscription"]');
        }
        if (!this.comparePriceEl) {
          this.comparePriceEl = this.querySelector('[data-compare-price]');
        }
        if (!this.sellingPlanPriceEl) {
          this.sellingPlanPriceEl = this.querySelector('[data-selling-plan-price-display]');
        }

        // Find the product form in the section
        const sectionId = this.dataset.sectionId;
        const form = document.querySelector(`#product-form-${sectionId}`);

        if (form) {
          this.setupFormListener(form);
        } else {
          // Form might not be ready yet, wait for it
          this.waitForForm(sectionId);
        }

        // Also check after a short delay in case ReCharge initializes late
        setTimeout(() => {
          this.recheckSellingPlanState();
        }, 100);
      }

      recheckSellingPlanState() {
        const sectionId = this.dataset.sectionId;
        const form = document.querySelector(`#product-form-${sectionId}`);
        if (form) {
          const sellingPlanInput = form.querySelector('input[name="selling_plan"]');
          if (sellingPlanInput) {
            this.sellingPlanInput = sellingPlanInput;
            this.updatePriceDisplay(sellingPlanInput.value);
          }
        }
      }

      waitForForm(sectionId) {
        // Use MutationObserver to wait for the form to appear
        this.observer = new MutationObserver(() => {
          const form = document.querySelector(`#product-form-${sectionId}`);
          if (form) {
            this.observer.disconnect();
            this.observer = null;
            this.setupFormListener(form);
          }
        });

        this.observer.observe(document.body, {
          childList: true,
          subtree: true,
        });
      }

      setupFormListener(form) {
        this.form = form;
        
        // Listen for changes on the form (captures all input changes including selling_plan)
        form.addEventListener('change', this.boundFormChangeHandler);

        // Try to find the selling_plan input immediately
        this.sellingPlanInput = form.querySelector('input[name="selling_plan"]');
        this.variantInput = form.querySelector('input[name="id"]');

        if (this.sellingPlanInput) {
          this.setupSellingPlanInputObserver();
          // Check initial state
          this.updatePriceDisplay(this.sellingPlanInput.value);
        } else {
          // ReCharge might inject the input later, watch for it
          this.watchForSellingPlanInput(form);
        }

        // Watch for variant changes to update prices
        if (this.variantInput) {
          this.variantInput.addEventListener('change', this.boundVariantChangeHandler);
        }
      }

      watchForSellingPlanInput(form) {
        const formObserver = new MutationObserver(() => {
          const sellingPlanInput = form.querySelector('input[name="selling_plan"]');
          if (sellingPlanInput && sellingPlanInput !== this.sellingPlanInput) {
            this.sellingPlanInput = sellingPlanInput;
            this.setupSellingPlanInputObserver();
            this.updatePriceDisplay(sellingPlanInput.value);
          }
        });

        formObserver.observe(form, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['value'],
        });

        // Store observer for cleanup
        if (!this.observer) {
          this.observer = formObserver;
        }
      }

      setupSellingPlanInputObserver() {
        // Watch for value changes on the selling plan input (ReCharge changes this programmatically)
        if (this.inputObserver) {
          this.inputObserver.disconnect();
        }

        this.inputObserver = new MutationObserver(() => {
          this.updatePriceDisplay(this.sellingPlanInput.value);
        });

        this.inputObserver.observe(this.sellingPlanInput, {
          attributes: true,
          attributeFilter: ['value'],
        });
      }

      handleFormChange(event) {
        const target = event.target;

        // Check if this is a selling plan radio or the selling_plan hidden input
        if (
          target.name === 'selling_plan' ||
          target.classList.contains('rc-radio__input') ||
          target.closest('.rc-radio-group')
        ) {
          // Re-find the selling plan input in case it changed
          const form = target.closest('form');
          if (form) {
            this.sellingPlanInput = form.querySelector('input[name="selling_plan"]');
            if (this.sellingPlanInput) {
              // Small delay to let ReCharge update the hidden input value
              setTimeout(() => {
                this.updatePriceDisplay(this.sellingPlanInput.value);
              }, 50);
            }
          }
        }
      }

      handleVariantChange() {
        // When variant changes, we need to fetch updated selling plan allocation data
        // The variant selector will trigger a section re-render which will update our data attributes
        // For now, we'll just check if a selling plan is selected and maintain that state
        if (this.sellingPlanInput && this.sellingPlanInput.value) {
          this.updatePriceDisplay(this.sellingPlanInput.value);
        }
      }

      updatePriceDisplay(sellingPlanValue) {
        const hasSellingPlanSelected = sellingPlanValue && sellingPlanValue !== '' && sellingPlanValue !== '0';

        if (hasSellingPlanSelected && this.dataset.hasSellingPlan === 'true') {
          // Show subscription pricing
          this.showSubscriptionPrice();
        } else {
          // Show regular pricing
          this.showRegularPrice();
        }
      }

      showSubscriptionPrice() {
        if (this.regularView) {
          this.regularView.style.display = 'none';
        }
        if (this.subscriptionView) {
          this.subscriptionView.style.display = '';
        }
      }

      showRegularPrice() {
        if (this.regularView) {
          this.regularView.style.display = '';
        }
        if (this.subscriptionView) {
          this.subscriptionView.style.display = 'none';
        }
      }

      cleanup() {
        if (this.observer) {
          this.observer.disconnect();
          this.observer = null;
        }
        if (this.inputObserver) {
          this.inputObserver.disconnect();
          this.inputObserver = null;
        }
        if (this.form) {
          this.form.removeEventListener('change', this.boundFormChangeHandler);
        }
        if (this.variantInput) {
          this.variantInput.removeEventListener('change', this.boundVariantChangeHandler);
        }
      }
    }
  );
}
