import Ember from 'ember';
import RegionMixin from '../../mixins/region';
import ShippingOptionsMixin from '../../mixins/shipping-options';
import EmberValidations from 'ember-validations';
import config from '../../config/environment';

export default Ember.Controller.extend(RegionMixin, ShippingOptionsMixin, EmberValidations, {

    needs: ['application', 'design', 'design/checkout', 'interview'],

    phoneNumberRequired: false,

    currency: Ember.computed.alias('controllers.design.currency'),

    onBlurValidations: {},

    selectedShippingOption: undefined,

    previousShippingOption: undefined,

    userPhoneNumber: '',

    init: function () {
        this._super();
        this.set('model', this.get('controllers.design/checkout.content.shippingAddress'));
        this.validations['model.name'].format.message =  this.get('i18n').t('formValidation.validation_name');
        this.validations['model.email'].format.message =  this.get('i18n').t('formValidation.validation_email');
        this.validations['model.email'].confirmation.message =  this.get('i18n').t('formValidation.validation_email_match');
        this.validations['model.emailConfirmation'].presence.message =  this.get('i18n').t('formValidation.validation_email_confirm');
        this.validations['model.address1'].format.message =  this.get('i18n').t('formValidation.validation_address1');
        this.validations['model.city'].format.message =  this.get('i18n').t('formValidation.validation_city');
        this.validations['model.phoneNumber'].format.message =  this.get('i18n').t('formValidation.validation_phone_number');

        this.get('controllers.interview').on('newDesign', () => {
            this.set('userPhoneNumber', '');
        });
    },

    noteAboveLocalAmount: function () {
        var currency = this.get('controllers.design/checkout.currency');
        return Math.ceil(config.APP.minimum_shipping_cost * currency.get('fxRate'));
    }.property('currency'),

    tooltipString: function () {
        return this.get('i18n').t('checkout.note_above_20', {
            currency: this.get('currency.symbol'),
            amount: this.get('noteAboveLocalAmount')
        }).toString();
    }.property('currency'),

    isFieldValid: function (name) {
        if (this.get('onBlurValidations.' +  name) || this.get('controllers.design/checkout.clickedPlaceOrder')) {
            return this.get('errors.model.' + name + '.length') === 0;
        }
        return true;
    },

    isNameValid: function () {
        return this.isFieldValid('name');
    }.property('controllers.design/checkout.clickedPlaceOrder', 'onBlurValidations.name', 'model.name', 'errors'),

    isEmailValid: function () {
        return this.isFieldValid('email');
    }.property('controllers.design/checkout.clickedPlaceOrder', 'onBlurValidations.email', 'model.email', 'model.emailConfirmation'),

    isEmailConfirmationValid: function () {
        return this.isFieldValid('emailConfirmation');
    }.property('controllers.design/checkout.clickedPlaceOrder', 'onBlurValidations.emailConfirmation', 'model.email', 'model.emailConfirmation'),

    isAddress1Valid: function () {
        return this.isFieldValid('address1');
    }.property('controllers.design/checkout.clickedPlaceOrder', 'onBlurValidations.address1', 'model.address1'),

    isCityValid: function () {
        return this.isFieldValid('city');
    }.property('controllers.design/checkout.clickedPlaceOrder', 'onBlurValidations.city', 'model.city'),

    isPhoneNumberValid: function () {
        return this.isFieldValid('phoneNumber');
    }.property('controllers.design/checkout.clickedPlaceOrder', 'onBlurValidations.phoneNumber', 'model.phoneNumber'),

    validations: {

        'model.name': {
            format: { with: /^(?=.*\S).+$/, message: '' } // TODO i18n
        },

        'model.email': {
            format: { with: /^\S+@\S+\.\S+$/, message: '' },
            confirmation: {message: '' }
        },

        'model.emailConfirmation': {
            presence: { message: ''}
        },

        'model.address1': {
            format: { with: /^(?=.*\S).+$/, message: '' }
        },

        'model.city': {
            format: { with: /^(?=.*\S).+$/, message: '' }
        },

        'model.country': {
            presence: true
        },

        'model.phoneNumber': {
            format: { with: /^[0-9 \(\)\-]+(ext)?[0-9 \(\)\-]+$/, message: '' }
        }
    },

    shippingOptionsObserver: function () {
        this.set('controllers.design/checkout.loadingShippingOptions', true);

        Ember.run.later(this, function () {
            var params = {
                'iso2_country_code': this.get('model.country.iso_alpha_2'),
                'price': this.get('controllers.design/checkout.discountCode') ? this.get('controllers.design.model.euroDiscountedBasePrice') : this.get('controllers.design.model.euroPrice'),
                'discount_code_type': (this.get('controllers.design/checkout.model.discountCode.type') ? this.get('controllers.design/checkout.model.discountCode.type').toLowerCase() : 'none')
            };

            this.store.find('shipping-option', params).then((shippingOptions) => {
                //set currency
                shippingOptions.sortBy('cost').forEach((shippingOption) => {
                    shippingOption.set('currency', this.get('currency'));
                });

                this.set('shippingOptions', shippingOptions);

                this.setPreviousShippingOption();

                this.set('controllers.design/checkout.loadingShippingOptions', false);
            });
        });

    }.observes('model.country', 'controllers.design/checkout.model.discountCode', 'controllers.design.model.euroPrice').on('init'),

    selectedShippingOptionObserver: function () {
        if (this.get('selectedShippingOption')) {
            this.set('controllers.design/checkout.model.shippingOption', this.get('selectedShippingOption'));

            this.set('phoneNumberRequired', this.get('selectedShippingOption.phoneRequired'));

            //keep phone number entered by user
            //the model will change depending on the shipping option
            if (this.get('model.phoneNumber') !== '000') {
                this.set('userPhoneNumber', this.get('model.phoneNumber'));
            }

            if (!this.get('phoneNumberRequired')) {
                this.set('model.phoneNumber', '000');
            } else {
                this.set('model.phoneNumber', this.get('userPhoneNumber') || '');
            }
        }
    }.observes('selectedShippingOption', 'controllers.design/checkout.model'),

    setPreviousShippingOption () {
        this.set('previousShippingOption', this.get('selectedShippingOption'));
        if (!this.get('previousShippingOption')) {
            this.setCheapestShippingOption();
        }

        var sameTypeShippingOption = this.get('shippingOptions').findBy('type', this.get('previousShippingOption.type'));
        if (!sameTypeShippingOption) {
            this.setCheapestShippingOption();
        } else {
            this.set('selectedShippingOption', sameTypeShippingOption);
        }
    },

    setCheapestShippingOption () {
        var shippingOptions = this.get('shippingOptions');
        this.set('selectedShippingOption', shippingOptions.sortBy('cost').get('firstObject'));
    },

    setStandardShippingOption () {
        var standardShippingOption = this.get('shippingOptions').findBy('type', 'Standard');
        var freeShippingOption = this.get('shippingOptions').findBy('type', 'Free');
        if (!standardShippingOption && !freeShippingOption) {
            return;
        }
        this.set('selectedShippingOption', standardShippingOption || freeShippingOption);
    },

    selectedShippingOptionString: function () {
        return this.get('selectedShippingOption.time') + ' ' + this.get('i18n').t('checkout.business_days') + ' ' + this.get('currency.symbol') + this.get('selectedShippingOption.localCostStr');
    }.property('selectedShippingOption', 'controllers.design/checkout.currency'),

    actions: {

        showTermsAndConditions: function () {
            this.transitionToRoute('design.checkout.termsAndConditions');
        }

    }
});
