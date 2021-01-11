/* global logger */

import config from '../config/environment';
import Ember from 'ember';

export function initialize(container, application) {

    application.ready = function () {
        try {
            const readyEvent = new CustomEvent('rsReady', { detail: config });
            document.dispatchEvent(readyEvent);
        } catch (e) {
            logger.warn('RsReadyInitWarning', e);
        }

        logger.info('Ready to Rocksteady! Version = ' + config.APP.version + '; Environment = ' + config.APP.environment);
    };

    if (config.APP.testing) {
        Ember.run.later(function () {
            if (!Ember.BOOTED) {
                application.advanceReadiness();
            }
        }, this, 1000);
    }
}

export default {
    name: 'ready-to-rocksteady',
    initialize: initialize
};

