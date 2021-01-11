import Ember from 'ember';
import config from '../../config/environment';

export default Ember.Component.extend({
    tagName: 'div',
    viewed: false,
    isAuthenticated: false,
    i18n: Ember.inject.service(),

    updateTooltip: function () {
        let self = this;

        if (config.APP.tooltips && this.$()) {
            let el = this.$('.rs-icon');
            let i18n = this.get('i18n');

            el.tooltip({
                'trigger': 'hover',
                'delay': 50,
                'title': function () {
                    let isAuthenticated = self.get('isAuthenticated');
                    let viewed = self.get('viewed');

                    if (!isAuthenticated) {
                        return i18n.t('themes.preview_gallery.viewed.not_logged_in');
                    } else if (viewed) {
                        return i18n.t('themes.preview_gallery.viewed.viewed');
                    } else {
                        return i18n.t('themes.preview_gallery.viewed.not_viewed');
                    }
                }
            });
        }
    }.on('didInsertElement'),

    viewedChange: function () {
        this.updateTooltip();
    }.observes('viewed', 'isAuthenticated')
});
