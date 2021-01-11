import Ember from 'ember';
import config from '../config/environment';

var intervalId;

export default Ember.Component.extend({

    tagName: 'button',
    classNames: ['sticky-button', 'touch-control-button'],
    attributeBindings: ['disabled'],

    incrementStep () {
        if (this.currentStep < (this.step * 6)) {
            this.set('currentStep', this.currentStep * 1.4);
        }
    },

    resetCurrentStep () {
        this.set('currentStep', this.get('step'));
    },

    applyTooltip: function () {
        if (!config.APP.tooltips && !this.$()) {
            return;
        }
        if (this.$().is(":hover")) {
            this.bindTooltip();
        } else {
            this.unbindTooltip();
        }
    }.observes('value'),

    bindTooltip () {
        var animation = !this.tooltipBound;
        this.unbindTooltip();

        var title;
        title = parseFloat(this.get('value').toString().substring(0, 4)).toFixed(2).toString().replace('.00', '');

        this.$().tooltip({
            placement: 'top',
            'title': title,
            'animation': animation,
            delay: { hide: 300 }
        }).tooltip('show');
        Ember.run.cancel(this.unbindTooltipLater);
        this.unbindTooltipLater = Ember.run.later(() => {
            this.unbindTooltip();
        }, 600);
        this.tooltipBound = true;
    },

    unbindTooltip () {
        if (this.tooltipBound) {
            this.$().tooltip('destroy');
            this.tooltipBound = false;
        }
    },

    didInsertElement: function () {

        this._super();
        var self = this;

        this.resetCurrentStep();
        //bind tooltip on click so it shows it if max or min
        this.$().click(() => {
            this.applyTooltip();
        });


        if (isNaN(self.get('value'))) {
            self.set('value', 0);
        }

        if (this.get('dir') === 'increment') {
            var shouldIncrement = function () {
                var value = parseFloat(self.get('value'));
                var currentStep = parseFloat(self.get('currentStep'));
                var max = parseFloat(self.get('max'));
                var infiniteMax = self.get('infiniteMax');
                var precision = parseInt(self.get('precision'));

                if (self.get("parentView.controller.model.isUserAddedGraphic") &&
                    self.get('userAddedGraphicMax')) {
                    max = self.get('userAddedGraphicMax');
                    infiniteMax = false;
                }

                if ((value + currentStep) <= max || infiniteMax) {

                    self.incrementPropertyWithPrecision('value', currentStep, precision);

                    if (parseFloat(self.get('value')) > 1000) {
                        self.set('value', 1000);
                    }
                } else if (self.get('hitMaximumAction')) {
                    self.get('parentView.controller').send(self.get('hitMaximumAction'));
                }

                self.incrementStep();
            };

            this.$().on('click', function () {
                Ember.run(shouldIncrement);
            });

            this.$().on('touchstart mousedown', function () {
                //self.set('holdStart', moment());
                window.clearTimeout(intervalId);
                intervalId = window.setInterval(function () {
                    Ember.run(shouldIncrement);
                }, 200);
            }).on('touchend mouseup mouseleave', () => {
                //self.set('holdStart', null);
                window.clearTimeout(intervalId);
                this.resetCurrentStep();
            });

        } else {
            var shouldDecrement = function () {
                var value = parseFloat(self.get('value'));
                var currentStep = parseFloat(self.get('currentStep'));
                var min = parseFloat(self.get('min'));
                var precision = parseInt(self.get('precision'));

                if ((value - currentStep) >= min) {
                    self.decrementPropertyWithPrecision('value', currentStep, precision);
                }

                self.incrementStep();
            };

            this.$().on('click', function () {
                Ember.run(shouldDecrement);
            });

            this.$().on('touchstart mousedown', function () {
                //self.set('holdStart', moment());
                window.clearTimeout(intervalId);
                intervalId = window.setInterval(function () {
                    Ember.run(shouldDecrement);
                }, 200);
            }).on('touchend mouseup mouseleave', () => {
                //self.set('holdStart', null);
                window.clearTimeout(intervalId);
                this.resetCurrentStep();
            });
        }
    },

    willDestroyElement: function () {
        this.unbindTooltip();
        window.clearInterval(intervalId);
    },

    decrementPropertyWithPrecision: function decrementPropertyWithPrecision(key, value, precision) {
        this.decrementProperty(key, value);
        this.set(key, this.floatToPrecision(this.get(key), precision));
    },

    incrementPropertyWithPrecision: function incrementPropertyWithPrecision(key, value, precision) {
        this.incrementProperty(key, value);
        this.set(key, this.floatToPrecision(this.get(key), precision));
    },

    floatToPrecision: function floatToPrecision(number, precision) {
        var floatStringWithPrecision = parseFloat(number).toFixed(precision);
        return parseFloat(floatStringWithPrecision);
    }

});


