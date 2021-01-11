import Ember from 'ember';
import RouteActivateStep from '../../../../../mixins/route-activate-step';

export default Ember.Route.extend(RouteActivateStep, {

    /*
     * The grouped year route, shows a list of grouped years, e.g.:
     * http://localhost:4000/#/interview/Motorbike_Decals/Honda/rCRF450x/-
     * http://localhost:4000/#/interview/Motorbike_Decals/Honda/-/Motocross
     *
     * Carousel: ['1993-2012', '2013']
     *
     */

    stepName: 'GroupedYear',

    model: function (params) {
        // return a target category from this method
        if (params.target_category_slug === '-') {
            return this.modelFor('interview');
        }

        return new Ember.RSVP.Promise(function (resolve, reject) {
            this.store.find('targetCategory', {
                product_line_id: this.modelFor('interview.manufacturers').get('id')
            }).then(function (targetCategories) {
                var targetCategory = targetCategories.filter(function (item) {
                    return item.get('slug') === params.target_category_slug;
                }).get('firstObject');

                return (targetCategory ? resolve(targetCategory) : reject('No such target category: ' + params.target_category_slug));
            });
        }.bind(this));
    },

    setupController: function (controller, model) {
        var interviewController = this.controllerFor('interview');

        if (model.constructor.modelName === 'target-category') {
            interviewController.set('model.targetCategory', model);
        } else {
            interviewController.set('targetKits', this.store.find('targetKit', {
                target_id: interviewController.get('model.target.id')
            }));
        }
    },

    renderTemplate: function () {
        if (this.currentModel.constructor.modelName !== 'target-category') {
            this.render('interview/groupedyears', {
                into: 'interview',
                view: 'interview/groupedYearIndex',
                outlet: 'groupedYears',
                controller: this.controllerFor('interview')
            });
        }
    },

    deactivate: function () {
        this._super();
        this.controllerFor('interview').get('model').set('targetKit', null);
    }

});

