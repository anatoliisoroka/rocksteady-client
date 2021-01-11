import Ember from 'ember';
import DS from 'ember-data';

export default DS.Model.extend({
    tag: Ember.computed.alias('id'),
    type: DS.attr('string')
});
