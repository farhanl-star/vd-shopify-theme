/**
 * Cart page only: fetch cart (cart.js) and update the displayed variant price
 * using a line item property. No extension, no discount – just DOM updates.
 *
 * Uses property _configured_price (decimal string, e.g. "122.00") if present;
 * otherwise the line keeps the theme’s default price display.
 *
 * Include on the cart template. Add data-line-key, data-line-price, data-line-total
 * to cart line markup so we can target each line (or rely on theme class fallbacks).
 */
(function () {

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function fetchCart() {
    return fetch(window.Shopify && window.Shopify.routes && window.Shopify.routes.root
      ? window.Shopify.routes.root + 'cart.js'
      : '/cart.js')
      .then(function (res) { return res.json(); });
  }

  function formatMoney(cents) {
    if (typeof Shopify !== 'undefined' && Shopify.formatMoney) {
      return Shopify.formatMoney(cents);
    }
    var c = (cents / 100).toFixed(2);
    return '$' + c;
  }

  function updateCartDisplayPrices(cart) {
    if (!cart || !cart.items || !cart.items.length) return;

    cart.items.forEach(function (item, index) {
      var configuredPrice = item.properties && item.properties._configured_price;
      if (configuredPrice == null || configuredPrice === '') return;

      var priceNum = parseFloat(configuredPrice);
      if (isNaN(priceNum)) return;

      var quantity = item.quantity || 1;
      var lineTotal = priceNum * quantity;
      var priceCents = Math.round(priceNum * 100);
      var lineTotalCents = Math.round(lineTotal * 100);

      // Target line by data attribute (theme must output these)
      var lineKey = item.key;
      var lineSelector = '[data-line-key="' + lineKey + '"]';
      var lineEl = document.querySelector(lineSelector);

      if (!lineEl) {
        lineSelector = '[data-line-index="' + index + '"]';
        lineEl = document.querySelector(lineSelector);
      }
      if (!lineEl) {
        // Fallback: cart rows by order (Minimog: .m-cart-item, [data-cart-item])
        var rows = document.querySelectorAll('.m-cart-item, [data-cart-item], .cart__row, [data-cart-line], .cart-item, tr.cart-item');
        lineEl = rows[index];
      }

      if (!lineEl) return;

      // Update unit price display (Minimog: .m-cart-item__price--regular; keep visually-hidden label)
      var priceEl = lineEl.querySelector('[data-line-price], .m-cart-item__price--regular p, .m-cart-item__price--regular, .cart-item__price, .cart__price .money, .price');
      if (priceEl) {
        var isMinimog = (priceEl.classList && priceEl.classList.contains('m-cart-item__price--regular')) ||
          (priceEl.closest && priceEl.closest('.m-cart-item__price--regular'));
        if (isMinimog) {
          priceEl.innerHTML = '<span class="m:visually-hidden">Regular price</span>' + formatMoney(priceCents);
        } else {
          priceEl.textContent = formatMoney(priceCents);
        }
      }

      // Update line total display (Minimog: [data-cart-item-original-price], [data-cart-item-final-price])
      var totalSelectors = '[data-line-total], [data-cart-item-original-price], [data-cart-item-final-price], .cart-item__total, .cart__line-total .money, .line-total';
      var totalEls = lineEl.querySelectorAll(totalSelectors);
      var totalStr = formatMoney(lineTotalCents);
      for (var t = 0; t < totalEls.length; t++) {
        totalEls[t].textContent = totalStr;
      }
    });

    // Update cart subtotal (Minimog: [data-cart-subtotal-price])
    var subtotalEl = document.querySelector('[data-cart-subtotal-price], .cart__subtotal .money, .cart-subtotal__price, .cart__subtotal--price, [data-cart-subtotal]');
    if (subtotalEl && cart.items.length > 0) {
      var total = 0;
      cart.items.forEach(function (item) {
        var configuredPrice = item.properties && item.properties._configured_price;
        if (configuredPrice != null && configuredPrice !== '') {
          total += parseFloat(configuredPrice) * (item.quantity || 1);
        } else {
          total += (item.line_price || item.price * (item.quantity || 1)) / 100;
        }
      });
      subtotalEl.textContent = formatMoney(Math.round(total * 100));
    }
  }

  ready(function () {
    if (!document.querySelector('.cart, .m-cart, #MinimogCart, m-cart, [data-cart], #cart, .main-cart')) return;

    fetchCart()
      .then(updateCartDisplayPrices)
      .catch(function () {});
  });
})();
