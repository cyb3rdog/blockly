/**
 * @license
 * Copyright 2020 cyb3rdog
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Time input field.
 * @author cyb3rdog
 */

'use strict';

goog.provide('Blockly.FieldTime');
goog.provide('Blockly.TimePicker');

goog.require('Blockly.Css');
goog.require('Blockly.Events');
goog.require('Blockly.Field');
goog.require('Blockly.fieldRegistry');


/**
 * Class for a timeinput field.
 * @param {string=} opt_value The initial value of the field. Should be in
 *    'YYYY-MM-DD' format. Defaults to the current time.
 * @param {Function=} opt_validator A function that is called to valitime
 *    changes to the field's value. Takes in a time string & returns a
 *    valitimed time string ('YYYY-MM-DD' format), or null to abort the change.
 * @param {?(boolean|string)=} opt_config .
 * @extends {Blockly.Field}
 * @constructor
 */
Blockly.FieldTime = function(opt_value, opt_validator, opt_config) {

  /**
   * The HTML Clock canvas element.
   * @type {?Blockly.TimePicker}
   * @private
   */
  this.timeInput_ = null;

  this.clockSize_ = opt_config['clockSize'];
  this.clockIsNow_ = opt_config['isNow'] == true || opt_config['isNow'] == 'true';
  this.use12Hours_ = opt_config['use12Hours'] == true || opt_config['use12Hours'] == 'true';
  this.hideSeconds_ = opt_config['hideSeconds'] == true || opt_config['hideSeconds'] == 'true';
  this.useDarkTheme_ = opt_config['useDarkTheme'] == true || opt_config['useDarkTheme'] == 'true';
  this.textEditEnabled_ = opt_config['textEdit'] == true || opt_config['textEdit'] == 'true';

  if (opt_config['time'] == 'NOW') {
    this.clockIsNow_ = true;
  }
  if (this.clockIsNow_) {
    this.textEditEnabled_ = false;
  }

  /**
   * The default value for this field (current time).
   * @type {*}
   * @protected
  */
  Blockly.FieldTime.prototype.DEFAULT_VALUE = this.hideSeconds_ ? "00:00" : "00:00:00";

  Blockly.FieldTime.superClass_.constructor.call(this, opt_value, opt_validator, opt_config);
};
Blockly.utils.object.inherits(Blockly.FieldTime, Blockly.FieldTextInput);

/**
 * Constructs a FieldTime from a JSON arg object.
 * @param {!Object} options A JSON object with options (time).
 * @return {!Blockly.FieldTime} The new field instance.
 * @package
 * @nocollapse
 */
Blockly.FieldTime.fromJson = function(options) {
  return new Blockly.FieldTime(options['time'], undefined, options);
};

/**
 * Serializable fields are saved by the XML renderer, non-serializable fields
 * are not. Editable fields should also be serializable.
 * @type {boolean}
 */
Blockly.FieldTime.prototype.SERIALIZABLE = true;

/**
 * Mouse cursor style when over the hotspot that initiates the editor.
 */
Blockly.FieldTime.prototype.CURSOR = 'text';

/**
 * Border colour for the dropdown div showing the time picker. Must be a CSS
 * string.
 * @type {string}
 * @private
 */
Blockly.FieldTime.prototype.DROPDOWN_BORDER_COLOUR = 'silver';

/**
 * Background colour for the dropdown div showing the time picker. Must be a
 * CSS string.
 * @type {string}
 * @private
 */
Blockly.FieldTime.prototype.DROPDOWN_BACKGROUND_COLOUR = 'white';

/**
 * Ensures that the input value is a valid time.
 * @param {*=} opt_newValue The input value.
 * @return {?string} A valid time, or null if invalid.
 * @protected
 */
Blockly.FieldTime.prototype.doClassValidation_ = function(opt_newValue) {
  if (!opt_newValue) {
    return null;
  }
  // Check if the new value is parsable or not.
  return opt_newValue;
};

/**
 * Shows the inline free-text editor on top of the text along with the time
 * editor.
 * @param {Event=} opt_e Optional mouse event that triggered the field to
 *     open, or undefined if triggered programmatically.
 * @param {boolean=} _opt_quietInput Quiet input.
 * @protected
 * @override
 */
Blockly.FieldTime.prototype.showEditor_ = function(opt_e, _opt_quietInput) {
  if (this.textEditEnabled_) {
    // Mobile browsers have issues with in-line textareas (focus & keyboards).
    var noFocus =
        Blockly.utils.userAgent.MOBILE ||
        Blockly.utils.userAgent.ANDROID ||
        Blockly.utils.userAgent.IPAD;

    Blockly.FieldTime.superClass_.showEditor_.call(this, opt_e, noFocus);
  }

  // Build the DOM.
  this.editor_ = this.dropdownCreate_();

  Blockly.DropDownDiv.getContentDiv().appendChild(this.editor_);
  Blockly.DropDownDiv.setColour(this.sourceBlock_.style.colourPrimary,
      this.sourceBlock_.style.colourTertiary);
  Blockly.DropDownDiv.showPositionedByField(this, this.dropdownDispose_.bind(this));
};

/**
 * Renders the field. If the picker is shown make sure it has the current
 * time selected.
 * @protected
 */
Blockly.FieldTime.prototype.render_ = function() {
  Blockly.FieldTime.superClass_.render_.call(this);
  this.updateTimeEditor_();
};

/**
 * Creates the time dropdown editor.
 * @return {!Blockly.TimePicker} The newly created time picker.
 * @private
 */
Blockly.FieldTime.prototype.dropdownCreate_ = function() {
  var wrapper = document.createElement('div');
  wrapper.className = 'fieldTimeContainer';

  var timeInput = new Blockly.TimePicker(this.clockIsNow_,
      !this.use12Hours_, !this.hideSeconds_, !this.useDarkTheme_, this.clockSize_);
  wrapper.appendChild(timeInput.getElement());
  this.timeInput_ = timeInput;
  this.timeInput_.onUpdate = this.onTimeChange_.bind(this);
  this.timeInput_.showClock();
  if (!this.clockIsNow_) {
    this.updateTimeEditor_();
    this.setEditorValue_(this.timeInput_.getTimeString());
  }
  return wrapper;
};

/**
 * Disposes of events belonging to the time editor.
 * @private
 */
Blockly.FieldTime.prototype.dropdownDispose_ = function() {
  this.timeInput_.onUpdate = null;
  this.timeInput_.destroy();
  this.timeInput_ = null;
};

/**
 * Sets the text to match the time.
 * @param {String=} time Time string updated from TimePicker
 * @private
 */
Blockly.FieldTime.prototype.onTimeChange_ = function(time) {
  this.setEditorValue_(time);
};

/**
 * Updates the time when the field rerenders.
 * @private
 */
Blockly.FieldTime.prototype.updateTimeEditor_ = function() {
  if (!this.timeInput_ || this.timeInput_.clockIsNow_) {
    return;
  }
  var timeString = this.getValue();
  if (timeString.length == 3 && timeString.substr(2,1) != ':') {
    this.setEditorValue_(timeString.substr(0,2) + ':' + timeString.substr(2,1));
  }
  if (timeString.length == 6 && timeString.substr(5,1) != ':') {
    this.setEditorValue_(timeString.substr(0,5) + ':' + timeString.substr(5,1));
  }

  timeString = this.getValue().replaceAll(':', '');
  if (timeString.length >= 2) {
    this.timeInput_.setHours(timeString.substr(0,2));
  }
  if (timeString.length >= 4) {
    this.timeInput_.setMinutes(timeString.substr(2,2));
  }
  if (timeString.length >= 6) {
    this.timeInput_.setSeconds(timeString.substr(4,2));
  }
};

/**
 * CSS for time picker. See css.js for use.
 */
Blockly.Css.register([
  /* eslint-disable indent */
  '.fieldTimeContainer {',
  '  align-items: center;',
  '  display: inline;',
  '  justify-content: center;',
  '  width: 100%;',
  '}',
  '.fieldTime {',
  '  -webkit-appearance: none;',
  '  background: transparent;',
  '  margin: 4px;',
  '  padding: 0;',
  '}'
  /* eslint-enable indent */
]);

Blockly.fieldRegistry.register('field_time', Blockly.FieldTime);

Blockly.defineBlocksWithJsonArray([// BEGIN JSON EXTRACT
// Block for time value.
  {
    "type": "time",
    "message0": "%1",
    "args0": [{
      "type": "field_time",
      "time": "00:00",
      "textEdit": true,
      "hideSeconds": true,
      "useDarkTheme": false,
      "clockSize": 180
    }],
    "output": "String",
    "style": "math_blocks",
    /*
    "helpUrl": "%{BKY_MATH_NUMBER_HELPURL}",
    "tooltip": "%{BKY_MATH_NUMBER_TOOLTIP}",
    */
    "extensions": ["parent_tooltip_when_inline"]
  }
]);

Blockly.TimePicker = function(isClock, is24H, showSecods, isLight, clockSize,
    clockFont, hour, minute, second) {

  this.isClock = !!isClock;
  this.is24H = !!is24H;
  this.showSecods = !!showSecods;
  this.isLight = !!isLight;
  this.hour = hour == undefined ? Blockly.TimePicker.getHours() : ~~hour % 24;
  this.minute = minute == undefined ? Blockly.TimePicker.getMinutes() : ~~minute % 60;
  this.second = second == undefined ? Blockly.TimePicker.getSeconds() : ~~second % 60;
  if (!this.isClock && !this.showSecods) {
    this.second = 0;
  }

  this.clockSize = (clockSize) ? clockSize : 180;
  this.clockFont = (clockFont) ? clockFont : '16px Verdana';
  this.clockDiv = document.createElement('div');
  this.clockDiv.className = 'fieldTime';
  this.clockCanvas = document.createElement('canvas');
  this.clockCanvas.className = 'fieldTimeCanvas';
  this.hourHand = document.createElement('canvas');
  this.hourHand.className = 'fieldTimeHourCanvas';
  this.minuteHand = document.createElement('canvas');
  this.minuteHand.className = 'fieldTimeMinuteCanvas';
  this.secondHand = document.createElement('canvas');
  this.secondHand.className = 'fieldTimeSecondCanvas';
  this.isHidden = true;
  this.isPM = hour >= 12;
  this.isHourHand = false;
  this.isReverseRotate = false;
  this.isDragging = false;
  this.isFiredByMouse = false;
  this.touchId = null;
  this.lastHourDeg = 0;
  this.lastMinuteDeg = 0;
  this.centerX = 0;
  this.centerY = 0;
  this.cssTransform = Blockly.TimePicker.getSupportedTransformProp();
  this.timerId = null;

  if (!this.cssTransform) {
    this.destroy();
    alert("Sorry, your browser doesn't support CSS transform!");
    return;
  }
  if (!this.clockCanvas.getContext) {
    this.destroy();
    alert("Sorry, your browser doesn't support HTML canvas!");
    return;
  }
  this.createDOM();
};

Blockly.TimePicker.prototype.onUpdate = null;

Blockly.TimePicker.prototype.createDOM = function() {
  // Initialize
  var halfSize = this.clockSize / 2;
  this.clockCanvas.setAttribute('width', this.clockSize);
  this.clockCanvas.setAttribute('height', this.clockSize);
  this.hourHand.setAttribute('width', 20);
  this.hourHand.setAttribute('height', halfSize);
  this.minuteHand.setAttribute('width', 12);
  this.minuteHand.setAttribute('height', halfSize);
  this.secondHand.setAttribute('width', 8);
  this.secondHand.setAttribute('height', halfSize);
  this.clockDiv.style.cssText = 'position:relative;width:' + this.clockSize + 'px';
  this.clockCanvas.style.cssText = 'position:absolute;left:0px;top:0px';
  this.hourHand.style.cssText = 'position:absolute;left:' + (halfSize - 10) + 'px;top:' + (halfSize / 4) + 'px;transform-origin:50% ' + (halfSize - 20) + 'px';
  this.minuteHand.style.cssText = 'position:absolute;left:' + (halfSize - 6) + 'px;top:' + (halfSize / 8) + 'px;transform-origin:50% ' + (halfSize - 10) + 'px';
  this.secondHand.style.cssText = 'position:absolute;left:' + (halfSize - 4) + 'px;top:' + (halfSize / 8) + 'px;transform-origin:50% ' + (halfSize - 10) + 'px';
  this.clockDiv.style.display = 'none';
  this.clockDiv.appendChild(this.clockCanvas);
  this.clockDiv.appendChild(this.hourHand);
  this.clockDiv.appendChild(this.minuteHand);
  this.clockDiv.appendChild(this.secondHand);
  this.clockDiv.style.height = this.clockSize + 'px';
  if (this.isClock) {
    this.drawClockTime();
  } else {
    this.bindClockEvents();
    Blockly.TimePicker.setCursor(this.hourHand, true);
    Blockly.TimePicker.setCursor(this.minuteHand, true);
    if (this.showSecods) {
      Blockly.TimePicker.setCursor(this.secondHand, true);
    } else {
      this.secondHand.style.display = 'none';
    }
  }
  this.updateClock();
  this.onUpdateTime();
  this.drawClock();
};

Blockly.TimePicker.prototype.drawClock = function() {
  // Create clock surface
  var halfSize = this.clockSize / 2;
  var ctx = this.clockCanvas.getContext('2d');
  ctx.strokeStyle = this.isLight ? '#000' : '#fff';
  ctx.beginPath();
  ctx.arc(halfSize, halfSize, halfSize - 1, 0, 2 * Math.PI);
  ctx.stroke();
  var radGrd = ctx.createRadialGradient(halfSize, halfSize, 1, halfSize, halfSize, halfSize);
  radGrd.addColorStop(0, this.isLight ? '#e7e7e7' : '#000');
  radGrd.addColorStop(1, this.isLight ? '#fff' : '#171717');
  ctx.fillStyle = radGrd;
  ctx.beginPath();
  ctx.arc(halfSize, halfSize, halfSize - 2, 0, 2 * Math.PI);
  ctx.fill();
  ctx.translate(halfSize, halfSize);
  ctx.fillStyle = this.isLight ? '#000' : '#fff';
  for (var i = 0; i < 12; i++) {
    ctx.beginPath();
    ctx.arc(0, -halfSize + halfSize / 10, 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.rotate(Math.PI / 30);
    for (var j = 0; j < 4; j++) {
      ctx.beginPath();
      ctx.arc(0, -halfSize + halfSize / 10, 1, 0, 2 * Math.PI);
      ctx.fill();
      ctx.rotate(Math.PI / 30);
    }
  }
  ctx.translate(0, 2);
  ctx.font = this.clockFont;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (var i = 1; i <= 12; i++) {
    ctx.fillText(i, 0.74 * halfSize * Math.sin(i * Math.PI / 6), -0.74 * halfSize *
        Math.cos(i * Math.PI / 6));
  }
  ctx.translate(-halfSize, -halfSize);

  // Create hour hand
  ctx = this.hourHand.getContext('2d');
  ctx.fillStyle = this.isLight ? '#000' : '#2196F3';
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(0, halfSize - 10);
  ctx.lineTo(20, halfSize - 10);
  ctx.lineTo(10, 0);
  ctx.fill();

  // Create minute hand
  ctx = this.minuteHand.getContext('2d');
  ctx.fillStyle = this.isLight ? '#7f7f7f' : '#ffeb3b';
  ctx.beginPath();
  ctx.moveTo(6, 0);
  ctx.lineTo(0, halfSize);
  ctx.lineTo(12, halfSize);
  ctx.lineTo(6, 0);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(6, halfSize - 10, 2, 0, 2 * Math.PI);
  ctx.fill();

  // Create second hand
  ctx = this.secondHand.getContext('2d');
  ctx.fillStyle = '#f44336';
  ctx.beginPath();
  ctx.moveTo(4, 0);
  ctx.lineTo(0, halfSize);
  ctx.lineTo(8, halfSize);
  ctx.lineTo(4, 0);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(4, halfSize - 10, 2, 0, 2 * Math.PI);
  ctx.fill();
};

Blockly.TimePicker.prototype.onMouseDown = function(e) {
  if (!this.isDragging) {
    e = e || window.event;
    e.preventDefault();
    e.stopPropagation();
    this.isFiredByMouse = true;
    this.isHourHand = e.target == this.hourHand;
    this.onPtrStart(e.pageX, e.pageY);
  }
};
Blockly.TimePicker.prototype.onMouseMove = function(e) {
  if (this.isDragging && this.isFiredByMouse) {
    e = e || window.event;
    e.preventDefault();
    this.onPtrMove(e.pageX, e.pageY);
  }
};
Blockly.TimePicker.prototype.onMouseUp = function(e) {
  if (this.isDragging && this.isFiredByMouse) {
    e = e || window.event;
    e.preventDefault();
    this.isDragging = false;
  }
};
Blockly.TimePicker.prototype.onTouchStart = function(e) {
  e = e || window.event;
  if (this.isDragging && !this.isFiredByMouse && e.touches.length == 1) {
    this.isDragging = false;
  }
  if (!this.isDragging) {
    var touch = e.changedTouches[0];
    e.preventDefault();
    this.isFiredByMouse = false;
    this.touchId = touch.identifier;
    this.isHourHand = touch.target == this.hourHand;
    this.onPtrStart(touch.pageX, touch.pageY);
  }
};
Blockly.TimePicker.prototype.onTouchMove = function(e) {
  if (this.isDragging && !this.isFiredByMouse) {
    e = e || window.event;
    var touches = e.changedTouches, touch;
    for (var i = 0; i < touches.length; i++) {
      touch = touches[i];
      if (touch.identifier == this.touchId) {
        e.preventDefault();
        this.onPtrMove(touch.pageX, touch.pageY);
        break;
      }
    }
  }
};
Blockly.TimePicker.prototype.onTouchEnd = function(e) {
  if (this.isDragging && !this.isFiredByMouse) {
    e = e || window.event;
    var touches = e.changedTouches, touch;
    for (var i = 0; i < touches.length; i++) {
      touch = touches[i];
      if (touch.identifier == this.touchId) {
        e.preventDefault();
        this.isDragging = false;
        return;
      }
    }
  }
};
Blockly.TimePicker.prototype.onPtrStart = function(x, y) {
  this.isDragging = true;
  var offsetElement = this.clockDiv.parentElement.parentElement.parentElement;
  this.centerX = offsetElement.offsetLeft + this.hourHand.offsetLeft + 10;
  this.centerY = offsetElement.offsetTop + this.hourHand.offsetTop + 70;
  var last = this.isHourHand ? this.lastHourDeg : this.lastMinuteDeg
    , deg = -Math.atan2(this.centerX - x, this.centerY - y) * 180 / Math.PI
    , dif = Math.abs(deg - last);
  this.isReverseRotate = (160 < dif && dif < 200);
};
Blockly.TimePicker.prototype.onPtrMove = function(x, y) {
  var deg, target;
  if (x != this.centerX || y != this.centerY) {
    deg = -Math.atan2(this.centerX - x, this.centerY - y) * 180 / Math.PI;
    if (this.isReverseRotate) { deg = deg - 180; }
    if (deg < 0) { deg += 360; }
    target = this.isHourHand ? this.hourHand : this.minuteHand;
    this.rotateElement(target, deg);
    if (this.isHourHand) {
      if ((0 <= deg && deg < 90 && 270 < this.lastHourDeg && this.lastHourDeg < 360) ||
          (0 <= this.lastHourDeg && this.lastHourDeg < 90 && 270 < deg && deg < 360)) {
        this.isPM = !this.isPM;
      }
      this.lastHourDeg = deg;
      this.lastMinuteDeg = deg % 30 * 12;
      this.rotateElement(this.minuteHand, this.lastMinuteDeg);
    } else {
      if ((270 < this.lastMinuteDeg && this.lastMinuteDeg < 360 && 0 <= deg && deg < 90) ||
         (270 < deg && deg < 360 && 0 <= this.lastMinuteDeg && this.lastMinuteDeg < 90)) {
        this.lastHourDeg = this.lastHourDeg + (deg - this.lastMinuteDeg -
            Blockly.TimePicker.sign(deg - this.lastMinuteDeg) * 360) / 12;
        if (this.lastHourDeg < 0) { this.lastHourDeg += 360; }
        this.lastHourDeg %= 360;
        if (345 < this.lastHourDeg || this.lastHourDeg < 15) {
          this.isPM = !this.isPM;
        }
      } else {
        this.lastHourDeg = this.lastHourDeg + (deg - this.lastMinuteDeg) / 12;
        if (this.lastHourDeg < 0) { this.lastHourDeg += 360; }
        this.lastHourDeg %= 360;
      }
      this.lastMinuteDeg = deg;
      this.rotateElement(this.hourHand, this.lastHourDeg);
    }
    this.minute = 6 * this.lastHourDeg / 180;
    this.hour = ~~this.minute;
    this.minute = Math.floor((this.minute - this.hour) * 60);
    if (this.isPM) { this.hour += 12; }
    this.onUpdateTime();
  }
};
Blockly.TimePicker.prototype.onUpdateTime = function() {
  if (typeof this.onUpdate == 'function' && !this.isClock) {
    this.onUpdate(this.getTimeString());
  }
};
Blockly.TimePicker.prototype.drawClockTime = function() {
  this.second = Blockly.TimePicker.getSeconds();
  if (this.isClock) {
    this.timerId = setTimeout(this.drawClockTime.bind(this), 1e3 - Blockly.TimePicker.getMillis());
  }
  if (this.second == 0) {
    this.minute = Blockly.TimePicker.getMinutes();
    this.hour = Blockly.TimePicker.getHours();
    this.onUpdateTime();
  }
  this.updateClock();
};
Blockly.TimePicker.prototype.updateClock = function() {
  var sec = this.second * 6;
  this.lastMinuteDeg = (this.minute + sec / 360) * 6;
  this.lastHourDeg = (this.hour % 12 + this.lastMinuteDeg / 360) * 30;
  this.rotateElement(this.hourHand, this.lastHourDeg);
  this.rotateElement(this.minuteHand, this.lastMinuteDeg);
  this.rotateElement(this.secondHand, sec);
};
Blockly.TimePicker.prototype.rotateElement = function(element, degrees) {
  element.style[this.cssTransform] = 'rotate(' + degrees + 'deg)';
};
Blockly.TimePicker.prototype.scrollToFix = function() {
  var dw = document.body.offsetWidth
    , vw = window.innerWidth
    , vh = window.innerHeight
    , rect = this.clockDiv.getBoundingClientRect()
    , hsSpc = dw > vw ? 20 : 0
    , scrollX = rect.left < 0 ? rect.left : 0
    , scrollY = (rect.bottom - rect.top > vh) ? rect.top : (rect.bottom > vh - hsSpc) ?
        rect.bottom - vh + hsSpc : 0;
  window.scrollBy(scrollX, scrollY);
};
Blockly.TimePicker.prototype.bindClockEvents = function() {
  Blockly.TimePicker.addEvent(this.hourHand, 'mousedown', this, this.onMouseDown);
  Blockly.TimePicker.addEvent(this.minuteHand, 'mousedown', this, this.onMouseDown);
  Blockly.TimePicker.addEvent(document, 'mousemove', this, this.onMouseMove);
  Blockly.TimePicker.addEvent(document, 'mouseup', this, this.onMouseUp);
  if ('touchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0) {
    Blockly.TimePicker.addEvent(this.hourHand, 'touchstart', this, this.onTouchStart);
    Blockly.TimePicker.addEvent(this.hourHand, 'touchmove', this, this.onTouchMove);
    Blockly.TimePicker.addEvent(this.hourHand, 'touchcancel', this, this.onTouchEnd);
    Blockly.TimePicker.addEvent(this.hourHand, 'touchend', this, this.onTouchEnd);
    Blockly.TimePicker.addEvent(this.minuteHand, 'touchstart', this, this.onTouchStart);
    Blockly.TimePicker.addEvent(this.minuteHand, 'touchmove', this, this.onTouchMove);
    Blockly.TimePicker.addEvent(this.minuteHand, 'touchcancel', this, this.onTouchEnd);
    Blockly.TimePicker.addEvent(this.minuteHand, 'touchend', this, this.onTouchEnd);
  }
};
Blockly.TimePicker.prototype.unbindClockEvents = function() {
  Blockly.TimePicker.removeEvent(this.hourHand, 'mousedown', this.onMouseDown);
  Blockly.TimePicker.removeEvent(this.minuteHand, 'mousedown', this.onMouseDown);
  Blockly.TimePicker.removeEvent(document, 'mousemove', this.onMouseMove);
  Blockly.TimePicker.removeEvent(document, 'mouseup', this.onMouseUp);
  if ('touchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0) {
    Blockly.TimePicker.removeEvent(this.hourHand, 'touchstart', this.onTouchStart);
    Blockly.TimePicker.removeEvent(this.hourHand, 'touchmove', this.onTouchMove);
    Blockly.TimePicker.removeEvent(this.hourHand, 'touchcancel', this.onTouchEnd);
    Blockly.TimePicker.removeEvent(this.hourHand, 'touchend', this.onTouchEnd);
    Blockly.TimePicker.removeEvent(this.minuteHand, 'touchstart', this.onTouchStart);
    Blockly.TimePicker.removeEvent(this.minuteHand, 'touchmove', this.onTouchMove);
    Blockly.TimePicker.removeEvent(this.minuteHand, 'touchcancel', this.onTouchEnd);
    Blockly.TimePicker.removeEvent(this.minuteHand, 'touchend', this.onTouchEnd);
  }
};

Blockly.TimePicker.prototype.destroy = function() {
  this.unbindClockEvents();
  while (this.clockDiv.firstChild) {
    this.clockDiv.removeChild(this.clockDiv.lastChild);
  }
  if (this.clockDiv.parentNode) {
    this.clockDiv.parentNode.removeChild(this.clockDiv);
  }
};
Blockly.TimePicker.prototype.getElement = function() {
  return this.clockDiv;
};
Blockly.TimePicker.prototype.getHours = function() {
  return this.hour;
};
Blockly.TimePicker.prototype.getMinutes = function() {
  return this.minute;
};
Blockly.TimePicker.prototype.getTime = function() {
  return this.hour * 36e5 + this.minute * 6e4;
};
Blockly.TimePicker.prototype.getTimeString = function() {
  var result = ('0' + (this.is24H ? this.hour : this.hour % 12 == 0 ? 12 : this.hour % 12)).slice(-2) + ':' + ('0' + this.minute).slice(-2);
  if (this.showSecods) { result += ':' + ('0' + this.second).slice(-2); }
  if (!this.is24H) {
    result += ' ' + (this.isPM ? 'PM' : 'AM');
  }
  return result;
};
Blockly.TimePicker.prototype.hideClock = function() {
  if (!this.isHidden) {
    this.isHidden = !this.isHidden;
    this.clockDiv.style.display = 'none';
  }
};
Blockly.TimePicker.prototype.is24Hour = function() {
  return this.is24H;
};
Blockly.TimePicker.prototype.isClockMode = function() {
  return this.isClock;
};
Blockly.TimePicker.prototype.isHidden = function() {
  return this.isHidden;
};
Blockly.TimePicker.prototype.isLightTheme = function() {
  return this.isLight;
};
Blockly.TimePicker.prototype.set24Hour = function(h) {
  if (typeof h == 'boolean' && h != this.is24H) {
    this.is24H = h;
    this.onUpdateTime();
  }
};
Blockly.TimePicker.prototype.setClockMode = function(m) {
  if (typeof m == 'boolean' && m != this.isClock) {
    this.isClock = m;
    Blockly.TimePicker.setCursor(this.hourHand, !this.isClock);
    Blockly.TimePicker.setCursor(this.minuteHand, !this.isClock);
    this.secondHand.style.display = this.isClock ? '' : 'none';
    if (this.isClock) {
      this.unbindClockEvents();
      this.hour = Blockly.TimePicker.getHours();
      this.minute = Blockly.TimePicker.getMinutes();
      this.drawClockTime();
      /* this.onUpdateTime(); */
    } else {
      this.second = 0;
      window.clearInterval(this.timerId);
      this.bindClockEvents();
    }
  }
};
Blockly.TimePicker.prototype.setHours = function(h) {
  if (!this.isClock && !isNaN(h)) {
    this.hour = parseInt(h) % 24;
    if (!this.showSecods) { this.second = 0; }
    this.updateClock();
    /* this.onUpdateTime(); */
  }
};
Blockly.TimePicker.prototype.setLightTheme = function(t) {
  if (typeof t == 'boolean' && t != this.isLight) {
    this.isLight = t;
    this.drawClock();
  }
};
Blockly.TimePicker.prototype.setMinutes = function(m) {
  if (!this.isClock && !isNaN(m)) {
    this.minute = parseInt(m) % 60;
    if (!this.showSecods) { this.second = 0; }
    this.updateClock();
    /* this.onUpdateTime(); */
  }
};
Blockly.TimePicker.prototype.setSeconds = function(s) {
  if (!this.isClock && !isNaN(s)) {
    this.second = parseInt(s) % 60;
    if (!this.showSecods) { this.second = 0; }
    this.updateClock();
    /* this.onUpdateTime(); */
  }
};
Blockly.TimePicker.prototype.showClock = function() {
  if (typeof this.clockDiv.parentNode == 'undefined') {
    alert("TimePicker element hasn't attached yet!");
    return;
  }
  if (this.isHidden) {
    this.isHidden = !this.isHidden;
    this.clockDiv.style.display = '';
    this.scrollToFix();
  }
};

/* Static Methods */
Blockly.TimePicker.addEvent = function(element, event, instance, callback) {
  if (window.addEventListener) {
    element.addEventListener(event, callback.bind(instance));
  } else {
    element.attachEvent('on' + event, callback.bind(instance));
  }
};
Blockly.TimePicker.removeEvent = function(el, ev, cb) {
  if (window.addEventListener) {
    el.removeEventListener(ev, cb);
  } else {
    el.detachEvent('on' + ev, cb);
  }
};
Blockly.TimePicker.setCursor = function(e, p) {
  e.style.cursor = p ? 'pointer' : 'default';
};
Blockly.TimePicker.getSupportedTransformProp = function() {
  var props = ['transform', 'MozTransform', 'WebkitTransform', 'msTransform', 'OTransform']
    , root = document.documentElement;
  for (var i = 0; i < props.length; i++) {
    if (props[i] in root.style) {
      return props[i];
    }
  }
  return null;
};
Blockly.TimePicker.tzOffset = Date.parse('01 Jan 1970');
Blockly.TimePicker.getTime = function() {
  return (Date.now() - Blockly.TimePicker.tzOffset) % 864e5;
};
Blockly.TimePicker.getHours = function() {
  return parseInt(Blockly.TimePicker.getTime() / 36e5);
};
Blockly.TimePicker.getMinutes = function() {
  return parseInt(Blockly.TimePicker.getTime() / 6e4) % 60;
};
Blockly.TimePicker.getSeconds = function() {
  return parseInt(Blockly.TimePicker.getTime() / 1e3) % 60;
};
Blockly.TimePicker.getMillis = function() {
  return Blockly.TimePicker.getTime() % 1e3;
};
Blockly.TimePicker.sign = function(n) {
  if (isNaN(n)) { return NaN; }
  if (n == 0) { return 0; }
  if (n < 0) { return -1; }
  return 1;
};
