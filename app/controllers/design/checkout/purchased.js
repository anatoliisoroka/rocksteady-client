/* global mixpanel */
import Ember from 'ember';
import config from '../../../config/environment';

export default Ember.Controller.extend({

    needs: ['design/checkout', 'application', 'design'],

    buttonsDisabled: true,
    persistedPrintRequestData: {},
    deliveryEstimate: Ember.computed.alias('persistedPrintRequestData.deliveryEstimate'),
    price: Ember.computed.alias('persistedPrintRequestData.price'),
    currency: Ember.computed.alias('controllers.design.currency'),
    deliveryAddress: undefined,

    deliveryAddressObserver: function () {
        if (this.get('persistedPrintRequestData.shippingAddress')) {
            var r = this.store.getById('region', this.get('persistedPrintRequestData.shippingAddress.country'));
            var h = '';

            var add = function (p, t) {
                var v = this.get('persistedPrintRequestData.shippingAddress.' + p);

                if (v) {
                    if (t) {
                        h += t(v) + ' ';
                    } else {
                        h += v + ' <br/>';
                    }
                }
            }.bind(this);

            add('name');
            add('address1');
            add('address2');
            add('city');
            add('subRegion', (v) => v);
            add('postcode');

            h += r.get('name') ? r.get('name').toUpperCase() : r;

            this.set('deliveryAddress', h);

            if(config.mixpanel.enabled) {
                mixpanel.track("PersistedAddressData", {"PersistedAddressData": h});
            }

        }
    }.observes('persistedPrintRequestData.shippingAddress'),

    selectorURL: undefined,

    charityWorkURL: function () {
        return config.URLs.charity_work;
    }.property(),

    actions: {
        socialShare: function () {
            this.transitionToRoute('design.selector.socialShare');
        },

        exitApp: function () {
            this.get('controllers.application').send('exitApp');
        }
    }

});
