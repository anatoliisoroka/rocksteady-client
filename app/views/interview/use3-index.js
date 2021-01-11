import Ember from 'ember';
import InterviewStepView from './interview-step';

export default InterviewStepView.extend({
    templateName: 'interview/use3s',
    name: 'Use3',

    hasDataPending: Ember.computed.alias('controller.use3s.isPending'),

    didInsertElement: function () {
        this._super();
        this.set('loaded', true);
    },

    carouselContent: function () {
        if (this.$() && !this.get('isDestroyed')) {
            if (this.get('controller.use3s.length')) {
                this.$().show();
            } else {
                this.$().hide();
            }
        }

        //return this.get('controller.use3s');
        return false;
    }.property('controller.use3s.@each', 'loaded')
});

