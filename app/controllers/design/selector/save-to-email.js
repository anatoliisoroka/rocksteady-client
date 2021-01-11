import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from '../../../config/environment';

export default Ember.Controller.extend(EmberValidations, {

    needs: ['design'],

    selectorHeaderController: null,
    email: '',
    sent: false,
    sending: false,
    error: false,

    disableSendButton: Ember.computed.or('sending', 'isEmailInvalid'),

    init: function () {
        this._super();
        this.set('validations.email.format.message', this.get('i18n').t('selector.validation_email'));

        this.set('controllers.design.model.hasPromptedToSave', true);
    },

    isEmailInvalid: function () {
        return this.get('errors.email.length') > 0;
    }.property('email'),

    actions: {

        save: function () {

            var controller = this;

            this.set('sending', true);

            this.get('controllers.design').saveToEmail(this.get('email')).then(function () {
                if (config.APP.environment === 'test') {
                    Ember.run.later(this, function () {
                        controller.set('sending', false);
                        controller.set('sent', true);
                    }, 5000);
                } else {
                    controller.set('sending', false);
                    controller.set('sent', true);
                }
            }, function () {
                // can't save
                controller.set('error', true);
            });
        }
    },

    validations: {
        email: {
            format: { with: /^\S+@\S+\.\S+$/, message: '' }
        }
    }

});
