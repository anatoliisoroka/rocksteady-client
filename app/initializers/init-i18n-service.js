export function initialize(container, application) {
    application.inject('controller', 'i18n', 'service:i18n');
}

export default {
    name: 'init-i18n-service',
    after: 'ember-i18n',
    initialize: initialize
};
