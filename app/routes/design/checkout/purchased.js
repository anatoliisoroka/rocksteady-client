/* globals Modernizr, logger, ga , mixpanel */

import Ember from 'ember';
import config from '../../../config/environment';

export default Ember.Route.extend({
    designService: Ember.inject.service('design-service'),

    setupController (controller, model) {
        this._super(controller, model);

        const checkoutController = this.controllerFor('design/checkout');
        const selectorModel = checkoutController.get('model.selector');

        if (selectorModel) {
            controller.set('selectorURL', selectorModel);
        } else {
            this.get('designService')
                .toPNG(checkoutController.get('model.design'))
                .then((selectorImage) =>
                    controller.set('selectorURL', selectorImage)
                );
        }

        controller.set('persistedPrintRequestData', this.getPersistedPrintRequestData());
        controller.set('buttonsDisabled', true);

        Ember.run.later(
            controller,
            () => controller.set('buttonsDisabled', false),
            5000
        );
    },

    getPersistedPrintRequestData: function () {
        var printRequest,
            localStorageKey = 'print_request.' + this.get('controller.model.order_number'),
            printRequestData = window.localStorage[localStorageKey];

        if (!printRequestData) {
            logger.warn('AnalyticsEcommerceMissingDataWarning', 'Missing printRequest data in localStorage.');
        }

        try {
            printRequest = JSON.parse(printRequestData);
        } catch (e) {
            logger.warn('AnalyticsEcommerceMissingDataWarning', 'Missing printRequest data in localStorage.');
        }

        return printRequest;
    },

    sendAnalytics: function () {
        if (Modernizr.localstorage) {

            var printRequest = this.getPersistedPrintRequestData();

            if (!printRequest || !printRequest.analytics) {
                return logger.warn('PrintRequestPersistedDataWarning', 'Missing print_request data in localStorage - can\'t send analytics data for this order.');
            }

            if (printRequest.analytics.sent) {

                logger.warn('AnalyticsEcommerceAlreadySentWarning', 'Activated a purchase route, but analytics already sent (probably harmless).');

            } else if (printRequest.analytics.transaction && printRequest.analytics.items && printRequest.analytics.items.length > 0) {

                // googleAnalytics event
                if(config.mixpanel.enabled) {
                    mixpanel.track("GA-addTransaction", {
                        "transaction": printRequest.analytics.transaction,
                        "sent": new Date()
                    });
                }
                ga('ecommerce:addTransaction', printRequest.analytics.transaction);

                for (var i = 0; i < printRequest.analytics.items.length; i++) {
                    ga('ecommerce:addItem', printRequest.analytics.items[i]);
                }
                // googleAnalytics event
                ga('ecommerce:send');

                printRequest.analytics.sent = new Date();

                try {
                    window.localStorage[this.get('localStorageKey')] = JSON.stringify(printRequest);
                } catch (e) {
                    logger.warn('LocalStorageWarning', e);
                }

            } else {
                logger.warn('AnalyticsEcommerceMissingDataWarning', 'Missing some analytics data in localStorage - can\'t send ecommerce analytics data for this purchase.');
            }

        } else {
            logger.warn('AnalyticsEcommerceMissingDataWarning', 'Missing analytics data in localStorage - can\'t send ecommerce analytics data for this purchase.');
        }
    },

    actions: {
        didTransition: function () {
            if (typeof ga === 'function') {
                this.sendAnalytics();
            }
        },
        willTransition() {
            // MOT-1320 - if user presses back after purchase close 'billing' route and force re-order
            var checkoutPage = window.location.href.split("billing")[0];
            window.location = checkoutPage;
        }
    }

});
