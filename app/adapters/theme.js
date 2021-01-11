import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({

    coalesceFindRequests: false,

    buildURL: function (type, id) {
        if (id) {
            return '/api/theme/' + id;
        } else {
            return this._super(type, id);
        }
    }
});
