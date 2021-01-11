import Ember from 'ember';
import RouteActivateStep from '../../../../../../../../../../../mixins/route-activate-step';

export default Ember.Route.extend(RouteActivateStep, {

    stepName: 'Use3',

    model: function (params) {
        // return a use from this method
        if (params.use2_slug === '-') {
            return this.modelFor('interview');
        }

        var use1 = this.modelFor('interview.manufacturers.targets.targetCategories.groupedYears.region.ruleSets.useCategories.use1s.use2s');

        return new Ember.RSVP.Promise(function (resolve, reject) {
            this.store.filter('use', function (use) {
                return use.get('slug') === params.use2_slug && use.get('parent') === use1;
            }).then(function (uses) {
                var use = uses.get('firstObject');
                return (use ? resolve(use) : reject('No such use at this level: ' + params.use2_slug));
            });
        }.bind(this));
    },

    setupController: function (controller, model) {
        var interviewController = this.controllerFor('interview');

        if (model.constructor.modelName === 'use') {
            interviewController.set('model.use2', model);
            interviewController.set('model.use3', null);

            // TODO probably can just filter cached uses here

            this.store.filter('use', function (use) {
                return use.get('parent') === interviewController.get('model.use2');
            }).then(function (uses) {
                interviewController.set('use3s', uses);

                if (!interviewController.get('use3s.length')) {
                    interviewController.send('gotoPromptedFeatures');
                }
            });
        }
    },

    renderTemplate: function () {
        if (this.currentModel.constructor.modelName === 'use') {
            this.render('interview/use3s', {
                into: 'interview',
                view: 'interview/use3Index',
                outlet: 'use3s',
                controller: this.controllerFor('interview')
            });
        }
    },

    deactivate: function () {
        this._super();
        this.controllerFor('interview').get('model').set('use3', null);
    }
});

