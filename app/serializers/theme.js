import ApplicationSerializer from './application';
import SerializerMixin from '../mixins/serializer';
import rsLogger from '../lib/rs-logger';

var checkThemeIntegrity = function (payload) {

    var check = function (type, id_list, object_list) {
        for (var i = 0; i < id_list.length; i++) {
            var found = false;

            for (var j = 0; j < object_list.length; j++) {
                if (id_list[i] === object_list[j].link) {
                    found = true;
                }
            }

            if (!found) {
                throw `${type} ${id_list[i]} is not in the payload`;
            }
        }
    };

    check('Attribute', payload.themes[0].fattribute_ids, payload.fattributes);
    check('Feature', payload.themes[0].feature_ids, payload.features);

};

export default ApplicationSerializer.extend(SerializerMixin, {

    //There is metadata associated with themes in the themes payload, extract it here.
    // arguments: store, type, payload, id, requestType
    extract: function (store, type, payload) {

        if (payload.meta) {
            payload.meta.id = 0;
            store.push('themesMetadata', payload.meta);
        }

        return this._super(...arguments);
    },

    extractSingle (store, type, payload, id, requestType) {
        if (payload.exportMetadata) {
            delete payload.exportMetadata;
        }

        let [ theme ] = payload.themes;
        if (theme) {
            for (let i = 0; i < payload.attributes.length; i++) {
                payload.attributes[i].rule = [];
            }

            for (let i = 0; i < payload.graphics.length; i++) {
                payload.graphics[i].is_designer = false;
                payload.graphics[i].is_user_added = true;
                payload.graphics[i].is_placeholder = false;
                payload.graphics[i].tags = [];
                payload.graphics[i].is_theme_graphic = true;
            }

            for (let i = 0; i < payload.features.length; i++) {
                if (payload.features[i].name.match(/^User Added/)) {
                    payload.features[i].is_theme_feature = true;
                }
            }

            payload.fattributes = payload.attributes;
            delete payload.attributes;
            theme.fattribute_ids = theme.attribute_ids;
            delete theme.attribute_ids;

            theme.id = id;

            theme.previews = payload.previews || [];
            delete payload.previews;

            theme.previews.forEach(function (preview) {
                preview.imageUrl = preview.image_url;
                delete preview.image_url;
            });

            try {
                checkThemeIntegrity(payload);
            } catch (e) {
                rsLogger.error('ThemeIntegrityError', `Theme failed integrity test: ${e}`);
            }
        }

        return this._super(store, type, payload, id, requestType);
    }
});

