/* global $ */

import Ember from 'ember';
import config from '../../config/environment';

export default Ember.View.extend({
    templateName: 'design/checkout-shipping-details',
    classNames: 'checkout-shipping-details',

    showErrorFieldTooltip: function () {
        Ember.run.later(function () {
            if (this.$() && typeof this.$().find === 'function') {
                this.$().find('form .has-error input').first().focus();
            }
        }.bind(this), 200);
    }.observes('parentView.controller.hasInputErrors'),

    checkMinimumShippingCost () {
        var euroPrice;

        if (this.get('controller.controllers.design/checkout.discountCode')) {
            euroPrice = this.get('controller.controllers.design.model.euroDiscountedBasePrice');
        } else {
            euroPrice = this.get('controller.controllers.design.model.euroPrice');
        }
        return euroPrice < config.APP.minimum_shipping_cost;
    },

    setToastr: function () {
        if (this.checkMinimumShippingCost()) {
            var msg = this.get('controller.tooltipString');

            this.get('controller.controllers.application').send(
                'toast',
                msg,
                'warning',
                'toast-above-free-shipping',
                true
            );
        } else {
            this.hideToastr();
        }
    }.observes('controller.controllers.design.model.euroPrice'),

    hideToastr () {
        $('.toast-above-free-shipping button').click();
    },

    didInsertElement: function () {
        //workaround for phoneNumber
        this.$phoneNumber = $('[data-name="phoneNumber"]');
        this.$phoneNumber.on('blur', () => {
            this.set('controller.onBlurValidations.phoneNumber', true);
        });

        this.setToastr();
    },

    willDestroyElement: function () {
        this.hideToastr();

        this.$phoneNumber.off('blur');
    }
});
