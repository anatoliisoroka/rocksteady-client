import DS from 'ember-data';

export default DS.Model.extend({
    rate: DS.attr('number'),
    type: DS.attr('string'),
    quantity: DS.attr('number')
});
