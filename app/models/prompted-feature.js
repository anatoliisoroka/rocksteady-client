import Ember from 'ember';
import DS from 'ember-data';

export default DS.Model.extend({

    i18n: Ember.inject.service(),
    // The 'name' property is the primary key
    displayName: DS.attr('string'),
    defaultValue: DS.attr('string'),
    value: DS.attr('string'),

    attrName: function () {
        return this.get('id').camelize();
    }.property('id'),

    translateKey: function () {
        return 'promptedfeatures.' + this.get('displayName').camelize().toLowerCase();
    }.property('displayName'),

    placeholderTranslateKey: function () {
        if (this.get('displayName') === 'User Name') {
            return this.get('i18n').t('promptedfeatures.' + this.get('displayName').camelize().toLowerCase() + '_placeholder');
        } else {
            return this.get('defaultValue');
        }
    }.property('displayName')

});
