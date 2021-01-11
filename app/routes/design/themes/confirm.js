import Ember from 'ember';

export default Ember.Route.extend({

    model({theme_id}) {
        let store = this.store;

        return store.find('theme', theme_id);
    },

    setupController: function (controller, model) {
        controller.set('error', false);
        this._super(controller, model);
    },

    actions: {
        error(e) {
            this.controllerFor('application').send('popSpinner');
            this.controllerFor('application').send('showApplicationError', e);
            this.transitionTo('design.selector');
        }
    }
});
