import DS from 'ember-data';

export default DS.Model.extend({
    displayName: DS.attr('string'),
    defaultValue: DS.attr('string'),
    prompted: DS.attr('boolean')
});
