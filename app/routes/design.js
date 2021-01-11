/* global logger */

import Ember from 'ember';
import rsLogger from '../lib/rs-logger';

export default Ember.Route.extend({

    titleToken: function () {
        return this.controllerFor('design').get('model.description');
    },

    model: function (params) {
        var route = this;

        if (params.design_id === 'undefined') {
            this.transitionTo('interview');
        }

        return new Ember.RSVP.Promise(function (resolve, reject) {
            route.store.find('design', params.design_id).then(
                function (design) {

                    var promises = [
                        route.store.find('productLine'),
                        route.store.findAll('colour'),
                        design.get('graphics'),
                        loadAllFontsIntoDesignRecord(design, route.store),  // going to ignore fontId's which came in 'designRecord' from REST
                        design.get('features'),
                        design.get('shapes'),
                        design.get('fattributes'),
                        design.get('positions'),
                        design.get('decals'),
                        design.get('components'),
                        design.get('target'),
                        design.get('targetKit')
                    ];

                    if (route.store.all('region').get('length') === 0) {
                        promises.push(route.store.find('region'));
                    }
                    if (route.store.all('mycountry').get('length') === 0) {
                        promises.push(route.store.find('mycountry'));
                    }

                    Ember.RSVP.all(promises).then(function () {

                            design.set('colours', route.store.all('colour'));

                            if (design.get('isComplete')) {
                                // if no createDate then treat as first build
                                if (!design.get('createdDate')) {
                                    design.firstBuild();
                                }

                                route.setDesignCurrency(design);
                                route.setDesignLocale(design);
                                route.setSmartTags(design);
                                route.setStrokeDefaults(design);

                                design.prepareForRender();

                                resolve(design);

                            } else {
                                reject('Could not open incomplete design ' + design.get('id'));
                            }
                        },

                        function (message) {
                            logger.error('KitRoutingError', 'Could not open part of the design ' + params.design_id + ' because "' + JSON.stringify(message) + '"');
                            reject('Could not open part of the design.');
                        });
                },
                function (message) {
                    logger.error('KitRoutingError', 'Could not open the design ' + params.design_id + ' because "' + JSON.stringify(message) + '"');
                    reject('Could not open the design.');
                });
        });
    },

    afterModel: function () {
        this.controllerFor('application').send('popSpinner'); // this was pushed at design loading
        this.controllerFor('application').send('popSpinner'); // this was pushed at "Build Kit"
    },
    didTransition: function() {

        this.get('model').save();
    },

    actions: {
        loading: function (/*transition, originRoute*/) {
            this.controllerFor('application').send('pushSpinner');
        },

        error: function (e) {
            this.controllerFor('application').send('showApplicationError', e);
        }
    },

    obtainRegionByCountryCode (countryCode) {
        return this
            .store.all('region')
            .filterBy('iso_alpha_2', countryCode)
            .get('firstObject');
    },

    setDesignCurrency: function (design) {
        if (!design.get('currency')) {
            let region = this.obtainRegionByCountryCode(
                this.store
                    .all('mycountry')
                    .get('firstObject.country')
            );

            if (!region) {
                rsLogger.warn('Country not found - default to US');
                region = this.obtainRegionByCountryCode('US');
            }
            const regionCurrency = region.get('currency');
            const currency = regionCurrency ? regionCurrency : this.store.all('currency').filterBy('code', 'USD');

            design.set('currency', currency);
        }
    },

    setDesignLocale: function (design) {
        design.set('locale', this.controllerFor('application').get('locale'));
    },

    setSmartTags: function (design) {
        this.store.unloadAll('tag');
        this.store.find('tag', {filter: 'suggestions', type: 'graphics'});

        [
            design.get('nationality.name'),
            design.get('targetCategory.name'),
            design.get('manufacturer.name'),
            design.get('target.name'),
            design.get('ruleSet.name'),
            design.get('useCategory.name')
        ].forEach(function (tag) {
            if (tag) {
                var tagObject = {id: tag, type: 'graphics'};
                this.store.push('tag', tagObject);
            }
        }.bind(this));
    },

    setStrokeDefaults (design) {
        const strokeDefaults = [
            { key: 'strokeInternal1', value: '1' },
            { key: 'strokeFront1', value: '0' }
        ];

        design.get('features')
            .filterBy('type', 'ComponentShape')
            .filterBy('position.design')
            .forEach((feature) =>
                strokeDefaults
                    .filter(({ key }) => !feature.getAttribute(key))
                    .forEach(({ key, value }) =>
                        feature.setAttribute(key, value)
                    )
            );
    }
});

function loadAllFontsIntoDesignRecord(designRecord, store) {

    return new Ember.RSVP.Promise(function(resolve) {
        store.find('font')          // fetch all font id's from REST
            .then(function (fontsRecordArray) {
                designRecord.set('fonts', fontsRecordArray);
                reloadFontsInRecord(designRecord, resolve);
            });
    });
}

function reloadFontsInRecord(record, callback) {
    record.get('fonts').then(function (fonts) {   // request REST resource with all id's
        fonts.reload().then(callback);
    });
}
