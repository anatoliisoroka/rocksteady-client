/* global Swipe, _ */
import Ember from 'ember';
import config from '../../config/environment';

/** @namespace Ember.Component */
export default Ember.Component.extend({
    store: Ember.inject.service(),

    analytics: Ember.inject.service(),

    authentication: Ember.inject.service(),
    isAuthenticated: Ember.computed.alias('authentication.isAuthenticated'),

    bookmarked: Ember.computed.alias('theme.bookmark'),
    viewed: Ember.computed.alias('theme.viewed'),

    // Analytics
    hasViewedTheme: false,

    // UI Flags
    previewFullScreen: false,
    infoOpen: false,
    showGridView: false,

    currentIndex: 0,

    tagName: 'div',

    classNames: ['theme-preview-container'],

    didInsertElement: function () {

        let self = this;

        let swipe = new Swipe(this.$('#slider')[0], {
            startSlide: 0,
            speed: 400,
            auto: 0,
            continuous: true,
            disableScroll: false,
            stopPropagation: true,
            callback: function (index) {
                self.set('currentIndex', index);
            }
        });

        this.set('swipe', swipe);

        this.$(window).on('throttledresize.preview-gallery', () => {
            let $el = self.$().find('.theme-overview-container');
            if ($el) {
                let el = $el[0];
                self.set('elWidth', el.getBoundingClientRect().width);
            }
        });
    },

    willDestroyElement: function () {
        this.$(window).off('throttledresize.preview-gallery');
    },

    popular: function () {
        let flags = this.get('theme.flags');
        return _.find(flags, {name: 'Popular', value: true});
    }.property('theme.flags'),

    new: function () {
        let flags = this.get('theme.flags');
        return _.find(flags, {name: 'New', value: true});
    }.property('theme.flags'),

    sortedPreviews: function () {
        let themePreviews = this.get('theme.previews') || [];

        let sortedPreviews = themePreviews.sort(function (preview1, preview2) {
            return (preview2.name === 'All Positions') ? 1 : -1;
        });

        return sortedPreviews;
    }.property('theme.previews.@each'),

    previewsChanged: function () {
        Ember.run.scheduleOnce('afterRender', this, function () {
            this.get('swipe').setup();
        });
    }.observes('sortedPreviews.@each'),

    numSlides: function () {
        if (this.get('theme.previews')) {
            return this.get('theme.previews').length;
        }
        return 0;
    }.property('theme.previews'),

    currentSlide: function () {
        let currentIndex = this.get('currentIndex');
        return currentIndex + 1;
    }.property('currentIndex'),

    currentPreview: function () {
        let currentIndex = this.get('currentIndex');
        let previews = this.get('sortedPreviews');
        if (previews) {
            return previews[currentIndex];
        }
    }.property('currentIndex', 'sortedPreviews'),

    previewFullScreenChange: function () {
        let previewFullScreen = this.get('previewFullScreen');
        let $imageContainer = this.$('.theme-preview-image-container');
        let $el = this.$();

        if (previewFullScreen) {
            $imageContainer.addClass('preview-full-screen');
            $el.attr({tabindex: 1});
            $el.focus();
        } else {
            $imageContainer.removeClass('preview-full-screen');
        }
        this.get('swipe').setup();

    }.observes('previewFullScreen'),

    gridViewChange: function () {
        let showGridView = this.get('showGridView');
        if (!showGridView) {
            Ember.run.scheduleOnce('afterRender', this, function () {
                this.get('swipe').setup();
            });
        }
    }.observes('showGridView'),

    keyDown: function (e) {
        let keyCode = e.keyCode;
        let self = this;
        let leftArrowKeyCode = 37;
        let rightArrowKeyCode = 39;
        let escapeKeyCode = 27;
        let previewFullScreen = self.get('previewFullScreen');

        if (previewFullScreen) {
            switch (keyCode) {
                case leftArrowKeyCode:
                    self.send('previousSlide');
                    break;
                case rightArrowKeyCode:
                    self.send('nextSlide');
                    break;
                case escapeKeyCode:
                    self.send('closeFullScreen');
                    break;
                default:
                    break;
            }
        }
    },

    _themeFilterSummary: function (summaryLength) {
        let category = this.get('theme.category');
        let orderedFilters = this.get('orderedFilters') || [];
        let filters = this.get('theme.filters');
        let sortedFilters = [];

        orderedFilters.forEach(function (filterName) {
            let filter = _.find(filters, {name: filterName});
            if (filter && _.isArray(filter.ordered_values)) {
                sortedFilters.push(filter.ordered_values);
            }
        });

        let i, j;
        let arrayDimensions = this._arrayDimensions2Max(sortedFilters);
        let row = [category];

        // Transpose and zip merge until row is long enough
        for (i = 0; i < arrayDimensions[1]; i++) {
            if (row.length >= summaryLength) {
                break;
            }

            for (j = 0; j < arrayDimensions[0]; j++) {
                if (row.length >= summaryLength) {
                    break;
                }

                if (sortedFilters[j]) {
                    let flag = sortedFilters[j][i];

                    if (flag) {
                        row.push(flag);
                    }
                }
            }
        }

        return row.join(', ');
    },

    themeSummary: function () {
        return this._themeFilterSummary(6);
    }.property('orderedFilters'),

    themeSummarySmall: function () {
        return this._themeFilterSummary(3);
    }.property('orderedFilters'),

    smallWidth: function () {
        let width = this.get('elWidth');
        return width ? width < 400 : true;
    }.property('elWidth'),

    engagementMetric: function () {
        let themesConfig = config.APP.themes;
        let engagementMetricName = 'theme_viewed';

        if (themesConfig && themesConfig.engagement_metric) {
            engagementMetricName = themesConfig.engagement_metric;
        }

        return this.get(`theme.${engagementMetricName}`) || 0;
    }.property('theme.theme_viewed', 'theme.theme_applied', 'theme.theme_purchased', 'theme.theme_info_viewed'),

    authenticationStateChange: function () {
        let isAuthenticated = this.get('isAuthenticated');
        let store = this.get('store');
        if (isAuthenticated) {
            //Fetch all bookmarks/views to update theme models
            store.findAll('bookmarked-theme');
            store.findAll('viewed-theme');
        } else {
            store.unloadAll('bookmarked-theme');
            store.unloadAll('viewed-theme');
        }
    }.observes('isAuthenticated'),

    themePreviewPositionChange: function () {
        let currentIndex = this.get('currentIndex');

        if (currentIndex > 0) {
            this.send('viewTheme');
        }
    }.observes('currentIndex'),

    themeInfoViewedEvent: function () {
        let infoOpen = this.get('infoOpen');
        if (infoOpen) {
            let themeId = this.get('theme.id');
            this.get('analytics').sendAnalyticsEvent('theme_info_viewed', themeId);
        }
    }.observes('infoOpen'),

    actions: {
        selectTheme: function (theme) {
            this.sendAction('selectTheme', theme);
        },

        previousSlide: function () {
            this.get('swipe').prev();
        },

        nextSlide: function () {
            this.get('swipe').next();
        },

        goToSlide(slideNumber) {
            this.get('swipe').slide(slideNumber, 0);
            this.send('closeGridView');
        },

        closeGridView: function () {
            this.set('showGridView', false);
        },

        toggleFullScreen: function () {
            this.toggleProperty('previewFullScreen');
        },

        openFullScreen: function () {
            this.set('previewFullScreen', true);
        },

        closeFullScreen: function () {
            this.set('previewFullScreen', false);
        },

        openInfo: function () {
            this.set('infoOpen', true);
        },

        closeInfo: function () {
            this.set('infoOpen', false);
        },

        toggleInfo: function () {
            this.toggleProperty('infoOpen');
        },

        bookmarkTheme: function () {
            let theme = this.get('theme');
            let themeId = this.get('theme.id');
            let store = this.get('store');
            let self = this;

            let bookmark = this.get('theme.bookmark');
            let isSaving = this.get('theme.bookmark.isSaving');

            if (!isSaving) {
                if (bookmark) {
                    bookmark.destroyRecord()
                        .then(() => {
                            store.unloadRecord(bookmark);
                        });
                } else {
                    let isAuthenticated = this.get('isAuthenticated');

                    let themeBookmark = store
                        .createRecord('bookmarked-theme', {themeId: themeId, theme: theme});

                    themeBookmark
                        .save()
                        .catch((/*error*/) => {
                            //Error bookmarking theme
                            store.unloadRecord(themeBookmark);
                            if (!isAuthenticated) {
                                self.sendAction('openAuthModal', () => {
                                    self.send('bookmarkTheme');
                                });
                            }
                        });

                    if (isAuthenticated) {
                        this.get('analytics').sendAnalyticsEvent('theme_bookmarked', themeId);
                    }
                }
            }
        },

        viewTheme: function () {
            let isSaving = this.get('theme.viewed.isSaving');
            let hasViewed = this.get('hasViewedTheme') || this.get('theme.viewed');

            if (!isSaving && !hasViewed) {
                let isAuthenticated = this.get('isAuthenticated');
                let theme = this.get('theme');
                let themeId = this.get('theme.id');

                this.set('hasViewedTheme', true);

                if (isAuthenticated) {
                    let store = this.get('store');

                    let themeViewed = store
                        .createRecord('viewed-theme', {themeId: themeId, theme: theme});

                    themeViewed
                        .save()
                        .catch(() => {
                            //Error viewing theme
                            store.unloadRecord(themeViewed);
                        });
                }

                this.get('analytics').sendAnalyticsEvent('theme_viewed', themeId);
            }
        }
    },

    _arrayDimensions2Max(array) {
        let maxLen = 0, i;
        let arrayLength = array.length;

        for (i = 0; i < arrayLength; i++) {
            maxLen = (maxLen < arrayLength ? arrayLength : maxLen);
        }

        return [arrayLength, maxLen];
    }
});
