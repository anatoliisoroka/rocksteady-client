import Ember from 'ember';
import InterviewStepView from './interview-step';

export default InterviewStepView.extend({
    templateName: 'interview/productlines',
    name: 'ProductLine',

    hasDataPending: Ember.computed.alias('controller.productLines.isPending'),

    carouselContent: function () {
        return this.get('controller.productLines');
    }.property('controller.productLines.@each')
});

