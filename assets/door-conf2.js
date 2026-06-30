// Door configurator frontend logic for Shopify theme
// This file is meant to be uploaded as an asset (door-config.js) in your theme.

(function () {
  var DOOR_SELECTION_LOG_ONLY = false;
  try { window.__doorSelectionLogOnly = DOOR_SELECTION_LOG_ONLY; } catch (eModeExpose) {}
  function silenceDoorConsoleLogs() {
    if (!DOOR_SELECTION_LOG_ONLY) return;
    try {
      if (window.__doorConsoleSilenced) return;
      window.__doorConsoleSilenced = true;
      var c = window.console;
      if (!c) return; 
      if (!window.__doorConsoleOriginals) {
        window.__doorConsoleOriginals = {
          log: c.log,
          info: c.info,
          warn: c.warn,
          error: c.error,
          debug: c.debug
        };
      }
      var noop = function () {};
      c.log = noop;
      c.info = noop;
      c.warn = noop;
      c.error = noop;
      c.debug = noop;
    } catch (eSilence) {}
  }
  silenceDoorConsoleLogs();

  function $(selector) {
    return document.querySelector(selector);
  }
  function all(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  /** Sidelight / transom accordions: user must pick explicitly (no first-visible auto-check). */
  var OPTIONAL_DESIGN_RADIO_OPTION_IDS = {
    sidelight_location: true,
    sidelight_style: true,
    transom_style: true,
    transom_count: true
  };
  function optionIdSkipsDefaultRadioAutoSelect(optId) {
    var n = String(optId || '').toLowerCase().replace(/-/g, '_');
    return !!OPTIONAL_DESIGN_RADIO_OPTION_IDS[n];
  }
  function syncSidelightTransomAccordionHeaderUi(container) {
    if (!container) return;
    [
      ['sidelight_design', ['sidelight_location', 'sidelight_style']],
      ['transom_design', ['transom_style', 'transom_count']]
    ].forEach(function (pair) {
      var section = container.querySelector('.door-option-wrap[data-option-id="' + pair[0] + '"]');
      if (!section) return;
      var body = section.querySelector('.door-accordion-body');
      if (!body) return;
      var removeBtn = section.querySelector('.door-accordion-remove-btn');
      var sign = section.querySelector('.door-accordion-sign');
      var anyChecked = false;
      pair[1].forEach(function (id) {
        if (body.querySelector('input[type="radio"][data-option-id="' + id + '"]:checked')) anyChecked = true;
      });
      if (removeBtn) removeBtn.style.setProperty('display', anyChecked ? '' : 'none', 'important');
      if (sign) sign.style.setProperty('display', anyChecked ? 'none' : '', 'important');
    });
  }

  // On saved-config restore: open the sidelight/transom design accordions that have
  // a selected child (so the picked style is visible) and refresh the "added" header UI.
  function openRestoredDesignAccordions(container) {
    if (!container) return;
    ['sidelight_design', 'transom_design'].forEach(function (designId) {
      var section = container.querySelector('.door-option-wrap[data-option-id="' + designId + '"]');
      if (!section) return;
      var body = section.querySelector('.door-accordion-body');
      if (!body) return;
      if (body.querySelector('input[type="radio"]:checked')) {
        body.classList.add('door-accordion-body--open');
        var sign = section.querySelector('.door-accordion-sign');
        if (sign) sign.style.setProperty('display', 'none', 'important');
      }
    });
    try { syncSidelightTransomAccordionHeaderUi(container); } catch (eOpenDesign) {}
  }

  function doorConf2HardwareCall(name) {
    var H = window.DoorConf2Hardware;
    var fn = H && H[name];
    if (typeof fn !== 'function') return undefined;
    return fn.apply(H, Array.prototype.slice.call(arguments, 1));
  }

  function readRecommendedHardwareProducts() {
    var out = doorConf2HardwareCall('readRecommendedHardwareProducts');
    return Array.isArray(out) ? out : [];
  }

  function hideLegacyRecommendedProductsBlock() {
    doorConf2HardwareCall('hideLegacyRecommendedProductsBlock');
  }

  function getHardwareSelectionsForConfig() {
    var out = doorConf2HardwareCall('getHardwareSelectionsForConfig');
    return Array.isArray(out) ? out : [];
  }

  function enhanceDoorSelectWithDivDropdown(selectEl) {
    return doorConf2HardwareCall('enhanceDoorSelectWithDivDropdown', selectEl) || null;
  }

  function renderHardwareOptionsGrid(parentEl, products) {
    return doorConf2HardwareCall('renderHardwareOptionsGrid', parentEl, products) || null;
  }

  function syncHardwareOptionsGridVisibility(hwAccordionEl, isOpen) {
    doorConf2HardwareCall('syncHardwareOptionsGridVisibility', hwAccordionEl, isOpen);
  }

  function getHwFieldDefsForLineItems() {
    var out = doorConf2HardwareCall('getHardwareFieldDefs');
    return Array.isArray(out) ? out : [];
  }

  var ADDITIONAL_OPTIONS_SELECT_IDS = ['door_sweep', 'door_seal_kit', 'pet_door'];

  function isAdditionalOptionsSelectOption(optId) {
    return ADDITIONAL_OPTIONS_SELECT_IDS.indexOf(normalizeOptionIdKey(optId)) !== -1;
  }

  /** Catalog add-ons live in door-conf2-update.js (DoorConf2Update). */
  function applyCatalogMetaobjectAddonsFromUpdate(config) {
    try {
      if (window.DoorConf2Update && typeof window.DoorConf2Update.applyCatalogMetaobjectAddons === 'function') {
        return window.DoorConf2Update.applyCatalogMetaobjectAddons(config);
      }
    } catch (eCatUpd) {}
    window['__doorAddon_door_seal_kit_matching'] = 0;
    window['__doorAddon_door_sweeps_matching'] = 0;
    window['__doorAddon_priming_services'] = 0;
    window['__doorAddon_applied_molding_tier'] = 0;
    return { sealKit: 0, doorSweeps: 0, priming: 0, appliedMolding: 0, total: 0 };
  }

  function ensureDoorPriceBoxVisible() {
    try {
      if (window.DoorConf2Update && typeof window.DoorConf2Update.ensureDoorPriceBoxVisible === 'function') {
        window.DoorConf2Update.ensureDoorPriceBoxVisible();
      }
    } catch (ePriceBox) {}
  }

  function enhanceAdditionalOptionsSelects(root) {
    var scope = root || document.getElementById('door-configurator') || document;
    if (!scope || !scope.querySelectorAll) return;
    ADDITIONAL_OPTIONS_SELECT_IDS.forEach(function (oid) {
      var wrap = scope.querySelector('.door-option-wrap[data-option-id="' + oid + '"]');
      if (wrap && wrap.getAttribute('data-empty-hidden') === '1') {
        wrap.removeAttribute('data-empty-hidden');
        wrap.style.display = '';
      }
      var sel = scope.querySelector('select[data-option-id="' + oid + '"]');
      if (sel) enhanceDoorSelectWithDivDropdown(sel);
    });
  }


  var doorConfigSchema = null;
  var autoSelectIdCounter = 0;

  function doorAutosaveRestorePending() {
    try {
      var search = String((window.location && window.location.search) || '');
      if (search.indexOf('autosave=1') === -1) return false;
      var raw = localStorage.getItem('door_autosave_payload');
      if (!raw) return false;
      var parsed = JSON.parse(raw);
      return !!(parsed && parsed.options && typeof parsed.options === 'object');
    } catch (eAutosavePending) {
      return false;
    }
  }

  function doorSavedConfigRestorePending() {
    try {
      var search = String((window.location && window.location.search) || '');
      if (/[?&]config_id=\d+/.test(search)) return true;
      var container = document.getElementById('door-configurator');
      if (container && container.getAttribute('data-edit-config-id')) return true;
    } catch (eSavedCfg) {}
    return false;
  }

  function doorRestorePending() {
    return doorAutosaveRestorePending() || doorSavedConfigRestorePending();
  }

  var DOOR_SAVED_RESTORE_BUILD = '20260604b';

  function doorSavedRestoreDebugEnabled() {
    try {
      if (window.__DOOR_SAVED_MEASUREMENT_RESTORE_DEBUG === true) return true;
      var search = String((window.location && window.location.search) || '');
      return /(?:\?|&)door_saved_restore_debug(?:=1|=true|(?=&|$))/i.test(search)
        || /(?:\?|&)door_saved_restore_debug\b/i.test(search);
    } catch (eDbgOn) {}
    return false;
  }

  function doorSavedRestoreDebugLog(phase, detail) {
    if (!doorSavedRestoreDebugEnabled()) return;
    window.__doorSavedRestoreDebugLog = window.__doorSavedRestoreDebugLog || [];
    var entry = {
      t: new Date().toISOString(),
      phase: String(phase || ''),
      detail: detail || null
    };
    window.__doorSavedRestoreDebugLog.push(entry);
    try {
      console.log('[door-saved-restore]', phase, detail || '');
    } catch (eCon) {}
    var panel = document.getElementById('door-saved-restore-debug');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'door-saved-restore-debug';
      panel.setAttribute('aria-live', 'polite');
      panel.style.cssText = 'position:fixed;bottom:0;left:0;right:0;max-height:42vh;overflow:auto;background:rgba(0,0,0,0.92);color:#6f6;font:12px/1.45 monospace;padding:10px 12px;z-index:2147483646;border-top:2px solid #6f6;pointer-events:auto;';
      var title = document.createElement('div');
      title.style.cssText = 'color:#fff;font-weight:bold;margin-bottom:6px;';
      title.textContent = 'Door saved-restore debug (door_saved_restore_debug=1) — build ' + DOOR_SAVED_RESTORE_BUILD;
      panel.appendChild(title);
      document.body.appendChild(panel);
    }
    var line = document.createElement('div');
    line.textContent = entry.t.substr(11, 8) + ' ' + entry.phase + (detail ? ' ' + JSON.stringify(detail) : '');
    panel.appendChild(line);
  }

  try {
    window.__doorSavedRestoreDebug = doorSavedRestoreDebugLog;
    if (doorSavedRestoreDebugEnabled()) {
      doorSavedRestoreDebugLog('door-conf2.js boot', { build: DOOR_SAVED_RESTORE_BUILD });
    }
  } catch (eDbgExpose) {}

  function normalizeOptionIdKey(id) {
    return String(id || '').toLowerCase().replace(/-/g, '_');
  }

  function sanitizeForDomId(s) {
    return String(s == null ? '' : s)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  function ensureSelectHasId(selectEl, prefix) {
    if (!selectEl) return '';
    if (selectEl.id) return selectEl.id;
    autoSelectIdCounter += 1;
    selectEl.id = (prefix ? String(prefix) : 'door-select') + '-' + autoSelectIdCounter;
    return selectEl.id;
  }

  function buildOptionDomId(selectId, valueOrLabel, index) {
    var base = sanitizeForDomId(selectId) || 'select';
    var v = sanitizeForDomId(valueOrLabel);
    if (!v) v = String(index != null ? index : 0);
    // Keep it compact + readable (no "__opt__" marker): <selectId>__<value>
    return base + '__' + v;
  }

  function doorConf2MeasurementsCall(name) {
    var M = window.DoorConf2Measurements;
    var fn = M && M[name];
    if (typeof fn !== 'function') return undefined;
    return fn.apply(M, Array.prototype.slice.call(arguments, 1));
  }

  function runMeasurementUiSync() { doorConf2MeasurementsCall('runMeasurementUiSync'); }
  function applyMeasurementTypeTabSelection(radioEl, measureOptionId, optionsContainer, schema) {
    doorConf2MeasurementsCall('applyMeasurementTypeTabSelection', radioEl, measureOptionId, optionsContainer, schema);
  }
  function syncMeasurementTypeDetailsVisibility(optionsContainer, schema) {
    doorConf2MeasurementsCall('syncMeasurementTypeDetailsVisibility', optionsContainer, schema);
  }
  function syncSlabSidelightMeasurementUI(optionsContainer, schema) {
    doorConf2MeasurementsCall('syncSlabSidelightMeasurementUI', optionsContainer, schema);
  }
  function syncMeasurementTabCardVisibility(optionsContainer, schema) {
    doorConf2MeasurementsCall('syncMeasurementTabCardVisibility', optionsContainer, schema);
  }
  function syncMeasurementTypeSectionPreHungGate(schema, optionsContainer) {
    doorConf2MeasurementsCall('syncMeasurementTypeSectionPreHungGate', schema, optionsContainer);
  }
  function syncHingeFinishVisibility(schema, optionsContainer) {
    doorConf2MeasurementsCall('syncHingeFinishVisibility', schema, optionsContainer);
  }
  function linkStaticMeasurementRowsToSchema(schema, rootEl) {
    doorConf2MeasurementsCall('linkStaticMeasurementRowsToSchema', schema, rootEl);
  }
  function assignStaticMeasurementRowSelectIds(rootEl) {
    doorConf2MeasurementsCall('assignStaticMeasurementRowSelectIds', rootEl);
  }
  function fixPanelDoorWidthAndTransomHeightOptionRanges(rootEl) {
    doorConf2MeasurementsCall('fixPanelDoorWidthAndTransomHeightOptionRanges', rootEl);
  }
  function applyStaticMeasurementDimensionDefaults(rootEl) {
    var M = window.DoorConf2Measurements;
    if (M && typeof M.applyStaticMeasurementDimensionDefaults === 'function') {
      M.applyStaticMeasurementDimensionDefaults(rootEl);
      return;
    }
    if (!rootEl) rootEl = document.getElementById('door-configurator-options') || document;
    try {
      rootEl.querySelectorAll(
        'select#exact-door-width-int, select[id^="exact-door-width-int"],' +
        'select#finished-width-int, select[id^="finished-width-int"],' +
        'select#rough-width-int, select[id^="rough-width-int"],' +
        'select#panel-width-int, select[id^="panel-width-int"]'
      ).forEach(function (sel) {
        if (sel.getAttribute('data-door-user-changed') === '1') return;
        var cur = String(sel.value != null ? sel.value : '').trim();
        if (cur === '36') return;
        for (var oi = 0; oi < (sel.options || []).length; oi++) {
          if (String(sel.options[oi].value) === '36') {
            sel.value = '36';
            break;
          }
        }
      });
    } catch (eFb) {}
  }
  function assignUniqueOptionIds(rootEl, selectIdPrefix) {
    doorConf2MeasurementsCall('assignUniqueOptionIds', rootEl, selectIdPrefix);
  }
  function recordDoorSelectMeta(selectEl, fallbackSelectIdPrefix) {
    return doorConf2MeasurementsCall('recordDoorSelectMeta', selectEl, fallbackSelectIdPrefix) || null;
  }
  function getDoorSelectionMetaBySelectId() {
    var out = doorConf2MeasurementsCall('getDoorSelectionMetaBySelectId');
    return out && typeof out === 'object' ? out : {};
  }
  function getDoorLastSelectionMeta() {
    return doorConf2MeasurementsCall('getDoorLastSelectionMeta') || null;
  }
  function buildMeasurementTypeTabOptionList(measureOpt, schema, optionsContainer) {
    var out = doorConf2MeasurementsCall('buildMeasurementTypeTabOptionList', measureOpt, schema, optionsContainer);
    if (Array.isArray(out) && out.length) return out;
    var opts = (measureOpt && measureOpt.options) ? measureOpt.options : [];
    if (opts.length >= 2) return opts.slice();
    return [
      { value: 'exact_door_size', label: 'Exact Door Size', measureVis: 'always' },
      { value: 'finished_opening', label: 'Finished Opening Size', measureVis: 'slab' },
      { value: 'rough_opening_size', label: 'Rough Opening Size', measureVis: 'jamb' },
      { value: 'jamb_unit_size', label: 'Jamb Unit Size', measureVis: 'jamb' }
    ];
  }
  function findPreHungStyleOption(schema) {
    return doorConf2MeasurementsCall('findPreHungStyleOption', schema) || null;
  }
  function getPreHungDoorSetupChoices(schema) {
    var out = doorConf2MeasurementsCall('getPreHungDoorSetupChoices', schema);
    return Array.isArray(out) ? out : [];
  }
  function initializePanelUnitDesignSections(container, schema) {
    doorConf2MeasurementsCall('initializePanelUnitDesignSections', container, schema);
  }
  function appendStaticPanelUnitDesignSection(container) {
    return doorConf2MeasurementsCall('appendStaticPanelUnitDesignSection', container) || null;
  }
  function schemaIncludesPanelUnitDesignOption(schema) {
    return !!doorConf2MeasurementsCall('schemaIncludesPanelUnitDesignOption', schema);
  }
  function productIsPorchPanelProduct() {
    return !!doorConf2MeasurementsCall('productIsPorchPanelProduct');
  }
  function panelUnitDesignSectionExists(root) {
    return !!doorConf2MeasurementsCall('panelUnitDesignSectionExists', root);
  }
  function optionIsPanelUnitDesign(opt) {
    return !!doorConf2MeasurementsCall('optionIsPanelUnitDesign', opt);
  }
  function measurementSchemaUsesJsonVisibility(schema) {
    return !!doorConf2MeasurementsCall('measurementSchemaUsesJsonVisibility', schema);
  }
  function isMeasurementTypeOptionId(id) {
    return normalizeOptionIdKey(id) === 'measurement_type';
  }
  function measurementModeFromCheckedTab(chk, optionsContainer, schema) {
    return doorConf2MeasurementsCall('measurementModeFromCheckedTab', chk, optionsContainer, schema) || '';
  }
  function syncMeasurementSelectedPriceLabels(opts) {
    doorConf2MeasurementsCall('syncMeasurementSelectedPriceLabels', opts);
  }

  function displayLabelForMeasurementTabChoice(o) {
    var out = doorConf2MeasurementsCall('displayLabelForMeasurementTabChoice', o);
    if (out) return out;
    if (!o) return '';
    return String(o.label || o.value || '');
  }

  function isMeasurementSidelightTransomTabValue(valueKey) {
    if (doorConf2MeasurementsCall('isMeasurementSidelightTransomTabValue', valueKey)) return true;
    var v = normalizeOptionIdKey(valueKey);
    return v === 'exact_sidelight_size' || v === 'exact_transom_size';
  }

  function resolveMeasurementTabProductTagShouldHide(schema, tabValueKey) {
    return !!doorConf2MeasurementsCall('resolveMeasurementTabProductTagShouldHide', schema, tabValueKey);
  }

  function isPanelUnitDesignSectionEl(el) {
    return !!doorConf2MeasurementsCall('isPanelUnitDesignSectionEl', el);
  }


  /** Schema option for swing direction (metaobject key e.g. swing_direction). Used to mirror choices under pre_hung. */
  function findSwingDirectionOption(schema) {
    if (!Array.isArray(schema)) return null;
    for (var si = 0; si < schema.length; si++) {
      var sopt = schema[si];
      if (!sopt || !sopt.id) continue;
      var st = (sopt.type || '').toLowerCase();
      if (st !== 'radio' && st !== 'select') continue;
      var sid = normalizeOptionIdKey(sopt.id);
      if (sid === 'swing_direction' || sid === 'swingdirection') return sopt;
      var slab = String(sopt.label || '').toLowerCase();
      if (slab.indexOf('swing') !== -1 && slab.indexOf('direction') !== -1) return sopt;
    }
    return null;
  }

  /** True when this schema option is the Pre Hung / pre-hung style control (radio or select). */
  function optionIsPreHungStyle(opt) {
    if (!opt || !opt.id) return false;
    var t = (opt.type || '').toLowerCase();
    if (t !== 'radio' && t !== 'select') return false;
    var id = normalizeOptionIdKey(opt.id);
    var lab = String(opt.label || '').toLowerCase();
    if (id.indexOf('pre_hung') !== -1 || id.indexOf('prehung') !== -1) return true;
    if (lab.indexOf('pre-hung') !== -1) return true;
    if (lab.indexOf('pre') !== -1 && lab.indexOf('hung') !== -1) return true;
    return false;
  }

  /** True when this schema option is Select Wood (wood species radio or select). */
  function optionIsSelectWood(opt) {
    if (!opt || !opt.id) return false;
    var t = (opt.type || '').toLowerCase();
    if (t !== 'radio' && t !== 'select') return false;
    var id = String(opt.id || '').toLowerCase().replace(/-/g, '_');
    var lab = String(opt.label || '').toLowerCase();
    if (id.indexOf('wood') !== -1) return true;
    if (lab.indexOf('wood') !== -1) return true;
    return false;
  }

  function optionIsWoodType(opt) {
    if (!opt) return false;
    return String(opt.id || '').toLowerCase().replace(/-/g, '_') === 'wood_type';
  }

  function optionIsScreenAndStormInserts(opt) {
    if (!opt) return false;
    var id = String(opt.id || '').toLowerCase().replace(/-/g, '_');
    var lab = String(opt.label || '').toLowerCase();
    if (id === 'screen_and_storm_inserts') return true;
    return lab.indexOf('screen') !== -1 && lab.indexOf('storm') !== -1 && lab.indexOf('insert') !== -1;
  }

  function optionIsScreenType(opt) {
    if (!opt) return false;
    return String(opt.id || '').toLowerCase().replace(/-/g, '_') === 'screen_type';
  }

  function optionIsScreenStormInsertFrameColor(opt) {
    if (!opt) return false;
    return String(opt.id || '').toLowerCase().replace(/-/g, '_') === 'screen_storm_insert_frame_color';
  }

  function optionIsGlassType(opt) {
    if (!opt) return false;
    return String(opt.id || '').toLowerCase().replace(/-/g, '_') === 'glass_type';
  }

  function findGlassBevelOption(schema) {
    if (!Array.isArray(schema)) return null;
    for (var gi = 0; gi < schema.length; gi++) {
      var gopt = schema[gi];
      if (!gopt || !gopt.id) continue;
      var gid = String(gopt.id || '').toLowerCase().replace(/-/g, '_');
      if (gid === 'glass_bevel') return gopt;
    }
    return null;
  }

  function appendGlassBevelSwitchToSection(section, schema) {
    if (!section || !schema) return;
    if (section.querySelector('.door-bevel-glass-switch-wrap')) return;
    var glassBevelOpt = findGlassBevelOption(schema);
    var bevelChoice = (glassBevelOpt && Array.isArray(glassBevelOpt.options) && glassBevelOpt.options.length)
      ? (glassBevelOpt.options[0] || {})
      : {};

    var bevelWrap = document.createElement('div');
    bevelWrap.className = 'door-bevel-glass-switch-wrap';

    var bevelText = document.createElement('span');
    bevelText.className = 'door-bevel-glass-switch-label';
    bevelText.textContent = (glassBevelOpt && glassBevelOpt.label) ? glassBevelOpt.label : 'Bevel glass';
    bevelWrap.appendChild(bevelText);

    var bevelLabel = document.createElement('label');
    bevelLabel.className = 'common-switch';

    var bevelInput = document.createElement('input');
    bevelInput.type = 'checkbox';
    bevelInput.setAttribute('data-option-id', glassBevelOpt && glassBevelOpt.id ? glassBevelOpt.id : 'glass_bevel');
    bevelInput.name = 'attributes[' + ((glassBevelOpt && (glassBevelOpt.label || glassBevelOpt.id)) || 'Bevel glass') + '][]';
    bevelInput.value = bevelChoice.value != null ? String(bevelChoice.value) : 'true';
    bevelLabel.appendChild(bevelInput);

    var bevelKnob = document.createElement('span');
    bevelKnob.className = 'common-switch-slider';
    bevelLabel.appendChild(bevelKnob);

    bevelWrap.appendChild(bevelLabel);
    section.appendChild(bevelWrap);

    bevelInput.addEventListener('change', function () {
      updateEstimatedPrice();
      try { updateDoorPreview(); } catch (eBevelPreview) {}
    });
  }

  function optionIsStileAndRailProfile(opt) {
    if (!opt) return false;
    return String(opt.id || '').toLowerCase().replace(/-/g, '_') === 'stile_and_rail_profile';
  }

  function optionIsAppliedMolding(opt) {
    if (!opt) return false;
    var id = String(opt.id || '').toLowerCase().replace(/-/g, '_');
    return id === 'applied_molding' || id === 'applied_molding_choice';
  }

  function normalizeChoiceKey(v) {
    var k = String(v == null ? '' : v).trim().toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
    if (k === 'carftsman') k = 'craftsman';
    return k;
  }

  var SDL_STILE_PROFILE_KEYS = ['quarter_bead', 'craftsman'];
  /** Static SDL profile visibility by stile_and_rail_profile selection. */
  var SDL_PROFILE_STATIC_BY_STILE = {
    quarter_bead: ['bell_ogee', 'half_round'],
    craftsman: ['flat']
  };

  function getSelectedStileProfileKeys(optionsContainer) {
    var keys = [];
    if (!optionsContainer) return keys;
    var checked = optionsContainer.querySelector('input[type="radio"][data-option-id="stile_and_rail_profile"]:checked');
    if (!checked) return keys;
    var valKey = normalizeChoiceKey(checked.value);
    if (valKey) keys.push(valKey);
    var card = checked.closest && checked.closest('.common-check-option');
    if (card) {
      var lbl = card.querySelector('.common-check-option-label');
      if (lbl) {
        var lblKey = normalizeChoiceKey(lbl.textContent);
        if (lblKey && keys.indexOf(lblKey) === -1) keys.push(lblKey);
      }
    }
    return keys;
  }

  function getAppliedMoldingChoiceKeys(optionsContainer) {
    var keys = [];
    if (!optionsContainer) return keys;
    var optionIds = ['applied_molding_choice', 'applied_molding'];
    for (var oi = 0; oi < optionIds.length; oi++) {
      var oid = optionIds[oi];
      var checked = optionsContainer.querySelector('input[type="radio"][data-option-id="' + oid + '"]:checked');
      if (checked) {
        var valKey = normalizeChoiceKey(checked.value);
        if (valKey) keys.push(valKey);
        var card = checked.closest && checked.closest('.common-check-option');
        if (card) {
          var lbl = card.querySelector('.common-check-option-label');
          if (lbl) {
            var lblKey = normalizeChoiceKey(lbl.textContent);
            if (lblKey && keys.indexOf(lblKey) === -1) keys.push(lblKey);
          }
        }
        if (keys.length) return keys;
      }
      var sel = optionsContainer.querySelector('select[data-option-id="' + oid + '"]');
      if (sel && sel.value) {
        keys.push(normalizeChoiceKey(sel.value));
        return keys;
      }
    }
    return keys;
  }

  function isRm5AppliedMoldingSelected(optionsContainer) {
    var keys = getAppliedMoldingChoiceKeys(optionsContainer);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i] === 'rm5') return true;
    }
    return false;
  }

  function isAppliedMoldingStileSelected(optionsContainer) {
    var keys = getSelectedStileProfileKeys(optionsContainer);
    for (var ai = 0; ai < keys.length; ai++) {
      if (keys[ai] === 'applied_molding') return true;
    }
    return false;
  }

  function shouldForceShowAllSdlProfileOptions(optionsContainer) {
    return isAppliedMoldingStileSelected(optionsContainer) && isRm5AppliedMoldingSelected(optionsContainer);
  }

  function revealAllSdlProfileChoices(optionsContainer) {
    if (!optionsContainer) return;
    var sdlWrap = optionsContainer.querySelector('.door-option-wrap[data-option-id="sdl_profile"]');
    if (!sdlWrap) return;
    sdlWrap.querySelectorAll('.common-check-option').forEach(function (card) {
      var woodHid = card.getAttribute && card.getAttribute('data-wood-exposure-hidden') === '1';
      if (woodHid) return;
      card.style.display = '';
      card.classList.remove('door-hidden');
      card.removeAttribute('data-product-tag-hidden');
    });
    var sel = sdlWrap.querySelector('select[data-option-id="sdl_profile"]');
    if (sel) {
      Array.prototype.forEach.call(sel.options, function (op) {
        if (!op || !op.value) return;
        op.hidden = false;
        op.disabled = false;
        op.removeAttribute('data-product-tag-hidden');
      });
    }
  }

  function isStileProfileSdlTrigger(optionsContainer) {
    var stileKeys = getSelectedStileProfileKeys(optionsContainer);
    for (var si = 0; si < stileKeys.length; si++) {
      if (SDL_STILE_PROFILE_KEYS.indexOf(stileKeys[si]) !== -1) return true;
    }
    return false;
  }

  /** SDL block visible when stile is quarter_bead/craftsman, or applied_molding + rm5. */
  function shouldShowSdlProfile(optionsContainer) {
    if (shouldForceShowAllSdlProfileOptions(optionsContainer)) return true;
    return isStileProfileSdlTrigger(optionsContainer);
  }

  function getAllowedStaticSdlProfileKeys(optionsContainer) {
    var allowed = [];
    var stileKeys = getSelectedStileProfileKeys(optionsContainer);
    for (var si = 0; si < stileKeys.length; si++) {
      var list = SDL_PROFILE_STATIC_BY_STILE[stileKeys[si]];
      if (!list) continue;
      list.forEach(function (k) {
        if (allowed.indexOf(k) === -1) allowed.push(k);
      });
    }
    return allowed;
  }

  function sdlProfileChoiceKeyFromCard(card) {
    if (!card) return '';
    var inp = card.querySelector('input[data-option-id="sdl_profile"]');
    if (inp && inp.value) return normalizeChoiceKey(inp.value);
    var dv = card.getAttribute('data-choice-value');
    if (dv) return normalizeChoiceKey(dv);
    var lbl = card.querySelector('.common-check-option-label');
    if (lbl) return normalizeChoiceKey(lbl.textContent);
    return '';
  }

  /** Static SDL profile visibility (quarter_bead / craftsman / applied_molding+rm5). */
  function applyStaticSdlProfileVisibility(optionsContainer) {
    if (!optionsContainer) optionsContainer = document.getElementById('door-configurator-options');
    if (!optionsContainer) return;
    if (shouldForceShowAllSdlProfileOptions(optionsContainer)) {
      revealAllSdlProfileChoices(optionsContainer);
      return;
    }
    var allowed = getAllowedStaticSdlProfileKeys(optionsContainer);
    var sdlWrap = optionsContainer.querySelector('.door-option-wrap[data-option-id="sdl_profile"]');
    if (!sdlWrap) return;
    sdlWrap.querySelectorAll('.common-check-option').forEach(function (card) {
      var key = sdlProfileChoiceKeyFromCard(card);
      var shouldHide = !key || allowed.indexOf(key) === -1;
      var woodHid = card.getAttribute && card.getAttribute('data-wood-exposure-hidden') === '1';
      card.style.display = (shouldHide || woodHid) ? 'none' : '';
      card.classList.toggle('door-hidden', !!(shouldHide || woodHid));
      card.removeAttribute('data-product-tag-hidden');
      var inp = card.querySelector('input[type="radio"][data-option-id="sdl_profile"]');
      if (shouldHide && inp && inp.checked) {
        inp.checked = false;
        card.classList.remove('common-check-option--selected');
      }
    });
    var sel = sdlWrap.querySelector('select[data-option-id="sdl_profile"]');
    if (sel) {
      var cleared = false;
      Array.prototype.forEach.call(sel.options, function (op) {
        if (!op || !op.value) return;
        var key = normalizeChoiceKey(op.value);
        var shouldHide = allowed.indexOf(key) === -1;
        op.hidden = shouldHide;
        op.disabled = shouldHide;
        op.removeAttribute('data-product-tag-hidden');
        if (shouldHide && normalizeChoiceKey(sel.value) === key) cleared = true;
      });
      if (cleared) {
        var firstVisible = Array.prototype.find.call(sel.options, function (o) { return !o.hidden && o.value; });
        sel.value = firstVisible ? firstVisible.value : '';
        try { updateEstimatedPrice(); } catch (ePrice) {}
      }
    }
  }

  function customizeSdlProfileSection(sdlWrap) {
    if (!sdlWrap || sdlWrap.getAttribute('data-sdl-customized') === '1') return;
    sdlWrap.setAttribute('data-sdl-customized', '1');
    sdlWrap.classList.add('door-sdl-profile-nested-wrap');
    var titleRow = sdlWrap.querySelector('.door-option-header-row');
    if (!titleRow) return;
    var titleEl = titleRow.querySelector('.door-section-title, .door-option-title');
    if (titleEl) titleEl.style.display = 'none';
    var titleWrap = titleRow.querySelector('.door-option-title-wrap') || titleRow;
    var descEl = titleRow.querySelector('.door-sdl-profile-desc');
    if (!descEl) {
      descEl = document.createElement('p');
      descEl.className = 'door-option-desc door-sdl-profile-desc';
      titleWrap.appendChild(descEl);
    }
    descEl.textContent = 'Choose a Simulated Divided Lites (SDL) Edge Profile';
  }

  function syncSdlProfileVisibility(optionsContainer) {
    if (!optionsContainer) optionsContainer = document.getElementById('door-configurator-options');
    if (!optionsContainer) return;
    var sdlWrap = optionsContainer.querySelector('.door-option-wrap[data-option-id="sdl_profile"]');
    if (!sdlWrap) return;
    var show = shouldShowSdlProfile(optionsContainer);
    sdlWrap.classList.toggle('door-hidden', !show);
    sdlWrap.style.display = show ? '' : 'none';
    if (show) {
      applyStaticSdlProfileVisibility(optionsContainer);
    }
    if (!show) {
      sdlWrap.querySelectorAll('input[type="radio"][data-option-id="sdl_profile"]').forEach(function (inp) {
        inp.checked = false;
        var c = inp.closest && inp.closest('.common-check-option');
        if (c) c.classList.remove('common-check-option--selected');
      });
      try { updateEstimatedPrice(); } catch (eSdlPrice) {}
      try { updateDoorPreview(); } catch (eSdlPrev) {}
    }
  }

  function syncPanelProfileHero(optionsContainer) {
    if (!optionsContainer) optionsContainer = document.getElementById('door-configurator-options');
    if (!optionsContainer) return;
    var configs = [
      { heroSel: '.door-panel-profile-hero', primarySel: '.door-panel-profile-primary-option', accSel: '.door-panel-profile-accordion', descSel: '.door-panel-profile-choice-desc' },
      { heroSel: '.door-stile-rail-hero', primarySel: '.door-stile-rail-primary-option', accSel: '.door-stile-rail-accordion', descSel: '.door-stile-rail-choice-desc' }
    ];

    function isCardHidden(card) {
      if (!card) return true;
      if (card.style.display === 'none') return true;
      if (card.classList.contains('door-hidden')) return true;
      if (card.getAttribute('data-product-tag-hidden') === '1') return true;
      return false;
    }

    configs.forEach(function (cfg) {
      var hero = optionsContainer.querySelector(cfg.heroSel);
      if (!hero) return;
      var primaryWrap = hero.querySelector(cfg.primarySel);
      if (!primaryWrap) return;
      var heroCard = primaryWrap.querySelector('.common-check-option');
      if (!heroCard) return;
      if (!isCardHidden(heroCard)) return;

      var accordion = optionsContainer.querySelector(cfg.accSel);
      if (!accordion) return;
      var accBody = accordion.querySelector('.door-accordion-body .common-check-options')
        || accordion.querySelector('.common-check-options');
      if (!accBody) return;

      var accCards = accBody.querySelectorAll('.common-check-option');
      var replacement = null;
      for (var hi = 0; hi < accCards.length; hi++) {
        if (!isCardHidden(accCards[hi])) {
          replacement = accCards[hi];
          break;
        }
      }
      if (!replacement) return;

      accBody.insertBefore(heroCard, replacement);
      primaryWrap.appendChild(replacement);

      heroCard.style.display = '';
      heroCard.classList.remove('door-hidden');

      var choiceDescEl = hero.querySelector(cfg.descSel);
      if (choiceDescEl) {
        var newDesc = (replacement.getAttribute('data-choice-description') || '').trim();
        choiceDescEl.textContent = newDesc;
        choiceDescEl.style.display = newDesc ? '' : 'none';
      }
    });
    try { syncSdlProfileVisibility(optionsContainer); } catch (eSdlHero) {}
  }

  function nestSdlProfileInStileSection(optionsContainer) {
    if (!optionsContainer) optionsContainer = document.getElementById('door-configurator-options');
    if (!optionsContainer) return null;
    var sdlWrap = optionsContainer.querySelector('.door-option-wrap[data-option-id="sdl_profile"]');
    var stileWrap = optionsContainer.querySelector('.door-option-wrap[data-option-id="stile_and_rail_profile"]');
    if (!sdlWrap || !stileWrap) return null;
    var hero = stileWrap.querySelector('.door-stile-rail-hero');
    if (!hero) return null;
    var insertsOuter = stileWrap.querySelector('.door-inserts-additional-options.screen-and-storm-inserts');
    var anchor = insertsOuter || hero;
    var alreadyNested = sdlWrap.getAttribute('data-sdl-nested') === '1';
    if (!alreadyNested) {
      sdlWrap.setAttribute('data-sdl-nested', '1');
      customizeSdlProfileSection(sdlWrap);
    }
    if (sdlWrap.parentNode !== stileWrap || sdlWrap.previousSibling !== anchor) {
      if (anchor.nextSibling) {
        stileWrap.insertBefore(sdlWrap, anchor.nextSibling);
      } else {
        stileWrap.appendChild(sdlWrap);
      }
    }
    syncSdlProfileVisibility(optionsContainer);
    return alreadyNested ? false : true;
  }

  function initSdlProfileNest(optionsContainer) {
    if (!optionsContainer) optionsContainer = document.getElementById('door-configurator-options');
    if (!optionsContainer) return;
    if (optionsContainer.getAttribute('data-sdl-stile-bound') !== '1') {
      function onAppliedMoldingOrStileChange() {
        syncSdlProfileVisibility(optionsContainer);
      }
      optionsContainer.addEventListener('change', function (ev) {
        var t = ev.target;
        if (!t || t.type !== 'radio') return;
        var oid = String(t.getAttribute('data-option-id') || '');
        if (oid !== 'stile_and_rail_profile' && oid !== 'applied_molding' && oid !== 'applied_molding_choice') return;
        onAppliedMoldingOrStileChange();
      });
      optionsContainer.addEventListener('click', function (ev) {
        var card = ev.target && ev.target.closest ? ev.target.closest('.common-check-option') : null;
        if (!card) return;
        var inp = card.querySelector(
          'input[type="radio"][data-option-id="applied_molding_choice"],' +
          'input[type="radio"][data-option-id="applied_molding"]'
        );
        if (!inp) return;
        setTimeout(onAppliedMoldingOrStileChange, 0);
      });
      optionsContainer.setAttribute('data-sdl-stile-bound', '1');
    }
    var maxTries = 20;
    var tries = 0;
    function loop() {
      tries++;
      var moved = nestSdlProfileInStileSection(optionsContainer);
      if (moved === true || moved === false) return;
      if (tries >= maxTries) return;
      setTimeout(loop, 250);
    }
    setTimeout(loop, 0);
  }

  /** List price for selected stile/rail (priceValue only — no price_when overrides). */
  function getStileAndRailProfileListPrice(basePrice, config, schema) {
    if (!Array.isArray(schema) || !config) return 0;
    for (var si = 0; si < schema.length; si++) {
      var sOpt = schema[si];
      if (!optionIsStileAndRailProfile(sOpt)) continue;
      var selected = config[sOpt.id];
      if (selected == null || selected === '') return 0;
      var sChoices = Array.isArray(sOpt.options) ? sOpt.options : [];
      var sStr = String(selected);
      var sCh = sChoices.find(function (c) { return String(c && c.value != null ? c.value : '') === sStr; });
      if (!sCh) return 0;
      var sType = sCh.priceType || sCh.price_type || 'fixed';
      var sVal = parseFloat(sCh.priceValue != null ? sCh.priceValue : sCh.price_value);
      if (isNaN(sVal)) sVal = 0;
      if (sType === 'percent') return (parseFloat(basePrice) || 0) * sVal;
      return sVal;
    }
    return 0;
  }

  function optionIsPanelProfile(opt) {
    if (!opt) return false;
    return String(opt.id || '').toLowerCase().replace(/-/g, '_') === 'panel_profile';
  }

  function optionIsLocksetPrep(opt) {
    if (!opt) return false;
    return String(opt.id || '').toLowerCase().replace(/-/g, '_') === 'lockset_prep';
  }

  function optionIsHingeFinish(opt) {
    if (!opt) return false;
    return String(opt.id || '').toLowerCase().replace(/-/g, '_') === 'hinge_finish';
  }

  function optionIsTopStyle(opt) {
    if (!opt) return false;
    var id = String(opt.id || '').toLowerCase().replace(/-/g, '_');
    var lab = String(opt.label || '').toLowerCase();
    if (lab.indexOf('top style') !== -1) return true;
    if (id.indexOf('top') !== -1 && id.indexOf('style') !== -1) return true;
    // Fallback: detect by known choice values used elsewhere (round_top / arch_top).
    try {
      var choices = Array.isArray(opt.options) ? opt.options : [];
      for (var i = 0; i < choices.length; i++) {
        var v = String(choices[i] && choices[i].value != null ? choices[i].value : '').toLowerCase();
        if (v === 'round_top' || v === 'arch_top') return true;
      }
    } catch (e) {}
    return false;
  }

  /**
   * UI render order for the main option sections.
   * Only affects display sequence (no pricing/visibility logic).
   *
   * Requested order:
   * 1) door-unit-design-group (door_unit_design + sidelight_design + transom_design)
   * 2) top_style
   * 3) wood_type_storm_porch
   * 4) wood_type
   * 4) screen_and_storm_inserts
   * 5) screen_type
   * 6) glass_type
   * 7) screen_storm_insert_frame_color
   * 8) door_location
   * 9) pre_hung
   * 10) measurement_type
   * 11) stile_and_rail_profile
   * 12) panel_profile
   * 13) hinge_finish
   * 14) lockset_prep
   * 15) (post-lockset accordions are injected after lockset_prep)
   * 16) swing_direction
   * 17) glass_bevel
   * 18) applied_molding
   */
  var desiredOptionOrder = [
    'door_unit_design',
    'panel_unit_design',
    'sidelight_design',
    'transom_design',
    'pre_hung',
    'top_style',
    'wood_type_storm_porch',
    'wood_type',
    'screen_and_storm_inserts',
    'screen_type',
    'storm_glass_type',
    'glass_type',
    'swing_direction',
    'screen_storm_insert_frame_color',
    'door_location',
    'measurement_type',
    'stile_and_rail_profile',
    'applied_molding',
    'panel_profile',
    'hinge_finish',
    'lockset_prep',
    'shelf',
    'glass_bevel',
    'additional_options',
    'hardware_options',
    'casing_options'
  ];
  var desiredOptionRank = Object.create(null);
  for (var _ri = 0; _ri < desiredOptionOrder.length; _ri++) desiredOptionRank[desiredOptionOrder[_ri]] = _ri;

  function schemaForDoorRenderOrder(schema) {
    if (!Array.isArray(schema) || !schema.length) return schema || [];

    return schema
      .map(function (o, idx) { return { o: o, idx: idx }; })
      .sort(function (a, b) {
        var aKey = a && a.o ? normalizeOptionIdKey(a.o.id) : '';
        var bKey = b && b.o ? normalizeOptionIdKey(b.o.id) : '';
        var aHas = aKey && desiredOptionRank[aKey] != null;
        var bHas = bKey && desiredOptionRank[bKey] != null;
        if (aHas && bHas) return desiredOptionRank[aKey] - desiredOptionRank[bKey];
        if (aHas && !bHas) return -1;
        if (!aHas && bHas) return 1;
        return a.idx - b.idx;
      })
      .map(function (x) { return x.o; });
  }


  function buildOptionsFromRange(min, max, step) {
    var opts = [];
    var mn = parseFloat(min);
    var mx = parseFloat(max);
    var st = (step != null && step !== '') ? parseFloat(step) : 1;
    if (isNaN(mn) || isNaN(mx) || st <= 0) return opts;
    var n = Math.round((mx - mn) / st) + 1;
    for (var i = 0; i < n; i++) {
      var v = mn + i * st;
      if (v > mx) break;
      v = Math.round(v * 100) / 100;
      opts.push({ value: v, label: String(v) });
    }
    return opts;
  }

  function getCurrentConfigFromSchema() {
    if (!doorConfigSchema) return null;
    var container = document.getElementById('door-configurator-options');
    if (!container) return null;
    var config = {};
    var optType;
    doorConfigSchema.forEach(function (opt) {
      optType = (opt.type || '').toLowerCase();
      if (optType === 'dimension') {
        var cmSel = container.querySelector('select[data-option-id="' + opt.id + '"][data-unit="cm"], input[data-option-id="' + opt.id + '"][data-unit="cm"]');
        var inSel = container.querySelector('select[data-option-id="' + opt.id + '"][data-unit="in"], input[data-option-id="' + opt.id + '"][data-unit="in"]');
        var intSel = container.querySelector('select[data-option-id="' + opt.id + '"][data-unit="in-int"]');
        var fracSel = container.querySelector('select[data-option-id="' + opt.id + '"][data-unit="in-frac"]');
        if (cmSel && cmSel.value !== '') config[opt.id + '_cm'] = cmSel.value;
        if (inSel && inSel.value !== '') config[opt.id + '_in'] = inSel.value;
        if (intSel && String(intSel.value || '') !== '') {
          config[opt.id] = intSel.value;
          if (fracSel && String(fracSel.value || '') !== '') config[opt.id + '_fraction'] = fracSel.value;
        } else if (fracSel && String(fracSel.value || '') !== '' && !intSel) {
          config[opt.id] = fracSel.value;
        }
        return;
      }
      var inputs = all('select[data-option-id="' + opt.id + '"], input[data-option-id="' + opt.id + '"]', container);
      if (optType === 'checkbox') {
        config[opt.id] = inputs.filter(function (el) { return el.checked; }).map(function (el) { return el.value; });
      } else if (optType === 'radio') {
        var checkedRadio = inputs.filter(function (el) { return el.checked; })[0];
        config[opt.id] = checkedRadio ? (checkedRadio.value || null) : null;
      } else if (inputs.length) {
        var v = inputs[0].value;
        config[opt.id] = optType === 'number' && v !== '' ? parseFloat(v) : (v || null);
      }
    });

    // Extra UI-only options (not backed by metaobjects) that should still be captured in config.
    try {
      var extraIds = ['transom_count', 'door_location_exposure'];
      extraIds.forEach(function (id) {
        var checked = container.querySelector('input[type="radio"][data-option-id="' + id + '"]:checked');
        if (checked) config[id] = checked.value || null;
      });
    } catch (eExtraCfg) {}

    // Measurement dimension <select>s render from a Liquid template and DON'T carry a
    // data-option-id, so the schema loop above never captures them. Without this they
    // are missing from the saved options_json (nothing to store / restore). Capture
    // each by its deterministic select id AND the row's linked schema dimension id so
    // both the storefront restore and the admin editable dropdowns can read them back.
    try {
      var measSelects = container.querySelectorAll(
        '.door-measurement-static-panels select, .door-measurement-static-panel select, .door-measurement-embedded-dimensions select, .door-measurement-static-rows select, .door-measure-dimension-row select, .door-measure-dimension-inputs-row select'
      );
      measSelects.forEach(function (sel) {
        if (!sel) return;
        // Skip selects in hidden measurement panels (slab/combo/transom defaults) so
        // only the active/visible dimension (e.g. the chosen Exact Door Width) is stored.
        if (sel.closest && sel.closest('.door-hidden')) return;
        var v = sel.value;
        if (v == null || v === '') return;
        var keyById = sel.id || (sel.getAttribute && sel.getAttribute('data-option-id')) || '';
        if (keyById) config[keyById] = v;
        var row = sel.closest ? sel.closest('.door-measure-dimension-row') : null;
        var embedId = row && row.getAttribute ? (row.getAttribute('data-embed-dimension-id') || '') : '';
        if (embedId) {
          var isFrac = /frac/i.test(keyById) || (sel.classList && sel.classList.contains('door-dimension-frac-select'));
          config[isFrac ? (embedId + '_fraction') : embedId] = v;
        }
      });
    } catch (eMeasCfg) {}
    return config;
  }

  function getCurrentConfig() {
    var cfg = getCurrentConfigFromSchema() || {};
    try {
      var hwList = getHardwareSelectionsForConfig();
      cfg._hardware_selections = hwList;
      cfg.hardware_options = hwList.length ? hwList : null;
    } catch (eHwCfg) {}
    return cfg;
  }

  // Build line item properties for Shopify cart from current config + schema (labels as keys, choice labels as values)
  function getLineItemPropertiesFromSchema() {
    var config = getCurrentConfig();
    if (!doorConfigSchema || !Array.isArray(doorConfigSchema)) return {};
    var props = {};
    doorConfigSchema.forEach(function (opt) {
      var label = opt.label || opt.id;
      var optType = (opt.type || '').toLowerCase();
      if (optType === 'dimension') {
        var vCm = config[opt.id + '_cm'];
        var vIn = config[opt.id + '_in'];
        if (vCm != null && vCm !== '') props[label + ' (cm)'] = String(vCm);
        if (vIn != null && vIn !== '') props[label + ' (inches)'] = String(vIn);
        return;
      }
      var val = config[opt.id];
      if (val === null || val === undefined || val === '') return;
      if (optType === 'checkbox') {
        var arr = Array.isArray(val) ? val : [];
        if (arr.length === 0) return;
        var choices = opt.options || [];
        var labels = arr.map(function (v) {
          var c = choices.find(function (o) { return String(o.value || '') === String(v); });
          return c && (c.label || c.value) ? (c.label || c.value) : v;
        });
        props[label] = labels.join(', ');
      } else if ((optType === 'select' || optType === 'radio') && Array.isArray(opt.options)) {
        var ch = opt.options.find(function (o) { return String(o.value || '') === String(val); });
        props[label] = ch && (ch.label || ch.value) ? (ch.label || ch.value) : String(val);
      } else {
        props[label] = String(val);
      }
    });

    // Hardware products (multi-select with finish + qty); stored in config.hardware_options / _hardware_selections.
    try {
      var hwRows = config._hardware_selections || config.hardware_options;
      if (Array.isArray(hwRows) && hwRows.length) {
        hwRows.forEach(function (row, idx) {
          if (!row || typeof row !== 'object') return;
          var line = String(row.title || row.product_id || '');
          if (row.finish_label) line += ' — ' + row.finish_label;
          getHwFieldDefsForLineItems().forEach(function (fieldDef) {
            var part = row[fieldDef.storeLabel];
            if (part) line += ' — ' + part;
          });
          if (row.qty && row.qty > 1) line += ' (×' + row.qty + ')';
          if (line) props[idx === 0 ? 'Hardware' : 'Hardware ' + (idx + 1)] = line;
        });
      }
    } catch (eHwProps) {}

    // Extra UI-only options (not backed by schema metaobjects).
    try {
      if (config.transom_count) {
        var label = 'Single or Double Transom?';
        var v = String(config.transom_count || '');
        if (v === 'single_transom_across_both_doors') props[label] = 'Single transom across both doors';
        else if (v === 'two_transoms_one_over_each_door') props[label] = 'Two transoms, one over each door';
        else props[label] = v;
      }
    } catch (eExtraProps) {}
    try {
      if (config.door_location_exposure) {
        props['Where will the door be located?'] = String(config.door_location_exposure || '');
      }
    } catch (eExposureProps) {}
    return props;
  }

  function renderDynamicOptions(schema, container) {
    doorConfigSchema = schema;
    try { window.__doorConfigSchema = schema; } catch (eSchemaExpose) {}
    if (!Array.isArray(schema) || !schema.length) return;

    var _fullExposureWoods = {
      african_mahogany: true,
      vertical_grain_douglas_fir: true,
      honduran_mahogany: true,
      spanish_cedar: true,
      wester_red_cedar: true,
      western_red_cedar: true
    };
    var _partialExposureWoods = {
      african_mahogany: true,
      vertical_grain_douglas_fir: true,
      honduran_mahogany: true,
      spanish_cedar: true,
      wester_red_cedar: true,
      western_red_cedar: true,
      black_walnut: true,
      quarter_sawn_white_oak: true,
      cherry: true,
      red_oak: true,
      maple: true,
      white_oak: true,
      ash: true,
      ash_storm_porch: true
    };
    var WOOD_EXPOSURE_ALLOWED_IDS = {
      full_exposure: _fullExposureWoods,
      partial_exposure: _partialExposureWoods,
      protected_location: null
    };

    function normalizeWoodChoiceKey(v) {
      return String(v == null ? '' : v)
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
    }

    function resolveWoodExposureKey(card, radio, optionEl) {
      var labelText = '';
      if (card && card.querySelector) {
        var lbl = card.querySelector('.common-check-option-label');
        if (lbl) labelText = String(lbl.textContent || '').trim();
      }
      if (!labelText && optionEl) {
        labelText = String(optionEl.textContent || '').trim();
      }
      var raw = (card && card.getAttribute('data-wood-key'))
        || (optionEl && optionEl.getAttribute('data-wood-key'))
        || (card && card.getAttribute('data-choice-value'))
        || (radio && radio.value)
        || (optionEl && optionEl.value)
        || labelText
        || '';
      var key = normalizeWoodChoiceKey(raw);
      if (key) return key;
      return normalizeWoodChoiceKey(labelText);
    }

    function isWoodCardVisibleForExposure(card) {
      if (!card) return false;
      if (card.style && card.style.display === 'none') return false;
      if (card.classList && card.classList.contains('door-hidden')) return false;
      if (card.getAttribute('data-wood-exposure-hidden') === '1') return false;
      if (card.getAttribute('data-product-tag-hidden') === '1') return false;
      return true;
    }

    function ensureVisibleWoodSelected(searchRoot) {
      if (!searchRoot || !searchRoot.querySelector) return;
      ['wood_type', 'wood_type_storm_porch'].forEach(function (woodOptId) {
        var checked = searchRoot.querySelector('input[type="radio"][data-option-id="' + woodOptId + '"]:checked');
        var needsReplacement = false;
        if (checked && !checked.disabled) {
          var checkedCard = checked.closest ? checked.closest('.common-check-option') : null;
          if (isWoodCardVisibleForExposure(checkedCard)) return;
          needsReplacement = true;
        } else {
          var selEarly = searchRoot.querySelector('select[data-option-id="' + woodOptId + '"]');
          if (selEarly) {
            var currentOptEarly = selEarly.options && selEarly.selectedIndex >= 0 ? selEarly.options[selEarly.selectedIndex] : null;
            if (!currentOptEarly || !currentOptEarly.value) return;
            if (!currentOptEarly.hidden && !currentOptEarly.disabled) return;
            needsReplacement = true;
          } else {
            return;
          }
        }
        if (!needsReplacement) return;
        var radios = all('input[type="radio"][data-option-id="' + woodOptId + '"]', searchRoot);
        var picked = null;
        for (var i = 0; i < radios.length; i++) {
          var r = radios[i];
          if (r.disabled) continue;
          var card = r.closest ? r.closest('.common-check-option') : null;
          if (!isWoodCardVisibleForExposure(card)) continue;
          picked = r;
          break;
        }
        if (picked) {
          radios.forEach(function (ri) {
            ri.checked = false;
            var c = ri.closest ? ri.closest('.common-check-option') : null;
            if (c) c.classList.remove('common-check-option--selected');
          });
          picked.checked = true;
          var pickedCard = picked.closest ? picked.closest('.common-check-option') : null;
          if (pickedCard) pickedCard.classList.add('common-check-option--selected');
          try { picked.dispatchEvent(new Event('change', { bubbles: true })); } catch (eAutoWood) {}
          return;
        }
        var sel = searchRoot.querySelector('select[data-option-id="' + woodOptId + '"]');
        if (!sel) return;
        var currentOpt = sel.options && sel.selectedIndex >= 0 ? sel.options[sel.selectedIndex] : null;
        if (currentOpt && currentOpt.value && !currentOpt.hidden && !currentOpt.disabled) return;
        var firstVisible = Array.prototype.find.call(sel.options || [], function (o) {
          return o && o.value && !o.hidden && !o.disabled;
        });
        if (firstVisible) {
          sel.value = firstVisible.value;
          try { sel.dispatchEvent(new Event('change', { bubbles: true })); } catch (eAutoSel) {}
        } else if (sel.value) {
          sel.value = '';
          try { sel.dispatchEvent(new Event('change', { bubbles: true })); } catch (eClearSel) {}
        }
      });
    }

    function applyWoodExposureFilter(targetContainer) {
      if (!targetContainer) return;
      var exposureInput = targetContainer.querySelector('input[type="radio"][data-option-id="door_location_exposure"]:checked');
      if (!exposureInput) exposureInput = document.querySelector('input[type="radio"][data-option-id="door_location_exposure"]:checked');
      var exposureValue = normalizeWoodChoiceKey(exposureInput ? exposureInput.value : '');
      var allowedMap = WOOD_EXPOSURE_ALLOWED_IDS[exposureValue] || null;
      var hasAllowedMap = !!allowedMap;
      var searchRoot = targetContainer || document;
      var woodSelects = all('select[data-option-id]', searchRoot).filter(function (sel) {
        if (!sel || !sel.getAttribute) return false;
        if (sel.getAttribute('data-select-wood') === '1') return true;
        var sid = String(sel.getAttribute('data-option-id') || '').toLowerCase().replace(/-/g, '_');
        return sid.indexOf('wood') !== -1 && sid !== 'door_location_exposure';
      });
      woodSelects.forEach(function (sel) {
        var selectedOption = sel.options && sel.selectedIndex >= 0 ? sel.options[sel.selectedIndex] : null;
        var selectedAllowed = true;
        all('option', sel).forEach(function (op) {
          var key = resolveWoodExposureKey(null, null, op);
          var isPlaceholder = op.value == null || String(op.value) === '';
          var tagHiddenOp = op.getAttribute && op.getAttribute('data-product-tag-hidden') === '1';
          var show = !tagHiddenOp && (!hasAllowedMap || isPlaceholder || !!allowedMap[key]);
          op.hidden = !show;
          op.disabled = !show;
          if (selectedOption === op && !show) selectedAllowed = false;
        });
        if (!selectedAllowed) {
          var firstVisible = Array.prototype.find.call(sel.options || [], function (o) {
            return o && o.value && !o.hidden && !o.disabled;
          });
          sel.value = firstVisible ? firstVisible.value : '';
          try { sel.dispatchEvent(new Event('change', { bubbles: true })); } catch (eWoodSelect) {}
        }
      });

      var woodCards = all('.common-check-option', searchRoot).filter(function (card) {
        if (!card || !card.querySelector) return false;
        if (card.classList && card.classList.contains('door-wood-exposure-card')) return false;
        if (card.classList && card.classList.contains('select-wood-option')) return true;
        if (card.getAttribute && card.getAttribute('data-select-wood-option') === '1') return true;
        var inp = card.querySelector('input[type="radio"][data-option-id]');
        if (!inp || !inp.getAttribute) return false;
        var rid = String(inp.getAttribute('data-option-id') || '').toLowerCase().replace(/-/g, '_');
        return rid.indexOf('wood') !== -1 && rid !== 'door_location_exposure';
      });
      woodCards.forEach(function (card) {
        var radio = card.querySelector('input[type="radio"][data-option-id]');
        if (!radio) return;
        var cardKey = resolveWoodExposureKey(card, radio, null);
        var tagHidden = card.getAttribute && card.getAttribute('data-product-tag-hidden') === '1';
        var showCard = !tagHidden && (!hasAllowedMap || !!allowedMap[cardKey]);
        card.style.display = showCard ? '' : 'none';
        if (!showCard) card.setAttribute('data-wood-exposure-hidden', '1');
        else card.removeAttribute('data-wood-exposure-hidden');
        radio.disabled = !showCard;
        if (!showCard && radio.checked) {
          radio.checked = false;
          card.classList.remove('common-check-option--selected');
        }
      });
      ensureVisibleWoodSelected(searchRoot);
    }

    function computeInchesFractionOptions(unitInDef) {
      // Supports common fractional steps based on configured step.
      // If step is 0.25 => 0, 1/4, 1/2, 3/4
      // If step is 0.5  => 0, 1/2
      // If step is 1    => 0
      var step = unitInDef && unitInDef.step != null ? parseFloat(unitInDef.step) : 0.25;
      if (isNaN(step) || step <= 0) step = 0.25;

      if (step <= 0.26) {
        return [
          { value: '0', label: '0' },
          { value: '0.25', label: '1/4' },
          { value: '0.5', label: '1/2' },
          { value: '0.75', label: '3/4' }
        ];
      }
      if (step <= 0.51) {
        return [
          { value: '0', label: '0' },
          { value: '0.5', label: '1/2' }
        ];
      }
      return [{ value: '0', label: '0' }];
    }

    function formatInchesValue(inInt, fracVal) {
      var v = parseFloat(inInt) + parseFloat(fracVal);
      if (isNaN(v)) return '';
      // Avoid float artifacts (e.g. 1.4999999)
      v = Math.round(v * 100) / 100;
      var s = v.toFixed(2);
      s = s.replace(/\.00$/, '').replace(/(\.\d*?[1-9])0+$/, '$1');
      return s;
    }

    function setSplitInchesUI(optionsContainer, opt, vIn) {
      if (!optionsContainer || !opt || opt.type !== 'dimension') return;
      var unitIn = opt.unit_in || opt.range_in || {};
      var fracOptions = computeInchesFractionOptions(unitIn);

      var intSel = optionsContainer.querySelector('select[data-option-id="' + opt.id + '"][data-unit="in-int"]');
      var fracSel = optionsContainer.querySelector('select[data-option-id="' + opt.id + '"][data-unit="in-frac"]');
      var hiddenIn = optionsContainer.querySelector('input[data-option-id="' + opt.id + '"][data-unit="in"]');
      if (!intSel || !fracSel || !hiddenIn) return;

      if (vIn == null || vIn === '') {
        hiddenIn.value = '';
        intSel.value = '';
        fracSel.value = '';
        return;
      }

      var num = parseFloat(vIn);
      if (isNaN(num)) return;
      var intPart = Math.floor(num + 1e-9);
      var fracPart = Math.round((num - intPart) * 100) / 100;

      if (intPart < 1 || intPart > 50) {
        hiddenIn.value = '';
        intSel.value = '';
        fracSel.value = '';
        return;
      }

      // Match fraction to nearest allowed option.
      var fracStr = '';
      var found = fracOptions.find(function (f) {
        return Math.abs(parseFloat(f.value) - fracPart) < 1e-6;
      });
      if (found) fracStr = found.value;

      if (!fracStr) {
        hiddenIn.value = '';
        intSel.value = '';
        fracSel.value = '';
        return;
      }

      intSel.value = String(intPart);
      fracSel.value = fracStr;
      hiddenIn.value = formatInchesValue(intPart, fracStr);
    }

    function measurementMethodRadio(opt) {
      if (!opt || String(opt.type || '').toLowerCase() !== 'radio') return false;
      if (!Array.isArray(opt.options) || opt.options.length !== 2) return false;
      var labels = opt.options.map(function (x) {
        return String(x && (x.label || x.value) || '').toLowerCase();
      });
      return labels.some(function (t) { return t.indexOf('exact') !== -1; }) &&
        labels.some(function (t) { return t.indexOf('finished') !== -1 || t.indexOf('opening') !== -1; });
    }

    function isMeasurementVisualDimension(opt) {
      if (!opt || String(opt.type || '').toLowerCase() !== 'dimension') return false;
      var unitIn = opt.unit_in || opt.range_in || {};
      var hasInches = unitIn && (unitIn.min != null || unitIn.max != null || unitIn.step != null ||
        (Array.isArray(unitIn.options) && unitIn.options.length > 0));
      if (!hasInches) return false;
      var id = String(opt.id || '').toLowerCase().replace(/-/g, '_');
      var lab = String(opt.label || '').toLowerCase();
      if (opt.showWhen && typeof opt.showWhen === 'object') {
        var swKey = Object.keys(opt.showWhen)[0];
        if (swKey && String(swKey).toLowerCase().replace(/-/g, '_').indexOf('measurement') !== -1) return true;
      }
      if (id === 'measurement_type') return false;
      if (id.indexOf('exact') !== -1 || id.indexOf('finished') !== -1 || id.indexOf('opening') !== -1) return true;
      if (lab.indexOf('exact') !== -1 || lab.indexOf('finished') !== -1 || lab.indexOf('opening') !== -1) return true;
      if ((lab.indexOf('width') !== -1 || lab.indexOf('height') !== -1 || lab.indexOf('thick') !== -1) &&
        (lab.indexOf('door') !== -1 || lab.indexOf('opening') !== -1 || lab.indexOf('jamb') !== -1)) return true;
      return false;
    }

    function measureDimensionFigureKind(opt) {
      var lab = String(opt.label || '').toLowerCase();
      if (lab.indexOf('thick') !== -1) return 'thickness';
      if (lab.indexOf('height') !== -1) return 'height';
      if (lab.indexOf('width') !== -1) return 'width';
      return 'width';
    }

    function getMeasureDimensionSvg(kind) {
      var k = String(kind || 'width');
      if (k === 'thickness') {
        return '<svg class="door-measure-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140" aria-hidden="true">' +
          '<rect x="72" y="28" width="10" height="88" fill="none" stroke="#374151" stroke-width="2" rx="1"/>' +
          '<path d="M52 26 H92" stroke="#374151" stroke-width="1.6" fill="none"/>' +
          '<path d="M52 23 v6 M92 23 v6" stroke="#374151" stroke-width="1.2"/>' +
          '<polygon points="52,26 58,21 58,31" fill="#374151"/>' +
          '<polygon points="92,26 86,21 86,31" fill="#374151"/>' +
          '</svg>';
      }
      if (k === 'height') {
        return '<svg class="door-measure-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140" aria-hidden="true">' +
          '<rect x="44" y="28" width="42" height="92" fill="none" stroke="#374151" stroke-width="2" rx="1"/>' +
          '<path d="M28 22 V118" stroke="#374151" stroke-width="1.6" fill="none"/>' +
          '<path d="M25 22 h6 M25 118 h6" stroke="#374151" stroke-width="1.2"/>' +
          '<polygon points="28,22 23,28 33,28" fill="#374151"/>' +
          '<polygon points="28,118 23,112 33,112" fill="#374151"/>' +
          '</svg>';
      }
      return '<svg class="door-measure-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140" aria-hidden="true">' +
        '<rect x="38" y="32" width="44" height="88" fill="none" stroke="#374151" stroke-width="2" rx="1"/>' +
        '<path d="M28 24 H92" stroke="#374151" stroke-width="1.6" fill="none"/>' +
        '<path d="M28 21 v6 M92 21 v6" stroke="#374151" stroke-width="1.2"/>' +
        '<polygon points="28,24 34,19 34,29" fill="#374151"/>' +
        '<polygon points="92,24 86,19 86,29" fill="#374151"/>' +
        '</svg>';
    }

    function defaultMeasureDimensionHint(opt) {
      var lab = String(opt.label || '').toLowerCase();
      var opening = lab.indexOf('opening') !== -1 || lab.indexOf('finished') !== -1;
      if (opening && lab.indexOf('width') !== -1) {
        return 'Enter the widest measurement for the inside left jamb to inside right jamb.';
      }
      if (opening && lab.indexOf('height') !== -1) {
        return 'Enter the longest measurement for the inside top jamb to floor or sill.';
      }
      if (opening && lab.indexOf('thick') !== -1) {
        return 'Enter the measurement for the thickness of your door.';
      }
      if (lab.indexOf('width') !== -1) {
        return 'Enter the largest measurement for the width of your door.';
      }
      if (lab.indexOf('height') !== -1) {
        return 'Enter the tallest measurement for the height of your door.';
      }
      if (lab.indexOf('thick') !== -1) {
        return 'Enter the measurement for the thickness of your door.';
      }
      return 'Select whole inches and fraction.';
    }

    function syncMeasurementTabVisibility(method, measureOptionId) {
      doorConf2MeasurementsCall('syncMeasurementTabVisibilityCore', method, measureOptionId, container, doorConfigSchema);
    }

    function appendMeasurementTypeHeader(sectionEl, opt) {
      sectionEl.classList.add('door-measurement-type-section');

      var eyebrowEl = document.createElement('p');
      eyebrowEl.className = 'door-measurement-type-eyebrow';
      eyebrowEl.textContent = '';
      sectionEl.appendChild(eyebrowEl);

      var topBar = document.createElement('div');
      topBar.className = 'door-section-title door-option-title mb-16';

      var heading = document.createElement('span');
      heading.className = 'door-measurement-type-heading';
      heading.textContent = 'Measurements';
      heading.setAttribute('data-option-id', String(opt && opt.id ? opt.id : 'measurement_type'));

      var helpBtn = document.createElement('button');
      helpBtn.type = 'button';
      helpBtn.className = 'door-measurement-help-btn common-btn btn-secondary btn-small door-setup-tooltip-btn';
      helpBtn.setAttribute('aria-label', 'How to measure for your door');
      helpBtn.innerHTML =
        'How To Measure For Your Door ' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8.03206 4.92901C7.79606 4.92901 7.60406 4.85301 7.45606 4.70101C7.30806 4.54501 7.23406 4.35301 7.23406 4.12501C7.23406 3.90101 7.30806 3.71301 7.45606 3.56101C7.60406 3.40901 7.79606 3.33301 8.03206 3.33301C8.27206 3.33301 8.46606 3.40901 8.61406 3.56101C8.76206 3.71301 8.83606 3.90101 8.83606 4.12501C8.83606 4.35301 8.76206 4.54501 8.61406 4.70101C8.46606 4.85301 8.27206 4.92901 8.03206 4.92901ZM8.68606 6.59101L8.64406 7.64701V11.337L9.51406 11.631V11.859H6.66406V11.631L7.52206 11.337V7.78501C7.47406 7.72501 7.40406 7.66501 7.31206 7.60501C7.22406 7.54501 7.12406 7.48701 7.01206 7.43101C6.90006 7.37501 6.78606 7.32701 6.67006 7.28701V7.08301L8.53006 6.59101H8.68606Z" fill="currentColor"></path><circle cx="8" cy="8" r="7.5" stroke="currentColor"></circle></svg>';
      helpBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var evt;
        try {
          evt = new CustomEvent('door-measurement-help', { bubbles: true });
        } catch (err) {
          evt = document.createEvent('Event');
          evt.initEvent('door-measurement-help', true, true);
        }
        var rootCfg = document.getElementById('door-configurator');
        (rootCfg || sectionEl).dispatchEvent(evt);
      });

      topBar.appendChild(heading);
      topBar.appendChild(helpBtn);
      sectionEl.appendChild(topBar);

      var promptWrap = document.createElement('div');
      promptWrap.className = 'door-measurement-type-prompt';

      var qText = 'How will you measure?';
      var subText = 'The method you use matters to get the right fit.';

      var qEl = document.createElement('p');
      qEl.className = 'door-measurement-type-question fw-700 mb-8';
      var strong = document.createElement('span');
      strong.textContent = qText;
      qEl.appendChild(strong);

      var subEl = document.createElement('p');
      subEl.className = 'door-measurement-type-sub mb-24';
      subEl.textContent = subText;

      promptWrap.appendChild(qEl);
      promptWrap.appendChild(subEl);
      sectionEl.appendChild(promptWrap);
    }

    // Option accordions: render `headerId` as a collapsible section whose contents are choices from `contentId`.
    var accordionPairs = [
      { headerId: 'sidelight_design', contentId: 'sidelight_location' },
      { headerId: 'sidelight_design', contentId: 'sidelight_style' },
      // Transom aliases to support different key naming in metaobjects
      { headerId: 'transom_design', contentId: 'transom_style' },
      { headerId: 'transom_designs', contentId: 'transom_style' },
      { headerId: 'transome_design', contentId: 'transom_style' },
      { headerId: 'transome_designs', contentId: 'transom_style' }
    ];
    function findOpt(id) {
      return schema.find(function (x) { return x && String(x.id || '') === String(id); });
    }
    function hasOpt(id) { return !!findOpt(id); }
    function findAccordionForHeader(id) {
      return accordionPairs.find(function (p) { return p.headerId === String(id); }) || null;
    }
    function findAccordionForContent(id) {
      return accordionPairs.find(function (p) { return p.contentId === String(id); }) || null;
    }

    // Resolve one active header per content id (first matching pair wins).
    var activeAccordionByContent = {};
    accordionPairs.forEach(function (p) {
      if (activeAccordionByContent[p.contentId]) return;
      if (hasOpt(p.headerId) && hasOpt(p.contentId)) {
        activeAccordionByContent[p.contentId] = p;
      }
    });

    var hasMeasurementTypeBlock = schema.some(function (o) { return o && isMeasurementTypeOptionId(o.id); });
    var embeddedDimensionIds = {};
    var embeddedDimensionsOrdered = [];
    if (hasMeasurementTypeBlock) {
      schema.forEach(function (o) {
        if (!o || isMeasurementTypeOptionId(o.id)) return;
        if (String(o.type || '').toLowerCase() !== 'dimension' || !isMeasurementVisualDimension(o)) return;
        var uid = o.unit_in || o.range_in || {};
        var willSplit = uid && (uid.min != null || uid.max != null || uid.step != null || Array.isArray(uid.options) || uid.options);
        if (!willSplit) return;
        embeddedDimensionIds[String(o.id)] = true;
        embeddedDimensionsOrdered.push(o);
      });
    }

    function appendDimensionControlsTo(parentEl, opt, embedAsRow) {
      var unitInEarly = opt.unit_in || opt.range_in || {};
      var willHaveInchSplitEarly = unitInEarly && (unitInEarly.min != null || unitInEarly.max != null ||
        unitInEarly.step != null || Array.isArray(unitInEarly.options) || unitInEarly.options);
      var useMeasureVisual = isMeasurementVisualDimension(opt) && willHaveInchSplitEarly;

      var dimRow = document.createElement('div');
      dimRow.className = useMeasureVisual ? 'door-measure-dimension-row' : 'door-row door-dimension-row';
      if (embedAsRow) {
        dimRow.setAttribute('data-embed-dimension-id', String(opt.id));
      }
      if (useMeasureVisual && !embedAsRow) {
        parentEl.classList.add('door-measure-dimension-section');
      }

      if (!useMeasureVisual) {
        var dimLabel = document.createElement('label');
        dimLabel.className = 'door-row-label';
        dimLabel.textContent = opt.label;
        dimRow.appendChild(dimLabel);
      }

      var dimInputs = document.createElement('div');
      dimInputs.className = useMeasureVisual ? 'door-measure-dimension-inputs' : 'door-row-inputs';
      var getDimOptions = function (unitDef) {
        if (!unitDef) return [];
        if (Array.isArray(unitDef.options)) return unitDef.options;
        if (unitDef.min != null && unitDef.max != null) {
          return buildOptionsFromRange(unitDef.min, unitDef.max, unitDef.step != null ? unitDef.step : 1);
        }
        return [];
      };
      var unitCm = opt.unit_cm || opt.range_cm || {};
      var unitIn = opt.unit_in || opt.range_in || {};
      var cmOpts = getDimOptions(unitCm);
      function addDimSelect(unit, unitLabel, options) {
        var sel = document.createElement('select');
        sel.setAttribute('data-option-id', opt.id);
        sel.setAttribute('data-unit', unit);
        sel.className = 'door-input-select door-dimension-select' + (useMeasureVisual ? ' door-measure-dimension-dd' : '');
        sel.id = 'door-opt-' + opt.id + '-' + unit;
        sel.name = 'attributes[' + (opt.label || opt.id) + ' ' + unitLabel + ']';
        var ph = document.createElement('option');
        ph.value = '';
        ph.textContent = 'Select';
        ph.id = buildOptionDomId(sel.id, 'placeholder', 0);
        sel.appendChild(ph);
        options.forEach(function (o) {
          var op = document.createElement('option');
          op.value = o.value != null && o.value !== '' ? String(o.value) : '';
          op.textContent = o.label != null ? o.label : String(o.value || '');
          op.id = buildOptionDomId(sel.id, op.value || op.textContent, sel.options.length);
          sel.appendChild(op);
        });
        sel.addEventListener('change', updateEstimatedPrice);
        dimInputs.appendChild(sel);
        var u = document.createElement('span');
        u.className = 'door-unit-label';
        u.textContent = unitLabel;
        dimInputs.appendChild(u);
      }
      if (cmOpts.length) addDimSelect('cm', 'cm', cmOpts);

      if (unitIn && (unitIn.min != null || unitIn.max != null || unitIn.step != null || Array.isArray(unitIn.options) || unitIn.options)) {
        var fracOptions = computeInchesFractionOptions(unitIn);

        var intSel = document.createElement('select');
        intSel.setAttribute('data-option-id', opt.id);
        intSel.setAttribute('data-unit', 'in-int');
        intSel.className = 'door-input-select door-dimension-int-select' + (useMeasureVisual ? ' door-measure-dimension-dd' : '');
        intSel.id = 'door-opt-' + opt.id + '-in-int';
        intSel.name = '';
        var phInt = document.createElement('option');
        phInt.value = '';
        phInt.textContent = 'Select';
        phInt.id = buildOptionDomId(intSel.id, 'placeholder', 0);
        intSel.appendChild(phInt);
        for (var ii = 1; ii <= 50; ii++) {
          var opInt = document.createElement('option');
          opInt.value = String(ii);
          opInt.textContent = String(ii);
          opInt.id = buildOptionDomId(intSel.id, opInt.value, ii);
          intSel.appendChild(opInt);
        }

        var fracSel = document.createElement('select');
        fracSel.setAttribute('data-option-id', opt.id);
        fracSel.setAttribute('data-unit', 'in-frac');
        fracSel.className = 'door-input-select door-dimension-frac-select' + (useMeasureVisual ? ' door-measure-dimension-dd' : '');
        fracSel.id = 'door-opt-' + opt.id + '-in-frac';
        fracSel.name = '';
        var phFrac = document.createElement('option');
        phFrac.value = '';
        phFrac.textContent = 'Select';
        phFrac.id = buildOptionDomId(fracSel.id, 'placeholder', 0);
        fracSel.appendChild(phFrac);
        fracOptions.forEach(function (f) {
          var opF = document.createElement('option');
          opF.value = f.value;
          opF.textContent = f.label;
          opF.id = buildOptionDomId(fracSel.id, opF.value || opF.textContent, fracSel.options.length);
          fracSel.appendChild(opF);
        });

        var hiddenIn = document.createElement('input');
        hiddenIn.type = 'hidden';
        hiddenIn.setAttribute('data-option-id', opt.id);
        hiddenIn.setAttribute('data-unit', 'in');
        hiddenIn.id = 'door-opt-' + opt.id + '-in';
        hiddenIn.value = '';

        function syncHidden() {
          var iVal = intSel.value;
          var fVal = fracSel.value;
          if (iVal === '' || fVal === '') {
            hiddenIn.value = '';
          } else {
            hiddenIn.value = formatInchesValue(iVal, fVal);
          }
          updateEstimatedPrice();
        }

        intSel.addEventListener('change', syncHidden);
        fracSel.addEventListener('change', syncHidden);

        dimInputs.appendChild(intSel);
        dimInputs.appendChild(fracSel);
        dimInputs.appendChild(hiddenIn);

        var u = document.createElement('span');
        u.className = 'door-unit-label';
        u.textContent = 'inches';
        dimInputs.appendChild(u);
      }

      if (useMeasureVisual && dimInputs.querySelector('select[data-unit="in-int"]')) {
        var fig = document.createElement('div');
        fig.className = 'door-measure-dimension-figure';
        fig.innerHTML = getMeasureDimensionSvg(measureDimensionFigureKind(opt));

        var body = document.createElement('div');
        body.className = 'door-measure-dimension-body';
        var titleEl = document.createElement('h4');
        titleEl.className = 'door-measure-dimension-title';
        titleEl.textContent = opt.label || opt.id || '';
        titleEl.setAttribute('data-option-id', String(opt.id || ''));

        var hintEl = document.createElement('p');
        hintEl.className = 'door-measure-dimension-hint';
        var hintRaw = '';
        if (opt.description) {
          hintRaw = typeof opt.description === 'string' ? opt.description : (opt.description && (opt.description.value || opt.description.text)) || '';
        }
        hintRaw = String(hintRaw || '').trim();
        hintEl.textContent = hintRaw || defaultMeasureDimensionHint(opt);

        var inputRow = document.createElement('div');
        inputRow.className = 'door-measure-dimension-inputs-row';
        while (dimInputs.firstChild) {
          inputRow.appendChild(dimInputs.firstChild);
        }
        body.appendChild(titleEl);
        body.appendChild(hintEl);
        body.appendChild(inputRow);
        dimRow.appendChild(fig);
        dimRow.appendChild(body);
      } else {
        dimRow.appendChild(dimInputs);
      }

      parentEl.appendChild(dimRow);
    }

    var schemaOrdered = schemaForDoorRenderOrder(schema);
    var doorUnitDesignGroup = null;
    var deferredDoorSetupWrap = null;
    var doorUnitGroupMemberIds = ['door_unit_design', 'sidelight_design', 'transom_design'];
    var lastDoorUnitGroupId = null;
    for (var dgi = doorUnitGroupMemberIds.length - 1; dgi >= 0; dgi--) {
      var dgmId = doorUnitGroupMemberIds[dgi];
      if (schemaOrdered.some(function (o) { return o && String(o.id || '') === dgmId; })) {
        lastDoorUnitGroupId = dgmId;
        break;
      }
    }
    function appendDeferredDoorSetupToUnitGroup() {
      if (!deferredDoorSetupWrap || !doorUnitDesignGroup) return;
      doorUnitDesignGroup.appendChild(deferredDoorSetupWrap);
      deferredDoorSetupWrap = null;
    }
    schemaOrdered.forEach(function (opt) {
      var optId = String(opt.id || '');
      var optIdNorm = normalizeOptionIdKey(optId);
      if (hasMeasurementTypeBlock && embeddedDimensionIds[optId]) {
        return;
      }
      // glass_bevel is rendered as a switch directly under the glass_type cards.
      if (optIdNorm === 'glass_bevel') {
        return;
      }
      // door_location is rendered inside the wood_type section as exposure cards.
      if (optIdNorm === 'door_location') {
        return;
      }
      // pre_hung section is hidden.
      if (optIdNorm === 'pre_hung') {
        return;
      }
      // swing_direction: skip if no options.
      if (optIdNorm === 'swing_direction' && (!opt.options || !opt.options.length)) {
        return;
      }
      // applied_molding: skip if no options.
      if (optIdNorm === 'applied_molding' && (!opt.options || !opt.options.length)) {
        return;
      }
      var isDoorUnitGroupOpt = (optId === 'door_unit_design' || optId === 'sidelight_design' || optId === 'transom_design');
      if (!doorUnitDesignGroup && isDoorUnitGroupOpt) {
        // Product name header right before the door unit design group.
        try {
          var rootCfgEl = document.getElementById('door-configurator');
          var pn = rootCfgEl ? (rootCfgEl.getAttribute('data-product-name') || '') : '';
          pn = String(pn || '').trim();
          if (pn) {
            var nameEl = document.createElement('div');
            nameEl.className = 'door-section door-product-name';
            var p = document.createElement('h2');
            p.className = ' mb-24 p-xl';
            var s = document.createElement('span');
            s.textContent = pn;
            p.appendChild(s);
            nameEl.appendChild(p);
            container.appendChild(nameEl);
          }
        } catch (eProdName) {}
        doorUnitDesignGroup = document.createElement('div');
        doorUnitDesignGroup.className = 'door-section door-unit-design-group';
        container.appendChild(doorUnitDesignGroup);
      }
      var shouldAppendIntoDoorUnitGroup = !!doorUnitDesignGroup && (optId === 'door_unit_design' || optId === 'sidelight_design' || optId === 'transom_design');
      var section = document.createElement('div');
      section.className = 'door-section door-option-wrap';
      section.setAttribute('data-option-id', opt.id);
      var isMeasureMethodHeader = measurementMethodRadio(opt) || isMeasurementTypeOptionId(opt.id);
      var accordionHeader = findAccordionForHeader(optId);
      var accordionContent = findAccordionForContent(optId);
      var isRowOnly = (opt.type || '').toLowerCase() === 'dimension'
        || ((opt.type || '').toLowerCase() === 'select' && opt.unit_label)
        || !!accordionHeader;

      // Render content options only inside their header accordion (when both exist).
      var activeForThisContent = activeAccordionByContent[optId];
      if (activeForThisContent) {
        return;
      }

      // Special UI: header option becomes a single accordion header,
      // and the accordion content is rendered from the content option choices.
      var activeForThisHeader = null;
      Object.keys(activeAccordionByContent).forEach(function (contentId) {
        var p = activeAccordionByContent[contentId];
        if (p && p.headerId === optId) activeForThisHeader = p;
      });
      if (accordionHeader && activeForThisHeader) {
        var headerDescription = opt.description;

        // Header
        section.classList.add('door-option-accordion');

        var headerBtn = document.createElement('button');
        headerBtn.type = 'button';
        headerBtn.className = 'door-accordion-header';

        var headerRow = document.createElement('div');
        headerRow.className = 'door-option-header-row';

        var leftWrap = document.createElement('div');
        leftWrap.className = 'door-option-title-wrap';
        var headerText = document.createElement('div');
        headerText.className = 'door-accordion-header-text door-option-title';
        headerText.textContent = opt.label || 'Details';
        leftWrap.appendChild(headerText);
        if (headerDescription) {
          var d = typeof headerDescription === 'string' ? headerDescription : (headerDescription && (headerDescription.value || headerDescription.text)) || '';
          d = String(d || '').trim();
          if (d) {
            var dEl = document.createElement('div');
            dEl.className = 'door-option-desc' + (String(optId || '').toLowerCase().replace(/-/g, '_') === 'panel_profile' ? ' d-none' : '');
            dEl.textContent = d;
            leftWrap.appendChild(dEl);
          }
        }
        headerRow.appendChild(leftWrap);

        headerBtn.appendChild(headerRow);

        var accordionPlusSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
          '<rect x="7" width="2" height="16" rx="1" fill="currentColor"></rect>' +
          '<rect x="16" y="7" width="2" height="16" rx="1" transform="rotate(90 16 7)" fill="currentColor"></rect>' +
          '</svg>';
        var accordionMinusSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
          '<rect x="0" y="7" width="16" height="2" rx="1" fill="currentColor"></rect>' +
          '</svg>';

        var sign = document.createElement('span');
        sign.className = 'door-accordion-sign';
        sign.innerHTML = accordionPlusSvg;
        var isSidelightAccordion = String(optId || '') === 'sidelight_design';
        var isTransomAccordion = String(optId || '').indexOf('transom') !== -1;
        var removeBtn = null;
        function headerActionOptionIds() {
          if (isSidelightAccordion) return ['sidelight_location', 'sidelight_style'];
          if (isTransomAccordion) return ['transom_style'];
          return [];
        }
        function syncHeaderActions() {
          if (!removeBtn) return;
          var ids = headerActionOptionIds();
          var anyChecked = false;
          for (var i0 = 0; i0 < ids.length; i0++) {
            if (body.querySelector('input[type="radio"][data-option-id="' + ids[i0] + '"]:checked')) {
              anyChecked = true;
              break;
            }
          }
          removeBtn.style.setProperty('display', anyChecked ? '' : 'none', 'important');
          sign.style.setProperty('display', anyChecked ? 'none' : '', 'important');
        }
        if (isSidelightAccordion || isTransomAccordion) {
          removeBtn = document.createElement('button');
          removeBtn.type = 'button';
          removeBtn.className = 'door-accordion-remove-btn common-btn btn-woodDust btn-small';
          removeBtn.innerHTML =
            'Remove ' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">' +
            '<path d="M10.6667 3.99967V3.46634C10.6667 2.7196 10.6667 2.34624 10.5213 2.06102C10.3935 1.81014 10.1895 1.60616 9.93865 1.47833C9.65344 1.33301 9.28007 1.33301 8.53333 1.33301H7.46667C6.71993 1.33301 6.34656 1.33301 6.06135 1.47833C5.81046 1.60616 5.60649 1.81014 5.47866 2.06102C5.33333 2.34624 5.33333 2.7196 5.33333 3.46634V3.99967M6.66667 7.66634V10.9997M9.33333 7.66634V10.9997M2 3.99967H14M12.6667 3.99967V11.4663C12.6667 12.5864 12.6667 13.1465 12.4487 13.5743C12.2569 13.9506 11.951 14.2566 11.5746 14.4484C11.1468 14.6663 10.5868 14.6663 9.46667 14.6663H6.53333C5.41323 14.6663 4.85318 14.6663 4.42535 14.4484C4.04903 14.2566 3.74307 13.9506 3.55132 13.5743C3.33333 13.1465 3.33333 12.5864 3.33333 11.4663V3.99967" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>' +
            '</svg>';
          removeBtn.addEventListener('click', function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            try {
              var ids = headerActionOptionIds();
              var hadSidelight = false;
              var hadTransom = false;
              if (isSidelightAccordion) {
                hadSidelight = !!body.querySelector('input[type="radio"][data-option-id="sidelight_style"]:checked');
              }
              if (isTransomAccordion) {
                hadTransom = !!body.querySelector('input[type="radio"][data-option-id="transom_style"]:checked');
              }

              ids.forEach(function (id0) {
                var qs = 'input[type="radio"][data-option-id="' + id0 + '"]';
                body.querySelectorAll(qs).forEach(function (inp) { inp.checked = false; });
                body.querySelectorAll('.door-option-wrap[data-option-id="' + id0 + '"] .common-check-option').forEach(function (c) {
                  c.classList.remove('common-check-option--selected');
                });
              });

              applyHideWhen(doorConfigSchema, container);
              applyChoiceVisibility(doorConfigSchema, container);
              applyProductTagChoiceVisibility(doorConfigSchema, container);
              applyWoodExposureFilter(container);
              syncPanelProfileHero(container);
              syncMeasurementTypeSectionPreHungGate(doorConfigSchema, container);
              syncHingeFinishVisibility(doorConfigSchema, container);
              syncMeasurementTabCardVisibility(container, doorConfigSchema);
              syncSlabSidelightMeasurementUI(container, doorConfigSchema);
              runMeasurementUiSync();
              if (
                window.DoorIntExtPricingRule
                && typeof window.DoorIntExtPricingRule.syncSidelightTransomAddonsFromStyleSelection === 'function'
              ) {
                window.DoorIntExtPricingRule.syncSidelightTransomAddonsFromStyleSelection(null, {
                  removedSidelight: isSidelightAccordion && hadSidelight,
                  removedTransom: isTransomAccordion && hadTransom
                });
              }
              if (
                window.DoorIntExtPricingRule
                && typeof window.DoorIntExtPricingRule.refreshGeneralIntExtOversizedFromDomIfReady === 'function'
              ) {
                window.DoorIntExtPricingRule.refreshGeneralIntExtOversizedFromDomIfReady(null);
              } else if (
                window.DoorIntExtPricingRule
                && typeof window.DoorIntExtPricingRule.syncEstimatedPriceDisplay === 'function'
              ) {
                window.DoorIntExtPricingRule.syncEstimatedPriceDisplay({ source: 'sidelightTransomRemove' });
              }
              updateEstimatedPrice();
              updateDoorPreview();
              syncHeaderActions();
              syncSidelightTransomAccordionHeaderUi(container);
            } catch (e) {
              updateEstimatedPrice();
              updateDoorPreview();
              syncHeaderActions();
            }
          });
        }
        if (removeBtn) headerBtn.appendChild(removeBtn);
        headerBtn.appendChild(sign);

        // Body
        var body = document.createElement('div');
        body.className = 'door-accordion-body';

        function appendRadioGrid(contentOpt) {
          if (!contentOpt) return;
          var radioWrap = document.createElement('div');
          var contentOptIdLower = String(contentOpt.id || '').toLowerCase();
          var contentOptLabelLower = String(contentOpt.label || '').toLowerCase();
          var isSidelightStyleCards = String(contentOpt.id || '') === 'sidelight_style';
          var isTransomStyleCards = String(contentOpt.id || '') === 'transom_style'
            && String(optId || '').indexOf('transom') !== -1;
          var isSelectWoodCards = contentOptIdLower.indexOf('wood') !== -1 || contentOptLabelLower.indexOf('wood') !== -1;
          radioWrap.className = 'common-check-options' + (isSelectWoodCards ? ' select-wood-options' : '');

          var gridChoices = contentOpt.options || [];
          if (String(contentOpt.id || '') === 'door_unit_design' && gridChoices.length > 2) {
            gridChoices = gridChoices.slice(0, 2); // remove last 2 options
          }
          gridChoices.forEach(function (o) {
            var card = document.createElement('label');
            card.className = 'common-check-option'
              + (isSidelightStyleCards ? ' sidelight-style-option' : '')
              + (isTransomStyleCards ? ' transom-style-option' : '')
              + (isSelectWoodCards ? ' select-wood-option' : '');
            card.setAttribute('data-choice-value', o.value != null && o.value !== '' ? String(o.value) : '');
            if (isSelectWoodCards) {
              card.setAttribute('data-wood-key', normalizeWoodChoiceKey(o.label || o.value || ''));
              card.setAttribute('data-select-wood-option', '1');
            }

            var radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'attributes[' + (contentOpt.label || contentOpt.id) + ']';
            radio.value = o.value != null && o.value !== '' ? String(o.value) : '';
            radio.setAttribute('data-option-id', contentOpt.id);
            radio.style.position = 'absolute';
            radio.style.opacity = '0';
            radio.style.pointerEvents = 'none';
            card.appendChild(radio);

            // Door unit design cards should be text-only (no thumbnail image).
            if (o.image && String(contentOpt.id || '') !== 'door_unit_design') {
              var img = document.createElement('img');
              img.src = typeof o.image === 'string' ? o.image : (o.image && (o.image.url || o.image.src)) || '';
              img.alt = o.label || o.value || '';
              img.className = 'common-check-option-image';
              if (img.src) card.appendChild(img);
            }

            var textWrap = document.createElement('div');
            textWrap.className = 'common-check-option-text';

            var text = document.createElement('span');
            text.className = 'common-check-option-label';
            text.textContent = o.label || o.value || '';
            textWrap.appendChild(text);

            if (o.description) {
              var desc = document.createElement('span');
              desc.className = 'common-check-option-desc';

              var dd = o.description;
              var descText = '';
              if (typeof dd === 'string' || typeof dd === 'number' || typeof dd === 'boolean') {
                descText = String(dd);
              } else if (dd && typeof dd === 'object') {
                if (typeof dd.value === 'string') descText = dd.value;
                else if (typeof dd.text === 'string') descText = dd.text;
                else if (typeof dd.label === 'string') descText = dd.label;
                else if (typeof dd.html === 'string') {
                  var tmp = document.createElement('div');
                  tmp.innerHTML = dd.html;
                  descText = tmp.textContent || tmp.innerText || '';
                } else {
                  ['content', 'description', 'subtext', 'note'].forEach(function (k) {
                    if (!descText && dd && typeof dd[k] === 'string') descText = dd[k];
                  });
                }
              }
              descText = String(descText || '').trim();
              if (descText) {
                desc.textContent = descText;
                textWrap.appendChild(desc);
              }
            }

            card.appendChild(textWrap);

            radio.addEventListener('change', function () {
              radioWrap.querySelectorAll('.common-check-option').forEach(function (c) { c.classList.remove('common-check-option--selected'); });
              if (this.checked && this.closest) {
                var selCard = this.closest('.common-check-option');
                if (selCard) selCard.classList.add('common-check-option--selected');
              }
              updateEstimatedPrice();
            });

            radioWrap.appendChild(card);
          });

          var innerWrap = document.createElement('div');
          innerWrap.className = 'door-option-wrap';
          innerWrap.setAttribute('data-option-id', contentOpt.id);
          innerWrap.style.border = '0';
          innerWrap.style.padding = '0';
          innerWrap.style.margin = '0';
          innerWrap.appendChild(radioWrap);

          // Add a title before the sidelight style grid (inside the sidelight accordion).
          if (optId === 'sidelight_design' && String(contentOpt.id || '') === 'sidelight_style') {
            var preTitle = document.createElement('p');
            preTitle.className = 'mb-16';
            preTitle.textContent = 'Select your sidelight style';
            preTitle.style.margin = '12px 0 0 0';
            body.appendChild(preTitle);
          }

          // Add a title before the transom style grid (inside the transom accordion).
          if (String(optId || '') === 'transom_design' && String(contentOpt.id || '') === 'transom_style') {
            var preTitleTransom = document.createElement('p');
            preTitleTransom.className = 'mb-16';
            preTitleTransom.textContent = 'Select your transom style';
            preTitleTransom.style.margin = '12px 0 0 0';
            body.appendChild(preTitleTransom);
          }

          body.appendChild(innerWrap);
        }

        function appendTransomCountOption() {
          var wrap = document.createElement('div');
          wrap.className = 'door-option-wrap door-transom-count-wrap';
          wrap.setAttribute('data-option-id', 'transom_count');
          wrap.style.border = '0';
          wrap.style.padding = '0';
          wrap.style.margin = '1rem 0 0 0';

          var q = document.createElement('p');
          q.className = 'fw-700 mb-8';
          q.textContent = 'Single or Double Transom?';
          wrap.appendChild(q);

          var sub = document.createElement('p');
          sub.className = 'door-option-desc mb-16';
          sub.textContent = 'Would you like a single over both doors or double transom, with one transom over each door?';
          wrap.appendChild(sub);

          var radioWrap = document.createElement('div');
          radioWrap.className = 'common-check-options';

          var choices = [
            { value: 'single_transom_across_both_doors', label: 'Single transom across both doors' },
            { value: 'two_transoms_one_over_each_door', label: 'Two transoms, one over each door' }
          ];

          choices.forEach(function (o) {
            var card = document.createElement('label');
            card.className = 'common-check-option';
            card.setAttribute('data-choice-value', o.value);

            var radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'attributes[Single or Double Transom?]';
            radio.value = o.value;
            radio.setAttribute('data-option-id', 'transom_count');
            radio.style.position = 'absolute';
            radio.style.opacity = '0';
            radio.style.pointerEvents = 'none';
            card.appendChild(radio);

            var textWrap = document.createElement('div');
            textWrap.className = 'common-check-option-text';
            var text = document.createElement('span');
            text.className = 'common-check-option-label';
            text.textContent = o.label;
            textWrap.appendChild(text);
            card.appendChild(textWrap);

            radio.addEventListener('change', function () {
              radioWrap.querySelectorAll('.common-check-option').forEach(function (c) { c.classList.remove('common-check-option--selected'); });
              if (this.checked && this.closest) {
                var selCard = this.closest('.common-check-option');
                if (selCard) selCard.classList.add('common-check-option--selected');
              }
              updateEstimatedPrice();
              updateDoorPreview();
            });

            radioWrap.appendChild(card);
          });

          wrap.appendChild(radioWrap);
          body.appendChild(wrap);

          function syncVisibility() {
            var optionsRoot = document.getElementById('door-configurator-options');
            var doorUnitNow = optionsRoot
              ? optionsRoot.querySelector('input[type="radio"][data-option-id="door_unit_design"]:checked')
              : null;
            var isDoubleNow = !!doorUnitNow && String(doorUnitNow.value || '') === 'double_door';
            wrap.classList.toggle('door-hidden', !isDoubleNow);

            if (!isDoubleNow) {
              wrap.querySelectorAll('input[type="radio"][data-option-id="transom_count"]').forEach(function (inp) {
                inp.checked = false;
              });
              wrap.querySelectorAll('.common-check-option').forEach(function (c) {
                c.classList.remove('common-check-option--selected');
              });
            }
          }

          // Initial sync and keep in sync with door unit changes.
          syncVisibility();
          document.addEventListener('change', function (e) {
            var t = e && e.target;
            if (!t || t.tagName !== 'INPUT') return;
            var oid = t.getAttribute('data-option-id');
            if (oid === 'door_unit_design') syncVisibility();
          });
        }

        // Sidelight accordion should contain two choice blocks in order.
        if (optId === 'sidelight_design') {
          appendRadioGrid(findOpt('sidelight_location'));
          appendRadioGrid(findOpt('sidelight_style'));
        } else {
          var activeContentOpt = findOpt(activeForThisHeader.contentId);
          // If transom_design has no backend options, skip rendering this accordion.
          if (isTransomAccordion) {
            var hasTransomChoices = !!(activeContentOpt && Array.isArray(activeContentOpt.options) && activeContentOpt.options.length > 0);
            if (!hasTransomChoices) {
              if (shouldAppendIntoDoorUnitGroup && optId === lastDoorUnitGroupId) appendDeferredDoorSetupToUnitGroup();
              if (optId === 'transom_design') doorUnitDesignGroup = null;
              return;
            }
          }
          appendRadioGrid(activeContentOpt);
        }

        // Add "Single or Double Transom?" option after all transom checkboxes/cards.
        if (String(optId || '').indexOf('transom') !== -1) {
          appendTransomCountOption();
        }

        if (isSidelightAccordion || isTransomAccordion) {
          // Delegate sync to any input change within this accordion body.
          body.addEventListener('change', function (e) {
            var t = e && e.target;
            if (!t || t.tagName !== 'INPUT') return;
            if (t.type !== 'radio') return;
            syncHeaderActions();
          });
          syncHeaderActions();
        }

        headerBtn.addEventListener('click', function () {
          var opened = body.classList.toggle('door-accordion-body--open');
          sign.innerHTML = opened ? accordionMinusSvg : accordionPlusSvg;
        });

        section.appendChild(headerBtn);
        section.appendChild(body);

        if (shouldAppendIntoDoorUnitGroup) {
          doorUnitDesignGroup.appendChild(section);
          if (optId === lastDoorUnitGroupId) appendDeferredDoorSetupToUnitGroup();
          if (optId === 'transom_design') doorUnitDesignGroup = null;
        } else {
          container.appendChild(section);
        }
        return;
      }

      if (!isRowOnly) {
        if (isMeasureMethodHeader) {
          appendMeasurementTypeHeader(section, opt);
        } else {
        var headerRow = document.createElement('div');
        headerRow.className = 'door-option-header-row';

        var leftWrap = document.createElement('div');
        leftWrap.className = 'door-option-title-wrap';
        var title = document.createElement('p');
        title.className = 'door-section-title door-option-title';
        var titleText = document.createElement('span');
        var optIdNormHeader = normalizeOptionIdKey(opt.id);
        var isSdlProfileOpt = optIdNormHeader === 'sdl_profile';
        if (isSdlProfileOpt) {
          var sdlDescHeader = document.createElement('p');
          sdlDescHeader.className = 'door-option-desc door-sdl-profile-desc';
          sdlDescHeader.textContent = 'Choose a Simulated Divided Lites (SDL) Edge Profile';
          leftWrap.appendChild(sdlDescHeader);
        } else {
          titleText.textContent = (optIdNormHeader === 'door_sweep') ? 'Door Sweep' : opt.label;
          title.appendChild(titleText);
          leftWrap.appendChild(title);
        }
        if (opt.description && optIdNormHeader !== 'panel_profile' && optIdNormHeader !== 'stile_and_rail_profile' && !isSdlProfileOpt) {
          var d = typeof opt.description === 'string' ? opt.description : (opt.description && (opt.description.value || opt.description.text)) || '';
          d = String(d || '').trim();
          if (d) {
            var dEl = document.createElement('p');
            dEl.className = 'door-option-desc';
            dEl.textContent = d;
            leftWrap.appendChild(dEl);
          }
        }
        headerRow.appendChild(leftWrap);

        // Only for "Screen & Storm Inserts": show tooltip-style drawer trigger button.
        try {
          var labelLower = String(opt.label || '').toLowerCase();
          var isInsertsOption = labelLower.indexOf('screen') !== -1 && labelLower.indexOf('storm') !== -1 && labelLower.indexOf('insert') !== -1;
          var optIdLower = String(opt.id || '').toLowerCase();
          var isWoodOption = (optIdLower.indexOf('wood') !== -1 || labelLower.indexOf('wood') !== -1);
          var isScreenTypeOption = (labelLower.indexOf('screen') !== -1 && labelLower.indexOf('type') !== -1)
            || (optIdLower.indexOf('screen') !== -1 && optIdLower.indexOf('type') !== -1)
            || optIdLower === 'select_screen';
          var isStormGlassOption = (labelLower.indexOf('storm') !== -1 && labelLower.indexOf('glass') !== -1)
            || optIdLower === 'storm_glass_type'
            || optIdLower === 'storm_glass';
          var isStileRailProfile = optionIsStileAndRailProfile(opt);
          var isPanelProfileOpt = optionIsPanelProfile(opt);
          var isPanelUnitDesignOpt = optionIsPanelUnitDesign(opt);
          var rawOptId = String(opt.id || '');
          var safeOptId = rawOptId ? rawOptId.replace(/[^a-zA-Z0-9_-]/g, '-') : '';
          var woodTooltipId = (isWoodOption && safeOptId) ? ('door-wood-options-tooltip--' + safeOptId) : '';

          // For "Stile and Rail Profile": show Edge Profile drawer button (same modal as theme's edge_profile).
          if (isStileRailProfile && title && !title.querySelector('.door-edge-profile-btn')) {
            var edgeBtn2 = document.createElement('button');
            edgeBtn2.type = 'button';
            edgeBtn2.className = 'wood-species-open-btn common-btn btn-secondary btn-small door-edge-profile-btn';
            edgeBtn2.setAttribute('data-wood-drawer-open', '');
            edgeBtn2.setAttribute('aria-haspopup', 'dialog');
            edgeBtn2.setAttribute('aria-controls', getEdgeProfileDrawerAriaControls() || getDoorSetupDrawerAriaControls());
            edgeBtn2.innerHTML = 'About Stile and Rail Profiles'+ 
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8.03206 4.92901C7.79606 4.92901 7.60406 4.85301 7.45606 4.70101C7.30806 4.54501 7.23406 4.35301 7.23406 4.12501C7.23406 3.90101 7.30806 3.71301 7.45606 3.56101C7.60406 3.40901 7.79606 3.33301 8.03206 3.33301C8.27206 3.33301 8.46606 3.40901 8.61406 3.56101C8.76206 3.71301 8.83606 3.90101 8.83606 4.12501C8.83606 4.35301 8.76206 4.54501 8.61406 4.70101C8.46606 4.85301 8.27206 4.92901 8.03206 4.92901ZM8.68606 6.59101L8.64406 7.64701V11.337L9.51406 11.631V11.859H6.66406V11.631L7.52206 11.337V7.78501C7.47406 7.72501 7.40406 7.66501 7.31206 7.60501C7.22406 7.54501 7.12406 7.48701 7.01206 7.43101C6.90006 7.37501 6.78606 7.32701 6.67006 7.28701V7.08301L8.53006 6.59101H8.68606Z" fill="currentColor"></path><circle cx="8" cy="8" r="7.5" stroke="currentColor"></circle></svg>';
            ;
            edgeBtn2.addEventListener('click', function (ev) {
              ev.preventDefault();
              ev.stopPropagation();
              edgeBtn2.setAttribute('aria-controls', getEdgeProfileDrawerAriaControls() || getDoorSetupDrawerAriaControls());
              // Open Edge Profile Options drawer (not Door Setup Options).
              if (!openEdgeProfileDrawer()) openDoorSetupDrawer();
            });
            title.appendChild(edgeBtn2);
          }
          // For "Panel Profile": show Panel Profile modal button (same pattern as other sections).
          if (isPanelProfileOpt && title && !title.querySelector('.door-panel-profile-btn')) {
            var panelBtn = document.createElement('button');
            panelBtn.type = 'button';
            panelBtn.className = 'wood-species-open-btn common-btn btn-secondary btn-small door-panel-profile-btn';
            panelBtn.setAttribute('data-panel-profile-open', '');
            panelBtn.setAttribute('aria-haspopup', 'dialog');
            panelBtn.setAttribute('aria-controls', getPanelProfileDrawerAriaControls());
            panelBtn.innerHTML = 'About Panel Profiles' +
              '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8.03206 4.92901C7.79606 4.92901 7.60406 4.85301 7.45606 4.70101C7.30806 4.54501 7.23406 4.35301 7.23406 4.12501C7.23406 3.90101 7.30806 3.71301 7.45606 3.56101C7.60406 3.40901 7.79606 3.33301 8.03206 3.33301C8.27206 3.33301 8.46606 3.40901 8.61406 3.56101C8.76206 3.71301 8.83606 3.90101 8.83606 4.12501C8.83606 4.35301 8.76206 4.54501 8.61406 4.70101C8.46606 4.85301 8.27206 4.92901 8.03206 4.92901ZM8.68606 6.59101L8.64406 7.64701V11.337L9.51406 11.631V11.859H6.66406V11.631L7.52206 11.337V7.78501C7.47406 7.72501 7.40406 7.66501 7.31206 7.60501C7.22406 7.54501 7.12406 7.48701 7.01206 7.43101C6.90006 7.37501 6.78606 7.32701 6.67006 7.28701V7.08301L8.53006 6.59101H8.68606Z" fill="currentColor"></path><circle cx="8" cy="8" r="7.5" stroke="currentColor"></circle></svg>';
            panelBtn.addEventListener('click', function (ev) {
              ev.preventDefault();
              ev.stopPropagation();
              panelBtn.setAttribute('aria-controls', getPanelProfileDrawerAriaControls());
              openPanelProfileDrawer();
            });
            title.appendChild(panelBtn);
          }
          if (isPanelUnitDesignOpt && title && !title.querySelector('.door-panel-unit-design-btn')) {
            var panelUnitBtn = document.createElement('button');
            panelUnitBtn.type = 'button';
            panelUnitBtn.className = 'wood-species-open-btn common-btn btn-secondary btn-small door-panel-unit-design-btn';
            panelUnitBtn.setAttribute('data-panel-unit-design-open', '');
            panelUnitBtn.setAttribute('aria-haspopup', 'dialog');
            panelUnitBtn.setAttribute('aria-controls', getPanelProfileDrawerAriaControls());
            panelUnitBtn.innerHTML = 'About Panel Unit Design' +
              '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8.03206 4.92901C7.79606 4.92901 7.60406 4.85301 7.45606 4.70101C7.30806 4.54501 7.23406 4.35301 7.23406 4.12501C7.23406 3.90101 7.30806 3.71301 7.45606 3.56101C7.60406 3.40901 7.79606 3.33301 8.03206 3.33301C8.27206 3.33301 8.46606 3.40901 8.61406 3.56101C8.76206 3.71301 8.83606 3.90101 8.83606 4.12501C8.83606 4.35301 8.76206 4.54501 8.61406 4.70101C8.46606 4.85301 8.27206 4.92901 8.03206 4.92901ZM8.68606 6.59101L8.64406 7.64701V11.337L9.51406 11.631V11.859H6.66406V11.631L7.52206 11.337V7.78501C7.47406 7.72501 7.40406 7.66501 7.31206 7.60501C7.22406 7.54501 7.12406 7.48701 7.01206 7.43101C6.90006 7.37501 6.78606 7.32701 6.67006 7.28701V7.08301L8.53006 6.59101H8.68606Z" fill="currentColor"></path><circle cx="8" cy="8" r="7.5" stroke="currentColor"></circle></svg>';
            panelUnitBtn.addEventListener('click', function (ev) {
              ev.preventDefault();
              ev.stopPropagation();
              panelUnitBtn.setAttribute('aria-controls', getPanelProfileDrawerAriaControls());
              openPanelProfileDrawer();
            });
            title.appendChild(panelUnitBtn);
          }
          // For "Lockset Prep": show Lockset Prep modal button.
          if (optionIsLocksetPrep(opt) && title && !title.querySelector('.door-lockset-prep-btn')) {
            var locksetBtn = document.createElement('button');
            locksetBtn.type = 'button';
            locksetBtn.className = 'wood-species-open-btn common-btn btn-secondary btn-small door-lockset-prep-btn';
            locksetBtn.setAttribute('data-lockset-prep-open', '');
            locksetBtn.setAttribute('aria-haspopup', 'dialog');
            locksetBtn.setAttribute('aria-controls', getLocksetPrepDrawerAriaControls());
            locksetBtn.innerHTML = 'About Lockset Prep' +
              '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8.03206 4.92901C7.79606 4.92901 7.60406 4.85301 7.45606 4.70101C7.30806 4.54501 7.23406 4.35301 7.23406 4.12501C7.23406 3.90101 7.30806 3.71301 7.45606 3.56101C7.60406 3.40901 7.79606 3.33301 8.03206 3.33301C8.27206 3.33301 8.46606 3.40901 8.61406 3.56101C8.76206 3.71301 8.83606 3.90101 8.83606 4.12501C8.83606 4.35301 8.76206 4.54501 8.61406 4.70101C8.46606 4.85301 8.27206 4.92901 8.03206 4.92901ZM8.68606 6.59101L8.64406 7.64701V11.337L9.51406 11.631V11.859H6.66406V11.631L7.52206 11.337V7.78501C7.47406 7.72501 7.40406 7.66501 7.31206 7.60501C7.22406 7.54501 7.12406 7.48701 7.01206 7.43101C6.90006 7.37501 6.78606 7.32701 6.67006 7.28701V7.08301L8.53006 6.59101H8.68606Z" fill="currentColor"></path><circle cx="8" cy="8" r="7.5" stroke="currentColor"></circle></svg>';
            locksetBtn.addEventListener('click', function (ev) {
              ev.preventDefault();
              ev.stopPropagation();
              locksetBtn.setAttribute('aria-controls', getLocksetPrepDrawerAriaControls());
              openLocksetPrepDrawer();
            });
            title.appendChild(locksetBtn);
          }
          if (isInsertsOption) {
            var tipBtn = document.createElement('button');
            tipBtn.type = 'button';
            tipBtn.className = 'inserts-tooltip-btn common-btn btn-secondary btn-small';
            tipBtn.setAttribute('data-inserts-drawer-open', '');
            tipBtn.setAttribute('aria-haspopup', 'dialog');
            tipBtn.setAttribute('aria-controls', 'inserts-info-drawer-template--20550757351679__inserts_info_drawer_hJLqic');
            tipBtn.innerHTML = 'About Inserts <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8.03206 4.92901C7.79606 4.92901 7.60406 4.85301 7.45606 4.70101C7.30806 4.54501 7.23406 4.35301 7.23406 4.12501C7.23406 3.90101 7.30806 3.71301 7.45606 3.56101C7.60406 3.40901 7.79606 3.33301 8.03206 3.33301C8.27206 3.33301 8.46606 3.40901 8.61406 3.56101C8.76206 3.71301 8.83606 3.90101 8.83606 4.12501C8.83606 4.35301 8.76206 4.54501 8.61406 4.70101C8.46606 4.85301 8.27206 4.92901 8.03206 4.92901ZM8.68606 6.59101L8.64406 7.64701V11.337L9.51406 11.631V11.859H6.66406V11.631L7.52206 11.337V7.78501C7.47406 7.72501 7.40406 7.66501 7.31206 7.60501C7.22406 7.54501 7.12406 7.48701 7.01206 7.43101C6.90006 7.37501 6.78606 7.32701 6.67006 7.28701V7.08301L8.53006 6.59101H8.68606Z" fill="currentColor"/><circle cx="8" cy="8" r="7.5" stroke="currentColor"/></svg>';
            title.appendChild(tipBtn);
            tipBtn.addEventListener('click', function (ev) {
              ev.preventDefault();
              ev.stopPropagation();
              var target = document.querySelector('button.inserts-info-open-btn.common-btn.btn-secondary');
              if (target) target.click();
            });
          }
          if (isWoodOption && woodTooltipId) {
            var woodTipBtn = document.createElement('button');
            woodTipBtn.type = 'button';
            woodTipBtn.className = 'inserts-tooltip-btn common-btn btn-secondary btn-small';
            woodTipBtn.setAttribute('aria-haspopup', 'dialog');
            woodTipBtn.setAttribute('aria-controls', woodTooltipId);
            woodTipBtn.innerHTML = 'About Wood Options <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8.03206 4.92901C7.79606 4.92901 7.60406 4.85301 7.45606 4.70101C7.30806 4.54501 7.23406 4.35301 7.23406 4.12501C7.23406 3.90101 7.30806 3.71301 7.45606 3.56101C7.60406 3.40901 7.79606 3.33301 8.03206 3.33301C8.27206 3.33301 8.46606 3.40901 8.61406 3.56101C8.76206 3.71301 8.83606 3.90101 8.83606 4.12501C8.83606 4.35301 8.76206 4.54501 8.61406 4.70101C8.46606 4.85301 8.27206 4.92901 8.03206 4.92901ZM8.68606 6.59101L8.64406 7.64701V11.337L9.51406 11.631V11.859H6.66406V11.631L7.52206 11.337V7.78501C7.47406 7.72501 7.40406 7.66501 7.31206 7.60501C7.22406 7.54501 7.12406 7.48701 7.01206 7.43101C6.90006 7.37501 6.78606 7.32701 6.67006 7.28701V7.08301L8.53006 6.59101H8.68606Z" fill="currentColor"/><circle cx="8" cy="8" r="7.5" stroke="currentColor"/></svg>';
            title.appendChild(woodTipBtn);
            woodTipBtn.addEventListener('click', function (ev) {
              ev.preventDefault();
              ev.stopPropagation();
              if (!openWoodSpeciesDrawer()) {
                var el = document.getElementById(woodTooltipId);
                if (!el) return;
                el.style.display = (el.style.display === 'none' || !el.style.display) ? '' : 'none';
              }
            });
          }
          if (isScreenTypeOption) {
            var screenTypesBtn = document.createElement('button');
            screenTypesBtn.type = 'button';
            screenTypesBtn.className = 'inserts-tooltip-btn common-btn btn-secondary btn-small';
            screenTypesBtn.setAttribute('aria-haspopup', 'dialog');
            screenTypesBtn.setAttribute('aria-controls', 'wood-species-drawer-template--20550757351679__select_screen_MyPiQE');
            screenTypesBtn.innerHTML = 'About Screen Types <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8.03206 4.92901C7.79606 4.92901 7.60406 4.85301 7.45606 4.70101C7.30806 4.54501 7.23406 4.35301 7.23406 4.12501C7.23406 3.90101 7.30806 3.71301 7.45606 3.56101C7.60406 3.40901 7.79606 3.33301 8.03206 3.33301C8.27206 3.33301 8.46606 3.40901 8.61406 3.56101C8.76206 3.71301 8.83606 3.90101 8.83606 4.12501C8.83606 4.35301 8.76206 4.54501 8.61406 4.70101C8.46606 4.85301 8.27206 4.92901 8.03206 4.92901ZM8.68606 6.59101L8.64406 7.64701V11.337L9.51406 11.631V11.859H6.66406V11.631L7.52206 11.337V7.78501C7.47406 7.72501 7.40406 7.66501 7.31206 7.60501C7.22406 7.54501 7.12406 7.48701 7.01206 7.43101C6.90006 7.37501 6.78606 7.32701 6.67006 7.28701V7.08301L8.53006 6.59101H8.68606Z" fill="currentColor"/><circle cx="8" cy="8" r="7.5" stroke="currentColor"/></svg>';
            title.appendChild(screenTypesBtn);
            screenTypesBtn.addEventListener('click', function (ev) {
              ev.preventDefault();
              ev.stopPropagation();
              openScreenTypesDrawer();
            });
          }
          if (isStormGlassOption) {
            var glassTypesBtn = document.createElement('button');
            glassTypesBtn.type = 'button';
            glassTypesBtn.className = 'inserts-tooltip-btn common-btn btn-secondary btn-small';
            glassTypesBtn.setAttribute('aria-haspopup', 'dialog');
            glassTypesBtn.setAttribute('aria-controls', 'wood-species-drawer-template--20550757351679__edge_profile_TbpHVW');
            glassTypesBtn.innerHTML = 'About Glass Types <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8.03206 4.92901C7.79606 4.92901 7.60406 4.85301 7.45606 4.70101C7.30806 4.54501 7.23406 4.35301 7.23406 4.12501C7.23406 3.90101 7.30806 3.71301 7.45606 3.56101C7.60406 3.40901 7.79606 3.33301 8.03206 3.33301C8.27206 3.33301 8.46606 3.40901 8.61406 3.56101C8.76206 3.71301 8.83606 3.90101 8.83606 4.12501C8.83606 4.35301 8.76206 4.54501 8.61406 4.70101C8.46606 4.85301 8.27206 4.92901 8.03206 4.92901ZM8.68606 6.59101L8.64406 7.64701V11.337L9.51406 11.631V11.859H6.66406V11.631L7.52206 11.337V7.78501C7.47406 7.72501 7.40406 7.66501 7.31206 7.60501C7.22406 7.54501 7.12406 7.48701 7.01206 7.43101C6.90006 7.37501 6.78606 7.32701 6.67006 7.28701V7.08301L8.53006 6.59101H8.68606Z" fill="currentColor"/><circle cx="8" cy="8" r="7.5" stroke="currentColor"/></svg>';
            title.appendChild(glassTypesBtn);
            glassTypesBtn.addEventListener('click', function (ev) {
              ev.preventDefault();
              ev.stopPropagation();
              var triggers = all('button.wood-species-open-btn[aria-controls][data-wood-drawer-open]');
              var targetBtn = null;
              for (var i = 0; i < triggers.length; i++) {
                var t = triggers[i];
                var txt = String(t && t.textContent || '').trim().toLowerCase();
                if (txt.indexOf('storm glass options') !== -1) { targetBtn = t; break; }
              }
              if (!targetBtn) {
                for (var j = 0; j < triggers.length; j++) {
                  var t2 = triggers[j];
                  var ac = t2 && t2.getAttribute ? t2.getAttribute('aria-controls') : '';
                  if (ac && String(ac).indexOf('__edge_profile_TbpHVW') !== -1) { targetBtn = t2; break; }
                }
              }
              if (targetBtn) {
                targetBtn.click();
                return;
              }
              openEdgeProfileDrawer();
            });
          }
        } catch (e) {}

        section.appendChild(headerRow);

        // Insert an informational "location exposure" card set under the header row for wood_type.
        try {
          var optIdForWoodTitle = String(opt && opt.id != null ? opt.id : '').toLowerCase().replace(/-/g, '_');
          if (optIdForWoodTitle === 'wood_type') {
            var exposureWrap = document.createElement('div');
            exposureWrap.className = 'door-wood-exposure mb-40';


            

            var exposureTitle = document.createElement('p');
            exposureTitle.className = 'fw-600 mb-24';
            exposureTitle.textContent = 'Where will the door be located?';
            exposureWrap.appendChild(exposureTitle);

            var exposureCards = document.createElement('div');
            exposureCards.className = 'common-check-options door-wood-exposure-cards';

            var exposureChoices = [
              {
                value: 'Full Exposure',
                label: 'Full Exposure',
                desc: 'Directly impacted by the elements, such as rain, sun, snow, etc.'
              },
              {
                value: 'Partial Exposure',
                label: 'Partial Exposure',
                desc: 'Partially exposed to some elements, such as rain, sun, snow, etc.'
              },
              {
                value: 'Protected Location',
                label: 'Protected Location',
                desc: 'Completely sheltered from the direct effect of rain, sun, snow, etc.'
              }
            ];

            exposureChoices.forEach(function (c) {
              var card = document.createElement('label');
              card.className = 'common-check-option door-wood-exposure-card';
              card.setAttribute('data-choice-value', String(c.value || c.label || ''));

              var radio = document.createElement('input');
              radio.type = 'radio';
              radio.name = 'attributes[Where will the door be located?]';
              radio.value = String(c.value || c.label || '');
              radio.setAttribute('data-option-id', 'door_location_exposure');
              radio.style.position = 'absolute';
              radio.style.opacity = '0';
              radio.style.pointerEvents = 'none';
              card.appendChild(radio);

              // Keep an image-shaped block so existing card CSS layouts match.
              var imgPh = document.createElement('div');
              imgPh.className = 'common-check-option-image door-wood-exposure-image';
              card.appendChild(imgPh);

              var textWrap = document.createElement('div');
              textWrap.className = 'common-check-option-text';

              var lbl = document.createElement('span');
              lbl.className = 'common-check-option-label';
              lbl.textContent = c.label;
              textWrap.appendChild(lbl);

              var d = document.createElement('span');
              d.className = 'common-check-option-desc';
              d.textContent = c.desc;
              textWrap.appendChild(d);

              card.appendChild(textWrap);
              exposureCards.appendChild(card);

              card.addEventListener('click', function () {
                radio.checked = true;
                try { radio.dispatchEvent(new Event('change', { bubbles: true })); } catch (eExpClick) {}
              });

              radio.addEventListener('change', function () {
                exposureCards.querySelectorAll('.common-check-option').forEach(function (x) { x.classList.remove('common-check-option--selected'); });
                if (this.checked && this.closest) {
                  var sel = this.closest('.common-check-option');
                  if (sel) sel.classList.add('common-check-option--selected');
                }
                applyProductTagChoiceVisibility(doorConfigSchema, container);
                applyWoodExposureFilter(container);
                var doorUnitChecked = container.querySelector('input[type="radio"][data-option-id="door_unit_design"]:checked');
                if (doorUnitChecked) {
                  try { doorUnitChecked.dispatchEvent(new Event('change', { bubbles: true })); } catch (eExpDoorUnit) {}
                }
                updateEstimatedPrice();
                try { updateDoorPreview(); } catch (eExpPreview) {}
                try { hideEmptyOptionSections(container); } catch (eExpEmpty) {}
              });
            });

            exposureWrap.appendChild(exposureCards);
            section.appendChild(exposureWrap);

            var woodOptionsTitle = document.createElement('div');
            woodOptionsTitle.className = 'fw-600 mb-24';
            woodOptionsTitle.textContent = 'Wood Options';
            section.appendChild(woodOptionsTitle);
          }
        } catch (e2) {}
        }
      }

      if ((opt.type || '').toLowerCase() === 'select') {
        var optIdLowerSel = String(opt.id || '').toLowerCase();
        var optIdNormSel = normalizeOptionIdKey(opt.id);
        var labelLowerSel = String(opt.label || '').toLowerCase();
        var isScreenTypeSelect = optIdLowerSel === 'screen_type'
          || optIdLowerSel === 'select_screen';
        var isStormGlassSelect = (labelLowerSel.indexOf('storm') !== -1 && labelLowerSel.indexOf('glass') !== -1)
          || optIdLowerSel === 'storm_glass_type'
          || optIdLowerSel === 'storm_glass';
        var sel = document.createElement('select');
        sel.setAttribute('data-option-id', opt.id);
        sel.id = 'door-opt-' + opt.id;
        sel.name = 'attributes[' + (opt.label || opt.id) + ']';
        var optIdLower2 = String(opt.id || '').toLowerCase();
        var labelLower2 = String(opt.label || '').toLowerCase();
        var isWoodSelect2 = optIdLower2.indexOf('wood') !== -1 || labelLower2.indexOf('wood') !== -1;
        var rawOptId2 = String(opt.id || '');
        var safeOptId2 = rawOptId2 ? rawOptId2.replace(/[^a-zA-Z0-9_-]/g, '-') : '';
        var woodTooltipId2 = (isWoodSelect2 && safeOptId2) ? ('door-wood-options-tooltip--' + safeOptId2) : '';

        function normalizeChoiceDescription(d) {
          try {
            if (!d) return '';
            if (typeof d === 'string' || typeof d === 'number' || typeof d === 'boolean') return String(d).trim();
            if (typeof d !== 'object') return '';
            if (typeof d.value === 'string') return d.value.trim();
            if (typeof d.text === 'string') return d.text.trim();
            if (typeof d.label === 'string') return d.label.trim();
            if (typeof d.html === 'string') {
              var tmp = document.createElement('div');
              tmp.innerHTML = d.html;
              return (tmp.textContent || tmp.innerText || '').trim();
            }
            ['content', 'description', 'subtext', 'note'].forEach(function (k) {
              // no-op, just a hint: we return below
            });
            for (var i = 0; i < 4; i++) {
              var key = ['content', 'description', 'subtext', 'note'][i];
              if (d && typeof d[key] === 'string') return d[key].trim();
            }
          } catch (e) {}
          return '';
        }

        var woodTooltipDefaultText = '';
        if (woodTooltipId2) {
          woodTooltipDefaultText = normalizeChoiceDescription(opt.description);
          if (!woodTooltipDefaultText) {
            (opt.options || []).forEach(function (o) {
              if (woodTooltipDefaultText) return;
              var t = normalizeChoiceDescription(o && o.description != null ? o.description : '');
              if (t) woodTooltipDefaultText = t;
            });
          }
        }

        var woodTooltipEl = null;
        if (woodTooltipId2) {
          woodTooltipEl = document.createElement('div');
          woodTooltipEl.id = woodTooltipId2;
          woodTooltipEl.className = 'door-wood-options-tooltip';
          woodTooltipEl.style.display = 'none';
          woodTooltipEl.style.marginTop = '0.5rem';
          woodTooltipEl.style.padding = '0.6rem 0.85rem';
          woodTooltipEl.style.borderRadius = '6px';
          woodTooltipEl.style.border = '1px solid #fde68a';
          woodTooltipEl.style.background = '#fffbeb';
          woodTooltipEl.style.color = '#713f12';
          woodTooltipEl.style.fontSize = '0.9rem';
          woodTooltipEl.style.lineHeight = '1.35';
          woodTooltipEl.textContent = woodTooltipDefaultText || '';
        }

        var placeholderLabel = opt.placeholder_label || ('Select ' + (opt.label || opt.id));
        var placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = placeholderLabel;
        sel.appendChild(placeholder);
        var selectChoices = opt.options || [];
        if (String(opt.id || '') === 'door_unit_design' && selectChoices.length > 2) {
          selectChoices = selectChoices.slice(0, 2); // remove last 2 options
        }
        selectChoices.forEach(function (o) {
          var op = document.createElement('option');
          op.value = o.value != null && o.value !== '' ? String(o.value) : '';
          op.textContent = o.label || o.value || '';
          if (isWoodSelect2) {
            op.setAttribute('data-wood-key', normalizeWoodChoiceKey(o.label || o.value || ''));
          }
          if (woodTooltipId2 && o && o.description != null) {
            var choiceDesc = normalizeChoiceDescription(o.description);
            if (choiceDesc) {
              op.setAttribute('data-choice-description', choiceDesc);
              op.title = choiceDesc;
            }
          }
          sel.appendChild(op);
        });

        // Finish option: show an image preview for the selected choice (if images exist in schema).
        var finishPreviewImg = null;
        if (String(opt.id || '') === 'finish') {
          try {
            finishPreviewImg = document.createElement('img');
            finishPreviewImg.className = 'door-finish-preview-image';
            finishPreviewImg.alt = '';
            finishPreviewImg.loading = 'lazy';
            finishPreviewImg.style.maxWidth = '100%';
            finishPreviewImg.style.height = 'auto';
            finishPreviewImg.style.display = 'none';
            finishPreviewImg.style.marginTop = '0.75rem';

            function finishImgSrcForValue(val) {
              var v = String(val == null ? '' : val);
              for (var fi = 0; fi < selectChoices.length; fi++) {
                var ch = selectChoices[fi];
                if (!ch) continue;
                if (String(ch.value == null ? '' : ch.value) !== v) continue;
                return resolveChoiceImageSrc(ch) || '';
              }
              return '';
            }

            function syncFinishPreview() {
              if (!finishPreviewImg) return;
              var src = finishImgSrcForValue(sel.value);
              if (src) {
                finishPreviewImg.src = src;
                finishPreviewImg.style.display = 'block';
              } else {
                finishPreviewImg.removeAttribute('src');
                finishPreviewImg.style.display = 'none';
              }
            }

            sel.addEventListener('change', syncFinishPreview);
            sel.addEventListener('input', syncFinishPreview);
            // Initial sync (in case a saved config pre-selects it).
            setTimeout(syncFinishPreview, 0);
          } catch (eFinishImg) {
            finishPreviewImg = null;
          }
        }
        sel.addEventListener('change', updateEstimatedPrice);
        sel.addEventListener('input', updateEstimatedPrice);

        function updateWoodTooltip() {
          if (!woodTooltipEl) return;
          try {
            var selectedOption = sel.options[sel.selectedIndex];
            var desc = selectedOption ? (selectedOption.getAttribute('data-choice-description') || selectedOption.title || '') : '';
            woodTooltipEl.textContent = desc || woodTooltipDefaultText || '';
          } catch (e) {}
        }
        if (woodTooltipEl) {
          sel.addEventListener('change', updateWoodTooltip);
          sel.addEventListener('input', updateWoodTooltip);
          updateWoodTooltip();
        }

        if (opt.unit_label) {
          var row = document.createElement('div');
          row.className = 'door-row door-select-row';
          var lab = document.createElement('label');
          lab.className = 'door-row-label';
          lab.textContent = opt.label;
          lab.setAttribute('for', 'door-opt-' + opt.id);
          row.appendChild(lab);
          var inputWrap = document.createElement('div');
          inputWrap.className = 'door-row-inputs';
          sel.className = 'door-input-select';
          inputWrap.appendChild(sel);

          // If the header/title row isn't rendered, show the button next to the select.
          if (woodTooltipEl && isRowOnly) {
            var woodTipBtn2 = document.createElement('button');
            woodTipBtn2.type = 'button';
            woodTipBtn2.className = 'inserts-tooltip-btn common-btn btn-secondary btn-small';
            woodTipBtn2.setAttribute('aria-haspopup', 'dialog');
            woodTipBtn2.setAttribute('aria-controls', woodTooltipId2);
            woodTipBtn2.innerHTML = 'About Wood Options <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8.03206 4.92901C7.79606 4.92901 7.60406 4.85301 7.45606 4.70101C7.30806 4.54501 7.23406 4.35301 7.23406 4.12501C7.23406 3.90101 7.30806 3.71301 7.45606 3.56101C7.60406 3.40901 7.79606 3.33301 8.03206 3.33301C8.27206 3.33301 8.46606 3.40901 8.61406 3.56101C8.76206 3.71301 8.83606 3.90101 8.83606 4.12501C8.83606 4.35301 8.76206 4.54501 8.61406 4.70101C8.46606 4.85301 8.27206 4.92901 8.03206 4.92901ZM8.68606 6.59101L8.64406 7.64701V11.337L9.51406 11.631V11.859H6.66406V11.631L7.52206 11.337V7.78501C7.47406 7.72501 7.40406 7.66501 7.31206 7.60501C7.22406 7.54501 7.12406 7.48701 7.01206 7.43101C6.90006 7.37501 6.78606 7.32701 6.67006 7.28701V7.08301L8.53006 6.59101H8.68606Z" fill="currentColor"/><circle cx="8" cy="8" r="7.5" stroke="currentColor"/></svg>';
            woodTipBtn2.addEventListener('click', function (ev) {
              ev.preventDefault();
              ev.stopPropagation();
              if (!openWoodSpeciesDrawer()) {
                if (!woodTooltipEl) return;
                woodTooltipEl.style.display = (woodTooltipEl.style.display === 'none' || !woodTooltipEl.style.display) ? '' : 'none';
              }
            });
            inputWrap.appendChild(woodTipBtn2);
          }

          var unitSpan = document.createElement('span');
          unitSpan.className = 'door-unit-label';
          unitSpan.textContent = opt.unit_label;
          inputWrap.appendChild(unitSpan);
          row.appendChild(inputWrap);
          section.appendChild(row);
        } else {
          if ((isScreenTypeSelect || isStormGlassSelect) && Array.isArray(opt.options) && opt.options.length) {
            var cardWrap = document.createElement('div');
            cardWrap.className = 'common-check-options';
            (opt.options || []).forEach(function (o) {
              var card = document.createElement('label');
              card.className = 'common-check-option';
              card.setAttribute('data-choice-value', o.value != null && o.value !== '' ? String(o.value) : '');

              var radio = document.createElement('input');
              radio.type = 'radio';
              radio.name = 'attributes[' + (opt.label || opt.id) + ']';
              radio.value = o.value != null && o.value !== '' ? String(o.value) : '';
              radio.setAttribute('data-option-id', opt.id);
              radio.style.position = 'absolute';
              radio.style.opacity = '0';
              radio.style.pointerEvents = 'none';
              card.appendChild(radio);

              var imgSrc = resolveChoiceImageSrc(o);
              if (imgSrc) {
                var img = document.createElement('img');
                img.src = imgSrc;
                img.alt = o.label || o.value || '';
                img.className = 'common-check-option-image';
                card.appendChild(img);
              }

              var textWrap3 = document.createElement('div');
              textWrap3.className = 'common-check-option-text';
              var text3 = document.createElement('span');
              text3.className = 'common-check-option-label';
              text3.textContent = o.label || o.value || '';
              textWrap3.appendChild(text3);
              if (isScreenTypeSelect) {
                var choiceDesc = normalizeChoiceDescriptionText(o.description);
                if (choiceDesc) {
                  var descEl = document.createElement('span');
                  descEl.className = 'door-option-desc';
                  descEl.textContent = choiceDesc;
                  textWrap3.appendChild(descEl);
                }
              }
              card.appendChild(textWrap3);

              radio.addEventListener('change', function () {
                cardWrap.querySelectorAll('.common-check-option').forEach(function (c) { c.classList.remove('common-check-option--selected'); });
                if (this.checked && this.closest) {
                  var selectedCard = this.closest('.common-check-option');
                  if (selectedCard) selectedCard.classList.add('common-check-option--selected');
                }
                updateEstimatedPrice();
              });

              cardWrap.appendChild(card);
            });
            section.appendChild(cardWrap);
            if (optIdNormSel === 'glass_type' || optIdNormSel === 'storm_glass_type') appendGlassBevelSwitchToSection(section, schema);
          } else if (isAdditionalOptionsSelectOption(opt.id)) {
            sel.className = 'door-input-select';
            try {
              if (headerRow && sel.parentNode !== headerRow) {
                headerRow.appendChild(sel);
              } else {
                var hdrSel = section.querySelector('.door-option-header-row');
                if (hdrSel) hdrSel.appendChild(sel);
                else section.appendChild(sel);
              }
            } catch (eAddlSelPlace) {
              section.appendChild(sel);
            }
            if (!section.classList.contains('additional-options-card')) {
              section.classList.add('additional-options-card');
            }
            enhanceDoorSelectWithDivDropdown(sel);
            if (optIdNormSel === 'glass_type' || optIdNormSel === 'storm_glass_type') appendGlassBevelSwitchToSection(section, schema);
          } else {
            section.appendChild(sel);
            if (optIdNormSel === 'glass_type' || optIdNormSel === 'storm_glass_type') appendGlassBevelSwitchToSection(section, schema);
          }
        }

        if (woodTooltipEl) {
          section.appendChild(woodTooltipEl);
        }
        if (finishPreviewImg) {
          section.appendChild(finishPreviewImg);
        }
      } else if ((opt.type || '').toLowerCase() === 'dimension') {
        appendDimensionControlsTo(section, opt, false);
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
      } else if ((opt.type || '').toLowerCase() === 'radio') {
        var radioWrap = document.createElement('div');
        var optIdLowerRadio = String(opt.id || '').toLowerCase();
        var optLabelLowerRadio = String(opt.label || '').toLowerCase();
        var isSelectWoodRadio = optIdLowerRadio.indexOf('wood') !== -1 || optLabelLowerRadio.indexOf('wood') !== -1;
        var isMeasureTypeOpt = isMeasurementTypeOptionId(opt.id);
        var optionsToRender = opt.options || [];
        var optIdNormRadio = String(opt && opt.id != null ? opt.id : '').toLowerCase().replace(/-/g, '_');
        var shouldRenderMainRadioCards = optIdNormRadio !== 'door_sweep';
        var doorUnitSetupChoices = [];
        if (isMeasureTypeOpt) {
          optionsToRender = buildMeasurementTypeTabOptionList(opt, schema, container);
        }
        if (String(opt.id || '') === 'door_unit_design' && optionsToRender.length > 2) {
          optionsToRender = optionsToRender.slice(0, 2); // remove last 2 options
        }
        if (optionIsPanelUnitDesign(opt) && optionsToRender.length > 2) {
          optionsToRender = optionsToRender.slice(0, 2);
        }
        if (optIdNormRadio === 'door_unit_design') {
          doorUnitSetupChoices = getPreHungDoorSetupChoices(schema);
        }

        // Door Sweep: render as a <select> in the header row (not card radios).
        // This also ensures the control lives inside `.door-option-header-row`.
        if (optIdNormRadio === 'door_sweep') {
          var sweepSel = document.createElement('select');
          sweepSel.setAttribute('data-option-id', opt.id);
          sweepSel.id = 'door-opt-' + opt.id;
          sweepSel.name = 'attributes[' + (opt.label || opt.id) + ']';
          sweepSel.className = 'door-input-select';

          var sweepPlaceholderLabel = opt.placeholder_label || ('Select ' + (opt.label || opt.id));
          var sweepPlaceholder = document.createElement('option');
          sweepPlaceholder.value = '';
          sweepPlaceholder.textContent = sweepPlaceholderLabel;
          sweepSel.appendChild(sweepPlaceholder);

          (optionsToRender || []).forEach(function (o) {
            var op = document.createElement('option');
            op.value = o.value != null && o.value !== '' ? String(o.value) : '';
            op.textContent = o.label || o.value || '';
            sweepSel.appendChild(op);
          });

          sweepSel.addEventListener('change', updateEstimatedPrice);
          sweepSel.addEventListener('input', updateEstimatedPrice);
          try {
            sweepSel.addEventListener('change', updateDoorPreview);
            sweepSel.addEventListener('input', updateDoorPreview);
          } catch (eSweepPreview) {}

          // Put select in the header row when available; otherwise fall back to section.
          try {
            if (headerRow && sweepSel.parentNode !== headerRow) {
              headerRow.appendChild(sweepSel);
            } else {
              section.appendChild(sweepSel);
            }
          } catch (eSweepPlace) {
            section.appendChild(sweepSel);
          }
          if (!section.classList.contains('additional-options-card')) {
            section.classList.add('additional-options-card');
          }
          enhanceDoorSelectWithDivDropdown(sweepSel);
        } else {
        var isMeasurementTabsRadio = measurementMethodRadio({ type: 'radio', options: optionsToRender })
          || (isMeasureTypeOpt && optionsToRender.length >= 2);
        var measureTypeStaticWrap = null;
        var panelIntroEl = null;
        var checkedMeasure = null;
        radioWrap.className = 'common-check-options' + (isSelectWoodRadio ? ' select-wood-options' : '') + (isMeasurementTabsRadio ? ' door-measure-tabs' : '') + (optIdNormRadio === 'swing_direction' ? ' grid-4' : '');
        var preHungRadioWrap = null;
        var optionCardsToRender = optionsToRender;
        if (optIdNormRadio === 'door_unit_design' && doorUnitSetupChoices.length) {
          preHungRadioWrap = document.createElement('div');
          preHungRadioWrap.className = 'common-check-options mt-18' + (isSelectWoodRadio ? ' select-wood-options' : '');
          optionCardsToRender = doorUnitSetupChoices.concat(optionsToRender);
        }
        if (optionIsPanelUnitDesign(opt)) {
          var panelOrderPrompt = document.createElement('p');
          panelOrderPrompt.className = 'door-panel-unit-order-prompt p-medium fw-600 primaryFont mb-16';
          var panelPromptText = '';
          if (opt.description) {
            var panelPromptDesc = typeof opt.description === 'string' ? opt.description : (opt.description && (opt.description.value || opt.description.text)) || '';
            panelPromptText = String(panelPromptDesc || '').trim();
          }
          panelOrderPrompt.textContent = panelPromptText || 'How would you like to order your Porch Panels?';
          section.appendChild(panelOrderPrompt);
        }
        optionCardsToRender.forEach(function (o) {
          var hideMeasureTabExtras = isMeasurementTabsRadio && isMeasureTypeOpt;
          var renderOptionId = o && o._renderOptionId ? String(o._renderOptionId) : String(opt.id || '');
          var renderOptionLabel = o && o._renderOptionLabel ? String(o._renderOptionLabel) : String(opt.label || opt.id || '');
          var cardOwnerWrap = (preHungRadioWrap && o && o._renderOptionId) ? preHungRadioWrap : radioWrap;
          var card = document.createElement('label');
          card.className = 'common-check-option'
            + (String(opt.id || '') === 'sidelight_style' ? ' sidelight-style-option' : '')
            + (isSelectWoodRadio ? ' select-wood-option' : '')
            + (isMeasurementTabsRadio ? ' door-measure-tab' : '');
          if (o.measureVis && isMeasureTypeOpt) {
            card.setAttribute('data-measure-vis', o.measureVis);
          }
          card.setAttribute('data-choice-value', o.value != null && o.value !== '' ? String(o.value) : '');
          if (isSelectWoodRadio) {
            card.setAttribute('data-wood-key', normalizeWoodChoiceKey(o.label || o.value || ''));
            card.setAttribute('data-select-wood-option', '1');
          }
          var radio = document.createElement('input');
          radio.type = 'radio';
          radio.name = 'attributes[' + renderOptionLabel + ']';
          radio.value = o.value != null && o.value !== '' ? String(o.value) : '';
          radio.setAttribute('data-option-id', renderOptionId);
          radio.style.position = 'absolute';
          radio.style.opacity = '0';
          if (!isMeasurementTabsRadio) radio.style.pointerEvents = 'none';
          card.appendChild(radio);
          // Door unit design *style* cards stay text-only. Embedded Door Setup rows use
          // o._renderOptionId (e.g. pre_hung) — those must still show choice thumbnails.
          var skipDoorUnitDesignThumb = (String(opt.id || '') === 'door_unit_design' || optionIsPanelUnitDesign(opt)) && !o._renderOptionId;
          if (!hideMeasureTabExtras && !skipDoorUnitDesignThumb) {
            var thumbSrc = resolveChoiceImageSrc(o);
            if (!thumbSrc && o.image) {
              thumbSrc = typeof o.image === 'string' ? o.image : (o.image && (o.image.url || o.image.src)) || '';
            }
            if (thumbSrc) {
              var img = document.createElement('img');
              img.src = thumbSrc;
              img.alt = o.label || o.value || '';
              img.className = 'common-check-option-image';
              card.appendChild(img);
            }
          }
          var textWrap2 = document.createElement('div');
          textWrap2.className = 'common-check-option-text';

          var text = document.createElement('span');
          text.className = 'common-check-option-label';
          text.textContent = hideMeasureTabExtras ? displayLabelForMeasurementTabChoice(o) : (o.label || o.value || '');
          textWrap2.appendChild(text);

          if (o.description && !hideMeasureTabExtras) {
            var desc = document.createElement('span');
            desc.className = 'common-check-option-desc';

            var d = o.description;
            var descText = '';
            if (typeof d === 'string' || typeof d === 'number' || typeof d === 'boolean') {
              descText = String(d);
            } else if (d && typeof d === 'object') {
              if (typeof d.value === 'string') descText = d.value;
              else if (typeof d.text === 'string') descText = d.text;
              else if (typeof d.label === 'string') descText = d.label;
              else if (typeof d.html === 'string') {
                var tmp = document.createElement('div');
                tmp.innerHTML = d.html;
                descText = tmp.textContent || tmp.innerText || '';
              } else {
                ['content', 'description', 'subtext', 'note'].forEach(function (k) {
                  if (!descText && d && typeof d[k] === 'string') descText = d[k];
                });
              }
            }
            descText = descText.trim();
            if (descText) {
              desc.textContent = descText;
              textWrap2.appendChild(desc);
              try { card.setAttribute('data-choice-description', descText); } catch (eSetChoiceDesc) {}
            }
          }
          card.appendChild(textWrap2);
          if (isMeasurementTabsRadio && isMeasureTypeOpt) {
            card.addEventListener('click', function (e) {
              if (e && e.target && e.target.closest) {
                if (e.target.closest('select') || e.target.closest('.door-div-select') || e.target.closest('.door-div-select__list')) return;
              }
              radio.checked = true;
              applyMeasurementTypeTabSelection(radio, opt.id, container, doorConfigSchema);
              try { updateEstimatedPrice(); } catch (eMeasTabPrice) {}
            });
          }
          radio.addEventListener('change', function () {
            if (optionIsPanelProfile(opt) || optionIsStileAndRailProfile(opt)) {
              section.querySelectorAll('input[type="radio"][data-option-id="' + renderOptionId + '"]').forEach(function (ri) {
                var cAll = ri.closest && ri.closest('.common-check-option');
                if (cAll) cAll.classList.remove('common-check-option--selected');
              });
            } else {
              cardOwnerWrap.querySelectorAll('.common-check-option').forEach(function (c) { c.classList.remove('common-check-option--selected'); });
            }
            if (this.checked && this.closest) {
              var selCard = this.closest('.common-check-option');
              if (selCard) selCard.classList.add('common-check-option--selected');
            }
            if (isMeasurementTabsRadio && isMeasureTypeOpt) {
              applyMeasurementTypeTabSelection(this, opt.id, container, doorConfigSchema);
            } else if (isMeasurementTabsRadio) {
              var modeFromClick = measurementModeFromCheckedTab(this, container, doorConfigSchema);
              syncMeasurementTabVisibility(modeFromClick, opt.id);
              if (panelIntroEl) panelIntroEl.classList.remove('door-hidden');
            }
            if (optionIsPanelUnitDesign(opt)) {
              syncPanelUnitDesignMeasurements(section, opt.id);
            }
            if (optionIsStileAndRailProfile(opt)) {
              try { updateDoorPreview(); } catch (eStilePrev) {}
              try { syncSdlProfileVisibility(container); } catch (eSdlStile) {}
            } else {
              updateEstimatedPrice();
            }
          });
          cardOwnerWrap.appendChild(card);
        });
 // Panel Profile: wrap the radio grid in the same accordion design used for
        // Screen & Storm Inserts "Additional Options" (same classes + plus/minus toggle).
        try {
          if (optionIsPanelProfile(opt) || optionIsStileAndRailProfile(opt)) {
            var isStileRail = optionIsStileAndRailProfile(opt);
            var heroClass = isStileRail ? 'door-stile-rail-hero' : 'door-panel-profile-hero';
            var primaryClass = isStileRail ? 'common-check-options door-stile-rail-primary-option' : 'common-check-options door-panel-profile-primary-option';
            var contentClass = isStileRail ? 'door-stile-rail-primary-content' : 'door-panel-profile-primary-content';
            var sectionDescClass = isStileRail ? 'door-stile-rail-section-desc' : 'door-panel-profile-section-desc';
            var choiceDescClass = isStileRail ? 'door-stile-rail-choice-desc' : 'door-panel-profile-choice-desc';
            var accordionClass = isStileRail
              ? 'door-option-accordion door-inserts-additional-options-accordion door-stile-rail-accordion'
              : 'door-option-accordion door-inserts-additional-options-accordion door-panel-profile-accordion';
            var accordionTitle = isStileRail ? 'Additional Stile and Rail Profile Options' : 'Additional Panel Profile Options';

            var panelHero = document.createElement('div');
            panelHero.className = heroClass;

            var panelPrimaryWrap = document.createElement('div');
            panelPrimaryWrap.className = primaryClass;
            // ===== DEFAULT OPTIONS (custom.configurator_defaults metafield) - START =====
            // If a default (product/collection) is configured for this option and the
            // matching choice currently lives inside the accordion, promote it to the
            // hero/first position so the default (e.g. Craftsman) shows up top instead
            // of the standard first choice (e.g. Quarter Bead). Only stile/panel profile.
            try {
              var _heroDefVal = getDefaultSelectionForOption(opt.id);
              if (_heroDefVal != null && _heroDefVal !== '') {
                var _normHeroDef = String(_heroDefVal).trim().toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
                var _heroCards = radioWrap.querySelectorAll('.common-check-option');
                var _heroMatch = null;
                for (var _hci = 0; _hci < _heroCards.length; _hci++) {
                  var _hc = _heroCards[_hci];
                  var _hcVal = _hc.getAttribute('data-choice-value') || '';
                  if (!_hcVal) {
                    var _hcInp = _hc.querySelector('input[data-option-id]');
                    _hcVal = _hcInp ? (_hcInp.value || '') : '';
                  }
                  var _normHc = String(_hcVal).trim().toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
                  if (_normHc && _normHc === _normHeroDef) { _heroMatch = _hc; break; }
                }
                if (_heroMatch && radioWrap.firstElementChild !== _heroMatch) {
                  radioWrap.insertBefore(_heroMatch, radioWrap.firstElementChild);
                }
              }
            } catch (eHeroDefault) {}
            // ===== DEFAULT OPTIONS (custom.configurator_defaults metafield) - END =====
            var firstPanelCard = radioWrap.firstElementChild;
            if (firstPanelCard) {
              panelPrimaryWrap.appendChild(firstPanelCard);
              panelHero.appendChild(panelPrimaryWrap);
            }

            var panelRight = document.createElement('div');
            panelRight.className = contentClass;
            var sectionDesc = '';
            if (opt.description) {
              if (typeof opt.description === 'string') {
                sectionDesc = opt.description.trim();
              } else {
                sectionDesc = normalizeChoiceDescriptionText(opt.description);
              }
            }
            if (sectionDesc) {
              var sectionDescP = document.createElement('p');
              sectionDescP.className = 'door-option-desc ' + sectionDescClass;
              sectionDescP.textContent = sectionDesc;
              panelRight.appendChild(sectionDescP);
            }
            if (!isStileRail) {
              var panelChoiceDesc = (firstPanelCard && firstPanelCard.getAttribute) ? (firstPanelCard.getAttribute('data-choice-description') || '').trim() : '';
              var panelRightP = document.createElement('p');
              panelRightP.className = choiceDescClass;
              panelRightP.textContent = panelChoiceDesc;
              if (!panelChoiceDesc) panelRightP.style.display = 'none';
              panelRight.appendChild(panelRightP);
            }
            panelHero.appendChild(panelRight);
            section.appendChild(panelHero);
            var ppAccordion = document.createElement('div');
            ppAccordion.className = accordionClass;
            var ppOuter = document.createElement('div');
            ppOuter.className = 'door-inserts-additional-options screen-and-storm-inserts';

            var ppBtn = document.createElement('button');
            ppBtn.type = 'button';
            ppBtn.className = 'door-accordion-header door-inserts-additional-options-title ';

            var ppHeaderRow = document.createElement('div');
            ppHeaderRow.className = 'door-option-header-row';

            var ppHeaderText = document.createElement('div');
            ppHeaderText.className = 'door-accordion-header-text';
            ppHeaderText.textContent = accordionTitle;
            ppHeaderRow.appendChild(ppHeaderText);
            ppBtn.appendChild(ppHeaderRow);

            var ppPlusSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
              '<rect x="7" width="2" height="16" rx="1" fill="currentColor"></rect>' +
              '<rect x="16" y="7" width="2" height="16" rx="1" transform="rotate(90 16 7)" fill="currentColor"></rect>' +
              '</svg>';
            var ppMinusSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
              '<rect x="0" y="7" width="16" height="2" rx="1" fill="currentColor"></rect>' +
              '</svg>';

            var ppSign = document.createElement('span');
            ppSign.className = 'door-accordion-sign';
            ppSign.innerHTML = ppPlusSvg;
            ppBtn.appendChild(ppSign);

            var ppBody = document.createElement('div');
            ppBody.className = 'door-accordion-body';
            ppBody.appendChild(radioWrap);

            ppBtn.addEventListener('click', function () {
              var opened = ppBody.classList.toggle('door-accordion-body--open');
              ppSign.innerHTML = opened ? ppMinusSvg : ppPlusSvg;
            });

            if (radioWrap.children && radioWrap.children.length > 0) {
              ppAccordion.appendChild(ppBtn);
              ppAccordion.appendChild(ppBody);
              ppOuter.appendChild(ppAccordion);
              section.appendChild(ppOuter);
            }
          } else {
            if (shouldRenderMainRadioCards) {
              if (preHungRadioWrap) {
                var preHungSection = document.createElement('div');
                preHungSection.className = 'door-section door-option-wrap';
                preHungSection.setAttribute('data-option-id', 'pre_hung');
                preHungSection.appendChild(preHungRadioWrap);
                deferredDoorSetupWrap = preHungSection;
              }
              section.appendChild(radioWrap);
            }
          }
        } catch (ePanelProfileAccordion) {
          if (shouldRenderMainRadioCards) {
            if (preHungRadioWrap) {
              var preHungSection2 = document.createElement('div');
              preHungSection2.className = 'door-section door-option-wrap';
              preHungSection2.setAttribute('data-option-id', 'pre_hung');
              preHungSection2.appendChild(preHungRadioWrap);
              deferredDoorSetupWrap = preHungSection2;
            }
            section.appendChild(radioWrap);
          }
        }

        if (optionIsPanelUnitDesign(opt)) {
          mountPanelUnitEnclosureMeasurements(section);
          mountPanelUnitIndividualMeasurements(section);
          syncPanelUnitDesignMeasurements(section, opt.id);
        }

        if (optIdNormRadio === 'glass_type' || optIdNormRadio === 'storm_glass_type') appendGlassBevelSwitchToSection(section, schema);
        }
        // Door Sweep section: "Choose Swing Direction" uses the same choices as the dynamic swing_direction option (metaobject).
        try {
          var optIdNorm = String(opt && opt.id != null ? opt.id : '').toLowerCase().replace(/-/g, '_');
          if (optIdNorm === 'door_sweep') {
            var swingOptEmbed = findSwingDirectionOption(schema);
            var swingRadioOk = swingOptEmbed && String(swingOptEmbed.type || '').toLowerCase() === 'radio' &&
              Array.isArray(swingOptEmbed.options) && swingOptEmbed.options.length > 0;

            var doorSweepTitle = document.createElement('p');
            doorSweepTitle.className = 'fw-600 pt-24 mb-16 d-none';
            doorSweepTitle.textContent = (swingOptEmbed && swingOptEmbed.label) ? String(swingOptEmbed.label) : 'Choose Swing Direction';
            section.appendChild(doorSweepTitle);

            var doorSweepExtra = document.createElement('div');
            doorSweepExtra.className = 'common-check-options door-sweep-extra-options  grid-4';
            if (swingRadioOk) {
              doorSweepExtra.setAttribute('data-swing-from-schema', '1');
            }

            if (swingRadioOk) {
              swingOptEmbed.options.forEach(function (o) {
                var card = document.createElement('label');
                card.className = 'common-check-option door-sweep-extra-option';
                card.setAttribute('data-choice-value', o.value != null && o.value !== '' ? String(o.value) : '');

                var radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = 'attributes[' + (swingOptEmbed.label || swingOptEmbed.id) + ']';
                radio.value = o.value != null && o.value !== '' ? String(o.value) : '';
                radio.setAttribute('data-option-id', swingOptEmbed.id);
                radio.style.position = 'absolute';
                radio.style.opacity = '0';
                radio.style.pointerEvents = 'none';
                card.appendChild(radio);

                var imgSrcEmbed = resolveChoiceImageSrc(o);
                if (imgSrcEmbed) {
                  var imgE = document.createElement('img');
                  imgE.src = imgSrcEmbed;
                  imgE.alt = o.label || o.value || '';
                  imgE.className = 'common-check-option-image';
                  card.appendChild(imgE);
                } else {
                  var imgPh = document.createElement('div');
                  imgPh.className = 'common-check-option-image door-sweep-extra-option-image';
                  card.appendChild(imgPh);
                }

                var textWrapPh = document.createElement('div');
                textWrapPh.className = 'common-check-option-text';
                var textPh = document.createElement('span');
                textPh.className = 'common-check-option-label';
                textPh.textContent = o.label || o.value || '';
                textWrapPh.appendChild(textPh);
                if (o.description) {
                  var descPh = document.createElement('span');
                  descPh.className = 'common-check-option-desc';
                  var descTextPh = normalizeChoiceDescriptionText(o.description);
                  if (descTextPh) {
                    descPh.textContent = descTextPh;
                    textWrapPh.appendChild(descPh);
                  }
                }
                card.appendChild(textWrapPh);

                var swingIdStr = String(swingOptEmbed.id || '');
                radio.addEventListener('change', function () {
                  all('input[type="radio"][data-option-id="' + swingIdStr + '"]', container).forEach(function (ri) {
                    var c = ri.closest && ri.closest('.common-check-option');
                    if (c) c.classList.remove('common-check-option--selected');
                  });
                  if (this.checked && this.closest) {
                    var selCardPh = this.closest('.common-check-option');
                    if (selCardPh) selCardPh.classList.add('common-check-option--selected');
                  }
                  updateEstimatedPrice();
                });
                doorSweepExtra.appendChild(card);
              });
            }

            section.appendChild(doorSweepExtra);
          }
        } catch (eDoorSweepExtra) {}
        // After Screen & Storm Inserts card grid, add an "Additional Options" accordion
        // that reveals selectable inner options.
        try {
          if (optionIsScreenAndStormInserts(opt)) {
            var addlWrap = document.createElement('div');
            addlWrap.className = 'door-inserts-additional-options screen-and-storm-inserts';

            var addlAccordion = document.createElement('div');
            addlAccordion.className = 'door-option-accordion door-inserts-additional-options-accordion';

            var addlBtn = document.createElement('button');
            addlBtn.type = 'button';
            addlBtn.className = 'door-accordion-header door-inserts-additional-options-title';

            var addlHeaderRow = document.createElement('div');
            addlHeaderRow.className = 'door-option-header-row';

            var addlHeaderText = document.createElement('div');
            addlHeaderText.className = 'door-accordion-header-text';
            addlHeaderText.textContent = 'Additional Options';
            addlHeaderRow.appendChild(addlHeaderText);
            addlBtn.appendChild(addlHeaderRow);

            var addlPlusSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
              '<rect x="7" width="2" height="16" rx="1" fill="currentColor"></rect>' +
              '<rect x="16" y="7" width="2" height="16" rx="1" transform="rotate(90 16 7)" fill="currentColor"></rect>' +
              '</svg>';
            var addlMinusSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
              '<rect x="0" y="7" width="16" height="2" rx="1" fill="currentColor"></rect>' +
              '</svg>';

            var addlSign = document.createElement('span');
            addlSign.className = 'door-accordion-sign';
            addlSign.innerHTML = addlPlusSvg;
            addlBtn.appendChild(addlSign);

            var addlBody = document.createElement('div');
            addlBody.className = 'door-accordion-body';

            // Build inner option cards based on selected inserts type.
            var addlState = {};
            function rememberAddlState() {
              try {
                var inps = addlBody.querySelectorAll('input[type="checkbox"][data-option-id="screen_and_storm_inserts_additional_options"]');
                inps.forEach(function (inp) { addlState[String(inp.value || '')] = !!inp.checked; });
              } catch (eS) {}
            }
            function buildAddlCard(choice) {
              var card = document.createElement('label');
              card.className = 'common-check-option door-inserts-additional-options-card';
              card.setAttribute('data-choice-value', choice.value);

              var cb = document.createElement('input');
              cb.type = 'checkbox';
              cb.name = 'attributes[Additional Options][]';
              cb.value = choice.value;
              cb.setAttribute('data-option-id', 'screen_and_storm_inserts_additional_options');
              cb.style.position = 'absolute';
              cb.style.opacity = '0';
              cb.style.pointerEvents = 'none';
              card.appendChild(cb);

              var textWrap = document.createElement('div');
              textWrap.className = 'common-check-option-text';

              var lbl = document.createElement('span');
              lbl.className = 'common-check-option-label';
              lbl.textContent = choice.label;
              textWrap.appendChild(lbl);

              var desc = document.createElement('span');
              desc.className = 'common-check-option-desc';
              desc.textContent = choice.desc;
              textWrap.appendChild(desc);

              card.appendChild(textWrap);

              // Restore checked state if previously selected.
              if (addlState[choice.value]) {
                cb.checked = true;
                card.classList.add('common-check-option--selected');
              }

              cb.addEventListener('change', function () {
                card.classList.toggle('common-check-option--selected', !!cb.checked);
                addlState[choice.value] = !!cb.checked;
                updateEstimatedPrice();
              });

              return card;
            }
            function rebuildAddlCards(mode) {
              rememberAddlState();
              addlBody.innerHTML = '';

              var addlCards = document.createElement('div');
              addlCards.className = 'common-check-options door-inserts-additional-options-cards grid-2';

              var choices = [];
              if (mode === 'screen_insert_only') {
                choices = [
                  {
                    value: 'top_bottom_inserts_screen',
                    label: 'Top & Bottom Inserts (optional)',
                    desc: 'Separate screen inserts for the door top and bottom (2 inserts included)'
                  },
                  {
                    value: 'fixed_screen',
                    label: 'Fixed Screen (optional)',
                    desc: 'Permanent, built-in screen'
                  }
                ];
              } else if (mode === 'storm_glass_only') {
                choices = [
                  {
                    value: 'top_bottom_inserts_glass',
                    label: 'Top & Bottom Inserts (optional)',
                    desc: 'Separate glass inserts for the door top and bottom (2 inserts included)'
                  },
                  {
                    value: 'fixed_glass',
                    label: 'Fixed Glass (optional)',
                    desc: 'Permanent, built-in tempered glass panel.'
                  }
                ];
              } else {
                // Default: screen + storm glass.
                choices = [
                  {
                    value: 'top_bottom_inserts',
                    label: 'Top & Bottom Inserts (optional)',
                    desc: 'Separate screen and glass inserts for the door top and bottom (4 inserts included)'
                  }
                ];
              }

              choices.forEach(function (c) { addlCards.appendChild(buildAddlCard(c)); });
              addlBody.appendChild(addlCards);
            }
            function selectedInsertsMode() {
              try {
                var checked = radioWrap.querySelector('input[type="radio"][data-option-id="' + opt.id + '"]:checked');
                var v = checked ? String(checked.value || '') : '';
                if (v === 'screen_insert_only' || v === 'storm_glass_only' || v === 'screen_and_storm_inserts_choice') return v;
              } catch (eM) {}
              return 'screen_and_storm_inserts_choice';
            }

            rebuildAddlCards(selectedInsertsMode());
            // Keep the additional options in sync with inserts selection changes.
            radioWrap.addEventListener('change', function (ev) {
              var t = ev && ev.target;
              if (!t || t.tagName !== 'INPUT' || t.type !== 'radio') return;
              if (t.getAttribute('data-option-id') !== String(opt.id || '')) return;
              rebuildAddlCards(selectedInsertsMode());
            });

            addlBtn.addEventListener('click', function () {
              var opened = addlBody.classList.toggle('door-accordion-body--open');
              addlSign.innerHTML = opened ? addlMinusSvg : addlPlusSvg;
            });

            addlAccordion.appendChild(addlBtn);
            addlAccordion.appendChild(addlBody);
            addlWrap.appendChild(addlAccordion);

            section.appendChild(addlWrap);
          }
        } catch (eAddl) {}
        if (isMeasureTypeOpt) {
          syncMeasurementTabCardVisibility(container, schema);
        }

        if (isMeasurementTabsRadio) {
          panelIntroEl = document.createElement('h3');
          panelIntroEl.className = 'door-measurement-panel-intro p-medium mb-24 fw-600 primaryFont';
          panelIntroEl.setAttribute('data-option-id', opt.id);
          panelIntroEl.classList.add('door-hidden');
          section.appendChild(panelIntroEl);

          checkedMeasure = radioWrap.querySelector('.door-measure-tab input[type="radio"]:checked');
          if (!isMeasureTypeOpt) {
            if (checkedMeasure) {
              var tabEl0 = checkedMeasure.closest('.door-measure-tab');
              radioWrap.querySelectorAll('.door-measure-tab').forEach(function (c) { c.classList.remove('common-check-option--selected'); });
              if (tabEl0) tabEl0.classList.add('common-check-option--selected');
            } else {
              var allTabs = radioWrap.querySelectorAll('.door-measure-tab');
              for (var ti = 0; ti < allTabs.length; ti++) {
                var tc = allTabs[ti];
                if (String(tc.textContent || '').toLowerCase().indexOf('exact') !== -1) {
                  var ri = tc.querySelector('input[type="radio"]');
                  if (ri) {
                    ri.checked = true;
                    tc.classList.add('common-check-option--selected');
                  }
                  break;
                }
              }
            }
          } else if (checkedMeasure) {
            var tabEl1 = checkedMeasure.closest('.door-measure-tab');
            radioWrap.querySelectorAll('.door-measure-tab').forEach(function (c) { c.classList.remove('common-check-option--selected'); });
            if (tabEl1) tabEl1.classList.add('common-check-option--selected');
          }
          checkedMeasure = radioWrap.querySelector('.door-measure-tab input[type="radio"]:checked');
          if (checkedMeasure && panelIntroEl) {
            if (isMeasureTypeOpt) {
              applyMeasurementTypeTabSelection(checkedMeasure, opt.id, container, doorConfigSchema);
            } else {
              syncMeasurementTabVisibility(measurementModeFromCheckedTab(checkedMeasure, container, doorConfigSchema), opt.id);
              panelIntroEl.classList.remove('door-hidden');
            }
          }
        }
        if (isMeasurementTypeOptionId(opt.id) && hasMeasurementTypeBlock) {
          var staticTpl = document.getElementById('door-static-measurement-rows');
          if (staticTpl && staticTpl.content) {
            measureTypeStaticWrap = document.createElement('div');
            measureTypeStaticWrap.className = 'door-measurement-static-rows door-measurement-embedded-dimensions';
            measureTypeStaticWrap.appendChild(staticTpl.content.cloneNode(true));
            // Give each static measurement <select> a meaningful id (based on panel + row title + int/frac)
            assignStaticMeasurementRowSelectIds(measureTypeStaticWrap);
            linkStaticMeasurementRowsToSchema(schema, measureTypeStaticWrap);
            fixPanelDoorWidthAndTransomHeightOptionRanges(measureTypeStaticWrap);
            assignUniqueOptionIds(measureTypeStaticWrap, 'door-measurement-static-rows-select');
            applyStaticMeasurementDimensionDefaults(measureTypeStaticWrap);
            try {
              if (window.DoorConf2Measurements && typeof window.DoorConf2Measurements.applyFinishedRoughWidthIntDefaults === 'function') {
                window.DoorConf2Measurements.applyFinishedRoughWidthIntDefaults(measureTypeStaticWrap, true);
              }
            } catch (eFinRoughBoot) {}
            if (isMeasureTypeOpt) measureTypeStaticWrap.classList.add('door-hidden');
            section.appendChild(measureTypeStaticWrap);
          } else if (embeddedDimensionsOrdered.length) {
            measureTypeStaticWrap = document.createElement('div');
            measureTypeStaticWrap.className = 'door-measurement-embedded-dimensions';
            embeddedDimensionsOrdered.forEach(function (dimOpt) {
              appendDimensionControlsTo(measureTypeStaticWrap, dimOpt, true);
            });
            assignUniqueOptionIds(measureTypeStaticWrap, 'door-measurement-embedded-dimensions-select');
            if (isMeasureTypeOpt) measureTypeStaticWrap.classList.add('door-hidden');
            section.appendChild(measureTypeStaticWrap);
          }
          if (isMeasureTypeOpt && checkedMeasure && measureTypeStaticWrap) {
            measureTypeStaticWrap.classList.remove('door-hidden');
          }
        }
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
      if (shouldAppendIntoDoorUnitGroup) {
        doorUnitDesignGroup.appendChild(section);
        if (optId === lastDoorUnitGroupId) appendDeferredDoorSetupToUnitGroup();
        if (optId === 'transom_design') doorUnitDesignGroup = null;
      } else {
        if (normalizeOptionIdKey(optId) === 'sdl_profile') {
          section.classList.add('door-hidden');
          section.style.display = 'none';
        }
        container.appendChild(section);
      }

      // After Lockset Prep: insert "Additional Options" accordion (header shows "+" like other accordions).
      try {
        if (String(optId || '') === 'lockset_prep') {
          var parentAfterLockset = shouldAppendIntoDoorUnitGroup ? doorUnitDesignGroup : container;
          if (parentAfterLockset && !parentAfterLockset.querySelector('.door-post-lockset-additional-options')) {
            var addlAcc = document.createElement('div');
            addlAcc.className = 'door-option-accordion door-post-lockset-additional-options common-icon-accordion';
            addlAcc.setAttribute('data-option-id', 'additional_options');

            var addlBtn = document.createElement('button');
            addlBtn.type = 'button';
            addlBtn.className = 'door-accordion-header';

            var addlHeaderRow = document.createElement('div');
            addlHeaderRow.className = 'door-option-header-row';

            var addlHeaderText = document.createElement('div');
            addlHeaderText.className = 'door-accordion-header-text door-option-title';
            addlHeaderText.textContent = 'Additional Options';
            addlHeaderRow.appendChild(addlHeaderText);
            addlBtn.appendChild(addlHeaderRow);

            var plusSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
              '<rect x="7" width="2" height="16" rx="1" fill="currentColor"></rect>' +
              '<rect x="16" y="7" width="2" height="16" rx="1" transform="rotate(90 16 7)" fill="currentColor"></rect>' +
              '</svg>';
            var minusSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
              '<rect x="0" y="7" width="16" height="2" rx="1" fill="currentColor"></rect>' +
              '</svg>';

            var sign = document.createElement('span');
            sign.className = 'door-accordion-sign';
            sign.innerHTML = plusSvg;
            addlBtn.appendChild(sign);

            var addlBody = document.createElement('div');
            addlBody.className = 'door-accordion-body';

            var addlInner = document.createElement('div');
            addlInner.className = 'door-accordion-body-inner';
            addlBody.appendChild(addlInner);

            function moveCommonChecksIntoHeaderRow(blockEl) {
              try {
                if (!blockEl || !blockEl.querySelector) return;
                var headerRowEl = blockEl.querySelector('.door-option-header-row');
                var checksEl = blockEl.querySelector('.common-check-options');
                if (!headerRowEl || !checksEl) return;
                if (checksEl.parentNode === headerRowEl) return;
                headerRowEl.appendChild(checksEl);
              } catch (eMoveChecks) {}
            }

            // Move existing option sections into this accordion (retry after render).
            try {
              var root = document.getElementById('door-configurator') || document;
              var optionOrder = ['priming', 'door_sweep', 'door_seal_kit', 'pet_door'];

              function isInsideThisAccordion(node) {
                return !!(node && node.closest && node.closest('.door-post-lockset-additional-options'));
              }

              function tryMoveOnce() {
                var allFound = true;
                optionOrder.forEach(function (oid) {
                  var sel = '.door-option-wrap[data-option-id="' + oid + '"]';
                  var wrap = root.querySelector(sel);
                  if (!wrap) {
                    // Fallback: match any node with data-option-id
                    wrap = root.querySelector('[data-option-id="' + oid + '"]');
                  }
                  if (!wrap) {
                    allFound = false;
                    return;
                  }
                  if (isInsideThisAccordion(wrap)) return;
                  // Only move the option wrapper/section, not inner controls.
                  var block = wrap.closest ? (wrap.closest('.door-option-wrap') || wrap.closest('.door-section') || wrap.closest('section') || wrap) : wrap;
                  if (!block) return;
                  if (block.classList && block.classList.contains('door-post-lockset-additional-options')) return;
                  addlInner.appendChild(block);

                  // door_sweep / door_seal_kit / pet_door: if description contains an image URL, render it as an <img>.
                  try {
                    if ((oid === 'priming' || oid === 'door_sweep' || oid === 'door_seal_kit' || oid === 'pet_door') && block) {
                      // Mark Additional Options items for shared styling in the Additional Options accordion.
                      try {
                        if (block.classList && !block.classList.contains('additional-options-card')) {
                          block.classList.add('additional-options-card');
                        }
                      } catch (eAddlCard) {}
                      moveCommonChecksIntoHeaderRow(block);

                      var guardAttr =
                        (oid === 'door_seal_kit') ? 'data-seal-kit-img-hydrated'
                        : (oid === 'pet_door') ? 'data-pet-door-img-hydrated'
                        : 'data-sweep-img-hydrated';
                      if (block.getAttribute(guardAttr)) return;
                      var descEls = block.querySelectorAll('.door-option-desc');
                      var imgUrl = '';
                      var srcDescEl = null;
                      for (var di = 0; di < descEls.length; di++) {
                        var dEl = descEls[di];
                        var txt = String(dEl && dEl.textContent || '').trim();
                        if (!txt) continue;
                        // Grab first URL-looking token.
                        var m = txt.match(/https?:\/\/[^\s"']+\.(?:png|jpe?g|webp|gif)(\?[^\s"']*)?/i);
                        if (m && m[0]) {
                          imgUrl = m[0];
                          srcDescEl = dEl;
                          break;
                        }
                      }
                      if (imgUrl && srcDescEl) {
                        // Remove URL text from the description (keep the rest).
                        srcDescEl.textContent = String(srcDescEl.textContent || '').replace(imgUrl, '').replace(/\s{2,}/g, ' ').trim();

                        var img = document.createElement('img');
                        img.src = imgUrl;
                        img.alt = '';
                        img.loading = 'lazy';
                        img.style.maxWidth = '100%';
                        img.style.height = 'auto';
                        img.style.display = 'block';

                        if (oid === 'door_sweep' || oid === 'door_seal_kit' || oid === 'pet_door') {
                          // Structure change only:
                          // - Ensure <select> is inside the main div (header row)
                          // - Place image outside that div (after header row)
                          var headerRowSweep = block.querySelector('.door-option-header-row');
                          var selectSweep = block.querySelector('select[data-option-id="' + oid + '"]');
                          if (headerRowSweep && selectSweep && selectSweep.parentNode !== headerRowSweep) {
                            headerRowSweep.appendChild(selectSweep);
                          }
                          if (headerRowSweep && headerRowSweep.parentNode === block) {
                            headerRowSweep.insertAdjacentElement('afterend', img);
                          } else {
                            block.appendChild(img);
                          }
                        } else {
                          // Default: append image after the description.
                          srcDescEl.insertAdjacentElement('afterend', img);
                        }
                        block.setAttribute(guardAttr, '1');
                      }
                    }
                  } catch (eSweepImg) {}
                  enhanceAdditionalOptionsSelects(block);
                });
                enhanceAdditionalOptionsSelects(addlInner);
                return allFound;
              }

              // Clear then move in requested order.
              while (addlInner.firstChild) addlInner.removeChild(addlInner.firstChild);

              var maxTries = 20;
              var t = 0;
              function loop() {
                t++;
                var done = tryMoveOnce();
                if (done || t >= maxTries) return;
                setTimeout(loop, 250);
              }
              // Kick immediately after this synchronous render call stack.
              setTimeout(loop, 0);
            } catch (eMoveAddl2) {}

            addlBtn.addEventListener('click', function () {
              var opened = addlBody.classList.toggle('door-accordion-body--open');
              sign.innerHTML = opened ? minusSvg : plusSvg;
            });

            addlAcc.appendChild(addlBtn);
            addlAcc.appendChild(addlBody);

            // Insert immediately after the Lockset Prep section.
            if (section && section.parentNode === parentAfterLockset) {
              parentAfterLockset.insertBefore(addlAcc, section.nextSibling);
            } else {
              parentAfterLockset.appendChild(addlAcc);
            }

            // After Additional Options: insert "Hardware" accordion and move `finish` option into it.
            try {
              if (parentAfterLockset && !parentAfterLockset.querySelector('.door-post-lockset-hardware-options')) {
                var hwAcc = null;
                var hwBtn = null;
                var hwSign = null;
                var hwBody = null;
                var hwInner = null;
                var hwSource = document.getElementById('door-suggested-hardware-accordion-source');
                if (hwSource) {
                  hwAcc = hwSource.querySelector('.door-post-lockset-hardware-options');
                  if (hwAcc) {
                    hwBtn = hwAcc.querySelector('.door-accordion-header');
                    hwSign = hwAcc.querySelector('.door-accordion-sign');
                    hwBody = hwAcc.querySelector('.door-accordion-body');
                    hwInner = hwAcc.querySelector('.door-accordion-body-inner');
                  }
                }
                if (!hwAcc) {
                  hwAcc = document.createElement('div');
                  hwAcc.className = 'door-option-accordion door-post-lockset-hardware-options common-icon-accordion';
                  hwAcc.setAttribute('data-option-id', 'hardware_options');
                  hwAcc.setAttribute('data-hardware-accordion', '1');

                  hwBtn = document.createElement('button');
                  hwBtn.type = 'button';
                  hwBtn.className = 'door-accordion-header';

                  var hwHeaderRow = document.createElement('div');
                  hwHeaderRow.className = 'door-option-header-row';

                  var hwHeaderText = document.createElement('div');
                  hwHeaderText.className = 'door-accordion-header-text door-option-title';
                  hwHeaderText.textContent = 'Hardware';
                  hwHeaderRow.appendChild(hwHeaderText);
                  hwBtn.appendChild(hwHeaderRow);

                  hwSign = document.createElement('span');
                  hwSign.className = 'door-accordion-sign';
                  hwSign.innerHTML = plusSvg;
                  hwBtn.appendChild(hwSign);

                  hwBody = document.createElement('div');
                  hwBody.className = 'door-accordion-body';

                  hwInner = document.createElement('div');
                  hwInner.className = 'door-accordion-body-inner';
                  hwBody.appendChild(hwInner);

                  hwAcc.appendChild(hwBtn);
                  hwAcc.appendChild(hwBody);
                }

                var hwRecommendedProducts = readRecommendedHardwareProducts();
                if (hwInner && hwRecommendedProducts.length) {
                  renderHardwareOptionsGrid(hwInner, hwRecommendedProducts);
                  hideLegacyRecommendedProductsBlock();
                }

                // Move Finish option into this accordion (retry after render).
                try {
                  var root2 = document.getElementById('door-configurator') || document;

                  function isInsideHardwareAccordion(node) {
                    return !!(node && node.closest && node.closest('.door-post-lockset-hardware-options'));
                  }

                  function hideHardwareSchemaChoiceGrid(blockEl) {
                    if (!blockEl || !blockEl.querySelector) return;
                    if (!blockEl.classList || !blockEl.classList.contains('door-option-wrap')) return;
                    var cards = blockEl.querySelector('.common-check-options:not(.door-hardware-options-cards)');
                    if (cards) cards.style.display = 'none';
                  }

                  function tryMoveHardwareOptionsOnce() {
                    if (!hwRecommendedProducts.length) return true;
                    var oidHw = 'hardware_options';
                    var wrapHw = root2.querySelector('.door-option-wrap[data-option-id="' + oidHw + '"]');
                    if (!wrapHw) return false;
                    if (isInsideHardwareAccordion(wrapHw)) {
                      hideHardwareSchemaChoiceGrid(wrapHw);
                      return true;
                    }
                    var blockHw = wrapHw.closest
                      ? (wrapHw.closest('.door-option-wrap') || wrapHw.closest('.door-section') || wrapHw.closest('section') || wrapHw)
                      : wrapHw;
                    if (!blockHw) return true;
                    if (blockHw.classList && blockHw.classList.contains('door-post-lockset-hardware-options')) return true;
                    try {
                      if (blockHw.classList && !blockHw.classList.contains('hardware-options-card')) {
                        blockHw.classList.add('hardware-options-card');
                      }
                    } catch (eHwCard2) {}
                    hideHardwareSchemaChoiceGrid(blockHw);
                    hwInner.appendChild(blockHw);
                    return true;
                  }

                  function tryMoveFinishOnce() {
                    var oid2 = 'finish';
                    var sel2 = '.door-option-wrap[data-option-id="' + oid2 + '"]';
                    var wrap2 = root2.querySelector(sel2) || root2.querySelector('[data-option-id="' + oid2 + '"]');
                    if (!wrap2) return false;
                    if (isInsideHardwareAccordion(wrap2)) return true;

                    var block2 = wrap2.closest ? (wrap2.closest('.door-option-wrap') || wrap2.closest('.door-section') || wrap2.closest('section') || wrap2) : wrap2;
                    if (!block2) return true;
                    if (block2.classList && (block2.classList.contains('door-post-lockset-hardware-options') || block2.classList.contains('door-post-lockset-additional-options'))) {
                      return true;
                    }
                    try {
                      if (block2.classList && !block2.classList.contains('hardware-options-card')) {
                        block2.classList.add('hardware-options-card');
                      }
                    } catch (eHwCard) {}
                    hwInner.appendChild(block2);
                    return true;
                  }

                  var maxTries2 = 20;
                  var t2 = 0;
                  function loop2() {
                    t2++;
                    var doneHw = tryMoveHardwareOptionsOnce();
                    var done2 = tryMoveFinishOnce();
                    if ((doneHw !== false) && done2) return;
                    if (t2 >= maxTries2) return;
                    setTimeout(loop2, 250);
                  }
                  setTimeout(loop2, 0);
                } catch (eMoveFinish) {}

                if (hwBtn && hwBody && hwSign && !hwBtn.getAttribute('data-hw-accordion-bound')) {
                  hwBtn.setAttribute('data-hw-accordion-bound', '1');
                  hwBtn.addEventListener('click', function () {
                    var opened = hwBody.classList.toggle('door-accordion-body--open');
                    hwSign.innerHTML = opened ? minusSvg : plusSvg;
                    hwBtn.setAttribute('aria-expanded', opened ? 'true' : 'false');
                    syncHardwareOptionsGridVisibility(hwAcc, opened);
                  });
                }

                if (hwRecommendedProducts.length) {
                  syncHardwareOptionsGridVisibility(hwAcc, hwBody && hwBody.classList.contains('door-accordion-body--open'));
                }

                // Insert Hardware accordion right after Additional Options accordion.
                if (addlAcc && addlAcc.parentNode === parentAfterLockset) {
                  parentAfterLockset.insertBefore(hwAcc, addlAcc.nextSibling);
                } else {
                  parentAfterLockset.appendChild(hwAcc);
                }

                // After Hardware: insert "Casing" accordion. Move casing-related options if present;
                // otherwise, render 3 dummy items.
                try {
                  if (parentAfterLockset && !parentAfterLockset.querySelector('.door-post-lockset-casing-options')) {
                    var casingAcc = document.createElement('div');
                    casingAcc.className = 'door-option-accordion door-post-lockset-casing-options common-icon-accordion';
                    casingAcc.setAttribute('data-option-id', 'casing_options');

                    var casingBtn = document.createElement('button');
                    casingBtn.type = 'button';
                    casingBtn.className = 'door-accordion-header';

                    var casingHeaderRow = document.createElement('div');
                    casingHeaderRow.className = 'door-option-header-row';

                    var casingHeaderText = document.createElement('div');
                    casingHeaderText.className = 'door-accordion-header-text door-option-title';
                    casingHeaderText.textContent = 'Casing';
                    casingHeaderRow.appendChild(casingHeaderText);
                    casingBtn.appendChild(casingHeaderRow);

                    var casingSign = document.createElement('span');
                    casingSign.className = 'door-accordion-sign';
                    casingSign.innerHTML = plusSvg;
                    casingBtn.appendChild(casingSign);

                    var casingBody = document.createElement('div');
                    casingBody.className = 'door-accordion-body';

                    var casingInner = document.createElement('div');
                    casingInner.className = 'door-accordion-body-inner';
                    casingBody.appendChild(casingInner);

                    // Try to move casing-related option blocks into this accordion (retry after render).
                    // If none exist, insert dummy items.
                    try {
                      var root3 = document.getElementById('door-configurator') || document;

                      function isInsideCasingAccordion(node) {
                        return !!(node && node.closest && node.closest('.door-post-lockset-casing-options'));
                      }

                      function casingCandidateWraps() {
                        try {
                          return Array.from(root3.querySelectorAll('.door-option-wrap[data-option-id]'))
                            .filter(function (el) {
                              var id = String(el.getAttribute('data-option-id') || '').toLowerCase();
                              return id === 'casing' || id.indexOf('casing_') === 0;
                            });
                        } catch (e) {
                          return [];
                        }
                      }

                      function tryMoveCasingOnce() {
                        var movedAny = false;
                        var wraps = casingCandidateWraps();
                        if (!wraps || !wraps.length) return null; // not found yet
                        wraps.forEach(function (wrap3) {
                          if (!wrap3 || isInsideCasingAccordion(wrap3)) return;
                          var block3 = wrap3.closest ? (wrap3.closest('.door-option-wrap') || wrap3.closest('.door-section') || wrap3.closest('section') || wrap3) : wrap3;
                          if (!block3) return;
                          if (block3.classList && (block3.classList.contains('door-post-lockset-casing-options') || block3.classList.contains('door-post-lockset-hardware-options') || block3.classList.contains('door-post-lockset-additional-options'))) {
                            return;
                          }
                          try {
                            if (block3.classList && !block3.classList.contains('additional-options-card')) {
                              block3.classList.add('additional-options-card');
                            }
                          } catch (eCard3) {}
                          moveCommonChecksIntoHeaderRow(block3);
                          casingInner.appendChild(block3);
                          movedAny = true;
                        });
                        return movedAny;
                      }

                      var maxTries3 = 20;
                      var t3 = 0;
                      function loop3() {
                        t3++;
                        var moved = tryMoveCasingOnce();
                        // moved === null means "not found yet" (keep trying)
                        if (moved === true) return;
                        if (moved === false) {
                          // Found casing options list but none moved (already inside) - stop.
                          return;
                        }
                        if (t3 >= maxTries3) {
                          // No casing options exist; insert dummy items.
                          if (!casingInner.firstChild) {
                            for (var di3 = 1; di3 <= 3; di3++) {
                              var dummy = document.createElement('div');
                              dummy.className = 'door-section door-option-wrap additional-options-card';
                              dummy.setAttribute('data-option-id', 'casing_dummy_' + di3);
                              dummy.innerHTML =
                                '<div class="door-option-header-row">' +
                                  '<div class="door-option-title-wrap">' +
                                    '<p class="door-section-title door-option-title"><span>Casing option ' + di3 + '</span></p>' +
                                    '<p class="door-option-desc">Dummy casing item (no casing options found in schema).</p>' +
                                  '</div>' +
                                '</div>';
                              casingInner.appendChild(dummy);
                            }
                          }
                          return;
                        }
                        setTimeout(loop3, 250);
                      }
                      setTimeout(loop3, 0);
                    } catch (eMoveCasing) {
                      // If anything goes wrong, still show dummy items.
                      if (!casingInner.firstChild) {
                        for (var di4 = 1; di4 <= 3; di4++) {
                          var dummy2 = document.createElement('div');
                          dummy2.className = 'door-section door-option-wrap additional-options-card';
                          dummy2.setAttribute('data-option-id', 'casing_dummy_' + di4);
                          dummy2.innerHTML =
                            '<div class="door-option-header-row">' +
                              '<div class="door-option-title-wrap">' +
                                '<p class="door-section-title door-option-title"><span>Casing option ' + di4 + '</span></p>' +
                                '<p class="door-option-desc">Dummy casing item (no casing options found in schema).</p>' +
                              '</div>' +
                            '</div>';
                          casingInner.appendChild(dummy2);
                        }
                      }
                    }

                    casingBtn.addEventListener('click', function () {
                      var opened = casingBody.classList.toggle('door-accordion-body--open');
                      casingSign.innerHTML = opened ? minusSvg : plusSvg;
                    });

                    casingAcc.appendChild(casingBtn);
                    casingAcc.appendChild(casingBody);

                    // Insert Casing accordion right after Hardware accordion.
                    if (hwAcc && hwAcc.parentNode === parentAfterLockset) {
                      parentAfterLockset.insertBefore(casingAcc, hwAcc.nextSibling);
                    } else {
                      parentAfterLockset.appendChild(casingAcc);
                    }
                  }
                } catch (eCasingAcc) {}
              }
            } catch (eHardwareAcc) {}
          }
        }
      } catch (eLocksetAddl) {}

      if ((opt.type || '').toLowerCase() === 'radio' && isMeasurementTypeOptionId(opt.id) && hasMeasurementTypeBlock) {
        if (isMeasurementTabsRadio) {
          var radioTabs = section.querySelector('.door-measure-tabs');
          var chk = radioTabs ? radioTabs.querySelector('.door-measure-tab input[type="radio"]:checked') : null;
          if (chk) {
            applyMeasurementTypeTabSelection(chk, opt.id, container, doorConfigSchema);
          }
        } else {
          syncMeasurementTabVisibility('exact', opt.id);
        }
      }
    });
    try {
      var swingHide = findSwingDirectionOption(schema);
      if (swingHide && container.querySelector('.door-sweep-extra-options[data-swing-from-schema="1"]')) {
        var swingWrapHide = container.querySelector('.door-option-wrap[data-option-id="' + swingHide.id + '"]');
        if (swingWrapHide) swingWrapHide.classList.add('door-hidden');
      }
    } catch (eSwingDupHide) {}

    // Ensure default exposure filtering is applied after all option blocks are rendered.
    try {
      applyWoodExposureFilter(container);
      setTimeout(function () {
        applyWoodExposureFilter(container);
        if (doorConfigSchema) {
          applyProductTagChoiceVisibility(doorConfigSchema, container);
          syncSidelightTransomAccordionHeaderUi(container);
          syncPanelProfileHero(container);
          initSdlProfileNest(container);
        }
        try { hideEmptyOptionSections(container); } catch (eSwingEmpty) {}
      }, 0);
      if (doorConfigSchema) applyProductTagChoiceVisibility(doorConfigSchema, container);
      initSdlProfileNest(container);
      hideEmptyOptionSections(container);
      enhanceAdditionalOptionsSelects(container);
      applyCollectionMeasureRowVisibility(container);
      applyGardenGatesCollectionRulesFromMeasurements(container);
      setTimeout(function () {
        if (doorConfigSchema) applyProductTagChoiceVisibility(doorConfigSchema, container);
        applyWoodExposureFilter(container);
        hideEmptyOptionSections(container);
        enhanceAdditionalOptionsSelects(container);
        applyCollectionMeasureRowVisibility(container);
        applyGardenGatesCollectionRulesFromMeasurements(container);
        syncSidelightTransomAccordionHeaderUi(container);
      }, 250);
    } catch (eWoodExposureInit) {}

    try {
      if (!schemaIncludesPanelUnitDesignOption(schema) && productIsPorchPanelProduct()) {
        appendStaticPanelUnitDesignSection(container);
      }
      initializePanelUnitDesignSections(container, schema);
    } catch (ePanelUnitInit) {}

    // Hide hinge_finish when slab_only or no pre-hung selection.
    try { syncHingeFinishVisibility(schema, container); } catch (eHingeInit) {}

    // Post-render DOM reorder: reposition all [data-option-id] elements
    // according to desiredOptionOrder so dynamically-injected accordions
    // (additional_options, hardware_options, casing_options) follow the same order.
    try {
      var _reorderContainer = container;
      var _reorderDoorGroup = doorUnitDesignGroup;
      setTimeout(function () {
        try {
          function reorderChildrenByOptionId(parent) {
            if (!parent) return;
            var kids = [];
            for (var ci = 0; ci < parent.children.length; ci++) {
              var ch = parent.children[ci];
              if (ch.hasAttribute && ch.hasAttribute('data-option-id')) kids.push(ch);
            }
            if (kids.length < 2) return;
            kids.sort(function (a, b) {
              var aId = normalizeOptionIdKey(a.getAttribute('data-option-id') || '');
              var bId = normalizeOptionIdKey(b.getAttribute('data-option-id') || '');
              var aR = desiredOptionRank[aId] != null ? desiredOptionRank[aId] : 9999;
              var bR = desiredOptionRank[bId] != null ? desiredOptionRank[bId] : 9999;
              return aR - bR;
            });
            for (var ki = 0; ki < kids.length; ki++) {
              parent.appendChild(kids[ki]);
            }
          }
          reorderChildrenByOptionId(_reorderContainer);
          if (_reorderDoorGroup && _reorderDoorGroup !== _reorderContainer) {
            reorderChildrenByOptionId(_reorderDoorGroup);
          }
        } catch (eInner) {}
      }, 800);
    } catch (eReorder) {}
  }

  // Collection-specific measurement rows: hide the "Exact Door" static rows
  // (.exact-door) when the current collection is "sidelights". Uses a class on
  // #door-configurator + a CSS rule so it survives template re-clones.
  function ensureCollectionMeasureRowStyle() {
    if (document.getElementById('door-collection-measure-style')) return;
    var style = document.createElement('style');
    style.id = 'door-collection-measure-style';
    style.textContent =
      '#door-configurator.door-collection-sidelights .door-measure-dimension-row.exact-door{display:none !important;}';
    (document.head || document.documentElement).appendChild(style);
  }
  var COLLECTIONS_HIDE_EXACT_DOOR = [
    'sidelights',
    'screen-and-storm-doors-sidelight',
    'interior-doors-sidelight',
    'transoms',
    'screen-and-storm-doors-transom',
    'interior-doors-transom'
  ];
  function isGardenGatesCollectionActive() {
    try {
      if (window.DoorConf2Measurements && typeof window.DoorConf2Measurements.isGardenGatesCollection === 'function') {
        return window.DoorConf2Measurements.isGardenGatesCollection();
      }
    } catch (eGg) {}
    return false;
  }

  function isGateCollectionActive() {
    try {
      if (window.DoorConf2Measurements && typeof window.DoorConf2Measurements.isGateCollection === 'function') {
        return window.DoorConf2Measurements.isGateCollection();
      }
    } catch (eGate) {}
    return false;
  }

  function isPetGatesCollectionActive() {
    try {
      if (window.DoorConf2Measurements && typeof window.DoorConf2Measurements.isPetGatesCollection === 'function') {
        return window.DoorConf2Measurements.isPetGatesCollection();
      }
    } catch (ePet) {}
    return false;
  }

  function applyGardenGatesCollectionRulesFromMeasurements(container) {
    try {
      if (window.DoorConf2Measurements && typeof window.DoorConf2Measurements.applyGardenGatesCollectionRules === 'function') {
        window.DoorConf2Measurements.applyGardenGatesCollectionRules(container, doorConfigSchema);
      }
    } catch (eGgRules) {}
  }

  function applyCollectionMeasureRowVisibility(container) {
    if (!container) container = document.getElementById('door-configurator-options');
    var main = document.getElementById('door-configurator');
    if (main) {
      main.classList.toggle('door-collection-garden-gates', isGardenGatesCollectionActive());
      main.classList.toggle('door-collection-pet-gates', isPetGatesCollectionActive());
    }
    applyGardenGatesCollectionRulesFromMeasurements(container);
  }

  // ===== DEFAULT OPTIONS (custom.configurator_defaults metafield) - START =====
  // Default selections (product + collection level): pre-fill option values defined
  // by the `custom.configurator_defaults` metafield (passed via data-default-selections).
  // Applied once, after the page clears default selections, and only on visible
  // choices so hidden options are never forced. Customer can change them.
  // Parse data-default-selections (array of JSON objects, earlier = higher priority)
  // into a single merged { optionId: value } map.
  function getMergedDefaultSelections() {
    var main = document.getElementById('door-configurator');
    if (!main) return {};
    var raw = main.getAttribute('data-default-selections') || '';
    var merged = {};
    try {
      var arr = raw.trim() ? JSON.parse(raw) : [];
      if (!Array.isArray(arr)) arr = [arr];
      // Earlier entries win, so merge from the end.
      for (var i = arr.length - 1; i >= 0; i--) {
        var o = arr[i];
        if (o && typeof o === 'object') {
          for (var k in o) { if (Object.prototype.hasOwnProperty.call(o, k)) merged[k] = o[k]; }
        }
      }
    } catch (e) { return {}; }
    return merged;
  }

  // Get the default value configured for a single option id (matches either the
  // raw id or its normalized form), or null if none.
  function getDefaultSelectionForOption(optId) {
    if (optId == null) return null;
    var merged = getMergedDefaultSelections();
    if (merged[optId] != null && merged[optId] !== '') return merged[optId];
    var nk = String(optId).toLowerCase().replace(/-/g, '_');
    if (merged[nk] != null && merged[nk] !== '') return merged[nk];
    return null;
  }

  function sortDefaultSelectionKeys(keys) {
    var parentsFirst = ['door_unit_design', 'pre_hung', 'sidelight_location', 'sidelight_style', 'transom_style', 'transom_count', 'door_location_exposure', 'wood_type', 'wood_type_storm_porch'];
    var deferred = ['swing_direction'];
    var ordered = [];
    parentsFirst.forEach(function (k) {
      if (keys.indexOf(k) !== -1) ordered.push(k);
    });
    keys.forEach(function (k) {
      if (parentsFirst.indexOf(k) !== -1) return;
      if (deferred.indexOf(k) !== -1) return;
      ordered.push(k);
    });
    deferred.forEach(function (k) {
      if (keys.indexOf(k) !== -1) ordered.push(k);
    });
    return ordered;
  }

  function pulseDependentVisibilityFromDefaults(container) {
    if (!container) return;
    var refIds = ['door_unit_design', 'pre_hung', 'sidelight_location', 'sidelight_style', 'transom_style', 'transom_count', 'measurement_type', 'door_location_exposure', 'wood_type', 'wood_type_storm_porch'];
    refIds.forEach(function (refId) {
      var checked = container.querySelector('input[type="radio"][data-option-id="' + refId + '"]:checked');
      if (checked) {
        try { checked.dispatchEvent(new Event('change', { bubbles: true })); } catch (ePulse) {}
      }
      var sel = container.querySelector('select[data-option-id="' + refId + '"]');
      if (sel && String(sel.value || '') !== '') {
        try { sel.dispatchEvent(new Event('change', { bubbles: true })); } catch (ePulseSel) {}
      }
    });
    if (doorConfigSchema) {
      try { applyHideWhen(doorConfigSchema, container); } catch (ePulseHide) {}
      try { applyChoiceVisibility(doorConfigSchema, container); } catch (ePulseChoice) {}
      try { applyProductTagChoiceVisibility(doorConfigSchema, container); } catch (ePulseTag) {}
    }
    try { hideEmptyOptionSections(container); } catch (ePulseEmpty) {}
    try { updateDoorPreview(); } catch (ePulsePrev) {}
    try { updateEstimatedPrice(); } catch (ePulsePrice) {}
  }

  var _collectionDefaultsApplied = false;
  function applyCollectionDefaultSelections(container) {
    if (_collectionDefaultsApplied) return;
    var main = document.getElementById('door-configurator');
    if (!main || !container) return;
    var merged = getMergedDefaultSelections();
    var keys = sortDefaultSelectionKeys(Object.keys(merged));
    if (!keys.length) { _collectionDefaultsApplied = true; return; }
    // Skip a choice ONLY if it's hidden by a visibility filter (door-hidden /
    // product-tag / wood-exposure / display:none). Collapsed accordions (.door-accordion-body)
    // are NOT treated as hidden, so deeper options (e.g. stile_and_rail_profile) still apply.
    function defaultChoiceHiddenByFilters(el) {
      var node = el;
      while (node && node !== container && node !== document.body) {
        if (!(node.classList && node.classList.contains('door-accordion-body'))) {
          if (node.classList && node.classList.contains('door-hidden')) return true;
          if (node.getAttribute) {
            if (node.getAttribute('data-product-tag-hidden') === '1') return true;
            if (node.getAttribute('data-wood-exposure-hidden') === '1') return true;
          }
          if (node.style && node.style.display === 'none') return true;
        }
        node = node.parentNode;
      }
      return false;
    }
    var appliedAny = false;
    keys.forEach(function (optId) {
      var val = String(merged[optId]);
      var input = container.querySelector('input[data-option-id="' + optId + '"][value="' + val + '"]');
      if (input) {
        if (defaultChoiceHiddenByFilters(input)) return; // hidden by filters, not collapse
        var card = input.closest('.common-check-option');
        input.checked = true;
        if (card) card.classList.add('common-check-option--selected');
        try { input.dispatchEvent(new Event('change', { bubbles: true })); } catch (e2) {}
        appliedAny = true;
        return;
      }
      var sel = container.querySelector('select[data-option-id="' + optId + '"]');
      if (sel) {
        var measUnit = sel.getAttribute ? String(sel.getAttribute('data-unit') || '') : '';
        if (measUnit === 'in-int' || measUnit === 'in-frac') return;
        sel.value = val;
        try { sel.dispatchEvent(new Event('change', { bubbles: true })); } catch (e3) {}
        appliedAny = true;
      }
    });
    if (appliedAny) {
      if (doorConfigSchema) {
        try { applyHideWhen(doorConfigSchema, container); } catch (eDefHide) {}
        try { applyChoiceVisibility(doorConfigSchema, container); } catch (eDefChoice) {}
      }
      pulseDependentVisibilityFromDefaults(container);
      _collectionDefaultsApplied = true;
    }
  }
  // ===== DEFAULT OPTIONS (custom.configurator_defaults metafield) - END =====

  // Hide an option section/accordion (including its title) when it has no available
  // choices to show after all visibility filters have run. Re-evaluated on changes so
  // a section reappears if its choices become available later.
  function isMarkedHiddenEl(el) {
    if (!el || !el.getAttribute) return false;
    if (el.classList && el.classList.contains('door-hidden')) return true;
    if (el.getAttribute('data-product-tag-hidden') === '1') return true;
    if (el.getAttribute('data-wood-exposure-hidden') === '1') return true;
    if (el.style && el.style.display === 'none') return true;
    return false;
  }

  function isChoiceAvailableInSection(el, section) {
    var node = el;
    while (node && node !== section.parentNode) {
      // Accordion collapse uses the body wrapper; ignore it so collapsed
      // accordions are still considered to have content.
      if (!(node.classList && node.classList.contains('door-accordion-body'))) {
        if (isMarkedHiddenEl(node)) return false;
      }
      node = node.parentNode;
    }
    return true;
  }

  function sectionHasAvailableContent(section) {
    if (!section) return false;
    // Card-style choices (radio/checkbox cards).
    var cards = all('.common-check-option', section);
    for (var i = 0; i < cards.length; i++) {
      if (isChoiceAvailableInSection(cards[i], section)) return true;
    }
    // Door setup option labels.
    var setupOpts = all('.door-setup-option', section);
    for (var s = 0; s < setupOpts.length; s++) {
      if (isChoiceAvailableInSection(setupOpts[s], section)) return true;
    }
    // Native selects (incl. dimension/measurement selects) with at least one usable option.
    var selects = all('select', section);
    for (var j = 0; j < selects.length; j++) {
      var sel = selects[j];
      if (!isChoiceAvailableInSection(sel, section)) continue;
      var opts = sel.options || [];
      for (var k = 0; k < opts.length; k++) {
        var op = opts[k];
        if (!op) continue;
        if (op.hidden || op.disabled) continue;
        if (String(op.value == null ? '' : op.value) === '') continue;
        return true;
      }
    }
    // Free inputs (dimension/number/text) that are real controls.
    var inputs = all('input[type="number"], input[type="text"]', section);
    for (var m = 0; m < inputs.length; m++) {
      if (isChoiceAvailableInSection(inputs[m], section)) return true;
    }
    return false;
  }

function hideEmptyOptionSections(container) {
    if (!container) container = document.getElementById('door-configurator-options');
    if (!container) return;
    var sections = all('.door-option-wrap[data-option-id]', container);
    // Pass 1: clear our own markers so a stale display:none on a nested wrap does
    // not bias the content check of a parent section.
    sections.forEach(function (section) {
      if (section.getAttribute('data-empty-hidden') === '1') {
        section.removeAttribute('data-empty-hidden');
        section.style.display = '';
      }
    });
    // Pass 2: hide sections that have no available content (skip ones already
    // hidden by hideWhen/showWhen logic).
    sections.forEach(function (section) {
      var sid = String(section.getAttribute('data-option-id') || '');
      if (sid === 'measurement_type') return;
      if (isGateCollectionActive() && sid === 'swing_direction') return;
      if (sid === 'panel_unit_design' || sid === 'porch_panel_project') return;
      if (isAdditionalOptionsSelectOption(sid) || sid === 'priming') return;
      if (sid === 'sdl_profile' && section.getAttribute('data-sdl-nested') === '1') return;
      if (section.classList && section.classList.contains('door-measurement-type-section')) return;
      if (section.classList.contains('door-hidden')) return;
      if (!sectionHasAvailableContent(section)) {
        section.setAttribute('data-empty-hidden', '1');
        section.style.display = 'none';
      }
    });
  }

  function containerRefValueMatches(container, refId, refValue, isAnyValue) {
    if (isAnyValue) {
      var anyDom = getSelectedChoiceValueFromDom(refId);
      return !!(anyDom && String(anyDom) !== '');
    }
    var target = normalizeChoiceKey(refValue);
    if (!target) return false;
    var refInputs = all('select[data-option-id="' + refId + '"], input[data-option-id="' + refId + '"]', container);
    if (refInputs[0] && refInputs[0].type === 'checkbox') {
      return refInputs.filter(function (el) { return el.checked; }).some(function (el) {
        return normalizeChoiceKey(el.value) === target;
      });
    }
    var domVal = getSelectedChoiceValueFromDom(refId);
    if (domVal && normalizeChoiceKey(domVal) === target) return true;
    if (refInputs[0] && refInputs[0].type === 'radio') {
      var checkedRadio = refInputs.filter(function (el) { return el.checked; })[0];
      return !!(checkedRadio && normalizeChoiceKey(checkedRadio.value) === target);
    }
    if (refInputs.length > 1) {
      return refInputs.some(function (el) { return normalizeChoiceKey(el.value) === target; });
    }
    if (refInputs[0]) {
      return normalizeChoiceKey(refInputs[0].value) === target;
    }
    return false;
  }

  var hideWhenBoundKeys = {};
  var choiceVisibilityBoundKeys = {};

  function applyHideWhen(schema, container) {
    if (!container) container = document.getElementById('door-configurator-options');
    if (!container) return;
    var refSelector = function (id) {
      return 'select[data-option-id="' + id + '"], input[data-option-id="' + id + '"]';
    };
    schema.forEach(function (opt) {
      var hideWhen = opt.hideWhen;
      var showWhen = opt.showWhen;
      var condition = hideWhen && typeof hideWhen === 'object' ? { type: 'hide', when: hideWhen } : (showWhen && typeof showWhen === 'object' ? { type: 'show', when: showWhen } : null);
      if (!condition) return;
      var wrap = container.querySelector('.door-option-wrap[data-option-id="' + opt.id + '"]')
        || container.querySelector('.door-measure-dimension-row[data-embed-dimension-id="' + opt.id + '"]');
      if (!wrap) return;
      var refId = Object.keys(condition.when)[0];
      var refValue = condition.when[refId];
      var refInput = container.querySelector(refSelector(refId));
      if (!refInput) return;
      var isAnyValue = String(refValue || '') === '__any__';
      var hideBoundKey = String(opt.id || '') + '::' + String(refId || '');
      function updateVisibility() {
        var matches = containerRefValueMatches(container, refId, refValue, isAnyValue);
        var shouldHide = condition.type === 'hide' ? matches : !matches;
        if (isGateCollectionActive() && normalizeOptionIdKey(opt.id) === 'swing_direction') {
          shouldHide = false;
        }
        wrap.classList.toggle('door-hidden', shouldHide);
        if (doorConfigSchema && measurementSchemaUsesJsonVisibility(doorConfigSchema)) {
          syncMeasurementPanelsFromSchemaRows(container);
        }
      }
      if (!hideWhenBoundKeys[hideBoundKey]) {
        refInput.addEventListener('change', updateVisibility);
        if (refInput.type !== 'checkbox' && refInput.type !== 'radio') {
          refInput.addEventListener('input', updateVisibility);
        }
        all(refSelector(refId), container).forEach(function (el) {
          if (el !== refInput) el.addEventListener('change', updateVisibility);
        });
        hideWhenBoundKeys[hideBoundKey] = true;
      }
      updateVisibility();
    });
  }

  function applyChoiceVisibility(schema, container) {
    if (!container) container = document.getElementById('door-configurator-options');
    if (!container) return;
    var refSelector = function (id) {
      return 'select[data-option-id="' + id + '"], input[data-option-id="' + id + '"]';
    };
    function escapeSelectorVal(s) {
      return String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    }
    schema.forEach(function (opt) {
      var optionsList = opt.options || [];
      var hasChoiceCondition = optionsList.some(function (o) {
        return (o.showWhen && (typeof o.showWhen === 'object' || Array.isArray(o.showWhen)))
          || (o.hideWhenListRaw != null && String(o.hideWhenListRaw) !== '')
          || (o.showWhenListRaw != null && String(o.showWhenListRaw) !== '')
          || (o.hideWhen && (typeof o.hideWhen === 'object' || Array.isArray(o.hideWhen)));
      });
      if (!hasChoiceCondition) return;
      var sel = container.querySelector('select[data-option-id="' + opt.id + '"]');
      var radioWrap = container.querySelector('.door-option-wrap[data-option-id="' + opt.id + '"] .common-check-options');
      var checkboxWrap = container.querySelector('.door-option-wrap[data-option-id="' + opt.id + '"] .door-setup-options');
      var optIdNormVis = normalizeOptionIdKey(opt.id);
      if (optIdNormVis === 'sdl_profile') return;
      function whenToRefs(when) {
        if (when == null) return [];
        if (typeof when === 'string' && when.trim()) {
          try { when = JSON.parse(when); } catch (eWhenParse) { return []; }
        }
        var refs = [];
        function pushRef(refId, refValue) {
          if (!refId || refValue == null || refValue === '') return;
          refs.push({ refId: String(refId), refValue: refValue });
        }
        if (Array.isArray(when)) {
          when.forEach(function (cond) {
            if (!cond || typeof cond !== 'object') return;
            if (cond.key != null && cond.value != null) {
              pushRef(cond.key, cond.value);
              return;
            }
            Object.keys(cond).forEach(function (k) {
              var v = cond[k];
              if (Array.isArray(v)) v.forEach(function (vv) { pushRef(k, vv); });
              else pushRef(k, v);
            });
          });
          return refs;
        }
        if (when && typeof when === 'object') {
          Object.keys(when).forEach(function (k) {
            var v = when[k];
            if (Array.isArray(v)) v.forEach(function (vv) { pushRef(k, vv); });
            else pushRef(k, v);
          });
        }
        return refs;
      }
      function getChoiceShowWhenRefs(choice) {
        if (!choice) return [];
        if (choice.showWhenListRaw != null && String(choice.showWhenListRaw) !== '') {
          return whenToRefs(choice.showWhenListRaw);
        }
        if (choice.showWhen) return whenToRefs(choice.showWhen);
        return [];
      }
      function getChoiceHideWhenRefs(choice) {
        if (!choice) return [];
        if (choice.hideWhenListRaw != null && String(choice.hideWhenListRaw) !== '') {
          return whenToRefs(choice.hideWhenListRaw);
        }
        if (choice.hideWhen) return whenToRefs(choice.hideWhen);
        return [];
      }
      function refMatches(refId, refValue) {
        return containerRefValueMatches(container, refId, refValue, false);
      }
      var optWrap = container.querySelector('.door-option-wrap[data-option-id="' + escapeSelectorVal(String(opt.id || '')) + '"]');
      optionsList.forEach(function (choice, idx) {
        var showRefs = getChoiceShowWhenRefs(choice);
        var hideRefs = getChoiceHideWhenRefs(choice);
        var condition = showRefs.length
          ? { type: 'show', refs: showRefs }
          : (hideRefs.length ? { type: 'hide', refs: hideRefs } : null);
        if (!condition) return;
        var refs = condition.refs;
        if (refs.length === 0) return;
        var choiceBoundKey = String(opt.id || '') + '::' + String(choice.value != null ? choice.value : idx);
        function updateChoiceVisibility() {
          var matches = refs.some(function (r) { return refMatches(r.refId, r.refValue); });
          var shouldHide = condition.type === 'show' ? !matches : matches;
          var choiceVal = choice.value != null && choice.value !== '' ? String(choice.value) : '';
          if (sel) {
            var optionEl = sel.querySelector('option[value="' + escapeSelectorVal(choiceVal) + '"]');
            if (optionEl) {
              optionEl.hidden = shouldHide;
              optionEl.disabled = shouldHide;
              if (shouldHide && String(sel.value || '') === choiceVal) {
                var firstVisible = Array.prototype.find.call(sel.options, function (o) { return !o.hidden && o.value; });
                sel.value = firstVisible ? firstVisible.value : '';
                updateEstimatedPrice();
              }
            }
          } else if (radioWrap) {
            var cardScope = optWrap || radioWrap;
            var cards = cardScope.querySelectorAll('.common-check-option[data-choice-value="' + escapeSelectorVal(choiceVal) + '"]');
            Array.prototype.forEach.call(cards, function (card) {
              var inp = card.querySelector && card.querySelector('input[type="radio"][data-option-id="' + escapeSelectorVal(String(opt.id || '')) + '"]');
              if (!inp) return;
              var woodHid = card.getAttribute && card.getAttribute('data-wood-exposure-hidden') === '1';
              if (shouldHide) card.setAttribute('data-choice-condition-hidden', '1');
              else card.removeAttribute('data-choice-condition-hidden');
              var hideCard = !!(shouldHide || woodHid);
              card.style.display = hideCard ? 'none' : '';
              card.classList.toggle('door-hidden', hideCard);
              if (shouldHide && inp.checked) {
                inp.checked = false;
                card.classList.remove('common-check-option--selected');
              }
            });
          } else if (checkboxWrap) {
            var labelWrap = checkboxWrap.querySelector('label.door-setup-option input[value="' + escapeSelectorVal(choiceVal) + '"]');
            if (labelWrap && labelWrap.parentNode) {
              labelWrap.parentNode.style.display = shouldHide ? 'none' : '';
            }
          }
        }
        if (!choiceVisibilityBoundKeys[choiceBoundKey]) {
          refs.forEach(function (r) {
            var refInput = container.querySelector(refSelector(r.refId));
            if (refInput) {
              refInput.addEventListener('change', updateChoiceVisibility);
              if (refInput.type !== 'checkbox' && refInput.type !== 'radio') {
                refInput.addEventListener('input', updateChoiceVisibility);
              }
            }
            all(refSelector(r.refId), container).forEach(function (el) {
              el.addEventListener('change', updateChoiceVisibility);
            });
          });
          choiceVisibilityBoundKeys[choiceBoundKey] = true;
        }
        updateChoiceVisibility();
      });
    });
  }

  /** Match Shopify product tags to config_choice slugs (interior-doors, arch-and-round-top). */
  function normProductTagSlug(s) {
    return String(s == null ? '' : s)
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-');
  }

  function parseShowWhenProductTagsRaw(showWhenProductTags) {
    var raw = showWhenProductTags;
    if (raw == null) return null;
    if (typeof raw === 'string' && raw.trim()) {
      try {
        raw = JSON.parse(raw);
      } catch (eParse) {
        return null;
      }
    }
    return raw;
  }

  /** Largest primary->secondaries map stored on any config_choice (shared catalog JSON). */
  function getGlobalShowWhenProductTagsMap(schema) {
    var map = null;
    var keyCount = 0;
    if (!schema || !schema.length) return null;
    schema.forEach(function (opt) {
      (opt.options || []).forEach(function (c) {
        var raw = parseShowWhenProductTagsRaw(c.showWhenProductTags);
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
          var k = Object.keys(raw).length;
          if (k > keyCount) {
            map = raw;
            keyCount = k;
          }
        }
      });
    });
    return map;
  }

  function getTagSetsForChoiceFromGlobalMap(globalMap, choiceValue) {
    if (!globalMap || !choiceValue) return [];
    var choiceSlug = normProductTagSlug(choiceValue);
    var pairs = [];
    Object.keys(globalMap).forEach(function (primaryTag) {
      if (primaryTag === 'dontShowCollection') return;
      var secondaries = globalMap[primaryTag];
      if (!Array.isArray(secondaries)) return;
      var primaryNorm = normProductTagSlug(primaryTag);
      secondaries.forEach(function (secondaryTag) {
        if (normProductTagSlug(secondaryTag) === choiceSlug) {
          pairs.push([primaryNorm, normProductTagSlug(secondaryTag)]);
        }
      });
    });
    return pairs;
  }

  function choiceIsInProductTagCatalog(globalMap, choiceValue) {
    return getTagSetsForChoiceFromGlobalMap(globalMap, choiceValue).length > 0;
  }

  function getCollectionHandleFromUrl() {
    try {
      var match = window.location.pathname.match(/\/collections\/([^\/\?#]+)/);
      return match ? normProductTagSlug(match[1]) : '';
    } catch (e) { return ''; }
  }

  function getConfiguratorProductTagContext(schema) {
    var main = document.getElementById('door-configurator');
    var productTags = [];
    if (main) {
      var tagsAttr = main.getAttribute('data-product-tags') || '';
      try {
        var parsed = typeof tagsAttr === 'string' && tagsAttr.trim() ? JSON.parse(tagsAttr) : [];
        productTags = Array.isArray(parsed)
          ? parsed.map(normProductTagSlug).filter(Boolean)
          : [];
      } catch (e) {
        productTags = tagsAttr.split('|').map(normProductTagSlug).filter(Boolean);
      }
    }
    return {
      productTags: productTags,
      urlCollectionHandle: getCollectionHandleFromUrl(),
      globalTagMap: getGlobalShowWhenProductTagsMap(schema)
    };
  }

  /** config_choice has show_when_product_tags in schema (Liquid outputs key when meta field exists). */
  function choiceHasShowWhenProductTagsField(choice) {
    return choice != null && Object.prototype.hasOwnProperty.call(choice, 'showWhenProductTags');
  }

  function hasTagRuleForChoice(choice) {
    var raw = choice && choice.showWhenProductTags;
    if (raw == null) return false;
    if (typeof raw === 'string') return raw.trim() !== '';
    if (Array.isArray(raw)) return true;
    if (typeof raw === 'object') return Object.keys(raw).length > 0;
    return false;
  }

  /**
   * Build tag requirement groups. Each group is AND; multiple groups are OR.
   * productTagsOnly: per config_choice show_when_product_tags JSON on the product only.
   */
  function normalizeTagSetsForChoice(showWhenProductTags, choiceValue, opts) {
    opts = opts || {};
    var productTagsOnly = !!opts.productTagsOnly;
    var raw = parseShowWhenProductTagsRaw(showWhenProductTags);
    if (raw == null) return [];
    if (typeof raw === 'string') {
      var oneTag = normProductTagSlug(raw);
      return oneTag ? [[oneTag]] : [];
    }
    var choiceSlug = normProductTagSlug(choiceValue || '');
    if (Array.isArray(raw)) {
      if (raw.length === 0) return [];
      if (typeof raw[0] === 'string') {
        var andSet = raw.map(normProductTagSlug).filter(Boolean);
        if (!andSet.length) return [];
        return [andSet];
      }
      return raw
        .map(function (set) {
          if (!Array.isArray(set)) return null;
          var normalized = set.map(normProductTagSlug).filter(Boolean);
          return normalized.length ? normalized : null;
        })
        .filter(Boolean);
    }
    if (typeof raw === 'object') {
      var pairs = [];
      Object.keys(raw).forEach(function (primaryTag) {
        if (primaryTag === 'dontShowCollection') return;
        var secondaries = raw[primaryTag];
        if (!Array.isArray(secondaries)) return;
        var primaryNorm = normProductTagSlug(primaryTag);
        if (!primaryNorm) return;
        if (productTagsOnly) {
          if (!secondaries.length) {
            pairs.push([primaryNorm]);
            return;
          }
          secondaries.forEach(function (secondaryTag) {
            var secNorm = normProductTagSlug(secondaryTag);
            if (!secNorm) return;
            pairs.push([primaryNorm, secNorm]);
          });
          return;
        }
        if (!secondaries.length) {
          pairs.push([primaryNorm]);
          return;
        }
        secondaries.forEach(function (secondaryTag) {
          var secNorm = normProductTagSlug(secondaryTag);
          if (choiceSlug && secNorm !== choiceSlug) return;
          pairs.push([primaryNorm, secNorm]);
        });
      });
      return pairs;
    }
    return [];
  }

  function tagSetsMatchProductTags(tagSets, productTags) {
    productTags = productTags || [];
    if (!Array.isArray(tagSets) || tagSets.length === 0) return false;
    return tagSets.some(function (set) {
      if (!Array.isArray(set) || set.length === 0) return false;
      return set.every(function (tag) {
        return productTags.indexOf(normProductTagSlug(tag)) !== -1;
      });
    });
  }

  function doorConf2MeasurementsInit() {
    if (!window.DoorConf2Measurements || typeof window.DoorConf2Measurements.init !== 'function') return;
    window.DoorConf2Measurements.init({
      getDoorConfigSchema: function () { return doorConfigSchema; },
      normalizeOptionIdKey: normalizeOptionIdKey,
      sanitizeForDomId: sanitizeForDomId,
      buildOptionDomId: buildOptionDomId,
      ensureSelectHasId: ensureSelectHasId,
      applyHideWhen: applyHideWhen,
      applyChoiceVisibility: applyChoiceVisibility,
      enhanceDoorSelectWithDivDropdown: enhanceDoorSelectWithDivDropdown,
      updateEstimatedPrice: updateEstimatedPrice,
      updateDoorPreview: updateDoorPreview,
      formatMoney: formatMoney,
      parseShowWhenProductTagsRaw: parseShowWhenProductTagsRaw,
      normProductTagSlug: normProductTagSlug,
      getConfiguratorProductTagContext: getConfiguratorProductTagContext,
      choiceHasShowWhenProductTagsField: choiceHasShowWhenProductTagsField,
      normalizeTagSetsForChoice: normalizeTagSetsForChoice,
      tagSetsMatchProductTags: tagSetsMatchProductTags
    });
  }

  function resolveChoiceProductTagShouldHide(opt, choice, ctx) {
    if (!choice || !ctx) return false;
    var choiceVal = choice.value != null && choice.value !== '' ? String(choice.value) : '';
    var productTags = ctx.productTags || [];
    var globalTagMap = ctx.globalTagMap;
    var urlCollectionHandle = ctx.urlCollectionHandle || '';
    var shouldHide = true;
    var tagSets = [];
    if (choiceHasShowWhenProductTagsField(choice)) {
      tagSets = normalizeTagSetsForChoice(choice.showWhenProductTags, choiceVal, {
        productTagsOnly: true
      });
      shouldHide = !tagSets.length || !tagSetsMatchProductTags(tagSets, productTags);
    } else if (globalTagMap && choiceIsInProductTagCatalog(globalTagMap, choiceVal)) {
      tagSets = getTagSetsForChoiceFromGlobalMap(globalTagMap, choiceVal);
      shouldHide = !tagSetsMatchProductTags(tagSets, productTags);
    } else {
      return false;
    }
    if (!shouldHide && urlCollectionHandle && choiceHasShowWhenProductTagsField(choice)) {
      var rawSwpt = parseShowWhenProductTagsRaw(choice.showWhenProductTags);
      if (rawSwpt && typeof rawSwpt === 'object' && !Array.isArray(rawSwpt) && Array.isArray(rawSwpt.dontShowCollection)) {
        if (rawSwpt.dontShowCollection.some(function (h) { return normProductTagSlug(h) === urlCollectionHandle; })) {
          shouldHide = true;
        }
      }
    }
    return shouldHide;
  }

  function applyProductTagChoiceVisibility(schema, container) {
    if (!container) container = document.getElementById('door-configurator-options');
    var main = document.getElementById('door-configurator');
    if (!main || !container) return;
    var ctx = getConfiguratorProductTagContext(schema);
    function escapeSelectorVal(s) {
      return String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    }
    function applyHideToChoice(opt, choiceVal, shouldHide, container) {
      if (!container) return;
      var optIdForRadio = escapeSelectorVal(String(opt.id || ''));
      var choiceEsc = escapeSelectorVal(choiceVal);
      var sel = container.querySelector('select[data-option-id="' + optIdForRadio + '"]');
      if (sel) {
        var optionEl = sel.querySelector('option[value="' + choiceEsc + '"]');
        if (optionEl) {
          optionEl.hidden = shouldHide;
          optionEl.disabled = shouldHide;
          if (shouldHide) optionEl.setAttribute('data-product-tag-hidden', '1');
          else optionEl.removeAttribute('data-product-tag-hidden');
          if (shouldHide && String(sel.value || '') === choiceVal) {
            var firstVisible = Array.prototype.find.call(sel.options, function (o) { return !o.hidden && o.value; });
            sel.value = firstVisible ? firstVisible.value : '';
            if (typeof updateEstimatedPrice === 'function') updateEstimatedPrice();
          }
        }
      }
      var cards = container.querySelectorAll(
        '.common-check-option[data-choice-value="' + choiceEsc + '"]'
      );
      var touchedRadio = false;
      Array.prototype.forEach.call(cards, function (card) {
        var inp = card.querySelector
          ? card.querySelector('input[type="radio"][data-option-id="' + optIdForRadio + '"]')
          : null;
        if (!inp) return;
        touchedRadio = true;
        var woodHidden = card.getAttribute && card.getAttribute('data-wood-exposure-hidden') === '1';
        var conditionHidden = card.getAttribute && card.getAttribute('data-choice-condition-hidden') === '1';
        var hideCard = !!(shouldHide || woodHidden || conditionHidden);
        card.style.display = hideCard ? 'none' : '';
        card.classList.toggle('door-hidden', hideCard);
        if (shouldHide) card.setAttribute('data-product-tag-hidden', '1');
        else card.removeAttribute('data-product-tag-hidden');
        if (shouldHide && inp.checked) {
          inp.checked = false;
          card.classList.remove('common-check-option--selected');
        }
      });
      if (touchedRadio && shouldHide) {
        var optIdNormForAutoSel = String(optIdForRadio || '').toLowerCase().replace(/-/g, '_');
        var isWoodOption = optIdNormForAutoSel.indexOf('wood') !== -1;
        if (!isWoodOption && !optionIdSkipsDefaultRadioAutoSelect(optIdNormForAutoSel)) {
          var anyChecked = container.querySelector(
            'input[type="radio"][data-option-id="' + optIdForRadio + '"]:checked'
          );
          if (!anyChecked) {
            var allRadios = container.querySelectorAll(
              'input[type="radio"][data-option-id="' + optIdForRadio + '"]'
            );
            for (var ri = 0; ri < allRadios.length; ri++) {
              var pickInp = allRadios[ri];
              var cardVis = pickInp.closest ? pickInp.closest('.common-check-option') : null;
              if (!cardVis) continue;
              if (cardVis.style.display === 'none' || cardVis.classList.contains('door-hidden')) continue;
              if (cardVis.getAttribute('data-product-tag-hidden') === '1') continue;
              if (cardVis.getAttribute('data-wood-exposure-hidden') === '1') continue;
              if (cardVis.getAttribute('data-choice-condition-hidden') === '1') continue;
              pickInp.checked = true;
              cardVis.classList.add('common-check-option--selected');
              if (typeof updateEstimatedPrice === 'function') updateEstimatedPrice();
              break;
            }
          }
        }
      }
      var checkboxInps = container.querySelectorAll(
        'label.door-setup-option input[value="' + choiceEsc + '"][data-option-id="' + optIdForRadio + '"]'
      );
      Array.prototype.forEach.call(checkboxInps, function (labelInp) {
        if (labelInp.parentNode) {
          labelInp.parentNode.style.display = shouldHide ? 'none' : '';
        }
      });
    }
    schema.forEach(function (opt) {
      var optionsList = opt.options || [];
      var optIdEsc = escapeSelectorVal(String(opt.id || ''));

      if (isGateCollectionActive() && normalizeOptionIdKey(opt.id) === 'swing_direction') {
        return;
      }

      if (isMeasurementTypeOptionId(opt.id)) {
        var hasMeasureControl = container.querySelector(
          'input[type="radio"][data-option-id="' + optIdEsc + '"]'
        );
        if (!hasMeasureControl) return;
        if (isGateCollectionActive()) {
          optionsList.forEach(function (choice) {
            var choiceVal = choice.value != null && choice.value !== '' ? String(choice.value) : '';
            var hideGateTab = true;
            try {
              if (window.DoorConf2Measurements && typeof window.DoorConf2Measurements.isGateCollectionAllowedMeasureTab === 'function') {
                hideGateTab = !window.DoorConf2Measurements.isGateCollectionAllowedMeasureTab(choiceVal);
              }
            } catch (eGateMeasTab) {}
            applyHideToChoice(opt, choiceVal, hideGateTab, container);
          });
          return;
        }
        optionsList.forEach(function (choice) {
          var choiceVal = choice.value != null && choice.value !== '' ? String(choice.value) : '';
          if (!isMeasurementSidelightTransomTabValue(choiceVal) && normalizeOptionIdKey(choiceVal) !== 'exact_door_size') {
            applyHideToChoice(opt, choiceVal, false, container);
            return;
          }
          applyHideToChoice(opt, choiceVal, resolveMeasurementTabProductTagShouldHide(schema, choiceVal), container);
        });
        return;
      }

      var hasAnyTagRule = optionsList.some(function (c) {
        return choiceHasShowWhenProductTagsField(c) || hasTagRuleForChoice(c);
      });
      if (!hasAnyTagRule && !ctx.globalTagMap) return;
      var hasControlInDom = container.querySelector(
        'select[data-option-id="' + optIdEsc + '"],' +
        ' input[type="radio"][data-option-id="' + optIdEsc + '"],' +
        ' label.door-setup-option input[data-option-id="' + optIdEsc + '"]'
      );
      if (!hasControlInDom) return;
      optionsList.forEach(function (choice) {
        var choiceVal = choice.value != null && choice.value !== '' ? String(choice.value) : '';
        var shouldHide = resolveChoiceProductTagShouldHide(opt, choice, ctx);
        applyHideToChoice(opt, choiceVal, shouldHide, container);
      });
    });
    try { syncMeasurementSidelightTransomTabVisibility(container, schema); } catch (eMeasTabTags) {}
    applyGardenGatesCollectionRulesFromMeasurements(container);
  }

  function bindDynamicOptionsEvents(container) {
    if (!container) return;
    all('select[data-option-id], input[data-option-id]', container).forEach(function (el) {
      function onDynamicOptionChange() {
        if (isStileAndRailProfileInput(el)) return;
        updateEstimatedPrice();
      }
      el.addEventListener('change', onDynamicOptionChange);
      if (el.tagName.toLowerCase() === 'select' || el.type === 'number' || el.type === 'text') {
        el.addEventListener('input', onDynamicOptionChange);
      }
    });
  }

  function bindDelegatedPriceUpdate() {
    var container = document.getElementById('door-configurator');
    if (!container) return;
    function isOptionControlTarget(t) {
      if (!t || !t.getAttribute) return false;
      if (t.getAttribute('data-option-id')) return true;
      if (t.id && String(t.id).indexOf('door-opt-') === 0) return true;
      if (t.closest && (t.tagName === 'SELECT' || t.tagName === 'INPUT') &&
        (t.closest('.door-measurement-embedded-dimensions') ||
         t.closest('.door-measurement-static-rows') ||
         t.closest('.door-measurement-type-section') ||
         t.closest('[data-panel-unit-individual-measurements]') ||
         t.closest('[data-panel-unit-enclosure-measurements]') ||
         t.closest('.door-porch-opening-entry'))) return true;
      return false;
    }
    function isStileAndRailProfileInteraction(t) {
      if (!t || !t.closest) return false;
      if (isStileAndRailProfileInput(t)) return true;
      return !!t.closest('.door-option-wrap[data-option-id="stile_and_rail_profile"]');
    }
    function refreshPriceForOptionTarget(t) {
      if (isStileAndRailProfileInteraction(t)) {
        if (
          window.PriceScreenStorm
          && typeof window.PriceScreenStorm.isScreenAndStormDoorsProductType === 'function'
          && window.PriceScreenStorm.isScreenAndStormDoorsProductType()
          && typeof window.PriceScreenStorm.applyScreenStormStileAndRailProfilePriceUpdate === 'function'
        ) {
          window.PriceScreenStorm.applyScreenStormStileAndRailProfilePriceUpdate();
        } else {
          applyStileAndRailProfilePriceUpdate();
        }
      } else {
        updateEstimatedPrice();
      }
      try { updateDoorPreview(); } catch (ePrev) {}
    }
    function shouldRecalculateFromClick(t) {
      if (!t || !t.closest) return false;
      if (isOptionControlTarget(t)) return true;
      var card = t.closest('.common-check-option');
      if (card && card.querySelector && card.querySelector('input[data-option-id]')) return true;
      var chk = t.closest('.door-setup-option');
      if (chk && chk.querySelector && chk.querySelector('input[data-option-id]')) return true;
      return false;
    }
    function markParentWraps(el) {
      if (!el || !el.closest) return;
      try {
        var node = el.closest('.door-option-wrap[data-option-id]');
        while (node) {
          var pid = node.getAttribute('data-option-id');
          if (pid) markOptionTouched(pid);
          node = node.parentElement ? node.parentElement.closest('.door-option-wrap[data-option-id]') : null;
        }
        var measWrap = el.closest('.door-measurement-type-section[data-option-id]') ||
          el.closest('.door-measurement-embedded-dimensions') ||
          el.closest('.door-measurement-static-rows');
        if (measWrap) {
          var measSection = measWrap.closest ? measWrap.closest('.door-measurement-type-section[data-option-id]') : measWrap;
          if (measSection) {
            var measId = measSection.getAttribute('data-option-id');
            if (measId) markOptionTouched(measId);
          }
        }
      } catch (e) {}
    }
    function handleOptionChange(e) {
      var t = e.target;
      if (isOptionControlTarget(t)) {
        var touchedId = t.getAttribute ? t.getAttribute('data-option-id') : '';
        if (touchedId) markOptionTouched(touchedId);
        markParentWraps(t);
        if (t && t.type === 'radio' && isMeasurementTypeOptionId(touchedId) && t.checked) {
          applyMeasurementTypeTabSelection(t, touchedId, container, doorConfigSchema);
        }
        if (t && String(t.tagName || '').toUpperCase() === 'SELECT') {
          // Persist selection ids/values for future price logic (esp. measurement dropdowns).
          var prefix = (t.closest && t.closest('.door-measurement-static-rows'))
            ? 'door-measurement-static-rows-select'
            : ((t.closest && t.closest('.door-measurement-embedded-dimensions'))
              ? 'door-measurement-embedded-dimensions-select'
              : 'door-select');
          recordDoorSelectMeta(t, prefix);
          // Expose for theme scripts / debugging
          try {
            window.DoorConfiguratorSelectionMeta = {
              bySelectId: getDoorSelectionMetaBySelectId(),
              last: getDoorLastSelectionMeta()
            };
          } catch (eExpose) {}
        }
        refreshPriceForOptionTarget(t);
      }
    }
    container.addEventListener('change', handleOptionChange, true);
    container.addEventListener('input', handleOptionChange, true);
    // Re-evaluate empty option sections after any option interaction so a section
    // reappears if its choices become available (or hides if they go away).
    var _emptySectionRefreshTimer = null;
    function scheduleEmptySectionRefresh() {
      if (_emptySectionRefreshTimer) clearTimeout(_emptySectionRefreshTimer);
      _emptySectionRefreshTimer = setTimeout(function () {
        try { hideEmptyOptionSections(document.getElementById('door-configurator-options')); } catch (eEmpty) {}
        try { applyCollectionMeasureRowVisibility(); } catch (eColMeasure) {}
      }, 60);
    }
    container.addEventListener('change', scheduleEmptySectionRefresh, true);
    container.addEventListener('click', scheduleEmptySectionRefresh, true);
    // Card-style radios: click often lands on img/label; ensure price refreshes after selection applies.
    container.addEventListener('click', function (e) {
      if (!shouldRecalculateFromClick(e.target)) return;
      try {
        var clickedCard = e.target.closest ? e.target.closest('.common-check-option, .door-setup-option') : null;
        var clickedInp = clickedCard ? clickedCard.querySelector('input[data-option-id]') : null;
        if (clickedInp) {
          var cid = clickedInp.getAttribute('data-option-id');
          if (cid) markOptionTouched(cid);
        }
        markParentWraps(e.target);
      } catch (eMark) {}
      if (isStileAndRailProfileInteraction(e.target)) return;
      updateEstimatedPrice();
      try { updateDoorPreview(); } catch (eClkPrev) {}
    }, true);
  }

  function openMeasureGuideDrawer() {
    var selectors = [
      'button.measure-guide-open-btn.common-btn.btn-secondary[aria-controls="measure-guide-drawer-template--20550757351679__measure_guide_drawer_B3hLG4"]',
      'button.measure-guide-open-btn[data-measure-drawer-open]',
      '[data-measure-drawer-open]',
      'button.measure-guide-open-btn'
    ];
    for (var i = 0; i < selectors.length; i++) {
      var matches = all(selectors[i]).filter(function (el) {
        return !!(el && el.offsetParent !== null);
      });
      if (matches.length) {
        matches[0].click();
        return true;
      }
    }
    return false;
  }

  function openWoodSpeciesDrawer() {
    var selectors = [
      'button.wood-species-open-btn.common-btn.btn-secondary[aria-controls="wood-species-drawer-template--20550757351679__wood_species_modal_DmU9Kh"]',
      'button.wood-species-open-btn[data-wood-drawer-open]',
      '[data-wood-drawer-open]'
    ];
    for (var i = 0; i < selectors.length; i++) {
      var matches = all(selectors[i]).filter(function (el) {
        return !!(el && el.offsetParent !== null);
      });
      if (matches.length) {
        matches[0].click();
        return true;
      }
    }
    return false;
  }

  function openScreenTypesDrawer() {
    var selectors = [
      'button.wood-species-open-btn.common-btn.btn-secondary[aria-controls="wood-species-drawer-template--20550757351679__select_screen_MyPiQE"]',
      'button.wood-species-open-btn[data-wood-drawer-open][aria-controls*="select_screen"]'
    ];
    for (var i = 0; i < selectors.length; i++) {
      var matches = all(selectors[i]).filter(function (el) {
        return !!(el && el.offsetParent !== null);
      });
      if (matches.length) {
        matches[0].click();
        return true;
      }
    }
    return false;
  }

  function openStormGlassDrawer() {
    var selectors = [
      'button.wood-species-open-btn.common-btn.btn-secondary[aria-controls="wood-species-drawer-template--20550757351679__select_storm_glass_WxFqqM"]',
      'button.wood-species-open-btn[data-wood-drawer-open][aria-controls*="select_storm_glass"]'
    ];
    for (var i = 0; i < selectors.length; i++) {
      var matches = all(selectors[i]).filter(function (el) {
        return !!(el && el.offsetParent !== null);
      });
      if (matches.length) {
        matches[0].click();
        return true;
      }
    }
    return false;
  }

  /** Opens the Edge Profile info drawer by clicking its theme trigger button. */
  function openEdgeProfileInfoDrawer(drawerId) {
    var id = String(drawerId || '').trim();
    if (!id) id = 'edge-profile-drawer-template--20550757351679__edge_profile_info_drawer_gwxCQU';
    var sel = 'button.edge-profile-drawer__trigger[data-edge-profile-trigger="' + id.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"]';
    var btn = document.querySelector(sel) || document.querySelector('button.edge-profile-drawer__trigger[data-edge-profile-trigger="' + id + '"]');
    if (btn && btn.offsetParent !== null) {
      btn.click();
      return true;
    }
    var any = all('button.edge-profile-drawer__trigger').filter(function (el) { return !!(el && el.offsetParent !== null); });
    if (any.length) {
      any[0].click();
      return true;
    }
    return false;
  }

  /** Same modal/drawer as the theme "Door Setup Options" button (edge_profile / door setup drawer). */
  function getDoorSetupDrawerAriaControls() {
    // Prefer the exact "Door Setup Options" trigger (to avoid edge profile variants).
    var woodBtns = all('button.wood-species-open-btn');
    for (var i = 0; i < woodBtns.length; i++) {
      var b0 = woodBtns[i];
      var txt0 = String(b0 && b0.textContent || '').trim().toLowerCase();
      if (txt0 === 'door setup options' && b0.getAttribute('aria-controls')) {
        return b0.getAttribute('aria-controls');
      }
    }
    // Next best: any trigger that mentions Door Setup.
    for (var j = 0; j < woodBtns.length; j++) {
      var b = woodBtns[j];
      var txt = String(b && b.textContent || '').trim().toLowerCase();
      if (txt.indexOf('door setup') !== -1 && b.getAttribute('aria-controls')) {
        return b.getAttribute('aria-controls');
      }
    }
    // Fallback: first edge_profile-ish trigger.
    var q = document.querySelector('button.wood-species-open-btn[aria-controls*="door_setup"]')
      || document.querySelector('button.wood-species-open-btn[aria-controls*="edge_profile"]');
    if (q && q.getAttribute('aria-controls')) return q.getAttribute('aria-controls');
    // Last resort (known id from theme).
    return 'wood-species-drawer-template--20550757351679__edge_profile_J643k4';
  }

  /** The Edge Profile Options drawer (not Door Setup Options). */
  function getEdgeProfileDrawerAriaControls() {
    var woodBtns = all('button.wood-species-open-btn');
    for (var i = 0; i < woodBtns.length; i++) {
      var b0 = woodBtns[i];
      var txt0 = String(b0 && b0.textContent || '').trim().toLowerCase();
      if (!b0 || !b0.getAttribute) continue;
      if (!b0.getAttribute('aria-controls')) continue;
      if (txt0.indexOf('edge profile') === -1) continue;
      if (txt0.indexOf('door setup') !== -1) continue;
      return b0.getAttribute('aria-controls');
    }
    var q = document.querySelector('button.wood-species-open-btn[aria-controls*="edge_profile"]');
    if (q && q.getAttribute('aria-controls')) return q.getAttribute('aria-controls');
    return '';
  }

  function openEdgeProfileDrawer() {
    var exact = getEdgeProfileDrawerAriaControls();
    if (exact) {
      var escaped = String(exact).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      var exactBtn = document.querySelector('button.wood-species-open-btn[aria-controls="' + escaped + '"]');
      if (exactBtn) {
        exactBtn.click();
        return true;
      }
    }
    var edgeBtns = all('button.wood-species-open-btn[aria-controls*="edge_profile"]');
    for (var i = 0; i < edgeBtns.length; i++) {
      var b = edgeBtns[i];
      var txt = String(b && b.textContent || '').trim().toLowerCase();
      if (txt.indexOf('door setup') !== -1) continue;
      b.click();
      return true;
    }
    return false;
  }

  function getPanelProfileDrawerAriaControls() {
    // Prefer a visible theme trigger whose text mentions "Panel Profile".
    var btns = all('button[aria-controls]');
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      if (!b || !b.getAttribute) continue;
      var txt = String(b.textContent || '').trim().toLowerCase();
      if (txt.indexOf('panel profile') !== -1 || txt.indexOf('panel profiles') !== -1) {
        return b.getAttribute('aria-controls') || '';
      }
    }
    // Next best: any aria-controls id that contains panel_profile / panel-profile.
    for (var j = 0; j < btns.length; j++) {
      var b2 = btns[j];
      if (!b2 || !b2.getAttribute) continue;
      var ac = String(b2.getAttribute('aria-controls') || '');
      var acLower = ac.toLowerCase();
      if (acLower.indexOf('panel_profile') !== -1 || acLower.indexOf('panel-profile') !== -1) {
        return ac;
      }
    }
    return '';
  }

  function openPanelProfileDrawer() {
    var exact = getPanelProfileDrawerAriaControls();
    if (exact) {
      var escaped = String(exact).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      var exactBtn = document.querySelector('button[aria-controls="' + escaped + '"]');
      if (exactBtn) {
        exactBtn.click();
        return true;
      }
    }
    // Fallback: click any button whose text contains "Panel Profile".
    var btns = all('button').filter(function (el) {
      if (!el) return false;
      var t = String(el.textContent || '').trim().toLowerCase();
      return t.indexOf('panel profile') !== -1 || t.indexOf('panel profiles') !== -1;
    });
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      // Prefer visible buttons, but allow hidden if that's the theme pattern.
      if (b && (b.offsetParent !== null || b.classList.contains('btn-hide'))) {
        b.click();
        return true;
      }
    }
    // Last resort: click any wood-species style trigger that controls a panel_profile drawer id.
    var woodBtns = all('button.wood-species-open-btn[aria-controls]');
    for (var j = 0; j < woodBtns.length; j++) {
      var wb = woodBtns[j];
      var ac2 = String(wb && wb.getAttribute ? wb.getAttribute('aria-controls') : '');
      var ac2Lower = ac2.toLowerCase();
      if (ac2Lower.indexOf('panel_profile') !== -1 || ac2Lower.indexOf('panel-profile') !== -1) {
        wb.click();
        return true;
      }
    }
    return false;
  }

  function getLocksetPrepDrawerAriaControls() {
    // Prefer a trigger whose text mentions "Lockset Prep".
    // Ignore our injected "About Lockset Prep" button to avoid self-click loops.
    var btns = all('button[aria-controls]:not([data-lockset-prep-open])');
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      if (!b || !b.getAttribute) continue;
      var txt = String(b.textContent || '').trim().toLowerCase();
      if (txt.indexOf('lockset') !== -1 && txt.indexOf('prep') !== -1) {
        return b.getAttribute('aria-controls') || '';
      }
    }
    // Next best: aria-controls id contains lockset_prep / lockset-prep.
    for (var j = 0; j < btns.length; j++) {
      var b2 = btns[j];
      if (!b2 || !b2.getAttribute) continue;
      var ac = String(b2.getAttribute('aria-controls') || '');
      var acLower = ac.toLowerCase();
      if (acLower.indexOf('lockset_prep') !== -1 || acLower.indexOf('lockset-prep') !== -1 || acLower.indexOf('lockset') !== -1) {
        return ac;
      }
    }
    return '';
  }

  function openLocksetPrepDrawer() {
    // Best: click the theme's actual drawer trigger (often hidden with `btn-hide`).
    var themeTriggers = all('button.wood-species-open-btn[data-wood-drawer-open][aria-controls]:not([data-lockset-prep-open])');
    for (var t = 0; t < themeTriggers.length; t++) {
      var tt = themeTriggers[t];
      var tTxt = String(tt && tt.textContent || '').trim().toLowerCase();
      var tAc = String(tt && tt.getAttribute ? tt.getAttribute('aria-controls') : '').toLowerCase();
      if ((tTxt.indexOf('lockset') !== -1 && tTxt.indexOf('prep') !== -1) ||
          tAc.indexOf('lockset_prep') !== -1 || tAc.indexOf('lockset-prep') !== -1 || tAc.indexOf('lockset') !== -1) {
        tt.click();
        return true;
      }
    }
    var exact = getLocksetPrepDrawerAriaControls();
    if (exact) {
      var escaped = String(exact).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      var exactBtn = document.querySelector('button[aria-controls="' + escaped + '"]:not([data-lockset-prep-open])');
      if (exactBtn) {
        exactBtn.click();
        return true;
      }
    }
    // Fallback: click any button whose text contains "Lockset" and "Prep".
    var btns = all('button:not([data-lockset-prep-open])').filter(function (el) {
      if (!el) return false;
      var t = String(el.textContent || '').trim().toLowerCase();
      return t.indexOf('lockset') !== -1 && t.indexOf('prep') !== -1;
    });
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      if (b && (b.offsetParent !== null || b.classList.contains('btn-hide'))) {
        b.click();
        return true;
      }
    }
    // Last resort: click any wood-species style trigger that controls a lockset_prep drawer id.
    var woodBtns = all('button.wood-species-open-btn[aria-controls]:not([data-lockset-prep-open])');
    for (var j = 0; j < woodBtns.length; j++) {
      var wb = woodBtns[j];
      var ac2 = String(wb && wb.getAttribute ? wb.getAttribute('aria-controls') : '');
      var ac2Lower = ac2.toLowerCase();
      if (ac2Lower.indexOf('lockset_prep') !== -1 || ac2Lower.indexOf('lockset-prep') !== -1 || ac2Lower.indexOf('lockset') !== -1) {
        wb.click();
        return true;
      }
    }
    return false;
  }

  function openDoorSetupDrawer() {
    // Prefer clicking the exact theme trigger (same aria-controls).
    var exact = getDoorSetupDrawerAriaControls();
    if (exact) {
      var escaped = String(exact).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      var exactBtn = document.querySelector('button.wood-species-open-btn[aria-controls="' + escaped + '"]');
      // Theme trigger can be hidden (`btn-hide`) but still functional.
      if (exactBtn) {
        exactBtn.click();
        return true;
      }
    }
    var selectors = [
      'button.wood-species-open-btn.common-btn.btn-secondary[aria-controls="wood-species-drawer-template--20550757351679__edge_profile_J643k4"]',
      'button.wood-species-open-btn[aria-controls*="edge_profile"]',
      'button.wood-species-open-btn[aria-controls*="door_setup"]'
    ];
    for (var i = 0; i < selectors.length; i++) {
      var matches = all(selectors[i]).filter(function (el) {
        // Allow hidden triggers too (theme uses btn-hide).
        return !!el;
      });
      if (matches.length) {
        matches[0].click();
        return true;
      }
    }
    var woodBtns = all('button.wood-species-open-btn');
    for (var k = 0; k < woodBtns.length; k++) {
      var btn = woodBtns[k];
      var txt = (btn.textContent || '').trim();
      if (txt.indexOf('Door Setup') !== -1) {
        btn.click();
        return true;
      }
    }
    return false;
  }

  function resolveChoiceImageSrc(choice) {
    if (!choice) return '';
    var img = choice.image != null ? choice.image : choice.image_url;
    if (!img) return '';
    if (typeof img === 'string') return img;
    if (img.url) return img.url;
    if (img.src) return img.src;
    if (img.value && img.value.url) return img.value.url;
    if (img.preview_image && typeof img.preview_image === 'string') return img.preview_image;
    if (img.preview_image && img.preview_image.url) return img.preview_image.url;
    return '';
  }

  function normalizeChoiceDescriptionText(d) {
    try {
      if (!d) return '';
      if (typeof d === 'string' || typeof d === 'number' || typeof d === 'boolean') return String(d).trim();
      if (typeof d !== 'object') return '';
      if (typeof d.value === 'string') return d.value.trim();
      if (typeof d.text === 'string') return d.text.trim();
      if (typeof d.label === 'string') return d.label.trim();
      if (typeof d.html === 'string') {
        var tmp = document.createElement('div');
        tmp.innerHTML = d.html;
        return (tmp.textContent || tmp.innerText || '').trim();
      }
      for (var i = 0; i < 4; i++) {
        var key = ['content', 'description', 'subtext', 'note'][i];
        if (d && typeof d[key] === 'string') return d[key].trim();
      }
    } catch (e) {}
    return '';
  }

  /**
   * 2026-04-30 — Pooja — Reference: used for panel_profile pricing gate (panel_int_ext / panel_storm_panel).
   * True when config stores boolean true, common truthy strings, or a non-empty checkbox value array.
   */
  function getCfgValueByKeyVariants(cfg, key) {
    if (!cfg || !key) return undefined;
    // Exact first.
    if (Object.prototype.hasOwnProperty.call(cfg, key)) return cfg[key];
    // Common variants: hyphen/underscore swaps.
    var k1 = String(key || '');
    var kUnderscore = k1.replace(/-/g, '_');
    var kHyphen = k1.replace(/_/g, '-');
    if (Object.prototype.hasOwnProperty.call(cfg, kUnderscore)) return cfg[kUnderscore];
    if (Object.prototype.hasOwnProperty.call(cfg, kHyphen)) return cfg[kHyphen];
    return undefined;
  }

  function isConfigFlagMarkedTrue(cfg, key) {
    if (!cfg || !key) return false;
    var raw = getCfgValueByKeyVariants(cfg, key);
    if (raw === true) return true;
    if (typeof raw === 'string') {
      var s = raw.trim().toLowerCase();
      return s === 'true' || s === '1' || s === 'yes' || s === 'on';
    }
    if (Array.isArray(raw)) {
      if (!raw.length) return false;
      for (var ai = 0; ai < raw.length; ai++) {
        var sv = String(raw[ai] != null ? raw[ai] : '').trim().toLowerCase();
        if (sv === 'true' || sv === '1' || sv === 'yes' || sv === 'on') return true;
      }
      return true;
    }
    return false;
  }

  // 2026-04-30 — Pooja — Reference: some options represent "enabled" by any non-empty selection
  // (e.g. select/radio choices like "interior"/"exterior"), not literal boolean true.
  function isConfigKeyMarkedEnabled(cfg, key) {
    if (!cfg || !key) return false;
    var raw = getCfgValueByKeyVariants(cfg, key);
    if (raw == null) return false;
    if (raw === true) return true;
    if (raw === false) return false;
    if (Array.isArray(raw)) return raw.length > 0;
    if (typeof raw === 'number') return raw !== 0;
    var s = String(raw).trim().toLowerCase();
    if (!s) return false;
    if (s === 'false' || s === '0' || s === 'no' || s === 'off' || s === 'none' || s === 'n/a') return false;
    return true;
  }

  /**
   * 2026-04-30 — Pooja — Reference: panel_profile pricing must apply only when
   * panel_int_ext OR panel_storm_panel is "marked true".
   *
   * We first check `config`, but also fall back to checking the live DOM because some UI-only
   * controls are not part of the metaobject schema (and thus won't be in `config`).
   */
  function isPanelProfilePricingGateOpen(cfg) {
    try {
      // Accept both literal boolean "true" and any non-empty selection for these fields.
      var byCfg =
        isConfigKeyMarkedEnabled(cfg, 'panel_int_ext')
        || isConfigKeyMarkedEnabled(cfg, 'panel_storm_panel');
      if (byCfg) return true;
    } catch (eCfgGate) {}
    try {
      var root = document.getElementById('door-configurator-options') || document;
      if (!root) return false;

      function anyTruthyControl(sel) {
        try {
          var el = root.querySelector(sel);
          if (!el) return false;
          var tag = (el.tagName || '').toLowerCase();
          var type = (el.type || '').toLowerCase();
          if (tag === 'input' && (type === 'checkbox' || type === 'radio')) return !!el.checked;
          if (tag === 'select') return el.value != null && String(el.value) !== '';
          return true;
        } catch (eSel) {}
        return false;
      }

      // Prefer exact ids, but support common attribute naming patterns as fallbacks.
      var intExt =
        anyTruthyControl('input[data-option-id="panel_int_ext"]:checked') ||
        anyTruthyControl('select[data-option-id="panel_int_ext"]') ||
        anyTruthyControl('input[name="panel_int_ext"]:checked') ||
        anyTruthyControl('input[name="attributes[panel_int_ext]"]:checked') ||
        anyTruthyControl('select[name="panel_int_ext"]') ||
        anyTruthyControl('select[name="attributes[panel_int_ext]"]');

      var storm =
        anyTruthyControl('input[data-option-id="panel_storm_panel"]:checked') ||
        anyTruthyControl('select[data-option-id="panel_storm_panel"]') ||
        anyTruthyControl('input[name="panel_storm_panel"]:checked') ||
        anyTruthyControl('input[name="attributes[panel_storm_panel]"]:checked') ||
        anyTruthyControl('select[name="panel_storm_panel"]') ||
        anyTruthyControl('select[name="attributes[panel_storm_panel]"]');

      return !!(intExt || storm);
    } catch (eDomGate) {}
    return false;
  }

  // 2026-04-30 — Pooja — Reference: when card UI stores the selection in data-choice-value
  // (not necessarily the underlying <input>.value), use this to recover the selected choice value.
  function getSelectedChoiceValueFromDom(optionId) {
    try {
      var root = document.getElementById('door-configurator-options') || document;
      if (!root || !optionId) return '';

      // Select-based UI.
      var sel = root.querySelector('select[data-option-id="' + optionId + '"]');
      if (sel && sel.value != null && sel.value !== '') return String(sel.value || '');

      // Native radio/checkbox value.
      var checked = root.querySelector('input[data-option-id="' + optionId + '"][type="radio"]:checked, input[data-option-id="' + optionId + '"][type="checkbox"]:checked');
      if (checked && checked.value != null && String(checked.value) !== '') return String(checked.value || '');

      // Card UI: find checked input inside `.common-check-option` and read wrapper's data-choice-value.
      var checkedInCard = root.querySelector('.common-check-option input[data-option-id="' + optionId + '"][type="radio"]:checked, .common-check-option input[data-option-id="' + optionId + '"][type="checkbox"]:checked');
      if (checkedInCard) {
        var wrap = checkedInCard.closest ? checkedInCard.closest('.common-check-option') : null;
        var cv = wrap && wrap.getAttribute ? wrap.getAttribute('data-choice-value') : '';
        if (cv) return String(cv || '');
      }

      // Final fallback: any element marked selected that has data-choice-value.
      var selectedCard = root.querySelector('.common-check-option--selected[data-choice-value]');
      if (selectedCard) {
        var cv2 = selectedCard.getAttribute('data-choice-value');
        if (cv2) return String(cv2 || '');
      }
    } catch (e) {}
    return '';
  }

  // Pricing from metaobject schema only (priceType + priceValue per choice; optional conditional override)
  function calculatePriceFromSchema(basePrice, config, schema) {
    var total = basePrice;
    if (!Array.isArray(schema)) return total;

    // Cache for config_choice flags keyed by choice.value
    // { [value]: { panel_int_ext: boolean, panel_storm_panel: boolean } }
    if (!window.__configChoiceFlagsByValue) window.__configChoiceFlagsByValue = {};
    if (!window.__configChoiceFlagsLoading) window.__configChoiceFlagsLoading = {};

    function fetchConfigChoiceFlagsByValue(value) {
      try {
        if (window.__doorSelectionLogOnly) {
          return Promise.resolve({ panel_int_ext: false, panel_storm_panel: false });
        }
        var v = String(value == null ? '' : value).trim();
        if (!v) return Promise.reject(new Error('missing value'));
        if (window.__configChoiceFlagsByValue[v]) return Promise.resolve(window.__configChoiceFlagsByValue[v]);
        if (window.__configChoiceFlagsLoading[v]) return window.__configChoiceFlagsLoading[v];

        var base = (window.DOOR_PRICING_RULE_PROXY_BASE || 'https://vintage.espirevox.com');
        base = String(base || '').replace(/\/+$/, '');
        var url = base + '/config-choice.php?value=' + encodeURIComponent(v);

        var p = fetch(url, { mode: 'cors', credentials: 'omit' })
          .then(function (r) { if (!r || !r.ok) throw new Error('bad response'); return r.json(); })
          .then(function (json) {
            var flags = {
              panel_int_ext: !!(json && json.flags && json.flags.panel_int_ext),
              panel_storm_panel: !!(json && json.flags && json.flags.panel_storm_panel)
            };
            window.__configChoiceFlagsByValue[v] = flags;
            return flags;
          })
          .catch(function (e) {
            // Cache negative so we don't spam network.
            window.__configChoiceFlagsByValue[v] = { panel_int_ext: false, panel_storm_panel: false, _error: true };
            throw e;
          })
          .finally(function () {
            try { delete window.__configChoiceFlagsLoading[v]; } catch (e2) {}
          });

        window.__configChoiceFlagsLoading[v] = p;
        return p;
      } catch (eOuter) {
        return Promise.reject(eOuter);
      }
    }

    schema.forEach(function (opt) {
      if (!opt || !opt.id || !opt.type) return;
      // Stile/rail is priced once at the end (full list price on top of other options).
      if (optionIsStileAndRailProfile(opt)) return;
      // Applied molding uses millwork_product_pricing tier map (door-conf2-update.js).
      if (optionIsAppliedMolding(opt)) return;
      var optType = (opt.type || '').toLowerCase();
      var selected = config ? config[opt.id] : null;
      var choices = Array.isArray(opt.options) ? opt.options : [];

      function choiceFieldTruthy(choice, key) {
        try {
          if (!choice || !key) return false;
          var v = choice[key];
          if (v == null && typeof key === 'string') {
            // allow hyphen/underscore variants
            var k2 = key.indexOf('_') !== -1 ? key.replace(/_/g, '-') : key.replace(/-/g, '_');
            v = choice[k2];
          }
          if (v === true) return true;
          if (v === false) return false;
          if (typeof v === 'number') return v !== 0;
          var s = String(v == null ? '' : v).trim().toLowerCase();
          if (!s) return false;
          if (s === 'true' || s === '1' || s === 'yes' || s === 'on') return true;
          if (s === 'false' || s === '0' || s === 'no' || s === 'off') return false;
          return true; // non-empty string means enabled
        } catch (e) {}
        return false;
      }

      function applyChoice(choice) {
        if (!choice) return;
        var t = choice.priceType || choice.price_type;
        var v = parseFloat(choice.priceValue || choice.price_value || 0);
        function norm(s) { return String(s || '').trim().toLowerCase(); }
        function oneMatch(key, val) {
          var otherVal = config[key];
          return Array.isArray(otherVal)
            ? otherVal.some(function (ov) { return norm(ov) === norm(val); })
            : norm(otherVal || '') === norm(val);
        }
        function checkOverride(o) {
          // Compound: price_when = [{key, value}, ...] — all must match
          var whenArr = o && (o.price_when || o.priceWhen);
          if (Array.isArray(whenArr) && whenArr.length > 0) {
            for (var j = 0; j < whenArr.length; j++) {
              var cond = whenArr[j];
              var k = cond.key || cond.price_when_key;
              var v = cond.value != null ? cond.value : cond.price_when_value;
              if (!k || v == null || !oneMatch(k, v)) return false;
            }
            return true;
          }
          // Single: price_when_key + price_when_value
          var whenKey = o && (o.priceWhenKey || o.price_when_key);
          if (!whenKey || (o.priceWhenValue == null && o.price_when_value == null)) return false;
          var whenVal = o.priceWhenValue != null ? o.priceWhenValue : o.price_when_value;
          if (whenVal === '') return false;
          return oneMatch(whenKey, whenVal);
        }
        // Overrides: from array (set 1/2/3) or from JSON field priceOverridesRaw (unlimited). First match wins.
        var overrides = choice.priceOverrides;
        if (!Array.isArray(overrides) && choice.priceOverridesRaw != null) {
          try {
            overrides = typeof choice.priceOverridesRaw === 'string' ? JSON.parse(choice.priceOverridesRaw) : choice.priceOverridesRaw;
          } catch (e) { overrides = []; }
        }
        if (!Array.isArray(overrides)) overrides = [];
        // Stile & rail: always use the choice list price (priceValue) on top of the running total.
        // Conditional overrides on metaobject rows often replace $125 with a small delta (e.g. $15);
        // business rule is full list add-on for this option id only.
        if (!optionIsStileAndRailProfile(opt)) {
          if (overrides.length && config) {
            for (var i = 0; i < overrides.length; i++) {
              var o = overrides[i];
              if (checkOverride(o)) {
                t = o.priceWhenType || o.price_when_type || 'fixed';
                v = parseFloat((o.priceWhenValueNumber != null ? o.priceWhenValueNumber : o.price_when_value_number) || 0);
                break;
              }
            }
          } else if (config) {
            // Single override (backward compatible)
            var whenKey = choice.priceWhenKey || choice.price_when_key;
            var whenVal = choice.priceWhenValue != null ? choice.priceWhenValue : choice.price_when_value;
            if (whenKey && whenVal != null && whenVal !== '') {
              var otherVal = config[whenKey];
              var match = Array.isArray(otherVal)
                ? otherVal.some(function (ov) { return norm(ov) === norm(whenVal); })
                : norm(otherVal || '') === norm(whenVal);
              if (match) {
                t = choice.priceWhenType || choice.price_when_type || 'fixed';
                v = parseFloat((choice.priceWhenValueNumber != null ? choice.priceWhenValueNumber : choice.price_when_value_number) || 0);
              }
            }
          }
        }
        if (!t) t = 'fixed';
        // 2026-04-30 — Pooja — Reference: panel_profile price_value adds only when
        // customer picked a profile AND (panel_int_ext OR panel_storm_panel) is marked true.
        if (optionIsPanelProfile(opt)) {
          // Primary: the metaobject choice itself carries these flags (as seen in Shopify admin).
          var byChoice =
            choiceFieldTruthy(choice, 'panel_int_ext')
            || choiceFieldTruthy(choice, 'panel_storm_panel');

          // If schema doesn't carry the flags, fetch from config_choice by value (async, cached).
          var byConfigChoiceCache = false;
          try {
            var cached = window.__configChoiceFlagsByValue[String(choice.value || '')];
            if (cached) byConfigChoiceCache = !!(cached.panel_int_ext || cached.panel_storm_panel);
          } catch (eCache) {}

          // Fallback: some themes may provide these as config/DOM controls.
          var ppAllow = byChoice || byConfigChoiceCache || isPanelProfilePricingGateOpen(config);

          // If not allowed yet and we don't have cache, kick off fetch and reprice once loaded.
          if (!ppAllow) {
            try {
              var vv = String(choice.value || '');
              if (vv && !window.__configChoiceFlagsByValue[vv] && !window.__configChoiceFlagsLoading[vv]) {
                fetchConfigChoiceFlagsByValue(vv).then(function () {
                  try { updateEstimatedPrice(); } catch (eUpd) {}
                });
              }
            } catch (eKick) {}
          }
          if (!ppAllow) return;
        }
        if (t === 'fixed') total += v;
        else if (t === 'percent') total += (basePrice * v);
      }

      if (optType === 'select' || optType === 'radio') {
        var selectedStr = selected != null ? String(selected) : '';
        var ch = choices.find(function (c) { return String(c.value || '') === selectedStr; });
        // 2026-04-30 — Pooja — Reference: panel_profile sometimes uses card UI with data-choice-value.
        if (!ch && optionIsPanelProfile(opt)) {
          var domVal = getSelectedChoiceValueFromDom(String(opt.id || ''));
          if (domVal) {
            ch = choices.find(function (c) { return String(c.value || '') === String(domVal || ''); });
          }
        }
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

  function calculateRunningPricesPerOption(basePrice, config, schema) {
    var result = [];
    if (!Array.isArray(schema)) return result;
    var running = basePrice;
    schema.forEach(function (opt) {
      if (!opt || !opt.id || !opt.type) return;
      if (optionIsStileAndRailProfile(opt)) return;
      if (optionIsAppliedMolding(opt)) return;
      var optType = (opt.type || '').toLowerCase();
      var selected = config ? config[opt.id] : null;
      var choices = Array.isArray(opt.options) ? opt.options : [];
      if (optType !== 'select' && optType !== 'radio' && optType !== 'checkbox') return;

      function norm(s) { return String(s || '').trim().toLowerCase(); }
      function oneMatch(key, val) {
        var otherVal = config[key];
        return Array.isArray(otherVal)
          ? otherVal.some(function (ov) { return norm(ov) === norm(val); })
          : norm(otherVal || '') === norm(val);
      }
      function resolveChoicePrice(choice) {
        if (!choice) return 0;
        var t = choice.priceType || choice.price_type;
        var v = parseFloat(choice.priceValue || choice.price_value || 0);
        var overrides = choice.priceOverrides;
        if (!Array.isArray(overrides) && choice.priceOverridesRaw != null) {
          try {
            overrides = typeof choice.priceOverridesRaw === 'string' ? JSON.parse(choice.priceOverridesRaw) : choice.priceOverridesRaw;
          } catch (e) { overrides = []; }
        }
        if (!Array.isArray(overrides)) overrides = [];
        if (!optionIsStileAndRailProfile(opt) && config) {
          if (overrides.length) {
            for (var i = 0; i < overrides.length; i++) {
              var o = overrides[i];
              var whenArr = o && (o.price_when || o.priceWhen);
              var matched = false;
              if (Array.isArray(whenArr) && whenArr.length > 0) {
                matched = true;
                for (var j = 0; j < whenArr.length; j++) {
                  var cond = whenArr[j];
                  var k = cond.key || cond.price_when_key;
                  var cv = cond.value != null ? cond.value : cond.price_when_value;
                  if (!k || cv == null || !oneMatch(k, cv)) { matched = false; break; }
                }
              } else {
                var whenKey = o && (o.priceWhenKey || o.price_when_key);
                var whenVal = o && (o.priceWhenValue != null ? o.priceWhenValue : o.price_when_value);
                if (whenKey && whenVal != null && whenVal !== '') matched = oneMatch(whenKey, whenVal);
              }
              if (matched) {
                t = o.priceWhenType || o.price_when_type || 'fixed';
                v = parseFloat((o.priceWhenValueNumber != null ? o.priceWhenValueNumber : o.price_when_value_number) || 0);
                break;
              }
            }
          } else {
            var whenKey2 = choice.priceWhenKey || choice.price_when_key;
            var whenVal2 = choice.priceWhenValue != null ? choice.priceWhenValue : choice.price_when_value;
            if (whenKey2 && whenVal2 != null && whenVal2 !== '' && oneMatch(whenKey2, whenVal2)) {
              t = choice.priceWhenType || choice.price_when_type || 'fixed';
              v = parseFloat((choice.priceWhenValueNumber != null ? choice.priceWhenValueNumber : choice.price_when_value_number) || 0);
            }
          }
        }
        if (!t) t = 'fixed';
        if (t === 'fixed') return isNaN(v) ? 0 : v;
        if (t === 'percent') return isNaN(v) ? 0 : (basePrice * v);
        return 0;
      }

      var delta = 0;
      if (optType === 'select' || optType === 'radio') {
        var selectedStr = selected != null ? String(selected) : '';
        var ch = choices.find(function (c) { return String(c.value || '') === selectedStr; });
        if (!ch && optionIsPanelProfile(opt)) {
          var domVal = getSelectedChoiceValueFromDom(String(opt.id || ''));
          if (domVal) ch = choices.find(function (c) { return String(c.value || '') === String(domVal || ''); });
        }
        delta = resolveChoicePrice(ch);
      } else if (optType === 'checkbox') {
        var arr = Array.isArray(selected) ? selected : [];
        arr.forEach(function (val) {
          var valStr = val != null ? String(val) : '';
          var ch2 = choices.find(function (c) { return String(c.value || '') === valStr; });
          delta += resolveChoicePrice(ch2);
        });
      }
      var prev = running;
      running += delta;
      result.push({
        optionId: opt.id,
        label: opt.label || opt.id,
        choicePrice: delta,
        prevTotal: prev,
        runningTotal: running
      });
    });
    return result;
  }

  function isStileAndRailProfileInput(el) {
    if (!el) return false;
    try {
      var oid = el.getAttribute ? String(el.getAttribute('data-option-id') || '') : '';
      if (oid === 'stile_and_rail_profile') return true;
      var name = el.name != null ? String(el.name) : '';
      return name.indexOf('Stile and Rail Profile') !== -1;
    } catch (e) {}
    return false;
  }

  function readDoorEstimatedPriceFromDom() {
    try {
      if (
        window.DoorIntExtPricingRule
        && typeof window.DoorIntExtPricingRule.readEstimatedPriceFromDom === 'function'
      ) {
        return window.DoorIntExtPricingRule.readEstimatedPriceFromDom();
      }
      var nodes = document.querySelectorAll('#door-estimated-price');
      if (!nodes.length) return 0;
      for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].offsetParent !== null) {
          var n = parseFloat(String(nodes[i].textContent || '').replace(/[^0-9.-]+/g, ''));
          return isNaN(n) ? 0 : n;
        }
      }
      var n0 = parseFloat(String(nodes[0].textContent || '').replace(/[^0-9.-]+/g, ''));
      return isNaN(n0) ? 0 : n0;
    } catch (e) {}
    return 0;
  }

  function writeDoorEstimatedPriceFromConf2(amount, meta) {
    if (
      window.DoorIntExtPricingRule
      && typeof window.DoorIntExtPricingRule.writeEstimatedPriceDisplay === 'function'
    ) {
      var result = window.DoorIntExtPricingRule.writeEstimatedPriceDisplay(amount, meta);
      try { updateOptionRunningPriceLabels(); } catch (eLabel) {}
      return result;
    }
    var nodes = document.querySelectorAll('#door-estimated-price');
    var formatted = formatMoney(amount);
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = formatted;
    try { updateOptionRunningPriceLabels(); } catch (eLabel) {}
  }

  /** Round currency for stored pricing snapshot fields. */
  function roundDoorMoney(n) {
    var x = parseFloat(n);
    if (isNaN(x)) return 0;
    return Math.round(x * 100) / 100;
  }

  function getGlassFormulaAddonForStoredOption(config, optionId) {
    if (!window.GlassFormulaCalculation || !config) return 0;
    var val = config[optionId];
    if (val == null || val === '') return 0;
    var key = window.GlassFormulaCalculation.normChoiceValue(val);
    if (!key) return 0;
    return window.GlassFormulaCalculation.calculateAddonFromCache([key]) || 0;
  }

  /**
   * Capture applied unit price + addon breakdown for admin app and my-saved-doors edit restore.
   */
  function buildDoorPriceSnapshotForStorage(config, basePrice) {
    var breakdown = {};
    var sidelightGf = getGlassFormulaAddonForStoredOption(config, 'sidelight_style');
    var transomGf = getGlassFormulaAddonForStoredOption(config, 'transom_style');
    if (sidelightGf > 0.005) breakdown.glass_formula_sidelight = roundDoorMoney(sidelightGf);
    if (transomGf > 0.005) breakdown.glass_formula_transom = roundDoorMoney(transomGf);

    var addonWindowMap = {
      sidelight_transom_oversized: '__doorAddon_sidelightTransomOversized',
      sidelight_transom_oversized_pair1: '__doorAddon_sidelightTransomOversizedPair1',
      sidelight_transom_oversized_pair2: '__doorAddon_sidelightTransomOversizedPair2',
      storm_glass: '__doorAddon_storm_glass',
      stile_and_rail_profile: '__doorAddon_stile_and_rail_profile',
      int_ext_oversized: '__doorAddon_intExtOversizedApi',
      interior_door_thickness: '__doorAddon_interiorDoorThickness',
      sidelight_panel_thickness: '__doorAddon_sidelightPanelThickness',
      door_seal_kit_matching: '__doorAddon_door_seal_kit_matching',
      door_sweeps_matching: '__doorAddon_door_sweeps_matching',
      priming_services: '__doorAddon_priming_services',
      applied_molding_tier: '__doorAddon_applied_molding_tier',
      screen_storm_oversized: '__doorScreenStormAddon_oversized',
      screen_storm_thickness: '__doorScreenStormAddon_thickness',
      screen_storm_thickness_frac: '__doorScreenStormAddon_thickness_frac',
      screen_storm_sidelight_transom: '__doorScreenStormAddon_sidelight_transom',
      screen_storm_transom_combo: '__doorScreenStormAddon_transom_combo',
      screen_storm_panel_door_thickness_extra: '__doorScreenStormAddon_panel_door_thickness_extra'
    };
    Object.keys(addonWindowMap).forEach(function (bk) {
      var amt = parseFloat(window[addonWindowMap[bk]] || 0) || 0;
      if (amt > 0.005) breakdown[bk] = roundDoorMoney(amt);
    });
    try {
      if (window.DoorIntExtPricingRule && typeof window.DoorIntExtPricingRule.getIntExtGeneralOversizedAddonTotal === 'function') {
        var intExtCombined = window.DoorIntExtPricingRule.getIntExtGeneralOversizedAddonTotal();
        if (intExtCombined > 0.005) breakdown.int_ext_oversized = roundDoorMoney(intExtCombined);
      }
    } catch (eIntExtBd) {}

    var themeTotal = parseFloat(window.__doorThemeOptionTotal) || 0;
    if (themeTotal < basePrice - 0.02) {
      try {
        var priceRes = calculateDoorPrice(basePrice, config);
        themeTotal = (priceRes && typeof priceRes.price === 'number') ? priceRes.price : basePrice;
      } catch (eTheme) {
        themeTotal = basePrice;
      }
    }

    var applied = readDoorEstimatedPriceFromDom();
    if (applied < basePrice - 0.02) {
      var extraAddons = 0;
      if (window.DoorIntExtPricingRule && typeof window.DoorIntExtPricingRule.getDoorAddonTotalSum === 'function') {
        extraAddons = window.DoorIntExtPricingRule.getDoorAddonTotalSum();
      }
      extraAddons += (parseFloat(window['__doorAddon_storm_glass'] || 0) || 0);
      extraAddons += (parseFloat(window['__doorAddon_stile_and_rail_profile'] || 0) || 0);
      extraAddons += (parseFloat(window['__doorAddon_door_seal_kit_matching'] || 0) || 0);
      extraAddons += (parseFloat(window['__doorAddon_door_sweeps_matching'] || 0) || 0);
      extraAddons += (parseFloat(window['__doorAddon_priming_services'] || 0) || 0);
      extraAddons += (parseFloat(window['__doorAddon_applied_molding_tier'] || 0) || 0);
      applied = themeTotal + extraAddons;
    }

    var addonsTotal = applied - themeTotal;
    if (addonsTotal < 0) addonsTotal = 0;

    return {
      _applied_unit_price: roundDoorMoney(applied),
      _theme_option_total: roundDoorMoney(themeTotal),
      _addons_total: roundDoorMoney(addonsTotal),
      _addon_breakdown: breakdown,
      _pricing_snapshot_at: new Date().toISOString()
    };
  }

  function applyStoredDoorPricingFromOptions(opts) {
    if (!opts || typeof opts !== 'object') return;
    var bd = opts._addon_breakdown;
    var hasBreakdown = bd && typeof bd === 'object';
    var applied = parseFloat(opts._applied_unit_price);
    var hasApplied = !isNaN(applied) && applied > 0;
    if (!hasBreakdown && !hasApplied) return;

    if (parseFloat(opts._theme_option_total) > 0) {
      window.__doorThemeOptionTotal = parseFloat(opts._theme_option_total);
    }

    if (hasBreakdown) {
      var restoreMap = {
        sidelight_transom_oversized: '__doorAddon_sidelightTransomOversized',
        sidelight_transom_oversized_pair1: '__doorAddon_sidelightTransomOversizedPair1',
        sidelight_transom_oversized_pair2: '__doorAddon_sidelightTransomOversizedPair2',
        storm_glass: '__doorAddon_storm_glass',
        stile_and_rail_profile: '__doorAddon_stile_and_rail_profile',
        int_ext_oversized: '__doorAddon_intExtOversizedApi',
        interior_door_thickness: '__doorAddon_interiorDoorThickness',
        sidelight_panel_thickness: '__doorAddon_sidelightPanelThickness',
        door_seal_kit_matching: '__doorAddon_door_seal_kit_matching',
        door_sweeps_matching: '__doorAddon_door_sweeps_matching',
        priming_services: '__doorAddon_priming_services',
        screen_storm_oversized: '__doorScreenStormAddon_oversized',
        screen_storm_thickness: '__doorScreenStormAddon_thickness',
        screen_storm_thickness_frac: '__doorScreenStormAddon_thickness_frac',
        screen_storm_sidelight_transom: '__doorScreenStormAddon_sidelight_transom',
        screen_storm_transom_combo: '__doorScreenStormAddon_transom_combo',
        screen_storm_panel_door_thickness_extra: '__doorScreenStormAddon_panel_door_thickness_extra'
      };
      var skipScreenStormStoredAddons = !!(
        window.PriceScreenStorm
        && typeof window.PriceScreenStorm.isScreenAndStormDoorsProductType === 'function'
        && window.PriceScreenStorm.isScreenAndStormDoorsProductType()
      );
      Object.keys(restoreMap).forEach(function (bk) {
        if (skipScreenStormStoredAddons && bk.indexOf('screen_storm_') === 0) return;
        if (bd[bk] != null && bd[bk] !== '') {
          window[restoreMap[bk]] = parseFloat(bd[bk]) || 0;
        }
      });
      if (bd.stile_and_rail_profile != null) {
        try { window.__doorLastStileRailListPrice = parseFloat(bd.stile_and_rail_profile) || 0; } catch (eSt) {}
      }
    }

    if (
      window.DoorIntExtPricingRule
      && typeof window.DoorIntExtPricingRule.syncEstimatedPriceDisplay === 'function'
    ) {
      window.DoorIntExtPricingRule.syncEstimatedPriceDisplay({
        source: 'loadSavedConfig',
        silent: true,
        doorSealKitMatching: parseFloat(window['__doorAddon_door_seal_kit_matching'] || 0) || 0,
        doorSweepsMatching: parseFloat(window['__doorAddon_door_sweeps_matching'] || 0) || 0,
        primingServices: parseFloat(window['__doorAddon_priming_services'] || 0) || 0
      });
    } else if (hasApplied) {
      writeDoorEstimatedPriceFromConf2(applied, { source: 'loadSavedConfig' });
    }

    if (hasApplied) {
      var currentShown = readDoorEstimatedPriceFromDom();
      if (currentShown + 0.02 < applied) {
        writeDoorEstimatedPriceFromConf2(applied, { source: 'loadSavedConfig_fallback' });
      }
    }
    try { syncMeasurementSelectedPriceLabels(opts); } catch (eMeasPrice) {}
  }

  function refreshScreenStormPricingAfterSavedRestore() {
    try {
      if (
        !window.PriceScreenStorm
        || typeof window.PriceScreenStorm.applyScreenStormOversizedPricing !== 'function'
        || typeof window.PriceScreenStorm.isScreenAndStormDoorsProductType !== 'function'
        || !window.PriceScreenStorm.isScreenAndStormDoorsProductType()
      ) {
        return;
      }
      var triggerSelectors = [
        'select#door_height[data-door-user-changed="1"]',
        'select#door_height_fraction[data-door-user-changed="1"]',
        'select[id^="panel-door-width-int"][data-door-user-changed="1"]',
        'select[id^="panel-door-width-frac"][data-door-user-changed="1"]',
        'select#exact-door-width-int[data-door-user-changed="1"]',
        'select[id^="exact-door-width-int"][data-door-user-changed="1"]'
      ];
      var triggerEl = null;
      for (var ti = 0; ti < triggerSelectors.length; ti++) {
        triggerEl = document.querySelector(triggerSelectors[ti]);
        if (triggerEl) break;
      }
      if (triggerEl) {
        window.PriceScreenStorm.applyScreenStormOversizedPricing(triggerEl);
      }
    } catch (eSsRestore) {}
  }


  function prefetchSavedSidelightTransomApi(opts, done) {
    var finish = typeof done === 'function' ? done : function () {};
    if (!window.GlassFormulaCalculation || !opts) {
      finish();
      return;
    }
    var keys = [];
    ['sidelight_style', 'transom_style'].forEach(function (id) {
      var v = opts[id];
      if (v == null || v === '') return;
      var k = window.GlassFormulaCalculation.normChoiceValue(v);
      if (k) keys.push(k);
    });
    if (!keys.length) {
      finish();
      return;
    }
    var miss = window.GlassFormulaCalculation.getMissingFromCache(keys);
    if (miss && miss.length && typeof window.GlassFormulaCalculation.load === 'function') {
      window.GlassFormulaCalculation.load(miss).then(finish).catch(finish);
      return;
    }
    finish();
  }

  /**
   * Stile/rail: replace previous profile list price with the new one on the current display total.
   * (change event already has the new radio checked — do not read “previous” from getCurrentConfig().)
   */
  function applyStileAndRailProfilePriceUpdate() {
    if (window.__doorStileApplyBusy) return;
    window.__doorStileApplyBusy = true;
    try {
      var container = document.getElementById('door-configurator');
      if (!container || !doorConfigSchema || !Array.isArray(doorConfigSchema)) return;
      var basePrice = parseFloat(container.getAttribute('data-base-price')) || 0;
      if (isNaN(basePrice)) basePrice = 0;
      var config = getCurrentConfig();
      var newStile = getStileAndRailProfileListPrice(basePrice, config, doorConfigSchema);
      var theme = calculateDoorPrice(basePrice, config).price;
      window.__doorThemeOptionTotal = theme;
      window['__doorAddon_stile_and_rail_profile'] = newStile;
      window.__doorLastStileRailListPrice = newStile;
      var total = theme;
      if (
        window.DoorIntExtPricingRule
        && typeof window.DoorIntExtPricingRule.syncEstimatedPriceDisplay === 'function'
      ) {
        window.__doorStileSyncInProgress = true;
        var stileVal = '';
        try {
          var stileInp = document.querySelector(
            'input[type="radio"][data-option-id="stile_and_rail_profile"]:checked,' +
            'input[type="radio"][name="attributes[Stile and Rail Profile]"]:checked'
          );
          if (stileInp && stileInp.value != null) stileVal = String(stileInp.value);
        } catch (eSel) {}
        window.DoorIntExtPricingRule.syncEstimatedPriceDisplay({
          source: 'stile_and_rail_profile',
          userAction: true,
          selected: stileVal,
          stileAddon: newStile,
          themeOptionTotal: theme
        });
        window.__doorStileSyncInProgress = false;
        total = readDoorEstimatedPriceFromDom();
        try {
          document.dispatchEvent(new CustomEvent('door-configurator-price-updated', {
            detail: { themeOptionTotal: theme, source: 'stile_and_rail_profile' }
          }));
        } catch (eStileEvt) {}
      } else {
        var addons = parseFloat(window.__doorIntExtAddonPrice || 0) || 0;
        total = theme + addons + newStile;
        writeDoorEstimatedPriceFromConf2(total, {
          source: 'stile_and_rail_profile',
          userAction: true,
          stileAddon: newStile
        });
      }
    } catch (eApply) {}
    finally {
      try {
        function resyncStileDisplay() {
          try {
            if (
              window.DoorIntExtPricingRule
              && typeof window.DoorIntExtPricingRule.syncEstimatedPriceDisplay === 'function'
            ) {
              window.__doorStileSyncInProgress = true;
              window.DoorIntExtPricingRule.syncEstimatedPriceDisplay({ silent: true });
              window.__doorStileSyncInProgress = false;
            }
          } catch (eRe) {}
        }
        setTimeout(function () {
          resyncStileDisplay();
          window.__doorStileApplyBusy = false;
        }, 0);
      } catch (eFin) {}
    }
  }

  function bindStileAndRailProfileAdditivePricing() {
    /* Stile priced via bindDelegatedPriceUpdate + card change only (avoids triple fire). */
  }

  // Always recomputed from `basePrice` + current `config` (no persisted running total).
  function calculateDoorPrice(basePrice, config) {
    // Price from metaobject schema only (no static rules)
    if (doorConfigSchema && Array.isArray(doorConfigSchema) && doorConfigSchema.length) {
      var total = calculatePriceFromSchema(basePrice, config, doorConfigSchema);

      // Slab-only pricing adjustment:
      // - When any selected choice value is "slab_only"
      // - Add the selected `wood_type` choice's slab interior/exterior extra to the running total.
      // This way, normal `wood_type.priceValue` stays, and the extra becomes:
      //   wood_type.priceValue + wood_type.(slab interior/exterior)
      try {
        function normSelectionValue(v) {
          return String(v == null ? '' : v).trim().toLowerCase().replace(/[\s-]+/g, '_');
        }
        // Debug flag: set `window.DOOR_PRICE_DEBUG = true` in console to enable logs.
        function toNum(n) {
          var x = parseFloat(n);
          return isNaN(x) ? 0 : x;
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
        function findPricingRulePrice(records, key, width, height) {
          var want = normSelectionValue(key);
          for (var i = 0; i < records.length; i++) {
            var r = records[i] || {};
            var rk =
              r.key != null ? r.key
              : (r.type != null ? r.type
              : (r.value != null ? r.value : ''));
            if (normSelectionValue(rk) !== want) continue;

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
            try {
              if (window && window.DOOR_PRICE_DEBUG) {
                console.log('[pricing_rule_int_ext] MATCH', { key: key, width: width, height: height, price: price, row: r });
              }
            } catch (eDbg1) {}
            return price;
          }
          try {
            if (window && window.DOOR_PRICE_DEBUG) {
              console.log('[pricing_rule_int_ext] NO MATCH', { key: key, width: width, height: height, records: records && records.length });
            }
          } catch (eDbg2) {}
          return 0;
        }
        
        function getDoorSurface() {
          // Prefer tags (requested), fall back to product type.
          // Returns: 'interior' | 'exterior' | null
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
            // Shopify tags like "Interior Doors" / interior_doors → slab & pre-hung extras use interior fields.
            for (var tdi = 0; tdi < tags.length; tdi++) {
              var doorCatTag = normSelectionValue(tags[tdi]);
              if (doorCatTag === 'interior_doors') return 'interior';
              if (doorCatTag === 'exterior_doors') return 'exterior';
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
        function anySelectedValueEquals(targetValue) {
          if (!config || typeof config !== 'object') return false;
          var targetNorm = normSelectionValue(targetValue);
          for (var i = 0; i < doorConfigSchema.length; i++) {
            var opt = doorConfigSchema[i];
            if (!opt || !opt.id) continue;
            var selected = config[opt.id];
            if (Array.isArray(selected)) {
              for (var j = 0; j < selected.length; j++) {
                if (normSelectionValue(selected[j]) === targetNorm) return true;
              }
            } else {
              if (normSelectionValue(selected) === targetNorm) return true;
            }
          }
          // Fallback: some UI controls may not be schema-backed (no data-option-id),
          // so they won't appear in `config`. In that case, scan DOM for checked/selected values.
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
                if (normSelectionValue(el.value) === targetNorm) return true;
              } else if (tag === 'select') {
                if (normSelectionValue(el.value) === targetNorm) return true;
              } else {
                // text/number inputs etc.
                if (normSelectionValue(el.value) === targetNorm) return true;
              }
            }
          } catch (eFallbackSel) {}
          return false;
        }
        function findSelectedChoiceByValue(valueNorm) {
          // Finds the *choice object* for a selected value across all options.
          // Useful when price extras live on the selected choice (e.g. round_top/arch_top).
          if (!config || typeof config !== 'object') return null;
          for (var i = 0; i < doorConfigSchema.length; i++) {
            var opt = doorConfigSchema[i];
            if (!opt || !opt.id || !Array.isArray(opt.options)) continue;
            var selected = config[opt.id];
            var choices = opt.options;
            if (Array.isArray(selected)) {
              for (var j = 0; j < selected.length; j++) {
                if (normSelectionValue(selected[j]) !== valueNorm) continue;
                var valStr = String(selected[j] == null ? '' : selected[j]);
                return choices.find(function (c) { return String(c && c.value != null ? c.value : '') === valStr; }) || null;
              }
            } else {
              if (normSelectionValue(selected) !== valueNorm) continue;
              var selStr = String(selected == null ? '' : selected);
              return choices.find(function (c) { return String(c && c.value != null ? c.value : '') === selStr; }) || null;
            }
          }
          return null;
        }

        // Determines whether to use interior or exterior pricing extras.
        var doorSurface = null;
        doorSurface = getDoorSurface();

        var isSlabOnlySelected = false;
        var woodSlabExtra = 0;

        // Detect "slab_only" selection regardless of which option it belongs to.
        isSlabOnlySelected = anySelectedValueEquals('slab_only');
        var isPreHungOnJambSelected = false;
        isPreHungOnJambSelected = anySelectedValueEquals('pre_hung_on_jamb');

        // -----------------------------
        // Sidelight metaobject pricing_rule_int_ext adjustment
        // -----------------------------
        try {
          if (isSidelightDesignSelected(config)) {
            // Width = sidelight_width + sidelight_width_fraction
            var sideW = toNum(config && config.sidelight_width);
            var sideWFrac = parseFractionValue(config && config.sidelight_width_fraction);
            var sidelightWidth = sideW + sideWFrac;

            // Height = door_height + door_height_fraction
            var doorH = toNum(config && config.door_height);
            var doorHFrac = parseFractionValue(config && config.door_height_fraction);
            var doorHeight = doorH + doorHFrac;

            // Build key from product surface and selection type.
            var surfaceKey = (doorSurface === 'exterior') ? 'exterior' : (doorSurface === 'interior' ? 'interior' : '');
            var selKey = '';
            if (isPreHungOnJambSelected) selKey = 'prehung';
            else if (isSlabOnlySelected) selKey = 'slab';

            if (surfaceKey && selKey) {
              var textKey = surfaceKey + '_' + selKey;
              var rules = getPricingRuleIntExtRecords();
              var addonPrice = findPricingRulePrice(rules, textKey, sidelightWidth, doorHeight);
              if (addonPrice) total += addonPrice;
            }
          }
        } catch (eSideRule) {}

        // -----------------------------
        // Glass formula metaobject addon (pieces * basic_eqn_calc)
        // Implemented in `sidelight_calculations.js` as `window.GlassFormulaCalculation`.
        // -----------------------------
        try {
          if (window.GlassFormulaCalculation) {
            // IMPORTANT: Only call the glass-formula API when sidelight style OR transom style is selected/changed.
            // Other option changes should NOT trigger network calls.
            var gfRoot = document.getElementById('door-configurator-options') || document;
            var gfKeys = [];
            if (typeof window.GlassFormulaCalculation.getSelectedSidelightTransomStyleKeysFromDom === 'function') {
              gfKeys = window.GlassFormulaCalculation.getSelectedSidelightTransomStyleKeysFromDom();
            }
            if (!gfKeys.length) {
              var gfStyleVal = '';
              try {
                var gfChecked = gfRoot.querySelector('input[type="radio"][data-option-id="sidelight_style"]:checked');
                if (gfChecked && gfChecked.value != null) gfStyleVal = String(gfChecked.value || '');
              } catch (eGfStyle) {}
              if (!gfStyleVal) {
                try {
                  var gfSel = gfRoot.querySelector('select[data-option-id="sidelight_style"]');
                  if (gfSel) gfStyleVal = String(gfSel.value || '');
                } catch (eGfStyle2) {}
              }
              if (!gfStyleVal) {
                try {
                  var transomChecked = gfRoot.querySelector(
                    'input[type="radio"][data-option-id="transom_style"]:checked,' +
                    'input[type="radio"][name="attributes[Transom Style]"]:checked'
                  );
                  if (transomChecked && transomChecked.value != null) gfStyleVal = String(transomChecked.value || '');
                } catch (eGfStyle3) {}
              }
              if (!gfStyleVal) {
                try {
                  var transomSel = gfRoot.querySelector(
                    'select[data-option-id="transom_style"],' +
                    'select[name="attributes[Transom Style]"]'
                  );
                  if (transomSel) gfStyleVal = String(transomSel.value || '');
                } catch (eGfStyle4) {}
              }
              if (gfStyleVal) {
                gfKeys = [window.GlassFormulaCalculation.normChoiceValue(gfStyleVal)];
              }
            }
            var gfAddonCached = window.GlassFormulaCalculation.calculateAddonFromCache(gfKeys);
            if (gfAddonCached) total += gfAddonCached;

            // Network fetch is handled once per sidelight/transom style click in sidelight-calculations.js.
          }
        } catch (eGlassFormula) {}

        // -----------------------------
        // Storm glass pricing addon (glass_type_exterior, glass_type_interior, or glass_type_screen_and_storm)
        // Uses:
        // - glass_formula (from sidelight_transom_calculations.php): basic_eqn_calc + shape
        // - glass_type_exterior (exterior products) or glass_type_interior (tag: interior-doors): sq_ft + straight/shaped pricing
        // Formula (only when shape is present):
        //   round(sq_ft * basic_eqn_calc) * shape + shaped_pricing
        // -----------------------------
        try {
          if (window.GlassFormulaCalculation && typeof window.GlassFormulaCalculation.calculateStormGlassAddonFromCache === 'function') {
            var stormVal = '';
            stormVal = (config && (config.glass_type || config.storm_glass_type || config.storm_glass || config.select_storm_glass)) || '';
            if (!stormVal) {
              // Fallback to DOM read (in case option id differs in schema).
              var gfRoot2 = document.getElementById('door-configurator-options') || document;
              try {
                var stormChecked = gfRoot2.querySelector(
                  'input[type="radio"][data-option-id="glass_type"]:checked,' +
                  'input[type="radio"][data-option-id="storm_glass_type"]:checked,' +
                  'input[type="radio"][data-option-id="storm_glass"]:checked,' +
                  'input[type="radio"][data-option-id="select_storm_glass"]:checked,' +
                  'input[type="radio"][name="attributes[Select Storm Glasses]"]:checked'
                );
                if (stormChecked && stormChecked.value != null) stormVal = String(stormChecked.value || '');
              } catch (eStormDom) {}
              if (!stormVal) {
                try {
                  var stormSel = gfRoot2.querySelector(
                    'select[data-option-id="glass_type"],' +
                    'select[data-option-id="storm_glass_type"],' +
                    'select[data-option-id="storm_glass"],' +
                    'select[data-option-id="select_storm_glass"],' +
                    'select[name="attributes[Select Storm Glasses]"]'
                  );
                  if (stormSel) stormVal = String(stormSel.value || '');
                } catch (eStormDom2) {}
              }
            }

            var stormKey = stormVal ? window.GlassFormulaCalculation.normChoiceValue(stormVal) : '';
            if (stormKey) {
              var shouldApplyStorm = true;
              if (typeof window.GlassFormulaCalculation.shouldApplyGlassTypeExteriorAddon === 'function') {
                shouldApplyStorm = window.GlassFormulaCalculation.shouldApplyGlassTypeExteriorAddon(stormKey);
              }
              if (!shouldApplyStorm) {
                window['__doorAddon_storm_glass'] = 0;
              } else {
              var totalBeforeStormGlass = total;
              var shapedPayload = null;
              var stormAdd2 = 0;
              if (typeof window.GlassFormulaCalculation.calculateStormGlassAddonTotalFromCache === 'function') {
                shapedPayload = window.GlassFormulaCalculation.calculateStormGlassAddonTotalFromCache(stormKey);
                stormAdd2 = shapedPayload && shapedPayload.ok ? (parseFloat(shapedPayload.total) || 0) : 0;
              } else {
                var stormGlassFormulaKey = '';
                if (typeof window.GlassFormulaCalculation.getSelectedSidelightTransomStyleKeyFromDom === 'function') {
                  stormGlassFormulaKey = window.GlassFormulaCalculation.getSelectedSidelightTransomStyleKeyFromDom() || '';
                }
                if (!stormGlassFormulaKey && config) {
                  var rawGfStyle = config.sidelight_style || config.transom_style || '';
                  if (rawGfStyle) {
                    stormGlassFormulaKey = window.GlassFormulaCalculation.normChoiceValue(rawGfStyle);
                  }
                }
                shapedPayload = window.GlassFormulaCalculation.calculateStormGlassAddonFromCache(stormGlassFormulaKey, stormKey);
                stormAdd2 = shapedPayload && shapedPayload.ok ? (parseFloat(shapedPayload.total) || 0) : 0;
              }
              var formulaKeysForLog = (shapedPayload && shapedPayload.formulaKeys)
                ? shapedPayload.formulaKeys.join('+')
                : (typeof window.GlassFormulaCalculation.getSelectedSidelightTransomStyleKeyFromDom === 'function'
                  ? (window.GlassFormulaCalculation.getSelectedSidelightTransomStyleKeyFromDom() || '')
                  : '');
              var stormLogKey = stormKey + '|' + formulaKeysForLog + '|' + stormAdd2;
              // Replace prior storm glass amount (do not stack); layered onto display via pricing-rule sync.
              var prevStormGlassAddon = parseFloat(window['__doorAddon_storm_glass'] || 0) || 0;
              window['__doorAddon_storm_glass'] = stormAdd2;
              if (stormAdd2) {
                try {
                  if (window.__doorStormGlassAlertKey !== stormLogKey) {
                    window.__doorStormGlassAlertKey = stormLogKey;
                    alert('Storm glass add-on added: ' + String(stormAdd2));
                  }
                } catch (eA) {}
              }
              if (stormAdd2 > 0.01 || prevStormGlassAddon > 0.01) {
                try {
                  if (
                    window.DoorIntExtPricingRule
                    && typeof window.DoorIntExtPricingRule.syncEstimatedPriceDisplay === 'function'
                  ) {
                    window.DoorIntExtPricingRule.syncEstimatedPriceDisplay({
                      source: 'storm_glass_calc',
                      userAction: true,
                      stormGlassAddon: stormAdd2
                    });
                  }
                } catch (eStormSync) {}
              }
              try {
                if (window.DOOR_PRICE_DEBUG !== false && window.__doorStormGlassCalcLogKey !== stormLogKey) {
                  window.__doorStormGlassCalcLogKey = stormLogKey;
                  var themeForLog = totalBeforeStormGlass;
                  var displayAfter = themeForLog + stormAdd2;
                  if (
                    window.DoorIntExtPricingRule
                    && typeof window.DoorIntExtPricingRule.getDoorAddonTotalSum === 'function'
                  ) {
                    displayAfter = themeForLog + window.DoorIntExtPricingRule.getDoorAddonTotalSum();
                  }
                  var stormLogPayload = {
                    option: 'attributes[Select Storm Glasses]',
                    selectedValue: stormVal,
                    normalizedKey: stormKey,
                    sidelightFormulaKey: formulaKeysForLog,
                    formulaBreakdown: shapedPayload,
                    stormGlassAddon: stormAdd2,
                    themeOptionTotal: themeForLog,
                    displayTotal: displayAfter,
                    formula: themeForLog + ' + ' + stormAdd2 + ' = ' + (themeForLog + stormAdd2)
                  };
                  if (
                    window.GlassFormulaCalculation
                    && typeof window.GlassFormulaCalculation.logStormGlass === 'function'
                  ) {
                    window.GlassFormulaCalculation.logStormGlass('addon_replaced', stormLogPayload);
                  } else {
                    void 0;
                  }
                }
              } catch (eStormLog) {}

              if (typeof window.GlassFormulaCalculation.getMissingStormGlassTypeFromCache === 'function'
                && typeof window.GlassFormulaCalculation.loadStormGlassTypeFromApi === 'function') {
                var missStorm = window.GlassFormulaCalculation.getMissingStormGlassTypeFromCache([stormKey]);
                if (missStorm && missStorm.length) {
                  window.GlassFormulaCalculation.loadStormGlassTypeFromApi(missStorm).then(function () {
                    try { updateEstimatedPrice(); } catch (e) {}
                  });
                }
              } else if (typeof window.GlassFormulaCalculation.getMissingGlassTypeExteriorFromCache === 'function'
                && typeof window.GlassFormulaCalculation.loadGlassTypeExterior === 'function') {
                var missStorm2 = window.GlassFormulaCalculation.getMissingGlassTypeExteriorFromCache([stormKey]);
                if (missStorm2 && missStorm2.length) {
                  window.GlassFormulaCalculation.loadGlassTypeExterior(missStorm2).then(function () {
                    try { updateEstimatedPrice(); } catch (e) {}
                  });
                }
              }
              if (stormGlassFormulaKey
                && typeof window.GlassFormulaCalculation.getMissingFromCache === 'function'
                && typeof window.GlassFormulaCalculation.load === 'function') {
                var missGfFormula = window.GlassFormulaCalculation.getMissingFromCache([stormGlassFormulaKey]);
                if (missGfFormula && missGfFormula.length) {
                  window.GlassFormulaCalculation.load(missGfFormula).then(function () {
                    try { updateEstimatedPrice(); } catch (eGfLoad) {}
                  });
                }
              }
              } // shouldApplyStorm
            } else {
              window['__doorAddon_storm_glass'] = 0;
            }
          }
        } catch (eStormGlassStraightPricing) {}

        var selectedTopStyleChoice =
          findSelectedChoiceByValue('round_top') || findSelectedChoiceByValue('arch_top');
        var hasRoundOrArchTop = !!selectedTopStyleChoice;
        // Slab-only + round/arch top: do not add metaobject pre_hung_exterior / pre_hung_interior from the
        // top choice (use that choice's schema priceValue + wood slab extra only).
        var waiveSlabArchedTopPreHungMeta = hasRoundOrArchTop && isSlabOnlySelected;

        // Apply slab extra when:
        // - slab_only is selected, OR
        // - pre_hung_on_jamb is selected (requested: pre-hung on jamb includes slab extra too)
        var shouldApplyWoodSlabExtra = isSlabOnlySelected || anySelectedValueEquals('pre_hung_on_jamb');
        if (shouldApplyWoodSlabExtra) {
          var woodOpt = doorConfigSchema.find(function (o) { return o && o.id === 'wood_type'; });
          var woodSelected = config ? config['wood_type'] : null;
          if (woodOpt && woodSelected != null && Array.isArray(woodOpt.options)) {
            var selectedChoice = woodOpt.options.find(function (c) {
              return String(c && c.value != null ? c.value : '') === String(woodSelected);
            });
            if (selectedChoice) {
              var raw = 0;
              if (doorSurface === 'interior') {
                raw = selectedChoice.slabInterior != null ? selectedChoice.slabInterior : selectedChoice.slab_interior;
              } else if (doorSurface === 'exterior') {
                raw = selectedChoice.slabExterior != null ? selectedChoice.slabExterior : selectedChoice.slab_exterior;
              } else {
                raw = 0; // Unsupported product surface => no extra price.
              }
              var parsed = parseFloat(raw);
              if (!isNaN(parsed)) woodSlabExtra = parsed;
            }
          }
        }

        total += woodSlabExtra;

        // Pre-hung on jamb pricing adjustment (mirrors slab-only logic):
        // When any selected choice value is "pre_hung_on_jamb",
        // add selected `wood_type` choice's pre-hung interior/exterior extra.
        var woodPreHungExtra = 0;

        if (isPreHungOnJambSelected) {
          var woodOpt2 = doorConfigSchema.find(function (o) { return o && o.id === 'wood_type'; });
          var woodSelected2 = config ? config['wood_type'] : null;
          if (woodOpt2 && woodSelected2 != null && Array.isArray(woodOpt2.options)) {
            var selectedChoice2 = woodOpt2.options.find(function (c) {
              return String(c && c.value != null ? c.value : '') === String(woodSelected2);
            });
            if (selectedChoice2) {
              var raw2 = 0;
              if (doorSurface === 'interior') {
                raw2 = selectedChoice2.preHungInterior != null ? selectedChoice2.preHungInterior : selectedChoice2.pre_hung_interior;
              } else if (doorSurface === 'exterior') {
                raw2 = selectedChoice2.preHungExterior != null ? selectedChoice2.preHungExterior : selectedChoice2.pre_hung_exterior;
              } else {
                raw2 = 0; // Unsupported product surface => no extra price.
              }
              var parsed2 = parseFloat(raw2);
              if (!isNaN(parsed2)) woodPreHungExtra = parsed2;
            }
          }
          // Exterior + poplar + round/arch top: waive wood_type pre_hung_exterior (only in this combination; other woods unchanged).
          if (doorSurface === 'exterior' && normSelectionValue(woodSelected2) === 'poplar' && hasRoundOrArchTop) {
            woodPreHungExtra = 0;
          }
        }

        total += woodPreHungExtra;

        // Round/Arch top + Pre-hung pricing adjustment:
        // - If customer selects "round_top" or "arch_top", schema pricing already adds that choice's priceValue.
        // - Additionally, when a pre-hung selection is made (slab_only OR pre_hung_on_jamb),
        //   add the selected top option's pre-hung interior/exterior extra (if present).
        //
        // This mirrors the wood_type special-case behavior, but pulls extras from the selected
        // "round_top"/"arch_top" choice object itself.
        var preHungSelected = isSlabOnlySelected
          || isPreHungOnJambSelected
          || anySelectedValueEquals('pre_hung_interior')
          || anySelectedValueEquals('pre_hung_exterior');
        if (preHungSelected) {
          var topChoice = selectedTopStyleChoice;
          if (topChoice) {
            var topPreHungRaw = 0;
            if (doorSurface === 'interior') {
              topPreHungRaw = topChoice.preHungInterior != null ? topChoice.preHungInterior : topChoice.pre_hung_interior;
            } else if (doorSurface === 'exterior') {
              topPreHungRaw = topChoice.preHungExterior != null ? topChoice.preHungExterior : topChoice.pre_hung_exterior;
            } else {
              topPreHungRaw = 0;
            }
            var topPreHungParsed = parseFloat(topPreHungRaw);
            var waiveTopPreHungExt =
              doorSurface === 'exterior'
              && normSelectionValue(config && config['wood_type']) === 'poplar';
            if (!isNaN(topPreHungParsed) && !waiveTopPreHungExt && !waiveSlabArchedTopPreHungMeta) {
              total += topPreHungParsed;
            }
          }
        }
      } catch (e) {
        // Fail open: keep original schema total if the adjustment can't be computed.
      }

      // Double door: only when choice value normalizes to `double_door` (e.g. metaobject value double_door).
      // Selecting `single_door` or anything else recalculates with no multiplier.
      try {
        function normForDoubleCheck(v) {
          return String(v == null ? '' : v).trim().toLowerCase().replace(/\s+/g, '_');
        }
        function selectionIsDoubleDoor(cfg) {
          if (!cfg || typeof cfg !== 'object' || !doorConfigSchema || !Array.isArray(doorConfigSchema)) return false;
          for (var di = 0; di < doorConfigSchema.length; di++) {
            var dopt = doorConfigSchema[di];
            if (!dopt || !dopt.id) continue;
            var sel = cfg[dopt.id];
            var list = Array.isArray(sel) ? sel : (sel !== null && sel !== undefined && sel !== '' ? [sel] : []);
            for (var dj = 0; dj < list.length; dj++) {
              if (normForDoubleCheck(list[dj]) === 'double_door') return true;
            }
          }
          return false;
        }
        if (selectionIsDoubleDoor(config)) {
          total = total * 2;
        }
      } catch (eDouble) {}

      var catalogAddons = applyCatalogMetaobjectAddonsFromUpdate(config);
      total += catalogAddons.total || 0;

      return {
        price: total,
        currency: Shopify && Shopify.currency && Shopify.currency.active ? Shopify.currency.active : null
      };
    }
    var catalogAddonsBase = applyCatalogMetaobjectAddonsFromUpdate(config);
    return {
      price: basePrice + (catalogAddonsBase.total || 0),
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

  function buildSelectedOptionImageMap(config, schema) {
    var out = {};
    if (!config || !Array.isArray(schema)) return out;
    function put(optId, val, choice) {
      if (!optId || val == null || !choice) return;
      var src = resolveChoiceImageSrc(choice) || '';
      if (!src && choice.image) {
        src = typeof choice.image === 'string'
          ? choice.image
          : (choice.image && (choice.image.url || choice.image.src)) || '';
      }
      if (!src) return;
      if (!out[optId]) out[optId] = {};
      out[optId][String(val)] = String(src);
    }
    schema.forEach(function (opt) {
      if (!opt || !opt.id) return;
      var oid = String(opt.id);
      var selected = config[oid];
      if (selected == null || selected === '') return;
      var choices = Array.isArray(opt.options) ? opt.options : [];
      if (!choices.length) return;
      if (Array.isArray(selected)) {
        selected.forEach(function (sv) {
          var ch = choices.find(function (c) { return String(c && c.value != null ? c.value : '') === String(sv); });
          put(oid, sv, ch);
        });
      } else {
        var chOne = choices.find(function (c) { return String(c && c.value != null ? c.value : '') === String(selected); });
        put(oid, selected, chOne);
      }
    });
    return out;
  }

  // Build a readable, ordered list of everything the customer selected, for the
  // custom admin app. Captures schema options (exposure, hinge, measurements,
  // etc.), the bevel-glass toggle, measurement dropdowns, and selected hardware.
  function buildSelectedSummaryForStorage(config, schema) {
    var items = [];
    function pushItem(label, value, image) {
      label = String(label == null ? '' : label).trim();
      value = String(value == null ? '' : value).trim();
      if (!label || !value) return;
      items.push({ label: label, value: value, image: image || '' });
    }

    // 1) Schema-derived readable properties (exposure, hinge_finish, dimensions, ...).
    try {
      var props = getLineItemPropertiesFromSchema() || {};
      Object.keys(props).forEach(function (label) {
        var v = props[label];
        if (v == null || String(v) === '') return;
        if (/bevel/i.test(label)) return; // handled explicitly below
        pushItem(label, v);
      });
    } catch (eProps) {}

    // 2) Bevel glass: always show Add/No, even when unchecked.
    try {
      var bevel = document.querySelector('input[type="checkbox"][data-option-id="glass_bevel"]');
      if (bevel) pushItem('Bevel Glass', bevel.checked ? 'Add Bevel Glass' : 'No Bevel Glass');
    } catch (eBevel) {}

    // 3) Measurement dropdown rows (door-measurement-embedded-dimensions / static rows).
    try {
      var rowSeen = {};
      all('.door-measurement-embedded-dimensions .door-measure-dimension-row, .door-measurement-static-rows .door-measure-dimension-row').forEach(function (row) {
        if (!row || row.offsetParent === null) return; // skip hidden rows
        var titleEl = row.querySelector('.door-measure-dimension-title');
        var title = titleEl ? String(titleEl.textContent || '').trim() : '';
        if (!title) return;
        var parts = [];
        all('select, input[type="number"], input[type="text"]', row).forEach(function (ctrl) {
          if (ctrl.disabled) return;
          var v = '';
          if (ctrl.tagName === 'SELECT') {
            var op = ctrl.options && ctrl.selectedIndex >= 0 ? ctrl.options[ctrl.selectedIndex] : null;
            if (op && String(op.value) !== '') v = String(op.textContent || op.value || '').trim();
          } else {
            v = String(ctrl.value || '').trim();
          }
          if (v) parts.push(v);
        });
        if (!parts.length) return;
        var key = title.toLowerCase();
        if (rowSeen[key]) return;
        rowSeen[key] = true;
        pushItem(title, parts.join(' '));
      });
    } catch (eMeasure) {}

    // 4) Selected hardware products (multi-add, finish + qty per line).
    try {
      getHardwareSelectionsForConfig().forEach(function (row, idx) {
        if (!row) return;
        var line = String(row.title || row.product_id || 'Hardware');
        if (row.finish_label) line += ' — ' + row.finish_label;
        if (row.function_label) line += ' — ' + row.function_label;
        if (row.qty && row.qty > 1) line += ' (×' + row.qty + ')';
        pushItem(idx === 0 ? 'Hardware' : 'Hardware ' + (idx + 1), line, row.image || '');
      });
    } catch (eHw) {}

    return items;
  }

  // Capture options that aren't reliably part of the metaobject schema (exposure,
  // bevel, hinge, hardware grid, measurement dropdowns) directly from the rendered
  // DOM, so the admin app can render them as EDITABLE controls (cards/dropdowns).
  function adminLabelFromAttrName(inp, fallback) {
    var n = inp && inp.getAttribute ? (inp.getAttribute('name') || '') : '';
    var m = n.match(/attributes\[([^\]]+)\]/);
    return m ? m[1] : (fallback || (inp && inp.getAttribute ? inp.getAttribute('data-option-id') : '') || '');
  }
  function adminCaptureChoiceOption(oid, type) {
    var inputs = all('input[data-option-id="' + oid + '"]').filter(function (i) {
      return i.type === 'radio' || i.type === 'checkbox';
    });
    if (!inputs.length) return null;
    var label = adminLabelFromAttrName(inputs[0], oid);
    var choices = [];
    var seen = {};
    var current = type === 'checkbox' ? [] : null;
    var imgMap = {};
    inputs.forEach(function (inp) {
      var val = String(inp.value);
      var card = inp.closest('.common-check-option') || inp.parentElement;
      if (!seen[val]) {
        seen[val] = true;
        var lblEl = card ? card.querySelector('.common-check-option-label, .common-check-option-text') : null;
        var clbl = lblEl ? String(lblEl.textContent || '').trim() : '';
        if (!clbl) clbl = val;
        var imgEl = card ? card.querySelector('img') : null;
        var src = imgEl ? String(imgEl.getAttribute('src') || '') : '';
        choices.push({ value: val, label: clbl, image: src });
        if (src) imgMap[val] = src;
      }
      if (inp.checked) { if (type === 'checkbox') current.push(val); else current = val; }
    });
    return { entry: { id: oid, label: label, type: type, options: choices }, current: current, images: imgMap };
  }
  function adminCaptureBevel() {
    var inp = document.querySelector('input[type="checkbox"][data-option-id="glass_bevel"]');
    if (!inp) return null;
    var bevelVal = inp.checked ? [String(inp.value || 'true')] : [];
    return {
      entry: { id: 'glass_bevel', label: 'Bevel Glass', type: 'checkbox', options: [{ value: 'true', label: 'Add Bevel Glass' }] },
      current: bevelVal,
      images: {}
    };
  }
  function adminCaptureHardware() {
    var grid = document.querySelector('.door-hardware-options-cards, [data-hardware-detail="1"]');
    if (!grid) return null;
    var choices = [];
    var imgMap = {};
    all('.door-suggested-hardware-card, .door-hardware-product-block', grid).forEach(function (card) {
      var val = String(card.getAttribute('data-product-id') || card.getAttribute('data-choice-value') || '');
      if (!val) return;
      var titleEl = card.querySelector('.door-suggested-hardware-card__title, .door-hw-product__title, .common-check-option-label');
      var clbl = titleEl ? String(titleEl.textContent || '').trim() : val;
      var finishLbl = String(card.getAttribute('data-hw-finish-label') || '').trim();
      if (finishLbl) clbl = clbl + ' — ' + finishLbl;
      getHwFieldDefsForLineItems().forEach(function (fieldDef) {
        var part = String(card.getAttribute(fieldDef.dataLabel) || '').trim();
        if (part) clbl = clbl + ' — ' + part;
      });
      var imgEl = card.querySelector('.door-suggested-hardware-card__image, .door-hw-product__media img, img');
      var src = imgEl ? String(imgEl.getAttribute('src') || '') : '';
      choices.push({ value: val, label: clbl, image: src });
      if (src) imgMap[val] = src;
    });
    if (!choices.length) return null;
    var current = getHardwareSelectionsForConfig();
    return {
      entry: {
        id: 'hardware_options',
        label: 'Hardware',
        type: 'hardware_multi',
        options: choices,
        _hardwareSelections: true
      },
      current: current,
      images: imgMap
    };
  }
  function adminCaptureMeasurementSelects() {
    var results = [];
    var seenIds = {};
    // The live measurement dimension <select>s render inside the embedded / static-rows
    // wrappers (see renderDynamicOptions), NOT only ".door-measurement-static-panels".
    // Scanning just the panels missed every dimension on save, so the admin never got
    // the measurement dropdowns as editable controls and the storefront edit had nothing
    // to restore. Match the same containers the restore path reads from so the saved
    // measurements stay in sync both ways (admin <-> storefront).
    all('.door-measurement-static-panels select, .door-measurement-static-panel select, .door-measurement-embedded-dimensions select, .door-measurement-static-rows select, .door-measure-dimension-row select, .door-measure-dimension-inputs-row select').forEach(function (sel) {
      var id = sel.id || (sel.getAttribute && sel.getAttribute('data-option-id')) || '';
      if (!id || seenIds[id]) return;
      // Skip hidden measurement panels (slab/combo/transom defaults) so the admin only
      // gets the active/visible dimension controls and the chosen value (not a default).
      if (sel.closest && sel.closest('.door-hidden')) return;
      seenIds[id] = true;
      var opts = [];
      var hasReal = false;
      all('option', sel).forEach(function (o) {
        opts.push({ value: String(o.value), label: String(o.textContent || o.value || '').trim() });
        if (String(o.value) !== '') hasReal = true;
      });
      if (!hasReal) return;
      var row = sel.closest('.door-measure-dimension-row');
      var titleEl = row ? row.querySelector('.door-measure-dimension-title') : null;
      var title = titleEl ? String(titleEl.textContent || '').trim() : '';
      var isFrac = /frac/i.test(id);
      var label = title ? (title + (isFrac ? ' (fraction)' : '')) : id;
      results.push({ entry: { id: id, label: label, type: 'select', options: opts, _adminGroup: 'measurement' }, current: sel.value || null, images: {} });
    });
    return results;
  }
  // Remove heavy showWhenProductTags data (option-level and choice-level) before
  // saving the schema to the DB. The admin never uses it and it bloats options_json.
  function stripShowWhenProductTags(schema) {
    if (!Array.isArray(schema)) return schema;
    return schema.map(function (opt) {
      if (!opt || typeof opt !== 'object') return opt;
      var clone = {};
      Object.keys(opt).forEach(function (k) {
        if (k === 'showWhenProductTags') return;
        var v = opt[k];
        if (k === 'options' && Array.isArray(v)) {
          clone[k] = v.map(function (c) {
            if (!c || typeof c !== 'object') return c;
            var cc = {};
            Object.keys(c).forEach(function (ck) {
              if (ck === 'showWhenProductTags') return;
              cc[ck] = c[ck];
            });
            return cc;
          });
        } else {
          clone[k] = v;
        }
      });
      return clone;
    });
  }

  function buildAdminEditableExtras() {
    var entries = [];
    var values = {};
    var images = {};
    function add(res) {
      if (!res || !res.entry) return;
      entries.push(res.entry);
      values[res.entry.id] = res.current;
      var canon = String(res.entry.id || '').toLowerCase().replace(/-/g, '_');
      if (canon && canon !== res.entry.id) {
        values[canon] = res.current;
      }
      if (res.images && Object.keys(res.images).length) images[res.entry.id] = res.images;
    }
    try { add(adminCaptureChoiceOption('door_location_exposure', 'radio')); } catch (e1) {}
    try { add(adminCaptureBevel()); } catch (e2) {}
    try { add(adminCaptureChoiceOption('hinge_finish', 'radio')); } catch (e3) {}
    try { add(adminCaptureHardware()); } catch (e4) {}
    try { adminCaptureMeasurementSelects().forEach(add); } catch (e5) {}
    return { entries: entries, values: values, images: images };
  }

  var _touchedOptionIds = {};
  var _priceBeforeChange = null;
  var _optionPriceData = {};

  function markOptionTouched(optionId) {
    if (optionId) {
      _priceBeforeChange = readDoorEstimatedPriceFromDom() || 0;
      _touchedOptionIds[optionId] = true;
      _touchedOptionIds.__lastTouched = optionId;
    }
  }

  function updateOptionRunningPriceLabels() {
    if (DOOR_SELECTION_LOG_ONLY) {
      try {
        all('.door-option-running-price').forEach(function (el) {
          if (el && el.parentNode) el.parentNode.removeChild(el);
        });
      } catch (eHideRunningPrice) {}
      return;
    }
    var optionsContainer = document.getElementById('door-configurator-options');
    if (!optionsContainer) return;
    var currentTotal = readDoorEstimatedPriceFromDom() || 0;
    var lastTouched = _touchedOptionIds.__lastTouched || '';
    var prevTotal = _priceBeforeChange != null ? _priceBeforeChange : currentTotal;
    var delta = currentTotal - prevTotal;
    delta = Math.round(delta * 100) / 100;

    if (lastTouched) {
      _optionPriceData[lastTouched] = {
        prevTotal: prevTotal,
        delta: Math.abs(delta),
        totalAfter: currentTotal
      };
    }

    var allWraps = optionsContainer.querySelectorAll('.door-option-wrap[data-option-id]');
    for (var i = 0; i < allWraps.length; i++) {
      var wrap = allWraps[i];
      var optId = wrap.getAttribute('data-option-id') || '';
      if (!optId) continue;
      var priceId = 'door-running-price--' + optId;
      var priceEl = document.getElementById(priceId);

      if (!_touchedOptionIds[optId]) {
        if (priceEl) priceEl.style.display = 'none';
        continue;
      }

      var headerRow = wrap.querySelector(
        ':scope > .door-option-header-row,' +
        ':scope > .door-section-title,' +
        ':scope > .door-measurement-type-heading,' +
        ':scope > .door-accordion-header > .door-option-header-row,' +
        ':scope > .door-accordion-header,' +
        ':scope > button > .door-option-header-row'
      );
      if (!headerRow) continue;

      if (!priceEl) {
        priceEl = document.createElement('div');
        priceEl.id = priceId;
        priceEl.className = 'door-option-running-price';
        priceEl.style.cssText = 'font-weight:600;white-space:nowrap;padding-top:4px;';
        headerRow.insertAdjacentElement('afterend', priceEl);
      }
      priceEl.style.display = '';

      var data = _optionPriceData[optId];
      if (data) {
        priceEl.innerHTML =
          '<span>' + formatMoney(data.prevTotal) + '</span>' +
          ' + ' +
          '<span>' + formatMoney(data.delta) + '</span>' +
          ' = ' +
          '<span style="font-weight:700;">' + formatMoney(data.totalAfter) + '</span>';
      } else {
        priceEl.innerHTML =
          '<span style="font-weight:700;">' + formatMoney(currentTotal) + '</span>';
      }
    }
  }

  (function observeEstimatedPriceChanges() {
    try {
      var priceNode = document.getElementById('door-estimated-price');
      if (!priceNode || typeof MutationObserver === 'undefined') return;
      var debounceTimer = null;
      var observer = new MutationObserver(function () {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () {
          try { updateOptionRunningPriceLabels(); } catch (e) {}
          try { syncMeasurementSelectedPriceLabels(null); } catch (eMeas) {}
        }, 80);
      });
      observer.observe(priceNode, { childList: true, characterData: true, subtree: true });
    } catch (e) {}
  })();

  // -----------------------------
  // Door preview (single image / layered preview)
  // -----------------------------
  var DOOR_PREVIEW_TEMP_IMAGES = {
    door_unit_design: {
      single_door: 'https://cdn.shopify.com/s/files/1/0784/9059/9679/files/Single_Door.png?v=1775814017',
      double_door: 'https://cdn.shopify.com/s/files/1/0784/9059/9679/files/Single_Door.png?v=1775814017'
    },
    transom_style: {
      __any__: 'https://cdn.shopify.com/s/files/1/0784/9059/9679/files/image_85.png?v=1775814017'
    },
    sidelight_location: {
      __any__: 'https://cdn.shopify.com/s/files/1/0784/9059/9679/files/image_84.png?v=1775814017'
    }
  };

  var DOOR_PREVIEW_STATIC_OVERLAYS = {
    sidelight: 'https://cdn.shopify.com/s/files/1/0784/9059/9679/files/image_84.png?v=1775814017',
    transom: 'https://cdn.shopify.com/s/files/1/0784/9059/9679/files/image_85.png?v=1775814017'
  };

  function getChoiceByValue(optId, selectedValue) {
    if (!doorConfigSchema || !Array.isArray(doorConfigSchema)) return null;
    var opt = doorConfigSchema.find(function (o) { return o && String(o.id || '') === String(optId || ''); });
    if (!opt || !Array.isArray(opt.options)) return null;
    var v = selectedValue != null ? String(selectedValue) : '';
    if (!v) return null;
    return opt.options.find(function (c) { return String(c && c.value != null ? c.value : '') === v; }) || null;
  }

  function getProductBasePrice() {
    try {
      var container = document.getElementById('door-configurator');
      if (!container) return 0;
      var n = parseFloat(container.getAttribute('data-base-price'));
      return isNaN(n) ? 0 : n;
    } catch (e) {}
    return 0;
  }

  function getSelectedWoodTypePriceValue() {
    try {
      var config = getCurrentConfig();
      var selected = config ? config.wood_type : null;
      var choice = getChoiceByValue('wood_type', selected);
      if (!choice) {
        var root = document.getElementById('door-configurator-options') || document;
        var checked = root.querySelector('input[type="radio"][data-option-id="wood_type"]:checked');
        if (!checked) checked = root.querySelector('input[type="radio"][name="attributes[Select Wood]"]:checked');
        if (checked) choice = getChoiceByValue('wood_type', checked.value);
      }
      if (!choice) return 0;
      var n = parseFloat(choice.priceValue != null ? choice.priceValue : choice.price_value);
      return isNaN(n) ? 0 : n;
    } catch (e) {}
    return 0;
  }

  try {
    window.DoorConfiguratorPricing = window.DoorConfiguratorPricing || {};
    window.DoorConfiguratorPricing.getProductBasePrice = getProductBasePrice;
    window.DoorConfiguratorPricing.getSelectedWoodTypePriceValue = getSelectedWoodTypePriceValue;
  } catch (eExposePricing) {}

  function resolveDoorPreviewLayerSrc(choice, optId) {
    var fromChoice = resolveChoiceImageSrc(choice);
    if (fromChoice) return fromChoice;
    try {
      var map = DOOR_PREVIEW_TEMP_IMAGES && optId ? DOOR_PREVIEW_TEMP_IMAGES[String(optId)] : null;
      if (!map || !choice) return '';
      var v = String(choice.value || '');
      if (map[v]) return String(map[v]);
      if (map.__any__) return String(map.__any__);
      return '';
    } catch (e) {}
    return '';
  }

  function setLayerImage(imgEl, src) {
    if (!imgEl) return;
    var s = String(src || '').trim();
    if (!s) {
      imgEl.hidden = true;
      imgEl.removeAttribute('src');
      return;
    }
    imgEl.hidden = false;
    if (imgEl.getAttribute('src') !== s) imgEl.setAttribute('src', s);
  }

  function updateDoorPreview() {

     try {
      if (window && window.__doorPreviewConfigModeAttached) return;
    } catch (eCfgMode) {}
    
    var container = document.getElementById('door-configurator');
    if (!container) return;
    var media = document.getElementById('door-config-media');
    if (!media) return;

    var config = getCurrentConfig();

    var door1 = document.getElementById('door-preview-door-1');
    var door2 = document.getElementById('door-preview-door-2');
    var transom1 = document.getElementById('door-preview-transom-1');
    var transom2 = document.getElementById('door-preview-transom-2');
    var sidelightLeft = document.getElementById('door-preview-sidelight-left');
    var sidelightRight = document.getElementById('door-preview-sidelight-right');
    var wood1 = document.getElementById('door-preview-wood-1');
    var wood2 = document.getElementById('door-preview-wood-2');

    function getSelectedCardImageSrc(optionId) {
      try {
        var root = document.getElementById('door-configurator-options') || container;
        if (!root) return '';
        var checked = root.querySelector('input[type="radio"][data-option-id="' + String(optionId) + '"]:checked');
        if (!checked || !checked.closest) return '';
        var card = checked.closest('label.common-check-option');
        if (!card) return '';
        var img = card.querySelector('img.common-check-option-image');
        return img && img.getAttribute('src') ? String(img.getAttribute('src')) : '';
      } catch (e) {}
      return '';
    }

    function getDoorCount() {
      var v = String(config.door_unit_design || '').trim();
      if (v === 'double_door') return 2;
      return 1;
    }
    var doorCount = getDoorCount();
    try { media.setAttribute('data-door-count', String(doorCount)); } catch (eDoorCount) {}

    var doorChoice = getChoiceByValue('door_unit_design', config.door_unit_design) || { value: String(config.door_unit_design || 'single_door') };
    var doorSrc =
      getSelectedCardImageSrc('door_unit_design')
      || resolveDoorPreviewLayerSrc(doorChoice, 'door_unit_design');
    if (doorSrc) {
      if (door1 && door1.getAttribute('src') !== doorSrc) door1.setAttribute('src', doorSrc);
      if (door2 && door2.getAttribute('src') !== doorSrc) door2.setAttribute('src', doorSrc);
    }
    if (door2) door2.hidden = doorCount !== 2;

    var hasSidelight = false;
    try {
      hasSidelight = !!(config.sidelight_location || config.sidelight_style);
    } catch (e2) {}

    var sidelightSrc = '';
    if (hasSidelight) {
      // Prefer the selected sidelight style's image URL (from schema choice image/image_url),
      // but fall back to the legacy static overlay if none is provided.
      var sidelightStyleChoice = getChoiceByValue('sidelight_style', config.sidelight_style)
        || (config.sidelight_style != null && String(config.sidelight_style).trim()
          ? { value: String(config.sidelight_style) }
          : null);
      sidelightSrc =
        resolveDoorPreviewLayerSrc(sidelightStyleChoice, 'sidelight_style')
        || DOOR_PREVIEW_STATIC_OVERLAYS.sidelight
        || '';
    }

    var locVal = String(config.sidelight_location || '');
    var showLeft = hasSidelight && (locVal === 'left_only' || locVal === 'both_sides');
    var showRight = hasSidelight && (locVal === 'right_only' || locVal === 'both_sides');
    setLayerImage(sidelightLeft, showLeft ? sidelightSrc : '');
    setLayerImage(sidelightRight, showRight ? sidelightSrc : '');

    var hasTransom = false;
    try {
      hasTransom = !!config.transom_style;
    } catch (e3) {}
    if (hasTransom) {
      var transomStyleChoice = getChoiceByValue('transom_style', config.transom_style)
        || (config.transom_style != null && String(config.transom_style).trim()
          ? { value: String(config.transom_style) }
          : null);
      var transomSrc =
        resolveDoorPreviewLayerSrc(transomStyleChoice, 'transom_style')
        || DOOR_PREVIEW_STATIC_OVERLAYS.transom
        || '';
      setLayerImage(transom1, transomSrc);
      setLayerImage(transom2, doorCount === 2 ? transomSrc : '');
    } else {
      setLayerImage(transom1, '');
      setLayerImage(transom2, '');
    }

    var woodChoice = getChoiceByValue('wood_type', config.wood_type);
    var woodSrc = resolveDoorPreviewLayerSrc(woodChoice || { value: String(config.wood_type || '') }, 'wood_type');
    setLayerImage(wood1, woodSrc);
    setLayerImage(wood2, doorCount === 2 ? woodSrc : '');
  }

  var estimatedPriceRafId = null;

  var doorHubspot = null;

  /** Door unit qty (not hardware card qty). */
  function getDoorQuantityInput() {
    if (doorHubspot && doorHubspot.getDoorQuantityInput) return doorHubspot.getDoorQuantityInput();
    var byId = document.getElementById('door-config-quantity');
    if (byId) return byId;
    var container = document.getElementById('door-configurator');
    if (!container) return null;
    return container.querySelector('.door-add-to-cart-wrap input[name="quantity"]');
  }

  function getDoorQuantity() {
    if (doorHubspot && doorHubspot.getDoorQuantity) return doorHubspot.getDoorQuantity();
    var qtyInput = getDoorQuantityInput();
    if (qtyInput) {
      var qtyVal = parseInt(qtyInput.value, 10);
      if (!isNaN(qtyVal) && qtyVal >= 1) return qtyVal;
    }
    try {
      var config = getCurrentConfig();
      if (config && config._quantity != null) {
        var stored = parseInt(config._quantity, 10);
        if (!isNaN(stored) && stored >= 1) return stored;
      }
    } catch (eQty) {}
    return 1;
  }

  function logSelectedOptionsWithQty() {
    try {
      var config = getCurrentConfig();
      var qty = getDoorQuantity();
      window.__doorSelectionSnapshot = { quantity: qty, selections: config };
    } catch (eLogSel) {}
  }

  function updateEstimatedPrice() {
    if (window.__doorStileSyncInProgress || window.__doorStileApplyBusy) return;
    if (estimatedPriceRafId != null) return;
    var schedule =
      typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame
        : function (fn) { return setTimeout(fn, 0); };
    estimatedPriceRafId = schedule(function () {
      estimatedPriceRafId = null;
      if (window.__doorStileSyncInProgress || window.__doorStileApplyBusy) return;
      var container = document.getElementById('door-configurator');
      if (!container) return;
      if (DOOR_SELECTION_LOG_ONLY) {
        logSelectedOptionsWithQty();
        runMeasurementUiSync();
        return;
      }
      var basePriceAttr = container.getAttribute('data-base-price');
      if (!basePriceAttr) return;
      var basePrice = parseFloat(basePriceAttr);
      if (isNaN(basePrice)) return;

      var config = getCurrentConfig();
      var result = calculateDoorPrice(basePrice, config);
      var schemaTotal = result.price;
      window.__doorThemeOptionTotal = schemaTotal;
      if (
        window.DoorIntExtPricingRule
        && typeof window.DoorIntExtPricingRule.syncEstimatedPriceDisplay === 'function'
      ) {
        var screenStormLayer = 0;
        try {
          if (
            window.PriceScreenStorm
            && typeof window.PriceScreenStorm.syncScreenStormAddonGateState === 'function'
          ) {
            window.PriceScreenStorm.syncScreenStormAddonGateState();
          }
          if (typeof window.DoorIntExtPricingRule.getScreenStormAddonLayerTotal === 'function') {
            screenStormLayer = window.DoorIntExtPricingRule.getScreenStormAddonLayerTotal();
          } else if (window.PriceScreenStorm && typeof window.PriceScreenStorm.getScreenStormAddonTotalSum === 'function') {
            screenStormLayer = window.PriceScreenStorm.getScreenStormAddonTotalSum();
          }
        } catch (eSsLayer) {}
        var hasScreenStormLayer = screenStormLayer > 0.01;
        window.DoorIntExtPricingRule.syncEstimatedPriceDisplay({
          source: 'updateEstimatedPrice',
          silent: !hasScreenStormLayer,
          userAction: hasScreenStormLayer,
          forceLog: hasScreenStormLayer,
          doorSealKitMatching: parseFloat(window['__doorAddon_door_seal_kit_matching'] || 0) || 0,
          doorSweepsMatching: parseFloat(window['__doorAddon_door_sweeps_matching'] || 0) || 0,
          primingServices: parseFloat(window['__doorAddon_priming_services'] || 0) || 0
        });
        if (hasScreenStormLayer && window.PriceScreenStorm && typeof window.PriceScreenStorm.ensureScreenStormPriceAppliedToDom === 'function') {
          setTimeout(function () {
            try { window.PriceScreenStorm.ensureScreenStormPriceAppliedToDom({ source: 'updateEstimatedPrice_followup' }); } catch (eSsEnsure) {}
          }, 120);
        }
      } else {
        var layered =
          schemaTotal
          + (parseFloat(window['__doorAddon_storm_glass'] || 0) || 0)
          + (parseFloat(window['__doorAddon_stile_and_rail_profile'] || 0) || 0);
        writeDoorEstimatedPriceFromConf2(layered, { source: 'updateEstimatedPrice', silent: true });
      }
      try {
        document.dispatchEvent(new CustomEvent('door-configurator-price-updated', {
          detail: {
            themeOptionTotal: schemaTotal,
            doorSealKitMatching: parseFloat(window['__doorAddon_door_seal_kit_matching'] || 0) || 0,
            doorSweepsMatching: parseFloat(window['__doorAddon_door_sweeps_matching'] || 0) || 0,
            primingServices: parseFloat(window['__doorAddon_priming_services'] || 0) || 0
          }
        }));
      } catch (ePriceEvt) {}
      ensureDoorPriceBoxVisible();
      runMeasurementUiSync();
      updateOptionRunningPriceLabels();
    });
  }

  // Add-to-cart: delegated on document so the button works even if #door-configurator is not in DOM at DOMContentLoaded.
  function bindAddToCart() {
    document.addEventListener('click', function (e) {
      var btn = e.target && (e.target.id === 'door-add-to-cart-btn' ? e.target : (e.target.closest && e.target.closest('#door-add-to-cart-btn')));
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      var container = document.getElementById('door-configurator');
      var addToCartMessageEl = document.getElementById('door-add-to-cart-message');
      if (!container) return;

      var basePrice = parseFloat(container.getAttribute('data-base-price')) || 0;
      var variantId = container.getAttribute('data-variant-id') || '';
      var config = getCurrentConfig();

      if (!variantId) {
        if (addToCartMessageEl) {
          addToCartMessageEl.style.display = 'block';
          addToCartMessageEl.textContent = 'This product is not available to add to cart.';
          addToCartMessageEl.style.color = '#b91c1c';
        }
        return;
      }

      var priceResult = calculateDoorPrice(basePrice, config);
      var configuredPrice = (priceResult && typeof priceResult.price === 'number') ? priceResult.price : basePrice;
      if (
        window.DoorIntExtPricingRule
        && typeof window.DoorIntExtPricingRule.getDoorAddonTotalSum === 'function'
      ) {
        configuredPrice =
          (parseFloat(window.__doorThemeOptionTotal) || configuredPrice)
          + window.DoorIntExtPricingRule.getDoorAddonTotalSum();
      } else {
        configuredPrice +=
          (parseFloat(window['__doorAddon_storm_glass'] || 0) || 0)
          + (parseFloat(window['__doorAddon_stile_and_rail_profile'] || 0) || 0);
      }
      var configuredPriceStr = configuredPrice.toFixed(2);

      var props = getLineItemPropertiesFromSchema();
      var properties = { _configured_price: configuredPriceStr };
      Object.keys(props).forEach(function (k) {
        if (k && props[k] != null) properties[k] = String(props[k]);
      });

      btn.disabled = true;
      if (addToCartMessageEl) {
        addToCartMessageEl.style.display = 'block';
        addToCartMessageEl.textContent = 'Adding to cart…';
        addToCartMessageEl.style.color = '';
      }

      var storefrontUrl = container.getAttribute('data-storefront-api-url');
      var storefrontToken = container.getAttribute('data-storefront-access-token');
      var useStorefront = storefrontUrl && storefrontToken;

      function onError(msg) {
        btn.disabled = false;
        if (addToCartMessageEl) {
          addToCartMessageEl.textContent = msg || 'Could not add to cart. Try again.';
          addToCartMessageEl.style.color = '#b91c1c';
        }
      }

      if (useStorefront) {
        var attributes = [];
        Object.keys(properties).forEach(function (k) {
          attributes.push({ key: k, value: properties[k] });
        });
        var merchandiseId = variantId.indexOf('gid://') === 0 ? variantId : ('gid://shopify/ProductVariant/' + variantId);
        var cartCreateMutation = 'mutation CartCreate($input: CartInput!) { cartCreate(input: $input) { cart { id checkoutUrl } userErrors { field message } } }';
        var variables = {
          input: {
            lines: [
              { merchandiseId: merchandiseId, quantity: 1, attributes: attributes }
            ]
          }
        };
        fetch(storefrontUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Storefront-Access-Token': storefrontToken
          },
          body: JSON.stringify({ query: cartCreateMutation, variables: variables })
        })
          .then(function (res) { return res.json(); })
          .then(function (data) {
            var payload = data.data && data.data.cartCreate;
            var errs = (payload && payload.userErrors) || [];
            if (payload && payload.cart && payload.cart.checkoutUrl && errs.length === 0) {
              if (addToCartMessageEl) {
                addToCartMessageEl.textContent = 'Redirecting to cart…';
                addToCartMessageEl.style.color = '';
              }
              window.location.href = payload.cart.checkoutUrl;
              return;
            }
            var errMsg = errs.length ? errs.map(function (e) { return e.message; }).join('; ') : (data.errors && data.errors[0] && data.errors[0].message) || 'Could not add to cart.';
            onError(errMsg);
          })
          .catch(function () { onError(); });
      } else {
        var numericVariantId = variantId.replace(/\D/g, '') || variantId;
        var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) ? window.Shopify.routes.root : '/';
        fetch(root + 'cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: [{
              id: parseInt(numericVariantId, 10) || numericVariantId,
              quantity: 1,
              properties: properties
            }]
          })
        })
          .then(function (res) { return res.json(); })
          .then(function (data) {
            if (data.items && data.items.length > 0) {
              if (addToCartMessageEl) {
                addToCartMessageEl.textContent = 'Added to cart.';
                addToCartMessageEl.style.color = '';
              }
              window.location.href = root + (root === '/' ? 'cart' : 'cart');
            } else {
              onError(data.description || data.message || 'Could not add to cart.');
            }
          })
          .catch(function () { onError(); });
      }
    });
  }

  function attachEvents() {
    var container = document.getElementById('door-configurator');
    if (!container) return;

    try {
      var cfgMatch = String((window.location && window.location.search) || '').match(/[?&]config_id=(\d+)/);
      if (cfgMatch && cfgMatch[1]) {
        container.setAttribute('data-edit-config-id', cfgMatch[1]);
      }
    } catch (eEarlyCfg) {}

    doorConf2MeasurementsInit();

    if (!DOOR_SELECTION_LOG_ONLY) {
      bindStileAndRailProfileAdditivePricing();
    }

    // Open the theme's "How To Measure" drawer from our inline measurement help button.
    container.addEventListener('door-measurement-help', function () {
      openMeasureGuideDrawer();
    }, true);

    // If the customer is logged in and returned from login (?autosave=1), just make sure the note is visible.
    // Do NOT remove/query the selected value, or clean the query string.
    var returnedNote = document.getElementById('door-returned-from-login-note');
    if (returnedNote && typeof window.location !== 'undefined' && window.location.search && window.location.search.indexOf('autosave=1') !== -1) {
      returnedNote.style.display = '';
      // Leave the query string and state alone so user can see their context.
      // Just surface the note so customer knows to select a collection (no need to fill all details again).
    }

    // Guard: some environments polyfill/override `location.search` unexpectedly.
    var locSearch = '';
    try { locSearch = String((window.location && window.location.search) || ''); } catch (eLoc) { locSearch = ''; }
    if (returnedNote && locSearch.indexOf('autosave=1') !== -1) {
      // Scroll the note into view after making it visible
      setTimeout(function () {
        returnedNote.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
   
    var schemaEl = document.getElementById('door-configurator-schema');
    var optionsContainer = document.getElementById('door-configurator-options');
    if (schemaEl && optionsContainer) {
      try {
        var schemaText = (schemaEl.textContent || '').trim();
        if (!schemaText) {
          if (productIsPorchPanelProduct()) {
            optionsContainer.innerHTML = '';
            appendStaticPanelUnitDesignSection(optionsContainer);
            initializePanelUnitDesignSections(optionsContainer, []);
            bindDynamicOptionsEvents(optionsContainer);
            updateDoorPreview();
          } else {
            optionsContainer.innerHTML = '<p class="door-options-error" style="padding:1rem;color:#6b7280;">No options schema found.</p>';
          }
          return;
        }
        var raw = JSON.parse(schemaText);
        var schema = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (!Array.isArray(schema) || !schema.length) {
          if (productIsPorchPanelProduct()) {
            optionsContainer.innerHTML = '';
            appendStaticPanelUnitDesignSection(optionsContainer);
            initializePanelUnitDesignSections(optionsContainer, []);
            bindDynamicOptionsEvents(optionsContainer);
            updateDoorPreview();
          } else {
            optionsContainer.innerHTML = '<p class="door-options-error" style="padding:1rem;color:#6b7280;">No options to display.</p>';
          }
          return;
        }
        renderDynamicOptions(schema, optionsContainer);
        applyHideWhen(schema, optionsContainer);
        applyChoiceVisibility(schema, optionsContainer);
        applyProductTagChoiceVisibility(schema, optionsContainer);
        syncPanelProfileHero(optionsContainer);
        syncMeasurementTypeSectionPreHungGate(schema, optionsContainer);
        syncHingeFinishVisibility(schema, optionsContainer);
        syncMeasurementTabCardVisibility(optionsContainer, schema);
        syncMeasurementTypeDetailsVisibility(optionsContainer, schema);
        syncSlabSidelightMeasurementUI(optionsContainer, schema);
        if (!doorRestorePending()) {
          applyStaticMeasurementDimensionDefaults(optionsContainer);
        }
        bindDynamicOptionsEvents(optionsContainer);
        updateDoorPreview();
        function clearAllDefaultSelections() {
          optionsContainer.querySelectorAll('input[type="radio"]').forEach(function (r) {
            if (isPanelUnitDesignSectionEl(r)) return;
            r.checked = false;
          });
          optionsContainer.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
            if (isPanelUnitDesignSectionEl(cb)) return;
            cb.checked = false;
          });
          optionsContainer.querySelectorAll('.common-check-option--selected').forEach(function (c) {
            if (isPanelUnitDesignSectionEl(c)) return;
            c.classList.remove('common-check-option--selected');
          });
          optionsContainer.querySelectorAll('select[data-option-id]').forEach(function (sel) {
            var unit = sel.getAttribute ? String(sel.getAttribute('data-unit') || '') : '';
            if (unit === 'in-int' || unit === 'in-frac') return;
            sel.value = '';
          });
          syncSidelightTransomAccordionHeaderUi(optionsContainer);
        }
        // After login (?autosave=1), restored selections must not be cleared by theme
        // default-reset timers (options like shelf often have no collection default).
        if (!doorRestorePending()) {
          clearAllDefaultSelections();
          applyStaticMeasurementDimensionDefaults(optionsContainer);
          setTimeout(clearAllDefaultSelections, 0);
          setTimeout(function () { applyStaticMeasurementDimensionDefaults(optionsContainer); }, 0);
          setTimeout(clearAllDefaultSelections, 100);
          setTimeout(function () { applyStaticMeasurementDimensionDefaults(optionsContainer); }, 100);
          setTimeout(clearAllDefaultSelections, 300);
          setTimeout(function () { applyStaticMeasurementDimensionDefaults(optionsContainer); }, 300);
          // ===== DEFAULT OPTIONS (custom.configurator_defaults metafield) - START =====
          setTimeout(function () {
            applyCollectionDefaultSelections(optionsContainer);
            applyStaticMeasurementDimensionDefaults(optionsContainer);
            if (
              window.DoorIntExtPricingRule
              && typeof window.DoorIntExtPricingRule.refreshGeneralIntExtOversizedFromDomIfReady === 'function'
            ) {
              window.DoorIntExtPricingRule.refreshGeneralIntExtOversizedFromDomIfReady(null);
            }
          }, 350);
          setTimeout(function () {
            applyCollectionDefaultSelections(optionsContainer);
            applyStaticMeasurementDimensionDefaults(optionsContainer);
            if (
              window.DoorIntExtPricingRule
              && typeof window.DoorIntExtPricingRule.refreshGeneralIntExtOversizedFromDomIfReady === 'function'
            ) {
              window.DoorIntExtPricingRule.refreshGeneralIntExtOversizedFromDomIfReady(null);
            }
          }, 600);
          setTimeout(function () { pulseDependentVisibilityFromDefaults(optionsContainer); }, 800);
          setTimeout(function () { applyStaticMeasurementDimensionDefaults(optionsContainer); }, 850);
          setTimeout(function () { applyStaticMeasurementDimensionDefaults(optionsContainer); }, 1500);
          // ===== DEFAULT OPTIONS (custom.configurator_defaults metafield) - END =====
        } else {
          _collectionDefaultsApplied = true;
        }
        if (productIsPorchPanelProduct()) {
          setTimeout(function () {
            try {
              if (!schemaIncludesPanelUnitDesignOption(schema) && !panelUnitDesignSectionExists(document.getElementById('door-configurator'))) {
                appendStaticPanelUnitDesignSection(optionsContainer);
              }
              initializePanelUnitDesignSections(optionsContainer, schema);
            } catch (ePorchPanelReinit) {}
          }, 50);
        }
      } catch (e) {
        optionsContainer.innerHTML = '<p class="door-options-error" style="padding:1rem;color:#b91c1c;font-size:0.9rem;">Could not load options. Please refresh the page. If this continues, check the browser console (F12) for details.</p>';
        if (typeof console !== 'undefined' && console.error) console.error('Door configurator schema error:', e);
      }
    } else {
      try {
        initializePanelUnitDesignSections(optionsContainer, doorConfigSchema || []);
      } catch (ePanelUnitBoot) {}
    }
    bindDelegatedPriceUpdate();
    try { window.__doorUpdateEstimatedPrice = updateEstimatedPrice; } catch (eExposePrice) {}
    try {
      initializePanelUnitDesignSections(
        document.getElementById('door-configurator-options'),
        doorConfigSchema || []
      );
    } catch (ePanelUnitFinalInit) {}

    if (DOOR_SELECTION_LOG_ONLY) {
      if (container) container.classList.add('door-configurator--log-only');
      var qtyInputLog = getDoorQuantityInput();
      if (qtyInputLog) {
        qtyInputLog.addEventListener('change', function () {
          logSelectedOptionsWithQty();
        });
      }
      var addToCartBtnLog = document.getElementById('door-add-to-cart-btn');
      if (addToCartBtnLog) addToCartBtnLog.style.display = 'none';
      var priceBoxLog = document.querySelector('.door-price-box');
      if (priceBoxLog) priceBoxLog.style.display = 'none';
      logSelectedOptionsWithQty();
    } else {
      if (container) container.classList.remove('door-configurator--log-only');
      ensureDoorPriceBoxVisible();
      try { updateEstimatedPrice(); } catch (eInitPrice) {}
    }

    var apiBase = 'https://vintage.espirevox.com';
    var folderSelect = document.getElementById('door-save-folder');
    var newFolderInput = document.getElementById('door-new-folder-name');

    if (window.DoorConf2Update && typeof window.DoorConf2Update.bootHubspotIntegration === 'function') {
      doorHubspot = window.DoorConf2Update.bootHubspotIntegration({
        apiBase: apiBase,
        folderSelect: folderSelect,
        newFolderInput: newFolderInput,
        getCurrentConfig: getCurrentConfig,
        calculateDoorPrice: calculateDoorPrice,
        readDoorEstimatedPriceFromDom: readDoorEstimatedPriceFromDom,
        getLineItemPropertiesFromSchema: getLineItemPropertiesFromSchema,
        getHardwareSelectionsForConfig: getHardwareSelectionsForConfig
      });
    }
    if (folderSelect) {
      folderSelect.addEventListener('change', function () {
        if (newFolderInput) {
          const isNew = folderSelect.value === '__new__';

          newFolderInput.classList.toggle('door-visible', isNew);
          newFolderInput.classList.toggle('form-field', isNew);
          newFolderInput.classList.toggle('form-field--input', isNew);
        }
      });
    }
    function loadFoldersIntoSelect(email, done) {
      if (!folderSelect || !email) { if (done) done(); return; }
      fetch(apiBase + '/api/folders.php?email=' + encodeURIComponent(email))
        .then(function (r) { return r.json(); })
        .then(function (list) {
          while (folderSelect.firstChild) folderSelect.removeChild(folderSelect.firstChild);
          folderSelect.appendChild(document.createElement('option')).value = '';
          folderSelect.lastChild.textContent = 'Select a collection...';
          (list || []).forEach(function (f) {
            var opt = document.createElement('option');
            opt.value = String(f.id);
            opt.textContent = f.name || ('Folder #' + f.id);
            folderSelect.appendChild(opt);
          });
          var o = document.createElement('option');
          o.value = '__new__';
          o.textContent = '+ New collection...';
          folderSelect.appendChild(o);
          if (done) done();
        })
        .catch(function () { if (done) done(); });
    }

    function normSavedOptionKey(s) {
      return String(s == null ? '' : s).trim().toLowerCase().replace(/-/g, '_');
    }

    var SAVED_MEASUREMENT_ALIAS_GROUPS = [
      ['exact_door_width_int', 'exact_door_width', 'door_width'],
      ['exact_door_width_frac', 'exact_door_width_fraction', 'door_width_fraction'],
      ['door_height', 'exact_door_height'],
      ['door_height_fraction', 'door_height_frac'],
      ['exact_door_thickness_frac', 'exact_door_thickness', 'door_thickness'],
      ['exact_pre_hung_frac', 'exact_pre_hung'],
      ['finished_width_int', 'finished_width'],
      ['finished_width_frac', 'finished_width_fraction'],
      ['finished_height_int', 'finished_height'],
      ['finished_height_frac', 'finished_height_fraction'],
      ['rough_width_int', 'rough_width'],
      ['rough_width_frac', 'rough_width_fraction'],
      ['rough_height_int', 'rough_height'],
      ['rough_height_frac', 'rough_height_fraction'],
      ['panel_width_int', 'panel_width'],
      ['panel_height_int', 'panel_height'],
      ['panel_height_frac', 'panel_height_fraction'],
      ['sidelight_width', 'sidelight_width_int'],
      ['sidelight_width_fraction', 'sidelight_width_frac'],
      ['panel_transom_height_int', 'panel_transom_height'],
      ['panel_transom_height_frac', 'panel_transom_height_fraction']
    ];

    function savedOptionKeysForId(id) {
      var norm = normSavedOptionKey(id);
      var keys = [String(id || ''), norm, norm.replace(/_/g, '-')];
      SAVED_MEASUREMENT_ALIAS_GROUPS.forEach(function (group) {
        var groupNorm = group.map(normSavedOptionKey);
        if (groupNorm.indexOf(norm) === -1) return;
        group.forEach(function (g) {
          keys.push(g);
          keys.push(String(g).replace(/_/g, '-'));
        });
      });
      var out = [];
      keys.forEach(function (k) {
        if (k && out.indexOf(k) === -1) out.push(k);
      });
      return out;
    }

    function getSavedOptionValue(opts, id) {
      if (!opts || id == null || id === '') return null;
      var i, k, val;
      for (i = 0; i < savedOptionKeysForId(id).length; i++) {
        k = savedOptionKeysForId(id)[i];
        if (!Object.prototype.hasOwnProperty.call(opts, k)) continue;
        val = opts[k];
        if (val !== null && val !== '') return val;
      }
      return null;
    }

    function setSelectValueFromSaved(sel, val) {
      if (!sel || val == null || val === '') return false;
      var target = String(val);
      var i, op, applied = false;
      for (i = 0; i < sel.options.length; i++) {
        op = sel.options[i];
        if (!op) continue;
        if (String(op.value) === target) {
          sel.selectedIndex = i;
          sel.value = String(op.value);
          applied = true;
          break;
        }
        if (op.value !== '' && !isNaN(parseFloat(op.value)) && !isNaN(parseFloat(target))) {
          if (Math.abs(parseFloat(op.value) - parseFloat(target)) < 0.000001) {
            sel.selectedIndex = i;
            sel.value = String(op.value);
            applied = true;
            break;
          }
        }
      }
      // Final fallback: normalized-key match (case / dash insensitive) so saved
      // values that differ only in formatting still restore the right option.
      if (!applied) {
        var targetNorm = normSavedOptionKey(target);
        for (i = 0; i < sel.options.length; i++) {
          op = sel.options[i];
          if (!op || op.value === '') continue;
          if (normSavedOptionKey(op.value) === targetNorm) {
            sel.selectedIndex = i;
            sel.value = String(op.value);
            applied = true;
            break;
          }
        }
      }
      if (!applied) return false;
      try {
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      } catch (eCh) {}
      if (window.DoorConf2Hardware && typeof window.DoorConf2Hardware.syncDoorDivSelectFromNative === 'function') {
        var divWrap = sel.nextElementSibling;
        if (sel.getAttribute('data-door-div-select') === '1' && divWrap && divWrap.classList && divWrap.classList.contains('door-div-select')) {
          window.DoorConf2Hardware.syncDoorDivSelectFromNative(sel, divWrap);
        }
      }
      return true;
    }

    // The Additional Options selects (Door Sweep / Door Stops with Seals / Pet Door)
    // are moved into a dedicated accordion and converted to custom div-dropdowns by a
    // late, retrying render loop. That can finish AFTER the saved-config re-apply runs,
    // so a one-shot applyConfigToInputs() misses them. This self-retries until each
    // select exists, then applies the saved value and syncs the custom dropdown UI.
    function restoreAdditionalOptionsSelectsFromSaved(opts, attempt) {
      if (!opts || !optionsContainer) return;
      attempt = attempt || 0;
      var pending = false;
      ADDITIONAL_OPTIONS_SELECT_IDS.forEach(function (oid) {
        var saved = getSavedOptionValue(opts, oid);
        if (saved == null || saved === '') return; // nothing saved → keep default
        var sel = optionsContainer.querySelector('select[data-option-id="' + oid + '"]');
        if (!sel) { pending = true; return; }
        // Ensure the custom div-dropdown exists before applying the saved value.
        try { enhanceDoorSelectWithDivDropdown(sel); } catch (eEnh) {}
        var ok = setSelectValueFromSaved(sel, saved);
        if (!ok) {
          // Matching <option> may not be populated yet → retry later.
          pending = true;
          return;
        }
        try {
          var dw = sel.nextElementSibling;
          if (window.DoorConf2Hardware && typeof window.DoorConf2Hardware.syncDoorDivSelectFromNative === 'function'
            && dw && dw.classList && dw.classList.contains('door-div-select')) {
            window.DoorConf2Hardware.syncDoorDivSelectFromNative(sel, dw);
          }
        } catch (eSync) {}
      });
      if (pending && attempt < 25) {
        setTimeout(function () { restoreAdditionalOptionsSelectsFromSaved(opts, attempt + 1); }, 250);
      }
    }

    function savedGlassBevelEnabled(opts) {
      var val = getSavedOptionValue(opts, 'glass_bevel');
      if (Array.isArray(val)) {
        for (var i = 0; i < val.length; i++) {
          var s = String(val[i] == null ? '' : val[i]).toLowerCase();
          if (s && s !== 'false' && s !== '0' && s !== 'no' && s !== 'off') return true;
        }
      } else if (val != null && val !== '') {
        var s2 = String(val).toLowerCase();
        if (s2 !== 'false' && s2 !== '0' && s2 !== 'no' && s2 !== 'off') return true;
      }
      if (Array.isArray(opts._selected_summary)) {
        for (var j = 0; j < opts._selected_summary.length; j++) {
          var item = opts._selected_summary[j];
          if (!item || String(item.label || '').toLowerCase() !== 'bevel glass') continue;
          var v = String(item.value || '').toLowerCase();
          if (v.indexOf('add') !== -1 && v.indexOf('no bevel') === -1) return true;
        }
      }
      return false;
    }

    function applyGlassBevelFromSavedOptions(opts) {
      var inp = document.querySelector('input[type="checkbox"][data-option-id="glass_bevel"]');
      if (!inp) return;
      var on = savedGlassBevelEnabled(opts);
      inp.checked = on;
      if (on) {
        var val = getSavedOptionValue(opts, 'glass_bevel');
        if (Array.isArray(val) && val.length) inp.value = String(val[0]);
      }
    }

    function applyMeasurementSelectsFromSavedOptions(opts) {
      doorConf2MeasurementsCall('applyMeasurementSelectsFromSavedOptions', opts, {
        optionsContainer: optionsContainer,
        getSavedOptionValue: getSavedOptionValue,
        setSelectValueFromSaved: setSelectValueFromSaved
      });
    }

    function syncMeasurementUiAfterSavedRestore(opts) {
      doorConf2MeasurementsCall('syncMeasurementUiAfterSavedRestore', opts, {
        getSavedOptionValue: getSavedOptionValue,
        savedOptionKeysForId: savedOptionKeysForId,
        normSavedOptionKey: normSavedOptionKey,
        setSelectValueFromSaved: setSelectValueFromSaved,
        optionsContainer: document.getElementById('door-configurator-options')
      });
    }

    function applySavedExtrasFromOptions(opts) {
      if (!opts) return;
      syncMeasurementUiAfterSavedRestore(opts);
      applyMeasurementSelectsFromSavedOptions(opts);
      applyGlassBevelFromSavedOptions(opts);
      try { syncMeasurementSelectedPriceLabels(opts); } catch (eMeasLbl) {}
    }

    function applyConfigToInputs(opts) {
      if (!doorConfigSchema || !optionsContainer || !opts) return;
      var formControlSelector = function (id) {
        return 'select[data-option-id="' + id + '"], input[data-option-id="' + id + '"]';
      };
      doorConfigSchema.forEach(function (opt) {
        var optType = (opt.type || '').toLowerCase();
        var inputs = all(formControlSelector(opt.id), optionsContainer);
        var val = getSavedOptionValue(opts, opt.id);
        if (val == null && opts[opt.id] != null) val = opts[opt.id];
        if (optType === 'dimension') {
          var cmSel = optionsContainer.querySelector('select[data-option-id="' + opt.id + '"][data-unit="cm"], input[data-option-id="' + opt.id + '"][data-unit="cm"]');
          var inHiddenSel = optionsContainer.querySelector('input[data-option-id="' + opt.id + '"][data-unit="in"], select[data-option-id="' + opt.id + '"][data-unit="in"]');
          var vCm = opts[opt.id + '_cm'];
          var vIn = opts[opt.id + '_in'];
          if (cmSel && vCm != null && vCm !== '') cmSel.value = String(vCm);

          // Set split inch controls: integer + fraction + hidden combined value.
          if (vIn != null && vIn !== '') {
            if (inHiddenSel) inHiddenSel.value = String(vIn);
            var intSel = optionsContainer.querySelector('select[data-option-id="' + opt.id + '"][data-unit="in-int"]');
            var fracSel = optionsContainer.querySelector('select[data-option-id="' + opt.id + '"][data-unit="in-frac"]');
            if (intSel && fracSel && inHiddenSel) {
              var unitIn = opt.unit_in || opt.range_in || {};
              var step = unitIn && unitIn.step != null ? parseFloat(unitIn.step) : 0.25;
              if (isNaN(step) || step <= 0) step = 0.25;

              var fracOptions;
              if (step <= 0.26) {
                fracOptions = [
                  { value: '0', label: '0' },
                  { value: '0.25', label: '1/4' },
                  { value: '0.5', label: '1/2' },
                  { value: '0.75', label: '3/4' }
                ];
              } else if (step <= 0.51) {
                fracOptions = [
                  { value: '0', label: '0' },
                  { value: '0.5', label: '1/2' }
                ];
              } else {
                fracOptions = [{ value: '0', label: '0' }];
              }

              var num = parseFloat(vIn);
              if (!isNaN(num)) {
                var intPart = Math.floor(num + 1e-9);
                var fracPart = Math.round((num - intPart) * 100) / 100;

                if (intPart >= 1 && intPart <= 50) {
                  var found = fracOptions.find(function (f) {
                    return Math.abs(parseFloat(f.value) - fracPart) < 1e-6;
                  });
                  if (found) {
                    intSel.value = String(intPart);
                    fracSel.value = found.value;
                  } else {
                    intSel.value = '';
                    fracSel.value = '';
                    inHiddenSel.value = '';
                  }
                } else {
                  intSel.value = '';
                  fracSel.value = '';
                  inHiddenSel.value = '';
                }
              }
            }
          } else if (inHiddenSel) {
            inHiddenSel.value = '';
          }
        } else if (optType === 'checkbox') {
          var arr = Array.isArray(val) ? val : (val != null && val !== '' ? [val] : []);
          inputs.forEach(function (el) {
            var matched = false;
            for (var ci = 0; ci < arr.length; ci++) {
              if (String(el.value) === String(arr[ci]) || normSavedOptionKey(el.value) === normSavedOptionKey(arr[ci])) {
                matched = true;
                break;
              }
            }
            el.checked = matched;
          });
        } else if (optType === 'radio') {
          var targetRadio = String(val == null ? '' : val);
          var matchedRadio = null;
          // Prefer an exact value match, then fall back to a normalized-key match
          // so saved values that differ only in case/dashes still pre-select.
          inputs.forEach(function (el) {
            if (matchedRadio) return;
            if (String(el.value || '') === targetRadio) matchedRadio = el;
          });
          if (!matchedRadio && targetRadio !== '') {
            inputs.forEach(function (el) {
              if (matchedRadio) return;
              if (normSavedOptionKey(el.value) === normSavedOptionKey(targetRadio)) matchedRadio = el;
            });
          }
          inputs.forEach(function (el) { el.checked = (el === matchedRadio); });
          var selectedRadioVal = matchedRadio ? String(matchedRadio.value || '') : '';
          var radioWrap = optionsContainer.querySelector('.door-option-wrap[data-option-id="' + opt.id + '"] .common-check-options')
            || optionsContainer.querySelector('[data-option-id="' + opt.id + '"] .common-check-options');
          if (radioWrap) {
            radioWrap.querySelectorAll('.common-check-option').forEach(function (card) {
              card.classList.toggle('common-check-option--selected', selectedRadioVal !== '' && String(card.getAttribute('data-choice-value') || '') === selectedRadioVal);
            });
          }
          if (matchedRadio) {
            try { matchedRadio.dispatchEvent(new Event('change', { bubbles: true })); } catch (eRadioCh) {}
          }
        } else if (inputs.length && val !== undefined && val !== null) {
          var firstInput = inputs[0];
          if (firstInput.tagName === 'SELECT' && val !== '') {
            // Robust helper: exact + numeric + normalized match, dispatches change
            // (so dependent options reveal) and syncs the custom div-dropdown UI
            // used by the additional-options selects (door_sweep / seal / pet_door).
            setSelectValueFromSaved(firstInput, val);
          } else {
            firstInput.value = val === '' ? '' : String(val);
          }
        }
      });
      applySavedExtrasFromOptions(opts);
            applyHideWhen(doorConfigSchema, optionsContainer);
            applyChoiceVisibility(doorConfigSchema, optionsContainer);
            applyProductTagChoiceVisibility(doorConfigSchema, optionsContainer);
            syncPanelProfileHero(optionsContainer);
            syncMeasurementTypeSectionPreHungGate(doorConfigSchema, optionsContainer);
            syncHingeFinishVisibility(doorConfigSchema, optionsContainer);
      try { pulseDependentVisibilityFromDefaults(optionsContainer); } catch (ePulseRestore) {}
      updateEstimatedPrice();
      updateDoorPreview();
    }

    function getQueryParam(name) {
      var m = window.location.search.match(new RegExp('[?&]' + name + '=([^&]*)'));
      return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
    }

    function buildConfigReturnUrl() {
      var path = window.location.pathname || '/';
      var pairs = [];
      var seen = {};
      var raw = (window.location.search || '').replace(/^\?/, '');
      if (raw) {
        raw.split('&').forEach(function (part) {
          if (!part) return;
          var kv = part.split('=');
          var key = decodeURIComponent(kv[0] || '');
          if (!key || key === 'door_post_login' || key === 'door_from_profile') return;
          if (seen[key]) return;
          seen[key] = true;
          pairs.push(part);
        });
      }
      seen.autosave = true;
      pairs = pairs.filter(function (part) {
        var k = part.split('=')[0];
        return k !== 'autosave' && k !== 'door_post_login' && k !== 'door_from_profile';
      });
      pairs.push('autosave=1');
      return path + (pairs.length ? '?' + pairs.join('&') : '?autosave=1');
    }

    function toAbsoluteStoreUrl(relativeOrAbsolute) {
      var u = (relativeOrAbsolute || '').trim();
      if (!u) return '';
      if (u.indexOf('http') === 0) return u;
      return window.location.origin + (u.charAt(0) === '/' ? u : '/' + u);
    }

    function getCompleteProfilePageUrl(cfgContainer) {
      var path = (cfgContainer && cfgContainer.getAttribute('data-complete-profile-page-url')) || '/pages/complete-profile';
      return toAbsoluteStoreUrl(path);
    }

    function storeConfigReturnUrls(cfgContainer) {
      var relative = buildConfigReturnUrl();
      var absolute = toAbsoluteStoreUrl(relative);
      try {
        localStorage.setItem('door_config_return_url', absolute);
        localStorage.setItem('door_config_return_path', relative);
      } catch (e) {}
      return { relative: relative, absolute: absolute };
    }

    function isDoorProfileComplete(cfgContainer) {
      if (!cfgContainer) return false;
      try {
        if (sessionStorage.getItem('door_profile_form_done') === '1') return true;
      } catch (eSess) {}
      if (cfgContainer.getAttribute('data-profile-complete') === '1') return true;
      var first = (cfgContainer.getAttribute('data-customer-first-name') || '').trim();
      var phone = (cfgContainer.getAttribute('data-customer-phone') || '').trim();
      var zip = (cfgContainer.getAttribute('data-customer-zip') || '').trim();
      return first !== '' && phone !== '' && zip !== '';
    }

    function showDoorReturnedNote() {
      var note = document.getElementById('door-returned-from-login-note');
      if (!note) return;
      note.style.display = '';
      setTimeout(function () {
        try { note.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (eScroll) {}
      }, 200);
    }

    function restoreConfigFromLocalStorage(cfgContainer, done) {
      var raw = null;
      try { raw = localStorage.getItem('door_autosave_payload'); } catch (eRaw) {}
      if (!raw) { if (done) done(false); return; }
      var saved = null;
      try { saved = JSON.parse(raw); } catch (eParse) {}
      if (!saved || !saved.options) { if (done) done(false); return; }

      applyConfigToInputs(saved.options);

      var custEmail = (cfgContainer.getAttribute('data-customer-email') || '').trim();
      if (folderSelect && custEmail) {
        loadFoldersIntoSelect(custEmail, function () {
          if (folderSelect && saved.folderValue) {
            folderSelect.value = saved.folderValue;
            if (newFolderInput) newFolderInput.classList.toggle('door-visible', folderSelect.value === '__new__');
          }
          if (newFolderInput && saved.newFolderName) newFolderInput.value = saved.newFolderName;
          if (done) done(true);
        });
      } else {
        if (done) done(true);
      }
    }

    function runDoorAuthReturnFlow() {
      var cfgContainer = document.getElementById('door-configurator');
      if (!cfgContainer) return;

      var custEmail = (cfgContainer.getAttribute('data-customer-email') || '').trim();
      if (!custEmail) return;

      var postLogin = getQueryParam('door_post_login') === '1';
      var autosave = getQueryParam('autosave') === '1';
      var profileComplete = isDoorProfileComplete(cfgContainer);
      var urls = storeConfigReturnUrls(cfgContainer);
      var returnUrl = urls.relative;
      var returnAbsolute = urls.absolute;
      var completeProfileUrl = getCompleteProfilePageUrl(cfgContainer);

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
        var storedReturn = '';
        try { storedReturn = localStorage.getItem('door_config_return_url') || returnAbsolute; } catch (eRet) { storedReturn = returnAbsolute; }
        var storedPath = '';
        try { storedPath = localStorage.getItem('door_config_return_path') || returnUrl; } catch (ePath) { storedPath = returnUrl; }
        var current = window.location.pathname + window.location.search;
        var targetPath = storedPath || returnUrl;
        if (targetPath && current !== targetPath && current.indexOf('autosave=1') === -1) {
          window.location.replace(targetPath);
          return;
        }
      }

      if (autosave) {
        restoreConfigFromLocalStorage(cfgContainer, function (restored) {
          if (restored) {
            showDoorReturnedNote();
            try {
              sessionStorage.removeItem('door_pending_profile');
            } catch (eClr) {}
          }
        });
      }
    }

    (function bindDoorProfileReturnWatcher() {
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
    })();

    // If customer clicked "Log in to save", store current selections before redirecting.
    var loginToSaveLink = document.getElementById('door-login-to-save');
    if (loginToSaveLink) {
      loginToSaveLink.addEventListener('click', function () {
        try {
          var payload = {
            options: getCurrentConfig(),
            folderValue: folderSelect ? folderSelect.value : '',
            newFolderName: newFolderInput ? newFolderInput.value : '',
            ts: Date.now()
          };
          localStorage.setItem('door_autosave_payload', JSON.stringify(payload));
          var cfgEl = document.getElementById('door-configurator');
          storeConfigReturnUrls(cfgEl);
        } catch (e) {}
      });
    }
    var emailInputForFolders = document.getElementById('door-customer-email');
    if (folderSelect && emailInputForFolders) {
      folderSelect.addEventListener('focus', function () {
        var email = emailInputForFolders.value.trim();
        if (email) loadFoldersIntoSelect(email);
      });
    }

    var saveButton = document.getElementById('door-save-config-button');
    if (saveButton) {
      saveButton.addEventListener('click', function () {
        var container = document.getElementById('door-configurator');
        var emailInput = document.getElementById('door-customer-email');
        var messageEl = document.getElementById('door-save-config-message');
        var originalSaveText = saveButton.textContent;
        saveButton.disabled = true;
        saveButton.textContent = 'Saving...';
        var email = (container && container.getAttribute('data-customer-email') ? container.getAttribute('data-customer-email').trim() : '') ||
          (emailInput && emailInput.value ? emailInput.value.trim() : '');
        if (!email) {
          if (messageEl) {
            messageEl.style.display = 'block';
            messageEl.textContent = 'Please log in to save the configuration.';
          }
          saveButton.disabled = false;
          saveButton.textContent = originalSaveText;
          return;
        }

        var folderValue = folderSelect ? folderSelect.value : '';
        var folderId = null;
        var folderName = null;
        if (folderValue === '__new__' && newFolderInput && newFolderInput.value.trim()) {
          folderName = newFolderInput.value.trim();
        } else if (folderValue && folderValue !== '__new__') {
          folderId = parseInt(folderValue, 10);
          if (isNaN(folderId)) folderId = null;
        }
        if (folderId == null && !folderName) {
          if (messageEl) {
            messageEl.style.display = 'block';
            messageEl.textContent = 'Please select a collection or enter a name for a new one.';
          }
          saveButton.disabled = false;
          saveButton.textContent = originalSaveText;
          return;
        }

        // Human-readable collection name to store in HubSpot (e.g. "fk", "Office", or entered new name).
        var savedProjectName = '';
        if (folderValue === '__new__') {
          savedProjectName = folderName || (newFolderInput && newFolderInput.value ? newFolderInput.value.trim() : '');
        } else if (folderSelect && folderSelect.options && folderSelect.selectedIndex >= 0) {
          savedProjectName = (folderSelect.options[folderSelect.selectedIndex].text || '').trim();
        }

        if (!container) container = document.getElementById('door-configurator');
        var basePriceAttr = container.getAttribute('data-base-price');
        var productId = container.getAttribute('data-product-id');
        var productName = container.getAttribute('data-product-name') || '';
        var productImage = container.getAttribute('data-product-image') || '';
        var productHandle = container.getAttribute('data-product-handle') || '';
        var variantId = container.getAttribute('data-variant-id') || '';
        var productSku = (container.getAttribute('data-product-sku') || '').trim();
        var basePrice = parseFloat(basePriceAttr) || 0;
        var config = getCurrentConfig();
        var selectedOptionImages = buildSelectedOptionImageMap(config, doorConfigSchema);
        var selectedSummary = buildSelectedSummaryForStorage(config, doorConfigSchema);
        var qtySave = getDoorQuantity();
        var appliedLineTotal = doorHubspot && doorHubspot.getAppliedLineTotal
          ? doorHubspot.getAppliedLineTotal(container, qtySave)
          : 0;

        // Merge DOM-captured extra options (exposure, bevel, hinge, hardware,
        // measurement dropdowns) into the schema + values + images so the admin
        // renders them as editable controls.
        var adminExtras = buildAdminEditableExtras();
        var extraIds = {};
        adminExtras.entries.forEach(function (e) { extraIds[String(e.id)] = true; });
        var baseSchema = Array.isArray(doorConfigSchema) ? doorConfigSchema.slice() : [];
        // Put the DOM-captured extras FIRST so they can never be lost to JSON size
        // truncation, then the remaining base options (minus any duplicates).
        var mergedSchema = adminExtras.entries.concat(
          baseSchema.filter(function (o) { return !(o && extraIds[String(o.id)]); })
        );
        // Drop bulky showWhenProductTags data from the schema before saving.
        mergedSchema = stripShowWhenProductTags(mergedSchema);
        var configWithExtras = Object.assign({}, config, adminExtras.values);
        Object.keys(adminExtras.images).forEach(function (oid) {
          selectedOptionImages[oid] = Object.assign({}, selectedOptionImages[oid] || {}, adminExtras.images[oid]);
        });

        var priceSnapshot = buildDoorPriceSnapshotForStorage(configWithExtras, basePrice);
        var configForStorage = Object.assign({}, configWithExtras, {
          _selected_option_images: selectedOptionImages,
          // Persist the schema (incl. DOM-captured extras) so admin staff can edit
          // the controls. Price is never recalculated from this.
          _pricing_schema: mergedSchema,
          // Readable list of customer selections + quantity for the admin app.
          _selected_summary: selectedSummary,
          _quantity: qtySave,
          _product_sku: productSku,
          _product_type: (container.getAttribute('data-product-type') || '').trim(),
          _hardware_selections: config.hardware_options || config._hardware_selections || []
        }, priceSnapshot);
        var currency = (Shopify && Shopify.currency && Shopify.currency.active ? Shopify.currency.active : 'USD');

        var props = getLineItemPropertiesFromSchema();
        var summaryParts = [];
        Object.keys(props || {}).forEach(function (k) {
          var v = props[k];
          if (v != null && v !== '') {
            summaryParts.push(k + ': ' + v);
          }
        });
        var optionsSummary = summaryParts.join('; ');

        var editId = container.getAttribute('data-edit-config-id');
        var isUpdate = !!editId;

        var url = apiBase + '/api/configurations.php';
        var method = isUpdate ? 'PUT' : 'POST';
        var payload = isUpdate
          ? {
              id: parseInt(editId, 10),
              email: email,
              options: configForStorage,
              basePrice: basePrice,
              computedPrice: priceSnapshot._applied_unit_price
            }
          : {
              customerEmail: email,
              baseProductId: productId,
              productTitle: productName,
              productImageUrl: productImage,
              productHandle: productHandle,
              variantId: variantId,
              options: configForStorage,
              notesFromCustomer: '',
              basePrice: basePrice,
              computedPrice: priceSnapshot._applied_unit_price
            };
        if (folderId != null) payload.folder_id = folderId;
        if (folderName) payload.folder_name = folderName;

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
              var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) ? window.Shopify.routes.root : '/';
              var path = '/pages/my-saved-doors';
              var myDoorsUrl = (root && root !== '/') ? root.replace(/\/$/, '') + path : path;
              var refId = (data && data.id) != null ? String(data.id) : '';
              var msg = isUpdate
                ? 'Configuration updated. Our team will follow up if needed.'
                : 'Configuration saved. Our sales team will contact you.' + (refId ? ' Reference ID: ' + refId + '.' : '');
              messageEl.style.display = 'block';
              messageEl.innerHTML = msg + ' <a href="' + myDoorsUrl + '" style="font-weight:600;">View my saved doors</a>';
            }

            if (doorHubspot && doorHubspot.syncAfterSave && savedProjectName) {
              var hubspotRedirected = doorHubspot.syncAfterSave({
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
                originalSaveText: originalSaveText,
                getQueryParam: getQueryParam
              });
              if (hubspotRedirected) return;
            }

            saveButton.disabled = false;
            saveButton.textContent = originalSaveText;
            // If this save was triggered after login, clear the stored payload and redirect to My saved doors.
            try {
              if (getQueryParam('autosave') === '1') {
                localStorage.removeItem('door_autosave_payload');
                var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) ? window.Shopify.routes.root : '/';
                var path = '/pages/my-saved-doors';
                var myDoorsUrl = (root && root !== '/') ? root.replace(/\/$/, '') + path : path;
                window.location.href = myDoorsUrl;
                return;
              }
            } catch (e) {}
          })
          .catch(function () {
            if (messageEl) {
              messageEl.style.display = 'block';
              messageEl.textContent = 'Something went wrong. Please try again.';
            }
            saveButton.disabled = false;
            saveButton.textContent = originalSaveText;
          });
      });
    }

    function loadSavedConfig() {
      var configId = getQueryParam('config_id');
      var email = getQueryParam('email');
      var container = document.getElementById('door-configurator');
      var emailFromCustomer = container ? (container.getAttribute('data-customer-email') || '') : '';
      var emailToUse = (email || emailFromCustomer || '').trim();
      doorSavedRestoreDebugLog('loadSavedConfig called', {
        configId: configId,
        emailParam: email || '',
        emailFromCustomer: emailFromCustomer || '',
        emailToUse: emailToUse || '',
        build: DOOR_SAVED_RESTORE_BUILD
      });
      if (!container) {
        doorSavedRestoreDebugLog('loadSavedConfig abort', { reason: 'missing #door-configurator' });
        return;
      }
      if (!configId) {
        doorSavedRestoreDebugLog('loadSavedConfig abort', { reason: 'missing config_id in URL' });
        return;
      }
      if (!emailToUse) {
        doorSavedRestoreDebugLog('loadSavedConfig abort', {
          reason: 'missing email — add &email=YOUR_EMAIL to the URL or log in on the storefront'
        });
        return;
      }

      // Mark edit mode before schema boot timers run (blocks default-reset timers).
      container.setAttribute('data-edit-config-id', configId);

      // Hide add to cart when editing a saved configuration (only "Update configuration" applies)
      var addToCartWrap = document.querySelector('.door-add-to-cart-wrap');
      if (addToCartWrap) addToCartWrap.style.display = 'none';

      fetch(apiBase + '/api/configurations.php?id=' + encodeURIComponent(configId) + '&email=' + encodeURIComponent(emailToUse))
        .then(function (r) { return r.json(); })
        .then(function (c) {
          if (c.error) {
            doorSavedRestoreDebugLog('fetch-config error', c.error);
            return;
          }
          doorSavedRestoreDebugLog('fetch-config ok', { id: c.id, hasSummary: !!(c.options && c.options._selected_summary) });
          var opts = c.options || {};
          doorConf2MeasurementsCall('hydrateMeasurementOptionsFromSummary', opts, {
            getSavedOptionValue: getSavedOptionValue,
            savedOptionKeysForId: savedOptionKeysForId
          });
          applyConfigToInputs(opts);
          // Restore the Additional Options selects (Door Sweep / Door Stops with Seals /
          // Pet Door). These render into a late accordion + custom dropdowns, so this
          // self-retries until the selects exist and then syncs the custom UI.
          try { restoreAdditionalOptionsSelectsFromSaved(opts); } catch (eAddlSel) {}
          // Restore the saved casing pick (product + length + qty). The casing UI
          // lives in DoorConf2Update and renders late, so it self-retries until ready.
          try {
            if (window.DoorConf2Update && typeof window.DoorConf2Update.restoreCasingSelection === 'function') {
              var savedCasingList = opts._casing_selections || opts.casing_options
                || (opts._casing_selection ? [opts._casing_selection] : []);
              if (savedCasingList && savedCasingList.length) {
                window.DoorConf2Update.restoreCasingSelection(savedCasingList);
              }
            }
          } catch (eCasingRestore) {}
          // Restore the saved hardware pick (finish + function + thickness + qty).
          // Hardware cards render late too, so the module self-retries until ready.
          try {
            if (window.DoorConf2Hardware && typeof window.DoorConf2Hardware.restoreHardwareSelection === 'function') {
              var savedHardwareList = opts._hardware_selections || opts.hardware_options || [];
              if (savedHardwareList && savedHardwareList.length) {
                window.DoorConf2Hardware.restoreHardwareSelection(savedHardwareList);
              }
            }
          } catch (eHardwareRestore) {}
          var optionsContainer = document.getElementById('door-configurator-options');
          if (optionsContainer) {
            setTimeout(function () {
              applySavedExtrasFromOptions(opts);
              applyHideWhen(doorConfigSchema, optionsContainer);
              applyChoiceVisibility(doorConfigSchema, optionsContainer);
              applyProductTagChoiceVisibility(doorConfigSchema, optionsContainer);
              syncPanelProfileHero(optionsContainer);
              syncMeasurementTypeSectionPreHungGate(doorConfigSchema, optionsContainer);
              syncHingeFinishVisibility(doorConfigSchema, optionsContainer);
              try { pulseDependentVisibilityFromDefaults(optionsContainer); } catch (ePulse) {}
              prefetchSavedSidelightTransomApi(opts, function () {
                // Re-assert selections now that transom/sidelight glass styles have
                // loaded and their cards/selects have finished rendering.
                try { applyConfigToInputs(opts); } catch (eReapplyPrefetch) {}
                try { restoreAdditionalOptionsSelectsFromSaved(opts); } catch (eAddlSel2) {}
                applyMeasurementSelectsFromSavedOptions(opts);
                try { runMeasurementUiSync(); } catch (eMeasResync) {}
                refreshScreenStormPricingAfterSavedRestore();
                updateEstimatedPrice();
                applyStoredDoorPricingFromOptions(opts);
                updateDoorPreview();
                try { openRestoredDesignAccordions(optionsContainer); } catch (eOpenDesign1) {}
                try { syncMeasurementSelectedPriceLabels(opts); } catch (eMeasLbl2) {}
              });
              setTimeout(function () {
                // Re-assert saved selections after dependent options have revealed,
                // so child radio/select options that appeared late still pre-select.
                try { applyConfigToInputs(opts); } catch (eReapply) {}
                applySavedExtrasFromOptions(opts);
                applyMeasurementSelectsFromSavedOptions(opts);
                try { runMeasurementUiSync(); } catch (eMeasLate) {}
                refreshScreenStormPricingAfterSavedRestore();
                updateEstimatedPrice();
                applyStoredDoorPricingFromOptions(opts);
                try { openRestoredDesignAccordions(optionsContainer); } catch (eOpenDesign2) {}
                try { syncMeasurementSelectedPriceLabels(opts); } catch (eMeasLbl3) {}
              }, 1600);
            }, 120);
          } else {
            prefetchSavedSidelightTransomApi(opts, function () {
              updateEstimatedPrice();
              applyStoredDoorPricingFromOptions(opts);
              updateDoorPreview();
            });
          }
          var savedQty = parseInt(opts._quantity, 10);
          if (!isNaN(savedQty) && savedQty >= 1) {
            var doorQtyInput = getDoorQuantityInput();
            if (doorQtyInput) doorQtyInput.value = String(savedQty);
          }
          var emailInput = document.getElementById('door-customer-email');
          var custEmail = c.customer_email || emailToUse;
          if (emailInput) emailInput.value = custEmail;
          var saveBtn = document.getElementById('door-save-config-button');
          if (saveBtn) saveBtn.textContent = 'Update configuration';
          if (folderSelect && custEmail) {
            loadFoldersIntoSelect(custEmail, function () {
              if (c.folder_id != null) {
                var existing = folderSelect.querySelector('option[value="' + String(c.folder_id) + '"]');
                if (!existing) {
                  var newOpt = document.createElement('option');
                  newOpt.value = String(c.folder_id);
                  newOpt.textContent = c.folder_name || ('Folder #' + c.folder_id);
                  folderSelect.insertBefore(newOpt, folderSelect.lastChild);
                }
                folderSelect.value = String(c.folder_id);
              }
              if (newFolderInput) newFolderInput.classList.toggle('door-visible', folderSelect.value === '__new__');
            });
          }
        })
        .catch(function (err) {
          doorSavedRestoreDebugLog('fetch-config failed', { message: err && err.message ? err.message : String(err) });
        });
    }

    updateEstimatedPrice();
    updateDoorPreview();
    loadSavedConfig();

    runDoorAuthReturnFlow();
  }

  function onReady() {
    if (window.DoorConf2Hardware && typeof window.DoorConf2Hardware.init === 'function') {
      window.DoorConf2Hardware.init({
        resolveChoiceImageSrc: resolveChoiceImageSrc,
        formatMoney: formatMoney,
        updateEstimatedPrice: updateEstimatedPrice
      });
    }
    doorConf2MeasurementsInit();
    try {
      window.__doorFormatEstimatedPrice = formatMoney;
      window.__doorApplyMeasurementTabSelection = applyMeasurementTypeTabSelection;
      window.__doorRunMeasurementUiSync = runMeasurementUiSync;
    } catch (eFmt) {}
    try {
      document.addEventListener('door-sidelight-transom-price-ready', function () {
        try { updateEstimatedPrice(); } catch (eSlReady) {}
        try { syncMeasurementSelectedPriceLabels(null); } catch (eSlMeasLbl) {}
      });
      document.addEventListener('door-screen-storm-measurement-price-ready', function (e) {
        try {
          if (
            window.DoorIntExtPricingRule
            && typeof window.DoorIntExtPricingRule.syncEstimatedPriceDisplay === 'function'
          ) {
            window.DoorIntExtPricingRule.syncEstimatedPriceDisplay({
              source: 'door-screen-storm-measurement-price-ready',
              userAction: true,
              forceLog: true
            });
          }
          if (
            window.PriceScreenStorm
            && typeof window.PriceScreenStorm.ensureScreenStormPriceAppliedToDom === 'function'
          ) {
            window.PriceScreenStorm.ensureScreenStormPriceAppliedToDom({
              source: 'door-screen-storm-measurement-price-ready',
              detail: e && e.detail ? e.detail : null
            });
          }
          updateOptionRunningPriceLabels();
          try { syncMeasurementSelectedPriceLabels(null); } catch (eSsMeasLbl) {}
        } catch (eSsMeas) {}
      });
      document.addEventListener('door-storm-glass-price-ready', function (e) {
        try {
          updateEstimatedPrice();
          if (
            window.DoorIntExtPricingRule
            && typeof window.DoorIntExtPricingRule.syncEstimatedPriceDisplay === 'function'
          ) {
            window.DoorIntExtPricingRule.syncEstimatedPriceDisplay({
              source: 'door-storm-glass-price-ready',
              userAction: true
            });
          }
          var detail = e && e.detail ? e.detail : {};
          var theme = parseFloat(window.__doorThemeOptionTotal) || 0;
          var storm = parseFloat(window['__doorAddon_storm_glass'] || 0) || 0;
          if (storm > 0) {
            var alertKey = String(detail.key || '') + '|' + String(storm);
            if (window.__doorStormGlassAlertKey !== alertKey) {
              window.__doorStormGlassAlertKey = alertKey;
              try { alert('Storm glass add-on added: ' + String(storm)); } catch (eAlert) {}
            }
          }
          if (window.DOOR_PRICE_DEBUG === false) return;
          var payload = {
            normalizedKey: detail.key,
            selectedValue: detail.value,
            themeOptionTotal: theme,
            stormGlassAddon: storm,
            displayTotal: readDoorEstimatedPriceFromDom(),
            formula: theme + ' + ' + storm + ' = ' + (theme + storm)
          };
          if (
            window.GlassFormulaCalculation
            && typeof window.GlassFormulaCalculation.logStormGlass === 'function'
          ) {
            window.GlassFormulaCalculation.logStormGlass('display_after_api', payload);
          } else {
            void 0;
          }
        } catch (eStormReady) {}
      });
    } catch (eStormBind) {}
    attachEvents();
    try {
      if (
        window.GlassFormulaCalculation
        && typeof window.GlassFormulaCalculation.ensureSidelightTransomLoaded === 'function'
      ) {
        window.GlassFormulaCalculation.ensureSidelightTransomLoaded();
      }
    } catch (eSlBoot) {}
    bindAddToCart(); // Delegated listener so Add to cart works even if configurator loads late
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();