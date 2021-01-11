/* global $, logger */

export function initialize(application) {
    $(document).ajaxError(function (event, jqXHR, settings, exception) {

        var errorStatusClassification = '';
        if (jqXHR.status === 0) {
            errorStatusClassification = 'Not connected.\n Verify Network.';
        } else if (jqXHR.status === 404) {
            errorStatusClassification = 'Requested page not found. [404]';
        } else if (jqXHR.status === 500) {
            errorStatusClassification = 'Internal Server Error [500].';
        } else if (exception === 'parsererror') {
            errorStatusClassification = 'Requested JSON parse failed.';
        } else if (exception === 'timeout') {
            errorStatusClassification = 'Time out error.';
        } else if (exception === 'abort') {
            errorStatusClassification = 'Ajax request aborted.';
        } else {
            errorStatusClassification = 'Uncaught Error.\n' + jqXHR.responseText;
        }

        //Do not log cases where the user in unauthenticated
        if (jqXHR.status !== 401) {
            var ErrorCode = 'AjaxWarning ' + (jqXHR.status ? 'Status ' + jqXHR.status : 'Unknown Ajax Error'); // e.g. 500 error
            var ErrorMessage = '[api] ' + errorStatusClassification + ' on ' + settings.url;
            logger.warn(ErrorCode, ErrorMessage);

            if (window.toastr && jqXHR && jqXHR.readyState === 0) {
                application.container.lookup('controller:application').send('showNetworkConnectivityToast');
                application.container.lookup('controller:application').send('clearAllSpinners');
            }
        }
    });
    $.ajaxSetup({
        headers: {
            'Accept': 'application/json'
        }
    });
}

export default {
    name: 'init-ajax',
    initialize: initialize
};
