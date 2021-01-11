import Ember from 'ember';
import RouteActivateStep from '../mixins/route-activate-step';
import rsLogger from '../lib/rs-logger';
import config from '../config/environment';

export default Ember.Route.extend(RouteActivateStep, {
    /*
     * The interview route, shows a list of product lines e.g.:
     * http://localhost:4000/#/interview
     *
     * Carousel: ['Motorbike Decals', 'Motorcar Decals']
     *
     */

    titleToken () {
        return this.controllerFor('interview').get('model.description');
    },

    stepName: 'ProductLine',

    beforeModel () {
        return Ember.RSVP.hash({
            regions: this.store.find('region'),
            mycountry: this.store.find('mycountry'),
            productLines: this.store.find('productLine')
        });
    },

    model () {
        const myCountry = this.store
            .all('mycountry')
            .get('firstObject.country');
        let myRegion = this.store
            .all('region')
            .filterBy('iso_alpha_2', myCountry)
            .get('firstObject');

        if (!myRegion){
            rsLogger.warn('Country not found - default to US');
            myRegion = this.store
                .all('region')
                .filterBy('iso_alpha_2', 'US')
                .get('firstObject');
        }

        const filteredProductLines = this.filterAndSortProductLines(
            this.store.all('productLine'),
            config.product_lines
        );
        this.set('productLines', filteredProductLines);

        const interview = this.store.createRecord('interview');

        interview.set('competingRegion', myRegion);
        interview.set('nationality', myRegion);

        return interview;
    },

    setupController (controller, model) {
        this._super(controller, model);

        controller.set('productLines', this.get('productLines'));
    },

    filterAndSortProductLines (productLines, requiredProductLines) {
        return productLines
            .filter((productLine) =>
                requiredProductLines.includes(productLine.get('name'))
            )
            .map((productLine) => ({
                order: _.indexOf(requiredProductLines, productLine.get('name')),
                productLine
            }))
            .sortBy('order')
            .mapBy('productLine');
    },

    renderTemplate () {
        this.render();
        this.render('interview/index', {
            into: 'interview',
            outlet: 'productLines',
            controller: this.controllerFor('interview')
        });
    },

    afterModel () {
        this.controllerFor('application').send('popSpinner');
    },

    actions: {
        loading () {
            this.controllerFor('application').send('pushSpinner');
        },

        error (e) {
            this.controllerFor('application').send('showApplicationError', e);
        }
    }

});

