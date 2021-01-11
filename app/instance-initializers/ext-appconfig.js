/* global logger */

import config from '../config/environment';

export function initialize(application) {

    window.addEventListener('message', function (event) {
        if (event.source !== window || !event.data.type) {
            return;
        }

        if (event.data.type === 'qa_config_query') {
            logger.debug('[qa-appconfig] posting qa_config_query_result');

            window.postMessage({
                type: 'qa_config_query_result',
                version: '2.0',
                data: JSON.stringify({key: event.data.key, value: config.APP[event.data.key]})
            }, '*');
        }

        if (event.data.type === 'qa_config_set') {
            // e.g. window.postMessage({type: 'qa_config_set', key: 'merchant_acc_override', value: '123'}, '*')

            logger.debug('[qa-appconfig] setting config.APP.' + event.data.key + '=' + event.data.value);
            application.container.lookup('controller:application').set('config.APP.' + event.data.key, event.data.value);
        }

        if (event.data.type === 'qa_get_features') {
            logger.debug('[qa-appconfig] posting qa_features_result');

            window.postMessage({
                type: 'qa_features_result',
                version: '2.0',
                data: JSON.stringify(config.APP.features)
            }, '*');
        }

        if (event.data.type === 'qa_feature_toggle') {
            logger.debug('[qa-appconfig] setting config.APP.features.' + event.data.key + '=' + !!event.data.value);
            application.container.lookup('controller:application').set('config.APP.features.' + event.data.key, !!event.data.value);
        }

    });

}

export default {
    name: 'ext-appconfig',
    initialize: initialize
};

