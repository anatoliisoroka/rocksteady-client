import Ember from 'ember';
import DS from 'ember-data';

export default DS.ActiveModelSerializer.extend({
    modelNameFromPayloadKey: function (root) {
        var camelized = Ember.String.camelize(root);
        return Ember.String.singularize(camelized);
    }
});

