/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Number slider input field.
 * @author kozbial@google.com (Monica Kozbial)
 */

'use strict';

goog.provide('Blockly.FieldSlider');

goog.require('Blockly.Css');
goog.require('Blockly.fieldRegistry');
goog.require('Blockly.FieldNumber');


/**
 * Slider field.
 */

/**
 * Class for an number slider field.
 * @param {string|number=} opt_value The initial value of the field. Should
 *    cast to a number. Defaults to 0.
 * @param {?(string|number)=} opt_min Minimum value.
 * @param {?(string|number)=} opt_max Maximum value.
 * @param {?(string|number)=} opt_precision Precision for value.
 * @param {?Function=} opt_validator A function that is called to validate
 *    changes to the field's value. Takes in a number & returns a validated
 *    number, or null to abort the change.
 * @param {Object=} opt_config A map of options used to configure the field.
 *    See the [field creation documentation]{@link https://developers.google.com/blockly/guides/create-custom-blocks/fields/built-in-fields/number#creation}
 *    for a list of properties this parameter supports.
 * @extends {Blockly.FieldNumber}
 * @constructor
 */
Blockly.FieldSlider = function(opt_value, opt_min, opt_max, opt_precision,
    opt_validator, opt_config) {

  /**
   * Array holding info needed to unbind events.
   * Used for disposing.
   * Ex: [[node, name, func], [node, name, func]].
   * @type {!Array.<Array<?>>}
   * @private
   */
  this.boundEvents_ = [];

  /**
   * The HTML range input element.
   * @type {?HTMLInputElement}
   * @private
   */
  this.sliderInput_ = null;

  Blockly.FieldSlider.superClass_.constructor.call(
      this, opt_value, opt_min,
      opt_max, opt_precision, opt_validator, opt_config);
};
Blockly.utils.object.inherits(Blockly.FieldSlider, Blockly.FieldNumber);

/**
 * Constructs a FieldSlider from a JSON arg object.
 * @param {!Object} options A JSON object with options (value, min, max, and
 *                          precision).
 * @return {!Blockly.FieldSlider} The new field instance.
 * @package
 * @nocollapse
 */
Blockly.FieldSlider.fromJson = function(options) {
  return new Blockly.FieldSlider(options['value'],
      options['min'], options['max'], options['precision'], undefined, options);
};

/**
 * Show the inline free-text editor on top of the text along with the slider
 *    editor.
 * @param {Event=} opt_e Optional mouse event that triggered the field to
 *     open, or undefined if triggered programmatically.
 * @param {boolean=} _opt_quietInput Quiet input.
 * @protected
 * @override
 */
Blockly.FieldSlider.prototype.showEditor_ = function(opt_e, _opt_quietInput) {
  // Mobile browsers have issues with in-line textareas (focus & keyboards).
  var noFocus =
      Blockly.utils.userAgent.MOBILE ||
      Blockly.utils.userAgent.ANDROID ||
      Blockly.utils.userAgent.IPAD;

  Blockly.FieldSlider.superClass_.showEditor_.call(this, opt_e, noFocus);

  // Build the DOM.
  var editor = this.dropdownCreate_();

  Blockly.DropDownDiv.getContentDiv().appendChild(editor);

  Blockly.DropDownDiv.setColour(this.sourceBlock_.style.colourPrimary,
      this.sourceBlock_.style.colourTertiary);

  Blockly.DropDownDiv.showPositionedByField(
      this, this.dropdownDispose_.bind(this));
};

/**
 * Updates the slider when the field rerenders.
 * @protected
 * @override
 */

Blockly.FieldSlider.prototype.render_ = function() {
  Blockly.FieldSlider.superClass_.render_.call(this);
  this.updateSlider_();
};

/**
 * Creates the slider editor and add event listeners.
 * @return {!Element} The newly created slider.
 * @private
 */
Blockly.FieldSlider.prototype.dropdownCreate_ = function() {
  var wrapper = document.createElement('div');
  wrapper.className = 'fieldSliderContainer';
  var sliderInput = document.createElement('input');
  sliderInput.setAttribute('type', 'range');
  sliderInput.setAttribute('min', this.min_);
  sliderInput.setAttribute('max', this.max_);
  sliderInput.setAttribute('step', this.precision_);
  sliderInput.setAttribute('value', this.getValue());
  sliderInput.className = 'fieldSlider';
  wrapper.appendChild(sliderInput);
  this.sliderInput_ = sliderInput;

  this.boundEvents_.push(Blockly.bindEventWithChecks_(
      sliderInput, 'input', this, this.onSliderChange_));

  return wrapper;
};

/**
 * Disposes of events belonging to the slider editor.
 * @private
 */
Blockly.FieldSlider.prototype.dropdownDispose_ = function() {
  for (var i = 0; i < this.boundEvents_.length; i++) {
    Blockly.unbindEvent_(this.boundEvents_[i]);
  }
  this.sliderInput_ = null;
};

/**
 * Sets the text to match the slider's position.
 * @private
 */
Blockly.FieldSlider.prototype.onSliderChange_ = function() {
  var fixed = Math.pow(10, this.decimalPlaces_ || 0);
  var value = Math.floor(this.sliderInput_.value * fixed) / fixed;
  this.setEditorValue_(value);
};

/**
 * Updates the slider when the field rerenders.
 * @private
 */
Blockly.FieldSlider.prototype.updateSlider_ = function() {
  if (!this.sliderInput_) {
    return;
  }
  var value = Math.min(Math.max(this.getValue(), this.min_), this.max_);
  this.sliderInput_.setAttribute('value', value);
};


/**
 * CSS for slider field.
 */
Blockly.Css.register([
  /* eslint-disable indent */
  '.fieldSliderContainer {',
  '  align-items: center;',
  '  display: inline;',
  '  justify-content: center;',
  '  width: 100%;',
  '}',
  '.fieldSlider {',
  '  -webkit-appearance: none;',
  '  background: transparent;',
  '  margin: 4px;',
  '  padding: 0;',
  '}',
  '.fieldSlider:focus {',
  '  outline: none;',
  '}',

  /* Webkit */
  '.fieldSlider::-webkit-slider-runnable-track {',
  '  background: #ddd;',
  '  border-radius: 10px;',
  '}',
  '.fieldSlider::-webkit-slider-thumb {',
  '  -webkit-appearance: none;',
  '  background: #fff;',
  '  border: none;',
  '  border-radius: 50%;',
  '  box-shadow: 0 0 0 4px #fefefe;',
  '  cursor: pointer;',
  '  height: 12px;',
  '  width: 12px;',
  '}',

  /* Firefox */
  '.fieldSlider::-moz-range-track {',
  '  background: #ddd;',
  '  border-radius: 10px;',
  '}',
  '.fieldSlider::-moz-range-thumb {',
  '  background: #fff;',
  '  border: none;',
  '  border-radius: 50%;',
  '  box-shadow: 0 0 0 4px #fefefe;',
  '  cursor: pointer;',
  '  height: 12px;',
  '  width: 12px;',
  '}',
  '.fieldSlider::-moz-focus-outer {',
  '  /* override the focus border style */',
  '  border: 0;',
  '}',

  /* IE */
  '.fieldSlider::-ms-track {',
  '  /* IE wont let the thumb overflow the track, so fake it */',
  '  background: transparent;',
  '  border-color: transparent;',
  '  border-width: 15px 0;',
  '  /* remove default tick marks */',
  '  color: transparent;',
  '  height: 10px;',
  '  width: 100%;',
  '  margin: -4px 0;',
  '}',
  '.fieldSlider::-ms-fill-lower  {',
  '  background: #ddd;',
  '  border-radius: 10px;',
  '}',
  '.fieldSlider::-ms-fill-upper  {',
  '  background: #ddd;',
  '  border-radius: 10px;',
  '}',
  '.fieldSlider::-ms-thumb {',
  '  background: #fff;',
  '  border: none;',
  '  border-radius: 50%;',
  '  box-shadow: 0 0 0 4px #fefefe;',
  '  cursor: pointer;',
  '  height: 12px;',
  '  width: 12px;',
  '}'
  /* eslint-enable indent */
]);

Blockly.fieldRegistry.register('field_slider', Blockly.FieldSlider);

Blockly.defineBlocksWithJsonArray([// BEGIN JSON EXTRACT
// Block for numeric value.
  {
    "type": "math_slider",
    "message0": "%1",
    "args0": [{
      "type": "field_slider",
      "name": "NUM",
      "value": 0
    }],
    "output": "Number",
    "helpUrl": "%{BKY_MATH_NUMBER_HELPURL}",
    "style": "math_blocks",
    "tooltip": "%{BKY_MATH_NUMBER_TOOLTIP}",
    "extensions": ["parent_tooltip_when_inline"]
  }
]);
