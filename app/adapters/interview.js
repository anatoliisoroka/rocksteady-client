import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
    pathForType: function () {
        return this.apiEndpoint('order_kits');
    },
    createRecord: function (store, type, snapshot) {

        var data = {};
        var serializer = store.serializerFor(type.modelName);
        serializer.serializeIntoHash(data, type, snapshot, { includeId: false });

        snapshot.record.set('id', null);
        return this.ajax(this.buildURL('orderKits', null, snapshot), 'POST', { data: data });

    },
    // Override ajaxOptions because API is expecting request content type to be form data
    ajaxOptions: function (url, type, options) {
        var hash = options || {};
        hash.url = url;
        hash.type = type;
        hash.dataType = 'json';
        hash.context = this;
        return hash;
    },
    updateRecord: function (store, type, record) {
        return this.createRecord(store, type, record);
    }
});

