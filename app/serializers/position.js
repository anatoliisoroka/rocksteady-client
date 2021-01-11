import ApplicationSerializer from './application';
import SerializerMixin from '../mixins/serializer';

export default ApplicationSerializer.extend(SerializerMixin, {

    serializeHasMany: function (record, json, relationship) {
        let key = relationship.key;

        if (key === 'features') {
            let features = record.hasMany('features');
            let featuresToRemove = features.filter(function (feature) {
                return feature.attr('deleted');
            });

            features.removeObjects(featuresToRemove);
        }

        this._super.apply(this, arguments);
    },
});
