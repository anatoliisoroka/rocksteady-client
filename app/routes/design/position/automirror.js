import Ember from 'ember';

export default Ember.Route.extend({

    viewName: 'design.position.mirror',
    templateName: 'design/position/mirror',
    controllerName: 'design/position/mirror',

    autoMirrorModalShownCounter: 0,

    setupController: function (controller, model) {
        this.incrementProperty('autoMirrorModalShownCounter');

        // if autoMirrorModalShownCounter > 1 don't give option to hide in future
        if (this.get('autoMirrorModalShownCounter') > 1) {
            controller.set('showAutoMirrorDoNotShowAgainOption', true);
        } else {

            // if autoMirrorModalShownCounter < 1 give option to hide in future
            controller.set('showAutoMirrorDoNotShowAgainOption', false);
        }

        this._super(controller, model);
    }

});

