import Ember from 'ember';
import config from '../../../config/environment';

export default Ember.View.extend({
    templateName: 'design/editor/clone-feature',
    classNames: ['btn', 'btn-xs', 'btn-info', 'clone-feature'],

    didInsertElement: function () {
        if (config.APP.tooltips && this.$()) {
            this.$().find('i').tooltip({'title': this.get('controller').get('i18n').t('editor.clone_feature')});
        }
    },

    willDestroyElement: function () {
        if (config.APP.tooltips && this.$() && this.$().tooltip) {
            this.$().find('i').tooltip('destroy');
        }
    },

    click: function () {
        this.cloneFeature();
    },

    cloneFeature: function () {
        this.get('controller.controllers.design/editor').send('cloneActiveFeature');
    }

});
