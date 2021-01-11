import Ember from 'ember';
import config from '../config/environment';

export default Ember.Component.extend({
    beenFocused: false,
    valid: true,
    max: null,
    min: null,

    focusIn: function () {
        this.set('beenFocused', true);
    },

    didInsertElement(){
        this.attachTooltip();
    },

    validationChanged: function () {
        if (!this.get('valid') && this.get('beenFocused')) {
            this.showTooltip();
        } else {
            this.hideTooltip();
        }
    }.observes('valid'),

    isValid: function (ev) {
        this.set('valid', this.isValidQuantity(ev.value));
    }.observes('value'),

    isValidQuantity(qty){
        if (qty.match(/^[0-9]*$/)) {
            let qtyNumber = parseInt(qty);
            if (qtyNumber <= this.get('max') && qtyNumber >= this.get('min')) {
                return true;
            }
        }
        return false;
    },

    attachTooltip(){
        if (config.APP.tooltips && this.$()) {
            this.$().tooltip({
                placement: 'top',
                title: this.get('message'),
                html: false,
                trigger: 'manual',
                template: '<div class="tooltip tooltip-error"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>'
            });
        }
    },

    showTooltip(){
        if (config.APP.tooltips && this.$()) {
            this.$().tooltip('show');
        }
    },

    hideTooltip(){
        if (config.APP.tooltips && this.$()) {
            this.$().tooltip('hide');
        }
    }
});
