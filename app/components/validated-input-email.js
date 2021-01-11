import Ember from 'ember';
import config from '../config/environment';

export default Ember.TextField.extend({
    beenFocused: false,
    valid: true,
    isEmailValid: false,
    tagName: 'input',
    classNameBindings: ['valid::has-error', ':validated-input'],

    focusOut: function () {
        this.set('beenFocused', true);
    },

    didInsertElement(){
        this.attachTooltip();

        if (this.get('checkImmediate')) {
            let isValid = this.isValidEmail(this.get('value'));
            this.set('isEmailValid', isValid);
            this.set('valid', isValid);
        }
    },

    willDestroyElement(){
        this.removeTooltip();
    },

    validationChanged: function () {
        if (!this.get('valid') && this.get('beenFocused')) {
            this.showTooltip();
        } else {
            this.hideTooltip();
        }
    }.observes('valid'),

    isValid: function () {
        let isEmailValid = this.isValidEmail(this.get('value'));
        this.set('isEmailValid', isEmailValid);
        if (this.get('beenFocused')) {
            this.set('valid', isEmailValid);
        }
    }.observes('value', 'beenFocused').on('changed'),

    isValidEmail(email){
        // emailregex.com
        let emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
        return emailRegex.test(email);
    },

    hasTooltip(){
        let tooltipsEnabled = config.APP.tooltips;
        let hasTooltip = (typeof this.get('tooltipMessage') !== 'undefined');
        return tooltipsEnabled && hasTooltip;
    },

    attachTooltip(){
        if (this.hasTooltip()) {
            this.$().tooltip({
                placement: 'top',
                title: this.get('tooltipMessage'),
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
