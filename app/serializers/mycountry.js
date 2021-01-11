import ApplicationSerializer from './application';
import SerializerMixin from '../mixins/serializer';
import config from '../config/environment';

export default ApplicationSerializer.extend(SerializerMixin, {

    extractArray: function (store, type, payload, id, requestType) {
        if (config.APP.testing && config.APP.regionOverride) {
            payload.mycountry.forEach(function (mycountry) {
                mycountry.country = config.APP.regionOverride;
            });
        }
        return this._super(store, type, payload, id, requestType);
    }
});
