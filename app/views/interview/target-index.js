import Ember from 'ember';
import InterviewStepView from './interview-step';

export default InterviewStepView.extend({
    templateName: 'interview/targets',
    name: 'Target',

    hasDataPending: Ember.computed.alias('controller.targets.isPending'),

    hasManyAvailableModels: function () {
        return this.get('controller.targets.length') > 3; // 4 fit = 3 targets +  1 'Not in List'
    }.property('controller.targets.length'),

    targetObserver: function () {
        this.set('controller.searchText', '');
    }.observes('controller.targets.@each'),

    searchPlaceholderText: function () {
        var t = this.get('controller.i18n').t.bind(this.get('controller.i18n'));

        return this.get('controller.targets.length') ?
            t('interview.target_placeholder_text_2', {search_term: this.get('controller.targets.lastObject.name')}).toString() :
            t('interview.target_placeholder_text_1').toString();

    }.property('controller.targets.length')

});
