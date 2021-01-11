/* global $, Detectizr */

import Ember from 'ember';
import InterviewStepView from './interview-step';

export default InterviewStepView.extend({
    templateName: 'interview/promptedfeatures',
    name: 'PromptedFeatures',

    hasDataPending: Ember.computed.alias('controller.model.promptedFeatures.isPending'),

    userFlagPlaceholder: Ember.computed('controller.model.userFlag.displayName', function () {
        let displayName = this.get('controller.model.userFlag.displayName') || '';
        let lowerCaseDisplayName = displayName.toLowerCase();
        return 'Type ' + lowerCaseDisplayName + '...';
    }),

    didInsertElement: function () {
        this._super();

        if (/ipad|iphone/.test(Detectizr.device.model)) {
            $('.interview-step-promptedfeatures .combobox-input').on('blur', function () {
                $(document.activeElement).click();
            });
        }
    },

    willDestroyElement () {
        this._super();

        if (/ipad|iphone/.test(Detectizr.device.model)) {
            $('.interview-step-promptedfeatures .combobox-input').off('blur');
        }

        $('.toast-ruleset-automatically-skipped button').click();
    }
});

