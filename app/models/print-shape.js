import DS from 'ember-data';

export default DS.Model.extend({
    shape: DS.belongsTo('shape'),
    position_name: DS.attr('string'),
    decal: DS.belongsTo('decal'),
    decal_price: DS.attr('number'),
    qty: DS.attr('number', {defaultValue: 1}),
    svg: DS.attr('string'),
    colourMap: DS.attr('raw'),
    shippingDetails: DS.attr('raw'),
    qron: DS.belongsTo('qronFeature'),
    component: undefined
});
