import ApplicationAdapter from './application';
import DataAdapterMixin from "../mixins/auth/data-adapter-mixin";
import config from "../config/environment";


export default ApplicationAdapter.extend(DataAdapterMixin, {
    coalesceFindRequests: false,

    buildURL(type, id) {
        let userEndpoint = config.APP.user_endpoint;
        let baseUrl = userEndpoint + '/bookmarked_themes';

        if (id) {
            return baseUrl + '/' + id;
        } else {
            return baseUrl;
        }
    },

    // This is set globally in init-adapters.js for generating ids for 'fattributes' client side
    generateIdForRecord: null
});
