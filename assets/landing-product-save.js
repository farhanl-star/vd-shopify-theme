/**
 * Hardware / Millwork landing page — save to collection, request quote, login restore, edit mode.
 * Mirrors door configurator flow; uses same API + HubSpot integration as door-conf2.
 */
(function () {
  'use strict';

  var AUTOSAVE_KEY = 'door_autosave_payload';

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $all(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function getContainer() {
    return document.getElementById('landing-product-configurator');
  }

  function resolveLandingProductTitle(container) {
    container = container || getContainer();
    if (!container) return 'Product configuration';
    var title = String(container.getAttribute('data-product-name') || '').trim();
    if (!title) {
      var titleEl = container.querySelector('.landing-product__title');
      if (titleEl) title = String(titleEl.textContent || '').trim();
    }
    if (!title) {
      var sku = String(container.getAttribute('data-product-sku') || '').trim();
      if (sku) title = sku;
    }
    if (!title) {
      var pt = String(container.getAttribute('data-product-type') || '').trim();
      if (pt) title = pt + ' product';
    }
    return title || 'Product configuration';
  }

  function getApiBase(container) {
    return (container && container.getAttribute('data-api-base')) || 'https://vintage.espirevox.com';
  }

  function getQueryParam(name) {
    try {
      var m = new RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search || '');
      return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
    } catch (e) {
      return '';
    }
  }

  function parseMoneyText(el) {
    if (!el) return 0;
    var raw = String(el.textContent || '').replace(/[^\d.,]/g, '').replace(/,/g, '');
    var n = parseFloat(raw);
    return isNaN(n) ? 0 : n;
  }

  function readLandingPriceFromDom() {
    var configured = document.getElementById('landing-configured-price');
    var starting = document.getElementById('landing-starting-price');
    var p = parseMoneyText(configured);
    if (p > 0) return p;
    p = parseMoneyText(starting);
    return p > 0 ? p : 0;
  }

  function getLandingQuantity() {
    var inp = document.getElementById('landing-config-quantity');
    if (!inp) {
      inp = $('.millwork-form input[name="quantity"]');
    }
    if (inp) {
      var q = parseInt(inp.value, 10);
      if (!isNaN(q) && q >= 1) return q;
    }
    return 1;
  }

  function syncLandingQtyToForms() {
    var qty = getLandingQuantity();
    var landingQty = document.getElementById('landing-config-quantity');
    if (landingQty) landingQty.value = String(qty);
    $all('form.millwork-form input[name="quantity"]').forEach(function (inp) {
      inp.value = String(qty);
      try { inp.dispatchEvent(new Event('change', { bubbles: true })); } catch (eQtyCh) {}
    });
  }

  function selectLabel(sel) {
    if (!sel || sel.selectedIndex < 0) return '';
    var op = sel.options[sel.selectedIndex];
    return op ? String(op.textContent || op.value || '').trim() : '';
  }

  function selectValue(sel) {
    if (!sel || sel.selectedIndex < 0) return '';
    return String(sel.value || '').trim();
  }

  function pushSummary(summary, label, value) {
    if (value == null || value === '') return;
    summary.push({ label: label, value: String(value) });
  }

  function getHardwareLandingConfig(container) {
    var card = $('.door-suggested-hardware-card', $('[data-landing-hardware-config="1"]') || document);
    var summary = [];
    var config = {};
    if (!card) return { config: config, summary: summary, hardware: [] };

    var fields = [
      ['data-hw-finish-label', 'Finish'],
      ['data-hw-function-label', 'Hardware Function'],
      ['data-hw-closer-color-label', 'Closer Color'],
      ['data-hw-thickness-label', 'Door Thickness'],
      ['data-hw-swing-direction-label', 'Swing Direction'],
      ['data-hw-backset-label', 'Door Backset'],
      ['data-hw-track-length-label', 'Track Length'],
      ['data-hw-connected-doors-label', 'Number of Connected Doors'],
      ['data-hw-upper-track-length-label', 'Upper Track Length'],
      ['data-hw-max-door-size-label', 'Max Door Size'],
      ['data-hw-carriage-pack-type-label', 'Carriage Pack Type'],
      ['data-hw-strap-hinge-length-label', 'Strap Hinge Length']
    ];
    fields.forEach(function (pair) {
      var val = card.getAttribute(pair[0]) || '';
      if (val) {
        pushSummary(summary, pair[1], val);
        config[pair[1].toLowerCase().replace(/[^a-z0-9]+/g, '_')] = val;
      }
    });

    var qty = getLandingQuantity();
    var productId = container.getAttribute('data-product-id') || '';
    var productName = container.getAttribute('data-product-name') || '';
    var hwRow = {
      product_id: productId,
      title: productName,
      qty: qty,
      finish_label: card.getAttribute('data-hw-finish-label') || '',
      finish_value: card.getAttribute('data-hw-finish-value') || '',
      function_label: card.getAttribute('data-hw-function-label') || '',
      function_value: card.getAttribute('data-hw-function-value') || '',
      closer_color_label: card.getAttribute('data-hw-closer-color-label') || '',
      thickness_label: card.getAttribute('data-hw-thickness-label') || '',
      swing_direction_label: card.getAttribute('data-hw-swing-direction-label') || '',
      backset_label: card.getAttribute('data-hw-backset-label') || '',
      track_length_label: card.getAttribute('data-hw-track-length-label') || ''
    };
    return { config: config, summary: summary, hardware: [hwRow] };
  }

  function getMillworkLandingConfig() {
    var summary = [];
    var config = {};
    var woodHidden = document.getElementById('millwork-selected');
    var woodLabel = document.getElementById('millwork-selected-label');
    if (woodHidden && woodHidden.value) {
      config.millwork_wood = woodHidden.value;
      pushSummary(summary, 'Wood', woodLabel ? woodLabel.textContent.trim() : woodHidden.value);
    }
    var selects = [
      ['[data-millwork-length-select]', 'Millwork Length'],
      ['[data-millwork-baluster-length-select]', 'Baluster Length'],
      ['[data-millwork-custom-length-select]', 'Custom Length'],
      ['[data-millwork-custom-thickness-select]', 'Custom Thickness']
    ];
    selects.forEach(function (pair) {
      var sel = $(pair[0]);
      if (!sel) return;
      var val = selectLabel(sel) || selectValue(sel);
      if (val) {
        var key = pair[1].toLowerCase().replace(/[^a-z0-9]+/g, '_');
        config[key] = selectValue(sel) || val;
        pushSummary(summary, pair[1], val);
      }
    });
    return { config: config, summary: summary };
  }

  function getLineItemPropertiesFromLanding() {
    var props = {};
    var form = $('.millwork-form');
    if (!form) return props;
    $all('input[name^="properties["]', form).forEach(function (inp) {
      var m = /^properties\[(.+)\]$/.exec(inp.name || '');
      if (m && m[1]) props[m[1]] = inp.value;
    });
    return props;
  }

  function getCurrentLandingConfig(container) {
    container = container || getContainer();
    var productType = (container && container.getAttribute('data-product-type')) || '';
    var base = {};
    var summary = [];
    var hardware = [];

    if (productType === 'Hardware') {
      var hw = getHardwareLandingConfig(container);
      base = hw.config;
      summary = hw.summary;
      hardware = hw.hardware;
    } else if (productType === 'Millwork') {
      var mw = getMillworkLandingConfig();
      base = mw.config;
      summary = mw.summary;
    }

    var unitPrice = readLandingPriceFromDom();
    var qty = getLandingQuantity();
    return Object.assign({}, base, {
      _selected_summary: summary,
      _hardware_selections: hardware,
      _quantity: qty,
      _applied_unit_price: unitPrice,
      _product_type: productType,
      _product_sku: (container && container.getAttribute('data-product-sku')) || '',
      _product_title: resolveLandingProductTitle(container),
      _landing_product: true
    });
  }

  function getHardwareSelectionsForLanding() {
    var container = getContainer();
    if (!container || container.getAttribute('data-product-type') !== 'Hardware') return [];
    return getHardwareLandingConfig(container).hardware;
  }

  function buildSavePayload(container) {
    var config = getCurrentLandingConfig(container);
    var unitPrice = config._applied_unit_price || 0;
    return {
      config: config,
      unitPrice: unitPrice,
      qty: config._quantity || 1
    };
  }

  function setSelectByValue(sel, val) {
    if (!sel || val == null || val === '') return false;
    var target = String(val);
    for (var i = 0; i < sel.options.length; i++) {
      if (String(sel.options[i].value) === target) {
        sel.selectedIndex = i;
        try { sel.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) {}
        return true;
      }
    }
    return false;
  }

  function applySavedOptionsToLanding(opts) {
    if (!opts || typeof opts !== 'object') return;
    var card = $('.door-suggested-hardware-card');
    if (card) {
      var swatches = $all('.door-suggested-hardware-swatch', card.closest('[data-landing-hardware-config]') || document);
      swatches.forEach(function (sw) {
        var fv = sw.getAttribute('data-finish-value') || '';
        if (opts.finish && String(opts.finish).toLowerCase() === String(sw.getAttribute('data-finish-label') || '').toLowerCase()) {
          sw.click();
        } else if (fv && opts.finish_value === fv) {
          sw.click();
        }
      });
      [
        ['select[data-hw-function-select], .door-suggested-hardware-function', 'function_value'],
        ['select[data-hw-closer-color-select], .door-suggested-hardware-closer-color', 'closer_color_value'],
        ['select[data-hw-thickness-select], .door-suggested-hardware-thickness', 'thickness_value'],
        ['select[data-hw-swing-direction-select], .door-suggested-hardware-swing-direction', 'swing_direction_value']
      ].forEach(function (pair) {
        var sel = $(pair[0]);
        if (sel && opts[pair[1]]) setSelectByValue(sel, opts[pair[1]]);
      });
    }

    if (opts.millwork_wood) {
      var items = $all('.millwork-option-item');
      items.forEach(function (el) {
        if (String(el.getAttribute('data-value') || '') === String(opts.millwork_wood)) {
          el.click();
        }
      });
    }
    [
      ['[data-millwork-length-select]', 'millwork_length'],
      ['[data-millwork-baluster-length-select]', 'baluster_length'],
      ['[data-millwork-custom-length-select]', 'custom_length'],
      ['[data-millwork-custom-thickness-select]', 'custom_thickness']
    ].forEach(function (pair) {
      var sel = $(pair[0]);
      if (sel && opts[pair[1]]) setSelectByValue(sel, opts[pair[1]]);
    });

    if (opts._quantity != null) {
      var q = parseInt(opts._quantity, 10);
      if (!isNaN(q) && q >= 1) {
        var qtyInp = document.getElementById('landing-config-quantity');
        if (qtyInp) qtyInp.value = String(q);
        syncLandingQtyToForms();
      }
    }

    if (Array.isArray(opts._selected_summary)) {
      opts._selected_summary.forEach(function (row) {
        if (!row || !row.label) return;
        var label = String(row.label).toLowerCase();
        var val = row.value;
        if (label === 'wood' && val) {
          $all('.millwork-option-item').forEach(function (el) {
            var lbl = el.querySelector('.millwork-option-label');
            if (lbl && String(lbl.textContent || '').trim() === String(val)) el.click();
          });
        }
      });
    }
  }

  function loadFoldersIntoSelect(apiBase, email, folderSelect, done) {
    if (!folderSelect || !email) {
      if (done) done();
      return;
    }
    fetch(apiBase + '/api/folders.php?email=' + encodeURIComponent(email))
      .then(function (r) { return r.json(); })
      .then(function (list) {
        while (folderSelect.firstChild) folderSelect.removeChild(folderSelect.firstChild);
        var blank = document.createElement('option');
        blank.value = '';
        blank.textContent = 'Select a collection...';
        folderSelect.appendChild(blank);
        (list || []).forEach(function (f) {
          var opt = document.createElement('option');
          opt.value = String(f.id);
          opt.textContent = f.name || ('Folder #' + f.id);
          folderSelect.appendChild(opt);
        });
        var neu = document.createElement('option');
        neu.value = '__new__';
        neu.textContent = '+ New collection...';
        folderSelect.appendChild(neu);
        if (done) done();
      })
      .catch(function () { if (done) done(); });
  }

  function resolveFolderSelection(folderSelect, newFolderInput) {
    var folderValue = folderSelect ? folderSelect.value : '';
    var folderId = null;
    var folderName = null;
    if (folderValue === '__new__' && newFolderInput && newFolderInput.value.trim()) {
      folderName = newFolderInput.value.trim();
    } else if (folderValue && folderValue !== '__new__') {
      folderId = parseInt(folderValue, 10);
      if (isNaN(folderId)) folderId = null;
    }
    return { folderValue: folderValue, folderId: folderId, folderName: folderName };
  }

  function bindFolderSelect(folderSelect, newFolderInput) {
    if (!folderSelect || folderSelect.getAttribute('data-landing-folder-bound') === '1') return;
    folderSelect.setAttribute('data-landing-folder-bound', '1');
    folderSelect.addEventListener('change', function () {
      if (!newFolderInput) return;
      var isNew = folderSelect.value === '__new__';
      newFolderInput.classList.toggle('door-visible', isNew);
      newFolderInput.style.display = isNew ? '' : 'none';
    });
  }

  function bindSaveButton(container, apiBase, folderSelect, newFolderInput, landingHubspot) {
    var saveButton = document.getElementById('door-save-config-button');
    if (!saveButton || saveButton.getAttribute('data-landing-save-bound') === '1') return;
    saveButton.setAttribute('data-landing-save-bound', '1');

    saveButton.addEventListener('click', function () {
      var messageEl = document.getElementById('door-save-config-message');
      var emailInput = document.getElementById('door-customer-email');
      var originalText = saveButton.textContent;
      saveButton.disabled = true;
      saveButton.textContent = 'Saving...';

      var email = (container.getAttribute('data-customer-email') || '').trim() ||
        (emailInput && emailInput.value ? emailInput.value.trim() : '');
      if (!email) {
        if (messageEl) {
          messageEl.style.display = 'block';
          messageEl.textContent = 'Please log in to save the configuration.';
        }
        saveButton.disabled = false;
        saveButton.textContent = originalText;
        return;
      }

      var folder = resolveFolderSelection(folderSelect, newFolderInput);
      if (folder.folderId == null && !folder.folderName) {
        if (messageEl) {
          messageEl.style.display = 'block';
          messageEl.textContent = 'Please select a collection or enter a name for a new one.';
        }
        saveButton.disabled = false;
        saveButton.textContent = originalText;
        return;
      }

      syncLandingQtyToForms();
      var built = buildSavePayload(container);
      var configForStorage = built.config;
      var editId = container.getAttribute('data-edit-config-id');
      var isUpdate = !!editId;
      var basePrice = parseFloat(container.getAttribute('data-base-price')) || 0;

      var payload = isUpdate
        ? {
            id: parseInt(editId, 10),
            email: email,
            options: configForStorage,
            basePrice: basePrice,
            computedPrice: built.unitPrice
          }
        : {
            customerEmail: email,
            baseProductId: container.getAttribute('data-product-id'),
            productTitle: container.getAttribute('data-product-name') || '',
            productImageUrl: container.getAttribute('data-product-image') || '',
            productHandle: container.getAttribute('data-product-handle') || '',
            variantId: container.getAttribute('data-variant-id') || '',
            options: configForStorage,
            notesFromCustomer: '',
            basePrice: basePrice,
            computedPrice: built.unitPrice
          };
      if (folder.folderId != null) payload.folder_id = folder.folderId;
      if (folder.folderName) payload.folder_name = folder.folderName;

      fetch(apiBase + '/api/configurations.php', {
        method: isUpdate ? 'PUT' : 'POST',
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
            messageEl.style.color = '#059669';
            var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) ? window.Shopify.routes.root : '/';
            var myDoorsUrl = (root && root !== '/') ? root.replace(/\/$/, '') + '/pages/my-saved-doors' : '/pages/my-saved-doors';
            var msg = isUpdate ? 'Configuration updated.' : 'Configuration saved.';
            if (data && data.id) {
              container.setAttribute('data-edit-config-id', String(data.id));
              saveButton.textContent = 'Update configuration';
              msg += ' (#' + data.id + ')';
            }
            messageEl.innerHTML = msg + ' <a href="' + myDoorsUrl + '" style="font-weight:600;">View my saved doors</a>';
          }
          if (landingHubspot && typeof landingHubspot.syncAfterSave === 'function') {
            var savedProjectName = '';
            if (folder.folderValue === '__new__') {
              savedProjectName = folder.folderName || '';
            } else if (folderSelect && folderSelect.options && folderSelect.selectedIndex >= 0) {
              savedProjectName = (folderSelect.options[folderSelect.selectedIndex].text || '').trim();
            }
            var props = getLineItemPropertiesFromLanding();
            var summaryParts = [];
            Object.keys(props || {}).forEach(function (k) {
              var v = props[k];
              if (v != null && v !== '') summaryParts.push(k + ': ' + v);
            });
            var selSummary = configForStorage._selected_summary;
            if (Array.isArray(selSummary)) {
              selSummary.forEach(function (row) {
                if (row && row.label != null && row.value != null) {
                  summaryParts.push(row.label + ': ' + row.value);
                } else if (typeof row === 'string' && row) {
                  summaryParts.push(row);
                }
              });
            }
            var qtySave = built.qty;
            var productName = resolveLandingProductTitle(container);
            var productSku = (container.getAttribute('data-product-sku') || '').trim();
            var productId = container.getAttribute('data-product-id') || '';
            var productHandle = container.getAttribute('data-product-handle') || '';
            var appliedLineTotal = (built.unitPrice || 0) * (qtySave || 1);
            var currency = (window.Shopify && window.Shopify.currency && window.Shopify.currency.active)
              ? window.Shopify.currency.active
              : 'USD';
            landingHubspot.syncAfterSave({
              container: container,
              email: email,
              savedProjectName: savedProjectName,
              config: configForStorage,
              configForStorage: configForStorage,
              props: props,
              summaryParts: summaryParts,
              qtySave: qtySave,
              productSku: productSku,
              basePrice: basePrice,
              productId: productId,
              productHandle: productHandle,
              productName: productName,
              appliedLineTotal: appliedLineTotal,
              currency: currency,
              isUpdate: isUpdate,
              editId: editId,
              data: data,
              messageEl: messageEl,
              saveButton: saveButton,
              originalSaveText: container.getAttribute('data-edit-config-id') ? 'Update configuration' : originalText,
              getQueryParam: getQueryParam
            });
          }
          if (getQueryParam('autosave') === '1') {
            try { localStorage.removeItem(AUTOSAVE_KEY); } catch (eClr) {}
          }
        })
        .catch(function () {
          if (messageEl) {
            messageEl.style.display = 'block';
            messageEl.style.color = '#b91c1c';
            messageEl.textContent = 'Could not save configuration. Please try again.';
          }
        })
        .finally(function () {
          saveButton.disabled = false;
          if (saveButton.textContent === 'Saving...') {
            saveButton.textContent = container.getAttribute('data-edit-config-id') ? 'Update configuration' : originalText;
          }
        });
    });
  }

  function buildConfigReturnUrl() {
    var path = window.location.pathname || '/';
    var pairs = [];
    var seen = {};
    var raw = (window.location.search || '').replace(/^\?/, '');
    if (raw) {
      raw.split('&').forEach(function (part) {
        if (!part) return;
        var key = decodeURIComponent((part.split('=')[0] || ''));
        if (!key || key === 'door_post_login' || key === 'door_from_profile') return;
        if (seen[key]) return;
        seen[key] = true;
        pairs.push(part);
      });
    }
    pairs = pairs.filter(function (part) {
      var k = part.split('=')[0];
      return k !== 'autosave';
    });
    pairs.push('autosave=1');
    return path + (pairs.length ? '?' + pairs.join('&') : '?autosave=1');
  }

  function storeConfigReturnUrls() {
    var relative = buildConfigReturnUrl();
    var absolute = window.location.origin + (relative.charAt(0) === '/' ? relative : '/' + relative);
    try {
      localStorage.setItem('door_config_return_url', absolute);
      localStorage.setItem('door_config_return_path', relative);
    } catch (e) {}
  }

  function persistAutosavePayload(container, folderSelect, newFolderInput) {
    syncLandingQtyToForms();
    var built = buildSavePayload(container);
    var folder = resolveFolderSelection(folderSelect, newFolderInput);
    try {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({
        source: 'landing',
        options: built.config,
        folderValue: folder.folderValue,
        newFolderName: newFolderInput ? newFolderInput.value : '',
        productId: container.getAttribute('data-product-id') || ''
      }));
    } catch (e) {}
  }

  function isLandingLoggedIn(container) {
    container = container || getContainer();
    if (!container) return false;
    var email = (container.getAttribute('data-customer-email') || '').trim();
    if (email) return true;
    var emailInput = document.getElementById('door-customer-email');
    return !!(emailInput && emailInput.value.trim());
  }

  function syncLandingAuthUi(container) {
    container = container || getContainer();
    if (!container) return;
    var loggedIn = isLandingLoggedIn(container);
    var guest = document.querySelector('[data-landing-save-guest="1"]');
    var member = document.querySelector('[data-landing-save-logged-in="1"]');
    if (guest) guest.classList.toggle('door-hidden', loggedIn);
    if (member) member.classList.toggle('door-hidden', !loggedIn);
  }

  function isLandingProfileComplete(container) {
    if (!container) return false;
    try {
      if (sessionStorage.getItem('door_profile_form_done') === '1') return true;
    } catch (eSess) {}
    if (container.getAttribute('data-profile-complete') === '1') return true;
    var first = (container.getAttribute('data-customer-first-name') || '').trim();
    var phone = (container.getAttribute('data-customer-phone') || '').trim();
    var zip = (container.getAttribute('data-customer-zip') || '').trim();
    return first !== '' && phone !== '' && zip !== '';
  }

  function getCompleteProfilePageUrl(container) {
    var path = (container && container.getAttribute('data-complete-profile-page-url')) || '/pages/complete-profile';
    path = String(path || '').trim();
    if (!path) path = '/pages/complete-profile';
    if (path.indexOf('http') === 0) return path;
    return window.location.origin + (path.charAt(0) === '/' ? path : '/' + path);
  }

  function showDoorReturnedNote() {
    var note = document.getElementById('door-returned-from-login-note');
    if (!note) return;
    note.style.display = '';
    try { note.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (eScroll) {}
  }

  function runLandingAuthReturnFlow(container) {
    container = container || getContainer();
    if (!container) return;

    var custEmail = (container.getAttribute('data-customer-email') || '').trim();
    var emailInput = document.getElementById('door-customer-email');
    if (!custEmail && emailInput) custEmail = emailInput.value.trim();
    if (!custEmail) return;

    syncLandingAuthUi(container);

    var postLogin = getQueryParam('door_post_login') === '1';
    var autosave = getQueryParam('autosave') === '1';
    var profileComplete = isLandingProfileComplete(container);
    var returnUrl = buildConfigReturnUrl();
    var returnAbsolute = window.location.origin + (returnUrl.charAt(0) === '/' ? returnUrl : '/' + returnUrl);
    var completeProfileUrl = getCompleteProfilePageUrl(container);

    if (postLogin && !autosave) {
      if (!profileComplete) {
        try { sessionStorage.setItem('door_pending_profile', '1'); } catch (ePending) {}
        window.location.replace(completeProfileUrl);
        return;
      }
      window.location.replace(returnUrl);
      return;
    }

    var pendingProfile = false;
    try { pendingProfile = sessionStorage.getItem('door_pending_profile') === '1'; } catch (ePend) {}
    if (pendingProfile && profileComplete && !autosave) {
      var storedPath = '';
      try { storedPath = localStorage.getItem('door_config_return_path') || returnUrl; } catch (ePath) { storedPath = returnUrl; }
      var current = window.location.pathname + window.location.search;
      if (storedPath && current !== storedPath && current.indexOf('autosave=1') === -1) {
        window.location.replace(storedPath);
        return;
      }
    }

    if (autosave) {
      var folderSelect = document.getElementById('door-save-folder');
      var newFolderInput = document.getElementById('door-new-folder-name');
      restoreFromAutosave(container, folderSelect, newFolderInput, function (restored) {
        if (restored) {
          showDoorReturnedNote();
          try { sessionStorage.removeItem('door_pending_profile'); } catch (eClr) {}
        }
      });
    }
  }

  function bindLandingProfileReturnWatcher() {
    if (window.__landingProfileReturnWatcherBound) return;
    window.__landingProfileReturnWatcherBound = true;
    var reloaded = false;
    function maybeReloadForProfileComplete() {
      if (reloaded) return;
      try {
        if (sessionStorage.getItem('door_pending_profile') !== '1') return;
      } catch (e) { return; }
      reloaded = true;
      window.location.reload();
    }
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') maybeReloadForProfileComplete();
    });
    window.addEventListener('pageshow', function (ev) {
      if (ev && ev.persisted) maybeReloadForProfileComplete();
    });
  }

  function bindLoginLink(container, folderSelect, newFolderInput) {
    var loginLink = document.getElementById('door-login-to-save');
    if (!loginLink || loginLink.getAttribute('data-landing-login-bound') === '1') return;
    loginLink.setAttribute('data-landing-login-bound', '1');
    loginLink.addEventListener('click', function () {
      storeConfigReturnUrls();
      persistAutosavePayload(container, folderSelect, newFolderInput);
    });
  }

  function restoreFromAutosave(container, folderSelect, newFolderInput, done) {
    var raw = null;
    try { raw = localStorage.getItem(AUTOSAVE_KEY); } catch (e) {}
    if (!raw) {
      if (done) done(false);
      return;
    }
    var saved = null;
    try { saved = JSON.parse(raw); } catch (eP) {}
    if (!saved || !saved.options) {
      if (done) done(false);
      return;
    }
    applySavedOptionsToLanding(saved.options);
    if (folderSelect && saved.folderValue) {
      folderSelect.value = saved.folderValue;
      if (newFolderInput) {
        newFolderInput.classList.toggle('door-visible', folderSelect.value === '__new__');
        newFolderInput.style.display = folderSelect.value === '__new__' ? '' : 'none';
      }
    }
    if (newFolderInput && saved.newFolderName) newFolderInput.value = saved.newFolderName;
    var note = document.getElementById('door-returned-from-login-note');
    if (note) note.style.display = '';
    if (done) done(true);
  }

  function loadSavedConfigForEdit(container, apiBase, folderSelect, newFolderInput) {
    var configId = getQueryParam('config_id');
    var emailParam = getQueryParam('email');
    var email = (emailParam || container.getAttribute('data-customer-email') || '').trim();
    if (!configId || !email) return;

    container.setAttribute('data-edit-config-id', configId);
    var saveBtn = document.getElementById('door-save-config-button');
    if (saveBtn) saveBtn.textContent = 'Update configuration';

    fetch(apiBase + '/api/configurations.php?id=' + encodeURIComponent(configId) + '&email=' + encodeURIComponent(email))
      .then(function (r) { return r.json(); })
      .then(function (c) {
        if (!c || c.error) return;
        applySavedOptionsToLanding(c.options || {});
        if (folderSelect && c.folder_id) {
          loadFoldersIntoSelect(apiBase, email, folderSelect, function () {
            folderSelect.value = String(c.folder_id);
          });
        }
      })
      .catch(function () {});
  }

  function preventCartSubmit() {
    $all('form.millwork-form').forEach(function (form) {
      if (form.getAttribute('data-landing-cart-blocked') === '1') return;
      form.setAttribute('data-landing-cart-blocked', '1');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        return false;
      });
    });
  }

  function bindLandingQtySync() {
    var landingQty = document.getElementById('landing-config-quantity');
    if (!landingQty || landingQty.getAttribute('data-landing-qty-bound') === '1') return;
    landingQty.setAttribute('data-landing-qty-bound', '1');
    landingQty.addEventListener('change', syncLandingQtyToForms);
    landingQty.addEventListener('input', syncLandingQtyToForms);
    var wrap = landingQty.closest('.landing-product-qty-row');
    if (wrap) {
      wrap.querySelectorAll('.qty-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          setTimeout(syncLandingQtyToForms, 0);
        });
      });
    }
    syncLandingQtyToForms();
  }

  function boot() {
    var container = getContainer();
    if (!container) return;

    preventCartSubmit();
    bindLandingQtySync();
    syncLandingAuthUi(container);
    bindLandingProfileReturnWatcher();

    var apiBase = getApiBase(container);
    var folderSelect = document.getElementById('door-save-folder');
    var newFolderInput = document.getElementById('door-new-folder-name');
    bindFolderSelect(folderSelect, newFolderInput);
    bindLoginLink(container, folderSelect, newFolderInput);

    var landingHubspot = null;
    if (isLandingLoggedIn(container) && window.DoorConf2Update && typeof window.DoorConf2Update.bootHubspotIntegration === 'function') {
      landingHubspot = window.DoorConf2Update.bootHubspotIntegration({
        apiBase: apiBase,
        folderSelect: folderSelect,
        newFolderInput: newFolderInput,
        getCurrentConfig: function () { return getCurrentLandingConfig(container); },
        calculateDoorPrice: function (base, cfg) {
          var unit = (cfg && cfg._applied_unit_price) || readLandingPriceFromDom() || base;
          return { price: unit };
        },
        readDoorEstimatedPriceFromDom: readLandingPriceFromDom,
        getLineItemPropertiesFromSchema: getLineItemPropertiesFromLanding,
        getHardwareSelectionsForConfig: getHardwareSelectionsForLanding
      });
      var hubBtn = document.getElementById('door-send-to-hubspot-button');
      if (hubBtn) hubBtn.textContent = 'Request a Quote';
    }

    if (isLandingLoggedIn(container)) {
      bindSaveButton(container, apiBase, folderSelect, newFolderInput, landingHubspot);
      runLandingAuthReturnFlow(container);

      var email = (container.getAttribute('data-customer-email') || '').trim();
      var emailInput = document.getElementById('door-customer-email');
      if (!email && emailInput) email = emailInput.value.trim();
      if (email && folderSelect) {
        loadFoldersIntoSelect(apiBase, email, folderSelect);
      }

      if (getQueryParam('config_id')) {
        loadSavedConfigForEdit(container, apiBase, folderSelect, newFolderInput);
      } else if (getQueryParam('autosave') === '1') {
        restoreFromAutosave(container, folderSelect, newFolderInput, function (restored) {
          if (restored) showDoorReturnedNote();
        });
      }
    }
  }

  window.LandingProductSave = {
    getCurrentLandingConfig: getCurrentLandingConfig,
    readLandingPriceFromDom: readLandingPriceFromDom,
    applySavedOptionsToLanding: applySavedOptionsToLanding
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
