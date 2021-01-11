/* global $, logger, Modernizr, _ */

import Ember from 'ember';
import config from '../../../config/environment';
import RsEditorCanvas from '../../../lib/rs-editor-canvas';

export default Ember.View.extend({

    HEADER_HEIGHT: 64,

    canvas: undefined,
    options: {},
    classNames: ['editor-canvas-container'],
    classNameBindings: ['controller.isCanvasRendered:rendered'],

    onToRerender: function () {
        this.rerender();
    }.observes('controller.controllers.application.useEditorGrid', 'controller.zoom'),

    setScrollbarsPosition: function () {
        var $canvas = this.$().find('canvas');
        var $canvasContainer = $('.editor-canvas-container');

        var applyScroll = function () {
            var offsetTop = ($canvas.height() / 2) - ($canvasContainer.height() / 2);
            var offsetLeft = ($canvas.width() / 2) - ($canvasContainer.width() / 2);

            if (offsetTop > 0 && offsetLeft > 0) {
                $canvasContainer.scrollTop(offsetTop);
                $canvasContainer.scrollLeft(offsetLeft);
                return true;
            }
        };

        //workaround, it can take a bit of time until
        var applyScrollInterval = setInterval(() => {
            if (applyScroll()) {
                clearInterval(applyScrollInterval);
            }
        }, 50);

        setTimeout(() => {
            clearInterval(applyScrollInterval);
        }, 700);
    }.observes('controller.model.features'),

    didInsertElement: function () {
        this._super();

        this.get('controller.controllers.application').send('pushSpinner');

        var canvasEl = $('<canvas></canvas>'),
            newCanvas = this.$().append(canvasEl),
            view = this,
            el = this.$();
        var controllerZoom = this.get('controller.zoom');

        //ipad ios7 bug fix, keep component in viewport
        window.scrollTo(0, 0);

        this.set('newCanvas', newCanvas);
        this.set('canvasEl', canvasEl);
        this.set('propertyPanelWidth', this.get('parentView').$().find('.property-panel').width() + 5);

        var canvasAreaWidth;
        if (Modernizr.touch) {
            canvasAreaWidth = $(window).width() - $('.panels-container .feature-panel').width();
        } else {
            canvasAreaWidth = $(window).width() - $('.panels-container').width();
        }

        this.set('options', {
            width: canvasAreaWidth * (controllerZoom / 100),
            height: (window.innerHeight - this.HEADER_HEIGHT) * (controllerZoom / 100),
            canvasType: 'non-static',
            canvasPadding: 5,
            canvasPaddingRight: 0,
            virtualContainerOn: true,
            maskOn: true,
            dropShadow: true,
            showQRONs: false,
            drawGrid: this.get('controller.controllers.application.config.APP.features.editor_grid') && this.get('controller.controllers.application.useEditorGrid'),
            gridSpacing: this.get('controller.controllers.application.useEditorGrid') ? config.APP.grid_spacing : 1,
            onRender: view.onCanvasRender.bind(view)
        });

        this.createCanvas();

        $(window).off('throttledresize.editor');
        $(window).on('throttledresize.editor', function () {
            Ember.run(view, function () {
                if (el.find('.canvas-container')) {
                    el.find('.canvas-container').remove();

                    if (view && !view.get('isDestroyed') && !view.get('isDestroying')) {
                        view.rerender();
                    }
                }
                this.setScrollbarsPosition();
            });
        });

        if (config.APP.debugging || config.APP.testing) {
            this.keys.bind('ctrl p', function (e) {
                if (e.which === 80 && e.ctrlKey) {
                    logger.warn('DebugPrintWarning', 'User invoked debug print');

                    Ember.run(function () {
                        view.get('controller').indexUsedColours();

                        view.get('controller').createPrintShape(view.get('controller.model')).then(function (printShape) {
                            var svg = printShape.get('svg');
                            var popup = window.open('about:blank');

                            if (popup) {
                                popup.document.write('<img src="');
                                popup.document.write('data:image/svg+xml;base64,' + window.btoa(svg));
                                popup.document.write('"/>');
                            }
                        });
                    });
                }
            });
        }

        Ember.run.scheduleOnce('afterRender', this, function () {
            this.setScrollbarsPosition();
        });
    },

    onCanvasRender: function () {
        if (this && this.get('controller')) {
            this.set('controller.isCanvasRendered', true);
        } else {
            //logger.warn('ViewWentAwayWarning', 'Tried to set isCanvasRendered, but view went away');
            return;
        }

        if (config.APP.testing) {
            this.setupTestHooks();
        }

        this.get('controller.controllers.application').send('popSpinner');
    },

    setupTestHooks () {
        // In testing mode set the canvas on the window object so we can interact
        // with fabric directly, we do this because there is no way to simulate a
        // click in JavaScript directly in the browser (for security reasons) so
        // we need to be able to 'fire' events from fabric.

        window._rsEditorCanvas = this.get('canvas');
        window._rsFeatures = {};

        const rsEditorCanvas = this.get('controller.rsEditorCanvas');

        if (!rsEditorCanvas || !rsEditorCanvas.featureFabObjs) {
            return;
        }

        const features = this.get('controller.model.features');

        _(rsEditorCanvas.featureFabObjs)
            .map(({ top, left }, id) => (
                { top, left, feature: features.findBy('id', id) }
            ))
            .filter(({ feature }) => feature)
            .forEach(({ top, left, feature }) =>
                window._rsFeatures[feature.get('name')] = [left, top]
            );
    },

    createCanvas: function () {
        const controller = this.get('controller');
        if (!controller.get('model.activeComponent')) {
            controller.get('controllers.application').send('popSpinner');
            controller.transitionToRoute('design.selector');
            logger.warn('NoActiveComponentWarning', 'Can\'t render an editor canvas with no active component');
            return;
        }

        const canvas = new RsEditorCanvas(
            this.get('canvasEl')[0],
            this.get('options'),
            controller
        );
        controller.set('rsEditorCanvas', canvas);
        controller.set('fabricEditorCanvasView', this);
        controller.set('isCanvasRendered', false);
        this.set('canvas', canvas.canvas);
    },

    willDestroyElement: function () {
        $(window).off('throttledresize.editor');

        if (config.APP.debugging || config.APP.testing) {
            this.keys.unbind('ctrl p');
        }

        this.get('canvasEl').parent().remove();
        this.get('controller').set('rsEditorCanvas', null);
    }

});
