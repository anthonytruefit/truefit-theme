if (!customElements.get('feature-image-row')) {
  class FeatureImageRow extends HTMLElement {
    constructor() {
      super();

      this.heading = this.querySelector('.js-heading');

      const resizeObserver = new ResizeObserver((entries) => this.initPointer(entries));
      resizeObserver.observe(this.heading);

      const handleIntersection = (entries, observer) => {
        if (entries[0].isIntersecting) {
          this.heading.classList.add('heading--in-view');
        } else {
          this.heading.classList.remove('heading--in-view');
        }
      };

      new IntersectionObserver(handleIntersection.bind(this), {
        rootMargin: '-50px 0px 0px 0px',
        thresholds: 0,
      }).observe(this.heading);

      this.setupReveal();
    }

    // Subtle entrance: each row fades in and gently rises when it scrolls into
    // view. Skipped entirely under prefers-reduced-motion so content shows
    // normally (the hidden start state is JS-gated, so no-JS is safe too).
    setupReveal() {
      const reduceMotion =
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduceMotion || !('IntersectionObserver' in window)) return;

      this.classList.add('image-row--reveal');

      const observer = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            // Reveal on entry, or immediately if it's already scrolled past
            // (e.g. a reload mid-page) so nothing stays stuck hidden.
            if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
              entry.target.classList.add('is-revealed');
              obs.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '0px 0px -12% 0px', threshold: 0.15 }
      );
      observer.observe(this);
    }

    initPointer(entries) {
      const headingWidth = this.heading.offsetWidth;
      const headingInnerWidth = Math.max(
        this.heading.querySelector('.js-heading-inner').offsetWidth,
        headingWidth - 50
      );

      this.heading.style.setProperty('--pointer-offset-x', headingInnerWidth + 'px');
    }
  }

  customElements.define('feature-image-row', FeatureImageRow);
}
