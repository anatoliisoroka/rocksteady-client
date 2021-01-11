/* global logger, Modernizr, mixpanel */

import Ember from 'ember';
import config from '../../../config/environment';

export default Ember.Controller.extend({

    needs: ['design/checkout', 'application', 'design'],

    analytics: Ember.inject.service(),

    hideIframe: Ember.computed.or('orderNumber', 'error'),

    isShown: false,

    amount: function () {
        return (this.get('controllers.design/checkout.totalPrice') * 100).toFixed(0);
    }.property('controllers.design/checkout.totalPrice'),

    currencyCode: Ember.computed.alias('controllers.design.currency.iso_numeric'),

    retOkAddress: function () {
        return this.get('controllers.application.appOrigin') + '/upg/purchase_win';
    }.property(),

    retNotOkAddress: function () {
        return this.get('controllers.application.appOrigin') + '/upg/purchase_lose';
    }.property(),

    nonIframeRetOkAddress: function () {
        return this.get('controllers.application.appOrigin') +
            window.location.pathname +
            this.get('target').generate('design.checkout.purchased', this.get('controllers.design/checkout.model.shippingAddress.email'), '');
    }.property(),

    nonIframeRetNotOkAddress: function () {
        return this.get('controllers.application.appOrigin') +
            window.location.pathname +
            this.get('target').generate('design.checkout.declined', '');
    }.property(),

    purchaseDescription: Ember.computed(function () {
        return this.get('i18n').t('billing.purchase_description').toString();
    }),

    printRequestToken: function () {
        var prt = this.get('controllers.design/checkout.model.id');

        if (!prt) {
            logger.error('PrintRequestTokenError', 'API did not return a print request token');
        }

        return prt;
    }.property('controllers.design/checkout.model.id'),

    transactionId: Ember.computed.alias('controllers.design/checkout.model.UPGTransactionId'),

    merchantId:         function () {
        var merchantAcc;

        if (config.APP.merchant_acc_override) {
            merchantAcc = config.APP.merchant_acc_override;
        } else {
            merchantAcc = this.get('controllers.design.currency.merchantAcc');
        }

        if (!merchantAcc) {
            logger.error('MissingMerchantAccError', 'Cannot complete purchase. Currency ' + this.get('controllers.design.currency.iso_code') + ' has no merchant account.');
        }

        return merchantAcc;
    }.property(),

    threeDSTest:        function () {
        return config.APP.threeds_test ? 'YES' : 'NO';
    }.property(),

    threeDSAction:      function () {
        return config.APP.threeds_action;
    }.property(),

    threeDSPassword:    function () {
        return config.APP.threeds_password;
    }.property(),

    upgEndpoint:        function () {
        return config.APP.upg_endpoint;
    }.property(),

    showPayPal:         function () {
        return config.APP.features.show_paypal;
    }.property(),

    cssUrl:             function() {
        const url = config.APP.upg_dev_theme_css ?
            config.APP.upg_dev_theme_css : window.location.href.replace(/#.+/, 'branding/upg.css');
        return url;
    }.property(),

    cssIntegrity:       function() {
        return config.APP.upg_css_integrity;
    }.property(),

    actions: {
        handleOk: function (data) {
            if (Modernizr.localstorage) {
                var localStorageKey = this.get('controllers.design/checkout.model.design.localStorageKey') + '.lastOrderDate';
                try {
                    window.localStorage[localStorageKey] = (new Date()).toString();
                } catch (e) {
                    logger.warn('BillingController-LocalStorageWarning', e);
                }
            }

            let themeId = this.get('controllers.design/checkout.model.design.theme.id');

            if (themeId) {
                this.get('analytics').sendAnalyticsEvent('theme_purchased', themeId);
            }

            this.replaceRoute('design.checkout.purchased', this.get('controllers.design/checkout.model.shippingAddress.email'), data.order_number);
        },

        handleNotOk: function (data) {
            if(config.mixpanel.enabled) {
                mixpanel.track('Billing-Error', {"order-number": data.order_number, "message": data.message});
            }
            logger.warn('handleNotOk-BillingController', 'Billing declined for order: ' +  data.order_number + ' due to: ' + data.message);

            this.get('controllers.design/checkout').send('createNewPrintRequest');
            this.get('controllers.design/checkout').send('clearPrintRequestsLocalStorage');
            this.replaceRoute('design.checkout.declined', data.message);
        }
    }

});

