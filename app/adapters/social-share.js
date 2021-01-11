import Ember from 'ember';
import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
    pathForType: function (/*type*/) {
        return this.apiEndpoint('social_share');
    },

    createRecord: function (store, type, snapshot) {
        var data = {};
        var serializer = store.serializerFor(type.modelName);

        serializer.serializeIntoHash(data, type, snapshot, { includeId: false });

        var id = snapshot.record.get('id');

        return new Ember.RSVP.Promise(function (resolve, reject) {
            this.ajax(this.buildURL(type.modelName, null, snapshot), "POST", { data: data }).then(function (json) {

                json.social_share.id = id;

                resolve(json);

            }, reject);
        }.bind(this));
    }
});

