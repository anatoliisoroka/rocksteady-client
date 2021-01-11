/* global $ */

import Ember from 'ember';

export default Ember.View.extend({
    tagName: 'section',
    classNames: ['interview-step'],
    classNameBindings: ['isActive'],
    attributeBindings: ['name'],
    isActive: false,

    activateStep: function (step) {
        if (this.get('isDestroyed')) {
            return;
        }

        this.set('isActive', step === this.get('name'));

        if (step === this.get('name')) {
            this.get('controller').set('previousStep', this.get('activeStep'));
            this.get('controller').set('activeStep', this);
            Ember.run.debounce(this.get('parentView'), 'activateStep', 100);
        }
    },

    didInsertElement: function () {

        this.get('controller').on('activateStep', this, this.activateStep);

        //close ipad keyboard on 'Go', prevent page reload
        this.$().bind('keydown.goHandler', function (event) {
            if (event.keyCode === 13) {
                event.preventDefault();
                document.activeElement.blur();
            }
        });

        Ember.run.scheduleOnce('afterRender', this, 'overflowFix');
        Ember.run.scheduleOnce('afterRender', this, 'scrollToTop');
        Ember.run.scheduleOnce('afterRender', this, 'showUserTourAfterContent');
    },

    scrollToTop: function () {
        $('body').scrollTop(0);
    },

    overflowFix: function () {

        // fix for long words in carousel items
        Ember.run.scheduleOnce('afterRender', this, function () {
            //workaround
            this.applyOverflowFix();
            Ember.run.later(this, function () {
                this.applyOverflowFix();
            }, 150);
            Ember.run.later(this, function () {
                this.applyOverflowFix();
            }, 300);
        });
    },

    applyOverflowFix: function () {
        try {
            if (typeof this.$ === 'function' && typeof this.$().find !== 'undefined') {
                this.$().find('.element.generic-icon .impact').each(function () {
                    var $el = $(this);

                    if ($el.width() > ($el.parent().width() - 10)) {
                        $el.addClass('x-small');
                    }
                });
            }
        } catch (e) {}
    },

    showUserTourAfterContent: function () {
        if (
            this.get('isActive') &&
            !this.get('willShowTour') &&
            (this.get('name') === 'ProductLine' || this.get('name') === 'Manufacturer')) {

            this.set('willShowTour', true);

            Ember.run.scheduleOnce('afterRender', this, function () {
                Ember.run.later(this, function () {
                    //workaround for casperjs
                    Ember.run.later(this, function () {
                        window.tourMediator.trigger('show-once-interview');
                    }, 500);
                }, 500);
            });
        }
    },

    willDestroyElement: function () {
        this.get('controller').off('activateStep', this, this.activateStep);
        this.$().unbind('keydown.goHandler');
    },

    actions: {
        handleCarouselSizeHint: function (data) {
            if (!this.get('parentView').get('hasTakenCarouselSizeHint')) {
                this.get('parentView').$('.interviewsteps-container').css('width', data.width);
                this.get('parentView').set('hasTakenCarouselSizeHint', true);
            }
        }
    }
});

