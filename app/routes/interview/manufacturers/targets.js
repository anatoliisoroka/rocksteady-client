import Ember from 'ember';
import RouteActivateStep from '../../../mixins/route-activate-step';

export default Ember.Route.extend(RouteActivateStep, {

    /*
     * The targets route, shows a list of targets, e.g.:
     * http://localhost:4000/#/interview/Motorbike_Decals/Honda
     *
     * Ordered List: ['CRF450x', 'CRF450R']
     *
     */

    stepName: 'Target',

    model: function (params) {
        // return a manufacturer from this method
        if (params.manufacturer_slug === '-') {
            return this.modelFor('interview');
        }

        return new Ember.RSVP.Promise(function (resolve, reject) {
            this.store.find('manufacturer', {
                product_line_id: this.modelFor('interview.manufacturers').get('id')
            }).then(function (manufacturers) {
                var manufacturer = manufacturers.filter(function (item) {
                    return item.get('slug') === params.manufacturer_slug;
                }).get('firstObject');

                return (manufacturer ? resolve(manufacturer) : reject('No such manufacturer: ' + params.manufacturer_slug));
            });
        }.bind(this));
    },

    setupController: function (controller, model) {
        var interviewController = this.controllerFor('interview');

        if (model.constructor.modelName === 'manufacturer') {
            interviewController
                .set('model.manufacturer', model)
                .set('targets', this.store.find('target', {
                    product_line_id: interviewController.get('model.productLine.id'),
                    manufacturer_id: interviewController.get('model.manufacturer.id')
                }));
        }
    },

    renderTemplate: function () {
        if (this.currentModel.constructor.modelName === 'manufacturer') {
            this.render('interview/targets', {
                into: 'interview',
                view: 'interview/targetIndex',
                outlet: 'targets',
                controller: this.controllerFor('interview')
            });
        }
    },

    deactivate: function () {
        this._super();
        this.controllerFor('interview').get('model').set('target', null);
    }
});

