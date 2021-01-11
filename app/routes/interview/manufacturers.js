import Ember from 'ember';
import RouteActivateStep from '../../mixins/route-activate-step';

export default Ember.Route.extend(RouteActivateStep, {

    /*
     * The manufacturers route, shows a list of manufacturers, e.g.:
     * http://localhost:4000/#/interview/Motorbike_Decals
     *
     * Carousel: ['Honda', 'Kawasaki']
     *
     */

    stepName: 'Manufacturer',

    model ({ product_line_slug }) {
        return new Ember.RSVP.Promise((resolve, reject) =>
            this.store
                .find('productLine')
                .then((productLines) => {
                    const productLine = productLines
                        .findBy('slug', product_line_slug);

                    return productLine ?
                        resolve(productLine) :
                        reject(`No such product line: ${product_line_slug}`);
                })
        );
    },

    setupController: function (controller, model) {
        var interviewController = this.controllerFor('interview');

        if (model.constructor.modelName === 'product-line') {
            //skip step if 0
            var manufacturersFinder = this.store.find('manufacturer', {
                product_line_id: model.get('id')
            });
            manufacturersFinder.then(function (manufacturersElements) {
                if (manufacturersElements.get('length') === 0) {
                    interviewController.send('skipManufacturer');
                }
            });

            interviewController
                .set('model.productLine', model)
                .set('manufacturers', manufacturersFinder);
        }
    },

    renderTemplate: function () {
        if (this.currentModel.constructor.modelName === 'product-line') {
            this.render('interview/manufacturers', {
                into: 'interview',
                view: 'interview/manufacturerIndex',
                outlet: 'manufacturers',
                controller: this.controllerFor('interview')
            });
        }
    },

    deactivate: function () {
        this._super();
        this.controllerFor('interview').get('model').set('manufacturer', null);
    }
});

