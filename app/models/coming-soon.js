import DS from 'ember-data';

export default DS.Model.extend({
    email: DS.attr('string'),
    feature: DS.attr('string'),
    country: DS.attr('string'),
    designId: DS.attr('string'),
    product: DS.attr('string'),
    targetCategory: DS.attr('string'),
    make: DS.attr('string'),
    model: DS.attr('string'),
    year: DS.attr('string')
});
