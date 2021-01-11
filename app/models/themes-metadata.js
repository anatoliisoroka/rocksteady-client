import DS from 'ember-data';

export default DS.Model.extend({
    ordered_categories: DS.attr(),
    ordered_filters: DS.attr()
});
