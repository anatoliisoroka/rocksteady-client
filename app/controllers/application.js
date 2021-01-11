/* global Modernizr, $, logger, ga*/

import Ember from 'ember';
import config from '../config/environment';

export default Ember.Controller.extend(Ember.Evented, {

    needs: ['interview', 'progressBar'],
    title: '',
    spincount: 0,
    spinSectionCount: 0,
    useEditorGrid: false,
    helloSmallScreenModal: {shown: false, isTargetCategoryKit: false, isDismissable: false},
    loadingDesignXS: false,
    showHelpButton: Ember.computed.alias('config.APP.features.help_button'),
    editorSubPanelOpen: false,
    isModalVisible: false,

    init: function () {
         window.mcconfig = config;
        this.on('userChange', function (user) {
            if (user) {
                logger.setUser(user.get('id'), user.get('email'), user.get('name'));
            }
        });
    },

    locale: function () {
        return this.get('container').lookup('service:i18n').get('locale');
    }.property('container'),

    config: function () {
        return config;
    }.property(),

    currentRouteNameLeaf: function () {
        return this.get('currentRouteName') ? this.get('currentRouteName').split(/\./).pop() : '';
    }.property('currentRouteName'),

    currentRouteClassNames: function () {
        if (this.get('currentRouteName')) {
            return this.get('currentRouteName').split(/\./).join(' ');
        } else {
            return '';
        }
    }.property('currentRouteName'),

    isTouch: function () {
        return Modernizr.touch;
    }.property(),
    isDesktop: function () {
        var isDesktop;

        if(Modernizr.desktop){
            isDesktop = true;
        }else{
            isDesktop = false;
        }

        return isDesktop;
    }.property(),

    isNotBreakpointXS: function () {
        return this.get('bootstrapBreakpoint') !== 'xs';
    }.property('bootstrapBreakpoint'),

    appOrigin: function () {
        if (!window.location.origin) {
            window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
        }

        return window.location.origin ? window.location.origin : 'https://app.motocal.com';
    }.property(),

    runWithSpinner: function (context, fn) {
        this.send('pushSpinner');

        return new Ember.RSVP.Promise(function (resolve) {
            Ember.run.next(context, function () {
                (fn.bind(context))();
                Ember.run.scheduleOnce('afterRender', this, function () {
                    this.send('popSpinner');
                    resolve();
                });
            }.bind(this));
        }.bind(this));
    },

    showSpinnerText: function (spinnerText) {
        return new Ember.RSVP.Promise(function () {
            Ember.run.scheduleOnce('render', this, function () {
                if (spinnerText) {
                    $('#loading-spinner-modal #gear-loading .cssload-loading')
                        .addClass('sentence')
                        .text(spinnerText);
                }
            });
        });
    },

    actions: {

        toggleModal: function() {
            this.toggleProperty('isModalVisible');
        },
        restartInterview: function () {
            location.hash = '/interview';
            location.reload();   // to re-render views (important to re-render to avoid stale input values)
        },

        exitApp: function () {
            window.location = config.URLs.marketing_site;
        },

        pushSectionSpinner: function () {
            if (this.spinSectionCount < 0 || !$('#loading-spinner-modal.is-visible').length) {
                this.spinSectionCount = 0;
            }

            this.spinSectionCount++;

            Ember.run.scheduleOnce('render', this, function () {
                $('#loading-spinner-modal').addClass('section-visible');
            });
        },

        popSectionSpinner: function () {
            this.spinSectionCount--;

            if (this.spinSectionCount <= 0) {
                Ember.run.scheduleOnce('render', this, function () {
                    var $loadingSpinnerModal = $('#loading-spinner-modal');
                    var loadingSpinnerText = this.get('i18n').t('interview.loading');
                    $loadingSpinnerModal.removeClass('section-visible');
                    $loadingSpinnerModal.find('#gear-loading .cssload-loading')
                        .removeClass('sentence')
                        .text(loadingSpinnerText);
                });
            }
        },

        pushSpinner: function () {
            if (this.spincount < 0 || !$('#loading-spinner-modal.is-visible').length) {
                this.spincount = 0;
            }

            this.spincount++;

            Ember.run.scheduleOnce('render', this, function () {
                $('#loading-spinner-modal').addClass('is-visible');
            });
        },

        popSpinner: function () {
            this.spincount--;

            if (this.spincount <= 0) {
                this.send('clearAllSpinners');
            }
        },

        clearAllSpinners: function () {
            this.spincount = 0;
            $('#loading-spinner-modal').removeClass('is-visible section-visible');

            Ember.run.scheduleOnce('render', this, function () {
                $('#loading-spinner-modal').removeClass('is-visible');
            });
        },

        toast: function (message, level, toastClass, noRepeatByClass, toastrOptions = {}) {
            if (!level) {
                level = 'info';
            }

            var duplicates = false;
            if (!noRepeatByClass) {
                var textMessage = $('<div>' + message + '</div>').text();
                duplicates = $('#toast-container .toast-message').filter(function () {
                    if ($(this).text() === textMessage) {
                        if (toastClass === 'toast-linkedfeature') {
                            return true;
                        }
                        $(this).parent().hide();
                        return true;
                    }
                });
            } else {
                duplicates = $('#toast-container .toast').filter(function () {
                    if ($(this).attr('class').indexOf(toastClass) > -1) {
                        $(this).hide();
                        return true;
                    }
                });
            }

            if (duplicates.length && toastClass === 'toast-linkedfeature') {
                return;
            }

            toastrOptions.iconClass = 'toast-' + level + ' ' + (toastClass ? toastClass : '');
            toastrOptions.showMethod = duplicates.length ? 'fadeIn' : undefined;

            if (config.APP.environment === 'test') {
                window.last = window.last || {};
                window.last.toastrOptions = toastrOptions;
                window.last.toastrOptions.timestamp = new Date();
            }

            window.toastr[level](
                message,
                undefined,
                toastrOptions
            );
        },

        clearAllToasts: function () {
            window.toastr.clear();
        },

        showNetworkConnectivityToast: function () {
            window.toastr.error(
                this.get('i18n').t('error.ajax_error').toString(),
                undefined,
                { iconClass: 'toast-error toast-ajax-error' }
                );
        },

        showApplicationError: function (errorResponse, transition, dontCloseExistingModals) {
            // TODO improve error handling here - working with response codes

            this.send('clearAllSpinners');

            var message;

            if (typeof errorResponse === 'string') {
                message = errorResponse;
            } else if (typeof errorResponse === 'object' && 'statusText' in errorResponse) {

                if (errorResponse.readyState === 0) {
                    // looks like network is down on client, let it bubble up to AjaxError handler
                    return;
                }

                message = errorResponse.statusText;
            } else if (typeof errorResponse === 'object' && 'message' in errorResponse) {
                message = errorResponse.message;
            }

            if (!message || message === 'error') {
                message = 'An unexpected error has occured.';
            }

            this.send('clearAllToasts');

            logger.error('ApplicationError', 'Received an application error: ' + message);

            if ($('.modal').is(':visible') && !dontCloseExistingModals) {
                $('.modal').modal('hide');

                Ember.run.later(this, function () {
                    this.send('showApplicationError', errorResponse, transition, true);
                }, 1000);
            } else {
                if ($('#error-modal').length) {
                    const { stack } = errorResponse || {};
                    const appError = Object.assign(
                        Error(message),
                        { stack: (stack || 'Stack information unavailable') }
                    );
                    $(window).trigger('rsShowAppError', appError);
                } else {
                    this.transitionToRoute('application-error', {queryParams: {errorResponse : message}});
                }
            }
        },

        GAEvent: function (eventCategory, eventAction, eventLabel, eventValue) {
            if (typeof ga === 'function' && config.google_analytics.enabled) {
                ga('send', 'event', eventCategory, eventAction, eventLabel, eventValue);
            }
        },

        showHelp: function () {
            if (/^interview/.test(this.get('currentRouteName'))) {
                window.tourMediator.trigger('show-interview');
            } else if (/^design.selector/.test(this.get('currentRouteName'))) {
                delete window.sessionStorage['rsHasShownTargetCategoryWarning'];
                window.tourMediator.trigger('show-selectmap');
            } else if (/^design.editor/.test(this.get('currentRouteName'))) {
                window.tourMediator.trigger('show-editor');
            } else if (/^design.checkout/.test(this.get('currentRouteName'))) {
                //workaround for small devices as it has tabs n we want to show the first one for the tour
                $('[aria-controls="your-decals"]').click();

                window.tourMediator.trigger('show-checkout');
            }
        }

    }
});
