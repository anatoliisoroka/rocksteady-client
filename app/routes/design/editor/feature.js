/* global logger */

import Ember from 'ember';

const dirtyProps = [
    'model.positions.@each.isDirty',
    'model.fattributes.@each.value',
    'model.fattributes.length',
    'model.features.@each.deleted',
    'model.features.length',
    'model.features.@each.zIndex'
];

const linkedFeaturesProps = [
    'model.icon',
    'model.fill',
    'model.text',
    'model.fontFamily',
    'model.strokeWidth1',
    'model.strokeStyle1',
    'model.strokeWidth2',
    'model.strokeStyle2',
    'model.strokeWidth3',
    'model.strokeStyle3',
    'model.strokeWidth4',
    'model.strokeStyle4'
];

export default Ember.Route.extend({

    beforeModel () {
        this.controllerFor('design/editor.feature').removeObservers();
    },

    model ({ feature_id }) {
        return this.store.getById('feature', feature_id);
    },

    afterModel () {
        this.controllerFor('application').send('popSpinner');
    },

    setupController (controller, model) {
        this._super(controller, model);

        window.tourMediator.trigger('close');

        this.registerObservers(linkedFeaturesProps, controller, 'propagateLinkedFeatureChange');
        this.controllerFor('design/editor.feature').registerObservers();

        this.controllerFor('design/editor').send('activate', model);
    },

    activate () {
        this.registerObservers(dirtyProps, this.controllerFor('design/editor'), 'propagateUserEdit');
    },

    deactivate () {
        this.unregisterObservers(linkedFeaturesProps, this.controllerFor('design/editor.feature'), 'propagateLinkedFeatureChange');
        this.unregisterObservers(dirtyProps, this.controllerFor('design/editor'), 'propagateUserEdit');
        this.controllerFor('design/editor.feature').removeObservers();
    },

    registerObservers (props, controller, handlerName) {
        props.forEach((prop) =>
            controller.addObserver(prop, controller, handlerName)
        );
    },
    unregisterObservers (props, controller, handlerName) {
        props.forEach((prop) =>
            controller.removeObserver(prop, controller, handlerName)
        );
    },
    actions: {
        error: function (reason, transition) {
            logger.error('FeatureRoutingError', reason);
            this.transitionTo('design.selector',
                transition.params.manufacturer,
                transition.params.target,
                transition.params.target_category,
                transition.params.grouped_year,
                transition.params.design_id);
        }
    }

});
