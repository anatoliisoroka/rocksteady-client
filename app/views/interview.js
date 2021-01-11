/* global Modernizr, $ */

import Ember from 'ember';
import config from '../config/environment';

var SCROLL_DURATION = 300;

export default Ember.View.extend({
    templateName: 'interview',
    classNames: ['interview'],

    activateStep: function () {
        if (this.$()) {
            this.$().find('.interviewsteps-container').width('95%');
        }

        if (this.get('controller.activeStep')) {
            this.set('controller.activeStep.isActive', true);

            if (this.get('controller.activeStep').$()) {
                this.$('.interviewsteps-container').css(
                    'top',
                    this.get('controller.activeStep').$().position().top * -1);
            }

            if (!Modernizr.touch) {
                Ember.run.later(this, function () {
                    if (this.get('controller.activeStep') && this.get('controller.activeStep').$('input:eq(0)')) {
                        this.get('controller.activeStep').$('input:eq(0)').focus();
                    }
                }, SCROLL_DURATION);
            }
        }
    },

    deactivateStep: function () {
        // generally triggered when 'back' button is pressed; ensure last view is active
        this.set('controller.previousStep', this.get('controller.activeStep'));
        this.set('controller.activeStep', this.get('childViews.lastObject'));
        this.activateStep();

        if (this.get('controller.activeStep.name') === 'PromptedFeatures') {
            this.get('controller.controllers.progressBar').send('interviewStage');
        }
    },

    controllerActiveStepObserver: function () {
        if (this.get('controller.activeStep.name') === 'Target') {
            this.bindNotScrollable();
        } else {
            this.unbindNotScrollable();
        }
    }.observes('controller.activeStep').on('init'),

    bindNotScrollable () {
        if ($('.available-targets .scroll-for-more').offset().top < window.innerHeight) {
            $('body').addClass('interview-no-scrollable');
        }
    },

    unbindNotScrollable () {
        $('body').removeClass('interview-no-scrollable');
    },

    didInsertElement: function () {
        var view = this;

        $(window).off('debouncedresize.interview');
        $(window).on('debouncedresize.interview', function () {
            window.tourMediator.trigger('close');

            Ember.run.later(view, function () {
                if (view.$() && typeof view.$().find === 'function') {
                    view.$().find('.interviewsteps-container').width('95%');
                }
            }, 500);
        });

        this.get('controller').on('deactivateStep', this, this.deactivateStep);

        if (config.APP.tooltips && view.$()) {
            view.$().find('[title]').tooltip({ container: 'body' });
        }
    },

    willDestroyElement: function () {
        this.unbindNotScrollable();

        $(window).off('debouncedresize.interview');
        this.get('controller').off('deactivateStep', this, this.deactivateStep);

        if (config.APP.tooltips && this.$() && this.$().tooltip) {
            this.$().find('[title]').tooltip('destroy');
        }
    },

    isBreakpointXS: function () {
        return this.get('controller.controllers.application.bootstrapBreakpoint') === 'xs';
    }.property('controller.controllers.application.bootstrapBreakpoint')

});
