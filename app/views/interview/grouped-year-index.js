import Ember from 'ember';
import InterviewStepView from './interview-step';

export default InterviewStepView.extend({
    templateName: 'interview/groupedyears',
    name: 'GroupedYear',

    hasDataPending: Ember.computed.alias('controller.targetKits.isPending'),

    carouselContent: function () {
        return this.get('controller.targetKits');
    }.property('controller.targetKits.@each')
});

