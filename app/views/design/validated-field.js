/* global $ */

import Ember from 'ember';
import config from '../../config/environment';

export default Ember.TextField.extend(Ember.ViewTargetActionSupport, {

    classNames: ['form-control', 'validated-field'],
    attributeBindings: ['data-name', 'value'],

    notifyImmediately: true,

    click: function () {
        if (this.get('notifyImmediately')) {
            this.send('notifyUser');
        }
    },

    focusIn: function () {
        if (this.get('notifyImmediately')) {
            this.send('notifyUser');
        }
    },

    focusOut () {
        if (this.get('validateOnBlur')) {
            var controller = this.get('parentView.controller');
            controller.set('onBlurValidations.' + this.get('data-name'), true);
        }
    },

    keyPress: function () {
        if (this.get('notifyImmediately')) {
            this.send('notifyUser');
        }
    },

    actions: {

        notifyUser: function () {

            var controller = this.get('parentView.controller');
            var errors = controller.get('errors.model.' + this.get('data-name'));

            var isValid = controller.get('is' + this.get('data-name').capitalize() + 'Valid');
            var error_msg = '';

            if (errors) {

                errors.forEach(function (err) {
                    error_msg += err + '\n';
                });

                if (isValid !== true) {

                    this.$().parent('span').addClass('has-error');

                    if (config.APP.tooltips && this.$()) {

                        this.$().tooltip({
                            placement: 'top',
                            title: error_msg,
                            html: false,
                            trigger: 'focus',
                            template: '<div class="tooltip tooltip-error"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>'
                        }).on({
                            focus: function () {
                                $(this).tooltip('show');
                            },
                            focusout: function () {
                                $(this).tooltip('hide');
                            }
                        });
                    }

                } else {

                    if (config.APP.tooltips && this.$().tooltip) {
                        this.$().tooltip('destroy');
                    }
                }
            }
        }
    }
});
