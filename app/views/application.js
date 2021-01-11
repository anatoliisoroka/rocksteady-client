/* global $ */

import Ember from 'ember';
import config from '../config/environment';

export default Ember.View.extend({
    classNameBindings: ['controller.isTouch:is-touch-device:no-touch', 'controller.currentRouteClassNames', 'controller.editorSubPanelOpen'],

    didInsertElement: function () {
        if (config.APP.features.help_button && config.APP.tooltips && this.$().tooltip) {
            this.$().find('.help-button-container a').tooltip();
        }
    },

    actions: {
        cleanupOnRouteTransition: function () {
            // hide all modals

            if ($) {
                var hideModalBackdrop = true;

                $('.modal').each(function () {
                    if ($(this).hasClass('no-transition-hidden') && $(this).hasClass('in')) {
                        hideModalBackdrop = false;
                        return;
                    }
                    $(this).css('display', 'none');
                });

                if (hideModalBackdrop) {
                    $('.modal-backdrop').remove();
                }
            }

            if (window.tourMediator) {
                // also use this opportunity to close the tour
                window.tourMediator.trigger('close');
            }
        }
    }
});
