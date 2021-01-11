import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.Controller.extend(EmberValidations, {

    needs: ['design', 'application'],

    email: '',
    sending: false,
    error: false,

    init: function () {
        this._super();
        this.set('validations.email.format.message', this.get('i18n').t('selector.validation_email'));
    },

    disableSendButton: function () {
        if (this.get('email') === '') {
            return false;
        }

        if (this.get('sending') || this.get('isEmailInvalid')) {
            return true;
        }

        return false;
    }.property('sending', 'email', 'isEmailInvalid'),

    isEmailInvalid: function () {
        return this.get('errors.email.length') > 0;
    }.property('email'),

    startNewDesign: function () {
        var controller = this;

        return new Ember.RSVP.Promise((resolve) => {
            if (this.get('email') && !this.get('isEmailInvalid')) {
                this.set('sending', true);

                this.get('controllers.design').saveToEmail(this.get('email')).then(function () {
                    controller.set('sending', false);
                    resolve();
                }, function () {
                    controller.set('error', true);
                });
            } else {
                resolve();
            }
        });
    },

    validations: {
        email: {
            format: {with: /^\S+@\S+\.\S+$/, message: ''}
        }
    }
});
