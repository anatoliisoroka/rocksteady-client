import ApplicationSerializer from './application';

export default ApplicationSerializer.extend({

    serializeIntoHash: function (data, type, snapshot/*, options*/) {

        data.competing_region_id = snapshot.belongsTo('competingRegion') ? snapshot.belongsTo('competingRegion').id : null;
        data.nationality_id = snapshot.belongsTo('nationality') ? snapshot.belongsTo('nationality').id : null;
        data.product_line_id = snapshot.belongsTo('productLine').id;
        data.manufacturer_id = snapshot.belongsTo('manufacturer') ? snapshot.belongsTo('manufacturer').id : null;
        data.target_id = snapshot.belongsTo('target') ? snapshot.belongsTo('target').id : null;
        data.target_kit_id = snapshot.belongsTo('targetKit') ? snapshot.belongsTo('targetKit').id : null;
        data.target_category_id = snapshot.belongsTo('targetCategory') ? snapshot.belongsTo('targetCategory').id : null;
        data.description = snapshot.description;

        if (!snapshot.description) {
            delete data.description;
        }

        if (!snapshot.belongsTo('manufacturer')) {
            delete data.manufacturer_id;
        }

        if (!snapshot.belongsTo('targetKit')) {
            delete data.target_kit_id;
        }

        if (!snapshot.belongsTo('target')) {
            delete data.target_id;
        }

        if (!snapshot.belongsTo('targetCategory')) {
            delete data.target_category_id;
        }

        if (snapshot.belongsTo('useCategory')) {
            data.use_category_id = snapshot.belongsTo('useCategory').id;

            var use_id = snapshot.record.get('use_id');

            if (use_id) {
                data.use_id = use_id;
            }
        }

        if (snapshot.belongsTo('ruleSet')) {
            data.rule_set_id = snapshot.belongsTo('ruleSet').id;
        }

        if (snapshot.record.promptedFeatures) {
            snapshot.record.promptedFeatures.forEach(function (pf) {
                var name = pf.get('id');
                var param_name = name.toLowerCase().replace(/ /g, '_');
                data[param_name] = pf.get('value') || pf.get('defaultValue');
            });
        }
    },

    extractSingle: function (store, type, payload, id, requestType) {
        payload = {
            target_categories: payload.target_categories,
            manufacturers: payload.manufacturers,
            targets: payload.targets,
            target_kits: payload.target_kits,
            interview: payload.order_kit
        };
        // SMELL why are we even doing this? This issues a GET before moving on to the order_kit page
          //  FIXME this is causing an extra GET but is needed due to a bug with this version of Ember Data
         //   see - https://github.com/emberjs/data/issues/2950
         payload.interview.design_id = payload.interview.id;
         payload.interview.id = id;

        return this._super(store, type, payload, id, requestType);
    }

});

