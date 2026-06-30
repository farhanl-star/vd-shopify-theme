// pricing-rule-int-ext.js
// Extracted helper for pricing_rule_int_ext triage + measurement capture.
//
// NOTE:
// This file is the one referenced by `door-config2-snippet*.liquid` via:
//   {{ 'pricing-rule-int-ext.js' | asset_url | script_tag | defer }}
//
// It includes support for optional thickness matching via:
//   #exact-door-thickness-int + #exact-door-thickness-frac + #finished-door-thickness => thickness (decimal inches)
// and passes `thickness` to the proxy endpoint.

(function () {
  var _pricingRuleIntExtAlreadyLoaded = !!window.DoorIntExtPricingRule;

  if (typeof window.DOOR_PRICE_DEBUG === 'undefined') {
    try {
      window.DOOR_PRICE_DEBUG = /(?:\?|&)door_price_debug=1(?:&|$)/i.test(String((window.location && window.location.search) || ''));
    } catch (eDbgInit) {
      window.DOOR_PRICE_DEBUG = false;
    }
  }

function norm(v) {
  return String(v == null ? '' : v).trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function toNum(n) {
  var x = parseFloat(n);
  return isNaN(x) ? 0 : x;
}

function isDoorPricingApiEnabled() {
  try { return !window.__doorSelectionLogOnly; } catch (e) { return true; }
}

function isPetGatesCollectionActive() {
  try {
    if (window.DoorConf2Measurements && typeof window.DoorConf2Measurements.isPetGatesCollection === 'function') {
      return window.DoorConf2Measurements.isPetGatesCollection();
    }
  } catch (ePet) {}
  return false;
}

function isPetGatesExactMeasureChangeTarget(t) {
  try {
    if (window.DoorConf2Measurements && typeof window.DoorConf2Measurements.isPetGatesExactMeasureSelectEl === 'function') {
      return window.DoorConf2Measurements.isPetGatesExactMeasureSelectEl(t);
    }
  } catch (ePetSel) {}
  if (!t || String(t.tagName || '').toUpperCase() !== 'SELECT') return false;
  var id = String(t.id || '');
  return id === 'exact-door-width-int' || id.indexOf('exact-door-width-int') === 0
    || id === 'exact-door-width-frac' || id.indexOf('exact-door-width-frac') === 0
    || id === 'door_height' || (id.indexOf('door_height') === 0 && id.indexOf('fraction') === -1)
    || id === 'door_height_fraction' || id.indexOf('door_height_fraction') === 0;
}

function getPetGatesMeasurementAddon() {
  return parseFloat(window['__doorAddon_pet_gates_measurements'] || 0) || 0;
}

function emptyPricingProxyResponse() {
  return Promise.resolve({ price: 0, records: [], matched: false });
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

/** Metaobject thickness strings like "2 1/4" or "2-1/4" (inches). */
function parseThicknessString(v) {
  if (v == null) return NaN;
  var s = String(v).trim();
  if (!s) return NaN;
  var m = s.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (m) {
    var den = toNum(m[3]);
    if (!den) return NaN;
    return toNum(m[1]) + toNum(m[2]) / den;
  }
  m = s.match(/^(\d+)\s*-\s*(\d+)\s*\/\s*(\d+)$/);
  if (m) {
    var den2 = toNum(m[3]);
    if (!den2) return NaN;
    return toNum(m[1]) + toNum(m[2]) / den2;
  }
  var x = parseFloat(s);
  return isNaN(x) ? parseDropdownNumber(s) : x;
}

function unwrapShopifyValue(v) {
  // Shopify metaobjects sometimes serialize fields as `{ value: "..." }` or `{ amount: "..." }`.
  if (v && typeof v === 'object') {
    if (v.value != null) return v.value;
    if (v.amount != null) return v.amount;
    if (v.val != null) return v.val;
  }
  return v;
}

function getFieldFromRecord(r, fieldName) {
  if (!r) return undefined;
  // direct property
  if (r[fieldName] != null) return unwrapShopifyValue(r[fieldName]);
  // common alt casing
  var camel = fieldName.replace(/_([a-z])/g, function (_, c) { return c.toUpperCase(); });
  if (r[camel] != null) return unwrapShopifyValue(r[camel]);
  // metaobject `fields` array support: [{ key/name: "price", value: ... }]
  if (Array.isArray(r.fields)) {
    for (var i = 0; i < r.fields.length; i++) {
      var f = r.fields[i];
      if (!f) continue;
      var k = f.key != null ? f.key : (f.name != null ? f.name : f.id);
      if (norm(k) !== norm(fieldName)) continue;
      return unwrapShopifyValue(f.value != null ? f.value : (f.val != null ? f.val : f));
    }
  }
  return undefined;
}

function findPricingRuleByTitle(records, title) {
  // "title" in our code means the entry identifier.
  // In some data sources this is stored under `title`, `table_key`, or `key`.
  var want = norm(title);
  for (var i = 0; i < records.length; i++) {
    var r = records[i] || {};
    var t1 = getFieldFromRecord(r, 'title');
    var t2 = getFieldFromRecord(r, 'table_key');
    var t3 = getFieldFromRecord(r, 'key');
    if (norm(t1) === want) return r;
    if (norm(t2) === want) return r;
    if (norm(t3) === want) return r;
  }
  return null;
}

function readPriceValueFromRecord(r) {
  if (!r) return 0;
  var p =
    getFieldFromRecord(r, 'price') != null ? getFieldFromRecord(r, 'price')
    : (getFieldFromRecord(r, 'price_value') != null ? getFieldFromRecord(r, 'price_value')
    : getFieldFromRecord(r, 'amount'));
  // Accept "$ 220.00" or similar formats.
  var cleaned = String(p == null ? '' : p).replace(/[^0-9.\-]+/g, '');
  var parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// Listen via event delegation so it works for dynamically inserted selects.
function closestRootForMeasurement(el) {
  try {
    if (!el || !el.closest) return null;
    return (
      el.closest('.door-measurement-static-panel')
      || el.closest('.door-measurement-slab-panels')
      || el.closest('.door-measurement-slab-transom-panels')
      || el.closest('.door-measurement-combo-panels')
      || el.closest('#door-configurator')
      || null
    );
  } catch (e) {}
  return null;
}

function readThicknessFromDom(root) {
  try {
    // Last explicit user selection wins (duplicate ids / multiple panels).
    if (typeof window.__lastDoorThicknessInches === 'number' && window.__lastDoorThicknessInches > 0) {
      return window.__lastDoorThicknessInches;
    }

    // Theme has multiple thickness UIs:
    // - two dropdowns (int + frac): exact-door-thickness-int / exact-door-thickness-frac
    // - single dropdown: door-thickness (often values like "2 1/4" or "2.25")
    // - single dropdown: panel-door-thickness-frac (values like "1.5", "1.75", "2.25")
    var scope = root || getVisibleMeasurementPanelEl() || document;
    var single = null;
    try {
      single = (scope && scope.querySelector) ? scope.querySelector('#door-thickness') : null;
    } catch (e1) {}
    if (!single) single = getVisibleById('door-thickness') || document.getElementById('door-thickness');
    if (single && single.value != null && String(single.value).trim() !== '') {
      var parsedSingle = parseThicknessString(single.value);
      if (!isNaN(parsedSingle) && parsedSingle > 0) return parsedSingle;
    }

    var panelKey = getActiveMeasurementPanelKey();
    var thkPrefix = panelKey === 'rough' ? 'rough-door-thickness' : (panelKey === 'finished' ? 'finished-door-thickness' : '');
    if (thkPrefix) {
      var thkIntEl = null;
      var thkFracEl = null;
      try {
        if (scope && scope.querySelector) {
          thkIntEl = scope.querySelector('select[id^="' + thkPrefix + '-int"], #' + thkPrefix + '-int');
          thkFracEl = scope.querySelector('select[id^="' + thkPrefix + '-frac"], #' + thkPrefix + '-frac');
        }
      } catch (eThkQ) {}
      var thkSel = thkFracEl || thkIntEl;
      if (!thkSel && scope && scope.querySelector) {
        thkSel = scope.querySelector('select[id^="' + thkPrefix + '"], #' + thkPrefix);
      }
      if (thkSel && thkSel.value != null && String(thkSel.value).trim() !== '') {
        var rawThkFrac = thkFracEl && thkFracEl.value != null ? String(thkFracEl.value) : '';
        var parsedThkFrac = rawThkFrac ? parseThicknessString(rawThkFrac) : NaN;
        if (!isNaN(parsedThkFrac) && parsedThkFrac > 0.9) return parsedThkFrac;
        var parsedThkSingle = parseThicknessString(thkSel.value);
        if (!isNaN(parsedThkSingle) && parsedThkSingle > 0) return parsedThkSingle;
        if (thkIntEl) return toNum(thkIntEl.value) + parseDropdownNumber(rawThkFrac);
      }
    }

    var panelSingle = null;
    try {
      panelSingle = (scope && scope.querySelector) ? scope.querySelector('#panel-door-thickness-frac') : null;
    } catch (ePanel1) {}
    if (!panelSingle) panelSingle = getVisibleById('panel-door-thickness-frac') || document.getElementById('panel-door-thickness-frac');
    if (panelSingle && panelSingle.value != null && String(panelSingle.value).trim() !== '') {
      var parsedPanel = parseThicknessString(panelSingle.value);
      if (!isNaN(parsedPanel) && parsedPanel > 0) return parsedPanel;
    }

    var intEl = null;
    var fracEl = null;
    try {
      if (scope && scope.querySelector) {
        intEl = scope.querySelector('#exact-door-thickness-int, select[id^="exact-door-thickness-int"]');
        fracEl = scope.querySelector('#exact-door-thickness-frac, select[id^="exact-door-thickness-frac"]');
      }
    } catch (e2) {}
    if (!intEl) intEl = firstVisibleSelectStrict('select#exact-door-thickness-int, select[id^="exact-door-thickness-int"]')
      || getVisibleById('exact-door-thickness-int')
      || document.getElementById('exact-door-thickness-int');
    if (!fracEl) {
      // Multiple duplicate ids: pick the best candidate (avoid hidden default 1.5).
      try {
        var cand = document.querySelectorAll('#exact-door-thickness-frac, select[id^="exact-door-thickness-frac"]');
        var bestEl = null;
        var bestScore = -1;
        var preferThk = 1.75;
        try {
          if (
            window.DoorConf2Measurements
            && typeof window.DoorConf2Measurements.getDefaultExactDoorThicknessFracValue === 'function'
          ) {
            preferThk = parseFloat(window.DoorConf2Measurements.getDefaultExactDoorThicknessFracValue()) || 1.75;
          }
        } catch (ePrefThk) {}
        for (var ci = 0; ci < cand.length; ci++) {
          var el = cand[ci];
          if (!el) continue;
          var vis = el.offsetParent !== null;
          var v = el.value != null ? String(el.value).trim() : '';
          var pv = v ? parseThicknessString(v) : NaN;
          if (isNaN(pv)) pv = parseDropdownNumber(v);
          var score = (vis ? 1000 : 0) + (Math.abs(pv - preferThk) > 0.02 ? 100 : 0) + (pv > 0 ? pv : 0);
          if (score > bestScore) {
            bestScore = score;
            bestEl = el;
          }
        }
        fracEl = bestEl || getVisibleById('exact-door-thickness-frac') || document.getElementById('exact-door-thickness-frac');
      } catch (eFracPick) {
        fracEl = getVisibleById('exact-door-thickness-frac') || document.getElementById('exact-door-thickness-frac');
      }
    }
    if (!intEl && !fracEl) return 0;

    // If the "frac" dropdown actually contains a full thickness string, parse it.
    var rawFrac = fracEl && fracEl.value != null ? String(fracEl.value) : '';
    var parsedFracAsThickness = rawFrac ? parseThicknessString(rawFrac) : NaN;
    if (!isNaN(parsedFracAsThickness) && parsedFracAsThickness > 0.9) {
      return parsedFracAsThickness;
    }

    return toNum(intEl && intEl.value) + parseDropdownNumber(rawFrac);
  } catch (e) {}
  return 0;
}

function readThicknessAnyFromPanel(root) {
  // Final fallback: some theme panels render thickness select(s) without IDs.
  try {
    var scope = root || document;
    if (!scope || !scope.querySelectorAll) return 0;
    var nodes = scope.querySelectorAll(
      '.door-measure-thickness select, #panel-door-thickness-frac, #door-thickness,' +
      '#exact-door-thickness-int, #exact-door-thickness-frac, #finished-door-thickness,' +
      'select[id^="finished-door-thickness"]'
    );
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (!el || el.value == null) continue;
      var v = String(el.value).trim();
      if (!v) continue;
      var parsed = parseThicknessString(v);
      if (!isNaN(parsed) && parsed > 0) return parsed;
      var parsed2 = parseDropdownNumber(v);
      if (!isNaN(parsed2) && parsed2 > 0) return parsed2;
    }
  } catch (e) {}
  return 0;
}

function setThicknessRowHiddenOnAnchor(anchor, hidden) {
  try {
    if (!anchor || !anchor.closest) return;
    if (hidden && isExactDoorThicknessAnchor(anchor)) return;
    var row = anchor.closest('.door-measure-dimension-row')
      || anchor.closest('.door-measure-thickness')
      || anchor.closest('.door-option-wrap')
      || anchor.parentElement;
    if (!row) return;
    if (hidden && row.querySelector && row.querySelector(
      '#exact-door-thickness-frac, select[id^="exact-door-thickness-frac"]'
    )) {
      return;
    }
    row.style.display = hidden ? 'none' : '';
    row.style.removeProperty('visibility');
  } catch (e) {}
}

function isExactDoorThicknessAnchor(anchor) {
  if (!anchor) return false;
  var id = String(anchor.id || '');
  if (id === 'exact-door-thickness-frac' || id.indexOf('exact-door-thickness-frac') === 0) return true;
  if (id === 'exact-door-thickness-int' || id.indexOf('exact-door-thickness-int') === 0) return true;
  return false;
}

function ensureExactDoorThicknessFracRowVisible() {
  try {
    var nodes = document.querySelectorAll(
      '#exact-door-thickness-frac, select[id^="exact-door-thickness-frac"]'
    );
    for (var i = 0; i < nodes.length; i++) {
      var sel = nodes[i];
      if (!sel || !sel.closest) continue;
      var row = sel.closest('.door-measure-dimension-row')
        || sel.closest('.door-measure-thickness')
        || sel.closest('.door-option-wrap')
        || sel.parentElement;
      if (!row) continue;
      row.style.display = '';
      row.classList.remove('door-hidden');
      row.style.removeProperty('visibility');
    }
  } catch (e) {}
}

var THICKNESS_SELECTORS_ALL =
  '#exact-door-thickness-int, #exact-door-thickness-frac,' +
  'select[id^="exact-door-thickness"],' +
  '#finished-door-thickness-int, #finished-door-thickness-frac,' +
  '#finished-door-thickness, select[id^="finished-door-thickness"],' +
  '#rough-door-thickness-int, #rough-door-thickness-frac,' +
  '#rough-door-thickness, select[id^="rough-door-thickness"],' +
  '#door-thickness, .door-measure-thickness select';

function rowTitleIsThickness(row) {
  try {
    var titleEl = row.querySelector('.door-measure-dimension-title') || row.querySelector('h4');
    var title = String((titleEl && titleEl.textContent) || '').toLowerCase();
    return title.indexOf('thickness') !== -1 || title.indexOf('thick') !== -1;
  } catch (e) {}
  return false;
}

/** Collect thickness <select>s inside a measurement panel (exact or finished opening). */
function collectThicknessSelectsInScope(scope) {
  var list = [];
  if (!scope || !scope.querySelectorAll) return list;
  try {
    mergeUniqueSelectNodesOrdered(list, scope.querySelectorAll(THICKNESS_SELECTORS_ALL));
    var rows = scope.querySelectorAll('.door-measure-dimension-row');
    for (var ri = 0; ri < rows.length; ri++) {
      var row = rows[ri];
      if (!row || !rowTitleIsThickness(row)) continue;
      mergeUniqueSelectNodesOrdered(list, row.querySelectorAll('select'));
    }
  } catch (e) {}
  return sortSelectNodesVisibleFirst(list);
}

function findMeasurementPanelElByKey(key) {
  key = String(key || '');
  try {
    if (key === 'panel') {
      var panelW = firstVisibleSelectStrict('select#panel-width-int, select[id^="panel-width-int"]');
      if (panelW && panelW.closest) {
        var byPanel = panelW.closest('.door-measurement-static-panel');
        if (byPanel) return byPanel;
      }
      return null;
    }
    var classSel = {
      exact: '.door-measurement-static-panel--exact',
      finished: '.door-measurement-static-panel--finished',
      rough: '.door-measurement-static-panel--rough',
      jamb: '.door-measurement-static-panel--jamb'
    }[key];
    if (!classSel) return null;
    var panels = document.querySelectorAll(classSel);
    for (var i = 0; i < panels.length; i++) {
      if (isElementVisible(panels[i])) return panels[i];
    }
    return panels.length ? panels[0] : null;
  } catch (e) {}
  return null;
}

function getVisibleMeasurementPanelEl(hintEl) {
  return findMeasurementPanelElByKey(getActiveMeasurementPanelKey(hintEl));
}

/** Thickness dropdowns in the active static measurement panel only. */
function collectActivePanelThicknessSelectsOrdered(hintEl) {
  var panel = getVisibleMeasurementPanelEl(hintEl);
  var list = collectThicknessSelectsInScope(panel);
  if (list.length) return list;
  return collectDoorThicknessFracLikeSelectsOrdered();
}

function setThicknessRowHiddenForPanel(panelEl, hidden) {
  if (!panelEl) return;
  var sels = collectThicknessSelectsInScope(panelEl);
  for (var i = 0; i < sels.length; i++) {
    setThicknessRowHiddenOnAnchor(sels[i], hidden);
  }
}

/**
 * Show/hide thickness row on the active measurement tab only.
 * exact-door-thickness-* ↔ finished-door-thickness-* behave the same.
 */
function setThicknessRowHidden(hidden) {
  try {
    var activeKey = getActiveMeasurementPanelKey();
    var panelKeys = ['exact', 'finished', 'rough', 'jamb', 'panel'];
    for (var pi = 0; pi < panelKeys.length; pi++) {
      var pk = panelKeys[pi];
      var panelEl = findMeasurementPanelElByKey(pk);
      setThicknessRowHiddenForPanel(panelEl, hidden || pk !== activeKey);
    }
  } catch (e) {}
}

var INT_EXT_EXACT_THICK_FRAC_HIDDEN_ATTR = 'data-int-ext-exact-frac-hidden';

/** Native <select> often still lists `option[hidden]`; we stash originals and rebuild with one 2¼ option. */
function ensureThicknessSelectFullOptionsBackup(sel) {
  if (!sel || sel.__intExtThicknessOptionsBackup) return;
  try {
    if (!sel.options || sel.options.length === 0) return;
    var arr = [];
    for (var i = 0; i < sel.options.length; i++) {
      var o = sel.options[i];
      arr.push({ value: o.value, text: o.text, disabled: !!o.disabled });
    }
    sel.__intExtThicknessOptionsBackup = arr;
  } catch (e) {}
}

function restoreThicknessSelectFromBackupIfPresent(sel) {
  if (!sel) return;
  try {
    if (sel.__intExtThicknessOptionsBackup) {
      var arr = sel.__intExtThicknessOptionsBackup;
      sel.innerHTML = '';
      for (var i = 0; i < arr.length; i++) {
        var o = document.createElement('option');
        o.value = arr[i].value;
        o.textContent = arr[i].text;
        if (arr[i].disabled) o.disabled = true;
        sel.appendChild(o);
      }
      delete sel.__intExtThicknessOptionsBackup;
    } else if (sel.options) {
      for (var j = 0; j < sel.options.length; j++) {
        var op = sel.options[j];
        if (op && op.getAttribute(INT_EXT_EXACT_THICK_FRAC_ATTR) === '1') {
          op.hidden = false;
          op.removeAttribute(INT_EXT_EXACT_THICK_FRAC_ATTR);
        }
      }
    }
  } catch (e) {}
}

function reduceThicknessSelectToTwoQuarter(sel) {
  if (!sel) return;
  ensureThicknessSelectFullOptionsBackup(sel);
  var arr = sel.__intExtThicknessOptionsBackup;
  if (!arr || !arr.length) return;
  var keep = null;
  for (var k = 0; k < arr.length; k++) {
    var fakeOpt = { value: arr[k].value, textContent: arr[k].text };
    if (optionIsApproxTwoQuarterInches(fakeOpt)) {
      keep = arr[k];
      break;
    }
  }
  try {
    sel.innerHTML = '';
    var opt = document.createElement('option');
    if (keep) {
      opt.value = keep.value;
      opt.textContent = keep.text;
      if (keep.disabled) opt.disabled = true;
    } else {
      opt.value = '2.25';
      opt.textContent = '2 1/4';
    }
    sel.appendChild(opt);
    sel.selectedIndex = 0;
  } catch (e2) {}
}

function restoreExactDoorThicknessFracOptionsFromIntExtFilter() {
  try {
    var fracs = collectActivePanelThicknessSelectsOrdered();
    if (!fracs.length) fracs = collectDoorThicknessFracLikeSelectsOrdered();
    for (var i = 0; i < fracs.length; i++) {
      restoreThicknessSelectFromBackupIfPresent(fracs[i]);
    }
    var singles = collectDoorThicknessSinglesOrdered();
    for (var s = 0; s < singles.length; s++) {
      restoreThicknessSelectFromBackupIfPresent(singles[s]);
    }
  } catch (e) {}
}

function mergeUniqueSelectNodesOrdered(list, nodes) {
  for (var i = 0; i < nodes.length; i++) {
    var el = nodes[i];
    if (!el) continue;
    var dup = false;
    for (var k = 0; k < list.length; k++) {
      if (list[k] === el) {
        dup = true;
        break;
      }
    }
    if (!dup) list.push(el);
  }
}

function sortSelectNodesVisibleFirst(list) {
  var vis = [];
  var rest = [];
  for (var j = 0; j < list.length; j++) {
    try {
      if (list[j].offsetParent !== null) vis.push(list[j]);
      else rest.push(list[j]);
    } catch (e2) {
      rest.push(list[j]);
    }
  }
  return vis.concat(rest);
}

/** exact-door-thickness-* + finished-door-thickness-* (+ door-thickness when frac-like). */
function collectDoorThicknessFracLikeSelectsOrdered() {
  var list = [];
  try {
    mergeUniqueSelectNodesOrdered(list, document.querySelectorAll(
      '#exact-door-thickness-frac, select[id^="exact-door-thickness-frac"],' +
      '#finished-door-thickness-int, #finished-door-thickness-frac,' +
      '#finished-door-thickness, select[id^="finished-door-thickness"],' +
      '#rough-door-thickness-int, #rough-door-thickness-frac,' +
      '#rough-door-thickness, select[id^="rough-door-thickness"]'
    ));
  } catch (e) {}
  return sortSelectNodesVisibleFirst(list);
}

/** Alias for collectDoorThicknessFracLikeSelectsOrdered (exact + finished + rough thickness dropdowns). */
function collectExactDoorThicknessFracSelectsOrdered() {
  return collectDoorThicknessFracLikeSelectsOrdered();
}

function collectExactDoorThicknessIntSelectsOrdered() {
  var list = [];
  try {
    var nodes = document.querySelectorAll(
      '#exact-door-thickness-int, select[id^="exact-door-thickness-int"],' +
      '#finished-door-thickness-int, select[id^="finished-door-thickness-int"],' +
      '#rough-door-thickness-int, select[id^="rough-door-thickness-int"]'
    );
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (!el) continue;
      var dup = false;
      for (var k = 0; k < list.length; k++) {
        if (list[k] === el) {
          dup = true;
          break;
        }
      }
      if (!dup) list.push(el);
    }
  } catch (e) {}
  var vis = [];
  var rest = [];
  for (var j = 0; j < list.length; j++) {
    try {
      if (list[j].offsetParent !== null) vis.push(list[j]);
      else rest.push(list[j]);
    } catch (e2) {
      rest.push(list[j]);
    }
  }
  return vis.concat(rest);
}

function collectDoorThicknessSinglesOrdered() {
  var list = [];
  try {
    var nodes = document.querySelectorAll('#door-thickness');
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i]) list.push(nodes[i]);
    }
  } catch (e) {}
  var vis = [];
  var rest = [];
  for (var j = 0; j < list.length; j++) {
    try {
      if (list[j].offsetParent !== null) vis.push(list[j]);
      else rest.push(list[j]);
    } catch (e2) {
      rest.push(list[j]);
    }
  }
  return vis.concat(rest);
}

function optionIsApproxTwoQuarterInches(opt) {
  if (!opt) return false;
  try {
    var vv = opt.value != null ? String(opt.value).trim() : '';
    var txt = opt.textContent != null ? String(opt.textContent).trim() : '';
    var sources = vv ? [vv, txt] : [txt];
    for (var si = 0; si < sources.length; si++) {
      var s = sources[si];
      if (!s) continue;
      var pv = parseThicknessString(s);
      if (isNaN(pv) || pv <= 0) pv = parseDropdownNumber(s);
      if (!isNaN(pv) && approxEq(pv, 2.25)) return true;
    }
  } catch (e) {}
  return false;
}

function optionIsApproxOneThreeQuarterInches(opt) {
  if (!opt) return false;
  try {
    var vv = opt.value != null ? String(opt.value).trim() : '';
    var txt = opt.textContent != null ? String(opt.textContent).trim() : '';
    var sources = vv ? [vv, txt] : [txt];
    for (var si = 0; si < sources.length; si++) {
      var s = sources[si];
      if (!s) continue;
      var pv = parseThicknessString(s);
      if (isNaN(pv) || pv <= 0) pv = parseDropdownNumber(s);
      if (!isNaN(pv) && approxEq(pv, 1.75)) return true;
    }
  } catch (e) {}
  return false;
}

/** Interior light-pink cells: rebuild exact-door-thickness-frac with only 1 3/4 and 2 1/4. */
function reduceThicknessSelectToOneThreeQuarterAndTwoQuarter(sel) {
  if (!sel) return;
  ensureThicknessSelectFullOptionsBackup(sel);
  var arr = sel.__intExtThicknessOptionsBackup;
  if (!arr || !arr.length) return;
  var keeps = [];
  for (var k = 0; k < arr.length; k++) {
    var fakeOpt = { value: arr[k].value, textContent: arr[k].text };
    if (optionIsApproxOneThreeQuarterInches(fakeOpt) || optionIsApproxTwoQuarterInches(fakeOpt)) {
      keeps.push(arr[k]);
    }
  }
  try {
    sel.innerHTML = '';
    if (keeps.length > 0) {
      for (var i = 0; i < keeps.length; i++) {
        var opt = document.createElement('option');
        opt.value = keeps[i].value;
        opt.textContent = keeps[i].text;
        if (keeps[i].disabled) opt.disabled = true;
        sel.appendChild(opt);
      }
    } else {
      var o1 = document.createElement('option');
      o1.value = '1.75'; o1.textContent = '1 3/4';
      sel.appendChild(o1);
      var o2 = document.createElement('option');
      o2.value = '2.25'; o2.textContent = '2 1/4';
      sel.appendChild(o2);
    }
    sel.selectedIndex = 0;
  } catch (e2) {}
}

/** Oversized "red" cells: slab + prehung — only 2.25 (2 1/4) in the dropdown (native select ignores option[hidden]). */
function applyExactDoorThicknessFracTwoQuarterOnly() {
  try {
    var fracs = collectActivePanelThicknessSelectsOrdered();
    for (var fi = 0; fi < fracs.length; fi++) {
      reduceThicknessSelectToTwoQuarter(fracs[fi]);
    }
    var singles = collectDoorThicknessSinglesOrdered();
    for (var si = 0; si < singles.length; si++) {
      reduceThicknessSelectToTwoQuarter(singles[si]);
    }
    var panel = getVisibleMeasurementPanelEl();
    var intNodes = panel
      ? collectThicknessSelectsInScope(panel).filter(function (el) {
        return el && el.classList && el.classList.contains('door-dimension-int-select');
      })
      : collectExactDoorThicknessIntSelectsOrdered();
    for (var ii = 0; ii < intNodes.length; ii++) {
      var intEl = intNodes[ii];
      if (!intEl || !intEl.options) continue;
      for (var k = 0; k < intEl.options.length; k++) {
        var o = intEl.options[k];
        if (o && String(o.value) === '2') {
          intEl.selectedIndex = k;
          break;
        }
      }
    }
  } catch (e) {}
  try {
    window.__lastDoorThicknessInches = 2.25;
  } catch (e2) {}
}

/**
 * Interior Doors — thickness classification.
 * The last height column (96"+ / 90"+ / 83"+) has no upper ceiling — real doors exceed 100".
 * White  (hidden)       : 24-36 × 82-95 | 37-39 × 82-89
 * Light-pink (1¾ + 2¼) : 24-36 × 96+   | 37-39 × 90+   | 40-42 × 82-95 | 43-48 × 82
 * Red    (2¼ only)      : 24-36 × 107+  | 40-42 × 90+   | 43-48 × 83+
 * Neutral (hidden)      : everything else
 */
function classifyInteriorDoorThicknessBand(width, height) {
  var w = parseFloat(width);
  var h = parseFloat(height);
  if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return 'neutral';
  // White – hide
  if ((w >= 24 && w <= 36) && (h >= 82 && h <= 95)) return 'white';
  if ((w >= 37 && w <= 39) && (h >= 82 && h <= 89)) return 'white';
  // Light pink – 1 3/4 + 2 1/4
  if ((w >= 24 && w <= 36) && h >= 96) return 'light-pink';
  if ((w >= 24 && w <= 36) && h >= 96 && h <= 106) return 'light-pink';
  if ((w >= 37 && w <= 39) && h >= 90) return 'light-pink';
  if ((w >= 40 && w <= 42) && (h >= 82 && h <= 95)) return 'light-pink';
  if ((w >= 43 && w <= 48) && (h >= 82 && h < 83)) return 'light-pink'; // 82" only
  // Dark pink – 2 1/4 only
  if ((w >= 24 && w <= 36) && h >= 107) return 'red';
  if ((w >= 40 && w <= 42) && h >= 90) return 'red';
  if ((w >= 43 && w <= 48) && h >= 83) return 'red';
  return 'neutral';
}

/**
 * Fixed interior-door thickness addon prices.
 * Slab:    1 3/4 → $110   | 2 1/4 → $1320
 * Prehung: 1 3/4 → $195   | 2 1/4 → $1760
 */
function computeInteriorThicknessAddon(thicknessInches) {
  var t = parseFloat(thicknessInches);
  if (isNaN(t) || t <= 0) return 0;
  var setup = getDoorSetupFromDom();
  var isPrehung = setup === 'pre_hung_on_jamb';
  if (approxEq(t, 1.75)) return isPrehung ? 195 : 110;
  if (approxEq(t, 2.25)) return isPrehung ? 1760 : 1320;
  return 0;
}

/** Apply interior thickness addon (replaces prior interior thickness add-on, does not stack). */
function applyInteriorThicknessAddon(thicknessInches, opts) {
  opts = opts || {};
  ensureDoorAddonBasePriceCaptured();
  var addon = computeInteriorThicknessAddon(thicknessInches);
  applyAddonToEstimatedPriceKey(addon, 'interiorDoorThickness', {
    skipAlert: !!opts.skipAlert,
    alertLabel: DOOR_ADDON_ALERT_LABELS.interiorDoorThickness
  });
  return addon;
}

/** Apply interior thickness addon to the dedicated key and alert the amount. */
function applyInteriorThicknessAddonAndAlert(thicknessInches) {
  return applyInteriorThicknessAddon(thicknessInches);
}

/** Interior light-pink: thickness dropdown(s) show [1 3/4, 2 1/4]; 1 3/4 pre-selected + addon applied. */
function applyExactDoorThicknessFracInteriorLightPink(changedEl) {
  try {
    var fracs = collectActivePanelThicknessSelectsOrdered();
    for (var fi = 0; fi < fracs.length; fi++) {
      reduceThicknessSelectToOneThreeQuarterAndTwoQuarter(fracs[fi]);
    }
  } catch (e) {}
  try { window.__lastDoorThicknessInches = 1.75; } catch (e2) {}
  var addon = applyInteriorThicknessAddon(1.75);
  if (changedEl) {
    var lastLp = readEstimatedPriceFromDom() || getThemeOptionTotal();
    showDoorOptionPriceNote(changedEl, lastLp, addon, {
      total: lastLp + addon + (parseFloat(window['__doorAddon_intExtOversizedApi'] || 0) || 0),
      showWhenZero: true
    });
  }
}

/** Interior dark-pink (red): thickness shows only 2 1/4 + addon applied. */
function applyExactDoorThicknessFracInteriorRedOnly(changedEl) {
  try {
    var fracs = collectActivePanelThicknessSelectsOrdered();
    for (var fi = 0; fi < fracs.length; fi++) {
      reduceThicknessSelectToTwoQuarter(fracs[fi]);
    }
  } catch (e) {}
  try { window.__lastDoorThicknessInches = 2.25; } catch (e2) {}
  var addon = applyInteriorThicknessAddon(2.25);
  if (changedEl) {
    var lastLp = readEstimatedPriceFromDom() || getThemeOptionTotal();
    showDoorOptionPriceNote(changedEl, lastLp, addon, {
      total: lastLp + addon + (parseFloat(window['__doorAddon_intExtOversizedApi'] || 0) || 0),
      showWhenZero: true
    });
  }
}

/** Read width/height from the active measurement panel (Exact or Finished Opening). */
function readMeasurementsForThickness(hintEl) {
  var width = readDoorWidthInchesFromDom(hintEl);
  var height = readDoorHeightInchesFromDom(hintEl);
  if (width > 0 && height > 0) return { width: width, height: height };
  var fb = computeMeasurements();
  return {
    width: width > 0 ? width : fb.width,
    height: height > 0 ? height : fb.height
  };
}

/** Interior Doors thickness visibility — Exact + Finished Opening; uses classifyInteriorDoorThicknessBand. */
function updateInteriorDoorThicknessVisibility(width, height, changedEl, apiThickness) {
  var dims = readMeasurementsForThickness(changedEl);
  var w = parseFloat(width);
  var h = parseFloat(height);
  if (!w || w <= 0) w = dims.width;
  if (!h || h <= 0) h = dims.height;

  var band = 'neutral';
  if (apiThickness !== undefined && apiThickness !== null) {
    var tVal = parseFloat(apiThickness);
    if (isNaN(tVal) || tVal < 1.75) {
      band = 'white';
    } else if (approxEq(tVal, 1.75)) {
      band = 'light-pink';
    } else if (approxEq(tVal, 2.25)) {
      band = 'red';
    }
  } else {
    band = classifyInteriorDoorThicknessBand(w, h);
  }

  if (band === 'white' || band === 'neutral') {
    setThicknessRowHidden(true);
    ensureExactDoorThicknessFracRowVisible();
    restoreExactDoorThicknessFracOptionsFromIntExtFilter();
    applyAddonToEstimatedPriceKey(0, 'interiorDoorThickness');
    try { window.__lastDoorThicknessInches = 0; } catch (e) {}
    _syncDoorEstimatedPriceDisplay();
    return;
  }
  setThicknessRowHidden(false);
  if (band === 'light-pink') {
    applyExactDoorThicknessFracInteriorLightPink(changedEl);
  } else {
    applyExactDoorThicknessFracInteriorRedOnly(changedEl);
  }
  _syncDoorEstimatedPriceDisplay();
}

function updateExteriorDoorThicknessVisibility(width, height, changedEl, apiThickness) {
  var dims = readMeasurementsForThickness(changedEl);
  var w = parseFloat(width);
  var h = parseFloat(height);
  if (!w || w <= 0) w = dims.width;
  if (!h || h <= 0) h = dims.height;

  var band = 'neutral';
  if (apiThickness !== undefined && apiThickness !== null) {
    var tVal = parseFloat(apiThickness);
    if (isNaN(tVal) || tVal < 1.75) {
      band = 'white';
    } else {
      band = 'red';
    }
  } else {
    band = classifyIntExtExactDoorThicknessBand(w, h);
  }

  if (band === 'white') {
    setThicknessRowHidden(true);
    ensureExactDoorThicknessFracRowVisible();
    restoreExactDoorThicknessFracOptionsFromIntExtFilter();
    try {
      window.__lastDoorThicknessInches = 0;
    } catch (e) {}
    refreshSidelightLinkedExactThicknessFromChart(changedEl);
    _syncDoorEstimatedPriceDisplay();
    return;
  }
  setThicknessRowHidden(false);
  applyExactDoorThicknessFracTwoQuarterOnly();
  refreshSidelightLinkedExactThicknessFromChart(changedEl);
  _syncDoorEstimatedPriceDisplay();
}

/**
 * White cells: hide exact thickness row, no thickness add-on.
 * Red cells: show row, only 2.25 / 2 1/4 (slab + prehung; options rebuilt from backup when leaving red).
 */
function classifyIntExtExactDoorThicknessBand(width, height) {
  var w = parseFloat(width);
  var h = parseFloat(height);
  if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return 'neutral';
  if ((w >= 24 && w <= 36) && (h >= 82 && h <= 95)) return 'white';
  if ((w >= 37 && w <= 39) && (h >= 82 && h <= 89)) return 'white';
  if ((w >= 37 && w <= 39) && (h >= 90 && h <= 95)) return 'red';
  if (w >= 40 && h >= 82) return 'red';
  return 'neutral';
}

function intExtThicknessAddonForMeasurementBand(width, height, apiThickness) {
  var band = 'neutral';
  if (apiThickness !== undefined && apiThickness !== null) {
    var tVal = parseFloat(apiThickness);
    if (isNaN(tVal) || tVal < 1.75) {
      band = 'white';
    } else {
      band = 'red';
    }
  } else {
    band = classifyIntExtExactDoorThicknessBand(width, height);
  }
  if (band === 'white') return 0;
  return computeThicknessAddonPrice();
}

function updateThicknessVisibilityFromMeasurements(width, height, changedEl) {
  if (isSidelightStyleSelected() || isTransomStyleSelected()) {
    refreshSidelightLinkedExactThicknessFromChart(changedEl);
    return;
  }
  var dims = readMeasurementsForThickness(changedEl);
  var w = parseFloat(width);
  var h = parseFloat(height);
  if (!w || w <= 0) w = dims.width;
  if (!h || h <= 0) h = dims.height;

  if (getDoorSurfaceFromTags() === 'interior') {
    updateInteriorDoorThicknessVisibility(w, h, changedEl);
    return;
  }
  updateExteriorDoorThicknessVisibility(w, h, changedEl);
}

function approxEq(a, b, eps) {
  eps = eps == null ? 0.02 : eps;
  a = parseFloat(a);
  b = parseFloat(b);
  if (isNaN(a) || isNaN(b)) return false;
  return Math.abs(a - b) <= eps;
}

function getDoorSetupFromDom() {
  // Prefer checked value; data-option-id may vary, but values are stable.
  try {
    var root = document.getElementById('door-configurator-options') || document;
    var checked = root.querySelector('input[type="radio"]:checked, input[type="checkbox"]:checked');
    // More targeted:
    var slab = root.querySelector('input[value="slab_only"]:checked');
    var prehung = root.querySelector('input[value="pre_hung_on_jamb"]:checked');
    if (prehung) return 'pre_hung_on_jamb';
    if (slab) return 'slab_only';
  } catch (e) {}
  return '';
}

function getDoorSurfaceFromTags() {
  // Returns 'exterior' | 'interior' | ''
  try {
    var container = document.getElementById('door-configurator');
    var tagsAttr = container ? (container.getAttribute('data-product-tags') || '') : '';
    var tags = [];
    try {
      tags = Array.isArray(JSON.parse(tagsAttr)) ? JSON.parse(tagsAttr) : [];
    } catch (e1) {
      tags = String(tagsAttr || '').split('|');
    }
    var hasExteriorDoors = false;
    var hasInteriorDoors = false;
    for (var i = 0; i < tags.length; i++) {
      var t = String(tags[i] || '').toLowerCase();
      if (t.indexOf('exterior-doors') !== -1 || t.indexOf('exterior_doors') !== -1) hasExteriorDoors = true;
      if (t.indexOf('interior-doors') !== -1 || t.indexOf('interior_doors') !== -1) hasInteriorDoors = true;
    }
    if (hasInteriorDoors && !hasExteriorDoors) return 'interior';
    if (hasExteriorDoors && !hasInteriorDoors) return 'exterior';
    // fallback: broader tags
    var hasExterior = false;
    var hasInterior = false;
    for (var j = 0; j < tags.length; j++) {
      var t2 = String(tags[j] || '').toLowerCase();
      if (t2.indexOf('exterior') !== -1) hasExterior = true;
      if (t2.indexOf('interior') !== -1) hasInterior = true;
    }
    if (hasInterior && !hasExterior) return 'interior';
    if (hasExterior && !hasInterior) return 'exterior';
  } catch (e2) {}
  return '';
}

function isSidelightNoneValue(v) {
  var n = norm(v);
  if (!n || n === '0' || n === 'none') return true;
  if (n.indexOf('no_sidelight') !== -1 || n.indexOf('no_side_light') !== -1) return true;
  if (n.indexOf('without') !== -1 && n.indexOf('sidelight') !== -1) return true;
  return false;
}

function isSidelightStyleSelected() {
  // When sidelight style is chosen, we should avoid calling the general
  // exterior_* / interior_* oversized pricing API and rely on
  // sidelight/transom oversized logic instead.
  try {
    var root = document.getElementById('door-configurator-options') || document;

    // Preferred: controls created by door-conf2.js.
    var checked = root.querySelector('input[type="radio"][data-option-id="sidelight_style"]:checked');
    if (checked && !isSidelightNoneValue(checked.value)) return true;
    var sel = root.querySelector('select[data-option-id="sidelight_style"]');
    if (sel && sel.value != null) {
      var v = String(sel.value).trim();
      if (v !== '' && !isSidelightNoneValue(v)) return true;
    }

    // Fallback: by Liquid attribute name.
    var name = 'attributes[Select your sidelight style]';
    var checkedByName = root.querySelector('input[type="radio"][name="' + name + '"]:checked');
    if (checkedByName && !isSidelightNoneValue(checkedByName.value)) return true;
    var selByName = root.querySelector('select[name="' + name + '"]');
    if (selByName && selByName.value != null) {
      var v2 = String(selByName.value).trim();
      if (v2 !== '' && !isSidelightNoneValue(v2)) return true;
    }
  } catch (e) {}

  return false;
}

function isTransomStyleSelected() {
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
  } catch (e) {}
  return false;
}

function computeThicknessAddonPrice() {
  // Synonyms:
  // 2 1/4 => 2.25, 1 3/4 => 1.75. 0 => no addon.
  var thickness = readThicknessFromDom();
  if (!thickness || approxEq(thickness, 0)) return 0;

  var surface = getDoorSurfaceFromTags();
  var setup = getDoorSetupFromDom(); // slab_only | pre_hung_on_jamb

  // Exterior rules (2.25 only)
  if (surface === 'exterior' && approxEq(thickness, 2.25)) {
    if (setup === 'slab_only') return 1320;
    if (setup === 'pre_hung_on_jamb') return 1760;
    return 0;
  }

  // Interior rules (1.75 only)
  if (surface === 'interior' && approxEq(thickness, 1.75)) {
    if (setup === 'slab_only') return 110;
    if (setup === 'pre_hung_on_jamb') return 195;
    return 0;
  }

  return 0;
}

function bindDoorWidthIntAlert() {
  try {
    if (window.__pricingRuleIntExtBound) return;
    window.__pricingRuleIntExtBound = true;
    document.addEventListener('change', function (e) {
      var t = e && e.target;
      if (!t) return;
      var isSlabTransomPanelSelect = !!(
        t
        && t.tagName === 'SELECT'
        && t.closest
        && t.closest('.door-measurement-slab-transom-panels')
      );
      try {
        if (window.DOOR_PRICE_DEBUG) {
          void 0;
        }
      } catch (eDbg1) {}

      // Cache the last thickness the user explicitly selected.
      // This avoids duplicate panels/duplicate ids causing reads to fall back to a default 1.5 value.
      try {
        if (isDoorThicknessSelectId(t.id)) {
          var parsedT = parseThicknessString(t.value);
          if (!isNaN(parsedT) && parsedT > 0) {
            window.__lastDoorThicknessInches = parsedT;
            if (window.DOOR_PRICE_DEBUG) console.log('[pricing_rule_int_ext] cached thickness', parsedT);
          }
        }
      } catch (eCacheT) {}

      // Cache last door height selection (same duplicate-id issue as thickness).
      try {
        if (isDoorHeightSelectId(t.id)) {
          var hPair0 = getVisibleDoorHeightSelects();
          var parsedH = readIntFracPairFromSelect(hPair0.intEl, hPair0.fracEl);
          if (!isNaN(parsedH) && parsedH > 0) {
            window.__lastDoorHeightInches = parsedH;
            if (window.DOOR_PRICE_DEBUG) console.log('[pricing_rule_int_ext] cached door height', parsedH);
          }
        }
      } catch (eCacheH) {}

      // Width rounding debug (requested): int + frac -> decimal -> rounded inches.
      // Example: 30 + 0.25 = 30.25 -> 30, 30 + 0.55 = 30.55 -> 31
      function computeRoundedDoorWidthInches(fromEl) {
        try {
          var raw = readDoorWidthInchesFromDom(fromEl);
          return { raw: raw, rounded: Math.round(raw) };
        } catch (e) {}
        return { raw: 0, rounded: 0 };
      }

      function computeRoundedDoorHeightInches(fromEl) {
        try {
          var raw = readDoorHeightInchesFromDom(fromEl);
          return { raw: raw, rounded: Math.round(raw) };
        } catch (e) {}
        return { raw: 0, rounded: 0 };
      }

      function computeRoundedSidelightWidthInches() {
        try {
          var intEl = getVisibleById('sidelight_width') || document.getElementById('sidelight_width');
          var fracEl = getVisibleById('sidelight_width_fraction') || document.getElementById('sidelight_width_fraction');
          if (!intEl && !fracEl) return { raw: 0, rounded: 0 };
          var raw = toNum(intEl && intEl.value) + parseDropdownNumber(fracEl && fracEl.value);
          return { raw: raw, rounded: Math.round(raw) };
        } catch (e) {}
        return { raw: 0, rounded: 0 };
      }

      function computeRoundedPanelTransomHeightInches() {
        try {
          var intEl = getVisibleById('panel-transom-height-int') || document.getElementById('panel-transom-height-int');
          var fracEl = getVisibleById('panel-transom-height-frac') || document.getElementById('panel-transom-height-frac');
          if (!intEl && !fracEl) return { raw: 0, rounded: 0 };
          var raw = toNum(intEl && intEl.value) + parseDropdownNumber(fracEl && fracEl.value);
          return { raw: raw, rounded: Math.round(raw) };
        } catch (e) {}
        return { raw: 0, rounded: 0 };
      }

      var isKnownMeasurementSelect =
        isDoorWidthSelectId(t.id) ||
        isDoorHeightSelectId(t.id) ||
        isExactDoorWidthMeasurementEl(t) ||
        isExactDoorHeightMeasurementEl(t) ||
        isDoorThicknessSelectId(t.id) ||
        t.id === 'sidelight_width' || t.id === 'sidelight_width_fraction' ||
        t.id === 'panel-transom-height-int' || t.id === 'panel-transom-height-frac' ||
        String(t.id || '').indexOf('panel-transom-height-int') === 0 ||
        String(t.id || '').indexOf('panel-transom-height-frac') === 0 ||
        String(t.id || '').indexOf('panel-door-width-int') === 0 ||
        String(t.id || '').indexOf('panel-door-width-frac') === 0 ||
        isSlabTransomPanelSelect;
      if (!isKnownMeasurementSelect) return;
      if (isScreenAndStormDoorsProductType()) return;
      if (!isDoorPricingApiEnabled()) return;

      // Pet-gates: never call the int/ext oversized API for any measurement change.
      // Exact Gate Size addon is handled by the DoorConf2Measurements change listener;
      // Finished Opening (width/height) and Gate Thickness only store their value.
      if (isPetGatesCollectionActive()) {
        return;
      }

      // Panel / sidelight pair dims → chart API only when sidelight or transom style is selected.
      if (detectBothPairsChangedPair(t) > 0 && isSidelightTransomPricingContext()) {
        try {
          applySidelightTransomOversizedAddon(t);
        } catch (ePairDim) {
          try { console.error('[door-pricing] both-pairs change handler failed', ePairDim); } catch (eLog) {}
        }
        return;
      }

      // Compute/store rounded values (no alerts). Int + frac → decimal → rounded inches (e.g. 36 + 0.5 → 37).
      if (isDoorWidthSelectId(t.id) || isExactDoorWidthMeasurementEl(t)) {
        var w = computeRoundedDoorWidthInches(t);
        try { window.__lastDoorWidthInchesRaw = w.raw; window.__lastDoorWidthInchesRounded = w.rounded; } catch (eW) {}
      }

      if (isDoorHeightSelectId(t.id) || isExactDoorHeightMeasurementEl(t)) {
        var h = computeRoundedDoorHeightInches(t);
        try { window.__lastDoorHeightInchesRaw = h.raw; window.__lastDoorHeightInchesRounded = h.rounded; } catch (eH) {}
      }

      if (t.id === 'sidelight_width' || t.id === 'sidelight_width_fraction') {
        var sw = computeRoundedSidelightWidthInches();
        try { window.__lastSidelightWidthInchesRaw = sw.raw; window.__lastSidelightWidthInchesRounded = sw.rounded; } catch (eSW2) {}
      }

      if (t.id === 'panel-transom-height-int' || t.id === 'panel-transom-height-frac'
          || String(t.id || '').indexOf('panel-transom-height-int') === 0
          || String(t.id || '').indexOf('panel-transom-height-frac') === 0) {
        var th = { raw: readPanelTransomHeightFromEventTarget(t) || readPanelTransomHeightFromDom(), rounded: 0 };
        if (!th.raw) th = computeRoundedPanelTransomHeightInches();
        th.rounded = Math.round(th.raw);
        try { window.__lastPanelTransomHeightInchesRaw = th.raw; window.__lastPanelTransomHeightInchesRounded = th.rounded; } catch (eTH) {}
      }

      if (String(t.id || '').indexOf('panel-door-width-int') === 0
          || String(t.id || '').indexOf('panel-door-width-frac') === 0) {
        var pdw = readPanelDoorWidthFromEventTarget(t);
        try {
          window.__lastPanelDoorWidthInchesRaw = pdw;
          window.__lastPanelDoorWidthInches = Math.round(pdw);
        } catch (ePDW) {}
        if (window.DOOR_PRICE_DEBUG) {
          console.log('[door-pricing] panel door width', t.id, 'selected value=', t.value, 'inches=', pdw);
        }
      }

      // Door height (exact or finished): sidelight/transom chart + general int/ext API when both apply.
      if (isDoorHeightSelectId(t.id) && (isSidelightStyleSelected() || isTransomStyleSelected())) {
        try {
          applySidelightTransomOversizedAddon(t);
        } catch (eHtSide) {
          try { console.error('[door-pricing] door height sidelight API failed', eHtSide); } catch (eLogH) {}
        }
        if (!shouldRunGeneralIntExtOversizedApiForChange(t)) return;
      }

      // Interior door: user manually changed thickness (exact or finished) → replace interior thickness add-on.
      if (
        getDoorSurfaceFromTags() === 'interior' &&
        isDoorThicknessSelectId(t.id)
      ) {
        try {
          var intThickVal = parseThicknessString(t.value);
          if (isNaN(intThickVal) || intThickVal <= 0) intThickVal = parseDropdownNumber(t.value);
          if (!isNaN(intThickVal) && intThickVal > 0) {
            window.__lastDoorThicknessInches = intThickVal;
            var prevThkAddon = parseFloat(window['__doorAddon_interiorDoorThickness'] || 0) || 0;
            var lastThk = readLastPriceBeforeReplacingAddon(prevThkAddon);
            var thkAddon = applyInteriorThicknessAddon(intThickVal);
            showDoorOptionPriceNote(t, lastThk, thkAddon, {
              total: lastThk + thkAddon + (parseFloat(window['__doorAddon_intExtOversizedApi'] || 0) || 0),
              showWhenZero: true
            });
          }
        } catch (eIntThick) {}
        return;
      }

      // Exact ↔ Finished Opening tab: refresh thickness row for active panel dimensions.
      if (
        String(t.name || '') === 'attributes[Measurements]'
        || String(t.getAttribute && t.getAttribute('data-option-id') || '') === 'measurement_type'
      ) {
        try {
          var tabDims = readMeasurementsForThickness(t);
          updateThicknessVisibilityFromMeasurements(tabDims.width, tabDims.height, t);
        } catch (eMeasTab) {}
        return;
      }

      var m = readMeasurementsFromEventTarget(t);
      updateThicknessVisibilityFromMeasurements(m.width, m.height, t);
      var prefix = computeOversizedPrefixFromDom();
      // Prefer last explicit thickness (duplicate ids); DOM read can hit a hidden default.
      // Run after updateThicknessVisibilityFromMeasurements so red-band forces 2.25 into cache.
      var thick =
        (typeof window.__lastDoorThicknessInches === 'number' && window.__lastDoorThicknessInches > 0)
          ? window.__lastDoorThicknessInches
          : readThicknessFromDom();

      // General exterior_* / interior_* API — also when exact door width/height changes with sidelight/transom on.
      if (shouldRunGeneralIntExtOversizedApiForChange(t)) {
        // Stamp this fetch with the current generation so a stale response from a previous
        // setup-type (slab/prehung) or dimension change cannot overwrite a newer result.
        window.__doorIntExtFetchGen = (window.__doorIntExtFetchGen || 0) + 1;
        var myGen = window.__doorIntExtFetchGen;
        ensureDoorAddonBasePriceCaptured();
        captureThemeOptionTotalFromDom();
        initThemeOptionTotalFromBase();
        var prevIntExtAddon = getIntExtGeneralOversizedAddonTotal();
        window.__doorPendingNoteLastPrice = readLastPriceBeforeReplacingAddon(prevIntExtAddon);
        fetchPricingRuleIntExtBestMatchPriceViaProxy(prefix, m.width, m.height, thick)
          .then(function (res) {
            if (window.__doorIntExtFetchGen !== myGen) return; // stale – discard
            clearIntExtGeneralOversizedAddonKeys();
            var price = res && res.price != null ? res.price : 0;
            var surfaceNow = getDoorSurfaceFromTags();
            var applied = applyIntExtOversizedAddonsFromApi(price, m.width, m.height, surfaceNow, t, res.matched_thickness);
            var lastForNote = typeof window.__doorPendingNoteLastPrice === 'number'
              ? window.__doorPendingNoteLastPrice
              : readLastPriceBeforeReplacingAddon(0);
            var addonForNote = applied.combined || 0;
            var sidelightChartAddon = getSidelightTransomAddonTotal();
            var totalForNote = lastForNote + addonForNote + sidelightChartAddon;
            showDoorOptionPriceNote(t, lastForNote, addonForNote, {
              total: totalForNote,
              showWhenZero: true,
              context: 'intExtOversizedApi'
            });
            window.__doorPendingNoteLastPrice = null;
            persistDoorPricingState();
          })
          .catch(function (err) {
            if (window.__doorIntExtFetchGen !== myGen) return; // stale – discard
            clearIntExtGeneralOversizedAddonKeys();
            _syncDoorEstimatedPriceDisplay();
          });
      }

      // Sidelight/transom oversized rules (door height handled above when sidelight/transom on).
      try {
        var isTransomStyleInput =
          String(t.getAttribute && t.getAttribute('data-option-id') || '') === 'transom_style'
          || String(t.name || '') === 'attributes[Transom Style]';
        var sidelightOrTransomStyle = isSidelightStyleSelected() || isTransomStyleSelected();
        if (isSidelightOrTransomStyleOptionTarget(t)) {
          syncSidelightTransomAddonsFromStyleSelection(t);
          refreshGeneralIntExtOversizedFromDomIfReady(t);
        } else if (
          t.id === 'sidelight_width' ||
          t.id === 'sidelight_width_fraction' ||
          (isDoorWidthSelectId(t.id) && sidelightOrTransomStyle) ||
          (isDoorThicknessSelectId(t.id) && sidelightOrTransomStyle) ||
          t.id === 'panel-transom-height-int' ||
          t.id === 'panel-transom-height-frac' ||
          String(t.id || '').indexOf('panel-transom-height-int') === 0 ||
          String(t.id || '').indexOf('panel-transom-height-frac') === 0 ||
          String(t.id || '').indexOf('panel-door-width-int') === 0 ||
          String(t.id || '').indexOf('panel-door-width-frac') === 0 ||
          isTransomStyleInput ||
          isSlabTransomPanelSelect
        ) {
          if (isSidelightStyleSelected() && isTransomStyleSelected()) {
            applyBothPairsCombinedOversizedAddon(t);
          } else {
            applySidelightTransomOversizedAddon(t);
          }
        }
      } catch (eSideAddon) {}

      // Placeholder hook: ensure transom height reads the visible select values correctly.
      // (If you add pricing rules based on transom height later, use readPanelTransomHeightFromDom()).
    });
  } catch (e) {}
}

function readMeasurementsFromEventTarget(t) {
  // Prefer values from the currently changed controls (avoid hidden/default selects).
  var width = null;
  var height = null;
  try {
    if (t && (isDoorWidthSelectId(t.id) || isExactDoorWidthMeasurementEl(t))) {
      width = readDoorWidthInchesFromDom(t);
    }
    if (t && (isDoorHeightSelectId(t.id) || isExactDoorHeightMeasurementEl(t))) {
      height = readDoorHeightInchesFromDom(t);
    }
    if (t && isDoorThicknessSelectId(t.id)) {
      width = readDoorWidthInchesFromDom(t);
      height = readDoorHeightInchesFromDom(t);
    }
    // NOTE: sidelight_width changes do not drive the main oversized call anymore
    // (they only drive `applySidelightTransomOversizedAddon()`).
  } catch (e) {}

  var fallback = computeMeasurements();
  return {
    width: width != null ? width : fallback.width,
    height: height != null ? height : fallback.height
  };
}

function computeOversizedPrefixFromDom() {
  // Builds prefix like: exterior_slab_oversized or interior_prehung_oversized
  // Source:
  // - product tags on #door-configurator (data-product-tags)
  // - selected door setup radio/checkbox values in the options UI
  var surface = 'exterior';
  try {
    var container = document.getElementById('door-configurator');
    var tagsAttr = container ? (container.getAttribute('data-product-tags') || '') : '';
    var tags = [];
    try {
      tags = Array.isArray(JSON.parse(tagsAttr)) ? JSON.parse(tagsAttr) : [];
    } catch (e1) {
      tags = String(tagsAttr || '').split('|');
    }
    var hasExterior = false;
    var hasInterior = false;
    for (var i = 0; i < tags.length; i++) {
      var t = String(tags[i] || '').toLowerCase();
      if (t.indexOf('exterior') !== -1) hasExterior = true;
      if (t.indexOf('interior') !== -1) hasInterior = true;
      if (t.indexOf('exterior-doors') !== -1 || t.indexOf('exterior_doors') !== -1) hasExterior = true;
      if (t.indexOf('interior-doors') !== -1 || t.indexOf('interior_doors') !== -1) hasInterior = true;
    }
    surface = hasInterior && !hasExterior ? 'interior' : 'exterior';
  } catch (e2) {}

  var setup = 'slab';
  try {
    var optionsContainer = document.getElementById('door-configurator-options') || document;
    var slab = optionsContainer.querySelector('input[value="slab_only"]:checked');
    var prehung = optionsContainer.querySelector('input[value="pre_hung_on_jamb"]:checked');
    if (prehung) setup = 'prehung';
    else if (slab) setup = 'slab';
  } catch (e3) {}

  // Interior keys should NOT include the "_oversized" suffix.
  // Example: "interior_slab_*" (not "interior_slab_oversized").
  if (surface === 'interior') {
    return surface + '_' + setup;
  }

  return surface + '_' + setup + '_oversized';
}

function fetchPricingRuleIntExtPriceViaProxy(tableKeyOrHandle) {
  // Calls your server endpoint (Shopify App Proxy PHP) to get the exact entry price.
  // Expected response: { matched: true, price: "220.00" }
  if (!isDoorPricingApiEnabled()) return emptyPricingProxyResponse();
  var key = String(tableKeyOrHandle == null ? '' : tableKeyOrHandle).trim();
  if (!key) return Promise.reject(new Error('missing key'));

  var base = (window.DOOR_PRICING_RULE_PROXY_BASE || 'https://vintage.espirevox.com');
  base = String(base || '').replace(/\/+$/, '');
  var url = base + '/pricing-rule-int-ext.php?table_key=' + encodeURIComponent(key);
  return fetch(url, { mode: 'cors', credentials: 'omit' })
    .then(function (r) {
      if (!r || !r.ok) throw new Error('bad response');
      return r.json();
    })
    .then(function (json) {
      var price = json && json.price != null ? json.price : null;
      if (price == null && json && json.records && json.records[0]) {
        // fallback: try raw record field
        price = json.records[0].price;
      }
      // Normalize "$ 220.00" or "220.00" or money JSON string
      try {
        if (typeof price === 'string') {
          var s = price.trim();
          if (s && s[0] === '{') {
            var money = JSON.parse(s);
            if (money && money.amount != null) price = money.amount;
          }
        }
      } catch (e) {}
      var cleaned = String(price == null ? '' : price).replace(/[^0-9.\-]+/g, '');
      var parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    });
}

function fetchPricingRuleIntExtRangeMatchesViaProxy(prefix, width, height, thicknessInches) {
  if (!isDoorPricingApiEnabled()) return emptyPricingProxyResponse();
  var p = String(prefix == null ? '' : prefix).trim();
  if (!p) return Promise.reject(new Error('missing prefix'));
  var w = parseFloat(width);
  var h = parseFloat(height);
  if (isNaN(w) || isNaN(h)) return Promise.reject(new Error('missing width/height'));

  // The metaobject tables are bucketed by whole inches.
  // Always round before calling the proxy so values like 36.25 match the 36 bucket.
  w = Math.round(w);
  h = Math.round(h);

  var base = (window.DOOR_PRICING_RULE_PROXY_BASE || 'https://vintage.espirevox.com');
  base = String(base || '').replace(/\/+$/, '');
  var url =
    base
    + '/pricing-rule-int-ext.php?prefix=' + encodeURIComponent(p)
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
      // Return full server response so callers can use `price`.
      return json || {};
    });
}

function fetchPricingRuleIntExtBestMatchPriceViaProxy(prefix, width, height, thicknessInches) {
  return fetchPricingRuleIntExtRangeMatchesViaProxy(prefix, width, height, thicknessInches).then(function (json) {
    // We changed the PHP to return a single best match in `records` and a top-level `price`.
    var price = json && json.price != null ? json.price : null;
    if (price == null && json && json.records && json.records[0]) price = json.records[0].price_extracted || json.records[0].price;
    var matchedThicknessRaw = null;
    if (json) {
      matchedThicknessRaw =
        json.matched_thickness_raw != null ? json.matched_thickness_raw
        : (json.matched_thickness != null ? json.matched_thickness
        : (json.records && json.records[0]
          ? (json.records[0].matched_thickness_raw != null ? json.records[0].matched_thickness_raw
            : (json.records[0].matched_thickness != null ? json.records[0].matched_thickness
              : (json.records[0].thickness != null ? json.records[0].thickness : json.records[0].door_thickness)))
          : null));
    }
    var matchedThickness = parseThicknessString(matchedThicknessRaw);
    var cleaned = String(price == null ? '' : price).replace(/[^0-9.\-]+/g, '');
    var parsed = parseFloat(cleaned);
    return {
      matched_count: json && json.matched_count != null ? json.matched_count : (json && json.matched ? 1 : 0),
      price: isNaN(parsed) ? 0 : parsed,
      matched_thickness_raw: matchedThicknessRaw,
      matched_thickness: isNaN(matchedThickness) ? null : matchedThickness
    };
  });
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

var DOOR_ADDON_ALERT_LABELS = {
  interiorDoorThickness: 'Interior door thickness',
  intExtOversizedApi: 'Oversized door (width × height API)',
  intExtThicknessBand: 'Exterior thickness band (red cell)',
  sidelightTransomOversized: 'Sidelight / transom chart oversized',
  sidelightTransomOversizedPair1: 'Pair 1 — panel width × transom height',
  sidelightTransomOversizedPair2: 'Pair 2 — sidelight width × door height',
  sidelightPanelThickness: 'Sidelight panel thickness (2¼")',
  wideSidelightBaseWood: 'Wide sidelight > 23″ (base + wood)',
  sidelightChartCell: 'Sidelight / transom chart cell',
  sidelightThicknessExtra: 'Sidelight 2¼″ thickness extra',
  oversizedDoor: 'Oversized door'
};

function resolveDoorAddonAlertLabel(key, override) {
  if (override) return String(override);
  var k = String(key || '');
  if (DOOR_ADDON_ALERT_LABELS[k]) return DOOR_ADDON_ALERT_LABELS[k];
  if (k) return k.replace(/_/g, ' ');
  return 'Door add-on';
}

/** Intentionally silent — price notes / console only (no browser alert popups). */
function alertDoorPriceAddonAdded(addonAmount, optionLabel) {
  try {
    if (window.DOOR_PRICE_DEBUG === false) return;
    var amt = parseFloat(addonAmount) || 0;
    if (amt <= 0) return;
    var label = optionLabel ? String(optionLabel) : 'Price add-on';
    console.log('[door-pricing] addon applied', { label: label, amount: amt, formatted: formatMoney(amt) });
  } catch (eA) {}
}

function alertSidelightChartAddonParts(cellAddon, thicknessExtra, isTransomCase) {
  var cell = parseFloat(cellAddon) || 0;
  var extra = parseFloat(thicknessExtra) || 0;
  var ctx = isTransomCase ? 'Transom' : 'Sidelight';
  if (cell > 0) {
    alertDoorPriceAddonAdded(cell, DOOR_ADDON_ALERT_LABELS.sidelightChartCell + ' (' + ctx + ')');
  }
  if (extra > 0) {
    alertDoorPriceAddonAdded(extra, DOOR_ADDON_ALERT_LABELS.sidelightThicknessExtra + ' (' + ctx + ')');
  }
}

/** All price nodes (duplicate ids are common in Shopify themes). */
function getDoorEstimatedPriceElements() {
  try {
    var nodes = document.querySelectorAll('#door-estimated-price');
    if (nodes && nodes.length) return Array.prototype.slice.call(nodes);
    var alt = document.querySelectorAll('[data-door-estimated-price]');
    if (alt && alt.length) return Array.prototype.slice.call(alt);
  } catch (e) {}
  return [];
}

function formatDoorEstimatedPriceAmount(amount) {
  if (typeof window.__doorFormatEstimatedPrice === 'function') {
    try {
      return window.__doorFormatEstimatedPrice(amount);
    } catch (eFmt) {}
  }
  return formatMoney(amount);
}

function pickVisibleDoorEstimatedPriceElement(nodes) {
  if (!nodes || !nodes.length) return null;
  for (var i = 0; i < nodes.length; i++) {
    var el = nodes[i];
    try {
      if (el.offsetParent !== null) return el;
      if (el.getClientRects && el.getClientRects().length > 0) return el;
    } catch (eVis) {}
  }
  return nodes[0];
}

/**
 * One console line per distinct total (avoids duplicate logs on page load).
 * Set meta.silent = true to update DOM without logging; meta.userAction = true to always log.
 */
function maybeLogDoorPricingDisplay(amount, meta, writeStats) {
  try {
    if (window.DOOR_PRICE_DEBUG === false) return;
    if (meta && meta.silent) return;
    var n = parseFloat(amount) || 0;
    var prev = parseFloat(window.__doorLastLoggedEstimatedPrice);
    var prevAt = parseFloat(window.__doorLastLoggedEstimatedPriceAt) || 0;
    var now = Date.now();
    var force = meta && (meta.userAction || meta.forceLog || meta.source === 'pageLoad');
    if (!force && !isNaN(prev) && Math.abs(n - prev) < 0.02 && now - prevAt < 1200) return;
    window.__doorLastLoggedEstimatedPrice = n;
    window.__doorLastLoggedEstimatedPriceAt = now;
    var theme = meta && meta.themeOptionTotal != null ? meta.themeOptionTotal : getThemeOptionTotal();
    var totalAddon = meta && meta.totalAddon != null ? meta.totalAddon : getDoorAddonTotalSum();
    console.log('[door-pricing] estimated price', {
      total: n,
      formatted: formatDoorEstimatedPriceAmount(n),
      themeOptionTotal: theme,
      stileAddon: getStileAndRailProfileAddon(),
      stormGlassAddon: getStormGlassAddon(),
      screenStormAddon: getScreenStormAddonLayerTotal(),
      screenStormOversized: parseFloat(window.__doorScreenStormAddon_oversized || 0) || 0,
      intExtOversizedApi: parseFloat(window['__doorAddon_intExtOversizedApi'] || 0) || 0,
      intExtThicknessBand: parseFloat(window['__doorAddon_intExtThicknessBand'] || 0) || 0,
      sidelightTransomAddons: getSidelightTransomAddonTotal(),
      totalAddon: totalAddon,
      idNodeCount: writeStats ? writeStats.nodeCount : 0,
      targetsUpdated: writeStats ? writeStats.targetsUpdated : 0,
      visibleReadBack: readEstimatedPriceFromDom(),
      source: meta && meta.source ? meta.source : 'write'
    });
  } catch (eLog) {}
}

/**
 * Write estimated price to every #door-estimated-price (and inner price child if present).
 * getElementById only updates the first node — often a hidden duplicate — which is why
 * console totals looked correct while the visible price stayed at the base theme total.
 */
function writeDoorEstimatedPriceToDom(amount, meta) {
  var n = parseFloat(amount);
  if (isNaN(n)) n = 0;
  if (n < 0) n = 0;
  var formatted = formatDoorEstimatedPriceAmount(n);
  var nodes = getDoorEstimatedPriceElements();
  var targetsUpdated = 0;
  var skipped = 0;
  for (var i = 0; i < nodes.length; i++) {
    var el = nodes[i];
    var valueTargets = el.querySelectorAll(
      '[data-door-price-value], .door-estimated-price-value, .door-estimated-price-amount, .door-price-amount'
    );
    if (valueTargets && valueTargets.length) {
      for (var j = 0; j < valueTargets.length; j++) {
        if (String(valueTargets[j].textContent || '').trim() === formatted) {
          skipped++;
          continue;
        }
        valueTargets[j].textContent = formatted;
        targetsUpdated++;
      }
    } else {
      if (String(el.textContent || '').trim() === formatted) {
        skipped++;
      } else {
        el.textContent = formatted;
        targetsUpdated++;
      }
    }
    try {
      el.setAttribute('data-door-price-numeric', String(n));
    } catch (eAttr) {}
  }
  if (targetsUpdated === 0) {
    try { window.__doorLastWrittenEstimatedPrice = n; } catch (eSkip) {}
    return { amount: n, formatted: formatted, nodeCount: nodes.length, targetsUpdated: 0, skipped: skipped };
  }
  try {
    window.__doorLastWrittenEstimatedPrice = n;
  } catch (eW) {}
  maybeLogDoorPricingDisplay(n, meta, { nodeCount: nodes.length, targetsUpdated: targetsUpdated });
  return { amount: n, formatted: formatted, nodeCount: nodes.length, targetsUpdated: targetsUpdated };
}

/** Variant base price only (data-base-price). */
function ensureDoorAddonBasePriceCaptured() {
  try {
    var p = readProductBasePriceFromDom();
    if (p > 0) window.__doorAddonBasePrice = p;
  } catch (e) {}
}

/** Parsed value from visible #door-estimated-price (or first if all hidden). */
function readEstimatedPriceFromDom() {
  try {
    var nodes = getDoorEstimatedPriceElements();
    if (!nodes.length) return 0;
    var vis = pickVisibleDoorEstimatedPriceElement(nodes);
    if (vis) return parseMoneyText(vis.textContent);
    return parseMoneyText(nodes[0].textContent);
  } catch (e) {}
  return 0;
}

/**
 * Theme/schema option total (wood, design, etc.) — from #door-estimated-price after
 * door-conf2 updateEstimatedPrice, before int-ext addons are layered on.
 */
function getThemeOptionTotal() {
  var theme = parseFloat(window.__doorThemeOptionTotal) || 0;
  var base = readProductBasePriceFromDom();
  if (theme < base) theme = base;
  return theme;
}

var DOOR_PRICING_STATE_STORAGE_KEY = 'doorIntExtPricingStateV1';

function getStileAndRailProfileAddon() {
  return parseFloat(window['__doorAddon_stile_and_rail_profile'] || 0) || 0;
}

function getStormGlassAddon() {
  return parseFloat(window['__doorAddon_storm_glass'] || 0) || 0;
}

function getDoorSealKitMatchingAddon() {
  return parseFloat(window['__doorAddon_door_seal_kit_matching'] || 0) || 0;
}

function getDoorAddonStateSnapshot() {
  return {
    themeOptionTotal: parseFloat(window.__doorThemeOptionTotal) || 0,
    intExtOversizedApi: parseFloat(window['__doorAddon_intExtOversizedApi'] || 0) || 0,
    intExtThicknessBand: parseFloat(window['__doorAddon_intExtThicknessBand'] || 0) || 0,
    intExtAddonPrice: parseFloat(window.__doorIntExtAddonPrice || 0) || 0,
    sidelightTransomOversized: parseFloat(window['__doorAddon_sidelightTransomOversized'] || 0) || 0,
    sidelightTransomOversizedPair1: parseFloat(window['__doorAddon_sidelightTransomOversizedPair1'] || 0) || 0,
    sidelightTransomOversizedPair2: parseFloat(window['__doorAddon_sidelightTransomOversizedPair2'] || 0) || 0,
    interiorDoorThickness: parseFloat(window['__doorAddon_interiorDoorThickness'] || 0) || 0,
    sidelightPanelThickness: parseFloat(window['__doorAddon_sidelightPanelThickness'] || 0) || 0,
    stileAndRailProfile: getStileAndRailProfileAddon(),
    stormGlass: getStormGlassAddon(),
    doorSealKitMatching: getDoorSealKitMatchingAddon()
  };
}

function applyDoorAddonStateSnapshot(snap) {
  if (!snap || typeof snap !== 'object') return;
  if (snap.themeOptionTotal > 0) window.__doorThemeOptionTotal = snap.themeOptionTotal;
  window['__doorAddon_intExtOversizedApi'] = snap.intExtOversizedApi || 0;
  window['__doorAddon_intExtThicknessBand'] = snap.intExtThicknessBand || 0;
  window.__doorIntExtAddonPrice = snap.intExtAddonPrice || 0;
  window['__doorAddon_sidelightTransomOversized'] = snap.sidelightTransomOversized || 0;
  window['__doorAddon_sidelightTransomOversizedPair1'] = snap.sidelightTransomOversizedPair1 || 0;
  window['__doorAddon_sidelightTransomOversizedPair2'] = snap.sidelightTransomOversizedPair2 || 0;
  window['__doorAddon_interiorDoorThickness'] = snap.interiorDoorThickness || 0;
  window['__doorAddon_sidelightPanelThickness'] = snap.sidelightPanelThickness || 0;
  window['__doorAddon_stile_and_rail_profile'] = snap.stileAndRailProfile || 0;
  window['__doorAddon_storm_glass'] = snap.stormGlass || 0;
  window['__doorAddon_door_seal_kit_matching'] = snap.doorSealKitMatching || 0;
  try { window.__doorLastStileRailListPrice = window['__doorAddon_stile_and_rail_profile']; } catch (eSt) {}
}

function persistDoorPricingState() {
  try {
    var payload = getDoorAddonStateSnapshot();
    // Wide sidelight (base+wood) is in-memory only — never persist (refresh must not re-apply).
    payload.sidelightTransomOversized = 0;
    window.__doorPricingStateCache = payload;
    try { sessionStorage.setItem(DOOR_PRICING_STATE_STORAGE_KEY, JSON.stringify(payload)); } catch (eSs) {}
  } catch (e) {}
}

/** @deprecated Do not restore addons after reload — use initDoorPricingOnPageLoad instead. */
function restoreDoorPricingState() {}

function clearPersistedDoorPricingStorage() {
  try { sessionStorage.removeItem(DOOR_PRICING_STATE_STORAGE_KEY); } catch (eSs) {}
  try { localStorage.removeItem(DOOR_PRICING_STATE_STORAGE_KEY); } catch (eLs) {}
  window.__doorPricingStateCache = null;
}

function clearSidelightTransomAddonKeys() {
  try {
    window['__doorAddon_sidelightTransomOversized'] = 0;
    window['__doorAddon_sidelightTransomOversizedPair1'] = 0;
    window['__doorAddon_sidelightTransomOversizedPair2'] = 0;
    window.__bothPairsLastAddon1 = 0;
    window.__bothPairsLastAddon2 = 0;
  } catch (e) {}
}

function isSidelightOrTransomStyleOptionTarget(t) {
  if (!t) return false;
  try {
    var oid = t.getAttribute ? String(t.getAttribute('data-option-id') || '') : '';
    if (oid === 'sidelight_style' || oid === 'sidelight_location' || oid === 'transom_style' || oid === 'transom_count') {
      return true;
    }
    var nm = t.name != null ? String(t.name) : '';
    if (nm === 'attributes[Select your sidelight style]' || nm === 'attributes[Transom Style]') return true;
  } catch (eOid) {}
  return false;
}

/** Drop sidelight chart addon only (pair2 / legacy when transom is not active). */
function clearSidelightStyleOversizedAddons() {
  try {
    window['__doorAddon_sidelightTransomOversizedPair2'] = 0;
    window.__bothPairsLastAddon2 = 0;
    if (!isTransomStyleSelected()) {
      window['__doorAddon_sidelightTransomOversized'] = 0;
      window['__doorAddon_sidelightTransomOversizedPair1'] = 0;
      window.__bothPairsLastAddon1 = 0;
    } else {
      window['__doorAddon_sidelightTransomOversized'] = 0;
    }
    applyAddonToEstimatedPriceKey(0, 'sidelightPanelThickness');
    try {
      setSidelightLinkedThicknessRowsHidden(true);
      restoreSidelightLinkedThicknessSelects();
    } catch (eThk) {}
  } catch (e) {}
}

/** Drop transom chart addon only (pair1 / legacy when sidelight is not active). */
function clearTransomStyleOversizedAddons() {
  try {
    window['__doorAddon_sidelightTransomOversizedPair1'] = 0;
    window.__bothPairsLastAddon1 = 0;
    if (!isSidelightStyleSelected()) {
      window['__doorAddon_sidelightTransomOversized'] = 0;
      window['__doorAddon_sidelightTransomOversizedPair2'] = 0;
      window.__bothPairsLastAddon2 = 0;
    } else {
      window['__doorAddon_sidelightTransomOversized'] = 0;
    }
  } catch (e) {}
}

/** Re-fetch or clear sidelight/transom chart addons when optional design accordions change. */
function syncSidelightTransomAddonsFromStyleSelection(changedEl, opts) {
  opts = opts || {};
  if (isScreenAndStormDoorsProductType()) {
    var hasSideSs = isSidelightStyleSelected();
    var hasTransSs = isTransomStyleSelected();
    if (!hasSideSs && !hasTransSs) {
      window['__doorAddon_storm_glass'] = 0;
      _syncDoorEstimatedPriceDisplay({
        source: 'screenStorm_sidelightTransom_removed',
        userAction: true
      });
    }
    return;
  }
  var hasSide = isSidelightStyleSelected();
  var hasTrans = isTransomStyleSelected();

  if (opts.removedSidelight) clearSidelightStyleOversizedAddons();
  if (opts.removedTransom) clearTransomStyleOversizedAddons();

  if (!hasSide && !hasTrans) {
    clearSidelightTransomAddonKeys();
    _syncDoorEstimatedPriceDisplay();
    return;
  }

  try {
    if (hasSide && hasTrans) {
      applyBothPairsCombinedOversizedAddon(changedEl || null);
    } else {
      applySidelightTransomOversizedAddon(changedEl || null);
    }
  } catch (eApply) {}

  _syncDoorEstimatedPriceDisplay();
}

/** Keep general door width×height oversized API in sync when styles toggle but measurements stay. */
function refreshGeneralIntExtOversizedFromDomIfReady(changedEl) {
  if (isPetGatesCollectionActive()) return;
  if (isScreenAndStormDoorsProductType() || !isDoorPricingApiEnabled()) return;
  var m = computeMeasurements();
  if (!m.width || !m.height) return;
  var prefix = computeOversizedPrefixFromDom();
  if (!prefix) return;
  var thick =
    (typeof window.__lastDoorThicknessInches === 'number' && window.__lastDoorThicknessInches > 0)
      ? window.__lastDoorThicknessInches
      : readThicknessFromDom();
  window.__doorIntExtFetchGen = (window.__doorIntExtFetchGen || 0) + 1;
  var myGen = window.__doorIntExtFetchGen;
  fetchPricingRuleIntExtBestMatchPriceViaProxy(prefix, m.width, m.height, thick)
    .then(function (res) {
      if (window.__doorIntExtFetchGen !== myGen) return;
      clearIntExtGeneralOversizedAddonKeys();
      var price = res && res.price != null ? res.price : 0;
      applyIntExtOversizedAddonsFromApi(
        price, m.width, m.height, getDoorSurfaceFromTags(), changedEl, res.matched_thickness
      );
      persistDoorPricingState();
      _syncDoorEstimatedPriceDisplay();
    })
    .catch(function () {
      if (window.__doorIntExtFetchGen !== myGen) return;
      _syncDoorEstimatedPriceDisplay();
    });
}

/** Fresh page: no stored sidelight/measurement addons; theme from DOM or base only. */
function initDoorPricingOnPageLoad() {
  try {
    clearPersistedDoorPricingStorage();
    clearSidelightTransomAddonKeys();
    clearIntExtGeneralOversizedAddonKeys();
    window['__doorAddon_interiorDoorThickness'] = 0;
    window['__doorAddon_sidelightPanelThickness'] = 0;
    window['__doorAddon_stile_and_rail_profile'] = 0;
    window['__doorAddon_storm_glass'] = 0;
    window['__doorAddon_door_seal_kit_matching'] = 0;
    window.__doorLastStileRailListPrice = 0;
    window['__doorAddon_pet_gates_measurements'] = 0;
    initThemeOptionTotalFromBase();
  } catch (e) {}
}

/**
 * After door-conf2 updateEstimatedPrice: store schema-only total (never int-ext addons).
 * #door-estimated-price may show theme + our addons — extract theme with (shown − ours).
 */
function captureThemeOptionTotalFromDom() {
  try {
    if (window.__doorIntExtSyncing) return;
    // Screen & storm: theme total comes from door-conf2 updateEstimatedPrice; addons live in __doorScreenStormAddon_*.
    if (isScreenAndStormDoorsProductType()) return;
    var shown = readEstimatedPriceFromDom();
    if (shown <= 0) return;
    var base = readProductBasePriceFromDom();
    if (shown < base - 0.02) return;
    var ours = getDoorAddonTotalSum() + getScreenStormAddonLayerTotal();
    var prevTheme = parseFloat(window.__doorThemeOptionTotal) || 0;
    var expectedFull = prevTheme + ours;

    // Already synced: display = previous theme + current addons.
    if (ours > 0.01 && prevTheme > 0 && Math.abs(shown - expectedFull) < 0.05) {
      return;
    }

    if (ours > 0.01 && prevTheme > 0) {
      // door-conf2 wrote a new schema total without our addons in the DOM.
      if (shown >= base && shown < expectedFull - 0.05) {
        window.__doorThemeOptionTotal = Math.max(base, shown);
        persistDoorPricingState();
        return;
      }
      // Schema total grew (new option price) while addons are tracked separately.
      if (shown > expectedFull + 0.05) {
        var grownTheme = shown - ours;
        window.__doorThemeOptionTotal = Math.max(base, grownTheme >= prevTheme - 0.05 ? grownTheme : shown);
        persistDoorPricingState();
        return;
      }
      if (Math.abs(shown - prevTheme) < 0.05) {
        return;
      }
    }

    window.__doorThemeOptionTotal = Math.max(base, shown - ours);
    persistDoorPricingState();
  } catch (e) {}
}

function isSchemaOptionChangeTarget(t) {
  if (!t) return false;
  try {
    var oid = t.getAttribute ? String(t.getAttribute('data-option-id') || '') : '';
    if (oid === 'stile_and_rail_profile') return false;
    var nm = t.name != null ? String(t.name) : '';
    if (nm.indexOf('Stile and Rail Profile') !== -1) return false;
    if (nm.indexOf('Select Storm Glass') !== -1) return false;
    if (oid === 'glass_type' || oid === 'storm_glass_type' || oid === 'storm_glass' || oid === 'select_storm_glass') {
      return false;
    }
  } catch (eStileSkip) {}
  if (!t.id) return true;
  if (isDoorWidthSelectId(t.id) || isDoorHeightSelectId(t.id) || isDoorThicknessSelectId(t.id)) {
    return false;
  }
  if (t.id === 'sidelight_width' || t.id === 'sidelight_width_fraction') return false;
  if (String(t.id).indexOf('panel-door-width') === 0) return false;
  if (String(t.id).indexOf('panel-transom-height') === 0) return false;
  return true;
}

/** Seed theme total from DOM or variant base — never overwrite an existing options total. */
function initThemeOptionTotalFromBase() {
  try {
    var base = readProductBasePriceFromDom();
    var theme = parseFloat(window.__doorThemeOptionTotal) || 0;
    if (theme > base + 0.02) return;
    captureThemeOptionTotalFromDom();
    theme = parseFloat(window.__doorThemeOptionTotal) || 0;
    if (theme > base + 0.02) return;
    if (base > 0) window.__doorThemeOptionTotal = base;
  } catch (e) {}
}

function getDoorAddonTotalSum() {
  return (
    getIntExtGeneralOversizedAddonTotal() +
    getSidelightTransomAddonTotal() +
    (parseFloat(window['__doorAddon_interiorDoorThickness'] || 0) || 0) +
    (parseFloat(window['__doorAddon_sidelightPanelThickness'] || 0) || 0) +
    getStileAndRailProfileAddon() +
    getStormGlassAddon() +
    getPetGatesMeasurementAddon()
  );
}

/** Sum all __doorScreenStormAddon_* keys (no product-type gate — keys are only set by price_screen_storm.js). */
function sumScreenStormAddonKeysFromWindow() {
  try {
    if (
      window.PriceScreenStorm
      && typeof window.PriceScreenStorm.getScreenStormAddonTotalSum === 'function'
    ) {
      return window.PriceScreenStorm.getScreenStormAddonTotalSum();
    }
    if (typeof window.PriceScreenStorm.syncScreenStormAddonGateState === 'function') {
      window.PriceScreenStorm.syncScreenStormAddonGateState();
    }
  } catch (eGate) {}
  return (
    (parseFloat(window.__doorScreenStormAddon_oversized || 0) || 0) +
    (parseFloat(window.__doorScreenStormAddon_thickness || 0) || 0) +
    (parseFloat(window.__doorScreenStormAddon_thickness_frac || 0) || 0) +
    (parseFloat(window.__doorScreenStormAddon_sidelight_transom || 0) || 0) +
    (parseFloat(window.__doorScreenStormAddon_transom_combo || 0) || 0) +
    (parseFloat(window.__doorScreenStormAddon_panel_door_thickness_extra || 0) || 0) +
    (parseFloat(window.__doorScreenStormAddon_wide_sidelight_base_wood || 0) || 0) +
    (parseFloat(window.__doorScreenStormAddon_tall_transom_base_wood || 0) || 0) +
    (parseFloat(window.__doorScreenStormAddon_stile_and_rail_profile || 0) || 0)
  );
}

/** Screen & storm door chart/API layer (price_screen_storm.js) — separate from __doorAddon_* keys. */
function getScreenStormAddonLayerTotal() {
  var sum = sumScreenStormAddonKeysFromWindow();
  if (sum < 0.01) return 0;
  // Stile is also in __doorAddon_stile_and_rail_profile — count it only once in the full total.
  var doorStile = getStileAndRailProfileAddon();
  var screenStile = parseFloat(window.__doorScreenStormAddon_stile_and_rail_profile || 0) || 0;
  if (doorStile > 0.005 && screenStile > 0.005 && Math.abs(doorStile - screenStile) < 0.03) {
    sum = Math.max(0, sum - screenStile);
  }
  return sum;
}

function logScreenStormPricingDebug(tag, payload) {
  try {
    if (window.DOOR_PRICE_DEBUG === false) return;
    var line = '[door-pricing] screen-storm measurement — ' + String(tag || 'log');
    if (payload !== undefined) console.log(line, payload);
    else console.log(line);
  } catch (eLog) {}
}

function getFullDoorEstimatedDisplayTotal() {
  return getThemeOptionTotal() + getDoorAddonTotalSum() + getScreenStormAddonLayerTotal();
}

/** Running total shown to customer (theme options + all int-ext addons). */
function getDoorPricingNoteLastPrice() {
  var shown = readEstimatedPriceFromDom();
  if (shown > 0) return shown;
  return getFullDoorEstimatedDisplayTotal();
}

/** Last price before replacing one addon bucket (e.g. new API oversized amount). */
function readLastPriceBeforeReplacingAddon(previousAddonAmount) {
  var prev = parseFloat(previousAddonAmount) || 0;
  var shown = readEstimatedPriceFromDom();
  if (shown > 0) return Math.max(0, shown - prev);
  return getThemeOptionTotal() + getDoorAddonTotalSum() - prev;
}

/** @deprecated use ensureDoorAddonBasePriceCaptured */
function _captureAddonBasePriceIfNeeded() {
  ensureDoorAddonBasePriceCaptured();
}

function clearIntExtGeneralOversizedAddonKeys() {
  try {
    window['__doorAddon_intExtOversizedApi'] = 0;
    window['__doorAddon_intExtThicknessBand'] = 0;
    window.__doorIntExtAddonPrice = 0;
  } catch (e) {}
}

function getIntExtGeneralOversizedAddonTotal() {
  var api = parseFloat(window['__doorAddon_intExtOversizedApi'] || 0) || 0;
  var thk = parseFloat(window['__doorAddon_intExtThicknessBand'] || 0) || 0;
  if (api > 0 || thk > 0) return api + thk;
  return parseFloat(window.__doorIntExtAddonPrice || 0) || 0;
}

/**
 * Replace (not stack) exterior/interior general oversized addons from the latest API call.
 * Exact + Finished Opening share the same keys.
 */
function applyIntExtOversizedAddonsFromApi(apiPrice, width, height, surface, changedEl, apiThickness) {
  try {
    ensureDoorAddonBasePriceCaptured();
    var api = parseFloat(apiPrice) || 0;
    var thk = surface === 'interior' ? 0 : intExtThicknessAddonForMeasurementBand(width, height, apiThickness);
    window['__doorAddon_intExtOversizedApi'] = api;
    window['__doorAddon_intExtThicknessBand'] = thk;
    window.__doorIntExtAddonPrice = api + thk;
    var combined = api + thk;
    if (surface === 'interior') {
      updateInteriorDoorThicknessVisibility(width, height, changedEl, apiThickness);
    } else {
      updateExteriorDoorThicknessVisibility(width, height, changedEl, apiThickness);
    }
    schedulePriceSyncAfterPageHandlers();
    return { api: api, thicknessBand: thk, combined: combined };
  } catch (e) {}
  return { api: 0, thicknessBand: 0, combined: 0 };
}

/** Recompute: theme option total + Σ(int-ext addon keys) → #door-estimated-price */
function _syncDoorEstimatedPriceDisplay(logMeta) {
  try {
    if (!getDoorEstimatedPriceElements().length) return;
    try {
      if (
        window.PriceScreenStorm
        && typeof window.PriceScreenStorm.syncScreenStormAddonGateState === 'function'
      ) {
        window.PriceScreenStorm.syncScreenStormAddonGateState();
      }
    } catch (eSsGate) {}
    if (!window.__doorThemeOptionTotal) initThemeOptionTotalFromBase();
    var theme = getThemeOptionTotal();
    if (theme <= 0) {
      ensureDoorAddonBasePriceCaptured();
      theme = window.__doorAddonBasePrice || readProductBasePriceFromDom();
      if (theme > 0) window.__doorThemeOptionTotal = theme;
    }
    if (theme <= 0) return;
    var totalAddon = getDoorAddonTotalSum();
    var screenStormAddon = getScreenStormAddonLayerTotal();
    var stileAddon = getStileAndRailProfileAddon();
    var stormGlassAddon = getStormGlassAddon();
    var displayTotal = theme + totalAddon + screenStormAddon;
    var forceWrite = !!(logMeta && (logMeta.userAction || logMeta.forceLog));
    var shown = readEstimatedPriceFromDom();
    if (!forceWrite && shown > 0 && Math.abs(shown - displayTotal) < 0.05) {
      return;
    }
    if (
      isScreenAndStormDoorsProductType()
      && screenStormAddon > 0.01
      && shown > 0
      && Math.abs(shown - displayTotal) > 0.05
    ) {
      logScreenStormPricingDebug('sync_write', {
        source: logMeta && logMeta.source ? logMeta.source : '_syncDoorEstimatedPriceDisplay',
        theme: theme,
        totalAddon: totalAddon,
        screenStormAddon: screenStormAddon,
        displayTotal: displayTotal,
        shownBefore: shown,
        oversized: parseFloat(window.__doorScreenStormAddon_oversized || 0) || 0,
        thickness: parseFloat(window.__doorScreenStormAddon_thickness || 0) || 0,
        sidelight_transom: parseFloat(window.__doorScreenStormAddon_sidelight_transom || 0) || 0,
        forceWrite: forceWrite
      });
    }
    var meta = {
      source: '_syncDoorEstimatedPriceDisplay',
      silent: !forceWrite,
      themeOptionTotal: theme,
      stileAddon: stileAddon,
      stormGlassAddon: stormGlassAddon,
      screenStormAddon: screenStormAddon,
      totalAddon: totalAddon
    };
    if (logMeta && typeof logMeta === 'object') {
      for (var mk in logMeta) {
        if (Object.prototype.hasOwnProperty.call(logMeta, mk)) meta[mk] = logMeta[mk];
      }
      if (logMeta.userAction || logMeta.forceLog) meta.silent = false;
    }
    window.__doorIntExtSyncing = true;
    writeDoorEstimatedPriceToDom(displayTotal, meta);
    setTimeout(function () {
      window.__doorIntExtSyncing = false;
    }, 120);
    persistDoorPricingState();
  } catch (e) {
    window.__doorIntExtSyncing = false;
  }
}

function applyAddonToEstimatedPrice(addon) {
  try {
    ensureDoorAddonBasePriceCaptured();
    var n = parseFloat(addon) || 0;
    window['__doorAddon_intExtOversizedApi'] = n;
    window['__doorAddon_intExtThicknessBand'] = 0;
    window.__doorIntExtAddonPrice = n;
    _syncDoorEstimatedPriceDisplay();
    schedulePriceSyncAfterPageHandlers();
  } catch (e) {}
}

function applyAddonToEstimatedPriceKey(addon, key, opts) {
  try {
    opts = opts || {};
    _captureAddonBasePriceIfNeeded(); // MUST come before the key is set
    var storeKey = '__doorAddon_' + String(key || 'default');
    var n = parseFloat(addon || 0) || 0;
    window[storeKey] = n;
    _syncDoorEstimatedPriceDisplay();
    schedulePriceSyncAfterPageHandlers();
  } catch (e) {}
}

/** Sum sidelight/transom oversized addons (pair split + legacy single key). */
function getSidelightTransomAddonTotal() {
  var pair1 = parseFloat(window['__doorAddon_sidelightTransomOversizedPair1'] || 0) || 0;
  var pair2 = parseFloat(window['__doorAddon_sidelightTransomOversizedPair2'] || 0) || 0;
  var legacy = parseFloat(window['__doorAddon_sidelightTransomOversized'] || 0) || 0;
  if (pair1 > 0 || pair2 > 0) return pair1 + pair2;
  return legacy;
}

function getPersistedPairAddon(pairIdx) {
  if (pairIdx === 1) {
    var v = parseFloat(window['__doorAddon_sidelightTransomOversizedPair1'] || 0) || 0;
    if (v > 0) return v;
    if (typeof window.__bothPairsLastAddon1 === 'number' && window.__bothPairsLastAddon1 > 0) {
      return window.__bothPairsLastAddon1;
    }
    return parseFloat(window['__doorAddon_sidelightTransomOversized'] || 0) || 0;
  }
  if (pairIdx === 2) {
    var v2 = parseFloat(window['__doorAddon_sidelightTransomOversizedPair2'] || 0) || 0;
    if (v2 > 0) return v2;
    if (typeof window.__bothPairsLastAddon2 === 'number' && window.__bothPairsLastAddon2 > 0) {
      return window.__bothPairsLastAddon2;
    }
  }
  return 0;
}

/** Pair addon for price notes (includes 0; uses in-flight API result). */
function getBothPairsAddonForNote(pairIdx) {
  if (pairIdx === 1) {
    if (typeof window.__bothPairsLastAddon1 === 'number') return window.__bothPairsLastAddon1;
    return getPersistedPairAddon(1);
  }
  if (typeof window.__bothPairsLastAddon2 === 'number') return window.__bothPairsLastAddon2;
  return getPersistedPairAddon(2);
}

/** Apply both pair addons atomically (avoids losing pair1 when pair2 is set). */
function applyBothPairsAddonsToPrice(addon1, addon2, opts) {
  try {
    opts = opts || {};
    _captureAddonBasePriceIfNeeded();
    var a1 = parseFloat(addon1) || 0;
    var a2 = parseFloat(addon2) || 0;
    window['__doorAddon_sidelightTransomOversized'] = 0;
    window['__doorAddon_sidelightTransomOversizedPair1'] = a1;
    window['__doorAddon_sidelightTransomOversizedPair2'] = a2;
    window.__bothPairsLastAddon1 = a1;
    window.__bothPairsLastAddon2 = a2;
    _syncDoorEstimatedPriceDisplay();
    if (!opts.skipAlert) {
      var onlyPair = parseInt(opts.onlyPair, 10) || 0;
      if ((onlyPair === 0 || onlyPair === 1) && a1 > 0) {
        alertDoorPriceAddonAdded(a1, DOOR_ADDON_ALERT_LABELS.sidelightTransomOversizedPair1);
      }
      if ((onlyPair === 0 || onlyPair === 2) && a2 > 0) {
        alertDoorPriceAddonAdded(a2, DOOR_ADDON_ALERT_LABELS.sidelightTransomOversizedPair2);
      }
    }
    schedulePriceSyncAfterPageHandlers();
  } catch (e) {}
}

function snapshotDoorPricingBeforeChange() {
  return {
    theme: getThemeOptionTotal(),
    display: readEstimatedPriceFromDom(),
    addons: getDoorAddonTotalSum()
  };
}

/** Schema option id/label from a changed control (radio/select). */
function findSchemaOptionForElement(t) {
  try {
    var schema = window.__doorConfigSchema;
    if (!Array.isArray(schema) || !t) return null;
    var optId = t.getAttribute ? String(t.getAttribute('data-option-id') || '') : '';
    if (optId) {
      for (var i = 0; i < schema.length; i++) {
        if (schema[i] && String(schema[i].id || '') === optId) return schema[i];
      }
    }
    var name = t.name != null ? String(t.name) : '';
    var m = name.match(/^attributes\[([^\]]+)\]/);
    if (!m) return null;
    var label = String(m[1] || '').replace(/\s*\[\]$/, '');
    for (var j = 0; j < schema.length; j++) {
      var o = schema[j];
      if (!o) continue;
      if (String(o.label || '') === label || String(o.id || '') === label) return o;
    }
  } catch (e) {}
  return null;
}

/** Price from schema for the choice the user just selected (wood, door setup, etc.). */
function readSelectedChoicePriceFromElement(t) {
  try {
    if (!t) return 0;
    var optId = t.getAttribute ? String(t.getAttribute('data-option-id') || '') : '';
    if (optId === 'wood_type' || (t.name && String(t.name).indexOf('Select Wood') !== -1)) {
      return readSelectedWoodTypePriceValue();
    }
    var opt = findSchemaOptionForElement(t);
    if (!opt || !Array.isArray(opt.options)) return 0;
    var val = t.value != null ? String(t.value) : '';
    for (var k = 0; k < opt.options.length; k++) {
      var choice = opt.options[k];
      if (String(choice && choice.value != null ? choice.value : '') !== val) continue;
      return toNum(choice.priceValue != null ? choice.priceValue : choice.price_value);
    }
  } catch (e) {}
  return 0;
}

/** Log after theme recalculates (wood, door setup, design cards, etc.). */
function logDoorPricingAfterOptionChange(changedEl, before) {
  try {
    before = before || {};
    var prevTheme = parseFloat(before.theme) || 0;
    var prevDisplay = parseFloat(before.display) || 0;
    var prevAddons = parseFloat(before.addons) || 0;
    var base = readProductBasePriceFromDom();
    var newTheme = getThemeOptionTotal();
    var addonsAfter = getDoorAddonTotalSum();
    var choicePrice = readSelectedChoicePriceFromElement(changedEl);
    var themeDelta = newTheme - (prevTheme > 0 ? prevTheme : base);
    // Full customer total before/after (theme + int-ext addons). Schema list price (priceValue)
    // can differ from net theme change (overrides, percent, replaced prior choice).
    var lastPrice = prevDisplay > 0 ? prevDisplay : (prevTheme > 0 ? prevTheme + prevAddons : base);
    var totalFromDom = readEstimatedPriceFromDom();
    var total =
      totalFromDom > 0
        ? totalFromDom
        : newTheme + addonsAfter;
    var netDisplayDelta = total - lastPrice;
    if (Math.abs(netDisplayDelta) < 0.02) netDisplayDelta = 0;
    logDoorSelectedOptionPrice(changedEl, lastPrice, netDisplayDelta, total, {
      context: 'schemaOptionChange',
      themeDelta: themeDelta,
      choicePriceFromSchema: choicePrice,
      newTheme: newTheme,
      addons: addonsAfter,
      prevTheme: prevTheme,
      prevAddons: prevAddons
    });
  } catch (eLogOpt) {}
}

/** After theme updateEstimatedPrice: capture schema total, then layer int-ext addons. */
function schedulePriceSyncAfterPageHandlers(changedEl, beforeSnap) {
  try {
    var syncGen = (window.__doorPriceSyncGen = (window.__doorPriceSyncGen || 0) + 1);
    if (!changedEl && !beforeSnap) {
      if (window.__doorBootSyncTimer) clearTimeout(window.__doorBootSyncTimer);
      window.__doorBootSyncTimer = setTimeout(function () {
        if (syncGen !== window.__doorPriceSyncGen) return;
        captureThemeOptionTotalFromDom();
        _syncDoorEstimatedPriceDisplay({ source: 'pageLoad' });
      }, 200);
      return;
    }
    function tick(isFinal) {
      if (syncGen !== window.__doorPriceSyncGen) return;
      captureThemeOptionTotalFromDom();
      _syncDoorEstimatedPriceDisplay(
        isFinal ? { source: 'optionChange', userAction: true } : { silent: true }
      );
      if (isFinal && changedEl && beforeSnap) logDoorPricingAfterOptionChange(changedEl, beforeSnap);
    }
    setTimeout(function () { tick(false); }, 0);
    setTimeout(function () { tick(false); }, 100);
    setTimeout(function () { tick(true); }, 250);
  } catch (e) {}
}

/** @deprecated use getDoorPricingNoteLastPrice — kept for call sites. */
function getDoorPricingNoteBasePrice() {
  return getDoorPricingNoteLastPrice();
}

/**
 * Console breakdown for debugging (filter console by "door-pricing").
 * Set window.DOOR_PRICE_DEBUG = false to silence.
 */
function logDoorSelectedOptionPrice(nearEl, lastPrice, selectedOptionPrice, totalPrice, extra) {
  try {
    if (window.DOOR_PRICE_DEBUG === false) return;
    var info = {
      lastPrice: parseFloat(lastPrice) || 0,
      selectedOptionPrice: parseFloat(selectedOptionPrice) || 0,
      total: parseFloat(totalPrice) || 0,
      themeOptionTotal: getThemeOptionTotal(),
      intExtAddons: getDoorAddonTotalSum(),
      estimatedPriceDom: readEstimatedPriceFromDom()
    };
    if (nearEl) {
      info.elementId = nearEl.id || '';
      info.elementName = nearEl.name || '';
    }
    if (extra && typeof extra === 'object') {
      for (var k in extra) {
        if (Object.prototype.hasOwnProperty.call(extra, k)) info[k] = extra[k];
      }
    }
    var midLabel =
      extra && extra.context === 'schemaOptionChange'
        ? 'Net change to total = '
        : 'Selected option price = ';
    console.log(
      '[door-pricing] Last price = ' + formatMoney(info.lastPrice) +
      ' + ' + midLabel + formatMoney(info.selectedOptionPrice) +
      ' = Total = ' + formatMoney(info.total),
      info
    );
  } catch (eLog) {}
}

/**
 * Show a small price-breakdown note directly below the row that contains
 * `nearEl`.  Format: "Last price = $X  +  Selected option price = $Y  =  Total = $Z"
 * Last price = configurator current total (all selected options), not variant base.
 */
function showDoorOptionPriceNote(nearEl, prevTotal, addonAmount, opts) {
  try {
    if (!nearEl) return;
    opts = opts || {};
    var container = (nearEl.closest && (
      nearEl.closest('.door-measure-dimension-row') ||
      nearEl.closest('.door-measure-dimension-body') ||
      nearEl.closest('.door-option-wrap') ||
      nearEl.closest('.product-form__option') ||
      nearEl.closest('label')
    )) || nearEl.parentElement;
    if (!container) return;

    var note = container.querySelector('[data-door-price-note]');
    if (!note) {
      note = document.createElement('div');
      note.setAttribute('data-door-price-note', '1');
      note.style.cssText = [
        'display:none',
        'font-size:12px',
        'color:#555',
        'margin-top:5px',
        'padding:4px 8px',
        'background:#f8f8f8',
        'border-left:3px solid #c8c8c8',
        'border-radius:2px',
        'line-height:1.6',
        'display:none'
      ].join(';');
      container.appendChild(note);
    }

    var amt = parseFloat(addonAmount) || 0;
    var last = parseFloat(prevTotal) || 0;
    if (last <= 0) last = getDoorPricingNoteLastPrice();
    var total = opts.total != null ? parseFloat(opts.total) : (last + amt);
    logDoorSelectedOptionPrice(nearEl, last, amt, total, {
      context: opts.context || 'showDoorOptionPriceNote',
      noteHidden: !opts.showWhenZero && amt <= 0 && total <= last
    });
    if (!opts.showWhenZero && amt <= 0 && total <= last) {
      note.style.display = 'none';
      return;
    }

    note.style.display = 'none';
    note.innerHTML =
      'Last price&nbsp;=&nbsp;<strong>' + formatMoney(last) + '</strong>' +
      '&nbsp;&nbsp;+&nbsp;&nbsp;' +
      'Selected option price&nbsp;=&nbsp;<strong>' + formatMoney(amt) + '</strong>' +
      '&nbsp;&nbsp;=&nbsp;&nbsp;' +
      'Total&nbsp;=&nbsp;<strong>' + formatMoney(total) + '</strong>';
  } catch (e) {}
}

function readSidelightWidthFromDom() {
  try {
    // There can be multiple sidelight width selects in DOM (exact/rough panels/templates).
    // Always read the currently visible one.
    var intEl = getVisibleById('sidelight_width') || document.getElementById('sidelight_width');
    var fracEl = getVisibleById('sidelight_width_fraction') || document.getElementById('sidelight_width_fraction');
    if (!intEl && !fracEl) return 0;
    return toNum(intEl && intEl.value) + parseDropdownNumber(fracEl && fracEl.value);
  } catch (e) {}
  return 0;
}

function readProductBasePriceFromDom() {
  try {
    if (window.DoorConfiguratorPricing && typeof window.DoorConfiguratorPricing.getProductBasePrice === 'function') {
      return toNum(window.DoorConfiguratorPricing.getProductBasePrice());
    }
    var container = document.getElementById('door-configurator');
    if (!container) return 0;
    return toNum(container.getAttribute('data-base-price'));
  } catch (e) {}
  return 0;
}

function readSelectedWoodTypeValueFromDom() {
  try {
    var root = document.getElementById('door-configurator-options') || document;
    var checked = root.querySelector('input[type="radio"][data-option-id="wood_type"]:checked');
    if (!checked) checked = root.querySelector('input[type="radio"][name="attributes[Select Wood]"]:checked');
    return checked && checked.value != null ? String(checked.value).trim() : '';
  } catch (e) {}
  return '';
}

function readSelectedWoodTypePriceValue() {
  try {
    if (window.DoorConfiguratorPricing && typeof window.DoorConfiguratorPricing.getSelectedWoodTypePriceValue === 'function') {
      return toNum(window.DoorConfiguratorPricing.getSelectedWoodTypePriceValue());
    }
    var schema = window.__doorConfigSchema;
    var selected = readSelectedWoodTypeValueFromDom();
    if (!Array.isArray(schema) || !selected) return 0;
    var woodOpt = null;
    for (var i = 0; i < schema.length; i++) {
      if (schema[i] && schema[i].id === 'wood_type') {
        woodOpt = schema[i];
        break;
      }
    }
    if (!woodOpt || !Array.isArray(woodOpt.options)) return 0;
    for (var j = 0; j < woodOpt.options.length; j++) {
      var choice = woodOpt.options[j];
      if (String(choice && choice.value != null ? choice.value : '') !== selected) continue;
      return toNum(choice.priceValue != null ? choice.priceValue : choice.price_value);
    }
  } catch (e) {}
  return 0;
}

/** Sidelight width > 23″: add variant base + current wood priceValue (not chart API). */
function appliesWideSidelightBaseWoodAddon() {
  if (!isSidelightStyleSelected()) return false;
  return readSidelightWidthFromDom() > 23;
}

function computeWideSidelightBaseWoodAddon() {
  return readProductBasePriceFromDom() + readSelectedWoodTypePriceValue();
}

/**
 * When sidelight width > 23: layer (base + latest wood price) on theme total.
 * Replaces prior wide-sidelight addon; does not persist to storage.
 */
function applyWideSidelightBasePlusWoodAddon(changedEl, opts) {
  opts = opts || {};
  if (!appliesWideSidelightBaseWoodAddon()) {
    applyAddonToEstimatedPriceKey(0, 'sidelightTransomOversized');
    _syncDoorEstimatedPriceDisplay();
    return 0;
  }
  captureThemeOptionTotalFromDom();
  var combined = computeWideSidelightBaseWoodAddon();
  applyAddonToEstimatedPriceKey(combined, 'sidelightTransomOversized', {
    alertLabel: DOOR_ADDON_ALERT_LABELS.wideSidelightBaseWood
  });
  if (changedEl) {
    var theme = getThemeOptionTotal();
    showDoorOptionPriceNote(changedEl, theme, combined, {
      total: theme + combined,
      showWhenZero: true,
      context: 'wideSidelightBaseWood'
    });
  }
  try {
    if (window.DOOR_PRICE_DEBUG) {
      console.log('[door-pricing] wide sidelight base+wood', {
        base: readProductBasePriceFromDom(),
        wood: readSelectedWoodTypePriceValue(),
        addon: combined,
        theme: getThemeOptionTotal(),
        display: getThemeOptionTotal() + getDoorAddonTotalSum()
      });
    }
  } catch (eLogWide) {}
  return combined;
}

function isWoodTypeOptionTarget(t) {
  if (!t) return false;
  var optId = t.getAttribute ? String(t.getAttribute('data-option-id') || '') : '';
  var name = t.name != null ? String(t.name) : '';
  return optId === 'wood_type' || name.indexOf('Select Wood') !== -1;
}

function getVisibleById(id) {
  try {
    var els = document.querySelectorAll('#' + String(id).replace(/[^a-zA-Z0-9_-]/g, ''));
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      // offsetParent === null for display:none (and some hidden states)
      if (el && isElementVisible(el)) return el;
    }
    // Fallback to first if none are "visible" (better than null).
    return els && els.length ? els[0] : null;
  } catch (e) {}
  return null;
}

function isElementVisible(el) {
  try {
    if (!el) return false;
    if (el.offsetParent !== null) return true;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  } catch (e) {}
  return false;
}

/** First matching element that is visible (handles duplicate suffixed ids). */
function firstVisibleSelect(selector) {
  try {
    var all = document.querySelectorAll(selector);
    for (var i = 0; i < all.length; i++) {
      if (isElementVisible(all[i])) return all[i];
    }
    return all.length ? all[all.length - 1] : null;
  } catch (e) {}
  return null;
}

function firstVisibleInScope(scope, selector) {
  try {
    if (!scope || !scope.querySelectorAll) return null;
    var all = scope.querySelectorAll(selector);
    for (var i = 0; i < all.length; i++) {
      if (isElementVisible(all[i])) return all[i];
    }
    return all.length ? all[all.length - 1] : null;
  } catch (e) {}
  return null;
}

/**
 * Static measurement panels (assignStaticMeasurementRowSelectIds in theme):
 *   finished-width-*  ↔ panel-width-*  (same pricing / API as finished opening)
 *   finished-height-* ↔ panel-height-*
 *   finished-door-thickness-* ↔ rough-door-thickness-*
 * Slab transom #panel-door-width-* is separate (sidelight chart only).
 */
var DOOR_WIDTH_INT_BASE_IDS = [
  'exact-door-width-int', 'finished-width-int', 'panel-width-int', 'rough-width-int'
];
var DOOR_WIDTH_FRAC_BASE_IDS = [
  'exact-door-width-frac', 'finished-width-frac', 'panel-width-frac', 'rough-width-frac'
];
var DOOR_HEIGHT_INT_BASE_IDS = [
  'door_height', 'door-height', 'finished-height-int', 'panel-height-int', 'rough-height-int'
];
var DOOR_HEIGHT_FRAC_BASE_IDS = [
  'door_height_fraction', 'door-height-fraction',
  'finished-height-frac', 'panel-height-frac', 'rough-height-frac'
];
var DOOR_THICKNESS_BASE_IDS = [
  'exact-door-thickness-int', 'exact-door-thickness-frac',
  'finished-door-thickness-int', 'finished-door-thickness-frac', 'finished-door-thickness',
  'rough-door-thickness-int', 'rough-door-thickness-frac', 'rough-door-thickness',
  'door-thickness'
];

var MEASUREMENT_DIM_IDS_BY_PANEL = {
  widthInt: {
    exact: ['exact-door-width-int'],
    finished: ['finished-width-int'],
    panel: ['panel-width-int'],
    rough: ['rough-width-int']
  },
  widthFrac: {
    exact: ['exact-door-width-frac'],
    finished: ['finished-width-frac'],
    panel: ['panel-width-frac'],
    rough: ['rough-width-frac']
  },
  heightInt: {
    exact: ['door_height', 'door-height'],
    finished: ['finished-height-int'],
    panel: ['panel-height-int'],
    rough: ['rough-height-int']
  },
  heightFrac: {
    exact: ['door_height_fraction', 'door-height-fraction'],
    finished: ['finished-height-frac'],
    panel: ['panel-height-frac'],
    rough: ['rough-height-frac']
  }
};

function dimensionIdsForActivePanel(kind, hintEl) {
  var key = getActiveMeasurementPanelKey(hintEl);
  var map = MEASUREMENT_DIM_IDS_BY_PANEL[kind];
  if (!map) return MEASUREMENT_DIM_IDS_BY_PANEL.widthInt.exact;
  return map[key] || map.exact;
}

function measurementSelectIdMatches(id, baseIds) {
  id = String(id || '');
  if (!id) return false;
  for (var i = 0; i < baseIds.length; i++) {
    var b = baseIds[i];
    if (!b) continue;
    if (id === b || id.indexOf(b + '__') === 0 || id.indexOf(b + '-') === 0) return true;
  }
  return false;
}

function isDoorWidthSelectId(id) {
  return measurementSelectIdMatches(id, DOOR_WIDTH_INT_BASE_IDS)
    || measurementSelectIdMatches(id, DOOR_WIDTH_FRAC_BASE_IDS);
}

function isDoorHeightSelectId(id) {
  return measurementSelectIdMatches(id, DOOR_HEIGHT_INT_BASE_IDS)
    || measurementSelectIdMatches(id, DOOR_HEIGHT_FRAC_BASE_IDS);
}

function measurementRowTitle(el) {
  try {
    if (!el || !el.closest) return '';
    var row = el.closest('.door-measure-dimension-row');
    if (!row) return '';
    return String((row.querySelector('.door-measure-dimension-title') || {}).textContent || '').toLowerCase();
  } catch (e) {}
  return '';
}

/** Width int/frac selects (exact or finished opening) — by id or row title when ids are not set yet. */
function isExactDoorWidthMeasurementEl(t) {
  if (!t || String(t.tagName || '').toUpperCase() !== 'SELECT') return false;
  if (isDoorWidthSelectId(t.id)) return true;
  var title = measurementRowTitle(t);
  if (!title) return false;
  if (title.indexOf('exact door width') !== -1 || title.indexOf('finished opening width') !== -1) return true;
  return title.indexOf('width') !== -1
    && title.indexOf('sidelight') === -1
    && title.indexOf('panel door') === -1;
}

/** Height int/frac selects (exact or finished opening) — by id or row title. */
function isExactDoorHeightMeasurementEl(t) {
  if (!t || String(t.tagName || '').toUpperCase() !== 'SELECT') return false;
  if (isDoorHeightSelectId(t.id)) return true;
  var title = measurementRowTitle(t);
  if (!title) return false;
  if (title.indexOf('exact door height') !== -1 || title.indexOf('finished opening height') !== -1) return true;
  return title.indexOf('height') !== -1
    && title.indexOf('transom') === -1
    && title.indexOf('panel') === -1;
}

/** Exact door width/height changes still use the general int/ext API even when sidelight/transom style is on. */
function shouldRunGeneralIntExtOversizedApiForChange(t) {
  if (!isSidelightStyleSelected() && !isTransomStyleSelected()) return true;
  if (!t) return false;
  return (
    isDoorWidthSelectId(t.id) || isExactDoorWidthMeasurementEl(t)
    || isDoorHeightSelectId(t.id) || isExactDoorHeightMeasurementEl(t)
  );
}

function isDoorThicknessSelectId(id) {
  return measurementSelectIdMatches(id, DOOR_THICKNESS_BASE_IDS)
    || id === 'panel-door-thickness-frac'
    || String(id || '').indexOf('panel-door-thickness-frac') === 0;
}

function firstVisibleSelectStrict(selector) {
  try {
    var all = document.querySelectorAll(selector);
    for (var i = 0; i < all.length; i++) {
      if (isElementVisible(all[i])) return all[i];
    }
  } catch (e) {}
  return null;
}

/** Which static measurement panel is active (exact / finished / panel / rough / jamb). */
function getActiveMeasurementPanelKey(hintEl) {
  try {
    if (hintEl && hintEl.id) {
      var hid = String(hintEl.id);
      if (measurementSelectIdMatches(hid, MEASUREMENT_DIM_IDS_BY_PANEL.widthInt.panel)
          || measurementSelectIdMatches(hid, MEASUREMENT_DIM_IDS_BY_PANEL.widthFrac.panel)
          || measurementSelectIdMatches(hid, MEASUREMENT_DIM_IDS_BY_PANEL.heightInt.panel)
          || measurementSelectIdMatches(hid, MEASUREMENT_DIM_IDS_BY_PANEL.heightFrac.panel)) {
        return 'panel';
      }
      if (measurementSelectIdMatches(hid, ['rough-door-thickness', 'rough-door-thickness-int', 'rough-door-thickness-frac'])) {
        return 'rough';
      }
      if (measurementSelectIdMatches(hid, ['finished-door-thickness', 'finished-door-thickness-int', 'finished-door-thickness-frac'])) {
        return 'finished';
      }
      if (measurementSelectIdMatches(hid, MEASUREMENT_DIM_IDS_BY_PANEL.widthInt.finished)
          || measurementSelectIdMatches(hid, MEASUREMENT_DIM_IDS_BY_PANEL.widthFrac.finished)
          || measurementSelectIdMatches(hid, MEASUREMENT_DIM_IDS_BY_PANEL.heightInt.finished)
          || measurementSelectIdMatches(hid, MEASUREMENT_DIM_IDS_BY_PANEL.heightFrac.finished)) {
        return 'finished';
      }
      if (measurementSelectIdMatches(hid, MEASUREMENT_DIM_IDS_BY_PANEL.widthInt.rough)
          || measurementSelectIdMatches(hid, MEASUREMENT_DIM_IDS_BY_PANEL.heightInt.rough)
          || measurementSelectIdMatches(hid, ['rough-door-thickness', 'rough-door-thickness-int', 'rough-door-thickness-frac'])) {
        return 'rough';
      }
      if (measurementSelectIdMatches(hid, MEASUREMENT_DIM_IDS_BY_PANEL.widthInt.exact)
          || measurementSelectIdMatches(hid, MEASUREMENT_DIM_IDS_BY_PANEL.widthFrac.exact)) {
        return 'exact';
      }
    }
    if (firstVisibleSelectStrict('select#panel-width-int, select[id^="panel-width-int"]')) return 'panel';
    if (firstVisibleSelectStrict('select#finished-width-int, select[id^="finished-width-int"]')) return 'finished';
    if (firstVisibleSelectStrict('select#rough-width-int, select[id^="rough-width-int"]')) return 'rough';
    if (firstVisibleSelectStrict('select#exact-door-width-int, select[id^="exact-door-width-int"]')) return 'exact';
    var panels = document.querySelectorAll('.door-measurement-static-panel');
    for (var i = 0; i < panels.length; i++) {
      var p = panels[i];
      if (!p || !isElementVisible(p)) continue;
      if (p.classList && p.classList.contains('door-measurement-static-panel--finished')) return 'finished';
      if (p.classList && p.classList.contains('door-measurement-static-panel--rough')) return 'rough';
      if (p.classList && p.classList.contains('door-measurement-static-panel--exact')) return 'exact';
      if (p.querySelector && p.querySelector('[id^="panel-width-int"]')) return 'panel';
    }
  } catch (e) {}
  return 'exact';
}

function firstVisibleSelectForBaseIds(baseIds, hintEl) {
  var i, el, hid;
  if (hintEl && isElementVisible(hintEl)) {
    hid = String(hintEl.id || '');
    for (i = 0; i < baseIds.length; i++) {
      if (measurementSelectIdMatches(hid, [baseIds[i]])) return hintEl;
    }
  }
  for (i = 0; i < baseIds.length; i++) {
    el = firstVisibleSelectStrict('select#' + baseIds[i] + ', select[id^="' + baseIds[i] + '"]');
    if (el) return el;
  }
  return null;
}

function pairedFracInRow(intOrFracEl) {
  try {
    if (!intOrFracEl || !intOrFracEl.closest) return null;
    var row = intOrFracEl.closest('.door-measure-dimension-row')
      || intOrFracEl.closest('.door-measure-dimension-inputs');
    if (row) return row.querySelector('select.door-dimension-frac-select');
  } catch (e) {}
  return null;
}

function findVisibleMeasurementRowSelects(titleMatchFn) {
  try {
    var rows = document.querySelectorAll('.door-measure-dimension-row');
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      if (!isElementVisible(row)) continue;
      var titleEl = row.querySelector('.door-measure-dimension-title');
      var title = String(titleEl && titleEl.textContent || '').toLowerCase();
      if (!titleMatchFn(title)) continue;
      var inputs = row.querySelector('.door-measure-dimension-inputs-row') || row;
      return {
        intEl: inputs.querySelector('select.door-dimension-int-select'),
        fracEl: inputs.querySelector('select.door-dimension-frac-select')
      };
    }
  } catch (eFindRow) {}
  return { intEl: null, fracEl: null };
}

function pairedIntInRow(intOrFracEl) {
  try {
    if (!intOrFracEl || !intOrFracEl.closest) return null;
    var row = intOrFracEl.closest('.door-measure-dimension-row')
      || intOrFracEl.closest('.door-measure-dimension-inputs-row');
    if (row) return row.querySelector('select.door-dimension-int-select');
  } catch (e) {}
  return null;
}

function getVisibleDoorWidthSelects(hintEl) {
  var intIds = dimensionIdsForActivePanel('widthInt', hintEl);
  var fracIds = dimensionIdsForActivePanel('widthFrac', hintEl);
  var intEl = firstVisibleSelectForBaseIds(intIds, hintEl);
  var fracEl = firstVisibleSelectForBaseIds(fracIds, hintEl) || pairedFracInRow(intEl);
  if (hintEl && isElementVisible(hintEl) && measurementSelectIdMatches(hintEl.id, DOOR_WIDTH_FRAC_BASE_IDS)) {
    fracEl = hintEl;
    if (!intEl) intEl = pairedIntInRow(hintEl) || firstVisibleSelectForBaseIds(intIds, null);
  }
  if (hintEl && isElementVisible(hintEl) && !intEl && hintEl.classList && hintEl.classList.contains('door-dimension-int-select')) {
    intEl = hintEl;
    if (!fracEl) fracEl = pairedFracInRow(hintEl);
  }
  if (hintEl && isElementVisible(hintEl) && !fracEl && hintEl.classList && hintEl.classList.contains('door-dimension-frac-select')) {
    if (isExactDoorWidthMeasurementEl(hintEl)) {
      fracEl = hintEl;
      if (!intEl) intEl = pairedIntInRow(hintEl);
    }
  }
  if (!intEl && !fracEl) {
    var fb = findVisibleMeasurementRowSelects(function (title) {
      return title.indexOf('exact door width') !== -1
        || title.indexOf('finished opening width') !== -1
        || (title.indexOf('width') !== -1 && title.indexOf('sidelight') === -1 && title.indexOf('panel door') === -1);
    });
    intEl = fb.intEl;
    fracEl = fb.fracEl;
  }
  return { intEl: intEl, fracEl: fracEl };
}

function getVisibleDoorHeightSelects(hintEl) {
  var intIds = dimensionIdsForActivePanel('heightInt', hintEl);
  var fracIds = dimensionIdsForActivePanel('heightFrac', hintEl);
  var intEl = firstVisibleSelectForBaseIds(intIds, hintEl);
  var fracEl = firstVisibleSelectForBaseIds(fracIds, hintEl) || pairedFracInRow(intEl);
  if (hintEl && isElementVisible(hintEl) && measurementSelectIdMatches(hintEl.id, DOOR_HEIGHT_FRAC_BASE_IDS)) {
    fracEl = hintEl;
    if (!intEl) intEl = pairedIntInRow(hintEl) || firstVisibleSelectForBaseIds(intIds, null);
  }
  if (hintEl && isElementVisible(hintEl) && !intEl && hintEl.classList && hintEl.classList.contains('door-dimension-int-select')) {
    intEl = hintEl;
    if (!fracEl) fracEl = pairedFracInRow(hintEl);
  }
  if (hintEl && isElementVisible(hintEl) && !fracEl && hintEl.classList && hintEl.classList.contains('door-dimension-frac-select')) {
    if (isExactDoorHeightMeasurementEl(hintEl)) {
      fracEl = hintEl;
      if (!intEl) intEl = pairedIntInRow(hintEl);
    }
  }
  if (!intEl && !fracEl) {
    var fb = findVisibleMeasurementRowSelects(function (title) {
      return title.indexOf('exact door height') !== -1
        || title.indexOf('finished opening height') !== -1
        || (title.indexOf('height') !== -1 && title.indexOf('transom') === -1 && title.indexOf('panel') === -1);
    });
    intEl = fb.intEl;
    fracEl = fb.fracEl;
  }
  return { intEl: intEl, fracEl: fracEl };
}

function readDoorWidthInchesFromDom(hintEl) {
  var s = getVisibleDoorWidthSelects(hintEl);
  return readIntFracPairFromSelect(s.intEl, s.fracEl);
}

function readDoorHeightInchesFromDom(hintEl) {
  var s = getVisibleDoorHeightSelects(hintEl);
  return readIntFracPairFromSelect(s.intEl, s.fracEl);
}

function readIntFracPairFromSelect(intEl, fracEl) {
  if (!intEl && !fracEl) return 0;
  return toNum(intEl && intEl.value) + parseDropdownNumber(fracEl && fracEl.value);
}

function readPanelDoorWidthFromSelectEl(intEl) {
  try {
    if (!intEl || !intEl.id) return readIntFracPairFromSelect(intEl, null);
    var id = String(intEl.id);
    if (id.indexOf('panel-door-width-int') !== 0) return readIntFracPairFromSelect(intEl, null);
    var suffix = id.slice('panel-door-width-int'.length);
    var fracEl = document.getElementById('panel-door-width-frac' + suffix)
      || firstVisibleInScope(intEl.closest && (intEl.closest('.door-measure-dimension-inputs-row')
        || intEl.closest('.door-measure-dimension-row') || intEl.closest('.door-option-wrap')
        || intEl.closest('.door-measurement-slab-transom-panels')), 'select[id^="panel-door-width-frac"]')
      || firstVisibleSelect('select[id^="panel-door-width-frac"]');
    return readIntFracPairFromSelect(intEl, fracEl);
  } catch (e) {}
  return 0;
}

function readDoorHeightFromDom(root) {
  try {
    if (!root || root === document) return readDoorHeightInchesFromDom();
    var scope = root;
    var intEl = null;
    var fracEl = null;
    var bi, bid;
    try {
      if (scope && scope.querySelector) {
        for (bi = 0; bi < DOOR_HEIGHT_INT_BASE_IDS.length; bi++) {
          bid = DOOR_HEIGHT_INT_BASE_IDS[bi];
          intEl = scope.querySelector('#' + bid) || scope.querySelector('select[id^="' + bid + '"]');
          if (intEl) break;
        }
        for (bi = 0; bi < DOOR_HEIGHT_FRAC_BASE_IDS.length; bi++) {
          bid = DOOR_HEIGHT_FRAC_BASE_IDS[bi];
          fracEl = scope.querySelector('#' + bid) || scope.querySelector('select[id^="' + bid + '"]');
          if (fracEl) break;
        }
      }
    } catch (eScopeH) {}
    if (!fracEl) fracEl = pairedFracInRow(intEl);
    return readIntFracPairFromSelect(intEl, fracEl);
  } catch (e) {}
  return 0;
}

function readPanelTransomHeightFromDom() {
  try {
    var intEl = getVisibleById('panel-transom-height-int') || firstVisibleSelect('select[id^="panel-transom-height-int"]');
    var fracEl = getVisibleById('panel-transom-height-frac') || firstVisibleSelect('select[id^="panel-transom-height-frac"]');
    if (!intEl && !fracEl) return 0;
    return readIntFracPairFromSelect(intEl, fracEl);
  } catch (e) {}
  return 0;
}

function readPanelDoorWidthFromDom() {
  try {
    var intEl = getVisibleById('panel-door-width-int') || firstVisibleSelect('select[id^="panel-door-width-int"]');
    if (intEl) return readPanelDoorWidthFromSelectEl(intEl);
    var fracEl = getVisibleById('panel-door-width-frac') || firstVisibleSelect('select[id^="panel-door-width-frac"]');
    return readIntFracPairFromSelect(null, fracEl);
  } catch (e) {}
  return 0;
}

function readPanelDoorThicknessFromDom() {
  try {
    var el =
      getVisibleById('panel-door-thickness-frac')
      || document.querySelector('select[id^="panel-door-thickness-frac"]')
      || document.getElementById('panel-door-thickness-frac');
    if (!el || el.value == null || String(el.value).trim() === '') return 0;
    var parsed = parseThicknessString(el.value);
    if (!isNaN(parsed) && parsed > 0) return parsed;
    var parsed2 = parseDropdownNumber(el.value);
    return isNaN(parsed2) ? 0 : parsed2;
  } catch (e) {}
  return 0;
}

function readPanelTransomHeightFromEventTarget(t) {
  try {
    if (!t) return 0;
    var id = String(t.id || '');
    if (id.indexOf('panel-transom-height-int') === 0) {
      var suffix = id.slice('panel-transom-height-int'.length);
      var fracEl = document.getElementById('panel-transom-height-frac' + suffix)
        || firstVisibleSelect('select[id^="panel-transom-height-frac"]');
      return readIntFracPairFromSelect(t, fracEl);
    }
    if (id.indexOf('panel-transom-height-frac') === 0) {
      var suffixF = id.slice('panel-transom-height-frac'.length);
      var intElF = document.getElementById('panel-transom-height-int' + suffixF)
        || firstVisibleSelect('select[id^="panel-transom-height-int"]');
      return readIntFracPairFromSelect(intElF, t);
    }
    if (!t.closest) return 0;
    var row = t.closest('.door-measure-dimension-inputs-row') || t.closest('.door-measure-dimension-row')
      || t.closest('.door-option-wrap') || t.closest('.door-measurement-slab-transom-panels');
    if (!row) return 0;
    var intEl = firstVisibleInScope(row, 'select[id^="panel-transom-height-int"]');
    var fracEl = firstVisibleInScope(row, 'select[id^="panel-transom-height-frac"]');
    return readIntFracPairFromSelect(intEl, fracEl);
  } catch (e) {}
  return 0;
}

function readPanelDoorWidthFromEventTarget(t) {
  try {
    if (!t) return 0;
    var id = String(t.id || '');
    if (id.indexOf('panel-door-width-int') === 0) return readPanelDoorWidthFromSelectEl(t);
    if (id.indexOf('panel-door-width-frac') === 0) {
      var suffixF = id.slice('panel-door-width-frac'.length);
      var intElF = document.getElementById('panel-door-width-int' + suffixF)
        || firstVisibleSelect('select[id^="panel-door-width-int"]');
      return readIntFracPairFromSelect(intElF, t);
    }
    if (!t.closest) return 0;
    var row = t.closest('.door-measure-dimension-inputs-row') || t.closest('.door-measure-dimension-row')
      || t.closest('.door-option-wrap') || t.closest('.door-measurement-slab-transom-panels');
    if (!row) return 0;
    var intEl = firstVisibleInScope(row, 'select[id^="panel-door-width-int"]');
    var fracEl = firstVisibleInScope(row, 'select[id^="panel-door-width-frac"]');
    return readIntFracPairFromSelect(intEl, fracEl);
  } catch (e) {}
  return 0;
}

function readPanelDoorThicknessFromEventTarget(t) {
  try {
    if (!t || !t.closest) return 0;
    var row = t.closest('.door-measure-dimension-inputs-row') || t.closest('.door-measure-dimension-row') || t.closest('.door-option-wrap');
    if (!row) return 0;
    var el = row.querySelector('#panel-door-thickness-frac, select[id^="panel-door-thickness-frac"]');
    if (!el || el.value == null || String(el.value).trim() === '') return 0;
    var parsed = parseThicknessString(el.value);
    if (!isNaN(parsed) && parsed > 0) return parsed;
    var parsed2 = parseDropdownNumber(el.value);
    return isNaN(parsed2) ? 0 : parsed2;
  } catch (e) {}
  return 0;
}

function readSidelightWidthFromEventTarget(t) {
  try {
    if (!t) return 0;
    var id = String(t.id || '');
    if (id === 'sidelight_width') {
      var fracEl = getVisibleById('sidelight_width_fraction') || document.getElementById('sidelight_width_fraction');
      return readIntFracPairFromSelect(t, fracEl);
    }
    if (id === 'sidelight_width_fraction') {
      var intEl = getVisibleById('sidelight_width') || document.getElementById('sidelight_width');
      return readIntFracPairFromSelect(intEl, t);
    }
    var row = t.closest ? t.closest('.door-measure-dimension-inputs-row') : null;
    if (!row) return 0;
    var intElR = row.querySelector('#sidelight_width') || row.querySelector('select.door-dimension-int-select');
    var fracElR = row.querySelector('#sidelight_width_fraction') || row.querySelector('select.door-dimension-frac-select');
    return readIntFracPairFromSelect(intElR, fracElR);
  } catch (e) {}
  return 0;
}

function readDoorHeightFromEventTarget(t) {
  try {
    if (!t) return 0;
    if (isDoorHeightSelectId(t.id) || isExactDoorHeightMeasurementEl(t)) {
      if (measurementSelectIdMatches(t.id, DOOR_HEIGHT_INT_BASE_IDS) || (t.classList && t.classList.contains('door-dimension-int-select') && isExactDoorHeightMeasurementEl(t))) {
        return readIntFracPairFromSelect(t, pairedFracInRow(t) || getVisibleDoorHeightSelects(t).fracEl);
      }
      if (measurementSelectIdMatches(t.id, DOOR_HEIGHT_FRAC_BASE_IDS) || (t.classList && t.classList.contains('door-dimension-frac-select') && isExactDoorHeightMeasurementEl(t))) {
        return readIntFracPairFromSelect(pairedIntInRow(t) || getVisibleDoorHeightSelects(t).intEl, t);
      }
      return readDoorHeightInchesFromDom(t);
    }
    return 0;
  } catch (e) {}
  return 0;
}

/**
 * Sidelight/transom oversized chart: API `width` = 10–23 band, API `height` = 82+ band.
 * On the transom panel the storefront sometimes swaps which <select> shows which range
 * (id panel-door-width-int may show 10–23 while panel-transom-height-int shows 82+).
 * Pick axes by value range, not by field label/id alone.
 */
function toSidelightTransomChartAxes(valA, valB) {
  var a = Math.round(parseFloat(valA)) || 0;
  var b = Math.round(parseFloat(valB)) || 0;
  if (a <= 0 && b <= 0) return { width: 0, height: 0 };
  if (a <= 0) return { width: b, height: 0 };
  if (b <= 0) return { width: a, height: 0 };
  var aSmall = a >= 10 && a <= 23;
  var bSmall = b >= 10 && b <= 23;
  var aLarge = a >= 82;
  var bLarge = b >= 82;
  if (aSmall && bLarge) return { width: a, height: b };
  if (bSmall && aLarge) return { width: b, height: a };
  if (a <= b) return { width: a, height: b };
  return { width: b, height: a };
}

/**
 * Read dimensions for two-pair pricing.
 * Pair 1 fields: #panel-door-width-int* and #panel-transom-height-int*
 * Pair 2 fields: #door_height and #sidelight_width
 * API params are normalized via toSidelightTransomChartAxes (width = 10–23, height = 82+).
 */
function readBothPairsDimensions(changedEl) {
  var panelDoorIn = readPanelDoorWidthFromDom() || 0;
  var panelTransomIn = readPanelTransomHeightFromDom() || 0;
  var doorHIn = readDoorHeightFromDom() || 0;
  var sideWIn = readSidelightWidthFromDom() || 0;
  try {
    if (changedEl) {
      var id = String(changedEl.id || '');
      if (id.indexOf('panel-transom-height') === 0) {
        var v1 = readPanelTransomHeightFromEventTarget(changedEl);
        if (v1 > 0) panelTransomIn = v1;
      } else if (id.indexOf('panel-door-width') === 0) {
        var v2 = readPanelDoorWidthFromEventTarget(changedEl);
        if (v2 > 0) panelDoorIn = v2;
      } else if (id === 'sidelight_width' || id === 'sidelight_width_fraction') {
        var v3 = readSidelightWidthFromEventTarget(changedEl);
        if (v3 > 0) sideWIn = v3;
      } else if (isDoorHeightSelectId(id) || isExactDoorHeightMeasurementEl(changedEl)) {
        var v4 = readDoorHeightFromEventTarget(changedEl);
        if (v4 > 0) doorHIn = v4;
      }
    }
    if (!panelTransomIn && typeof window.__lastPanelTransomHeightInchesRaw === 'number' && window.__lastPanelTransomHeightInchesRaw > 0) {
      panelTransomIn = window.__lastPanelTransomHeightInchesRaw;
    }
    if (!panelDoorIn && typeof window.__lastPanelDoorWidthInchesRaw === 'number' && window.__lastPanelDoorWidthInchesRaw > 0) {
      panelDoorIn = window.__lastPanelDoorWidthInchesRaw;
    }
    if (!sideWIn && typeof window.__lastSidelightWidthInchesRaw === 'number' && window.__lastSidelightWidthInchesRaw > 0) {
      sideWIn = window.__lastSidelightWidthInchesRaw;
    }
    if (!doorHIn) {
      if (typeof window.__lastDoorHeightInchesRaw === 'number' && window.__lastDoorHeightInchesRaw > 0) {
        doorHIn = window.__lastDoorHeightInchesRaw;
      } else if (typeof window.__lastDoorHeightInches === 'number' && window.__lastDoorHeightInches > 0) {
        doorHIn = window.__lastDoorHeightInches;
      }
    }
  } catch (e) {}

  var p1 = toSidelightTransomChartAxes(panelDoorIn, panelTransomIn);
  var p2 = toSidelightTransomChartAxes(doorHIn, sideWIn);
  return {
    pair1ApiWidth: p1.width,
    pair1ApiHeight: p1.height,
    pair1PanelDoorField: panelDoorIn,
    pair1TransomHeightField: panelTransomIn,
    pair2ApiWidth: p2.width,
    pair2ApiHeight: p2.height,
    pair2DoorHeightField: doorHIn,
    pair2SidelightWidthField: sideWIn
  };
}

/** True when sidelight/transom chart pricing should run (not plain door width×height). */
function isSidelightTransomPricingContext() {
  return isSidelightStyleSelected() || isTransomStyleSelected();
}

/** 1 = transom/panel pair, 2 = sidelight/door-height pair, 0 = not in chart mode. */
function detectBothPairsChangedPair(changedEl) {
  if (!changedEl) return 0;
  var id = String(changedEl.id || '');
  if (id.indexOf('panel-door-width') === 0 || id.indexOf('panel-transom-height') === 0) {
    return isTransomStyleSelected() ? 1 : 0;
  }
  if (id === 'sidelight_width' || id === 'sidelight_width_fraction') {
    return isSidelightStyleSelected() ? 2 : 0;
  }
  if (isDoorHeightSelectId(id) || isExactDoorHeightMeasurementEl(changedEl)) {
    return isSidelightStyleSelected() ? 2 : 0;
  }
  return 0;
}

function resolveBothPairsPriceNoteAnchors(pairIdx, changedEl) {
  var anchors = [];
  function addEl(el) {
    if (!el) return;
    for (var i = 0; i < anchors.length; i++) {
      if (anchors[i] === el) return;
    }
    anchors.push(el);
  }
  if (pairIdx === 1) {
    if (changedEl && detectBothPairsChangedPair(changedEl) === 1) addEl(changedEl);
    addEl(firstVisibleSelect('select[id^="panel-door-width-int"]'));
    addEl(firstVisibleSelect('select[id^="panel-transom-height-int"]'));
  } else if (pairIdx === 2) {
    if (changedEl && detectBothPairsChangedPair(changedEl) === 2) addEl(changedEl);
    addEl(getVisibleDoorHeightSelects().intEl);
    addEl(getVisibleById('sidelight_width') || document.getElementById('sidelight_width'));
  }
  return anchors;
}

/** Update price note for one pair (call when that pair's API returns). */
function showBothPairsPriceNoteForPair(pairIdx, addonAmount, changedEl) {
  try {
    var theme = getThemeOptionTotal();
    var a1 = pairIdx === 1 ? (parseFloat(addonAmount) || 0) : getBothPairsAddonForNote(1);
    var a2 = pairIdx === 2 ? (parseFloat(addonAmount) || 0) : getBothPairsAddonForNote(2);
    var opt = pairIdx === 1 ? a1 : a2;
    var last = pairIdx === 1 ? theme : (theme + a1);
    var total = theme + a1 + a2;
    var anchors = resolveBothPairsPriceNoteAnchors(pairIdx, changedEl);
    for (var i = 0; i < anchors.length; i++) {
      showDoorOptionPriceNote(anchors[i], last, opt, { total: total, showWhenZero: true });
    }
  } catch (e) {}
}

/** Per-pair price notes under each pair's dimension controls. */
function showBothPairsPriceNotes(addon1, addon2, changedEl) {
  try {
    showBothPairsPriceNoteForPair(1, addon1, changedEl);
    showBothPairsPriceNoteForPair(2, addon2, changedEl);
  } catch (e) {}
}

/**
 * Sidelight/transom panel-door-thickness-frac visibility classification.
 * White (hide)  : sw 10-16 × h 82-95 | sw 17-20 × h 82-89
 * Red   (2¼)    : everything else within valid range (sw 10-23, h 82+)
 * Neutral (hide): outside table range
 */
/** Metaobject thickness 2.14 = chart cell requires 2¼" door extra charge. */
var SIDELIGHT_META_THICKNESS_REQUIRES_TWO_QUARTER = 2.14;

/** Read matched thickness from proxy JSON (top-level or best record). */
function extractApiMatchedThicknessFromResponse(json, record) {
  var raw = null;
  if (json) {
    if (json.matched_thickness_raw != null) raw = json.matched_thickness_raw;
    else if (json.matched_thickness != null) raw = json.matched_thickness;
  }
  if (raw == null && record) {
    raw = getFieldFromRecord(record, 'thickness');
    if (raw == null) raw = getFieldFromRecord(record, 'door_thickness');
    if (raw == null) raw = getFieldFromRecord(record, 'matched_thickness_raw');
    if (raw == null) raw = getFieldFromRecord(record, 'matched_thickness');
  }
  var inches = parseThicknessString(raw);
  if (isNaN(inches) && raw != null) inches = parseFloat(raw);
  return { raw: raw, inches: isNaN(inches) ? NaN : inches };
}

/**
 * API response thickness 2.14 → add $880 (slab) or $1100 (prehung).
 * Uses matched record thickness only (not &thickness= query or door dropdown).
 * Dark-pink chart cells always return 2.14 from the proxy when extra 2¼" charge applies.
 */
function computeSidelightDarkPinkThicknessExtra(setup, apiThicknessInches) {
  var apiT = parseFloat(apiThicknessInches);
  if (isNaN(apiT)) apiT = parseThicknessString(apiThicknessInches);
  if (isNaN(apiT) || !approxEq(apiT, SIDELIGHT_META_THICKNESS_REQUIRES_TWO_QUARTER)) return 0;
  return setup === 'pre_hung_on_jamb' ? 1100 : 880;
}

function classifySidelightTransomThicknessBand(sideW, doorH) {
  var sw = parseFloat(sideW);
  var h  = parseFloat(doorH);
  if (isNaN(sw) || isNaN(h) || sw <= 0 || h <= 0) return 'neutral';
  if (sw < 10 || sw > 23 || h < 82) return 'neutral';
  if ((sw >= 10 && sw <= 16) && (h >= 82 && h <= 95)) return 'white';
  if ((sw >= 17 && sw <= 20) && (h >= 82 && h <= 89)) return 'white';
  return 'red';
}

/** Show or hide the row containing #panel-door-thickness-frac. */
function setPanelDoorThicknessFracRowHidden(hidden) {
  try {
    var sels = document.querySelectorAll('#panel-door-thickness-frac, select[id^="panel-door-thickness-frac"]');
    for (var i = 0; i < sels.length; i++) {
      var sel = sels[i];
      if (!sel || !sel.closest) continue;
      var row = sel.closest('.door-measure-dimension-row')
        || sel.closest('.door-measure-dimension-body')
        || sel.closest('.door-option-wrap')
        || sel.parentElement;
      if (row) row.style.display = hidden ? 'none' : '';
    }
  } catch (e) {}
}

/** panel-door-thickness-frac + exact/finished measurement thickness frac (active panel). */
function collectSidelightLinkedThicknessFracSelects() {
  var list = [];
  try {
    mergeUniqueSelectNodesOrdered(list, document.querySelectorAll(
      '#panel-door-thickness-frac, select[id^="panel-door-thickness-frac"]'
    ));
    mergeUniqueSelectNodesOrdered(list, collectActivePanelThicknessSelectsOrdered());
    if (!list.length) mergeUniqueSelectNodesOrdered(list, collectDoorThicknessFracLikeSelectsOrdered());
  } catch (e) {}
  return list;
}

/** Hide/show panel + exact/finished opening thickness rows together. */
function setSidelightLinkedThicknessRowsHidden(hidden) {
  setPanelDoorThicknessFracRowHidden(hidden);
  setThicknessRowHidden(hidden);
}

function restoreSidelightLinkedThicknessSelects() {
  try {
    var sels = collectSidelightLinkedThicknessFracSelects();
    for (var ri = 0; ri < sels.length; ri++) restoreThicknessSelectFromBackupIfPresent(sels[ri]);
  } catch (eR) {}
}

/** Red sidelight/transom chart band: 2¼ only on panel + exact/finished thickness dropdowns. */
function applySidelightRedBandThicknessToLinkedSelects() {
  var fracs = collectSidelightLinkedThicknessFracSelects();
  for (var si = 0; si < fracs.length; si++) reduceThicknessSelectToTwoQuarter(fracs[si]);
  try {
    var panel = getVisibleMeasurementPanelEl();
    if (panel && panel.querySelectorAll) {
      var intSels = panel.querySelectorAll(
        '#exact-door-thickness-int, select[id^="exact-door-thickness-int"],' +
        '#finished-door-thickness-int, select[id^="finished-door-thickness-int"],' +
        '#rough-door-thickness-int, select[id^="rough-door-thickness-int"]'
      );
      for (var ii = 0; ii < intSels.length; ii++) {
        var intEl = intSels[ii];
        if (!intEl || !intEl.options) continue;
        for (var k = 0; k < intEl.options.length; k++) {
          if (intEl.options[k] && String(intEl.options[k].value) === '2') {
            intEl.selectedIndex = k;
            break;
          }
        }
      }
    }
  } catch (eInt) {}
  try { window.__lastDoorThicknessInches = 2.25; } catch (e2) {}
}

/**
 * Re-apply sidelight chart thickness row state after door width/height visibility runs.
 * Keeps #exact-door-thickness-frac in sync with #panel-door-thickness-frac (slab + prehung).
 */
function refreshSidelightLinkedExactThicknessFromChart(changedEl) {
  if (getDoorSurfaceFromTags() !== 'exterior') return;
  if (!isSidelightStyleSelected() && !isTransomStyleSelected()) return;
  var isTransomOnly = isTransomStyleSelected() && !isSidelightStyleSelected();
  if (isTransomOnly) {
    var panelW = readPanelDoorWidthFromDom();
    var transomH = readPanelTransomHeightFromDom();
    if (transomH > 0) updateSidelightPanelThicknessVisibility(transomH, panelW);
    return;
  }
  var sw = readSidelightWidthFromDom();
  var dh = readDoorHeightInchesFromDom(changedEl) || readDoorHeightFromDom();
  if (sw > 0 && dh > 0) updateSidelightPanelThicknessVisibility(sw, dh);
}

/**
 * Update sidelight/transom chart thickness UI:
 * #panel-door-thickness-frac and #exact-door-thickness-frac (active Exact/Finished panel).
 * White/neutral → hide + restore options. Red → show, 2¼ only, pre-select 2¼.
 */
function updateSidelightPanelThicknessVisibility(sideW, doorH) {
  var band = classifySidelightTransomThicknessBand(sideW, doorH);
  if (band !== 'red') {
    setSidelightLinkedThicknessRowsHidden(true);
    ensureExactDoorThicknessFracRowVisible();
    restoreSidelightLinkedThicknessSelects();
    applyAddonToEstimatedPriceKey(0, 'sidelightPanelThickness');
    return;
  }
  setSidelightLinkedThicknessRowsHidden(false);
  applySidelightRedBandThicknessToLinkedSelects();
  applyAddonToEstimatedPriceKey(0, 'sidelightPanelThickness');
}

/**
 * Returns true when all four dimension elements for both the sidelight pair
 * (sidelight_width × door_height) and the transom-panel pair
 * (panel-door-width-int × panel-transom-height-int) are simultaneously
 * visible in the DOM — meaning the user has both sections open at once.
 */
function areBothSidelightTransomPairsVisible() {
  try {
    var tranHEl = firstVisibleSelect('select[id^="panel-transom-height-int"]');
    var panWEl  = firstVisibleSelect('select[id^="panel-door-width-int"]');
    var sideWEl = getVisibleById('sidelight_width') || document.getElementById('sidelight_width');
    var doorHEl = getVisibleDoorHeightSelects().intEl;
    var ok = isElementVisible(tranHEl) && isElementVisible(panWEl)
      && isElementVisible(sideWEl) && isElementVisible(doorHEl);
    if (!ok) {
      if (window.DOOR_PRICE_DEBUG) {
        console.log('[door-pricing] both-pairs visible check', {
          transomH: !!(tranHEl && isElementVisible(tranHEl)),
          panelW: !!(panWEl && isElementVisible(panWEl)),
          sidelightW: !!(sideWEl && isElementVisible(sideWEl)),
          doorH: !!(doorHEl && isElementVisible(doorHEl))
        });
      }
    }
    return ok;
  } catch (e) {}
  return false;
}

function shouldUseBothPairsCombinedPricing(changedEl) {
  // Both chart addons (transom pair + sidelight pair) whenever both styles are active.
  return isSidelightStyleSelected() && isTransomStyleSelected();
}

function shouldRunSidelightTransomPricing(changedEl) {
  return isSidelightTransomPricingContext();
}

/**
 * Combined oversized pricing for the "both pairs visible" scenario:
 *   Pair 1 – #panel-door-width-int* + #panel-transom-height-int* (axes auto: width 10–23, height 82+)
 *   Pair 2 – #door_height + #sidelight_width         (same chart axis rules)
 *
 * Each pair keeps its own add-on. Changing one pair replaces only that pair's add-on;
 * total = base + pair1Addon + pair2Addon.
 */
function applyBothPairsCombinedOversizedAddon(changedEl) {
  var setup = getDoorSetupFromDom();
  var pfx = setup === 'slab_only'
    ? 'sidelights_or_transoms_slabs_oversized'
    : 'sidelights_or_transoms_prehung_oversized';

  var carriedP1 = getPersistedPairAddon(1);
  if (carriedP1 > 0) window.__bothPairsLastAddon1 = carriedP1;
  var carriedP2 = getPersistedPairAddon(2);
  if (carriedP2 > 0) window.__bothPairsLastAddon2 = carriedP2;

  var dims = readBothPairsDimensions(changedEl);
  var pairChanged = detectBothPairsChangedPair(changedEl);
  if (window.DOOR_PRICE_DEBUG) {
    console.log('[door-pricing] both-pairs dims', {
      pair1: {
        panelDoorField: dims.pair1PanelDoorField,
        transomHeightField: dims.pair1TransomHeightField,
        apiWidth: dims.pair1ApiWidth,
        apiHeight: dims.pair1ApiHeight
      },
      pair2: {
        doorHeightField: dims.pair2DoorHeightField,
        sidelightWidthField: dims.pair2SidelightWidthField,
        apiWidth: dims.pair2ApiWidth,
        apiHeight: dims.pair2ApiHeight
      },
      pairChanged: pairChanged,
      changedEl: changedEl && changedEl.id
    });
  }

  var selectedThickness = (typeof window.__lastDoorThicknessInches === 'number' ? window.__lastDoorThicknessInches : 0)
                          || readPanelDoorThicknessFromDom()
                          || readThicknessFromDom();

  // Stale-response guard
  window.__bothPairsFetchGen = (window.__bothPairsFetchGen || 0) + 1;
  var myGen = window.__bothPairsFetchGen;

  function inR(x, a, b) { return x >= a && x <= b; }

  function resolveBkt(w, h) {
    var wi = Math.round(parseFloat(w));
    var hi = Math.round(parseFloat(h));
    if (isNaN(wi) || isNaN(hi)) return null;
    if (inR(wi, 10, 16)) {
      if (hi === 82)            return { wMin: 10, wMax: 16, hMin: 82,  hMax: 82  };
      if (inR(hi, 83, 89))     return { wMin: 10, wMax: 16, hMin: 83,  hMax: 89  };
      if (inR(hi, 90, 95))     return { wMin: 10, wMax: 16, hMin: 90,  hMax: 95  };
      if (inR(hi, 96, 100))    return { wMin: 10, wMax: 16, hMin: 96,  hMax: 100 };
      if (inR(hi, 101, 106))   return { wMin: 10, wMax: 16, hMin: 101, hMax: 106 };
      if (inR(hi, 107, 112))   return { wMin: 10, wMax: 16, hMin: 107, hMax: 112 };
    }
    if (inR(wi, 17, 20)) {
      if (hi === 82)            return { wMin: 17, wMax: 20, hMin: 82,  hMax: 82  };
      if (inR(hi, 83, 89))     return { wMin: 17, wMax: 20, hMin: 83,  hMax: 89  };
      if (inR(hi, 90, 95))     return { wMin: 17, wMax: 20, hMin: 90,  hMax: 95  };
      if (inR(hi, 96, 100))    return { wMin: 17, wMax: 20, hMin: 96,  hMax: 100 };
      if (inR(hi, 101, 106))   return { wMin: 17, wMax: 20, hMin: 101, hMax: 106 };
      if (inR(hi, 107, 112))   return { wMin: 17, wMax: 20, hMin: 107, hMax: 112 };
    }
    if (inR(wi, 21, 23)) {
      if (hi === 82)            return { wMin: 21, wMax: 23, hMin: 82,  hMax: 82  };
      if (inR(hi, 83, 89))     return { wMin: 21, wMax: 23, hMin: 83,  hMax: 89  };
      if (inR(hi, 90, 95))     return { wMin: 21, wMax: 23, hMin: 90,  hMax: 95  };
      if (inR(hi, 96, 100))    return { wMin: 21, wMax: 23, hMin: 96,  hMax: 100 };
    }
    return null;
  }

  function cellPx(b) {
    var k = b.wMin + '_' + b.wMax + '_' + b.hMin + '_' + b.hMax;
    var tbl = setup === 'slab_only'
      ? { '10_16_82_82':0,   '10_16_83_89':75,  '10_16_90_95':100, '10_16_96_100':150, '10_16_101_106':200, '10_16_107_112':400,
          '17_20_82_82':75,  '17_20_83_89':100, '17_20_90_95':150, '17_20_96_100':200, '17_20_101_106':300, '17_20_107_112':500,
          '21_23_82_82':150, '21_23_83_89':200, '21_23_90_95':300, '21_23_96_100':400 }
      : { '10_16_82_82':0,   '10_16_83_89':125, '10_16_90_95':200, '10_16_96_100':300, '10_16_101_106':450, '10_16_107_112':600,
          '17_20_82_82':125, '17_20_83_89':200, '17_20_90_95':300, '17_20_96_100':450, '17_20_101_106':600, '17_20_107_112':750,
          '21_23_82_82':200, '21_23_83_89':300, '21_23_90_95':450, '21_23_96_100':600 };
    return tbl[k] != null ? tbl[k] : 0;
  }

  // Fetch addon for a single pair; apiWidth/apiHeight are sent as API ?width=&height=.
  function fetchPairAddon(apiWidth, apiHeight) {
    var bkt = resolveBkt(apiWidth, apiHeight);
    var baseAmt = bkt ? cellPx(bkt) : 0;
    var wKey = bkt
      ? (pfx + '_' + bkt.wMin + '_' + bkt.wMax + '_' + bkt.hMin + '_' + bkt.hMax)
      : '';
    if (window.DOOR_PRICE_DEBUG) {
      console.log('[door-pricing] API request', { prefix: pfx, width: apiWidth, height: apiHeight, thickness: selectedThickness });
    }
    return fetchPricingRuleIntExtRangeMatchesViaProxy(pfx, apiWidth, apiHeight, selectedThickness)
      .then(function (json) {
        var records = json && Array.isArray(json.records) ? json.records : [];
        var wNorm = norm(wKey);
        var best = null;
        if (wKey) {
          for (var i = 0; i < records.length; i++) {
            var r = records[i] || {};
            if (norm(getFieldFromRecord(r, 'title')) === wNorm
                || norm(getFieldFromRecord(r, 'table_key')) === wNorm
                || norm(getFieldFromRecord(r, 'key')) === wNorm) {
              best = r; break;
            }
          }
        }
        if (!best && records[0]) best = records[0];
        var thkInfo = extractApiMatchedThicknessFromResponse(json, best);
        var extra = computeSidelightDarkPinkThicknessExtra(setup, thkInfo.inches);
        if (extra > 0 && window.DOOR_PRICE_DEBUG) {
          console.log('[door-pricing] sidelight thickness extra', {
            apiThickness: thkInfo.inches, selectedThickness: selectedThickness, extra: extra
          });
        }
        return (parseFloat(baseAmt) || 0) + extra;
      })
      .catch(function () { return 0; });
  }

  function fetchOnePairAddon(pairIdx, apiWidth, apiHeight) {
    if (apiWidth > 0 && apiHeight > 0) {
      return fetchPairAddon(apiWidth, apiHeight).then(function (amt) {
        if (window.__bothPairsFetchGen !== myGen) return getPersistedPairAddon(pairIdx);
        var n = parseFloat(amt) || 0;
        if (pairIdx === 1) window.__bothPairsLastAddon1 = n;
        else window.__bothPairsLastAddon2 = n;
        showBothPairsPriceNoteForPair(pairIdx, n, changedEl);
        return n;
      });
    }
    return Promise.resolve(getPersistedPairAddon(pairIdx));
  }

  // Only re-fetch the pair the user changed; keep the other pair's last add-on.
  var pair1Promise;
  var pair2Promise;
  if (pairChanged === 1) {
    pair1Promise = fetchOnePairAddon(1, dims.pair1ApiWidth, dims.pair1ApiHeight);
    pair2Promise = Promise.resolve(getPersistedPairAddon(2));
  } else if (pairChanged === 2) {
    pair1Promise = Promise.resolve(getPersistedPairAddon(1));
    pair2Promise = fetchOnePairAddon(2, dims.pair2ApiWidth, dims.pair2ApiHeight);
  } else {
    pair1Promise = fetchOnePairAddon(1, dims.pair1ApiWidth, dims.pair1ApiHeight);
    pair2Promise = fetchOnePairAddon(2, dims.pair2ApiWidth, dims.pair2ApiHeight);
  }

  Promise.all([pair1Promise, pair2Promise]).then(function (results) {
    if (window.__bothPairsFetchGen !== myGen) return; // stale – discard
    var addon1 = parseFloat(results[0]) || 0; // pair 1: panel-width × transom-height
    var addon2 = parseFloat(results[1]) || 0; // pair 2: door-height × sidelight-width
    applyBothPairsAddonsToPrice(addon1, addon2, {
      onlyPair: pairChanged === 1 ? 1 : (pairChanged === 2 ? 2 : 0)
    });
    showBothPairsPriceNotes(addon1, addon2, changedEl);
  }).catch(function () {
    if (window.__bothPairsFetchGen !== myGen) return;
    window['__doorAddon_sidelightTransomOversizedPair1'] = 0;
    window['__doorAddon_sidelightTransomOversizedPair2'] = 0;
    window['__doorAddon_sidelightTransomOversized'] = 0;
    _syncDoorEstimatedPriceDisplay();
  });
}

function applySidelightTransomOversizedAddon(changedEl) {
  if (isScreenAndStormDoorsProductType()) return;
  function isTransomPanelCase(el) {
    var id = String(el && el.id || '');
    var isSlabTransomPanelSelect = !!(
      el
      && el.tagName === 'SELECT'
      && el.closest
      && el.closest('.door-measurement-slab-transom-panels')
    );
    return id === 'panel-transom-height-int'
      || id === 'panel-transom-height-frac'
      || id.indexOf('panel-transom-height-int') === 0
      || id.indexOf('panel-transom-height-frac') === 0
      || id.indexOf('panel-door-width-int') === 0
      || id.indexOf('panel-door-width-frac') === 0
      || id.indexOf('panel-door-thickness-frac') === 0
      || isSlabTransomPanelSelect;
  }
  // When sidelight_style is selected (even alongside transom_style), always use the sidelight
  // path (sidelight_width + door_height). The transom path is only for the transom-panel-only
  // configuration where no sidelight style is chosen.
  var isTransomCase = (isTransomPanelCase(changedEl) || isTransomStyleSelected())
    && !isSidelightStyleSelected();
  function readPanelDoorWidthFromScope(scope) {
    try {
      if (!scope) return 0;
      var intEl = firstVisibleInScope(scope, 'select[id^="panel-door-width-int"]');
      var fracEl = firstVisibleInScope(scope, 'select[id^="panel-door-width-frac"]');
      if (intEl) return readPanelDoorWidthFromSelectEl(intEl);
      return readIntFracPairFromSelect(intEl, fracEl);
    } catch (e) {}
    return 0;
  }
  function readPanelDoorThicknessFromScope(scope) {
    try {
      if (!scope || !scope.querySelector) return 0;
      var el = scope.querySelector('#panel-door-thickness-frac, select[id^="panel-door-thickness-frac"]');
      if (!el || el.value == null || String(el.value).trim() === '') return 0;
      var parsed = parseThicknessString(el.value);
      if (!isNaN(parsed) && parsed > 0) return parsed;
      var parsed2 = parseDropdownNumber(el.value);
      return isNaN(parsed2) ? 0 : parsed2;
    } catch (e) {}
    return 0;
  }
  function readExactDoorWidthFromDomSafe() {
    try {
      var wPair = getVisibleDoorWidthSelects();
      var intEl = wPair.intEl;
      var fracEl = wPair.fracEl;
      if (!intEl && !fracEl) return 0;
      return toNum(intEl && intEl.value) + parseDropdownNumber(fracEl && fracEl.value);
    } catch (e) {}
    return 0;
  }

  if (!shouldRunSidelightTransomPricing(changedEl)) {
    applyAddonToEstimatedPriceKey(0, 'sidelightTransomOversized');
    updateSidelightPanelThicknessVisibility(0, 0);
    return;
  }

  var setup = getDoorSetupFromDom();
  var isBothPairsDim = detectBothPairsChangedPair(changedEl) > 0;
  if (setup !== 'slab_only' && setup !== 'pre_hung_on_jamb' && !isBothPairsDim) {
    try {
      if (window.DOOR_PRICE_DEBUG) console.log('[sidelightOversized] setup not selected', { setup: setup });
    } catch (eSetup) {}
    applyAddonToEstimatedPriceKey(0, 'sidelightTransomOversized');
    updateSidelightPanelThicknessVisibility(0, 0);
    return;
  }

  // ── Both-pairs mode: panel-width×transom-height + door-height×sidelight-width ──
  if (shouldUseBothPairsCombinedPricing(changedEl)) {
    applyBothPairsCombinedOversizedAddon(changedEl);
    return;
  }
  // ─────────────────────────────────────────────────────────────────────────
  try {
    window['__doorAddon_sidelightTransomOversizedPair1'] = 0;
    window['__doorAddon_sidelightTransomOversizedPair2'] = 0;
  } catch (eClrPairs) {}

  var sideW = 0;
  var transomPanelScope = null;
  try {
    transomPanelScope = changedEl && changedEl.closest ? changedEl.closest('.door-measurement-slab-transom-panels') : null;
  } catch (eScope) {}
  if (isTransomCase) {
    sideW = readPanelTransomHeightFromEventTarget(changedEl) || readPanelTransomHeightFromDom();
  } else {
    try {
      if (changedEl && (changedEl.id === 'sidelight_width' || changedEl.id === 'sidelight_width_fraction')) {
        sideW = readSidelightWidthFromEventTarget(changedEl);
      }
    } catch (eSW) {}
    if (!sideW) sideW = readSidelightWidthFromDom();
  }
  // Width > 23″: base + current wood (replaces on wood change); skip chart API.
  if (!isTransomCase && sideW > 23) {
    applyWideSidelightBasePlusWoodAddon(changedEl);
    updateSidelightPanelThicknessVisibility(0, 0);
    return;
  }
  if (!isTransomCase && sideW > 0 && sideW <= 23) {
    applyAddonToEstimatedPriceKey(0, 'sidelightTransomOversized');
    _syncDoorEstimatedPriceDisplay();
  }
  var root = closestRootForMeasurement(changedEl) || document;
  var doorH = 0;
  if (isTransomCase) {
    if (setup === 'pre_hung_on_jamb') {
      // Prehung transom path uses exact door width controls.
      doorH =
        readExactDoorWidthFromDomSafe()
        || readPanelDoorWidthFromEventTarget(changedEl)
        || readPanelDoorWidthFromScope(transomPanelScope)
        || readPanelDoorWidthFromDom();
    } else {
      doorH =
        readPanelDoorWidthFromEventTarget(changedEl)
        || readPanelDoorWidthFromScope(transomPanelScope)
        || readPanelDoorWidthFromDom();
    }
  } else {
    doorH =
      readDoorHeightFromEventTarget(changedEl)
      || readDoorHeightInchesFromDom(changedEl)
      || (typeof window.__lastDoorHeightInchesRaw === 'number' && window.__lastDoorHeightInchesRaw > 0
        ? window.__lastDoorHeightInchesRaw : 0)
      || (typeof window.__lastDoorHeightInches === 'number' ? window.__lastDoorHeightInches : 0)
      || readDoorHeightFromDom(root)
      || readDoorHeightFromDom();
  }
  if (!sideW || !doorH) {
    try {
      if (window.DOOR_PRICE_DEBUG) console.log('[sidelightOversized] missing measurements', { sideW: sideW, doorH: doorH });
    } catch (eM) {}
    applyAddonToEstimatedPriceKey(0, 'sidelightTransomOversized');
    updateSidelightPanelThicknessVisibility(0, 0);
    return;
  }

  // Sidelight: update thickness visibility synchronously.
  // Transom: store dims and update AFTER the API responds, so our show/hide is the last operation
  // (other synchronous code can't override it).
  var tPanelWidth = 0;
  var tTransomHeight = 0;
  if (!isTransomCase) {
    updateSidelightPanelThicknessVisibility(sideW, doorH);
  } else {
    tPanelWidth = readPanelDoorWidthFromEventTarget(changedEl)
      || readPanelDoorWidthFromScope(transomPanelScope)
      || readPanelDoorWidthFromDom();
    tTransomHeight = readPanelTransomHeightFromEventTarget(changedEl)
      || readPanelTransomHeightFromDom();
  }

  // Read selected thickness; this should NOT block normal-range pricing.
  // 2.25 is only used for the dark-pink extra add-on.
  var selectedThickness =
    (typeof window.__lastDoorThicknessInches === 'number' ? window.__lastDoorThicknessInches : 0)
    || (isTransomCase
      ? (readPanelDoorThicknessFromEventTarget(changedEl) || readPanelDoorThicknessFromScope(transomPanelScope) || readPanelDoorThicknessFromDom())
      : 0)
    || readThicknessFromDom(root)
    || readThicknessFromDom()
    || readThicknessAnyFromPanel(root);

  // For chart-based sidelight pricing we only apply for Exterior Doors (existing behavior).
  var surface = getDoorSurfaceFromTags();
  if (surface !== 'exterior') {
    try {
      if (window.DOOR_PRICE_DEBUG) console.log('[sidelightOversized] not exterior door (chart path)', { surface: surface });
    } catch (eSurf) {}
    applyAddonToEstimatedPriceKey(0, 'sidelightTransomOversized');
    return;
  }

  function inRange(x, a, b) { return x >= a && x <= b; }

  // Resolve the "bucket" key based on the chart ranges.
  // (We round because these selects are inch-based; fractions shouldn't change the bucket.)
  function resolveOversizedBucket(w, h) {
    var wi = Math.round(parseFloat(w));
    var hi = Math.round(parseFloat(h));
    if (isNaN(wi) || isNaN(hi)) return null;

    // 10–16
    if (inRange(wi, 10, 16)) {
      if (hi === 82) return { wMin: 10, wMax: 16, hMin: 82, hMax: 82 };
      if (inRange(hi, 83, 89)) return { wMin: 10, wMax: 16, hMin: 83, hMax: 89 };
      if (inRange(hi, 90, 95)) return { wMin: 10, wMax: 16, hMin: 90, hMax: 95 };
      if (inRange(hi, 96, 100)) return { wMin: 10, wMax: 16, hMin: 96, hMax: 100 };
      if (inRange(hi, 101, 106)) return { wMin: 10, wMax: 16, hMin: 101, hMax: 106 };
      if (inRange(hi, 107, 112)) return { wMin: 10, wMax: 16, hMin: 107, hMax: 112 };
      return null;
    }

    // 17–20
    if (inRange(wi, 17, 20)) {
      if (hi === 82) return { wMin: 17, wMax: 20, hMin: 82, hMax: 82 };
      if (inRange(hi, 83, 89)) return { wMin: 17, wMax: 20, hMin: 83, hMax: 89 };
      if (inRange(hi, 90, 95)) return { wMin: 17, wMax: 20, hMin: 90, hMax: 95 };
      if (inRange(hi, 96, 100)) return { wMin: 17, wMax: 20, hMin: 96, hMax: 100 };
      if (inRange(hi, 101, 106)) return { wMin: 17, wMax: 20, hMin: 101, hMax: 106 };
      if (inRange(hi, 107, 112)) return { wMin: 17, wMax: 20, hMin: 107, hMax: 112 };
      return null;
    }

    // 21–23
    if (inRange(wi, 21, 23)) {
      if (hi === 82) return { wMin: 21, wMax: 23, hMin: 82, hMax: 82 };
      if (inRange(hi, 83, 89)) return { wMin: 21, wMax: 23, hMin: 83, hMax: 89 };
      if (inRange(hi, 90, 95)) return { wMin: 21, wMax: 23, hMin: 90, hMax: 95 };
      if (inRange(hi, 96, 100)) return { wMin: 21, wMax: 23, hMin: 96, hMax: 100 };
      return null;
    }

    return null;
  }

  var bucket = resolveOversizedBucket(sideW, doorH);
  if (!bucket) {
    try {
      if (window.DOOR_PRICE_DEBUG) console.log('[sidelightOversized] no bucket', { sideW: sideW, doorH: doorH });
    } catch (eB) {}
    applyAddonToEstimatedPriceKey(0, 'sidelightTransomOversized');
    // Fetch won't run — apply transom thickness visibility now.
    if (isTransomCase) updateSidelightPanelThicknessVisibility(tTransomHeight, tPanelWidth);
    return;
  }

  var pfx = setup === 'slab_only'
    ? 'sidelights_or_transoms_slabs_oversized'
    : 'sidelights_or_transoms_prehung_oversized';

  var wantedKey =
    pfx
    + '_' + bucket.wMin + '_' + bucket.wMax
    + '_' + bucket.hMin + '_' + bucket.hMax;

  // Call proxy with thickness param (2.25) and only apply if matched entry has thickness 2.14.
  try {
    if (window.DOOR_PRICE_DEBUG) console.log('[sidelightOversized] fetching', { prefix: pfx, sideW: sideW, doorH: doorH, selectedThickness: selectedThickness, wantedKey: wantedKey });
  } catch (eF) {}
  var chartSideW = sideW;
  var chartDoorH = doorH;
  if (isTransomCase) {
    var p1Axes = toSidelightTransomChartAxes(sideW, doorH);
    chartSideW = p1Axes.width;
    chartDoorH = p1Axes.height;
  } else {
    var p2Axes = toSidelightTransomChartAxes(sideW, doorH);
    chartSideW = p2Axes.width;
    chartDoorH = p2Axes.height;
  }
  fetchPricingRuleIntExtRangeMatchesViaProxy(pfx, chartSideW, chartDoorH, selectedThickness)
    .then(function (json) {
      // Show/hide transom thickness dropdown after API responds so it's never overridden by sync code.
      if (isTransomCase) updateSidelightPanelThicknessVisibility(tTransomHeight, tPanelWidth);

      var records = json && Array.isArray(json.records) ? json.records : [];
      var wantedNorm = norm(wantedKey);

      var best = null;
      for (var i = 0; i < records.length; i++) {
        var r = records[i] || {};
        var t1 = getFieldFromRecord(r, 'title');
        var t2 = getFieldFromRecord(r, 'table_key');
        var t3 = getFieldFromRecord(r, 'key');
        if (norm(t1) === wantedNorm || norm(t2) === wantedNorm || norm(t3) === wantedNorm) {
          best = r;
          break;
        }
      }
      if (!best && records[0]) best = records[0];

      // Base (cell) price comes from the chart bucket (entry price does not matter).
      function chartCellPrice(setupKey, b) {
        var slab = setupKey === 'slab_only';
        var k = String(b.wMin) + '_' + String(b.wMax) + '_' + String(b.hMin) + '_' + String(b.hMax);
        var table = slab
          ? ({
              '10_16_82_82': 0,   '10_16_83_89': 75,  '10_16_90_95': 100, '10_16_96_100': 150, '10_16_101_106': 200, '10_16_107_112': 400,
              '17_20_82_82': 75,  '17_20_83_89': 100, '17_20_90_95': 150, '17_20_96_100': 200, '17_20_101_106': 300, '17_20_107_112': 500,
              '21_23_82_82': 150, '21_23_83_89': 200, '21_23_90_95': 300, '21_23_96_100': 400
            })
          : ({
              '10_16_82_82': 0,   '10_16_83_89': 125, '10_16_90_95': 200, '10_16_96_100': 300, '10_16_101_106': 450, '10_16_107_112': 600,
              '17_20_82_82': 125, '17_20_83_89': 200, '17_20_90_95': 300, '17_20_96_100': 450, '17_20_101_106': 600, '17_20_107_112': 750,
              '21_23_82_82': 200, '21_23_83_89': 300, '21_23_90_95': 450, '21_23_96_100': 600
            });
        return table[k] != null ? table[k] : 0;
      }

      // Dark-pink bucket detection:
      // - 10–16 and 96–112
      // - 17–20 and 90–112
      // - 21–23 and 82–100
      function isDarkPinkBucket(b) {
        if (!b) return false;
        if (b.wMin === 10 && b.wMax === 16) return b.hMin >= 96 && b.hMax <= 112;
        if (b.wMin === 17 && b.wMax === 20) return b.hMin >= 90 && b.hMax <= 112;
        if (b.wMin === 21 && b.wMax === 23) return b.hMin >= 82 && b.hMax <= 100;
        return false;
      }

      var cellAddon = chartCellPrice(setup, bucket);
      var thkInfo = extractApiMatchedThicknessFromResponse(json, best);
      var thicknessExtra = computeSidelightDarkPinkThicknessExtra(setup, thkInfo.inches);
      if (thicknessExtra <= 0 && isDarkPinkBucket(bucket) && window.DOOR_PRICE_DEBUG) {
        try {
          console.log('[sidelightOversized] dark-pink cell without thickness extra', {
            selectedThickness: selectedThickness,
            apiThickness: thkInfo.inches,
            apiThicknessRaw: thkInfo.raw
          });
        } catch (eET2) {}
      }

      var addon = (parseFloat(cellAddon) || 0) + (parseFloat(thicknessExtra) || 0);

      var prevSideAddon = getSidelightTransomAddonTotal();
      var lastSl = readLastPriceBeforeReplacingAddon(prevSideAddon);
      var bothStyles = isSidelightStyleSelected() && isTransomStyleSelected();
      alertSidelightChartAddonParts(cellAddon, thicknessExtra, isTransomCase);

      if (bothStyles) {
        if (isTransomCase) {
          window.__bothPairsLastAddon1 = addon;
          applyBothPairsAddonsToPrice(addon, getPersistedPairAddon(2), { onlyPair: 1, skipAlert: true });
          showBothPairsPriceNoteForPair(1, addon, changedEl);
          showBothPairsPriceNoteForPair(2, getBothPairsAddonForNote(2), changedEl);
        } else {
          window.__bothPairsLastAddon2 = addon;
          applyBothPairsAddonsToPrice(getPersistedPairAddon(1), addon, { onlyPair: 2, skipAlert: true });
          showBothPairsPriceNoteForPair(1, getBothPairsAddonForNote(1), changedEl);
          showBothPairsPriceNoteForPair(2, addon, changedEl);
        }
      } else {
        applyAddonToEstimatedPriceKey(addon, 'sidelightTransomOversized', { skipAlert: true });
        showDoorOptionPriceNote(changedEl, lastSl, addon, {
          total: lastSl + addon,
          showWhenZero: true,
          context: 'sidelightTransomOversized'
        });
      }

      // Sync panel + exact/finished thickness rows with chart band (same as sidelight path).
      if (isTransomCase) {
        updateSidelightPanelThicknessVisibility(tTransomHeight, tPanelWidth);
        var apiThk = extractApiMatchedThicknessFromResponse(json, best);
        if (approxEq(apiThk.inches, SIDELIGHT_META_THICKNESS_REQUIRES_TWO_QUARTER)) {
          applySidelightRedBandThicknessToLinkedSelects();
        }
      } else {
        updateSidelightPanelThicknessVisibility(sideW, doorH);
        var apiThkSide = extractApiMatchedThicknessFromResponse(json, best);
        if (approxEq(apiThkSide.inches, SIDELIGHT_META_THICKNESS_REQUIRES_TWO_QUARTER)) {
          applySidelightRedBandThicknessToLinkedSelects();
        }
      }
    })
    .catch(function () {
      applyAddonToEstimatedPriceKey(0, 'sidelightTransomOversized');
      if (isTransomCase) {
        updateSidelightPanelThicknessVisibility(tTransomHeight, tPanelWidth);
      } else if (sideW > 0 && doorH > 0) {
        updateSidelightPanelThicknessVisibility(sideW, doorH);
      } else {
        setSidelightLinkedThicknessRowsHidden(true);
      }
    });
}

function readWidthFromDom() {
  return readDoorWidthInchesFromDom();
}

function readHeightFromDom() {
  return readDoorHeightInchesFromDom();
}

function isScreenAndStormDoorsProductType() {
  try {
    if (window.PriceScreenStorm && typeof window.PriceScreenStorm.isScreenAndStormDoorsProductType === 'function') {
      return !!window.PriceScreenStorm.isScreenAndStormDoorsProductType();
    }
    var container = document.getElementById('door-configurator');
    if (!container) return false;
    var productType = String(container.getAttribute('data-product-type') || '').trim();
    if (norm(productType) === 'screen_and_storm_doors') return true;
    var tagsAttr = container.getAttribute('data-product-tags') || '';
    var tags = [];
    try {
      tags = Array.isArray(JSON.parse(tagsAttr)) ? JSON.parse(tagsAttr) : [];
    } catch (eTags) {
      tags = String(tagsAttr || '').split('|');
    }
    for (var i = 0; i < tags.length; i++) {
      var t = norm(tags[i]);
      if (t === 'screen_and_storm_doors' || t === 'screen_and_storm_doors_tags') return true;
    }
  } catch (e) {}
  return false;
}

function getDoorSurface() {
  try {
    var container = document.getElementById('door-configurator');
    if (!container) return null;
    var tagsAttr = container.getAttribute('data-product-tags') || '';
    var tags = [];
    try {
      var parsed = typeof tagsAttr === 'string' && tagsAttr.trim() ? JSON.parse(tagsAttr) : [];
      tags = Array.isArray(parsed)
        ? parsed.map(function (t) { return String(t).trim().toLowerCase(); }).filter(Boolean)
        : [];
    } catch (eTags) {
      tags = String(tagsAttr || '').split('|').map(function (t) { return String(t).trim().toLowerCase(); }).filter(Boolean);
    }
    for (var i = 0; i < tags.length; i++) {
      var t = norm(tags[i]);
      if (t === 'interior_doors' || t === 'interior_doors_tags' || t === 'interior_tags') return 'interior';
      if (t === 'exterior_doors' || t === 'exterior_doors_tags' || t === 'exterior_tags') return 'exterior';
      if (t === 'interior_doors_tag') return 'interior';
      if (t === 'exterior_doors_tag') return 'exterior';
    }
    if (tags.indexOf('interior') !== -1) return 'interior';
    if (tags.indexOf('exterior') !== -1) return 'exterior';
    var productType = container.getAttribute('data-product-type') || '';
    productType = String(productType || '').toLowerCase();
    if (productType.indexOf('interior') !== -1) return 'interior';
    if (productType.indexOf('exterior') !== -1) return 'exterior';
  } catch (e) {}
  return null;
}

function anySelectedValueEquals(targetValue, config, schema) {
  var targetNorm = norm(targetValue);
  try {
    if (config && schema && Array.isArray(schema)) {
      for (var i = 0; i < schema.length; i++) {
        var opt = schema[i];
        if (!opt || !opt.id) continue;
        var selected = config[opt.id];
        if (Array.isArray(selected)) {
          for (var j = 0; j < selected.length; j++) {
            if (norm(selected[j]) === targetNorm) return true;
          }
        } else {
          if (norm(selected) === targetNorm) return true;
        }
      }
    }
  } catch (eCfg) {}
  // Fallback DOM scan
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
      } else {
        if (norm(el.value) === targetNorm) return true;
      }
    }
  } catch (eDom) {}
  return false;
}

function anySelectedChoiceValueEquals(targetChoiceValue) {
  // Detects selection by looking for UI wrappers like:
  // <div class="common-check-option" data-choice-value="slab_only"> ... <input checked> ...
  // We prefer this when available because some UI selections don't store exact string values in inputs.
  var want = norm(targetChoiceValue);
  try {
    var optionsContainer = document.getElementById('door-configurator-options');
    if (!optionsContainer) return false;
    var nodes = optionsContainer.querySelectorAll('[data-choice-value]');
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (!node) continue;
      var cv = node.getAttribute('data-choice-value');
      if (norm(cv) !== want) continue;
      // checked input inside wrapper
      var checked = node.querySelector('input[type="radio"]:checked, input[type="checkbox"]:checked');
      if (checked) return true;
      // aria-checked for custom controls
      var aria = (node.getAttribute('aria-checked') || '').toLowerCase();
      if (aria === 'true') return true;
      // selected option inside wrapper (if wrapper contains a select)
      var sel = node.querySelector('select');
      if (sel && sel.value != null && sel.value !== '') return true;
    }
  } catch (e) {}
  return false;
}

function getPricingRuleIntExtRecords() {
  try {
    if (Array.isArray(window.pricing_rule_int_ext)) return window.pricing_rule_int_ext;
    if (typeof window.pricing_rule_int_ext === 'string' && window.pricing_rule_int_ext.trim()) {
      try {
        var raw1 = JSON.parse(window.pricing_rule_int_ext);
        var data1 = typeof raw1 === 'string' ? JSON.parse(raw1) : raw1;
        if (Array.isArray(data1)) return data1;
      } catch (e1) {}
    }
    if (Array.isArray(window.pricingRuleIntExt)) return window.pricingRuleIntExt;
    if (typeof window.pricingRuleIntExt === 'string' && window.pricingRuleIntExt.trim()) {
      try {
        var raw2 = JSON.parse(window.pricingRuleIntExt);
        var data2 = typeof raw2 === 'string' ? JSON.parse(raw2) : raw2;
        if (Array.isArray(data2)) return data2;
      } catch (e2) {}
    }
    var el = document.getElementById('door-configurator-pricing-rule-int-ext');
    if (el) {
      var txt = String(el.textContent || '').trim();
      if (txt) {
        var raw = JSON.parse(txt);
        var data = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (Array.isArray(data)) return data;
      }
    }
  } catch (e) {}
  return [];
}

// Storefront API fetch removed (proxy PHP is used instead).

function findPricingRuleMatch(records, key, width, height) {
  var want = norm(key);
  for (var i = 0; i < records.length; i++) {
    var r = records[i] || {};
    var rk =
      r.key != null ? r.key
      : (r.title != null ? r.title
      : (r.type != null ? r.type
      : (r.value != null ? r.value : '')));
    // Do not require an exact string match: sometimes the record contains extra text around the key.
    var got = norm(rk);
    if (got.indexOf(want) === -1 && want.indexOf(got) === -1) continue;

    var wMin = r.width_min != null ? r.width_min : (r.widthMin != null ? r.widthMin : r.min_width);
    var wMax = r.width_max != null ? r.width_max : (r.widthMax != null ? r.widthMax : r.max_width);
    var hMin = r.height_min != null ? r.height_min : (r.heightMin != null ? r.heightMin : r.min_height);
    var hMax = r.height_max != null ? r.height_max : (r.heightMax != null ? r.heightMax : r.max_height);
    if (wMin != null && width < toNum(wMin)) continue;
    if (wMax != null && width > toNum(wMax)) continue;
    if (hMin != null && height < toNum(hMin)) continue;
    if (hMax != null && height > toNum(hMax)) continue;

    var p = r.price != null ? r.price : (r.price_value != null ? r.price_value : r.amount);
    var parsed = parseFloat(p);
    var price = isNaN(parsed) ? 0 : parsed;
    return { row: r, price: price };
  }
  return { row: null, price: 0 };
}

function computeKey(config, schema) {
  var doorSurface = getDoorSurface();
  var surfaceKey = doorSurface === 'exterior' ? 'exterior' : (doorSurface === 'interior' ? 'interior' : '');
  var isPrehung =
    anySelectedChoiceValueEquals('pre_hung_on_jamb')
    || anySelectedValueEquals('pre_hung_on_jamb', config, schema);
  var isSlab =
    anySelectedChoiceValueEquals('slab_only')
    || anySelectedValueEquals('slab_only', config, schema);
  var selKey = isPrehung ? 'prehung_oversized' : (isSlab ? 'slab_oversized' : '');
  return surfaceKey && selKey ? (surfaceKey + '_' + selKey) : '';
}

function computeMeasurements() {
  var width = readWidthFromDom();
  var height = readHeightFromDom();
  return { width: width, height: height };
}

function applyToTotal(total, config, schema) {
  if (isScreenAndStormDoorsProductType()) {
    var screenStormAddon = parseFloat(window.__doorScreenStormAddonPrice || 0) || 0;
    return total + screenStormAddon;
  }
  var m = computeMeasurements();
  var key = computeKey(config, schema);
  var records = getPricingRuleIntExtRecords();
  var intExtFromApi = getIntExtGeneralOversizedAddonTotal();
  var sidelightTransomAddon = getSidelightTransomAddonTotal();

  // Store latest debug snapshot for inspection.
  window.__doorIntExtPricingDebug = {
    key: key,
    width: m.width,
    height: m.height,
    thickness: readThicknessFromDom(),
    intExtOversizedApi: parseFloat(window['__doorAddon_intExtOversizedApi'] || 0) || 0,
    intExtThicknessBand: parseFloat(window['__doorAddon_intExtThicknessBand'] || 0) || 0,
    recordsCount: Array.isArray(records) ? records.length : 0
  };

  try {
    if (window.DOOR_PRICE_DEBUG) {
      console.log('[pricing_rule_int_ext] debug', window.__doorIntExtPricingDebug);
    }
  } catch (eDbg) {}

  // When proxy API already set oversized addons, do not add table match + thickness again (avoids stacking).
  if (intExtFromApi > 0) {
    return total + intExtFromApi + sidelightTransomAddon;
  }

  var match = (key && m.width > 0 && m.height > 0) ? findPricingRuleMatch(records, key, m.width, m.height) : { row: null, price: 0 };
  var thicknessAddon = computeThicknessAddonPrice();
  return total + (match.price || 0) + thicknessAddon + sidelightTransomAddon;
}

window.DoorIntExtPricingRule = {
  computeMeasurements: computeMeasurements,
  computeKey: computeKey,
  getPricingRuleIntExtRecords: getPricingRuleIntExtRecords,
  findPricingRuleMatch: findPricingRuleMatch,
  applyToTotal: applyToTotal,
  getDoorAddonTotalSum: getDoorAddonTotalSum,
  getScreenStormAddonLayerTotal: getScreenStormAddonLayerTotal,
  sumScreenStormAddonKeysFromWindow: sumScreenStormAddonKeysFromWindow,
  logScreenStormPricingDebug: logScreenStormPricingDebug,
  getFullDoorEstimatedDisplayTotal: getFullDoorEstimatedDisplayTotal,
  getStormGlassAddon: getStormGlassAddon,
  getDoorSealKitMatchingAddon: getDoorSealKitMatchingAddon,
  getDoorEstimatedPriceElements: getDoorEstimatedPriceElements,
  readEstimatedPriceFromDom: readEstimatedPriceFromDom,
  readDoorWidthInchesFromDom: readDoorWidthInchesFromDom,
  readDoorHeightInchesFromDom: readDoorHeightInchesFromDom,
  readIntFracPairFromSelect: readIntFracPairFromSelect,
  writeEstimatedPriceDisplay: writeDoorEstimatedPriceToDom,
  syncEstimatedPriceDisplay: _syncDoorEstimatedPriceDisplay,
  syncSidelightTransomAddonsFromStyleSelection: syncSidelightTransomAddonsFromStyleSelection,
  refreshGeneralIntExtOversizedFromDomIfReady: refreshGeneralIntExtOversizedFromDomIfReady,
  clearSidelightStyleOversizedAddons: clearSidelightStyleOversizedAddons,
  clearTransomStyleOversizedAddons: clearTransomStyleOversizedAddons,
  getSidelightTransomAddonTotal: getSidelightTransomAddonTotal,
  getIntExtGeneralOversizedAddonTotal: getIntExtGeneralOversizedAddonTotal,
  clearIntExtGeneralOversizedAddonKeys: clearIntExtGeneralOversizedAddonKeys,
  getPetGatesMeasurementAddon: getPetGatesMeasurementAddon,
  isPetGatesCollectionActive: isPetGatesCollectionActive,
  setStileAndRailProfileAddon: function (listPrice) {
    var n = parseFloat(listPrice) || 0;
    if (n < 0) n = 0;
    window['__doorAddon_stile_and_rail_profile'] = n;
    window.__doorLastStileRailListPrice = n;
    _syncDoorEstimatedPriceDisplay();
  }
};

function bindWideSidelightWoodTypeRecalc() {
  try {
    document.addEventListener('change', function (e) {
      var t = e && e.target;
      if (!t || isScreenAndStormDoorsProductType()) return;
      if (!isWoodTypeOptionTarget(t)) return;
      if (!isSidelightStyleSelected()) return;
      function recalcWideWood() {
        captureThemeOptionTotalFromDom();
        if (appliesWideSidelightBaseWoodAddon()) {
          applyWideSidelightBasePlusWoodAddon(t);
        } else {
          applyAddonToEstimatedPriceKey(0, 'sidelightTransomOversized');
          _syncDoorEstimatedPriceDisplay();
        }
      }
      setTimeout(recalcWideWood, 0);
      setTimeout(recalcWideWood, 120);
    });
  } catch (e) {}
}

/** Reset width / height / thickness selects + any oversized price when prehung ↔ slab is switched. */
function resetDoorMeasurementsAndPrice() {
  try {
    // Discard any in-flight fetch from the previous setup type.
    window.__doorIntExtFetchGen = (window.__doorIntExtFetchGen || 0) + 1;
    window.__bothPairsFetchGen = (window.__bothPairsFetchGen || 0) + 1;

    // --- width (exact + finished panels) ---
    var wi, wids;
    for (wi = 0; wi < DOOR_WIDTH_INT_BASE_IDS.length; wi++) {
      wids = document.querySelectorAll('#' + DOOR_WIDTH_INT_BASE_IDS[wi] + ', select[id^="' + DOOR_WIDTH_INT_BASE_IDS[wi] + '"]');
      for (var wxi = 0; wxi < wids.length; wxi++) wids[wxi].selectedIndex = 0;
    }
    for (wi = 0; wi < DOOR_WIDTH_FRAC_BASE_IDS.length; wi++) {
      wids = document.querySelectorAll('#' + DOOR_WIDTH_FRAC_BASE_IDS[wi] + ', select[id^="' + DOOR_WIDTH_FRAC_BASE_IDS[wi] + '"]');
      for (wxi = 0; wxi < wids.length; wxi++) wids[wxi].selectedIndex = 0;
    }

    // --- height (exact door_height + finished-height) ---
    function setAllMeasurementSelectsToValue(baseIds, val) {
      for (var bi = 0; bi < baseIds.length; bi++) {
        var nodes = document.querySelectorAll('#' + baseIds[bi] + ', select[id^="' + baseIds[bi] + '"]');
        for (var ni = 0; ni < nodes.length; ni++) {
          var sel = nodes[ni];
          if (!sel || !sel.options) continue;
          for (var oi = 0; oi < sel.options.length; oi++) {
            if (String(sel.options[oi].value) === String(val)) {
              sel.selectedIndex = oi;
              break;
            }
          }
        }
      }
    }
    setAllMeasurementSelectsToValue(DOOR_HEIGHT_INT_BASE_IDS, '82');
    setAllMeasurementSelectsToValue(DOOR_HEIGHT_FRAC_BASE_IDS, '0');

    // --- thickness: restore full backup first, then reset to product default ---
    restoreExactDoorThicknessFracOptionsFromIntExtFilter();
    var defThk = '1.75';
    try {
      if (
        window.DoorConf2Measurements
        && typeof window.DoorConf2Measurements.getDefaultExactDoorThicknessFracValue === 'function'
      ) {
        defThk = window.DoorConf2Measurements.getDefaultExactDoorThicknessFracValue();
      }
    } catch (eDefThk) {}
    var thFracs = collectExactDoorThicknessFracSelectsOrdered();
    for (var fi = 0; fi < thFracs.length; fi++) {
      for (var toi = 0; toi < thFracs[fi].options.length; toi++) {
        if (String(thFracs[fi].options[toi].value) === String(defThk)) {
          thFracs[fi].selectedIndex = toi;
          break;
        }
      }
    }
    var thInts = collectExactDoorThicknessIntSelectsOrdered();
    for (var ti = 0; ti < thInts.length; ti++) thInts[ti].selectedIndex = 0;
    var thSingles = collectDoorThicknessSinglesOrdered();
    for (var si = 0; si < thSingles.length; si++) {
      for (var soi = 0; soi < thSingles[si].options.length; soi++) {
        if (String(thSingles[si].options[soi].value) === String(defThk)) {
          thSingles[si].selectedIndex = soi;
          break;
        }
      }
    }

    // --- hide the thickness row (exact-door-thickness-frac always stays visible) ---
    setThicknessRowHidden(true);
    ensureExactDoorThicknessFracRowVisible();

    // --- clear cached measurement values ---
    try { window.__lastDoorThicknessInches = 0; } catch (e) {}
    try { window.__lastDoorWidthInchesRaw = 0; window.__lastDoorWidthInchesRounded = 0; } catch (e) {}
    try { window.__lastDoorHeightInchesRaw = 0; window.__lastDoorHeightInchesRounded = 0; window.__lastDoorHeightInches = 0; } catch (e) {}

    // --- zero all addon tracking keys ---
    // We do NOT touch the DOM price here.  The page's own variant-price handler
    // fires on the same change event and resets the displayed price to the clean
    // product base.  By the time our next async fetch resolves, the DOM already
    // shows the correct base and _syncDoorEstimatedPriceDisplay() re-captures it
    // as __doorAddonBasePrice before adding the new addon.  This avoids the drift
    // that occurred when we subtracted prevAddon from a DOM that the page had
    // already reset (giving base − prevAddon < base).
    window.__doorAddonBasePrice = 0;  // cleared; re-captured on next addon call
    window.__doorIntExtAddonPrice = 0;
    window['__doorAddon_intExtOversizedApi'] = 0;
    window['__doorAddon_intExtThicknessBand'] = 0;
    clearSidelightTransomAddonKeys();
    window['__doorAddon_interiorDoorThickness'] = 0;
    window['__doorAddon_sidelightPanelThickness'] = 0;
    window['__doorAddon_stile_and_rail_profile'] = 0;
    window['__doorAddon_storm_glass'] = 0;
    window['__doorAddon_door_seal_kit_matching'] = 0;
    window.__doorLastStileRailListPrice = 0;
    window.__doorThemeOptionTotal = 0;
    window.__doorPendingNoteLastPrice = null;
    try {
      sessionStorage.removeItem(DOOR_PRICING_STATE_STORAGE_KEY);
      localStorage.removeItem(DOOR_PRICING_STATE_STORAGE_KEY);
    } catch (eClr) {}
    window.__doorPricingStateCache = null;
    initThemeOptionTotalFromBase();
    _syncDoorEstimatedPriceDisplay();
  } catch (e) {}
}

/**
 * Schema option changes (wood, design, etc.): capture new theme total, keep cached addons.
 * Measurement dimension changes are handled by bindDoorWidthIntAlert (skip here).
 */
function isDoorConfiguratorControl(t) {
  if (!t) return false;
  var root = document.getElementById('door-configurator-options')
    || document.getElementById('door-configurator');
  if (!root) return false;
  if (t.closest && t.closest('#door-configurator-options, #door-configurator')) return true;
  var name = t.name != null ? String(t.name) : '';
  return name.indexOf('attributes[') === 0;
}

function bindThemeOptionTotalCapture() {
  try {
    document.addEventListener('change', function (e) {
      var t = e && e.target;
      if (!t || isScreenAndStormDoorsProductType()) return;
      if (!isDoorConfiguratorControl(t)) return;
      if (!isSchemaOptionChangeTarget(t)) return;
      var before = snapshotDoorPricingBeforeChange();
      try {
        if (window.DOOR_PRICE_DEBUG) {
          console.log(
            '[door-pricing] Selection changed — ' +
            (t.name || t.id || 'option') + ' = ' + (t.value != null ? t.value : ''),
            {
              choicePrice: readSelectedChoicePriceFromElement(t),
              lastDisplay: before.display,
              themeBefore: before.theme,
              addons: before.addons
            }
          );
        }
      } catch (eImm) {}
      if (isSidelightOrTransomStyleOptionTarget(t)) {
        syncSidelightTransomAddonsFromStyleSelection(t);
        refreshGeneralIntExtOversizedFromDomIfReady(t);
      } else if (!isWoodTypeOptionTarget(t)) {
        clearSidelightTransomAddonKeys();
      } else if (!appliesWideSidelightBaseWoodAddon()) {
        applyAddonToEstimatedPriceKey(0, 'sidelightTransomOversized');
      }
      schedulePriceSyncAfterPageHandlers(t, before);
    }, true);
  } catch (e) {}
}

function bindSetupTypeReset() {
  try {
    document.addEventListener('change', function (e) {
      var t = e && e.target;
      if (!t) return;
      var val = t.value != null ? String(t.value) : '';
      if (val !== 'slab_only' && val !== 'pre_hung_on_jamb') return;
      if (t.tagName !== 'INPUT') return;
      resetDoorMeasurementsAndPrice();
    });
  } catch (e) {}
}

function reapplyIntExtAddonsAfterExternalPriceWrite(source) {
  try {
    if (window.__doorIntExtSyncing) return;
    if (window.__doorReapplyAddonsTimer) clearTimeout(window.__doorReapplyAddonsTimer);
    window.__doorReapplyAddonsTimer = setTimeout(function () {
      window.__doorReapplyAddonsTimer = null;
      if (window.__doorIntExtSyncing) return;
      var shown = readEstimatedPriceFromDom();
      var expected = getFullDoorEstimatedDisplayTotal();
      if (getDoorAddonTotalSum() < 0.01 && getScreenStormAddonLayerTotal() < 0.01) return;
      if (Math.abs(shown - expected) < 0.05) return;
      captureThemeOptionTotalFromDom();
      _syncDoorEstimatedPriceDisplay({ source: source || 'reapplyIntExtAddons', silent: true });
    }, 200);
  } catch (e) {}
}

function observeIntExtEstimatedPriceElement() {
  try {
    var nodes = getDoorEstimatedPriceElements();
    var el = pickVisibleDoorEstimatedPriceElement(nodes) || (nodes.length ? nodes[0] : null);
    if (!el) {
      setTimeout(observeIntExtEstimatedPriceElement, 500);
      return;
    }
    if (window.__doorIntExtPriceObserver) {
      window.__doorIntExtPriceObserver.disconnect();
    }
    var observer = new MutationObserver(function () {
      if (window.__doorIntExtSyncing || window.__doorScreenStormUpdatingPrice) return;
      if (window.__doorPriceObserverTimer) clearTimeout(window.__doorPriceObserverTimer);
      window.__doorPriceObserverTimer = setTimeout(function () {
        window.__doorPriceObserverTimer = null;
        reapplyIntExtAddonsAfterExternalPriceWrite('priceObserver');
      }, 200);
    });
    observer.observe(el, { childList: true, characterData: true, subtree: true });
    window.__doorIntExtPriceObserver = observer;
  } catch (e) {}
}

function bindDoorConfiguratorPriceUpdatedSync() {
  try {
    document.addEventListener('door-configurator-price-updated', function () {
      if (window.__doorStileSyncInProgress || window.__doorStileApplyBusy) return;
      if (window.__doorConfigPriceUpdatedTimer) clearTimeout(window.__doorConfigPriceUpdatedTimer);
      function runPriceUpdatedSync() {
        window.__doorConfigPriceUpdatedTimer = null;
        if (window.__doorIntExtSyncing) {
          window.__doorConfigPriceUpdatedTimer = setTimeout(runPriceUpdatedSync, 80);
          return;
        }
        if (!isScreenAndStormDoorsProductType()) {
          captureThemeOptionTotalFromDom();
        }
        var ssLayer = getScreenStormAddonLayerTotal();
        _syncDoorEstimatedPriceDisplay({
          source: 'door-configurator-price-updated',
          silent: ssLayer < 0.01,
          userAction: ssLayer > 0.01,
          forceLog: ssLayer > 0.01
        });
      }
      window.__doorConfigPriceUpdatedTimer = setTimeout(runPriceUpdatedSync, 80);
    });
  } catch (e) {}
}

if (!_pricingRuleIntExtAlreadyLoaded || !window.__pricingRuleIntExtBound) {
  initDoorPricingOnPageLoad();
  bindDoorConfiguratorPriceUpdatedSync();
  observeIntExtEstimatedPriceElement();
  bindThemeOptionTotalCapture();
  bindDoorWidthIntAlert();
  bindWideSidelightWoodTypeRecalc();
  bindSetupTypeReset();
  schedulePriceSyncAfterPageHandlers();
  try {
    if (window.DOOR_PRICE_DEBUG && !window.__doorPricingModuleLoadedLogged) {
      window.__doorPricingModuleLoadedLogged = true;
      console.log('[door-pricing] pricing-rule-int-ext.js loaded — filter console by "door-pricing"');
    }
  } catch (eInitLog) {}
}
})();
