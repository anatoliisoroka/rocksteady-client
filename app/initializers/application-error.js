/* global $, logger */

import Ember from 'ember';

var handleRsError = function (message, file, line, col, error) {

    //https://bugs.chromium.org/p/chromium/issues/detail?id=662675&q=__gCrWeb&colspec=ID%20Pri%20M%20Stars%20ReleaseBlock%20Component%20Status%20Owner%20Summary%20OS%20Modified
    //https://rocksteady.atlassian.net/browse/MOT-106
    if (message.indexOf('__gCrWeb') !== -1) {
        return;
    }

    var msg = (typeof message.message === 'string' ? message.message : message);

    msg = msg.replace(/^Uncaught/, '');

    // logger.debug('Received window.rsShowAppError with message=' + msg);

    window._rsErrors.push(msg);

    if (!$('#error-modal').data('bs.modal') || !$('#error-modal').data('bs.modal').isShown) {
        $('.modal').modal('hide');
        $('.error-page').hide();
        $('#loading-spinner-modal').removeClass('is-visible');
        $('#error-modal-message').text(msg);

        if ($('#error-modal').length) {
            $('#error-modal').modal('show');
        } else {
            // catastrophic error - app hasn't even loaded the error modal view
            document.write(msg);
        }

        Ember.run.later(this, function () {
            $('#loading-spinner-modal').removeClass('is-visible');
        }, 1000);
    }

    logger.error('UnhandledGlobalError', 'Unhandled global error: ' + msg);

    throw error.stack || error;
};

export function initialize(/* container, application */) {
    window._rsErrors = [];

    $(window).on('rsShowAppError', (errEvent, err) => {
        const { message } = err;
        handleRsError(message, null, null, null, err);
    });

    window.onerror = handleRsError;
}

export default {
    name: 'application-error',
    initialize: initialize
};
