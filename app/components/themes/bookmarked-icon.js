import Ember from 'ember';
import config from '../../config/environment';

export default Ember.Component.extend({
    tagName: 'div',
    bookmarked: false,
    isAuthenticated: false,
    i18n: Ember.inject.service(),

    updateTooltip: function () {
        let self = this;

        Ember.run.later(() => {
            if (config.APP.tooltips && this.$()) {
                let el = this.$('.rs-icon');
                let i18n = this.get('i18n');

                el.tooltip({
                    'trigger': 'hover',
                    'delay': 50,
                    'title': function () {
                        let isAuthenticated = self.get('isAuthenticated');
                        let bookmarked = self.get('bookmarked');

                        if (!isAuthenticated) {
                            return i18n.t('themes.preview_gallery.bookmark.not_logged_in');
                        } else if (bookmarked) {
                            return i18n.t('themes.preview_gallery.bookmark.bookmarked');
                        } else {
                            return i18n.t('themes.preview_gallery.bookmark.not_bookmarked');
                        }
                    }
                });

                el.on('hidden.bs.tooltip', function () {
                    if (!self.isDestroyed && !self.isDestroying) {
                        self.set('tooltipVisible', false);
                    }
                });

                el.on('shown.bs.tooltip', function () {
                    if (!self.isDestroyed && !self.isDestroying) {
                        self.set('tooltipVisible', true);
                    }
                });
            }
        }, 100);

    }.on('didInsertElement'),

    bookmarkChange: function () {
        this.updateTooltip();
        let tooltipVisible = this.get('tooltipVisible');

        if (tooltipVisible) {
            this.showTooltip();
        }
    }.observes('bookmarked', 'isAuthenticated'),

    showTooltip() {
        if (config.APP.tooltips && this.$()) {
            let el = this.$('.rs-icon');
            el.tooltip('show');
        }
    },

    click: function () {
        this.sendAction('bookmark');
    }
});
