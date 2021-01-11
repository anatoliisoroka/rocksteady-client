/* globals logger */

import DS from 'ember-data';
import ApplicationSerializer from './application';
import SerializerMixin from '../mixins/serializer';
import rsLogger from '../lib/rs-logger';

export default ApplicationSerializer.extend(SerializerMixin, DS.EmbeddedRecordsMixin, {
    attrs: {
        personalFeatures: {embedded: 'always'}
    },

    extractSingle: function (store, type, payload, id, requestType) {

        var i;

        // want shapes to belong to kit

        payload.order_kit.shape_ids = [];

        for (i = 0; i < payload.shapes.length; i++) {
            payload.shapes[i].design_id = payload.order_kit.id;
            payload.order_kit.shape_ids.push(payload.shapes[i].id);
        }

        // want components to belong to kit

        payload.order_kit.manufacturer_ids = [];

        for (i = 0; i < payload.components.length; i++) {
            payload.components[i].design_id = payload.order_kit.id;
            payload.components[i].quantity = 1;
            payload.order_kit.manufacturer_ids.push(payload.components[i].manufacturer_id);

            if (!payload.components[i].default_shape_id) {
                payload.components[i].default_shape_id = payload.components[i].shape_id;
            }
        }

        if (payload.order_kit.manufacturer_id) {
            payload.order_kit.manufacturer_ids.push(payload.order_kit.manufacturer_id);
        }

        // want features to belong to kit

        for (i = 0; i < payload.features.length; i++) {
            payload.features[i].design_id = payload.order_kit.id;
            payload.features[i].fattribute_ids = payload.features[i].attribute_ids;
            delete payload.features[i].attribute_ids;
        }

        // want fattributes to belong to kit

        payload.order_kit.fattribute_ids = [];

        for (i = 0; i < payload.attributes.length; i++) {
            payload.attributes[i].design_id = payload.order_kit.id;
            delete payload.attributes[i].contrast;
            payload.order_kit.fattribute_ids.push(payload.attributes[i].link);
        }

        // want positions in a kit

        for (i = 0; i < payload.positions.length; i++) {
            payload.positions[i].design_id = payload.order_kit.id;
            delete payload.positions[i].kit_id;

            if (!payload.positions[i].default_component_id) {
                if (payload.positions[i].component_id) {
                    payload.positions[i].default_component_id = payload.positions[i].component_id;
                } else if (payload.positions[i].component_ids && payload.positions[i].component_ids.length) {
                    payload.positions[i].default_component_id = payload.positions[i].component_ids[0];
                } else {
                    logger.warn('DefaultComponentWarning', 'Can\'t set a default component for the position: ' + JSON.stringify(payload.positions[i]));
                }
            }
        }

        // want a kit quality if not defined

        if (!payload.order_kit.quality) {
            payload.order_kit.quality = 'Premium';
        }

        const personalFeatures = payload.order_kit.prompted_features;
        if (personalFeatures) {
            payload.order_kit.personal_features = personalFeatures
                .map((personalFeature) =>
                    Object.assign({}, personalFeature, {prompted: true})
                );
            delete [personalFeatures];
        }

        // copy payload to a new object because we need a particular order

        var out = {};

        if (payload.manufacturers) {
            out.manufacturers = payload.manufacturers;
        }

        delete payload.order_kit.use_id;

        if (payload.users) {
            out.users = payload.users;
        }

        if (payload.colours) {
            out.colours = payload.colours;
        }

        out.graphics = payload.graphics;
        out.shapes = payload.shapes;
        out.decals = payload.decals;
        out.components = payload.components;
        out.fattributes = payload.attributes;
        out.features = payload.features;
        out.positions = payload.positions;

        if (!payload.targets) {
            delete payload.order_kit.target_id;
        }

        if (!payload.target_categories) {
            delete payload.order_kit.target_category_id;
        }

        if (!payload.target_kits) {
            delete payload.order_kit.target_kit_id;
        }

        if (!payload.use_categories) {
            delete payload.order_kit.use_category_id;
        }

        if (!payload.rule_sets) {
            delete payload.order_kit.rule_set_id;
        }

        out.targets = payload.targets || [];
        out.target_kits = payload.target_kits || [];
        out.target_categories = payload.target_categories || [];
        out.use_categories = payload.use_categories || [];
        out.rule_sets = payload.rule_sets || [];
        out.themes = payload.themes || [];

        out.design = payload.order_kit;

        //logger.debug('processed json payload follows: ');
        //logger.debug(out);

        return this._super(store, type, out, id, requestType);
    },

    serializeHasMany(snapshot, json, {key}) {

        function filterInvalid(feature) {
            const isDeleted = (feature) => feature.attr('deleted');
            const hasNoPosition = (feature) => !feature.belongsTo('position');
            const hasInvalidPosition = ((designPositionIds) => (feature) =>
                    !designPositionIds.includes(feature.belongsTo('position').id)
            )(snapshot
                .hasMany('positions')
                .mapBy('id')
                .compact()
            );

            const hasInvalidFeature =
                [isDeleted, hasNoPosition, hasInvalidPosition].some((filterFn) => filterFn(feature));

            return hasInvalidFeature;
        }

        if (key === 'features') {
            const features = snapshot.hasMany('features');
            const featuresToRemove = features
                .filter((feature) => filterInvalid(feature));

            if (featuresToRemove.length) {
                rsLogger.warn('JSONInconsistency', 'Inconsistent features');
            }

            features.removeObjects(featuresToRemove);
        }

        if (key === 'fattributes') {
            const fattributes = snapshot.hasMany('fattributes');
            const fattributesToRemove = fattributes
                .filter((fattribute) => filterInvalid(fattribute.belongsTo('feature')));

            if (fattributesToRemove.length) {
                rsLogger.warn('JSONInconsistency', 'Inconsistent fattributes');
            }

            fattributes.removeObjects(fattributesToRemove);
        }

        // Clean the Theme object of erroneous features & fattributes
        const theme = snapshot.belongsTo('theme');

        if (theme) {
            if (key === 'features') {
                const themeFeatures = theme.hasMany('features');
                const themeFeaturesToRemove = themeFeatures
                    .filter((feature) => filterInvalid(feature));

                if (themeFeaturesToRemove.length) {
                    rsLogger.warn('JSONInconsistency', 'Inconsistent features in theme');
                }

                themeFeatures.removeObjects(themeFeaturesToRemove);
            }

            if (key === 'fattributes') {
                const themeFattributes = theme.hasMany('fattributes');
                const themeFattributesToRemove = themeFattributes
                    .filter((fattribute) => filterInvalid(fattribute.belongsTo('feature')));

                if (themeFattributesToRemove.length) {
                    rsLogger.warn('JSONInconsistency', 'Inconsistent fattributes in theme');
                }

                themeFattributes.removeObjects(themeFattributesToRemove);
            }
        }

        this._super.apply(this, arguments);
    }
});

