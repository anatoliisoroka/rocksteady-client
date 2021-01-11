import config from '../config/environment';

export function initialize(/* container, application */) {
    window.toastr.options.newestOnTop = true;
    window.toastr.options.timeOut = window.toastr.options.extendedTimeOut = config.APP.toastr_timeout;
    window.toastr.options.closeButton = true;
    window.toastr.options.showMethod = 'slideDown';
    window.toastr.options.preventDuplicates = false;
}

export default {
    name: 'init-toastr',
    initialize: initialize
};
