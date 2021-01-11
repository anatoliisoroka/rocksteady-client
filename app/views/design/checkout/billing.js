/* global logger */

import Ember from 'ember';
import config from '../../../config/environment';

export default Ember.View.extend({

    templateName: 'design/checkout/billing',

    actions: {
        initIFrame: function () {

            if (this.$().find('#billing-iframe').length) {
                this.$().find('#billing-iframe')[0].contentWindow.document.write(
                    this.$().find('#billing-form')[0].outerHTML
                );

                this.$().find('#billing-iframe').get(0).contentWindow.document.getElementById('billing-form').submit();
            } else {
                logger.error('MissingIframeError', 'Unexpected missing iframe');
            }
        }
    },

    receiveMessage: function (event) {
        var myOrigin = window.location.protocol + '//' + window.location.host;

        if (event.origin !== myOrigin && !config.APP.debugging) {
            logger.warn('PurchaseCallbackWarning', 'Received a message from an unknown origin: ' + event.origin);
            return;
        }

        if (event.data && event.data.status) {
            if (event.data.status === 'ok') {
                if (!event.data.order_number) {
                    logger.warn('PurchaseCallbackWarning', 'Missing order number in purchase ok message');
                    event.data.order_number = '**Check Email**';
                }

                Ember.run(function () {
                    this.send('handleOk', event.data);
                }.bind(this));
            } else {
                if (!event.data.message) {
                    logger.warn('PurchaseCallbackWarning', 'Missing error message in purchase not ok message');
                    event.data.message = 'Unknown Error';
                }

                Ember.run(function () {
                    this.send('handleNotOk', event.data);
                }.bind(this));
            }
        }
    },

    didInsertElement: function () {
        this._super();

        var view = this;

        this.send('initIFrame');

        this.$().find('.modal')
            .modal({backdrop: 'static', show: true})
            .on('hide.bs.modal', function () {
                view.get('controller.controllers.design/checkout').transitionToRoute('design.selector');
            });

        this.receiveMessage = this.receiveMessage.bind(this.get('controller'));

        this.set('controller.isShown', true);

        window.addEventListener('message', this.receiveMessage, false);  // NOTE: when listener function is the same, it will not add multiple listeners
    },

    willDestroyElement: function () {
        this.set('controller.isShown', false);

        window.removeEventListener('message', this.receiveMessage, false);
    }

});

