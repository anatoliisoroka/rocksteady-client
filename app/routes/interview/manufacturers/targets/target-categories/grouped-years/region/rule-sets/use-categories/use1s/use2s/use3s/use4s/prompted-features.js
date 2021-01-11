import Ember from 'ember';
import RouteActivateStep from '../../../../../../../../../../../../../mixins/route-activate-step';

export default Ember.Route.extend(RouteActivateStep, {

    stepName: 'PromptedFeatures',

    model: function (params) {
        // return a use from this method
        if (params.use4_slug === '-') {
            return new Ember.RSVP.Promise(function (resolve) {
                Ember.run.later(this, function () {
                    resolve(this.modelFor('interview'));
                }.bind(this), 100);
            }.bind(this));
        }

        var use3 = this.modelFor('interview.manufacturers.targets.targetCategories.groupedYears.region.ruleSets.useCategories.use1s.use2s.use3s.use4s');

        return new Ember.RSVP.Promise(function (resolve, reject) {
            this.store.filter('use', function (use) {
                return use.get('slug') === params.use4_slug && use.get('parent') === use3;
            }).then(function (uses) {
                var use = uses.get('firstObject');
                return (use ? resolve(use) : reject('No such use at this level: ' + params.use4_slug));
            });
        }.bind(this));
    },

    setupController: function (controller, model) {

        var interviewController = this.controllerFor('interview');

        if (model.constructor.modelName === 'use') {
            interviewController.set('model.use4', model);
        }

        var params = {};

        if (interviewController.get('model.useCategory')) {
            params.use_category_id = interviewController.get('model.useCategory.id');
        }

        if (interviewController.get('model.ruleSet')) {
            params.rule_set_id = interviewController.get('model.ruleSet.id');
        }

        if (interviewController.get('model.use_id')) {
            params.use_id = interviewController.get('model.use_id');
        }

        if (interviewController.get('model.target')) {
            params.target_id = interviewController.get('model.target.id');
        }

        if (interviewController.get('model.targetCategory')) {
            params.target_category_id = interviewController.get('model.targetCategory.id');
        }

        if (interviewController.get('model.targetKit')) {
            params.target_kit_id = interviewController.get('model.targetKit.id');
        }

        params.product_line_id = interviewController.get('model.productLine.id');

        this.store
            .find('promptedFeature', params)
            .then(function (promptedFeatures) {
                promptedFeatures = promptedFeatures.map((promptedFeature) => {
                    let isUserFlag = promptedFeature.get('id') === 'User Flag';
                    if (isUserFlag) {
                        //Here we have determined the Users location and stored in 'nationality' this should be the value set for the user flag feature
                        promptedFeature.set('value', model.get('nationality.id'));
                    }
                    return promptedFeature.set('isUserFlag', isUserFlag);
                });

                interviewController.set('model.promptedFeatures', promptedFeatures);
                interviewController.set('model.hasLoaded', true);
            });

        interviewController.set('ruleSetSkipped', false);
    },

    renderTemplate: function () {
        this.render('interview/promptedfeatures', {
            into: 'interview',
            view: 'interview/promptedFeaturesIndex',
            outlet: 'promptedFeatures',
            controller: this.controllerFor('interview')
        });
    },

    deactivate: function () {
        this._super();
        this.controllerFor('interview').get('model').set('promptedFeatures', null);
    }
});
