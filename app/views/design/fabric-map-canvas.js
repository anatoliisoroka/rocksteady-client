/* global $, Modernizr, Detectizr, logger, Hammer */

import Ember from 'ember';
import config from '../../config/environment';
import RsVirtualContainer from '../../lib/rs-virtual-container';
import RsSelectorCanvas from '../../lib/rs-selector-canvas';

export default Ember.View.extend(Ember.Evented, {
    tagName: 'div',
    classNames: ['map-canvas'],
    canvas: undefined,
    options: {},
    position: null,
    positionFabObjs: {},
    rsSelectorCanvas: null,
    canvasDesignDimensions: {
        minX: undefined,
        minY: undefined,
        maxX: undefined,
        maxY: undefined
    },
    rsCanvasHammerManager: undefined,

    didInsertElement: function () {
        this._super();

        var view = this;

        view.setupResizeHandler();

        this.keys.bind('ctrl s', function () {
            logger.debug('[save] user save by keypress...');
            Ember.run(function () {
                view.get('controller.controllers.design').startSaveTimer({timeout: 1});
            });
        });

        this.get('controller').on('zoomInPosition', this, this.zoomInPosition);
        this.get('controller').on('clearPositionSelection', this, this.clearPositionSelection);

        var applicationController = this.get('controller.controllers.application');

        applicationController.send('pushSpinner');

        this.set('parentView.fabricMapCanvasView', this);

        Ember.run.later(this, () => {
            this.renderCanvas().then(() => {
                applicationController.send('popSpinner');

                if (this.get('controller.controllers.application.bootstrapBreakpoint') === 'xs') {
                    this.get('controller.controllers.application').set('loadingDesignXS', false);
                }

                if (view.get('controller.lastActivePosition')) {
                    view.zoomOutPosition(view.get('controller.lastActivePosition'));
                }
            });
        }, 100);
    },

    willDestroyElement () {
        this.destroyZoomByPinch();
        this.tearDownFabricEventHandlers();
        $(window).off('debouncedresize.map');

        this.keys.unbind('ctrl s');

        if (this.get('canvasEl')) {
            this.get('canvasEl').parent().remove();
        }
    },

    destroyZoomByPinch () {
        if (typeof this.rsCanvasHammerManager !== 'undefined' && this.rsCanvasHammerManager.destroy) {
            this.rsCanvasHammerManager.destroy();
        }

        //if safari, destroy the event listener
        if (!/chrome/.test(navigator.userAgent.toLowerCase())) {
            $(document).off('scroll');
        }
    },

    //just applied for mobiles
    applyZoomByPinch () {
        var $canvasContainer = $('.canvas-container');
        $canvasContainer.css('zoom', 1 / 4);
        if (!this.$()) {
            return;
        }
        var canvasContainer = $canvasContainer[0];
        var $mapCanvas = this.$();
        var mapCanvas = $mapCanvas[0];
        this.rsCanvasHammerManager = new Hammer(mapCanvas);
        if (config.APP.testing) {
            window._rsCanvasHammerManager = this.rsCanvasHammerManager;
        }
        var pinch = new Hammer.Pinch();
        this.rsCanvasHammerManager.add([pinch]);
        var scale = 1,
            posX = 0,
            posY = 0,
            lastPosX = 0,
            lastPosY = 0,
            maxPosX = 0,
            maxPosY = 0,
            lastScale = 1,
            transform = "";
        this.rsCanvasHammerManager.on("doubletap pan pinch panend pinchend", (ev) => {
            if (ev.type === "doubletap") {
                if (scale === 1) {
                    scale = 3;
                    lastScale = 3;
                } else {
                    scale = 1;
                    lastScale = 1;
                }

                posX = 0;
                posY = 0;
                lastPosX = 0;
                lastPosY = 0;
            }

            //pan
            if (ev.type === "pan" && scale !== 1) {
                posX = lastPosX + (ev.deltaX * 6);
                posY = lastPosY + (ev.deltaY * 6);

                maxPosX = Math.ceil((scale * 0.5) * this.canvasDesignDimensions.maxX);
                maxPosY = Math.ceil((scale * 0.5) * this.canvasDesignDimensions.maxY);

                if (posX > maxPosX) {
                    posX = maxPosX;
                }
                if (posX < -maxPosX) {
                    posX = -maxPosX;
                }
                if (posY > maxPosY) {
                    posY = maxPosY;
                }
                if (posY < -maxPosY) {
                    posY = -maxPosY;
                }
            }
            if (ev.type === "panend") {
                lastPosX = posX < maxPosX ? posX : maxPosX;
                lastPosY = posY < maxPosY ? posY : maxPosY;
            }

            //pinch
            if (ev.type === "pinch") {
                scale = Math.max(1, Math.min(lastScale * (ev.scale), 4));
                if (scale === 1) {
                    posX = 0;
                    posY = 0;
                    lastPosX = 0;
                    lastPosY = 0;
                }
            }
            if (ev.type === "pinchend") {
                lastScale = scale;
            }

            transform =
                "translate3d(" + posX + "px," + posY + "px, 0) " +
                "scale3d(" + scale + ", " + scale + ", 1)";

            canvasContainer.style.mozTransform = transform;
            canvasContainer.style.webkitTransform = transform;
            canvasContainer.style.msTransform = transform;

        });
    },

    applyZoomByPinchSafari () {
        var $canvasContainer = $('.canvas-container');
        var canvasContainer = $canvasContainer[0];

        if (typeof canvasContainer === 'undefined' || typeof this.$() === 'undefined') {
            return;
        }

        var $mapCanvas = this.$();
        var mapCanvas = $mapCanvas[0];
        this.rsCanvasHammerManager = new Hammer(mapCanvas);
        if (config.APP.testing) {
            window._rsCanvasHammerManager = this.rsCanvasHammerManager;
        }
        var pinch = new Hammer.Pinch();
        this.rsCanvasHammerManager.add([pinch]);

        var scales = [
                {zoom: 1 / 4, pos: -150},
                {zoom: 1 / 2, pos: -75},
                {zoom: 0.75, pos: -50},
                {zoom: 1, pos: -37.5}
            ],
            currentScale = 0,
            posX = 0,
            posY = 0,
            lastPosX = 0,
            lastPosY = 0,
            maxPosX = 0,
            maxPosY = 0,
            transform = "",
            currentPinch = 0;
        this.rsCanvasHammerManager.on("doubletap pan pinchin pinchout panend pinchend", (ev) => {
            if (ev.type === "doubletap") {
                if (currentScale === 0) {
                    currentScale = 1;
                    currentPinch = 10;
                } else if (currentScale === 1) {
                    currentScale = 2;
                    currentPinch = 20;
                } else if (currentScale === 2) {
                    currentScale = 3;
                    currentPinch = 30;
                } else if (currentScale === 3) {
                    currentScale = 0;
                    currentPinch = 0;
                }

                posX = 0;
                posY = 0;
                lastPosX = 0;
                lastPosY = 0;
            }

            //pan
            if (ev.type === "pan" && currentScale !== 0) {
                posX = lastPosX + (ev.deltaX * (3 / currentScale));
                posY = lastPosY + (ev.deltaY * (3 / currentScale));

                maxPosX = Math.ceil((scales[currentScale].zoom * 0.5) * this.canvasDesignDimensions.maxX);
                maxPosY = Math.ceil((scales[currentScale].zoom * 0.5) * this.canvasDesignDimensions.maxY);

                if (posX > maxPosX) {
                    posX = maxPosX;
                }
                if (posX < -maxPosX) {
                    posX = -maxPosX;
                }
                if (posY > maxPosY) {
                    posY = maxPosY;
                }
                if (posY < -maxPosY) {
                    posY = -maxPosY;
                }
            }
            if (ev.type === "panend") {
                lastPosX = posX < maxPosX ? posX : maxPosX;
                lastPosY = posY < maxPosY ? posY : maxPosY;
            }

            //pinch
            if (ev.type === "pinchout") {
                currentPinch++;
                currentScale = Math.round(currentPinch / 10);
            }
            if (ev.type === "pinchin") {
                currentPinch--;
                currentScale = Math.round(currentPinch / 10);
            }

            if (currentPinch > 30) {
                currentPinch = 30;
            } else if (currentPinch < 0) {
                currentPinch = 0;
                posX = 0;
                posY = 0;
            }

            if (currentScale > 3 || currentScale < 0) {
                currentScale = 0;
            }

            transform = "scale(" + scales[currentScale].zoom + " , " + scales[currentScale].zoom + ")" +
                " translate(" + scales[currentScale].pos + "%," + scales[currentScale].pos + "%)" +
                " translate3d(" + posX + "px," + posY + "px, 0)";

            canvasContainer.style.transform = transform;
            canvasContainer.style.mozTransform = transform;
            canvasContainer.style.webkitTransform = transform;
            canvasContainer.style.msTransform = transform;
        });

        transform = "scale(" + scales[0].zoom + " , " + scales[0].zoom + ") translate(" + scales[0].pos + "%," + scales[0].pos + "%)";

        canvasContainer.style.transform = transform;
        canvasContainer.style.mozTransform = transform;
        canvasContainer.style.webkitTransform = transform;
        canvasContainer.style.msTransform = transform;
    },

    teardownResizeHandler: function () {
        $(window).off('debouncedresize.map');
    },

    setupResizeHandler: function () {
        var view = this;

        $(window).on('debouncedresize.map', function () {

            window.tourMediator.trigger('close');
            $('.selectmap-single-position-canvas').remove();

            if (view.get('controller.controllers.application.currentRouteName') === 'design.position.index') {
                view.get('controller').replaceRoute('design.selector');
            }

            Ember.run.scheduleOnce('afterRender', view, 'renderCanvas');
        });
    },

    prepareUIForPositionTransition: function () {
        $('.dropdown').removeClass('open');
    },

    transitionToPosition: function (positionId) {
        if (this.get('controller.controllers.application.bootstrapBreakpoint') === 'xs') {
            return;
        }

        this.prepareUIForPositionTransition();

        if (window.tourMediator.isShowing('selectmap')) {
            return;
        }

        this.get('controller').replaceRoute('design.position', positionId);
    },

    onPositionOver: function (fabObj) {
        this.transitionToPosition(fabObj.emberModelID);
    },

    onPositionOut: function () {
        if (!this.get('isDestroyed') && this.get('controller')) {
            this.set('position', null);
            this.get('controller').replaceRoute('design.selector');
        }
    },

    renderCanvas: function (delay = 0) {

        if (!this.$()) {
            return new Ember.RSVP.Promise(function (r) {
                r();
            });
        }

        //May not be necessary any longer - try to reproduce
        if (Detectizr.device.model === 'iphone') {
            this.get('controller').hideDisplayMapContainer();
        }

        // var applicationController = this.get('controller.controllers.application');
        var canvasEl = document.createElement('canvas');
        var design = this.get('controller.model');
        var view = this;

        view.$().removeClass('rendered');
        view.$().addClass('rendering-loader');
        view.$().parent().parent().find('.selector-img-container').addClass('loading');

        return new Ember.RSVP.Promise((resolve, reject) => {
            Ember.run.later(() => {
                view.teardownResizeHandler();

                if (view.get('canvas')) {

                    view.tearDownFabricEventHandlers();
                    view.get('canvas').dispose();
                    view.$().find('.canvas-container').remove();
                }

                view.$().append(canvasEl);

                let isXs = view.get('controller.controllers.application.bootstrapBreakpoint') === 'xs';

                const headerHeight = $('.navbar-header').height();
                const $progressBar = $('.rs-progressbar');
                const footerHeight = $progressBar.is(':visible') ? $progressBar.height() : 0;
                const globalSelectorEditWidth = (view.get('controller.showGlobalSelectorEdit') && !isXs) ? 300 : 0;

                const options = {
                    width: $('.display-map-container').width() - globalSelectorEditWidth,
                    height: window.innerHeight - headerHeight - footerHeight,
                    addToKitText: view.get('controller').get('i18n').t('selector.add_to_kit').toString()
                };

                //we want to make it bigger and apply zoom out
                if (isXs) {
                    options.width = options.width * 4;
                    options.height = options.height * 4;
                }

                if (!Modernizr.touch) {
                    options.onPositionOver = view.onPositionOver.bind(view);
                    options.onPositionOut = view.onPositionOut.bind(view);
                }

                view.rsSelectorCanvas = new RsSelectorCanvas(canvasEl, options, design);

                view.set('canvas', view.rsSelectorCanvas.canvas);
                view.setupFabricEventHandlers();

                view.set('positionFabObjs', view.rsSelectorCanvas.positionFabObjs);
                view.set('container', view.rsSelectorCanvas.container);

                view.get('controller').set('view', view);

                view.rsSelectorCanvas.render().then(function () {

                    if (view && view.$ && view.$()) {
                        view.flipOffCanvasImage();
                        view.setupResizeHandler();
                        view.trigger('rendered');
                    }

                    if (view && config.APP.testing) {
                        (view.setupTestHooks.bind(view))();
                    }


                    //get dimensions of actual design
                    let canvasDesignDimensions = {};

                    view.get('canvas').forEachObject(function (obj) {
                        const bound = obj.getBoundingRect();
                        const maxBoundX = bound.left + bound.width;
                        const maxBoundY = bound.top + bound.height;

                        if (bound.top < canvasDesignDimensions.minY || canvasDesignDimensions.minY === undefined) {
                            canvasDesignDimensions.minY = bound.top;
                        }
                        if (maxBoundY > canvasDesignDimensions.maxY || canvasDesignDimensions.maxY === undefined) {
                            canvasDesignDimensions.maxY = maxBoundY;
                        }
                        if (bound.left < canvasDesignDimensions.minX || canvasDesignDimensions.minX === undefined) {
                            canvasDesignDimensions.minX = bound.left;
                        }
                        if (maxBoundX > canvasDesignDimensions.maxX || canvasDesignDimensions.maxX === undefined) {
                            canvasDesignDimensions.maxX = maxBoundX;
                        }
                    });

                    view.canvasDesignDimensions = Object.assign({}, canvasDesignDimensions);

                    const clip = {
                        left: canvasDesignDimensions.minX,
                        top: canvasDesignDimensions.minY,
                        width: canvasDesignDimensions.maxX - canvasDesignDimensions.minX,
                        height: canvasDesignDimensions.maxY - canvasDesignDimensions.minY
                    };


                    Ember.run.later(() => {
                        if (!view.get('isDestroyed')) {
                            view.updateCanvasUrl(view.get('canvas').toDataURL(clip));
                            view.$().removeClass('rendering-loader');
                            view.$().parent().parent().find('.selector-img-container').removeClass('loading');
                            view.$().addClass('rendered');
                        }
                    }, 100);

                    Ember.run.later(view, resolve, 100);
                    Ember.run.later(view, () => {
                        if (isXs && Modernizr.csstransforms) {
                            view.destroyZoomByPinch();

                            if (/chrome/.test(navigator.userAgent.toLowerCase())) {
                                view.applyZoomByPinch();
                            } else {
                                view.applyZoomByPinchSafari();
                                //block scroll
                                $(document).scroll(function () {
                                    $(document).scrollTop(0);
                                });
                                //apply scroll to the top
                                $(document).scrollTop(0);
                            }
                        }
                    }, 100);

                    if (Detectizr.device.model === 'iphone') {
                        view.get('controller').showDisplayMapContainer();
                    }
                }, reject);
            }, delay);
        });
    },

    canvasUrl: '',

    updateCanvasUrl: function (canvasUrl) {
        this.set('canvasUrl', canvasUrl);
    },

    setupTestHooks: function () {
        window._rsDisplayMapCanvas = this.get('canvas');
        window._rsPositions = {};

        if (this.get('controller.model.positions')) {
            for (var id in this.get('positionFabObjs')) {
                var position = this.get('controller.model.positions').findBy('id', id);
                var fabObj = this.get('positionFabObjs')[id];
                window._rsPositions[position.get('name')] = [fabObj.left, fabObj.top];
            }
        }
    },

    renderSinglePosition: function (position, className) {
        var canvasEl = document.createElement('canvas'),
            ctx = canvasEl.getContext('2d');

        if (!this.rsSelectorCanvas || !this.rsSelectorCanvas.canvas) {
            logger.warn('RenderSinglePositionWarning', 'Selector canvas went away');
            return canvasEl;
        }

        if (!position || !position.get('id')) {
            return canvasEl;
        }

        var posFabObj = this.rsSelectorCanvas.placedPositionFabObjs[position.get('id')];

        if (!posFabObj) {
            logger.warn('RenderSinglePositionWarning', 'There is no placed position fabric obj for position: ' + position.get('id'));
            return canvasEl;
        }

        var bbox = posFabObj.getBoundingRect(),
            sx = Math.floor(bbox.left),
            sy = Math.floor(bbox.top),
            sWidth = Math.floor(bbox.width),
            sHeight = Math.floor(bbox.height);

        canvasEl.width = bbox.width;
        canvasEl.height = bbox.height;

        $(canvasEl)
            .css(bbox)
            .addClass(className);

        var imgData = this.rsSelectorCanvas.canvas.getContext('2d').getImageData(sx, sy, sWidth, sHeight);
        ctx.putImageData(imgData, 0, 0);

        return canvasEl;
    },

    onMouseDown: function (event) {

        var position;
        var target = event.target;

        if (!target && event.e && event.e.touches && event.e.touches[0]) {
            target = this.get('canvas').findTarget(event.e.touches[0]);
        }

        if (event.e) {
            event.e.preventDefault();
        }

        if (target) {
            position = this.modelFromFabObj(target);
        }

        if (position && !position.get('isEditable')) {

            // has clicked on a non-editable position (i.e. the position is covered)

            this.set('position', null);

        } else if (!position) {

            // has clicked outside a position

            this.set('position', null);

            this.get('controller').replaceRoute('design.selector');

        } else if (position) {

            // has clicked on a position

            this.set('position', position);

            this.get('controller').replaceRoute('design.selector');

            Ember.run.later(this, function () {
                if (this && !this.get('isDestroyed')) {
                    this.transitionToPosition(position.get('id'));
                }
            }, 100);
        }
    },

    setupFabricEventHandlers: function () {
        if (this.canvas) {
            this._onMouseDown = this.onMouseDown.bind(this);
            this.canvas.on('mouse:down', this._onMouseDown);
        }
    },

    tearDownFabricEventHandlers: function () {
        if (this.canvas) {
            this.canvas.off('mouse:down', this._onMouseDown);
        }
    },

    // Pass a fabObj in, get its associated model
    modelFromFabObj: function (fabObj) {
        var objectID = fabObj.emberModelID;
        var objectType = fabObj.emberModelType;
        var objsModel = this.get('controller.model').get(objectType + 's').filter(function (item) {
            return item.id === objectID;
        });
        return objsModel[0];
    },

    clearPositionSelection: function () {
        if (!this.get('isDestroyed')) {
            this.set('position', null);
        }
    },

    flipOnCanvasImage: function (css) {
        if (this.get('parentView')) {
            var imageData = this.get('canvas').toDataURL(),
                $image = this.get('parentView').$('.canvas-replacement-image');

            if ($image) {
                if (css) {
                    $image.css(css);
                }

                $image
                    .attr('src', imageData)
                    .css('left', 0)
                    .css('top', 0)
                    .css('position', 'absolute')
                    .show();

                this.get('parentView').$('.map-canvas').hide();
            }

            return $image;
        }
    },

    flipOffCanvasImage: function () {
        if (this.get('parentView') && this.get('parentView').$()) {
            this.get('parentView').$().find('.canvas-replacement-image').hide();
            this.get('parentView').$().find('.map-canvas').show();
        }
    },

    zoomOutPosition: function (position) {

        var view = this;

        if (!Modernizr.cssanimations) {
            return;
        }

        if (this.get('controller.model.positions.length') === 1) {
            return;
        }

        // calculate transform necessary for zoomed in position
        var transform = view.getPositionTransform(position);

        // flip on canvas image with transform applied
        var $image = view.flipOnCanvasImage({'transform': transform});

        if (!$image) {
            return;
        }

        Ember.run.later(view, function () {
            // set image transform to be 'normal'
            $image.css('transform', 'translateX(0px) scale3d(1,1,1) rotate(0deg) translateX(0px) translateY(0px)');

            Ember.run.later(view, function () {
                view.flipOffCanvasImage();
            }, 500);
        }, 100);

    },

    zoomInPosition: function (position) {

        if (!Modernizr.cssanimations) {
            return;
        }

        if (this.get('controller.model.positions.length') === 1) {
            return;
        }

        var $image = this.flipOnCanvasImage();

        if (!$image) {
            return;
        }

        $image.css('transform', this.getPositionTransform(position));
    },

    getPositionTransform: function (position) {
        var fabObj = this.positionFabObjs[position.get('id')];

        if (!fabObj) {
            return '';
        }

        var container = new RsVirtualContainer(
            $, undefined, this.get('canvas'),
            {
                'width': position.get('activeComponent.width'),
                'height': position.get('activeComponent.height')
            },
            {
                'percent': 5,
                'right': 274
            }
        );

        var scale = Detectizr.device.model !== 'ipad' ? (container.currentContainerScale / this.get('container').currentContainerScale) : 1;
        var translateX = Math.floor(($('.map-canvas').width() / 2) - fabObj.get('left'));
        var translateY = Math.floor(($('.map-canvas').height() / 2) - fabObj.get('top'));
        var rotate = Math.floor(0 - fabObj.get('angle'));

        if (rotate < -180) {
            rotate = 360 + rotate;
        }

        return 'translateX(-137px) scale3d(' + scale + ',' + scale + ',1) /*scale3d(1,1,1)*/ rotate(' + rotate + 'deg) translateX(' + translateX + 'px) translateY(' + translateY + 'px)';
    }
});
