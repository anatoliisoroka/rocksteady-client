import Ember from 'ember';
import RouteActivateStep from '../../../../../../../../../mixins/route-activate-step';

export default Ember.Route.extend(RouteActivateStep, {

    stepName: 'Use1',

    model: function (params) {
        // return a use category from this method
        if (params.use_category_slug === '-') {
            return this.modelFor('interview');
        }

        return new Ember.RSVP.Promise(function (resolve, reject) {
            var data = {
                rule_set_id: this.modelFor('interview.manufacturers.targets.targetCategories.groupedYears.region.ruleSets.useCategories').get('id')
            };

            if (this.modelFor('interview.manufacturers.targets.targetCategories') &&
                this.modelFor('interview.manufacturers.targets.targetCategories').constructor.modelName === 'target') {
                data.target_id = this.modelFor('interview.manufacturers.targets.targetCategories').get('id');
            } else if (this.modelFor('interview.manufacturers.targets.targetCategories.groupedYears') &&
                this.modelFor('interview.manufacturers.targets.targetCategories.groupedYears').constructor.modelName === 'target-category') {
                data.target_category_id = this.modelFor('interview.manufacturers.targets.targetCategories.groupedYears').get('id');
            }

            this.store.find('useCategory', data).then(function (useCategories) {
                var useCategory = useCategories.filter(function (item) {
                    return item.get('slug') === params.use_category_slug;
                }).get('firstObject');

                return (useCategory ? resolve(useCategory) : reject('No such use category: ' + params.use_category_slug));
            });
        }.bind(this));
    },

    setupController: function (controller, model) {
        var interviewController = this.controllerFor('interview');

        if (model.constructor.modelName === 'use-category') {
            interviewController.set('model.useCategory', model);

            var params = {
                use_category_id: interviewController.get('model.useCategory.id'),
                rule_set_id: interviewController.get('model.ruleSet.id')
            };

            if (interviewController.get('model.target')) {
                params.target_id = interviewController.get('model.target.id');
            } else if (interviewController.get('model.targetCategory')) {
                params.target_category_id = interviewController.get('model.targetCategory.id');
            }

            this.store.find('use', params).then(function (uses) {
                interviewController.set('uses', uses);
                interviewController.set('use1s', uses.filter(function (use) {
                    return !use.get('parent');
                }));
            });
        }
    },

    renderTemplate: function () {
        if (this.currentModel.constructor.modelName === 'use-category') {
            this.render('interview/use1s', {
                into: 'interview',
                view: 'interview/use1Index',
                outlet: 'use1s',
                controller: this.controllerFor('interview')
            });
        }
    },

    deactivate: function () {
        this._super();
        this.controllerFor('interview').get('model').set('use1', null);
    }

});

