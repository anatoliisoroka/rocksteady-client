import DS from 'ember-data';

export default DS.Model.extend({
    name: DS.attr('string'),
    address1: DS.attr('string'),
    address2: DS.attr('string'),
    email: DS.attr('string'),
    city: DS.attr('string'),
    postcode: DS.attr('string'),
    phoneNumber: DS.attr('string'),
    subRegion: DS.attr('string'),
    country: DS.belongsTo('region')
});
