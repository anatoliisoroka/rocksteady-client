import Ember from 'ember';
import DS from 'ember-data';
import RouteSlugMixin from '../mixins/route-slug';

export default DS.Model.extend(RouteSlugMixin, {

    qualifyingData: DS.attr('string'),
    name: Ember.computed.alias('qualifyingData')

});
