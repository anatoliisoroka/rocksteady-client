import Ember from 'ember';
import DS from 'ember-data';

export default DS.Model.extend({
    code: Ember.computed.alias('iso_code'),
    iso_code: DS.attr('string'),
    iso_numeric: DS.attr('string'),
    name: DS.attr('string'),
    symbol: DS.attr('string'),
    fxRate: DS.attr('number'),
    merchantAcc: DS.attr('string')
});


