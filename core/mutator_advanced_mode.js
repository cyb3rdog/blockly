/**
 * @license
 * Copyright 2021 cyb3rdog
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Advanced-Mode Mutator.
 * @author cyb3rdog
 */
'use strict';


goog.provide('Blockly.Cyb3rBlocks');
goog.provide('Blockly.Cyb3rBlocks.AdvancedMutator');

goog.require('Blockly.Css');
goog.require('Blockly.Events');
goog.require('Blockly.Events.BlockChange');
goog.require('Blockly.Events.BubbleOpen');
goog.require('Blockly.Extensions');
goog.require('Blockly.Icon');
goog.require('Blockly.Mutator');
goog.require('Blockly.navigation');
goog.require('Blockly.registry');
goog.require('Blockly.utils');
goog.require('Blockly.utils.dom');
goog.require('Blockly.utils.global');
goog.require('Blockly.utils.object');
goog.require('Blockly.utils.Svg');
goog.require('Blockly.utils.toolbox');
goog.require('Blockly.utils.xml');
goog.require('Blockly.WorkspaceSvg');
goog.require('Blockly.Xml');


/**
 * Class for a mutator dialog.
 * @param {boolean} defaultMode A default mode for construction
 * @extends {Blockly.Icon}
 * @constructor
 */
Blockly.Cyb3rBlocks.AdvancedMutator = function(defaultMode) {
  Blockly.Cyb3rBlocks.AdvancedMutator.superClass_.constructor.call(this, null); // null

  this.SIZE = 30;
  this.defaultMode_ = (defaultMode == true || defaultMode == "true");
  this.iconGroup_ = null;
  this.onButton_ = null;
  this.offButton_ = null;
};
Blockly.utils.object.inherits(Blockly.Cyb3rBlocks.AdvancedMutator, Blockly.Icon);

/**
 * Dispose of this mutator.
 */
Blockly.Cyb3rBlocks.AdvancedMutator.prototype.dispose = function() {
  this.block_.mutator = null;
  Blockly.Icon.prototype.dispose.call(this);
};

/**
 * Set the block this mutator is associated with.
 * @param {Blockly.BlockSvg} block The block associated with this mutator.
 * @package
 */
Blockly.Cyb3rBlocks.AdvancedMutator.prototype.setBlock = function(block) {
  this.block_ = block;
  // will be swapped back during the initial setVisible() call
  this.block_.advanced_mode = this.defaultMode_;
};

/**
 * Draw the mutator icon.
 * @param {!Element} group The icon group.
 * @protected
 */
Blockly.Cyb3rBlocks.AdvancedMutator.prototype.drawIcon_ = function(group) {
  if (this.block_.workspace.isDragging()) { return; }
  Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.PATH,
      {
        'class': 'advancedMutatorIcon',
        'transform': 'translate(-4, 1.5)',
        'd': 'M 20.171875 14.34375 L 5.828125 14.34375 C 2.621094 14.34375 0 11.117188 0 7.171875 C 0 3.226562 ' +
        '2.621094 0 5.828125 0 L 20.171875 0 C 23.378906 0 26 3.226562 26 7.171875 C 26 11.117188 23.378906 ' +
        '14.34375 20.171875 14.34375 Z M 20.171875 14.34375 '
      },
      group);

  this.onButton_ = Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.CIRCLE,
      {
        'class': 'advancedMutatorIconOn',
        'cx': '14', 'cy': '8.5', 'r': '5'
      },
      group);

  this.offButton_ = Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.CIRCLE,
      {
        'class': 'advancedMutatorIconOff',
        'cx': '4', 'cy': '8.5', 'r': '5'
      },
      group);

  this.onButton_.setAttribute('visibility', this.block_.advanced_mode ? 'visible' : 'hidden');
  this.offButton_.setAttribute('visibility', this.block_.advanced_mode ? 'hidden' : 'visible');
};

/**
 * Clicking on the icon toggles if the mutator bubble is visible.
 * Disable if block is uneditable.
 * @param {!Event} e Mouse click event.
 * @private
 * @override
 */
Blockly.Cyb3rBlocks.AdvancedMutator.prototype.iconClick_ = function(e) {
  if (this.block_.isEditable()) {
    Blockly.Icon.prototype.iconClick_.call(this, e);
  }
};

/**
 * Override to react to mutator icon click, performs the call of setAdvancedMode
 * @param {boolean} visible Does not matter.
 * @public
 * @override
 */
Blockly.Cyb3rBlocks.AdvancedMutator.prototype.setVisible = function(visible) {
  if (visible == this.isVisible()) {
    this.updateButton();
    return;
  }
  this.setAdvancedMode(!this.block_.advanced_mode);
  if (this.block_.rendered) {
    this.block_.render();
  }
};

/**
 * Toggles the Adnvanced Mode
 * @param {boolean} advanced True if the mode shoud be set to Advanced.
 */
Blockly.Cyb3rBlocks.AdvancedMutator.prototype.setAdvancedMode = function(advanced) {
  this.block_.advanced_mode = !!advanced;
  if (advanced) {
    if (this.block_.isCollapsed()) { return; }
    for (var i = 0; i < this.block_.inputList.length; i++) {
      var input = this.block_.inputList[i];
      input.setVisible(true);
    }
  } else {
    for (var i = 0; i < this.block_.inputList.length; i++) {
      var input = this.block_.inputList[i];
      if (input.advanced_mode) {
        input.setVisible(false);
      }
    }
  }
  this.updateButton();
};

/**
 * Updates the toggle button state
 */
Blockly.Cyb3rBlocks.AdvancedMutator.prototype.updateButton = function() {
  if (this.onButton_) { this.onButton_.setAttribute(
      'visibility', this.block_.advanced_mode ? 'visible' : 'hidden');
  }
  if (this.offButton_) { this.offButton_.setAttribute(
      'visibility', this.block_.advanced_mode ? 'hidden' : 'visible');
  }
};

/**
 * CSS for time picker. See css.js for use.
 */
Blockly.Css.register([
  /* eslint-disable indent */
  '.advancedMutatorIcon {',
  '  fill:#E7ECED;',
  '  display: block;',
  '  justify-content: center;',
  '  width: 100%;',
  '}',
  '.advancedMutatorIconOn {',
  '  fill:#88C057;',
  '  stroke:#659C35;',
  '  stroke-width:2;',
  '  stroke-linecap:round;',
  '  stroke-miterlimit:10;',
  '}',
  '.advancedMutatorIconOff {',
  '  fill:#BBBBBB;',   // '  fill:#ED7161;',
  '  stroke:#9F9F9F;', // '  stroke:#D75A4A;',
  '  stroke-width:2;',
  '  stroke-linecap:round;',
  '  stroke-miterlimit:10;',
  '}'
  /* eslint-enable indent */
]);

/**
 * Mixin for 'simple_mode_mutator' and 'advanced_mode_mutator' extensions.
 * @mixin
 * @augments Blockly.Block
 * @package
 */
Blockly.Cyb3rBlocks.ADVANCED_MODE_MUTATOR_MIXIN = {
  /**
   * Create XML to represent whether the block is in Advanced mode.
   * @return {!Element} XML storage element.
   * @this {Blockly.Block}
   */
  mutationToDom: function() {
    var container = Blockly.utils.xml.createElement('mutation');
    container.setAttribute('advanced_mode', !!this.advanced_mode);
    if (this.mutator instanceof Blockly.Cyb3rBlocks.AdvancedMutator) {
      this.mutator.setAdvancedMode(this.advanced_mode);
    } else {
      this.hideAdvancedInputs();
    }
    return container;
  },
  /**
   * Parse XML to restore the Advanced Mode state.
   * @param {!Element} xmlElement XML storage element.
   * @this {Blockly.Block}
   */
  domToMutation: function(xmlElement) {
    var advanced_mode = (xmlElement.getAttribute('advanced_mode'));
    this.advanced_mode = (advanced_mode == true || advanced_mode == "true");
    if (this.mutator instanceof Blockly.Cyb3rBlocks.AdvancedMutator) {
      this.mutator.setAdvancedMode(this.advanced_mode);
    } else {
      this.hideAdvancedInputs();
    }
  },
  /**
   * Hide all inputs marked as Advanced
   */
  hideAdvancedInputs: function() {
    for (var i = 0; i < this.inputList.length; i++) {
      var input = this.inputList[i];
      if (input.advanced_mode) {
        input.setVisible(false);
      }
    }
  }
};

/**
 * Mixin for collapsed state override of advanced mode enabled blocks
 * @mixin
 * @augments Blockly.Block
 * @package
 */
Blockly.Cyb3rBlocks.ADVANCED_MODE_OVERRIDE_MIXIN = {
  /**
   * Set whether the block is collapsed or not.
   * @param {boolean} collapsed True if collapsed.
   * @this {Blockly.Block}
   */
  setCollapsed: function(collapsed) {
    if (this.collapsed_ == collapsed) {
      return;
    }
    Blockly.BlockSvg.superClass_.setCollapsed.call(this, collapsed);
    if (!collapsed) {
      this.updateCollapsed_();
      if (this.mutator instanceof Blockly.Cyb3rBlocks.AdvancedMutator) {
        this.mutator.setAdvancedMode(this.advanced_mode);
      } else {
        this.hideAdvancedInputs();
      }
    }
    if (this.rendered) {
      this.render();
    }
  }
};


/**
 * 'advanced_mode_mutator' extension to the cyb3rblocks that can
 * update the block shape (hide or show inputs) based on whether
 * the block is or is not in "advanced mode".
 * @this {Blockly.Block}
 * @package
 */
Blockly.Cyb3rBlocks.ADVANCED_MODE_MUTATOR_EXTENSION = function() {
  this.setMutator(new Blockly.Cyb3rBlocks.AdvancedMutator(false));
  this.mixin(Blockly.Cyb3rBlocks.ADVANCED_MODE_OVERRIDE_MIXIN, true);
};

Blockly.Extensions.registerMutator('advanced_mode_mutator',
    Blockly.Cyb3rBlocks.ADVANCED_MODE_MUTATOR_MIXIN,
    Blockly.Cyb3rBlocks.ADVANCED_MODE_MUTATOR_EXTENSION,
    null);


/**
 * 'simple_mode_mutator' extension to the cyb3rblocks that can
 * update the block shape and hide all inputs marked as advanced.
 * @this {Blockly.Block}
 * @package
 */
Blockly.Cyb3rBlocks.SIMPLE_MODE_MUTATOR_EXTENSION = function() {
  this.mixin(Blockly.Cyb3rBlocks.ADVANCED_MODE_OVERRIDE_MIXIN, true);
};

Blockly.Extensions.registerMutator('simple_mode_mutator',
    Blockly.Cyb3rBlocks.ADVANCED_MODE_MUTATOR_MIXIN,
    Blockly.Cyb3rBlocks.SIMPLE_MODE_MUTATOR_EXTENSION);
