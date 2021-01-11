/* global logger, $ , mixpanel */

import Ember from 'ember';
import config from '../config/environment';
import RegionMixin from '../mixins/region';

export default Ember.Controller.extend(Ember.Evented, RegionMixin, {

    needs: ['application', 'progressBar'],

    previousStep: undefined,
    activeStep: undefined,
    ruleSetSkipped: false,

    productLines: [],
    targets: [],
    manufacturers: [],
    targetKits: [],
    ruleSets: [],
    promptedFeatures: [],
    useCategories: [],
    uses: [],
    use1s: [],
    use2s: [],
    use3s: [],
    use4s: [],

    searchText: null,

    userInput: '',

    activeStepObserver: function () {
        this.skipStepChecker();
    }.observes('activeStep'),

    skipStepChecker: function () {
        var previousStepName = this.get('previousStep.name');
        var activeStepName = this.get('activeStep.name');

        //skip manufacturer if coming back from next interview step n length 0
        if (this.get('manufacturers.length') === 0 && previousStepName === 'TargetCategory' && activeStepName === 'Manufacturer') {
            window.history.back();
        }

        //skip ruleset if coming back from next interview step n skipped previously
        if (previousStepName === 'PromptedFeatures' && activeStepName === 'RuleSet' && !this.get('ruleSetSkipped')) {
            window.history.back();
        }

        //skip targetCategory if coming back from next interview step n length 1
        if (this.get('targetCategories.length') === 1 && (previousStepName === 'RuleSet' || previousStepName === 'PromptedFeatures') && activeStepName === 'TargetCategory') {
            window.history.back();
        }

        this.skipSpecificYear();
    },

    normaliseSearchString(searchString) {
        let ignoredCharacters = new RegExp(/[ -/]/g);
        return searchString
            .toLowerCase()
            .replace(ignoredCharacters, '');
    },

    splitSearchString(searchString) {
        return searchString
            .toLowerCase()
            .replace(/[-/]/g, '')
            .split(/ /g)
            .filter(function (el) {
                return el.length !== 0;
            });
    },

    // // MOT-2434 Automatically select and skip a specific year in the interview
    skipSpecificYear: function () {
        let yearToSkip = '4102';
        let stepName = 'GroupedYear';
        let previousStepName = this.get('previousStep.name');
        let activeStepName = this.get('activeStep.name');
        let targetKitsContentLength = this.get('targetKits.content.length');
        let targetKit = this.get('targetKits.content.firstObject');
        let groupedYear = this.get('targetKits.content.firstObject.qualifyingData');

        if (targetKitsContentLength === 1 && groupedYear === yearToSkip && activeStepName === stepName) {
            if (previousStepName === 'RuleSet') {
                window.history.back();
            } else {
                this.send('chooseGroupedYear', targetKit);
            }
        }
    }.observes('targetKits.@each'),

    searchResults: function () {
        let results, matches;
        let searchText = this.get('searchText');
        let targets = this.get('targets');
        let self = this;

        if (!self.get('searchText')) {
            results = targets;
        } else {
            let word = self.normaliseSearchString(searchText);
            let words = self.splitSearchString(searchText);

            // return a complete match
            matches = targets.filter(function (target) {
                if (target.get('name')) {
                    let name = self.normaliseSearchString(target.get('name'));
                    return name.indexOf(word) >= 0;
                } else {
                    return false;
                }
            });

            // otherwise return any word matches
            if (matches.length === 0) {

                matches = targets.filter(function (target) {

                    let name = self.normaliseSearchString(target.get('name'));

                    let words_found = words.filter(function (word) {
                        return name.indexOf(word) >= 0;
                    });

                    return words_found.length === words.length;
                });
            }

            results = matches;
        }

        return results;
    }.property('searchText', 'targets.@each'),

    descriptionObserver: function () {
        this.set('controllers.application.title', this.get('description'));
    }.observes('description'),

    hasNoProductLine: function () {
        return !this.get('model.productLine');
    }.property('model.productLine'),

    sortedUse1s: function () {
        return Ember.ArrayController.create({
            content: this.get('use1s'),
            sortProperties: ['name'],
            sortAscending: true
        }).get('arrangedContent');
    }.property('use1s.@each'),

    sortedUse2s: function () {
        return Ember.ArrayController.create({
            content: this.get('use2s'),
            sortProperties: ['name'],
            sortAscending: true
        }).get('arrangedContent');
    }.property('use2s.@each'),

    sortedUse3s: function () {
        return Ember.ArrayController.create({
            content: this.get('use3s'),
            sortProperties: ['name'],
            sortAscending: true
        }).get('arrangedContent');
    }.property('use3s.@each'),

    sortedUse4s: function () {
        return Ember.ArrayController.create({
            content: this.get('use4s'),
            sortProperties: ['name'],
            sortAscending: true
        }).get('arrangedContent');
    }.property('use4s.@each'),

    actions: {

        restartInterview: function () {
            this.transitionToRoute('interview');
        },

        submitTarget: function () {

            var searchResults = this.get('searchResults');

            if (searchResults.get('length') === 1) {
                this.send('chooseTarget', searchResults.get('firstObject'));
            } else if (searchResults.get('length') === 0) { // select 'None'
                this.send('skipTarget');
            }
        },

        selectRegion: function (region, context) {
            this._super(region, 'model.' + context);

            if (context === 'competingRegion' && (this.get('model.targetKit') || this.get('model.targetCategory'))) {

                if (!this.get('model.productLine.isRegulated')) {
                    return this.send('gotoPromptedFeatures');
                }

                this.transitionToRoute('interview.manufacturers.targets.targetCategories.groupedYears.region.ruleSets',
                                       this.get('model.productLine.slug'),
                                       (this.get('model.manufacturer') ? this.get('model.manufacturer.slug') : '-'),
                                       (this.get('model.target') ? this.get('model.target.slug') : '-'),
                                       (this.get('model.targetCategory') ? this.get('model.targetCategory.slug') : '-'),
                                       (this.get('model.targetKit') ? this.get('model.targetKit.slug') : '-'),
                                       this.get('model.competingRegion.slug')
                                      );
            }else{
                if(context === 'competingRegion'){
                    this.store.all('interview').get('firstObject').set('competingRegion', region);
                }else if(context === 'nationality'){
                    this.store.all('interview').get('firstObject').set('nationality', region);
                }
            }
        },

        selectUserFlag: function(region, promptedFeature){
            promptedFeature.set('value', region.get('id'));
            this.store.all('interview').get('firstObject').set('nationality', region);
        },

        chooseProductLine: function (productLine) {
            this.set('model.productLine', productLine);
            this.transitionToRoute('interview.manufacturers', this.get('model.productLine.slug'));
        },

        chooseManufacturer: function (manufacturer) {
            this.set('model.manufacturer', manufacturer);
            this.transitionToRoute('interview.manufacturers.targets',
                                   this.get('model.productLine.slug'),
                                   (this.get('model.manufacturer') ? this.get('model.manufacturer.slug') : '-'));
        },

        skipManufacturer: function () {
            this.set('model.manufacturer', null);
            this.transitionToRoute('interview.manufacturers.targets.targetCategories',
                                   this.get('model.productLine.slug'),
                                   '-',
                                   '-'
                                  );
        },

        chooseTarget: function (target) {
            this.set('model.target', target);
            this.transitionToRoute('interview.manufacturers.targets.targetCategories.groupedYears',
                                   this.get('model.productLine.slug'),
                                   this.get('model.manufacturer.slug'),
                                   (this.get('model.target') ? this.get('model.target.slug') : '-'),
                                   '-'
                                  );
        },

        skipTarget: function () {
            this.set('model.target', null);
            this.transitionToRoute('interview.manufacturers.targets.targetCategories',
                                   this.get('model.productLine.slug'),
                                   (this.get('model.manufacturer') ? this.get('model.manufacturer.slug') : '-'),
                                   '-'
                                  );
        },

        // this route and action is only available:  when you've skipped manufacturer or target
        // choosing out of target categories like: "Enduro Junior", "Classic Road"   TODO: rename this action towards reflecting semantic meaning
        chooseTargetCategory: function (targetCategory) {
            this.set('model.targetCategory', targetCategory);

            if (!this.get('model.productLine.isRegulated')) {
                return this.send('gotoPromptedFeatures');
            }

            this.transitionToRoute('interview.manufacturers.targets.targetCategories.groupedYears.region.ruleSets',
                                   this.get('model.productLine.slug'),
                                   (this.get('model.manufacturer') ? this.get('model.manufacturer.slug') : '-'),
                                   (this.get('model.target') ? this.get('model.target.slug') : '-'),
                                   (this.get('model.targetCategory') ? this.get('model.targetCategory.slug') : '-'),
                                   (this.get('model.targetKit') ? this.get('model.targetKit.slug') : '-'),
                                   this.get('model.competingRegion.slug')
                                  );
        },

        chooseGroupedYear: function (targetKit) {
            this.set('model.targetKit', targetKit);

            if (!this.get('model.productLine.isRegulated')) {
                return this.send('gotoPromptedFeatures');
            }

            this.transitionToRoute('interview.manufacturers.targets.targetCategories.groupedYears.region.ruleSets',
                                   this.get('model.productLine.slug'),
                                   (this.get('model.manufacturer') ? this.get('model.manufacturer.slug') : '-'),
                                   (this.get('model.target') ? this.get('model.target.slug') : '-'),
                                   (this.get('model.targetCategory') ? this.get('model.targetCategory.slug') : '-'),
                                   (this.get('model.targetKit') ? this.get('model.targetKit.slug') : '-'),
                                   this.get('model.competingRegion.slug')
                                  );
        },

        skipGroupedYear: function () {
            this.send('chooseGroupedYear', null);
        },

        chooseRuleSet: function (ruleSet) {
            this.set('model.ruleSet', ruleSet);
            this.transitionToRoute('interview.manufacturers.targets.targetCategories.groupedYears.region.ruleSets.useCategories',
                                   this.get('model.productLine.slug'),
                                   (this.get('model.manufacturer') ? this.get('model.manufacturer.slug') : '-'),
                                   (this.get('model.target') ? this.get('model.target.slug') : '-'),
                                   (this.get('model.targetCategory') ? this.get('model.targetCategory.slug') : '-'),
                                   (this.get('model.targetKit') ? this.get('model.targetKit.slug') : '-'),
                                   this.get('model.competingRegion.slug'),
                                   (this.get('model.ruleSet') ? this.get('model.ruleSet.slug') : '-')
                                  );
        },

        skipRuleSet: function () {
            this.set('model.ruleSet', null);
            this.set('model.useCategory', null);
            this.set('model.use1', null);
            this.set('model.use2', null);
            this.set('model.use3', null);
            this.send('gotoPromptedFeatures');
        },

        showCompetitionToast: function () {
            var message = this.get('i18n').t('interview.toast_ruleset_automatically_skipped', {
                country: this.get('model.competingRegion.name').toString()
            }).toString();

            Ember.run.later(this, function () {
                this.get('controllers.application').send(
                    'toast',
                    message,
                    'warning',
                    'toast-ruleset-automatically-skipped',
                    true,
                    {
                        onShown: () => {
                            $('.toast-ruleset-automatically-skipped:not(toast-close-button)').click(() => {
                                this.set('ruleSetSkipped', true);
                                this.send('gotoRuleSet');
                            });
                        },
                        onHidden: () => {
                            $('.toast-ruleset-automatically-skipped').off('click');
                        }
                    }
                );
            }, 600);
        },

        hideRuleSet () {
            this.set('ruleSetHidden', true);
            Ember.run.later(this, function () {
                this.set('ruleSetHidden', false);
            }, 2000);
        },

        gotoRuleSet: function () {
            this.transitionToRoute('interview.manufacturers.targets.targetCategories.groupedYears.region.ruleSets',
                this.get('model.productLine.slug'),
                (this.get('model.manufacturer') ? this.get('model.manufacturer.slug') : '-'),
                (this.get('model.target') ? this.get('model.target.slug') : '-'),
                (this.get('model.targetCategory') ? this.get('model.targetCategory.slug') : '-'),
                (this.get('model.targetKit') ? this.get('model.targetKit.slug') : '-'),
                this.get('model.competingRegion.slug'));
        },

        chooseUseCategory: function (useCategory) {
            this.set('model.useCategory', useCategory);
            this.transitionToRoute('interview.manufacturers.targets.targetCategories.groupedYears.region.ruleSets.useCategories.use1s',
                                   this.get('model.productLine.slug'),
                                   (this.get('model.manufacturer') ? this.get('model.manufacturer.slug') : '-'), (this.get('model.target') ? this.get('model.target.slug') : '-'),
                                   (this.get('model.targetCategory') ? this.get('model.targetCategory.slug') : '-'),
                                   (this.get('model.targetKit') ? this.get('model.targetKit.slug') : '-'),
                                   this.get('model.competingRegion.slug'),
                                   this.get('model.ruleSet.slug'),
                                   (this.get('model.useCategory') ? this.get('model.useCategory.slug') : '-')
                                  );
        },

        skipUseCategory: function () {
            this.set('model.useCategory', null);
            this.set('model.use1', null);
            this.set('model.use2', null);
            this.set('model.use3', null);
            this.send('gotoPromptedFeatures');
        },

        chooseUse1: function (use1) {
            this.set('model.use1', use1);

            if (this.get('uses').any(function (use) {
                return use.get('parent') === use1;
            })) {
                this.transitionToRoute('interview.manufacturers.targets.targetCategories.groupedYears.region.ruleSets.useCategories.use1s.use2s',
                                       this.get('model.productLine.slug'),
                                       (this.get('model.manufacturer') ? this.get('model.manufacturer.slug') : '-'),
                                       (this.get('model.target') ? this.get('model.target.slug') : '-'),
                                       (this.get('model.targetCategory') ? this.get('model.targetCategory.slug') : '-'),
                                       (this.get('model.targetKit') ? this.get('model.targetKit.slug') : '-'),
                                       this.get('model.competingRegion.slug'),
                                       this.get('model.ruleSet.slug'),
                                       this.get('model.useCategory.slug'),
                                       (this.get('model.use1') ? this.get('model.use1.slug') : '-')
                                      );
            } else {
                return this.send('gotoPromptedFeatures');
            }
        },

        skipUse1: function () {
            this.set('model.use1', null);
            this.set('model.use2', null);
            this.set('model.use3', null);
            this.set('model.use4', null);
            this.send('gotoPromptedFeatures');
        },

        chooseUse2: function (use2) {
            this.set('model.use2', use2);

            if (this.get('uses').any(function (use) {
                return use.get('parent') === use2;
            })) {
                this.transitionToRoute('interview.manufacturers.targets.targetCategories.groupedYears.region.ruleSets.useCategories.use1s.use2s.use3s',
                                       this.get('model.productLine.slug'),
                                       (this.get('model.manufacturer') ? this.get('model.manufacturer.slug') : '-'),
                                       (this.get('model.target') ? this.get('model.target.slug') : '-'),
                                       (this.get('model.targetCategory') ? this.get('model.targetCategory.slug') : '-'),
                                       (this.get('model.targetKit') ? this.get('model.targetKit.slug') : '-'),
                                       this.get('model.competingRegion.slug'),
                                       this.get('model.ruleSet.slug'),
                                       this.get('model.useCategory.slug'),
                                       this.get('model.use1.slug'),
                                       (this.get('model.use2') ? this.get('model.use2.slug') : '-')
                                      );
            } else {
                return this.send('gotoPromptedFeatures');
            }
        },

        skipUse2: function () {
            this.set('model.use2', null);
            this.set('model.use3', null);
            this.set('model.use4', null);
            this.send('gotoPromptedFeatures');
        },

        chooseUse3: function (use3) {
            this.set('model.use3', use3);

            if (this.get('uses').any(function (use) {
                return use.get('parent') === use3;
            })) {
                this.transitionToRoute('interview.manufacturers.targets.targetCategories.groupedYears.region.ruleSets.useCategories.use1s.use2s.use3s.use4s',
                                       this.get('model.productLine.slug'),
                                       (this.get('model.manufacturer') ? this.get('model.manufacturer.slug') : '-'),
                                       (this.get('model.target') ? this.get('model.target.slug') : '-'),
                                       (this.get('model.targetCategory') ? this.get('model.targetCategory.slug') : '-'),
                                       (this.get('model.targetKit') ? this.get('model.targetKit.slug') : '-'),
                                       this.get('model.competingRegion.slug'),
                                       this.get('model.ruleSet.slug'),
                                       this.get('model.useCategory.slug'),
                                       this.get('model.use1.slug'),
                                       (this.get('model.use2') ? this.get('model.use2.slug') : '-'),
                                       (this.get('model.use3') ? this.get('model.use3.slug') : '-')
                                      );
            } else {
                return this.send('gotoPromptedFeatures');
            }
        },

        skipUse3: function () {
            this.set('model.use3', null);
            this.set('model.use4', null);
            this.send('gotoPromptedFeatures');
        },

        chooseUse4: function (use) {
            this.set('model.use4', use);
            this.send('gotoPromptedFeatures');
        },

        skipUse4: function () {
            this.set('model.use4', null);
            this.send('gotoPromptedFeatures');
        },

        gotoPromptedFeatures: function () {

            this.transitionToRoute('interview.manufacturers.targets.targetCategories.groupedYears.region.ruleSets.useCategories.use1s.use2s.use3s.use4s.promptedFeatures',
                                   this.get('model.productLine.slug'),
                                   (this.get('model.manufacturer') ? this.get('model.manufacturer.slug') : '-'),
                                   (this.get('model.target') ? this.get('model.target.slug') : '-'),
                                   (this.get('model.targetCategory') ? this.get('model.targetCategory.slug') : '-'),
                                   (this.get('model.targetKit') ? this.get('model.targetKit.slug') : '-'),
                                   this.get('model.competingRegion.slug'),
                                   (this.get('model.ruleSet') ? this.get('model.ruleSet.slug') : '-'),
                                   (this.get('model.useCategory') ? this.get('model.useCategory.slug') : '-'),
                                   (this.get('model.use1') ? this.get('model.use1.slug') : '-'),
                                   (this.get('model.use2') ? this.get('model.use2.slug') : '-'),
                                   (this.get('model.use3') ? this.get('model.use3.slug') : '-'),
                                   (this.get('model.use4') ? this.get('model.use4.slug') : '-')
                                  );
        },

        build: function () {

            if (this.get('controllers.application.bootstrapBreakpoint') === 'xs') {
                //show small screen modal
                this.get('controllers.application').set('loadingDesignXS', true);
            } else {
                this.get('controllers.application').send('pushSectionSpinner');
            }

            var textsToDisplay = ['interview.start_your_engines', 'interview.start_your_engines2', 'interview.start_your_engines3'];
            //change message if the element is still visible in few secs
            var applyLoadingText = () => {
                this.get('controllers.application').showSpinnerText(this.get('i18n').t(textsToDisplay[0]));
                textsToDisplay.push(textsToDisplay.shift());
                Ember.run.later(() => {
                    if (this.get('controllers.application.spinSectionCount') !== 0) {
                        applyLoadingText();
                    }
                }, 3000);
            };
            applyLoadingText();

            if (!this.get('model.targetKit') && !this.get('model.target') && !this.get('model.targetCategory')) {
                // this shouldn't happen, but it does
                // http://redmine.motocal.com/issues/963
                logger.error('InvalidInterviewPathError', this.get('model').toString() + ' is an invalid interview path: ' + window.location.toString());
                return this.transitionToRoute('interview');
            }

            this.trigger('newDesign');

            this.get('model').save().then(
                function (interview) {

                    var manufacturerSlug = (interview.get('manufacturer') ? interview.get('manufacturer.slug') : '-'),
                        targetSlug = (interview.get('target') ? interview.get('target.slug') : '-'),
                        targetCategorySlug = (interview.get('targetCategory') ? interview.get('targetCategory.slug') : '-'),
                        targetKitSlug = (interview.get('targetKit') ? interview.get('targetKit.slug') : '-'),
                        designId = interview.get('design_id');

                    this.store.init(); // ensure no elements of previous kits are hanging around

                    this.transitionToRoute('design.selector',
                        manufacturerSlug,
                        targetSlug,
                        targetCategorySlug,
                        targetKitSlug,
                        designId
                    );
                }.bind(this),
                function (errorResponse, transition) {
                    logger.error('KitBuildError', errorResponse.message, transition);
                    if(config.mixpanel.enabled) {

                        mixpanel.track('KitBuildError', {
                            "errorMessage": errorResponse.message,
                            "transition": transition
                        });
                    }
                    this.get('controllers.application').send('showApplicationError', errorResponse, transition);
                }.bind(this)
            );
        }
    }
});
