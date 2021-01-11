/* global logger */
import ApplicationSerializer from './application';
import config from '../config/environment';

export default ApplicationSerializer.extend({

    serialize: function (snapshot, options) {

        var json = this._super(snapshot, options);

        if (snapshot.belongsTo('discountCode')) {
            json.total_cost = snapshot.belongsTo('design').record.get('euroDiscountedTotalPrice');
            json.discount_code = json.discount_code_id;
        } else {
            json.total_cost = snapshot.belongsTo('design').record.get('euroPrice');
            //add shipping option cost to total cost n fix to x.xx
            json.total_cost = (json.total_cost + snapshot.belongsTo('shippingOption').attr('cost')).toFixed(2);
        }

        delete json.discount_code_id;
        // gets email from shipping address email
        json.email = snapshot.belongsTo('shippingAddress').attr('email');

        delete json.shipping_address_id;

        json.shipping_details = {
            name:           snapshot.belongsTo('shippingAddress').attr('name'),
            address_lines:  [
                snapshot.belongsTo('shippingAddress').attr('address1'),
                snapshot.belongsTo('shippingAddress').attr('address2'),
                snapshot.belongsTo('shippingAddress').attr('city'),
                snapshot.belongsTo('shippingAddress').attr('subRegion'),
                snapshot.belongsTo('shippingAddress').attr('postcode'),
                snapshot.belongsTo('shippingAddress').belongsTo('country').record.get('name')
            ],
            city:           snapshot.belongsTo('shippingAddress').attr('city'),
            country:        snapshot.belongsTo('shippingAddress').belongsTo('country').record.get('name'),
            telephone:        snapshot.belongsTo('shippingAddress').attr('phoneNumber'),
            delivery_estimate: snapshot.belongsTo('shippingOption').record.get('localizedDeliveryEstimate'),
            expedited_shipping: {
                provider: snapshot.belongsTo('shippingOption').attr('postalCompany'),
                service: snapshot.belongsTo('shippingOption').attr('postalService')
            }
        };


        if(!json.email){
            logger.warn('PrintRequestEmailCorrupt', 'PrintRequestEmailCorrupt. Name: ' + json.shipping_details.name);
        }else if(!json.shipping_details.name){
            logger.warn('PrintRequestNameCorrupt', 'PrintRequestNameCorrupt. Email: ' + json.email);
        }

        if (config.APP.environment === 'test') {
            window.last = window.last || {};
            window.last.serializedPrintRequest = json;
        }

        delete json.shipping_option_id;

        return json;
    },

    serializeHasMany: function (snapshot, json, relationship) {
        var store = this.store;

        json[relationship.key] =
            snapshot.hasMany(relationship.key)
                .map(function (item) {
                    return store.serializerFor(item.modelName).serialize(item, { includeId: false});
                });

        return json;
    }
});
