import Ember from 'ember';
import config from '../../../config/environment';
import rsLogger from '../../../lib/rs-logger';

const loggerPath = 'views__price-and-button';

export default Ember.View.extend({
    templateName: 'design/checkout/price-and-button',

    flashOrderTotal: false,
    showDiscountTable: false,
    isInvalidDiscountCode: false,

    priceObserver: Ember.observer('controller.localTotalPrice', function () {
        Ember.run.cancel(this.get('priceObserverTimer'));

        this.set('flashOrderTotal', true);

        this.set('priceObserverTimer', Ember.run.later(this, () => {
            if (this && !this.get('isDestroyed')) {
                this.set('flashOrderTotal', false);
            }
        }, 1000));
    }),

    showShippingCostLineDiscard: Ember.computed.equal('controller.model.shippingOption.type', 'Expedited'),

    showShippingLine: Ember.computed.gt('controller.model.shippingOption.cost', 0),

    applyDiscountCodeIfValid () {
        const controller = this.get('controller');
        const design = controller.get('model.design');

        this.set('isInvalidDiscountCode', false);
        this.hideInvalidDiscountTooltip();

        if (this.get('discountCodeToCheck')) {
            const productLineNameMissing = !design.get('productLine.name');
            const productLineName = productLineNameMissing ? 'Motorbike Decals' : design.get('productLine.name');

            if (productLineNameMissing) {
                rsLogger.error(
                    `${loggerPath}__apply_discount_code_if_valid`,
                    'Product Line name is missing in the design.'
                );

                rsLogger.warn(
                    `${loggerPath}__apply_discount_code_if_valid`,
                    `Default value of "${productLineName}" has been used in order to apply discount code`
                );
            }

            const params = {
                id: this.get('discountCodeToCheck'),
                country: design.get('competingRegion.code'),
                product_line: productLineName,
                target_category: design.get('targetCategory.name')
            };

            controller.store.fetchById('discountCode', params)
                .then((discountCodes) => {
                    controller.set('model.discountCode', discountCodes.get('firstObject'));
                    this.set('discountCodeToCheck', '');
                })
                .catch(() => this.invalidDiscountCodeInputted());

        } else {
            this.invalidDiscountCodeInputted();
        }
    },

    invalidDiscountCodeInputted () {
        this.showInvalidDiscountTooltip();
        this.set('isInvalidDiscountCode', true);
        this.$().find('[name="discount-code-input"]').focus();
    },

    showInvalidDiscountTooltip () {
        if (config.APP.tooltips && this.$()) {
            this.$()
                .find('[name="discount-code-input"]')
                .tooltip({
                    title: this.get('controller.i18n').t('checkout.invalid_discount_code').toString(),
                    template: '<div class="tooltip tooltip-error"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
                    trigger: 'focus'
                })
                .tooltip('show');
        }
    },

    hideInvalidDiscountTooltip () {
        if (config.APP.tooltips && this.$()) {
            this.$()
                .find('[name="discount-code-input"]')
                .tooltip('destroy');
        }
    },

    keyDown(event){
        if (event.keyCode === 13) {
            this.applyDiscountCodeIfValid();
        } else {
            this.hideInvalidDiscountTooltip();
        }
    },

    actions: {

        toggleDiscountTable () {
            Ember.run.later(this, () => this.toggleProperty('showDiscountTable'), 500);
            Ember.run.later(this, () => this.$().find('[name="discount-code-input"]').focus(), 600);
            this.$().find('.apply-discount-label').fadeOut();
        },

        applyDiscountCodeIfValid (){
            this.applyDiscountCodeIfValid();
        }
    }
});
