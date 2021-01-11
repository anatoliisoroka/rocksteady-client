/* global Modernizr, logger */

import Ember from 'ember';
import config from '../config/environment';

export default Ember.Route.extend({

    authentication: Ember.inject.service(),

    title: function (tokens) {
        let title = config.APP.debugging ? '[' + this.controllerFor('application').get('currentRouteName') + '] ' : '';
        let titleBrandName = this.get('controller.i18n').t('application.page_title_brand_name');

        if (tokens && tokens.length) {
            return title + tokens.join(' - ') + ' - ' + titleBrandName;
        } else {
            return title + titleBrandName;
        }
    },

    beforeModel: function () {
        if (!Modernizr.canvas || !window.btoa) {
            logger.warn('Client does not meet browser requirements: ' + navigator.userAgent);
            this.transitionTo('incompatible-browser');
        }

        this.get('authentication').getUserInfo();
    },

    afterModel: function () {
        this.controllerFor('application').send('popSpinner');
    },

    actions: {
        loading: function (/*transition, originRoute*/) {
            this.controllerFor('application').send('pushSpinner');
        },
        error: function (errorResponse, transition) {
            this.controllerFor('application').send('showApplicationError', errorResponse, transition);
        },
        onResourceError(errorResponse) {
            this.controllerFor('application').setProperties({
                'errors': errorResponse.errors,
                'errorMessage': errorResponse.message
            });

            logger.error('ResourceError', 'Received a ResourceError: ' + errorResponse.message + ' Errors:' + errorResponse.errors);
        }
    }
});
