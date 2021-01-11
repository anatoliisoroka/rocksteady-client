import Ember from 'ember';

export default Ember.View.extend({
    templateName: 'design/checkout-components',
    classNames: ['checkout-components-view'],
    maxQuantity: 9999,
    minQuantity: 0,
    warningText: Ember.computed('maxQuantity', 'minQuantity', function () {
        return 'Please enter a valid number between ' + this.get('minQuantity') + ' and ' + this.get('maxQuantity');
    }),

    didInsertElement () {

        let quantityInputs = this.$().find('.ctrl-quantity input');

        this.attachTouchSpin(quantityInputs);


        Ember.run.later(this, function () {
            if (this.get('parentView.controller.controllers.application.currentRouteName') === 'design.checkout.index') {
                window.tourMediator.trigger('show-once-checkout');
            }
        }, 1000);

        if (this.$().find('.component').length > 1) {
            // Bug #763
            this.$().find('.component').last().addClass('dropup');
        }


    },

    attachTouchSpin(quantityInputs){
        var minQuantity = this.get('minQuantity');
        var maxQuantity = this.get('maxQuantity');

        quantityInputs.TouchSpin({
            mousewheel: false,
            min: minQuantity,
            max: maxQuantity,
            step: 1,
            decimals: 0,
            boostat: 5,
            maxboostedstep: 10,
            prefix: this.get('controller.i18n').t('checkout.components_quantity')
        });

        quantityInputs.on('change keyup', Ember.$.proxy(function (touchSpinEvent) {

            var quantity = parseInt(touchSpinEvent.currentTarget.value);

            if (quantity <= minQuantity) {
                this.disableQuantityDown(touchSpinEvent);
            } else {
                this.enableQuantityDown(touchSpinEvent);
            }

            if (quantity >= maxQuantity) {
                this.disableQuantityUp(touchSpinEvent);
            } else {
                this.enableQuantityUp(touchSpinEvent);
            }

        }, this));
    },

    enableQuantityUp(touchSpinEvent){
        this
            .$(touchSpinEvent.target)
            .parent()
            .find('.bootstrap-touchspin-up')
            .prop('disabled', false);
    },

    enableQuantityDown(touchSpinEvent){
        this
            .$(touchSpinEvent.target)
            .parent()
            .find('.bootstrap-touchspin-down')
            .prop('disabled', false);
    },

    disableQuantityUp(touchSpinEvent){
        this
            .$(touchSpinEvent.target)
            .parent()
            .find('.bootstrap-touchspin-up')
            .prop('disabled', true);
    },

    disableQuantityDown(touchSpinEvent){
        this
            .$(touchSpinEvent.target)
            .parent()
            .find('.bootstrap-touchspin-down')
            .prop('disabled', true);
    }

});
