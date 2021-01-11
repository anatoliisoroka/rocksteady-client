import Ember from 'ember';
import config from '../../config/environment';

export default Ember.Component.extend({
    tagName: 'div',
    i18n: Ember.inject.service(),

    didInsertElement: function () {
        let i18n = this.get('i18n');

        if (config.APP.tooltips && this.$()) {
            this.$().tooltip({
                'title': i18n.t('themes.preview_gallery.engagement_metric_tooltip')
            });
        }
    },
});
