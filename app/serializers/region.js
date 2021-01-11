import ApplicationSerializer from './application';
import SerializerMixin from '../mixins/serializer';
import config from '../config/environment';

export default ApplicationSerializer.extend(SerializerMixin, {

    extractArray: function (store, type, payload, id, requestType) {
        //FIXME this may no longer be needed as current flag is now obsolete
        if (config.APP.testing && config.APP.regionOverride) {
            payload.regions.forEach(function (r) {
                r.current = false;

                if (r.iso_alpha_2 === config.APP.regionOverride) {
                    r.current = true;
                }
            });
        }

        return this._super(store, type, payload, id, requestType);
    }

});


