/* global logger */
import Ember from 'ember';

export default Ember.Route.extend({
    model: function () {
        var route = this;

        return new Ember.RSVP.Promise(function (resolve/*, reject*/) {
            if (!route.controllerFor('design.checkout').get('model.UPGTransactionId')) {
                logger.warn('BillingRoute', "Cannot get UPGTransactionId");
                route.transitionTo('design.checkout');
            } else {
                resolve();
            }
        });
    }
});
