/* global $, logger, Modernizr */

import config from '../config/environment';

var cleanVersion = function () {
    var matches = /(\d{4}\-w\d{2}(-rc\d+)?)/.exec(config.APP.version);

    if (matches) {
        config.APP.version = matches[1];
    }
};

export function initialize(/* container, application */) {
    config.APP.regionOverride = window.Cookies.get('regionOverride');

    config.APP.tooltips = !(Modernizr.touch) || config.APP.debugging || config.APP.testing;

    if (!Modernizr.localstorage) {
        config.APP.features.help_button = false;
    }

    if (!config.google_analytics.enabled) {
        window['ga-disable-UA-52441999-1'] = true;
    }

    logger.logging = config.APP.logging || true;

    cleanVersion();

    if ((
        window.location.hostname === 'staging.motocal.com' ||
        window.location.hostname === 'www.staging.motocal.com' ||
        window.location.hostname === 'app.motocal.com') &&
        config.APP.environment !== 'production') {
        throw 'Unsupported: ' + config.APP.environment + ' configuration in a production environment';
    }

    $(function addEnvironmentClass() {
        $('body').addClass('environment-' + config.APP.environment);
    });
}

export default {
    name: 'init-config',
    initialize: initialize
};
