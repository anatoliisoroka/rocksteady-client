/* globals Shepherd, Modernizr, logger, $ */

import Ember from 'ember';
import config from '../config/environment';

var tour;

var steps = {

    'interview': {
        attachTo: {element: '.interview-step.is-active .block-elements .selectable.element', on: 'right'},
        onShow: function () {
            Ember.run.later(function () {
                $('.block-elements').prepend($('<div class="element tour" />'));
                $('.interviewsteps-container').addClass('disableScroll');
            });
        },
        onComplete: function () {
            Ember.run.later(function () {
                $('.block-elements .element.tour').remove();
                $('.interviewsteps-container').removeClass('disableScroll');
            });
        },
        onCancel: function () {
            Ember.run.later(function () {
                $('.block-elements .element.tour').remove();
                $('.interviewsteps-container').removeClass('disableScroll');
            });
        }
    },

    'editor': {
        attachTo: {element: '.property-panel', on: 'left'}
    },

    'checkout': {
        attachTo: {element: '.components-scroll', on: 'right'},
        tetherOptions: {attachment: 'top right', targetAttachment: 'top left'},
        onShow: function () {
            Ember.run.later(function () {
                $('.checkout-container').scrollTop(0).css('overflow', 'hidden');
            });
        },
        onComplete: function () {
            Ember.run.later(function () {
                $('.checkout-container').css('overflow', 'auto');
            });
        },
        onCancel: function () {
            Ember.run.later(function () {
                $('.checkout-container').css('overflow', 'auto');
            });
        }
    },

    'selectmap': {
        attachTo: {element: '.selectmap-single-position-canvas', on: 'left'},
        buttons: [{text: 'Close', action: function () {
            window.tourMediator.trigger('close');
            $('.selectmap-single-position-canvas').remove();
        }}],
        onShow: function (application) {
            if (application.container.lookup('controller:design').get('model.isTargetCategory')) {
                this.buttons[0].text = 'Next';
            }
        }
    },

    'targetcategorywarning': {
        attachTo: {element: '.position-tooltip-box', on: 'left'},
        buttons: [],
        onShow: function () {
            Ember.run.later(this, function () {
                var $understandCheckbox = $('.btn-group-understand [type="checkbox"]');

                //get rid of X to close
                $('.shepherd-cancel-link').remove();

                $('body').append('<div class="user-tour-event-sink"></div>');
                var $userTourEventSink = $('.user-tour-event-sink');
                $userTourEventSink.on('click', function (e) {
                    e.stopPropagation();
                });
                $understandCheckbox.prop('checked', false);
                $understandCheckbox.on('click', function () {
                    if ($understandCheckbox.prop('checked')) {
                        $('.btn-group-understand button').prop('disabled', false);
                    } else {
                        $('.btn-group-understand button').prop('disabled', true);
                    }
                });
            }, 1000);
        },
        onComplete: function () {
            Ember.run.later(function () {
                $('.user-tour-event-sink').remove();
            });
        },
        onCancel: function () {
            Ember.run.later(function () {
                $('.user-tour-event-sink').remove();
            });
        }
    },

    'shortcuts': {}

};

var clearUserTourStorage = function () {
    if (!Modernizr.localstorage) {
        return;
    }

    for (var i in window.localStorage) {
        if (i.indexOf('usertour.') === 0) {
            delete window.localStorage[i];
        }
    }
};

export function initialize(application) {

    var tourMediator = window.tourMediator = new Shepherd.Evented();
    var currentStepId;

    tourMediator.hasShown = function () {
        return true;
    };

    tourMediator.isShowing = function () {
        return false;
    };

    tourMediator.resetStep = function (step) {
        if (!Modernizr.localstorage) {
            return;
        }

        for (var i = 0 ; i < tour.steps.length; i++) {
            if (tour.steps[i].id === step) {
                tour.steps[i].destroy();
            }
        }

        delete window.localStorage['usertour.' + step];
    };

    if (!Modernizr.localstorage) {
        return;
    }

    if (window.Cookies.get('usertourOverride') === '1') {
        config.APP.features.user_tour = true;
    }

    tour = new Shepherd.Tour({
        defaults: {
            classes: 'shepherd-theme-arrows',
            showCancelLink: true,
            buttons: [{text: 'Close', action: function () {
                tour.complete();
            }}]
        }
    });

    tour.on('show', function (e) {
        try {
            window.localStorage['usertour.' + e.step.id] = (new Date()).toString();
        } catch (ew) {
            logger.warn('LocalStorageWarning', ew);
        }
        currentStepId = e.step.options.id;

        if (typeof steps[currentStepId].onShow === 'function') {
            steps[currentStepId].onShow.bind(steps[currentStepId])(application);
        }
    });

    tour.on('cancel', function () {
        tour.currentStep = null;

        if (typeof currentStepId !== 'undefined' && typeof steps[currentStepId].onCancel === 'function') {
            steps[currentStepId].onCancel.bind(steps[currentStepId])(application);
        }

        currentStepId = undefined;
    });

    tour.on('complete', function () {
        tour.currentStep = null;
        if (tour.getCurrentStep()) {
            tour.getCurrentStep().destroy();
        }

        if (typeof currentStepId !== 'undefined' && typeof steps[currentStepId].onComplete === 'function') {
            steps[currentStepId].onComplete.bind(steps[currentStepId])(application);
        }

        currentStepId = undefined;
    });

    tourMediator.on('close', function () {
        tour.cancel();
        tour.currentStep = null;
    });

    tour.on('complete', function () {
        application.container.lookup('controller:application').trigger('completeUserTour');
    });

    tourMediator.hasShown = function (step) {
        return !!window.localStorage['usertour.' + step];
    };

    tourMediator.isShowing = function (step) {
        return !!$('.shepherd-step[data-id="' + step + '"]:visible').length;
    };

    var showTourStep = function (step, events) {
        if (application.container.lookup('controller:application').get('bootstrapBreakpoint') === 'xs') {
            logger.info('No user tour in small screen.');
            return;
        }

        for (var e in events) {
            tour.getById(step).once(e, events[e]);
        }

        tour.getById(step).on('hide', function () {
            this.destroy();
        });

        application.container.lookup('controller:application').trigger('showUserTour-' + step);

        try {
            tour.show(step);
        } catch (err) {
            logger.warn('UserTourWarning', 'Tried to show usertour step \'' + step + '\' but caught an error: ' + err.message);
            tour.cancel();
            tour.currentStep = null;
            if (tour.getCurrentStep()) {
                tour.getCurrentStep().destroy();
            }
            $('.shepherd-step').remove();
        }
    };

    var makeShowHandler = function (step) {
        return function () {
            showTourStep(step);
        };
    };

    var makeShowOnceHandler = function (step) {
        return function () {
            if (!window.localStorage['usertour.' + step]) {
                showTourStep(step);
            }
        };
    };

    for (var s in steps) {
        steps[s].title = '<span class="glyphicon glyphicon-info-sign"></span> ' + application.container.lookup('controller:application').get('i18n').t('user_tour.' + s + '.title').toString();

        var template = application.container.lookup(`template:usertour/${s}`),
            component = Ember.Component.create(),
            view = application.container.lookup('view:application').createChildView(Ember.View, {template: template, controller: component});

        view.set('actions', { dismissUserTour: () => window.tourMediator.trigger('close') });

        view.createElement();
        steps[s].text = view.element;//.innerHTML;

        tour.addStep(s, steps[s]);
        tourMediator.on('show-' + s, makeShowHandler(s));

        if (config.APP.features.user_tour) {
            tourMediator.on('show-once-' + s, makeShowOnceHandler(s));
        }
    }

    window.addEventListener('message', function (event) {
        if (event.source === window && event.data.type && event.data.type === 'qa_resetusertour') {
            clearUserTourStorage();
        }
    });

    if (window.Cookies.get('usertourResetOverride') === '1') {
        clearUserTourStorage();
    }
}

export default {
    name: 'user-tour',
    after: 'ember-data',
    initialize: initialize
};
