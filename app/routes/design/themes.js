import rsLogger from '../../lib/rs-logger';

import Ember from 'ember';

export default Ember.Route.extend({
    beforeModel: function () {
        return new Ember.RSVP.Promise(function (resolve) {
            var model = this.modelFor('design');

            model.save().then(
                function (design) {
                    resolve(design);
                },
                function (error) {
                    rsLogger.error(error);
                    resolve([]);
                }
            );

        }.bind(this));

    },
    model: function (params) {
        //Default the active filters URL param to empty array []
        params.activeFiltersParam = params.activeFiltersParam || 'W10=';
        params.currentPage = params.currentPage || 0;

        return new Ember.RSVP.Promise(function (resolve) {
            let designModel = this.modelFor('design');
            let targetKitName = designModel.get('target.name');
            let targetCategoryName = designModel.get('targetCategory.name');
            let themeParams = {
                product_line_name: designModel.get('productLine.name'),
                manufacturer_name: designModel.get('manufacturer.name'),
                grouped_year: designModel.get('targetKit.name')
            };

            if (targetKitName) {
                themeParams.target_name = targetKitName;
            } else if (targetCategoryName) {
                themeParams.target_category_name = targetCategoryName;
            }

            let store = this.store;
            let model = {themes: [], themeMetadata: {}};

            store
                .find('theme', themeParams)
                .then(
                    (themes) => {
                        let themesMetadata = store.getById('themesMetadata', 0);
                        model.themeMetadata = themesMetadata;
                        model.themes = themes;

                        //Fetch all bookmarks/views to update theme models
                        let viewedThemesPromise = store.findAll('viewed-theme');
                        let bookmarkedThemesPromise = store.findAll('bookmarked-theme');

                        let themeIds = themes.map((theme) => {
                            return theme.get('id');
                        });

                        let themeMetricsPromise = store.findQuery('theme-metric', {id: themeIds});

                        return Ember.RSVP.all([viewedThemesPromise, bookmarkedThemesPromise, themeMetricsPromise]);
                    },
                    () => {
                        //Handle valid 404 cases
                        model.themeMetadata = [];
                        model.themes = [];
                    }
                ).then(() => {
                    resolve(model);
                }).catch(() => {
                    resolve(model);
                });
        }.bind(this));
    },

    afterModel: function () {
        this.controllerFor('application').send('popSpinner');
    },

    setupController: function (controller, model) {
        // Call _super for default behavior
        this._super(controller, model);
        // MOT-2184 When lastActivePosition is set the transition is triggered in the fabric map canvas view
        this.controllerFor('design.selector').set('lastActivePosition', null);
    },

    actions: {
        loading: function () {
            this.controllerFor('application').send('pushSpinner');
        },
        error: function (error) {
            rsLogger.error(error);
            this.controllerFor('application').send('popSpinner');
            this.transitionTo('design.selector');
        },
        willTransition: function () {
            Ember.$('.theme-tags li:first a').click();
        }

    }
});
