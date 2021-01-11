import Ember from 'ember';
import InterviewStepView from './interview-step';

export default InterviewStepView.extend({

    templateName: 'interview/targetcategories',
    name: 'TargetCategory',

    showContent: function () {
        return this.get('controller.targetCategories.isPending') || (this.get('controller.targetCategories.isFulfilled') && (this.get('controller.targetCategories.length') !== 1));
    }.property('controller.targetCategories.isFulfilled', 'controller.targetCategories.length'),

    showContentDelay: false,

    setShowContentDelay: function () {
        Ember.run.later(this, function () {
            this.set('showContentDelay', true);
        }, 400);
    }.on('init'),

    hasDataPending: Ember.computed.alias('controller.targetCategories.isPending'),

    carouselContent: function () {
        return this.get('controller.targetCategories');
    }.property('controller.targetCategories.@each')
});
