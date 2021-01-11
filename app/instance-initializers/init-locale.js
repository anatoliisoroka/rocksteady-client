import config from '../config/environment';

export function initialize(application) {
    var defaultLocale = config.i18n.defaultLocale;
    application.container.lookup('application:main').get('locale', defaultLocale);
}

export default {
    name: 'init-locale',
    initialize: initialize
};
