/* global logger, mixpanel, $zopim */
import Ember from 'ember';
import config from '../../config/environment';

export default Ember.Route.extend({
    init: function () {
        Ember.run.later(function () {
            if (typeof $zopim === 'function') {
                $zopim(function() {
                    $zopim.livechat.sendVisitorPath();
                });
            }
        }, 500);
    },
    model: function () {
        var route = this;

        return new Ember.RSVP.Promise(function (resolve/*, reject*/) {
            Ember.run.later(route, function () {
                var shippingAddress;
                if (this.store.all('printRequest').get('lastObject')) {
                    shippingAddress = this.store.all('printRequest').get('lastObject.shippingAddress');
                    if(config.mixpanel.enabled) {
                        mixpanel.track('CheckoutShippingAddress', {"foundInStore": "true"});
                    }
                } else {
                    shippingAddress = this.store.createRecord('shippingAddress');
                    var myCountry = this.store.all('mycountry').get('firstObject').get('country');
                    var myRegion = this.store.all('region').filterBy('iso_alpha_2', myCountry).get('firstObject');
                    if (typeof myRegion === "undefined"){
                        logger.warn('Country not found - default to US');
                        myRegion = this.store.all('region').filterBy('iso_alpha_2', 'US').get('firstObject');
                    }
                    shippingAddress.set('country', myRegion);

                    if(config.mixpanel.enabled) {
                        mixpanel.track('CheckoutShippingAddress', {"foundInStore": "false"});
                    }
                }

                resolve(this.store.createRecord('printRequest', {
                    design: this.modelFor('design'),
                    locale: this.modelFor('design').get('locale'),
                    shippingAddress: shippingAddress
                }));
            }, 300); // FIXME need a reject handler here
        });
    },

    activate: function () {
        this.controllerFor('design').save();

        Ember.run.scheduleOnce('routerTransitions', this, function () {
            this.controllerFor('interview').get('controllers.progressBar').send('checkoutStage');
        });
    },

    afterModel: function () {
        this.controllerFor('application').send('popSectionSpinner');
    },

    actions: {
        loading: function (/*transition, originRoute*/) {
            this.controllerFor('application').send('pushSectionSpinner');
        },

        error: function (error) {
            logger.warn("CheckoutRoute", "An error occured in the checkout route " + error);
            this.controllerFor('application').send('showApplicationError', error);
        }
    }
});
