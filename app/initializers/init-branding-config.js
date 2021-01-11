/* global _ */

import Ember from 'ember';
import config from '../config/environment';
import rsLogger from '../lib/rs-logger';

export function initialize(container, application) {
    const brandingConfigEndpoint = 'branding/config.json';

    application.deferReadiness();

    Ember.$.ajax({ url: brandingConfigEndpoint, dataType: 'json' })
        .done((configOverrides) => {
            _.merge(config, configOverrides);
            application.trigger('config:ready');
        })
        .fail((jqXHR, textStatus, errorThrown) =>
            rsLogger.warn('BrandingConfig', `Failed to load branding config: ${errorThrown}`)
        )
        .always(() => application.advanceReadiness());
}

export default {
    name: 'init-branding-config',
    before: 'init-zopim',
    initialize
};
