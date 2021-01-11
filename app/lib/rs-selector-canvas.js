/* global fabric, queue, $, logger, Modernizr */

import Ember from 'ember';
import RsEditorCanvas from './rs-editor-canvas';
import RsVirtualContainer from './rs-virtual-container';
import config from '../config/environment';

var RsSelectorCanvas = function (canvasEl, options, design) {

    this.canvas = new fabric.Canvas(canvasEl);
    window.selectorCanvas = this.canvas;   // for automated test

    this.canvas.setDimensions({
        width: options.width,
        height: options.height
    });

    this.canvas.selection = false;
    this.canvas.renderOnAddRemove = false;

    this.design = design;
    this.options = options;
    this.positionFabObjs = {};
    this.placedPositionFabObjs = {};

    if (!design) {
        return logger.error('NullDesignError', 'Can\'t render the selector map because the design is null');
    }

    this.container = new RsVirtualContainer(
        $, fabric, this.canvas, {
            'width' : design.get('width'),
            'height' : design.get('height')
        }, {
            'percent': 5,
            'right': 0
        }
    );
};

RsSelectorCanvas.prototype = {

    render: function () {

        var q = queue();
        var c = this;

        c.design.get('positions').forEach(function (position) {

            var renderPosition = function (done) {
                c.renderPosition(position).then(function (fabricObject) {
                    if (fabricObject) {
                        c.placeRenderedPosition(position, fabricObject, done);
                    } else {
                        done();
                    }
                });
            };

            q.defer(renderPosition);
        });

        var doneRendering = function (error/*, results*/) {
            if (error) {
                logger.error('SelectorRenderingError', error);
            } else {
                c.canvas.renderAll();
            }
        };

        var setupHover = function () {
            c.canvas.on('mouse:over', function (e) {
                if (e && e.target) {
                    if (typeof e.target._rsMouseOver === 'function') {
                        e.target._rsMouseOver(e);
                        c.canvas.renderAll();
                    }

                    /*
                     *if (typeof c.options.onPositionOver === 'function') {
                     *    c.options.onPositionOver(e.target);
                     *}
                     */
                }
            });

            c.canvas.on('mouse:move', function (e) {
                if (e && e.target) {
                    if (typeof c.options.onPositionOver === 'function') {
                        c.options.onPositionOver(e.target);
                    }
                }
            });

            c.canvas.on('mouse:out', function (e) {
                if (e && e.target) {
                    if (typeof e.target._rsMouseOut === 'function') {
                        e.target._rsMouseOut(e);
                        c.canvas.renderAll();
                    }

                    if (typeof c.options.onPositionOut === 'function') {
                        c.options.onPositionOut(e.target);
                    }
                }
            });
        };

        return new Ember.RSVP.Promise(function (resolve) {
            q.awaitAll(function () {
                doneRendering();
                setupHover();

                resolve();
            });
        });
    },

    placeRenderedPosition: function (position, fabricObject, done) {

        var f = fabricObject;

        f.set('left', position.get('x'));
        f.set('top', position.get('y'));
        f.set('angle', position.get('rotation'));

        f.set('lockScalingX', true)
            .set('lockScalingY', true)
            .set('lockMovementX', true)
            .set('lockMovementY', true)
            .set('hasControls', false)
            .set('padding', 5)
            .set('hasBorders', false)
            .set('hoverCursor', 'pointer')
            .set('perPixelTargetFind', 'true');

        if (this.design.get('positions.length') === 1) {
            f.set('scaleX', 0.3);
            f.set('scaleY', 0.3);
        }

        if (f.noOffsetScale) {
            f.set('left', this.container.offsetLeft(f));
            f.set('top', this.container.offsetTop(f));
        } else {
            this.container.offsetObject(f);
        }

        this.canvas.add(f);

        this.placedPositionFabObjs[position.get('id')] = f;

        if (done) {
            done();
        }
    },

    renderPosition (position) {
        return new Ember.RSVP.Promise((resolve) => {
            if (position.get('isIncluded') && position.get('activeShape')) {
                this.renderComponentShape(position, position.get('activeComponent'))
                    .then((f) => {
                        if (config.APP.shadows && f) {
                            let blurredShadowRetina11_3 = {
                                color: 'rgba(0,0,0,0.3)',
                                blur: 7,
                                offsetX: 0,
                                offsetY: 0,
                                affectStroke: false,
                                includeDefaultValues: false,
                            };

                            let blurredShadow = {
                                color: 'rgba(0,0,0,0.4)',
                                blur: 100,
                                offsetX: 0,
                                offsetY: 0,
                                affectStroke: false,
                                includeDefaultValues: true
                            };

                            let basicShadow = {
                                color: 'rgba(0,0,0,0.2)',
                                blur: 0,
                                offsetX: 12,
                                offsetY: 12,
                                affectStroke: false,
                                includeDefaultValues: true,
                            };

                            // Fabric/Canvas has issues rendering shadows on IOS 11.3 on a Retina Display
                            // This may be fixed in subsequent versions of Safari
                            if (Modernizr.ios11_3 && Modernizr.highresolution && Modernizr.canvasblending) {
                                f.setShadow(blurredShadowRetina11_3);
                            } else if (Modernizr.canvasblending) {
                                f.setShadow(blurredShadow);
                            } else {
                                f.setShadow(basicShadow);
                            }

                            this.placeRenderedPosition(position, f);
                        }
                        this.renderActivePosition(position).then(resolve);
                    });
            } else if (position.get('defaultComponent') && !position.get('covered') && !this.options.hideInactiveComponents) {
                this.renderInactiveComponentShape(position, position.get('defaultComponent'))
                    .then(resolve);
            } else {
                resolve();
            }
        });
    },

    renderComponentShape: function (position, component) {
        return new Ember.RSVP.Promise(function (resolve) {

            var componentPathData = component.get('componentShape');

            if (!componentPathData) {
                resolve();
            }

            fabric.loadSVGFromString(componentPathData, function (pathData, options) {
                var f = fabric.util.groupSVGElements(pathData, options);

                f.emberModelID = position.get('id');
                f.decal_name = position.get('name');    // for automated test
                f.emberModelType = 'position';
                f.set('fill', '#ccc');
                resolve(f);
            });
        });
    },

    findFontSize (fontSize, fontText, { bWidth, bHeight }, defaultFontOptions) {
        const { width, height } = new fabric.Text(fontText, Object.assign({}, defaultFontOptions, { fontSize }));
        if (bWidth > width && bHeight > height) {
            return fontSize;
        }
        const increment = 5;
        const {
            height: appliedHeight,
            width: appliedWidth
        } = new fabric.Text(
            fontText,
            Object.assign({}, defaultFontOptions, { fontSize: (fontSize - increment) })
        );
        const difference = (height > width) ? height - appliedHeight : width - appliedWidth;
        const targetDifference = (height > width) ? height - bHeight : width - bWidth;
        const targetIncrement = Math.ceil(targetDifference / difference) * increment;

        return fontSize - targetIncrement;
    },

    renderInactiveComponentShape: function (position, component) {
        var c = this;

        return new Ember.RSVP.Promise(function (resolve) {

            var componentPathData = component.get('componentShape');

            if (!componentPathData) {
                resolve();
            }

            fabric.loadSVGFromString(componentPathData, function (pathData, options) {
                const f = fabric.util.groupSVGElements(pathData, options),
                    g = [f];

                f.getObjects().forEach(function (o) {
                    o.set('stroke', '#ccc');
                    o.set('strokeWidth', 5);
                    o.set('strokeDashArray', [40, 20]);
                });
                const addToKitText = c.options.addToKitText;
                if (addToKitText) {
                    const defaultTextOptions = {
                        fill: '#ccc',
                        left: 0,
                        top: 0,
                        angle: 0 - position.get('rotation'),
                        fontFamily: 'Interface',
                        opacity: 1,
                        fontWeight: 500,
                        textAlign: 'center',
                        lineHeight: 1.1
                    };
                    const currentContainerScale = c.container.currentContainerScale;
                    const fontSize = c.findFontSize(
                        150,
                        addToKitText,
                        {
                            bWidth: f.width / currentContainerScale,
                            bHeight: f.height / currentContainerScale
                        },
                        defaultTextOptions
                    );
                    g.push(new fabric.Text(addToKitText, Object.assign({}, defaultTextOptions, { fontSize })));
                }

                var group = new fabric.Group(g);

                group.emberModelID = position.get('id');
                group.emberModelType = 'position';

                f.set('fill', '#fff');

                resolve(group);
            });
        });
    },

    renderActivePosition: function (position) {

        var shape = position.get('activeShape'),
            el = document.createElement('canvas'),
            c = this;

        if (!shape) {
            logger.warn('PositionActiveShapeWarning', 'Tried to render a position with no active shape');

            return new Ember.RSVP.Promise(function (resolve) {
                resolve();
            });
        }

        return new Ember.RSVP.Promise(function (resolve) {

            new RsEditorCanvas(
                el,
                {
                    width: shape.get('width') * c.container.currentContainerScale,
                    height: shape.get('height') * c.container.currentContainerScale,
                    canvasType: 'static',
                    canvasPadding: 0,
                    virtualContainerOn: true,
                    maskOn: true,
                    dropShadow: false,
                    skipDeletedFeatures: true,
                    showQRONs: false,
                    noScale: false,
                    redrawInterval: 1,
                    onRender: function (rsCanvas) {

                        var d;

                        try {
                            d = rsCanvas.canvas.toDataURL();

                            if (d.length < 10) {
                                throw 'Malformed data url';
                            }
                        } catch (e) {
                            logger.warn('CorruptPositionWarning', 'Omitting corrupt position ' + position.toString() + ': ' + e);
                            position.set('corrupt', true);
                            resolve();
                        }

                        fabric.util.loadImage(d, function (img) {
                            var f = new fabric.Image(img);

                            f.emberModelID = position.get('id');
                            f.emberModelType = 'position';
                            f.noOffsetScale = true;

                            c.positionFabObjs[f.emberModelID] = f;

                            resolve(f);
                        });
                    }
                },
                position);
        });
    }
};

export default RsSelectorCanvas;

