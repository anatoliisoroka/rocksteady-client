import config from '../config/environment';
import Ember from 'ember';
import DS from 'ember-data';

export default DS.ActiveModelAdapter.extend({
    host: config.APP.api_host,

    apiEndpoint: function (action) {
        return config.APP.api_endpoint.replace(/^\//, '') + '/' + action;
    },

    pathForType: function (type) {
        var underscored = Ember.String.underscore(type);
        return this.apiEndpoint(Ember.String.pluralize(underscored));
    }
});
