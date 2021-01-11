import Ember from 'ember';
import InterviewStepView from './interview-step';

export default InterviewStepView.extend({
    templateName: 'interview/rulesets',
    name: 'RuleSet',

    showContent: false,

    setShowContent: function () {
        Ember.run.later(this, function () {
            this.set('showContent', true);
        }, 600);
    }.on('init'),

    hasDataPending: Ember.computed.alias('controller.ruleSets.isPending'),

    carouselContent: function () {
        return this.get('controller.ruleSets');
    }.property('controller.ruleSets.@each')
});

