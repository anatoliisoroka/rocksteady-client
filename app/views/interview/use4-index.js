import Ember from 'ember';
import InterviewStepView from './interview-step';

export default InterviewStepView.extend({
    templateName: 'interview/use4s',
    name: 'Use4',

    hasDataPending: Ember.computed.alias('controller.use4s.isPending'),

    didInsertElement: function () {
        this._super();
        this.set('loaded', true);
    },

    carouselContent: function () {
        if (this.$() && !this.get('isDestroyed')) {
            if (this.get('controller.use4s.length')) {
                this.$().show();
            } else {
                this.$().hide();
            }
        }

        //return this.get('controller.use4s');
        return false;
    }.property('controller.use4s.@each', 'loaded')
});

