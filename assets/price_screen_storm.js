// price_screen_storm.js
// Screen and Storm door pricing via pricing_rule_screen_storm metaobjects.
//
// Storefront include:
//   {{ 'price_screen_storm.js' | asset_url | script_tag | defer }}

(function () {
  if (window.PriceScreenStorm) return;

  function isDoorPricingApiEnabled() {
    try { return !window.__doorSelectionLogOnly; } catch (e) { return true; }
  }

  function emptyScreenStormProxyResponse() {
    return Promise.resolve({ price: 0, records: [], matched: false, response: {} });
  }

  /** Console: filter by "door-pricing". Opt in with ?door_price_debug=1 or window.DOOR_PRICE_DEBUG = true */
  if (typeof window.DOOR_PRICE_DEBUG === 'undefined') {
    try {
      window.DOOR_PRICE_DEBUG = /(?:\?|&)door_price_debug=1(?:&|$)/i.test(String((window.location && window.location.search) || ''));
    } catch (eDbgInit) {
      window.DOOR_PRICE_DEBUG = false;
    }
  }
  /** Opt-in console trace — ?door_price_debug=1 or window.DOOR_SCREEN_STORM_TABLE_KEY_DEBUG = true */
  function isScreenStormTableKeyDebugEnabled() {
    try {
      if (window.DOOR_SCREEN_STORM_TABLE_KEY_DEBUG === true) return true;
      if (window.DOOR_SCREEN_STORM_TABLE_KEY_DEBUG === false) return false;
      return window.DOOR_PRICE_DEBUG === true;
    } catch (eDbgFlag) {}
    return false;
  }

  function consoleLogEstimatedPrice(payload) {
    if (!isScreenStormTableKeyDebugEnabled()) return;
    try {
      console.log('[door-pricing] estimated price', payload || {});
    } catch (eEst) {}
  }

  function consoleLogScreenStormApiResponse(detail) {
    if (!isScreenStormTableKeyDebugEnabled()) return;
    try {
      var d = detail && typeof detail === 'object' ? detail : {};
      console.log('[screen-storm][api_response]', {
        tableKey: d.tableKey != null ? String(d.tableKey) : '',
        source: d.source || '',
        url: d.url || '',
        widthRange: d.widthRange || '',
        heightRange: d.heightRange || '',
        price: d.price,
        matched_count: d.matched_count,
        apiRecord: d.apiRecord || null
      });
    } catch (eLog) {}
  }

  function consoleLogScreenStormWidthHeightRangeApi(detail) {
    if (!isScreenStormTableKeyDebugEnabled()) return;
    try {
      console.log('[screen-storm][width_height_range][api]', detail || {});
    } catch (eApi) {}
  }
  var doorStormDebugAddonBatch = null;
  var doorStormDebugAddonBatchTimer = null;

  function flushDoorStormAddonDebugBatch() {
    doorStormDebugAddonBatchTimer = null;
    if (!doorStormDebugAddonBatch || !doorStormDebugAddonBatch.length) return;
    if (!isScreenStormTableKeyDebugEnabled()) {
      doorStormDebugAddonBatch = null;
      return;
    }
    try {
      var line = '[door-pricing][price_screen_storm][addons_summary]';

      console.log(line, {
        count: doorStormDebugAddonBatch.length,
        addons: doorStormDebugAddonBatch
      });
    } catch (eFlush) {}
    doorStormDebugAddonBatch = null;
  }

  function doorPriceDebugLog(tag, payload) {
    try {
      if (window.DOOR_PRICE_DEBUG === false) return;
      if (tag === 'addon_set' || tag === 'addon_direct_write') {
        doorStormDebugAddonBatch = doorStormDebugAddonBatch || [];
        doorStormDebugAddonBatch.push({
          tag: tag,
          payload: payload || {}
        });
        if (!doorStormDebugAddonBatchTimer) {
          doorStormDebugAddonBatchTimer = setTimeout(flushDoorStormAddonDebugBatch, 120);
        }
      }
    } catch (eDbg) {}
  }

  function formatScreenStormRangeLabel(min, max) {
    return String(min) + '_' + String(max);
  }

  function parseScreenStormTableKeyRanges(tableKey) {
    var key = String(tableKey || '').trim();
    if (!key) return null;
    var m = key.match(/_(\d+)_(\d+)_(\d+)_(\d+)$/);
    if (!m) return null;
    return {
      widthMin: parseInt(m[1], 10),
      widthMax: parseInt(m[2], 10),
      heightMin: parseInt(m[3], 10),
      heightMax: parseInt(m[4], 10),
      widthRange: m[1] + '_' + m[2],
      heightRange: m[3] + '_' + m[4]
    };
  }

  function logScreenStormWidthHeightRangeLookup(width, height, meta, bucketIn) {
    if (!isScreenStormTableKeyDebugEnabled()) return;
    try {
      var bucket = bucketIn || resolveScreenStormThicknessBuckets(width, height);
      var wRounded = measureInchesForScreenStormChart(width);
      var hRounded = measureInchesForScreenStormChart(height);
      var widthRange = bucket ? formatScreenStormRangeLabel(bucket.widthMin, bucket.widthMax) : '';
      var heightRange = bucket ? formatScreenStormRangeLabel(bucket.heightMin, bucket.heightMax) : '';
      var prefix = meta && meta.prefix ? String(meta.prefix) : '';
      var tableKey = bucket && prefix
        ? prefix + '_' + widthRange + '_' + heightRange
        : (meta && meta.tableKey ? String(meta.tableKey) : '');
      var widthBuckets = typeof SCREEN_STORM_THICKNESS_WIDTH_BUCKETS !== 'undefined'
        ? SCREEN_STORM_THICKNESS_WIDTH_BUCKETS : [];
      var heightBuckets = typeof SCREEN_STORM_THICKNESS_HEIGHT_BUCKETS !== 'undefined'
        ? SCREEN_STORM_THICKNESS_HEIGHT_BUCKETS : [];
      console.log('[screen-storm][width_height_range]', {
        source: meta && meta.source ? meta.source : '',
        fieldId: meta && meta.fieldId ? meta.fieldId : '',
        widthInches: width,
        widthRounded: wRounded,
        widthRange: widthRange,
        heightInches: height,
        heightRounded: hRounded,
        heightRange: heightRange,
        tableKey: tableKey,
        widthBucketsAvailable: widthBuckets.map(function (b) {
          return formatScreenStormRangeLabel(b.min, b.max);
        }),
        heightBucketsAvailable: heightBuckets.map(function (b) {
          return formatScreenStormRangeLabel(b.min, b.max);
        })
      });
    } catch (eRange) {}
  }

  function readScreenStormEstimatedPriceFromDom() {
    try {
      if (
        window.DoorIntExtPricingRule
        && typeof window.DoorIntExtPricingRule.readEstimatedPriceFromDom === 'function'
      ) {
        return window.DoorIntExtPricingRule.readEstimatedPriceFromDom();
      }
      var el = document.getElementById('door-estimated-price');
      if (!el) return 0;
      return parseMoneyText(el.textContent);
    } catch (eRead) {}
    return 0;
  }

  /** Force layered total into #door-estimated-price when async API add-on was stored but DOM lagged. */
  function computeScreenStormLayeredDisplayTotal() {
    var theme = parseFloat(window.__doorThemeOptionTotal) || 0;
    var intExt = 0;
    try {
      if (
        window.DoorIntExtPricingRule
        && typeof window.DoorIntExtPricingRule.getThemeOptionTotal === 'function'
      ) {
        var themeFromRule = window.DoorIntExtPricingRule.getThemeOptionTotal();
        if (themeFromRule > theme) theme = themeFromRule;
      }
      if (
        window.DoorIntExtPricingRule
        && typeof window.DoorIntExtPricingRule.getDoorAddonTotalSum === 'function'
      ) {
        intExt = window.DoorIntExtPricingRule.getDoorAddonTotalSum() || 0;
      }
    } catch (eLayer) {}
    var layer = getScreenStormAddonTotalSum();
    return theme + intExt + layer;
  }

  function ensureScreenStormPriceAppliedToDom(meta) {
    try {
      if (
        !window.DoorIntExtPricingRule
        || typeof window.DoorIntExtPricingRule.writeEstimatedPriceDisplay !== 'function'
      ) {
        return false;
      }
      var layer = getScreenStormAddonTotalSum();
      if (layer < 0.01) return false;
      var expected = computeScreenStormLayeredDisplayTotal();
      var shown = readScreenStormEstimatedPriceFromDom();
      if (shown > 0 && Math.abs(shown - expected) < 0.05) return true;
      window.DoorIntExtPricingRule.writeEstimatedPriceDisplay(expected, Object.assign({
        source: 'ensureScreenStormPriceAppliedToDom',
        userAction: true,
        forceLog: true,
        screenStormAddon: layer,
        displayTotal: expected
      }, meta || {}));
      doorPriceDebugLog('ensure_applied', {
        shownBefore: shown,
        expected: expected,
        layer: layer,
        oversized: parseFloat(window.__doorScreenStormAddon_oversized || 0) || 0,
        meta: meta || null
      });
      return true;
    } catch (eEnsure) {
      return false;
    }
  }

  function writeScreenStormEstimatedPrice(amount, meta) {
    if (
      window.DoorIntExtPricingRule
      && typeof window.DoorIntExtPricingRule.writeEstimatedPriceDisplay === 'function'
    ) {
      return window.DoorIntExtPricingRule.writeEstimatedPriceDisplay(amount, meta || { source: 'price_screen_storm' });
    }
    var formatted = formatMoney(amount);
    var nodes = document.querySelectorAll('#door-estimated-price');
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = formatted;
  }

  try { if (window.__doorScreenStormPricingToken == null) window.__doorScreenStormPricingToken = 0; } catch (e1) { }
  try { if (window.__doorScreenStormSidelightPricingToken == null) window.__doorScreenStormSidelightPricingToken = 0; } catch (e2) { }
  try { if (window.__doorScreenStormPanelThicknessExtraToken == null) window.__doorScreenStormPanelThicknessExtraToken = 0; } catch (e3) { }

  var SCREEN_STORM_USER_THICKNESS_LOCK_MS = 30000;

  function isScreenStormUserThicknessRecentlySet() {
    var userSetAt = window.__screenStormUserSetThicknessAt || 0;
    if (!userSetAt) return false;
    return (Date.now() - userSetAt) < SCREEN_STORM_USER_THICKNESS_LOCK_MS;
  }

  function isScreenStormUserPanelThicknessRecentlySet() {
    var userSetAt = window.__screenStormUserSetPanelThicknessAt || 0;
    if (!userSetAt) return false;
    return (Date.now() - userSetAt) < SCREEN_STORM_USER_THICKNESS_LOCK_MS;
  }

  function norm(v) {
    return String(v == null ? '' : v).trim().toLowerCase().replace(/[\s-]+/g, '_');
  }

  function toNum(n) {
    var x = parseFloat(n);
    return isNaN(x) ? 0 : x;
  }

  function approxEq(a, b, eps) {
    var x = parseFloat(a);
    var y = parseFloat(b);
    var e = eps == null ? 0.02 : eps;
    if (isNaN(x) || isNaN(y)) return false;
    return Math.abs(x - y) <= e;
  }

  function parseFractionValue(v) {
    if (v == null) return 0;
    var s = String(v).trim();
    if (!s) return 0;
    if (s === '½') return 0.5;
    if (s === '¼') return 0.25;
    if (s === '¾') return 0.75;
    if (s.indexOf('/') !== -1) {
      var parts = s.split('/');
      if (parts.length >= 2) {
        var a = toNum(parts[0]);
        var b = toNum(parts[1]);
        if (b) return a / b;
      }
    }
    return toNum(s);
  }

  function parseDropdownNumber(v) {
    if (v == null) return 0;
    var s = String(v).trim();
    if (!s) return 0;
    var x = parseFloat(s);
    return isNaN(x) ? parseFractionValue(s) : x;
  }

  /** Option text/value like "17 to 20" or "17-20" → midpoint inches for chart rows (10–23). */
  function parseInchesFromPanelOptionValue(v) {
    if (v == null) return 0;
    var s = String(v).trim();
    if (!s) return 0;
    var rangeM = s.match(/(\d+(?:\.\d+)?)\s*(?:to|through|-|–|_|\/)\s*(\d+(?:\.\d+)?)/i);
    if (rangeM) {
      var a = toNum(rangeM[1]);
      var b = toNum(rangeM[2]);
      if (a > 0 && b >= a) return Math.round((a + b) / 2);
    }
    return parseDropdownNumber(s);
  }

  /**
   * Int + matching frac for ids like panel-door-width-int__27_0 / panel-door-width-frac__27_0.
   */
  function readPairedPanelIntFracInches(intPrefix, fracPrefix) {
    try {
      var candidates = document.querySelectorAll('[id^="' + intPrefix + '"]');
      var intEl = null;
      for (var i = 0; i < candidates.length; i++) {
        var el = candidates[i];
        if (el && el.offsetParent !== null) {
          intEl = el;
          break;
        }
      }
      if (!intEl && candidates.length) intEl = candidates[0];
      if (!intEl) return 0;
      var fullId = String(intEl.id || '');
      var suffix = fullId.indexOf(intPrefix) === 0 ? fullId.slice(intPrefix.length) : '';
      var fracId = fracPrefix + suffix;
      var fracEl = document.getElementById(fracId);
      if (!fracEl && intEl.closest) {
        var row = intEl.closest('.door-measure-dimension-inputs-row')
          || intEl.closest('.door-measure-dimension-row')
          || intEl.closest('.door-option-wrap');
        if (row) fracEl = row.querySelector('[id^="' + fracPrefix + '"]');
      }
      if (!fracEl) {
        var fc = document.querySelectorAll('[id^="' + fracPrefix + '"]');
        fracEl = fc.length ? fc[0] : null;
      }
      var intRaw = intEl.value != null ? intEl.value : '';
      var intPart = parseInchesFromPanelOptionValue(intRaw) || toNum(intRaw);
      return intPart + parseDropdownNumber(fracEl && fracEl.value);
    } catch (e) { }
    return 0;
  }

  function getVisibleById(id) {
    try {
      var els = document.querySelectorAll('#' + String(id).replace(/[^a-zA-Z0-9_-]/g, ''));
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        if (el && el.offsetParent !== null) return el;
      }
      return els && els.length ? els[0] : null;
    } catch (e) { }
    return null;
  }

  /** True when sidelight width or transom height UI is visible (panel door thickness applies in that context). */
  function isScreenStormSidelightOrTransomPanelRowVisible() {
    try {
      if (getVisibleById('sidelight_width')) return true;
      if (getVisibleById('panel-transom-height-int')) return true;
      var nodes = document.querySelectorAll('[id^="panel-transom-height-int"]');
      for (var i = 0; i < nodes.length; i++) {
        if (nodes[i] && nodes[i].offsetParent !== null) return true;
      }
      var sw = document.querySelectorAll('#sidelight_width, [id^="sidelight_width"]');
      for (var j = 0; j < sw.length; j++) {
        var el = sw[j];
        if (!el || !el.id || String(el.id).indexOf('fraction') !== -1) continue;
        if (el.offsetParent !== null) return true;
      }
    } catch (e) { }
    return false;
  }

  /** Parse panel thickness select values like "1 1/4", "1.25", "2-1/4". */
  function parsePanelThicknessInches(v) {
    if (v == null) return 0;
    var s = String(v).trim();
    if (!s) return 0;
    var m = s.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
    if (m) {
      var den = toNum(m[3]);
      if (!den) return 0;
      return toNum(m[1]) + toNum(m[2]) / den;
    }
    m = s.match(/^(\d+)\s*-\s*(\d+)\s*\/\s*(\d+)$/);
    if (m) {
      var den2 = toNum(m[3]);
      if (!den2) return 0;
      return toNum(m[1]) + toNum(m[2]) / den2;
    }
    return parseDropdownNumber(s);
  }

  function getVisiblePanelDoorThicknessFracEl() {
    try {
      if (isScreenStormSidelightAndTransomComboSelected()) {
        return document.getElementById('panel-door-thickness-frac__33_0');
      }
      if (isScreenStormTransomStyleSelected()) {
        return document.getElementById('panel-door-thickness-frac__29_0');
      }
      if (isScreenStormSidelightStyleSelected()) {
        return document.getElementById('panel-door-thickness-frac');
      }
    } catch (e) { }
    return null;
  }

  function parseMoneyText(s) {
    var cleaned = String(s == null ? '' : s).replace(/[^0-9.\-]+/g, '');
    var n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  }

  function formatMoney(n) {
    var x = parseFloat(n);
    if (isNaN(x)) x = 0;
    return '$' + x.toFixed(2);
  }

  function isScreenAndStormDoorsProductType() {
    try {
      var container = document.getElementById('door-configurator');
      if (!container) return false;

      var productType = String(container.getAttribute('data-product-type') || '').trim();
      if (norm(productType) === 'screen_and_storm_doors') return true;

      var tagsAttr = container.getAttribute('data-product-tags') || '';
      var tags = [];
      try {
        tags = Array.isArray(JSON.parse(tagsAttr)) ? JSON.parse(tagsAttr) : [];
      } catch (e1) {
        tags = String(tagsAttr || '').split('|');
      }
      for (var i = 0; i < tags.length; i++) {
        var t = norm(tags[i]);
        if (t === 'screen_and_storm_doors' || t === 'screen_and_storm_doors_tags') return true;
      }
    } catch (e) { }
    return false;
  }

  function anySelectedChoiceValueEquals(targetChoiceValue) {
    var want = norm(targetChoiceValue);
    try {
      var optionsContainer = document.getElementById('door-configurator-options');
      if (!optionsContainer) return false;
      var nodes = optionsContainer.querySelectorAll('[data-choice-value]');
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (!node) continue;
        if (norm(node.getAttribute('data-choice-value')) !== want) continue;
        var checked = node.querySelector('input[type="radio"]:checked, input[type="checkbox"]:checked');
        if (checked) return true;
        var aria = (node.getAttribute('aria-checked') || '').toLowerCase();
        if (aria === 'true') return true;
      }
    } catch (e) { }
    return false;
  }

  function anySelectedValueEquals(targetValue) {
    var targetNorm = norm(targetValue);
    try {
      var optionsContainer = document.getElementById('door-configurator-options');
      if (!optionsContainer) return false;
      var els = optionsContainer.querySelectorAll('input, select, textarea');
      for (var k = 0; k < els.length; k++) {
        var el = els[k];
        if (!el) continue;
        var tag = (el.tagName || '').toLowerCase();
        var type = (el.type || '').toLowerCase();
        if (tag === 'input' && (type === 'checkbox' || type === 'radio')) {
          if (!el.checked) continue;
          if (norm(el.value) === targetNorm) return true;
        } else if (norm(el.value) === targetNorm) {
          return true;
        }
      }
    } catch (e) { }
    return false;
  }

  function getDoorSetupFromDom() {
    if (anySelectedChoiceValueEquals('pre_hung_on_jamb') || anySelectedValueEquals('pre_hung_on_jamb')) {
      return 'pre_hung_on_jamb';
    }
    if (anySelectedChoiceValueEquals('slab_only') || anySelectedValueEquals('slab_only')) {
      return 'slab_only';
    }
    try {
      var optionsContainer = document.getElementById('door-configurator-options') || document;
      if (optionsContainer.querySelector('input[value="pre_hung_on_jamb"]:checked')) {
        return 'pre_hung_on_jamb';
      }
      if (optionsContainer.querySelector('input[value="slab_only"]:checked')) {
        return 'slab_only';
      }
    } catch (e) { }
    return '';
  }

  function computeScreenStormOversizedPrefix() {
    var setup = getDoorSetupFromDom();
    if (setup === 'pre_hung_on_jamb') return 'screen_storm_prehung_oversized';
    if (setup === 'slab_only') return 'screen_storm_slab_only_oversized';
    return '';
  }

  function isScreenStormSidelightStyleSelected() {
    try {
      var root = document.getElementById('door-configurator-options') || document;
      var checked = root.querySelector('input[type="radio"][data-option-id="sidelight_style"]:checked');
      if (checked) return true;
      var sel = root.querySelector('select[data-option-id="sidelight_style"]');
      if (sel && sel.value != null) {
        var v = String(sel.value).trim();
        if (v !== '' && v !== '0') return true;
      }
      var name = 'attributes[Select your sidelight style]';
      if (root.querySelector('input[type="radio"][name="' + name + '"]:checked')) return true;
    } catch (e) { }
    return false;
  }

  function getSidelightCount() {
    try {
      var root = document.getElementById('door-configurator-options') || document;
      var val = '';
      var checked = root.querySelector('input[type="radio"][data-option-id="sidelight_style"]:checked');
      if (checked) {
        val = String(checked.value || checked.getAttribute('data-choice-value') || '');
      } else {
        var sel = root.querySelector('select[data-option-id="sidelight_style"]');
        if (sel && sel.value != null) {
          val = String(sel.value);
        } else {
          var name = 'attributes[Select your sidelight style]';
          var checkedName = root.querySelector('input[type="radio"][name="' + name + '"]:checked');
          if (checkedName) {
            val = String(checkedName.value || checkedName.getAttribute('data-choice-value') || '');
          } else {
            var selName = root.querySelector('select[name="' + name + '"]');
            if (selName && selName.value != null) {
              val = String(selName.value);
            }
          }
        }
      }
      val = val.trim().toLowerCase();
      if (!val || val === '0' || val === 'none' || val === 'no') return 0;
      if (val.indexOf('two') !== -1 || val.indexOf('pair') !== -1 || val.indexOf('double') !== -1 || val.indexOf('2') !== -1 || val.indexOf('both') !== -1) {
        return 2;
      }
      return 1;
    } catch (e) { }
    return 1;
  }

  function isScreenStormTransomStyleSelected() {
    try {
      var root = document.getElementById('door-configurator-options') || document;
      var checked = root.querySelector(
        'input[type="radio"][data-option-id="transom_style"]:checked,' +
        'input[type="radio"][name="attributes[Transom Style]"]:checked'
      );
      if (checked) return true;
      var sel = root.querySelector(
        'select[data-option-id="transom_style"],' +
        'select[name="attributes[Transom Style]"]'
      );
      if (sel && sel.value != null) {
        var v = String(sel.value).trim();
        if (v !== '' && v !== '0') return true;
      }
    } catch (e) { }
    return false;
  }

  function isScreenStormSidelightOrTransomStyleSelected() {
    return isScreenStormSidelightStyleSelected() || isScreenStormTransomStyleSelected();
  }

  function isScreenStormSidelightAndTransomComboSelected() {
    return isScreenStormSidelightStyleSelected() && isScreenStormTransomStyleSelected();
  }

  function readThicknessFromDom() {
    try {
      if (
        isScreenAndStormDoorsProductType()
        && !screenStormThicknessUpgradePricingEnabled()
        && !screenStormPanelThicknessExtraPricingEnabled()
      ) {
        return 0;
      }

      var singles = getVisiblePlainDoorThicknessFracSelects();
      for (var si = 0; si < singles.length; si++) {
        var single = singles[si];
        if (!single || single.offsetParent === null) continue;
        if (single.value != null && String(single.value).trim() !== '') {
          var parsedSingle = parseDropdownNumber(single.value);
          if (parsedSingle > 0) return parsedSingle;
        }
      }

      var intEl = getVisibleById('exact-door-thickness-int');
      var fracEl = getVisibleById('exact-door-thickness-frac');
      if (intEl || fracEl) {
        var parsed = toNum(intEl && intEl.value) + parseDropdownNumber(fracEl && fracEl.value);
        if (parsed > 0) return parsed;
      }

      if (typeof window.__lastDoorThicknessInches === 'number' && window.__lastDoorThicknessInches > 0) {
        return window.__lastDoorThicknessInches;
      }

      var fallbackSingles = findPlainDoorThicknessFracSelectNodes();
      for (var fi = 0; fi < fallbackSingles.length; fi++) {
        var fb = fallbackSingles[fi];
        if (!fb || fb.value == null || String(fb.value).trim() === '') continue;
        var parsedFb = parseDropdownNumber(fb.value);
        if (parsedFb > 0) return parsedFb;
      }
    } catch (e) { }
    return 0;
  }

  function combineIntAndFractionInches(intPart, fracPart) {
    var whole = toNum(intPart);
    var frac = parseDropdownNumber(fracPart);
    if (frac < 0) frac = 0;
    return whole + frac;
  }

  function readIntFracPairFromSelects(intEl, fracEl) {
    return combineIntAndFractionInches(intEl && intEl.value, fracEl && fracEl.value);
  }

  function readIntFracPairFromMeasurementEventTarget(t) {
    if (!t || !t.closest) return null;
    var row = t.closest('.door-measure-dimension-inputs-row') || t.closest('.door-measure-dimension-row');
    if (!row) return null;
    var intEl = row.querySelector('select.door-dimension-int-select');
    var fracEl = row.querySelector('select.door-dimension-frac-select');
    if (!intEl && !fracEl) return null;
    return readIntFracPairFromSelects(intEl, fracEl);
  }

  function isExactDoorWidthMeasurementTarget(t) {
    if (!t) return false;
    var id = String(t.id || '');
    if (
      id === 'exact-door-width-int'
      || id === 'exact-door-width-frac'
      || id.indexOf('exact-door-width-int') === 0
      || id.indexOf('exact-door-width-frac') === 0
      || id === 'finished-width-int'
      || id === 'finished-width-frac'
    ) return true;
    if (t.tagName === 'SELECT' && t.closest) {
      var row = t.closest('.door-measure-dimension-row');
      if (!row) return false;
      var title = String((row.querySelector('.door-measure-dimension-title') || {}).textContent || '').toLowerCase();
      return title.indexOf('exact door width') !== -1 || title.indexOf('finished opening width') !== -1;
    }
    return false;
  }

  function isExactDoorHeightMeasurementTarget(t) {
    if (!t) return false;
    var id = String(t.id || '');
    if (
      id === 'door_height'
      || id === 'door_height_fraction'
      || id.indexOf('door_height') === 0
      || id === 'finished-height-int'
      || id === 'finished-height-frac'
    ) return true;
    if (t.tagName === 'SELECT' && t.closest) {
      var row = t.closest('.door-measure-dimension-row');
      if (!row) return false;
      var title = String((row.querySelector('.door-measure-dimension-title') || {}).textContent || '').toLowerCase();
      
      return title.indexOf('exact door height') !== -1 || title.indexOf('finished opening height') !== -1;
    }
    return false;
  }

  function readWidthFromDom(hintEl) {
    try {
      if (hintEl && isExactDoorWidthMeasurementTarget(hintEl)) {
        var fromChanged = readIntFracPairFromMeasurementEventTarget(hintEl);
        if (fromChanged > 0) return fromChanged;
      }
      if (
        window.DoorIntExtPricingRule
        && typeof window.DoorIntExtPricingRule.readDoorWidthInchesFromDom === 'function'
      ) {
        var fromRule = window.DoorIntExtPricingRule.readDoorWidthInchesFromDom(hintEl || null);
        if (fromRule > 0) return fromRule;
      }
      var panel = getScreenStormActiveMeasurementPanel();
      var scope = panel || document;
      var intCandidates = scope.querySelectorAll('#exact-door-width-int, [id^="exact-door-width-int"]');
      var intEl = null;
      for (var wi = 0; wi < intCandidates.length; wi++) {
        if (intCandidates[wi] && intCandidates[wi].offsetParent !== null) {
          intEl = intCandidates[wi];
          break;
        }
      }
      if (!intEl && intCandidates.length) intEl = intCandidates[0];
      if (!intEl) intEl = getVisibleById('exact-door-width-int') || document.getElementById('exact-door-width-int');
      var fracEl = null;
      if (intEl) {
        var intId = String(intEl.id || '');
        if (intId.indexOf('exact-door-width-int') === 0) {
          fracEl = document.getElementById('exact-door-width-frac' + intId.slice('exact-door-width-int'.length));
        }
        if (!fracEl && intEl.closest) {
          var widthRow = intEl.closest('.door-measure-dimension-row') || intEl.closest('.door-measure-dimension-inputs-row');
          if (widthRow) fracEl = widthRow.querySelector('#exact-door-width-frac, [id^="exact-door-width-frac"]');
        }
      }
      if (!fracEl) fracEl = getVisibleById('exact-door-width-frac') || document.getElementById('exact-door-width-frac');
      if (intEl || fracEl) {
        var fromPanel = readIntFracPairFromSelects(intEl, fracEl);
        if (fromPanel > 0) return fromPanel;
      }
      intEl = getVisibleById('exact-door-width-int') || document.getElementById('exact-door-width-int');
      fracEl = getVisibleById('exact-door-width-frac') || document.getElementById('exact-door-width-frac');
      if (intEl || fracEl) return readIntFracPairFromSelects(intEl, fracEl);
      var fromRow = readIntFracPairFromMeasurementEventTarget(hintEl);
      if (fromRow != null && fromRow > 0) return fromRow;
    } catch (e) { }
    return 0;
  }

  function readHeightFromDom(hintEl) {
    try {
      if (hintEl && isExactDoorHeightMeasurementTarget(hintEl)) {
        var fromChangedH = readIntFracPairFromMeasurementEventTarget(hintEl);
        if (fromChangedH > 0) return fromChangedH;
      }
      if (
        window.DoorIntExtPricingRule
        && typeof window.DoorIntExtPricingRule.readDoorHeightInchesFromDom === 'function'
      ) {
        var fromRule = window.DoorIntExtPricingRule.readDoorHeightInchesFromDom(hintEl || null);
        if (fromRule > 0) return fromRule;
      }
      var intEl = getVisibleById('door_height') || document.getElementById('door_height');
      var fracEl = getVisibleById('door_height_fraction') || document.getElementById('door_height_fraction');
      if (intEl || fracEl) return readIntFracPairFromSelects(intEl, fracEl);
      var fromRow = readIntFracPairFromMeasurementEventTarget(hintEl);
      if (fromRow != null && fromRow > 0) return fromRow;
    } catch (e) { }
    return 0;
  }

  function readSidelightWidthFromDom() {
    try {
      var intEl = getVisibleById('sidelight_width') || document.getElementById('sidelight_width');
      var fracEl = getVisibleById('sidelight_width_fraction') || document.getElementById('sidelight_width_fraction');
      if (!intEl && !fracEl) return 0;
      return toNum(intEl && intEl.value) + parseDropdownNumber(fracEl && fracEl.value);
    } catch (e) { }
    return 0;
  }

  function readSidelightWidthFromEventTarget(t) {
    try {
      if (!t || !t.closest) return 0;
      var row = t.closest('.door-measure-dimension-inputs-row') || t.closest('.door-measure-dimension-row') || t.closest('.door-option-wrap');
      if (!row) return readSidelightWidthFromDom();
      var intEl = row.querySelector('#sidelight_width') || row.querySelector('select.door-dimension-int-select');
      var fracEl = row.querySelector('#sidelight_width_fraction') || row.querySelector('select.door-dimension-frac-select');
      if (!intEl && !fracEl) return readSidelightWidthFromDom();
      return toNum(intEl && intEl.value) + parseDropdownNumber(fracEl && fracEl.value);
    } catch (e) { }
    return readSidelightWidthFromDom();
  }

  function readScreenStormProductBasePriceFromDom() {
    try {
      if (window.DoorConfiguratorPricing && typeof window.DoorConfiguratorPricing.getProductBasePrice === 'function') {
        return toNum(window.DoorConfiguratorPricing.getProductBasePrice());
      }
      var container = document.getElementById('door-configurator');
      if (!container) return 0;
      return toNum(container.getAttribute('data-base-price'));
    } catch (e) { }
    return 0;
  }

  function readSelectedWoodTypeStormPorchValueFromDom() {
    try {
      var root = document.getElementById('door-configurator-options') || document;
      var nm = 'attributes[Select Wood Type Storm and Porch]';

      // Try radio buttons first
      var checked = root.querySelector('input[type="radio"][name="' + nm + '"]:checked');
      if (!checked) checked = document.querySelector('input[type="radio"][name="' + nm + '"]:checked');
      if (checked && checked.value != null) return String(checked.value).trim();

      // Try select dropdown next
      var sel = root.querySelector('select[name="' + nm + '"]');
      if (!sel) sel = document.querySelector('select[name="' + nm + '"]');
      if (sel && sel.value != null) return String(sel.value).trim();

      // Try data-option-id fallback
      var optChecked = root.querySelector('input[type="radio"][data-option-id="wood_type_storm_porch"]:checked');
      if (optChecked && optChecked.value != null) return String(optChecked.value).trim();

      var optSel = root.querySelector('select[data-option-id="wood_type_storm_porch"]');
      if (optSel && optSel.value != null) return String(optSel.value).trim();
    } catch (e) { }
    return '';
  }

  function readSelectedWoodTypeStormPorchPriceValue() {
    try {
      if (window.DoorConfiguratorPricing && typeof window.DoorConfiguratorPricing.getSelectedWoodTypeStormPorchPriceValue === 'function') {
        return toNum(window.DoorConfiguratorPricing.getSelectedWoodTypeStormPorchPriceValue());
      }
    } catch (e0) { }
    try {
      var selected = readSelectedWoodTypeStormPorchValueFromDom();
      if (!selected) return 0;
      var schema = window.__doorConfigSchema;
      if (!Array.isArray(schema)) return 0;
      for (var i = 0; i < schema.length; i++) {
        var opt = schema[i];
        if (!opt) continue;
        var oid = String(opt.id || '');
        if (oid !== 'wood_type_storm_porch' && oid.indexOf('wood_type_storm') !== 0) continue;
        var choices = Array.isArray(opt.options) ? opt.options : [];
        for (var j = 0; j < choices.length; j++) {
          var ch = choices[j];
          if (String(ch && ch.value != null ? ch.value : '') !== selected) continue;
          return toNum(ch.priceValue != null ? ch.priceValue : ch.price_value);
        }
      }
    } catch (e) { }
    return 0;
  }

  /** Single slab: product base + selected storm/porch wood. */
  function computeScreenStormBasePlusWoodAddon() {
    return readScreenStormProductBasePriceFromDom() + readSelectedWoodTypeStormPorchPriceValue() * 2;
  }

  /** ≥ 24" sidelight/transom: 2× (product base + selected storm/porch wood) — e.g. $922.39 → $1844.78. */
  function computeScreenStormDoubleBasePlusDoubleWoodAddon() {
    return computeScreenStormBasePlusWoodAddon();
  }

  function applyScreenStormWideSidelightBasePlusWoodAddon(widthInches) {
    if (!isScreenAndStormDoorsProductType()) return;
    var w = widthInches != null && !isNaN(parseFloat(widthInches))
      ? parseFloat(widthInches)
      : readSidelightWidthFromDom();
    if (isNaN(w) || w < 24) {
      applyScreenStormAddonToEstimatedPrice(0, 'wide_sidelight_base_wood');
      return;
    }
    applyScreenStormAddonToEstimatedPrice(computeScreenStormDoubleBasePlusDoubleWoodAddon(), 'wide_sidelight_base_wood');
  }

  function applyScreenStormTallTransomBasePlusWoodAddon(heightInches) {
    if (!isScreenAndStormDoorsProductType()) return;
    var h = heightInches != null && !isNaN(parseFloat(heightInches))
      ? parseFloat(heightInches)
      : readPanelTransomHeightFromDom();
    if (isNaN(h) || h < 24) {
      applyScreenStormAddonToEstimatedPrice(0, 'tall_transom_base_wood');
      return;
    }
    applyScreenStormAddonToEstimatedPrice(computeScreenStormDoubleBasePlusDoubleWoodAddon(), 'tall_transom_base_wood');
  }

  function readPanelTransomHeightFromDom() {
    return readPairedPanelIntFracInches('panel-transom-height-int', 'panel-transom-height-frac');
  }

  function readPanelTransomHeightFromEventTarget(t) {
    try {
      if (!t || !t.closest) return 0;
      var id = String(t.id || '');
      if (id !== 'panel-transom-height-int' && id !== 'panel-transom-height-frac'
        && id.indexOf('panel-transom-height-int') !== 0 && id.indexOf('panel-transom-height-frac') !== 0) {
        return 0;
      }
      var row = t.closest('.door-measure-dimension-inputs-row') || t.closest('.door-measure-dimension-row') || t.closest('.door-option-wrap');
      if (!row) return readPanelTransomHeightFromDom();
      var intEl = row.querySelector('#panel-transom-height-int, select[id^="panel-transom-height-int"]');
      var fracEl = row.querySelector('#panel-transom-height-frac, select[id^="panel-transom-height-frac"]');
      if (!intEl && !fracEl) return readPanelTransomHeightFromDom();
      var intRaw = intEl && intEl.value;
      return (parseInchesFromPanelOptionValue(intRaw) || toNum(intRaw)) + parseDropdownNumber(fracEl && fracEl.value);
    } catch (e) { }
    return readPanelTransomHeightFromDom();
  }

  function readPanelDoorWidthFromDom() {
    return readPairedPanelIntFracInches('panel-door-width-int', 'panel-door-width-frac');
  }

  function readPanelDoorWidthFromEventTarget(t) {
    try {
      if (!t || !t.closest) return 0;
      var id = String(t.id || '');
      if (id.indexOf('panel-door-width-int') !== 0 && id.indexOf('panel-door-width-frac') !== 0
        && id !== 'panel-door-width-int' && id !== 'panel-door-width-frac') {
        return 0;
      }
      var row = t.closest('.door-measure-dimension-inputs-row') || t.closest('.door-measure-dimension-row') || t.closest('.door-option-wrap');
      if (!row) return readPanelDoorWidthFromDom();
      var intEl = row.querySelector('#panel-door-width-int, select[id^="panel-door-width-int"]');
      var fracEl = row.querySelector('#panel-door-width-frac, select[id^="panel-door-width-frac"]');
      if (!intEl && !fracEl) return readPanelDoorWidthFromDom();
      var intRaw2 = intEl && intEl.value;
      return (parseInchesFromPanelOptionValue(intRaw2) || toNum(intRaw2)) + parseDropdownNumber(fracEl && fracEl.value);
    } catch (e) { }
    return readPanelDoorWidthFromDom();
  }

  /**
   * Oversized chart lookup inputs (see printed "SCREEN SIDELIGHTS OR TRANSOM SLABS" sheet):
   * - Sidelight: w = sidelight width (rows), h = door height (columns 82"+).
   * - Transom: w = panel-transom-height (rows 10–23" — chart "short" leg), h = panel-door-width (columns 82"+ — span);
   *   pre-hung column also considers exact door width when set.
   */
  function readScreenStormSidelightTransomChartWH(t) {
    var setup = getDoorSetupFromDom();
    var transomPath = isScreenStormTransomStyleSelected();
    var sideW = 0;
    var doorH = 0;

    if (transomPath) {
      // ROW band (10–16, 17–20, 21–23): panel transom height field (e.g. 10"–23").
      sideW = (t && t.id && (String(t.id).indexOf('panel-transom-height') === 0 || t.id === 'panel-transom-height-int' || t.id === 'panel-transom-height-frac'))
        ? readPanelTransomHeightFromEventTarget(t)
        : readPanelTransomHeightFromDom();
      // COLUMN band (82, 83–89, …): panel door width field (e.g. 82); pre-hung can use exact door width.
      if (setup === 'pre_hung_on_jamb') {
        if (isExactDoorWidthMeasurementTarget(t)) {
          doorH = readWidthFromDom(t);
        } else if (t && t.id && String(t.id).indexOf('panel-door-width') === 0) {
          doorH = readPanelDoorWidthFromEventTarget(t);
        } else {
          doorH = readPanelDoorWidthFromDom() || readWidthFromDom();
        }
      } else {
        doorH = (t && t.id && String(t.id).indexOf('panel-door-width') === 0)
          ? readPanelDoorWidthFromEventTarget(t)
          : readPanelDoorWidthFromDom();
      }
    } else {
      sideW = (t && (t.id === 'sidelight_width' || t.id === 'sidelight_width_fraction'))
        ? readSidelightWidthFromEventTarget(t)
        : readSidelightWidthFromDom();
      if (isExactDoorHeightMeasurementTarget(t)) {
        doorH = readHeightFromDom(t);
        
      } else if (typeof window.__lastDoorHeightInches === 'number' && window.__lastDoorHeightInches > 0) {
        doorH = window.__lastDoorHeightInches;
      } else {
        doorH = readHeightFromDom();
      }
    }

    return { w: sideW, h: doorH };
  }

  /**
   * SIDELIGHT oversized chart only (width = sidelight_width, height = door_height).
   * Edit prices here for sidelight — not used for transom.
   */
  var SCREEN_STORM_SIDELIGHT_CHART = {
    slab_only: {
      '10_16_82_82': { price: 0, minThickness: 0 },
      '10_16_83_89': { price: 85, minThickness: 0 },
      '10_16_90_95': { price: 110, minThickness: 1.25 },
      '10_16_96_100': { price: 165, minThickness: 1.25 },
      '10_16_101_109': { price: 220, minThickness: 1.5 },
      '10_16_110_112': { price: 330, minThickness: 1.75 },
      '17_20_82_82': { price: 85, minThickness: 0 },
      '17_20_83_89': { price: 110, minThickness: 0 },
      '17_20_90_95': { price: 165, minThickness: 1.25 },
      '17_20_96_100': { price: 220, minThickness: 1.375 },
      '17_20_101_109': { price: 330, minThickness: 1.5 },
      '17_20_110_112': { price: 385, minThickness: 1.75 },
      '21_23_82_82': { price: 165, minThickness: 1.25 },
      '21_23_83_89': { price: 220, minThickness: 1.25 },
      '21_23_90_95': { price: 330, minThickness: 1.375 },
      '21_23_96_100': { price: 440, minThickness: 1.375 }
    },
    pre_hung_on_jamb: {
      '10_16_82_82': { price: 0, minThickness: 0 },
      '10_16_83_89': { price: 140, minThickness: 0 },
      '10_16_90_95': { price: 220, minThickness: 1.25 },
      '10_16_96_100': { price: 330, minThickness: 1.25 },
      '10_16_101_109': { price: 495, minThickness: 1.5 },
      '10_16_110_112': { price: 660, minThickness: 1.75 },
      '17_20_82_82': { price: 140, minThickness: 0 },
      '17_20_83_89': { price: 220, minThickness: 0 },
      '17_20_90_95': { price: 330, minThickness: 1.25 },
      '17_20_96_100': { price: 495, minThickness: 1.25 },
      '17_20_101_109': { price: 660, minThickness: 1.5 },
      '17_20_110_112': { price: 825, minThickness: 1.75 },
      '21_23_82_82': { price: 220, minThickness: 1.25 },
      '21_23_83_89': { price: 330, minThickness: 1.25 },
      '21_23_90_95': { price: 495, minThickness: 1.375 },
      '21_23_96_100': { price: 660, minThickness: 1.375 }
    }
  };

  /**
   * TRANSOM oversized chart only (row = panel-door-width, column = panel-transom-height).
   * Edit transom prices here — separate from SCREEN_STORM_SIDELIGHT_CHART.
   */
  var SCREEN_STORM_TRANSOM_CHART = {
    slab_only: {
      '10_16_82_82': { price: 0, minThickness: 0 },
      '10_16_83_89': { price: 85, minThickness: 0 },
      '10_16_90_95': { price: 110, minThickness: 1.25 },
      '10_16_96_100': { price: 165, minThickness: 1.25 },
      '10_16_101_109': { price: 220, minThickness: 1.5 },
      '10_16_110_112': { price: 330, minThickness: 1.75 },
      '17_20_82_82': { price: 85, minThickness: 0 },
      '17_20_83_89': { price: 110, minThickness: 0 },
      '17_20_90_95': { price: 165, minThickness: 1.25 },
      '17_20_96_100': { price: 220, minThickness: 1.375 },
      '17_20_101_109': { price: 330, minThickness: 1.5 },
      '17_20_110_112': { price: 385, minThickness: 1.75 },
      '21_23_82_82': { price: 165, minThickness: 1.25 },
      '21_23_83_89': { price: 220, minThickness: 1.25 },
      '21_23_90_95': { price: 330, minThickness: 1.375 },
      '21_23_96_100': { price: 440, minThickness: 1.375 }
    },
    pre_hung_on_jamb: {
      '10_16_82_82': { price: 0, minThickness: 0 },
      '10_16_83_89': { price: 140, minThickness: 0 },
      '10_16_90_95': { price: 220, minThickness: 1.25 },
      '10_16_96_100': { price: 330, minThickness: 1.25 },
      '10_16_101_109': { price: 495, minThickness: 1.5 },
      '10_16_110_112': { price: 660, minThickness: 1.75 },
      '17_20_82_82': { price: 140, minThickness: 0 },
      '17_20_83_89': { price: 220, minThickness: 0 },
      '17_20_90_95': { price: 330, minThickness: 1.25 },
      '17_20_96_100': { price: 495, minThickness: 1.375 },
      '17_20_101_109': { price: 660, minThickness: 1.5 },
      '17_20_110_112': { price: 825, minThickness: 1.75 },
      '21_23_82_82': { price: 220, minThickness: 1.25 },
      '21_23_83_89': { price: 330, minThickness: 1.25 },
      '21_23_90_95': { price: 495, minThickness: 1.375 },
      '21_23_96_100': { price: 660, minThickness: 1.375 }
    }
  };

  function buildSidelightTransomChartCellKey(bucket) {
    if (!bucket) return '';
    return bucket.wMin + '_' + bucket.wMax + '_' + bucket.hMin + '_' + bucket.hMax;
  }

  function lookupChartCellFromTable(chartTables, setup, bucket) {
    if (!bucket || !setup || !chartTables) return null;
    var tables = chartTables[setup];
    if (!tables) return null;
    var cell = tables[buildSidelightTransomChartCellKey(bucket)];
    if (!cell) return null;
    var minThickness = toNum(cell.minThickness);
    if (!minThickness || minThickness <= 0) minThickness = 1.25;
    return {
      price: toNum(cell.price),
      minThicknessInches: minThickness
    };
  }

  function lookupSidelightChartCell(setup, bucket) {
    return lookupChartCellFromTable(SCREEN_STORM_SIDELIGHT_CHART, setup, bucket);
  }

  function lookupTransomChartCell(setup, bucket) {
    return lookupChartCellFromTable(SCREEN_STORM_TRANSOM_CHART, setup, bucket);
  }

  /** Sidelight vs transom: pick the correct embedded chart. */
  function lookupSidelightOrTransomChartCell(setup, bucket) {
    if (isScreenStormTransomStyleSelected()) return lookupTransomChartCell(setup, bucket);
    if (isScreenStormSidelightStyleSelected()) return lookupSidelightChartCell(setup, bucket);
    return null;
  }

  function lookupSidelightTransomChartCell(setup, bucket) {
    return lookupSidelightOrTransomChartCell(setup, bucket);
  }

  function panelMinThicknessInchesToSelectValue(inches) {
    var map = {
      1.25: '1.25',
      1.375: '1.375',
      1.5: '1.5',
      1.75: '1.75',
      2.25: '2.25',
      2: '2',
      2.5: '2.5'
    };
    var n = parseFloat(inches);
    if (isNaN(n) || n <= 0) return '';
    if (map[n] != null) return map[n];
    return String(n);
  }

  /** White chart bands: 10"–16" × 82"–89" and 17"–20" × 82"–89" ($0 range) — hide panel thickness / no addon. */
  function isScreenStormPanelThicknessDisallowedByMatrix(bucket) {
    if (!bucket) return false;
    var wMin = bucket.wMin;
    var wMax = bucket.wMax;
    var hMin = bucket.hMin;
    var hMax = bucket.hMax;
    var wIn1016 = wMin >= 10 && wMax <= 16;
    var wIn1720 = wMin >= 17 && wMax <= 20;
    if (!wIn1016 && !wIn1720) return false;
    return hMin >= 82 && hMax <= 89;
  }

  function findPanelDoorThicknessFracNodes() {
    try {
      return document.querySelectorAll('#panel-door-thickness-frac, select[id^="panel-door-thickness-frac"]');
    } catch (e) { }
    return [];
  }

  function getActivePanelDoorThicknessFracNodes() {
    try {
      var el = getVisiblePanelDoorThicknessFracEl();
      if (el) return [el];
    } catch (e) { }
    try {
      return Array.prototype.slice.call(findPanelDoorThicknessFracNodes());
    } catch (e2) { }
    return [];
  }

  var SCREEN_STORM_PANEL_FRAC_HIDDEN_ATTR = 'data-screen-storm-panel-frac-hidden-by-st';
  var SCREEN_STORM_PANEL_ZERO_OPTION_ATTR = 'data-screen-storm-panel-zero-option';

  function isZeroPanelDoorThicknessOption(opt) {
    if (!opt) return false;
    var raw = opt.value != null ? String(opt.value).trim() : '';
    if (raw === '0' || raw === '0.0' || raw === '0.00') return true;
    if (raw !== '' && !isNaN(parseFloat(raw)) && Math.abs(parseFloat(raw)) < 0.0001) return true;
    var label = String(opt.textContent || opt.label || '').trim();
    if (label === '0' || label === '0"' || /^0(\s*"|in\b)?$/i.test(label)) return true;
    return false;
  }

  /** Hide/remove "0" from panel-door-thickness-frac__29_0 and all panel-door-thickness-frac* selects. */
  function hideZeroOptionsInPanelDoorThicknessFracSelect(sel) {
    if (!sel || !sel.options) return;
    for (var zi = 0; zi < sel.options.length; zi++) {
      var zopt = sel.options[zi];
      if (!zopt || !isZeroPanelDoorThicknessOption(zopt)) continue;
      zopt.hidden = true;
      zopt.disabled = true;
      zopt.setAttribute(SCREEN_STORM_PANEL_ZERO_OPTION_ATTR, '1');
    }
    var zcur = sel.options[sel.selectedIndex];
    if (zcur && (zcur.hidden || zcur.disabled || isZeroPanelDoorThicknessOption(zcur))) {
      for (var zj = 0; zj < sel.options.length; zj++) {
        var zo = sel.options[zj];
        if (zo && !zo.hidden && !zo.disabled && !isZeroPanelDoorThicknessOption(zo)) {
          sel.selectedIndex = zj;
          break;
        }
      }
    }
  }

  function hideZeroOptionsInAllPanelDoorThicknessFracSelects() {
    var nodes = findPanelDoorThicknessFracNodes();
    for (var pi = 0; pi < nodes.length; pi++) hideZeroOptionsInPanelDoorThicknessFracSelect(nodes[pi]);
    try {
      var byId29 = document.getElementById('panel-door-thickness-frac__29_0');
      if (byId29) hideZeroOptionsInPanelDoorThicknessFracSelect(byId29);
      var byId33 = document.getElementById('panel-door-thickness-frac__33_0');
      if (byId33) hideZeroOptionsInPanelDoorThicknessFracSelect(byId33);
    } catch (eId) { }
  }

  function parsePanelDoorThicknessOptionInches(opt) {
    if (!opt) return 0;
    try {
      var raw = opt.value != null && String(opt.value).trim() !== '' ? opt.value : '';
      var t = parsePanelThicknessInches(raw);
      if (!t && opt.textContent) t = parsePanelThicknessInches(opt.textContent);
      return t;
    } catch (e) { }
    return 0;
  }

  function restorePanelDoorThicknessFracOptionsFromSidelightTransomFilter() {
    var nodes = findPanelDoorThicknessFracNodes();
    for (var i = 0; i < nodes.length; i++) {
      var sel = nodes[i];
      if (!sel || !sel.options) continue;
      for (var oi = 0; oi < sel.options.length; oi++) {
        var opt = sel.options[oi];
        if (!opt) continue;
        if (opt.getAttribute(SCREEN_STORM_PANEL_FRAC_HIDDEN_ATTR) === '1') {
          if (!isZeroPanelDoorThicknessOption(opt)) {
            opt.hidden = false;
            opt.removeAttribute(SCREEN_STORM_PANEL_FRAC_HIDDEN_ATTR);
          }
        }
      }
      hideZeroOptionsInPanelDoorThicknessFracSelect(sel);
    }
    try { window.__doorScreenStormSidelightTransomPanelFracMinInches = null; } catch (e) { }
  }

  function resolveSidelightTransomMinThicknessInchesFromResponse(json) {
    var record = json && json.records && json.records[0] ? json.records[0] : null;
    var raw = json && json.thickness != null ? json.thickness : getFieldFromRecord(record, 'thickness');
    if (raw == null || String(raw).trim() === '') return 0;
    var s = String(raw).trim();
    var n = parseFloat(s.replace(/[^0-9.\-]+/g, ''));
    if (!isNaN(n) && n > 0) return n;
    var t = parsePanelThicknessInches(s);
    return !t || isNaN(t) ? 0 : t;
  }

  /** Select minimum required thickness on panel-door-thickness-frac (e.g. __29_0). */
  function selectPanelDoorThicknessForMinRequired(sel, minIn, eps) {
    if (!sel || !sel.options) return;
    var e = eps == null ? 0.02 : eps;
    var desiredVal = panelMinThicknessInchesToSelectValue(minIn);
    if (desiredVal) {
      for (var dk = 0; dk < sel.options.length; dk++) {
        var od = sel.options[dk];
        if (!od || od.hidden || od.disabled || isZeroPanelDoorThicknessOption(od)) continue;
        if (String(od.value) === String(desiredVal)) {
          sel.value = desiredVal;
          return;
        }
      }
    }
    var bestJ = -1;
    var bestDiff = 1e9;
    for (var oj = 0; oj < sel.options.length; oj++) {
      var o = sel.options[oj];
      if (!o || o.hidden || o.disabled || isZeroPanelDoorThicknessOption(o)) continue;
      var inO = parsePanelDoorThicknessOptionInches(o);
      if (!(inO > 0) || inO + e < minIn) continue;
      var diff = inO - minIn;
      if (diff < bestDiff) {
        bestDiff = diff;
        bestJ = oj;
      }
    }
    if (bestJ >= 0) {
      sel.selectedIndex = bestJ;
      return;
    }
    var cur = sel.options[sel.selectedIndex];
    if (cur && cur.hidden) {
      for (var oj2 = 0; oj2 < sel.options.length; oj2++) {
        var o2 = sel.options[oj2];
        if (o2 && !o2.hidden && !o2.disabled && !isZeroPanelDoorThicknessOption(o2)) {
          sel.selectedIndex = oj2;
          break;
        }
      }
    }
  }

  /**
   * Chart min thickness: hide thinner options ("above"), keep min + thicker ("bottom").
   * Applies to #panel-door-thickness-frac and ids like panel-door-thickness-frac__29_0.
   */
  function applyPanelDoorThicknessFracFilterFromChartMin(minIn) {
    restorePanelDoorThicknessFracOptionsFromSidelightTransomFilter();
    if (!minIn || minIn <= 0) return;

    try { window.__doorScreenStormSidelightTransomPanelFracMinInches = minIn; } catch (e) { }
    var eps = 0.0005;

    var userRecentlySetThickness = isScreenStormUserPanelThicknessRecentlySet();
    var nodes = getActivePanelDoorThicknessFracNodes();
    var anySelectChanged = false;
    for (var i = 0; i < nodes.length; i++) {
      var sel = nodes[i];
      if (!sel || !sel.options) continue;

      var prevVal = sel.value;
      var prevIdx = sel.selectedIndex;

      for (var oi = 0; oi < sel.options.length; oi++) {
        var opt = sel.options[oi];
        if (!opt) continue;
        if (isZeroPanelDoorThicknessOption(opt)) {
          opt.hidden = true;
          opt.disabled = true;
          opt.setAttribute(SCREEN_STORM_PANEL_ZERO_OPTION_ATTR, '1');
          continue;
        }
        var inches = parsePanelDoorThicknessOptionInches(opt);
        if (!(inches > 0)) continue;
        if (inches + eps < minIn) {
          opt.hidden = true;
          opt.setAttribute(SCREEN_STORM_PANEL_FRAC_HIDDEN_ATTR, '1');
        }
      }

      if (!userRecentlySetThickness) {
        selectPanelDoorThicknessForMinRequired(sel, minIn, eps);
      }
      hideZeroOptionsInPanelDoorThicknessFracSelect(sel);
      if (sel.value !== prevVal || sel.selectedIndex !== prevIdx) {
        anySelectChanged = true;
      }
    }
    if (anySelectChanged) {
      try { applyScreenStormPanelDoorThicknessExtraPricingFromDom(); } catch (eP) { }
    }
  }

  function applyPanelDoorThicknessFracFilterFromSidelightTransomJson(json) {
    var minIn = resolveSidelightTransomMinThicknessInchesFromResponse(json);
    if (minIn > 0) applyPanelDoorThicknessFracFilterFromChartMin(minIn);
  }

  function applyPanelDoorThicknessFracFilterFromSidelightChartCell(chartCell) {
    if (!chartCell || !(chartCell.minThicknessInches > 0)) return;
    applyPanelDoorThicknessFracFilterFromChartMin(chartCell.minThicknessInches);
  }

  function getPanelDoorThicknessRowForToggle(selectEl) {
    if (!selectEl || !selectEl.closest) return null;
    return selectEl.closest('.door-measure-dimension-row')
      || selectEl.closest('.door-measure-dimension-inputs-row')
      || selectEl.closest('.door-measure-thickness')
      || selectEl.closest('.door-option-wrap');
  }

  var SCREEN_STORM_PANEL_THICKNESS_ROW_ATTR = 'data-screen-storm-panel-thickness-hidden-reason';

  function showScreenStormPanelThicknessRowsHiddenForMatrix() {
    var nodes = findPanelDoorThicknessFracNodes();
    for (var i = 0; i < nodes.length; i++) {
      var row = getPanelDoorThicknessRowForToggle(nodes[i]);
      if (row && row.getAttribute(SCREEN_STORM_PANEL_THICKNESS_ROW_ATTR) === 'free_cell') {
        row.style.display = '';
        row.removeAttribute(SCREEN_STORM_PANEL_THICKNESS_ROW_ATTR);
      }
    }
    try { hideZeroOptionsInAllPanelDoorThicknessFracSelects(); } catch (eZ0) { }
  }

  /**
   * Hide panel thickness UI in white chart bands (10–16 or 17–20) × (82–89); show again when dimensions qualify.
   * Does not call thickness-prices.php except when re-eligible and a thickness is already selected.
   */
  function syncScreenStormPanelDoorThicknessRowForMatrix(t) {
    if (!isScreenAndStormDoorsProductType()) return;

    var nodes = findPanelDoorThicknessFracNodes();

    if (!isScreenStormSidelightOrTransomPanelRowVisible() || !isScreenStormSidelightOrTransomStyleSelected()) {
      showScreenStormPanelThicknessRowsHiddenForMatrix();
      return;
    }

    var isTransom24 = isScreenStormTransomStyleSelected() && readPanelTransomHeightFromDom() >= 24;
    var isSidelight24 = isScreenStormSidelightStyleSelected() && readSidelightWidthFromDom() >= 24;

    var dims = readScreenStormSidelightTransomChartWH(t);
    if ((!dims.w || !dims.h) || isTransom24 || isSidelight24) {
      if (!isTransom24 && !isSidelight24) showScreenStormPanelThicknessRowsHiddenForMatrix();
      applyScreenStormAddonToEstimatedPrice(0, 'panel_door_thickness_extra');
      window.__doorScreenStormPanelThicknessExtraToken = (parseInt(String(window.__doorScreenStormPanelThicknessExtraToken), 10) || 0) + 1;

      if (isTransom24 || isSidelight24) {
        for (var j = 0; j < nodes.length; j++) {
          var row = getPanelDoorThicknessRowForToggle(nodes[j]);
          if (row) {
            row.style.display = 'none';
            row.setAttribute(SCREEN_STORM_PANEL_THICKNESS_ROW_ATTR, 'free_cell');
          }
        }
      }
      return;
    }

    var bucket = resolveSidelightTransomBucket(dims.w, dims.h);
    if (isScreenStormPanelThicknessDisallowedByMatrix(bucket)) {
      window.__doorScreenStormPanelThicknessExtraToken = (parseInt(String(window.__doorScreenStormPanelThicknessExtraToken), 10) || 0) + 1;
      applyScreenStormAddonToEstimatedPrice(0, 'panel_door_thickness_extra');
      for (var j = 0; j < nodes.length; j++) {
        var row = getPanelDoorThicknessRowForToggle(nodes[j]);
        if (row) {
          row.style.display = 'none';
          row.setAttribute(SCREEN_STORM_PANEL_THICKNESS_ROW_ATTR, 'free_cell');
        }
      }
      return;
    }

    showScreenStormPanelThicknessRowsHiddenForMatrix();
    try { hideZeroOptionsInAllPanelDoorThicknessFracSelects(); } catch (eZ1) { }

    var thickEl = getVisiblePanelDoorThicknessFracEl();
    if (thickEl && readPanelDoorThicknessInchesFromEl(thickEl) > 0 && screenStormPanelThicknessExtraPricingEnabled()) {
      applyScreenStormPanelDoorThicknessExtraPricingFromDom();
    }
  }

  /** Same bucket chart as pricing-rule-int-ext.js `resolveOversizedBucket` for sidelight/transom. */
  function resolveSidelightTransomBucket(w, h) {
    var wi = Math.round(parseFloat(w));
    var hi = Math.round(parseFloat(h));
    if (isNaN(wi) || isNaN(hi)) return null;

    if (inRange(wi, 10, 16)) {
      if (hi === 82) return { wMin: 10, wMax: 16, hMin: 82, hMax: 82 };
      if (inRange(hi, 83, 89)) return { wMin: 10, wMax: 16, hMin: 83, hMax: 89 };
      if (inRange(hi, 90, 95)) return { wMin: 10, wMax: 16, hMin: 90, hMax: 95 };
      if (inRange(hi, 96, 100)) return { wMin: 10, wMax: 16, hMin: 96, hMax: 100 };
      if (inRange(hi, 101, 109)) return { wMin: 10, wMax: 16, hMin: 101, hMax: 109 };
      if (inRange(hi, 110, 112)) return { wMin: 10, wMax: 16, hMin: 110, hMax: 112 };
      return null;
    }

    if (inRange(wi, 17, 20)) {
      if (hi === 82) return { wMin: 17, wMax: 20, hMin: 82, hMax: 82 };
      if (inRange(hi, 83, 89)) return { wMin: 17, wMax: 20, hMin: 83, hMax: 89 };
      if (inRange(hi, 90, 95)) return { wMin: 17, wMax: 20, hMin: 90, hMax: 95 };
      if (inRange(hi, 96, 100)) return { wMin: 17, wMax: 20, hMin: 96, hMax: 100 };
      if (inRange(hi, 101, 109)) return { wMin: 17, wMax: 20, hMin: 101, hMax: 109 };
      if (inRange(hi, 110, 112)) return { wMin: 17, wMax: 20, hMin: 110, hMax: 112 };
      return null;
    }

    if (inRange(wi, 21, 23)) {
      if (hi === 82) return { wMin: 21, wMax: 23, hMin: 82, hMax: 82 };
      if (inRange(hi, 83, 89)) return { wMin: 21, wMax: 23, hMin: 83, hMax: 89 };
      if (inRange(hi, 90, 95)) return { wMin: 21, wMax: 23, hMin: 90, hMax: 95 };
      if (inRange(hi, 96, 100)) return { wMin: 21, wMax: 23, hMin: 96, hMax: 100 };
      return null;
    }

    return null;
  }

  /** Client-side chart price when API unavailable (sidelight or transom chart). */
  function sidelightTransomChartPriceForBucket(setup, bucket) {
    var cell = lookupSidelightOrTransomChartCell(setup, bucket);
    return cell ? cell.price : null;
  }

  function buildSidelightTransomTableKey(setup, bucket) {
    if (!bucket) return '';
    var pfx = setup === 'pre_hung_on_jamb'
      ? 'sidelights_or_transoms_prehung_oversized'
      : 'sidelights_or_transoms_slabs_oversized';
    return pfx + '_' + bucket.wMin + '_' + bucket.wMax + '_' + bucket.hMin + '_' + bucket.hMax;
  }

  function readMeasurementsFromEventTarget(t) {
    var width = null;
    var height = null;
    try {
      if (t && isExactDoorWidthMeasurementTarget(t)) {
        width = readIntFracPairFromMeasurementEventTarget(t) || readWidthFromDom(t);
      }
      if (t && isExactDoorHeightMeasurementTarget(t)) {
        height = readIntFracPairFromMeasurementEventTarget(t) || readHeightFromDom(t);
      }
    } catch (e) { }

    if (width == null) width = readWidthFromDom(t);
    if (height == null) height = readHeightFromDom(t);
    return { width: width, height: height };
  }

  /** Chart/API bucket lookup uses rounded whole inches (e.g. 36 + 0.5 → 36.5 → bucket 37). */
  function measureInchesForScreenStormChart(inches) {
    var n = parseFloat(inches);
    if (isNaN(n) || n <= 0) return 0;
    return Math.round(n);
  }

  function inRange(x, min, max) {
    return x >= min && x <= max;
  }

  var SCREEN_STORM_THICKNESS_WIDTH_BUCKETS = [
    { min: 36, max: 36 },
    { min: 37, max: 39 },
    { min: 40, max: 42 },
    { min: 43, max: 45 },
    { min: 46, max: 48 }
  ];

  var SCREEN_STORM_THICKNESS_HEIGHT_BUCKETS = [
    { min: 82, max: 82 },
    { min: 83, max: 89 },
    { min: 90, max: 95 },
    { min: 96, max: 100 },
    { min: 101, max: 109 },
    { min: 110, max: 112 },
    { min: 113, max: 118 },
    { min: 119, max: 124 },
    { min: 125, max: 130 },
    { min: 131, max: 136 },
    { min: 137, max: 141 },
    { min: 142, max: 147 }
  ];

  function resolveScreenStormThicknessBuckets(width, height) {
    var w = measureInchesForScreenStormChart(width);
    var h = measureInchesForScreenStormChart(height);
    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return null;

    var widthBucket = null;
    for (var i = 0; i < SCREEN_STORM_THICKNESS_WIDTH_BUCKETS.length; i++) {
      var wb = SCREEN_STORM_THICKNESS_WIDTH_BUCKETS[i];
      if (inRange(w, wb.min, wb.max)) {
        widthBucket = wb;
        break;
      }
    }

    var heightBucket = null;
    for (var j = 0; j < SCREEN_STORM_THICKNESS_HEIGHT_BUCKETS.length; j++) {
      var hb = SCREEN_STORM_THICKNESS_HEIGHT_BUCKETS[j];
      if (inRange(h, hb.min, hb.max)) {
        heightBucket = hb;
        break;
      }
    }

    if (!widthBucket || !heightBucket) return null;
    return {
      widthMin: widthBucket.min,
      widthMax: widthBucket.max,
      heightMin: heightBucket.min,
      heightMax: heightBucket.max
    };
  }

  function buildThicknessTableKey(width, height) {
    var bucket = resolveScreenStormThicknessBuckets(width, height);
    if (!bucket) return '';
    return (
      'thickness_'
      + bucket.widthMin + '_' + bucket.widthMax
      + '_' + bucket.heightMin + '_' + bucket.heightMax
    );
  }

  function buildScreenStormOversizedTableKey(prefix, width, height) {
    var bucket = resolveScreenStormThicknessBuckets(width, height);
    if (!bucket || !prefix) return '';
    return (
      String(prefix) + '_'
      + bucket.widthMin + '_' + bucket.widthMax
      + '_' + bucket.heightMin + '_' + bucket.heightMax
    );
  }

  function normalizeProxyPrice(price) {
    try {
      if (typeof price === 'string') {
        var s = price.trim();
        if (s && s[0] === '{') {
          var money = JSON.parse(s);
          if (money && money.amount != null) price = money.amount;
        }
      }
    } catch (e) { }
    var cleaned = String(price == null ? '' : price).replace(/[^0-9.\-]+/g, '');
    var parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  function getFieldFromRecord(r, fieldName) {
    if (!r) return undefined;
    if (r[fieldName] != null) return r[fieldName];
    var camel = fieldName.replace(/_([a-z])/g, function (_, c) { return c.toUpperCase(); });
    if (r[camel] != null) return r[camel];
    if (Array.isArray(r.fields)) {
      for (var i = 0; i < r.fields.length; i++) {
        var f = r.fields[i];
        if (!f) continue;
        var k = f.key != null ? f.key : (f.name != null ? f.name : f.id);
        if (norm(k) !== norm(fieldName)) continue;
        return f.value != null ? f.value : (f.val != null ? f.val : f);
      }
    }
    return undefined;
  }

  function thicknessMetaToSelectValue(metaVal) {
    var code = toNum(metaVal);
    if (isNaN(code) || code <= 0) return '';
    var map = {
      1.14: '1.25',
      1.18: '1.125',
      1.12: '1.5',
      1.34: '1.75',
      2.14: '2.25',
      1.38: '1.375'
    };
    if (map[code] != null) return map[code];
    return String(code);
  }

  var SCREEN_STORM_PLAIN_THICKNESS_ROW_ATTR = 'data-screen-storm-plain-thickness-hidden-reason';

  function findPlainDoorThicknessFracSelectNodes() {
    try {
      return document.querySelectorAll(
        '#exact-door-thickness-frac, select[id^="exact-door-thickness-frac"],' +
        '#door-thickness, #finished-door-thickness, select[id^="finished-door-thickness"]'
      );
    } catch (e) { }
    return [];
  }

  function getVisiblePlainDoorThicknessFracSelects() {
    var nodes = findPlainDoorThicknessFracSelectNodes();
    var vis = [];
    var rest = [];
    for (var i = 0; i < nodes.length; i++) {
      try {
        if (nodes[i] && nodes[i].offsetParent !== null) vis.push(nodes[i]);
        else rest.push(nodes[i]);
      } catch (e2) {
        rest.push(nodes[i]);
      }
    }
    return vis.concat(rest);
  }

  function plainDoorThicknessRowTitleIsThickness(row) {
    if (!row) return false;
    try {
      var titleEl = row.querySelector('.door-measure-dimension-title') || row.querySelector('h4');
      var title = String((titleEl && titleEl.textContent) || '').toLowerCase();
      return title.indexOf('thickness') !== -1 || title.indexOf('thick') !== -1;
    } catch (e) { }
    return false;
  }

  function getPlainDoorThicknessRowForSelect(selectEl) {
    if (!selectEl || !selectEl.closest) return null;
    return selectEl.closest('.door-measure-dimension-row')
      || selectEl.closest('.door-measure-thickness')
      || selectEl.closest('.door-option-wrap');
  }

  function getScreenStormActiveMeasurementPanel() {
    try {
      var setup = getDoorSetupFromDom();
      if (setup === 'slab_only') {
        var finished = document.querySelector('.door-measurement-static-panel--finished');
        if (finished && !finished.classList.contains('door-hidden')) return finished;
      }
      var exact = document.querySelector('.door-measurement-static-panel--exact');
      if (exact && !exact.classList.contains('door-hidden')) return exact;
      var panels = document.querySelectorAll('.door-measurement-static-panel');
      for (var i = 0; i < panels.length; i++) {
        var p = panels[i];
        if (p && !p.classList.contains('door-hidden')) return p;
      }
    } catch (e) { }
    return null;
  }

  function syncScreenStormPlainDoorThicknessRowVisibility(show) {
    if (!isScreenAndStormDoorsProductType()) return;
    // exact-door-thickness-frac stays visible; API only drives option filter + pricing.
    var panel = getScreenStormActiveMeasurementPanel();
    if (!panel) {
      try {
        var fracNodes = findPlainDoorThicknessFracSelectNodes();
        for (var fi = 0; fi < fracNodes.length; fi++) {
          var fracRow = getPlainDoorThicknessRowForSelect(fracNodes[fi]);
          if (!fracRow || !plainDoorThicknessRowTitleIsThickness(fracRow)) continue;
          fracRow.style.display = '';
          fracRow.classList.remove('door-hidden');
          fracRow.removeAttribute(SCREEN_STORM_PLAIN_THICKNESS_ROW_ATTR);
        }
      } catch (eFrac) {}
      return;
    }

    var rows = panel.querySelectorAll('.door-measure-dimension-row');
    for (var ri = 0; ri < rows.length; ri++) {
      var row = rows[ri];
      if (!plainDoorThicknessRowTitleIsThickness(row)) continue;
      row.style.display = '';
      row.classList.remove('door-hidden');
      row.removeAttribute(SCREEN_STORM_PLAIN_THICKNESS_ROW_ATTR);
    }
  }

  function resetExactDoorThicknessFracOptions() {
    if (isScreenStormUserThicknessRecentlySet()) return;

    try {
      var els = findPlainDoorThicknessFracSelectNodes();
      for (var ei = 0; ei < els.length; ei++) {
        var el = els[ei];
        if (!el || !el.options) continue;
        for (var oi = 0; oi < el.options.length; oi++) {
          el.options[oi].hidden = false;
          el.options[oi].disabled = false;
        }
      }
    } catch (e) { }
  }

  function applyExactDoorThicknessFracMinVisibility(minInches) {
    var min = parseDropdownNumber(minInches);
    if (isNaN(min) || min <= 0) return;
    try {
      var els = findPlainDoorThicknessFracSelectNodes();
      for (var ei = 0; ei < els.length; ei++) {
        var el = els[ei];
        if (!el || !el.options) continue;
        for (var oi = 0; oi < el.options.length; oi++) {
          var opt = el.options[oi];
          var optNum = parseDropdownNumber(opt.value);
          var hide = !isNaN(optNum) && optNum + 0.001 < min;
          opt.hidden = hide;
          opt.disabled = hide;
        }
      }
    } catch (e) { }
  }

  function setExactDoorThicknessFracFromMeta(metaVal) {
    var selectVal = thicknessMetaToSelectValue(metaVal);
    if (!selectVal) return;
    try {
      var els = findPlainDoorThicknessFracSelectNodes();
      var targetNum = parseDropdownNumber(selectVal);
      for (var ei = 0; ei < els.length; ei++) {
        var el = els[ei];
        if (!el || !el.options) continue;
        var chosen = '';
        for (var oi = 0; oi < el.options.length; oi++) {
          var opt = el.options[oi];
          var optNum = parseDropdownNumber(opt.value);
          if (!isNaN(targetNum) && approxEq(optNum, targetNum)) {
            chosen = opt.value;
            break;
          }
          if (String(opt.value) === String(selectVal)) {
            chosen = opt.value;
            break;
          }
        }
        if (chosen !== '') {
          if (String(el.value) !== String(chosen)) el.value = chosen;
          applyExactDoorThicknessFracMinVisibility(chosen);
        }
      }
      if (!isNaN(targetNum) && targetNum > 0) {
        window.__lastDoorThicknessInches = targetNum;
      }
      syncScreenStormPlainDoorThicknessRowVisibility(true);
    } catch (e) { }
  }

  function fetchPricingRuleScreenStormByTableKey(tableKey, source) {
    if (!isDoorPricingApiEnabled()) return emptyScreenStormProxyResponse();
    var key = String(tableKey == null ? '' : tableKey).trim();
    if (!key) return Promise.reject(new Error('missing table_key'));

    var base = (window.DOOR_PRICING_RULE_PROXY_BASE || 'https://vintage.espirevox.com');
    base = String(base || '').replace(/\/+$/, '');
    var url = base + '/pricing-rule-screen-storm.php?table_key=' + encodeURIComponent(key);

    return fetch(url, { mode: 'cors', credentials: 'omit' })
      .then(function (r) {
        if (!r || !r.ok) throw new Error('bad response');
        return r.json();
      })
      .then(function (json) {
        var price = json && json.price != null ? json.price : null;
        if (price == null && json && json.records && json.records[0]) {
          var rec = json.records[0];
          price = rec.price_extracted != null ? rec.price_extracted : rec.price;
        }
        var parsedRanges = parseScreenStormTableKeyRanges(key);
        var apiRecord = json && json.records && json.records[0] ? json.records[0] : null;
        var normalizedPrice = normalizeProxyPrice(price);
        consoleLogScreenStormApiResponse({
          source: source || 'fetchPricingRuleScreenStormByTableKey',
          tableKey: key,
          url: url,
          price: normalizedPrice,
          matched_count: json && json.matched_count != null ? json.matched_count : (json && json.matched ? 1 : 0),
          widthRange: parsedRanges ? parsedRanges.widthRange : '',
          heightRange: parsedRanges ? parsedRanges.heightRange : '',
          apiRecord: apiRecord
        });
        if (parsedRanges) {
          consoleLogScreenStormWidthHeightRangeApi({
            source: source || 'fetchPricingRuleScreenStormByTableKey',
            tableKey: key,
            widthRange: parsedRanges.widthRange,
            heightRange: parsedRanges.heightRange,
            price: normalizedPrice,
            matched_count: json && json.matched_count != null ? json.matched_count : (json && json.matched ? 1 : 0),
            apiRecord: apiRecord
          });
        }
        return json;
      });
  }

  function fetchPricingRuleScreenStormBestMatchViaProxy(prefix, width, height, thicknessInches) {
    if (!isDoorPricingApiEnabled()) return emptyScreenStormProxyResponse();
    var p = String(prefix == null ? '' : prefix).trim();
    if (!p) return Promise.reject(new Error('missing prefix'));

    var w = Math.round(parseFloat(width));
    var h = Math.round(parseFloat(height));
    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
      return Promise.reject(new Error('missing width/height'));
    }

    var base = (window.DOOR_PRICING_RULE_PROXY_BASE || 'https://vintage.espirevox.com');
    base = String(base || '').replace(/\/+$/, '');
    var url =
      base
      + '/pricing-rule-screen-storm.php?prefix=' + encodeURIComponent(p)
      + '&width=' + encodeURIComponent(String(w))
      + '&height=' + encodeURIComponent(String(h));
    var t = thicknessInches != null ? parseFloat(thicknessInches) : NaN;
    if (!isNaN(t) && t > 0) {
      url += '&thickness=' + encodeURIComponent(String(t));
    }

    return fetch(url, { mode: 'cors', credentials: 'omit' })
      .then(function (r) {
        if (!r || !r.ok) throw new Error('bad response');
        return r.json();
      })
      .then(function (json) {
        return {
          matched_count: json && json.matched_count != null ? json.matched_count : (json && json.matched ? 1 : 0),
          price: resolveScreenStormOversizedPriceFromResponse(json),
          response: json || {}
        };
      });
  }

  function fetchScreenStormOversizedPriceViaProxy(prefix, width, height, thicknessInches) {
    var tableKey = buildScreenStormOversizedTableKey(prefix, width, height);
    if (tableKey) {
      return fetchPricingRuleScreenStormByTableKey(tableKey, 'oversized').then(function (json) {
        var price = resolveScreenStormOversizedPriceFromResponse(json);
        return {
          price: price,
          table_key: tableKey,
          response: json || {}
        };
      });
    }

    return Promise.resolve({
      price: 0,
      table_key: null,
      response: {}
    });
  }

  function resolveScreenStormOversizedPriceFromResponse(json) {
    var record = json && json.records && json.records[0] ? json.records[0] : null;
    var price = json && json.price != null ? json.price : null;
    if (price == null && record) {
      price = record.price_extracted != null ? record.price_extracted : record.price;
    }
    return normalizeProxyPrice(price);
  }

  function fetchSidelightTransomCalculationsScreenStorm(tableKey) {
    if (!isDoorPricingApiEnabled()) return emptyScreenStormProxyResponse();
    var key = String(tableKey || '').trim();
    if (!key) return Promise.reject(new Error('missing table_key'));

    var base = (window.DOOR_PRICING_RULE_PROXY_BASE || 'https://vintage.espirevox.com');
    base = String(base || '').replace(/\/+$/, '');
    var url = base + '/pricing-rule-screen-storm.php?table_key=' + encodeURIComponent(key);

    return fetch(url, { mode: 'cors', credentials: 'omit' })
      .then(function (r) {
        if (!r || !r.ok) throw new Error('bad response');
        return r.json();
      });
  }

  function isScreenStormDoorHeightOrSidelightWidthChange(t) {
    if (!t) return false;
    if (isExactDoorHeightMeasurementTarget(t)) return true;
    var id = String(t.id || '');
    return (
      id === 'sidelight_width'
      || id === 'sidelight_width_fraction'
    );
  }

  function isScreenStormSidelightTransomChartDimensionChange(t) {
    if (!t) return false;
    if (isScreenStormDoorHeightOrSidelightWidthChange(t)) return true;
    if (isExactDoorWidthMeasurementTarget(t)) return true;
    if (isExactDoorHeightMeasurementTarget(t)) return true;
    if (!t.id) return false;
    var id = String(t.id);
    if (id.indexOf('panel-transom-height-int') === 0 || id.indexOf('panel-transom-height-frac') === 0) return true;
    if (id === 'panel-transom-height-int' || id === 'panel-transom-height-frac') return true;
    if (id.indexOf('panel-door-width-int') === 0 || id.indexOf('panel-door-width-frac') === 0) return true;
    if (id === 'panel-door-width-int' || id === 'panel-door-width-frac') return true;
    return false;
  }

  function isScreenStormWoodTypeStormPorchChange(t) {
    if (!t) return false;
    try {
      var nm = t.name != null ? String(t.name) : '';
      if (nm === 'attributes[Select Wood Type Storm and Porch]') return true;
      var optId = t.getAttribute ? String(t.getAttribute('data-option-id') || '') : '';
      if (optId === 'wood_type_storm_porch') return true;
    } catch (e) { }
    return false;
  }

  function applyScreenStormSidelightChartFromDoorHeightAndSidelightWidth(t) {
    if (!isScreenAndStormDoorsProductType()) return;
    var setup = getDoorSetupFromDom();
    if (!setup) {
      try { restorePanelDoorThicknessFracOptionsFromSidelightTransomFilter(); } catch (e0) { }
      return;
    }

    if (!isScreenStormSidelightOrTransomStyleSelected()) {
      applyScreenStormAddonToEstimatedPrice(0, 'sidelight_transom');
      applyScreenStormAddonToEstimatedPrice(0, 'transom_combo');
      applyScreenStormAddonToEstimatedPrice(0, 'wide_sidelight_base_wood');
      applyScreenStormAddonToEstimatedPrice(0, 'tall_transom_base_wood');
      try { restorePanelDoorThicknessFracOptionsFromSidelightTransomFilter(); } catch (e1) { }
      return;
    }

    if (!screenStormSidelightChartPricingEnabled()) {
      applyScreenStormAddonToEstimatedPrice(0, 'sidelight_transom');
      applyScreenStormAddonToEstimatedPrice(0, 'transom_combo');
      return;
    }

    if (isScreenStormSidelightAndTransomComboSelected()) {
      applyScreenStormAddonToEstimatedPrice(0, 'wide_sidelight_base_wood');
      applyScreenStormAddonToEstimatedPrice(0, 'tall_transom_base_wood');

      var comboSidelightW = (t && (t.id === 'sidelight_width' || t.id === 'sidelight_width_fraction'))
        ? readSidelightWidthFromEventTarget(t)
        : readSidelightWidthFromDom();
      var comboDoorH = readHeightFromDom();
      var comboTransomH = (t && t.id && (String(t.id).indexOf('panel-transom-height') === 0
        || t.id === 'panel-transom-height-int' || t.id === 'panel-transom-height-frac'))
        ? readPanelTransomHeightFromEventTarget(t)
        : readPanelTransomHeightFromDom();
      var comboPanelDoorW = (t && t.id && String(t.id).indexOf('panel-door-width') === 0)
        ? readPanelDoorWidthFromEventTarget(t)
        : readPanelDoorWidthFromDom();

      window.__doorScreenStormSidelightPricingToken = (parseInt(String(window.__doorScreenStormSidelightPricingToken), 10) || 0) + 1;
      var comboToken = window.__doorScreenStormSidelightPricingToken;

      var comboSidelightBucket = (comboSidelightW > 0 && comboDoorH > 0)
        ? resolveSidelightTransomBucket(comboSidelightW, comboDoorH) : null;
      var comboSidelightTableKey = comboSidelightBucket
        ? buildSidelightTransomTableKey(setup, comboSidelightBucket) : '';
      var comboTransomBucket = (comboTransomH > 0 && comboPanelDoorW > 0)
        ? resolveSidelightTransomBucket(comboTransomH, comboPanelDoorW) : null;
      var comboTransomTableKey = comboTransomBucket
        ? buildSidelightTransomTableKey(setup, comboTransomBucket) : '';

      Promise.all([
        comboSidelightTableKey ? fetchSidelightTransomCalculationsScreenStorm(comboSidelightTableKey) : Promise.resolve(null),
        comboTransomTableKey ? fetchSidelightTransomCalculationsScreenStorm(comboTransomTableKey) : Promise.resolve(null)
      ])
        .then(function (results) {
          if (comboToken !== window.__doorScreenStormSidelightPricingToken) return;
          var sPrice = results[0] ? resolveScreenStormOversizedPriceFromResponse(results[0]) : 0;
          var tPrice = results[1] ? resolveScreenStormOversizedPriceFromResponse(results[1]) : 0;
          if (!sPrice || sPrice < 0) sPrice = 0;
          if (!tPrice || tPrice < 0) tPrice = 0;
          applyScreenStormAddonToEstimatedPrice(sPrice, 'sidelight_transom');
          applyScreenStormAddonToEstimatedPrice(tPrice, 'transom_combo');
          var filterJson = results[0] || results[1];
          if (filterJson && !isScreenStormPanelThicknessDisallowedByMatrix(comboSidelightBucket || comboTransomBucket)) {
            try { applyPanelDoorThicknessFracFilterFromSidelightTransomJson(filterJson); } catch (eCF) { }
          }
        })
        .catch(function () {
          if (comboToken !== window.__doorScreenStormSidelightPricingToken) return;
          applyScreenStormAddonToEstimatedPrice(0, 'sidelight_transom');
          applyScreenStormAddonToEstimatedPrice(0, 'transom_combo');
        });
      return;
    }

    applyScreenStormAddonToEstimatedPrice(0, 'transom_combo');

    var sidelightW = (t && (t.id === 'sidelight_width' || t.id === 'sidelight_width_fraction'))
      ? readSidelightWidthFromEventTarget(t)
      : readSidelightWidthFromDom();
    if (isScreenStormSidelightStyleSelected() && sidelightW >= 24) {
      window.__doorScreenStormSidelightPricingToken = (parseInt(String(window.__doorScreenStormSidelightPricingToken), 10) || 0) + 1;
      applyScreenStormAddonToEstimatedPrice(0, 'sidelight_transom');
      applyScreenStormAddonToEstimatedPrice(0, 'tall_transom_base_wood');
      try { restorePanelDoorThicknessFracOptionsFromSidelightTransomFilter(); } catch (eWide) { }
      applyScreenStormWideSidelightBasePlusWoodAddon(sidelightW);
      return;
    }

    var transomH = (t && t.id && (String(t.id).indexOf('panel-transom-height') === 0
      || t.id === 'panel-transom-height-int' || t.id === 'panel-transom-height-frac'))
      ? readPanelTransomHeightFromEventTarget(t)
      : readPanelTransomHeightFromDom();
    if (isScreenStormTransomStyleSelected() && transomH >= 24) {
      window.__doorScreenStormSidelightPricingToken = (parseInt(String(window.__doorScreenStormSidelightPricingToken), 10) || 0) + 1;
      applyScreenStormAddonToEstimatedPrice(0, 'sidelight_transom');
      applyScreenStormAddonToEstimatedPrice(0, 'wide_sidelight_base_wood');
      try { restorePanelDoorThicknessFracOptionsFromSidelightTransomFilter(); } catch (eTall) { }
      applyScreenStormTallTransomBasePlusWoodAddon(transomH);
      return;
    }

    applyScreenStormAddonToEstimatedPrice(0, 'wide_sidelight_base_wood');
    applyScreenStormAddonToEstimatedPrice(0, 'tall_transom_base_wood');

    var dims = readScreenStormSidelightTransomChartWH(t);
    var sideW = dims.w;
    var doorH = dims.h;

    if (!sideW || !doorH) {
      //alert("Please select proper measurements.");
      applyScreenStormAddonToEstimatedPrice(0, 'sidelight_transom');
      try { restorePanelDoorThicknessFracOptionsFromSidelightTransomFilter(); } catch (e2) { }
      return;
    }

    var bucket = resolveSidelightTransomBucket(sideW, doorH);
    if (!bucket) {
    //  alert("Please select proper measurements.");
      applyScreenStormAddonToEstimatedPrice(0, 'sidelight_transom');
      try { restorePanelDoorThicknessFracOptionsFromSidelightTransomFilter(); } catch (e3) { }
      return;
    }
    var tableKey = buildSidelightTransomTableKey(setup, bucket);
    if (!tableKey) {
      try { restorePanelDoorThicknessFracOptionsFromSidelightTransomFilter(); } catch (e4) { }
      return;
    }

    var chartCell = lookupSidelightOrTransomChartCell(setup, bucket);
    var chartPrice = chartCell ? chartCell.price : null;

    // Read raw per-unit wood price directly from schema.
    // Do NOT use readSelectedWoodTypeStormPorchPriceValue() — the external
    // DoorConfiguratorPricing function returns the already-doubled full-door price.
    var woodPrice = 0;
    try {
      var _woodSel = readSelectedWoodTypeStormPorchValueFromDom();
      if (_woodSel && Array.isArray(window.__doorConfigSchema)) {
        for (var _wi = 0; _wi < window.__doorConfigSchema.length; _wi++) {
          var _wOpt = window.__doorConfigSchema[_wi];
          if (!_wOpt) continue;
          var _wId = String(_wOpt.id || '');
          if (_wId !== 'wood_type_storm_porch' && _wId.indexOf('wood_type_storm') !== 0) continue;
          var _wChoices = Array.isArray(_wOpt.options) ? _wOpt.options : [];
          for (var _wj = 0; _wj < _wChoices.length; _wj++) {
            var _wCh = _wChoices[_wj];
            if (!_wCh) continue;
            if (String(_wCh.value != null ? _wCh.value : '') !== _woodSel) continue;
            woodPrice = toNum(_wCh.priceValue != null ? _wCh.priceValue : _wCh.price_value);
            break;
          }
          if (woodPrice > 0) break;
        }
      }
    } catch (_we) { }

    if (woodPrice === 0) {
      try {
        var fullWoodPrice = readSelectedWoodTypeStormPorchPriceValue();
        if (window.DoorConfiguratorPricing && typeof window.DoorConfiguratorPricing.getSelectedWoodTypeStormPorchPriceValue === 'function') {
          woodPrice = fullWoodPrice / 2;
        } else {
          woodPrice = fullWoodPrice;
        }
      } catch (eFallback) { }
    }

    // Calculate wood price based on selected style:
    // If transom is selected, add woodPrice once.
    // If sidelight is selected, add woodPrice * sidelight count.
    var sidelightTransomWoodPrice = 0;
    if (isScreenStormTransomStyleSelected()) {
      sidelightTransomWoodPrice = woodPrice;
    } else if (isScreenStormSidelightStyleSelected()) {
      sidelightTransomWoodPrice = woodPrice * getSidelightCount();
    }

    if (isScreenStormPanelThicknessDisallowedByMatrix(bucket)) {
      try { restorePanelDoorThicknessFracOptionsFromSidelightTransomFilter(); } catch (eFree) { }
    } else if (chartCell) {
      try { applyPanelDoorThicknessFracFilterFromSidelightChartCell(chartCell); } catch (eChartThick) { }
    }

    // Preview — chart price only (no wood), async callback is authoritative.
    if (chartPrice != null) {
      applyScreenStormAddonToEstimatedPrice(chartPrice, 'sidelight_transom');
    }

    window.__doorScreenStormSidelightPricingToken = (parseInt(String(window.__doorScreenStormSidelightPricingToken), 10) || 0) + 1;
    var sidelightToken = window.__doorScreenStormSidelightPricingToken;

    fetchSidelightTransomCalculationsScreenStorm(tableKey)
      .then(function (json) {
        if (sidelightToken !== window.__doorScreenStormSidelightPricingToken) return;
        var apiPrice = resolveScreenStormOversizedPriceFromResponse(json);
        var price = apiPrice > 0 ? apiPrice : (chartPrice != null ? chartPrice : 0);
        if (price == null || price < 0) price = 0;
        var finalPrice = price > 0 ? (price + sidelightTransomWoodPrice) : 0;
        applyScreenStormAddonToEstimatedPrice(finalPrice, 'sidelight_transom');
        if (chartCell && !isScreenStormPanelThicknessDisallowedByMatrix(bucket)) {
          try { applyPanelDoorThicknessFracFilterFromSidelightChartCell(chartCell); } catch (eF) { }
        } else if (!isScreenStormPanelThicknessDisallowedByMatrix(bucket)) {
          try { applyPanelDoorThicknessFracFilterFromSidelightTransomJson(json); } catch (eF2) { }
        }
      })
      .catch(function () {
        if (sidelightToken !== window.__doorScreenStormSidelightPricingToken) return;
        if (chartPrice != null) {
          var fallbackPrice = chartPrice > 0 ? (chartPrice + sidelightTransomWoodPrice) : 0;
          applyScreenStormAddonToEstimatedPrice(fallbackPrice, 'sidelight_transom');
        } else {
          try { restorePanelDoorThicknessFracOptionsFromSidelightTransomFilter(); } catch (eC) { }
          applyScreenStormAddonToEstimatedPrice(0, 'sidelight_transom');
        }
      });
  }

  function resolveScreenStormThicknessPriceFromResponse(json, setup) {
    var record = json && json.records && json.records[0] ? json.records[0] : null;
    var isPrehung = setup === 'pre_hung_on_jamb';
    var price = null;
    if (isPrehung) {
      price = json && json.price_prehung != null ? json.price_prehung : getFieldFromRecord(record, 'price_prehung');
    } else {
      price = json && json.price != null ? json.price : getFieldFromRecord(record, 'price');
    }
    if (price == null && record) {
      price = record.price_extracted != null ? record.price_extracted : record.price;
    }
    return normalizeProxyPrice(price);
  }

  function resolveScreenStormThicknessFromResponse(json) {
    if (json && json.matched_thickness_raw != null) return json.matched_thickness_raw;
    if (json && json.matched_thickness != null) return json.matched_thickness;
    var record = json && json.records && json.records[0] ? json.records[0] : null;
    return getFieldFromRecord(record, 'thickness');
  }

  function isScreenStormStileAndRailProfileChange(t) {
    if (!t) return false;
    try {
      var oid = t.getAttribute ? String(t.getAttribute('data-option-id') || '') : '';
      if (oid === 'stile_and_rail_profile') return true;
      var nm = t.name != null ? String(t.name) : '';
      if (nm.indexOf('Stile and Rail Profile') !== -1) return true;
      if (t.closest && t.closest('.door-option-wrap[data-option-id="stile_and_rail_profile"]')) return true;
    } catch (e) {}
    return false;
  }

  /** List price from metaobject (price_value / price_type fixed) for selected stile/rail profile. */
  function getStileAndRailProfileListPriceFromSchema() {
    try {
      var schema = window.__doorConfigSchema;
      if (!Array.isArray(schema)) return 0;
      var root = document.getElementById('door-configurator-options') || document;
      var sOpt = null;
      for (var si = 0; si < schema.length; si++) {
        if (schema[si] && String(schema[si].id || '').toLowerCase().replace(/-/g, '_') === 'stile_and_rail_profile') {
          sOpt = schema[si];
          break;
        }
      }
      if (!sOpt) return 0;
      var checked = root.querySelector(
        'input[type="radio"][data-option-id="stile_and_rail_profile"]:checked,' +
        'input[type="radio"][name="attributes[Stile and Rail Profile]"]:checked'
      );
      if (!checked || checked.value == null || checked.value === '') return 0;
      var val = String(checked.value);
      var choices = Array.isArray(sOpt.options) ? sOpt.options : [];
      for (var j = 0; j < choices.length; j++) {
        var c = choices[j];
        if (String(c && c.value != null ? c.value : '') !== val) continue;
        var t = c.priceType || c.price_type || 'fixed';
        var v = parseFloat(c.priceValue != null ? c.priceValue : c.price_value);
        if (isNaN(v)) v = 0;
        if (t === 'percent') {
          var base = readScreenStormProductBasePriceFromDom();
          return base * v;
        }
        return v;
      }
    } catch (e) {}
    return 0;
  }

  function getScreenStormAddonTotalSum() {
    syncScreenStormAddonGateState();
    var measSum = 0;
    if (screenStormPlainDoorMeasurementPricingEnabled()) {
      measSum =
        (parseFloat(window.__doorScreenStormAddon_oversized || 0) || 0)
        + (parseFloat(window.__doorScreenStormAddon_thickness || 0) || 0);
      if (screenStormThicknessUpgradePricingEnabled()) {
        measSum += (parseFloat(window.__doorScreenStormAddon_thickness_frac || 0) || 0);
      }
    }
    var sidelightSum = 0;
    if (screenStormSidelightChartPricingEnabled()) {
      sidelightSum =
        (parseFloat(window.__doorScreenStormAddon_sidelight_transom || 0) || 0)
        + (parseFloat(window.__doorScreenStormAddon_transom_combo || 0) || 0);
    }
    var panelThickSum = 0;
    if (screenStormPanelThicknessExtraPricingEnabled()) {
      panelThickSum = parseFloat(window.__doorScreenStormAddon_panel_door_thickness_extra || 0) || 0;
    }
    return (
      measSum
      + sidelightSum
      + panelThickSum
      + (parseFloat(window.__doorScreenStormAddon_wide_sidelight_base_wood || 0) || 0)
      + (parseFloat(window.__doorScreenStormAddon_tall_transom_base_wood || 0) || 0)
      + (parseFloat(window.__doorScreenStormAddon_stile_and_rail_profile || 0) || 0)
    );
  }

  /**
   * Stile/rail: add full list price on current total; switching to $0 removes prior profile price.
   * newTotal = display − lastStilePrice + newStilePrice
   */
  function getSelectedStileAndRailProfileValue() {
    try {
      var root = document.getElementById('door-configurator-options') || document;
      var checked = root.querySelector(
        'input[type="radio"][data-option-id="stile_and_rail_profile"]:checked,' +
        'input[type="radio"][name="attributes[Stile and Rail Profile]"]:checked'
      );
      return checked && checked.value != null ? String(checked.value) : '';
    } catch (e) {}
    return '';
  }

  function applyScreenStormStileAndRailProfilePriceUpdate() {
    try {
      var el = document.getElementById('door-estimated-price');
      if (!el) {
        doorPriceDebugLog('stile_and_rail_profile_skip', { reason: 'no #door-estimated-price' });
        return;
      }
      var prevStile = parseFloat(window.__doorLastStileRailListPrice) || 0;
      var newStile = getStileAndRailProfileListPriceFromSchema();
      window.__doorLastStileRailListPrice = newStile;
      window.__doorScreenStormAddon_stile_and_rail_profile = newStile;
      window['__doorAddon_stile_and_rail_profile'] = newStile;
      window.__doorScreenStormAddonPrice = getScreenStormAddonTotalSum();
      if (
        window.DoorIntExtPricingRule
        && typeof window.DoorIntExtPricingRule.syncEstimatedPriceDisplay === 'function'
      ) {
        window.DoorIntExtPricingRule.syncEstimatedPriceDisplay({
          source: 'applyScreenStormStileAndRailProfilePriceUpdate',
          userAction: true,
          stileAddon: newStile,
          prevStile: prevStile
        });
      } else {
        syncScreenStormPriceDisplay({
          source: 'applyScreenStormStileAndRailProfilePriceUpdate',
          userAction: true,
          stileAddon: newStile
        });
      }
    } catch (eStile) {
      doorPriceDebugLog('stile_and_rail_profile_error', { message: eStile && eStile.message ? eStile.message : String(eStile) });
    }
  }

  function getScreenStormThemeOptionTotal() {
    var theme = parseFloat(window.__doorThemeOptionTotal) || 0;
    if (theme > 0) return theme;
    return readScreenStormProductBasePriceFromDom();
  }

  function getScreenStormIntExtAddonTotal() {
    try {
      if (
        window.DoorIntExtPricingRule
        && typeof window.DoorIntExtPricingRule.getDoorAddonTotalSum === 'function'
      ) {
        return window.DoorIntExtPricingRule.getDoorAddonTotalSum();
      }
    } catch (eIntExt) {}
    return (
      (parseFloat(window['__doorAddon_storm_glass'] || 0) || 0) +
      (parseFloat(window['__doorAddon_stile_and_rail_profile'] || 0) || 0) +
      (parseFloat(window['__doorAddon_intExtOversizedApi'] || 0) || 0) +
      (parseFloat(window['__doorAddon_sidelightTransomOversized'] || 0) || 0) +
      (parseFloat(window['__doorAddon_sidelightTransomOversizedPair1'] || 0) || 0) +
      (parseFloat(window['__doorAddon_sidelightTransomOversizedPair2'] || 0) || 0)
    );
  }

  /**
   * Full display total: schema/theme + API add-ons (storm glass, int/ext, etc.) + screen/storm chart add-ons.
   * Prefer DoorIntExtPricingRule.syncEstimatedPriceDisplay so all layers stay in sync.
   */
  function syncScreenStormPriceDisplay(meta, attempt) {
    try {
      var syncMeta = Object.assign({ source: 'syncScreenStormPriceDisplay' }, meta || {});
      if (!syncMeta.userAction) syncMeta.silent = true;
      var tryNum = parseInt(String(attempt), 10) || 0;

      if (window.__doorScreenStormUpdatingPrice || window.__doorIntExtSyncing) {
        if (syncMeta.userAction && tryNum < 20) {
          clearTimeout(window.__doorScreenStormDeferredSyncT);
          window.__doorScreenStormDeferredSyncT = setTimeout(function () {
            syncScreenStormPriceDisplay(syncMeta, tryNum + 1);
          }, 100);
        } else if (syncMeta.userAction && tryNum >= 20) {
          ensureScreenStormPriceAppliedToDom(syncMeta);
        }
        return;
      }
      if (!document.getElementById('door-estimated-price')) return;

      window.__doorScreenStormAddonPrice = getScreenStormAddonTotalSum();

      if (
        window.DoorIntExtPricingRule
        && typeof window.DoorIntExtPricingRule.syncEstimatedPriceDisplay === 'function'
      ) {
        window.DoorIntExtPricingRule.syncEstimatedPriceDisplay(syncMeta);
        return;
      }

      var theme = getScreenStormThemeOptionTotal();
      var intExtAddons = getScreenStormIntExtAddonTotal();
      var stormAddons = getScreenStormAddonTotalSum();
      var nextTotal = theme + intExtAddons + stormAddons;
      var shown = 0;
      try {
        var el = document.getElementById('door-estimated-price');
        if (el) shown = parseMoneyText(el.textContent);
      } catch (eRead) {}
      if (!syncMeta.userAction && shown > 0 && Math.abs(shown - nextTotal) < 0.05) return;

      window.__doorScreenStormUpdatingPrice = true;
      writeScreenStormEstimatedPrice(nextTotal, syncMeta);
      setTimeout(function () { window.__doorScreenStormUpdatingPrice = false; }, 120);
    } catch (eSync) {
      window.__doorScreenStormUpdatingPrice = false;
    }
  }

  /**
   * Always-on console breakdown so you can verify how much price each selected item
   * adds/removes/updates on top of the base price. Prints: base product price, every
   * screen/storm addon contribution (+/-), the gated addon layer, theme + int/ext, and
   * the final estimated total as displayed.
   */
  function logScreenStormBasePriceAddonBreakdown(changedKey, changedAmount) {
    try {
      var basePrice = readScreenStormProductBasePriceFromDom();
      var theme = parseFloat(window.__doorThemeOptionTotal) || 0;
      try {
        if (window.DoorIntExtPricingRule && typeof window.DoorIntExtPricingRule.getThemeOptionTotal === 'function') {
          var tFromRule = window.DoorIntExtPricingRule.getThemeOptionTotal();
          if (tFromRule > theme) theme = tFromRule;
        }
      } catch (eTh) {}
      var intExt = 0;
      try {
        if (window.DoorIntExtPricingRule && typeof window.DoorIntExtPricingRule.getDoorAddonTotalSum === 'function') {
          intExt = window.DoorIntExtPricingRule.getDoorAddonTotalSum() || 0;
        }
      } catch (eIe) {}
      var layer = getScreenStormAddonTotalSum();
      var estimatedTotal = computeScreenStormLayeredDisplayTotal();
      console.log("estimatedTotal",estimatedTotal);
      var addonRows = [
        ['oversized (door size chart)', window.__doorScreenStormAddon_oversized],
        ['thickness (chart)', window.__doorScreenStormAddon_thickness],
        ['thickness upgrade (fraction)', window.__doorScreenStormAddon_thickness_frac],
        ['sidelight/transom chart', window.__doorScreenStormAddon_sidelight_transom],
        ['transom combo', window.__doorScreenStormAddon_transom_combo],
        ['panel door thickness extra', window.__doorScreenStormAddon_panel_door_thickness_extra],
        ['wide sidelight base+wood', window.__doorScreenStormAddon_wide_sidelight_base_wood],
        ['tall transom base+wood', window.__doorScreenStormAddon_tall_transom_base_wood],
        ['stile & rail profile', window.__doorScreenStormAddon_stile_and_rail_profile],
        ['storm glass', window['__doorAddon_storm_glass']]
      ];
      var table = {};
      for (var i = 0; i < addonRows.length; i++) {
        table[addonRows[i][0]] = { 'price (+/-)': parseFloat(addonRows[i][1] || 0) || 0 };
      }
      console.groupCollapsed('[door-price] ' + String(changedKey || 'update') + ' -> changed by ' + (parseFloat(changedAmount || 0) || 0));
      console.log('Base product price :', basePrice);
      console.table(table);
      console.log('Addon layer (storm):', layer);
      console.log('Theme options      :', theme);
      console.log('Int/Ext addons     :', intExt);
      console.log('Estimated total    :', estimatedTotal, '(base+theme+int/ext+addons, as displayed)');
      console.groupEnd();
    } catch (eLog) {}
  }

  function applyScreenStormAddonToEstimatedPrice(price, addonKey) {
    try {
      if (!document.getElementById('door-estimated-price')) return;

      var storeKey = '__doorScreenStormAddon_' + String(addonKey || 'oversized');
      var nextAddon = parseFloat(price || 0) || 0;
      if (nextAddon < 0) nextAddon = 0;
      if (!screenStormAddonKeyAllowed(addonKey, nextAddon)) {
        nextAddon = 0;
      }

      window[storeKey] = nextAddon;
      window.__doorScreenStormAddonPrice = getScreenStormAddonTotalSum();

      var syncMeta = {
        source: 'screen_storm_addon',
        userAction: true,
        forceLog: true,
        addonKey: addonKey,
        addonAmount: nextAddon,
        layerTotal: window.__doorScreenStormAddonPrice
      };

      doorPriceDebugLog('addon_set', {
        addonKey: addonKey,
        addonAmount: nextAddon,
        layerTotal: window.__doorScreenStormAddonPrice,
        shownBefore: readScreenStormEstimatedPriceFromDom()
      });

      var directTotal = computeScreenStormLayeredDisplayTotal();
      consoleLogEstimatedPrice({
        addonKey: addonKey,
        addonAmount: nextAddon,
        layerTotal: window.__doorScreenStormAddonPrice,
        estimatedTotal: directTotal,
        shownBefore: readScreenStormEstimatedPriceFromDom()
      });
      logScreenStormBasePriceAddonBreakdown(addonKey, nextAddon);
      if (
        window.DoorIntExtPricingRule
        && typeof window.DoorIntExtPricingRule.writeEstimatedPriceDisplay === 'function'
        && directTotal > 0.01
      ) {
        window.DoorIntExtPricingRule.writeEstimatedPriceDisplay(directTotal, Object.assign({}, syncMeta, {
          source: 'screen_storm_addon_direct',
          displayTotal: directTotal,
          screenStormAddon: window.__doorScreenStormAddonPrice
        }));
        doorPriceDebugLog('addon_direct_write', {
          directTotal: directTotal,
          theme: parseFloat(window.__doorThemeOptionTotal) || 0,
          layer: window.__doorScreenStormAddonPrice
        });
      }

      syncScreenStormPriceDisplay(syncMeta);
      setTimeout(function () { ensureScreenStormPriceAppliedToDom(syncMeta); }, 60);
      setTimeout(function () { ensureScreenStormPriceAppliedToDom(syncMeta); }, 300);
    } catch (e) { }
  }

  function isScreenStormDoorHeightMeasurementTarget(t) {
    if (!t || !t.id) return false;
    var id = String(t.id);
    return id === 'door_height' || id === 'door_height_fraction' || id.indexOf('door_height') === 0;
  }

  function isScreenStormPanelDoorWidthMeasurementTarget(t) {
    if (!t || !t.id) return false;
    var id = String(t.id);
    return id.indexOf('panel-door-width-int') === 0
      || id.indexOf('panel-door-width-frac') === 0
      || id === 'panel-door-width-int'
      || id === 'panel-door-width-frac';
  }

  /** Plain screen/storm chart pricing: only width + height measurement fields (API on change). */
  function isScreenStormPlainDoorOversizedPricingChange(t) {
    if (!t) return false;
    return isScreenStormPanelDoorWidthMeasurementTarget(t)
      || isExactDoorWidthMeasurementTarget(t)
      || isScreenStormDoorHeightMeasurementTarget(t);
  }

  function screenStormSelectUserConfirmed(selector) {
    try {
      return !!document.querySelector(selector);
    } catch (eSel) {}
    return false;
  }

  function screenStormPlainDoorWidthUserConfirmed() {
    return screenStormSelectUserConfirmed(
      'select[id^="panel-door-width-int"][data-door-user-changed="1"],' +
      'select[id^="panel-door-width-frac"][data-door-user-changed="1"],' +
      'select#exact-door-width-int[data-door-user-changed="1"],' +
      'select[id^="exact-door-width-int"][data-door-user-changed="1"]'
    );
  }

  /**
   * When the customer actively changes ONE plain-door dimension (e.g. height), confirm any
   * width/height select that already holds a valid value. This lets the price recalculate on
   * a single change (with the other dimension already selected) instead of forcing a re-select
   * of both. Empty/unset dimensions are left unconfirmed, so untouched fields still don't price.
   */
  function confirmScreenStormPlainDoorDimensionSelects() {
    var sels;
    try {
      sels = document.querySelectorAll(
        'select[id^="panel-door-width-int"], select[id^="panel-door-width-frac"],' +
        'select#exact-door-width-int, select[id^="exact-door-width-int"],' +
        'select#exact-door-width-frac, select[id^="exact-door-width-frac"],' +
        'select#door_height, select[id^="door_height"], select#door_height_fraction'
      );
    } catch (eSel) { return; }
    if (!sels) return;
    Array.prototype.forEach.call(sels, function (s) {
      if (!s || !s.setAttribute) return;
      var v = s.value;
      if (v == null || String(v).trim() === '') return;
      s.setAttribute('data-door-user-changed', '1');
    });
  }

  function screenStormPlainDoorHeightUserConfirmed() {
    return screenStormSelectUserConfirmed(
      'select#door_height[data-door-user-changed="1"],' +
      'select#door_height_fraction[data-door-user-changed="1"],' +
      'select[id^="door_height"][data-door-user-changed="1"]'
    );
  }

  /** Plain door oversized + thickness API only after customer changes width and height. */
  function screenStormPlainDoorMeasurementPricingEnabled() {
    if (!isScreenAndStormDoorsProductType()) return false;
    return screenStormPlainDoorWidthUserConfirmed() && screenStormPlainDoorHeightUserConfirmed();
  }

  function screenStormSidelightChartPricingEnabled() {
    if (!isScreenAndStormDoorsProductType()) return false;
    if (!isScreenStormSidelightOrTransomStyleSelected()) return false;
    if (isScreenStormTransomStyleSelected()) {
      return screenStormSelectUserConfirmed(
        'select[id^="panel-transom-height"][data-door-user-changed="1"]'
      ) && screenStormSelectUserConfirmed(
        'select[id^="panel-door-width"][data-door-user-changed="1"]'
      );
    }
    return screenStormSelectUserConfirmed(
      'select#sidelight_width[data-door-user-changed="1"], select[id^="sidelight_width"][data-door-user-changed="1"]'
    ) && screenStormPlainDoorHeightUserConfirmed();
  }

  var SCREEN_STORM_MEASUREMENT_ADDON_KEYS = {
    oversized: true,
    thickness: true,
    thickness_frac: true
  };

  var SCREEN_STORM_PANEL_THICKNESS_ADDON_KEYS = {
    panel_door_thickness_extra: true
  };

  var SCREEN_STORM_SIDELIGHT_CHART_ADDON_KEYS = {
    sidelight_transom: true,
    transom_combo: true
  };

  function screenStormThicknessFracUserConfirmed() {
    if (window.__screenStormUserSetThicknessAt > 0) return true;
    return screenStormSelectUserConfirmed(
      'select#exact-door-thickness-frac[data-door-user-changed="1"],' +
      'select[id^="exact-door-thickness-frac"][data-door-user-changed="1"],' +
      'select#door-thickness[data-door-user-changed="1"],' +
      'select[id^="finished-door-thickness"][data-door-user-changed="1"]'
    );
  }

  /** Plain-door thickness upgrade ($165 @ 1.5") — only after width+height set AND thickness picked. */
  function screenStormThicknessUpgradePricingEnabled() {
    if (!screenStormPlainDoorMeasurementPricingEnabled()) return false;
    return screenStormThicknessFracUserConfirmed();
  }

  function screenStormPanelThicknessExtraPricingEnabled() {
    if (!screenStormSidelightChartPricingEnabled()) return false;
    if (window.__screenStormUserSetPanelThicknessAt > 0) return true;
    return screenStormSelectUserConfirmed(
      'select#panel-door-thickness-frac[data-door-user-changed="1"],' +
      'select[id^="panel-door-thickness-frac"][data-door-user-changed="1"]'
    );
  }

  /** Storm glass API add-on requires an active sidelight/transom style formula. */
  function clearScreenStormStormGlassAddonIfNoStyles() {
    if (!isScreenAndStormDoorsProductType()) return;
    if (!isScreenStormSidelightOrTransomStyleSelected()) {
      window['__doorAddon_storm_glass'] = 0;
    }
  }

  function syncScreenStormAddonGateState() {
    clearScreenStormStormGlassAddonIfNoStyles();
    if (!screenStormPlainDoorMeasurementPricingEnabled()) {
      window.__doorScreenStormAddon_oversized = 0;
      window.__doorScreenStormAddon_thickness = 0;
      window.__doorScreenStormAddon_thickness_frac = 0;
      try { window.__lastDoorThicknessInches = 0; } catch (eThkClr) {}
    } else if (!screenStormThicknessUpgradePricingEnabled()) {
      window.__doorScreenStormAddon_thickness_frac = 0;
    }
    if (!screenStormSidelightChartPricingEnabled()) {
      window.__doorScreenStormAddon_sidelight_transom = 0;
      window.__doorScreenStormAddon_transom_combo = 0;
    }
    if (!screenStormPanelThicknessExtraPricingEnabled()) {
      window.__doorScreenStormAddon_panel_door_thickness_extra = 0;
    }
  }

  function screenStormAddonKeyAllowed(addonKey, nextAddon) {
    var key = String(addonKey || '');
    if (nextAddon <= 0) return true;
    if (key === 'thickness_frac') {
      return screenStormThicknessUpgradePricingEnabled();
    }
    if (SCREEN_STORM_MEASUREMENT_ADDON_KEYS[key]) {
      return screenStormPlainDoorMeasurementPricingEnabled();
    }
    if (SCREEN_STORM_PANEL_THICKNESS_ADDON_KEYS[key]) {
      return screenStormPanelThicknessExtraPricingEnabled();
    }
    if (SCREEN_STORM_SIDELIGHT_CHART_ADDON_KEYS[key]) {
      return screenStormSidelightChartPricingEnabled();
    }
    return true;
  }

  function readScreenStormPlainDoorMeasurements(t) {
    if (!isScreenStormSidelightOrTransomStyleSelected()) {
      return {
        width: readWidthFromDom(t),
        height: readHeightFromDom(t)
      };
    }
    var width = 0;
    if (t && isScreenStormPanelDoorWidthMeasurementTarget(t)) {
      width = readPanelDoorWidthFromEventTarget(t) || readPanelDoorWidthFromDom();
    }
    if (t && !width && isExactDoorWidthMeasurementTarget(t)) {
      width = readIntFracPairFromMeasurementEventTarget(t) || readWidthFromDom(t);
    }
    if (!width) width = readPanelDoorWidthFromDom();
    if (!width) width = readWidthFromDom(t);
    var height = readHeightFromDom(t);
    return { width: width, height: height };
  }

  function isScreenStormMeasurementChange(t) {
    return isScreenStormPlainDoorOversizedPricingChange(t);
  }

  function isScreenStormSetupChange(t) {
    if (!t) return false;
    var val = norm(t.value);
    return val === 'slab_only' || val === 'pre_hung_on_jamb';
  }

  function isScreenStormPrehungSelection(t) {
    if (!t) return false;
    return norm(t.value) === 'pre_hung_on_jamb';
  }

  function isScreenStormPlainDoorThicknessSelectId(id) {
    id = String(id || '');
    if (!id) return false;
    return id === 'exact-door-thickness-frac'
      || id === 'exact-door-thickness-int'
      || id === 'door-thickness'
      || id === 'finished-door-thickness'
      || id.indexOf('exact-door-thickness-frac') === 0
      || id.indexOf('finished-door-thickness') === 0;
  }

  function isScreenStormThicknessFracChange(t) {
    if (!t || !t.id) return false;
    if (isScreenStormSidelightOrTransomStyleSelected()) return false;
    return isScreenStormPlainDoorThicknessSelectId(t.id);
  }

  function isScreenStormPanelDoorThicknessFracChange(t) {
    if (!t || !t.id) return false;
    var id = String(t.id);
    if (isScreenStormSidelightAndTransomComboSelected()) {
      return id === 'panel-door-thickness-frac__33_0';
    }
    if (isScreenStormTransomStyleSelected()) {
      return id === 'panel-door-thickness-frac__29_0';
    }
    if (isScreenStormSidelightStyleSelected()) {
      return id === 'panel-door-thickness-frac';
    }
    return false;
  }

  function readPanelDoorThicknessInchesFromEl(el) {
    if (!el) return 0;
    try {
      var si = el.selectedIndex;
      var opt = el.options && si >= 0 ? el.options[si] : null;
      var raw = opt != null && opt.value != null && String(opt.value).trim() !== ''
        ? opt.value
        : (el.value != null ? el.value : '');
      var t = parsePanelThicknessInches(raw);
      if (!t && opt && opt.textContent) t = parsePanelThicknessInches(opt.textContent);
      return t;
    } catch (e) { }
    return 0;
  }

  function applyScreenStormPanelDoorThicknessExtraPricingFromDom(changedEl) {
    if (!isScreenAndStormDoorsProductType()) return;

    if (!screenStormPanelThicknessExtraPricingEnabled()) {
      applyScreenStormAddonToEstimatedPrice(0, 'panel_door_thickness_extra');
      return;
    }

    if (!isScreenStormSidelightOrTransomPanelRowVisible()) {
      applyScreenStormAddonToEstimatedPrice(0, 'panel_door_thickness_extra');
      return;
    }

    if (isScreenStormSidelightOrTransomStyleSelected()) {
      if (isScreenStormTransomStyleSelected() && readPanelTransomHeightFromDom() >= 24) {
        applyScreenStormAddonToEstimatedPrice(0, 'panel_door_thickness_extra');
        return;
      }
      if (isScreenStormSidelightStyleSelected() && readSidelightWidthFromDom() >= 24) {
        applyScreenStormAddonToEstimatedPrice(0, 'panel_door_thickness_extra');
        return;
      }

      var chartDims = readScreenStormSidelightTransomChartWH(null);
      if (chartDims.w > 0 && chartDims.h > 0) {
        var chartBucket = resolveSidelightTransomBucket(chartDims.w, chartDims.h);
        if (isScreenStormPanelThicknessDisallowedByMatrix(chartBucket)) {
          applyScreenStormAddonToEstimatedPrice(0, 'panel_door_thickness_extra');
          return;
        }
      }
    }

    var setup = getDoorSetupFromDom();
    if (!setup) {
      applyScreenStormAddonToEstimatedPrice(0, 'panel_door_thickness_extra');
      return;
    }

    var el = (changedEl && changedEl.options) ? changedEl : getVisiblePanelDoorThicknessFracEl();
    if (!el) {
      applyScreenStormAddonToEstimatedPrice(0, 'panel_door_thickness_extra');
      return;
    }

    var thickness = readPanelDoorThicknessInchesFromEl(el);
    if (!thickness || thickness <= 0) {
      applyScreenStormAddonToEstimatedPrice(0, 'panel_door_thickness_extra');
      return;
    }

    window.__doorScreenStormPanelThicknessExtraToken = (parseInt(String(window.__doorScreenStormPanelThicknessExtraToken), 10) || 0) + 1;
    var panelToken = window.__doorScreenStormPanelThicknessExtraToken;

    fetchScreenStormThicknessFracPriceViaProxy(thickness)
      .then(function (json) {
        if (panelToken !== window.__doorScreenStormPanelThicknessExtraToken) return;
        var price = resolveScreenStormThicknessFracPrice(thickness, setup, json);
        if (price == null || price < 0) price = 0;
        applyScreenStormAddonToEstimatedPrice(price, 'panel_door_thickness_extra');
      })
      .catch(function () {
        if (panelToken !== window.__doorScreenStormPanelThicknessExtraToken) return;
        var price = lookupScreenStormThicknessUpgradePrice(thickness, setup);
        applyScreenStormAddonToEstimatedPrice(price != null ? price : 0, 'panel_door_thickness_extra');
      });
  }

  /**
   * THICKNESS UPGRADE PRICES — yahan edit karein.
   * Chart: "THICKNESS UPGRADES OR DOWNGRADE — 1 1/8" is Standard"
   * Used for exact-door-thickness-frac AND panel-door-thickness-frac (__29_0).
   * inches: 1.25 = 1 1/4", 1.375 = 1 3/8", 1.125 = 1 1/8" (standard $0)
   */
  var SCREEN_STORM_THICKNESS_UPGRADE_PRICES = [
    { inches: 1, label: '1"', slab: 30, prehung: 30 },
    { inches: 1.125, label: '1 1/8"', slab: 0, prehung: 0 },
    { inches: 1.25, label: '1 1/4"', slab: 85, prehung: 165 },
    { inches: 1.375, label: '1 3/8"', slab: 140, prehung: 250 },
    { inches: 1.5, label: '1 1/2"', slab: 165, prehung: 330 },
    { inches: 1.75, label: '1 3/4"', slab: 220, prehung: 440 },
    { inches: 2, label: '2"', slab: 440, prehung: 880 },
    { inches: 2.25, label: '2 1/4"', slab: 440, prehung: 880 }
  ];

  function lookupScreenStormThicknessUpgradePrice(thicknessInches, setup) {
    var t = parseFloat(thicknessInches);
    if (isNaN(t) || t <= 0) return null;
    var isPrehung = setup === 'pre_hung_on_jamb';
    for (var i = 0; i < SCREEN_STORM_THICKNESS_UPGRADE_PRICES.length; i++) {
      var row = SCREEN_STORM_THICKNESS_UPGRADE_PRICES[i];
      if (approxEq(t, row.inches, 0.03)) {
        return isPrehung ? toNum(row.prehung) : toNum(row.slab);
      }
    }
    return null;
  }

  function fetchScreenStormThicknessFracPriceViaProxy(thicknessInches) {
    if (!isDoorPricingApiEnabled()) return emptyScreenStormProxyResponse();
    var t = parseFloat(thicknessInches);
    if (isNaN(t) || t <= 0) return Promise.reject(new Error('missing thickness'));

    var base = (window.DOOR_PRICING_RULE_PROXY_BASE || 'https://vintage.espirevox.com');
    base = String(base || '').replace(/\/+$/, '');
    var url = base + '/screen-storm-thickness-prices.php?thickness=' + encodeURIComponent(String(t));

    return fetch(url, { mode: 'cors', credentials: 'omit' })
      .then(function (r) {
        if (!r || !r.ok) throw new Error('bad response');
        return r.json();
      });
  }

  function resolveScreenStormThicknessFracPriceFromResponse(json, setup) {
    var record = json && json.records && json.records[0] ? json.records[0] : null;
    var isPrehung = setup === 'pre_hung_on_jamb';
    var price = null;
    if (isPrehung) {
      price = json && json.price_prehung != null ? json.price_prehung : getFieldFromRecord(record, 'price_prehung');
    } else {
      price = json && json.price_slab != null ? json.price_slab : getFieldFromRecord(record, 'price_slab');
    }
    return normalizeProxyPrice(price);
  }

  /** JS table first; API only when thickness not in table. */
  function resolveScreenStormThicknessFracPrice(thicknessInches, setup, json) {
    var tablePrice = lookupScreenStormThicknessUpgradePrice(thicknessInches, setup);
    if (tablePrice !== null) return tablePrice;
    if (json) return resolveScreenStormThicknessFracPriceFromResponse(json, setup);
    return 0;
  }

  function applyScreenStormThicknessFracPricingFromDom() {
    if (!isScreenAndStormDoorsProductType()) return;

    if (!screenStormThicknessUpgradePricingEnabled()) {
      applyScreenStormAddonToEstimatedPrice(0, 'thickness_frac');
      return;
    }

    var setup = getDoorSetupFromDom();
    if (!setup) return;

    var thickness = readThicknessFromDom();
    if (!thickness) {
      applyScreenStormAddonToEstimatedPrice(0, 'thickness_frac');
      return;
    }

    var tablePriceNow = lookupScreenStormThicknessUpgradePrice(thickness, setup);
    if (tablePriceNow !== null) {
      applyScreenStormAddonToEstimatedPrice(0, 'thickness');
      applyScreenStormAddonToEstimatedPrice(tablePriceNow, 'thickness_frac');
      return;
    }

    fetchScreenStormThicknessFracPriceViaProxy(thickness)
      .then(function (json) {
        var price = resolveScreenStormThicknessFracPrice(thickness, setup, json);
        if (price == null || price < 0) price = 0;
        applyScreenStormAddonToEstimatedPrice(0, 'thickness');
        applyScreenStormAddonToEstimatedPrice(price, 'thickness_frac');
      })
      .catch(function () {
        var price = lookupScreenStormThicknessUpgradePrice(thickness, setup);
        applyScreenStormAddonToEstimatedPrice(0, 'thickness');
        applyScreenStormAddonToEstimatedPrice(price != null ? price : 0, 'thickness_frac');
      });
  }

  function setSelectsByIdToValue(id, val) {
    try {
      var safeId = String(id).replace(/[^a-zA-Z0-9_-]/g, '');
      var els = document.querySelectorAll('#' + safeId + ', select[id^="' + safeId + '"]');
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        if (!el || !el.options || !el.options.length) continue;
        setMeasurementSelectValueOnEl(el, val);
      }
    } catch (e) { }
  }

  function setMeasurementSelectValueOnEl(sel, val) {
    if (!sel) return;
    var want = String(val == null ? '' : val);
    for (var oi = 0; oi < sel.options.length; oi++) {
      if (String(sel.options[oi].value) === want) {
        sel.selectedIndex = oi;
        return;
      }
    }
    sel.value = want;
  }

  function applyDefaultExactDoorThicknessFracToDom() {
    var def = '1.125';
    try {
      if (
        window.DoorConf2Measurements
        && typeof window.DoorConf2Measurements.getDefaultExactDoorThicknessFracValue === 'function'
      ) {
        def = window.DoorConf2Measurements.getDefaultExactDoorThicknessFracValue();
      }
    } catch (eDef) {}
    setSelectsByIdToValue('exact-door-thickness-frac', def);
    setSelectsByIdToValue('door-thickness', def);
    var defNum = parseFloat(def);
    if (!isNaN(defNum) && defNum > 0) {
      try { window.__lastDoorThicknessInches = defNum; } catch (eThk) {}
    }
  }

  /**
   * Once width + height drive the thickness, the dropdown must never sit on the "0"
   * placeholder. If the current thickness is 0/empty (e.g. the chart returned no value),
   * fall back to the valid non-zero default. Skips when the customer set thickness manually.
   */
  function ensureScreenStormThicknessNotZero() {
    if (isScreenStormUserThicknessRecentlySet()) return;
    try {
      var els = findPlainDoorThicknessFracSelectNodes();
      var needsDefault = false;
      for (var ei = 0; ei < els.length; ei++) {
        var el = els[ei];
        if (!el || !el.options || !el.options.length) continue;
        var cur = parseDropdownNumber(el.value);
        if (isNaN(cur) || cur <= 0) { needsDefault = true; break; }
      }
      if (needsDefault) applyDefaultExactDoorThicknessFracToDom();
    } catch (e) { }
  }

  function resetSelectsByIdToFirstOption(id) {
    try {
      var els = document.querySelectorAll('#' + String(id).replace(/[^a-zA-Z0-9_-]/g, ''));
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        if (!el || !el.options || !el.options.length) continue;
        var chosen = -1;
        for (var oi = 0; oi < el.options.length; oi++) {
          var opt = el.options[oi];
          if (!opt || opt.disabled || opt.hidden) continue;
          chosen = oi;
          break;
        }
        if (chosen >= 0) el.selectedIndex = chosen;
      }
    } catch (e) { }
  }

  function resetScreenStormMeasurementsAndThickness() {
    resetSelectsByIdToFirstOption('exact-door-width-int');
    resetSelectsByIdToFirstOption('exact-door-width-frac');
    setSelectsByIdToValue('door_height', '82');
    setSelectsByIdToValue('door_height_fraction', '0');
    resetSelectsByIdToFirstOption('exact-door-thickness-int');
    applyDefaultExactDoorThicknessFracToDom();
    try { syncScreenStormPlainDoorThicknessRowVisibility(true); } catch (eHide) { }
    try { window.__screenStormUserSetPanelThicknessAt = 0; } catch (e) { }
    try { window.__screenStormUserSetThicknessAt = 0; } catch (e) { }
    resetExactDoorThicknessFracOptions();
    applyScreenStormAddonToEstimatedPrice(0, 'oversized');
    applyScreenStormAddonToEstimatedPrice(0, 'thickness');
    applyScreenStormAddonToEstimatedPrice(0, 'thickness_frac');
    applyScreenStormAddonToEstimatedPrice(0, 'sidelight_transom');
    applyScreenStormAddonToEstimatedPrice(0, 'transom_combo');
    applyScreenStormAddonToEstimatedPrice(0, 'panel_door_thickness_extra');
    applyScreenStormAddonToEstimatedPrice(0, 'wide_sidelight_base_wood');
    applyScreenStormAddonToEstimatedPrice(0, 'tall_transom_base_wood');
    applyScreenStormAddonToEstimatedPrice(0, 'stile_and_rail_profile');
    try { window.__doorLastStileRailListPrice = 0; } catch (eStileR) {}
    try { syncScreenStormPanelDoorThicknessRowForMatrix(null); } catch (eSync) { }
    try { restorePanelDoorThicknessFracOptionsFromSidelightTransomFilter(); } catch (eRst) { }
  }

  function syncScreenStormThicknessFromChart(width, height, setup, pricingToken) {
    var tableKey = buildThicknessTableKey(width, height);
    if (!tableKey) return Promise.resolve(null);

    return fetchPricingRuleScreenStormByTableKey(tableKey, 'thickness_chart')
      .then(function (json) {
        if (pricingToken != null && pricingToken !== window.__doorScreenStormPricingToken) return json;
        var thicknessRaw = resolveScreenStormThicknessFromResponse(json);
        console.log("thicknessRaw",thicknessRaw);
        var userRecentlySetThickness = isScreenStormUserThicknessRecentlySet();
        if (!userRecentlySetThickness && thicknessRaw != null && String(thicknessRaw).trim() !== '') {
          setExactDoorThicknessFracFromMeta(thicknessRaw);
          ensureScreenStormThicknessNotZero();
        } else if (!userRecentlySetThickness) {
          ensureScreenStormThicknessNotZero();
          syncScreenStormPlainDoorThicknessRowVisibility(false);
        }
        var price = resolveScreenStormThicknessPriceFromResponse(json, setup);
        if (price == null || price < 0) price = 0;
        if (userRecentlySetThickness) {
          applyScreenStormAddonToEstimatedPrice(0, 'thickness');
        } else {
          applyScreenStormAddonToEstimatedPrice(price, 'thickness');
          applyScreenStormAddonToEstimatedPrice(0, 'thickness_frac');
        }
        return json;
      })
      .catch(function () {
        if (pricingToken != null && pricingToken !== window.__doorScreenStormPricingToken) return null;
        applyScreenStormAddonToEstimatedPrice(0, 'thickness');
        return null;
      });
  }

  function applyScreenStormOversizedPricing(t) {
    if (!isScreenAndStormDoorsProductType()) return;
    if (!t || !isScreenStormPlainDoorOversizedPricingChange(t)) return;

    var setup = getDoorSetupFromDom();
    if (!setup) return;

    if (!screenStormPlainDoorMeasurementPricingEnabled()) {
      applyScreenStormAddonToEstimatedPrice(0, 'oversized');
      applyScreenStormAddonToEstimatedPrice(0, 'thickness');
      applyScreenStormAddonToEstimatedPrice(0, 'thickness_frac');
      try { syncScreenStormPlainDoorThicknessRowVisibility(false); } catch (eHideGate) { }
      return;
    }

    var m = readScreenStormPlainDoorMeasurements(t);
    var prefixForLog = computeScreenStormOversizedPrefix();
    logScreenStormWidthHeightRangeLookup(m.width, m.height, {
      source: 'applyScreenStormOversizedPricing',
      fieldId: t && t.id ? String(t.id) : '',
      prefix: prefixForLog
    });
    if (!m.width || !m.height) {
      applyScreenStormAddonToEstimatedPrice(0, 'oversized');
      applyScreenStormAddonToEstimatedPrice(0, 'thickness');
      try { syncScreenStormPlainDoorThicknessRowVisibility(false); } catch (eHideDim) { }
      return;
    }

    var prefix = computeScreenStormOversizedPrefix();
    if (!prefix) return;

    window.__doorScreenStormPricingToken = (parseInt(String(window.__doorScreenStormPricingToken), 10) || 0) + 1;
    var pricingToken = window.__doorScreenStormPricingToken;

    resetExactDoorThicknessFracOptions();
    if (!isScreenStormUserThicknessRecentlySet()) {
      applyScreenStormAddonToEstimatedPrice(0, 'thickness_frac');
    }

    syncScreenStormThicknessFromChart(m.width, m.height, setup, pricingToken);

    var fetchPlainOversized = !isScreenStormSidelightOrTransomStyleSelected()
      || isScreenStormPlainDoorOversizedPricingChange(t);
    if (fetchPlainOversized) {
      fetchScreenStormOversizedPriceViaProxy(prefix, m.width, m.height, readThicknessFromDom())
        .then(function (res) {
          if (pricingToken !== window.__doorScreenStormPricingToken) return;
          var price = res && res.price != null ? res.price : 0;
          if (price < 0) price = 0;
          applyScreenStormAddonToEstimatedPrice(price, 'oversized');
          try {
            document.dispatchEvent(new CustomEvent('door-screen-storm-measurement-price-ready', {
              detail: { addonKey: 'oversized', price: price, tableKey: res && res.table_key ? res.table_key : '' }
            }));
          } catch (eEvt) {}
        })
        .catch(function () {
          if (pricingToken !== window.__doorScreenStormPricingToken) return;
          applyScreenStormAddonToEstimatedPrice(0, 'oversized');
        });
    }
  }

  function bindScreenStormMeasurementPricing() {
    try {
      window.__priceScreenStormBound = true;
      document.addEventListener('change', function (e) {
        var t = e && e.target;
        if (!t) return;
        if (!isScreenAndStormDoorsProductType()) return;
        if (!isDoorPricingApiEnabled()) return;
        if (window.__doorMeasurementProgrammaticSelectChange) {
          if (!t.getAttribute || t.getAttribute('data-door-user-changed') !== '1') return;
        }
        if (isScreenStormStileAndRailProfileChange(t)) {
          applyScreenStormStileAndRailProfilePriceUpdate();
          return;
        }
        if (isScreenStormSetupChange(t) && isScreenStormPrehungSelection(t)) {
          resetScreenStormMeasurementsAndThickness();
          return;
        }
        var optId = t.getAttribute ? String(t.getAttribute('data-option-id') || '') : '';
        var nm = t.name != null ? String(t.name) : '';
        if (nm === 'attributes[Select your sidelight style]' || nm === 'attributes[Transom Style]' || optId === 'sidelight_style' || optId === 'transom_style') {
          window.__screenStormUserSetThicknessAt = 0;
          window.__screenStormUserSetPanelThicknessAt = 0;
          setTimeout(function () {
            window.__doorScreenStormSidelightPricingToken = (parseInt(String(window.__doorScreenStormSidelightPricingToken), 10) || 0) + 1;
            if (isScreenStormSidelightOrTransomStyleSelected()) {
              applyScreenStormSidelightChartFromDoorHeightAndSidelightWidth(null);
            } else {
              applyScreenStormAddonToEstimatedPrice(0, 'sidelight_transom');
              applyScreenStormAddonToEstimatedPrice(0, 'transom_combo');
              applyScreenStormAddonToEstimatedPrice(0, 'wide_sidelight_base_wood');
              applyScreenStormAddonToEstimatedPrice(0, 'tall_transom_base_wood');
              clearScreenStormStormGlassAddonIfNoStyles();
              try { restorePanelDoorThicknessFracOptionsFromSidelightTransomFilter(); } catch (eSt) { }
              try {
                if (
                  window.DoorIntExtPricingRule
                  && typeof window.DoorIntExtPricingRule.syncEstimatedPriceDisplay === 'function'
                ) {
                  window.DoorIntExtPricingRule.syncEstimatedPriceDisplay({
                    source: 'screen_storm_sidelight_transom_style_cleared',
                    userAction: true
                  });
                }
              } catch (eStormClr) {}
            }
            applyScreenStormAddonToEstimatedPrice(0, 'oversized');
            try { syncScreenStormPanelDoorThicknessRowForMatrix(null); } catch (eStyle) { }
            try { applyScreenStormPanelDoorThicknessExtraPricingFromDom(); } catch (eThick) { }
          }, 300);
        }
        if (isScreenStormPlainDoorOversizedPricingChange(t)) {
          // Keep a manually chosen thickness locked: only let width/height re-derive the
          // thickness when the customer has NOT just set it themselves. Otherwise their
          // selection would be overwritten by the chart sync below.
          if (!isScreenStormUserThicknessRecentlySet()) {
            window.__screenStormUserSetThicknessAt = 0;
          }
          window.__screenStormUserSetPanelThicknessAt = 0;
          // Changing one dimension confirms both (when both hold valid values) so the price
          // updates without requiring the customer to re-select width AND height.
          confirmScreenStormPlainDoorDimensionSelects();
          applyScreenStormOversizedPricing(t);
        }
        if (isScreenStormThicknessFracChange(t)) {
          window.__screenStormUserSetThicknessAt = Date.now();
          applyScreenStormThicknessFracPricingFromDom();
        }
        if (isScreenStormPanelDoorThicknessFracChange(t)) {
          window.__screenStormUserSetPanelThicknessAt = Date.now();
          applyScreenStormPanelDoorThicknessExtraPricingFromDom(t);
        }
        if (isScreenStormWoodTypeStormPorchChange(t)) {
          if (isScreenStormSidelightStyleSelected()) {
            if (readSidelightWidthFromDom() >= 24) {
              applyScreenStormWideSidelightBasePlusWoodAddon();
            } else {
              applyScreenStormSidelightChartFromDoorHeightAndSidelightWidth(t);
            }
          }
          if (isScreenStormTransomStyleSelected()) {
            if (readPanelTransomHeightFromDom() >= 24) {
              applyScreenStormTallTransomBasePlusWoodAddon();
            } else {
              applyScreenStormSidelightChartFromDoorHeightAndSidelightWidth(t);
            }
          }
        }
        if (isScreenStormSidelightTransomChartDimensionChange(t)) {
          window.__screenStormUserSetPanelThicknessAt = 0;
          applyScreenStormSidelightChartFromDoorHeightAndSidelightWidth(t);
          try { syncScreenStormPanelDoorThicknessRowForMatrix(t); } catch (eMat) { }
        }
      });
      function runPanelThicknessZeroOptionHide() {
        if (!isScreenAndStormDoorsProductType()) return;
        try { hideZeroOptionsInAllPanelDoorThicknessFracSelects(); } catch (eZ) { }
      }
      runPanelThicknessZeroOptionHide();
      setTimeout(runPanelThicknessZeroOptionHide, 300);
      setTimeout(runPanelThicknessZeroOptionHide, 1200);
      function bootPlainDoorThicknessVisibility() {
        if (!isScreenAndStormDoorsProductType()) return;
        try { syncScreenStormPlainDoorThicknessRowVisibility(true); } catch (eBootShow) { }
      }
      setTimeout(bootPlainDoorThicknessVisibility, 400);
    } catch (e) { }
  }

  window.PriceScreenStorm = {
    isScreenAndStormDoorsProductType: isScreenAndStormDoorsProductType,
    computeScreenStormOversizedPrefix: computeScreenStormOversizedPrefix,
    buildThicknessTableKey: buildThicknessTableKey,
    buildScreenStormOversizedTableKey: buildScreenStormOversizedTableKey,
    resolveThicknessBuckets: resolveScreenStormThicknessBuckets,
    readMeasurements: function () {
      var width = readWidthFromDom();
      var height = readHeightFromDom();
      return {
        width: width,
        height: height,
        widthRounded: measureInchesForScreenStormChart(width),
        heightRounded: measureInchesForScreenStormChart(height)
      };
    },
    fetchByTableKey: fetchPricingRuleScreenStormByTableKey,
    fetchBestMatch: fetchPricingRuleScreenStormBestMatchViaProxy,
    fetchOversizedPrice: fetchScreenStormOversizedPriceViaProxy,
    fetchThicknessFracPrice: fetchScreenStormThicknessFracPriceViaProxy,
    SCREEN_STORM_THICKNESS_UPGRADE_PRICES: SCREEN_STORM_THICKNESS_UPGRADE_PRICES,
    lookupScreenStormThicknessUpgradePrice: lookupScreenStormThicknessUpgradePrice,
    resolveScreenStormThicknessFracPrice: resolveScreenStormThicknessFracPrice,
    applyScreenStormOversizedPricing: applyScreenStormOversizedPricing,
    applyScreenStormThicknessFracPricingFromDom: applyScreenStormThicknessFracPricingFromDom,
    resolveSidelightTransomBucket: resolveSidelightTransomBucket,
    buildSidelightTransomTableKey: buildSidelightTransomTableKey,
    fetchSidelightTransomCalculationsScreenStorm: fetchSidelightTransomCalculationsScreenStorm,
    applyScreenStormSidelightChartFromDoorHeightAndSidelightWidth: applyScreenStormSidelightChartFromDoorHeightAndSidelightWidth,
    applyScreenStormPanelDoorThicknessExtraPricingFromDom: applyScreenStormPanelDoorThicknessExtraPricingFromDom,
    readScreenStormSidelightTransomChartWH: readScreenStormSidelightTransomChartWH,
    syncScreenStormPanelDoorThicknessRowForMatrix: syncScreenStormPanelDoorThicknessRowForMatrix,
    syncScreenStormPlainDoorThicknessRowVisibility: syncScreenStormPlainDoorThicknessRowVisibility,
    applyPanelDoorThicknessFracFilterFromSidelightTransomJson: applyPanelDoorThicknessFracFilterFromSidelightTransomJson,
    applyPanelDoorThicknessFracFilterFromSidelightChartCell: applyPanelDoorThicknessFracFilterFromSidelightChartCell,
    lookupSidelightChartCell: lookupSidelightChartCell,
    lookupTransomChartCell: lookupTransomChartCell,
    lookupSidelightOrTransomChartCell: lookupSidelightOrTransomChartCell,
    lookupSidelightTransomChartCell: lookupSidelightTransomChartCell,
    restorePanelDoorThicknessFracOptionsFromSidelightTransomFilter: restorePanelDoorThicknessFracOptionsFromSidelightTransomFilter,
    hideZeroOptionsInAllPanelDoorThicknessFracSelects: hideZeroOptionsInAllPanelDoorThicknessFracSelects,
    computeScreenStormDoubleBasePlusDoubleWoodAddon: computeScreenStormDoubleBasePlusDoubleWoodAddon,
    applyScreenStormWideSidelightBasePlusWoodAddon: applyScreenStormWideSidelightBasePlusWoodAddon,
    applyScreenStormTallTransomBasePlusWoodAddon: applyScreenStormTallTransomBasePlusWoodAddon,
    readScreenStormProductBasePriceFromDom: readScreenStormProductBasePriceFromDom,
    readSelectedWoodTypeStormPorchPriceValue: readSelectedWoodTypeStormPorchPriceValue,
    applyScreenStormStileAndRailProfilePriceUpdate: applyScreenStormStileAndRailProfilePriceUpdate,
    getStileAndRailProfileListPriceFromSchema: getStileAndRailProfileListPriceFromSchema,
    getScreenStormAddonTotalSum: getScreenStormAddonTotalSum,
    computeScreenStormLayeredDisplayTotal: computeScreenStormLayeredDisplayTotal,
    screenStormPlainDoorMeasurementPricingEnabled: screenStormPlainDoorMeasurementPricingEnabled,
    screenStormSidelightChartPricingEnabled: screenStormSidelightChartPricingEnabled,
    screenStormThicknessUpgradePricingEnabled: screenStormThicknessUpgradePricingEnabled,
    syncScreenStormAddonGateState: syncScreenStormAddonGateState,
    ensureScreenStormPriceAppliedToDom: ensureScreenStormPriceAppliedToDom
  };

  bindScreenStormMeasurementPricing();
})();