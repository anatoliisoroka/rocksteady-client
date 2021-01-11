import Ember from 'ember';
import config from '../config/environment';

import EmberIntlTelInput from 'ember-intl-tel-input/components/intl-tel-input';

export default EmberIntlTelInput.extend({
    beenFocused: false,
    classNameBindings: ['valid::has-error', ':validated-input'],
    valid: true,
    isValid: Ember.computed.alias('isValidNumber'),

    focusOut: function () {
        this._super(arguments);
        this.set('beenFocused', true);
    },

    didInsertElement(){
        this._super(arguments);
        this.attachTooltip();

        if (this.get('checkImmediate')) {
            this.set('valid', this.get('isValid'));
        } else {
            this.set('valid', true);
        }

        //Autocomplete is disabled by the jquery plugin by default
        let autoComplete = (this.get('autocomplete') === 'off') ? 'off' : 'on';
        this.$().attr('autocomplete', autoComplete);
    },

    willDestroyElement(){
        this._super(arguments);
        this.removeTooltip();
    },

    validationChanged: function () {
        if (!this.get('isValid') && this.get('beenFocused')) {
            this.showTooltip();
        } else {
            this.hideTooltip();
        }
    }.observes('isValid'),

    onInputStateChange: function () {
        if (this.get('beenFocused')) {
            this.set('valid', this.get('isValid'));
        }
    }.observes('value', 'beenFocused').on('changed'),

    hasTooltip(){
        let tooltipsEnabled = config.APP.tooltips;
        let hasTooltip = (typeof this.get('tooltipMessage') !== 'undefined');
        return tooltipsEnabled && hasTooltip;
    },

    attachTooltip(){
        if (this.hasTooltip()) {
            this.$().tooltip({
                placement: 'top',
                title: this.get('tooltipMessage') || 'Please enter a',
                html: false,
                trigger: 'manual',
                template: '<div class="tooltip tooltip-error"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>'
            });
        }
    },

    removeTooltip(){
        if (this.hasTooltip()) {
            this.$().tooltip('destroy');
        }
    },

    showTooltip(){
        if (this.hasTooltip()) {
            this.$().tooltip('show');
        }
    },

    hideTooltip(){
        if (this.hasTooltip()) {
            this.$().tooltip('hide');
        }
    }
});
