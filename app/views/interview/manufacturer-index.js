import Ember from 'ember';
import InterviewStepView from './interview-step';

export default InterviewStepView.extend({

    templateName: 'interview/manufacturers',
    name: 'Manufacturer',

    showContent: function () {
        return this.get('controller.manufacturers.isPending') || (this.get('controller.manufacturers.isFulfilled') && this.get('controller.manufacturers.length'));
    }.property('controller.manufacturers.isFulfilled', 'controller.manufacturers.length'),

    showContentDelay: false,

    setShowContentDelay: function () {
        Ember.run.later(this, function () {
            this.set('showContentDelay', true);
        }, 400);
    }.on('init'),

    hasDataPending: Ember.computed.alias('controller.manufacturers.isPending'),

    carouselContent: function () {
        return this.get('controller.manufacturers');
    }.property('controller.manufacturers.@each')

});

