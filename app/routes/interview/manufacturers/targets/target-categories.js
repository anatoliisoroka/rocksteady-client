import Ember from 'ember';
import RouteActivateStep from '../../../../mixins/route-activate-step';

export default Ember.Route.extend(RouteActivateStep, {

    /*
     * The target categories route, shows a list of target categories, e.g.:
     * http://localhost:4000/#/interview/Motorbike_Decals/-/-
     * http://localhost:4000/#/interview/Motorbike_Decals/Honda/rCRF540X
     *
     * Carousel: ['Motocross', 'Supermoto']
     *
     */

    stepName: 'TargetCategory',

    model: function (params) {
        // return a target from this method
        if (params.target_slug === '-') {
            return this.modelFor('interview');
        }

        return new Ember.RSVP.Promise(function (resolve, reject) {
            this.store.find('target', {
                product_line_id: this.modelFor('interview.manufacturers').get('id'),
                manufacturer_id: this.modelFor('interview.manufacturers.targets').get('id')
            }).then(function (targets) {
                var target = targets.filter(function (item) {
                    return item.get('slug') === params.target_slug;
                }).get('firstObject');

                return (target ? resolve(target) : reject('No such target: ' + params.target_slug));
            });
        }.bind(this));
    },

    setupController: function (controller, model) {
        var interviewController = this.controllerFor('interview');

        var targetCategoryFinder = this.store.find('targetCategory', {
            product_line_id: interviewController.get('model.productLine.id')
        });

        if (model && model.constructor.modelName === 'target') {
            interviewController.set('model.target', model);
        }

        targetCategoryFinder.then(function (targetCategoryElements) {
            if (targetCategoryElements.get('length') === 1) {

                var manufacturer = interviewController.get('model.manufacturer');
                var vehicleModel = interviewController.get('model.target');

                if(manufacturer === null || vehicleModel === null) {
                    interviewController.send('chooseTargetCategory', targetCategoryElements.objectAt(0));
                }
            }
        });

        interviewController.set('targetCategories', targetCategoryFinder);

        interviewController.set('ruleSetSkipped', false);
    },

    renderTemplate: function () {
        if (this.currentModel.constructor.modelName !== 'target' && this.currentModel.constructor.modelName !== 'manufacturer') {
            this.render('interview/targetcategories', {
                into: 'interview',
                view: 'interview/targetCategoryIndex',
                outlet: 'targetCategories',
                controller: this.controllerFor('interview')
            });
        }
    },

    deactivate: function () {
        this._super();
        this.controllerFor('interview').get('model').set('targetCategory', null);
    }
});

