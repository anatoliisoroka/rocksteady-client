/* global logger */
import ApplicationAdapter from './application';
import Ember from 'ember';

export default ApplicationAdapter.extend({

    pathForType: function () {
        return this.apiEndpoint('library_entry');
    },

    createRecord: function (store, type, snapshot) {
        var data = {};
        var serializer = store.serializerFor(type.modelName);

        serializer.serializeIntoHash(data, type, snapshot, { includeId: false });

        return new Ember.RSVP.Promise(function (resolve, reject) {
            Ember.$.ajax({
                type: 'POST',
                url: this.buildURL('libraryEntries'),
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(data),
                dataType: 'text'
            }).then(function () {
                Ember.run(null, resolve);
            }, function (jqXHR) {

                var ErrorCode = jqXHR.status + '_error POST_LibraryEntry';
                var ErrorMessage = 'Response: ' + jqXHR.responseText + 'Status: ' + jqXHR.statusText;
                logger.error(ErrorCode, ErrorMessage);

                jqXHR.then = null; // tame jQuery's ill mannered promises
                Ember.run(null, reject, jqXHR);
            });
        }.bind(this));
    }
});
