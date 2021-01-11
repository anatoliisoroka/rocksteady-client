/* global $, moment */

import Ember from 'ember';
import config from '../../../config/environment';

export default Ember.View.extend({
    _userActionService: Ember.inject.service('user-action-service'),
    slider: null,

    rangeDecimalPoints: 1,

    graphicObject: function () {
        if (this.get('controller.model.type') === 'GraphicIcon') {
            return this.get('controller').store.getById('graphic', this.get('controller.model').getAttribute('icon').get('value'));
        } else {
            return null;
        }
    }.property('controller.model'),

    didInsertElement: function () {

        this._super();
        var self = this;

        var min = parseFloat(self.get('min'));
        var start = parseFloat(self.get('value'));
        var step = parseFloat(self.get('step'));
        var infiniteMax = self.get('infiniteMax');
        var max;

        if (self.get('max') === 'shape' && self.get('controller.model.position.activeShape')) {
            // use the size of the shape to determine max.
            max = Math.ceil(self.get('controller.model.position.activeShape.width') / 100);
        } else {
            max = parseFloat(self.get('max'));
        }

        if (this.get('controller.model.isUserAddedGraphic') &&
            this.get('graphicObject.graphicType') !== 'SVG' &&
            this.get('userAddedGraphicMax')) {
            max = this.get('userAddedGraphicMax');
            infiniteMax = false;
        }

        if (isNaN(max)) {
            max = 0;
        }

        const options = {
            range: { min, max },
            step,
            start,
            handles: 1,
            connect: 'lower'
        };
        const trackUserAction = (undo, redo) => {
            const model = this.get('controller.model');
            const name = this.get('prop');

            this.get('_userActionService')
                .appendAction({
                    model,
                    owner: 'feature',
                    changes: [{ name, values: { undo, redo }}]
                });
        };
        let startValue;
        const slider = this.$().noUiSlider(options);
        this.set('slider', slider);
        slider
            .on({
                slide: () => {
                    startValue = typeof startValue !== 'undefined' ?
                        startValue : this.get(`controller.model.${this.get('prop')}`);

                    Ember.run.debounce(
                        null,
                        () => this.slid(slider.val()),
                        config.APP.editor_canvas_redraw
                    );
                },
                change: (event, currentValue) => {
                    trackUserAction(startValue, parseFloat(currentValue));
                    startValue = undefined;
                }
            });

        var icons = {
            'borderSize' : 'sprite-icon-border-thickness',
            'angle' : 'sprite-icon-rotate',
            'fontSize' : 'sprite-icon-size',
            'scale' : 'sprite-icon-size',
            'letterSpacing': 'sprite-icon-letter-spacing',
            'lineHeight': 'sprite-icon-line-spacing',
            'opacity': 'sprite-icon-opacity'
        };

        // find label, decrement/increment btns in parentview template
        var slider_val = this.$().parents('.slider').find('.rangeValue');
        var inc_button = this.$().siblings('.increment-btn');
        var dec_button = this.$().siblings('.decrement-btn');
        // Creator of noUISlider left it's child elements classless,
        // Add my own classes to make styling easier and more specific.
        var handle = this.$().find('div.noUi-handle');
        //handle.addClass('handle');

        this.set('rangeValueEle', slider_val);
        this.set('decrementBtnEle', dec_button);
        this.set('incrementBtnEle', inc_button);

        //name attributes for testing
        var name_attr = this.get('parentView.labelName').toString().camelize();

        slider_val[0].setAttribute('name', name_attr + 'Slider');
        inc_button[0].setAttribute('name', name_attr + 'Increment');
        dec_button[0].setAttribute('name', name_attr + 'Decrement');
        handle[0].setAttribute('name', name_attr + 'Handle');

        //slider icons
        this.$().parent().find('i.slider-icon').addClass(icons[name_attr]);

        var getHoldStep = function (step, value) {
            if (!self.get('stickyThrottle')) {
                return step;
            }

            var d = moment.duration(moment().subtract(self.get('holdStart')));
            step *= d.asSeconds() * (value / self.get('stickyThrottle'));

            if (self.get('step') === '1') {
                step = Math.ceil(step);
            }

            if (step >= 1) {
                value = Math.ceil(value);
                self.set('value', value);
                step = Math.ceil(step);
            }

            return step;
        };

        const mayTrackAction = () => {
            if (this.get('clearInterval')) {
                this.set('clearInterval', null);
                this.get('_userActionService')
                    .appendAction({
                        model: this.get('controller.model'),
                        owner: 'feature',
                        changes: [{
                            name: this.get('prop'),
                            values: { undo: this.get('startValue'), redo: this.get('value') }
                        }]
                    });
            }
        };

        const shouldIncrement = () => {
            if (this && this.get('isDestroyed')) {
                return;
            }

            const value = parseFloat(this.get('value'));
            let step = parseFloat(this.get('step'));

            if (this.get('holdStart')) {
                step = getHoldStep(step, value);
            }

            if ((value + step) <= max || infiniteMax) {
                this.incrementProperty('value', step);

                if (parseFloat(this.get('value')) > 1000) {
                    this.set('value', 1000);
                }
            } else {
                this.set('value', max);

                if (this.get('hitMaximumAction')) {
                    this.get('controller').send(this.get('hitMaximumAction'));
                }
            }

            mayTrackAction();
            this.updateRangeValue();
        };

        const shouldDecrement = () => {
            if (this && this.get('isDestroyed')) {
                return;
            }

            const value = parseFloat(this.get('value'));
            const min = parseFloat(this.get('min'));
            let step = parseFloat(this.get('step'));

            if (this.get('holdStart')) {
                step = getHoldStep(step, value);
            }

            if ((value - step) >= min) {
                this.decrementProperty('value', step);
            } else {
                this.set('value', min);
            }

            mayTrackAction();
            this.updateRangeValue();
        };

        const initHandler = (elementId, fn) => {
            let timeoutId;

            this.get(elementId)
                .mousedown(() => {
                    this.set('holdStart', moment());
                    this.set('startValue', this.get(`controller.model.${this.get('prop')}`));
                    timeoutId = window.setInterval(() => Ember.run(fn), 200);
                })
                .bind('mouseup mouseleave', () => {
                    if (this && !this.get('isDestroyed')) {
                        this.set('holdStart', null);
                    }
                    this.set('clearInterval', true);
                    window.clearTimeout(timeoutId);
                })
        };

        initHandler('decrementBtnEle', shouldDecrement);
        initHandler('incrementBtnEle', shouldIncrement);


        this.get('incrementBtnEle').on('click', function () {
            Ember.run(shouldIncrement);
        });

        this.get('decrementBtnEle').on('click', function () {
            Ember.run(shouldDecrement);
        });

        var incrementTimer, decrementTimer;
        this.get('incrementBtnEle').on('touchstart', function () {
            incrementTimer = window.setInterval(function () {
                Ember.run(shouldIncrement);
            }, 200);
        }).on('touchend', function () {
            window.clearTimeout(incrementTimer);
        });

        this.get('decrementBtnEle').on('touchstart', function () {
            decrementTimer = window.setInterval(function () {
                Ember.run(shouldDecrement);
            }, 200);
        }).on('touchend', function () {
            window.clearTimeout(decrementTimer);
        });

        this.updateRangeValue();

        this.addGauge();
    },

    willDestroyElement: function () {
        this.get('incrementBtnEle').unbind();
        this.get('decrementBtnEle').unbind();
    },

    graphicObserver: function () {
        this.rerender();
    }.observes('controller.model.isUserAddedGraphic'),

    updateRangeValue: function () {
        // Update value bubble.
        let rangeDecimalPoints = this.get('rangeDecimalPoints');
        let rangeEle = this.get('rangeValueEle');
        let val = (parseFloat(this.get('value'))).toFixed(rangeDecimalPoints).replace(/\.?0+$/, '');
        rangeEle.text(val);
    },

    slid (value) {
        if (!this.get || this.get('isDestroyed')) {
            return;
        }
        this.set('value', value);
        this.updateRangeValue();
    },

    valueChanged: function () {

        this.get('slider').val(this.get('value'));

        var slider_val = parseFloat(this.get('value'));
        var min = parseFloat(this.get('min'));
        var max = parseFloat(this.get('max'));

        var handle = this.$().find('a');
        //handle.addClass('handle');

        //slider handle fix to ensure correct positioning on gauge
        //applies only to sliders with range of positive values
        function isNegative(n) {
            return n < 0;
        }

        if (!isNegative(min)) {
            var pos = (slider_val / max) * 100 + '%';
            handle.css({'left': pos});
        }

        //format the value displayed in the tooltip
        var val = Number(this.get('slider').val()).toFixed(1).replace(/\.?0+$/, '');
        var rangeEle = this.get('rangeValueEle');

        rangeEle.text(val);

    }.observes('value'),

    addGauge: function () {
        // creates a gauge and adds behind slider.
        var sliderWrapper = this.$();
        var inputWidth = this.$().width();
        var numLargeGauge = 5;
        var numSmallGauge = 4;
        var gaugeContainer = $('<div class="gauge-container"></div>').width(inputWidth);
        var largeGaugePos = 0;
        var smallGaugeDistance = inputWidth / (numLargeGauge - 1);
        var smallGaugePos = smallGaugeDistance / 2;
        var i;
        var gauge;

        for (i = 0; i < numLargeGauge; i++) {
            gauge = $(('<div class="tall-gauge"></div>')).css('left', largeGaugePos + '%');
            gaugeContainer.append(gauge);
            largeGaugePos += 25;
        }

        for (i = 0; i < numSmallGauge; i++) {
            gauge = $(('<div class="small-gauge"></div>')).css('left', smallGaugePos + 'px');
            gaugeContainer.append(gauge);
            smallGaugePos += smallGaugeDistance;
        }

        sliderWrapper.append(gaugeContainer);
    },

    scaleObserver: function () {
        if (this.get('scaleRangeObserver')) {
            // http://redmine.motocal.com/issues/1089

            var scale = this.get('controller.model.scale');
            var value = this.get('value');

            if (parseFloat(scale) > parseFloat(value)) {
                this.set('value', scale);
                this.updateRangeValue();
            }
        }
    }.observes('controller.model.scale')

});
