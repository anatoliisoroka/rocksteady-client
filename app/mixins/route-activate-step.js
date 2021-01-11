import Ember from 'ember';

export default Ember.Mixin.create({

    progressBarStep: 'interview',

    activate: function () {

        Ember.run.scheduleOnce('routerTransitions', this, function () {
            var stage = this.get('progressBarStep') + 'Stage';
            this.controllerFor('interview').get('controllers.progressBar').send(stage);
        });

        Ember.run.scheduleOnce('afterRender', this, function () {
            this.controllerFor('interview').trigger('activateStep', this.get('stepName'));
        });

        window.tourMediator.trigger('close');
    },

    deactivate: function () {

        Ember.run.scheduleOnce('routerTransitions', this, function () {
            var stage = this.get('progressBarStep') + 'Stage';
            this.controllerFor('interview').get('controllers.progressBar').send(stage);
        });

        Ember.run.scheduleOnce('afterRender', this, function () {
            this.controllerFor('interview').trigger('deactivateStep', this.get('stepName'));
        });

        window.tourMediator.trigger('close');
    },

    actions: {
        error: function (errorResponse, transition) {
            this.controllerFor('application').send('showApplicationError', errorResponse, transition);
        },

        loading: function (/*transition, originRoute*/) {
            this.controllerFor('application').send('pushSpinner');
        },

        willTransition: function (transition) {
            //workaround as activate/deactive was not been fired when browser back/forward......T.T
            var regionFilterSection = (/region/.test(transition.targetName) && !/promptedFeatures/.test(transition.targetName));

            Ember.run.later(this, function () {
                this.controllerFor('interview')
                    .set('regionFilterSection', regionFilterSection);
            }, 500);
        }
    },

    afterModel: function () {
        this.controllerFor('application').send('popSpinner');
    }

});
