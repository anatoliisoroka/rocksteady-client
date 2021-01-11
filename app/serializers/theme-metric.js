import ApplicationSerializer from './application';

export default ApplicationSerializer.extend({
    extractArray: function (store, type, payload) {
        payload.theme_metrics.forEach((tm) => {
            tm.id = tm.theme_id + '_' + tm.name;
        });
        return this._super(...arguments);
    }
});
