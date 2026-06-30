/**
 * Cart page: when "Check out" is clicked, create a draft order via your API
 * and redirect the customer to the draft order invoice (checkout) URL.
 *
 * Requires the cart form (or a parent) to have:
 *   data-draft-order-api-url="https://your-api.com/api/draft_order_from_cart.php"
 * If the attribute is missing, the normal checkout submit happens.
 */
(function () {

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function getCartJs() {
    var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) ? window.Shopify.routes.root : '/';
    return fetch(root + 'cart.js').then(function (r) { return r.json(); });
  }

  ready(function () {
    var form = document.querySelector('form[action*="cart"]');
    if (!form) return;

    var apiUrl = form.getAttribute('data-draft-order-api-url') ||
      (form.closest && form.closest('[data-draft-order-api-url]') && form.closest('[data-draft-order-api-url]').getAttribute('data-draft-order-api-url')) ||
      (form.querySelector && form.querySelector('[data-draft-order-api-url]') && form.querySelector('[data-draft-order-api-url]').getAttribute('data-draft-order-api-url'));
    if (!apiUrl) return;

    var checkoutBtn = form.querySelector('button[name="checkout"], button[type="submit"]');
    if (!checkoutBtn) return;

    form.addEventListener('submit', function (e) {
      var isCheckout = (e.submitter && (e.submitter.getAttribute('name') === 'checkout' || e.submitter === checkoutBtn)) ||
        (!e.submitter && checkoutBtn.getAttribute('name') === 'checkout');
      if (!isCheckout) return;

      e.preventDefault();
      e.stopPropagation();

      var btnText = checkoutBtn.querySelector('span') || checkoutBtn;
      var originalText = btnText.textContent;
      checkoutBtn.disabled = true;
      btnText.textContent = 'Creating checkout…';

      getCartJs()
        .then(function (cart) {
          if (!cart || !cart.items || cart.items.length === 0) {
            throw new Error('Your cart is empty.');
          }
          return fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cart: cart }),
          });
        })
        .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
        .then(function (result) {
          if (result.ok && result.data.success && result.data.invoice_url) {
            window.location.href = result.data.invoice_url;
            return;
          }
          throw new Error(result.data && result.data.error ? result.data.error : 'Could not create checkout.');
        })
        .catch(function (err) {
          checkoutBtn.disabled = false;
          btnText.textContent = originalText;
          alert(err.message || 'Could not create checkout. Try again or use normal checkout.');
        });
    });
  });
})();
