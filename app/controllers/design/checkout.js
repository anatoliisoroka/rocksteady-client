/* global moment, logger, Modernizr, mixpanel */

import Ember from 'ember';
import RegionMixin from '../../mixins/region';
import PrintShapesMixin from '../../mixins/print-shapes';
import EmberValidations from 'ember-validations';
import config from '../../config/environment';

export default Ember.Controller.extend(RegionMixin, PrintShapesMixin, Ember.Evented, EmberValidations, {

    needs: ['application', 'design', 'design/checkoutShippingDetails', 'design/checkout/billing', 'interview'],

    designService: Ember.inject.service('design-service'),
    orderComplete: false,
    addressValid: false,
    clickedPlaceOrder: false,
    hasInputErrors: false,
    generatedPrintShapeCount: 0,
    loadingShippingOptions: false,

    checkoutPageVisited: false,

    hasTabs: function () {
        //workaround as it does not consider 768
        return this.get('controllers.application.bootstrapBreakpoint') === 'xs' || window.innerWidth === 768;
    }.property('controllers.application.bootstrapBreakpoint'),

    progressBarPercentage: function () {
        return Math.floor(this.get('generatedPrintShapeCount') * 100 / this.get('model.design.activePositions.length'));
    }.property('generatedPrintShapeCount', 'model.design.activePositions.length'),

    progressBarStyle: Ember.computed('progressBarPercentage', function () {
        var width = parseInt(this.get('progressBarPercentage')) + '%';
        return new Ember.Handlebars.SafeString('width: ' + width);
    }),

    currency: Ember.computed.alias('controllers.design.currency'),

    selectedShippingOption: Ember.computed.alias('controllers.design/checkoutShippingDetails.selectedShippingOption'),

    shippingOptions: Ember.computed.alias('controllers.design/checkoutShippingDetails.shippingOptions'),

    localTotalPrice: Ember.computed.alias('controllers.design.model.localTotalPrice'),
    localTotalPriceStr: Ember.computed.alias('controllers.design.localTotalPriceStr'),

    euroTotalPrice: Ember.computed.alias('controllers.design.model.euroBasePrice'),

    discountCode: Ember.computed.alias('model.discountCode'),
    canApplyDiscount: Ember.computed.empty('discountCode'),

    discountAmountStr: function () {
        if (!this.get('discountCode')) {
            return '0.00';
        } else {
            return this.getLocalDiscountedAmount().toFixed(2);
        }
    }.property('localTotalPrice', 'discountCode'),

    discountRateStr: function () {
        return (this.get('discountCode.rate') * 100).toFixed(0) + '%';
    }.property('discountCode'),

    totalPrice: function () {
        //apply shipping costs
        var totalPrice = this.get('localTotalPrice');

        if (!this.get('discountCode')) {
            if (!this.get('checkoutPageVisited')) {
                return totalPrice;
            }

            return totalPrice + this.get('model.shippingOption.localCost');
        } else {

            //TODO Move to model if possible
            //Used in the print request serializer
            this.set('model.design.euroDiscountedTotalPrice', this.getEuroDiscountedTotal());

            //TODO Move to model if possible
            //Used in shippingOptionsObserver
            this.set('model.design.euroDiscountedBasePrice', this.getEuroDiscountedBasePrice());

            return this.getLocalDiscountedTotal();
        }
    }.property('localTotalPrice', 'discountCode', 'model.shippingOption'),

    totalPriceStr: function () {
        return this.get('totalPrice').toFixed(2);
    }.property('totalPrice'),

    discountQuantityMessage: function () {
        return this.get('i18n').t('checkout.discount_quantity_message', {
            quantity: this.get('discountCode.quantity')
        }).toString();
    }.property('discountCode.quantity'),

    init: function () {
        var controller = this;

        this.on('didGeneratePrintShape', function () {
            controller.incrementProperty('generatedPrintShapeCount');
        });

        this.get('controllers.interview').on('newDesign', () => {
            this.set('checkoutPageVisited', false);
        });

        this._super();
    },

    analytics: function () {

        var controller = this;

        var analytics = {
            transaction: {
                'id': this.get('model.id'),
                'revenue': this.get('totalPriceStr'),
                'currency': this.get('currency.iso_code')
            },
            items: []
        };

        this.get('model.shapes').forEach(function (printShape) {
            analytics.items.push({
                'id': analytics.transaction.id,
                'name': printShape.get('position_name'),
                'sku': printShape.get('shape.internal_id'),
                'category': controller.get('controllers.design.description'),
                'price': (printShape.get('component.singlePrice') * controller.get('currency.fxRate')).toFixed(5),
                'quantity': printShape.get('qty'),
                'currency': controller.get('currency.iso_code')
            });
        });

        return analytics;
    },

    disablePlaceOrderButton: function () {
        var activeComponents = this.get('model.design.activeComponents');

        var componentsWithQuantity = activeComponents.filter(function (component) {
            return parseInt(component.get('quantity')) > 0;
        });

        var disablePlaceOrderButton = false;

        if(componentsWithQuantity.get('length') === 0 && !this.get('loadingShippingOptions')){
            disablePlaceOrderButton = true;
        }else if(this.get('localTotalPrice') === 0){
            disablePlaceOrderButton = true;
        }

        return disablePlaceOrderButton;
    }.property('model.design.activeComponents.@each.quantity'),

    actions: {

        startNewDesign: function () {
            this.transitionToRoute('design.selector.startNewDesign');
        },

        selectQuality: function (component, decal) {
            component.set('activeDecal', decal);
            //this.get('model.design').set('quality', 'Custom');
        },

        openBillingView: function () {
            this.replaceRoute('design.checkout.billing');
        },

        validateInput: function () {

            var controller = this;
            this.set('clickedPlaceOrder', true);

            this.get('controllers.design/checkoutShippingDetails').validate().then(function () {
                controller.placeOrder();
            }).catch(function () {
                controller.toggleProperty('hasInputErrors');
            });
        },

        createNewPrintRequest: function () {
            var printRequest = this.store.createRecord('printRequest', {
                design: this.get('model.design'),
                locale: this.get('model.locale'),
                shippingAddress: this.get('model.shippingAddress'),
                shippingOption: this.get('model.shippingOption'),
                discountCode: this.get('model.discountCode'),
            });

            this.set('model', printRequest);

            return printRequest;
        },
        clearPrintRequestsLocalStorage:  function () {
            for (var printRequestStorageKey in window.localStorage) {
                    if (printRequestStorageKey.indexOf('print_request.') === 0) {
                    delete window.localStorage[printRequestStorageKey];
                }
            }
        },

        unapplyDiscountCode: function () {
            this.set('discountCode', undefined);
            this.set('discountCodeToCheck', '');
        },

        unapplyShippingOption: function () {
            this.get('controllers.design/checkoutShippingDetails').setStandardShippingOption();
        }
    },

    placeOrder () {

        var controller = this;

        const abortCheckout = (errorResponse) => {
            logger.warn('CheckoutAbortedWarning', JSON.stringify(errorResponse));
            if(config.mixpanel.enabled) {
                mixpanel.track('CheckoutAbortedWarning', {"errorResponse": errorResponse});
            }
            controller.trigger('hideProgressBar');
            controller.get('controllers.application').send('showApplicationError', errorResponse);
            controller.send('createNewPrintRequest');
        };

        const sendPrintRequest = () => {
            return new Ember.RSVP.Promise(function (resolve, reject) {
                //FIXME - better print request validation here
                controller.get('model').save().then(function (printRequest) {
                    if (!/^[\d\w ]{24}$/.test(printRequest.get('id'))) {
                        logger.warn('InvalidPrintRequestIdWarning', printRequest.get('id'));
                        return reject('Invalid print request id: ' + printRequest.get('id'));
                    }
                    controller.set('model.design.lastPrintRequestId', controller.get('model.id'));
                    controller.get('model.design').save().then(resolve, reject);
                }, (reject) =>{
                    logger.warn('sendPrintRequestReject', 'ID ' + controller.get('model.id') + ' rejected as ' + reject);
                    if(config.mixpanel.enabled) {
                        mixpanel.track('sendPrintRequestReject', {"ID": controller.get('model.id')});
                    }
                });
            });
        };

        const generateSelectorPNG = () =>
            new Ember.RSVP.Promise((resolve, reject) =>
                this.get('designService')
                    .toPNG(this.get('model.design'))
                    .then((imageUrl) => {
                        this.set('model.selector', imageUrl);
                        resolve();
                    })
                    .catch(reject)
            );

        const openBillingView = () => {
            var endTime = moment(),
            duration = moment.duration(endTime.subtract(controller.get('printRequestStartTime')));

            logger.warn('PrintRequestTimeTakenInfo', 'Time taken to prepare and send print request: ' + duration.asSeconds() + ' seconds');

            if (duration.asSeconds() > 60) {
                logger.warn('PrintRequestTimeTakenWarning', 'Print request took over a minute (' + duration.asSeconds() + ' seconds)');
            }

            controller.trigger('hideProgressBar');

            return new Ember.RSVP.Promise(function (resolve /*, reject */) {
                controller.send('openBillingView');
                resolve();
            });
        };

        const generatePrintShapes = () => {
            return new Ember.RSVP.Promise(function (resolve, reject) {

                controller.indexUsedColours();

                var activePositions = controller.get('model.design.activePositions'),
                    i = 0;

                controller.get('model.shapes').clear();

                var go = function () {
                    var promise = controller.createPrintShape(activePositions[i]);

                    promise.then(
                        function (printShape) {
                            controller.trigger('didGeneratePrintShape', {id: printShape.get('id')});
                            controller.get('model.shapes').pushObject(printShape);

                            Ember.run.later(this, function () {
                                i++;

                                if (i === activePositions.length) {
                                    if (controller.get('model.shapes.length') !== activePositions.get('length')) {
                                        logger.warn('PrintShapesCountWarning');
                                    }

                                    resolve();
                                } else {
                                    go();
                                }
                            }, 100);
                        },
                        reject);
                };

                go();
            });
        };

        const resetOrder = () => {
            return new Ember.RSVP.Promise(function (resolve/*, reject*/) {
                controller.get('controllers.application').send('clearAllToasts');
                controller.get('model.shapes').clear();
                controller.set('model.selector', null);
                resolve();
            });
        };

        const removeComponentsWithZeroQuantity = () => {
            return new Ember.RSVP.Promise(function (resolve/*, reject*/) {
                controller.get('controllers.design').send('removeComponentsWithZeroQuantity');
                resolve();
            });
        };

        const persistPrintRequestData = () => {
            return new Ember.RSVP.Promise(function (resolve/*, reject*/) {
                // save analytics data (will be sent when purchase is complete)
                if (Modernizr.localstorage) {
                    var printRequestData = {
                        analytics: controller.analytics(),
                        shippingAddress: controller.get('model.shippingAddress'),
                        deliveryEstimate: controller.get('model.shippingOption.localizedDeliveryEstimate'),
                        price: {
                            base: controller.get('localTotalPriceStr'),
                            discount: controller.get('discountCode') ? controller.get('discountAmountStr') : undefined,
                            discountRate: controller.get('discountCode') ? controller.get('discountRateStr') : undefined,
                            total: controller.get('totalPriceStr')
                        }
                    };

                    try {
                        window.localStorage['print_request.' + controller.get('model.id')] = JSON.stringify(printRequestData);
                        if(config.mixpanel.enabled) {
                            mixpanel.track('PrintRequestLocalStorage', {"print-request": controller.get('model.id')});
                        }
                    } catch (e) {
                        logger.warn('PersistPrintRequestDataWarning', 'Can\'t persist print request data to local storage: ' + e);
                    }
                }

                resolve();
            });
        };

        controller.set('printRequestStartTime', moment());
        controller.set('generatedPrintShapeCount', 0);

        this.trigger('showProgressBar');
        this.get('controllers.application').trigger('userDetailsChange', this.get('model.shippingAddress'));

        //MOT-1320 Every order placed should have a unique print request id
        this.send('createNewPrintRequest');

        this.get('model.design').save().
            then(resetOrder).
            then(removeComponentsWithZeroQuantity).
            then(sendPrintRequest).
            then(generatePrintShapes).
            then(generateSelectorPNG).
            then(sendPrintRequest).
            then(persistPrintRequestData).
            then(openBillingView).
            catch(abortCheckout);
    },

    getLocalDiscountedTotal(){
        return (this.get('localTotalPrice') - this.getLocalDiscountedAmount()) + this.get('model.shippingOption.localCost');
    },

    getEuroDiscountedTotal(){
        return (this.get('euroTotalPrice') - this.getEuroDiscountedAmount()) + this.get('model.shippingOption.cost');
    },

    getEuroDiscountedBasePrice(){
        return (this.get('euroTotalPrice') - this.getEuroDiscountedAmount());
    },

    getLocalDiscountedAmount(){
        return this.getEuroDiscountedAmount() * this.get('model.design.currency.fxRate');
    },

    getEuroDiscountedAmount(){
        let discountCode = this.get('discountCode');
        let quantity = discountCode.get('quantity');
        let rate = discountCode.get('rate');
        let activeComponents = this.get('model.design.activeComponents');

        let euroDiscountedAmount = activeComponents.reduce(function (sum, component) {
            let componentQuantity = component.get('quantity');
            for (let j = 0; j < componentQuantity && j < quantity; j++) {
                sum += (component.get('singlePrice') * rate);
            }
            return sum;
        }, 0);

        euroDiscountedAmount = Math.ceil(euroDiscountedAmount * 100) / 100;

        return euroDiscountedAmount;
    }

});
