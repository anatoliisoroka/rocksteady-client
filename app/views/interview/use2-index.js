import Ember from 'ember';
import InterviewStepView from './interview-step';

export default InterviewStepView.extend({
    templateName: 'interview/use2s',
    name: 'Use2',

    hasDataPending: Ember.computed.alias('controller.use2s.isPending'),

    didInsertElement: function () {
        this._super();
        this.set('loaded', true);
    },

    carouselContent: function () {
        if (this.$() && !this.get('isDestroyed')) {
            if (this.get('controller.use2s.length')) {
                this.$().show();
            } else {
                this.$().hide();
            }
        }

        //return this.get('controller.use2s');
        return false;
    }.property('controller.use2s.@each', 'loaded')
});

