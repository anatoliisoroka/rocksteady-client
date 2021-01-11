/* global Modernizr, Detectizr, $, logger, moment, $zopim */

import Ember from 'ember';
import config from '../../config/environment';


export default Ember.View.extend(Ember.Evented, {
    templateName: 'design/checkout',
    classNames: 'checkout-container',
    classNameBindings: ['controller.orderComplete'],

    discountCodeToCheck: '',

    windowWidth: window.innerWidth,
    isAndroid: /[aA]ndroid/.test(Detectizr.device),

    init: function () {
        this._super();
        this.set('controller.checkoutPageVisited', true);
    },

    ipadWorkaroundPurchase: function () {
        return Detectizr.device.model === 'ipad' && this.get('controller.controllers.design/checkout/billing.isShown');
    }.property('controller.controllers.design/checkout/billing.isShown'),

    didInsertElement: function () {
        //FIXME - this is full of junk code - needs refactor - 120+ lines in one function
        if (this.get('isAndroid')) {
            // fixme - this is all junk that should be refactored
            //scroll on input cause soft keyboard
            this.$().find('input').on('focus', () => {
                //set height based on window.outerHeight - header (89)
                setTimeout(() => {
                    var keyboardHeight = window.outerHeight - this.$().find('.navbar-header').outerHeight();
                    this.$().find('.shipping-billing-container').height(keyboardHeight);
                    this.set('androidKeyboard', true);
                    //scroll to that input
                    setTimeout(() => {
                        var scroll = $('input:focus').position().top || $('.country').position().top;
                        this.$().find('.shipping-billing-container').animate({scrollTop: scroll - 30});
                    }, 0);
                }, 200);
            });
            this.$().find('input').on('blur', () => {
                this.$('.shipping-billing-container').height('auto');
                this.set('androidKeyboard', false);
            });
        }

        $(window).on("debouncedresize.checkout", () => {
            if (Math.abs(window.innerWidth - this.get('windowWidth')) > 15 &&
                (this.get('controller.controllers.application.bootstrapBreakpoint') === 'xs') !== this.get('hasTabs')) {
                this.set('hasTabs', this.get('controller.controllers.application.bootstrapBreakpoint') === 'xs');
                this.rerender();
            }
            this.set('windowWidth', window.innerWidth);
        });

        //component qty inputs should always have a default value of 1
        if (!config.APP.testing) {
            this.$().find('.ctrl-quantity input').on('change', function (e) {
                var integerValue = parseInt($(e.target).val());
                $(e.target).val(integerValue ? integerValue : 0);
            });
        }

        if (!Modernizr.touch) {
            this.$().find('.checkout-shipping-details form input').first().focus();
        }

        if (Modernizr.localstorage) {
            var localStorageKey = this.get('controller.model.design.localStorageKey') + '.lastOrderDate',
                lastOrderDate = window.localStorage[localStorageKey];
            // on checkout looks in local storage to see if you ordered this design before
            // creates a local storage key - "design.57f5062b830f781c5b108884.lastOrderDate"
            // looks for this in localStorage - lastOrderDate = window.localStorage[localStorageKey]
            if (lastOrderDate) {
                var relativeTime = moment(new Date(lastOrderDate)).fromNow();
                var message = this.get('controller').get('i18n').t('checkout.you_last_ordered_this_design', {relative_time: relativeTime}).toString();
                this.get('controller.controllers.application').send(
                    'toast',
                    message,
                    'info',
                    'toast-last-ordered',
                    true
                );
            }
        }

        this.get('controller').on('showProgressBar', this, function () {
            if (this.$()) {
                this.$().find('#placeorder-progress-bar').modal({
                    backdrop: 'static',
                    keyboard: false,
                    show: true
                });
            }
        });

        this.get('controller').on('hideProgressBar', this, function () {
            if (this.$()) {
                this.$().find('#placeorder-progress-bar').modal('hide');
            }
        });

        if (!this.$().find('.place-order-button button').is(':appeared')) {
            logger.warn('OffscreenPlaceOrderButtonWarning', 'Checkout loaded and the \'Place Order\' button is off the screen. screen.height=' + screen.height + ' window.height=' + $(window).height());
        }

        //close ipad keyboard on 'Go', prevent page reload
        this.$().on('keydown.componentGoHandler', function (event) {
            if (event.keyCode === 13) {
                event.preventDefault();
                document.activeElement.blur();
            }
        });

        if (config.APP.tooltips && this.$()) {
            this.$().find('[title]').tooltip({ container: 'body' });
        }

        if (this.get('controller.controllers.application.bootstrapBreakpoint') === 'xs' && config.zopim && typeof $zopim !== 'undefined' && typeof $zopim.livechat !== 'undefined' && typeof $zopim.livechat.button !== 'undefined') {
            $zopim.livechat.hideAll();
        }
    },

    willDestroyElement: function () {
        this.$().off('keydown.componentGoHandler');
        this.$().find('input').off('focus');
        this.$().find('input').off('blur');
        this.$().find('.ctrl-quantity input').off('change');
        if (config.APP.tooltips && this.$()) {
            this.$().find('[data-value]').tooltip('destroy');
        }
        $(window).off("debouncedresize.checkout");

        if (this.get('controller.controllers.application.bootstrapBreakpoint') === 'xs' && config.zopim && typeof $zopim !== 'undefined' && typeof $zopim.livechat !== 'undefined' && typeof $zopim.livechat.button !== 'undefined') {
            $zopim.livechat.button.show();
        }
    }
});
