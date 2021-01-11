/* global $, logger, moment, Modernizr, mixpanel */

import Ember from 'ember';
import PositionController from './design/position';
import config from '../config/environment';
import { getImageURL } from '../utils/url-util';

export default Ember.Controller.extend({
    needs: ['application', 'interview'],
    store: Ember.inject.service(),

    designService: Ember.inject.service('design-service'),
    enableDirtyComponentObserver: false,
    ROUTES_TO_SAVE_FROM: [
        'design.position.index',
        'design.selector.index',
        'design.position.alternatives',
        'design.position.mirror',
        'design.selector.materials',
        'design.themes.confirm',    // TODO: remove redundant save code from themes & themes/confirm controller
        'design.selector.decals'            // TODO: remove redundant save code from decals controller
    ],

    init: function () {

        Ember.run.later(this, function () {
            this.set('enableDirtyComponentObserver', true);
        }, 0);

        var promptToSaveTimeout = Modernizr.touch ? config.APP.prompt_to_save_after_seconds_touch : config.APP.prompt_to_save_after_seconds;

        Ember.run.later(this, function () {
            this.promptToSave();
        }, promptToSaveTimeout);

        this.set('incrementalDesignTime', moment());

    },

    wasBuiltEarlierThan: function (appVersionToCompare) {
        if (!this.get('model.builtWithAppVersion')) {
            return false;
        }

        var toComparable = function (appVersion) {
            if (appVersion.length !== 12) {
                logger.warn('MalformedAppVersionWarning', 'Malformed app version: ' + appVersion);
                return 0;
            }

            return parseInt(appVersion.substr(0, 4) + appVersion.substr(6, 2));
        };

        return toComparable(appVersionToCompare) > toComparable(this.get('model.builtWithAppVersion'));
    },

    material: function () {

        return this.get('model.activeComponents').reduce(function (previousValue, component) {
            if (component.get('activeDecal.name') === previousValue) {
                return previousValue;
            } else {
                return this.get('i18n').t('selector.material_custom');
            }
        }.bind(this), this.get('model.activeComponents.firstObject.activeDecal.name'));

    }.property('mode.activeComponents.length', 'model.activeComponents.@each.activeDecal'),

    currency: Ember.computed.alias('model.currency'),

    localTotalPriceStr: function () {
        var p = this.get('model.localTotalPrice').toFixed(2);
        return isNaN(p) ? '-.--' : p;
    }.property('model.localTotalPrice'),

    userObserver: function () {
        try {
            if (this.get('model.user') && this.get('controllers.application')) {
                this.get('controllers.application').trigger('userDetailsChange', this.get('model.user'));
            }
        } catch (e) {
            logger.warn('LookupWarning', e);
        }
    }.observes('model.user.email').on('init'),

    kitColours: function () {
        var allColours = Ember.A([]);

        allColours = this.mkDesignerRuleLists(allColours, 'isColour');

        var colourObjects = allColours.map(function (id /*, index*/) {
            return this.store.getById('colour', id);
        }.bind(this));

        return colourObjects.uniq();

    }.property('model.fattributes.@each'),

    kitFonts: function () {  // FIXME doesn't appear to be executed ever.
        var allFonts = Ember.A([]);

        allFonts = this.mkDesignerRuleLists(allFonts, 'isFont');

        var fontObjects = allFonts.map(function (id /*, index*/) {
            return this.store.getById('font', id);
        }.bind(this));

        return fontObjects.uniq();

    }.property('model.fattributes.@each'),

    allColours: function () {
        var colourObjects = this.store.all('colour').map(function (item /*, index*/) {
            return item;
        });

        return colourObjects;
    }.property('model.fattributes.@each'),

    getUsedColours: function () {
        var controller = this,
            c = Ember.A();

        this.get('model.activePositions').forEach(function (position) {

            c.pushObjects(
                PositionController.create({
                    model: position,
                    store: controller.store,
                    container: controller.container
                }).get('usedColours')
            );
        });

        return c.uniq();
    },

    mkDesignerRuleLists: function (collection, type) {
        this.get('model.fattributes').forEach(function (fattribute) {
            if (fattribute.get(type)) {
                if (fattribute.get('designer.length') > 0) {
                    collection.pushObjects(fattribute.get('designer'));
                }
                if (fattribute.get('rule.length') > 0) {
                    collection.pushObjects(fattribute.get('rule'));
                }
            }
        });

        return collection.uniq();
    },

    saveToEmail (emailAddress) {
        return new Ember.RSVP.Promise((resolve, reject) => {
            const design = this.get('model');
            const user = design.get('user');

            if (!user || user.get('email') !== emailAddress) {
                design.set('user', this.store.createRecord('user', { email: emailAddress }));
            }

            this.get('designService')
                .toPNG(design)
                .then((selector) => {
                    const libraryEntry = this.store.createRecord('libraryEntry', { emailAddress, selector, design });

                    if (config.mixpanel.enabled) {
                        mixpanel.track('SaveToEmail', `Email address captured ${emailAddress}`);
                        mixpanel.alias(emailAddress);
                        mixpanel.people.set({ '$email': emailAddress, '$created': new Date() });
                    }
                    design.save().then(function () {
                        libraryEntry.save().then(resolve, reject);
                    }, (reject) => {
                        logger.warn('DesignControllerSaveToEmail', `Failed to save design to email ${reject}`);
                    });
                }, (reject) => {
                    logger.warn(
                        'DesignControllerSaveToEmailToPNG',
                        `Failed to return toPNG save design to email ${reject}`
                    );
                });
        });
    },

    getPlaceholderGraphic: function () {
        // this is the placeholder / "change me" graphic used when a user adds
        // a new graphic icon in the editor

        var controller = this;

        return new Ember.RSVP.Promise(function (resolve, reject) {

            if (controller.get('model.graphics').isAny('isPlaceholder', true)) {
                resolve(controller.get('model.graphics').filterBy('isPlaceholder', true).get('firstObject'));
            } else {
                var placeholder = controller.get('store').createRecord('graphic', {
                    name: 'Placeholder Graphic',
                    isDesigner: false,
                    isUserAdded: true,
                    isPlaceholder: true,
                    multicoloured: true,
                    tags: []
                });

                Ember.$.get(getImageURL(controller.get('placeholderPath')),
                    function (data) {
                        Ember.run(function () {
                            placeholder.set('graphicData', data);
                            controller.get('model.graphics').pushObject(placeholder);
                            resolve(placeholder);
                        });
                    },
                    'text')
                    .fail(function (e) {
                        logger.error('MissingPlaceholderImageError', 'Could not download the placeholder image: ' + e.message);
                        reject();
                    });
            }
        });
    },

    placeholderPath: function () {
        var locale = this.get('controllers.application.locale');
        return 'placeholders/placeholder.' + locale + '.svg';
    }.property('controllers.application.locale'),

    saveSocialShare () {
        const design = this.get('model');

        return new Ember.RSVP.Promise((resolve, reject) =>
            this.get('designService')
                .toPNG(design)
                .then((selector) => {
                    const socialShare = this.store.createRecord(
                        'socialShare',
                        {
                            design,
                            selector,
                            'description': design.get('description')
                        }
                    );

                    return socialShare.save();
                })
                .then((socialShare) =>
                    resolve(socialShare)
                )
                .catch(reject)
        );
    },

    promptToSave: function () {
        var hasPromptedToSave = this.get('model.hasPromptedToSave');
        if (hasPromptedToSave || !config.APP.features.prompt_to_save) {
            return;
        }

        var $helloSmallDevicesModalLength = $('#hello-small-screen-modal').length;

        var timeHasLapsed;
        if (Modernizr.touch) {

            if ($helloSmallDevicesModalLength) {
                timeHasLapsed = false;
            } else {
                timeHasLapsed = true;
            }
        } else {
            timeHasLapsed = true;
        }

        var $shepherdLength = $('.shepherd-step').length;
        var $modalLength = $('.modal:not("#error-modal")').length;

        if (config.APP.features.prompt_to_save && !hasPromptedToSave &&
            this.get('controllers.application.currentRouteName') === 'design.selector.index' && !$shepherdLength && !$modalLength &&
            timeHasLapsed) {

            this.set('model.hasPromptedToSave', true);
            this.startSaveTimerIfNeeded(5000);

            Ember.$('.facebook-share-btn').addClass('disabled');
            this.replaceRoute('design.selector.saveToEmail');
        }
    },

    handleCumulativeDesignTime() {

        if (!Number.isInteger(this.get('model.cumulativeDesignTime'))) {
            logger.warn('CumulativeDesignTimeWarning', 'Cumulative design time looks weird: ' + this.get('model.cumulativeDesignTime'));
            this.set('model.cumulativeDesignTime', 0);
        }

        var msSinceLastSaveThisSession = moment().diff(this.get('incrementalDesignTime'));

        if (Number.isInteger(msSinceLastSaveThisSession) && msSinceLastSaveThisSession > 0) {
            this.get('model').incrementProperty('cumulativeDesignTime', Math.floor(msSinceLastSaveThisSession / 1000));
        }

        if (this.get('model.cumulativeDesignTime') > config.APP.prompt_to_save_after_seconds) {
            this.promptToSave();
        }

        this.set('incrementalDesignTime', moment());
    },

    save: function () {

        if (this.get('model.isDestroyed') || !this.get('model.fattributes')) {
            return;
        }

        this.get('model.fattributes').forEach(function (a) {
            a.save(); // Fix for #281
        });

        this.handleCumulativeDesignTime();

        this.set('model.lastModifiedDate', moment().toISOString());
        this.get('model').incrementProperty('revision');

        var controller = this;

        this.get('model')
            .save()
            .then(function () {

                controller.setUnsavedWarning(false);

                Ember.run.later(this, function () {
                    if (controller && !controller.get('isDestroyed')) {
                        controller.set('delayedSaveActive', false);
                    }
                }, 500);
            })
            .catch(
                function (reason) {
                    logger.warn('KitSaveWarning', 'Could not save a design: ' + (reason.statusText ? reason.statusText : reason));
                    controller.set('delayedSaveActive', false);
                }
            );
    },

    saveIfModified() {
        if (this.get('model.isDestroyed') || !this.get('model.fattributes')) {
            return;
        }
        let dirtyFattributes = this.get('model.fattributes').filterBy('isDirty');

        if (this.get('model.isDirty') || dirtyFattributes.length) {
            this.startSaveTimer({timeout: 1});
        }
    },

    startSaveTimer: function (newOptions) {  // shared with editor.
        if (config.APP.autosave) {
            this.set('delayedSaveActive', true);
            this.setUnsavedWarning(true);

            Ember.run.cancel(this.get('saveTimer'));
            this.set('saveTimer', Ember.run.later(this, 'save', newOptions.delay));
        }
    },

    startSaveTimerIfNeeded: function (delay) {

        var currentRoute = this.get('controllers.application').get('currentRouteName');   // TODO: check if routeCondition can be deleted
        var routeCondition = currentRoute === undefined || this.ROUTES_TO_SAVE_FROM.contains(currentRoute);

        if (!this.get('delayedSaveActive') && routeCondition) {

            this.startSaveTimer({delay: delay});
        }
    },

    setUnsavedWarning: function (isActive) {
        if (config.APP.features.design_not_saved_alert) {
            window.onbeforeunload = function () {
                return isActive ? 'Design is not saved yet' : undefined;
            };
        }
    },

    dirtyComponentObserver: function () {  // called 8 times on kit init
        if (this.get('enableDirtyComponentObserver')) {
            this.startSaveTimerIfNeeded(5000);
        }
    }.observes(
        'model.positions.@each.activeComponent',
        'model.components.@each.activeShape',
        'model.components.@each.activeDecal',
        'model.components.@each.quantity',
        'model.positions.@each.isIncluded',
        'model.features.@each.deleted',
        'model.features.@each.zIndex',
        'model.features.length'
    ),

    actions: {
        removeComponentsWithZeroQuantity: function () {
            this.get('model.components').filterBy('quantity', '0').forEach(function (component) {
                component.get('position').deactivate();
            });
        }
    }

});

