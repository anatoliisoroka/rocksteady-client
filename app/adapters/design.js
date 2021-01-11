/* global logger, NProgress */

import Ember from 'ember';
import ApplicationAdapter from './application';
import config from '../config/environment';

export default ApplicationAdapter.extend({
    i18n: Ember.inject.service(),
    pathForType: function () {
        return this.apiEndpoint('order_kits');
    },

    serializeFull: function (snapshot, options) {

        var data = {},
            model = options.store.modelFor('design'),
            serializer = options.store.serializerFor(model.modelName);

        serializer.serializeIntoHash(data, model, snapshot, { includeId: true });

        delete data.design.colour_ids;
        delete data.design.shape_ids;

        const relationships = ['graphics', 'fattributes', 'features', 'components', 'positions', 'shapes', 'decals', 'colours'];

        /* jshint loopfunc:true */
        for (var i = 0; i < relationships.length; i++) {
            var name = relationships[i];

            data[name] =
                snapshot
                    .hasMany(name)
                    .filter(function (item) {
                        return (name !== 'graphics' || item.attr('isUserAdded'));
                    })
                    .filter((item) => name !== 'colours' || item.attr('name').includes('Upload'))
                    .map(function (item) {
                        return options.store.serializerFor(item.modelName).serialize(item, {includeId: true});
                    });
        }
        /* jshint loopfunc:false */

        delete data.design.use_id;

        data.attributes = data.fattributes;
        delete data.fattributes;

        data.manufacturers = [];

        snapshot.hasMany('manufacturers').forEach((manufacturer) => {
            if (manufacturer) {
                data.manufacturers.push(options.store.serializerFor(manufacturer.modelName).serialize(manufacturer, {includeId: true}));
            }
        });

        if (snapshot.belongsTo('target')) {
            var target = snapshot.belongsTo('target');
            data.targets = [options.store.serializerFor(target.modelName).serialize(target, {includeId: true})];
        }

        if (snapshot.belongsTo('targetCategory')) {
            var targetCategory = snapshot.belongsTo('targetCategory');
            data.target_categories = [options.store.serializerFor(targetCategory.modelName).serialize(targetCategory, {includeId: true})];
        }

        if (snapshot.belongsTo('targetKit')) {
            var targetKit = snapshot.belongsTo('targetKit');
            data.target_kits = [options.store.serializerFor(targetKit.modelName).serialize(targetKit, {includeId: true})];
        }

        if (snapshot.belongsTo('useCategory')) {
            var useCategory = snapshot.belongsTo('useCategory');
            data.use_categories = [options.store.serializerFor(useCategory.modelName).serialize(useCategory, {includeId: true})];
        }

        if (snapshot.belongsTo('ruleSet')) {
            var ruleSet = snapshot.belongsTo('ruleSet');
            data.rule_sets = [options.store.serializerFor(ruleSet.modelName).serialize(ruleSet, {includeId: true})];
        }

        if (snapshot.record.get('user.isLoaded')) {
            var user = snapshot.belongsTo('user');
            data.users = [options.store.serializerFor(user.modelName).serialize(user, {includeId: true})];
        }

        if (snapshot.belongsTo('theme')) {
            var theme = snapshot.belongsTo('theme');
            data.themes = [options.store.serializerFor(theme.modelName).serialize(theme, {includeId: true})];
        }

        data.order_kit = data.design;
        delete data.design;

        return data;
    },

    validate: function (data) {
        var check = function (valid, msg) {
            if (!valid) {
                logger.warn('KitValidationWarning', msg);
            }

            return valid;
        };

        return check(data.order_kit.created_date, 'Missing created date.') &&
               check(data.order_kit.id, 'Missing design id.') &&
               check(data.order_kit.component_ids.length > 0, 'Design is missing component ids.') &&
               check(data.order_kit.decal_ids.length > 0, 'Design is missing decal ids.') &&
               check(data.order_kit.fattribute_ids.length > 0, 'Design is missing attribute ids.') &&
               check(data.order_kit.feature_ids.length > 0, 'Design is missing feature ids.') &&
               check(data.order_kit.font_ids.length > 0, 'Design is missing font ids.') &&
               check(data.order_kit.position_ids.length > 0, 'Design is missing position ids.') &&
               check(data.decals.length > 0, 'Design is missing decals.') &&
               check(data.features.length > 0, 'Design is missing features.') &&
               check(data.attributes.length > 0, 'Design is missing attributes.') &&
               check(data.components.length > 0, 'Design is missing components.') &&
               check(data.positions.length > 0, 'Design is missing positions.') &&
               check(data.shapes.length > 0, 'Design is missing shapes.');
    },

    buildURL: function (type, id, revision) {
        var appendedRevisionString = '';

        if(typeof revision === "number" ){
            appendedRevisionString += '&rev=' + revision;
        }

        if (id && config.APP.design_api_debug_parameters) {
            return '/api/order_kits/' + id + '?ts=' + (+(new Date())) + '&session_id=' + config.APP.session_id + appendedRevisionString;

        } else {
            return this._super(type, id);
        }
    },
    getSizeOfObject:  function (object){
        var bytes = 0;
        if(object !== null && object !== undefined) {
            bytes += object * 2;
        }
        return bytes;
    },
    formatByteSize:  function (bytes) {
        // return value converted to MB with 0 decimals
        return(bytes / 1048576).toFixed(0);
    },
    performDesignSizeDecreaseCheck: function(serializedData) {
        const previousSaveDataLength = parseFloat(this.get('previousSaveByteLength'));
        const saveChange = (serializedData.length - previousSaveDataLength) / previousSaveDataLength;
        const saveChangePC = (saveChange * 100).toFixed(0);

        if (saveChange < -0.1) {
            logger.warn('DecreasedDesignSizeWarning', `Design has changed in size by ${saveChangePC}% (${previousSaveDataLength} -> ${serializedData.length}) since the last save`);
        }

    },
    getMemorySizeOfSerializedObject: function(object) {
        return this.formatByteSize(this.getSizeOfObject(object));
    },
    reportDesignSizeWarning: function(messsageType, message){

        switch (messsageType) {
            default:
                logger.warn('DesignSizeWarning', message);
                window.toastr["info"](message);
                break;
            case 'warning':
                logger.warn('DesignSizeWarning', message);
                window.toastr["warning"](message);
                break;
            case 'error':
                logger.warn('DesignSizeWarning', message);
                window.toastr["error"](message);
        }
    },
    monitorDesignSizeGrowth: function (serializedDataObjectLength) {
        let MemorySizeOfSerializedObject = this.getMemorySizeOfSerializedObject(serializedDataObjectLength);

        switch (true) {
            case (MemorySizeOfSerializedObject < 5):
                // do nothing as not yet 5MB
                break;
            case (MemorySizeOfSerializedObject < 10):
                this.reportDesignSizeWarning('info', this.get('i18n').t('selector.design_size_alerts.design_size_alerts_5MB').toString());
                break;
            case (MemorySizeOfSerializedObject < 20):
                this.reportDesignSizeWarning('warning', this.get('i18n').t('selector.design_size_alerts.design_size_alerts_10MB').toString());
                break;
            case (MemorySizeOfSerializedObject >= 20):
                this.reportDesignSizeWarning('error',  this.get('i18n').t('selector.design_size_alerts.design_size_alerts_20MB').toString());
                break;
        }
    },
    updateRecord: function (store, type, snapshot) {

        const data = this.serializeFull(snapshot, { store: store });
        const id = snapshot.record.get('id');
        const revision = snapshot.record.get('revision');

        if (!this.validate(data)) {
            logger.warn('InvalidKitSaveWarning', 'Refusing to save invalid kit. ID: ' + id);
            return new Ember.RSVP.Promise(function (resolve, reject) {
                reject('Refusing to save invalid kit.');
            });
        }

        let url = this.buildURL('orderKits', id , revision);

        NProgress.start();

        const serializedData = JSON.stringify(data);
        this.performDesignSizeDecreaseCheck(serializedData);
        this.monitorDesignSizeGrowth(serializedData.length);

        this.set('previousSaveByteLength', serializedData.length);

            return new Ember.RSVP.Promise((resolve, reject) => {
                Ember.$.ajax({
                    type: 'PUT',
                    url: url,
                    data: serializedData,
                    dataType: 'text',
                    contentType: 'application/json; charset=utf-8'
                }).then(
                     (data) => {
                        Ember.run(null, resolve, data);
                         this.set('previousSaveByteLength', serializedData.length);
                        NProgress.done();
                    },
                     (jqXHR) => {
                         const ErrorCode = jqXHR.status + '_error PUT_Design';
                         const ErrorMessage = 'Response: ' + jqXHR.responseText + 'Status: ' + jqXHR.statusText;
                         logger.error(ErrorCode, ErrorMessage);
                        jqXHR.then = null; // tame jQuery's ill mannered promises
                        Ember.run(null, reject, jqXHR);
                        NProgress.done();
                    });
            });
        }

});
