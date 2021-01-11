import Ember from 'ember';
import config from '../../../config/environment';

export default Ember.View.extend({
    templateName: 'design/editor/remove-feature',
    classNames: ['btn', 'btn-xs', 'btn-danger', 'remove-feature'],
    attributeBindings: ['name'],

    name: function () {
        var activeFeature = this.get('controller.model');
        var name_attr = activeFeature.get('name').camelize() + 'Delete';
        return name_attr;
    }.property('controller.model.name'),

    click: function () {
        this.removeFeature();
    },

    removeFeature: function () {
        this.get('controller.controllers.design/editor').send('removeActiveFeature');
    },

    didInsertElement: function () {
        if (config.APP.tooltips && this.$()) {
            this.$().find('i').tooltip({'title': this.get('controller').get('i18n').t('editor.remove_feature')});
        }
    },

    willDestroyElement: function () {
        if (config.APP.tooltips && this.$() && this.$().tooltip) {
            this.$().find('i').tooltip('destroy');
        }
    }
});
