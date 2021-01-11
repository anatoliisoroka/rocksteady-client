import Ember from 'ember';

export default Ember.Route.extend({

    model: function () {
        var route = this;

        return new Ember.RSVP.Promise(function (resolve, reject) {
            route.controllerFor('design').saveSocialShare().then(resolve, reject);
        });
    },

    afterModel: function () {
        this.controllerFor('application').send('popSpinner');
    },

    actions: {
        loading: function (/*transition, originRoute*/) {
            this.controllerFor('application').send('pushSpinner');
        },

        error: function (/*e*/) {
            this.controllerFor('application').send('popSpinner');
            this.controllerFor('design.selector').send('showSocialShareError');
            this.transitionTo('design.selector');
        }
    }

});
