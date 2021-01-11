import DS from 'ember-data';

export default DS.RESTSerializer.extend({

    extractFindQuery: function (store, typeClass, payload, id, requestType) {
        return [this.extractSingle(store, typeClass, payload, id, requestType)];
    }

});
