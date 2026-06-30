/**
 * door-conf2-measurements.js — Measurement tabs, dimensions, porch/panel unit UI.
 * Loaded by door-config2-snippet.liquid before door-conf2.js.
 */
(function () {
  var deps = {};

  function all(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function doorConfigSchemaRef() {
    return typeof deps.getDoorConfigSchema === 'function' ? deps.getDoorConfigSchema() : null;
  }

  function normalizeOptionIdKey(id) {
    if (typeof deps.normalizeOptionIdKey === 'function') return deps.normalizeOptionIdKey(id);
    return String(id || '').toLowerCase().replace(/-/g, '_');
  }

  function sanitizeForDomId(s) {
    if (typeof deps.sanitizeForDomId === 'function') return deps.sanitizeForDomId(s);
    return String(s == null ? '' : s).toLowerCase().trim().replace(/[^a-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '');
  }

  function buildOptionDomId(selectId, valueOrLabel, index) {
    if (typeof deps.buildOptionDomId === 'function') return deps.buildOptionDomId(selectId, valueOrLabel, index);
    return sanitizeForDomId(selectId) + '__' + (index != null ? index : 0);
  }

  function ensureSelectHasId(selectEl, prefix) {
    if (typeof deps.ensureSelectHasId === 'function') return deps.ensureSelectHasId(selectEl, prefix);
    if (selectEl && selectEl.id) return selectEl.id;
    return '';
  }

  function applyHideWhen(schema, container) {
    if (typeof deps.applyHideWhen === 'function') deps.applyHideWhen(schema, container);
  }

  function applyChoiceVisibility(schema, container) {
    if (typeof deps.applyChoiceVisibility === 'function') deps.applyChoiceVisibility(schema, container);
  }

  function enhanceDoorSelectWithDivDropdown(selectEl) {
    if (typeof deps.enhanceDoorSelectWithDivDropdown === 'function') {
      return deps.enhanceDoorSelectWithDivDropdown(selectEl);
    }
    return null;
  }

  function updateEstimatedPrice() {
    try { if (typeof deps.updateEstimatedPrice === 'function') deps.updateEstimatedPrice(); } catch (eMeasPrice) {}
  }

  function updateDoorPreview() {
    try { if (typeof deps.updateDoorPreview === 'function') deps.updateDoorPreview(); } catch (eMeasPrev) {}
  }

  function formatMoney(amount) {
    if (typeof deps.formatMoney === 'function') return deps.formatMoney(amount);
    return String(amount == null ? '' : amount);
  }

  function parseShowWhenProductTagsRaw(raw) {
    if (typeof deps.parseShowWhenProductTagsRaw === 'function') return deps.parseShowWhenProductTagsRaw(raw);
    return raw;
  }

  function normProductTagSlug(s) {
    if (typeof deps.normProductTagSlug === 'function') return deps.normProductTagSlug(s);
    return String(s || '').toLowerCase().trim();
  }

  function getConfiguratorProductTagContext(schema) {
    if (typeof deps.getConfiguratorProductTagContext === 'function') return deps.getConfiguratorProductTagContext(schema);
    return { productTags: [], urlCollectionHandle: '', globalTagMap: null };
  }

  function choiceHasShowWhenProductTagsField(choice) {
    if (typeof deps.choiceHasShowWhenProductTagsField === 'function') return deps.choiceHasShowWhenProductTagsField(choice);
    return false;
  }

  function normalizeTagSetsForChoice(showWhenProductTags, choiceValue, opts) {
    if (typeof deps.normalizeTagSetsForChoice === 'function') {
      return deps.normalizeTagSetsForChoice(showWhenProductTags, choiceValue, opts);
    }
    return [];
  }

  function tagSetsMatchProductTags(tagSets, productTags) {
    if (typeof deps.tagSetsMatchProductTags === 'function') return deps.tagSetsMatchProductTags(tagSets, productTags);
    return true;
  }
  function inferStaticMeasurementPanelKey(el) {
    if (!el || !el.closest) return '';
    var p = el.closest('.door-measurement-static-panel');
    if (!p || !p.classList) return '';
    if (p.classList.contains('door-measurement-static-panel--exact')) return 'exact';
    if (p.classList.contains('door-measurement-static-panel--finished')) return 'finished';
    if (p.classList.contains('door-measurement-static-panel--rough')) return 'rough';
    if (p.classList.contains('door-measurement-static-panel--jamb')) return 'jamb';
    if (p.classList.contains('door-measurement-static-panel--sidelight')) return 'sidelight';
    if (p.classList.contains('door-measurement-static-panel--transom')) return 'transom';
    return '';
  }

  function staticMeasurementPanelShortKey(panelKey) {
    // User preference: avoid 1-letter codes; keep readable words.
    var k = String(panelKey || '').toLowerCase();
    if (k === 'exact' || k === 'finished' || k === 'rough' || k === 'jamb' || k === 'sidelight' || k === 'transom') return k;
    return 'panel';
  }

  /** Extra measurement tabs + panel values for sidelight / transom sizing. */
  var MEASURE_TAB_EXACT_DOOR = 'exact_door_size';
  var MEASURE_TAB_EXACT_GATE = 'exact_gate_size';
  var MEASURE_TAB_EXACT_SIDELIGHT = 'exact_sidelight_size';
  var MEASURE_TAB_EXACT_TRANSOM = 'exact_transom_size';
  var MEASURE_TAB_FINISHED_OPENING = 'finished_opening_size';
  var COLLECTION_GARDEN_GATES = 'garden-gates';
  var COLLECTION_PET_GATES = 'pet-gates';
  var GATE_SWING_DIRECTION_ALLOW = {
    in_left: true,
    out_left: true,
    in_right: true,
    out_right: true
  };

  function normalizeSwingDirectionValue(v) {
    return String(v == null ? '' : v).trim().toLowerCase().replace(/[\s-]+/g, '_');
  }

  function isAllowedGateSwingDirectionValue(v) {
    return !!GATE_SWING_DIRECTION_ALLOW[normalizeSwingDirectionValue(v)];
  }

  function isGateCollectionHandle(handle) {
    var h = normProductTagSlug(handle);
    return h === COLLECTION_GARDEN_GATES || h === COLLECTION_PET_GATES;
  }

  function getActiveGateCollectionHandle() {
    try {
      var main = document.getElementById('door-configurator');
      var ctx = getConfiguratorProductTagContext(doorConfigSchemaRef());
      var urlCol = ctx && ctx.urlCollectionHandle ? normProductTagSlug(ctx.urlCollectionHandle) : '';
      if (isGateCollectionHandle(urlCol)) return urlCol;
      if (main) {
        var route = normProductTagSlug(main.getAttribute('data-route-collection') || '');
        if (isGateCollectionHandle(route)) return route;
        var raw = main.getAttribute('data-product-collection-handles') || '[]';
        var handles = JSON.parse(raw);
        if (Array.isArray(handles)) {
          for (var hi = 0; hi < handles.length; hi++) {
            var h = normProductTagSlug(handles[hi]);
            if (isGateCollectionHandle(h)) return h;
          }
        }
      }
    } catch (eGateCol) {}
    return '';
  }

  function isGateCollection() {
    return !!getActiveGateCollectionHandle();
  }

  function isGardenGatesCollection() {
    return getActiveGateCollectionHandle() === COLLECTION_GARDEN_GATES;
  }

  function isPetGatesCollection() {
    return getActiveGateCollectionHandle() === COLLECTION_PET_GATES;
  }

  var PET_GATES_EXACT_MEASURE_TITLE_COPY = {
    'exact door width': 'Exact Gate Width',
    'exact door height': 'Exact Gate Height',
    'exact door thickness': 'Exact Gate Thickness',
    'door thickness': 'Gate Thickness'
  };

  var PET_GATES_EXACT_MEASURE_HINT_COPY = {
    'enter the largest measurement for the width of your door.': 'Enter the largest measurement for the width of your gate.',
    'enter the tallest measurement for the height of your door.': 'Enter the tallest measurement for the height of your gate.',
    'enter the measurement for the thickness of your door.': 'Enter the measurement for the thickness of your gate.'
  };

  // Hint override keyed by ORIGINAL TITLE (takes priority over the hint-text map).
  // Lets the Finished Opening "Door Thickness" row use a different hint than the
  // Exact "Exact Door Thickness" row even though their original hint text matches.
  var PET_GATES_MEASURE_HINT_BY_TITLE = {
    'door thickness': 'Enter the measurement for the thickness of your gates'
  };

  function applyPetGatesMeasurementDimensionCopy(rootEl) {
    rootEl = rootEl || document.getElementById('door-configurator-options') || document;
    var isPet = isPetGatesCollection();
    try {
      rootEl.querySelectorAll('.door-measure-dimension-row').forEach(function (row) {
        var titleEl = row.querySelector('.door-measure-dimension-title') || row.querySelector('h4');
        var hintEl = row.querySelector('.door-measure-dimension-hint');
        if (!titleEl) return;

        if (!titleEl.getAttribute('data-door-original-title')) {
          titleEl.setAttribute('data-door-original-title', String(titleEl.textContent || '').trim());
        }
        if (hintEl && !hintEl.getAttribute('data-door-original-hint')) {
          hintEl.setAttribute('data-door-original-hint', String(hintEl.textContent || '').trim());
        }

        var origTitle = titleEl.getAttribute('data-door-original-title') || '';
        var titleKey = origTitle.toLowerCase();
        var titleCopy = PET_GATES_EXACT_MEASURE_TITLE_COPY[titleKey];

        if (isPet && titleCopy) {
          titleEl.textContent = titleCopy;
          if (hintEl) {
            var origHint = hintEl.getAttribute('data-door-original-hint') || '';
            var hintCopy = PET_GATES_MEASURE_HINT_BY_TITLE[titleKey]
              || PET_GATES_EXACT_MEASURE_HINT_COPY[origHint.toLowerCase()];
            if (hintCopy) hintEl.textContent = hintCopy;
          }
        } else {
          titleEl.textContent = origTitle;
          if (hintEl) {
            hintEl.textContent = hintEl.getAttribute('data-door-original-hint') || hintEl.textContent;
          }
        }
      });
    } catch (ePetCopy) {}
  }

  function petGatesExactMeasureTitleCopy(title) {
    if (!isPetGatesCollection()) return title;
    var key = String(title || '').trim().toLowerCase();
    return PET_GATES_EXACT_MEASURE_TITLE_COPY[key] || title;
  }

  function petGatesExactMeasureHintCopy(hint) {
    if (!isPetGatesCollection()) return hint;
    var key = String(hint || '').trim().toLowerCase();
    return PET_GATES_EXACT_MEASURE_HINT_COPY[key] || hint;
  }

  function petGatesExistingMeasureIntroCopy(text) {
    if (!isPetGatesCollection()) return text;
    var s = String(text || '');
    if (s === 'Add your measurements for your Existing Door') return 'Add your measurements for your Existing Gate';
    if (s.indexOf('Existing Door') !== -1) return s.replace(/Existing Door/g, 'Existing Gate');
    return s;
  }

  function parsePetGatesMeasureFraction(val) {
    if (val == null || val === '') return 0;
    var s = String(val).trim();
    if (!s) return 0;
    var n = parseFloat(s);
    if (!isNaN(n)) return n;
    if (s === '½') return 0.5;
    if (s === '¼') return 0.25;
    if (s === '¾') return 0.75;
    if (s.indexOf('/') !== -1) {
      var parts = s.split('/');
      if (parts.length >= 2) {
        var a = parseFloat(parts[0]);
        var b = parseFloat(parts[1]);
        if (!isNaN(a) && !isNaN(b) && b) return a / b;
      }
    }
    return 0;
  }

  function petGatesPricingDebugEnabled() {
    try { return window.DOOR_PET_GATES_PRICE_DEBUG === true; } catch (eDbg) { return false; }
  }

  function logPetGatesPricing(label, data) {
    if (!petGatesPricingDebugEnabled()) return;
    try {
      if (data !== undefined) console.log('[pet-gates-pricing]', label, data);
      else console.log('[pet-gates-pricing]', label);
    } catch (eLog) {}
  }

  function logPetGatesChangeSimple(widthIn, heightIn, info) {
    try {
      info = info || { price: 0, multiplier: 1, handle: '' };
      var price = parseFloat(info.price) || 0;
      var line = '[pet-gates-pricing] ' + String(widthIn) + '" x ' + String(heightIn) + '" → addon $' + price;
      if (price > 0) {
        if (info.multiplier && info.multiplier !== 1) {
          line += '  (oversized height: ' + info.handle + ' base x' + info.multiplier + ')';
        } else if (info.handle) {
          line += '  (' + info.handle + ')';
        }
        console.log(line);
        return;
      }
      var catalog = readPetGatesPricingCatalog();
      if (!catalog.length) {
        console.log(line + '  (catalog EMPTY — check #door-pet-gates-pricing-json / gates metaobjects)');
        return;
      }
      var handles = catalog.map(function (r) { return (r && (r.handle || r.key)) || '?'; });
      console.log(line + '  (no matching row; ' + catalog.length + ' handles: ' + handles.join(', ') + ')');
    } catch (eLog) {}
  }

  /** Panel visible — native <select> may be display:none (div dropdown). */
  function isPetGatesMeasureSelectInActivePanel(el) {
    if (!el || String(el.tagName || '').toUpperCase() !== 'SELECT') return false;
    var panel = el.closest ? el.closest('.door-measurement-static-panel') : null;
    if (panel && panel.classList && panel.classList.contains('door-hidden')) return false;
    var wrap = el.closest ? el.closest('.door-measurement-static-rows, .door-measurement-embedded-dimensions') : null;
    if (wrap && wrap.classList && wrap.classList.contains('door-hidden')) return false;
    return true;
  }

  function isExactGateOrDoorWidthTitle(title) {
    var t = String(title || '').toLowerCase();
    return t.indexOf('width') !== -1 && (t.indexOf('door') !== -1 || t.indexOf('gate') !== -1);
  }

  function isExactGateOrDoorHeightTitle(title) {
    var t = String(title || '').toLowerCase();
    return t.indexOf('height') !== -1 && (t.indexOf('door') !== -1 || t.indexOf('gate') !== -1);
  }

  function firstActivePetGatesMeasureSelect(selector) {
    try {
      var nodes = document.querySelectorAll(selector);
      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i];
        if (!isPetGatesMeasureSelectInActivePanel(el)) continue;
        return el;
      }
    } catch (eVis) {}
    return null;
  }

  function findPetGatesExactMeasureSelect(unit) {
    unit = String(unit || '');
    var wantWidth = unit.indexOf('width') !== -1;
    var wantHeight = unit.indexOf('height') !== -1;
    var wantFrac = unit.indexOf('frac') !== -1;
    var idSelector = '';
    if (wantWidth && !wantFrac) {
      idSelector = 'select#exact-door-width-int, select[id^="exact-door-width-int"], select[id^="exact-gate-width-int"]';
    } else if (wantWidth && wantFrac) {
      idSelector = 'select#exact-door-width-frac, select[id^="exact-door-width-frac"], select[id^="exact-gate-width-frac"]';
    } else if (wantHeight && !wantFrac) {
      idSelector = 'select#door_height, select[id^="door_height"]:not([id*="fraction"]):not([id*="frac"])';
    } else if (wantHeight && wantFrac) {
      idSelector = 'select#door_height_fraction, select[id^="door_height_fraction"], select[id^="door_height_frac"]';
    }
    if (idSelector) {
      var byId = firstActivePetGatesMeasureSelect(idSelector);
      if (byId) return byId;
    }
    try {
      var panels = document.querySelectorAll('.door-measurement-static-panel--exact');
      for (var pi = 0; pi < panels.length; pi++) {
        var panel = panels[pi];
        if (!panel || (panel.classList && panel.classList.contains('door-hidden'))) continue;
        var rows = panel.querySelectorAll('.door-measure-dimension-row');
        for (var ri = 0; ri < rows.length; ri++) {
          var row = rows[ri];
          if (!row) continue;
          var titleEl = row.querySelector('.door-measure-dimension-title') || row.querySelector('h4');
          var title = String((titleEl && titleEl.textContent) || '');
          var match = (wantWidth && isExactGateOrDoorWidthTitle(title)) || (wantHeight && isExactGateOrDoorHeightTitle(title));
          if (!match) continue;
          var sel = wantFrac
            ? row.querySelector('select.door-dimension-frac-select')
            : row.querySelector('select.door-dimension-int-select');
          if (isPetGatesMeasureSelectInActivePanel(sel)) return sel;
        }
      }
    } catch (eRow) {}
    return null;
  }

  function isPetGatesExactMeasureSelectEl(el) {
    if (!el || String(el.tagName || '').toUpperCase() !== 'SELECT') return false;
    var id = String(el.id || '');
    if (id === 'exact-door-width-int' || id.indexOf('exact-door-width-int') === 0) return true;
    if (id === 'exact-door-width-frac' || id.indexOf('exact-door-width-frac') === 0) return true;
    if (id.indexOf('exact-gate-width-int') === 0 || id.indexOf('exact-gate-width-frac') === 0) return true;
    if (id === 'door_height' || (id.indexOf('door_height') === 0 && id.indexOf('fraction') === -1 && id.indexOf('frac') === -1)) return true;
    if (id === 'door_height_fraction' || id.indexOf('door_height_fraction') === 0 || id.indexOf('door_height_frac') === 0) return true;
    var row = el.closest ? el.closest('.door-measure-dimension-row') : null;
    if (!row) return false;
    var panel = row.closest ? row.closest('.door-measurement-static-panel--exact') : null;
    if (!panel || !isPetGatesMeasureSelectInActivePanel(el)) return false;
    var titleEl = row.querySelector('.door-measure-dimension-title') || row.querySelector('h4');
    var title = String((titleEl && titleEl.textContent) || '');
    if (!isExactGateOrDoorWidthTitle(title) && !isExactGateOrDoorHeightTitle(title)) return false;
    return el.classList && (el.classList.contains('door-dimension-int-select') || el.classList.contains('door-dimension-frac-select'));
  }

  function firstVisiblePetGatesHeightIntSelect() {
    return findPetGatesExactMeasureSelect('height-int');
  }

  function readPetGatesExactMeasureInchesFromDom() {
    var wIntEl = findPetGatesExactMeasureSelect('width-int');
    var wFracEl = findPetGatesExactMeasureSelect('width-frac');
    var hIntEl = findPetGatesExactMeasureSelect('height-int');
    var hFracEl = findPetGatesExactMeasureSelect('height-frac');
    var width = parseFloat(wIntEl && wIntEl.value != null ? wIntEl.value : 0) || 0;
    width += parsePetGatesMeasureFraction(wFracEl && wFracEl.value);
    var height = parseFloat(hIntEl && hIntEl.value != null ? hIntEl.value : 0) || 0;
    height += parsePetGatesMeasureFraction(hFracEl && hFracEl.value);
    return {
      width: width,
      height: height,
      elements: {
        widthInt: wIntEl ? wIntEl.id || '(no-id)' : null,
        widthFrac: wFracEl ? wFracEl.id || '(no-id)' : null,
        heightInt: hIntEl ? hIntEl.id || '(no-id)' : null,
        heightFrac: hFracEl ? hFracEl.id || '(no-id)' : null
      }
    };
  }

  function parsePetGatesCatalogHandleBounds(handle) {
    var s = String(handle || '').trim();
    var m = /^gates[-_](\d+(?:\.\d+)?)[-_](\d+(?:\.\d+)?)[-_](\d+(?:\.\d+)?)[-_](\d+(?:\.\d+)?)$/i.exec(s);
    if (m) {
      return {
        width_min: parseFloat(m[1]),
        width_max: parseFloat(m[2]),
        height_min: parseFloat(m[3]),
        height_max: parseFloat(m[4])
      };
    }
    // Tolerate handles with a single height value, e.g. gates-37-39-32 → height 32-32.
    var m3 = /^gates[-_](\d+(?:\.\d+)?)[-_](\d+(?:\.\d+)?)[-_](\d+(?:\.\d+)?)$/i.exec(s);
    if (m3) {
      return {
        width_min: parseFloat(m3[1]),
        width_max: parseFloat(m3[2]),
        height_min: parseFloat(m3[3]),
        height_max: parseFloat(m3[3])
      };
    }
    return null;
  }

  function readPetGatesPricingCatalog() {
    try {
      if (Array.isArray(window.__doorPetGatesPricingCatalog)) return window.__doorPetGatesPricingCatalog;
      var el = document.getElementById('door-pet-gates-pricing-json');
      if (!el) return [];
      var raw = String(el.textContent || '').trim();
      if (!raw) return [];
      var data = JSON.parse(raw);
      window.__doorPetGatesPricingCatalog = Array.isArray(data) ? data : [];
      return window.__doorPetGatesPricingCatalog;
    } catch (eCat) {
      return [];
    }
  }

  function parsePetGatesCatalogRowPrice(row) {
    var p = row.price != null ? row.price : (row.price_value != null ? row.price_value : row.amount);
    if (p && typeof p === 'object') {
      p = p.value != null ? p.value : (p.amount != null ? p.amount : p.price);
    }
    var parsed = parseFloat(p);
    return isNaN(parsed) ? 0 : parsed;
  }

  function getPetGatesCatalogRowBounds(row) {
    if (!row) return null;
    if (row.width_min != null && row.width_max != null && row.height_min != null && row.height_max != null) {
      return {
        width_min: parseFloat(row.width_min),
        width_max: parseFloat(row.width_max),
        height_min: parseFloat(row.height_min),
        height_max: parseFloat(row.height_max)
      };
    }
    return parsePetGatesCatalogHandleBounds(row.handle || row.key || '');
  }

  /**
   * Returns { price, multiplier, handle } for the given dimensions.
   * Normal: exact width+height band match (multiplier 1).
   * Oversized height: when height is above every band for the width, use the
   * highest height band's price and double it (multiplier 2).
   */
  function findPetGatesCatalogPriceInfo(widthIn, heightIn) {
    widthIn = parseFloat(widthIn);
    heightIn = parseFloat(heightIn);
    var none = { price: 0, multiplier: 1, handle: '' };
    if (isNaN(widthIn) || isNaN(heightIn) || widthIn <= 0 || heightIn <= 0) return none;
    var catalog = readPetGatesPricingCatalog();
    if (!catalog.length) return none;
    var topBand = null;
    for (var i = 0; i < catalog.length; i++) {
      var row = catalog[i] || {};
      var bounds = getPetGatesCatalogRowBounds(row);
      if (!bounds) continue;
      if (widthIn + 0.0001 < bounds.width_min || widthIn - 0.0001 > bounds.width_max) continue;
      if (heightIn + 0.0001 >= bounds.height_min && heightIn - 0.0001 <= bounds.height_max) {
        return {
          price: parsePetGatesCatalogRowPrice(row),
          multiplier: 1,
          handle: row.handle || row.key || ''
        };
      }
      if (!topBand || bounds.height_max > topBand.bounds.height_max) {
        topBand = { row: row, bounds: bounds };
      }
    }
    if (topBand && heightIn - 0.0001 > topBand.bounds.height_max) {
      return {
        price: parsePetGatesCatalogRowPrice(topBand.row) * 2,
        multiplier: 2,
        handle: topBand.row.handle || topBand.row.key || ''
      };
    }
    return none;
  }

  function findPetGatesCatalogPrice(widthIn, heightIn) {
    return findPetGatesCatalogPriceInfo(widthIn, heightIn).price;
  }

  function clearPetGatesSupersededMeasurementAddons() {
    try {
      window['__doorAddon_intExtOversizedApi'] = 0;
      window['__doorAddon_intExtThicknessBand'] = 0;
      window.__doorIntExtAddonPrice = 0;
      window['__doorAddon_sidelightTransomOversized'] = 0;
      window['__doorAddon_sidelightTransomOversizedPair1'] = 0;
      window['__doorAddon_sidelightTransomOversizedPair2'] = 0;
    } catch (eClr) {}
    try {
      if (window.DoorIntExtPricingRule && typeof window.DoorIntExtPricingRule.clearIntExtGeneralOversizedAddonKeys === 'function') {
        window.DoorIntExtPricingRule.clearIntExtGeneralOversizedAddonKeys();
      }
    } catch (eClr2) {}
  }

  function syncPetGatesMeasurementPrice(changedEl, opts) {
    opts = opts || {};
    if (!isPetGatesCollection()) {
      window.__doorAddon_pet_gates_measurements = 0;
      return { price: 0, multiplier: 1, handle: '' };
    }
    var dims = readPetGatesExactMeasureInchesFromDom();
    var info = findPetGatesCatalogPriceInfo(dims.width, dims.height);
    var next = info.price > 0 ? info.price : 0;
    var prev = parseFloat(window.__doorAddon_pet_gates_measurements) || 0;
    clearPetGatesSupersededMeasurementAddons();
    window.__doorAddon_pet_gates_measurements = next;
    if (opts.uiSyncOnly) return info;
    var shouldSyncDisplay = !!changedEl || !!opts.force || Math.abs(prev - next) >= 0.01;
    if (!shouldSyncDisplay) return info;
    try {
      if (window.DoorIntExtPricingRule && typeof window.DoorIntExtPricingRule.syncEstimatedPriceDisplay === 'function') {
        window.DoorIntExtPricingRule.syncEstimatedPriceDisplay({
          source: 'petGatesMeasure',
          silent: !changedEl,
          userAction: !!changedEl
        });
      }
    } catch (ePrice) {}
    return info;
  }

  function isPetGatesMeasurementTypeRadioEl(el) {
    if (!el || String(el.tagName || '').toUpperCase() !== 'INPUT') return false;
    if (String(el.type || '').toLowerCase() !== 'radio') return false;
    var optId = el.getAttribute && el.getAttribute('data-option-id');
    return isMeasurementTypeOptionId(optId);
  }

  function resetPetGatesMeasurementPrice(changedEl) {
    if (!isPetGatesCollection()) return;
    clearPetGatesSupersededMeasurementAddons();
    window.__doorAddon_pet_gates_measurements = 0;
    try {
      if (window.DoorIntExtPricingRule && typeof window.DoorIntExtPricingRule.syncEstimatedPriceDisplay === 'function') {
        window.DoorIntExtPricingRule.syncEstimatedPriceDisplay({
          source: 'petGatesMeasureTabReset',
          silent: !changedEl,
          userAction: !!changedEl
        });
      }
    } catch (ePrice) {}
  }

  // Reset the width/height selections (both tab panels) back to their defaults so a
  // tab switch starts clean. Pet-gates only; programmatic so no change events fire.
  function resetPetGatesMeasurementSelections() {
    if (!isPetGatesCollection()) return;
    var container = document.getElementById('door-configurator-options');
    if (!container) return;
    var section = container.querySelector('.door-measurement-type-section') || container;
    // Ensure the pet-gates height select carries its full 32-100 option range
    // before we reset the value. The tab-change path does not run the gate rules
    // sync, so the default height ('32') may not yet exist as an option in the
    // freshly shown panel; without this the height reset silently no-ops while
    // width (default '36') still matches a standard option.
    try { applyPetGatesDoorHeightSelectRange(container); } catch (ePetHeightRange) {}
    section.querySelectorAll('.door-measure-dimension-row').forEach(function (row) {
      if (!row) return;
      var titleEl = row.querySelector('.door-measure-dimension-title') || row.querySelector('h4');
      var title = String((titleEl && titleEl.textContent) || '').toLowerCase();
      var intSel = row.querySelector('select.door-dimension-int-select');
      var fracSel = row.querySelector('select.door-dimension-frac-select');
      if (intSel && intSel.removeAttribute) intSel.removeAttribute('data-door-user-changed');
      if (fracSel && fracSel.removeAttribute) fracSel.removeAttribute('data-door-user-changed');
      if (title.indexOf('width') !== -1) {
        if (intSel) setMeasurementSelectValue(intSel, DEFAULT_EXACT_DOOR_WIDTH_INT, { dispatchChange: false });
        if (fracSel) setMeasurementSelectValue(fracSel, DEFAULT_EXACT_DOOR_WIDTH_FRAC, { dispatchChange: false });
      } else if (title.indexOf('height') !== -1) {
        if (intSel) setMeasurementSelectValue(intSel, getDefaultExactDoorHeightInt(), { dispatchChange: false });
        if (fracSel) setMeasurementSelectValue(fracSel, DEFAULT_EXACT_DOOR_HEIGHT_FRAC, { dispatchChange: false });
      }
    });
  }

  // Pet-gates tab switch (Exact Gate Size <-> Finished Opening Size) inside the
  // common-check-options door-measure-tabs section: reset the inner width/height
  // selections to defaults and zero the measurement addon so the base price shows
  // again. Safe to call from any handler (no-op outside pet-gates). The tab <label>
  // pre-checks the radio, which suppresses the native change event, so this is
  // invoked directly from the tab click/change handlers in the main config script.
  function resetPetGatesMeasurementOnTabChange(changedEl) {
    if (!isPetGatesCollection()) return;
    setTimeout(function () {
      if (!isPetGatesCollection()) return;
      resetPetGatesMeasurementSelections();
      resetPetGatesMeasurementPrice(changedEl || true);
      var dims = readPetGatesExactMeasureInchesFromDom();
      logPetGatesChangeSimple(dims.width, dims.height, { price: 0, multiplier: 1, handle: '' });
    }, 0);
  }

  function onPetGatesMeasurementFieldChange(e) {
    if (!isPetGatesCollection()) return;
    var t = e && e.target;
    if (!t) return;
    if (isPetGatesMeasurementTypeRadioEl(t)) {
      resetPetGatesMeasurementOnTabChange(t);
      return;
    }
    if (!isPetGatesExactMeasureSelectEl(t)) return;
    var info = syncPetGatesMeasurementPrice(t);
    var dims = readPetGatesExactMeasureInchesFromDom();
    logPetGatesChangeSimple(dims.width, dims.height, info);
  }

  var _petGatesMeasurePricingBound = false;
  function bindPetGatesMeasurementPricing() {
    if (_petGatesMeasurePricingBound) return;
    _petGatesMeasurePricingBound = true;
    document.addEventListener('change', onPetGatesMeasurementFieldChange, true);
  }

  function isFinishedOpeningMeasureTab(valueKey) {
    var v = normalizeOptionIdKey(valueKey);
    return v === MEASURE_TAB_FINISHED_OPENING || v === 'finished_opening';
  }

  function isGateCollectionAllowedMeasureTab(valueKey) {
    if (!isGateCollection()) return false;
    var v = normalizeOptionIdKey(valueKey);
    if (v === MEASURE_TAB_EXACT_GATE) return true;
    if (isFinishedOpeningMeasureTab(valueKey)) return true;
    return false;
  }

  function isGateCollectionHiddenMeasureTab(valueKey) {
    if (!isGateCollection()) return false;
    if (isGateCollectionAllowedMeasureTab(valueKey)) return false;
    var v = normalizeOptionIdKey(valueKey);
    if (!v) return false;
    if (v === MEASURE_TAB_EXACT_DOOR || isFinishedOpeningMeasureTab(valueKey)) return true;
    if (v.indexOf('rough') !== -1 || v.indexOf('jamb') !== -1) return true;
    if (v === MEASURE_TAB_EXACT_SIDELIGHT || v === MEASURE_TAB_EXACT_TRANSOM) return true;
    return true;
  }

  function approxGateThicknessInches(a, b) {
    return Math.abs(parseFloat(a) - parseFloat(b)) < 0.02;
  }

  function parseGateThicknessOptionInches(opt) {
    if (!opt) return NaN;
    var vv = opt.value != null ? String(opt.value).trim() : '';
    var pv = parseFloat(vv);
    if (!isNaN(pv) && pv > 0) return pv;
    var txt = String(opt.textContent || '').trim().toLowerCase();
    if (!txt) return NaN;
    if (txt.indexOf('2 1/4') !== -1 || txt.indexOf('2-1/4') !== -1) return 2.25;
    if (txt.indexOf('1 3/4') !== -1 || txt.indexOf('1-3/4') !== -1) return 1.75;
    if (txt.indexOf('1 1/2') !== -1 || txt.indexOf('1-1/2') !== -1) return 1.5;
    return NaN;
  }

  function isAllowedGateThicknessOption(opt) {
    if (!opt || !isGateCollection()) return true;
    var inches = parseGateThicknessOptionInches(opt);
    if (isNaN(inches)) return false;
    if (isPetGatesCollection()) return approxGateThicknessInches(inches, 1.5);
    if (isGardenGatesCollection()) {
      return approxGateThicknessInches(inches, 1.75) || approxGateThicknessInches(inches, 2.25);
    }
    return true;
  }

  function isExactDoorThicknessFracSelect(sel) {
    if (!sel || String(sel.tagName || '').toLowerCase() !== 'select') return false;
    var id = String(sel.id || '').toLowerCase();
    if (id === 'exact-door-thickness-frac' || id.indexOf('exact-door-thickness-frac') === 0) return true;
    if (id === 'door-thickness') return true;
    var row = sel.closest ? sel.closest('.door-measure-dimension-row') : null;
    if (row) {
      var titleEl = row.querySelector('.door-measure-dimension-title') || row.querySelector('h4');
      var title = String((titleEl && titleEl.textContent) || '').toLowerCase();
      if (title.indexOf('sidelight thickness') !== -1 || title.indexOf('transom thickness') !== -1) return false;
      if (title.indexOf('exact door thickness') !== -1 || title.indexOf('exact gate thickness') !== -1) return true;
      if (title.indexOf('door thickness') !== -1 && title.indexOf('pre-hung') === -1) return true;
    }
    return !!(sel.classList && sel.classList.contains('door-dimension-frac-select'));
  }

  function applyGateCollectionThicknessFracSelects(rootEl) {
    if (!isGateCollection()) return;
    rootEl = rootEl || document.getElementById('door-configurator-options') || document;
    try {
      rootEl.querySelectorAll('select').forEach(function (sel) {
        if (!isExactDoorThicknessFracSelect(sel)) return;
        var firstAllowedOpt = null;
        var hasAllowedSelected = false;
        Array.prototype.forEach.call(sel.options, function (op) {
          if (!op) return;
          var rawVal = String(op.value || '').trim();
          var allowed = rawVal !== '' && rawVal !== '0' && isAllowedGateThicknessOption(op);
          op.hidden = !allowed;
          op.disabled = !allowed;
          if (allowed) {
            if (!firstAllowedOpt) firstAllowedOpt = op;
            if (op.selected || String(sel.value || '') === rawVal) hasAllowedSelected = true;
          }
        });
        if (!hasAllowedSelected && firstAllowedOpt) {
          sel.value = firstAllowedOpt.value;
          try { sel.dispatchEvent(new Event('change', { bubbles: true })); } catch (eThkCh) {}
        } else if (sel.value && !isAllowedGateThicknessOption({ value: sel.value, textContent: sel.options[sel.selectedIndex] && sel.options[sel.selectedIndex].textContent })) {
          if (firstAllowedOpt) {
            sel.value = firstAllowedOpt.value;
            try { sel.dispatchEvent(new Event('change', { bubbles: true })); } catch (eThkCh2) {}
          }
        }
        var defNum = parseFloat(sel.value);
        if (!isNaN(defNum) && defNum > 0) {
          try { window.__lastDoorThicknessInches = defNum; } catch (eThkWin) {}
        }
      });
    } catch (eGateThk) {}
  }

  function applyGateSwingChoiceVisibility(container, scopeEl) {
    if (!scopeEl) return;
    var firstAllowedInp = null;
    var checkedAllowed = null;
    scopeEl.querySelectorAll('input[type="radio"][data-option-id="swing_direction"]').forEach(function (inp) {
      var allowed = isAllowedGateSwingDirectionValue(inp.value);
      var card = inp.closest ? inp.closest('.common-check-option, .door-sweep-extra-option, label.door-setup-option') : null;
      if (!allowed) {
        if (inp.checked) {
          inp.checked = false;
          if (card) card.classList.remove('common-check-option--selected');
        }
        if (card) {
          card.classList.add('door-hidden');
          card.style.display = 'none';
          card.setAttribute('data-gate-swing-hidden', '1');
        }
        return;
      }
      if (card) {
        card.classList.remove('door-hidden');
        card.style.display = '';
        card.removeAttribute('data-gate-swing-hidden');
        card.removeAttribute('data-product-tag-hidden');
      }
      if (!firstAllowedInp) firstAllowedInp = inp;
      if (inp.checked) checkedAllowed = inp;
    });
    scopeEl.querySelectorAll('select[data-option-id="swing_direction"] option').forEach(function (op) {
      if (!op || op.value === '') return;
      var allowed = isAllowedGateSwingDirectionValue(op.value);
      op.hidden = !allowed;
      op.disabled = !allowed;
      if (!allowed) op.setAttribute('data-gate-swing-hidden', '1');
      else op.removeAttribute('data-gate-swing-hidden');
    });
    scopeEl.querySelectorAll('select[data-option-id="swing_direction"]').forEach(function (sel) {
      var cur = String(sel.value || '');
      if (cur && !isAllowedGateSwingDirectionValue(cur)) {
        var firstVis = Array.prototype.find.call(sel.options, function (o) {
          return o && o.value && !o.hidden && !o.disabled;
        });
        sel.value = firstVis ? firstVis.value : '';
      }
    });
    if (!checkedAllowed && firstAllowedInp) {
      firstAllowedInp.checked = true;
      var pickCard = firstAllowedInp.closest('.common-check-option, .door-sweep-extra-option');
      if (pickCard) pickCard.classList.add('common-check-option--selected');
      try { firstAllowedInp.dispatchEvent(new Event('change', { bubbles: true })); } catch (eSwingCh) {}
    }
  }

  function applyGateCollectionSwingDirectionRules(container) {
    if (!container || !isGateCollection()) return;
    container.querySelectorAll('.door-option-wrap[data-option-id="swing_direction"]').forEach(function (wrap) {
      wrap.classList.remove('door-hidden');
      wrap.style.display = '';
      wrap.removeAttribute('data-empty-hidden');
      wrap.removeAttribute('hidden');
      applyGateSwingChoiceVisibility(container, wrap);
    });
    container.querySelectorAll('.door-sweep-extra-options[data-swing-from-schema="1"]').forEach(function (swingWrap) {
      var parentWrap = swingWrap.closest('.door-option-wrap');
      if (parentWrap) {
        parentWrap.classList.remove('door-hidden');
        parentWrap.style.display = '';
        parentWrap.removeAttribute('data-empty-hidden');
      }
      var title = parentWrap && parentWrap.querySelector('.fw-600.pt-24');
      if (title) title.classList.remove('d-none');
      applyGateSwingChoiceVisibility(container, swingWrap);
    });
  }

  function applyGateCollectionMeasurementTabs(container, schema) {
    if (!container || !schema || !isGateCollection()) return;
    var wrap = container.querySelector('.door-measurement-type-section.door-option-wrap');
    if (!wrap) return;
    wrap.classList.remove('door-hidden');
    wrap.style.display = '';
    var measureOpt = findMeasurementTypeOption(schema);
    var measureOptId = measureOpt && measureOpt.id ? measureOpt.id : 'measurement_type';
    var gateTabRadio = null;
    var checkedVisible = null;
    container.querySelectorAll('.door-measure-tab').forEach(function (tab) {
      var radio = tab.querySelector('input[type="radio"][data-option-id="measurement_type"], input[type="radio"][data-option-id="' + measureOptId + '"]');
      if (!radio) radio = tab.querySelector('input[type="radio"]');
      if (!radio) return;
      var valNorm = normalizeOptionIdKey(radio.value);
      var isGate = valNorm === MEASURE_TAB_EXACT_GATE;
      var shouldHide = isGateCollectionHiddenMeasureTab(radio.value);
      tab.classList.toggle('door-hidden', shouldHide);
      if (isGate) gateTabRadio = radio;
      if (!shouldHide && radio.checked) checkedVisible = radio;
      if (shouldHide && radio.checked) {
        radio.checked = false;
        tab.classList.remove('common-check-option--selected');
      }
    });
    var pick = checkedVisible || gateTabRadio;
    if (pick) {
      pick.checked = true;
      var pickTab = pick.closest('.door-measure-tab');
      if (pickTab) pickTab.classList.add('common-check-option--selected');
      try {
        applyMeasurementTypeTabSelection(pick, measureOptId, container, schema);
      } catch (eGateTab) {}
    }
  }

  function applyGardenGatesCollectionRules(container, schema) {
    container = container || document.getElementById('door-configurator-options');
    schema = schema || doorConfigSchemaRef();
    if (!container) return;
    if (!isGateCollection()) return;
    try {
      var main = document.getElementById('door-configurator');
      if (main) {
        main.classList.toggle('door-collection-garden-gates', isGardenGatesCollection());
        main.classList.toggle('door-collection-pet-gates', isPetGatesCollection());
      }
    } catch (eCls) {}
    if (isGateCollection()) applyGateCollectionSwingDirectionRules(container);
    if (isGateCollection()) applyGateCollectionMeasurementTabs(container, schema);
    if (isGateCollection()) applyGateCollectionThicknessFracSelects(container);
    applyPetGatesMeasurementDimensionCopy(container);
    if (isPetGatesCollection()) {
      bindPetGatesMeasurementPricing();
      var petGateHeightAdjusted = applyPetGatesDoorHeightSelectRange(container);
      syncPetGatesMeasurementPrice(null, petGateHeightAdjusted ? { force: true } : { uiSyncOnly: true });
    } else {
      window.__doorAddon_pet_gates_measurements = 0;
    }
  }

  function findMeasurementTypeOption(schema) {
    if (!Array.isArray(schema)) return null;
    for (var i = 0; i < schema.length; i++) {
      if (schema[i] && isMeasurementTypeOptionId(schema[i].id)) return schema[i];
    }
    return null;
  }

  function measurementTypeChoiceByValue(schema, valueKey) {
    var measureOpt = findMeasurementTypeOption(schema);
    if (!measureOpt || !Array.isArray(measureOpt.options)) return null;
    var want = normalizeOptionIdKey(valueKey);
    for (var j = 0; j < measureOpt.options.length; j++) {
      var c = measureOpt.options[j];
      if (!c) continue;
      if (normalizeOptionIdKey(c.value) === want) return c;
    }
    return null;
  }

  /** Prefer config_choice.title from measurement_type metaobject, then label. */
  function measurementTabLabelFromChoice(choice, fallback) {
    if (!choice) return fallback || '';
    var title = choice.title != null ? String(choice.title).trim() : '';
    if (title) return title;
    var label = choice.label != null ? String(choice.label).trim() : '';
    if (label) return label;
    return fallback || '';
  }

  function enrichMeasurementSidelightTransomTabEntry(tabEntry, schema) {
    if (!tabEntry || !schema) return tabEntry;
    var val = normalizeOptionIdKey(tabEntry.value);
    if (val !== MEASURE_TAB_EXACT_SIDELIGHT && val !== MEASURE_TAB_EXACT_TRANSOM) return tabEntry;
    var ch = measurementTypeChoiceByValue(schema, tabEntry.value);
    var disp = measurementTabLabelFromChoice(ch || tabEntry, tabEntry.label);
    if (disp) tabEntry.label = disp;
    if (ch && ch.title != null && String(ch.title).trim() !== '') tabEntry.title = ch.title;
    if (!tabEntry.measureVis) {
      tabEntry.measureVis = val === MEASURE_TAB_EXACT_SIDELIGHT ? 'sidelight' : 'transom';
    }
    return tabEntry;
  }

  function displayLabelForMeasurementTabChoice(o) {
    if (!o) return '';
    var valNorm = normalizeOptionIdKey(o.value);
    if (valNorm === MEASURE_TAB_EXACT_SIDELIGHT || valNorm === MEASURE_TAB_EXACT_TRANSOM) {
      return measurementTabLabelFromChoice(o, o.label || o.value || '');
    }
    if (o.title != null && String(o.title).trim() !== '') return String(o.title).trim();
    var t = String((o.label || o.value) || '').toLowerCase();
    if (t.indexOf('sidelight') !== -1 || (t.indexOf('transom') !== -1 && t.indexOf('sidelight') === -1)) {
      return measurementTabLabelFromChoice(o, o.label || o.value || '');
    }
    if (t.indexOf('gate') !== -1) return measurementTabLabelFromChoice(o, 'Exact Gate Size');
    if (t.indexOf('exact') !== -1) return 'Exact Door Size';
    if (t.indexOf('rough') !== -1) return 'Rough Opening Size';
    if (t.indexOf('jamb') !== -1) return 'Jamb Unit Size';
    if (t.indexOf('finished') !== -1 || t.indexOf('opening') !== -1) return 'Finished Opening Size';
    return o.label || o.value ? String(o.label || o.value) : '';
  }

  function isMeasurementSidelightTransomTabValue(valueKey) {
    var v = normalizeOptionIdKey(valueKey);
    return v === MEASURE_TAB_EXACT_SIDELIGHT || v === MEASURE_TAB_EXACT_TRANSOM;
  }

  /** Map measurement tab values to catalog JSON secondary slugs (door / sidelight / transom). */
  function measurementCatalogAliasesForTab(tabValueKey) {
    var v = normalizeOptionIdKey(tabValueKey);
    if (v === MEASURE_TAB_EXACT_DOOR) {
      return ['door', 'exact', 'exact_door_size', 'exact-door-size', 'slab'];
    }
    if (v === MEASURE_TAB_EXACT_SIDELIGHT) {
      return ['sidelight', 'sidelights', 'exact_sidelight_size', 'exact-sidelight-size'];
    }
    if (v === MEASURE_TAB_EXACT_TRANSOM) {
      return ['transom', 'transoms', 'exact_transom_size', 'exact-transom-size'];
    }
    return [normProductTagSlug(tabValueKey)];
  }

  function catalogSecondaryMatchesMeasurementTab(secNorm, tabValueKey) {
    if (!secNorm) return false;
    var aliases = measurementCatalogAliasesForTab(tabValueKey);
    for (var ai = 0; ai < aliases.length; ai++) {
      var a = aliases[ai];
      if (secNorm === a) return true;
      if (a === 'sidelight' && secNorm === 'sidelights') return true;
      if (a === 'sidelights' && secNorm === 'sidelight') return true;
    }
    return false;
  }

  function isMeasurementCatalogShowWhenProductTags(raw) {
    raw = parseShowWhenProductTagsRaw(raw);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false;
    return Object.keys(raw).some(function (k) {
      return k !== 'dontShowCollection' && Array.isArray(raw[k]);
    });
  }

  function getMeasurementTabCatalogLineTagSets(raw, tabValueKey) {
    raw = parseShowWhenProductTagsRaw(raw);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
    var sets = [];
    Object.keys(raw).forEach(function (primaryTag) {
      if (primaryTag === 'dontShowCollection') return;
      var secondaries = raw[primaryTag];
      if (!Array.isArray(secondaries)) return;
      var primaryNorm = normProductTagSlug(primaryTag);
      if (!primaryNorm) return;
      if (!secondaries.length) {
        sets.push([primaryNorm]);
        return;
      }
      secondaries.forEach(function (secondaryTag) {
        if (catalogSecondaryMatchesMeasurementTab(normProductTagSlug(secondaryTag), tabValueKey)) {
          sets.push([primaryNorm]);
        }
      });
    });
    return sets;
  }

  function measurementTabBlockedByDontShowCollection(raw, urlCollectionHandle) {
    if (!urlCollectionHandle) return false;
    raw = parseShowWhenProductTagsRaw(raw);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false;
    var list = raw.dontShowCollection;
    if (!Array.isArray(list)) return false;
    return list.some(function (h) { return normProductTagSlug(h) === urlCollectionHandle; });
  }

  function measurementHasTagRuleForChoice(choice) {
    var raw = choice && choice.showWhenProductTags;
    if (raw == null) return false;
    if (typeof raw === 'string') return raw.trim() !== '';
    if (Array.isArray(raw)) return raw.length > 0;
    if (typeof raw === 'object') {
      return Object.keys(raw).some(function (k) { return k !== 'dontShowCollection'; });
    }
    return false;
  }
  /** Exact sidelight / transom tabs: product must carry matching tag (e.g. sidelight, transom). */
  function productTagsIncludeMeasurementComponent(productTags, tabValueKey) {
    if (!Array.isArray(productTags) || !productTags.length) return false;
    var valNorm = normalizeOptionIdKey(tabValueKey);
    var component = valNorm === MEASURE_TAB_EXACT_SIDELIGHT
      ? 'sidelight'
      : valNorm === MEASURE_TAB_EXACT_TRANSOM
        ? 'transom'
        : '';
    if (!component) return false;
    var aliases = measurementCatalogAliasesForTab(tabValueKey);
    return productTags.some(function (tag) {
      var n = normProductTagSlug(tag);
      if (!n) return false;
      for (var i = 0; i < aliases.length; i++) {
        if (n === aliases[i] || n.indexOf(aliases[i]) !== -1) return true;
      }
      return n.indexOf(component) !== -1;
    });
  }
  /** show_when_product_tags — measurement section (exact_door_size / exact_sidelight_size / exact_transom_size). */
  function resolveMeasurementTabProductTagShouldHide(schema, tabValueKey) {
    var ch = measurementTypeChoiceByValue(schema, tabValueKey);
    var ctx = getConfiguratorProductTagContext(schema);
    var productTags = ctx.productTags || [];
    var valNorm = normalizeOptionIdKey(tabValueKey);
    if (valNorm === MEASURE_TAB_EXACT_SIDELIGHT && !productTagsIncludeMeasurementComponent(productTags, tabValueKey)) {
      return true;
    }
    if (valNorm === MEASURE_TAB_EXACT_TRANSOM && !productTagsIncludeMeasurementComponent(productTags, tabValueKey)) {
      return true;
    }
    var tagSets = [];
    var dontShowRaw = null;
    var hasPerChoiceRule = ch && choiceHasShowWhenProductTagsField(ch) && measurementHasTagRuleForChoice(ch);

    if (hasPerChoiceRule) {
      dontShowRaw = ch.showWhenProductTags;
      if (isMeasurementCatalogShowWhenProductTags(ch.showWhenProductTags)) {
        tagSets = getMeasurementTabCatalogLineTagSets(ch.showWhenProductTags, tabValueKey);
      } else {
        tagSets = normalizeTagSetsForChoice(ch.showWhenProductTags, tabValueKey, {
          productTagsOnly: true
        });
      }
    }

    if (!tagSets.length && ctx.globalTagMap) {
      var globalSets = getMeasurementTabCatalogLineTagSets(ctx.globalTagMap, tabValueKey);
      if (globalSets.length) {
        tagSets = globalSets;
        dontShowRaw = dontShowRaw || ctx.globalTagMap;
      }
    }

    if (!tagSets.length) return false;

    var hide = !tagSetsMatchProductTags(tagSets, productTags);
    if (!hide && measurementTabBlockedByDontShowCollection(dontShowRaw || ctx.globalTagMap, ctx.urlCollectionHandle)) {
      hide = true;
    }
    return hide;
  }

  function measurementTabAllowedByProductTags(schema, valueKey) {
    if (isGateCollection()) return isGateCollectionAllowedMeasureTab(valueKey);
    return !resolveMeasurementTabProductTagShouldHide(schema, valueKey);
  }

  function mergeMeasurementSidelightTransomTabs(list, schema, optionsContainer) {
    list = Array.isArray(list) ? list.slice() : [];
    var seen = {};
    list.forEach(function (x) {
      if (x && x.value != null && x.value !== '') seen[String(x.value)] = true;
    });
    list = list.map(function (x) { return enrichMeasurementSidelightTransomTabEntry(x, schema); });
    list = list.filter(function (x) {
      if (!x) return false;
      if (isGateCollection()) {
        return isGateCollectionAllowedMeasureTab(x.value);
      }
      var v = normalizeOptionIdKey(x.value);
      if (v === MEASURE_TAB_EXACT_DOOR || v === MEASURE_TAB_EXACT_SIDELIGHT || v === MEASURE_TAB_EXACT_TRANSOM || v === MEASURE_TAB_EXACT_GATE) {
        return measurementTabAllowedByProductTags(schema, x.value);
      }
      return true;
    });
    var seenAfterFilter = {};
    list.forEach(function (x) {
      if (x && x.value != null && x.value !== '') seenAfterFilter[String(x.value)] = true;
    });
    if (isGateCollection()) {
      if (!seenAfterFilter[MEASURE_TAB_EXACT_GATE]) {
        var gateCh = measurementTypeChoiceByValue(schema, MEASURE_TAB_EXACT_GATE);
        list.push({
          value: MEASURE_TAB_EXACT_GATE,
          label: measurementTabLabelFromChoice(gateCh, 'Exact Gate Size'),
          title: gateCh && gateCh.title,
          measureVis: 'always'
        });
        seenAfterFilter[MEASURE_TAB_EXACT_GATE] = true;
      }
      if (!seenAfterFilter[MEASURE_TAB_FINISHED_OPENING] && !seenAfterFilter.finished_opening) {
        var finCh = measurementTypeChoiceByValue(schema, MEASURE_TAB_FINISHED_OPENING)
          || measurementTypeChoiceByValue(schema, 'finished_opening');
        var finVal = finCh && finCh.value != null && finCh.value !== ''
          ? String(finCh.value)
          : MEASURE_TAB_FINISHED_OPENING;
        list.push({
          value: finVal,
          label: measurementTabLabelFromChoice(finCh, 'Finished Opening Size'),
          title: finCh && finCh.title,
          measureVis: 'slab'
        });
      }
      return list;
    }
    if (!seenAfterFilter[MEASURE_TAB_EXACT_SIDELIGHT] && measurementTabAllowedByProductTags(schema, MEASURE_TAB_EXACT_SIDELIGHT)) {
      var sideCh = measurementTypeChoiceByValue(schema, MEASURE_TAB_EXACT_SIDELIGHT);
      list.push({
        value: MEASURE_TAB_EXACT_SIDELIGHT,
        label: measurementTabLabelFromChoice(sideCh, 'Exact Sidelight Size'),
        title: sideCh && sideCh.title,
        measureVis: 'sidelight'
      });
    }
    if (!seenAfterFilter[MEASURE_TAB_EXACT_TRANSOM] && measurementTabAllowedByProductTags(schema, MEASURE_TAB_EXACT_TRANSOM)) {
      var transCh = measurementTypeChoiceByValue(schema, MEASURE_TAB_EXACT_TRANSOM);
      list.push({
        value: MEASURE_TAB_EXACT_TRANSOM,
        label: measurementTabLabelFromChoice(transCh, 'Exact Transom Size'),
        title: transCh && transCh.title,
        measureVis: 'transom'
      });
    }
    return list;
  }

  function syncMeasurementSidelightTransomTabVisibility(optionsContainer, schema) {
    if (!optionsContainer || !schema) return;
    optionsContainer.querySelectorAll('.door-measure-tabs .door-measure-tab').forEach(function (tab) {
      var radio = tab.querySelector('input[type="radio"][data-option-id]');
      if (!radio) return;
      var v = String(radio.value || '');
      var valNorm = normalizeOptionIdKey(v);
      var hideTab = false;
      if (valNorm === MEASURE_TAB_EXACT_DOOR || valNorm === MEASURE_TAB_EXACT_SIDELIGHT || valNorm === MEASURE_TAB_EXACT_TRANSOM) {
        hideTab = !measurementTabAllowedByProductTags(schema, v);
      } else {
        return;
      }
      tab.classList.toggle('door-hidden', hideTab);
      tab.style.display = hideTab ? 'none' : '';
      if (hideTab) tab.setAttribute('data-product-tag-hidden', '1');
      else tab.removeAttribute('data-product-tag-hidden');
      if (hideTab && radio.checked) {
        radio.checked = false;
        tab.classList.remove('common-check-option--selected');
      }
    });
  }

  function wireMeasurementDimensionSelectUnits(rootEl) {
    if (!rootEl) return;
    rootEl.querySelectorAll('.door-measure-dimension-row[data-embed-dimension-id]').forEach(function (row) {
      var oid = row.getAttribute('data-embed-dimension-id');
      if (!oid) return;
      var intSel = row.querySelector('select.door-dimension-int-select');
      var fracSel = row.querySelector('select.door-dimension-frac-select');
      if (intSel) {
        intSel.setAttribute('data-option-id', oid);
        intSel.setAttribute('data-unit', 'in-int');
      }
      if (fracSel) {
        fracSel.setAttribute('data-option-id', oid);
        fracSel.setAttribute('data-unit', 'in-frac');
      }
    });
  }

  function measurementTitleTwoWordKey(title) {
    var t = String(title || '').toLowerCase();
    t = t.replace(/[^a-z0-9]+/g, ' ').trim();
    if (!t) return '';
    var stop = {
      add: true, your: true, measurements: true, measurement: true, for: true, the: true, of: true,
      existing: true, desired: true, largest: true, widest: true, tallest: true, inside: true, include: true,
      exact: true, finished: true, rough: true, opening: true, size: true
    };
    var parts = t.split(/\s+/g).filter(function (p) { return p && !stop[p]; });
    if (!parts.length) parts = t.split(/\s+/g);
    // Prefer first 2 meaningful words; if the 2nd is "unit", skip to the next.
    var w1 = parts[0] || '';
    var w2 = parts[1] || '';
    if (w2 === 'unit' && parts[2]) w2 = parts[2];
    var key = sanitizeForDomId([w1, w2].filter(Boolean).join('-'));
    return key;
  }

  function rebuildMeasurementIntSelectOptions(intSel, min, max, step, preferredDefault) {
    if (!intSel) return;
    min = parseInt(min, 10);
    max = parseInt(max, 10);
    step = parseInt(step, 10) || 1;
    if (!isFinite(min) || !isFinite(max) || max < min) return;
    var prev = parseFloat(intSel.value);
    while (intSel.firstChild) intSel.removeChild(intSel.firstChild);
    var ph = document.createElement('option');
    ph.value = '';
    ph.textContent = 'Select';
    intSel.appendChild(ph);
    for (var v = min; v <= max; v += step) {
      var op = document.createElement('option');
      op.value = String(v);
      op.textContent = String(v);
      intSel.appendChild(op);
    }
    var def = preferredDefault != null && preferredDefault !== '' ? parseInt(preferredDefault, 10) : min;
    if (isFinite(prev) && prev >= min && prev <= max) intSel.value = String(prev);
    else if (isFinite(def) && def >= min && def <= max) intSel.value = String(def);
    else intSel.value = String(min);
  }

  /** Slab transom/combo panel rows only — not main exact-door-width-int (template default 36). */
  function fixPanelDoorWidthAndTransomHeightOptionRanges(rootEl) {
    if (!rootEl) return;
    var rows = rootEl.querySelectorAll('.door-measure-dimension-row');
    for (var ri = 0; ri < rows.length; ri++) {
      var row = rows[ri];
      if (!row) continue;
      var titleEl = row.querySelector('.door-measure-dimension-title') || row.querySelector('h4');
      var title = String((titleEl && titleEl.textContent) || '').toLowerCase();
      var intSel = row.querySelector('select.door-dimension-int-select');
      if (!intSel) continue;
      var inSlabTransom = !!(row.closest && row.closest('.door-measurement-slab-transom-panels'));
      var inSlabCombo = !!(row.closest && row.closest('.door-measurement-slab-combo-panels'));
      if (title.indexOf('door width') !== -1 && (inSlabTransom || inSlabCombo)) {
        rebuildMeasurementIntSelectOptions(intSel, 10, 112, 1, 82);
      } else if (
        (title.indexOf('transom height') !== -1 || (title.indexOf('transom') !== -1 && title.indexOf('height') !== -1))
        && (inSlabTransom || inSlabCombo)
      ) {
        rebuildMeasurementIntSelectOptions(intSel, 10, 144, 1, 16);
      }
    }
  }

  var DEFAULT_EXACT_DOOR_WIDTH_INT = '36';
  var DEFAULT_EXACT_DOOR_WIDTH_FRAC = '0';
  var DEFAULT_EXACT_DOOR_HEIGHT_INT = '82';
  var DEFAULT_EXACT_DOOR_HEIGHT_FRAC = '0';
  var PET_GATES_DOOR_HEIGHT_MIN = 50;
  var PET_GATES_DOOR_HEIGHT_MAX = 100;
  var PET_GATES_DOOR_HEIGHT_RANGE_ATTR = 'data-pet-gates-height-range';

  function getDefaultExactDoorHeightInt() {
    if (isPetGatesCollection()) return String(PET_GATES_DOOR_HEIGHT_MIN);
    return DEFAULT_EXACT_DOOR_HEIGHT_INT;
  }

  function isPetGatesExactDoorHeightIntSelect(sel) {
    if (!sel || String(sel.tagName || '').toUpperCase() !== 'SELECT') return false;
    var id = String(sel.id || '');
    if (id.indexOf('fraction') !== -1 || id.indexOf('frac') !== -1) return false;
    if (id === 'door_height' || (id.indexOf('door_height') === 0 && id.indexOf('fraction') === -1)) return true;
    // Finished Opening Size panel uses a separate height int select that, like the
    // Exact Gate Size panel, must carry the pet-gates 32-100 range.
    if (id === 'finished-height-int' || id.indexOf('finished-height-int') === 0) return true;
    return false;
  }

  function rebuildExactDoorHeightIntSelectOptions(intSel, min, max, preferredDefault) {
    if (!intSel) return false;
    min = parseInt(min, 10);
    max = parseInt(max, 10);
    if (!isFinite(min) || !isFinite(max) || max < min) return false;
    var prev = parseFloat(intSel.value);
    var userChanged = measurementSelectUserChanged(intSel);
    var def = parseInt(preferredDefault, 10);
    if (!isFinite(def)) def = min;
    if (def < min || def > max) def = min;
    while (intSel.firstChild) intSel.removeChild(intSel.firstChild);
    for (var v = min; v <= max; v++) {
      var op = document.createElement('option');
      op.value = String(v);
      op.textContent = String(v);
      intSel.appendChild(op);
    }
    var nextVal;
    if (userChanged && isFinite(prev) && prev >= min && prev <= max) nextVal = String(prev);
    else if (!userChanged) nextVal = String(def);
    else if (isFinite(prev) && prev >= min && prev <= max) nextVal = String(prev);
    else if (isFinite(prev) && prev > max) nextVal = String(max);
    else nextVal = String(min);
    var before = String(intSel.value != null ? intSel.value : '');
    setMeasurementSelectValue(intSel, nextVal);
    rebuildDoorDivSelectFromNativeOptions(intSel);
    return before !== String(intSel.value != null ? intSel.value : '');
  }

  // After the native <option> list of an enhanced select is rebuilt, the custom
  // .door-div-select dropdown still holds the old <button> items (it only re-syncs
  // labels, not the item list). Drop the stale wrapper and re-enhance so the
  // visible dropdown matches the new option range.
  function rebuildDoorDivSelectFromNativeOptions(sel) {
    if (!sel || sel.getAttribute('data-door-div-select') !== '1') return;
    var wrap = sel.nextElementSibling;
    if (wrap && wrap.classList && wrap.classList.contains('door-div-select')) {
      try { wrap.parentNode.removeChild(wrap); } catch (eRm) {}
    }
    sel.removeAttribute('data-door-div-select');
    if (sel.classList) sel.classList.remove('door-native-select--enhanced');
    enhanceDoorSelectWithDivDropdown(sel);
  }

  function applyPetGatesDoorHeightSelectRange(rootEl) {
    if (!isPetGatesCollection()) return false;
    if (!rootEl) rootEl = document.getElementById('door-configurator-options') || document;
    var rangeKey = PET_GATES_DOOR_HEIGHT_MIN + '-' + PET_GATES_DOOR_HEIGHT_MAX;
    var changed = false;
    rootEl.querySelectorAll('select#door_height, select[id^="door_height"], select#finished-height-int, select[id^="finished-height-int"]').forEach(function (sel) {
      if (!isPetGatesExactDoorHeightIntSelect(sel)) return;
      if (sel.getAttribute(PET_GATES_DOOR_HEIGHT_RANGE_ATTR) === rangeKey) return;
      if (rebuildExactDoorHeightIntSelectOptions(
        sel,
        PET_GATES_DOOR_HEIGHT_MIN,
        PET_GATES_DOOR_HEIGHT_MAX,
        getDefaultExactDoorHeightInt()
      )) {
        changed = true;
      }
      sel.setAttribute(PET_GATES_DOOR_HEIGHT_RANGE_ATTR, rangeKey);
    });
    return changed;
  }

  function getDefaultExactDoorThicknessFracValue() {
    if (isPetGatesCollection()) return '1.5';
    if (isGardenGatesCollection()) return '1.75';
    try {
      if (
        window.PriceScreenStorm
        && typeof window.PriceScreenStorm.isScreenAndStormDoorsProductType === 'function'
        && window.PriceScreenStorm.isScreenAndStormDoorsProductType()
      ) {
        return '1.125';
      }
    } catch (eSs) {}
    try {
      var container = document.getElementById('door-configurator');
      if (container) {
        var tagsAttr = container.getAttribute('data-product-tags') || '';
        var tags = [];
        try {
          tags = Array.isArray(JSON.parse(tagsAttr)) ? JSON.parse(tagsAttr) : [];
        } catch (eTags) {
          tags = String(tagsAttr || '').split('|');
        }
        for (var ti = 0; ti < tags.length; ti++) {
          var t = String(tags[ti] || '').toLowerCase().replace(/[\s-]+/g, '_');
          if (t === 'interior_doors' || t === 'interior-doors') return '1.5';
        }
        var pt = String(container.getAttribute('data-product-type') || '').toLowerCase().replace(/[\s-]+/g, '_');
        if (pt.indexOf('interior') !== -1 && pt.indexOf('exterior') === -1) return '1.5';
      }
    } catch (eDom) {}
    try {
      if (
        window.DoorIntExtPricingRule
        && typeof window.DoorIntExtPricingRule.getDoorSurfaceFromTags === 'function'
        && window.DoorIntExtPricingRule.getDoorSurfaceFromTags() === 'interior'
      ) {
        return '1.5';
      }
    } catch (eSurf) {}
    return '1.75';
  }

  function applyDefaultExactDoorThicknessFracSelects(rootEl) {
    if (!rootEl) rootEl = document.getElementById('door-configurator-options') || document;
    var def = getDefaultExactDoorThicknessFracValue();
    function applyToSelect(sel) {
      if (!sel || measurementSelectUserChanged(sel)) return;
      setMeasurementSelectValue(sel, def);
    }
    try {
      rootEl.querySelectorAll(
        'select#exact-door-thickness-frac, select[id^="exact-door-thickness-frac"], select#door-thickness'
      ).forEach(applyToSelect);
      rootEl.querySelectorAll('.door-measure-dimension-row').forEach(function (row) {
        var titleEl = row.querySelector('.door-measure-dimension-title') || row.querySelector('h4');
        var title = String((titleEl && titleEl.textContent) || '').toLowerCase();
        if (title.indexOf('sidelight thickness') !== -1 || title.indexOf('transom thickness') !== -1) return;
        if (title.indexOf('exact door thickness') === -1 && title.indexOf('door thickness') === -1) return;
        var sel = row.querySelector(
          'select#exact-door-thickness-frac, select[id^="exact-door-thickness-frac"], select#door-thickness, select.door-dimension-frac-select, select.door-dimension-select'
        );
        applyToSelect(sel);
      });
      var defNum = parseFloat(def);
      if (!isNaN(defNum) && defNum > 0) {
        try { window.__lastDoorThicknessInches = defNum; } catch (eThk) {}
      }
    } catch (eApply) {}
  }
  var MEASUREMENT_WIDTH_DEFAULT_DEBUG_IDS = {
    'finished-width-int': true,
    'rough-width-int': true,
    'panel-width-int': true
  };
  var _measurementProgrammaticSelectChange = false;

  function setMeasurementProgrammaticSelectChangeFlag(on) {
    _measurementProgrammaticSelectChange = !!on;
    try { window.__doorMeasurementProgrammaticSelectChange = !!on; } catch (eFlag) {}
  }

  function isMeasurementWidthDefaultDebugOn() {
    try {
      if (window.__DOOR_MEASUREMENT_WIDTH_DEFAULT_DEBUG === true) return true;
      if (typeof location !== 'undefined' && location.search && /(?:\?|&)door_meas_debug=1(?:&|$)/.test(location.search)) {
        return true;
      }
    } catch (eDbg) {}
    return false;
  }

  function shouldDebugMeasurementWidthSelect(sel) {
    if (!sel || !isMeasurementWidthDefaultDebugOn()) return false;
    var id = String(sel.id || '');
    return !!(
      MEASUREMENT_WIDTH_DEFAULT_DEBUG_IDS[id]
      || id.indexOf('finished-width-int') === 0
      || id.indexOf('rough-width-int') === 0
      || id.indexOf('panel-width-int') === 0
    );
  }

  function debugMeasurementWidthDefault(sel, phase, detail) {
    if (!shouldDebugMeasurementWidthSelect(sel)) return;
    try {
      console.log('[door-meas-width-default]', String(sel.id || ''), phase, Object.assign({
        value: sel.value,
        selectedIndex: sel.selectedIndex,
        userChanged: measurementSelectUserChanged(sel),
        visible: !!(sel.offsetParent || (sel.getClientRects && sel.getClientRects().length))
      }, detail || {}));
    } catch (eLog) {}
  }

  function isExactDoorWidthIntSelect(sel) {
    if (!sel) return false;
    var id = String(sel.id || '');
    return id === 'exact-door-width-int' || id.indexOf('exact-door-width-int') === 0;
  }

  function isFinishedWidthIntSelect(sel) {
    if (!sel) return false;
    var id = String(sel.id || '');
    return id === 'finished-width-int' || id.indexOf('finished-width-int') === 0;
  }

  function isRoughWidthIntSelect(sel) {
    if (!sel) return false;
    var id = String(sel.id || '');
    return id === 'rough-width-int' || id.indexOf('rough-width-int') === 0;
  }

  function isPanelWidthIntSelect(sel) {
    if (!sel) return false;
    var id = String(sel.id || '');
    return id === 'panel-width-int' || id.indexOf('panel-width-int') === 0;
  }

  function isStandardMeasurementWidthIntSelect(sel) {
    return isExactDoorWidthIntSelect(sel)
      || isFinishedWidthIntSelect(sel)
      || isRoughWidthIntSelect(sel)
      || isPanelWidthIntSelect(sel);
  }

  function canonicalStaticMeasurementSelectId(panelKey, title, unitKey) {
    var panel = String(panelKey || '').toLowerCase();
    var t = String(title || '').toLowerCase();
    var isInt = unitKey === 'int';
    var isFrac = unitKey === 'frac';
    var isWidth = t.indexOf('width') !== -1;
    var isHeight = t.indexOf('height') !== -1;
    if (panel === 'finished' && isWidth) return isInt ? 'finished-width-int' : (isFrac ? 'finished-width-frac' : '');
    if (panel === 'rough' && isWidth) return isInt ? 'rough-width-int' : (isFrac ? 'rough-width-frac' : '');
    if (panel === 'jamb' && isWidth) return isInt ? 'panel-width-int' : (isFrac ? 'panel-width-frac' : '');
    if (panel === 'jamb' && isHeight) return isInt ? 'panel-height-int' : (isFrac ? 'panel-height-frac' : '');
    if (panel === 'exact' && (t.indexOf('door width') !== -1 || t.indexOf('gate width') !== -1)) {
      return isInt ? 'exact-door-width-int' : (isFrac ? 'exact-door-width-frac' : '');
    }
    return '';
  }

  function measurementSelectUserChanged(sel) {
    return !!(sel && sel.getAttribute && sel.getAttribute('data-door-user-changed') === '1');
  }

  function setMeasurementSelectValue(sel, val, opts) {
    if (!sel) return false;
    opts = opts || {};
    var want = String(val);
    var before = String(sel.value != null ? sel.value : '');
    try {
      var options = sel.options || [];
      var matchedIndex = -1;
      for (var oi = 0; oi < options.length; oi++) {
        var ov = options[oi];
        if (!ov) continue;
        if (String(ov.value) === want) {
          matchedIndex = oi;
          break;
        }
        if (ov.value !== '' && !isNaN(parseFloat(ov.value)) && !isNaN(parseFloat(want))) {
          if (Math.abs(parseFloat(ov.value) - parseFloat(want)) < 0.000001) {
            matchedIndex = oi;
            want = String(ov.value);
            break;
          }
        }
      }
      if (matchedIndex < 0) return false;
      sel.selectedIndex = matchedIndex;
      sel.value = want;
      try {
        for (var sj = 0; sj < options.length; sj++) {
          options[sj].selected = sj === matchedIndex;
        }
      } catch (eSel) {}
      syncMeasurementDivSelectUi(sel);
      if (opts.dispatchChange !== false && before !== want) {
        setMeasurementProgrammaticSelectChangeFlag(true);
        try {
          sel.dispatchEvent(new Event('change', { bubbles: true }));
        } catch (eCh) {}
        setMeasurementProgrammaticSelectChangeFlag(false);
        syncMeasurementDivSelectUi(sel);
      }
      return true;
    } catch (eSet) {}
    return false;
  }

  function syncMeasurementDivSelectUi(sel) {
    if (!sel || sel.getAttribute('data-door-div-select') !== '1') return;
    var divWrap = sel.nextElementSibling;
    if (!divWrap || !divWrap.classList || !divWrap.classList.contains('door-div-select')) return;
    if (window.DoorConf2Hardware && typeof window.DoorConf2Hardware.syncDoorDivSelectFromNative === 'function') {
      window.DoorConf2Hardware.syncDoorDivSelectFromNative(sel, divWrap);
    }
  }

  function setExactDoorWidthIntDefault(sel, force) {
    if (!sel || !isExactDoorWidthIntSelect(sel)) return false;
    return setStandardMeasurementWidthIntDefault(sel, force);
  }

  function setStandardMeasurementWidthIntDefault(sel, force) {
    if (!sel || !isStandardMeasurementWidthIntSelect(sel)) return false;
    debugMeasurementWidthDefault(sel, 'attempt', { force: !!force });
    if (!force && measurementSelectUserChanged(sel)) {
      debugMeasurementWidthDefault(sel, 'skip-user-changed');
      return false;
    }
    var cur = String(sel.value != null ? sel.value : '').trim();
    if (!force && cur === DEFAULT_EXACT_DOOR_WIDTH_INT) {
      debugMeasurementWidthDefault(sel, 'skip-already-36');
      return false;
    }
    var applied = setMeasurementSelectValue(sel, DEFAULT_EXACT_DOOR_WIDTH_INT);
    debugMeasurementWidthDefault(sel, applied ? 'applied-36' : 'apply-failed', { previous: cur });
    return applied;
  }

  function applyFinishedRoughWidthIntDefaults(rootEl, force) {
    if (!rootEl) rootEl = document.getElementById('door-configurator-options') || document;
    var selectors = [
      'select#exact-door-width-int',
      'select[id^="exact-door-width-int"]',
      'select#finished-width-int',
      'select[id^="finished-width-int"]',
      'select#rough-width-int',
      'select[id^="rough-width-int"]',
      'select#panel-width-int',
      'select[id^="panel-width-int"]'
    ].join(', ');
    var seen = Object.create(null);
    rootEl.querySelectorAll(selectors).forEach(function (sel) {
      if (!sel || !sel.id || seen[sel.id]) return;
      seen[sel.id] = true;
      setStandardMeasurementWidthIntDefault(sel, !!force);
    });
  }

  function bindMeasurementUserChangedTracking(rootEl) {
    if (!rootEl || rootEl.getAttribute('data-door-meas-user-track') === '1') return;
    rootEl.setAttribute('data-door-meas-user-track', '1');
    rootEl.addEventListener('change', function (e) {
      var t = e && e.target;
      if (!t || String(t.tagName || '').toUpperCase() !== 'SELECT') return;
      if (_measurementProgrammaticSelectChange) return;
      if (isStandardMeasurementWidthIntSelect(t)) t.setAttribute('data-door-user-changed', '1');
      var tid = String(t.id || '');
      if (tid.indexOf('exact-door-width') === 0) t.setAttribute('data-door-user-changed', '1');
      if (
        tid.indexOf('panel-door-width') === 0
        || tid.indexOf('door_height') === 0
        || tid === 'door_height' || tid === 'door_height_fraction'
        || tid === 'sidelight_width' || tid === 'sidelight_width_fraction'
        || tid.indexOf('panel-transom-height') === 0
        || tid.indexOf('exact-door-thickness') === 0
        || tid === 'door-thickness'
        || tid.indexOf('finished-door-thickness') === 0
        || tid.indexOf('panel-door-thickness') === 0
      ) {
        t.setAttribute('data-door-user-changed', '1');
      }
    }, true);
  }

  /** Restore liquid/template defaults when measurement selects were cleared on boot. */
  function applyStaticMeasurementDimensionDefaults(rootEl) {
    if (!rootEl) rootEl = document.getElementById('door-configurator-options') || document;
    bindMeasurementUserChangedTracking(rootEl);
    function setSelectValueIfEmpty(sel, val) {
      if (!sel || measurementSelectUserChanged(sel)) return;
      var cur = String(sel.value != null ? sel.value : '').trim();
      if (cur !== '') return;
      setMeasurementSelectValue(sel, val);
    }
    rootEl.querySelectorAll('.door-measure-dimension-row').forEach(function (row) {
      var titleEl = row.querySelector('.door-measure-dimension-title') || row.querySelector('h4');
      var title = String((titleEl && titleEl.textContent) || '').toLowerCase();
      var intSel = row.querySelector('select.door-dimension-int-select');
      var fracSel = row.querySelector('select.door-dimension-frac-select');
      if (title.indexOf('door width') !== -1 || title.indexOf('gate width') !== -1) {
        setStandardMeasurementWidthIntDefault(intSel, false);
        setSelectValueIfEmpty(fracSel, DEFAULT_EXACT_DOOR_WIDTH_FRAC);
      } else if (title.indexOf('opening width') !== -1) {
        setStandardMeasurementWidthIntDefault(intSel, false);
        setSelectValueIfEmpty(fracSel, DEFAULT_EXACT_DOOR_WIDTH_FRAC);
      } else if (title.indexOf('jamb unit width') !== -1 || (title.indexOf('unit width') !== -1 && title.indexOf('jamb') !== -1)) {
        setStandardMeasurementWidthIntDefault(intSel, false);
        setSelectValueIfEmpty(fracSel, DEFAULT_EXACT_DOOR_WIDTH_FRAC);
      } else if (title.indexOf('door height') !== -1 || title.indexOf('gate height') !== -1) {
        setSelectValueIfEmpty(intSel, getDefaultExactDoorHeightInt());
        setSelectValueIfEmpty(fracSel, DEFAULT_EXACT_DOOR_HEIGHT_FRAC);
      } else if (title.indexOf('transom height') !== -1) {
        setSelectValueIfEmpty(intSel, '12');
        setSelectValueIfEmpty(fracSel, '0');
      }
    });
    try {
      rootEl.querySelectorAll('select#exact-door-width-int, select[id^="exact-door-width-int"]').forEach(function (sel) {
        setStandardMeasurementWidthIntDefault(sel, false);
      });
      rootEl.querySelectorAll('select#finished-width-int, select[id^="finished-width-int"]').forEach(function (sel) {
        setStandardMeasurementWidthIntDefault(sel, false);
      });
      rootEl.querySelectorAll('select#rough-width-int, select[id^="rough-width-int"]').forEach(function (sel) {
        setStandardMeasurementWidthIntDefault(sel, false);
      });
      rootEl.querySelectorAll('select#panel-width-int, select[id^="panel-width-int"]').forEach(function (sel) {
        setStandardMeasurementWidthIntDefault(sel, false);
      });
      rootEl.querySelectorAll('select#exact-door-width-frac, select[id^="exact-door-width-frac"]').forEach(function (sel) {
        setSelectValueIfEmpty(sel, DEFAULT_EXACT_DOOR_WIDTH_FRAC);
      });
      rootEl.querySelectorAll('select#finished-width-frac, select[id^="finished-width-frac"]').forEach(function (sel) {
        setSelectValueIfEmpty(sel, DEFAULT_EXACT_DOOR_WIDTH_FRAC);
      });
      rootEl.querySelectorAll('select#rough-width-frac, select[id^="rough-width-frac"]').forEach(function (sel) {
        setSelectValueIfEmpty(sel, DEFAULT_EXACT_DOOR_WIDTH_FRAC);
      });
      rootEl.querySelectorAll('select#panel-width-frac, select[id^="panel-width-frac"]').forEach(function (sel) {
        setSelectValueIfEmpty(sel, DEFAULT_EXACT_DOOR_WIDTH_FRAC);
      });
      applyFinishedRoughWidthIntDefaults(rootEl, false);
      rootEl.querySelectorAll('select#door_height, select[id^="door_height"]').forEach(function (sel) {
        if (sel.id && sel.id.indexOf('fraction') !== -1) return;
        setSelectValueIfEmpty(sel, getDefaultExactDoorHeightInt());
      });
      rootEl.querySelectorAll('select#door_height_fraction, select[id^="door_height_fraction"]').forEach(function (sel) {
        setSelectValueIfEmpty(sel, DEFAULT_EXACT_DOOR_HEIGHT_FRAC);
      });
      applyDefaultExactDoorThicknessFracSelects(rootEl);
      applyGateCollectionThicknessFracSelects(rootEl);
      applyPetGatesMeasurementDimensionCopy(rootEl);
    } catch (eId) {}
  }

  function assignStaticMeasurementRowSelectIds(rootEl) {
    if (!rootEl) return;
    var rows = rootEl.querySelectorAll('.door-measure-dimension-row');
    var used = Object.create(null);
    for (var ri = 0; ri < rows.length; ri++) {
      var row = rows[ri];
      if (!row) continue;
      var titleEl = row.querySelector('.door-measure-dimension-title') || row.querySelector('h4');
      var title = String((titleEl && titleEl.textContent) || '').trim();
      var panelKey = inferStaticMeasurementPanelKey(row);
      var panelShort = staticMeasurementPanelShortKey(panelKey);
      var rowKey = measurementTitleTwoWordKey(title) || ('row_' + ri);
      var baseKey = panelShort + '-' + rowKey;

      var selects = row.querySelectorAll('select');
      for (var si = 0; si < selects.length; si++) {
        var sel = selects[si];
        if (!sel) continue;
        var unitKey = 'sel-' + si;
        if (sel.classList && sel.classList.contains('door-dimension-int-select')) unitKey = 'int';
        else if (sel.classList && sel.classList.contains('door-dimension-frac-select')) unitKey = 'frac';

        if (!sel.id) {
          var canonicalId = canonicalStaticMeasurementSelectId(panelKey, title, unitKey);
          var id = canonicalId || (sanitizeForDomId(baseKey + '-' + unitKey));
          if (used[id]) id = id + '__' + ri + '_' + si;
          used[id] = true;
          sel.id = id;
        }
        if (isStandardMeasurementWidthIntSelect(sel)) {
          setStandardMeasurementWidthIntDefault(sel, true);
        }
      }
    }
  }

  function assignUniqueOptionIds(rootEl, selectIdPrefix) {
    if (!rootEl) return;
    var selects = rootEl.querySelectorAll('select');
    for (var si = 0; si < selects.length; si++) {
      var sel = selects[si];
      var selId = ensureSelectHasId(sel, selectIdPrefix || 'door-select');
      var used = Object.create(null);
      var options = sel.options || [];
      for (var oi = 0; oi < options.length; oi++) {
        var opt = options[oi];
        if (!opt) continue;
        if (!opt.id) {
          opt.id = buildOptionDomId(selId, opt.value != null && opt.value !== '' ? opt.value : (opt.textContent || ''), oi);
        }
        if (used[opt.id]) {
          opt.id = opt.id + '__' + oi;
        }
        used[opt.id] = true;
      }
    }
  }

  // Selection meta capture (useful for future pricing keyed by select+option)
  var doorSelectionMetaBySelectId = Object.create(null);
  var doorLastSelectionMeta = null;

  function getSelectSelectionMeta(selectEl, fallbackSelectIdPrefix) {
    if (!selectEl || String(selectEl.tagName || '').toUpperCase() !== 'SELECT') return null;
    var selectId = ensureSelectHasId(selectEl, fallbackSelectIdPrefix || 'door-select');
    var opt = null;
    try {
      opt = (selectEl.selectedOptions && selectEl.selectedOptions[0]) || selectEl.options[selectEl.selectedIndex];
    } catch (eSel) {
      opt = null;
    }
    var value = String(selectEl.value != null ? selectEl.value : '');
    var optionId = opt && opt.id ? String(opt.id) : '';
    if (!optionId && opt) {
      // In case some options were inserted without ids, synthesize one deterministically.
      optionId = buildOptionDomId(selectId, value || (opt.textContent || ''), selectEl.selectedIndex);
      try { opt.id = optionId; } catch (eSet) {}
    }
    return { selectId: selectId, optionId: optionId, value: value };
  }

  function recordDoorSelectMeta(selectEl, fallbackSelectIdPrefix) {
    var meta = getSelectSelectionMeta(selectEl, fallbackSelectIdPrefix);
    if (!meta) return null;
    doorSelectionMetaBySelectId[meta.selectId] = meta;
    doorLastSelectionMeta = meta;
    return meta;
  }
  function isMeasurementTypeOptionId(id) {
    return normalizeOptionIdKey(id) === 'measurement_type';
  }

  function optionHasJsonVisibilityRules(opt) {
    if (!opt) return false;
    if (opt.hideWhen && typeof opt.hideWhen === 'object') return true;
    if (opt.showWhen && typeof opt.showWhen === 'object') return true;
    return false;
  }

  function choiceHasJsonVisibilityRules(choice) {
    if (!choice) return false;
    if (choice.showWhen && typeof choice.showWhen === 'object') return true;
    if (choice.hideWhen && (typeof choice.hideWhen === 'object' || Array.isArray(choice.hideWhen))) return true;
    return false;
  }

  /** True when measurement_type and/or measurement dimensions use metaobject hide_when / show_when. */
  function measurementSchemaUsesJsonVisibility(schema) {
    if (!Array.isArray(schema)) return false;
    for (var i = 0; i < schema.length; i++) {
      var o = schema[i];
      if (!o) continue;
      if (isMeasurementTypeOptionId(o.id)) {
        if (optionHasJsonVisibilityRules(o)) return true;
        var choices = o.options || [];
        for (var j = 0; j < choices.length; j++) {
          if (choiceHasJsonVisibilityRules(choices[j])) return true;
        }
      }
      if (String(o.type || '').toLowerCase() === 'dimension' && optionHasJsonVisibilityRules(o)) return true;
    }
    return false;
  }

  /** Match static liquid measurement rows to schema dimension options for applyHideWhen. */
  function linkStaticMeasurementRowsToSchema(schema, rootEl) {
    if (!schema || !rootEl) return;
    schema.forEach(function (opt) {
      if (!opt || String(opt.type || '').toLowerCase() !== 'dimension') return;
      var optId = String(opt.id || '');
      if (!optId) return;
      var lab = String(opt.label || '').toLowerCase().trim();
      var optKey = measurementTitleTwoWordKey(opt.label);
      var rows = rootEl.querySelectorAll('.door-measure-dimension-row');
      for (var ri = 0; ri < rows.length; ri++) {
        var row = rows[ri];
        if (!row || row.getAttribute('data-embed-dimension-id')) continue;
        var titleEl = row.querySelector('.door-measure-dimension-title') || row.querySelector('h4');
        var title = String((titleEl && titleEl.textContent) || '').trim();
        var titleLower = title.toLowerCase();
        var rowKey = measurementTitleTwoWordKey(title);
        var match = false;
        if (lab && titleLower.indexOf(lab) !== -1) match = true;
        if (!match && optKey && rowKey && optKey === rowKey) match = true;
        if (!match && optId) {
          var idPhrase = normalizeOptionIdKey(optId).replace(/_/g, ' ');
          if (idPhrase && titleLower.indexOf(idPhrase) !== -1) match = true;
        }
        if (!match) continue;
        row.setAttribute('data-embed-dimension-id', optId);
        wireMeasurementDimensionSelectUnits(row.parentNode || rootEl);
      }
    });
    wireMeasurementDimensionSelectUnits(rootEl);
  }

  function applyMeasurementSectionJsonVisibility(schema, container) {
    if (!schema || !container) return;
    applyHideWhen(schema, container);
    applyChoiceVisibility(schema, container);
    syncMeasurementPanelsFromSchemaRows(container);
  }

  /** Show static panel / panel group when it has at least one schema-linked row not hidden by JSON rules. */
  function syncMeasurementPanelsFromSchemaRows(container) {
    if (!container) return;
    var emb = container.querySelector('.door-measurement-embedded-dimensions');
    if (!emb) return;
    function groupHasVisibleLinkedRow(groupEl) {
      var linked = groupEl.querySelectorAll('.door-measure-dimension-row[data-embed-dimension-id]');
      if (!linked.length) return null;
      for (var i = 0; i < linked.length; i++) {
        var row = linked[i];
        if (row.classList && row.classList.contains('door-hidden')) continue;
        if (row.style && row.style.display === 'none') continue;
        return true;
      }
      return false;
    }
    emb.querySelectorAll('.door-measurement-static-panel').forEach(function (panel) {
      var vis = groupHasVisibleLinkedRow(panel);
      if (vis === null) return;
      panel.classList.toggle('door-hidden', !vis);
    });
    var groupSelectors = [
      '.door-measurement-default-panels',
      '.door-measurement-slab-sidelight-panels',
      '.door-measurement-slab-transom-panels',
      '.door-measurement-slab-combo-panels'
    ];
    groupSelectors.forEach(function (sel) {
      var group = emb.querySelector(sel);
      if (!group) return;
      var vis = groupHasVisibleLinkedRow(group);
      if (vis === null) return;
      group.classList.toggle('door-hidden', !vis);
    });
  }

  function isPreHungOnDoorJambTrigger(preOpt, val) {
    if (val == null || val === '') return false;
    var n = normPreHungSelectionValue(val);
    if (n === 'pre_hung_on_jamb') return true;
    if (n.indexOf('door') !== -1 && n.indexOf('jamb') !== -1) return true;
    var ch = choiceMatchingValue(preOpt, val);
    if (ch) {
      var lbl = String(ch.label || '').toLowerCase();
      if (lbl.indexOf('brick') !== -1) return false;
      if (lbl.indexOf('slab') !== -1 && lbl.indexOf('only') !== -1) return false;
      if ((lbl.indexOf('pre-hung') !== -1 || lbl.indexOf('pre hung') !== -1) && lbl.indexOf('jamb') !== -1) return true;
      if (lbl.indexOf('door jamb') !== -1) return true;
    }
    return false;
  }

  function isPreHungOnDoorJambSelected(schema, optionsContainer) {
    var preOpt = findPreHungStyleOption(schema || doorConfigSchemaRef());
    if (!preOpt || !optionsContainer) return false;
    return isPreHungOnDoorJambTrigger(preOpt, getSelectedValueForOption(preOpt, optionsContainer));
  }

  function filterMeasurementTypeTabChoices(options) {
    if (!Array.isArray(options)) return [];
    var exact = null;
    var finished = null;
    options.forEach(function (o) {
      var t = String((o && (o.label || o.value)) || '').toLowerCase();
      if (t.indexOf('exact') !== -1 && !exact) exact = o;
      else if ((t.indexOf('finished') !== -1 || t.indexOf('opening') !== -1) && !finished) finished = o;
    });
    if (exact && finished) return [exact, finished];
    if (options.length === 2) return options.slice();
    return options.filter(function (o) {
      var t = String((o && (o.label || o.value)) || '').toLowerCase();
      return t.indexOf('exact') !== -1 || t.indexOf('finished') !== -1 || t.indexOf('opening') !== -1;
    }).slice(0, 2);
  }

  /** Measurement tabs: use metaobject choices when JSON visibility is configured; else legacy 4-tab list. */
  function buildMeasurementTypeTabOptionList(measureOpt, schema, optionsContainer) {
    var opts = (measureOpt && measureOpt.options) ? measureOpt.options : [];
    if (measurementSchemaUsesJsonVisibility(schema)) {
      return mergeMeasurementSidelightTransomTabs(opts.slice(), schema, optionsContainer);
    }
    var filtered = filterMeasurementTypeTabChoices(opts);
    var exactChoice = null;
    var finishedChoice = null;
    filtered.forEach(function (c) {
      var t = String((c && (c.label || c.value)) || '').toLowerCase();
      if (t.indexOf('exact') !== -1 && !exactChoice) exactChoice = c;
      if ((t.indexOf('finished') !== -1 || (t.indexOf('opening') !== -1 && t.indexOf('rough') === -1)) && !finishedChoice) finishedChoice = c;
    });
    if (!exactChoice && filtered[0]) exactChoice = filtered[0];
    if (!finishedChoice && filtered[1]) finishedChoice = filtered[1];
    var ev = function (v) { return v != null && v !== '' ? String(v) : ''; };
    var list = [
      { value: ev(exactChoice && exactChoice.value) || 'exact_door_size', label: 'Exact Door Size', measureVis: 'always' },
      { value: ev(finishedChoice && finishedChoice.value) || 'finished_opening', label: 'Finished Opening Size', measureVis: 'slab' },
      { value: 'rough_opening_size', label: 'Rough Opening Size', measureVis: 'jamb' },
      { value: 'jamb_unit_size', label: 'Jamb Unit Size', measureVis: 'jamb' }
    ];
    return mergeMeasurementSidelightTransomTabs(list, schema, optionsContainer);
  }

  function syncMeasurementTabCardVisibility(optionsContainer, schema) {
    if (!optionsContainer) optionsContainer = document.getElementById('door-configurator-options');
    if (!optionsContainer) return;
    if (isGateCollection()) {
      applyGateCollectionMeasurementTabs(optionsContainer, schema);
      return;
    }
    if (measurementSchemaUsesJsonVisibility(schema)) {
      applyMeasurementSectionJsonVisibility(schema, optionsContainer);
      syncMeasurementSidelightTransomTabVisibility(optionsContainer, schema);
      var wrapJson = optionsContainer.querySelector('.door-measurement-type-section.door-option-wrap');
      if (wrapJson && !wrapJson.querySelector('.door-measure-tab input[type="radio"]:checked')) {
        wrapJson.querySelectorAll('.door-measurement-static-panel').forEach(function (p) {
          p.classList.add('door-hidden');
        });
        var introJ = wrapJson.querySelector('.door-measurement-panel-intro');
        var embJ = wrapJson.querySelector('.door-measurement-embedded-dimensions');
        if (introJ) introJ.classList.add('door-hidden');
        if (embJ) embJ.classList.add('door-hidden');
      }
      return;
    }
    var wrap = optionsContainer.querySelector('.door-measurement-type-section.door-option-wrap');
    var jamb = isPreHungOnDoorJambSelected(schema, optionsContainer);
    var jambTwoTab = jamb && (hasActiveSidelightSelection(schema, optionsContainer) || hasActiveTransomSelection(schema, optionsContainer));
    var hasSide = hasActiveSidelightSelection(schema, optionsContainer);
    var hasTrans = hasActiveTransomSelection(schema, optionsContainer);
    optionsContainer.querySelectorAll('.door-measure-tab[data-measure-vis]').forEach(function (tab) {
      var v = tab.getAttribute('data-measure-vis');
      var tabRadio = tab.querySelector('input[type="radio"]');
      var tabVal = tabRadio ? String(tabRadio.value || '') : '';
      var show;
      if (isMeasurementSidelightTransomTabValue(tabVal)) {
        show = measurementTabAllowedByProductTags(schema, tabVal);
      } else if (v === 'sidelight') show = hasSide;
      else if (v === 'transom') show = hasTrans;
      else if (jambTwoTab) show = (v === 'always' || v === 'slab');
      else show = (v === 'always' || (jamb && v === 'jamb') || (!jamb && v === 'slab'));
      if (show && normalizeOptionIdKey(tabVal) === MEASURE_TAB_EXACT_DOOR && !measurementTabAllowedByProductTags(schema, tabVal)) {
        show = false;
      }
      tab.classList.toggle('door-hidden', !show);
      if (!show) {
        var ir = tab.querySelector('input[type="radio"]');
        if (ir && ir.checked) {
          ir.checked = false;
          tab.classList.remove('common-check-option--selected');
        }
      }
    });
    syncJambSidelightMeasurementTabValues(optionsContainer, schema);
    var slabSideEarly = isSlabSpecialMeasurementMode(schema, optionsContainer);
    if (wrap && !slabSideEarly && !wrap.querySelector('.door-measure-tab input[type="radio"]:checked')) {
      wrap.querySelectorAll('.door-measurement-static-panel').forEach(function (p) {
        p.classList.add('door-hidden');
      });
      var intro0 = wrap.querySelector('.door-measurement-panel-intro');
      var emb0 = wrap.querySelector('.door-measurement-embedded-dimensions');
      if (intro0) intro0.classList.add('door-hidden');
      if (emb0) emb0.classList.add('door-hidden');
    }
    syncJambSidelightTabLabels(optionsContainer, schema);
    syncMeasurementSidelightTransomTabVisibility(optionsContainer, schema);
    syncMeasurementPromptAndEyebrow(optionsContainer, schema);
  }

  /** Normalizes tab label / value to exact | rough | jamb | finished | sidelight | transom */
  function measurementModeFromTabText(tabLower) {
    var t = String(tabLower || '').toLowerCase();
    if (t.indexOf('sidelight') !== -1) return 'sidelight';
    if (t.indexOf('transom') !== -1) return 'transom';
    if (t.indexOf('gate') !== -1) return 'exact';
    if (t.indexOf('exact') !== -1) return 'exact';
    if (t.indexOf('rough') !== -1) return 'rough';
    if (t.indexOf('jamb') !== -1) return 'jamb';
    if (t.indexOf('finished') !== -1 || t.indexOf('opening') !== -1) return 'finished';
    return 'finished';
  }

  /** Resolves panel mode from the checked measurement tab (handles jamb+sidelight labels without "exact"/"rough" text). */
  function measurementModeFromCheckedTab(chk, optionsContainer, schema) {
    if (!chk) return 'finished';
    var tabVal = String(chk.value || '').toLowerCase();
    if (normalizeOptionIdKey(chk.value) === MEASURE_TAB_EXACT_GATE) return 'exact';
    if (tabVal === MEASURE_TAB_EXACT_SIDELIGHT) return 'sidelight';
    if (tabVal === MEASURE_TAB_EXACT_TRANSOM) return 'transom';
    var tabEl = chk.closest('.door-measure-tab');
    if (!tabEl) return measurementModeFromTabText('');
    var tabVis = tabEl.getAttribute('data-measure-vis');
    if (tabVis === 'sidelight') return 'sidelight';
    if (tabVis === 'transom') return 'transom';
    if (optionsContainer && schema && isJambTwoTabMeasureMode(schema, optionsContainer)) {
      var vis = tabEl.getAttribute('data-measure-vis');
      if (vis === 'always') return 'exact';
      if (vis === 'slab') return 'rough';
    }
    return measurementModeFromTabText(String(tabEl.textContent || '').toLowerCase());
  }

  function syncMeasurementPromptAndEyebrow(optionsContainer, schema) {
    if (!optionsContainer) optionsContainer = document.getElementById('door-configurator-options');
    if (!optionsContainer || !schema) return;
    var wrap = optionsContainer.querySelector('.door-measurement-type-section.door-option-wrap');
    if (!wrap) return;
    var strong = wrap.querySelector('.door-measurement-type-question strong');
    var preOpt = findPreHungStyleOption(schema);
    if (strong) {
      if (preOpt && isPreHungOnDoorJambTrigger(preOpt, getSelectedValueForOption(preOpt, optionsContainer))) {
        strong.textContent = 'How will you measure for the door and pre-hung jamb dimensions?';
      } else {
        strong.textContent = 'How will you measure?';
      }
    }
    var chk = wrap.querySelector('.door-measure-tabs .door-measure-tab input[type="radio"]:checked');
    var eyebrow = wrap.querySelector('.door-measurement-type-eyebrow');
    if (eyebrow && chk) {
      var mode = measurementModeFromCheckedTab(chk, optionsContainer, schema);
      var roughJamb = isPreHungOnDoorJambSelected(schema, optionsContainer);
      var jambSidePick = hasActiveSidelightSelection(schema, optionsContainer);
      var jambTransPick = hasActiveTransomSelection(schema, optionsContainer);
      var jambTwoTab = roughJamb && (jambSidePick || jambTransPick);
      if (roughJamb) {
        if (jambTwoTab && mode === 'exact') {
          if (jambSidePick && jambTransPick) eyebrow.textContent = 'Pre-Hung + Transom + Sidelight Exact Component Size';
          else if (jambSidePick) eyebrow.textContent = 'Pre-Hung + Sidelight Exact Component Size';
          else eyebrow.textContent = 'Pre-Hung + Transom Exact Component Size';
        } else if (jambTwoTab && mode === 'rough') {
          if (jambSidePick && jambTransPick) eyebrow.textContent = 'Pre-Hung + Transom + Sidelight Exact Door Size and Rough Opening';
          else if (jambSidePick) eyebrow.textContent = 'Pre-Hung + Sidelight Exact Door Size and Rough Opening';
          else eyebrow.textContent = 'Pre-Hung + Transom Exact Door Size and Rough Opening';
        } else if (mode === 'exact') eyebrow.textContent = 'Exact Door Size Measurements';
        else if (mode === 'rough') eyebrow.textContent = 'Rough Opening Measurements';
        else if (mode === 'jamb') eyebrow.textContent = 'Jamb Opening Measurements';
        else eyebrow.textContent = '';
      } else {
        eyebrow.textContent = mode === 'exact' ? 'Exact Door Size Measurements' : 'Finished Opening Measurements';
      }
    } else if (eyebrow && !chk && !isSlabSpecialMeasurementMode(schema, optionsContainer)) {
      eyebrow.textContent = '';
    }
  }

  /** Exact / finished / rough / jamb static panels + schema dimension row visibility */
  function syncMeasurementTabVisibilityCore(method, measureOptionId, optionsContainer, schema) {
    if (!optionsContainer) return;
    schema = schema || doorConfigSchemaRef();
    var m = String(method || '').toLowerCase();
    var threeJamb = isPreHungOnDoorJambSelected(schema, optionsContainer);

    if (measurementSchemaUsesJsonVisibility(schema)) {
      applyMeasurementSectionJsonVisibility(schema, optionsContainer);
      var measureWrapJson = measureOptionId
        ? optionsContainer.querySelector('.door-option-wrap[data-option-id="' + measureOptionId + '"]')
        : optionsContainer.querySelector('.door-measurement-type-section.door-option-wrap');
      var modeActiveJson = m.indexOf('exact') !== -1 || m.indexOf('finished') !== -1 ||
        m.indexOf('rough') !== -1 || m.indexOf('jamb') !== -1 ||
        m.indexOf('sidelight') !== -1 || m.indexOf('transom') !== -1;
      if (measureWrapJson && modeActiveJson) {
        var embJson = measureWrapJson.querySelector('.door-measurement-embedded-dimensions');
        if (embJson) embJson.classList.remove('door-hidden');
        var sidePanelJ = measureWrapJson.querySelector('.door-measurement-static-panel--sidelight');
        var transPanelJ = measureWrapJson.querySelector('.door-measurement-static-panel--transom');
        if (sidePanelJ) sidePanelJ.classList.toggle('door-hidden', m.indexOf('sidelight') === -1);
        if (transPanelJ) transPanelJ.classList.toggle('door-hidden', m.indexOf('transom') === -1);
        measureWrapJson.querySelectorAll('.door-measurement-static-panel--exact, .door-measurement-static-panel--finished, .door-measurement-static-panel--rough, .door-measurement-static-panel--jamb').forEach(function (p) {
          if (m.indexOf('sidelight') !== -1 || m.indexOf('transom') !== -1) p.classList.add('door-hidden');
        });
      }
      syncMeasurementSidelightTransomTabVisibility(optionsContainer, schema);
      syncMeasurementPromptAndEyebrow(optionsContainer, schema);
      return;
    }

    if (schema) {
      schema.forEach(function (sectionOpt) {
        if (!sectionOpt || String(sectionOpt.type || '').toLowerCase() !== 'dimension') return;
        if (optionHasJsonVisibilityRules(sectionOpt)) return;
        var lab = String(sectionOpt.label || sectionOpt.id || '').toLowerCase();
        var wrap = optionsContainer.querySelector('.door-option-wrap[data-option-id="' + sectionOpt.id + '"]') ||
          optionsContainer.querySelector('.door-measure-dimension-row[data-embed-dimension-id="' + sectionOpt.id + '"]');
        if (!wrap) return;
        var isExactField = lab.indexOf('exact') !== -1;
        var isFinishedField = lab.indexOf('finished') !== -1 || (lab.indexOf('opening') !== -1 && lab.indexOf('rough') === -1);
        if (threeJamb) {
          if (isExactField) wrap.classList.toggle('door-hidden', m.indexOf('exact') === -1);
          else if (isFinishedField) wrap.classList.toggle('door-hidden', m.indexOf('finished') === -1);
        } else {
          var exactMode = m.indexOf('exact') !== -1;
          var finishedMode = !exactMode;
          if (isExactField) wrap.classList.toggle('door-hidden', !exactMode);
          else if (isFinishedField) wrap.classList.toggle('door-hidden', !finishedMode);
        }
      });
    }

    var measureWrap = measureOptionId
      ? optionsContainer.querySelector('.door-option-wrap[data-option-id="' + measureOptionId + '"]')
      : null;
    if (!measureWrap) {
      measureWrap = optionsContainer.querySelector('.door-measurement-type-section.door-option-wrap');
    }
    if (!measureWrap) return;

    if (measureOptionId) {
      var intro = optionsContainer.querySelector('.door-measurement-panel-intro[data-option-id="' + measureOptionId + '"]');
      if (intro) {
        if (threeJamb) {
          if (m.indexOf('exact') !== -1) {
            intro.textContent = petGatesExistingMeasureIntroCopy(
              (hasActiveSidelightSelection(schema, optionsContainer) || hasActiveTransomSelection(schema, optionsContainer))
                ? 'Add the measurements for your Door'
                : 'Add your measurements for your Existing Door'
            );
            intro.classList.remove('door-hidden');
            intro.setAttribute('aria-hidden', 'false');
          } else if (m.indexOf('rough') !== -1) {
            if (hasActiveSidelightSelection(schema, optionsContainer) || hasActiveTransomSelection(schema, optionsContainer)) {
              intro.textContent = 'Add the measurements for your Door';
              intro.classList.remove('door-hidden');
              intro.setAttribute('aria-hidden', 'false');
            } else {
              intro.textContent = 'Add your measurements for your Rough Opening';
              intro.classList.remove('door-hidden');
              intro.setAttribute('aria-hidden', 'false');
            }
          } else if (m.indexOf('jamb') !== -1) {
            intro.textContent = 'Add your measurements for the Jamb Unit Size';
            intro.classList.remove('door-hidden');
            intro.setAttribute('aria-hidden', 'false');
          } else {
            intro.textContent = 'Add your measurements';
            intro.classList.remove('door-hidden');
            intro.setAttribute('aria-hidden', 'false');
          }
        } else {
          intro.textContent = petGatesExistingMeasureIntroCopy(
            m.indexOf('exact') !== -1
              ? 'Add your measurements for your Existing Door'
              : 'Add the measurements for the Finished Opening'
          );
          intro.classList.remove('door-hidden');
          intro.setAttribute('aria-hidden', 'false');
        }
      }
    }

    var modeActive = m.indexOf('exact') !== -1 || m.indexOf('finished') !== -1 ||
      m.indexOf('rough') !== -1 || m.indexOf('jamb') !== -1 ||
      m.indexOf('sidelight') !== -1 || m.indexOf('transom') !== -1;
    if (measureWrap && modeActive) {
      var embReveal = measureWrap.querySelector('.door-measurement-embedded-dimensions');
      if (embReveal) embReveal.classList.remove('door-hidden');
    }

    var exactPanel = measureWrap.querySelector('.door-measurement-static-panel--exact');
    var finishedPanel = measureWrap.querySelector('.door-measurement-static-panel--finished');
    var roughPanel = measureWrap.querySelector('.door-measurement-static-panel--rough');
    var jambPanel = measureWrap.querySelector('.door-measurement-static-panel--jamb');
    var sidelightPanel = measureWrap.querySelector('.door-measurement-static-panel--sidelight');
    var transomPanel = measureWrap.querySelector('.door-measurement-static-panel--transom');
    var depthExact = measureWrap.querySelectorAll('.door-measure-row--prehung-depth-exact');
    var sideOnlyMode = m.indexOf('sidelight') !== -1;
    var transOnlyMode = m.indexOf('transom') !== -1;

    if (sidelightPanel) sidelightPanel.classList.toggle('door-hidden', !sideOnlyMode);
    if (transomPanel) transomPanel.classList.toggle('door-hidden', !transOnlyMode);

    if (sideOnlyMode || transOnlyMode) {
      if (exactPanel) exactPanel.classList.add('door-hidden');
      if (finishedPanel) finishedPanel.classList.add('door-hidden');
      if (roughPanel) roughPanel.classList.add('door-hidden');
      if (jambPanel) jambPanel.classList.add('door-hidden');
      depthExact.forEach(function (row) { row.classList.add('door-hidden'); });
      if (measureOptionId) {
        var introSide = optionsContainer.querySelector('.door-measurement-panel-intro[data-option-id="' + measureOptionId + '"]');
        if (introSide) {
          introSide.textContent = sideOnlyMode
            ? 'Add your exact sidelight measurements'
            : 'Add your exact transom measurements';
          introSide.classList.remove('door-hidden');
          introSide.setAttribute('aria-hidden', 'false');
        }
      }
      syncMeasurementPromptAndEyebrow(optionsContainer, schema);
      return;
    }

    if (threeJamb) {
      if (exactPanel) exactPanel.classList.toggle('door-hidden', m.indexOf('exact') === -1);
      if (roughPanel) roughPanel.classList.toggle('door-hidden', m.indexOf('rough') === -1);
      if (jambPanel) jambPanel.classList.toggle('door-hidden', m.indexOf('jamb') === -1);
      if (finishedPanel) finishedPanel.classList.add('door-hidden');
      depthExact.forEach(function (row) {
        row.classList.toggle('door-hidden', m.indexOf('exact') === -1);
      });
    } else {
      var exactMode2 = m.indexOf('exact') !== -1;
      var finishedMode2 = !exactMode2;
      if (exactPanel) exactPanel.classList.toggle('door-hidden', !exactMode2);
      if (finishedPanel) finishedPanel.classList.toggle('door-hidden', !finishedMode2);
      if (roughPanel) roughPanel.classList.add('door-hidden');
      if (jambPanel) jambPanel.classList.add('door-hidden');
      depthExact.forEach(function (row) {
        row.classList.add('door-hidden');
      });
    }

    var roughJambSideInner = measureWrap.querySelector('.door-rough-panel-jamb-sidelight');
    var roughDefaultInner = measureWrap.querySelector('.door-rough-panel-default');
    if (roughJambSideInner && roughDefaultInner) {
      if (threeJamb) {
        var jambRoughStack = hasActiveSidelightSelection(schema, optionsContainer) || hasActiveTransomSelection(schema, optionsContainer);
        var roughModeOn = m.indexOf('rough') !== -1;
        roughJambSideInner.classList.toggle('door-hidden', !jambRoughStack || !roughModeOn);
        roughDefaultInner.classList.toggle('door-hidden', jambRoughStack || !roughModeOn);
      } else {
        roughJambSideInner.classList.add('door-hidden');
        roughDefaultInner.classList.remove('door-hidden');
      }
    }

    var addon = measureWrap.querySelector('.door-jamb-sidelight-addon');
    if (addon) {
      var showJambSideAddon = threeJamb && hasActiveSidelightSelection(schema, optionsContainer) && m.indexOf('exact') !== -1;
      addon.classList.toggle('door-hidden', !showJambSideAddon);
    }
    var transomAddon = measureWrap.querySelector('.door-jamb-transom-addon');
    if (transomAddon) {
      var showJambTransomAddon = threeJamb && hasActiveTransomSelection(schema, optionsContainer) && m.indexOf('exact') !== -1;
      transomAddon.classList.toggle('door-hidden', !showJambTransomAddon);
    }

    syncMeasurementPromptAndEyebrow(optionsContainer, schema);
  }

  function findPreHungStyleOption(schema) {
    if (!Array.isArray(schema)) return null;
    for (var i = 0; i < schema.length; i++) {
      var opt = schema[i];
      if (!opt || !opt.id) continue;
      var t = (opt.type || '').toLowerCase();
      if (t !== 'radio' && t !== 'select') continue;
      var id = normalizeOptionIdKey(opt.id);
      var lab = String(opt.label || '').toLowerCase();
      if (id.indexOf('pre_hung') !== -1 || id.indexOf('prehung') !== -1) return opt;
      if (lab.indexOf('pre-hung') !== -1) return opt;
      if (lab.indexOf('pre') !== -1 && lab.indexOf('hung') !== -1) return opt;
    }
    return null;
  }

  function isDoorSetupChoiceValue(v) {
    var n = String(v == null ? '' : v).toLowerCase().replace(/-/g, '_');
    return n === 'slab_only'
      || n === 'pre_hung_on_jamb'
      || n === 'pre_hung_on_brick_molding';
  }

  function getPreHungDoorSetupChoices(schema) {
    var preOpt = findPreHungStyleOption(schema);
    if (!preOpt || !Array.isArray(preOpt.options)) return [];
    var out = [];
    preOpt.options.forEach(function (choice) {
      if (!choice) return;
      if (!isDoorSetupChoiceValue(choice.value)) return;
      var cloned = Object.assign({}, choice);
      cloned._renderOptionId = preOpt.id;
      cloned._renderOptionLabel = preOpt.label || preOpt.id;
      out.push(cloned);
    });
    return out;
  }
  function optionIsPanelUnitDesign(opt) {
    if (!opt) return false;
    var id = normalizeOptionIdKey(opt.id);
    if (id === 'panel_unit_design' || id === 'porch_panel_project' || id === 'porch_panel_order' || id === 'porch_panel_order_type') return true;
    var lab = String(opt.label || '').toLowerCase();
    return lab.indexOf('panel unit design') !== -1 || lab.indexOf('order your porch panels') !== -1;
  }

  function panelUnitDesignSectionExists(root) {
    if (!root) return false;
    if (root.querySelector('[data-static-panel-unit-design]')) return true;
    return !!root.querySelector('.door-option-wrap[data-option-id="panel_unit_design"], .door-option-wrap[data-option-id="porch_panel_project"]');
  }

  function schemaIncludesPanelUnitDesignOption(schema) {
    return Array.isArray(schema) && schema.some(function (opt) { return optionIsPanelUnitDesign(opt); });
  }

  function productIsPorchPanelProduct() {
    var root = document.getElementById('door-configurator');
    if (!root) return false;
    var type = String(root.getAttribute('data-product-type') || '').toLowerCase();
    if (type.indexOf('porch') !== -1) return true;
    try {
      var tags = JSON.parse(root.getAttribute('data-product-tags') || '[]');
      return Array.isArray(tags) && tags.some(function (tag) {
        var normalized = String(tag || '').toLowerCase().replace(/[\s_]+/g, '-');
        return normalized === 'porch-panel' || normalized === 'porch-panels';
      });
    } catch (eTags) {
      return false;
    }
  }

  function isPanelUnitDesignSectionEl(el) {
    if (!el || !el.closest) return false;
    return !!el.closest('[data-static-panel-unit-design], .door-panel-unit-design-static, .door-option-wrap[data-option-id="panel_unit_design"], .door-option-wrap[data-option-id="porch_panel_project"]');
  }

  function enhancePanelUnitMeasurementSelects(scopeEl) {
    if (!scopeEl || !scopeEl.querySelectorAll) return;
    all('select.door-measure-dimension-dd, select.door-input-select', scopeEl).forEach(function (sel) {
      enhanceDoorSelectWithDivDropdown(sel);
    });
  }

  function panelUnitOrderChoiceLabel(radioEl) {
    if (!radioEl) return '';
    var card = radioEl.closest && radioEl.closest('.common-check-option');
    if (!card) return '';
    var labelEl = card.querySelector('.common-check-option-label');
    return labelEl ? String(labelEl.textContent || '').trim() : '';
  }

  function isPanelUnitIndividualOrderChoice(val, label) {
    var v = normPreHungSelectionValue(val);
    var l = String(label || '').toLowerCase();
    if (v.indexOf('individual') !== -1 || v.indexOf('fixed_qty') !== -1 || v.indexOf('order_fixed') !== -1) return true;
    if (l.indexOf('individual panel') !== -1 || l.indexOf('order individual') !== -1 || l.indexOf('order fixed') !== -1) return true;
    return false;
  }

  function panelUnitIndividualOrderSelected(root, optionId) {
    if (!root) return false;
    var radios = all('input[type="radio"][data-option-id="' + optionId + '"]', root);
    if (radios.length) {
      var checked = radios.filter(function (el) { return el.checked; })[0];
      if (!checked) return false;
      if (isPanelUnitIndividualOrderChoice(checked.value, panelUnitOrderChoiceLabel(checked))) return true;
      if (radios.length >= 2 && radios.indexOf(checked) === 1) return true;
      return false;
    }
    var sel = root.querySelector('select[data-option-id="' + optionId + '"]');
    if (!sel || !sel.value) return false;
    var selectedOption = sel.options[sel.selectedIndex];
    var selectedLabel = selectedOption ? selectedOption.textContent : '';
    if (isPanelUnitIndividualOrderChoice(sel.value, selectedLabel)) return true;
    if (sel.options.length >= 2 && sel.selectedIndex === 1) return true;
    return false;
  }

  function isPanelUnitEnclosureOrderChoice(val, label) {
    if (isPanelUnitIndividualOrderChoice(val, label)) return false;
    var v = normPreHungSelectionValue(val);
    var l = String(label || '').toLowerCase();
    if (v.indexOf('enclosure') !== -1 || v.indexOf('design_porch') !== -1 || v.indexOf('porch_enclosure') !== -1) return true;
    if (l.indexOf('design a porch') !== -1 || l.indexOf('enclosure system') !== -1) return true;
    return false;
  }

  function panelUnitEnclosureOrderSelected(root, optionId) {
    if (!root) return false;
    var radios = all('input[type="radio"][data-option-id="' + optionId + '"]', root);
    if (radios.length) {
      var checked = radios.filter(function (el) { return el.checked; })[0];
      if (!checked) return false;
      if (isPanelUnitEnclosureOrderChoice(checked.value, panelUnitOrderChoiceLabel(checked))) return true;
      if (radios.length >= 2 && radios.indexOf(checked) === 0) return true;
      return false;
    }
    var sel = root.querySelector('select[data-option-id="' + optionId + '"]');
    if (!sel || !sel.value) return false;
    var selectedOption = sel.options[sel.selectedIndex];
    var selectedLabel = selectedOption ? selectedOption.textContent : '';
    if (isPanelUnitEnclosureOrderChoice(sel.value, selectedLabel)) return true;
    if (sel.options.length >= 2 && sel.selectedIndex === 0) return true;
    return false;
  }

  function porchOpeningDimensionSelect(openingEl, key) {
    if (!openingEl || !key) return null;
    return openingEl.querySelector('select[data-porch-dimension="' + key + '"]');
  }

  var PORCH_OPENING_TRIM_STOP_ALLOWANCE = 56.25;
  var PORCH_OPENING_FRACTION_DISPLAY = [
    { value: 0, label: '00' },
    { value: 0.0625, label: '1/16' },
    { value: 0.125, label: '1/8' },
    { value: 0.1875, label: '3/16' },
    { value: 0.25, label: '1/4' },
    { value: 0.3125, label: '5/16' },
    { value: 0.375, label: '3/8' },
    { value: 0.4375, label: '7/16' },
    { value: 0.5, label: '1/2' },
    { value: 0.5625, label: '9/16' },
    { value: 0.625, label: '5/8' },
    { value: 0.6875, label: '11/16' },
    { value: 0.75, label: '3/4' },
    { value: 0.8125, label: '13/16' },
    { value: 0.875, label: '7/8' },
    { value: 0.9375, label: '15/16' }
  ];

  function porchOpeningDimensionInches(openingEl, key) {
    var intSel = porchOpeningDimensionSelect(openingEl, key + '-int');
    var fracSel = porchOpeningDimensionSelect(openingEl, key + '-frac');
    if (!intSel) return 0;
    return (parseInt(intSel.value, 10) || 0) + (parseFloat(fracSel && fracSel.value) || 0);
  }

  function formatPorchInchesFromNumber(inches) {
    if (isNaN(inches)) return '';
    var rounded = Math.round(inches * 16) / 16;
    if (rounded < 0) rounded = 0;
    var intPart = Math.floor(rounded + 1e-9);
    var fracPart = Math.round((rounded - intPart) * 1000) / 1000;
    var fracLabel = '';
    var bestDiff = 1;
    PORCH_OPENING_FRACTION_DISPLAY.forEach(function (entry) {
      var diff = Math.abs(entry.value - fracPart);
      if (diff < bestDiff) {
        bestDiff = diff;
        fracLabel = entry.label;
      }
    });
    if (bestDiff > 1e-4) fracLabel = '';
    if (!fracLabel || fracLabel === '0' || fracLabel === '00') return String(intPart);
    return intPart + ' ' + fracLabel;
  }

  function porchOpeningPanelsCount(openingEl) {
    if (!openingEl) return 1;
    var qtyInput = openingEl.querySelector('[data-porch-dimension="panels"]');
    return Math.max(1, parseInt(qtyInput && qtyInput.value, 10) || 1);
  }

  var PORCH_TRIM_INFO_COPY = {
    sill: {
      title: 'Sill',
      body: 'A Sill is a solid piece of milled wood that sits beneath your Porch Enclosure Panels, tapered to shed water away from your panels and serving as a flat base for installation.',
      imageAttr: 'data-porch-trim-info-image-sill'
    },
    stops: {
      title: 'Stops',
      body: 'Stops are trim pieces that extend the length and height of your porch panels within each porch opening, securing the panels in place on the top, bottom and sides of the opening.',
      imageAttr: 'data-porch-trim-info-image-stops'
    },
    astragal: {
      title: 'Astragal',
      body: 'An Astragal is a two-piece trim unit that connects two adjacent porch panels and fills the space between them.',
      imageAttr: 'data-porch-trim-info-image-astragal'
    }
  };

  function porchTrimInfoModalImageUrl(kind) {
    var configRoot = document.getElementById('door-configurator');
    if (!configRoot) return '';
    var copy = PORCH_TRIM_INFO_COPY[kind];
    if (!copy || !copy.imageAttr) return '';
    return String(configRoot.getAttribute(copy.imageAttr) || '').trim();
  }

  function porchTrimInfoModalSyncDiagramImages(modal, root) {
    if (!modal || !root) return;
    all('.door-porch-trim-info-modal__screen', modal).forEach(function (screen) {
      var kind = screen.getAttribute('data-porch-trim-info');
      var img = screen.querySelector('.door-porch-trim-info-modal__image');
      if (!img || !kind) return;
      var configured = porchTrimInfoModalImageUrl(kind);
      if (configured) img.setAttribute('src', configured);
    });
  }

  function porchTrimInfoModalAttachToBody(modal) {
    if (!modal || !document.body) return;
    if (modal.parentNode === document.body) return;
    document.body.appendChild(modal);
  }

  function porchTrimInfoModalElement(root) {
    var modal = document.querySelector('.door-porch-trim-info-modal');
    if (modal) return modal;
    if (!root) root = document.getElementById('door-configurator');
    if (!root) return null;
    return root.querySelector('.door-porch-trim-info-modal');
  }

  function ensurePorchTrimInfoModal(root) {
    if (!root) root = document.getElementById('door-configurator');
    var modal = porchTrimInfoModalElement(root);
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'door-porch-trim-info-modal door-hidden';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-hidden', 'true');
      modal.innerHTML =
        '<div class="door-porch-trim-info-modal__backdrop" data-porch-info-close></div>' +
        '<div class="door-porch-trim-info-modal__panel">' +
        '<button type="button" class="door-porch-trim-info-modal__close" data-porch-info-close aria-label="Close">&times;</button>' +
        '<h3 class="door-porch-trim-info-modal__title p-medium fw-600 primaryFont"></h3>' +
        '<div class="door-porch-trim-info-modal__body p-small"></div>' +
        '</div>';
      (document.body || root).appendChild(modal);
    }
    porchTrimInfoModalAttachToBody(modal);
    if (!modal.getAttribute('data-porch-trim-info-bound')) {
      modal.setAttribute('data-porch-trim-info-bound', '1');
      modal.addEventListener('click', function (ev) {
        var target = ev.target;
        if (!target) return;
        var closer = target.closest ? target.closest('[data-porch-info-close]') : null;
        if (!closer && target.getAttribute && target.getAttribute('data-porch-info-close') != null) {
          closer = target;
        }
        if (closer && modal.contains(closer)) {
          porchOpeningCloseInfoModal(root);
        }
      });
      document.addEventListener('keydown', function (ev) {
        if (!modal || modal.classList.contains('door-hidden')) return;
        if (ev.key === 'Escape' || ev.key === 'Esc') porchOpeningCloseInfoModal(root);
      });
    }
    porchTrimInfoModalSyncDiagramImages(modal, root);
    return modal;
  }

  function porchOpeningCloseInfoModal(root) {
    var configRoot = root || document.getElementById('door-configurator');
    var modal = porchTrimInfoModalElement(configRoot);
    if (!modal) return;
    modal.classList.add('door-hidden');
    modal.setAttribute('aria-hidden', 'true');
    all('.door-porch-trim-info-modal__screen', modal).forEach(function (screen) {
      screen.classList.add('door-hidden');
    });
  }

  function porchOpeningOpenInfoModal(kind) {
    var configRoot = document.getElementById('door-configurator');
    if (!configRoot) return;
    var copy = PORCH_TRIM_INFO_COPY[kind];
    if (!copy) return;
    var modal = ensurePorchTrimInfoModal(configRoot);
    if (!modal) return;
    var activeScreen = modal.querySelector('.door-porch-trim-info-modal__screen[data-porch-trim-info="' + kind + '"]');
    if (activeScreen) {
      all('.door-porch-trim-info-modal__screen', modal).forEach(function (screen) {
        screen.classList.toggle('door-hidden', screen !== activeScreen);
      });
      var activeTitle = activeScreen.querySelector('.door-porch-trim-info-modal__title');
      if (activeTitle) modal.setAttribute('aria-labelledby', activeTitle.id || 'door-porch-trim-info-title');
    } else {
      var titleEl = modal.querySelector('.door-porch-trim-info-modal__title');
      var bodyEl = modal.querySelector('.door-porch-trim-info-modal__body');
      if (titleEl) titleEl.textContent = copy.title;
      if (bodyEl) bodyEl.textContent = copy.body;
    }
    modal.classList.remove('door-hidden');
    modal.setAttribute('aria-hidden', 'false');
    var closeBtn = modal.querySelector('.door-porch-trim-info-modal__close');
    if (closeBtn) closeBtn.focus();
  }

  function porchOpeningHideSillEditor(openingEl) {
    if (!openingEl) return;
    openingEl.removeAttribute('data-porch-sill-editor-open');
    var editor = openingEl.querySelector('.door-porch-opening-sill-editor');
    if (editor) editor.classList.add('door-hidden');
  }

  function porchOpeningShowSillEditor(openingEl) {
    if (!openingEl) return;
    var editor = openingEl.querySelector('.door-porch-opening-sill-editor');
    if (!editor) return;
    var depthSel = openingEl.querySelector('.door-porch-sill-depth-select');
    var fracSel = openingEl.querySelector('.door-porch-sill-frac-select');
    if (depthSel) openingEl.setAttribute('data-porch-sill-depth-saved', depthSel.value || '5');
    if (fracSel) openingEl.setAttribute('data-porch-sill-frac-saved', fracSel.value || '0');
    openingEl.setAttribute('data-porch-sill-editor-open', '1');
    editor.classList.remove('door-hidden');
    updatePorchOpeningDerivedUi(openingEl);
  }

  function bindPorchOpeningInfoControls(scopeEl) {
    if (!scopeEl) return;
    all('[data-porch-info]', scopeEl).forEach(function (btn) {
      if (btn.getAttribute('data-porch-info-bound')) return;
      btn.setAttribute('data-porch-info-bound', '1');
      btn.addEventListener('click', function (ev) {
        ev.preventDefault();
        porchOpeningOpenInfoModal(btn.getAttribute('data-porch-info'));
      });
    });
  }

  var PORCH_OPENING_DOOR_SWING_OPTIONS = [
    { value: 'out_right', label: 'Out Right' },
    { value: 'out_left', label: 'Out Left' },
    { value: 'in_right', label: 'In Right' },
    { value: 'in_left', label: 'In Left' },
    { value: 'barn_door', label: 'Barn Door' },
    { value: 'pocket_door', label: 'Pocket Door' }
  ];
  var PORCH_OPENING_DOOR_HINGE_OPTIONS = [
    { value: 'oil_rubbed_bronze', label: 'Oil-Rubbed Bronze' },
    { value: 'polished_brass', label: 'Polished Brass' },
    { value: 'unlacquered_brass', label: 'Unlacquered Brass' },
    { value: 'black', label: 'Black' },
    { value: 'satin_nickel', label: 'Satin Nickel' },
    { value: 'french_antique', label: 'French Antique' },
    { value: 'pewter', label: 'Pewter' }
  ];
  var PORCH_OPENING_DOOR_LOCKSET_OPTIONS = [
    { value: 'none', label: 'None', description: 'Your installer will drill for locksets.' },
    { value: 'mortise_lock_prep', label: 'Mortise lock prep', description: 'For premium mortise locksets.' }
  ];

  function porchOpeningDoorChoiceCards(groupEl) {
    if (!groupEl) return [];
    return all('.common-check-option', groupEl);
  }

  function porchOpeningDoorChoiceSelectedValue(groupEl) {
    if (!groupEl) return '';
    var selected = groupEl.querySelector('input:checked');
    return selected ? String(selected.value || '') : '';
  }

  function porchOpeningDoorChoiceSetSelected(groupEl, value) {
    if (!groupEl) return;
    var nextValue = value != null ? String(value) : '';
    porchOpeningDoorChoiceCards(groupEl).forEach(function (card) {
      var input = card.querySelector('input');
      var cardValue = card.getAttribute('data-choice-value') || (input && input.value) || '';
      var isSelected = nextValue && cardValue === nextValue;
      if (input) input.checked = isSelected;
      card.classList.toggle('common-check-option--selected', isSelected);
    });
  }

  function bindPorchOpeningDoorChoiceGroup(groupEl) {
    if (!groupEl || groupEl.getAttribute('data-porch-door-choice-bound')) return;
    groupEl.setAttribute('data-porch-door-choice-bound', '1');
    porchOpeningDoorChoiceCards(groupEl).forEach(function (card) {
      var input = card.querySelector('input');
      if (!input) return;
      input.addEventListener('change', function () {
        porchOpeningDoorChoiceSetSelected(groupEl, input.value);
        updateEstimatedPrice();
      });
    });
    porchOpeningDoorChoiceSetSelected(groupEl, porchOpeningDoorChoiceSelectedValue(groupEl));
  }

  function porchOpeningDoorChoiceGroup(fieldName, choices, options) {
    options = options || {};
    var group = document.createElement('div');
    group.className = 'common-check-options door-porch-opening-door-choice-group' + (options.gridClass ? ' ' + options.gridClass : '');
    choices.forEach(function (choice, idx) {
      var card = document.createElement('label');
      card.className = 'common-check-option door-porch-opening-door-choice';
      card.setAttribute('data-choice-value', choice.value);
      var input = document.createElement('input');
      input.type = 'radio';
      input.name = fieldName;
      input.value = choice.value;
      input.style.position = 'absolute';
      input.style.opacity = '0';
      input.style.pointerEvents = 'none';
      if (options.defaultValue != null ? choice.value === options.defaultValue : idx === 0) input.checked = true;
      card.appendChild(input);
      if (options.imageClass) {
        var image = document.createElement('div');
        image.className = options.imageClass;
        card.appendChild(image);
      }
      var textWrap = document.createElement('div');
      textWrap.className = 'common-check-option-text';
      var text = document.createElement('span');
      text.className = 'common-check-option-label';
      text.textContent = choice.label;
      textWrap.appendChild(text);
      if (choice.description) {
        var desc = document.createElement('span');
        desc.className = 'common-check-option-desc';
        desc.textContent = choice.description;
        textWrap.appendChild(desc);
      }
      card.appendChild(textWrap);
      group.appendChild(card);
    });
    bindPorchOpeningDoorChoiceGroup(group);
    return group;
  }

  function createPorchOpeningDoorConfigBlock(doorNumber) {
    var block = document.createElement('div');
    block.className = 'door-porch-opening-door-config door-hidden';
    block.setAttribute('data-porch-door-config', String(doorNumber));
    var swingSection = document.createElement('div');
    swingSection.className = 'door-porch-opening-door-config-section door-porch-opening-door-swing-section';
    var swingTitle = document.createElement('p');
    swingTitle.className = 'door-porch-opening-door-config-title fw-600';
    swingTitle.textContent = 'Door #' + doorNumber + ' Swing Direction';
    swingSection.appendChild(swingTitle);
    swingSection.appendChild(porchOpeningDoorChoiceGroup(
      'attributes[Door ' + doorNumber + ' Swing Direction]',
      PORCH_OPENING_DOOR_SWING_OPTIONS,
      { gridClass: 'grid-4', imageClass: 'common-check-option-image door-porch-opening-door-swing-image' }
    ));
    block.appendChild(swingSection);
    var hingeSection = document.createElement('div');
    hingeSection.className = 'door-porch-opening-door-config-section door-porch-opening-door-hinge-section';
    var hingeTitle = document.createElement('p');
    hingeTitle.className = 'door-porch-opening-door-config-title fw-600';
    hingeTitle.textContent = 'Door #' + doorNumber + ' Hinge Finish';
    hingeSection.appendChild(hingeTitle);
    hingeSection.appendChild(porchOpeningDoorChoiceGroup(
      'attributes[Door ' + doorNumber + ' Hinge Finish]',
      PORCH_OPENING_DOOR_HINGE_OPTIONS,
      { gridClass: 'grid-4', imageClass: 'common-check-option-image door-porch-opening-door-hinge-swatch', defaultValue: 'oil_rubbed_bronze' }
    ));
    block.appendChild(hingeSection);
    var locksetSection = document.createElement('div');
    locksetSection.className = 'door-porch-opening-door-config-section door-porch-opening-door-lockset-section';
    var locksetHeader = document.createElement('div');
    locksetHeader.className = 'door-porch-opening-door-config-header';
    var locksetTitle = document.createElement('p');
    locksetTitle.className = 'door-porch-opening-door-config-title fw-600';
    locksetTitle.textContent = 'Door #' + doorNumber + ' Lockset Preparation';
    locksetHeader.appendChild(locksetTitle);
    var locksetBtn = document.createElement('button');
    locksetBtn.type = 'button';
    locksetBtn.className = 'wood-species-open-btn common-btn btn-secondary btn-small door-lockset-prep-btn';
    locksetBtn.setAttribute('data-lockset-prep-open', '');
    locksetBtn.setAttribute('aria-haspopup', 'dialog');
    locksetBtn.textContent = 'About Lockset Prep';
    locksetBtn.addEventListener('click', function (ev) {
      ev.preventDefault();
      if (typeof openLocksetPrepDrawer === 'function') openLocksetPrepDrawer();
    });
    locksetHeader.appendChild(locksetBtn);
    locksetSection.appendChild(locksetHeader);
    locksetSection.appendChild(porchOpeningDoorChoiceGroup(
      'attributes[Door ' + doorNumber + ' Lockset Preparation]',
      PORCH_OPENING_DOOR_LOCKSET_OPTIONS,
      { gridClass: 'grid-2', defaultValue: 'none' }
    ));
    block.appendChild(locksetSection);
    return block;
  }

  function porchOpeningDoorConfigList(openingEl) {
    return openingEl ? openingEl.querySelector('.door-porch-opening-door-config-list') : null;
  }

  function porchOpeningDoorConfigBlock(openingEl, doorNumber) {
    var listEl = porchOpeningDoorConfigList(openingEl);
    if (!listEl) return null;
    return listEl.querySelector('.door-porch-opening-door-config[data-porch-door-config="' + doorNumber + '"]');
  }

  function porchOpeningDefaultHingeFinish(openingEl) {
    var firstBlock = porchOpeningDoorConfigBlock(openingEl, 1);
    if (!firstBlock) return 'oil_rubbed_bronze';
    var hingeGroup = firstBlock.querySelector('.door-porch-opening-door-hinge-section .door-porch-opening-door-choice-group');
    var selected = porchOpeningDoorChoiceSelectedValue(hingeGroup);
    return selected || 'oil_rubbed_bronze';
  }

  function syncPorchOpeningDoorConfigVisibility(openingEl) {
    if (!openingEl) return;
    var panels = all('.door-porch-opening-preview-panel', openingEl);
    panels.forEach(function (panel, idx) {
      var doorNumber = idx + 1;
      var input = panel.querySelector('.door-porch-opening-door-input');
      var label = panel.querySelector('.common-check-option-label');
      if (label) label.textContent = 'Door #' + doorNumber;
      if (input) input.value = 'Door #' + doorNumber;
      var configBlock = porchOpeningDoorConfigBlock(openingEl, doorNumber);
      if (!configBlock) return;
      var isDoor = !!(input && input.checked);
      configBlock.classList.toggle('door-hidden', !isDoor);
      if (isDoor && doorNumber > 1) {
        var hingeGroup = configBlock.querySelector('.door-porch-opening-door-hinge-section .door-porch-opening-door-choice-group');
        if (hingeGroup && !porchOpeningDoorChoiceSelectedValue(hingeGroup)) {
          porchOpeningDoorChoiceSetSelected(hingeGroup, porchOpeningDefaultHingeFinish(openingEl));
        }
      }
    });
  }

  function syncPorchOpeningDoorConfigs(openingEl) {
    if (!openingEl) return;
    var listEl = porchOpeningDoorConfigList(openingEl);
    if (!listEl) return;
    var panelCount = porchOpeningPanelsCount(openingEl);
    var existingBlocks = all('.door-porch-opening-door-config', listEl);
    for (var i = existingBlocks.length; i < panelCount; i++) {
      listEl.appendChild(createPorchOpeningDoorConfigBlock(i + 1));
    }
    for (var j = existingBlocks.length - 1; j >= panelCount; j--) {
      if (existingBlocks[j]) existingBlocks[j].remove();
    }
    syncPorchOpeningDoorConfigVisibility(openingEl);
  }

  function porchOpeningPreviewPanelImageUrl() {
    var root = document.getElementById('door-configurator');
    if (root) {
      var configured = String(root.getAttribute('data-porch-opening-preview-image') || '').trim();
      if (configured) return configured;
    }
    var rowTpl = document.getElementById('door-static-porch-opening-row');
    if (rowTpl && rowTpl.content) {
      var tplImg = rowTpl.content.querySelector('.door-porch-opening-preview-panel-image');
      if (tplImg && tplImg.getAttribute('src')) return tplImg.getAttribute('src');
    }
    return 'https://cdn.shopify.com/s/files/1/0784/9059/9679/files/image_109.webp?v=1778579784';
  }

  function appendPorchOpeningPreviewPanel(panelsWrap, options) {
    if (!panelsWrap) return null;
    options = options || {};
    var panel = document.createElement('div');
    panel.className = 'door-porch-opening-preview-panel';
    var img = document.createElement('img');
    img.className = 'door-porch-opening-preview-panel-image';
    img.src = porchOpeningPreviewPanelImageUrl();
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.loading = 'lazy';
    panel.appendChild(img);
    var label = document.createElement('label');
    label.className = 'common-check-option door-porch-opening-door-label';
    var input = document.createElement('input');
    input.type = 'checkbox';
    input.className = 'door-porch-opening-door-input custom-checkbox';
    input.name = 'attributes[Convert to Door][]';
    input.value = 'Door #' + (options.index != null ? options.index + 1 : panelsWrap.querySelectorAll('.door-porch-opening-preview-panel').length + 1);
    if (options.checked) input.checked = true;
    var textWrap = document.createElement('div');
    textWrap.className = 'common-check-option-text';
    var text = document.createElement('span');
    text.className = 'common-check-option-label';
    text.textContent = 'Door #' + (options.index != null ? options.index + 1 : panelsWrap.querySelectorAll('.door-porch-opening-preview-panel').length + 1);
    textWrap.appendChild(text);
    label.appendChild(input);
    label.appendChild(textWrap);
    panel.appendChild(label);
    panelsWrap.appendChild(panel);
    return panel;
  }

  function updatePorchOpeningPanelLayout(openingEl) {
    if (!openingEl) return;
    var panelCount = porchOpeningPanelsCount(openingEl);
    var panelsWrap = openingEl.querySelector('.door-porch-opening-preview-panels');
    if (!panelsWrap) return;
    var existingPanels = all('.door-porch-opening-preview-panel', panelsWrap);
    if (existingPanels.length === panelCount && existingPanels.every(function (panel) {
      return panel.querySelector('.door-porch-opening-door-input');
    })) return;
    var doorStates = existingPanels.map(function (panel) {
      var input = panel.querySelector('.door-porch-opening-door-input');
      return !!(input && input.checked);
    });
    panelsWrap.innerHTML = '';
    for (var i = 0; i < panelCount; i++) {
      appendPorchOpeningPreviewPanel(panelsWrap, { checked: doorStates[i], index: i });
    }
    syncPorchOpeningDoorConfigs(openingEl);
  }

  function syncPorchOpeningTrimSystemVisibility(openingEl) {
    if (!openingEl) return;
    var trimInput = openingEl.querySelector('.door-porch-opening-trim-input');
    var trimOn = !!(trimInput && trimInput.checked);
    var trimDetails = openingEl.querySelector('.door-porch-opening-trim-system-details');
    if (trimDetails) trimDetails.classList.toggle('door-hidden', !trimOn);
    if (!trimOn) porchOpeningHideSillEditor(openingEl);
  }

  function porchOpeningDimensionLabel(selectEl) {
    if (!selectEl) return '';
    var opt = selectEl.options[selectEl.selectedIndex];
    return opt ? String(opt.textContent || '').trim() : '';
  }

  function porchOpeningWidthLabel(openingEl) {
    var intSel = porchOpeningDimensionSelect(openingEl, 'width-int');
    var fracSel = porchOpeningDimensionSelect(openingEl, 'width-frac');
    var intLabel = porchOpeningDimensionLabel(intSel);
    var fracLabel = porchOpeningDimensionLabel(fracSel);
    if (!intLabel) return '';
    if (!fracLabel || fracLabel === '0') return intLabel;
    return intLabel + ' ' + fracLabel;
  }

  function porchOpeningHeightLabel(openingEl) {
    var intSel = porchOpeningDimensionSelect(openingEl, 'height-int');
    var fracSel = porchOpeningDimensionSelect(openingEl, 'height-frac');
    var intLabel = porchOpeningDimensionLabel(intSel);
    var fracLabel = porchOpeningDimensionLabel(fracSel);
    if (!intLabel) return '';
    if (!fracLabel || fracLabel === '0') return intLabel;
    return intLabel + ' ' + fracLabel;
  }

  function porchOpeningSillDepthLabel(openingEl) {
    if (!openingEl) return '5';
    var depthSel = openingEl.querySelector('.door-porch-sill-depth-select');
    var fracSel = openingEl.querySelector('.door-porch-sill-frac-select');
    var depthLabel = porchOpeningDimensionLabel(depthSel) || '5';
    var fracLabel = porchOpeningDimensionLabel(fracSel);
    if (!fracLabel || fracLabel === '0' || fracLabel === '00') return depthLabel;
    return depthLabel + ' ' + fracLabel;
  }

  function updatePorchOpeningDerivedUi(openingEl) {
    if (!openingEl) return;
    var widthLabel = porchOpeningWidthLabel(openingEl);
    var heightLabel = porchOpeningHeightLabel(openingEl);
    var heightInches = porchOpeningDimensionInches(openingEl, 'height');
    var trimInput = openingEl.querySelector('.door-porch-opening-trim-input');
    var trimOn = !!(trimInput && trimInput.checked);
    syncPorchOpeningTrimSystemVisibility(openingEl);
    var depthSel = openingEl.querySelector('.door-porch-sill-depth-select');
    if (depthSel && !openingEl.getAttribute('data-porch-sill-depth-custom')) {
      depthSel.value = '5';
    }
    var sillSizeEl = openingEl.querySelector('.door-porch-opening-sill-size');
    if (sillSizeEl) sillSizeEl.textContent = porchOpeningSillDepthLabel(openingEl) + '" x ' + widthLabel + '"';
    var sillWidthLabel = openingEl.querySelector('.door-porch-opening-sill-width-label');
    if (sillWidthLabel) sillWidthLabel.textContent = widthLabel + '"';
    var stopsTop = openingEl.querySelector('.door-porch-opening-stops-top-bottom');
    var stopsSide = openingEl.querySelector('.door-porch-opening-stops-left-right');
    if (trimOn) {
      var topBottomLabel = formatPorchInchesFromNumber(Math.max(0, heightInches - PORCH_OPENING_TRIM_STOP_ALLOWANCE));
      if (stopsTop) stopsTop.textContent = '(4) ' + topBottomLabel + '" top and bottom';
      if (stopsSide) {
        stopsSide.textContent = '(4) ' + heightLabel + '" left and right';
        stopsSide.classList.remove('door-hidden');
      }
    } else {
      if (stopsTop) stopsTop.textContent = '(4) ' + widthLabel + '" top and bottom';
      if (stopsSide) {
        stopsSide.textContent = '(4) ' + widthLabel + '" left and right';
        stopsSide.classList.remove('door-hidden');
      }
    }
    var panelCount = porchOpeningPanelsCount(openingEl);
    var astragalsWrap = openingEl.querySelector('.door-porch-opening-astragals');
    var astragalsCopy = openingEl.querySelector('.door-porch-opening-astragals-copy');
    var astragalsApplicable = panelCount >= 1;
    if (astragalsWrap) astragalsWrap.classList.toggle('door-hidden', !trimOn || !astragalsApplicable);
    if (astragalsCopy) {
      if (astragalsApplicable && heightLabel) {
        astragalsCopy.textContent = '(' + panelCount + ') ' + heightLabel + '"';
      } else {
        astragalsCopy.textContent = '';
      }
    }
    updatePorchOpeningPanelLayout(openingEl);
    syncPorchOpeningDoorConfigs(openingEl);
    if (openingEl.getAttribute('data-porch-sill-editor-open') === '1') {
      var sillEditor = openingEl.querySelector('.door-porch-opening-sill-editor');
      if (sillEditor) sillEditor.classList.remove('door-hidden');
    }
  }

  function bindPorchOpeningRow(openingEl) {
    if (!openingEl || openingEl.getAttribute('data-porch-opening-bound')) return;
    openingEl.setAttribute('data-porch-opening-bound', '1');
    var depthSel = openingEl.querySelector('.door-porch-sill-depth-select');
    var fracSel = openingEl.querySelector('.door-porch-sill-frac-select');
    var saveBtn = openingEl.querySelector('.door-porch-opening-sill-save-btn');
    var cancelBtn = openingEl.querySelector('.door-porch-opening-sill-cancel-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', function (ev) {
        ev.preventDefault();
        openingEl.setAttribute('data-porch-sill-depth-custom', '1');
        porchOpeningHideSillEditor(openingEl);
        updatePorchOpeningDerivedUi(openingEl);
        updateEstimatedPrice();
      });
    }
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function (ev) {
        ev.preventDefault();
        if (depthSel) depthSel.value = openingEl.getAttribute('data-porch-sill-depth-saved') || depthSel.value;
        if (fracSel) fracSel.value = openingEl.getAttribute('data-porch-sill-frac-saved') || fracSel.value;
        porchOpeningHideSillEditor(openingEl);
        updatePorchOpeningDerivedUi(openingEl);
      });
    }
    bindPorchOpeningInfoControls(openingEl);
    if (!openingEl.getAttribute('data-porch-opening-delegate-bound')) {
      openingEl.setAttribute('data-porch-opening-delegate-bound', '1');
      openingEl.addEventListener('change', function (ev) {
        var target = ev.target;
        if (!target || !openingEl.contains(target)) return;
        if (target.classList && target.classList.contains('door-porch-opening-trim-input')) {
          openingEl.removeAttribute('data-porch-sill-depth-custom');
        }
        if (target.classList && target.classList.contains('door-porch-opening-door-input')) {
          syncPorchOpeningDoorConfigVisibility(openingEl);
        }
        updatePorchOpeningDerivedUi(openingEl);
        updateEstimatedPrice();
      });
      openingEl.addEventListener('input', function (ev) {
        var target = ev.target;
        if (!target || !openingEl.contains(target)) return;
        updatePorchOpeningDerivedUi(openingEl);
        updateEstimatedPrice();
      });
    }
    updatePorchOpeningDerivedUi(openingEl);
    bindPanelUnitQtyControls(openingEl);
    enhancePanelUnitMeasurementSelects(openingEl);
  }

  function createPorchOpeningRemoveButton() {
    var removeBtn = createPanelUnitSetRemoveButton();
    removeBtn.setAttribute('aria-label', 'Remove opening');
    return removeBtn;
  }

  function syncPorchOpeningDom(listEl) {
    if (!listEl) return;
    var entries = all('.door-porch-opening-entry', listEl);
    entries.forEach(function (entry, idx) {
      var title = entry.querySelector('.door-porch-opening-entry-title');
      if (title) title.textContent = (idx === 0 ? 'Porch Opening #' : 'Panel Opening #') + (idx + 1);
      var trimInput = entry.querySelector('.door-porch-opening-trim-input');
      var trimHelp = entry.querySelector('.door-porch-opening-trim-help');
      var trimLabel = entry.querySelector('.door-porch-opening-trim-copy .door-row-label');
      if (trimInput) {
        var trimId = 'door-porch-opening-trim-input-' + (idx + 1);
        trimInput.id = trimId;
        trimInput.setAttribute('name', 'attributes[Add Trim System][]');
        trimInput.setAttribute('aria-describedby', trimId + '-help');
        if (trimLabel) trimLabel.setAttribute('for', trimId);
        if (trimHelp) trimHelp.id = trimId + '-help';
      }
      var header = entry.querySelector('.door-porch-opening-entry-header');
      var removeBtn = entry.querySelector('.door-panel-unit-size-remove-btn');
      var showRemove = entries.length > 1;
      if (!showRemove) {
        if (removeBtn) removeBtn.remove();
        return;
      }
      if (!removeBtn && header) header.appendChild(createPorchOpeningRemoveButton());
    });
    bindPorchOpeningRemoveControls(listEl);
  }

  function bindPorchOpeningRemoveControls(listEl) {
    if (!listEl) return;
    all('.door-panel-unit-size-remove-btn', listEl).forEach(function (btn) {
      if (btn.getAttribute('data-porch-opening-remove-bound')) return;
      btn.setAttribute('data-porch-opening-remove-bound', '1');
      btn.addEventListener('click', function (ev) {
        ev.preventDefault();
        var entry = btn.closest('.door-porch-opening-entry');
        if (!entry || !listEl) return;
        if (all('.door-porch-opening-entry', listEl).length <= 1) return;
        entry.remove();
        syncPorchOpeningDom(listEl);
        updateEstimatedPrice();
      });
    });
  }

  function appendPorchOpeningRow(listEl) {
    if (!listEl) return null;
    var rowTpl = document.getElementById('door-static-porch-opening-row');
    if (!rowTpl || !rowTpl.content) return null;
    var rowClone = rowTpl.content.cloneNode(true);
    var row = rowClone.firstElementChild;
    if (!row) return null;
    listEl.appendChild(row);
    var existingEntries = all('.door-porch-opening-entry', listEl);
    if (existingEntries.length > 1) {
      var hasTrim = existingEntries.some(function (entry) {
        if (entry === row) return false;
        var trimInput = entry.querySelector('.door-porch-opening-trim-input');
        return !!(trimInput && trimInput.checked);
      });
      var rowTrim = row.querySelector('.door-porch-opening-trim-input');
      if (rowTrim) rowTrim.checked = hasTrim;
    }
    syncPorchOpeningDom(listEl);
    bindPorchOpeningRow(row);
    enhancePanelUnitMeasurementSelects(row);
    return row;
  }

  function bindPanelUnitEnclosureMeasurements(sectionEl, measurementsWrap) {
    if (!sectionEl || !measurementsWrap || measurementsWrap.getAttribute('data-panel-unit-enclosure-bound')) return;
    measurementsWrap.setAttribute('data-panel-unit-enclosure-bound', '1');
    var listEl = measurementsWrap.querySelector('.door-porch-opening-list');
    if (listEl && !listEl.querySelector('.door-porch-opening-entry')) {
      appendPorchOpeningRow(listEl);
    } else if (listEl) {
      syncPorchOpeningDom(listEl);
      all('.door-porch-opening-entry', listEl).forEach(bindPorchOpeningRow);
    }
    if (!measurementsWrap.getAttribute('data-porch-sill-bound')) {
      measurementsWrap.setAttribute('data-porch-sill-bound', '1');
      measurementsWrap.addEventListener('click', function (ev) {
        var changeBtn = ev.target && ev.target.closest ? ev.target.closest('.door-porch-opening-sill-change-btn') : null;
        if (!changeBtn || !measurementsWrap.contains(changeBtn)) return;
        ev.preventDefault();
        var entry = changeBtn.closest('.door-porch-opening-entry');
        if (entry) porchOpeningShowSillEditor(entry);
      });
    }
    bindPorchOpeningInfoControls(measurementsWrap);
    var addBtn = measurementsWrap.querySelector('.door-panel-unit-add-opening-btn');
    if (addBtn) {
      addBtn.addEventListener('click', function (ev) {
        ev.preventDefault();
        appendPorchOpeningRow(listEl);
        updateEstimatedPrice();
      });
    }
    enhancePanelUnitMeasurementSelects(measurementsWrap);
  }

  function mountPanelUnitEnclosureMeasurements(sectionEl) {
    if (!sectionEl || sectionEl.querySelector('[data-panel-unit-enclosure-measurements]')) return;
    var tpl = document.getElementById('door-static-panel-unit-enclosure-measurements');
    if (!tpl || !tpl.content) return;
    var clone = tpl.content.cloneNode(true);
    var wrap = clone.firstElementChild;
    if (!wrap) return;
    sectionEl.appendChild(wrap);
    bindPanelUnitEnclosureMeasurements(sectionEl, wrap);
  }

  function syncPanelUnitEnclosureMeasurementsVisibility(sectionEl, optionId) {
    if (!sectionEl) return;
    var show = panelUnitEnclosureOrderSelected(sectionEl, optionId);
    if (show) mountPanelUnitEnclosureMeasurements(sectionEl);
    var wrap = sectionEl.querySelector('[data-panel-unit-enclosure-measurements]');
    if (!wrap) return;
    wrap.classList.toggle('door-hidden', !show);
  }

  function syncPanelUnitDesignMeasurements(sectionEl, optionId) {
    syncPanelUnitEnclosureMeasurementsVisibility(sectionEl, optionId);
    syncPanelUnitIndividualMeasurementsVisibility(sectionEl, optionId);
  }

  function bindPanelUnitQtyControls(scopeEl) {
    if (!scopeEl) return;
    all('.qty-btn.plus', scopeEl).forEach(function (button) {
      if (button.getAttribute('data-panel-unit-qty-bound')) return;
      button.setAttribute('data-panel-unit-qty-bound', '1');
      button.addEventListener('click', function () {
        var input = this.parentElement && this.parentElement.querySelector('.door-panel-unit-qty-input');
        if (!input) return;
        var currentVal = parseInt(input.value, 10) || 1;
        input.value = String(currentVal + 1);
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
    all('.qty-btn.minus', scopeEl).forEach(function (button) {
      if (button.getAttribute('data-panel-unit-qty-bound')) return;
      button.setAttribute('data-panel-unit-qty-bound', '1');
      button.addEventListener('click', function () {
        var input = this.parentElement && this.parentElement.querySelector('.door-panel-unit-qty-input');
        if (!input) return;
        var currentVal = parseInt(input.value, 10) || 1;
        var min = parseInt(input.getAttribute('min'), 10) || 1;
        if (currentVal > min) {
          input.value = String(currentVal - 1);
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    });
  }

  function createPanelUnitSetRemoveButton() {
    var removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'door-panel-unit-size-remove-btn common-btn btn-woodDust btn-small';
    removeBtn.setAttribute('aria-label', 'Remove panel set');
    removeBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
      '<path d="M10.6667 3.99967V3.46634C10.6667 2.7196 10.6667 2.34624 10.5213 2.06102C10.3935 1.81014 10.1895 1.60616 9.93865 1.47833C9.65344 1.33301 9.28007 1.33301 8.53333 1.33301H7.46667C6.71993 1.33301 6.34656 1.33301 6.06135 1.47833C5.81046 1.60616 5.60649 1.81014 5.47866 2.06102C5.33333 2.34624 5.33333 2.7196 5.33333 3.46634V3.99967M6.66667 7.66634V10.9997M9.33333 7.66634V10.9997M2 3.99967H14M12.6667 3.99967V11.4663C12.6667 12.5864 12.6667 13.1465 12.4487 13.5743C12.2569 13.9506 11.951 14.2566 11.5746 14.4484C11.1468 14.6663 10.5868 14.6663 9.46667 14.6663H6.53333C5.41323 14.6663 4.85318 14.6663 4.42535 14.4484C4.04903 14.2566 3.74307 13.9506 3.55132 13.5743C3.33333 13.1465 3.33333 12.5864 3.33333 11.4663V3.99967" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>' +
      '</svg>';
    return removeBtn;
  }

  function syncPanelUnitSetDom(listEl) {
    if (!listEl) return;
    var entries = all('.door-panel-unit-size-entry', listEl);
    entries.forEach(function (entry, idx) {
      var title = entry.querySelector('.door-panel-unit-size-entry-title');
      if (title) title.textContent = 'Panel Set #' + (idx + 1);
      var header = entry.querySelector('.door-panel-unit-size-entry-header');
      var removeBtn = entry.querySelector('.door-panel-unit-size-remove-btn');
      var showRemove = entries.length > 1;
      if (!showRemove) {
        if (removeBtn) removeBtn.remove();
        return;
      }
      if (!removeBtn && header) header.appendChild(createPanelUnitSetRemoveButton());
    });
    bindPanelUnitSetRemoveControls(listEl);
  }

  function bindPanelUnitSetRemoveControls(listEl) {
    if (!listEl) return;
    all('.door-panel-unit-size-remove-btn', listEl).forEach(function (btn) {
      if (btn.getAttribute('data-panel-unit-remove-bound')) return;
      btn.setAttribute('data-panel-unit-remove-bound', '1');
      btn.addEventListener('click', function (ev) {
        ev.preventDefault();
        var entry = btn.closest('.door-panel-unit-size-entry');
        if (!entry || !listEl) return;
        if (all('.door-panel-unit-size-entry', listEl).length <= 1) return;
        entry.remove();
        syncPanelUnitSetDom(listEl);
        assignUniqueOptionIds(listEl, 'door-panel-unit-size-row-select');
        updateEstimatedPrice();
      });
    });
  }

  function appendPanelUnitSizeRow(listEl) {
    if (!listEl) return null;
    var rowTpl = document.getElementById('door-static-panel-unit-size-row');
    if (!rowTpl || !rowTpl.content) return null;
    var rowClone = rowTpl.content.cloneNode(true);
    var row = rowClone.firstElementChild;
    if (!row) return null;
    listEl.appendChild(row);
    syncPanelUnitSetDom(listEl);
    assignUniqueOptionIds(listEl, 'door-panel-unit-size-row-select');
    bindPanelUnitQtyControls(row);
    enhancePanelUnitMeasurementSelects(row);
    return row;
  }

  function bindPanelUnitIndividualMeasurements(sectionEl, measurementsWrap) {
    if (!sectionEl || !measurementsWrap || measurementsWrap.getAttribute('data-panel-unit-bound')) return;
    measurementsWrap.setAttribute('data-panel-unit-bound', '1');
    var listEl = measurementsWrap.querySelector('.door-panel-unit-size-list');
    if (listEl && !listEl.querySelector('.door-panel-unit-size-entry')) {
      appendPanelUnitSizeRow(listEl);
    } else if (listEl) {
      syncPanelUnitSetDom(listEl);
    }
    bindPanelUnitQtyControls(measurementsWrap);
    var addBtn = measurementsWrap.querySelector('.door-panel-unit-add-size-btn');
    if (addBtn) {
      addBtn.addEventListener('click', function (ev) {
        ev.preventDefault();
        appendPanelUnitSizeRow(listEl);
        updateEstimatedPrice();
      });
    }
    all('select, input', measurementsWrap).forEach(function (el) {
      el.addEventListener('change', updateEstimatedPrice);
      el.addEventListener('input', updateEstimatedPrice);
    });
    enhancePanelUnitMeasurementSelects(measurementsWrap);
  }

  function mountPanelUnitIndividualMeasurements(sectionEl) {
    if (!sectionEl || sectionEl.querySelector('[data-panel-unit-individual-measurements]')) return;
    var tpl = document.getElementById('door-static-panel-unit-individual-measurements');
    if (!tpl || !tpl.content) return;
    var clone = tpl.content.cloneNode(true);
    var wrap = clone.firstElementChild;
    if (!wrap) return;
    sectionEl.appendChild(wrap);
    bindPanelUnitIndividualMeasurements(sectionEl, wrap);
  }

  function syncPanelUnitIndividualMeasurementsVisibility(sectionEl, optionId) {
    if (!sectionEl) return;
    var show = panelUnitIndividualOrderSelected(sectionEl, optionId);
    if (show) mountPanelUnitIndividualMeasurements(sectionEl);
    var wrap = sectionEl.querySelector('[data-panel-unit-individual-measurements]');
    if (!wrap) return;
    wrap.classList.toggle('door-hidden', !show);
  }

  function bindPanelUnitDesignVisibilityControls(sectionEl, optionId) {
    if (!sectionEl || sectionEl.getAttribute('data-panel-unit-visibility-bound')) return;
    sectionEl.setAttribute('data-panel-unit-visibility-bound', '1');
    function syncPanelUnitOrderUi() {
      syncPanelUnitDesignMeasurements(sectionEl, optionId);
      updateEstimatedPrice();
    }
    function syncPanelUnitCardSelection(activeRadio) {
      if (!activeRadio || !activeRadio.closest) return;
      var cardOwnerWrap = activeRadio.closest('.common-check-options');
      if (cardOwnerWrap) {
        cardOwnerWrap.querySelectorAll('.common-check-option').forEach(function (c) { c.classList.remove('common-check-option--selected'); });
      }
      var selCard = activeRadio.closest('.common-check-option');
      if (selCard) selCard.classList.add('common-check-option--selected');
    }
    all('input[type="radio"][data-option-id="' + optionId + '"], select[data-option-id="' + optionId + '"]', sectionEl).forEach(function (el) {
      el.addEventListener('change', function () {
        if (el.type === 'radio') syncPanelUnitCardSelection(el);
        syncPanelUnitOrderUi();
      });
    });
    sectionEl.addEventListener('click', function (ev) {
      var card = ev.target && ev.target.closest ? ev.target.closest('.common-check-option') : null;
      if (!card || !sectionEl.contains(card)) return;
      if (ev.target && ev.target.closest && ev.target.closest('.door-panel-unit-design-btn, .wood-species-open-btn, button')) return;
      var radio = card.querySelector('input[type="radio"][data-option-id="' + optionId + '"]');
      if (!radio) return;
      all('input[type="radio"][data-option-id="' + optionId + '"]', sectionEl).forEach(function (r) {
        r.checked = r === radio;
      });
      syncPanelUnitCardSelection(radio);
      try { radio.dispatchEvent(new Event('change', { bubbles: true })); } catch (eRadioEvt) {}
      syncPanelUnitOrderUi();
    });
  }

  function initializePanelUnitDesignSection(sectionEl, optionId) {
    if (!sectionEl || !optionId) return;
    bindPanelUnitDesignVisibilityControls(sectionEl, optionId);
    syncPanelUnitDesignMeasurements(sectionEl, optionId);
  }

  function appendStaticPanelUnitDesignSection(container) {
    if (!container || panelUnitDesignSectionExists(document.getElementById('door-configurator') || container)) return null;
    if (!productIsPorchPanelProduct()) return null;
    var optionId = 'panel_unit_design';
    var section = document.createElement('div');
    section.className = 'door-section door-option-wrap door-panel-unit-design-static';
    section.setAttribute('data-option-id', optionId);
    section.setAttribute('data-static-panel-unit-design', '');

    var headerRow = document.createElement('div');
    headerRow.className = 'door-option-header-row';
    var leftWrap = document.createElement('div');
    leftWrap.className = 'door-option-title-wrap';
    var title = document.createElement('p');
    title.className = 'door-section-title door-option-title';
    var titleText = document.createElement('span');
    titleText.textContent = 'Panel Unit Design';
    title.appendChild(titleText);
    leftWrap.appendChild(title);
    headerRow.appendChild(leftWrap);
    section.appendChild(headerRow);

    var prompt = document.createElement('p');
    prompt.className = 'door-panel-unit-order-prompt p-medium fw-600 primaryFont mb-16';
    prompt.textContent = 'How would you like to order your Porch Panels?';
    section.appendChild(prompt);

    var radioWrap = document.createElement('div');
    radioWrap.className = 'common-check-options';
    [
      { value: 'design_porch_enclosure_system', label: 'Design a Porch Enclosure System', selected: false },
      { value: 'order_individual_panels', label: 'Order Individual Panels', selected: false }
    ].forEach(function (choice) {
      var card = document.createElement('label');
      card.className = 'common-check-option' + (choice.selected ? ' common-check-option--selected' : '');
      var radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'attributes[Panel Unit Design]';
      radio.value = choice.value;
      radio.setAttribute('data-option-id', optionId);
      radio.style.position = 'absolute';
      radio.style.opacity = '0';
      radio.style.pointerEvents = 'none';
      if (choice.selected) radio.checked = true;
      card.appendChild(radio);
      var textWrap = document.createElement('div');
      textWrap.className = 'common-check-option-text';
      var text = document.createElement('span');
      text.className = 'common-check-option-label';
      text.textContent = choice.label;
      textWrap.appendChild(text);
      card.appendChild(textWrap);
      radioWrap.appendChild(card);
    });
    section.appendChild(radioWrap);

    if (container.firstChild) container.insertBefore(section, container.firstChild);
    else container.appendChild(section);
    initializePanelUnitDesignSection(section, optionId);
    return section;
  }

  function initializePanelUnitDesignSections(container, schema) {
    var root = document.getElementById('door-configurator') || container || document;
    all('[data-static-panel-unit-design]', root).forEach(function (sectionEl) {
      initializePanelUnitDesignSection(sectionEl, sectionEl.getAttribute('data-option-id') || 'panel_unit_design');
    });
    if (!container) return;
    (schema || []).forEach(function (opt) {
      if (!optionIsPanelUnitDesign(opt)) return;
      var sectionEl = container.querySelector('.door-option-wrap[data-option-id="' + opt.id + '"]');
      if (!sectionEl) return;
      initializePanelUnitDesignSection(sectionEl, opt.id);
    });
  }

  function getSelectedValueForOption(opt, optionsContainer) {
    if (!opt || !optionsContainer) return null;
    var t = (opt.type || '').toLowerCase();
    var inputs = all('select[data-option-id="' + opt.id + '"], input[data-option-id="' + opt.id + '"]', optionsContainer);
    if (t === 'radio') {
      var checked = inputs.filter(function (el) { return el.type === 'radio' && el.checked; })[0];
      return checked ? (checked.value || null) : null;
    }
    if (t === 'select' && inputs[0] && inputs[0].tagName && inputs[0].tagName.toLowerCase() === 'select') {
      var v = inputs[0].value;
      return v === '' ? null : v;
    }
    return null;
  }

  function normPreHungSelectionValue(v) {
    return String(v == null ? '' : v).trim().toLowerCase().replace(/\s+/g, '_');
  }

  function choiceMatchingValue(opt, val) {
    var choices = opt.options || [];
    var s = String(val);
    for (var i = 0; i < choices.length; i++) {
      var c = choices[i];
      if (c && String(c.value != null ? c.value : '') === s) return c;
    }
    return null;
  }

  function isSlabOnlyMeasurementTrigger(val) {
    return normPreHungSelectionValue(val) === 'slab_only';
  }

  /** Matches metaobject value slab_only and labels/values like "Pre-Hung on Brick Molding". */
  function isPreHungBrickMoldingTrigger(preOpt, val) {
    if (val == null || val === '') return false;
    var n = normPreHungSelectionValue(val);
    if (n === 'pre_hung_brick_molding' || n === 'pre_hung_on_brick_molding' || n === 'pre_hung_on_brick' || n === 'brick_molding') return true;
    if (n.indexOf('brick') !== -1 && n.indexOf('mold') !== -1) return true;
    var ch = choiceMatchingValue(preOpt, val);
    if (!ch) return false;
    var lbl = String(ch.label || '').toLowerCase();
    if (lbl.indexOf('brick') !== -1 && (lbl.indexOf('mold') !== -1 || lbl.indexOf('mould') !== -1)) return true;
    return false;
  }

  function shouldShowMeasurementTypeForPreHungSelection(schema, optionsContainer) {
    // Always show the Measurements block so Exact + Finished (first two tabs) are visible
    // before the customer chooses Pre-hung style. Panel details stay hidden until they pick a method.
    return true;
  }

  function findSchemaOptionByIdNorm(schema, idNorm) {
    if (!Array.isArray(schema)) return null;
    for (var si = 0; si < schema.length; si++) {
      var o = schema[si];
      if (o && normalizeOptionIdKey(o.id) === idNorm) return o;
    }
    return null;
  }

  function isSidelightChoiceExcluded(val, opt) {
    if (val == null || val === '') return true;
    var n = normPreHungSelectionValue(val);
    if (n === 'none' || n === 'no' || n.indexOf('no_sidelight') !== -1) return true;
    if (n.indexOf('without') !== -1 && n.indexOf('sidelight') !== -1) return true;
    var ch = choiceMatchingValue(opt, val);
    if (ch) {
      var lbl = String(ch.label || '').toLowerCase();
      if (lbl === 'none' || lbl.trim() === '—' || lbl.trim() === '-') return true;
      if (lbl.indexOf('no sidelight') !== -1) return true;
      if (lbl.indexOf('without') !== -1 && lbl.indexOf('sidelight') !== -1) return true;
    }
    return false;
  }

  function hasActiveSidelightSelection(schema, optionsContainer) {
    if (!schema || !optionsContainer) return false;
    var keys = ['sidelight_location', 'sidelight_style'];
    for (var ki = 0; ki < keys.length; ki++) {
      var opt = findSchemaOptionByIdNorm(schema, keys[ki]);
      if (!opt) continue;
      var val = getSelectedValueForOption(opt, optionsContainer);
      if (!isSidelightChoiceExcluded(val, opt)) return true;
    }
    return false;
  }

  /** Pre-Hung on jamb with sidelight and/or transom: two-tab UI (exact components vs rough opening + door). */
  function isJambTwoTabMeasureMode(schema, optionsContainer) {
    if (!schema || !optionsContainer) return false;
    if (!isPreHungOnDoorJambSelected(schema, optionsContainer)) return false;
    return hasActiveSidelightSelection(schema, optionsContainer) || hasActiveTransomSelection(schema, optionsContainer);
  }

  function syncJambSidelightTabLabels(optionsContainer, schema) {
    if (!optionsContainer || !schema) return;
    var wrap = optionsContainer.querySelector('.door-measurement-type-section.door-option-wrap');
    if (!wrap) return;
    var jambTwoTab = isJambTwoTabMeasureMode(schema, optionsContainer);
    wrap.querySelectorAll('.door-measure-tabs .door-measure-tab').forEach(function (tab) {
      var labelSpan = tab.querySelector('.common-check-option-label');
      if (!labelSpan) return;
      if (!labelSpan.getAttribute('data-door-tab-label-orig')) {
        labelSpan.setAttribute('data-door-tab-label-orig', labelSpan.textContent || '');
      }
      var orig = labelSpan.getAttribute('data-door-tab-label-orig') || '';
      if (jambTwoTab) {
        var vis = tab.getAttribute('data-measure-vis');
        if (vis === 'always') labelSpan.textContent = 'I know the exact size of each component';
        else if (vis === 'slab') labelSpan.textContent = 'I know my rough opening and door size — calculate the rest for me';
        else labelSpan.textContent = orig;
      } else {
        labelSpan.textContent = orig;
      }
    });
  }

  /** When Pre-Hung jamb + sidelight: second tab must submit rough-opening value, not finished-opening. */
  function syncJambSidelightMeasurementTabValues(optionsContainer, schema) {
    if (!optionsContainer || !schema) return;
    var measureOpt = null;
    for (var mi = 0; mi < schema.length; mi++) {
      if (schema[mi] && isMeasurementTypeOptionId(schema[mi].id)) {
        measureOpt = schema[mi];
        break;
      }
    }
    if (!measureOpt) return;
    var wrap = optionsContainer.querySelector('.door-measurement-type-section.door-option-wrap');
    if (!wrap) return;
    var slabTab = wrap.querySelector('.door-measure-tab[data-measure-vis="slab"]');
    if (!slabTab) return;
    var radio = slabTab.querySelector('input[type="radio"]');
    if (!radio) return;
    if (!radio.getAttribute('data-door-slab-tab-value-orig')) {
      radio.setAttribute('data-door-slab-tab-value-orig', radio.value || '');
      slabTab.setAttribute('data-door-slab-tab-choice-orig', slabTab.getAttribute('data-choice-value') || '');
    }
    var origVal = radio.getAttribute('data-door-slab-tab-value-orig') || '';
    var jambTwoTab = isJambTwoTabMeasureMode(schema, optionsContainer);
    var roughVal = 'rough_opening_size';
    var filtered = filterMeasurementTypeTabChoices(measureOpt.options || []);
    for (var ri = 0; ri < filtered.length; ri++) {
      var c = filtered[ri];
      var t = String((c && (c.label || c.value)) || '').toLowerCase();
      if (t.indexOf('rough') !== -1 && c.value != null && c.value !== '') {
        roughVal = String(c.value);
        break;
      }
    }
    var targetVal = jambTwoTab ? roughVal : origVal;
    if (radio.value !== targetVal) {
      radio.value = targetVal;
      slabTab.setAttribute('data-choice-value', targetVal);
    }
    var chk = wrap.querySelector('.door-measure-tabs .door-measure-tab input[type="radio"]:checked');
    if (chk) {
      var mode = measurementModeFromCheckedTab(chk, optionsContainer, schema);
      syncMeasurementTabVisibilityCore(mode, measureOpt.id, optionsContainer, schema);
    }
  }

  function isSlabSidelightMeasurementMode(schema, optionsContainer) {
    if (!schema || !optionsContainer) return false;
    var preOpt = findPreHungStyleOption(schema);
    if (!preOpt) return false;
    var v = getSelectedValueForOption(preOpt, optionsContainer);
    if (!isSlabOnlyMeasurementTrigger(v)) return false;
    return hasActiveSidelightSelection(schema, optionsContainer);
  }

  function isTransomChoiceExcluded(val, opt) {
    if (val == null || val === '') return true;
    var n = normPreHungSelectionValue(val);
    if (n === 'none' || n === 'no' || n.indexOf('no_transom') !== -1) return true;
    if (n.indexOf('without') !== -1 && n.indexOf('transom') !== -1) return true;
    var ch = choiceMatchingValue(opt, val);
    if (ch) {
      var lbl = String(ch.label || '').toLowerCase();
      if (lbl === 'none' || lbl.trim() === '—' || lbl.trim() === '-') return true;
      if (lbl.indexOf('no transom') !== -1) return true;
      if (lbl.indexOf('without') !== -1 && lbl.indexOf('transom') !== -1) return true;
    }
    return false;
  }

  function hasActiveTransomSelection(schema, optionsContainer) {
    if (!schema || !optionsContainer) return false;
    var keys = ['transom_style'];
    for (var ti = 0; ti < keys.length; ti++) {
      var opt = findSchemaOptionByIdNorm(schema, keys[ti]);
      if (!opt) continue;
      var val = getSelectedValueForOption(opt, optionsContainer);
      if (!isTransomChoiceExcluded(val, opt)) return true;
    }
    return false;
  }

  function isSlabTransomMeasurementMode(schema, optionsContainer) {
    if (!schema || !optionsContainer) return false;
    if (isSlabSidelightMeasurementMode(schema, optionsContainer)) return false;
    var preOpt = findPreHungStyleOption(schema);
    if (!preOpt) return false;
    var v = getSelectedValueForOption(preOpt, optionsContainer);
    if (!isSlabOnlyMeasurementTrigger(v)) return false;
    return hasActiveTransomSelection(schema, optionsContainer);
  }

  function isSlabSidelightTransomComboMode(schema, optionsContainer) {
    if (!schema || !optionsContainer) return false;
    var preOpt = findPreHungStyleOption(schema);
    if (!preOpt) return false;
    var v = getSelectedValueForOption(preOpt, optionsContainer);
    if (!isSlabOnlyMeasurementTrigger(v)) return false;
    return hasActiveSidelightSelection(schema, optionsContainer) && hasActiveTransomSelection(schema, optionsContainer);
  }

  function isSlabSpecialMeasurementMode(schema, optionsContainer) {
    var preOpt = findPreHungStyleOption(schema);
    if (!preOpt || !optionsContainer || !schema) return false;
    if (!isSlabOnlyMeasurementTrigger(getSelectedValueForOption(preOpt, optionsContainer))) return false;
    return hasActiveSidelightSelection(schema, optionsContainer) || hasActiveTransomSelection(schema, optionsContainer);
  }

  function syncSlabSidelightMeasurementUI(optionsContainer, schema) {
    if (!optionsContainer) optionsContainer = document.getElementById('door-configurator-options');
    if (!optionsContainer || !schema) return;
    if (measurementSchemaUsesJsonVisibility(schema)) {
      applyMeasurementSectionJsonVisibility(schema, optionsContainer);
      return;
    }
    var wrap = optionsContainer.querySelector('.door-measurement-type-section.door-option-wrap');
    if (!wrap || wrap.classList.contains('door-hidden')) return;
    var emb = wrap.querySelector('.door-measurement-embedded-dimensions');
    var defaultPanels = emb && emb.querySelector('.door-measurement-default-panels');
    var slabPanels = emb && emb.querySelector('.door-measurement-slab-sidelight-panels');
    var transomPanels = emb && emb.querySelector('.door-measurement-slab-transom-panels');
    var comboPanels = emb && emb.querySelector('.door-measurement-slab-combo-panels');
    if (!defaultPanels) return;
    if (!slabPanels && !transomPanels && !comboPanels) return;

    var combo = isSlabSidelightTransomComboMode(schema, optionsContainer);
    var slabSide = isSlabSidelightMeasurementMode(schema, optionsContainer);
    var slabTrans = isSlabTransomMeasurementMode(schema, optionsContainer);
    var prompt = wrap.querySelector('.door-measurement-type-prompt');
    var tabs = wrap.querySelector('.door-measure-tabs');
    var intro = wrap.querySelector('.door-measurement-panel-intro');
    var eyebrow = wrap.querySelector('.door-measurement-type-eyebrow');
    var measureOptId = wrap.getAttribute('data-option-id');

    function hideIntro() {
      if (intro) {
        intro.classList.add('door-hidden');
        intro.textContent = '';
        intro.setAttribute('aria-hidden', 'true');
      }
    }

    if (combo) {
      if (eyebrow) eyebrow.textContent = 'Exact Door Size + Sidelight + Transom';
      if (prompt) prompt.classList.add('door-hidden');
      if (tabs) tabs.classList.add('door-hidden');
      hideIntro();
      if (emb) emb.classList.remove('door-hidden');
      defaultPanels.classList.add('door-hidden');
      if (slabPanels) slabPanels.classList.add('door-hidden');
      if (transomPanels) transomPanels.classList.add('door-hidden');
      if (comboPanels) {
        comboPanels.classList.remove('door-hidden');
        fixPanelDoorWidthAndTransomHeightOptionRanges(comboPanels);
      }
    } else if (slabSide) {
      if (eyebrow) eyebrow.textContent = 'Exact Door Size + Sidelight';
      if (prompt) prompt.classList.add('door-hidden');
      if (tabs) tabs.classList.add('door-hidden');
      hideIntro();
      if (emb) emb.classList.remove('door-hidden');
      defaultPanels.classList.add('door-hidden');
      if (transomPanels) transomPanels.classList.add('door-hidden');
      if (comboPanels) comboPanels.classList.add('door-hidden');
      if (slabPanels) slabPanels.classList.remove('door-hidden');
    } else if (slabTrans) {
      if (eyebrow) eyebrow.textContent = 'Exact Door Size + Transom';
      if (prompt) prompt.classList.add('door-hidden');
      if (tabs) tabs.classList.add('door-hidden');
      hideIntro();
      if (emb) emb.classList.remove('door-hidden');
      defaultPanels.classList.add('door-hidden');
      if (slabPanels) slabPanels.classList.add('door-hidden');
      if (comboPanels) comboPanels.classList.add('door-hidden');
      if (transomPanels) {
        transomPanels.classList.remove('door-hidden');
        fixPanelDoorWidthAndTransomHeightOptionRanges(transomPanels);
      }
    } else {
      if (slabPanels) slabPanels.classList.add('door-hidden');
      if (transomPanels) transomPanels.classList.add('door-hidden');
      if (comboPanels) comboPanels.classList.add('door-hidden');
      defaultPanels.classList.remove('door-hidden');
      if (prompt) prompt.classList.remove('door-hidden');
      if (tabs) tabs.classList.remove('door-hidden');
      var modeAfter = 'exact';
      if (tabs) {
        var chk = tabs.querySelector('.door-measure-tab input[type="radio"]:checked');
        if (chk) modeAfter = measurementModeFromCheckedTab(chk, optionsContainer, schema);
      }
      if (measureOptId) syncMeasurementTabVisibilityCore(modeAfter, measureOptId, optionsContainer, schema);
      syncMeasurementPromptAndEyebrow(optionsContainer, schema);
    }
  }

  function syncMeasurementTypeSectionPreHungGate(schema, optionsContainer) {
    if (!optionsContainer) optionsContainer = document.getElementById('door-configurator-options');
    if (!optionsContainer || !schema) return;
    var wrap = optionsContainer.querySelector('.door-measurement-type-section.door-option-wrap');
    if (!wrap) return;
    if (isGateCollection()) {
      wrap.classList.remove('door-hidden');
      applyGateCollectionMeasurementTabs(optionsContainer, schema);
      return;
    }
    var measureOptGate = null;
    for (var mg = 0; mg < schema.length; mg++) {
      if (schema[mg] && isMeasurementTypeOptionId(schema[mg].id)) {
        measureOptGate = schema[mg];
        break;
      }
    }
    if (measureOptGate && optionHasJsonVisibilityRules(measureOptGate)) return;
    var show = shouldShowMeasurementTypeForPreHungSelection(schema, optionsContainer);
    wrap.classList.toggle('door-hidden', !show);
    if (!show) return;
    var oid = wrap.getAttribute('data-option-id');
    var radioTabs = wrap.querySelector('.door-measure-tabs');
    if (radioTabs && oid) {
      var chk = radioTabs.querySelector('.door-measure-tab input[type="radio"]:checked');
      if (chk) {
        var modeAfter = measurementModeFromCheckedTab(chk, optionsContainer, schema);
        syncMeasurementTabVisibilityCore(modeAfter, oid, optionsContainer, schema);
      }
    }
  }

  function syncHingeFinishVisibility(schema, optionsContainer) {
    if (!optionsContainer) optionsContainer = document.getElementById('door-configurator-options');
    if (!optionsContainer || !schema) return;
    var hingeWrap = optionsContainer.querySelector('.door-option-wrap[data-option-id="hinge_finish"]')
      || optionsContainer.querySelector('.door-option-wrap[data-option-id="Hinge_Finish"]')
      || optionsContainer.querySelector('.door-option-wrap[data-option-id="hinge-finish"]');
    if (!hingeWrap) return;
    var preOpt = findPreHungStyleOption(schema);
    if (!preOpt) return;
    var preVal = getSelectedValueForOption(preOpt, optionsContainer);
    var isSlab = isSlabOnlyMeasurementTrigger(preVal);
    var noSelection = (preVal == null || preVal === '');
    hingeWrap.classList.toggle('door-hidden', isSlab || noSelection);
  }

  /** Apply measurement tab selection: show intro, dimension rows, and correct static panel. */
  function applyMeasurementTypeTabSelection(radioEl, measureOptionId, optionsContainer, schema) {
    if (!radioEl || !optionsContainer) return;
    schema = schema || doorConfigSchemaRef();
    var mode = measurementModeFromCheckedTab(radioEl, optionsContainer, schema);
    syncMeasurementTabVisibilityCore(mode, measureOptionId, optionsContainer, schema);
    if (measurementSchemaUsesJsonVisibility(schema)) {
      applyMeasurementSectionJsonVisibility(schema, optionsContainer);
    }
    var wrap = optionsContainer.querySelector('.door-measurement-type-section.door-option-wrap[data-option-id="' + measureOptionId + '"]') ||
      optionsContainer.querySelector('.door-measurement-type-section.door-option-wrap');
    if (!wrap) return;
    var intro = wrap.querySelector('.door-measurement-panel-intro');
    var emb = wrap.querySelector('.door-measurement-embedded-dimensions');
    if (intro) {
      intro.classList.remove('door-hidden');
      intro.setAttribute('aria-hidden', 'false');
    }
    if (emb) emb.classList.remove('door-hidden');
    var tabEl = radioEl.closest ? radioEl.closest('.door-measure-tab') : null;
    if (tabEl) {
      var tabsWrap = tabEl.closest('.door-measure-tabs');
      if (tabsWrap) {
        tabsWrap.querySelectorAll('.door-measure-tab').forEach(function (c) {
          c.classList.remove('common-check-option--selected');
        });
      }
      tabEl.classList.add('common-check-option--selected');
    }
    try { applyFinishedRoughWidthIntDefaults(optionsContainer, false); } catch (eFinRoughDef) {}
    try { applyStaticMeasurementDimensionDefaults(optionsContainer); } catch (eTabMeasDef) {}
  }

  /** When measurement_type has no default selection, intro + rows stay hidden until a tab is picked; restore visibility after load/save. */
  function syncMeasurementTypeDetailsVisibility(optionsContainer, schema) {
    if (!optionsContainer || !schema) return;
    var measureOpt = null;
    for (var mi = 0; mi < schema.length; mi++) {
      if (schema[mi] && isMeasurementTypeOptionId(schema[mi].id)) {
        measureOpt = schema[mi];
        break;
      }
    }
    if (!measureOpt) return;
    var wrap = optionsContainer.querySelector('.door-measurement-type-section.door-option-wrap[data-option-id="' + measureOpt.id + '"]');
    if (!wrap) return;
    var slabSpecialDet = isSlabSpecialMeasurementMode(schema, optionsContainer);
    var chk = wrap.querySelector('.door-measure-tabs .door-measure-tab input[type="radio"]:checked');
    var intro = wrap.querySelector('.door-measurement-panel-intro');
    var emb = wrap.querySelector('.door-measurement-embedded-dimensions');
    var reveal = !!chk || slabSpecialDet;
    if (intro) {
      if (!reveal || slabSpecialDet) {
        intro.textContent = '';
        intro.setAttribute('aria-hidden', 'true');
      } else {
        intro.setAttribute('aria-hidden', 'false');
      }
      intro.classList.toggle('door-hidden', !reveal || slabSpecialDet);
    }
    if (emb) emb.classList.toggle('door-hidden', !reveal);
    if (slabSpecialDet) return;
    if (chk) {
      applyMeasurementTypeTabSelection(chk, measureOpt.id, optionsContainer, schema);
    }
  }

  function runMeasurementUiSync() {
    var optContainer = document.getElementById('door-configurator-options');
    if (!doorConfigSchemaRef() || !optContainer) return;
    syncMeasurementTypeSectionPreHungGate(doorConfigSchemaRef(), optContainer);
    syncHingeFinishVisibility(doorConfigSchemaRef(), optContainer);
    syncMeasurementTabCardVisibility(optContainer, doorConfigSchemaRef());
    syncMeasurementTypeDetailsVisibility(optContainer, doorConfigSchemaRef());
    syncSlabSidelightMeasurementUI(optContainer, doorConfigSchemaRef());
    if (measurementSchemaUsesJsonVisibility(doorConfigSchemaRef())) {
      applyMeasurementSectionJsonVisibility(doorConfigSchemaRef(), optContainer);
    }
    syncMeasurementSidelightTransomTabVisibility(optContainer, doorConfigSchemaRef());
    applyGardenGatesCollectionRules(optContainer, doorConfigSchemaRef());
    try { applyStaticMeasurementDimensionDefaults(optContainer); } catch (eMeasDef) {}
  }
  var MEASUREMENT_ADDON_BREAKDOWN_CATALOG = {
    door_oversized: ['int_ext_oversized', 'screen_storm_oversized'],
    door_thickness: [
      'interior_door_thickness',
      'screen_storm_thickness',
      'screen_storm_thickness_frac',
      'screen_storm_panel_door_thickness_extra',
      'sidelight_panel_thickness'
    ],
    sidelight_transom: [
      'sidelight_transom_oversized',
      'sidelight_transom_oversized_pair1',
      'sidelight_transom_oversized_pair2',
      'screen_storm_sidelight_transom',
      'screen_storm_transom_combo'
    ]
  };

  var MEASUREMENT_ADDON_WINDOW_MAP = {
    int_ext_oversized: '__doorAddon_intExtOversizedApi',
    interior_door_thickness: '__doorAddon_interiorDoorThickness',
    sidelight_panel_thickness: '__doorAddon_sidelightPanelThickness',
    sidelight_transom_oversized: '__doorAddon_sidelightTransomOversized',
    sidelight_transom_oversized_pair1: '__doorAddon_sidelightTransomOversizedPair1',
    sidelight_transom_oversized_pair2: '__doorAddon_sidelightTransomOversizedPair2',
    screen_storm_oversized: '__doorScreenStormAddon_oversized',
    screen_storm_thickness: '__doorScreenStormAddon_thickness',
    screen_storm_thickness_frac: '__doorScreenStormAddon_thickness_frac',
    screen_storm_sidelight_transom: '__doorScreenStormAddon_sidelight_transom',
    screen_storm_transom_combo: '__doorScreenStormAddon_transom_combo',
    screen_storm_panel_door_thickness_extra: '__doorScreenStormAddon_panel_door_thickness_extra'
  };

  function allMeasurementAddonBreakdownKeys() {
    var keys = [];
    Object.keys(MEASUREMENT_ADDON_BREAKDOWN_CATALOG).forEach(function (g) {
      (MEASUREMENT_ADDON_BREAKDOWN_CATALOG[g] || []).forEach(function (k) {
        if (keys.indexOf(k) === -1) keys.push(k);
      });
    });
    return keys;
  }

  function sumMeasurementBreakdownKeys(bd, keys) {
    if (!bd || !keys || !keys.length) return 0;
    var sum = 0;
    keys.forEach(function (k) {
      if (bd[k] == null || bd[k] === '') return;
      var n = parseFloat(bd[k]);
      if (!isNaN(n)) sum += n;
    });
    return Math.round(sum * 100) / 100;
  }

  function liveAmountForMeasurementBreakdownKey(key) {
    var winKey = MEASUREMENT_ADDON_WINDOW_MAP[key];
    if (!winKey) return 0;
    return parseFloat(window[winKey] || 0) || 0;
  }

  function sumLiveMeasurementKeys(keys) {
    var sum = 0;
    (keys || []).forEach(function (k) { sum += liveAmountForMeasurementBreakdownKey(k); });
    return Math.round(sum * 100) / 100;
  }

  function measurementStyleOptionHasValue(optionKey) {
    var root = document.getElementById('door-configurator-options');
    if (!root) return false;
    var checked = root.querySelector('input[type="radio"][data-option-id="' + optionKey + '"]:checked');
    if (checked && String(checked.value || '').trim() !== '') return true;
    var sel = root.querySelector('select[data-option-id="' + optionKey + '"]');
    return !!(sel && String(sel.value || '').trim() !== '');
  }

  function breakdownSidelightTransomSplitMode(bd) {
    if (!bd) return false;
    var pair1 = parseFloat(bd.sidelight_transom_oversized_pair1 || 0) || 0;
    var pair2 = parseFloat(bd.sidelight_transom_oversized_pair2 || 0) || 0;
    return Math.abs(pair1) > 0.005 || Math.abs(pair2) > 0.005;
  }

  function liveSidelightTransomSplitMode() {
    var pair1 = liveAmountForMeasurementBreakdownKey('sidelight_transom_oversized_pair1');
    var pair2 = liveAmountForMeasurementBreakdownKey('sidelight_transom_oversized_pair2');
    return Math.abs(pair1) > 0.005 || Math.abs(pair2) > 0.005;
  }

  function isSidelightMeasurementOptionId(optionId) {
    return /(sidelight.*width|sidelight_width)/.test(normalizeOptionIdKey(optionId));
  }

  function isTransomMeasurementOptionId(optionId) {
    return /(transom.*height|panel_transom|panel_door_width)/.test(normalizeOptionIdKey(optionId));
  }

  function sumSidelightTransomRowAddon(optionId, bd, opts) {
    var id = normalizeOptionIdKey(optionId);
    var split;
    var pair1;
    var pair2;
    var legacy;
    var ssSl;
    var ssTc;
    if (bd) {
      split = breakdownSidelightTransomSplitMode(bd);
      pair1 = parseFloat(bd.sidelight_transom_oversized_pair1 || 0) || 0;
      pair2 = parseFloat(bd.sidelight_transom_oversized_pair2 || 0) || 0;
      legacy = parseFloat(bd.sidelight_transom_oversized || 0) || 0;
      ssSl = parseFloat(bd.screen_storm_sidelight_transom || 0) || 0;
      ssTc = parseFloat(bd.screen_storm_transom_combo || 0) || 0;
    } else {
      split = liveSidelightTransomSplitMode();
      pair1 = liveAmountForMeasurementBreakdownKey('sidelight_transom_oversized_pair1');
      pair2 = liveAmountForMeasurementBreakdownKey('sidelight_transom_oversized_pair2');
      legacy = liveAmountForMeasurementBreakdownKey('sidelight_transom_oversized');
      ssSl = liveAmountForMeasurementBreakdownKey('screen_storm_sidelight_transom');
      ssTc = liveAmountForMeasurementBreakdownKey('screen_storm_transom_combo');
    }
    var hasSl = opts && opts.sidelight_style != null && String(opts.sidelight_style || '') !== ''
      ? true
      : measurementStyleOptionHasValue('sidelight_style');
    var hasTr = opts && opts.transom_style != null && String(opts.transom_style || '') !== ''
      ? true
      : measurementStyleOptionHasValue('transom_style');
    if (isSidelightMeasurementOptionId(id)) {
      if (!split && Math.abs(legacy) > 0.005 && hasTr && !hasSl) return 0;
      var slAmt = split ? pair2 : legacy;
      return Math.round((slAmt + ssSl) * 100) / 100;
    }
    if (isTransomMeasurementOptionId(id)) {
      if (!split && Math.abs(legacy) > 0.005 && hasSl && !hasTr) return 0;
      var trAmt = split ? pair1 : legacy;
      return Math.round((trAmt + ssSl + ssTc) * 100) / 100;
    }
    return null;
  }

  function measurementOptionAddonGroup(optionId) {
    var id = normalizeOptionIdKey(optionId);
    if (id === 'measurement_type') return 'all';
    if (/(sidelight.*width|sidelight_width|transom.*height|panel_transom|panel_door_width)/.test(id)) {
      return 'sidelight_transom';
    }
    if (/thick/.test(id)) return 'door_thickness';
    if (/(width|height|pre_hung|jamb)/.test(id)) return 'door_oversized';
    return null;
  }

  function formatMeasurementAddonPriceLabel(amount) {
    var n = parseFloat(amount) || 0;
    if (Math.abs(n) < 0.005) return '';
    var abs = Math.abs(n);
    var s = abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (n >= 0 ? '+$' : '-$') + s;
  }

  function getMeasurementAddonAmountForOption(optionId, opts) {
    var group = measurementOptionAddonGroup(optionId);
    if (!group) return 0;
    var bd = opts && opts._addon_breakdown && typeof opts._addon_breakdown === 'object'
      ? opts._addon_breakdown : null;
    if (group === 'all') {
      if (bd) return sumMeasurementBreakdownKeys(bd, allMeasurementAddonBreakdownKeys());
      return sumLiveMeasurementKeys(allMeasurementAddonBreakdownKeys());
    }
    if (group === 'sidelight_transom') {
      var rowAmt = sumSidelightTransomRowAddon(optionId, bd, opts);
      if (rowAmt !== null) return rowAmt;
    }
    var keys = MEASUREMENT_ADDON_BREAKDOWN_CATALOG[group] || [];
    if (bd) return sumMeasurementBreakdownKeys(bd, keys);
    return sumLiveMeasurementKeys(keys);
  }

  function ensureMeasurementSelectedPriceEl(hostEl, optionId) {
    if (!hostEl) return null;
    var oid = String(optionId || hostEl.getAttribute('data-option-id') || '');
    var priceEl = hostEl.querySelector('.door-measurement-selected-price[data-option-id="' + oid + '"]');
    if (!priceEl) {
      priceEl = document.createElement('span');
      priceEl.className = 'door-measurement-selected-price door-measurement-selected-price--empty';
      priceEl.setAttribute('data-option-id', oid);
      hostEl.appendChild(priceEl);
    }
    return priceEl;
  }

  function measurementDimensionRowHasValue(row) {
    if (!row) return false;
    var selects = row.querySelectorAll('select, input[type="hidden"]');
    for (var i = 0; i < selects.length; i++) {
      var el = selects[i];
      if (!el || el.disabled) continue;
      var v = String(el.value || '').trim();
      if (v !== '') return true;
    }
    return false;
  }

  function syncMeasurementSelectedPriceLabels(opts) {
    var container = document.getElementById('door-configurator-options');
    if (!container) return;

    var measWrap = container.querySelector('.door-measurement-type-section.door-option-wrap[data-option-id]');

    container.querySelectorAll('.door-measurement-selected-price').forEach(function (priceEl) {
      priceEl.textContent = '';
      priceEl.classList.add('door-measurement-selected-price--empty');
    });

    container.querySelectorAll('.admin-option-row[data-option-id] .admin-option-selected-price').forEach(function (priceEl) {
      var row = priceEl.closest('.admin-option-row[data-option-id]');
      var oid = row ? row.getAttribute('data-option-id') || '' : '';
      if (oid && measurementOptionAddonGroup(oid) && normalizeOptionIdKey(oid) !== 'measurement_type') {
        priceEl.textContent = '';
        priceEl.classList.add('admin-option-selected-price--empty');
      }
    });

    if (measWrap) {
      var measOid = measWrap.getAttribute('data-option-id') || 'measurement_type';
      var heading = measWrap.querySelector('.door-measurement-type-heading');
      if (heading) {
        var typeRadio = measWrap.querySelector('.door-measure-tabs .door-measure-tab input[type="radio"]:checked');
        var priceOnType = ensureMeasurementSelectedPriceEl(heading, measOid);
        if (priceOnType) {
          var typeAmt = typeRadio ? getMeasurementAddonAmountForOption(measOid, opts) : 0;
          var typeText = formatMeasurementAddonPriceLabel(typeAmt);
          priceOnType.textContent = typeText;
          priceOnType.classList.toggle('door-measurement-selected-price--empty', typeText === '');
        }
      }
    }
  }

  function isSavedMeasurementRestoreDebugOn() {
    try {
      if (window.__DOOR_SAVED_MEASUREMENT_RESTORE_DEBUG === true) return true;
      if (typeof window.__doorSavedRestoreDebug === 'function') return true;
      if (typeof location !== 'undefined' && location.search && /door_saved_restore_debug/i.test(location.search)) {
        return true;
      }
    } catch (eDbg) {}
    return isMeasurementWidthDefaultDebugOn();
  }

  function debugSavedMeasurementRestore(phase, detail) {
    if (!isSavedMeasurementRestoreDebugOn()) return;
    try {
      if (typeof window.__doorSavedRestoreDebug === 'function') {
        window.__doorSavedRestoreDebug(phase, detail || {});
        return;
      }
      console.log('[door-saved-meas-restore]', phase, detail || {});
    } catch (eLog) {}
  }

  var SAVED_MEAS_RESTORE_KEY_SELECT_IDS = {
    measurement_type: true,
    exact_door_width_int: true,
    exact_door_width_frac: true,
    door_height: true,
    door_height_fraction: true,
    door_height_frac: true
  };
  var lastSavedMeasApplyCompleteLogAt = 0;

  function savedMeasRestoreSelectBaseId(sel) {
    return String(sel && sel.id ? sel.id : '').split('__')[0].replace(/-/g, '_');
  }

  function trackSavedMeasurementSelectRestore(stats, sel, val, ok) {
    if (!stats || !sel) return;
    if (ok) stats.applied += 1;
    else stats.failed += 1;
    var baseId = savedMeasRestoreSelectBaseId(sel);
    if (!SAVED_MEAS_RESTORE_KEY_SELECT_IDS[baseId] || stats.keys[baseId]) return;
    stats.keys[baseId] = {
      want: String(val),
      got: String(sel.value || ''),
      ok: ok
    };
  }

  function markMeasurementSelectRestoredFromSaved(sel) {
    if (!sel || !sel.setAttribute) return;
    sel.setAttribute('data-door-user-changed', '1');
  }

  function isMeasurementDimensionSelect(sel) {
    if (!sel) return false;
    if (isStandardMeasurementWidthIntSelect(sel)) return true;
    var id = String(sel.id || '').toLowerCase();
    if (id === 'door_height' || id.indexOf('door_height') === 0) return true;
    if (id.indexOf('door-height') === 0) return true;
    if (id.indexOf('height') !== -1 && sel.classList && sel.classList.contains('door-dimension-int-select')) return true;
    if (id.indexOf('height') !== -1 && sel.classList && sel.classList.contains('door-dimension-frac-select')) return true;
    if (id.indexOf('frac') !== -1 || id.indexOf('fraction') !== -1) return true;
    return false;
  }

  function applySavedValueToMeasurementSelect(sel, val, setSelectValueFromSaved, stats) {
    if (!sel || val == null || val === '') return false;
    var ok = setMeasurementSelectValue(sel, val, { dispatchChange: true });
    if (!ok && typeof setSelectValueFromSaved === 'function') {
      ok = setSelectValueFromSaved(sel, val);
      if (ok) {
        syncMeasurementDivSelectUi(sel);
        try {
          sel.dispatchEvent(new Event('change', { bubbles: true }));
        } catch (eCh) {}
        syncMeasurementDivSelectUi(sel);
      }
    }
    if (ok) markMeasurementSelectRestoredFromSaved(sel);
    trackSavedMeasurementSelectRestore(stats, sel, val, ok);
    return ok;
  }

  function normSummaryLabel(label) {
    return String(label == null ? '' : label).trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function parseFractionToken(token) {
    var t = String(token == null ? '' : token).trim();
    var map = { '0': '0', '1/4': '0.25', '1/2': '0.5', '3/4': '0.75' };
    if (Object.prototype.hasOwnProperty.call(map, t)) return map[t];
    if (t !== '' && !isNaN(parseFloat(t))) return String(parseFloat(t));
    return t;
  }

  function parseCombinedMeasurementDisplayValue(value) {
    var parts = String(value == null ? '' : value).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return [];
    if (parts.length === 2 && /\d+\/\d+/.test(parts[1])) {
      return [String(parseFloat(parts[0]) + parseFloat(parseFractionToken(parts[1])))];
    }
    return parts;
  }

  function measurementSummaryTitleFieldMap() {
    return {
      'exact door width': ['exact_door_width_int', 'exact_door_width_frac'],
      'exact door height': ['door_height', 'door_height_fraction'],
      'exact door thickness': ['exact_door_thickness_frac'],
      'finished opening width': ['finished_width_int', 'finished_width_frac'],
      'finished opening height': ['finished_height_int', 'finished_height_frac'],
      'rough opening width': ['rough_width_int', 'rough_width_frac'],
      'rough opening height': ['rough_height_int', 'rough_height_frac'],
      'door thickness': ['door_thickness'],
      'pre-hung unit depth': ['exact_pre_hung_frac'],
      'pre hung unit depth': ['exact_pre_hung_frac'],
      'exact sidelight width': ['sidelight_width', 'sidelight_width_fraction'],
      'exact transom height': ['panel_transom_height_int', 'panel_transom_height_frac'],
      'jamb unit width': ['jamb_pre_hung_int', 'jamb_pre_hung_frac'],
      'jamb unit height': ['panel_height_int', 'panel_height_frac'],
      'sidelight width': ['sidelight_width', 'sidelight_width_fraction'],
      'transom height': ['panel_transom_height_int', 'panel_transom_height_frac'],
      'panel door width': ['panel_width_int'],
      'panel transom height': ['panel_transom_height_int', 'panel_transom_height_frac']
    };
  }

  function measurementOptionKeysPopulated(opts, id) {
    var getSaved = deps.getSavedOptionValue;
    if (typeof getSaved === 'function') {
      var val = getSaved(opts, id);
      return val != null && val !== '';
    }
    var norm = normalizeOptionIdKey(id);
    var keys = [String(id), norm, norm.replace(/_/g, '-')];
    for (var ki = 0; ki < keys.length; ki++) {
      if (keys[ki] && opts[keys[ki]] != null && opts[keys[ki]] !== '') return true;
    }
    return false;
  }

  function setSavedOptionValue(opts, id, val) {
    if (!opts || id == null || val == null || val === '') return;
    var keysFn = deps.savedOptionKeysForId;
    if (typeof keysFn === 'function') {
      keysFn(id).forEach(function (k) {
        if (k) opts[k] = val;
      });
      return;
    }
    var norm = normalizeOptionIdKey(id);
    [String(id), norm, norm.replace(/_/g, '-')].forEach(function (k) {
      if (k) opts[k] = val;
    });
  }

  function inferMeasurementTypeFromSummary(opts) {
    var summary = opts && opts._selected_summary;
    if (!Array.isArray(summary)) return '';
    var labels = summary.map(function (item) {
      return item ? normSummaryLabel(item.label) : '';
    }).filter(Boolean);
    function has(needle) {
      return labels.some(function (l) { return l.indexOf(needle) !== -1; });
    }
    if (has('exact sidelight')) return 'exact_sidelight_size';
    if (has('exact transom')) return 'exact_transom_size';
    if (has('exact door') || has('pre-hung unit depth') || has('pre hung unit depth')) return 'exact_door_size';
    if (has('finished opening')) return 'finished_opening_size';
    if (has('rough opening')) return 'rough_opening_size';
    if (has('jamb unit')) return 'pre_hung_unit_size';
    return '';
  }

  function hydrateMeasurementOptionsFromSummary(opts, ctx) {
    if (!opts || !Array.isArray(opts._selected_summary) || !opts._selected_summary.length) return;
    ctx = ctx || {};
    var getSavedFn = ctx.getSavedOptionValue || deps.getSavedOptionValue;
    var keysFn = ctx.savedOptionKeysForId || deps.savedOptionKeysForId;
    function populated(id) {
      if (typeof getSavedFn === 'function') {
        var v = getSavedFn(opts, id);
        return v != null && v !== '';
      }
      return measurementOptionKeysPopulated(opts, id);
    }
    function setVal(id, val) {
      if (typeof keysFn === 'function' && typeof getSavedFn === 'function') {
        keysFn(id).forEach(function (k) { if (k) opts[k] = val; });
        return;
      }
      setSavedOptionValue(opts, id, val);
    }
    var titleMap = measurementSummaryTitleFieldMap();
    var schema = Array.isArray(opts._pricing_schema) ? opts._pricing_schema : [];
    opts._selected_summary.forEach(function (item) {
      if (!item) return;
      var title = normSummaryLabel(item.label);
      var value = String(item.value == null ? '' : item.value).trim();
      if (!title || !value) return;
      var fields = titleMap[title];
      if (!fields && schema.length) {
        fields = [];
        schema.forEach(function (o) {
          if (!o || !o.id) return;
          if (o._adminGroup !== 'measurement' && !/(width|height|thick|pre_hung|jamb|sidelight|transom)/i.test(String(o.id))) return;
          var ol = normSummaryLabel(o.label);
          if (ol === title || (ol && ol.indexOf(title) === 0)) fields.push(String(o.id));
        });
        fields.sort(function (a, b) {
          return (/frac/i.test(a) ? 1 : 0) - (/frac/i.test(b) ? 1 : 0);
        });
      }
      if (!fields || !fields.length) return;
      var parts = parseCombinedMeasurementDisplayValue(value);
      if (fields.length === 1) {
        if (!populated(fields[0])) {
          var single = parts.length === 1 ? parts[0] : parts.join(' ');
          if (/frac|thick/i.test(fields[0])) single = parseFractionToken(single);
          setVal(fields[0], single);
        }
        return;
      }
      fields.forEach(function (fieldId, idx) {
        if (populated(fieldId)) return;
        if (parts[idx] == null) return;
        var partVal = /frac/i.test(fieldId) ? parseFractionToken(parts[idx]) : parts[idx];
        setVal(fieldId, partVal);
      });
    });
    if (!populated('measurement_type')) {
      var inferred = inferMeasurementTypeFromSummary(opts);
      if (inferred) setVal('measurement_type', inferred);
    }
  }

  function applyMeasurementSelectsFromSavedOptions(opts, ctx) {
    if (!opts) return;
    ctx = ctx || {};
    var optionsContainer = ctx.optionsContainer;
    var getSavedOptionValue = ctx.getSavedOptionValue || deps.getSavedOptionValue;
    var setSelectValueFromSaved = ctx.setSelectValueFromSaved || deps.setSelectValueFromSaved;
    if (typeof getSavedOptionValue !== 'function' || typeof setSelectValueFromSaved !== 'function') return;
    hydrateMeasurementOptionsFromSummary(opts, ctx);
    var restoreStats = { applied: 0, failed: 0, keys: {} };
    var selectors = '.door-measurement-static-panels select, .door-measurement-embedded-dimensions select, .door-measurement-static-rows select';
    all(selectors, document).forEach(function (sel) {
      var id = sel.id || (sel.getAttribute && sel.getAttribute('data-option-id')) || '';
      if (!id) return;
      var val = getSavedOptionValue(opts, id);
      if (val == null || val === '') return;
      applySavedValueToMeasurementSelect(sel, val, setSelectValueFromSaved, restoreStats);
    });
    if (Array.isArray(opts._pricing_schema)) {
      opts._pricing_schema.forEach(function (opt) {
        if (!opt || !opt.id) return;
        if (opt._adminGroup !== 'measurement' && !/(width|height|thick|pre_hung|jamb|sidelight|transom)/i.test(String(opt.id))) return;
        var val2 = getSavedOptionValue(opts, opt.id);
        if (val2 == null || val2 === '') return;
        var selList = [];
        var byId = document.getElementById(opt.id);
        if (byId) selList.push(byId);
        if (optionsContainer) {
          all('select[data-option-id="' + opt.id + '"]', optionsContainer).forEach(function (s) {
            if (selList.indexOf(s) === -1) selList.push(s);
          });
        }
        all('select#' + opt.id + ', select[id^="' + opt.id + '"]', document).forEach(function (s) {
          if (selList.indexOf(s) === -1) selList.push(s);
        });
        selList.forEach(function (sel2) {
          applySavedValueToMeasurementSelect(sel2, val2, setSelectValueFromSaved, restoreStats);
        });
      });
    }
    applySavedDoorHeightFromOptions(opts, ctx, setSelectValueFromSaved, restoreStats);
    var now = Date.now();
    if (now - lastSavedMeasApplyCompleteLogAt < 1200) return;
    lastSavedMeasApplyCompleteLogAt = now;
    debugSavedMeasurementRestore('apply-complete', {
      applied: restoreStats.applied,
      failed: restoreStats.failed,
      keys: restoreStats.keys
    });
  }

  function applySavedDoorHeightFromOptions(opts, ctx, setSelectValueFromSaved, stats) {
    if (!opts) return;
    ctx = ctx || {};
    var getSavedOptionValue = ctx.getSavedOptionValue || deps.getSavedOptionValue;
    if (typeof getSavedOptionValue !== 'function') return;
    var h = getSavedOptionValue(opts, 'door_height');
    var hf = getSavedOptionValue(opts, 'door_height_fraction');
    if (h == null || h === '') return;
    if (isPetGatesCollection()) {
      var hn = parseInt(h, 10);
      if (isFinite(hn)) {
        if (hn < PET_GATES_DOOR_HEIGHT_MIN) h = String(PET_GATES_DOOR_HEIGHT_MIN);
        else if (hn > PET_GATES_DOOR_HEIGHT_MAX) h = String(PET_GATES_DOOR_HEIGHT_MAX);
      }
    }
    all('select#door_height', document).forEach(function (sel) {
      applySavedValueToMeasurementSelect(sel, h, setSelectValueFromSaved, stats);
    });
    if (hf != null && hf !== '') {
      all('select#door_height_fraction, select#door_height_frac', document).forEach(function (sel) {
        applySavedValueToMeasurementSelect(sel, hf, setSelectValueFromSaved, stats);
      });
    }
  }

  function syncMeasurementUiAfterSavedRestore(opts, ctx) {
    ctx = ctx || {};
    var normSavedOptionKey = ctx.normSavedOptionKey || deps.normSavedOptionKey;
    var container = document.getElementById('door-configurator-options');
    var schema = doorConfigSchemaRef();
    if (!container || !schema || !opts) return;
    var getSavedOptionValue = ctx.getSavedOptionValue || deps.getSavedOptionValue;
    if (typeof getSavedOptionValue !== 'function') return;
    hydrateMeasurementOptionsFromSummary(opts, ctx);
    var mt = getSavedOptionValue(opts, 'measurement_type');
    if (!mt) {
      mt = inferMeasurementTypeFromSummary(opts);
      if (mt) setSavedOptionValue(opts, 'measurement_type', mt);
    }
    if (!mt) return;
    var radio = null;
    all('input[type="radio"][data-option-id="measurement_type"]', container).forEach(function (r) {
      if (radio) return;
      if (String(r.value) === String(mt) || (typeof normSavedOptionKey === 'function' && normSavedOptionKey(r.value) === normSavedOptionKey(mt))) {
        radio = r;
      }
    });
    if (radio) {
      radio.checked = true;
      try {
        applyMeasurementTypeTabSelection(radio, 'measurement_type', container, schema);
      } catch (eMeasTab) {}
    }
    try { runMeasurementUiSync(); } catch (eMeasSync) {}
    try { syncMeasurementTypeDetailsVisibility(container, schema); } catch (eMeasVis) {}
    if (typeof ctx.setSelectValueFromSaved === 'function' || typeof deps.setSelectValueFromSaved === 'function') {
      applyMeasurementSelectsFromSavedOptions(opts, ctx);
    }
  }

  window.DoorConf2Measurements = window.DoorConf2Measurements || {};
  window.DoorConf2Measurements.init = function (d) { deps = d || {}; };
  window.DoorConf2Measurements.runMeasurementUiSync = runMeasurementUiSync;
  window.DoorConf2Measurements.applyMeasurementTypeTabSelection = applyMeasurementTypeTabSelection;
  window.DoorConf2Measurements.syncMeasurementTypeDetailsVisibility = syncMeasurementTypeDetailsVisibility;
  window.DoorConf2Measurements.syncSlabSidelightMeasurementUI = syncSlabSidelightMeasurementUI;
  window.DoorConf2Measurements.syncMeasurementTabCardVisibility = syncMeasurementTabCardVisibility;
  window.DoorConf2Measurements.syncMeasurementTypeSectionPreHungGate = syncMeasurementTypeSectionPreHungGate;
  window.DoorConf2Measurements.syncHingeFinishVisibility = syncHingeFinishVisibility;
  window.DoorConf2Measurements.syncMeasurementTabVisibilityCore = syncMeasurementTabVisibilityCore;
  window.DoorConf2Measurements.linkStaticMeasurementRowsToSchema = linkStaticMeasurementRowsToSchema;
  window.DoorConf2Measurements.assignStaticMeasurementRowSelectIds = assignStaticMeasurementRowSelectIds;
  window.DoorConf2Measurements.fixPanelDoorWidthAndTransomHeightOptionRanges = fixPanelDoorWidthAndTransomHeightOptionRanges;
  window.DoorConf2Measurements.applyFinishedRoughWidthIntDefaults = applyFinishedRoughWidthIntDefaults;
  window.DoorConf2Measurements.applyStaticMeasurementDimensionDefaults = applyStaticMeasurementDimensionDefaults;
  window.DoorConf2Measurements.getDefaultExactDoorThicknessFracValue = getDefaultExactDoorThicknessFracValue;
  window.DoorConf2Measurements.getDefaultExactDoorHeightInt = getDefaultExactDoorHeightInt;
  window.DoorConf2Measurements.resetPetGatesMeasurementOnTabChange = resetPetGatesMeasurementOnTabChange;
  window.DoorConf2Measurements.logPetGatesPricing = logPetGatesPricing;
  window.DoorConf2Measurements.findPetGatesExactMeasureSelect = findPetGatesExactMeasureSelect;
  window.DoorConf2Measurements.syncPetGatesMeasurementPrice = syncPetGatesMeasurementPrice;
  window.DoorConf2Measurements.readPetGatesExactMeasureInchesFromDom = readPetGatesExactMeasureInchesFromDom;
  window.DoorConf2Measurements.findPetGatesCatalogPrice = findPetGatesCatalogPrice;
  window.DoorConf2Measurements.isPetGatesExactMeasureSelectEl = isPetGatesExactMeasureSelectEl;
  window.DoorConf2Measurements.applyDefaultExactDoorThicknessFracSelects = applyDefaultExactDoorThicknessFracSelects;
  window.DoorConf2Measurements.assignUniqueOptionIds = assignUniqueOptionIds;
  window.DoorConf2Measurements.recordDoorSelectMeta = recordDoorSelectMeta;
  window.DoorConf2Measurements.getDoorSelectionMetaBySelectId = function () { return doorSelectionMetaBySelectId; };
  window.DoorConf2Measurements.getDoorLastSelectionMeta = function () { return doorLastSelectionMeta; };
  window.DoorConf2Measurements.buildMeasurementTypeTabOptionList = buildMeasurementTypeTabOptionList;
  window.DoorConf2Measurements.findPreHungStyleOption = findPreHungStyleOption;
  window.DoorConf2Measurements.getPreHungDoorSetupChoices = getPreHungDoorSetupChoices;
  window.DoorConf2Measurements.initializePanelUnitDesignSections = initializePanelUnitDesignSections;
  window.DoorConf2Measurements.appendStaticPanelUnitDesignSection = appendStaticPanelUnitDesignSection;
  window.DoorConf2Measurements.schemaIncludesPanelUnitDesignOption = schemaIncludesPanelUnitDesignOption;
  window.DoorConf2Measurements.productIsPorchPanelProduct = productIsPorchPanelProduct;
  window.DoorConf2Measurements.panelUnitDesignSectionExists = panelUnitDesignSectionExists;
  window.DoorConf2Measurements.optionIsPanelUnitDesign = optionIsPanelUnitDesign;
  window.DoorConf2Measurements.isGateCollectionAllowedMeasureTab = isGateCollectionAllowedMeasureTab;
  window.DoorConf2Measurements.applyGateCollectionThicknessFracSelects = applyGateCollectionThicknessFracSelects;
  window.DoorConf2Measurements.isGardenGatesCollection = isGardenGatesCollection;
  window.DoorConf2Measurements.isGateCollection = isGateCollection;
  window.DoorConf2Measurements.isPetGatesCollection = isPetGatesCollection;
  window.DoorConf2Measurements.applyPetGatesDoorHeightSelectRange = applyPetGatesDoorHeightSelectRange;
  window.DoorConf2Measurements.applyPetGatesMeasurementDimensionCopy = applyPetGatesMeasurementDimensionCopy;
  window.DoorConf2Measurements.petGatesExactMeasureTitleCopy = petGatesExactMeasureTitleCopy;
  window.DoorConf2Measurements.petGatesExactMeasureHintCopy = petGatesExactMeasureHintCopy;
  window.DoorConf2Measurements.applyGardenGatesCollectionRules = applyGardenGatesCollectionRules;
  window.DoorConf2Measurements.measurementSchemaUsesJsonVisibility = measurementSchemaUsesJsonVisibility;
  window.DoorConf2Measurements.isMeasurementTypeOptionId = isMeasurementTypeOptionId;
  window.DoorConf2Measurements.measurementModeFromCheckedTab = measurementModeFromCheckedTab;
  window.DoorConf2Measurements.syncMeasurementSelectedPriceLabels = syncMeasurementSelectedPriceLabels;
  window.DoorConf2Measurements.hydrateMeasurementOptionsFromSummary = hydrateMeasurementOptionsFromSummary;
  window.DoorConf2Measurements.applyMeasurementSelectsFromSavedOptions = applyMeasurementSelectsFromSavedOptions;
  window.DoorConf2Measurements.syncMeasurementUiAfterSavedRestore = syncMeasurementUiAfterSavedRestore;
  window.DoorConf2Measurements.displayLabelForMeasurementTabChoice = displayLabelForMeasurementTabChoice;
  window.DoorConf2Measurements.isMeasurementSidelightTransomTabValue = isMeasurementSidelightTransomTabValue;
  window.DoorConf2Measurements.resolveMeasurementTabProductTagShouldHide = resolveMeasurementTabProductTagShouldHide;
  window.DoorConf2Measurements.isPanelUnitDesignSectionEl = isPanelUnitDesignSectionEl;

  try {
    if (typeof location !== 'undefined' && /door_saved_restore_debug/i.test(String(location.search || ''))) {
      if (typeof window.__doorSavedRestoreDebug === 'function') {
        window.__doorSavedRestoreDebug('measurements.js loaded', { build: '20260604b' });
      }
    }
  } catch (eMeasBoot) {}
  bindPetGatesMeasurementPricing();
})();