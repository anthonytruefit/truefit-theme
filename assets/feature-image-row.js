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
