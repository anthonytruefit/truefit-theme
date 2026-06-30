/*
 * cart-bubble-sync.js
 * Self-contained cart count badge synchronizer.
 *
 * Why this exists: the theme's server-rendered .cart-count-bubble was not
 * reliably appearing (header markup is correct, but the badge can be missing
 * due to Shopify section caching of the header rendered while the cart was
 * empty, and app-injected adds like Monk do not trigger the theme's own
 * section re-render). This script reads the live cart from /cart.js and draws
 * the badge with its own inline styling + positioning, so it is immune to
 * CSS/caching quirks and updates after a cart change from ANY source.
 *
 * Cosmetic/additive only. Remove this file + its <script> tag in theme.liquid
 * to fully revert.
 */
(function () {
  'use strict';

  var CART_WRITE = /\/cart\/(add|change|update|clear)(\.js)?(\?|$)/i;

  function renderBadge(count) {
    var link = document.getElementById('cart-icon-bubble');
    if (!link) return;

    // Guarantee a positioning context on the cart icon.
    if (window.getComputedStyle(link).position === 'static') {
      link.style.position = 'relative';
    }

    var bubble = link.querySelector('.cart-count-bubble');

    if (!count || count < 1) {
      if (bubble) bubble.parentNode.removeChild(bubble);
      return;
    }

    if (!bubble) {
      bubble = document.createElement('div');
      bubble.className = 'cart-count-bubble';
      link.appendChild(bubble);
    }

    // Dawn convention: hide the number at 100+, keep the dot.
    var label = count < 100 ? String(count) : '';
    bubble.textContent = label;

    // Inline styling wins over any broken/cached theme CSS -> guaranteed visible.
    var s = bubble.style;
    s.position = 'absolute';
    s.top = '0.2rem';
    s.right = '0.2rem';
    s.left = 'auto';
    s.bottom = 'auto';
    s.minWidth = '1.8rem';
    s.height = '1.8rem';
    s.padding = '0 0.4rem';
    s.boxSizing = 'border-box';
    s.borderRadius = '999px';
    s.display = 'flex';
    s.alignItems = 'center';
    s.justifyContent = 'center';
    s.backgroundColor = '#0a1a4f';
    s.color = '#ffffff';
    s.fontSize = '1.1rem';
    s.fontWeight = '600';
    s.lineHeight = '1';
    s.zIndex = '5';
    s.pointerEvents = 'none';
  }

  var pending = false;
  function syncFromCart() {
    if (pending) return;
    pending = true;
    fetch('/cart.js', { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (cart) { renderBadge(cart.item_count); })
      .catch(function () {})
      .then(function () { pending = false; });
  }

  function init() {
    syncFromCart();

    // Restores from back/forward cache, tab refocus.
    window.addEventListener('pageshow', syncFromCart);
    window.addEventListener('focus', syncFromCart);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) syncFromCart();
    });

    // Catch cart writes from ANY source (native product form, Monk, ReCharge).
    if (window.fetch) {
      var origFetch = window.fetch;
      window.fetch = function () {
        var args = arguments;
        return origFetch.apply(this, args).then(function (res) {
          try {
            var url = (args[0] && args[0].url) || args[0];
            if (typeof url === 'string' && CART_WRITE.test(url)) {
              setTimeout(syncFromCart, 200);
            }
          } catch (e) {}
          return res;
        });
      };
    }
    var origOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url) {
      try {
        if (typeof url === 'string' && CART_WRITE.test(url)) {
          this.addEventListener('load', function () { setTimeout(syncFromCart, 200); });
        }
      } catch (e) {}
      return origOpen.apply(this, arguments);
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
