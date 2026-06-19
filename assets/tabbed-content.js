if (!customElements.get('tabbed-content')) {
  class TabbedContent extends HTMLElement {
    constructor() {
      super();
    }
    connectedCallback() {
      this.addEventListener('keydown', this._handleKeyDown);
      this.addEventListener('click', this._handleClick);
    }
    disconnectedCallback() {
      this.removeEventListener('keydown', this._handleKeyDown);
      this.removeEventListener('click', this._handleClick);
    }
    _handleKeyDown(event) {
      const KEYCODE = {
        DOWN: 40,
        LEFT: 37,
        RIGHT: 39,
        UP: 38,
        HOME: 36,
        END: 35,
      };
      // If the keypress did not originate from a tab element itself,
      // it was a keypress inside the a panel or on empty space. Nothing to do.
      if (event.target.getAttribute('role') !== 'tab') return;
      // Don’t handle modifier shortcuts typically used by assistive technology.
      if (event.altKey) return;
      // The switch-case will determine which tab should be marked as active
      // depending on the key that was pressed.
      let newTab;
      switch (event.keyCode) {
        case KEYCODE.LEFT:
        case KEYCODE.UP:
          newTab = this._prevTab();
          break;

        case KEYCODE.RIGHT:
        case KEYCODE.DOWN:
          newTab = this._nextTab();
          break;

        case KEYCODE.HOME:
          newTab = this._firstTab();
          break;

        case KEYCODE.END:
          newTab = this._lastTab();
          break;
        // Any other key press is ignored and passed back to the browser.
        default:
          return;
      }
      // The browser might have some native functionality bound to the arrow
      // keys, home or end. The element calls `preventDefault()` to prevent the
      // browser from taking any actions.
      event.preventDefault();
      // Select the new tab, that has been determined in the switch-case.
      this._selectTab(newTab);
    }
    _handleClick(event) {
      // If the click was not targeted on a tab element itself,
      // it was a click inside the a panel or on empty space. Nothing to do.
      if (event.target.getAttribute('role') !== 'tab') return;
      event.preventDefault();
      // If it was on a tab element, though, select that tab.
      this._selectTab(event.target);
    }
    _selectTab(newTab) {
      // Deselect all tabs and hide all panels.
      this.reset();
      // Get the panel that the `newTab` is associated with.
      const newPanel = this._panelForTab(newTab);
      // If that panel doesn’t exist, abort.
      if (!newPanel) throw new Error(`No panel with id ${newPanelId}`);
      this._setTabSelection(newTab, true);
      newPanel.hidden = false;
      newTab.focus();
    }
    _setTabSelection(tab, selected) {
      tab.setAttribute('aria-selected', selected);
      tab.setAttribute('tabindex', selected ? 0 : -1);
    }
    _allPanels() {
      return Array.from(this.querySelectorAll('.tab-panel'));
    }
    _allTabs() {
      return Array.from(this.querySelectorAll('.tab'));
    }
    _panelForTab(tab) {
      const panelId = tab.getAttribute('aria-controls');
      return this.querySelector(`#${panelId}`);
    }
    _prevTab() {
      const tabs = this._allTabs();
      // Use `findIndex()` to find the index of the currently
      // selected element and subtracts one to get the index of the previous
      // element.
      let newIdx = tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true') - 1;
      // Add `tabs.length` to make sure the index is a positive number
      // and get the modulus to wrap around if necessary.
      return tabs[(newIdx + tabs.length) % tabs.length];
    }
    _firstTab() {
      const tabs = this._allTabs();
      return tabs[0];
    }
    _lastTab() {
      const tabs = this._allTabs();
      return tabs[tabs.length - 1];
    }
    _nextTab() {
      const tabs = this._allTabs();
      let newIdx = tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true') + 1;
      return tabs[newIdx % tabs.length];
    }
    /**
     * `reset()` marks all tabs as deselected and hides all the panels.
     */
    reset() {
      const tabs = this._allTabs();
      const panels = this._allPanels();
      tabs.forEach((tab) => this._setTabSelection(tab, false));
      panels.forEach((panel) => (panel.hidden = true));
    }
  }
  customElements.define('tabbed-content', TabbedContent);
}
