import Ember from 'ember';
import DS from 'ember-data';
import {localizeDeliveryEstimate} from '../utils/i18n-util';

export default DS.Model.extend({

    i18n: Ember.inject.service(),
    iso2CountryCode: DS.attr('string'),
    price: DS.attr('number'),
    discountCodeType: DS.attr('string'),
    type: DS.attr('string'),
    cost: DS.attr('number'),
    time: DS.attr('string'),
    phoneRequired: DS.attr('boolean'),
    postalCompany: DS.attr('string'),
    postalService: DS.attr('string'),
    currency: DS.belongsTo('currency'),
    costStr: function () {
        return this.get('cost').toFixed(2);
    }.property('cost'),
    localCost: function () {
        return (this.get('cost') * this.get('currency.fxRate'));
    }.property('cost', 'currency'),
    localCostStr: function () {
        return (this.get('cost') * this.get('currency.fxRate')).toFixed(2);
    }.property('cost', 'currency'),
    localizedDeliveryEstimate: function () {
        return localizeDeliveryEstimate(this.get('time'), this.get('i18n').t.bind(this.get('i18n')));
    }.property('time')

});
