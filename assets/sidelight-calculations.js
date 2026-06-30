// glass_formula addon pricing helper (Shopify theme JS)
// Extracted from door-conf2.js so the main configurator file stays focused.
//
// Responsibilities:
// - Read selected `data-choice-value` options from the DOM.
// - Call your PHP endpoint (data-glass-formula-api-url) with ?values=a,b,c
// - Endpoint matches those values against glass_formula metaobject field `unique_id`
// - Compute addon total = sum(pieces * basic_eqn_calc)
//
// Exposes: window.GlassFormulaCalculation
//
// Modified: 2026-04-30
// By: Pooja

(function () {
  if (window.GlassFormulaCalculation) return;

  // sidelight_transom_calculations (contains: pieces, shape, basic_eqn_calc)
  var __sidelightTransomLoadPromise = null;
  var __sidelightTransomByChoiceValue = null; // { choice_value_norm: { pieces, shape, basic_eqn_calc, ... } }

  // glass_type_exterior (storm glass) cache + fetch control
  var __glassTypeExteriorLoadPromise = null; // Promise
  var __glassTypeExteriorByChoiceValue = null; // { choice_value_norm: { ...fields } }
  var __glassTypeExteriorLastFetchedKey = ''; // used to refetch on revisit

  // glass_type_interior (same shape as exterior; used when product tag is interior-doors)
  var __glassTypeInteriorLoadPromise = null;
  var __glassTypeInteriorByChoiceValue = null;
  var __glassTypeInteriorLastFetchedKey = '';
  // glass_type_screen_and_storm (Screen And Storm Doors product type)
  var __glassTypeScreenAndStormLoadPromise = null;
  var __glassTypeScreenAndStormByChoiceValue = null;
  var __glassTypeScreenAndStormLastFetchedKey = '';
  var __glassTypeExteriorMiss = Object.create(null);
  var __glassTypeInteriorMiss = Object.create(null);
  var __glassTypeScreenAndStormMiss = Object.create(null);

  // Storm / decorative glass radios: schema may use glass_type or storm_glass_type (interior "Select Storm Glass").
  var STORM_GLASS_RADIO_SELECTOR =
    'input[type="radio"][data-option-id="glass_type"],' +
    'input[type="radio"][data-option-id="storm_glass_type"],' +
    'input[type="radio"][data-option-id="storm_glass"],' +
    'input[type="radio"][data-option-id="select_storm_glass"],' +
    'input[type="radio"][name="attributes[Select Storm Glass]"],' +
    'input[type="radio"][name="attributes[Select Storm Glasses]"]';

  var __stormGlassFetchScheduleT = null;
  var __stormGlassLastLogKey = '';
  var __sidelightTransomFetchScheduleT = null;
  var __sidelightTransomLastFetchedKey = '';
  var __sidelightTransomMiss = Object.create(null);
  var __sidelightTransomInFlightByUrl = Object.create(null);

  var SIDELIGHT_TRANSOM_STYLE_SELECTOR =
    'input[type="radio"][data-option-id="sidelight_style"],' +
    'input[type="radio"][name="attributes[Select your sidelight style]"],' +
    'select[data-option-id="sidelight_style"],' +
    'select[name="attributes[Select your sidelight style]"],' +
    'input[type="radio"][data-option-id="transom_style"],' +
    'input[type="radio"][name="attributes[Transom Style]"],' +
    'select[data-option-id="transom_style"],' +
    'select[name="attributes[Transom Style]"]';
  var __glassTypeExteriorInFlightByUrl = Object.create(null);
  var __glassTypeInteriorInFlightByUrl = Object.create(null);
  var __glassTypeScreenAndStormInFlightByUrl = Object.create(null);

  function getPricingProxyBase() {
    var base = '';
    try { base = String(window.DOOR_PRICING_RULE_PROXY_BASE || '').trim(); } catch (eBase) {}
    if (!base) base = 'https://vintage.espirevox.com';
    return base.replace(/\/+$/, '');
  }

  function isDoorPricingApiEnabled() {
    try { return !window.__doorSelectionLogOnly; } catch (e) { return true; }
  }

  /** Filter console by "door-pricing". Set window.DOOR_PRICE_DEBUG = false to silence. */
  function stormGlassDebugLog(tag, payload) {
    try {
      if (window.DOOR_PRICE_DEBUG === false) return;
      var line = '[door-pricing] storm glass — ' + String(tag || 'log');
      if (payload !== undefined) console.log(line, payload);
      else console.log(line);
    } catch (eLog) {}
  }

  function toNum(v) {
    var n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }

  function toNullableNum(v) {
    if (v == null) return null;
    var s = String(v);
    if (s.trim() === '') return null;
    var n = parseFloat(s);
    return isNaN(n) ? null : n;
  }

  function normChoiceValue(s) {
    return String(s == null ? '' : s)
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_');
  }

  function getGlassFormulaApiUrl() {
    try {
      var container = document.getElementById('door-configurator');
      if (container) {
        var v = String(container.getAttribute('data-glass-formula-api-url') || '').trim();
        if (v) return v;
      }
    } catch (e) {}
    return getSidelightTransomApiUrl();
  }

  function getSidelightTransomApiUrl() {
    try {
      var container = document.getElementById('door-configurator');
      if (container) {
        var v = String(container.getAttribute('data-sidelight-transom-api-url') || '').trim();
        if (v) return v;
      }
    } catch (e) {}
    return getPricingProxyBase() + '/sidelight_transom_calculations.php';
  }

  function getGlassTypeExteriorApiUrl() {
    try {
      var container = document.getElementById('door-configurator');
      if (container) {
        var v = String(container.getAttribute('data-glass-type-exterior-api-url') || '').trim();
        if (v) return v;
      }
    } catch (e) {}
    return getPricingProxyBase() + '/glass_type_exterior.php';
  }

  function getGlassTypeInteriorApiUrl() {
    try {
      var container = document.getElementById('door-configurator');
      if (container) {
        var v = String(container.getAttribute('data-glass-type-interior-api-url') || '').trim();
        if (v) return v;
      }
    } catch (e) {}
    return getPricingProxyBase() + '/glass_type_interior.php';
  }

  function getGlassTypeScreenAndStormApiUrl() {
    try {
      var container = document.getElementById('door-configurator');
      if (container) {
        var v = String(container.getAttribute('data-glass-type-screen-and-storm-api-url') || '').trim();
        if (v) return v;
      }
    } catch (e) {}
    return getPricingProxyBase() + '/glass_type_screen_and_storm.php';
  }

  /** Same normalization as door-conf2 normSelectionValue for product tags. */
  function normProductTagForInteriorRouting(s) {
    return String(s == null ? '' : s)
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_');
  }

  /**
   * Interior glass API when Liquid says true OR when Shopify product tags match (door-conf2-style).
   * Important: Liquid may output data-use-interior-glass-meta="false" if its tag string does not
   * exactly match (e.g. interior_doors vs interior-doors), so we must not return false before
   * checking data-product-tags JSON.
   */
  function productUsesInteriorGlassTypeMeta() {
    try {
      var el = document.getElementById('door-configurator');
      if (!el) return false;
      var v = String(el.getAttribute('data-use-interior-glass-meta') || '').trim().toLowerCase();
      if (v === 'true' || v === '1' || v === 'yes') return true;

      var raw = String(el.getAttribute('data-product-tags') || '').trim();
      if (raw) {
        var tags = [];
        try {
          var parsed = JSON.parse(raw);
          tags = Array.isArray(parsed) ? parsed : [];
        } catch (eJson) {
          tags = raw.split('|');
        }
        for (var i = 0; i < tags.length; i++) {
          var n = normProductTagForInteriorRouting(tags[i]);
          if (n === 'interior_doors') return true;
        }
        var scan = raw.toLowerCase();
        if (scan.indexOf('interior-doors') !== -1 || scan.indexOf('interior_doors') !== -1) return true;
      }

      if (v === 'false' || v === '0' || v === 'no') return false;
    } catch (e) {}
    return false;
  }

  /** Screen & storm glass metaobject API — only for Screen And Storm Doors product type / tag. */
  function productUsesScreenAndStormGlassTypeMeta() {
    try {
      if (
        window.PriceScreenStorm
        && typeof window.PriceScreenStorm.isScreenAndStormDoorsProductType === 'function'
        && window.PriceScreenStorm.isScreenAndStormDoorsProductType()
      ) {
        return true;
      }
      var el = document.getElementById('door-configurator');
      if (!el) return false;
      var ssAttr = String(el.getAttribute('data-use-screen-storm-glass-meta') || '').trim().toLowerCase();
      if (ssAttr === 'true' || ssAttr === '1' || ssAttr === 'yes') return true;
      var pt = normProductTagForInteriorRouting(el.getAttribute('data-product-type') || '');
      if (pt === 'screen_and_storm_doors') return true;
      var raw = String(el.getAttribute('data-product-tags') || '').trim();
      if (raw) {
        var tags = [];
        try {
          var parsed = JSON.parse(raw);
          tags = Array.isArray(parsed) ? parsed : [];
        } catch (eJson) {
          tags = raw.split('|');
        }
        for (var i = 0; i < tags.length; i++) {
          if (normProductTagForInteriorRouting(tags[i]) === 'screen_and_storm_doors') return true;
        }
        var scan = raw.toLowerCase();
        if (scan.indexOf('screen-and-storm-doors') !== -1 || scan.indexOf('screen_and_storm_doors') !== -1) {
          return true;
        }
      }
    } catch (e) {}
    return false;
  }

  function stormGlassNormKeysFromRequest(vals, selectedKey) {
    var out = [];
    var arr = Array.isArray(vals) ? vals : [];
    for (var i = 0; i < arr.length; i++) {
      var nk = normChoiceValue(String(arr[i] || ''));
      if (nk) out.push(nk);
    }
    if (!out.length && selectedKey) out.push(selectedKey);
    return out;
  }

  function recordStormGlassTypeMissAfterFetch(surface, normKeys) {
    var miss = __glassTypeExteriorMiss;
    var fullMap = __glassTypeExteriorByChoiceValue || window.__glass_type_exterior_by_choice_value || null;
    if (surface === 'interior') {
      miss = __glassTypeInteriorMiss;
      fullMap = __glassTypeInteriorByChoiceValue || window.__glass_type_interior_by_choice_value || null;
    } else if (surface === 'screen_and_storm') {
      miss = __glassTypeScreenAndStormMiss;
      fullMap = __glassTypeScreenAndStormByChoiceValue || window.__glass_type_screen_and_storm_by_choice_value || null;
    }
    if (!fullMap || typeof fullMap !== 'object') fullMap = Object.create(null);
    var keys = Array.isArray(normKeys) ? normKeys : [];
    for (var i = 0; i < keys.length; i++) {
      var k = String(keys[i] || '');
      if (!k) continue;
      if (fullMap[k]) delete miss[k];
      else miss[k] = true;
    }
  }

  function getStormGlassRadioRoot() {
    return document.getElementById('door-configurator-options') || document.getElementById('door-configurator') || document;
  }

  /** First checked storm-glass radio in DOM order (matches door-conf2 priority: glass_type before storm_glass_type). */
  function getCheckedStormGlassRadio() {
    try {
      var root = getStormGlassRadioRoot();
      var parts = STORM_GLASS_RADIO_SELECTOR.split(',');
      for (var i = 0; i < parts.length; i++) {
        var sel = parts[i].trim() + ':checked';
        var el = root.querySelector(sel);
        if (el) return el;
      }
    } catch (e) {}
    return null;
  }

  /** Resolve radio from event target (label / custom UI) or the input itself. */
  function resolveStormGlassRadioFromEventTarget(t) {
    if (!t) return null;
    try {
      if (t.matches && t.matches(STORM_GLASS_RADIO_SELECTOR)) return t;
      if (t.closest) {
        var lab = t.closest('label');
        if (lab) {
          var inp = lab.querySelector(STORM_GLASS_RADIO_SELECTOR);
          if (inp) return inp;
        }
      }
    } catch (e) {}
    return null;
  }

  function scheduleStormGlassTypeFetchFromInput(input) {
    if (!input || !isDoorPricingApiEnabled()) return;
    clearTimeout(__stormGlassFetchScheduleT);
    __stormGlassFetchScheduleT = setTimeout(function () {
      __stormGlassFetchScheduleT = null;
      var checked = getCheckedStormGlassRadio();
      if (checked !== input && (!checked || normChoiceValue(String(checked.value || '')) !== normChoiceValue(String(input.value || '')))) {
        return;
      }
      if (!input.checked || input.value == null || String(input.value || '').trim() === '') return;
      var k = normChoiceValue(String(input.value || ''));
      if (!k) return;
      // Allow retry on a new click even if a prior fetch missed this key.
      try { delete __glassTypeExteriorMiss[k]; } catch (eMissEx) {}
      try { delete __glassTypeInteriorMiss[k]; } catch (eMissIn) {}
      try { delete __glassTypeScreenAndStormMiss[k]; } catch (eMissSs) {}
      __glassTypeExteriorLastFetchedKey = '';
      __glassTypeInteriorLastFetchedKey = '';
      __glassTypeScreenAndStormLastFetchedKey = '';
      // Storm glass pricing also needs glass_formula (sidelight/transom) in cache.
      var gfKeysForStorm = getSelectedSidelightTransomStyleKeysFromDom();
      for (var gfi = 0; gfi < gfKeysForStorm.length; gfi++) {
        scheduleSidelightTransomFetchFromKey(gfKeysForStorm[gfi]);
      }
      var metaType = 'glass_type_exterior';
      if (productUsesScreenAndStormGlassTypeMeta()) metaType = 'glass_type_screen_and_storm';
      else if (productUsesInteriorGlassTypeMeta()) metaType = 'glass_type_interior';
      stormGlassDebugLog('selection', {
        name: input.name || '',
        value: input.value,
        normalizedKey: k,
        metaobjectType: metaType,
        willFetchApi: true
      });
      loadStormGlassTypeFromApi([k]).then(function (data) {
        var parts = getActiveGlassTypePartsFromCache(k);
        stormGlassDebugLog('api_loaded', {
          normalizedKey: k,
          metaobjectType: metaType,
          apiOk: !!(data && data.ok === true),
          sq_ft: parts ? parts.sq_ft : null,
          straight_pricing: parts ? parts.straight_pricing : null,
          shaped_pricing: parts ? parts.shaped_pricing : null,
          straightFromCache: getStraightPricingFromCache(k)
        });
        try {
          document.dispatchEvent(
            new CustomEvent('door-storm-glass-price-ready', { detail: { key: k, value: input.value } })
          );
        } catch (eEv) {}
      });
    }, 0);
  }

  function buildGlassFormulaUrl(baseUrl, choiceValues) {
    var url = String(baseUrl || '').trim();
    if (!url) return '';
    if (!choiceValues || !choiceValues.length) return url;
    var list = choiceValues
      .map(function (v) { return String(v == null ? '' : v).trim(); })
      .filter(Boolean)
      .join(',');
    if (!list) return url;
    return url + (url.indexOf('?') === -1 ? '?' : '&') + 'values=' + encodeURIComponent(list);
  }

  function buildGlassTypeExteriorUrl(baseUrl, choiceValues) {
    var url = String(baseUrl || '').trim();
    if (!url) return '';
    if (!choiceValues || !choiceValues.length) return url;
    var list = choiceValues
      .map(function (v) { return String(v == null ? '' : v).trim(); })
      .filter(Boolean)
      .join(',');
    if (!list) return url;
    return url + (url.indexOf('?') === -1 ? '?' : '&') + 'values=' + encodeURIComponent(list);
  }

  // Back-compat: some setups use a single endpoint with ?type=... rather than a dedicated URL per type.
  function buildMetaobjectUrl(baseUrl, type, choiceValues) {
    var url = String(baseUrl || '').trim();
    if (!url) return '';
    var params = [];
    if (type) params.push('type=' + encodeURIComponent(String(type)));
    if (Array.isArray(choiceValues) && choiceValues.length) {
      var list = choiceValues
        .map(function (v) { return String(v == null ? '' : v).trim(); })
        .filter(Boolean)
        .join(',');
      if (list) params.push('values=' + encodeURIComponent(list));
    }
    if (!params.length) return url;
    return url + (url.indexOf('?') === -1 ? '?' : '&') + params.join('&');
  }

  function mergeSidelightTransomMap(partial) {
    if (!partial || typeof partial !== 'object') return;
    if (!__sidelightTransomByChoiceValue || typeof __sidelightTransomByChoiceValue !== 'object') {
      __sidelightTransomByChoiceValue = Object.create(null);
    }
    Object.keys(partial).forEach(function (k) {
      __sidelightTransomByChoiceValue[k] = partial[k];
    });
    window.__sidelight_transom_by_choice_value = __sidelightTransomByChoiceValue;
  }

  function mergeGlassTypeExteriorMap(partial) {
    if (!partial || typeof partial !== 'object') return;
    if (!__glassTypeExteriorByChoiceValue || typeof __glassTypeExteriorByChoiceValue !== 'object') {
      __glassTypeExteriorByChoiceValue = Object.create(null);
    }
    Object.keys(partial).forEach(function (k) {
      __glassTypeExteriorByChoiceValue[k] = partial[k];
    });
    window.__glass_type_exterior_by_choice_value = __glassTypeExteriorByChoiceValue;
  }

  function mergeGlassTypeInteriorMap(partial) {
    if (!partial || typeof partial !== 'object') return;
    if (!__glassTypeInteriorByChoiceValue || typeof __glassTypeInteriorByChoiceValue !== 'object') {
      __glassTypeInteriorByChoiceValue = Object.create(null);
    }
    Object.keys(partial).forEach(function (k) {
      __glassTypeInteriorByChoiceValue[k] = partial[k];
    });
    window.__glass_type_interior_by_choice_value = __glassTypeInteriorByChoiceValue;
  }

  function mergeGlassTypeScreenAndStormMap(partial) {
    if (!partial || typeof partial !== 'object') return;
    if (!__glassTypeScreenAndStormByChoiceValue || typeof __glassTypeScreenAndStormByChoiceValue !== 'object') {
      __glassTypeScreenAndStormByChoiceValue = Object.create(null);
    }
    Object.keys(partial).forEach(function (k) {
      __glassTypeScreenAndStormByChoiceValue[k] = partial[k];
    });
    window.__glass_type_screen_and_storm_by_choice_value = __glassTypeScreenAndStormByChoiceValue;
  }

  function getSidelightTransomStyleRoot() {
    return document.getElementById('door-configurator-options') || document.getElementById('door-configurator') || document;
  }

  /** Active sidelight_style value (normalized). */
  function getSelectedSidelightStyleKeyFromDom() {
    var root = getSidelightTransomStyleRoot();
    var raw = '';
    try {
      var sidelightChecked = root.querySelector('input[type="radio"][data-option-id="sidelight_style"]:checked');
      if (sidelightChecked && sidelightChecked.value != null) raw = String(sidelightChecked.value || '');
    } catch (eSl) {}
    if (!raw) {
      try {
        var sidelightSel = root.querySelector('select[data-option-id="sidelight_style"]');
        if (sidelightSel) raw = String(sidelightSel.value || '');
      } catch (eSl2) {}
    }
    if (!raw) {
      try {
        var sidelightNamed = root.querySelector('input[type="radio"][name="attributes[Select your sidelight style]"]:checked');
        if (sidelightNamed && sidelightNamed.value != null) raw = String(sidelightNamed.value || '');
      } catch (eSl3) {}
    }
    if (!raw) {
      try {
        var sidelightSelNamed = root.querySelector('select[name="attributes[Select your sidelight style]"]');
        if (sidelightSelNamed) raw = String(sidelightSelNamed.value || '');
      } catch (eSl4) {}
    }
    return raw ? normChoiceValue(raw) : '';
  }

  /** Active transom_style value (normalized). */
  function getSelectedTransomStyleKeyFromDom() {
    var root = getSidelightTransomStyleRoot();
    var raw = '';
    try {
      var transomChecked = root.querySelector(
        'input[type="radio"][data-option-id="transom_style"]:checked,' +
        'input[type="radio"][name="attributes[Transom Style]"]:checked'
      );
      if (transomChecked && transomChecked.value != null) raw = String(transomChecked.value || '');
    } catch (eTr) {}
    if (!raw) {
      try {
        var transomSel = root.querySelector(
          'select[data-option-id="transom_style"],' +
          'select[name="attributes[Transom Style]"]'
        );
        if (transomSel) raw = String(transomSel.value || '');
      } catch (eTr2) {}
    }
    return raw ? normChoiceValue(raw) : '';
  }

  /** Both sidelight and transom style keys when selected (for dual storm-glass add-on). */
  function getSelectedSidelightTransomStyleKeysFromDom() {
    var keys = [];
    var sl = getSelectedSidelightStyleKeyFromDom();
    var tr = getSelectedTransomStyleKeyFromDom();
    if (sl) keys.push(sl);
    if (tr && tr !== sl) keys.push(tr);
    return keys;
  }

  /** Active sidelight_style or transom_style value (normalized), same priority as door-conf2. */
  function getSelectedSidelightTransomStyleKeyFromDom() {
    var sl = getSelectedSidelightStyleKeyFromDom();
    if (sl) return sl;
    return getSelectedTransomStyleKeyFromDom();
  }

  function sidelightTransomApiUrlForKey(key) {
    if (!key) return '';
    return buildGlassFormulaUrl(getSidelightTransomApiUrl(), [key]);
  }

  function recordSidelightTransomFetchResult(keys, data) {
    var list = Array.isArray(keys) ? keys : [];
    var map = __sidelightTransomByChoiceValue || window.__sidelight_transom_by_choice_value || null;
    for (var i = 0; i < list.length; i++) {
      var k = normChoiceValue(String(list[i] || ''));
      if (!k) continue;
      if (data && data.ok === true) {
        if (map && map[k]) {
          __sidelightTransomLastFetchedKey = k;
          delete __sidelightTransomMiss[k];
        } else {
          __sidelightTransomMiss[k] = true;
        }
      }
    }
  }

  function loadSidelightTransomFromApi(choiceValues) {
    if (!isDoorPricingApiEnabled()) return Promise.resolve(null);
    var baseUrl = getSidelightTransomApiUrl();
    if (!baseUrl) return Promise.resolve(null);
    var vals = Array.isArray(choiceValues) ? choiceValues : [];
    var url = buildGlassFormulaUrl(baseUrl, vals);
    if (!url) return Promise.resolve(null);
    if (__sidelightTransomInFlightByUrl[url]) return __sidelightTransomInFlightByUrl[url];
    var p = fetch(url, { method: 'GET', mode: 'cors', credentials: 'omit' })
      .then(function (r) {
        if (!r || !r.ok) throw new Error('bad response');
        return r.json();
      })
      .then(function (data) {
        if (!data || data.ok !== true) return null;
        var map = data.by_choice_value || data.byChoiceValue || null;
        mergeSidelightTransomMap(map);
        if (Array.isArray(data.records)) window.sidelight_transom_calculations = data.records;
        recordSidelightTransomFetchResult(vals, data);
        return data;
      })
      .catch(function () {
        return null;
      })
      .finally(function () {
        try { delete __sidelightTransomInFlightByUrl[url]; } catch (eFin) {}
        __sidelightTransomLoadPromise = null;
      });
    __sidelightTransomInFlightByUrl[url] = p;
    __sidelightTransomLoadPromise = p;
    return p;
  }

  function scheduleSidelightTransomFetchFromKey(key) {
    key = normChoiceValue(String(key || ''));
    if (!key || !isDoorPricingApiEnabled()) return;
    if (__sidelightTransomMiss[key]) return;
    var map = __sidelightTransomByChoiceValue || window.__sidelight_transom_by_choice_value || null;
    if (map && map[key]) return;
    var url = sidelightTransomApiUrlForKey(key);
    if (url && __sidelightTransomInFlightByUrl[url]) return;

    clearTimeout(__sidelightTransomFetchScheduleT);
    __sidelightTransomFetchScheduleT = setTimeout(function () {
      __sidelightTransomFetchScheduleT = null;
      var activeKeys = getSelectedSidelightTransomStyleKeysFromDom();
      if (!activeKeys.length) {
        var legacy = getSelectedSidelightTransomStyleKeyFromDom();
        if (legacy) activeKeys = [legacy];
      }
      if (activeKeys.indexOf(key) === -1) return;
      if (__sidelightTransomMiss[key]) return;
      map = __sidelightTransomByChoiceValue || window.__sidelight_transom_by_choice_value || null;
      if (map && map[key]) return;
      loadSidelightTransomFromApi([key]).then(function () {
        try {
          document.dispatchEvent(
            new CustomEvent('door-sidelight-transom-price-ready', { detail: { key: key } })
          );
        } catch (eEv) {}
      });
    }, 0);
  }

  function ensureSidelightTransomLoadedForCurrentSelection() {
    var keys = getSelectedSidelightTransomStyleKeysFromDom();
    if (!keys.length) {
      var legacy = getSelectedSidelightTransomStyleKeyFromDom();
      if (legacy) keys = [legacy];
    }
    for (var i = 0; i < keys.length; i++) {
      scheduleSidelightTransomFetchFromKey(keys[i]);
    }
  }

  function resolveSidelightTransomStyleFromEventTarget(t) {
    if (!t) return null;
    try {
      if (t.matches && t.matches(SIDELIGHT_TRANSOM_STYLE_SELECTOR)) return t;
      if (t.closest) {
        var lab = t.closest('label');
        if (lab) {
          var inp = lab.querySelector(SIDELIGHT_TRANSOM_STYLE_SELECTOR);
          if (inp) return inp;
        }
        var wrap = t.closest('.door-option-wrap[data-option-id="sidelight_style"], .door-option-wrap[data-option-id="transom_style"]');
        if (wrap) {
          var checked = wrap.querySelector(SIDELIGHT_TRANSOM_STYLE_SELECTOR + ':checked');
          if (checked) return checked;
          var sel = wrap.querySelector('select[data-option-id="sidelight_style"], select[data-option-id="transom_style"]');
          if (sel) return sel;
        }
      }
    } catch (e) {}
    return null;
  }

  function scheduleSidelightTransomFetchFromInteraction(evt) {
    if (!isDoorPricingApiEnabled()) return;
    var t = evt && evt.target ? evt.target : null;
    if (!t) return;
    var input = resolveSidelightTransomStyleFromEventTarget(t);
    if (!input) return;
    if (input.type === 'radio') {
      if (!input.checked || input.value == null || String(input.value || '').trim() === '') return;
    } else if (input.tagName === 'SELECT') {
      if (input.value == null || String(input.value || '').trim() === '') return;
    }
    var key = normChoiceValue(String(input.value || ''));
    if (!key) return;
    scheduleSidelightTransomFetchFromKey(key);
  }

  function loadGlassTypeExteriorFromApi(choiceValues) {
    if (!isDoorPricingApiEnabled()) return Promise.resolve(null);
    var vals = Array.isArray(choiceValues) ? choiceValues : [];

    // Gate network calls: only fetch when a storm/glass type radio is selected.
    var selectedKey = '';
    try {
      var checked = getCheckedStormGlassRadio();
      if (!checked || checked.value == null || String(checked.value || '').trim() === '') {
        return Promise.resolve(null);
      }
      selectedKey = normChoiceValue(String(checked.value || ''));
      if (vals && vals.length) {
        var want = normChoiceValue(String(vals[0] || ''));
        if (want && selectedKey && want !== selectedKey) return Promise.resolve(null);
      }
    } catch (eGateGlassType) {
      return Promise.resolve(null);
    }

    if (productUsesInteriorGlassTypeMeta() || productUsesScreenAndStormGlassTypeMeta()) {
      return Promise.resolve(null);
    }

    var loadKeysEx = stormGlassNormKeysFromRequest(vals, selectedKey);
    for (var exi = 0; exi < loadKeysEx.length; exi++) {
      if (loadKeysEx[exi] && __glassTypeExteriorMiss[loadKeysEx[exi]]) {
        return Promise.resolve(null);
      }
    }

    // Prefer dedicated URL, else fallback to the glass-formula endpoint with ?type=glass_type_exterior.
    var baseUrl = getGlassTypeExteriorApiUrl();
    var url = '';
    if (baseUrl) {
      url = buildGlassTypeExteriorUrl(baseUrl, vals);
    } else {
      var fallbackBase = getGlassFormulaApiUrl();
      if (fallbackBase) url = buildMetaobjectUrl(fallbackBase, 'glass_type_exterior', vals);
    }

    if (!url) return Promise.resolve(null);

    stormGlassDebugLog('api_request', {
      normalizedKey: selectedKey,
      metaobjectType: 'glass_type_exterior',
      url: url
    });

    if (__glassTypeExteriorInFlightByUrl[url]) return __glassTypeExteriorInFlightByUrl[url];

    var pEx = fetch(url, { method: 'GET', mode: 'cors', credentials: 'omit' })
      .then(function (r) {
        if (!r || !r.ok) throw new Error('bad response');
        return r.json();
      })
      .then(function (data) {
        if (!data || data.ok !== true) return null;
        var map = data.by_choice_value || data.byChoiceValue || null;
        mergeGlassTypeExteriorMap(map);
        if (Array.isArray(data.records)) window.glass_type_exterior = data.records;
        if (selectedKey) __glassTypeExteriorLastFetchedKey = selectedKey;
        recordStormGlassTypeMissAfterFetch('exterior', loadKeysEx);
        return data;
      })
      .catch(function () {
        return null;
      })
      .finally(function () {
        try { delete __glassTypeExteriorInFlightByUrl[url]; } catch (eFinEx) {}
        __glassTypeExteriorLoadPromise = null;
      });

    __glassTypeExteriorInFlightByUrl[url] = pEx;
    __glassTypeExteriorLoadPromise = pEx;
    return pEx;
  }

  function loadGlassTypeInteriorFromApi(choiceValues) {
    if (!isDoorPricingApiEnabled()) return Promise.resolve(null);
    var vals = Array.isArray(choiceValues) ? choiceValues : [];

    if (!productUsesInteriorGlassTypeMeta() || productUsesScreenAndStormGlassTypeMeta()) {
      return Promise.resolve(null);
    }

    var selectedKey = '';
    try {
      var checked = getCheckedStormGlassRadio();
      if (!checked || checked.value == null || String(checked.value || '').trim() === '') {
        return Promise.resolve(null);
      }
      selectedKey = normChoiceValue(String(checked.value || ''));
      if (vals && vals.length) {
        var want = normChoiceValue(String(vals[0] || ''));
        if (want && selectedKey && want !== selectedKey) return Promise.resolve(null);
      }
    } catch (eGateGlassTypeInt) {
      return Promise.resolve(null);
    }

    var loadKeysIn = stormGlassNormKeysFromRequest(vals, selectedKey);
    for (var ini = 0; ini < loadKeysIn.length; ini++) {
      if (loadKeysIn[ini] && __glassTypeInteriorMiss[loadKeysIn[ini]]) {
        return Promise.resolve(null);
      }
    }

    var baseUrl = getGlassTypeInteriorApiUrl();
    var url = '';
    if (baseUrl) {
      url = buildGlassTypeExteriorUrl(baseUrl, vals);
    } else {
      var fallbackBase = getGlassFormulaApiUrl();
      if (fallbackBase) url = buildMetaobjectUrl(fallbackBase, 'glass_type_interior', vals);
    }

    if (!url) return Promise.resolve(null);

    stormGlassDebugLog('api_request', {
      normalizedKey: selectedKey,
      metaobjectType: 'glass_type_interior',
      url: url
    });

    if (__glassTypeInteriorInFlightByUrl[url]) return __glassTypeInteriorInFlightByUrl[url];

    var pIn = fetch(url, { method: 'GET', mode: 'cors', credentials: 'omit' })
      .then(function (r) {
        if (!r || !r.ok) throw new Error('bad response');
        return r.json();
      })
      .then(function (data) {
        if (!data || data.ok !== true) return null;
        var map = data.by_choice_value || data.byChoiceValue || null;
        mergeGlassTypeInteriorMap(map);
        if (Array.isArray(data.records)) window.glass_type_interior = data.records;
        if (selectedKey) __glassTypeInteriorLastFetchedKey = selectedKey;
        recordStormGlassTypeMissAfterFetch('interior', loadKeysIn);
        return data;
      })
      .catch(function () {
        return null;
      })
      .finally(function () {
        try { delete __glassTypeInteriorInFlightByUrl[url]; } catch (eFinIn) {}
        __glassTypeInteriorLoadPromise = null;
      });

    __glassTypeInteriorInFlightByUrl[url] = pIn;
    __glassTypeInteriorLoadPromise = pIn;
    return pIn;
  }

  function loadGlassTypeScreenAndStormFromApi(choiceValues) {
    if (!isDoorPricingApiEnabled()) return Promise.resolve(null);
    var vals = Array.isArray(choiceValues) ? choiceValues : [];

    if (!productUsesScreenAndStormGlassTypeMeta()) {
      return Promise.resolve(null);
    }

    var selectedKey = '';
    try {
      var checked = getCheckedStormGlassRadio();
      if (!checked || checked.value == null || String(checked.value || '').trim() === '') {
        return Promise.resolve(null);
      }
      selectedKey = normChoiceValue(String(checked.value || ''));
      if (vals && vals.length) {
        var want = normChoiceValue(String(vals[0] || ''));
        if (want && selectedKey && want !== selectedKey) return Promise.resolve(null);
      }
    } catch (eGateGlassTypeSs) {
      return Promise.resolve(null);
    }

    var loadKeysSs = stormGlassNormKeysFromRequest(vals, selectedKey);
    for (var ssi = 0; ssi < loadKeysSs.length; ssi++) {
      if (loadKeysSs[ssi] && __glassTypeScreenAndStormMiss[loadKeysSs[ssi]]) {
        return Promise.resolve(null);
      }
    }

    var baseUrl = getGlassTypeScreenAndStormApiUrl();
    var url = '';
    if (baseUrl) {
      url = buildGlassTypeExteriorUrl(baseUrl, vals);
    } else {
      var fallbackBase = getGlassFormulaApiUrl();
      if (fallbackBase) url = buildMetaobjectUrl(fallbackBase, 'glass_type_screen_and_storm', vals);
    }

    if (!url) return Promise.resolve(null);

    stormGlassDebugLog('api_request', {
      normalizedKey: selectedKey,
      metaobjectType: 'glass_type_screen_and_storm',
      url: url
    });

    if (__glassTypeScreenAndStormInFlightByUrl[url]) return __glassTypeScreenAndStormInFlightByUrl[url];

    var pSs = fetch(url, { method: 'GET', mode: 'cors', credentials: 'omit' })
      .then(function (r) {
        if (!r || !r.ok) throw new Error('bad response');
        return r.json();
      })
      .then(function (data) {
        if (!data || data.ok !== true) return null;
        var map = data.by_choice_value || data.byChoiceValue || null;
        mergeGlassTypeScreenAndStormMap(map);
        if (Array.isArray(data.records)) window.glass_type_screen_and_storm = data.records;
        if (selectedKey) __glassTypeScreenAndStormLastFetchedKey = selectedKey;
        recordStormGlassTypeMissAfterFetch('screen_and_storm', loadKeysSs);
        return data;
      })
      .catch(function () {
        return null;
      })
      .finally(function () {
        try { delete __glassTypeScreenAndStormInFlightByUrl[url]; } catch (eFinSs) {}
        __glassTypeScreenAndStormLoadPromise = null;
      });

    __glassTypeScreenAndStormInFlightByUrl[url] = pSs;
    __glassTypeScreenAndStormLoadPromise = pSs;
    return pSs;
  }

  function getSelectedChoiceValuesFromDom(params) {
    params = params || {};
    var root = params.root || document.getElementById('door-configurator-options') || document;
    var selected = [];
    try {
      selected = Array.from(root.querySelectorAll(
        '.common-check-option.common-check-option--selected[data-choice-value],' +
        '[data-choice-value][aria-checked="true"]'
      ));
    } catch (e) {
      selected = [];
    }

    var seen = Object.create(null);
    var values = [];
    selected.forEach(function (node) {
      if (!node || !node.getAttribute) return;
      var cv = node.getAttribute('data-choice-value');
      var key = normChoiceValue(cv);
      if (!key || seen[key]) return;
      seen[key] = true;
      values.push(key);
    });
    return values;
  }

  function calculateAddonFromCache(choiceValues) {
    // Legacy helper: sum(pieces * basic_eqn_calc) from sidelight_transom_calculations cache.
    var map = __sidelightTransomByChoiceValue || window.__sidelight_transom_by_choice_value || null;
    if (!map || typeof map !== 'object') return 0;
    var vals = Array.isArray(choiceValues) ? choiceValues : [];
    var total = 0;
    for (var i = 0; i < vals.length; i++) {
      var key = String(vals[i] || '');
      if (!key) continue;
      var rec = map[key];
      if (!rec) continue;
      var pieces = parseFloat(rec.pieces != null ? rec.pieces : rec.piece);
      var eqn = parseFloat(rec.basic_eqn_calc != null ? rec.basic_eqn_calc : rec.basicEqnCalc);
      if (isNaN(pieces)) pieces = 0;
      if (isNaN(eqn)) eqn = 0;
      total += (pieces * eqn);
    }
    return total;
  }

  function getSidelightTransomPartsFromCache(choiceValueNorm) {
    var map = __sidelightTransomByChoiceValue || window.__sidelight_transom_by_choice_value || null;
    if (!map || typeof map !== 'object') return null;
    var key = String(choiceValueNorm || '');
    if (!key) return null;
    var rec = map[key];
    if (!rec) return null;
    return {
      pieces: toNum(rec.pieces != null ? rec.pieces : rec.piece),
      // Keep as nullable: if null/blank => skip shape price entirely.
      shape: toNullableNum(rec.shape != null ? rec.shape : (rec.shapes != null ? rec.shapes : rec.shaped)),
      basic_eqn_calc: toNum(rec.basic_eqn_calc != null ? rec.basic_eqn_calc : rec.basicEqnCalc)
    };
  }

  function getGlassTypeExteriorPartsFromCache(choiceValueNorm) {
    var map = __glassTypeExteriorByChoiceValue || window.__glass_type_exterior_by_choice_value || null;
    if (!map || typeof map !== 'object') return null;
    var key = String(choiceValueNorm || '');
    if (!key) return null;
    var rec = map[key];
    if (!rec) return null;
    // API returns fields-only objects.
    return {
      sq_ft: toNum(rec.sq_ft != null ? rec.sq_ft : (rec.sqFt != null ? rec.sqFt : rec.sqft)),
      // Keep as nullable: if null/blank => skip that price component entirely.
      straight_pricing: toNullableNum(rec.straight_pricing != null ? rec.straight_pricing : rec.straightPricing),
      shaped_pricing: toNullableNum(rec.shaped_pricing != null ? rec.shaped_pricing : rec.shapedPricing)
    };
  }

  function getGlassTypeInteriorPartsFromCache(choiceValueNorm) {
    var map = __glassTypeInteriorByChoiceValue || window.__glass_type_interior_by_choice_value || null;
    if (!map || typeof map !== 'object') return null;
    var key = String(choiceValueNorm || '');
    if (!key) return null;
    var rec = map[key];
    if (!rec) return null;
    return {
      sq_ft: toNum(rec.sq_ft != null ? rec.sq_ft : (rec.sqFt != null ? rec.sqFt : rec.sqft)),
      straight_pricing: toNullableNum(rec.straight_pricing != null ? rec.straight_pricing : rec.straightPricing),
      shaped_pricing: toNullableNum(rec.shaped_pricing != null ? rec.shaped_pricing : rec.shapedPricing)
    };
  }

  function getGlassTypeScreenAndStormPartsFromCache(choiceValueNorm) {
    var map = __glassTypeScreenAndStormByChoiceValue || window.__glass_type_screen_and_storm_by_choice_value || null;
    if (!map || typeof map !== 'object') return null;
    var key = String(choiceValueNorm || '');
    if (!key) return null;
    var rec = map[key];
    if (!rec) return null;
    return {
      sq_ft: toNum(rec.sq_ft != null ? rec.sq_ft : (rec.sqFt != null ? rec.sqFt : rec.sqft)),
      straight_pricing: toNullableNum(rec.straight_pricing != null ? rec.straight_pricing : rec.straightPricing),
      shaped_pricing: toNullableNum(rec.shaped_pricing != null ? rec.shaped_pricing : rec.shapedPricing)
    };
  }

  function getActiveGlassTypePartsFromCache(choiceValueNorm) {
    if (productUsesScreenAndStormGlassTypeMeta()) {
      return getGlassTypeScreenAndStormPartsFromCache(choiceValueNorm);
    }
    if (productUsesInteriorGlassTypeMeta()) {
      return getGlassTypeInteriorPartsFromCache(choiceValueNorm);
    }
    return getGlassTypeExteriorPartsFromCache(choiceValueNorm);
  }

  // Pricing model requested:
  // x = round(sq_ft * basic_eqn_calc)
  // straight = pieces - shape
  // If straight > 0: straightTotal = (x * straight) + straight_pricing
  // If shape > 0:    shapeTotal   = (x * shape) + shaped_pricing
  // addon = straightTotal + shapeTotal
  //
  // Notes:
  // - pieces/shape/basic_eqn_calc are from sidelight_transom_calculations.php
  // - sq_ft/straight_pricing/shaped_pricing are from glass_type_exterior.php or glass_type_interior.php
  function calculateStormGlassAddonFromCache(sidelightKey, glassTypeExteriorKey) {
    var gfKey = String(sidelightKey || '');
    var gtKey = String(glassTypeExteriorKey || '');
    if (!gfKey || !gtKey) return { ok: false, total: 0 };

    var gf = getSidelightTransomPartsFromCache(gfKey);
    var gt = getActiveGlassTypePartsFromCache(gtKey);
    if (!gf || !gt) return { ok: false, total: 0 };

    var ct = toNum(gt.sq_ft) * toNum(gf.basic_eqn_calc);
    var roundedCt = Math.round(ct);

    var pieces = toNum(gf.pieces);
    var shape = gf.shape == null ? 0 : toNum(gf.shape);
    if (shape < 0) shape = 0;
    if (pieces < 0) pieces = 0;
    if (shape > pieces) shape = pieces;

    var straight = pieces - shape;

    var straightTotal = 0;
    var shapeTotal = 0;

    if (straight > 0 && gt.straight_pricing != null) {
      straightTotal = (roundedCt * straight) + toNum(gt.straight_pricing);
    }

    if (shape > 0 && gt.shaped_pricing != null) {
      shapeTotal = (roundedCt * shape) + toNum(gt.shaped_pricing);
    }

    var total = straightTotal + shapeTotal;

    return {
      ok: true,
      ct: ct,
      rounded_ct: roundedCt,
      basic_eqn_calc: toNum(gf.basic_eqn_calc),
      sq_ft: toNum(gt.sq_ft),
      pieces: pieces,
      straight: straight,
      shaped_pricing: gt.shaped_pricing,
      straight_pricing: gt.straight_pricing,
      shape: gf.shape,
      straight_total: straightTotal,
      shape_total: shapeTotal,
      total: total
    };
  }

  /** Sum storm-glass add-on for each selected sidelight and/or transom style. */
  function calculateStormGlassAddonTotalFromCache(glassTypeKey) {
    var gtKey = String(glassTypeKey || '');
    if (!gtKey) return { ok: false, total: 0, parts: [] };

    var formulaKeys = getSelectedSidelightTransomStyleKeysFromDom();
    if (!formulaKeys.length) {
      var legacy = getSelectedSidelightTransomStyleKeyFromDom();
      if (legacy) formulaKeys = [legacy];
    }
    if (!formulaKeys.length) return { ok: false, total: 0, parts: [] };

    var total = 0;
    var parts = [];
    var anyOk = false;
    for (var i = 0; i < formulaKeys.length; i++) {
      var payload = calculateStormGlassAddonFromCache(formulaKeys[i], gtKey);
      if (payload && payload.ok) {
        anyOk = true;
        total += payload.total || 0;
        parts.push({ formulaKey: formulaKeys[i], breakdown: payload, total: payload.total || 0 });
      }
    }

    return {
      ok: anyOk,
      total: total,
      parts: parts,
      formulaKeys: formulaKeys
    };
  }

  function getMissingFromCache(choiceValues) {
    var map = __sidelightTransomByChoiceValue || window.__sidelight_transom_by_choice_value || null;
    var missing = [];
    var vals = Array.isArray(choiceValues) ? choiceValues : [];
    for (var i = 0; i < vals.length; i++) {
      var k = normChoiceValue(String(vals[i] || ''));
      if (!k) continue;
      if (__sidelightTransomMiss[k]) continue;
      if (map && map[k]) continue;
      var url = sidelightTransomApiUrlForKey(k);
      if (url && __sidelightTransomInFlightByUrl[url]) continue;
      missing.push(k);
    }
    return missing;
  }

  function getMissingGlassTypeInteriorFromCache(choiceValues) {
    var map = __glassTypeInteriorByChoiceValue || window.__glass_type_interior_by_choice_value || null;
    var vals = Array.isArray(choiceValues) ? choiceValues : [];
    if (vals.length === 1) {
      var single = String(vals[0] || '');
      if (single && __glassTypeInteriorMiss[single]) return [];
      if (single && single !== __glassTypeInteriorLastFetchedKey) return [single];
    }
    var missing = [];
    for (var i = 0; i < vals.length; i++) {
      var k = String(vals[i] || '');
      if (!k) continue;
      if (__glassTypeInteriorMiss[k]) continue;
      if (!map || !map[k]) missing.push(k);
    }
    return missing;
  }

  function getMissingGlassTypeExteriorFromCache(choiceValues) {
    var map = __glassTypeExteriorByChoiceValue || window.__glass_type_exterior_by_choice_value || null;
    var vals = Array.isArray(choiceValues) ? choiceValues : [];
    if (vals.length === 1) {
      var single = String(vals[0] || '');
      if (single && __glassTypeExteriorMiss[single]) return [];
      if (single && single !== __glassTypeExteriorLastFetchedKey) return [single];
    }
    var missing = [];
    for (var i = 0; i < vals.length; i++) {
      var k = String(vals[i] || '');
      if (!k) continue;
      if (__glassTypeExteriorMiss[k]) continue;
      if (!map || !map[k]) missing.push(k);
    }
    return missing;
  }

  function getMissingGlassTypeScreenAndStormFromCache(choiceValues) {
    var map = __glassTypeScreenAndStormByChoiceValue || window.__glass_type_screen_and_storm_by_choice_value || null;
    var vals = Array.isArray(choiceValues) ? choiceValues : [];
    if (vals.length === 1) {
      var single = String(vals[0] || '');
      if (single && __glassTypeScreenAndStormMiss[single]) return [];
      if (single && single !== __glassTypeScreenAndStormLastFetchedKey) return [single];
    }
    var missing = [];
    for (var i = 0; i < vals.length; i++) {
      var k = String(vals[i] || '');
      if (!k) continue;
      if (__glassTypeScreenAndStormMiss[k]) continue;
      if (!map || !map[k]) missing.push(k);
    }
    return missing;
  }

  function getMissingStormGlassTypeFromCache(choiceValues) {
    if (productUsesScreenAndStormGlassTypeMeta()) {
      return getMissingGlassTypeScreenAndStormFromCache(choiceValues);
    }
    if (productUsesInteriorGlassTypeMeta()) {
      return getMissingGlassTypeInteriorFromCache(choiceValues);
    }
    return getMissingGlassTypeExteriorFromCache(choiceValues);
  }

  function loadStormGlassTypeFromApi(choiceValues) {
    if (productUsesScreenAndStormGlassTypeMeta()) {
      return loadGlassTypeScreenAndStormFromApi(choiceValues);
    }
    if (productUsesInteriorGlassTypeMeta()) {
      return loadGlassTypeInteriorFromApi(choiceValues);
    }
    return loadGlassTypeExteriorFromApi(choiceValues);
  }

  function getStraightPricingFromCache(choiceValueNorm) {
    var map;
    if (productUsesScreenAndStormGlassTypeMeta()) {
      map = __glassTypeScreenAndStormByChoiceValue || window.__glass_type_screen_and_storm_by_choice_value || null;
    } else if (productUsesInteriorGlassTypeMeta()) {
      map = __glassTypeInteriorByChoiceValue || window.__glass_type_interior_by_choice_value || null;
    } else {
      map = __glassTypeExteriorByChoiceValue || window.__glass_type_exterior_by_choice_value || null;
    }
    if (!map || typeof map !== 'object') return 0;
    var key = String(choiceValueNorm || '');
    if (!key) return 0;
    var rec = map[key];
    if (!rec) return 0;
    var fields = rec.fields || rec;
    var raw = fields.straight_pricing != null ? fields.straight_pricing : (fields.straightPricing != null ? fields.straightPricing : null);
    var n = parseFloat(raw);
    return isNaN(n) ? 0 : n;
  }

  function getSelectedGlassTypeRadioKeyFromDom() {
    try {
      var checked = getCheckedStormGlassRadio();
      if (!checked || checked.value == null) return '';
      return normChoiceValue(String(checked.value || ''));
    } catch (e) {}
    return '';
  }

  // Gate add-to-base-price: only apply when a storm/glass type RADIO is selected (and matches key).
  function shouldApplyGlassTypeExteriorAddon(stormKeyNorm) {
    var selectedKey = getSelectedGlassTypeRadioKeyFromDom();
    if (!selectedKey) return false;
    var want = normChoiceValue(String(stormKeyNorm || ''));
    if (!want) return false;
    return selectedKey === want;
  }

  // Public API for door-conf2.js
  window.GlassFormulaCalculation = {
    normChoiceValue: normChoiceValue,
    getApiUrl: getSidelightTransomApiUrl,
    load: loadSidelightTransomFromApi, // optionally pass [values]
    getSelectedChoiceValuesFromDom: getSelectedChoiceValuesFromDom,
    calculateAddonFromCache: calculateAddonFromCache,
    getMissingFromCache: getMissingFromCache,
    getSelectedSidelightTransomStyleKeyFromDom: getSelectedSidelightTransomStyleKeyFromDom,
    getSelectedSidelightStyleKeyFromDom: getSelectedSidelightStyleKeyFromDom,
    getSelectedTransomStyleKeyFromDom: getSelectedTransomStyleKeyFromDom,
    getSelectedSidelightTransomStyleKeysFromDom: getSelectedSidelightTransomStyleKeysFromDom,
    ensureSidelightTransomLoaded: ensureSidelightTransomLoadedForCurrentSelection,
    merge: mergeSidelightTransomMap,

    // glass_type_exterior (storm glass)
    getGlassTypeExteriorApiUrl: getGlassTypeExteriorApiUrl,
    loadGlassTypeExterior: loadGlassTypeExteriorFromApi, // optionally pass [values]
    getMissingGlassTypeExteriorFromCache: getMissingGlassTypeExteriorFromCache,
    getStraightPricingFromCache: getStraightPricingFromCache,
    calculateStormGlassAddonFromCache: calculateStormGlassAddonFromCache,
    calculateStormGlassAddonTotalFromCache: calculateStormGlassAddonTotalFromCache,
    shouldApplyGlassTypeExteriorAddon: shouldApplyGlassTypeExteriorAddon,
    mergeGlassTypeExterior: mergeGlassTypeExteriorMap,

    // glass_type_interior (same API shape; when product tag is interior-doors)
    productUsesInteriorGlassTypeMeta: productUsesInteriorGlassTypeMeta,
    productUsesScreenAndStormGlassTypeMeta: productUsesScreenAndStormGlassTypeMeta,
    getGlassTypeInteriorApiUrl: getGlassTypeInteriorApiUrl,
    loadGlassTypeInterior: loadGlassTypeInteriorFromApi,
    getMissingGlassTypeInteriorFromCache: getMissingGlassTypeInteriorFromCache,
    mergeGlassTypeInterior: mergeGlassTypeInteriorMap,

    // glass_type_screen_and_storm (Screen And Storm Doors product type)
    getGlassTypeScreenAndStormApiUrl: getGlassTypeScreenAndStormApiUrl,
    loadGlassTypeScreenAndStorm: loadGlassTypeScreenAndStormFromApi,
    getMissingGlassTypeScreenAndStormFromCache: getMissingGlassTypeScreenAndStormFromCache,
    mergeGlassTypeScreenAndStorm: mergeGlassTypeScreenAndStormMap,

    getMissingStormGlassTypeFromCache: getMissingStormGlassTypeFromCache,
    loadStormGlassTypeFromApi: loadStormGlassTypeFromApi,
    logStormGlass: stormGlassDebugLog,
    getCheckedStormGlassRadio: getCheckedStormGlassRadio
  };

  // Prefetch metaobject rows when customer picks storm/glass type (glass_type or storm_glass_type).
  // Deferred tick so .checked is correct when using capture-phase click or label clicks.
  function __handleGlassTypeRadioInteraction(evt) {
    try {
      if (!isDoorPricingApiEnabled()) return;
      var t = evt && evt.target ? evt.target : null;
      if (!t) return;
      var input = resolveStormGlassRadioFromEventTarget(t);
      if (!input) return;
      scheduleStormGlassTypeFetchFromInput(input);
    } catch (e) {}
  }

  try {
    document.addEventListener('click', __handleGlassTypeRadioInteraction, true);
    document.addEventListener('change', __handleGlassTypeRadioInteraction, true);
    document.addEventListener('click', scheduleSidelightTransomFetchFromInteraction, true);
    document.addEventListener('change', scheduleSidelightTransomFetchFromInteraction, true);
  } catch (e) {}
})();

