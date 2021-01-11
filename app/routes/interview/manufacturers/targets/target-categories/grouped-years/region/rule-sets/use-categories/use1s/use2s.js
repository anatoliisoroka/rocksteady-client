import Ember from 'ember';
import RouteActivateStep from '../../../../../../../../../../mixins/route-activate-step';

export default Ember.Route.extend(RouteActivateStep, {

    stepName: 'Use2',

    model: function (params) {
        // return a use from this method
        if (params.use1_slug === '-') {
            return this.modelFor('interview');
        }

        return new Ember.RSVP.Promise(function (resolve, reject) {
            var data = {
                use_category_id: this.modelFor('interview.manufacturers.targets.targetCategories.groupedYears.region.ruleSets.useCategories.use1s').get('id'),
                rule_set_id: this.modelFor('interview.manufacturers.targets.targetCategories.groupedYears.region.ruleSets.useCategories').get('id')
            };

            if (this.modelFor('interview.manufacturers.targets.targetCategories') &&
                this.modelFor('interview.manufacturers.targets.targetCategories').constructor.modelName === 'target') {
                data.target_id = this.modelFor('interview.manufacturers.targets.targetCategories').get('id');
            } else if (this.modelFor('interview.manufacturers.targets.targetCategories.groupedYears') &&
                this.modelFor('interview.manufacturers.targets.targetCategories.groupedYears').constructor.modelName === 'target-category') {
                data.target_category_id = this.modelFor('interview.manufacturers.targets.targetCategories.groupedYears').get('id');
            }

            this.store.find('use', data).then(function (uses) {
                var use = uses.filter(function (item) {
                    return item.get('slug') === params.use1_slug && !item.get('parent');
                }).get('firstObject');

                return (use ? resolve(use) : reject('No such use at this level: ' + params.use1_slug));
            });
        }.bind(this));
    },

    setupController: function (controller, model) {
        var interviewController = this.controllerFor('interview');

        if (model && model.constructor.modelName === 'use') {
            interviewController.set('model.use1', model);
            interviewController.set('model.use2', null);
            interviewController.set('model.use3', null);

            // TODO probably can just filter cached uses here

            this.store.filter('use', function (use) {
                return use.get('parent') === interviewController.get('model.use1');
            }).then(function (uses) {
                interviewController.set('use2s', uses);

                if (!interviewController.get('use2s.length')) {
                    interviewController.send('gotoPromptedFeatures');
                }
            });
        }
    },

    renderTemplate: function () {
        if (this.currentModel.constructor.modelName === 'use') {
            this.render('interview/use2s', {
                into: 'interview',
                view: 'interview/use2Index',
                outlet: 'use2s',
                controller: this.controllerFor('interview')
            });
        }
    },

    deactivate: function () {
        this._super();
        this.controllerFor('interview').get('model').set('use2', null);
    }
});

