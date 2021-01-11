import Ember from 'ember';
import RouteActivateStep from '../../../../../../../../mixins/route-activate-step';

export default Ember.Route.extend(RouteActivateStep, {

    stepName: 'UseCategory',

    model: function (params) {
        // return a ruleset from this method
        if (params.ruleset_slug === '-') {
            return this.modelFor('interview');
        }

        return new Ember.RSVP.Promise(function (resolve, reject) {
            var data = {
                product_line_id: this.modelFor('interview.manufacturers').get('id'),
                region_id: this.modelFor('interview.manufacturers.targets.targetCategories.groupedYears.region.ruleSets').get('id')
            };

            if (this.modelFor('interview.manufacturers.targets.targetCategories') &&
                this.modelFor('interview.manufacturers.targets.targetCategories').constructor.modelName === 'target') {
                data.target_id = this.modelFor('interview.manufacturers.targets.targetCategories').get('id');
            } else if (this.modelFor('interview.manufacturers.targets.targetCategories.groupedYears') &&
                this.modelFor('interview.manufacturers.targets.targetCategories.groupedYears').constructor.modelName === 'target-category') {
                data.target_category_id = this.modelFor('interview.manufacturers.targets.targetCategories.groupedYears').get('id');
            }

            this.store.find('ruleSet', data).then(function (ruleSets) {
                var ruleSet = ruleSets.filter(function (item) {
                    return item.get('slug') === params.ruleset_slug;
                }).get('firstObject');

                return (ruleSet ? resolve(ruleSet) : reject('No such ruleset: ' + params.ruleset_slug));
            });
        }.bind(this));
    },

    setupController: function (controller, model) {
        var interviewController = this.controllerFor('interview');

        if (model.constructor.modelName === 'rule-set') {
            interviewController.set('model.ruleSet', model);

            var params = {
                rule_set_id: interviewController.get('model.ruleSet.id')
            };

            if (interviewController.get('model.target')) {
                params.target_id = interviewController.get('model.target.id');
            } else if (interviewController.get('model.targetCategory')) {
                params.target_category_id = interviewController.get('model.targetCategory.id');
            }

            interviewController.set('useCategories', this.store.find('useCategory', params));
        }
    },

    renderTemplate: function () {
        if (this.currentModel.constructor.modelName === 'rule-set') {
            this.render('interview/usecategories', {
                into: 'interview',
                view: 'interview/useCategoryIndex',
                outlet: 'useCategories',
                controller: this.controllerFor('interview')
            });
        }
    },

    deactivate: function () {
        this._super();
        this.controllerFor('interview').get('model').set('useCategory', null);
    }
});

