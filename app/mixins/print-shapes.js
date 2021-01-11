/* global logger */

import Ember from 'ember';
import {QRCode, QRErrorCorrectLevel} from '../lib/rs-qronsvg';
import RsEditorCanvas from '../lib/rs-editor-canvas';
import PositionController from '../controllers/design/position';
import EditorController from '../controllers/design/editor';
import config from '../config/environment';
import {hexToRgb, rgbToHex} from '../utils/rgb-util';

var TEST_QRON_DATA = 'decal|test position name with 44 characters 123456|123456789012345678901234';

export default Ember.Mixin.create({

    _clearQRONFeatures: function () {
        this.get('model.design').get('activePositions').forEach(function generateQRON(position) {
            var shape = position.get('activeComponent.activeShape');
            shape.set('qronFeature', null);
        });

        this.store.unloadAll('qronFeature');
    },

    _getQRONData: function (model, position) {
        if (config.APP.testing) {
            return TEST_QRON_DATA;
        } else {
            return 'decal|' + position.get('name').substring(0, 44) + '|' + model.get('id');
        }
    },

    _createQRONFeature: function (position, shape/*, qronWorker*/) {
        if (!config.APP.qrons) {
            return new Ember.RSVP.Promise(function (resolve) {
                resolve();
            });
        }

        var mixin = this;

        return new Ember.RSVP.Promise(function (resolve/*, reject*/) {

            if (!shape.get('qron') || shape.get('qron').centre_x <= 0) {
                logger.warn('QRONDataMissingWarning', 'Shape ' + shape.get('id') + ' is missing QRON placement information');
                resolve(null);
            }

            var qronFeature = mixin.store.createRecord('qronFeature');

            qronFeature.set('left', shape.get('qron').centre_x - (shape.get('printOffset') ? shape.get('printOffset.x') : 0));
            qronFeature.set('top', shape.get('qron').centre_y - (shape.get('printOffset') ? shape.get('printOffset.y') : 0));
            qronFeature.set('angle', shape.get('qron').rotation);
            qronFeature.set('position', position);

            var qronData = mixin._getQRONData(mixin.get('model'), position);

            //logger.debug('qronData='+qronData);

            if (qronData) {
                var renderer = new QRCode.Renderer();

                renderer.adapter.addValue(qronData);
                renderer.adapter.setCorrectLevel(QRErrorCorrectLevel.L);

                var mode = 'SVGString';

                if (config.APP.qron_bleed_compensation) {
                    mode = 'SVGStringBC' + config.APP.qron_bleed_compensation;
                    //logger.debug('[QRON bleed compensation] setting QRON mode=' + mode);
                }

                var svg = renderer
                    .setMode(mode)
                    .toString();

                qronFeature.set('icon', svg);

                resolve(qronFeature);
            } else {
                resolve();
            }
        });
    },

    createPrintShape: function (position) {

        var mixin = this,

            shape = position.get('activeComponent.activeShape'),

            colourMap = this._getPositionColourMap(position),

            printShape = this.store.createRecord('printShape', {
                shape:          shape,
                position_name:  position.get('name'),
                decal:          position.get('activeComponent.activeDecal'),
                decal_price:    position.get('activeComponent.singlePrice'),
                qty:            position.get('activeComponent.quantity'),
                colourMap:      colourMap,
                component:      position.get('activeComponent')
            });

        return new Ember.RSVP.Promise(function (resolve, reject) {

            mixin

                ._createQRONFeature(position, shape)

                .then(
                    function (qronFeature) {
                        if (qronFeature) {
                            printShape.set('qron', qronFeature);
                            shape.set('qronFeature', qronFeature);
                        }

                        return mixin._createPrintShapeSVG(position, {showQRONs: true});
                    }, reject)

                .then(
                    function (printShapeSVG) {
                        printShape.set('svg', printShapeSVG);
                        resolve(printShape);
                    }, reject);
        });
    },

    indexUsedColours: function () {
        var usedColours = this.get('controllers.design').getUsedColours(),

            getUniqueIndexedColour = function (displayRgb, i) {
                if (i / 6 > 255) {
                    logger.warn('ColourMapWarning', 'Exceeded maximum colour space.');
                    return displayRgb;
                }

                if (usedColours.filterBy('indexedRgb', displayRgb).get('length') === 0) {
                    return displayRgb;
                } else {
                    var rgb = hexToRgb(displayRgb), hex, i2 = Math.ceil(i / 6);

                    switch (i % 6) {
                        case 0:
                            rgb.r += i2;
                            break;
                        case 1:
                            rgb.r -= i2;
                            break;
                        case 2:
                            rgb.g += i2;
                            break;
                        case 3:
                            rgb.g -= i2;
                            break;
                        case 4:
                            rgb.b += i2;
                            break;
                        case 5:
                            rgb.b -= i2;
                            break;
                    }

                    if (rgb.r < 0 || rgb.r > 255 || rgb.b < 0 || rgb.b > 255 || rgb.g < 0 || rgb.g > 255) {
                        hex = displayRgb;
                    } else {
                        hex = rgbToHex(rgb);
                    }

                    return getUniqueIndexedColour(hex, i + 1);
                }
            };

        usedColours.forEach(function (colour) {
            if (!colour) {
                return;
            }

            var displayRgb = colour.get('displayRgb');

            Ember.assert('RGB value is valid', displayRgb.length === 7); // only #xxxxxx rgb values supported.

            if (usedColours.filterBy('displayRgb', displayRgb).get('length') === 1) {
                Ember.run(function () {
                    colour.set('indexedRgb', displayRgb.toLowerCase());
                });
            } else {
                var indexedRgb = getUniqueIndexedColour(displayRgb.toLowerCase(), 0);
                Ember.run(function () {
                    colour.set('indexedRgb', indexedRgb);
                });
            }
        });

        var indexedColours = usedColours.mapBy('indexedRgb');

        if (config.APP.testing) {
            // expose the colour map for tests

            window._rsColourMap = JSON.stringify(usedColours.map(function (c) {
                return { name: c.get('name'), displayRgb: c.get('displayRgb'), indexedRgb: c.get('indexedRgb') };
            }));
        }

        Ember.assert('Indexed colours are unique', indexedColours.get('length') === indexedColours.uniq().get('length'));
    },

    _getPositionColourMap: function (position) {
        return PositionController.create({
            model: position,
            store: this.store,
            container: this.container
        }).get('usedColours').map(function (c) {
            if (c) {
                var m = {};

                Ember.assert('Colour has an indexedRgb', c.get('indexedRgb'));

                m[c.get('indexedRgb')] = c.get('printCmyk');
                return m;
            }
        });
    },

    _removePlaceholderGraphics: function (position) {
        return EditorController.create({
            model: position,
            store: this.store,
            container: this.container
        }).send('removePlaceholderGraphics');
    },

    _createPrintShapeSVG: function (position, options) {
        var mixin = this;

        return new Ember.RSVP.Promise(function (resolve) {
            mixin._createPrintShapeCanvas(position, options).then(function (rsCanvas) {
                // reviver to clean up QRON paths
                var reviver = function (svg) {
                    return svg
                        .replace('style="stroke: none; stroke-width: 1; stroke-dasharray: ; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: #000000; fill-rule: nonzero; opacity: 1;" transform="" stroke-linecap="round"', 'style="fill: #000000"')
                        .replace(/opacity: NaN/g, '');
                };

                resolve(rsCanvas.canvas.toSVG(undefined, reviver));
            });
        });
    },

    _createPrintShapeCanvas: function (position, options) {
        var shape = position.get('activeComponent.activeShape'),
            mixin = this,
            el = document.createElement('canvas');

        if (!options) {
            options = {};
        }

        return new Ember.RSVP.Promise(function (resolve) {

            mixin._removePlaceholderGraphics(position);

            var rsCanvas = new RsEditorCanvas(
                el,
                {
                    width: shape.get('widthWithQRON'),
                    height: shape.get('heightWithQRON'),
                    canvasType: 'static',
                    canvasPadding: 0,
                    virtualContainerOn: true,
                    maskOn: options.maskOn,
                    dropShadow: false,
                    skipDeletedFeatures: true,
                    showQRONs: options.showQRONs,
                    printOffset: shape.get('printOffset'),
                    noScale: true,
                    noIconBorderCompensate: !options.iconBorderCompensate,
                    colourResolver: function (feature, property) {
                        var fattribute = feature.getAttribute(property);

                        if (fattribute) {
                            var colour = mixin.store.getById('colour', fattribute.get('value'));

                            if (colour) {
                                if (colour.get('indexedRgb')) {
                                    return colour.get('indexedRgb');
                                } else {
                                    return colour.get('displayRgb');
                                }
                            }
                        }

                        return undefined;
                    },
                    onRender: function () {
                        for (var i in rsCanvas.featureFabObjs) {
                            if (rsCanvas.featureFabObjs.hasOwnProperty(i)) {
                                if (!rsCanvas.featureFabObjs[i].get('visible')) {
                                    rsCanvas.canvas.remove(rsCanvas.featureFabObjs[i]);
                                }
                            }
                        }

                        rsCanvas.canvas.renderAll();

                        resolve(rsCanvas);
                    }
                },
                position);
        });
    }
});

