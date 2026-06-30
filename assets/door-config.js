// Door configurator frontend logic for Shopify theme
// This file is meant to be uploaded as an asset (door-config.js) in your theme.

(function () {
  function $(selector) {
    return document.querySelector(selector);
  }

  function getExtras() {
    return Array.from(
      document.querySelectorAll('input[name="attributes[Extras][]"]:checked')
    ).map(function (el) { return el.value; });
  }

   function getDoorSetup() {
    return Array.from(
      document.querySelectorAll('input[name="attributes[Door Setup][]"]:checked')
    ).map(function (el) { return el.value; });
  }
  
  function getCurrentConfig() {
    return {
      material: $('#door-material') ? $('#door-material').value || null : null,
      width: $('#door-width') && $('#door-width').value ? parseFloat($('#door-width').value) : null,
      height: $('#door-height') && $('#door-height').value ? parseFloat($('#door-height').value) : null,
        doorSetup: getDoorSetup(),
      glassType: $('#door-glass-type') ? $('#door-glass-type').value || null : null,
      hardwarePackage: $('#door-hardware') ? $('#door-hardware').value || null : null,
      extras: getExtras()
    };
  }


    function toggleDoorSetupVisibility() {
    var wrap = document.getElementById('door-setup-wrap');
    var materialSelect = $('#door-material');
    if (!wrap || !materialSelect) return;
    if (materialSelect.value === 'fiberglass') {
      wrap.classList.add('door-hidden');
    } else {
      wrap.classList.remove('door-hidden');
    }
  }


  // Pricing logic (kept in sync with backend)
  function calculateDoorPrice(basePrice, config) {
    var price = basePrice;
    var material = config.material;
    if (material === 'wood') {
      price *= 1.15;
    } else if (material === 'fiberglass') {
      price *= 1.25;
    }

    if (config.width && config.height) {
      var area = (config.width * config.height) / (36 * 80); // relative to 36x80 base
      if (area > 1) {
        price *= area;
      }
    }

    if (config.glassType === 'clear') {
      price += 100;
    } else if (config.glassType === 'frosted') {
      price += 150;
    } else if (config.glassType === 'decorative') {
      price += 250;
    }

    if (config.hardwarePackage === 'premium-lever') {
      price += 120;
    } else if (config.hardwarePackage === 'smart-lock') {
      price += 280;
    }

    if (Array.isArray(config.extras)) {
      config.extras.forEach(function (extra) {
        if (extra === 'sidelites') {
          price += 400;
        } else if (extra === 'transom') {
          price += 250;
        } else if (extra === 'custom-color') {
          price += 150;
        }
      });
    }

    return {
      price: price,
      currency: Shopify && Shopify.currency && Shopify.currency.active ? Shopify.currency.active : null
    };
  }

  function formatMoney(amount) {
    try {
      var locale = (navigator.language || 'en-US');
      var currency = Shopify && Shopify.currency && Shopify.currency.active
        ? Shopify.currency.active
        : 'USD';
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency
      }).format(amount);
    } catch (e) {
      return '$' + amount.toFixed(2);
    }
  }

  function updateEstimatedPrice() {
    var container = document.getElementById('door-configurator');
    if (!container) return;
    var basePriceAttr = container.getAttribute('data-base-price');
    if (!basePriceAttr) return;
    var basePrice = parseFloat(basePriceAttr);
    if (isNaN(basePrice)) return;

    var config = getCurrentConfig();
    var result = calculateDoorPrice(basePrice, config);
    var el = document.getElementById('door-estimated-price');
    if (el) {
      el.textContent = formatMoney(result.price);
    }
  }

  function attachEvents() {
    var container = document.getElementById('door-configurator');
    if (!container) return;

    [
      '#door-material',
      '#door-width',
      '#door-height',
      '#door-glass-type',
      '#door-hardware'
    ].forEach(function (selector) {
      var el = $(selector);
      if (el) {
        el.addEventListener('change', updateEstimatedPrice);
        el.addEventListener('input', updateEstimatedPrice);
      }
    });

   var materialEl = $('#door-material');
    if (materialEl) {
      materialEl.addEventListener('change', toggleDoorSetupVisibility);
    }
    document.querySelectorAll('input[name="attributes[Extras][]"]').forEach(function (el) {
      el.addEventListener('change', updateEstimatedPrice);
    });
    document.querySelectorAll('input[name="attributes[Door Setup][]"]').forEach(function (el) {
      el.addEventListener('change', updateEstimatedPrice);
    });


    var saveButton = document.getElementById('door-save-config-button');
    if (saveButton) {
      saveButton.addEventListener('click', function () {
        var emailInput = document.getElementById('door-customer-email');
        var messageEl = document.getElementById('door-save-config-message');
        if (!emailInput || !emailInput.value) {
          if (messageEl) {
            messageEl.style.display = 'block';
            messageEl.textContent = 'Please enter your email to save the configuration.';
          }
          return;
        }

        var container = document.getElementById('door-configurator');
        var basePriceAttr = container.getAttribute('data-base-price');
        var productId = container.getAttribute('data-product-id');
        var productName = container.getAttribute('data-product-name') || '';
        var productImage = container.getAttribute('data-product-image') || '';
        var productHandle = container.getAttribute('data-product-handle') || '';
        var basePrice = parseFloat(basePriceAttr);
        var config = getCurrentConfig();
        var editId = container.getAttribute('data-edit-config-id');
        var isUpdate = !!editId;

        var url = 'https://vintage.espirevox.com/api/configurations.php';
        var method = isUpdate ? 'PUT' : 'POST';
        var payload = isUpdate
          ? { id: parseInt(editId, 10), email: emailInput.value, options: config, basePrice: basePrice }
          : { customerEmail: emailInput.value, baseProductId: productId, productTitle: productName, productImageUrl: productImage, productHandle: productHandle, options: config, notesFromCustomer: '', basePrice: basePrice };

        fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
          .then(function (res) {
            if (!res.ok) throw new Error('Request failed');
            return res.json();
          })
          .then(function (data) {
            if (messageEl) {
              messageEl.style.display = 'block';
              messageEl.textContent = isUpdate
                ? 'Configuration updated. Our team will follow up if needed.'
                : 'Configuration saved. Our sales team will contact you. Reference ID: ' + (data.id || data);
            }
          })
          .catch(function () {
            if (messageEl) {
              messageEl.style.display = 'block';
              messageEl.textContent = 'Something went wrong. Please try again.';
            }
          });
      });
    }

    function getQueryParam(name) {
      var m = window.location.search.match(new RegExp('[?&]' + name + '=([^&]*)'));
      return m ? decodeURIComponent(m[1]) : '';
    }

    function loadSavedConfig() {
      var configId = getQueryParam('config_id');
      var email = getQueryParam('email');
      var container = document.getElementById('door-configurator');
      if (!container || !configId || !email) return;

      container.setAttribute('data-edit-config-id', configId);
      fetch('https://vintage.espirevox.com/api/configurations.php?id=' + encodeURIComponent(configId) + '&email=' + encodeURIComponent(email))
        .then(function (r) { return r.json(); })
        .then(function (c) {
          if (c.error) return;
          var opts = c.options || {};
          var material = $('#door-material');
          if (material) material.value = opts.material || '';
          var width = $('#door-width');
          if (width) width.value = opts.width !== undefined && opts.width !== null ? opts.width : '';
          var height = $('#door-height');
          if (height) height.value = opts.height !== undefined && opts.height !== null ? opts.height : '';
          var glass = $('#door-glass-type');
          if (glass) glass.value = opts.glassType || '';
          var hardware = $('#door-hardware');
          if (hardware) hardware.value = opts.hardwarePackage || '';
          var emailInput = document.getElementById('door-customer-email');
          if (emailInput) emailInput.value = c.customer_email || email;
          var extras = opts.extras || [];
          document.querySelectorAll('input[name="attributes[Extras][]"]').forEach(function (el) {
            el.checked = extras.indexOf(el.value) !== -1;
          });

            var doorSetup = opts.doorSetup || [];
          document.querySelectorAll('input[name="attributes[Door Setup][]"]').forEach(function (el) {
            el.checked = doorSetup.indexOf(el.value) !== -1;
          });
          toggleDoorSetupVisibility();

          var saveBtn = document.getElementById('door-save-config-button');
          if (saveBtn) saveBtn.textContent = 'Update configuration';
          updateEstimatedPrice();
        })
        .catch(function () {});
    }
  toggleDoorSetupVisibility();
    updateEstimatedPrice();
    loadSavedConfig();
  }

  document.addEventListener('DOMContentLoaded', attachEvents);
})();

