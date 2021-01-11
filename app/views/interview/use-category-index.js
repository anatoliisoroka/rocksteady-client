import Ember from 'ember';
import InterviewStepView from './interview-step';

export default InterviewStepView.extend({
    templateName: 'interview/usecategories',
    name: 'UseCategory',

    hasDataPending: Ember.computed.alias('controller.useCategories.isPending'),

    carouselContent: function () {
        return this.get('controller.useCategories');
    }.property('controller.useCategories.@each')

});


