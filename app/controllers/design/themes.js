/* global _ */
import Ember from 'ember';
import config from '../../config/environment';

/** @namespace Ember.Controller */
export default Ember.Controller.extend({

    queryParams: [{'currentPage': 'page'}, 'activeFiltersParam', 'activeCategoriesParam'],

    needs: ['design', 'application', 'design/selector'],

    authentication: Ember.inject.service(),

    isAuthenticated: Ember.computed.alias('authentication.isAuthenticated'),
    userName: Ember.computed.alias('authentication.user.name'),
    userEmail: Ember.computed.alias('authentication.user.email'),

    firstInitial: function () {
        let userName = this.get('userName');
        if (!userName) {
            return null;
        }
        return userName[0].toUpperCase();
    }.property('userName'),

    userMenuOpen: false,

    hasSubmitted: false,

    sortFields: function () {
        let themes = this.get('model.themes');
        let allFlags = [];

        themes.forEach(function (theme) {
            let flags = theme.get('flags') || [];
            allFlags = allFlags.concat(flags);
        });

        let sortFields = _.uniqBy(allFlags, 'name').map(function (flag) {
            return (flag.name || '').toLowerCase();
        });

        let isAuthenticated = this.get('isAuthenticated');

        if (isAuthenticated) {
            sortFields = sortFields.concat(['user-viewed', 'user-bookmarked']);
        }

        sortFields.push('engagement-metric');

        if (config.APP.themes && config.APP.themes.display_order_options_order) {
            const displayOrderOptionsOrder = config.APP.themes.display_order_options_order;
            let sortedSortFields = [];

            displayOrderOptionsOrder.forEach((optionName) => {
                let index = sortFields.indexOf(optionName);
                if (index >= 0) {
                    sortedSortFields.push(optionName);
                }
            });

            return sortedSortFields;
        }

        return sortFields;
    }.property('model.themes.@each.flags', 'isAuthenticated'),

    authenticationStateChange: function () {
        let isAuthenticated = this.get('isAuthenticated');
        let sortOrderSelection = this.get('sortOrderSelection');
        let hasUserDependantSelection = (sortOrderSelection === 'user-viewed' || sortOrderSelection === 'user-bookmarked');

        if (!isAuthenticated && hasUserDependantSelection) {
            this.set('sortOrderSelection', '');
        }
    }.observes('isAuthenticated'),

    sortOrderSelection: '',

    currentPage: 0,
    numberOfPages: 0,
    itemsPerPage: 1,

    /* Categories/Filters */

    //Default the active filters URL param to empty array []
    activeCategoriesParam: 'W10=',

    //Decode/Encode the active filters from/to the URL
    activeCategoriesDeSerialised: Ember.computed('activeCategoriesParam', {
        get(/*key*/) {
            let activeCategoriesParam = this.get('activeCategoriesParam');
            if (activeCategoriesParam) {
                let activeCategoriesDeSerialised = [];
                try {
                    activeCategoriesDeSerialised = JSON.parse(atob(this.get('activeCategoriesParam')));
                } catch (e) {
                    activeCategoriesDeSerialised = [];
                }
                return activeCategoriesDeSerialised;
            } else {
                return [];
            }
        },
        set(key, value) {
            this.set('activeCategoriesParam', btoa(JSON.stringify(value || '[]')));
            return value;
        }
    }),

    //If the active filters url param changes (say using back/forward navigation) we should update the model
    updateActiveCategories: function () {
        let categoryFilters = this.get('categoryFilters');
        let activeCategoriesParam = this.get('activeCategoriesDeSerialised');

        if (activeCategoriesParam) {
            categoryFilters.forEach(function (category) {

                let foundCategory = _.find(activeCategoriesParam, {name: category.name});

                if (foundCategory) {
                    Ember.set(category, 'active', true);
                } else {
                    Ember.set(category, 'active', false);
                }
            });
        }
    }.observes('activeCategoriesDeSerialised'),

    orderedCategories: function () {
        return this.get('model.themeMetadata.ordered_categories') || [];
    }.property('model.themeMetadata.ordered_categories'),

    categoryFilters: function () {
        let orderedCategories = this.get('orderedCategories');
        let categoryFilters = [];

        orderedCategories.forEach(function (category) {
            categoryFilters.push({
                name: category,
                active: false
            });
        });

        return categoryFilters;
    }.property('orderedCategories'),

    activeCategories: function () {
        let categoryFilters = this.get('categoryFilters');
        let activeCategories = categoryFilters.filter(function (category) {
            return category.active;
        });

        this.set('previousCategory', null);

        this.set('activeCategoriesDeSerialised', activeCategories);

        return activeCategories;
    }.property('categoryFilters.@each.active'),

    /* Filters */

    //Default the active filters URL param to empty array []
    activeFiltersParam: 'W10=',

    //Decode/Encode the active filters from/to the URL
    activeFiltersDeSerialised: Ember.computed('activeFiltersParam', {
        get(/*key*/) {
            let activeFiltersParam = this.get('activeFiltersParam');
            if (activeFiltersParam) {
                let activeFiltersDeSerialised = [];
                try {
                    activeFiltersDeSerialised = JSON.parse(atob(this.get('activeFiltersParam')));
                } catch (e) {
                    activeFiltersDeSerialised = [];
                }
                return activeFiltersDeSerialised;
            } else {
                return [];
            }
        },
        set(key, value) {
            this.set('activeFiltersParam', btoa(JSON.stringify(value || '[]')));
            return value;
        }
    }),

    //If the active filters url param changes (say using back/forward navigation) we should update the model
    updateActiveFilters: function () {
        let filtersCategorised = this.get('allFilters');
        let filtersParams = this.get('activeFiltersDeSerialised');

        if (filtersParams) {
            filtersCategorised.forEach(function (filter) {

                let foundFilter = _.find(filtersParams, {category: filter.category, name: filter.name});

                if (foundFilter) {
                    Ember.set(filter, 'active', true);
                } else {
                    Ember.set(filter, 'active', false);
                }
            });
        }
    }.observes('activeFiltersDeSerialised'),

    orderedFilters: function () {
        return this.get('model.themeMetadata.ordered_filters') || [];
    }.property('model.themeMetadata.ordered_filters'),

    allFilterGroups: function () {
        let themes = this.get('allThemes');
        let filterGroups = getFiltersForThemes(themes);

        filterGroups.forEach(function (filterGroup) {
            filterGroup.values.map(function (filter) {
                Ember.set(filter, 'visible', true);
                return filter;
            });
        });

        let filterGroupsSorted = [];
        let orderedFilters = this.get('orderedFilters');

        orderedFilters.forEach(function (orderedName) {
            let group = _.find(filterGroups, {name: orderedName});
            if (group && group.values) {
                filterGroupsSorted.push(group);
            }
        });

        return filterGroupsSorted;
    }.property('allThemes', 'orderedFilters'),

    previousCategory: null,

    allFilters: function () {
        let allFilterGroups = this.get('allFilterGroups');
        let allFilters = [];
        let self = this;

        allFilterGroups.forEach(function (filterGroup) {
            allFilters = allFilters.concat(filterGroup.values);
            filterGroup.values.forEach(function (value) {
                Ember.addObserver(value, 'active', function (updatedFilter) {
                    self.set('previousCategory', updatedFilter.category);
                });
            });
        });

        return allFilters;
    }.property('allFilterGroups.@each'),

    activeFilters: function () {
        let allFilters = this.get('allFilters');

        let activeFilters = allFilters.filter(function (filter) {
            return (filter.active && filter.visible) ? filter : false;
        });

        this.set('activeFiltersDeSerialised', activeFilters);

        return activeFilters;
    }.property('allFilters.@each.active', 'allFilters.@each.visible'),

    filterActiveCategories: function () {
        let allFilters = this.get('allFilters');

        let activeFilters = allFilters.filter(function (filter) {
            return (filter.active && filter.visible) ? filter : false;
        });

        let activeCategories = _.keys(_.groupBy(activeFilters, 'category'));

        return activeCategories;
    }.property('allFilters.@each.active', 'allFilters.@each.visible'),

    filtersCategorisedFiltered: function () {
        let allFilterGroups = this.get('allFilterGroups');
        let themesCategorisedFiltered = this.get('themesCategorisedFiltered');
        let filtersCategorised = getFiltersForThemes(themesCategorisedFiltered);
        let previousCategory = this.get('previousCategory');

        updateFilterGroups(allFilterGroups, filtersCategorised, previousCategory);

        return allFilterGroups;
    }.property('themesCategorisedFiltered.@each'),

    /* Themes */

    allThemes: function () {
        let controller = this;

        let allThemes = this.get('model.themes').map(function (theme) {
            theme.set('priceDiff', (controller.get('controllers.design.model.localBasePrice') * parseFloat(theme.get('price'))).toFixed(2));
            return theme;
        });

        return allThemes;

    }.property('model.themes.length', 'currency', 'controllers.design.model.localBasePrice'),

    themesCategorised: function () {
        let allThemes = this.get('allThemes');
        let activeCategories = this.get('activeCategories');

        if (this.get('activeCategories').length === 0) {
            return allThemes;
        }

        let themesCategorised = allThemes.filter(function (theme) {
            let themeCategory = theme.get('category');
            let themeHasActiveFilter = false;

            activeCategories.forEach(function (category) {
                let categoryName = category.name;
                let hasActive = (themeCategory === categoryName);

                themeHasActiveFilter = themeHasActiveFilter || hasActive;
            });

            return themeHasActiveFilter;
        });

        return themesCategorised;

    }.property('activeCategories.@each', 'allThemes.length'),

    themesCategorisedFiltered: function () {
        let themesCategorised = this.get('themesCategorised');
        let activeFilters = this.get('activeFilters');

        if (activeFilters.length === 0) {
            return themesCategorised;
        }

        // let activeFiltersCategorised = this.get('activeFilters');
        let activeFiltersGrouped = _.groupBy(activeFilters, 'category');

        let categorisedFilteredThemes = themesCategorised.filter(function (theme) {
            let themeFilters = theme.get('filtersFlattened');
            let matchedCategories = {};

            _.forEach(activeFiltersGrouped, function (category, k) {
                matchedCategories[k] = false;
                category.forEach(function (filter) {
                    let filterName = filter.name;
                    let filterCategory = filter.category;
                    let hasActive = _.find(themeFilters, {name: filterName, category: filterCategory});
                    if (hasActive) {
                        matchedCategories[k] = true;
                    }
                });
                if (!matchedCategories[k]) {
                    return false;
                }
            });


            if (_.every(matchedCategories)) {
                return theme;
            }
        });

        return categorisedFilteredThemes;

    }.property('activeFilters.@each.active', 'themesCategorised.@each'),

    themesCategorisedFilteredSorted: function () {
        let categorisedFilteredThemes = this.get('themesCategorisedFiltered');
        let sortOrderSelection = this.get('sortOrderSelection');

        if (sortOrderSelection === 'engagement-metric') {
            let themesConfig = config.APP.themes;
            let engagementMetricName = 'theme_applied';

            if (themesConfig && themesConfig.engagement_metric) {
                engagementMetricName = themesConfig.engagement_metric;
            }

            return sortThemesByPropertyValue(categorisedFilteredThemes, engagementMetricName);
        } else if (sortOrderSelection === 'user-bookmarked') {
            return sortThemesByProperty(categorisedFilteredThemes, 'bookmark');
        } else if (sortOrderSelection === 'user-viewed') {
            return sortThemesByProperty(categorisedFilteredThemes, 'viewed', true);
        } else if (sortOrderSelection) {
            return sortThemesByFlag(categorisedFilteredThemes, sortOrderSelection);
        } else {
            return sortThemesById(categorisedFilteredThemes);
        }
    }.property('themesCategorisedFiltered.@each', 'sortOrderSelection'),

    currency: Ember.computed.alias('controllers.design.model.currency'),

    /* Pagination */

    //Using .property or computed was causing the child views to re-render
    itemsPerPageCalc: function () {
        let currentBreakpoint = this.get('controllers.application.bootstrapBreakpoint');

        if (currentBreakpoint === 'lg' || currentBreakpoint === 'md') {
            this.set('itemsPerPage', 4);
        } else if (currentBreakpoint === 'sm') {
            this.set('itemsPerPage', 2);
        } else {
            this.set('itemsPerPage', 1);
        }
    }.observes('controllers.application.bootstrapBreakpoint').on('init'),

    resetCurrentPage: function () {
        this.set('currentPage', 0);
    }.observes('numberOfPages'),

    boundCurrentPage: function () {
        let currentPage = this.get('currentPage');
        let numberOfPages = this.get('numberOfPages');

        if (currentPage < 0) {
            Ember.run.next(this, function () {
                this.transitionToRoute({queryParams: {currentPage: 0}});
            });
        } else if (numberOfPages > 0 && currentPage > numberOfPages - 1) {
            Ember.run.next(this, function () {
                this.transitionToRoute({queryParams: {currentPage: numberOfPages - 1}});
            });
        }
    }.observes('currentPage', 'numberOfPages'),

    nextPage: function () {
        return this.get('currentPage') + 1;
    }.property('currentPage'),

    previousPage: function () {
        return this.get('currentPage') - 1;
    }.property('currentPage'),

    paginatedThemes: function () {
        let themesCategorisedFilteredSorted = this.get('themesCategorisedFilteredSorted');
        let numberOfThemes = themesCategorisedFilteredSorted.length;
        let currentPage = this.get('currentPage');
        let itemsPerPage = this.get('itemsPerPage');

        let numberOfPages = Math.ceil(numberOfThemes / itemsPerPage);

        this.set('numberOfPages', numberOfPages);

        let itemIndexStart = currentPage * itemsPerPage;
        let itemIndexEnd = itemIndexStart + itemsPerPage;

        return themesCategorisedFilteredSorted.slice(itemIndexStart, itemIndexEnd);
    }.property('themesCategorisedFilteredSorted', 'currentPage', 'itemsPerPage'),

    /* Theme application */

    applyTheme(theme) {
        const design = this.get('controllers.design.model');

        this.unapplyTheme();
        this.unloadDesignFeaturesAndAttributes(
            design.get('features'),
            theme.get('features').mapBy('id')
        );

        design.get('positions')
            .rejectBy('activeComponent', null)
            .forEach((position) =>
                position.setDefaultShape()
            );

        const iconsToFetch = getIconsMissingFromDesign(design, theme);

        return fetchMissingIcons(iconsToFetch, this.store)
            .then((iconData) => {
                if (iconData) {
                    design.get('graphics').pushObjects(iconData);
                }

                updateThemeModel(theme, design);
                design.set('theme', theme);
                disableMissingPositions(
                    theme,
                    design.get('positions'),
                    this.get('controllers.application')
                );
            });
    },

    unloadDesignFeaturesAndAttributes(designFeatures, themeFeatureIds) {
        designFeatures
            .filterBy('canModify')
            .reject((feature) => themeFeatureIds.includes(feature.get('id')))
            .forEach((feature) =>
                feature.unload()
            );
    },

    unapplyTheme() {
        this.get('controllers.design.model').set('theme', null);
    },

    finish() {
        this.get('controllers.design/selector')
            .rerender()
            .then(() => {
                this.get('controllers.application').send('popSpinner');
                this.replaceRoute('design.selector');
            });
    },

    isDesktop: function () {
        let bootstrapBreakpoint = this.get('controllers.application.bootstrapBreakpoint');
        return bootstrapBreakpoint && (bootstrapBreakpoint === 'md' || bootstrapBreakpoint === 'lg');
    }.property('controllers.application.bootstrapBreakpoint'),

    handleDeferredAuthAction: function () {
        let isAuthenticated = this.get('isAuthenticated');
        let deferredAuthAction = this.get('deferredAuthAction');

        let deferredAuthActionType = typeof deferredAuthAction;

        if (isAuthenticated && deferredAuthActionType === 'function') {
            deferredAuthAction();
            this.set('deferredAuthAction', null);
        }
    }.observes('isAuthenticated'),

    actions: {

        clearAllFilters: function () {
            let categoryFilters = this.get('categoryFilters');

            categoryFilters.forEach(function (category) {
                Ember.set(category, 'active', false);
            });

            let allFilters = this.get('allFilters');

            allFilters.forEach(function (filter) {
                Ember.set(filter, 'active', false);
                Ember.set(filter, 'visible', true);
            });

            this.set('sortOrderSelection', '');
        },

        selectTheme: function (theme) {
            if (theme.id) {
                this.transitionToRoute('design.themes.confirm', theme.id);
            }
        },

        nextPage: function () {
            this.incrementProperty('currentPage');
        },

        previousPage: function () {
            this.decrementProperty('currentPage');
        },

        changePage: function (pageNumber) {
            this.set('currentPage', pageNumber);
        },

        gotToPage: function (pageNumber) {
            let index = pageNumber - 1;
            this.set('currentPage', index);
        },

        submitComingSoon() {
            if (this.get('isEmailValid') && !this.get('hasSubmitted')) {
                let userEmail = this.get('userEmail');
                let feature = 'theme-request';
                let store = this.get('store');
                let design = this.get('controllers.design.model');

                let country = store
                    .all('mycountry')
                    .get('firstObject')
                    .get('country');

                let comingSoonData = {
                    email: userEmail,
                    feature: feature,
                    country: country,
                    designId: design.get('id'),
                    product: design.get('productLine.name'),
                    targetCategory: design.get('targetCategory.name'),
                    make: design.get('manufacturer.name'),
                    model: design.get('target.name'),
                    year: design.get('targetKit.name')
                };

                store
                    .createRecord('comingSoon', comingSoonData)
                    .save()
                    .then(() => {
                        this.set('hasSubmitted', true);
                    }, () => {
                        this.set('hasSubmitted', true);
                    });
            }
        },

        openAuthModal(deferredAuthAction) {
            this.set('deferredAuthAction', deferredAuthAction);
            this.set('authModalOpen', true);
        },

        closeAuthModal() {
            this.set('authModalOpen', false);
        },

        openComingSoonModal(subject, title, subtitle) {
            this.set('comingSoonModalSubject', subject || '');
            this.set('comingSoonModalTitle', title || '');
            this.set('comingSoonModalSubtitle', subtitle || '');
            this.set('comingSoonDesign', this.get('store').all('design').get('firstObject'));
            this.set('comingSoonModalOpen', true);
        }
    }
});

function fetchMissingIcons(iconIdsMissingFromKit, store) {
    if (!iconIdsMissingFromKit.length) {
        return Ember.RSVP.Promise.resolve();
    }

    const graphics = iconIdsMissingFromKit
        .reduce((acc, iconId) =>
            [...acc, store.find('graphic', iconId)], []);

    return Ember.RSVP
        .all(graphics)
        .then((resolvedGraphics) => resolvedGraphics);
}

function getIconsMissingFromDesign(design, theme) {
    return _.difference(
        theme.get('fattributes')
            .filterBy('isIcon')
            .mapBy('value')
            .uniq(),
        design.get('graphics')
            .mapBy('id')
    );
}

function updateThemeModel(themeModel, designModel) {
    themeModel.get('fattributes')
        .setEach('design', designModel);

    themeModel.get('features')
        .forEach((feature) => {
            feature.set('design', designModel);
            feature.prepareForRender();
        });
}

function disableMissingPositions(themeModel, designPositions, applicationController) {
    const themePositions = themeModel.get('features')
        .mapBy('position.id');

    designPositions
        .reject((position) =>
            themePositions.includes(position.get('id'))
        )
        .forEach((position) => {
            applicationController.send(
                'GAEvent',
                'Themes',
                'PositionDisable',
                themeModel.get('id'),
                position.get('id')
            );
            position.deactivate();
        });
}

function groupFiltersByCategory(filters) {
    return _.values(
        _.mapValues(_.groupBy(filters, 'category'), function (v, k) {
            return {
                name: k,
                values: v
            };
        })
    );
}

function updateFilterGroups(persistentFilterGroups, filterGroups, categoryLatestModified = '') {
    persistentFilterGroups.forEach(function (filterGroup) {
        let updatedFilterGroup = _.find(filterGroups, {name: filterGroup.name});

        filterGroup.values.forEach(function (filter) {
            let found = !!(updatedFilterGroup && _.find(updatedFilterGroup.values, {name: filter.name}));
            let inLastModified = (filter.category === categoryLatestModified);
            let isActive = filter.active;

            if (inLastModified || isActive) {
                Ember.set(filter, 'visible', true);
            } else {
                Ember.set(filter, 'visible', found);
            }
        });
    });
}

function getFiltersForThemes(themes) {
    let filters = [];

    themes.forEach(function (theme) {
        let themeFiltersFlattened = theme.get('filtersFlattened');
        filters = filters.concat(themeFiltersFlattened);
    });

    filters = _.uniqWith(filters, function (obj1, obj2) {
        return ((obj1.category === obj2.category) && (obj1.name === obj2.name));
    });

    return groupFiltersByCategory(filters);
}

function sortThemesByProperty(themes, prop, reverse = false) {
    return themes.sort(function (themeA, themeB) {
        let themePropA = !!themeA.get(prop);
        let themePropB = !!themeB.get(prop);

        if (themePropA === themePropB) {
            let themeIdA = themeA.get('numericId');
            let themeIdB = themeB.get('numericId');

            return (themeIdA > themeIdB) ? -1 : 1;
        }

        if (reverse) {
            return themePropB ? -1 : 1;
        }

        return themePropB ? 1 : -1;
    });
}

function sortThemesByPropertyValue(themes, prop) {
    return themes.sort(function (themeA, themeB) {
        let themeValA = themeA.get(prop) || 0;
        let themeValB = themeB.get(prop) || 0;

        if (themeValA === themeValB) {
            let themeIdA = themeA.get('numericId');
            let themeIdB = themeB.get('numericId');

            return (themeIdA > themeIdB) ? -1 : 1;
        }

        return (themeValA > themeValB) ? -1 : 1;
    });
}

function sortThemesByFlag(themes, flagName) {
    return themes.sort(function (themeA, themeB) {
        let themeFlagsA = themeA.get('flags');
        let flagA = _.find(themeFlagsA, (flag) => {
            return flag.name.toLowerCase() === flagName;
        });
        let themeFlagsB = themeB.get('flags');
        let flagB = _.find(themeFlagsB, (flag) => {
            return flag.name.toLowerCase() === flagName;
        });
        let flagValueA = (flagA && flagA.value);
        let flagValueB = (flagB && flagB.value);

        if (flagValueA === flagValueB) {
            let themeIdA = themeA.get('numericId');
            let themeIdB = themeB.get('numericId');

            return (themeIdA > themeIdB) ? -1 : 1;
        }

        return (flagValueB) ? 1 : -1;
    });
}

function sortThemesById(themes) {
    return themes.sort(function (themeA, themeB) {
        let themeIdA = themeA.get('numericId');
        let themeIdB = themeB.get('numericId');
        return (themeIdA > themeIdB) ? -1 : 1;
    });
}
