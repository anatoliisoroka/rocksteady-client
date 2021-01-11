/* globals $ */

import Ember from 'ember';
import config from '../config/environment';

export default Ember.View.extend({
    templateName: 'error-modal',

    isProduction: function () {
        return config.APP.environment === 'production';
    }.property(),

    hideOnProduction: Ember.computed.oneWay('isProduction'),

    willInsertElement: function () {
        $('.fallback-application-error').remove();
    },

    didInsertElement: function () {
        var view = this;

        this.keys.bind('ctrl d', function () {
            view.toggleProperty('hideOnProduction');
        });
    },

    willDestroyElement: function () {
        this.keys.unbind('ctrl d');
    }
});
