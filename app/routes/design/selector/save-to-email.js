import Ember from 'ember';

export default Ember.Route.extend({

    setupController: function (controller, model) {
        controller.set('sent', false);
        controller.set('sending', false);

        if (model.get('user')) {
            controller.set('email', model.get('user.email'));
        }
    },
    actions: {
        willTransition: function() {
            Ember.$('.facebook-share-btn').removeClass("disabled");
        }
    }
});
