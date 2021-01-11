import Ember from 'ember';
import RouteActivateStep from '../../../../../../../../../../../../mixins/route-activate-step';

export default Ember.Route.extend(RouteActivateStep, {

    stepName: 'Use4',

    model: function (params) {
        // return a use from this method
        if (params.use3_slug === '-') {
            return this.modelFor('interview');
        }

        var use1 = this.modelFor('interview.manufacturers.targets.targetCategories.groupedYears.region.ruleSets.useCategories.use1s.use2s.use3s');

        return new Ember.RSVP.Promise(function (resolve, reject) {
            this.store.filter('use', function (use) {
                return use.get('slug') === params.use3_slug && use.get('parent') === use1;
            }).then(function (uses) {
                var use = uses.get('firstObject');
                return (use ? resolve(use) : reject('No such use at this level: ' + params.use3_slug));
            });
        }.bind(this));
    },

    setupController: function (controller, model) {
        var interviewController = this.controllerFor('interview');

        if (model.constructor.modelName === 'use') {
            interviewController.set('model.use3', model);
            interviewController.set('model.use4', null);

            // TODO probably can just filter cached uses here

            this.store.filter('use', function (use) {
                return use.get('parent') === interviewController.get('model.use3');
            }).then(function (uses) {
                interviewController.set('use4s', uses);

                if (!interviewController.get('use4s.length')) {
                    interviewController.send('gotoPromptedFeatures');
                }
            });
        }
    },

    renderTemplate: function () {
        if (this.currentModel.constructor.modelName === 'use') {
            this.render('interview/use4s', {
                into: 'interview',
                view: 'interview/use4Index',
                outlet: 'use4s',
                controller: this.controllerFor('interview')
            });
        }
    },

    deactivate: function () {
        this._super();
        this.controllerFor('interview').get('model').set('use4', null);
    }
});

