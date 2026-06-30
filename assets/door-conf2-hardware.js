/**
 * door-conf2-hardware.js — Hardware picker, suggested products, div-select dropdowns.
 * Loaded by door-config2-snippet.liquid before door-conf2.js.
 */
(function () {
  var deps = {};

  function all(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function updateEstimatedPrice() {
    try {
      if (typeof deps.updateEstimatedPrice === 'function') deps.updateEstimatedPrice();
    } catch (eHwPrice) {}
  }

  function resolveChoiceImageSrc(choice) {
    if (typeof deps.resolveChoiceImageSrc === 'function') return deps.resolveChoiceImageSrc(choice);
    return null;
  }

  function formatMoney(amount) {
    if (typeof deps.formatMoney === 'function') return deps.formatMoney(amount);
    return String(amount == null ? '' : amount);
  }
  function readRecommendedHardwareProducts() {
    try {
      var jsonEl = document.getElementById('door-recommended-hardware-products');
      if (jsonEl && jsonEl.textContent) {
        var parsed = JSON.parse(jsonEl.textContent.trim());
        return Array.isArray(parsed) ? parsed : [];
      }
      var root = document.getElementById('door-configurator');
      if (root) {
        var raw = root.getAttribute('data-recommended-hardware-products');
        if (raw) {
          var parsed2 = JSON.parse(raw);
          return Array.isArray(parsed2) ? parsed2 : [];
        }
      }
    } catch (eRecHw) {}
    return [];
  }

  function hideLegacyRecommendedProductsBlock() {
    var selectors = [
      '.door-recommended-products',
      '.door-recommended-products-section',
      '[data-door-recommended-products]',
      '.recommended-products--door-configurator',
      '#door-recommended-products-below'
    ];
    selectors.forEach(function (sel) {
      try {
        all(sel).forEach(function (el) {
          el.style.display = 'none';
          el.setAttribute('aria-hidden', 'true');
        });
      } catch (eHide) {}
    });
  }

  /* ===== DOOR HARDWARE PRODUCTS (related + finish + multi-qty) — MERGE START ===== */

  function normHardwareChoiceSlug(s) {
    return String(s == null ? '' : s).toLowerCase().replace(/-/g, '_').replace(/\s+/g, '_').trim();
  }

  function hardwareChoiceAllowListConfigured(raw) {
    if (raw == null) return false;
    return String(raw).trim() !== '';
  }

  function parseHardwareChoiceAllowList(raw) {
    if (!hardwareChoiceAllowListConfigured(raw)) return null;
    return String(raw).trim().split(',').map(normHardwareChoiceSlug).filter(Boolean);
  }

  function filterConfigOptionByAllowList(configOpt, allowList) {
    if (!configOpt || !Array.isArray(configOpt.options)) return configOpt;
    if (!allowList || !allowList.length) return configOpt;
    var filtered = configOpt.options.filter(function (choice) {
      if (!choice) return false;
      var v = normHardwareChoiceSlug(choice.value);
      return v && allowList.indexOf(v) !== -1;
    });
    return { id: configOpt.id, label: configOpt.label, options: filtered };
  }

  var HW_SELECT_FIELD_DEFS = [
    { optKey: 'functionOption', allowKey: 'hardware_function_allow', requireAllow: true, mod: 'function', selectClass: 'door-suggested-hardware-function', dataSelect: 'data-hw-function-select', dataValue: 'data-hw-function-value', dataLabel: 'data-hw-function-label', defaultLabel: 'Hardware Function', storeValue: 'function_value', storeLabel: 'function_label' },
    { optKey: 'closerColorOption', allowKey: 'closer_color_allow', requireAllow: false, mod: 'closer-color', selectClass: 'door-suggested-hardware-closer-color', dataSelect: 'data-hw-closer-color-select', dataValue: 'data-hw-closer-color-value', dataLabel: 'data-hw-closer-color-label', defaultLabel: 'Closer Color', storeValue: 'closer_color_value', storeLabel: 'closer_color_label' },
    { optKey: 'swingDirectionOption', allowKey: 'swing_direction_allow', requireAllow: false, mod: 'swing-direction', selectClass: 'door-suggested-hardware-swing-direction', dataSelect: 'data-hw-swing-direction-select', dataValue: 'data-hw-swing-direction-value', dataLabel: 'data-hw-swing-direction-label', defaultLabel: 'Swing Direction', storeValue: 'swing_direction_value', storeLabel: 'swing_direction_label' },
    { optKey: 'trackLengthOption', allowKey: 'track_length_allow', requireAllow: false, mod: 'track-length', selectClass: 'door-suggested-hardware-track-length', dataSelect: 'data-hw-track-length-select', dataValue: 'data-hw-track-length-value', dataLabel: 'data-hw-track-length-label', defaultLabel: 'Track Length', storeValue: 'track_length_value', storeLabel: 'track_length_label' },
    { optKey: 'connectedDoorsOption', allowKey: 'connected_doors_allow', requireAllow: false, mod: 'connected-doors', selectClass: 'door-suggested-hardware-connected-doors', dataSelect: 'data-hw-connected-doors-select', dataValue: 'data-hw-connected-doors-value', dataLabel: 'data-hw-connected-doors-label', defaultLabel: 'Number of Connected Doors', storeValue: 'connected_doors_value', storeLabel: 'connected_doors_label' },
    { optKey: 'upperTrackLengthOption', allowKey: 'upper_track_length_allow', requireAllow: false, mod: 'upper-track-length', selectClass: 'door-suggested-hardware-upper-track-length', dataSelect: 'data-hw-upper-track-length-select', dataValue: 'data-hw-upper-track-length-value', dataLabel: 'data-hw-upper-track-length-label', defaultLabel: 'Upper Track Length', storeValue: 'upper_track_length_value', storeLabel: 'upper_track_length_label' },
    { optKey: 'maxDoorSizeOption', allowKey: 'max_door_size_allow', requireAllow: false, mod: 'max-door-size', selectClass: 'door-suggested-hardware-max-door-size', dataSelect: 'data-hw-max-door-size-select', dataValue: 'data-hw-max-door-size-value', dataLabel: 'data-hw-max-door-size-label', defaultLabel: 'Max Door Size', storeValue: 'max_door_size_value', storeLabel: 'max_door_size_label' },
    { optKey: 'carriagePackTypeOption', allowKey: 'carriage_pack_type_allow', requireAllow: false, mod: 'carriage-pack-type', selectClass: 'door-suggested-hardware-carriage-pack-type', dataSelect: 'data-hw-carriage-pack-type-select', dataValue: 'data-hw-carriage-pack-type-value', dataLabel: 'data-hw-carriage-pack-type-label', defaultLabel: 'Carriage Pack Type', storeValue: 'carriage_pack_type_value', storeLabel: 'carriage_pack_type_label' },
    { optKey: 'strapHingeLengthOption', allowKey: 'strap_hinge_length_allow', requireAllow: false, mod: 'strap-hinge-length', selectClass: 'door-suggested-hardware-strap-hinge-length', dataSelect: 'data-hw-strap-hinge-length-select', dataValue: 'data-hw-strap-hinge-length-value', dataLabel: 'data-hw-strap-hinge-length-label', defaultLabel: 'Strap Hinge Length', storeValue: 'strap_hinge_length_value', storeLabel: 'strap_hinge_length_label' }
  ];

  var HW_LIST_FIELD_DEFS = [
    { itemsKey: 'thicknessItems', mod: 'thickness', selectClass: 'door-suggested-hardware-thickness', dataSelect: 'data-hw-thickness-select', dataValue: 'data-hw-thickness-value', dataLabel: 'data-hw-thickness-label', defaultLabel: 'Door Thickness', storeValue: 'thickness_value', storeLabel: 'thickness_label' },
    { itemsKey: 'backsetItems', mod: 'backset', selectClass: 'door-suggested-hardware-backset', dataSelect: 'data-hw-backset-select', dataValue: 'data-hw-backset-value', dataLabel: 'data-hw-backset-label', defaultLabel: 'Door Backset', storeValue: 'backset_value', storeLabel: 'backset_label' }
  ];

  function getFilteredHardwareConfigChoices(configOpt, allowListRaw, requireAllow) {
    if (!configOpt || !Array.isArray(configOpt.options) || !configOpt.options.length) return null;
    if (requireAllow && !hardwareChoiceAllowListConfigured(allowListRaw)) return null;
    var filtered = configOpt;
    if (hardwareChoiceAllowListConfigured(allowListRaw)) {
      filtered = filterConfigOptionByAllowList(configOpt, parseHardwareChoiceAllowList(allowListRaw));
    }
    var visible = (filtered.options || []).filter(function (choice) {
      return choice && choice.value != null && String(choice.value) !== '';
    });
    if (!visible.length) return null;
    return {
      label: filtered.label || configOpt.label,
      choices: visible
    };
  }

  function getPlainHardwareChoices(items) {
    if (!items) return null;
    var list = Array.isArray(items) ? items : String(items).split(',');
    var visible = list.map(function (item) { return String(item == null ? '' : item).trim(); }).filter(Boolean);
    if (!visible.length) return null;
    return visible.map(function (item) {
      return { value: item, label: item };
    });
  }

  function syncHardwareSelectAttrs(cardEl, selectEl, valueAttr, labelAttr) {
    if (!cardEl || !selectEl || selectEl.selectedIndex < 0) return;
    var opt = selectEl.options[selectEl.selectedIndex];
    if (!opt) return;
    cardEl.setAttribute(valueAttr, String(opt.value || ''));
    cardEl.setAttribute(labelAttr, String(opt.textContent || '').trim());
  }

  function readHardwareSelectAttrsFromBlock(block, selectEl, valueAttr, labelAttr, storeValue, storeLabel) {
    var val = String(block.getAttribute(valueAttr) || '');
    var lbl = String(block.getAttribute(labelAttr) || '');
    if (selectEl && selectEl.options && selectEl.selectedIndex >= 0) {
      var opt = selectEl.options[selectEl.selectedIndex];
      if (opt) {
        val = String(opt.value || val);
        lbl = String(opt.textContent || '').trim() || lbl;
      }
    }
    var out = {};
    out[storeValue] = val;
    out[storeLabel] = lbl;
    return out;
  }

  function readHardwareSelectChoicesFromBlock(block, selectClass, dataSelectAttr) {
    var sel = block.querySelector('select.' + selectClass + ', select[' + dataSelectAttr + ']');
    if (!sel || !sel.options) return [];
    var out = [];
    for (var i = 0; i < sel.options.length; i++) {
      var opt = sel.options[i];
      if (!opt) continue;
      var v = String(opt.value || '');
      var l = String(opt.textContent || '').trim();
      if (!v && !l) continue;
      out.push({ value: v || l, label: l || v });
    }
    return out;
  }

  function readHardwareFinishChoicesFromBlock(block) {
    var swatches = block.querySelectorAll('.door-suggested-hardware-swatch[data-finish-value]');
    if (!swatches.length) return [];
    var out = [];
    swatches.forEach(function (sw) {
      var v = String(sw.getAttribute('data-finish-value') || '');
      var l = String(
        sw.getAttribute('data-finish-label') || sw.getAttribute('title') || sw.getAttribute('aria-label') || sw.getAttribute('data-finish-value') || ''
      ).trim();
      if (!v && !l) return;
      out.push({ value: v || l, label: l || v });
    });
    return out;
  }

  function attachHardwareAdminOptionMetadata(row, block) {
    if (!row || !block) return row;
    try {
      var finishChoices = readHardwareFinishChoicesFromBlock(block);
      if (finishChoices.length) row.finish_options = finishChoices;
      var functionChoices = readHardwareSelectChoicesFromBlock(block, 'door-suggested-hardware-function', 'data-hw-function-select');
      if (functionChoices.length) row.function_options = functionChoices;
      var thicknessChoices = readHardwareSelectChoicesFromBlock(block, 'door-suggested-hardware-thickness', 'data-hw-thickness-select');
      if (thicknessChoices.length) row.thickness_options = thicknessChoices;
      var priceEl = block.querySelector('[data-hw-price]');
      if (priceEl) {
        var priceText = String(priceEl.textContent || '').trim();
        if (priceText) row.price_formatted = priceText;
      }
    } catch (eHwMeta) {}
    return row;
  }

  function readHardwareSelectionsJsonEl() {
    return document.getElementById('door-hardware-selections-json');
  }

  function writeHardwareSelectionsStore(list) {
    var el = readHardwareSelectionsJsonEl();
    if (!el) return;
    try { el.textContent = JSON.stringify(Array.isArray(list) ? list : []); } catch (eJson) {}
    try { window.__doorHardwareSelections = Array.isArray(list) ? list.slice() : []; } catch (eWin) {}
  }

  function readHardwareSelectionsStore() {
    if (Array.isArray(window.__doorHardwareSelections)) return window.__doorHardwareSelections.slice();
    var el = readHardwareSelectionsJsonEl();
    if (!el || !el.textContent) return [];
    try {
      var parsed = JSON.parse(el.textContent.trim());
      return Array.isArray(parsed) ? parsed : [];
    } catch (eParse) {
      return [];
    }
  }

  function buildHardwareSelectionFromBlock(block) {
    if (!block) return null;
    var productId = String(block.getAttribute('data-product-id') || block.getAttribute('data-choice-value') || '');
    if (!productId) return null;
    var qtyInput = block.querySelector('.door-suggested-hardware-qty-wrap input[name="quantity"], .door-hw-qty-input, input[name="quantity"]');
    var qty = qtyInput ? parseInt(qtyInput.value, 10) : 1;
    if (isNaN(qty) || qty < 1) qty = 1;
    var titleEl = block.querySelector('.door-suggested-hardware-card__title, .door-hw-product__title, .common-check-option-label');
    var imgEl = block.querySelector('.door-suggested-hardware-card__image img, .door-suggested-hardware-card__media img, .door-hw-product__media img');
    var check = block.querySelector('input[data-hw-selection-checkbox], input[data-option-id="hardware_options"]');
    var finishSwatch = block.querySelector('.door-suggested-hardware-swatch--selected');
    var finishVal = String(block.getAttribute('data-hw-finish-value') || '');
    var finishLbl = String(block.getAttribute('data-hw-finish-label') || '');
    if (finishSwatch) {
      finishVal = String(finishSwatch.getAttribute('data-finish-value') || finishVal);
      finishLbl = String(finishSwatch.getAttribute('title') || finishSwatch.getAttribute('data-finish-value') || finishLbl);
    }
    var row = {
      product_id: productId,
      handle: String(block.getAttribute('data-product-handle') || ''),
      title: titleEl ? String(titleEl.textContent || '').trim() : '',
      url: check ? String(check.getAttribute('data-product-url') || '') : '',
      variant_id: String(block.getAttribute('data-variant-id') || ''),
      image: imgEl ? String(imgEl.getAttribute('src') || '') : '',
      finish_value: finishVal,
      finish_label: finishLbl,
      qty: qty
    };

    HW_SELECT_FIELD_DEFS.forEach(function (fieldDef) {
      var sel = block.querySelector('select.' + fieldDef.selectClass + ', select[' + fieldDef.dataSelect + ']');
      var attrs = readHardwareSelectAttrsFromBlock(block, sel, fieldDef.dataValue, fieldDef.dataLabel, fieldDef.storeValue, fieldDef.storeLabel);
      row[fieldDef.storeValue] = attrs[fieldDef.storeValue];
      row[fieldDef.storeLabel] = attrs[fieldDef.storeLabel];
    });
    HW_LIST_FIELD_DEFS.forEach(function (fieldDef) {
      var sel = block.querySelector('select.' + fieldDef.selectClass + ', select[' + fieldDef.dataSelect + ']');
      var attrs = readHardwareSelectAttrsFromBlock(block, sel, fieldDef.dataValue, fieldDef.dataLabel, fieldDef.storeValue, fieldDef.storeLabel);
      row[fieldDef.storeValue] = attrs[fieldDef.storeValue];
      row[fieldDef.storeLabel] = attrs[fieldDef.storeLabel];
    });

    attachHardwareAdminOptionMetadata(row, block);

    return row;
  }

  function isCasingSelectionBlock(block) {
    if (!block) return false;
    if (block.closest && block.closest('[data-casing-root="1"], [data-casing-detail="1"], .door-post-lockset-casing-options')) {
      return true;
    }
    if (block.querySelector('input[data-casing-selection-checkbox], select[data-casing-length-select], [data-casing-length-select]')) {
      return true;
    }
    var casingInp = block.querySelector('input[data-option-id="casing_options"]');
    if (casingInp) return true;
    return false;
  }

  function isHardwareSelectionBlock(block) {
    if (!block || isCasingSelectionBlock(block)) return false;
    if (block.classList.contains('door-hardware-product-block--added')) return true;
    var hwInp = block.querySelector('input[data-hw-selection-checkbox][data-option-id="hardware_options"]');
    if (hwInp && String(hwInp.getAttribute('data-option-id') || '') === 'hardware_options') return true;
    if (block.closest && block.closest('[data-hardware-layout="1"], [data-hardware-detail="1"], .door-post-lockset-hardware-options')) {
      return block.classList.contains('door-suggested-hardware-card--added');
    }
    return false;
  }

  function isCasingSelectionRow(row) {
    if (!row || typeof row !== 'object') return false;
    var title = String(row.title || row.sku || '');
    if (/\bcasing\b/i.test(title) || /\bCT\d+\b/i.test(title) || /\bEC\d+\b/i.test(title)) return true;
    var hasLength = !!(row.length_label || row.length_value);
    var hasFinish = !!(row.finish_label || row.finish_value);
    var hasThick = !!(row.thickness_label || row.thickness_value);
    if (hasLength && !hasFinish && !hasThick) return true;
    var fn = String(row.function_label || row.function_value || '');
    if (fn && !hasFinish && !hasThick && /^\d+(?:\s*\/\s*\d+)?\s*'?\s*$/.test(fn)) return true;
    return false;
  }

  function syncHardwareSelectionsFromDom() {
    var list = [];
    all('.door-suggested-hardware-card--added, .door-hardware-product-block--added').forEach(function (block) {
      if (!isHardwareSelectionBlock(block)) return;
      var row = buildHardwareSelectionFromBlock(block);
      if (row && !isCasingSelectionRow(row)) list.push(row);
    });
    writeHardwareSelectionsStore(list);
    return list;
  }

  function getHardwareSelectionsForConfig() {
    return syncHardwareSelectionsFromDom();
  }

  function ensureHardwareGridWrap(parentEl) {
    if (!parentEl) return null;
    var wrap = parentEl.querySelector('.door-hardware-options-grid-wrap[data-hardware-grid="1"]');
    if (wrap) return wrap;
    wrap = document.createElement('div');
    wrap.className = 'door-hardware-options-grid-wrap';
    wrap.setAttribute('data-hardware-grid', '1');
    parentEl.insertBefore(wrap, parentEl.firstChild || null);
    return wrap;
  }

  function appendSuggestedHardwareFinishSwatches(cardEl, finishOpt, productId, allowListRaw) {
    if (!cardEl || !finishOpt || !hardwareChoiceAllowListConfigured(allowListRaw)) return;
    var filtered = filterConfigOptionByAllowList(finishOpt, parseHardwareChoiceAllowList(allowListRaw));
    if (!filtered || !Array.isArray(filtered.options) || !filtered.options.length) return;

    var finishWrap = document.createElement('div');
    finishWrap.className = 'door-suggested-hardware-card__finish';

    var finishLabel = document.createElement('span');
    finishLabel.className = 'door-suggested-hardware-card__finish-label';
    finishLabel.innerHTML = String(filtered.label || 'Finish') + ':<span class="door-suggested-hardware-card__finish-name" data-finish-label></span>';

    var swatches = document.createElement('div');
    swatches.className = 'door-suggested-hardware-card__swatches';
    swatches.setAttribute('role', 'list');

    var visibleChoices = filtered.options.filter(function (c) {
      return c && c.value != null && String(c.value) !== '';
    });
    if (!visibleChoices.length) return;

    var nameEl = finishLabel.querySelector('[data-finish-label]');
    var firstChoice = visibleChoices[0];
    if (nameEl) nameEl.textContent = firstChoice.label || firstChoice.value || '';

    visibleChoices.forEach(function (choice, idx) {
      var choiceVal = String(choice.value);
      var swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = 'door-suggested-hardware-swatch' + (idx === 0 ? ' door-suggested-hardware-swatch--selected' : '');
      swatch.setAttribute('role', 'listitem');
      swatch.setAttribute('data-finish-value', choiceVal);
      swatch.setAttribute('data-finish-label', choice.label || choiceVal);
      swatch.title = choice.label || choiceVal;
      swatch.setAttribute('aria-label', choice.label || choiceVal);
      var chip = document.createElement('span');
      chip.className = 'door-suggested-hardware-swatch__chip';
      var imgSrc = resolveChoiceImageSrc(choice);
      if (imgSrc) {
        var chipImg = document.createElement('img');
        chipImg.className = 'door-suggested-hardware-swatch__img';
        chipImg.src = String(imgSrc);
        chipImg.alt = choice.label || choiceVal;
        chipImg.loading = 'lazy';
        chip.appendChild(chipImg);
      } else {
        chip.style.backgroundColor = 'rgb(150 150 150)';
      }
      swatch.appendChild(chip);
      swatch.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        swatches.querySelectorAll('.door-suggested-hardware-swatch').forEach(function (s) {
          s.classList.remove('door-suggested-hardware-swatch--selected');
        });
        swatch.classList.add('door-suggested-hardware-swatch--selected');
        if (nameEl) nameEl.textContent = choice.label || choiceVal;
        cardEl.setAttribute('data-hw-finish-value', choiceVal);
        cardEl.setAttribute('data-hw-finish-label', choice.label || choiceVal);
        if (cardEl.classList.contains('door-suggested-hardware-card--added')) syncHardwareSelectionsFromDom();
        try { updateEstimatedPrice(); } catch (eHwFin) {}
      });
      swatches.appendChild(swatch);
    });

    finishWrap.appendChild(finishLabel);
    finishWrap.appendChild(swatches);
    cardEl.setAttribute('data-hw-finish-value', String(firstChoice.value || ''));
    cardEl.setAttribute('data-hw-finish-label', String(firstChoice.label || firstChoice.value || ''));
    return finishWrap;
  }

  function appendSuggestedHardwareHwSelectField(cardEl, fieldDef, choices, labelText, productId) {
    if (!cardEl || !fieldDef || !Array.isArray(choices) || !choices.length) return null;

    var firstChoice = choices[0];
    var firstVal = String(firstChoice.value || '');
    var firstLabel = firstChoice.label || firstVal;
    var selectId = 'door-hw-' + fieldDef.mod + '-' + String(productId).replace(/\D/g, '');

    var wrap = document.createElement('div');
    wrap.className = 'door-suggested-hardware-card__hw-field door-suggested-hardware-card__' + fieldDef.mod;

    var lbl = document.createElement('label');
    lbl.className = 'door-suggested-hardware-card__hw-label door-suggested-hardware-card__' + fieldDef.mod + '-label';
    lbl.setAttribute('for', selectId);
    lbl.id = selectId + '-label';
    lbl.textContent = String(labelText || fieldDef.defaultLabel || '');

    var sel = document.createElement('select');
    sel.id = selectId;
    sel.className = 'door-input-select door-suggested-hardware-card__hw-select door-suggested-hardware-card__' + fieldDef.mod + '-select ' + fieldDef.selectClass;
    sel.setAttribute(fieldDef.dataSelect, '1');
    sel.setAttribute('aria-labelledby', selectId + '-label');

    choices.forEach(function (choice) {
      var op = document.createElement('option');
      op.value = String(choice.value || '');
      op.textContent = choice.label || choice.value || '';
      sel.appendChild(op);
    });
    sel.value = firstVal;

    wrap.appendChild(lbl);
    wrap.appendChild(sel);
    cardEl.setAttribute(fieldDef.dataValue, firstVal);
    cardEl.setAttribute(fieldDef.dataLabel, firstLabel);
    return wrap;
  }

  function buildSuggestedHardwareCardFromProduct(p) {
    if (!p) return null;
    var val = String(p.id != null && p.id !== '' ? p.id : (p.handle || ''));
    if (!val) return null;

    var card = document.createElement('article');
    card.className = 'door-suggested-hardware-card common-check-option door-hardware-option-card';
    card.setAttribute('data-choice-value', val);
    card.setAttribute('data-product-id', val);
    if (p.handle) card.setAttribute('data-product-handle', String(p.handle));
    if (p.variant_id != null && p.variant_id !== '') card.setAttribute('data-variant-id', String(p.variant_id));

    var hwCheck = document.createElement('input');
    hwCheck.type = 'checkbox';
    hwCheck.className = 'door-suggested-hardware-card__radio';
    hwCheck.name = 'attributes[Hardware][]';
    hwCheck.value = val;
    hwCheck.setAttribute('data-option-id', 'hardware_options');
    hwCheck.setAttribute('data-hw-selection-checkbox', '1');
    if (p.handle) hwCheck.setAttribute('data-product-handle', String(p.handle));
    if (p.url) hwCheck.setAttribute('data-product-url', String(p.url));
    hwCheck.style.position = 'absolute';
    hwCheck.style.opacity = '0';
    hwCheck.style.pointerEvents = 'none';
    card.appendChild(hwCheck);

    var layout = document.createElement('div');
    layout.className = 'door-suggested-hardware-card__layout';

    var media = document.createElement('div');
    media.className = 'door-suggested-hardware-card__media';
    if (p.image) {
      var img = document.createElement('img');
      img.className = 'door-suggested-hardware-card__image';
      img.loading = 'lazy';
      img.alt = p.title || p.label || '';
      img.src = String(p.image);
      media.appendChild(img);
    } else {
      var ph = document.createElement('span');
      ph.className = 'door-suggested-hardware-card__image door-suggested-hardware-card__image--placeholder';
      ph.setAttribute('role', 'img');
      ph.setAttribute('aria-label', p.title || p.label || 'Hardware');
      media.appendChild(ph);
    }
    layout.appendChild(media);

    var details = document.createElement('div');
    details.className = 'door-suggested-hardware-card__details';

    var titleEl = document.createElement('h3');
    titleEl.className = 'door-suggested-hardware-card__title common-check-option-label p-large';
    titleEl.textContent = p.title || p.label || 'Hardware';
    details.appendChild(titleEl);

    var finishRow = p.finishOption && hardwareChoiceAllowListConfigured(p.hardware_finish_allow)
      ? appendSuggestedHardwareFinishSwatches(card, p.finishOption, val, p.hardware_finish_allow)
      : null;
    if (finishRow) details.appendChild(finishRow);

    HW_SELECT_FIELD_DEFS.forEach(function (fieldDef) {
      var filtered = getFilteredHardwareConfigChoices(
        p[fieldDef.optKey],
        p[fieldDef.allowKey],
        fieldDef.requireAllow
      );
      if (!filtered) return;
      var row = appendSuggestedHardwareHwSelectField(card, fieldDef, filtered.choices, filtered.label || fieldDef.defaultLabel, val);
      if (row) details.appendChild(row);
    });

    HW_LIST_FIELD_DEFS.forEach(function (fieldDef) {
      var choices = getPlainHardwareChoices(p[fieldDef.itemsKey]);
      if (!choices) return;
      var row = appendSuggestedHardwareHwSelectField(card, fieldDef, choices, fieldDef.defaultLabel, val);
      if (row) details.appendChild(row);
    });

    var footer = document.createElement('div');
    footer.className = 'door-suggested-hardware-card__footer';

    var priceP = document.createElement('p');
    priceP.className = 'door-suggested-hardware-card__price';
    var priceText = p.price_formatted
      ? String(p.price_formatted)
      : (p.price_cents != null ? formatMoney(Number(p.price_cents) / 100) : '');
    priceP.innerHTML = '<span data-hw-price>' + (priceText || '') + '</span>' + (priceText ? ' as configured' : '');
    footer.appendChild(priceP);

    var actions = document.createElement('div');
    actions.className = 'door-suggested-hardware-card__actions';

    var qtyWrap = document.createElement('div');
    qtyWrap.className = 'door-suggested-hardware-qty-wrap select-mdiv common-qty qty-small';
    qtyWrap.innerHTML = '<label class="qty-label">QTY</label><div class="qty-block"><div class="qty-wrapper"><button type="button" class="qty-btn minus" aria-label="Decrease quantity">-</button><input type="number" name="quantity" min="1" max="99" value="1" inputmode="numeric" aria-label="Quantity"><button type="button" class="qty-btn plus" aria-label="Increase quantity">+</button></div></div>';
    actions.appendChild(qtyWrap);

    var removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'door-suggested-hardware-remove-btn btn-woodDust common-btn common-remove-btn btn-small';
    removeBtn.setAttribute('aria-label', 'Remove hardware');
    removeBtn.innerHTML = 'Remove <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10.6667 4.00065V3.46732C10.6667 2.72058 10.6667 2.34721 10.5213 2.062C10.3935 1.81111 10.1895 1.60714 9.93865 1.47931C9.65344 1.33398 9.28007 1.33398 8.53333 1.33398H7.46667C6.71993 1.33398 6.34656 1.33398 6.06135 1.47931C5.81046 1.60714 5.60649 1.81111 5.47866 2.062C5.33333 2.34721 5.33333 2.72058 5.33333 3.46732V4.00065M6.66667 7.66732V11.0007M9.33333 7.66732V11.0007M2 4.00065H14M12.6667 4.00065V11.4673C12.6667 12.5874 12.6667 13.1475 12.4487 13.5753C12.2569 13.9516 11.951 14.2576 11.5746 14.4493C11.1468 14.6673 10.5868 14.6673 9.46667 14.6673H6.53333C5.41323 14.6673 4.85318 14.6673 4.42535 14.4493C4.04903 14.2576 3.74307 13.9516 3.55132 13.5753C3.33333 13.1475 3.33333 12.5874 3.33333 11.4673V4.00065" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    actions.appendChild(removeBtn);

    footer.appendChild(actions);
    details.appendChild(footer);
    layout.appendChild(details);
    card.appendChild(layout);
    return card;
  }

  /* ===== DOOR HARDWARE PRODUCTS — MERGE END ===== */

  function getSelectOptionDisplayLabel(opt) {
    if (!opt) return '';
    return String(opt.textContent || opt.label || opt.value || '').trim();
  }

  function closeDoorDivSelect(divWrap) {
    if (!divWrap) return;
    divWrap.classList.remove('door-div-select--open');
    var btn = divWrap.querySelector('.door-div-select__btn');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  function closeAllDoorDivSelects(exceptWrap) {
    var root = document.getElementById('door-configurator') || document;
    root.querySelectorAll('.door-div-select--open').forEach(function (el) {
      if (exceptWrap && el === exceptWrap) return;
      closeDoorDivSelect(el);
    });
  }

  function syncDoorDivSelectFromNative(selectEl, divWrap) {
    if (!selectEl || !divWrap) return;
    var labelEl = divWrap.querySelector('.door-div-select__label');
    var list = divWrap.querySelector('.door-div-select__list');
    var opt = selectEl.options[selectEl.selectedIndex];
    var val = opt ? String(opt.value) : '';
    var text = getSelectOptionDisplayLabel(opt);
    if (labelEl) labelEl.textContent = text || val;
    if (list) {
      list.querySelectorAll('.door-div-select__item').forEach(function (item) {
        var match = String(item.getAttribute('data-value') || '') === val;
        item.setAttribute('aria-selected', match ? 'true' : 'false');
      });
    }
  }

  function dispatchSelectChange(selectEl) {
    if (!selectEl) return;
    try {
      selectEl.dispatchEvent(new Event('change', { bubbles: true }));
      selectEl.dispatchEvent(new Event('input', { bubbles: true }));
    } catch (eEv) {
      try {
        var ev = document.createEvent('HTMLEvents');
        ev.initEvent('change', true, false);
        selectEl.dispatchEvent(ev);
      } catch (eEv2) {}
    }
  }

  function enhanceDoorSelectWithDivDropdown(selectEl) {
    if (!selectEl || selectEl.tagName !== 'SELECT') return null;
    if (selectEl.getAttribute('data-door-div-select') === '1') {
      var linked = selectEl.nextElementSibling;
      if (linked && linked.classList && linked.classList.contains('door-div-select')) {
        syncDoorDivSelectFromNative(selectEl, linked);
        return linked;
      }
      return null;
    }

    var existing = selectEl.nextElementSibling;
    if (existing && existing.classList && existing.classList.contains('door-div-select')) {
      selectEl.setAttribute('data-door-div-select', '1');
      selectEl.classList.add('door-native-select--enhanced');
      syncDoorDivSelectFromNative(selectEl, existing);
      return existing;
    }

    selectEl.classList.add('door-native-select--enhanced');
    selectEl.setAttribute('data-door-div-select', '1');

    var divWrap = document.createElement('div');
    divWrap.className = 'door-div-select';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'door-div-select__btn';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    if (selectEl.id) {
      var assocLabel = document.querySelector('label[for="' + selectEl.id + '"]');
      if (assocLabel && assocLabel.id) btn.setAttribute('aria-labelledby', assocLabel.id);
    }

    var labelSpan = document.createElement('span');
    labelSpan.className = 'door-div-select__label';
    btn.appendChild(labelSpan);

    var iconSpan = document.createElement('span');
    iconSpan.className = 'door-div-select__icon';
    iconSpan.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"> <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> </svg>';
    btn.appendChild(iconSpan);

    var list = document.createElement('div');
    list.className = 'door-div-select__list';
    list.setAttribute('role', 'listbox');

    Array.from(selectEl.options || []).forEach(function (opt, idx) {
      if (opt.disabled) return;
      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'door-div-select__item';
      item.setAttribute('role', 'option');
      item.setAttribute('data-value', String(opt.value));
      item.textContent = getSelectOptionDisplayLabel(opt) || String(opt.value);
      item.setAttribute('aria-selected', selectEl.selectedIndex === idx ? 'true' : 'false');
      item.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        selectEl.value = String(opt.value);
        dispatchSelectChange(selectEl);
        syncDoorDivSelectFromNative(selectEl, divWrap);
        closeDoorDivSelect(divWrap);
      });
      list.appendChild(item);
    });

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var willOpen = !divWrap.classList.contains('door-div-select--open');
      closeAllDoorDivSelects(willOpen ? divWrap : null);
      divWrap.classList.toggle('door-div-select--open', willOpen);
      btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });

    selectEl.addEventListener('change', function () {
      syncDoorDivSelectFromNative(selectEl, divWrap);
    });

    divWrap.appendChild(btn);
    divWrap.appendChild(list);
    selectEl.insertAdjacentElement('afterend', divWrap);
    syncDoorDivSelectFromNative(selectEl, divWrap);

    if (!window.__doorDivSelectOutsideBound) {
      window.__doorDivSelectOutsideBound = true;
      document.addEventListener('click', function (e) {
        if (e.target.closest && e.target.closest('.door-div-select')) return;
        closeAllDoorDivSelects();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeAllDoorDivSelects();
      });
    }

    return divWrap;
  }

  function findHardwarePickerInGrid(layoutEl, productId) {
    if (!layoutEl || !productId) return null;
    var pickerGrid = layoutEl.querySelector('[data-hardware-picker-grid="1"]');
    if (!pickerGrid) return null;
    return pickerGrid.querySelector(
      '.door-hardware-picker-option[data-product-id="' + productId + '"], .door-hardware-picker-option[data-choice-value="' + productId + '"]'
    ) || pickerGrid.querySelector(
      '.common-check-option[data-product-id="' + productId + '"], .common-check-option[data-choice-value="' + productId + '"]'
    );
  }

  function hideHardwarePickerInGrid(layoutEl, productId) {
    var picker = findHardwarePickerInGrid(layoutEl, productId);
    if (!picker) return;
    picker.classList.add('common-check-option--selected', 'door-hardware-picker-option--picked');
    picker.hidden = true;
    picker.style.display = 'none';
  }

  function showHardwarePickerInGrid(layoutEl, productId) {
    var picker = findHardwarePickerInGrid(layoutEl, productId);
    if (!picker) return;
    var pickerInput = picker.querySelector('[data-hw-picker-checkbox]');
    if (pickerInput) pickerInput.checked = false;
    picker.classList.remove('common-check-option--selected', 'door-hardware-picker-option--picked');
    picker.hidden = false;
    picker.style.display = '';
  }

  function uncheckHardwarePicker(layoutEl, productId) {
    showHardwarePickerInGrid(layoutEl, productId);
  }

  function bindSuggestedHardwareProductCards(rootEl) {
    if (!rootEl || !rootEl.querySelectorAll) return;
    rootEl.querySelectorAll('.door-suggested-hardware-card').forEach(function (card) {
      if (!card || card.getAttribute('data-hw-card-bound') === '1') return;
      card.setAttribute('data-hw-card-bound', '1');
      var hwInput = card.querySelector('input[data-option-id="hardware_options"]');
      var removeBtn = card.querySelector('.door-suggested-hardware-remove-btn');
      var qtyRoot = card.querySelector('.door-suggested-hardware-qty-wrap');
      var qtyInput = qtyRoot
        ? qtyRoot.querySelector('input[name="quantity"]')
        : card.querySelector('input[name="quantity"]');
      var qtyMinus = qtyRoot
        ? qtyRoot.querySelector('.qty-btn.minus')
        : card.querySelector('.qty-btn.minus');
      var qtyPlus = qtyRoot
        ? qtyRoot.querySelector('.qty-btn.plus')
        : card.querySelector('.qty-btn.plus');
      var finishLabel = card.querySelector('[data-finish-label]');
      var layoutEl = card.closest('[data-hardware-layout="1"]');

      function setAddedState(isAdded) {
        card.classList.toggle('door-suggested-hardware-card--added', !!isAdded);
        card.classList.toggle('common-check-option--selected', !!isAdded);
        if (hwInput) hwInput.checked = !!isAdded;
        if (!isAdded) {
          var pid = String(card.getAttribute('data-product-id') || card.getAttribute('data-choice-value') || '');
          if (layoutEl && pid) {
            uncheckHardwarePicker(layoutEl, pid);
            removeHardwareDetailBox(layoutEl, pid);
          }
        }
        syncHardwareSelectionsFromDom();
        try { updateEstimatedPrice(); } catch (eHwAddedPrice) {}
      }

      card.querySelectorAll('.door-suggested-hardware-swatch').forEach(function (sw) {
        if (sw.getAttribute('data-hw-swatch-bound') === '1') return;
        sw.setAttribute('data-hw-swatch-bound', '1');
        sw.addEventListener('click', function () {
          card.querySelectorAll('.door-suggested-hardware-swatch').forEach(function (s) {
            s.classList.remove('door-suggested-hardware-swatch--selected');
          });
          sw.classList.add('door-suggested-hardware-swatch--selected');
          var fv = sw.getAttribute('data-finish-value') || '';
          var fl = sw.getAttribute('data-finish-label') || sw.getAttribute('title') || sw.getAttribute('aria-label') || fv;
          if (finishLabel) finishLabel.textContent = fl;
          card.setAttribute('data-hw-finish-value', fv);
          card.setAttribute('data-hw-finish-label', fl);
          if (card.classList.contains('door-suggested-hardware-card--added')) syncHardwareSelectionsFromDom();
        });
      });

      function onQtyChange() {
        if (card.classList.contains('door-suggested-hardware-card--added')) syncHardwareSelectionsFromDom();
      }
      if (qtyMinus && qtyInput) {
        qtyMinus.addEventListener('click', function () {
          var n = parseInt(qtyInput.value, 10) || 1;
          var min = parseInt(qtyInput.getAttribute('min'), 10) || 1;
          if (n > min) qtyInput.value = String(n - 1);
          onQtyChange();
        });
      }
      if (qtyPlus && qtyInput) {
        qtyPlus.addEventListener('click', function () {
          var n = parseInt(qtyInput.value, 10) || 1;
          var max = parseInt(qtyInput.getAttribute('max'), 10) || 99;
          if (n < max) qtyInput.value = String(n + 1);
          onQtyChange();
        });
      }
      if (qtyInput) {
        qtyInput.addEventListener('change', onQtyChange);
        qtyInput.addEventListener('input', onQtyChange);
      }
      if (removeBtn) {
        removeBtn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          setAddedState(false);
        });
      }
      if (card.closest('[data-hardware-detail="1"]')) setAddedState(true);
      else if (hwInput && hwInput.checked) setAddedState(true);

      HW_SELECT_FIELD_DEFS.concat(HW_LIST_FIELD_DEFS).forEach(function (fieldDef) {
        var sel = card.querySelector('select.' + fieldDef.selectClass + ', select[' + fieldDef.dataSelect + ']');
        if (!sel || sel.getAttribute('data-hw-select-bound') === '1') return;
        sel.setAttribute('data-hw-select-bound', '1');
        sel.addEventListener('change', function () {
          syncHardwareSelectAttrs(card, sel, fieldDef.dataValue, fieldDef.dataLabel);
          if (card.classList.contains('door-suggested-hardware-card--added')) syncHardwareSelectionsFromDom();
          try { updateEstimatedPrice(); } catch (eHwSelPrice) {}
        });
        enhanceDoorSelectWithDivDropdown(sel);
        syncHardwareSelectAttrs(card, sel, fieldDef.dataValue, fieldDef.dataLabel);
      });
    });
  }

  function ensureHardwareOptionsLayout(wrap) {
    if (!wrap) return null;
    var layout = wrap.querySelector('[data-hardware-layout="1"]');
    if (layout) return layout;
    layout = document.createElement('div');
    layout.className = 'door-hardware-options-layout';
    layout.setAttribute('data-hardware-layout', '1');

    var detail = document.createElement('div');
    detail.className = 'door-hardware-options-detail';
    detail.setAttribute('data-hardware-detail', '1');
    detail.hidden = true;

    var pickerGrid = document.createElement('div');
    pickerGrid.className = 'door-hardware-options-picker-grid common-check-options door-hardware-options-cards';
    pickerGrid.setAttribute('data-hardware-picker-grid', '1');

    layout.appendChild(detail);
    layout.appendChild(pickerGrid);

    wrap.appendChild(layout);
    return layout;
  }

  function buildHardwarePickerCard(p, index) {
    if (!p) return null;
    var val = String(p.id != null && p.id !== '' ? p.id : (p.handle || 'hw-picker-' + (index != null ? index : 0)));
    if (!val) return null;

    var card = document.createElement('label');
    card.className = 'common-check-option door-hardware-picker-option';
    card.setAttribute('data-choice-value', val);
    card.setAttribute('data-product-id', val);
    if (p.handle) card.setAttribute('data-product-handle', String(p.handle));

    var check = document.createElement('input');
    check.type = 'checkbox';
    check.className = 'door-hardware-picker-checkbox';
    check.name = 'attributes[Hardware Picker][]';
    check.value = val;
    check.setAttribute('data-hw-picker-checkbox', '1');
    check.setAttribute('data-option-id', 'hardware_options');
    check.style.position = 'absolute';
    check.style.opacity = '0';
    check.style.pointerEvents = 'none';
    card.appendChild(check);

    if (p.image) {
      var img = document.createElement('img');
      img.className = 'common-check-option-image';
      img.loading = 'lazy';
      img.alt = p.title || p.label || 'Hardware option';
      img.src = String(p.image);
      card.appendChild(img);
    } else {
      var ph = document.createElement('span');
      ph.className = 'common-check-option-image door-hardware-picker-image--placeholder';
      ph.setAttribute('role', 'img');
      ph.setAttribute('aria-label', p.title || p.label || 'Hardware option');
      card.appendChild(ph);
    }

    var textWrap = document.createElement('div');
    textWrap.className = 'common-check-option-text';

    var titleEl = document.createElement('span');
    titleEl.className = 'common-check-option-label';
    titleEl.textContent = p.title || p.label || 'Hardware Option';
    textWrap.appendChild(titleEl);

    var descText = String(p.description || p.short_description || 'Short description').trim();
    if (descText) {
      var descEl = document.createElement('span');
      descEl.className = 'common-check-option-desc d-none';
      descEl.textContent = descText;
      textWrap.appendChild(descEl);
    }

    card.appendChild(textWrap);
    return card;
  }

  function storeHardwareProductsOnLayout(layoutEl, products) {
    if (!layoutEl || !Array.isArray(products)) return;
    try { layoutEl._hardwareProducts = products.slice(); } catch (eStore) {}
  }

  function readHardwareProductsFromLayout(layoutEl) {
    if (!layoutEl) return [];
    if (Array.isArray(layoutEl._hardwareProducts)) return layoutEl._hardwareProducts.slice();
    return [];
  }

  function findHardwareProductById(layoutEl, productId) {
    var pid = String(productId || '');
    if (!pid) return null;
    var products = readHardwareProductsFromLayout(layoutEl);
    for (var pi = 0; pi < products.length; pi++) {
      var p = products[pi];
      if (!p) continue;
      var id = String(p.id != null && p.id !== '' ? p.id : '');
      var handle = String(p.handle || '');
      if (id === pid || handle === pid) return p;
    }
    return null;
  }

  function syncHardwareDetailListVisibility(detailList) {
    if (!detailList) return;
    var hasCards = !!detailList.querySelector('.door-suggested-hardware-card');
    detailList.classList.toggle('door-hardware-options-detail--open', hasCards);
    detailList.hidden = !hasCards;
  }

  function removeHardwareDetailBox(layoutEl, productId) {
    if (!layoutEl || !productId) return;
    var detailList = layoutEl.querySelector('[data-hardware-detail="1"]');
    if (!detailList) return;
    var detailCard = detailList.querySelector(
      '.door-suggested-hardware-card[data-product-id="' + productId + '"], .door-suggested-hardware-card[data-choice-value="' + productId + '"]'
    );
    if (detailCard && detailCard.parentNode) detailCard.parentNode.removeChild(detailCard);
    syncHardwareDetailListVisibility(detailList);
  }

  function buildHardwareDetailCard(layoutEl, productId) {
    if (!layoutEl || !productId) return null;
    var product = findHardwareProductById(layoutEl, productId);
    if (!product) return null;
    var detailCard = buildSuggestedHardwareCardFromProduct(product);
    if (!detailCard) return null;
    detailCard.removeAttribute('data-hw-card-bound');
    return detailCard;
  }

  function addHardwareDetailBox(layoutEl, productId) {
    if (!layoutEl || !productId) return;
    var detailList = layoutEl.querySelector('[data-hardware-detail="1"]');
    if (!detailList) return;

    var existing = detailList.querySelector(
      '.door-suggested-hardware-card[data-product-id="' + productId + '"], .door-suggested-hardware-card[data-choice-value="' + productId + '"]'
    );
    if (existing) return;

    var detailCard = buildHardwareDetailCard(layoutEl, productId);
    if (!detailCard) return;

    detailList.appendChild(detailCard);
    syncHardwareDetailListVisibility(detailList);

    var root = layoutEl.closest('.door-accordion-body-inner')
      || layoutEl.closest('.door-post-lockset-hardware-options')
      || layoutEl.closest('#door-configurator')
      || document;
    bindSuggestedHardwareProductCards(root);
  }

  function bindHardwarePickerGrid(layoutEl, products) {
    if (!layoutEl || layoutEl.getAttribute('data-hw-picker-bound') === '1') return;
    layoutEl.setAttribute('data-hw-picker-bound', '1');
    if (Array.isArray(products) && products.length) storeHardwareProductsOnLayout(layoutEl, products);

    var pickerGrid = layoutEl.querySelector('[data-hardware-picker-grid="1"]');
    if (!pickerGrid) return;

    pickerGrid.addEventListener('change', function (e) {
      var inp = e.target;
      if (!inp || !inp.getAttribute || inp.getAttribute('data-hw-picker-checkbox') !== '1') return;
      var picker = inp.closest ? inp.closest('.common-check-option') : null;
      if (!picker || !pickerGrid.contains(picker)) return;
      var pid = String(picker.getAttribute('data-product-id') || picker.getAttribute('data-choice-value') || inp.value || '');
      if (!pid) return;

      if (inp.checked) {
        hideHardwarePickerInGrid(layoutEl, pid);
        addHardwareDetailBox(layoutEl, pid);
      } else {
        showHardwarePickerInGrid(layoutEl, pid);
        removeHardwareDetailBox(layoutEl, pid);
        syncHardwareSelectionsFromDom();
        try { updateEstimatedPrice(); } catch (eHwUncheck) {}
      }
    });
  }

  function renderHardwareOptionsGrid(parentEl, products) {
    if (!parentEl || !Array.isArray(products) || !products.length) return null;

    var wrap = ensureHardwareGridWrap(parentEl);
    if (!wrap) return null;

    var intro = parentEl.querySelector('.door-suggested-hardware-intro');
    if (!intro) {
      intro = document.createElement('p');
      intro.className = 'door-suggested-hardware-intro';
      intro.textContent = 'Complete your door with our suggested hardware options.';
      wrap.parentNode.insertBefore(intro, wrap);
    }

    var layout = ensureHardwareOptionsLayout(wrap);
    if (!layout) return wrap;

    var pickerGrid = layout.querySelector('[data-hardware-picker-grid="1"]');
    if (pickerGrid) pickerGrid.innerHTML = '';

    if (!wrap.querySelector('#door-hardware-selections-json')) {
      var storeEl = document.createElement('script');
      storeEl.type = 'application/json';
      storeEl.id = 'door-hardware-selections-json';
      storeEl.textContent = '[]';
      wrap.appendChild(storeEl);
      writeHardwareSelectionsStore([]);
    }

    storeHardwareProductsOnLayout(layout, products);
    products.forEach(function (p, idx) {
      var picker = buildHardwarePickerCard(p, idx);
      if (picker && pickerGrid) pickerGrid.appendChild(picker);
    });

    var detailList = layout.querySelector('[data-hardware-detail="1"]');
    if (detailList) {
      detailList.innerHTML = '';
      syncHardwareDetailListVisibility(detailList);
    }
    layout.setAttribute('data-hw-layout-ready', '1');
    layout.removeAttribute('data-hw-picker-bound');
    bindHardwarePickerGrid(layout, products);
    hideLegacyRecommendedProductsBlock();
    return wrap;
  }

  function syncHardwareOptionsGridVisibility(hwAccordionEl, isOpen) {
    if (!hwAccordionEl || !hwAccordionEl.querySelector) return;
    var wraps = hwAccordionEl.querySelectorAll('.door-hardware-options-grid-wrap');
    for (var wi = 0; wi < wraps.length; wi++) {
      wraps[wi].style.display = isOpen ? '' : 'none';
    }
    var layout = hwAccordionEl.querySelector('[data-hardware-layout="1"]');
    if (layout) {
      layout.style.display = isOpen ? '' : 'none';
    }
  }
  function getHardwareFieldDefs() {
    return HW_SELECT_FIELD_DEFS.concat(HW_LIST_FIELD_DEFS);
  }

  function findHardwareCardByProductId(productId) {
    if (!productId) return null;
    var cards = all('.door-suggested-hardware-card[data-product-id], .door-hardware-product-block[data-product-id]');
    for (var i = 0; i < cards.length; i++) {
      if (String(cards[i].getAttribute('data-product-id')) === String(productId)) return cards[i];
    }
    return null;
  }

  // Picker (grid) card — shown before a product is chosen. Selecting it builds the
  // detail card with finish/function/thickness/qty controls.
  function findHardwarePickerCardByProductId(productId) {
    if (!productId) return null;
    var cards = all('.door-hardware-picker-option[data-product-id]');
    for (var i = 0; i < cards.length; i++) {
      if (String(cards[i].getAttribute('data-product-id')) === String(productId)) return cards[i];
    }
    return null;
  }

  // Make sure the detail card for a product is open. If only the picker card exists,
  // trigger its hidden checkbox (the same path a user click uses) so the detail box
  // is created, then return that detail card.
  function ensureHardwareDetailOpen(productId) {
    var detail = findHardwareCardByProductId(productId);
    if (detail) return detail;
    var picker = findHardwarePickerCardByProductId(productId);
    if (!picker) return null;
    var check = picker.querySelector('input[data-hw-picker-checkbox]');
    if (check) {
      if (!check.checked) check.checked = true;
      try { check.dispatchEvent(new Event('change', { bubbles: true })); } catch (eHwPick) {}
    }
    return findHardwareCardByProductId(productId);
  }

  function selectHardwareFinishSwatchFromSaved(card, finishValue) {
    var want = String(finishValue == null ? '' : finishValue);
    if (!want) return false;
    var swatches = card.querySelectorAll('.door-suggested-hardware-swatch[data-finish-value]');
    var match = null, i, sw, v;
    for (i = 0; i < swatches.length; i++) {
      sw = swatches[i];
      v = String(sw.getAttribute('data-finish-value') || '');
      if (v === want) { match = sw; break; }
    }
    if (!match) {
      for (i = 0; i < swatches.length; i++) {
        sw = swatches[i];
        v = String(sw.getAttribute('data-finish-value') || '').toLowerCase();
        if (v === want.toLowerCase()) { match = sw; break; }
      }
    }
    if (!match) return false;
    try { match.click(); } catch (eClick) { return false; }
    return true;
  }

  function setHardwareFieldSelectFromSaved(card, fieldDef, wantVal, wantLab) {
    var sel = card.querySelector('select.' + fieldDef.selectClass + ', select[' + fieldDef.dataSelect + ']');
    if (!sel || !sel.options) return false;
    var v = String(wantVal == null ? '' : wantVal);
    var l = String(wantLab == null ? '' : wantLab);
    if (v === '' && l === '') return false;
    var i, op, matched = -1;
    for (i = 0; i < sel.options.length; i++) {
      op = sel.options[i];
      if (op && v !== '' && String(op.value) === v) { matched = i; break; }
    }
    if (matched === -1 && l !== '') {
      for (i = 0; i < sel.options.length; i++) {
        op = sel.options[i];
        if (op && String(op.textContent || '').trim() === l) { matched = i; break; }
      }
    }
    if (matched === -1 && v !== '') {
      var vn = v.toLowerCase().replace(/-/g, '_');
      for (i = 0; i < sel.options.length; i++) {
        op = sel.options[i];
        if (op && String(op.value || '').toLowerCase().replace(/-/g, '_') === vn) { matched = i; break; }
      }
    }
    if (matched === -1) return false;
    sel.selectedIndex = matched;
    sel.value = String(sel.options[matched].value);
    try { sel.dispatchEvent(new Event('change', { bubbles: true })); } catch (eCh) {}
    var dw = sel.nextElementSibling;
    if (dw && dw.classList && dw.classList.contains('door-div-select')) {
      syncDoorDivSelectFromNative(sel, dw);
    }
    return true;
  }

  // Pre-select the saved hardware finish / function / thickness / qty when editing
  // a saved configuration. Reuses each control's existing change listeners.
  function applyHardwareRestoreToDom() {
    var pending = window.__doorSavedHardwareRestore;
    if (!pending || pending.__applied || !Array.isArray(pending.rows)) return true;
    var allApplied = true;
    pending.rows.forEach(function (row) {
      if (!row) return;
      var pid = String(row.product_id || row.id || '');
      if (!pid) return;
      // On load only the picker grid is rendered; open the detail card first (same
      // flow as a user click) so the finish/function/thickness/qty controls exist.
      var card = ensureHardwareDetailOpen(pid);
      if (!card) { allApplied = false; return; }
      selectHardwareFinishSwatchFromSaved(card, row.finish_value);
      getHardwareFieldDefs().forEach(function (fieldDef) {
        setHardwareFieldSelectFromSaved(card, fieldDef, row[fieldDef.storeValue], row[fieldDef.storeLabel]);
      });
      var qtyInput = card.querySelector('.door-suggested-hardware-qty-wrap input[name="quantity"], input[name="quantity"]');
      if (qtyInput && row.qty) {
        qtyInput.value = String(row.qty);
        try { qtyInput.dispatchEvent(new Event('change', { bubbles: true })); } catch (eQty) {}
      }
    });
    if (!allApplied) return false;
    try { syncHardwareSelectionsFromDom(); } catch (eSync) {}
    try { updateEstimatedPrice(); } catch (ePrice) {}
    pending.__applied = true;
    return true;
  }

  function restoreHardwareSelection(listRaw) {
    var rows = Array.isArray(listRaw) ? listRaw : (listRaw ? [listRaw] : []);
    rows = rows.filter(function (r) { return r && (r.product_id || r.id); });
    if (!rows.length) return;
    window.__doorSavedHardwareRestore = { rows: rows, __applied: false };
    var tries = 0;
    (function loop() {
      tries++;
      var done = false;
      try { done = applyHardwareRestoreToDom(); } catch (eApply) { done = false; }
      if (done) return;
      if (tries >= 40) return;
      setTimeout(loop, 250);
    })();
  }

  window.DoorConf2Hardware = window.DoorConf2Hardware || {};
  window.DoorConf2Hardware.init = function (d) {
    deps = d || {};
  };
  window.DoorConf2Hardware.readRecommendedHardwareProducts = readRecommendedHardwareProducts;
  window.DoorConf2Hardware.hideLegacyRecommendedProductsBlock = hideLegacyRecommendedProductsBlock;
  window.DoorConf2Hardware.getHardwareSelectionsForConfig = getHardwareSelectionsForConfig;
  window.DoorConf2Hardware.syncHardwareSelectionsFromDom = syncHardwareSelectionsFromDom;
  window.DoorConf2Hardware.restoreHardwareSelection = restoreHardwareSelection;
  window.DoorConf2Hardware.enhanceDoorSelectWithDivDropdown = enhanceDoorSelectWithDivDropdown;
  window.DoorConf2Hardware.syncDoorDivSelectFromNative = syncDoorDivSelectFromNative;
  window.DoorConf2Hardware.renderHardwareOptionsGrid = renderHardwareOptionsGrid;
  window.DoorConf2Hardware.syncHardwareOptionsGridVisibility = syncHardwareOptionsGridVisibility;
  window.DoorConf2Hardware.bindSuggestedHardwareProductCards = bindSuggestedHardwareProductCards;
  window.DoorConf2Hardware.getHardwareFieldDefs = getHardwareFieldDefs;
  window.DoorConf2Hardware.buildHardwareSelectionFromBlock = buildHardwareSelectionFromBlock;
  window.DoorConf2Hardware.attachHardwareAdminOptionMetadata = attachHardwareAdminOptionMetadata;
  window.DoorConf2Hardware.isCasingSelectionRow = isCasingSelectionRow;
  window.DoorConf2Hardware.isHardwareSelectionBlock = isHardwareSelectionBlock;
  window.DoorConf2Hardware.isCasingSelectionBlock = isCasingSelectionBlock;
})();