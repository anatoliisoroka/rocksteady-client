import Ember from 'ember';

export default Ember.Route.extend({

    setupController: function (controller, model) {
        controller.set('showDoNotShowAgainOption', false);
        this._super(controller, model);
    }


});

