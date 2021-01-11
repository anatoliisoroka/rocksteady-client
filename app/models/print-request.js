import DS from 'ember-data';

export default DS.Model.extend({
    design: DS.belongsTo('design'),
    shapes: DS.hasMany('printShape'),
    shippingAddress: DS.belongsTo('shippingAddress'),
    selector: DS.attr('string'),
    discountCode: DS.belongsTo('discountCode'),
    shippingOption: DS.belongsTo('shippingOption'),
    UPGTransactionId:   ''
});
