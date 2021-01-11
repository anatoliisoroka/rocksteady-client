/* global _ */

import Ember from 'ember';
import translations from '../locales/en/translations';
import rsLogger from '../lib/rs-logger';

export function initialize(container, application) {
    const brandingTextEndpoint = 'branding/text.json';

    application.deferReadiness();

    Ember.$.ajax({ url: brandingTextEndpoint, dataType: 'json' })
        .done((textOverrides) =>
            _.merge(translations, textOverrides)
        )
        .fail((jqXHR, textStatus, errorThrown) =>
            rsLogger.warn('BrandingText', `Failed to load branding text: ${errorThrown}`)
        )
        .always(() => application.advanceReadiness());
}

export default {
    name: 'init-i18n-branding',
    after: 'init-i18n-service',
    initialize
};
