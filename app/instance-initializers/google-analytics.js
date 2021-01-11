/* global ga */

import config from '../config/environment';

export function initialize(application) {
    var router = application.container.lookup('router:main');

    router.on('didTransition', function () {
        if (typeof ga === 'function' && config.google_analytics.enabled) {
            ga('send', 'pageview', this.get('url'));
        }
    });
}

export default {
    name: 'google-analytics',
    initialize: initialize
};
