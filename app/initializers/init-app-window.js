/* global $ */

export function initialize(/* container, application */) {
    $('#loading-spinner-modal').removeClass('is-visible');
    $('#app-init-error').hide();

    window.clearTimeout(window._rsAppInitTimeout);
}

export default {
    name: 'init-app-window',
    initialize: initialize
};
