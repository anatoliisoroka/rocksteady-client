import Ember from 'ember';
import InterviewStepView from './interview-step';

export default InterviewStepView.extend({
    templateName: 'interview/use1s',
    name: 'Use1',

    hasDataPending: Ember.computed.alias('controller.use1s.isPending'),

    carouselContent: function () {
        return this.get('controller.use1s');
        //return false;
    }.property('controller.use1s.@each')

});

