export function initialize(container, application) {
    var keyPressListener = new window.keypress.Listener();

    keyPressListener.bind = keyPressListener.simple_combo;
    keyPressListener.unbind = keyPressListener.unregister_combo;

    application.register('keyPressListener:main', keyPressListener, { instantiate: false });
    application.inject('view', 'keys', 'keyPressListener:main');
}

export default {
    name: 'ember-key',
    initialize: initialize
};
