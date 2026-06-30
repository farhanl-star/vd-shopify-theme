/**
 * door-conf2-update.js — Shopify door configurator UI add-ons.
 * Casing picker, custom select dropdowns, seal-kit / door-sweeps / priming price sync.
 * Loaded by door-configurator-snippet.liquid after door-conf2.js.
 */
(function () {
  var SVG_NS = 'http://www.w3.org/2000/svg';

  function all(selector, root) {
    try {
      return Array.prototype.slice.call((root || document).querySelectorAll(selector) || []);
    } catch (e) {
      return [];
    }
  }

  function clearElement(el) {
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function setCasingPriceRowText(priceRow, priceTxt) {
    clearElement(priceRow);
    var span = document.createElement('span');
    span.setAttribute('data-casing-price', '');
    if (priceTxt) {
      span.textContent = priceTxt;
      priceRow.appendChild(span);
      priceRow.appendChild(document.createTextNode(' as configured'));
    } else {
      priceRow.appendChild(span);
    }
  }

  function createSvgEl(tag, attrs) {
    var el = document.createElementNS(SVG_NS, tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        el.setAttribute(key, attrs[key]);
      });
    }
    return el;
  }

  function appendChevronDownIcon(container) {
    var svg = createSvgEl('svg', {
      width: '16',
      height: '16',
      viewBox: '0 0 16 16',
      fill: 'none',
      'aria-hidden': 'true'
    });
    svg.appendChild(createSvgEl('path', {
      d: 'M4 6l4 4 4-4',
      stroke: 'currentColor',
      'stroke-width': '1.5',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    }));
    container.appendChild(svg);
  }

  function appendRemoveCasingButtonContent(button) {
    button.appendChild(document.createTextNode('Remove '));
    var svg = createSvgEl('svg', {
      width: '16',
      height: '16',
      viewBox: '0 0 16 16',
      fill: 'none'
    });
    svg.appendChild(createSvgEl('path', {
      d: 'M10.6667 4.00065V3.46732C10.6667 2.72058 10.6667 2.34721 10.5213 2.062C10.3935 1.81111 10.1895 1.60714 9.93865 1.47931C9.65344 1.33398 9.28007 1.33398 8.53333 1.33398H7.46667C6.71993 1.33398 6.34656 1.33398 6.06135 1.47931C5.81046 1.60714 5.60649 1.81111 5.47866 2.062C5.33333 2.34721 5.33333 2.72058 5.33333 3.46732V4.00065M6.66667 7.66732V11.0007M9.33333 7.66732V11.0007M2 4.00065H14M12.6667 4.00065V11.4673C12.6667 12.5874 12.6667 13.1475 12.4487 13.5753C12.2569 13.9516 11.951 14.2576 11.5746 14.4493C11.1468 14.6673 10.5868 14.6673 9.46667 14.6673H6.53333C5.41323 14.6673 4.85318 14.6673 4.42535 14.4493C4.04903 14.2576 3.74307 13.9516 3.55132 13.5753C3.33333 13.1475 3.33333 12.5874 3.33333 11.4673V4.00065',
      stroke: 'currentColor',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    }));
    button.appendChild(svg);
  }

  function getInsertsInfoDrawerAriaControls() {
    var btn = document.querySelector('button.inserts-info-open-btn[aria-controls]');
    if (btn && btn.getAttribute) return btn.getAttribute('aria-controls') || '';
    var any = all('button[aria-controls]').filter(function (el) {
      var ac = String(el && el.getAttribute ? el.getAttribute('aria-controls') : '');
      return ac.toLowerCase().indexOf('inserts_info_drawer') !== -1 || ac.toLowerCase().indexOf('inserts-info') !== -1;
    });
    if (any.length) return any[0].getAttribute('aria-controls') || '';
    return '';
  }

  function getWoodSpeciesDrawerAriaControlsContains(token) {
    var t = String(token || '').toLowerCase();
    if (!t) return '';
    var btns = all('button.wood-species-open-btn[aria-controls]');
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      var ac = String(b && b.getAttribute ? b.getAttribute('aria-controls') : '');
      if (!ac) continue;
      if (ac.toLowerCase().indexOf(t) !== -1) return ac;
    }
    return '';
  }

  function patchAriaControls() {
    try {
      var tipBtns = all('button.inserts-tooltip-btn[aria-controls], button.inserts-tooltip-btn:not([aria-controls])');
      var insertsId = getInsertsInfoDrawerAriaControls();
      if (insertsId) {
        tipBtns.forEach(function (b) {
          if (!b || !b.setAttribute) return;
          b.setAttribute('aria-controls', insertsId);
        });
      }

      var screenId = getWoodSpeciesDrawerAriaControlsContains('select_screen');
      if (screenId) {
        all('button.wood-species-open-btn.door-screen-types-btn, button.wood-species-open-btn[aria-controls*="select_screen"], button.wood-species-open-btn[aria-controls*="__select_screen"]').forEach(function (b) {
          if (!b || !b.setAttribute) return;
          b.setAttribute('aria-controls', screenId);
        });
      }

      var stormId = getWoodSpeciesDrawerAriaControlsContains('select_storm_glass');
      if (stormId) {
        all('button.wood-species-open-btn[aria-controls*="select_storm_glass"], button.wood-species-open-btn[aria-controls*="__select_storm_glass"]').forEach(function (b) {
          if (!b || !b.setAttribute) return;
          b.setAttribute('aria-controls', stormId);
        });
      }

      var edgeId = getWoodSpeciesDrawerAriaControlsContains('edge_profile');
      if (edgeId) {
        all('button.wood-species-open-btn[aria-controls*="edge_profile"], button.wood-species-open-btn.door-edge-profile-btn').forEach(function (b) {
          if (!b || !b.setAttribute) return;
          b.setAttribute('aria-controls', edgeId);
        });
      }
    } catch (e) { }
  }

  function readJsonScriptArray(id) {
    var el = document.getElementById(id);
    if (!el) return [];
    var raw = String(el.textContent || '').trim();
    if (!raw) return [];
    try {
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function readJsonScriptObject(id) {
    var el = document.getElementById(id);
    if (!el) return {};
    var raw = String(el.textContent || '').trim();
    if (!raw) return {};
    try {
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function casingDisplayLabel(p) {
    var title = String((p && p.title) || 'Casing');
    var sku = String((p && p.sku) || '').trim();
    return sku ? title + ' / ' + sku : title;
  }

  function isBadLengthToken(s) {
    var t = String(s == null ? '' : s).trim();
    return !t || t === 'MetaobjectListDrop' || t === 'MetaobjectDrop';
  }

  function resolveCasingLengthOptions(product) {
    if (!product) return [];
    var fromLiquid = Array.isArray(product.length_options) ? product.length_options : [];
    var good = fromLiquid.filter(function (lo) {
      if (!lo) return false;
      var v = lo.value != null ? String(lo.value) : '';
      var l = lo.label != null ? String(lo.label) : '';
      return !isBadLengthToken(v) || !isBadLengthToken(l);
    }).map(function (lo) {
      return {
        value: String(lo.value != null && !isBadLengthToken(lo.value) ? lo.value : lo.label || ''),
        label: String(lo.label != null && !isBadLengthToken(lo.label) ? lo.label : lo.value || '')
      };
    }).filter(function (lo) {
      return lo.value || lo.label;
    });
    if (good.length) return good;

    var catalog = readJsonScriptArray('door-millwork-length-catalog');
    if (!catalog.length) return [];

    var byHandle = {};
    var byId = {};
    catalog.forEach(function (entry) {
      if (!entry) return;
      var h = String(entry.handle || '').trim();
      var id = entry.id != null ? String(entry.id) : '';
      if (h) byHandle[h] = entry;
      if (id) byId[id] = entry;
    });

    function entryToOption(e, fallback) {
      if (!e) return null;
      var val = String(e.value != null && !isBadLengthToken(e.value) ? e.value : e.label || fallback || '');
      var lab = String(e.label != null && !isBadLengthToken(e.label) ? e.label : e.value || fallback || '');
      return val || lab ? { value: val || lab, label: lab || val } : null;
    }

    var handles = Array.isArray(product.length_handles) ? product.length_handles : [];
    var resolved = handles.map(function (h) {
      return entryToOption(byHandle[String(h || '').trim()], h);
    }).filter(Boolean);
    if (resolved.length) return resolved;

    var ids = Array.isArray(product.length_ids) ? product.length_ids : [];
    return ids.map(function (id) {
      return entryToOption(byId[String(id)], id);
    }).filter(Boolean);
  }

  function writeCasingSelectionStore(selection) {
    var jsonEl = document.getElementById('door-casing-selection-json');
    if (jsonEl) {
      try { jsonEl.textContent = selection ? JSON.stringify(selection) : 'null'; } catch (e) { }
    }
    var hidden = document.querySelector('input[data-casing-selection-input]');
    if (hidden) {
      hidden.value = selection ? String(selection.product_id || '') : '';
      try {
        hidden.dispatchEvent(new Event('change', { bubbles: true }));
      } catch (e) { }
    }
    try { window.__doorCasingSelection = selection || null; } catch (eWin) { }
  }

  function buildCasingSelection(product, lengthValue, lengthLabel, qty) {
    if (!product) return null;
    var q = parseInt(qty, 10);
    if (isNaN(q) || q < 1) q = 1;
    return {
      product_id: String(product.id || ''),
      handle: String(product.handle || ''),
      title: String(product.title || 'Casing'),
      url: String(product.url || ''),
      variant_id: String(product.variant_id || ''),
      sku: String(product.sku || ''),
      image: String(product.image || ''),
      price_cents: Number(product.price_cents || 0),
      price_formatted: String(product.price_formatted || ''),
      length_value: String(lengthValue || ''),
      length_label: String(lengthLabel || lengthValue || ''),
      qty: q
    };
  }

  function renderCasingProducts() {
    var products = readJsonScriptArray('door-recommended-casing-products');
    if (!products.length) return false;

    var casingAccordion = document.querySelector('.door-option-accordion.door-post-lockset-casing-options[data-option-id="casing_options"]');
    if (!casingAccordion) return null;
    var inner = casingAccordion.querySelector('.door-accordion-body-inner');
    if (!inner) return null;
    if (inner.querySelector('[data-casing-root="1"]')) return true;

    all('.door-option-wrap[data-option-id^="casing_dummy_"]', inner).forEach(function (d) {
      try { d.remove(); } catch (e) { }
    });

    var root = document.createElement('div');
    root.className = 'door-hardware-options-grid-wrap';
    root.setAttribute('data-casing-root', '1');
    root.setAttribute('data-casing-grid', '1');

    var intro = document.createElement('p');
    intro.className = 'door-suggested-hardware-intro';
    intro.textContent = 'Add matching door frame casing to help your door fit perfectly into your home.';

    var layout = document.createElement('div');
    layout.className = 'door-hardware-options-layout';
    layout.setAttribute('data-casing-layout', '1');

    var detailList = document.createElement('div');
    detailList.className = 'door-hardware-options-detail';
    detailList.setAttribute('data-casing-detail', '1');
    detailList.hidden = true;

    var pickerGrid = document.createElement('div');
    pickerGrid.className = 'door-hardware-options-picker-grid common-check-options door-hardware-options-cards';
    pickerGrid.setAttribute('data-casing-picker-grid', '1');

    layout.appendChild(detailList);
    layout.appendChild(pickerGrid);

    var jsonStore = document.createElement('div');
    jsonStore.id = 'door-casing-selection-json';
    jsonStore.hidden = true;
    jsonStore.setAttribute('data-json-store', '1');
    jsonStore.textContent = 'null';

    var hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.setAttribute('data-casing-selection-input', '1');
    hiddenInput.setAttribute('data-option-id', 'casing_options');
    hiddenInput.name = 'attributes[Casing]';
    hiddenInput.value = '';

    function showBrowse() {
      pickerGrid.hidden = false;
      detailList.hidden = true;
      clearElement(detailList);
      detailList.classList.remove('door-hardware-options-detail--open');
      writeCasingSelectionStore(null);
    }

    function renderSelectedDetail(product) {
      if (!product) return;
      clearElement(detailList);

      var article = document.createElement('article');
      article.className = 'door-suggested-hardware-card common-check-option door-hardware-option-card door-suggested-hardware-card--added';
      article.setAttribute('data-choice-value', String(product.id));
      article.setAttribute('data-product-id', String(product.id));

      var casingCheck = document.createElement('input');
      casingCheck.type = 'checkbox';
      casingCheck.className = 'door-suggested-hardware-card__radio';
      casingCheck.name = 'attributes[Casing][]';
      casingCheck.value = String(product.id);
      casingCheck.setAttribute('data-option-id', 'casing_options');
      casingCheck.setAttribute('data-casing-selection-checkbox', '1');
      casingCheck.checked = true;
      casingCheck.style.position = 'absolute';
      casingCheck.style.opacity = '0';
      casingCheck.style.pointerEvents = 'none';
      article.appendChild(casingCheck);

      var cardLayout = document.createElement('div');
      cardLayout.className = 'door-suggested-hardware-card__layout';

      var media = document.createElement('div');
      media.className = 'door-suggested-hardware-card__media';
      if (product.image) {
        var img = document.createElement('img');
        img.className = 'common-check-option-image';
        img.src = String(product.image);
        img.loading = 'lazy';
        img.alt = casingDisplayLabel(product);
        media.appendChild(img);
      } else {
        var ph = document.createElement('span');
        ph.className = 'common-check-option-image door-hardware-picker-image--placeholder';
        ph.setAttribute('role', 'img');
        ph.setAttribute('aria-label', casingDisplayLabel(product));
        media.appendChild(ph);
      }
      var mediaTextWrap = document.createElement('div');
      mediaTextWrap.className = 'common-check-option-text';
      var mediaTitle = document.createElement('span');
      mediaTitle.className = 'common-check-option-label';
      mediaTitle.textContent = casingDisplayLabel(product);
      mediaTextWrap.appendChild(mediaTitle);
      media.appendChild(mediaTextWrap);

      var details = document.createElement('div');
      details.className = 'door-suggested-hardware-card__details';

      var lengthRow = document.createElement('div');
      lengthRow.className = 'door-suggested-hardware-card__function';
      var lengthLbl = document.createElement('span');
      lengthLbl.className = 'door-suggested-hardware-card__function-label';
      lengthLbl.textContent = 'Length';
      var lengthSel = document.createElement('select');
      lengthSel.className = 'door-input-select door-suggested-hardware-card__function-select door-suggested-hardware-function';
      lengthSel.setAttribute('data-casing-length-select', '1');
      lengthSel.setAttribute('data-option-id', 'casing_length');
      lengthSel.setAttribute('aria-label', 'Length');

      var lengthOpts = resolveCasingLengthOptions(product);
      if (!lengthOpts.length) {
        var emptyOp = document.createElement('option');
        emptyOp.value = '';
        emptyOp.textContent = '—';
        lengthSel.appendChild(emptyOp);
      } else {
        var appendedAny = false;
        lengthOpts.forEach(function (lo) {
          if (!lo) return;
          var op = document.createElement('option');
          var rawVal = lo.value != null ? String(lo.value) : '';
          var rawLab = lo.label != null ? String(lo.label) : '';
          if (isBadLengthToken(rawVal) && isBadLengthToken(rawLab)) return;
          if (isBadLengthToken(rawVal)) rawVal = '';
          if (isBadLengthToken(rawLab)) rawLab = '';
          if (!rawVal && !rawLab) return;
          op.value = rawVal || rawLab;
          op.textContent = rawLab || rawVal;
          lengthSel.appendChild(op);
          appendedAny = true;
        });
        if (!appendedAny) {
          var emptyOp2 = document.createElement('option');
          emptyOp2.value = '';
          emptyOp2.textContent = '—';
          lengthSel.appendChild(emptyOp2);
        }
      }

      lengthRow.appendChild(lengthLbl);
      lengthRow.appendChild(lengthSel);
      details.appendChild(lengthRow);

      var footer = document.createElement('div');
      footer.className = 'door-suggested-hardware-card__footer';

      var priceRow = document.createElement('p');
      priceRow.className = 'door-suggested-hardware-card__price';
      setCasingPriceRowText(priceRow, String(product.price_formatted || '').trim());

      var actions = document.createElement('div');
      actions.className = 'door-suggested-hardware-card__actions';

      var qtyWrap = document.createElement('div');
      qtyWrap.className = 'door-suggested-hardware-qty-wrap select-mdiv common-qty qty-small';
      var qtyLabel = document.createElement('label');
      qtyLabel.className = 'qty-label';
      qtyLabel.textContent = 'QTY';
      var qtyBlock = document.createElement('div');
      qtyBlock.className = 'qty-block';
      var qtyInner = document.createElement('div');
      qtyInner.className = 'qty-wrapper';
      var minusBtn = document.createElement('button');
      minusBtn.type = 'button';
      minusBtn.className = 'qty-btn minus';
      minusBtn.setAttribute('aria-label', 'Decrease quantity');
      minusBtn.textContent = '-';
      var qtyInput = document.createElement('input');
      qtyInput.type = 'number';
      qtyInput.name = 'quantity';
      qtyInput.min = '1';
      qtyInput.max = '99';
      qtyInput.value = '1';
      qtyInput.inputMode = 'numeric';
      qtyInput.setAttribute('aria-label', 'Quantity');
      var plusBtn = document.createElement('button');
      plusBtn.type = 'button';
      plusBtn.className = 'qty-btn plus';
      plusBtn.setAttribute('aria-label', 'Increase quantity');
      plusBtn.textContent = '+';
      qtyInner.appendChild(minusBtn);
      qtyInner.appendChild(qtyInput);
      qtyInner.appendChild(plusBtn);
      qtyBlock.appendChild(qtyInner);
      qtyWrap.appendChild(qtyLabel);
      qtyWrap.appendChild(qtyBlock);

      var removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'door-suggested-hardware-remove-btn btn-woodDust common-btn common-remove-btn btn-small';
      removeBtn.setAttribute('aria-label', 'Remove casing');
      appendRemoveCasingButtonContent(removeBtn);

      actions.appendChild(qtyWrap);
      actions.appendChild(removeBtn);
      footer.appendChild(priceRow);
      footer.appendChild(actions);
      details.appendChild(footer);
      cardLayout.appendChild(media);
      cardLayout.appendChild(details);
      article.appendChild(cardLayout);
      detailList.appendChild(article);

      function syncSelection() {
        var idx = lengthSel.selectedIndex >= 0 ? lengthSel.selectedIndex : 0;
        var op = lengthSel.options[idx];
        var lenVal = op ? String(op.value || '') : '';
        var lenLbl = op ? String(op.textContent || '').trim() : '';
        writeCasingSelectionStore(buildCasingSelection(product, lenVal, lenLbl, qtyInput.value));
      }

      minusBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        qtyInput.value = String(Math.max(1, (parseInt(qtyInput.value, 10) || 1) - 1));
        syncSelection();
      });
      plusBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        qtyInput.value = String(Math.min(99, (parseInt(qtyInput.value, 10) || 1) + 1));
        syncSelection();
      });
      qtyInput.addEventListener('change', syncSelection);
      qtyInput.addEventListener('input', syncSelection);
      lengthSel.addEventListener('change', syncSelection);
      removeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        showBrowse();
      });

      if (lengthSel.getAttribute('data-door-div-select') !== '1') {
        enhanceDoorSelectWithDivDropdown(lengthSel);
      }

      pickerGrid.hidden = true;
      detailList.hidden = false;
      detailList.classList.add('door-hardware-options-detail--open');
      syncSelection();
    }

    products.forEach(function (p) {
      if (!p || !p.id) return;
      var card = document.createElement('label');
      card.className = 'common-check-option door-hardware-picker-option';
      card.setAttribute('data-choice-value', String(p.id));
      card.setAttribute('data-product-id', String(p.id));

      var check = document.createElement('input');
      check.type = 'checkbox';
      check.className = 'door-hardware-picker-checkbox';
      check.name = 'attributes[Casing Picker][]';
      check.value = String(p.id);
      check.setAttribute('data-casing-picker-checkbox', '1');
      check.setAttribute('data-option-id', 'casing_options');
      check.style.position = 'absolute';
      check.style.opacity = '0';
      check.style.pointerEvents = 'none';
      card.appendChild(check);

      if (p.image) {
        var pickImg = document.createElement('img');
        pickImg.className = 'common-check-option-image';
        pickImg.src = String(p.image);
        pickImg.loading = 'lazy';
        pickImg.alt = casingDisplayLabel(p);
        card.appendChild(pickImg);
      } else {
        var pickPh = document.createElement('span');
        pickPh.className = 'common-check-option-image door-hardware-picker-image--placeholder';
        pickPh.setAttribute('role', 'img');
        pickPh.setAttribute('aria-label', casingDisplayLabel(p));
        card.appendChild(pickPh);
      }

      var textWrap = document.createElement('div');
      textWrap.className = 'common-check-option-text';
      var pickTitle = document.createElement('span');
      pickTitle.className = 'common-check-option-label';
      pickTitle.textContent = casingDisplayLabel(p);
      textWrap.appendChild(pickTitle);
      card.appendChild(textWrap);

      card.addEventListener('click', function (e) {
        e.preventDefault();
        renderSelectedDetail(p);
      });
      pickerGrid.appendChild(card);
    });

    if (!pickerGrid.children.length) return false;

    root.appendChild(intro);
    root.appendChild(layout);
    root.appendChild(jsonStore);
    root.appendChild(hiddenInput);

    clearElement(inner);
    inner.appendChild(root);
    return true;
  }

  function bootCasingProducts() {
    var tries = 0;
    var maxTries = 30;
    (function loop() {
      tries++;
      var done = renderCasingProducts();
      if (done === true || done === false) return;
      if (tries >= maxTries) return;
      setTimeout(loop, 250);
    })();
  }

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
    all('.door-div-select--open').forEach(function (el) {
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
      } catch (eEv2) { }
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
    appendChevronDownIcon(iconSpan);
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

  function ensurePropertyInput(form, key, value) {
    if (!form) return;
    var name = 'properties[' + key + ']';
    var el = form.querySelector('input[name="' + name + '"]');
    if (!el) {
      el = document.createElement('input');
      el.type = 'hidden';
      el.name = name;
      form.appendChild(el);
    }
    el.value = String(value == null ? '' : value);
  }

  function bindLandingHardwareCard(card) {
    if (!card || card.getAttribute('data-hw-card-bound') === '1') return;
    card.setAttribute('data-hw-card-bound', '1');

    var root = card.closest('[data-landing-hardware-config="1"]');
    if (root && root.getAttribute('data-hw-swatch-init') === '1') {
      var fnSelectOnly = card.querySelector('select.door-suggested-hardware-function, select[data-hw-function-select]');
      if (fnSelectOnly && fnSelectOnly.getAttribute('data-door-div-select') !== '1') {
        enhanceDoorSelectWithDivDropdown(fnSelectOnly);
      }
      var ccSelectOnly = card.querySelector('select.door-suggested-hardware-closer-color, select[data-hw-closer-color-select]');
      if (ccSelectOnly && ccSelectOnly.getAttribute('data-door-div-select') !== '1') {
        enhanceDoorSelectWithDivDropdown(ccSelectOnly);
      }
      var thickSelectOnly = card.querySelector('select.door-suggested-hardware-thickness, select[data-hw-thickness-select]');
      if (thickSelectOnly && thickSelectOnly.getAttribute('data-door-div-select') !== '1') {
        enhanceDoorSelectWithDivDropdown(thickSelectOnly);
      }
      var sdSelectOnly = card.querySelector('select.door-suggested-hardware-swing-direction, select[data-hw-swing-direction-select]');
      if (sdSelectOnly && sdSelectOnly.getAttribute('data-door-div-select') !== '1') {
        enhanceDoorSelectWithDivDropdown(sdSelectOnly);
      }
      var bsSelectOnly = card.querySelector('select.door-suggested-hardware-backset, select[data-hw-backset-select]');
      if (bsSelectOnly && bsSelectOnly.getAttribute('data-door-div-select') !== '1') {
        enhanceDoorSelectWithDivDropdown(bsSelectOnly);
      }
      var tlSelectOnly = card.querySelector('select.door-suggested-hardware-track-length, select[data-hw-track-length-select]');
      if (tlSelectOnly && tlSelectOnly.getAttribute('data-door-div-select') !== '1') {
        enhanceDoorSelectWithDivDropdown(tlSelectOnly);
      }
      var cdSelectOnly = card.querySelector('select.door-suggested-hardware-connected-doors, select[data-hw-connected-doors-select]');
      if (cdSelectOnly && cdSelectOnly.getAttribute('data-door-div-select') !== '1') {
        enhanceDoorSelectWithDivDropdown(cdSelectOnly);
      }
      var utlSelectOnly = card.querySelector('select.door-suggested-hardware-upper-track-length, select[data-hw-upper-track-length-select]');
      if (utlSelectOnly && utlSelectOnly.getAttribute('data-door-div-select') !== '1') {
        enhanceDoorSelectWithDivDropdown(utlSelectOnly);
      }
      var mdsSelectOnly = card.querySelector('select.door-suggested-hardware-max-door-size, select[data-hw-max-door-size-select]');
      if (mdsSelectOnly && mdsSelectOnly.getAttribute('data-door-div-select') !== '1') {
        enhanceDoorSelectWithDivDropdown(mdsSelectOnly);
      }
      var cptSelectOnly = card.querySelector('select.door-suggested-hardware-carriage-pack-type, select[data-hw-carriage-pack-type-select]');
      if (cptSelectOnly && cptSelectOnly.getAttribute('data-door-div-select') !== '1') {
        enhanceDoorSelectWithDivDropdown(cptSelectOnly);
      }
      var shlSelectOnly = card.querySelector('select.door-suggested-hardware-strap-hinge-length, select[data-hw-strap-hinge-length-select]');
      if (shlSelectOnly && shlSelectOnly.getAttribute('data-door-div-select') !== '1') {
        enhanceDoorSelectWithDivDropdown(shlSelectOnly);
      }
      return;
    }

    var finishLabel = card.querySelector('[data-finish-label]');
    var forms = all('form.millwork-form');

    function syncFunctionAttrs() {
      var fnSelect = card.querySelector('select.door-suggested-hardware-function, select[data-hw-function-select]');
      if (!fnSelect || fnSelect.selectedIndex < 0) return;
      var opt = fnSelect.options[fnSelect.selectedIndex];
      if (!opt) return;
      card.setAttribute('data-hw-function-value', String(opt.value || ''));
      card.setAttribute('data-hw-function-label', String(opt.textContent || '').trim());
    }

    function syncCloserColorAttrs() {
      var ccSelect = card.querySelector('select.door-suggested-hardware-closer-color, select[data-hw-closer-color-select]');
      if (!ccSelect || ccSelect.selectedIndex < 0) return;
      var opt = ccSelect.options[ccSelect.selectedIndex];
      if (!opt) return;
      card.setAttribute('data-hw-closer-color-value', String(opt.value || ''));
      card.setAttribute('data-hw-closer-color-label', String(opt.textContent || '').trim());
    }

    function syncThicknessAttrs() {
      var thickSelect = card.querySelector('select.door-suggested-hardware-thickness, select[data-hw-thickness-select]');
      if (!thickSelect || thickSelect.selectedIndex < 0) return;
      var opt = thickSelect.options[thickSelect.selectedIndex];
      if (!opt) return;
      card.setAttribute('data-hw-thickness-value', String(opt.value || ''));
      card.setAttribute('data-hw-thickness-label', String(opt.textContent || '').trim());
    }

    function syncSwingDirectionAttrs() {
      var sdSelect = card.querySelector('select.door-suggested-hardware-swing-direction, select[data-hw-swing-direction-select]');
      if (!sdSelect || sdSelect.selectedIndex < 0) return;
      var opt = sdSelect.options[sdSelect.selectedIndex];
      if (!opt) return;
      card.setAttribute('data-hw-swing-direction-value', String(opt.value || ''));
      card.setAttribute('data-hw-swing-direction-label', String(opt.textContent || '').trim());
    }

    function syncBacksetAttrs() {
      var bsSelect = card.querySelector('select.door-suggested-hardware-backset, select[data-hw-backset-select]');
      if (!bsSelect || bsSelect.selectedIndex < 0) return;
      var opt = bsSelect.options[bsSelect.selectedIndex];
      if (!opt) return;
      card.setAttribute('data-hw-backset-value', String(opt.value || ''));
      card.setAttribute('data-hw-backset-label', String(opt.textContent || '').trim());
    }

    function syncTrackLengthAttrs() {
      var tlSelect = card.querySelector('select.door-suggested-hardware-track-length, select[data-hw-track-length-select]');
      if (!tlSelect || tlSelect.selectedIndex < 0) return;
      var opt = tlSelect.options[tlSelect.selectedIndex];
      if (!opt) return;
      card.setAttribute('data-hw-track-length-value', String(opt.value || ''));
      card.setAttribute('data-hw-track-length-label', String(opt.textContent || '').trim());
    }

    function syncConnectedDoorsAttrs() {
      var cdSelect = card.querySelector('select.door-suggested-hardware-connected-doors, select[data-hw-connected-doors-select]');
      if (!cdSelect || cdSelect.selectedIndex < 0) return;
      var opt = cdSelect.options[cdSelect.selectedIndex];
      if (!opt) return;
      card.setAttribute('data-hw-connected-doors-value', String(opt.value || ''));
      card.setAttribute('data-hw-connected-doors-label', String(opt.textContent || '').trim());
    }

    function syncUpperTrackLengthAttrs() {
      var utlSelect = card.querySelector('select.door-suggested-hardware-upper-track-length, select[data-hw-upper-track-length-select]');
      if (!utlSelect || utlSelect.selectedIndex < 0) return;
      var opt = utlSelect.options[utlSelect.selectedIndex];
      if (!opt) return;
      card.setAttribute('data-hw-upper-track-length-value', String(opt.value || ''));
      card.setAttribute('data-hw-upper-track-length-label', String(opt.textContent || '').trim());
    }

    function syncMaxDoorSizeAttrs() {
      var mdsSelect = card.querySelector('select.door-suggested-hardware-max-door-size, select[data-hw-max-door-size-select]');
      if (!mdsSelect || mdsSelect.selectedIndex < 0) return;
      var opt = mdsSelect.options[mdsSelect.selectedIndex];
      if (!opt) return;
      card.setAttribute('data-hw-max-door-size-value', String(opt.value || ''));
      card.setAttribute('data-hw-max-door-size-label', String(opt.textContent || '').trim());
    }

    function syncCarriagePackTypeAttrs() {
      var cptSelect = card.querySelector('select.door-suggested-hardware-carriage-pack-type, select[data-hw-carriage-pack-type-select]');
      if (!cptSelect || cptSelect.selectedIndex < 0) return;
      var opt = cptSelect.options[cptSelect.selectedIndex];
      if (!opt) return;
      card.setAttribute('data-hw-carriage-pack-type-value', String(opt.value || ''));
      card.setAttribute('data-hw-carriage-pack-type-label', String(opt.textContent || '').trim());
    }

    function syncStrapHingeLengthAttrs() {
      var shlSelect = card.querySelector('select.door-suggested-hardware-strap-hinge-length, select[data-hw-strap-hinge-length-select]');
      if (!shlSelect || shlSelect.selectedIndex < 0) return;
      var opt = shlSelect.options[shlSelect.selectedIndex];
      if (!opt) return;
      card.setAttribute('data-hw-strap-hinge-length-value', String(opt.value || ''));
      card.setAttribute('data-hw-strap-hinge-length-label', String(opt.textContent || '').trim());
    }

    function syncCartProperties() {
      var finishVal = String(card.getAttribute('data-hw-finish-value') || '');
      var finishLbl = String(card.getAttribute('data-hw-finish-label') || '');
      syncFunctionAttrs();
      syncCloserColorAttrs();
      syncThicknessAttrs();
      syncSwingDirectionAttrs();
      syncBacksetAttrs();
      syncTrackLengthAttrs();
      syncConnectedDoorsAttrs();
      syncUpperTrackLengthAttrs();
      syncMaxDoorSizeAttrs();
      syncCarriagePackTypeAttrs();
      syncStrapHingeLengthAttrs();
      var functionVal = String(card.getAttribute('data-hw-function-value') || '');
      var functionLbl = String(card.getAttribute('data-hw-function-label') || '');
      var closerColorVal = String(card.getAttribute('data-hw-closer-color-value') || '');
      var closerColorLbl = String(card.getAttribute('data-hw-closer-color-label') || '');
      var thicknessVal = String(card.getAttribute('data-hw-thickness-value') || '');
      var thicknessLbl = String(card.getAttribute('data-hw-thickness-label') || '');
      var swingDirectionVal = String(card.getAttribute('data-hw-swing-direction-value') || '');
      var swingDirectionLbl = String(card.getAttribute('data-hw-swing-direction-label') || '');
      var backsetVal = String(card.getAttribute('data-hw-backset-value') || '');
      var backsetLbl = String(card.getAttribute('data-hw-backset-label') || '');
      var trackLengthVal = String(card.getAttribute('data-hw-track-length-value') || '');
      var trackLengthLbl = String(card.getAttribute('data-hw-track-length-label') || '');
      var connectedDoorsVal = String(card.getAttribute('data-hw-connected-doors-value') || '');
      var connectedDoorsLbl = String(card.getAttribute('data-hw-connected-doors-label') || '');
      var upperTrackLengthVal = String(card.getAttribute('data-hw-upper-track-length-value') || '');
      var upperTrackLengthLbl = String(card.getAttribute('data-hw-upper-track-length-label') || '');
      var maxDoorSizeVal = String(card.getAttribute('data-hw-max-door-size-value') || '');
      var maxDoorSizeLbl = String(card.getAttribute('data-hw-max-door-size-label') || '');
      var carriagePackTypeVal = String(card.getAttribute('data-hw-carriage-pack-type-value') || '');
      var carriagePackTypeLbl = String(card.getAttribute('data-hw-carriage-pack-type-label') || '');
      var strapHingeLengthVal = String(card.getAttribute('data-hw-strap-hinge-length-value') || '');
      var strapHingeLengthLbl = String(card.getAttribute('data-hw-strap-hinge-length-label') || '');

      forms.forEach(function (form) {
        if (finishLbl || finishVal) ensurePropertyInput(form, 'Finish', finishLbl || finishVal);
        if (functionLbl || functionVal) ensurePropertyInput(form, 'Hardware Function', functionLbl || functionVal);
        if (closerColorLbl || closerColorVal) ensurePropertyInput(form, 'Closer Color', closerColorLbl || closerColorVal);
        if (thicknessLbl || thicknessVal) ensurePropertyInput(form, 'Door Thickness', thicknessLbl || thicknessVal);
        if (swingDirectionLbl || swingDirectionVal) ensurePropertyInput(form, 'Swing Direction', swingDirectionLbl || swingDirectionVal);
        if (backsetLbl || backsetVal) ensurePropertyInput(form, 'Door Backset', backsetLbl || backsetVal);
        if (trackLengthLbl || trackLengthVal) ensurePropertyInput(form, 'Track Length', trackLengthLbl || trackLengthVal);
        if (connectedDoorsLbl || connectedDoorsVal) ensurePropertyInput(form, 'Number of Connected Doors', connectedDoorsLbl || connectedDoorsVal);
        if (upperTrackLengthLbl || upperTrackLengthVal) ensurePropertyInput(form, 'Upper Track Length', upperTrackLengthLbl || upperTrackLengthVal);
        if (maxDoorSizeLbl || maxDoorSizeVal) ensurePropertyInput(form, 'Max Door Size', maxDoorSizeLbl || maxDoorSizeVal);
        if (carriagePackTypeLbl || carriagePackTypeVal) ensurePropertyInput(form, 'Carriage Pack Type', carriagePackTypeLbl || carriagePackTypeVal);
        if (strapHingeLengthLbl || strapHingeLengthVal) ensurePropertyInput(form, 'Strap Hinge Length', strapHingeLengthLbl || strapHingeLengthVal);
      });
    }

    var firstFinish = window.__landingHardwareFirstFinish || '';
    var firstFinishLabel = window.__landingHardwareFirstFinishLabel || '';
    var selectedSwatch = card.querySelector('.door-suggested-hardware-swatch--selected')
      || card.querySelector('.door-suggested-hardware-swatch');
    if (selectedSwatch) {
      var fv = selectedSwatch.getAttribute('data-finish-value') || firstFinish || '';
      var fl = selectedSwatch.getAttribute('data-finish-label') || selectedSwatch.getAttribute('title') || selectedSwatch.getAttribute('aria-label') || firstFinishLabel || fv;
      if (finishLabel) finishLabel.textContent = fl;
      card.setAttribute('data-hw-finish-value', fv);
      card.setAttribute('data-hw-finish-label', fl);
      if (!selectedSwatch.classList.contains('door-suggested-hardware-swatch--selected')) {
        selectedSwatch.classList.add('door-suggested-hardware-swatch--selected');
      }
    } else if (firstFinish && finishLabel) {
      finishLabel.textContent = firstFinishLabel || firstFinish;
      card.setAttribute('data-hw-finish-value', firstFinish);
      card.setAttribute('data-hw-finish-label', firstFinishLabel || firstFinish);
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
        syncCartProperties();
      });
    });

    var fnSelect = card.querySelector('select.door-suggested-hardware-function, select[data-hw-function-select]');
    if (fnSelect) {
      if (window.__landingHardwareFirstFunction) {
        fnSelect.value = String(window.__landingHardwareFirstFunction);
      }
      fnSelect.addEventListener('change', function () {
        syncFunctionAttrs();
        syncCartProperties();
      });
      enhanceDoorSelectWithDivDropdown(fnSelect);
      syncFunctionAttrs();
    }

    var ccSelect = card.querySelector('select.door-suggested-hardware-closer-color, select[data-hw-closer-color-select]');
    if (ccSelect) {
      if (window.__landingHardwareFirstCloserColor) {
        ccSelect.value = String(window.__landingHardwareFirstCloserColor);
      }
      ccSelect.addEventListener('change', function () {
        syncCloserColorAttrs();
        syncCartProperties();
      });
      enhanceDoorSelectWithDivDropdown(ccSelect);
      syncCloserColorAttrs();
    }

    var thickSelect = card.querySelector('select.door-suggested-hardware-thickness, select[data-hw-thickness-select]');
    if (thickSelect) {
      if (window.__landingHardwareFirstThickness) {
        thickSelect.value = String(window.__landingHardwareFirstThickness);
      }
      thickSelect.addEventListener('change', function () {
        syncThicknessAttrs();
        syncCartProperties();
      });
      enhanceDoorSelectWithDivDropdown(thickSelect);
      syncThicknessAttrs();
    }

    var sdSelect = card.querySelector('select.door-suggested-hardware-swing-direction, select[data-hw-swing-direction-select]');
    if (sdSelect) {
      if (window.__landingHardwareFirstSwingDirection) {
        sdSelect.value = String(window.__landingHardwareFirstSwingDirection);
      }
      sdSelect.addEventListener('change', function () {
        syncSwingDirectionAttrs();
        syncCartProperties();
      });
      enhanceDoorSelectWithDivDropdown(sdSelect);
      syncSwingDirectionAttrs();
    }

    var bsSelect = card.querySelector('select.door-suggested-hardware-backset, select[data-hw-backset-select]');
    if (bsSelect) {
      if (window.__landingHardwareFirstBackset) {
        bsSelect.value = String(window.__landingHardwareFirstBackset);
      }
      bsSelect.addEventListener('change', function () {
        syncBacksetAttrs();
        syncCartProperties();
      });
      enhanceDoorSelectWithDivDropdown(bsSelect);
      syncBacksetAttrs();
    }

    var tlSelect = card.querySelector('select.door-suggested-hardware-track-length, select[data-hw-track-length-select]');
    if (tlSelect) {
      if (window.__landingHardwareFirstTrackLength) {
        tlSelect.value = String(window.__landingHardwareFirstTrackLength);
      }
      tlSelect.addEventListener('change', function () {
        syncTrackLengthAttrs();
        syncCartProperties();
      });
      enhanceDoorSelectWithDivDropdown(tlSelect);
      syncTrackLengthAttrs();
    }

    var cdSelect = card.querySelector('select.door-suggested-hardware-connected-doors, select[data-hw-connected-doors-select]');
    if (cdSelect) {
      if (window.__landingHardwareFirstConnectedDoors) {
        cdSelect.value = String(window.__landingHardwareFirstConnectedDoors);
      }
      cdSelect.addEventListener('change', function () {
        syncConnectedDoorsAttrs();
        syncCartProperties();
      });
      enhanceDoorSelectWithDivDropdown(cdSelect);
      syncConnectedDoorsAttrs();
    }

    var utlSelect = card.querySelector('select.door-suggested-hardware-upper-track-length, select[data-hw-upper-track-length-select]');
    if (utlSelect) {
      if (window.__landingHardwareFirstUpperTrackLength) {
        utlSelect.value = String(window.__landingHardwareFirstUpperTrackLength);
      }
      utlSelect.addEventListener('change', function () {
        syncUpperTrackLengthAttrs();
        syncCartProperties();
      });
      enhanceDoorSelectWithDivDropdown(utlSelect);
      syncUpperTrackLengthAttrs();
    }

    var mdsSelect = card.querySelector('select.door-suggested-hardware-max-door-size, select[data-hw-max-door-size-select]');
    if (mdsSelect) {
      if (window.__landingHardwareFirstMaxDoorSize) {
        mdsSelect.value = String(window.__landingHardwareFirstMaxDoorSize);
      }
      mdsSelect.addEventListener('change', function () {
        syncMaxDoorSizeAttrs();
        syncCartProperties();
      });
      enhanceDoorSelectWithDivDropdown(mdsSelect);
      syncMaxDoorSizeAttrs();
    }

    var cptSelect = card.querySelector('select.door-suggested-hardware-carriage-pack-type, select[data-hw-carriage-pack-type-select]');
    if (cptSelect) {
      if (window.__landingHardwareFirstCarriagePackType) {
        cptSelect.value = String(window.__landingHardwareFirstCarriagePackType);
      }
      cptSelect.addEventListener('change', function () {
        syncCarriagePackTypeAttrs();
        syncCartProperties();
      });
      enhanceDoorSelectWithDivDropdown(cptSelect);
      syncCarriagePackTypeAttrs();
    }

    var shlSelect = card.querySelector('select.door-suggested-hardware-strap-hinge-length, select[data-hw-strap-hinge-length-select]');
    if (shlSelect) {
      if (window.__landingHardwareFirstStrapHingeLength) {
        shlSelect.value = String(window.__landingHardwareFirstStrapHingeLength);
      }
      shlSelect.addEventListener('change', function () {
        syncStrapHingeLengthAttrs();
        syncCartProperties();
      });
      enhanceDoorSelectWithDivDropdown(shlSelect);
      syncStrapHingeLengthAttrs();
    }

    forms.forEach(function (form) {
      form.addEventListener('submit', syncCartProperties);
    });

    syncCartProperties();
  }

  function bootMillworkLengthConfig() {
    var lengthRoots = document.querySelectorAll('[data-millwork-length-config="1"], [data-millwork-baluster-length-config="1"], [data-millwork-custom-length-config="1"]');
    if (!lengthRoots.length) return;
    lengthRoots.forEach(function (root) {
      var selects = root.querySelectorAll('[data-millwork-length-select], [data-millwork-baluster-length-select], [data-millwork-custom-length-select], [data-millwork-custom-thickness-select]');
      selects.forEach(function (lengthSelect) {
        if (lengthSelect && lengthSelect.getAttribute('data-door-div-select') !== '1') {
          enhanceDoorSelectWithDivDropdown(lengthSelect);
        }
      });
    });
  }

  function bootLandingHardwareConfig() {
    var root = document.querySelector('[data-landing-hardware-config="1"]');
    if (!root) return;
    var card = root.querySelector('.door-suggested-hardware-card');
    if (card) bindLandingHardwareCard(card);

    var fnSelect = root.querySelector('select.door-suggested-hardware-function, select[data-hw-function-select]');
    if (fnSelect && fnSelect.getAttribute('data-door-div-select') !== '1') {
      enhanceDoorSelectWithDivDropdown(fnSelect);
    }

    var ccSelect = root.querySelector('select.door-suggested-hardware-closer-color, select[data-hw-closer-color-select]');
    if (ccSelect && ccSelect.getAttribute('data-door-div-select') !== '1') {
      enhanceDoorSelectWithDivDropdown(ccSelect);
    }

    var thickSelect = root.querySelector('select.door-suggested-hardware-thickness, select[data-hw-thickness-select]');
    if (thickSelect && thickSelect.getAttribute('data-door-div-select') !== '1') {
      enhanceDoorSelectWithDivDropdown(thickSelect);
    }

    var sdSelect = root.querySelector('select.door-suggested-hardware-swing-direction, select[data-hw-swing-direction-select]');
    if (sdSelect && sdSelect.getAttribute('data-door-div-select') !== '1') {
      enhanceDoorSelectWithDivDropdown(sdSelect);
    }

    var bsSelect = root.querySelector('select.door-suggested-hardware-backset, select[data-hw-backset-select]');
    if (bsSelect && bsSelect.getAttribute('data-door-div-select') !== '1') {
      enhanceDoorSelectWithDivDropdown(bsSelect);
    }

    var tlSelect = root.querySelector('select.door-suggested-hardware-track-length, select[data-hw-track-length-select]');
    if (tlSelect && tlSelect.getAttribute('data-door-div-select') !== '1') {
      enhanceDoorSelectWithDivDropdown(tlSelect);
    }

    var cdSelect = root.querySelector('select.door-suggested-hardware-connected-doors, select[data-hw-connected-doors-select]');
    if (cdSelect && cdSelect.getAttribute('data-door-div-select') !== '1') {
      enhanceDoorSelectWithDivDropdown(cdSelect);
    }

    var utlSelect = root.querySelector('select.door-suggested-hardware-upper-track-length, select[data-hw-upper-track-length-select]');
    if (utlSelect && utlSelect.getAttribute('data-door-div-select') !== '1') {
      enhanceDoorSelectWithDivDropdown(utlSelect);
    }

    var mdsSelect = root.querySelector('select.door-suggested-hardware-max-door-size, select[data-hw-max-door-size-select]');
    if (mdsSelect && mdsSelect.getAttribute('data-door-div-select') !== '1') {
      enhanceDoorSelectWithDivDropdown(mdsSelect);
    }

    var cptSelect = root.querySelector('select.door-suggested-hardware-carriage-pack-type, select[data-hw-carriage-pack-type-select]');
    if (cptSelect && cptSelect.getAttribute('data-door-div-select') !== '1') {
      enhanceDoorSelectWithDivDropdown(cptSelect);
    }

    var shlSelect = root.querySelector('select.door-suggested-hardware-strap-hinge-length, select[data-hw-strap-hinge-length-select]');
    if (shlSelect && shlSelect.getAttribute('data-door-div-select') !== '1') {
      enhanceDoorSelectWithDivDropdown(shlSelect);
    }
  }

  window.__landingHardwareEnhanceSelect = enhanceDoorSelectWithDivDropdown;
  window.__bootLandingHardwareConfig = bootLandingHardwareConfig;
  window.__bootMillworkLengthConfig = bootMillworkLengthConfig;

  var DOOR_SEAL_KIT_MATCHING_VALUE = 'matching_wood_stops_and_seals';
  /** Must match door_sweep schema option value for the matching-wood sweep choice. */
  var DOOR_SWEEP_MATCHING_VALUE = 'matching_wood_door_sweep';
  var PRIMING_VALUE_PRICE_FIELD = {
    primed_white: 'white',
    primed_grey: 'grey',
    primed_gray: 'grey'
  };
  var doorSealKitCatalogCache = null;
  var doorSweepsCatalogCache = null;
  var primingServicesCatalogCache = null;
  var millworkPricingRecordsCache = null;
  var millworkWoodCatalogCache = null;
  var appliedMoldingPricingMapCache = null;
  var millworkPricingRecordsParseError = null;

  function normWoodTypeSlug(s) {
    return String(s == null ? '' : s).toLowerCase().replace(/-/g, '_').replace(/\s+/g, '_').trim();
  }

  function normPrimingValueKey(s) {
    return String(s == null ? '' : s).trim().toLowerCase().replace(/-/g, '_').replace(/\s+/g, '_');
  }

  function normCollectionSlug(s) {
    return String(s == null ? '' : s)
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-');
  }

  function readDoorSealKitCatalog() {
    if (doorSealKitCatalogCache) return doorSealKitCatalogCache;
    doorSealKitCatalogCache = readJsonScriptArray('door-seal-kit-catalog-json');
    return doorSealKitCatalogCache;
  }

  function readDoorSweepsCatalog() {
    if (doorSweepsCatalogCache) return doorSweepsCatalogCache;
    doorSweepsCatalogCache = readJsonScriptArray('door-sweeps-catalog-json');
    return doorSweepsCatalogCache;
  }

  function readPrimingServicesCatalog() {
    if (primingServicesCatalogCache) return primingServicesCatalogCache;
    primingServicesCatalogCache = readJsonScriptArray('door-priming-services-catalog-json');
    return primingServicesCatalogCache;
  }

  function readMillworkPricingRecords() {
    var el = document.getElementById('door-millwork-product-pricing-json');
    if (!el) {
      if (Array.isArray(window.millwork_pricing_records) && window.millwork_pricing_records.length) {
        return window.millwork_pricing_records;
      }
      return millworkPricingRecordsCache || [];
    }
    var raw = String(el.textContent || el.innerHTML || '').trim();
    if (!raw || raw === '[]') {
      millworkPricingRecordsCache = [];
      return [];
    }
    try {
      var parsed = JSON.parse(raw);
      millworkPricingRecordsCache = Array.isArray(parsed) ? parsed : [];
      millworkPricingRecordsParseError = null;
    } catch (eParse) {
      millworkPricingRecordsCache = [];
      millworkPricingRecordsParseError = String(eParse && eParse.message ? eParse.message : eParse);
    }
    return millworkPricingRecordsCache;
  }

  function readAppliedMoldingPricingMap() {
    var el = document.getElementById('door-applied-molding-pricing-json');
    if (!el) return appliedMoldingPricingMapCache || {};
    var raw = String(el.textContent || el.innerHTML || '').trim();
    if (!raw || raw === '{}') {
      appliedMoldingPricingMapCache = {};
      return appliedMoldingPricingMapCache;
    }
    try {
      var parsed = JSON.parse(raw);
      appliedMoldingPricingMapCache = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (eMap) {
      appliedMoldingPricingMapCache = {};
    }
    return appliedMoldingPricingMapCache;
  }

  function readMillworkWoodCatalog() {
    if (millworkWoodCatalogCache) return millworkWoodCatalogCache;
    millworkWoodCatalogCache = readJsonScriptArray('door-millwork-wood-catalog-json');
    return millworkWoodCatalogCache;
  }

  function skuComparable(v) {
    return String(v == null ? '' : v).trim().toLowerCase();
  }

  function skuStrict(v) {
    return skuComparable(v).replace(/[^a-z0-9]/g, '');
  }

  /** sm1 -> sm-1 (Shopify metaobject handles often use sm-1-1 while choice value is sm1). */
  function guessMillworkHandleFromChoice(choice) {
    var c = skuComparable(choice);
    if (!c || c.length < 3) return '';
    var prefix = c.slice(0, 2);
    var suffix = c.slice(2);
    if (!suffix || !/^\d+$/.test(suffix)) return '';
    return prefix + '-' + suffix;
  }

  function millworkPricingRowMatchesChoice(choice, row) {
    if (!row || !choice) return false;
    var want = skuComparable(choice);
    var wantStrict = skuStrict(choice);
    if (!want) return false;
    var rowSku = skuComparable(row.sku);
    var rowHandle = skuComparable(row.handle);
    var rowDisplay = skuComparable(row.display_name);
    if (rowSku && rowSku === want) return true;
    if (rowHandle && rowHandle === want) return true;
    if (rowDisplay && rowDisplay === want) return true;
    if (rowSku && skuStrict(rowSku) === wantStrict) return true;
    if (rowHandle && skuStrict(rowHandle) === wantStrict) return true;
    if (rowDisplay && skuStrict(rowDisplay) === wantStrict) return true;
    var guess = guessMillworkHandleFromChoice(choice);
    if (!guess || !rowHandle) return false;
    if (rowHandle === guess) return true;
    if (rowHandle.length > guess.length && rowHandle.indexOf(guess) === 0 && rowHandle.charAt(guess.length) === '-') {
      return true;
    }
    return false;
  }

  function normProfileKey(v) {
    return String(v == null ? '' : v).trim().toLowerCase().replace(/[\s-]+/g, '_');
  }

  function isElementVisibleForPricing(el) {
    if (!el) return false;
    if (el.classList && el.classList.contains('door-hidden')) return false;
    if (el.getAttribute && el.getAttribute('hidden') != null) return false;
    if (el.style && el.style.display === 'none') return false;
    try {
      if (el.offsetParent !== null) return true;
      var r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    } catch (eVis) {
      return true;
    }
  }

  /** Tier price applies when an applied_molding choice is selected and its section is visible. */
  function isAppliedMoldingPricingActive(config) {
    var moldingVal = getRawAppliedMoldingValue(config);
    if (!moldingVal) return false;
    var root = document.getElementById('door-configurator-options') || document;
    var wraps = root.querySelectorAll(
      '.door-option-wrap[data-option-id="applied_molding"], .door-option-wrap[data-option-id="applied_molding_choice"]'
    );
    if (wraps.length) {
      var anyWrapVisible = false;
      for (var wi = 0; wi < wraps.length; wi++) {
        if (isElementVisibleForPricing(wraps[wi])) {
          anyWrapVisible = true;
          break;
        }
      }
      if (!anyWrapVisible) return false;
    }
    var checked = root.querySelector(
      'input[type="radio"][data-option-id="applied_molding"]:checked,' +
      'input[type="radio"][data-option-id="applied_molding_choice"]:checked'
    );
    if (checked) {
      var card = checked.closest ? checked.closest('.common-check-option') : null;
      if (card && !isElementVisibleForPricing(card)) return false;
      var wrap = checked.closest ? checked.closest('.door-option-wrap[data-option-id]') : null;
      if (wrap && !isElementVisibleForPricing(wrap)) return false;
    }
    return true;
  }

  /** @deprecated alias — use isAppliedMoldingPricingActive */
  function isAppliedMoldingStileActive(config) {
    return isAppliedMoldingPricingActive(config);
  }

  function getRawAppliedMoldingValue(config) {
    config = config || {};
    var fromDom = getOptionValueFromDom('applied_molding') || getOptionValueFromDom('applied_molding_choice');
    if (fromDom) return fromDom;
    var val = config.applied_molding != null ? String(config.applied_molding).trim() : '';
    if (!val && config.applied_molding_choice != null) {
      val = String(config.applied_molding_choice).trim();
    }
    return val;
  }

  function parseWoodPricesByTier(row) {
    if (!row) return {};
    var map = row.wood_prices_by_tier;
    if (typeof map === 'string') {
      try { map = JSON.parse(map); } catch (eMap) { map = {}; }
    }
    if (map && map.wood_prices_by_tier) map = map.wood_prices_by_tier;
    return map && typeof map === 'object' ? map : {};
  }

  function isAppliedMoldingOptionId(id) {
    var n = String(id || '').toLowerCase().replace(/-/g, '_').replace(/\s+/g, '_');
    return n === 'applied_molding' || n === 'applied_molding_choice';
  }

  function readDoorConfigSchemaArray() {
    try {
      if (Array.isArray(window.__doorConfigSchema)) return window.__doorConfigSchema;
      var el = document.getElementById('door-configurator-schema');
      if (!el) return [];
      var parsed = JSON.parse(String(el.textContent || el.innerHTML || '[]').trim());
      return Array.isArray(parsed) ? parsed : [];
    } catch (eSchema) {
      return [];
    }
  }

  function findMillworkPricingRowFromSchema(sku) {
    var want = skuComparable(sku);
    var wantStrict = skuStrict(sku);
    if (!want && !wantStrict) return null;
    var schema = readDoorConfigSchemaArray();
    for (var i = 0; i < schema.length; i++) {
      var opt = schema[i];
      if (!opt || !isAppliedMoldingOptionId(opt.id)) continue;
      var choices = Array.isArray(opt.options) ? opt.options : [];
      for (var j = 0; j < choices.length; j++) {
        var ch = choices[j] || {};
        var chVal = skuComparable(ch.value);
        if (chVal !== want && skuStrict(ch.value) !== wantStrict) continue;
        var tierMap = ch.wood_prices_by_tier;
        if (!tierMap || typeof tierMap !== 'object') continue;
        return {
          sku: ch.value,
          handle: ch.value,
          display_name: ch.label || ch.title || ch.value,
          wood_prices_by_tier: tierMap
        };
      }
    }
    return null;
  }

  function findMillworkPricingRowBySku(sku) {
    var want = skuComparable(sku);
    var wantStrict = skuStrict(sku);
    if (!want && !wantStrict) return null;

    var fromSchema = findMillworkPricingRowFromSchema(sku);
    if (fromSchema) {
      fromSchema._lookupSource = 'door_config_schema';
      return fromSchema;
    }

    var amMap = readAppliedMoldingPricingMap();
    if (amMap[want]) {
      amMap[want]._lookupSource = 'applied_molding_map';
      return amMap[want];
    }
    if (wantStrict && amMap[wantStrict]) {
      amMap[wantStrict]._lookupSource = 'applied_molding_map';
      return amMap[wantStrict];
    }
    var amKeys = Object.keys(amMap);
    for (var am = 0; am < amKeys.length; am++) {
      var amKey = amKeys[am];
      var amRow = amMap[amKey];
      if (!amRow) continue;
      if (millworkPricingRowMatchesChoice(sku, amRow) || skuComparable(amKey) === want || skuStrict(amKey) === wantStrict) {
        amRow._lookupSource = 'applied_molding_map';
        return amRow;
      }
    }

    var records = readMillworkPricingRecords();
    for (var i = 0; i < records.length; i++) {
      var row = records[i] || {};
      if (millworkPricingRowMatchesChoice(sku, row)) {
        row._lookupSource = 'pricing_catalog';
        return row;
      }
    }
    return null;
  }

  function getSelectedWoodTypeValue(config) {
    config = config || {};
    if (config.wood_type != null && String(config.wood_type).trim()) {
      return String(config.wood_type).trim();
    }
    return getOptionValueFromDom('wood_type');
  }

  function getSelectedAppliedMoldingValue(config) {
    if (!isAppliedMoldingPricingActive(config)) return '';
    return getRawAppliedMoldingValue(config);
  }

  function resolveWoodTierId(woodTypeRaw) {
    var slug = normWoodTypeSlug(woodTypeRaw);
    if (!slug) return '';
    var catalog = readMillworkWoodCatalog();
    for (var i = 0; i < catalog.length; i++) {
      var entry = catalog[i] || {};
      var speciesKey = normWoodTypeSlug(entry.species_key);
      var displayName = normWoodTypeSlug(entry.display_name);
      if ((speciesKey && speciesKey === slug) || (displayName && displayName === slug)) {
        return String(entry.tier_id || '').trim();
      }
    }
    return '';
  }

  function getAppliedMoldingTierAddonPrice(config) {
    var woodType = getSelectedWoodTypeValue(config);
    var moldingSku = getSelectedAppliedMoldingValue(config);
    if (!moldingSku) {
      return { addon: 0, woodType: woodType, tierId: '', moldingSku: '', rowFound: false, tierPrice: 0 };
    }
    if (!woodType) {
      return { addon: 0, woodType: '', tierId: '', moldingSku: moldingSku, rowFound: false, tierPrice: 0 };
    }
    var tierId = resolveWoodTierId(woodType);
    if (!tierId) {
      return { addon: 0, woodType: woodType, tierId: '', moldingSku: moldingSku, rowFound: false, tierPrice: 0 };
    }
    var row = findMillworkPricingRowBySku(moldingSku);
    if (!row) {
      return {
        addon: 0,
        woodType: woodType,
        tierId: tierId,
        moldingSku: moldingSku,
        rowFound: false,
        tierPrice: 0,
        pricingRecordsCount: readMillworkPricingRecords().length,
        appliedMoldingMapKeys: Object.keys(readAppliedMoldingPricingMap()),
        pricingParseError: millworkPricingRecordsParseError
      };
    }
    var tierMap = parseWoodPricesByTier(row);
    var price = parseFloat(tierMap[tierId]);
    var addon = isNaN(price) ? 0 : price;
    return {
      addon: addon,
      woodType: woodType,
      tierId: tierId,
      moldingSku: moldingSku,
      rowFound: true,
      tierPrice: addon,
      tierMap: tierMap,
      matchedSku: row.sku || row.handle || moldingSku,
      pricingRecordsCount: readMillworkPricingRecords().length,
      appliedMoldingMapKeys: Object.keys(readAppliedMoldingPricingMap()),
      lookupSource: row._lookupSource || 'unknown'
    };
  }

  function logAppliedMoldingTierPricing(result) {
    if (!result) return;
    try {
      console.groupCollapsed('[door-pricing] applied molding tier');
      console.log('applied_molding:', result.moldingSku || '(none)');
      console.log('wood_type:', result.woodType || '(none)');
      console.log('tier_id:', result.tierId || '(unresolved)');
      console.log('pricing_row_found:', !!result.rowFound);
      console.log('pricing_records_count:', result.pricingRecordsCount);
      console.log('applied_molding_map_keys:', result.appliedMoldingMapKeys);
      if (result.lookupSource) console.log('lookup_source:', result.lookupSource);
      if (result.pricingParseError) console.warn('pricing_json_parse_error:', result.pricingParseError);
      if (result.rowFound) {
        console.log('matched_pricing_sku:', result.matchedSku);
        console.log('wood_prices_by_tier:', result.tierMap);
      }
      console.log('tier_price:', result.tierPrice);
      console.log('addon_applied:', result.addon);
      if (result.moldingSku && !result.woodType) {
        console.log('note: molding selected — waiting for wood_type before adding tier price');
      } else if (result.moldingSku && result.woodType && !result.tierId) {
        console.warn('[door-pricing] wood_type has no tier_id in millwork_wood_catalog');
      } else if (result.moldingSku && result.woodType && result.tierId && !result.rowFound) {
        console.warn('[door-pricing] no millwork_product_pricing row for applied molding — choice value may differ from metaobject handle (e.g. sm1 vs sm-1-1); set sku field to match choice value');
      } else if (result.moldingSku && result.woodType && result.tierId && result.rowFound && result.addon <= 0) {
        console.warn('[door-pricing] tier price is 0 for tier', result.tierId);
      }
      console.groupEnd();
    } catch (eLogAm) {}
  }

  function syncAppliedMoldingTierAddonPrice(config) {
    var result = getAppliedMoldingTierAddonPrice(config);
    var addon = result && typeof result.addon === 'number' ? result.addon : 0;
    window.__doorAddon_applied_molding_tier = addon;
    if (result && result.moldingSku && isAppliedMoldingPricingActive(config)) {
      logAppliedMoldingTierPricing(result);
    }
    return addon;
  }

  function getCollectionHandleFromUrl() {
    try {
      var match = window.location.pathname.match(/\/collections\/([^/?#]+)/);
      return match ? normCollectionSlug(match[1]) : '';
    } catch (e) {
      return '';
    }
  }

  function getOptionValueFromDom(optionId) {
    var root = document.getElementById('door-configurator-options') || document;
    var checked = root.querySelector('input[type="radio"][data-option-id="' + optionId + '"]:checked');
    if (checked && checked.value) return String(checked.value).trim();
    var sel = root.querySelector('select[data-option-id="' + optionId + '"]');
    if (sel && sel.value) return String(sel.value).trim();
    return '';
  }

  function getSelectedWoodTypeStormPorchValue(config) {
    config = config || {};
    if (config.wood_type_storm_porch != null && String(config.wood_type_storm_porch).trim()) {
      return String(config.wood_type_storm_porch).trim();
    }
    return getOptionValueFromDom('wood_type_storm_porch');
  }

  function findDoorSealKitRowForWood(woodTypeRaw) {
    var woodSlug = normWoodTypeSlug(woodTypeRaw);
    if (!woodSlug) return null;
    var catalog = readDoorSealKitCatalog();
    for (var i = 0; i < catalog.length; i++) {
      var row = catalog[i];
      if (!row) continue;
      if (normWoodTypeSlug(row.wood_name) === woodSlug) return row;
    }
    return null;
  }

  function getDoorSealKitMatchingAddonPrice(config) {
    config = config || {};
    var sealVal = config.door_seal_kit != null ? String(config.door_seal_kit).trim() : '';
    if (!sealVal) sealVal = getOptionValueFromDom('door_seal_kit');
    if (sealVal !== DOOR_SEAL_KIT_MATCHING_VALUE) return 0;
    var match = findDoorSealKitRowForWood(getSelectedWoodTypeStormPorchValue(config));
    if (!match || match.price == null) return 0;
    var price = parseFloat(match.price);
    return isNaN(price) ? 0 : price;
  }

  function syncDoorSealKitMatchingAddonPrice(config) {
    var addon = getDoorSealKitMatchingAddonPrice(config);
    window.__doorAddon_door_seal_kit_matching = addon;
    return addon;
  }

  function findDoorSweepsRowForWood(woodTypeRaw) {
    var woodSlug = normWoodTypeSlug(woodTypeRaw);
    if (!woodSlug) return null;
    var catalog = readDoorSweepsCatalog();
    for (var si = 0; si < catalog.length; si++) {
      var row = catalog[si];
      if (!row) continue;
      if (normWoodTypeSlug(row.wood_name) === woodSlug) return row;
    }
    return null;
  }

  function getDoorSweepsMatchingAddonPrice(config) {
    config = config || {};
    var sweepVal = config.door_sweep != null ? String(config.door_sweep).trim() : '';
    if (!sweepVal) sweepVal = getOptionValueFromDom('door_sweep');
    if (normPrimingValueKey(sweepVal) !== normPrimingValueKey(DOOR_SWEEP_MATCHING_VALUE)) return 0;
    var match = findDoorSweepsRowForWood(getSelectedWoodTypeStormPorchValue(config));
    if (!match || match.price == null) return 0;
    var price = parseFloat(match.price);
    return isNaN(price) ? 0 : price;
  }

  function syncDoorSweepsMatchingAddonPrice(config) {
    var addon = getDoorSweepsMatchingAddonPrice(config);
    window.__doorAddon_door_sweeps_matching = addon;
    return addon;
  }

  function getSelectedPrimingValue(config) {
    config = config || {};
    if (config.priming != null && String(config.priming).trim()) return String(config.priming).trim();
    return getOptionValueFromDom('priming');
  }

  function findPrimingServicesRowByCollectionHandle(collectionHandle, catalog) {
    var slug = normCollectionSlug(collectionHandle);
    if (!slug) return null;
    catalog = catalog || readPrimingServicesCatalog();
    for (var pi = 0; pi < catalog.length; pi++) {
      var row = catalog[pi];
      if (!row) continue;
      var dn = normCollectionSlug(row.display_name || row.handle || '');
      if (dn === slug) return row;
    }
    return null;
  }

  function findPrimingServicesRowByPrehungDoorType(doorTypeKey, catalog) {
    var doorSlug = normPrimingValueKey(doorTypeKey);
    if (!doorSlug) return null;
    catalog = catalog || readPrimingServicesCatalog();
    for (var pj = 0; pj < catalog.length; pj++) {
      var row2 = catalog[pj];
      if (!row2) continue;
      if (row2.prehung != null && normPrimingValueKey(row2.prehung) === doorSlug) return row2;
      var dn2 = normCollectionSlug(row2.display_name || row2.handle || '');
      if (doorSlug === 'double_door' && dn2.indexOf('double') !== -1) return row2;
      if (doorSlug === 'single_door' && dn2.indexOf('single') !== -1) return row2;
    }
    return null;
  }

  function getSelectedDoorSetupTypeForPriming(config) {
    config = config || {};
    var keys = Object.keys(config);
    for (var ki = 0; ki < keys.length; ki++) {
      var val = config[keys[ki]];
      var list = Array.isArray(val) ? val : (val != null && val !== '' ? [val] : []);
      for (var li = 0; li < list.length; li++) {
        var norm = normPrimingValueKey(list[li]);
        if (norm === 'single_door' || norm === 'double_door') return norm;
      }
    }
    return '';
  }

  function getCurrentCollectionHandleForPrimingServices() {
    var fromUrl = getCollectionHandleFromUrl();
    if (fromUrl) return fromUrl;
    try {
      var main = document.getElementById('door-configurator');
      if (!main) return '';
      var routeCol = main.getAttribute('data-route-collection') || '';
      if (routeCol) return normCollectionSlug(routeCol);
      var handlesJson = main.getAttribute('data-product-collection-handles') || '[]';
      var handles = JSON.parse(handlesJson);
      if (!Array.isArray(handles) || !handles.length) return '';
      var catalog = readPrimingServicesCatalog();
      for (var hi = 0; hi < handles.length; hi++) {
        var h = normCollectionSlug(handles[hi]);
        if (findPrimingServicesRowByCollectionHandle(h, catalog)) return h;
      }
      return normCollectionSlug(handles[0]);
    } catch (eCol) { }
    return '';
  }

  function getPrimingServicesAddonPrice(config) {
    config = config || {};
    var primingVal = getSelectedPrimingValue(config);
    var priceField = PRIMING_VALUE_PRICE_FIELD[normPrimingValueKey(primingVal)];
    if (!priceField) return 0;
    var catalog = readPrimingServicesCatalog();
    var collectionHandle = getCurrentCollectionHandleForPrimingServices();
    var row = findPrimingServicesRowByCollectionHandle(collectionHandle, catalog);
    if (!row) {
      var doorType = getSelectedDoorSetupTypeForPriming(config);
      if (doorType) row = findPrimingServicesRowByPrehungDoorType(doorType, catalog);
    }
    if (!row || row[priceField] == null) return 0;
    var price = parseFloat(row[priceField]);
    return isNaN(price) ? 0 : price;
  }

  function syncPrimingServicesAddonPrice(config) {
    var addon = getPrimingServicesAddonPrice(config);
    window.__doorAddon_priming_services = addon;
    return addon;
  }

  function applyCatalogMetaobjectAddons(config) {
    var sealKit = 0;
    var doorSweeps = 0;
    var priming = 0;
    var appliedMolding = 0;
    try { sealKit = syncDoorSealKitMatchingAddonPrice(config); } catch (eSeal) {
      window.__doorAddon_door_seal_kit_matching = 0;
    }
    try { doorSweeps = syncDoorSweepsMatchingAddonPrice(config); } catch (eSweep) {
      window.__doorAddon_door_sweeps_matching = 0;
    }
    try { priming = syncPrimingServicesAddonPrice(config); } catch (ePrim) {
      window.__doorAddon_priming_services = 0;
    }
    try { appliedMolding = syncAppliedMoldingTierAddonPrice(config); } catch (eAm) {
      window.__doorAddon_applied_molding_tier = 0;
    }
    return {
      sealKit: sealKit,
      doorSweeps: doorSweeps,
      priming: priming,
      appliedMolding: appliedMolding,
      total: sealKit + doorSweeps + priming + appliedMolding
    };
  }

  function ensureDoorPriceBoxVisible() {
    if (window.__doorSelectionLogOnly) return;
    try {
      var priceBox = document.querySelector('#door-configurator .door-price-box');
      if (priceBox) {
        priceBox.style.display = '';
        priceBox.removeAttribute('hidden');
      }
      var addBtn = document.getElementById('door-add-to-cart-btn');
      if (addBtn) addBtn.style.display = '';
    } catch (eBox) { }
  }

  // ---------------------------------------------------------------------------
  // HubSpot deal sync (moved from door-conf2.js)
  // ---------------------------------------------------------------------------
  var hubspotDeps = null;

  function hsNormVal(v) {
    return String(v == null ? '' : v).toLowerCase().replace(/-/g, '_').trim();
  }

  function hsAnyConfigValueEquals(config, target) {
    if (!config) return false;
    target = hsNormVal(target);
    return Object.keys(config).some(function (k) {
      if (!k || k.charAt(0) === '_') return false;
      var val = config[k];
      if (Array.isArray(val)) return val.some(function (x) { return hsNormVal(x) === target; });
      return hsNormVal(val) === target;
    });
  }

  var HS_MEASURE_RULES = [
    { setup: 'slab_only', measure: 'exact_door_size',
      ids: ['exact-door-width-int', 'exact-door-width-frac', 'door_height', 'door_height_fraction', 'exact-door-thickness-frac'] },
    { setup: 'pre_hung_on_jamb', measure: 'exact_door_size',
      ids: ['exact-door-width-int', 'exact-door-width-frac', 'door_height', 'door_height_fraction', 'exact-door-thickness-frac', 'exact-pre-hung-frac'] }
  ];

  function hsMeasureSelect(id) {
    var sel = document.getElementById(id);
    if (!sel || sel.tagName !== 'SELECT') return null;
    return sel;
  }

  function hsMeasureDisplay(sel) {
    if (!sel) return '';
    var op = sel.options && sel.selectedIndex >= 0 ? sel.options[sel.selectedIndex] : null;
    if (op && String(op.value) !== '') return String(op.textContent || op.value || '').trim();
    return '';
  }

  function hsMeasureLabel(sel, id) {
    var row = sel && sel.closest ? sel.closest('.door-measure-dimension-row') : null;
    var t = row ? row.querySelector('.door-measure-dimension-title') : null;
    var title = t ? String(t.textContent || '').trim() : '';
    var isFrac = /frac/i.test(id);
    return title ? (title + (isFrac ? ' (fraction)' : '')) : id;
  }

  function buildHubspotExtraSummaryParts(config) {
    var parts = [];
    try {
      var bevel = document.querySelector('input[type="checkbox"][data-option-id="glass_bevel"]');
      if (bevel) parts.push('Bevel Glass: ' + (bevel.checked ? 'Add Bevel Glass' : 'No Bevel Glass'));
    } catch (eB) { }
    try {
      var getHw = hubspotDeps && hubspotDeps.getHardwareSelectionsForConfig;
      var hwRows = getHw ? getHw() : [];
      hwRows.forEach(function (row, idx) {
        if (!row) return;
        var t = String(row.title || row.product_id || '');
        if (row.finish_label) t += ' — ' + row.finish_label;
        if (row.function_label) t += ' — ' + row.function_label;
        if (row.qty && row.qty > 1) t += ' (×' + row.qty + ')';
        if (t) parts.push((idx === 0 ? 'Hardware' : 'Hardware ' + (idx + 1)) + ': ' + t);
      });
    } catch (eH) { }
    try {
      var measureType = hsNormVal(config && config.measurement_type);
      for (var i = 0; i < HS_MEASURE_RULES.length; i++) {
        var r = HS_MEASURE_RULES[i];
        if (r.measure === measureType && hsAnyConfigValueEquals(config, r.setup)) {
          r.ids.forEach(function (id) {
            var sel = hsMeasureSelect(id);
            var val = hsMeasureDisplay(sel);
            if (val) parts.push(hsMeasureLabel(sel, id) + ': ' + val);
          });
          break;
        }
      }
    } catch (eM) { }
    return parts;
  }

  function buildHubspotSummary(baseParts, config, qty) {
    var parts = (baseParts || []).slice().concat(buildHubspotExtraSummaryParts(config));
    if (qty != null) parts.push('Quantity: ' + qty);
    return parts.join('; ');
  }

  function getDoorQuantityInput() {
    var byId = document.getElementById('door-config-quantity');
    if (byId) return byId;
    var landingQty = document.getElementById('landing-config-quantity');
    if (landingQty) return landingQty;
    var landingRoot = document.getElementById('landing-product-configurator');
    if (landingRoot) {
      var landingWrapQty = landingRoot.querySelector('.landing-product-qty-row input[name="quantity"]');
      if (landingWrapQty) return landingWrapQty;
    }
    var container = document.getElementById('door-configurator');
    if (!container) return null;
    return container.querySelector('.door-add-to-cart-wrap input[name="quantity"]');
  }

  function getHubspotContainerEl() {
    return document.getElementById('door-configurator')
      || document.getElementById('landing-product-configurator');
  }

  function getDoorQuantity() {
    var qtyInput = getDoorQuantityInput();
    if (qtyInput) {
      var qtyVal = parseInt(qtyInput.value, 10);
      if (!isNaN(qtyVal) && qtyVal >= 1) return qtyVal;
    }
    try {
      var getCfg = hubspotDeps && hubspotDeps.getCurrentConfig;
      var config = getCfg ? getCfg() : null;
      if (config && config._quantity != null) {
        var stored = parseInt(config._quantity, 10);
        if (!isNaN(stored) && stored >= 1) return stored;
      }
    } catch (eQty) { }
    return 1;
  }

  function getHubspotAppliedLineTotal(container, qty) {
    qty = Math.max(1, parseInt(qty, 10) || 1);
    var readPrice = hubspotDeps && hubspotDeps.readDoorEstimatedPriceFromDom;
    var unitApplied = readPrice ? readPrice() : 0;
    if (unitApplied <= 0 && container) {
      var basePrice = parseFloat(container.getAttribute('data-base-price')) || 0;
      var getCfg = hubspotDeps && hubspotDeps.getCurrentConfig;
      var calcPrice = hubspotDeps && hubspotDeps.calculateDoorPrice;
      var config = getCfg ? getCfg() : {};
      var priced = calcPrice ? calcPrice(basePrice, config) : null;
      unitApplied = priced && priced.price != null ? parseFloat(priced.price) : basePrice;
      if (isNaN(unitApplied)) unitApplied = 0;
    }
    return Math.round(unitApplied * qty * 100) / 100;
  }

  function formatHubspotApiError(data) {
    if (!data) return 'Unknown HubSpot error';
    if (data.error) return String(data.error);
    if (data.detail && data.detail.message) return String(data.detail.message);
    if (typeof data.detail === 'string') return data.detail;
    try {
      var raw = JSON.stringify(data.detail || data);
      return raw.length > 320 ? raw.substring(0, 320) + '…' : raw;
    } catch (eFmt) {
      return 'HubSpot request failed';
    }
  }

  function parseHubspotFetchResponse(res) {
    return res.json()
      .then(function (data) {
        return { ok: res.ok, status: res.status, data: data };
      })
      .catch(function () {
        return { ok: false, status: res.status, data: null };
      });
  }

  function getSavedProjectNameFromFolder(folderSelect, newFolderInput, folderValue) {
    if (folderValue === '__new__') {
      return newFolderInput && newFolderInput.value ? newFolderInput.value.trim() : '';
    }
    if (folderSelect && folderSelect.options && folderSelect.selectedIndex >= 0) {
      return (folderSelect.options[folderSelect.selectedIndex].text || '').trim();
    }
    return '';
  }

  function resolveHubspotProductTitle(container, config, explicitName) {
    var title = String(explicitName || '').trim();
    if (title) return title;
    if (container) {
      title = String(container.getAttribute('data-product-name') || '').trim();
    }
    config = config || {};
    if (!title && config._product_title) title = String(config._product_title).trim();
    if (!title && container) {
      var titleEl = container.querySelector('.landing-product__title, [data-product-title]');
      if (titleEl) title = String(titleEl.textContent || '').trim();
    }
    if (!title && config._hardware_selections && config._hardware_selections[0]) {
      title = String(config._hardware_selections[0].title || '').trim();
    }
    if (!title && container) {
      var sku = String(container.getAttribute('data-product-sku') || '').trim();
      if (sku) title = sku;
    }
    if (!title && container) {
      var pt = String(container.getAttribute('data-product-type') || '').trim();
      if (pt) title = pt + ' product';
    }
    return title || 'Product configuration';
  }

  function syncHubspotAfterSave(opts) {
    opts = opts || {};
    var endpoint = hubspotDeps && hubspotDeps.hubspotDealEndpoint;
    if (!endpoint || !opts.savedProjectName) return false;

    var container = opts.container;
    var email = opts.email || '';
    var savedProjectName = opts.savedProjectName;
    var messageEl = opts.messageEl;
    var saveButton = opts.saveButton;
    var originalSaveText = opts.originalSaveText;
    var getQueryParam = opts.getQueryParam || function () { return ''; };

    var firstName = (container.getAttribute('data-customer-first-name') || '').trim();
    var lastName = (container.getAttribute('data-customer-last-name') || '').trim();
    var cacheKey = '';
    var cachedHubspotDealId = '';
    var isUpdate = !!opts.isUpdate;
    var editId = opts.editId || '';
    var data = opts.data || {};
    var resolvedConfigId = isUpdate ? String(editId || '') : String(data.id != null ? data.id : '');

    try {
      cacheKey = 'door_hubspot_deal_save__' + email + '__' + encodeURIComponent(savedProjectName);
      cachedHubspotDealId = localStorage.getItem(cacheKey) || '';
    } catch (eCache) { }

    var hubspotLineProps = Object.assign({}, opts.props || {});
    if (resolvedConfigId) hubspotLineProps['Config ID'] = resolvedConfigId;

    var productTypeHs = container ? (container.getAttribute('data-product-type') || '').trim() : '';

    var hubspotPayload = {
      deal_id: cachedHubspotDealId,
      product_id: opts.productId || '',
      product_handle: opts.productHandle || '',
      product_title: resolveHubspotProductTitle(container, opts.configForStorage || opts.config, opts.productName),
      product_sku: opts.productSku || '',
      product_type: productTypeHs,
      options: opts.configForStorage || opts.config || {},
      options_summary: buildHubspotSummary(opts.summaryParts || [], opts.config, opts.qtySave),
      line_item_properties: hubspotLineProps,
      quantity: opts.qtySave,
      base_price: opts.basePrice,
      applied_price: opts.appliedLineTotal,
      currency: opts.currency,
      customer_email: email,
      customer_first_name: firstName,
      customer_last_name: lastName,
      call_requested: '--',
      saved_project_name: savedProjectName,
      config_id: resolvedConfigId
    };
    if (!cachedHubspotDealId) delete hubspotPayload.deal_id;
    if (!resolvedConfigId) delete hubspotPayload.config_id;

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(hubspotPayload)
    })
      .then(parseHubspotFetchResponse)
      .then(function (result) {
        var hbData = result.data;
        if (!result.ok || !hbData || !hbData.success) {
          if (cacheKey) {
            try { localStorage.removeItem(cacheKey); } catch (eClr) { }
          }
          if (typeof console !== 'undefined' && console.error) {
            console.error('HubSpot save deal failed', result.status, hbData);
          }
          if (messageEl) {
            messageEl.innerHTML = messageEl.innerHTML + '<div style="margin-top:0.5rem;color:#b91c1c;">Could not update HubSpot deal: ' + formatHubspotApiError(hbData) + '</div>';
          }
          return;
        }
        if (hbData.dealId && cacheKey) {
          try { localStorage.setItem(cacheKey, hbData.dealId); } catch (eStore) { }
        }
        if (messageEl) {
          var actionLabel = hbData.dealAction === 'create' ? 'created' : 'updated';
          var suffix = ' HubSpot deal ' + actionLabel + '.';
          if (hbData.dealUrl) {
            suffix += ' <a href="' + hbData.dealUrl + '" target="_blank" rel="noopener" style="font-weight:600;">View deal</a>.';
          }
          if (hbData.dealAmount != null) {
            suffix += ' Amount: $' + Number(hbData.dealAmount).toFixed(2) + '.';
          }
          messageEl.innerHTML = messageEl.innerHTML + '<div style="margin-top:0.5rem;color:#059669;">' + suffix + '</div>';
          if (hbData.lineItemWarning) {
            messageEl.innerHTML = messageEl.innerHTML + '<div style="margin-top:0.35rem;color:#b45309;font-size:0.9rem;">' + hbData.lineItemWarning + '</div>';
          }
        }
      })
      .catch(function (err) {
        if (typeof console !== 'undefined' && console.error) {
          console.error('HubSpot save deal network error', err);
        }
        if (messageEl) {
          messageEl.innerHTML = messageEl.innerHTML + '<div style="margin-top:0.5rem;color:#b91c1c;">Could not update HubSpot deal (network error).</div>';
        }
      })
      .finally(function () {
        if (saveButton) {
          saveButton.disabled = false;
          saveButton.textContent = originalSaveText;
        }
      });

    return true;
  }

  function bindHubspotCallbackButton() {
    var endpoint = hubspotDeps && hubspotDeps.hubspotDealEndpoint;
    var folderSelect = hubspotDeps && hubspotDeps.folderSelect;
    var newFolderInput = hubspotDeps && hubspotDeps.newFolderInput;
    var getLineProps = hubspotDeps && hubspotDeps.getLineItemPropertiesFromSchema;
    var getCfg = hubspotDeps && hubspotDeps.getCurrentConfig;
    if (!endpoint) return;

    var hubspotButton = document.getElementById('door-send-to-hubspot-button');
    if (!hubspotButton || hubspotButton.getAttribute('data-hubspot-bound') === '1') return;
    hubspotButton.setAttribute('data-hubspot-bound', '1');

    hubspotButton.addEventListener('click', function () {
      var container = getHubspotContainerEl();
      var messageEl = document.getElementById('door-hubspot-message');
      var emailInput = document.getElementById('door-customer-email');
      if (!container) return;

      var email = (container.getAttribute('data-customer-email') || '').trim() ||
        (emailInput && emailInput.value ? emailInput.value.trim() : '');
      var firstName = (container.getAttribute('data-customer-first-name') || '').trim();
      var lastName = (container.getAttribute('data-customer-last-name') || '').trim();

      if (!email) {
        if (messageEl) {
          messageEl.style.display = 'block';
          messageEl.textContent = 'Please log in so we can attach this configuration to your contact in HubSpot.';
          messageEl.style.color = '#b91c1c';
        }
        return;
      }

      var folderValue = folderSelect ? folderSelect.value : '';
      if (!folderValue) {
        if (messageEl) {
          messageEl.style.display = 'block';
          messageEl.textContent = 'Please select a collection before requesting a callback.';
          messageEl.style.color = '#b91c1c';
        }
        return;
      }
      if (folderValue === '__new__' && (!newFolderInput || !newFolderInput.value.trim())) {
        if (messageEl) {
          messageEl.style.display = 'block';
          messageEl.textContent = 'Please enter a name for the new collection before requesting a callback.';
          messageEl.style.color = '#b91c1c';
        }
        return;
      }

      var savedProjectName = getSavedProjectNameFromFolder(folderSelect, newFolderInput, folderValue);
      var basePrice = parseFloat(container.getAttribute('data-base-price')) || 0;
      var productSkuHs = (container.getAttribute('data-product-sku') || '').trim();
      var config = getCfg ? getCfg() : {};
      var currency = (window.Shopify && window.Shopify.currency && window.Shopify.currency.active ? window.Shopify.currency.active : 'USD');
      var props = getLineProps ? getLineProps() : {};
      var summaryParts = [];
      Object.keys(props || {}).forEach(function (k) {
        var v = props[k];
        if (v != null && v !== '') summaryParts.push(k + ': ' + v);
      });
      var qtyHs = getDoorQuantity();
      var appliedLineTotalHs = getHubspotAppliedLineTotal(container, qtyHs);
      var optionsSummary = buildHubspotSummary(summaryParts, config, qtyHs);

      var productTypeHs = (container.getAttribute('data-product-type') || '').trim();

      var payload = {
        product_id: container.getAttribute('data-product-id') || '',
        product_handle: container.getAttribute('data-product-handle') || '',
        product_title: resolveHubspotProductTitle(container, config, null),
        product_sku: productSkuHs,
        product_type: productTypeHs,
        options: config,
        options_summary: optionsSummary,
        line_item_properties: props || {},
        quantity: qtyHs,
        base_price: basePrice,
        applied_price: appliedLineTotalHs,
        currency: currency,
        customer_email: email,
        customer_first_name: firstName,
        customer_last_name: lastName,
        call_requested: 'YES',
        saved_project_name: savedProjectName
      };

      hubspotButton.disabled = true;
      var originalText = hubspotButton.textContent;
      hubspotButton.textContent = 'Sending to HubSpot...';
      if (messageEl) {
        messageEl.style.display = 'none';
        messageEl.textContent = '';
      }

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(parseHubspotFetchResponse)
        .then(function (result) {
          hubspotButton.disabled = false;
          hubspotButton.textContent = originalText;
          var data = result.data;
          if (messageEl) {
            messageEl.style.display = 'block';
            if (result.ok && data && data.success) {
              messageEl.style.color = '#059669';
              var baseMsg = data.dealAction === 'patch' ? 'Deal updated in HubSpot.' : 'Deal created in HubSpot.';
              if (data.lineItemWarning) baseMsg += ' ' + data.lineItemWarning;
              if (data.dealUrl) {
                messageEl.innerHTML = baseMsg + ' <a href="' + data.dealUrl + '" target="_blank" rel="noopener">View deal</a>.';
              } else {
                messageEl.textContent = baseMsg;
              }
            } else {
              if (typeof console !== 'undefined' && console.error) {
                console.error('HubSpot callback deal failed', result.status, data);
              }
              messageEl.style.color = '#b91c1c';
              messageEl.textContent = 'Could not create deal in HubSpot: ' + formatHubspotApiError(data);
            }
          }
        })
        .catch(function (err) {
          hubspotButton.disabled = false;
          hubspotButton.textContent = originalText;
          if (typeof console !== 'undefined' && console.error) {
            console.error('HubSpot callback network error', err);
          }
          if (messageEl) {
            messageEl.style.display = 'block';
            messageEl.style.color = '#b91c1c';
            messageEl.textContent = 'Something went wrong while contacting HubSpot. Please try again later.';
          }
        });
    });
  }

  function bootHubspotIntegration(deps) {
    hubspotDeps = deps || {};
    hubspotDeps.hubspotDealEndpoint = (hubspotDeps.apiBase || 'https://vintage.espirevox.com') + '/hubspot/api/hubspot-create-deal.php';
    bindHubspotCallbackButton();
    return {
      syncAfterSave: syncHubspotAfterSave,
      getDoorQuantity: getDoorQuantity,
      getDoorQuantityInput: getDoorQuantityInput,
      getAppliedLineTotal: getHubspotAppliedLineTotal,
      buildSummary: buildHubspotSummary,
      getSavedProjectNameFromFolder: getSavedProjectNameFromFolder
    };
  }

  window.DoorConf2Update = window.DoorConf2Update || {};
  window.DoorConf2Update.syncDoorSealKitMatchingAddonPrice = syncDoorSealKitMatchingAddonPrice;
  window.DoorConf2Update.syncDoorSweepsMatchingAddonPrice = syncDoorSweepsMatchingAddonPrice;
  window.DoorConf2Update.syncPrimingServicesAddonPrice = syncPrimingServicesAddonPrice;
  window.DoorConf2Update.syncAppliedMoldingTierAddonPrice = syncAppliedMoldingTierAddonPrice;
  window.DoorConf2Update.applyCatalogMetaobjectAddons = applyCatalogMetaobjectAddons;
  window.DoorConf2Update.isAppliedMoldingStileActive = isAppliedMoldingStileActive;
  window.DoorConf2Update.isAppliedMoldingPricingActive = isAppliedMoldingPricingActive;
  window.DoorConf2Update.ensureDoorPriceBoxVisible = ensureDoorPriceBoxVisible;
  window.DoorConf2Update.bootHubspotIntegration = bootHubspotIntegration;

  function bindAppliedMoldingConfiguratorRefresh() {
    if (window.__doorAppliedMoldingConfiguratorRefreshBound) return;
    window.__doorAppliedMoldingConfiguratorRefreshBound = true;
    document.addEventListener('change', function (e) {
      var t = e && e.target;
      if (!t || !t.getAttribute) return;
      var oid = String(t.getAttribute('data-option-id') || '');
      if (
        oid !== 'wood_type'
        && oid !== 'wood_type_storm_porch'
        && oid !== 'applied_molding'
        && oid !== 'applied_molding_choice'
        && oid !== 'stile_and_rail_profile'
      ) return;
      if (!t.closest || !t.closest('#door-configurator')) return;
      if (window.__doorAppliedMoldingRefreshTimer) clearTimeout(window.__doorAppliedMoldingRefreshTimer);
      window.__doorAppliedMoldingRefreshTimer = setTimeout(function () {
        window.__doorAppliedMoldingRefreshTimer = null;
        if (typeof window.__doorUpdateEstimatedPrice === 'function') {
          window.__doorUpdateEstimatedPrice();
        }
      }, 100);
    }, true);
  }

  function boot() {
    setTimeout(patchAriaControls, 0);
    setTimeout(patchAriaControls, 300);
    setTimeout(bootCasingProducts, 150);
    setTimeout(bootLandingHardwareConfig, 0);
    setTimeout(bootLandingHardwareConfig, 300);
    setTimeout(bootMillworkLengthConfig, 0);
    setTimeout(bootMillworkLengthConfig, 300);
    bindAppliedMoldingConfiguratorRefresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
