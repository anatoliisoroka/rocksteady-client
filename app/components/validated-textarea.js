import Ember from 'ember';
import config from '../config/environment';

export default Ember.TextArea.extend({
    beenFocused: false,
    valid: true,
    isValid: false,
    tagName: 'textarea',
    classNameBindings: ['valid::has-error', ':validated-input'],

    focusOut: function () {
        this.set('beenFocused', true);
    },

    didInsertElement(){
        this.attachTooltip();

        if (this.get('checkImmediate')) {
            let isValid = this.isTextValid(this.get('value'));
            this.set('isValid', isValid);
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

    onInputStateChange: function () {
        let isValid = this.isTextValid(this.get('value'));
        this.set('isValid', isValid);
        if (this.get('beenFocused')) {
            this.set('valid', isValid);
        }
    }.observes('value', 'beenFocused').on('changed'),

    isTextValid(text){
        return text.length > 0;
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
