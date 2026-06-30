// Door configurator frontend logic for Shopify theme
// This file is meant to be uploaded as an asset (door-config.js) in your theme.

(function () {
  function $(selector) {
    return document.querySelector(selector);
  }
  function all(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  var doorConfigSchema = null;

  function getCurrentConfigFromSchema() {
    if (!doorConfigSchema) return null;
    var container = document.getElementById('door-configurator-options');
    if (!container) return null;
    var config = {};
    var optType;
    doorConfigSchema.forEach(function (opt) {
      optType = (opt.type || '').toLowerCase();
      var inputs = all('select[data-option-id="' + opt.id + '"], input[data-option-id="' + opt.id + '"]', container);
      if (optType === 'checkbox') {
        config[opt.id] = inputs.filter(function (el) { return el.checked; }).map(function (el) { return el.value; });
      } else if (inputs.length) {
        var v = inputs[0].value;
        config[opt.id] = optType === 'number' && v !== '' ? parseFloat(v) : (v || null);
      }
    });
    return config;
  }

  function getCurrentConfig() {
    return getCurrentConfigFromSchema() || {};
  }

  function renderDynamicOptions(schema, container) {
    doorConfigSchema = schema;
    if (!Array.isArray(schema) || !schema.length) return;
    schema.forEach(function (opt) {
      var section = document.createElement('div');
      section.className = 'door-section door-option-wrap';
      section.setAttribute('data-option-id', opt.id);
      var title = document.createElement('p');
      title.className = 'door-section-title';
      title.textContent = opt.label;
      section.appendChild(title);

      if ((opt.type || '').toLowerCase() === 'select') {
        var sel = document.createElement('select');
        sel.setAttribute('data-option-id', opt.id);
        sel.id = 'door-opt-' + opt.id;
        sel.name = 'attributes[' + (opt.label || opt.id) + ']';
        var placeholderLabel = opt.placeholder_label || ('Select ' + (opt.label || opt.id));
        var placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = placeholderLabel;
        sel.appendChild(placeholder);
        (opt.options || []).forEach(function (o) {
          var op = document.createElement('option');
          op.value = o.value != null && o.value !== '' ? String(o.value) : '';
          op.textContent = o.label || o.value || '';
          sel.appendChild(op);
        });
        sel.addEventListener('change', updateEstimatedPrice);
        sel.addEventListener('input', updateEstimatedPrice);
        section.appendChild(sel);
      } else if (opt.type === 'number') {
        var lab = document.createElement('label');
        lab.setAttribute('for', 'door-opt-' + opt.id);
        lab.textContent = opt.label;
        section.appendChild(lab);
        var num = document.createElement('input');
        num.type = 'number';
        num.id = 'door-opt-' + opt.id;
        num.setAttribute('data-option-id', opt.id);
        num.name = 'attributes[' + (opt.label || opt.id) + ']';
        if (opt.min != null) num.min = opt.min;
        if (opt.max != null) num.max = opt.max;
        section.appendChild(num);
      } else if (opt.type === 'checkbox') {
        var wrap = document.createElement('div');
        wrap.className = 'door-setup-options';
        (opt.options || []).forEach(function (o) {
          var lab = document.createElement('label');
          lab.className = 'door-setup-option';
          var cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.setAttribute('data-option-id', opt.id);
          cb.name = 'attributes[' + (opt.label || opt.id) + '][]';
          cb.value = o.value;
          lab.appendChild(cb);
          lab.appendChild(document.createTextNode(o.label || o.value));
          wrap.appendChild(lab);
        });
        section.appendChild(wrap);
      }
      container.appendChild(section);
    });
  }

  function applyHideWhen(schema, container) {
    if (!container) container = document.getElementById('door-configurator-options');
    if (!container) return;
    var refSelector = function (id) {
      return 'select[data-option-id="' + id + '"], input[data-option-id="' + id + '"]';
    };
    schema.forEach(function (opt) {
      var hideWhen = opt.hideWhen;
      if (!hideWhen || typeof hideWhen !== 'object') return;
      var wrap = container.querySelector('.door-option-wrap[data-option-id="' + opt.id + '"]');
      if (!wrap) return;
      var refId = Object.keys(hideWhen)[0];
      var refValue = hideWhen[refId];
      var refInput = container.querySelector(refSelector(refId));
      if (!refInput) return;
      function updateVisibility() {
        var refInputs = all(refSelector(refId), container);
        var shouldHide = false;
        if (refInputs[0] && refInputs[0].type === 'checkbox') {
          var checkedVals = refInputs.filter(function (el) { return el.checked; }).map(function (el) { return el.value; });
          shouldHide = checkedVals.indexOf(refValue) !== -1;
        } else if (refInputs[0]) {
          shouldHide = String(refInputs[0].value || '') === String(refValue || '');
        }
        wrap.classList.toggle('door-hidden', shouldHide);
      }
      refInput.addEventListener('change', updateVisibility);
      if (refInput.type !== 'checkbox') {
        refInput.addEventListener('input', updateVisibility);
      }
      all(refSelector(refId), container).forEach(function (el) {
        if (el !== refInput) el.addEventListener('change', updateVisibility);
      });
      updateVisibility();
    });
  }

  function bindDynamicOptionsEvents(container) {
    if (!container) return;
    all('select[data-option-id], input[data-option-id]', container).forEach(function (el) {
      el.addEventListener('change', updateEstimatedPrice);
      if (el.tagName.toLowerCase() === 'select' || el.type === 'number' || el.type === 'text') {
        el.addEventListener('input', updateEstimatedPrice);
      }
    });
  }

  function bindDelegatedPriceUpdate() {
    var container = document.getElementById('door-configurator');
    if (!container) return;
    function handleOptionChange(e) {
      var t = e.target;
      if (t && (t.getAttribute('data-option-id') || (t.id && t.id.indexOf('door-opt-') === 0))) {
        updateEstimatedPrice();
      }
    }
    container.addEventListener('change', handleOptionChange, true);
    container.addEventListener('input', handleOptionChange, true);
  }

  // Pricing from metaobject schema only (priceType + priceValue per choice)
  function calculatePriceFromSchema(basePrice, config, schema) {
    var total = basePrice;
    if (!Array.isArray(schema)) return total;

    schema.forEach(function (opt) {
      if (!opt || !opt.id || !opt.type) return;
      var optType = (opt.type || '').toLowerCase();
      var selected = config ? config[opt.id] : null;
      var choices = Array.isArray(opt.options) ? opt.options : [];

      function applyChoice(choice) {
        if (!choice) return;
        var t = choice.priceType || choice.price_type;
        var v = parseFloat(choice.priceValue || choice.price_value || 0);
        if (t === 'fixed') total += v;
        else if (t === 'percent') total += (basePrice * v);
      }

      if (optType === 'select') {
        var selectedStr = selected != null ? String(selected) : '';
        var ch = choices.find(function (c) { return String(c.value || '') === selectedStr; });
        applyChoice(ch);
      } else if (optType === 'checkbox') {
        var arr = Array.isArray(selected) ? selected : [];
        arr.forEach(function (val) {
          var valStr = val != null ? String(val) : '';
          var ch2 = choices.find(function (c) { return String(c.value || '') === valStr; });
          applyChoice(ch2);
        });
      }
    });
    return total;
  }

  function calculateDoorPrice(basePrice, config) {
    // Price from metaobject schema only (no static rules)
    if (doorConfigSchema && Array.isArray(doorConfigSchema) && doorConfigSchema.length) {
      var total = calculatePriceFromSchema(basePrice, config, doorConfigSchema);
      return {
        price: total,
        currency: Shopify && Shopify.currency && Shopify.currency.active ? Shopify.currency.active : null
      };
    }
    return {
      price: basePrice,
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

    var schemaEl = document.getElementById('door-configurator-schema');
    var optionsContainer = document.getElementById('door-configurator-options');
    if (schemaEl && optionsContainer) {
      try {
        var raw = JSON.parse(schemaEl.textContent);
        var schema = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (Array.isArray(schema) && schema.length) {
          renderDynamicOptions(schema, optionsContainer);
          applyHideWhen(schema, optionsContainer);
          bindDynamicOptionsEvents(optionsContainer);
        }
      } catch (e) {}
    }
    bindDelegatedPriceUpdate();

    var saveButton = document.getElementById('door-save-config-button');
    if (saveButton) {
      saveButton.addEventListener('click', function () {
        var emailInput = document.getElementById('door-customer-email');
        var messageEl = document.getElementById('door-save-config-message');
        if (!emailInput || !emailInput.value) {
          if (messageEl) {
            messageEl.style.display = 'block';
            messageEl.textContent = 'Please enter your email to save the projects.';
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
          : {
              customerEmail: emailInput.value,
              baseProductId: productId,
              productTitle: productName,
              productImageUrl: productImage,
              productHandle: productHandle,
              // Snapshot pricing schema with the saved config so backend can compute the same price
              pricingSchema: doorConfigSchema,
              options: config,
              notesFromCustomer: '',
              basePrice: basePrice
            };

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
                ? 'Projects updated. Our team will follow up if needed.'
                : 'Projects saved. Our sales team will contact you. Reference ID: ' + (data.id || data);
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
          var optionsContainer = document.getElementById('door-configurator-options');
          if (doorConfigSchema && optionsContainer) {
            var formControlSelector = function (id) {
              return 'select[data-option-id="' + id + '"], input[data-option-id="' + id + '"]';
            };
            doorConfigSchema.forEach(function (opt) {
              var optType = (opt.type || '').toLowerCase();
              var inputs = all(formControlSelector(opt.id), optionsContainer);
              var val = opts[opt.id];
              if (optType === 'checkbox') {
                var arr = Array.isArray(val) ? val : [];
                inputs.forEach(function (el) {
                  el.checked = arr.indexOf(el.value) !== -1;
                });
              } else if (inputs.length && val !== undefined && val !== null && val !== '') {
                inputs[0].value = String(val);
              }
            });
            applyHideWhen(doorConfigSchema, optionsContainer);
          }
          var emailInput = document.getElementById('door-customer-email');
          if (emailInput) emailInput.value = c.customer_email || email;
          var saveBtn = document.getElementById('door-save-config-button');
          if (saveBtn) saveBtn.textContent = 'Update configuration';
          updateEstimatedPrice();
        })
        .catch(function () {});
    }

    updateEstimatedPrice();
    loadSavedConfig();
  }

  document.addEventListener('DOMContentLoaded', attachEvents);
})();

