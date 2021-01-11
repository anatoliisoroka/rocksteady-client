import DS from 'ember-data';

export default DS.Model.extend({
    name: DS.attr('string', {defaultValue: 'default'}),
    email: DS.attr('string'),
    phone: DS.attr('string', {defaultValue: 'default'}),
    designName: DS.attr('string', {defaultValue: 'default'}),
    designDescription: DS.attr('string', {defaultValue: 'default'}),
    designer: DS.attr('boolean', {defaultValue: false}),
    country: DS.attr('string', {defaultValue: 'default'}),
    design_id: DS.attr('string'),
    product: DS.attr('string', {defaultValue: 'default'}),
    targetCategory: DS.attr('string', {defaultValue: 'default'}),
    make: DS.attr('string'),
    model: DS.attr('string'),
    year: DS.attr('string')
});
