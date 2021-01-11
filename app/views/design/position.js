/* global $, Modernizr */

import Ember from 'ember';
import config from '../../config/environment';

var tcwKey = 'rsHasShownTargetCategoryWarning';

export default Ember.View.extend({

    classNames: ['rs-popover'],

    didInsertElement: function () {
        Ember.run(this.invalidatePopover.bind(this));

        if (config.APP.tooltips && this.$()) {
            this.$().find('[title]').tooltip({ container: 'body', placement: 'bottom' });
        }

        if (Modernizr.sessionstorage) {
            if (this.get('controller.controllers.design/selector.model.isTargetCategory') &&
                !window.sessionStorage[tcwKey]) {
                Ember.run.scheduleOnce('afterRender', this, () => window.tourMediator.trigger('show-targetcategorywarning'));
                window.sessionStorage[tcwKey] = 1;
            }
        }
    },

    invalidateTooltipObserver: function () {
        this.send('destroyTooltips');

        if (config.APP.tooltips && this.$() && this.$().find('[title]').tooltip) {
            Ember.run.scheduleOnce('afterRender', this, function () {
                this.$().find('[title]').tooltip({ container: 'body' });
            });
        }
    }.observes('controller.isPositionActive', 'controller.hasAlternativeShapes', 'controller.canMirrorFeatures'),

    invalidatePopover: function () {
        if (!this.get('parentView.fabricMapCanvasView')) {
            //logger.warn('PopoverParentViewWarning', 'Missing parent view on ' + this.toString() + ' ' + (new Date()));
            return this.get('controller').replaceRoute('design.selector');
        }

        this.renderPositionCanvas();

        const hspacing = this.$().find('.rs-popover-content').width(),
            vspacing = 20,
            isGlobalEditVisible = this.get('controller.controllers.design/selector.showGlobalSelectorEdit'),

            cx = parseInt(this.get('$canvas').css('left')),
            cy = parseInt(this.get('$canvas').css('top')),
            cw = this.get('$canvas').width(),
            ch = this.get('$canvas').height(),

            canvasWidth = this.get('parentView.fabricMapCanvasView').$().width(),

            right = canvasWidth - cx - cw,

            leftOfCenter = cx < (canvasWidth / 2),
            px = (!leftOfCenter ? cx - hspacing : cx - 10) + (isGlobalEditVisible ? 270 : 0),
            py = cy - vspacing / 2,
            ph = ch + vspacing;

        if (leftOfCenter) {
            this.$().find('.position-tooltip')
                .css({
                    left: px + 'px',
                    top: py + 'px',
                    height: ph + 'px',
                    width: cw + 'px'
                });
        } else {
            this.$().find('.position-tooltip')
                .css({
                    right: right + 'px',
                    top: py + 'px',
                    height: ph + 'px',
                    width: cw + 'px'
                });
        }

        this.$().find('.position-tooltip-container')
            .removeClass('left-of-center right-of-center')
            .addClass(leftOfCenter ? 'left-of-center' : 'right-of-center');

        var view = this;

        if (!Modernizr.touch) {
            this.$().find('.position-tooltip-backdrop')
                .css('bottom', $(".rs-progressbar").is(':visible') ? $('.rs-progressbar').height() : '0')
                .on('click.destroy mouseover.destroy', function () {
                    if (view.get('controller') &&
                        !window.tourMediator.isShowing('targetcategorywarning') &&
                        !window.tourMediator.isShowing('selectmap')) {
                        view.get('controller').replaceRoute('design.selector');
                    }
                });

            Ember.run.later(this, function () {
                if (view.$()) {
                    view.$().find('.position-tooltip-backdrop').addClass('fade');
                }
            }, 50);
        } else {
            this.$().find('.position-tooltip-backdrop').remove();
        }

        this.$().find('.position-tooltip-container').show();

        if (this.$().find('.position-tooltip').offset().top + this.$().find('.position-tooltip').height() > $(window).height()) {
            var nt = this.get('parentView.fabricMapCanvasView').$().height() - this.$().find(".position-tooltip").height();
            this.$().find('.position-tooltip').css({top: nt + 'px'});
        }

    },

    willDestroyElement: function () {
        if (this.get('parentView.fabricMapCanvasView')) {
            this.set('parentView.fabricMapCanvasView.position', null);
        }

        this.$().find('.position-tooltip-backdrop').off('mouseover.destroy click.destroy');

        if (this.get('$canvas')) {
            this.get('$canvas').off('click.editor');
        }

        if (config.APP.tooltips && this.$() && this.$().tooltip) {
            this.$().find('[title]').tooltip('destroy');
        }

        $('.selectmap-single-position-canvas').remove();
    },

    renderPositionCanvas: function () {
        if (!this.get('parentView.fabricMapCanvasView') || !this.$()) {
            return;
        }

        this.set('$canvas', $(this.get('parentView.fabricMapCanvasView').renderSinglePosition(this.get('controller.model'), 'selectmap-single-position-canvas')));

        this.$().find('canvas').remove();
        this.$().find('.position-tooltip-container').append(this.get('$canvas'));

        Ember.run.later(this, function () {
            this.get('$canvas').on('click.editor', function () {
                if (this.get('controller.isPositionActive')) {
                    this.send('transitionToEditor');
                } else {
                    this.send('addPosition');
                }
            }.bind(this));
        }, 100);
    },

    click: function (e) {
        if ($(e.target).hasClass('position-tooltip')) {
            this.send('transitionToEditor');
        }
    },

    actions: {

        destroyTooltips: function () {
            if (config.APP.tooltips && this.$() && this.$().find('[title]').tooltip) {
                this.$().find('[title]').tooltip('destroy');
            }
        },

        showAlternativeDialog: function () {
            this.send('destroyTooltips');
            this.get('controller').send('showAlternativeShapes');
        },

        transitionToEditor: function () {
            this.send('destroyTooltips');

            if (!this.get('controller.isPositionActive')) {
                return;
            }

            var controller = this.get('controller.controllers.design/selector');
            var position = this.get('controller.model');
            controller.send('disableColourClash');
            this.$().hide();

            controller.set('lastActivePosition', position);
            controller.trigger('zoomInPosition', position);

            Ember.run.later(this, function () {
                controller.transitionToRoute('design.editor', position);
                controller.send('enableColourClash');
            }, 500);
        },

        addPosition: function () {
            var view = this,
                oppositePosition = this.get('controller.oppositePosition'),
                next;

            if (oppositePosition &&
                !oppositePosition.get('covered') &&
                !oppositePosition.get('corrupt') &&
                !oppositePosition.get('hasActiveComponent')) {

                next = function () {
                    view.get('parentView').rerender().then(function () {
                        view.get('controller').replaceRoute('design.selector');
                        Ember.run.later(this, () => view.get('controller').transitionToRoute('design.position.autoadd', oppositePosition.get('id')), 100);
                    });
                };

            } else {

                next = function () {
                    if (view.get('parentView')) {
                        view.get('parentView').rerender().then(function () {
                            view.renderPositionCanvas();
                        });
                    }
                };

            }

            this.get('controller').addPosition().then(next);
        },

        removePosition: function () {
            var view = this;

            this.get('controller').removePosition().then(function () {
                if (view.get('parentView')) {
                    view.get('parentView').rerender().then(function () {
                        view.renderPositionCanvas();
                    });
                }
            });
        },

        mirrorFeatures: function () {
            this.send('destroyTooltips');
            this.get('controller').replaceRoute('design.position.mirror');
        }
    }

});
