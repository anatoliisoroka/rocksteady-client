/* global logger */
import Ember from 'ember';

export default Ember.Controller.extend({

    needs: ['design/checkout', 'application', 'design'],

    actions: {
        tryAgain: function () {
            logger.warn("PaymentDeclinedRetry" , "PaymentDeclinedRetry");
            this.transitionToRoute('design.checkout');
        }
    }
});
