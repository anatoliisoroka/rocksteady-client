import Ember from 'ember';
import ApplicationAdapter from './application';

/*
 * This adapter provides a workaround for an ember data bug that is sending
 * requests for non-existing features.
 */

export default ApplicationAdapter.extend({
    find: function (store, type, id) {
        return new Ember.RSVP.Promise(function (resolve/*, reject*/) {
            resolve({ feature: { link: id } });
        });
    }
});

