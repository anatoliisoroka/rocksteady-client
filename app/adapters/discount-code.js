/* global logger */
import Ember from 'ember';
import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({

    pathForType: function () {
        return this.apiEndpoint('discount_code');
    },

    findQuery: function (store, type, query) {
        var id = query.id;
        delete query.id;

        var url = this.buildURL(type.modelName, id, null, 'find', query);

        if (this.sortQueryParams) {
            query = this.sortQueryParams(query);
        }

        return new Ember.RSVP.Promise((resolve, reject) => {
            this.ajax(url, 'GET', { data: query }).then(function (json) {
                json.discount_code.id = id;
                resolve(json);
            }, (err) => {
                logger.warn('DiscountCodeFind' , 'DiscountCodeFindQuery failed as: ' + err);
                reject(err);
            });
        });
    },

    find: function (store, type, id, snapshot) {
        return new Ember.RSVP.Promise((resolve, reject) => {
            this.ajax(this.buildURL(type.modelName, id, snapshot), 'GET').then(function (json) {
                json.discount_code.id = id;
                resolve(json);
            }, (err) => {
                logger.warn('DiscountCodeFind' , 'DiscountCodeFind failed as: ' + err);
                reject(err);
            });
        });
    }

});

