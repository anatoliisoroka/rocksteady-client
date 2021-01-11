/* global Modernizr, fabric, $ */

import Ember from 'ember';
import TextToPath from './rs-text-to-path';
import RsVirtualContainer from './rs-virtual-container';
import config from '../config/environment';
import FeaturesController from '../controllers/features';
import DesignController from '../controllers/design';
import pointInSvgPolygon from 'npm:point-in-svg-polygon';
import disjointSetDS from 'npm:disjoint-set';
import svgPoints from 'npm:svg-points';
import rsLogger from '../lib/rs-logger';

const { toPath } = svgPoints;

var RsCanvas,
    __bind = function (fn, me) {
        return function () {
            return fn.apply(me, arguments);
        };
    };

fabric.isTouchSupported = Modernizr.touch;

RsCanvas = (function () {
    function RsCanvas(canvasID, options, data) {
        this.canvasID = canvasID;
        this.options = options;
        this.data = data;
        this.createComponentLookUp = __bind(this.createComponentLookUp, this);
        fabric.util.object.extend(fabric.Object, {
            MIN_SCALE_LIMIT: -1
        });
        fabric.util.object.extend(fabric.Object, {
            NUM_FRACTION_DIGITS: 10
        });
        fabric.Object.prototype.originX = fabric.Object.prototype.originY = 'center';
        fabric.Object.prototype.centeredScaling = fabric.Object.prototype.centeredRotation = true;
        this.options.canvasType = this.options.canvasType || 'non-static';
        this.options.env = this.options.env || 'browser';
        this.options.width = this.options.width || 300;
        this.options.height = this.options.height || 300;
        this.options.virtualContainerOn = this.options.virtualContainerOn || false;
        this.options.onRender = this.options.onRender || function () {
        };
        this.positionFabObjs = {};
        this.componentFabObjs = {};
        this.featureFabObjs = {};

        this.options.width += (this.options.printOffset ? this.options.printOffset.x : 0);
        this.options.height += (this.options.printOffset ? this.options.printOffset.y : 0);

        this.options.createComponentShapesOnly = this.options.createComponentShapesOnly || false;

        this.canvas = this.initCanvas(this.canvasID, this.options.canvasType, this.options.env);
        this.canvas.selection = false;
        this.canvas.renderOnAddRemove = false;
        this.setCanvasDimensions(this.canvas, this.options.width, this.options.height);
        this.canvas.calcOffset();
        this.handleData().then((function (_this) {
            return function () {
                return _this.render().then(function () {
                    return _this.options.onRender(_this);
                });
            };
        })(this));
    }

    RsCanvas.prototype.handleData = function () {
        if (this.component) {
            this.features = this.component
                .get(this.options.showQRONs ? 'featuresIncludingQRON' : 'features');
        }
        return new Ember.RSVP.Promise((resolve) =>
            this.createComponentLookUp(this.component)
                .then(() => this.createFeaturesLookUp())
                .then(() => {
                    this.doPrintOffset();
                    return Ember.run.later(
                        this,
                        () => resolve(),
                        this.options.redrawInterval || config.APP.editor_canvas_redraw / 3
                    );
                }), 'rs-canvas: handleData');
    };

    RsCanvas.prototype.doPrintOffset = function () {
        if (this.options.printOffset) {
            for (var i in this.featureFabObjs) {
                if (this.featureFabObjs.hasOwnProperty(i)) {
                    var ffo = this.featureFabObjs[i];
                    ffo.set('left', ffo.left + this.options.printOffset.x);
                    ffo.set('top', ffo.top + this.options.printOffset.y);
                }
            }
        }
    };

    RsCanvas.prototype.renderNow = function () {
        this.canvas.rsRenderAll();
        if (this.renderPromiseResolver) {
            delete this.renderPromise;
            this.renderPromiseResolver();
            return delete this.renderPromiseResolver;
        }
    };

    RsCanvas.prototype.render = function () {
        if (this.renderPromise) {
            Ember.run.debounce(this, 'renderNow', this.options.redrawInterval || config.APP.editor_canvas_redraw);
        } else {
            this.renderPromise = new Ember.RSVP.Promise((function (_this) {
                return function (resolve/*, reject*/) {
                    _this.renderPromiseResolver = resolve;
                    return Ember.run.debounce(_this, 'renderNow', _this.options.redrawInterval || config.APP.editor_canvas_redraw);
                };
            })(this), 'rs-canvas: renderPromise');
        }
        return this.renderPromise;
    };

    RsCanvas.prototype.initCanvas = function (canvasID, canvasType, canvasEnv) {
        var canvas;
        if (canvasEnv === 'browser') {
            if (canvasType === 'static') {
                canvas = new fabric.StaticCanvas(canvasID);
            } else {
                canvas = new fabric.Canvas(canvasID);
                window.editorCanvas = canvas;  // for automated test
            }
        } else {
            canvas = new fabric.createCanvasForNode();
        }
        return canvas;
    };

    RsCanvas.prototype.initVirtualContainer = function () {
        var container;
        return container = new RsVirtualContainer($, fabric, this.canvas, {
            'width': this.options.virtualContainerWidth,
            'height': this.options.virtualContainerHeight,
            'shapeWidth': this.shape ? this.shape.get('width') : void 0,
            'shapeHeight': this.shape ? this.shape.get('height') : void 0
        }, {
            'percent': this.options.canvasPadding,
            'right': this.options.canvasPaddingRight
        });
    };

    RsCanvas.prototype.initComponentShape = function (pathData) {
        return pathData.length > 1 ?
            new fabric.Group(pathData.reverse()) :
            new fabric.Group(pathData).set('pathOffset', { x: 0, y: 0 });
    };

    RsCanvas.prototype.setCanvasDimensions = function (canvas, width, height) {
        return canvas.setDimensions({
            width: width,
            height: height
        });
    };

    RsCanvas.prototype.createComponentsLookUp = function () {
        var promises;
        promises = [];
        this.components.forEach((function (_this) {
            return function (component) {
                return promises.push(_this.createComponentLookUp(component));
            };
        })(this));
        return Ember.RSVP.all(promises);
    };

    RsCanvas.prototype.createComponentLookUp = function (component, componentPathData) {
        componentPathData = componentPathData || component.get('componentShape');

        return new Ember.RSVP.Promise((resolve) =>
            fabric.loadSVGFromString(componentPathData, (pathData) => {
                const fabComponent = this.initComponentShape(pathData)
                    .set({
                        emberModelID: component.get('id'),
                        emberModelType: 'component'
                    });

                this.componentFabObjs[component.get('id')] = fabComponent;
                resolve();
            }), `rs-canvas: createComponentLookup id: ${component.id}`);
    };

    RsCanvas.prototype.getComponentShape = function () {
        // there should only be one component shape

        return this.componentFabObjs[Object.keys(this.componentFabObjs)[0]];
    };

    RsCanvas.prototype.createFeaturesLookUp = function () {
        var promises;
        promises = [];
        if (!this.features || this.features.toArray().length === 0) {
            return new Ember.RSVP.Promise(function (resolve/*, reject*/) {
                return resolve();
            }, 'rs-canvas: createFeaturesLookup');
        }

        var featuresController = FeaturesController.create({model: this.features});

        featuresController.forEach((function (_this) {
            return function (feature) {
                if (feature.get('type') === "QRON" && !_this.options.showQRONs) {
                    return;
                }
                if (!feature.get('position.isIncluded')) {
                    return;
                }
                return promises.push(_this.initFeature(feature));
            };
        })(this));
        return Ember.RSVP.all(promises, 'rs-canvas: createFeaturesLookup');
    };

    RsCanvas.prototype.addToFeatureLookup = function (id, featureObj) {
        return this.featureFabObjs[id] = featureObj;
    };

    RsCanvas.prototype.initFeature = function (feature) {
        const { skipDeletedFeatures, createComponentShapesOnly } = this.options;

        if (skipDeletedFeatures && feature.get('deleted')) {
            return Ember.RSVP.Promise.resolve();
        }

        const featureType = feature.get('type');

        if (createComponentShapesOnly) {
            switch (featureType) {
                case 'ComponentShape':
                    return this.createComponentShape(feature);
                default:
                    return Ember.RSVP.Promise.resolve();
            }
        }

        switch (featureType) {
            case 'GraphicIcon':
                return this.createIcon(feature);
            case 'Text':
                return this.createText(feature);
            case 'ComponentShape':
                return this.createComponentShape(feature);
            case 'QRON':
                return this.createQRON(feature);
            default:
                return Ember.RSVP.Promise.resolve();
        }
    };

    RsCanvas.prototype.createComponentShape = function (feature) {
        const component = this.component || feature.get('position.activeComponent');
        const componentFabObj = this.componentFabObjs[component.get('id')];

        Ember.assert('Have a component fabric object', componentFabObj);

        const walkObject = (f, shadowMode) => {
            if (f.get('type') === 'group') {
                f.forEachObject((o) => walkObject(o, shadowMode));
                return;
            }
            f.setShadow(shadowMode);
        };
        const { options } = this;

        if (options.dropShadow && config.APP.shadows) {
            walkObject(
                componentFabObj,
                Modernizr.canvasblending ? options.shadowBlend : options.shadowHard
            );
        }

        componentFabObj.set({
            hasBorders: false,
            hasControls: false,
            perPixelTargetFind: true,
            emberModelID: feature.get('id'),
            emberModelType: 'component',
            RSZIndex: feature.get('zIndex'),
            fill: this.resolveColour(feature, 'fill'),
            lockMovementX: true,
            lockMovementY: true
        });

        if (componentFabObj.get('top') === 0 && componentFabObj.get('left') === 0) {
            componentFabObj.set({
                top: componentFabObj.get('height') / 2,
                left: componentFabObj.get('width') / 2
            });
        }

        this.addToFeatureLookup(
            `${feature.get('id')}__stroke`,
            getStrokeGroup(componentFabObj)
        );
        this.addToFeatureLookup(feature.get('id'), componentFabObj);
        this._setBackgroundStroke(feature);

        if (options.maskOn && !options.skipComponentMask) {
            this.createMask(componentFabObj);
        }

        return Ember.RSVP.Promise.resolve();
    };

    RsCanvas.prototype.createQRON = function (feature) {
        return this.createIcon(feature)
            .then((qron) =>
                qron && qron.set('selectable', false)
                    .moveTo(1000)
            );
    };

    RsCanvas.prototype._groupAndSetupIcon = function _groupAndSetupIcon(icon, feature) {
        const groupedIcon = new fabric.Group([icon]);

        this.setIconProperties(groupedIcon, feature);
        this.addToFeatureLookup(feature.get('id'), groupedIcon);
        return groupedIcon;
    };

    RsCanvas.prototype.createIcon = function (feature) {
        const isQron = feature.get('type') === 'QRON';
        const iconData = feature.get(isQron ? 'icon' : 'iconObject.graphicData');
        const iconUrl = isQron ? undefined : feature.get('iconObject.graphicUrl');
        const graphicType = feature.get('iconObject.graphicType');

        return new Ember.RSVP.Promise((resolve) => {
            if (iconUrl) {
                if (graphicType === 'SVG') {
                    this.loadSvgFromUrlAndAddFeature(iconUrl, feature)
                        .then(resolve);
                } else {
                    this.loadBitmapFromUrlAndAddFeature(iconUrl, feature)
                        .then(resolve);
                }
            } else if (new RegExp('^data:image').test(iconData)) {
                fabric.util.loadImage(iconData, (img) =>
                    resolve(this._groupAndSetupIcon(new fabric.Image(img), feature))
                );
            } else if (iconData) {
                this.loadSvgAndAddFeature(iconData, feature)
                    .then(resolve);
            } else {
                rsLogger.warn('IconStateWarning', `Icon ${feature.id} is missing data.`);
                resolve();
            }
        }, `rs-canvas: createIcon id: ${feature.id}`);
    };

    RsCanvas.prototype.setIconProperties = function (newIcon, feature) {
        var canvas, stroke;
        Ember.assert('Fabric parses the SVG icon', newIcon);
        if (!newIcon) {
            return;
        }
        newIcon.scale(feature.get('scale'));
        newIcon.setOpacity(feature.get('opacity') / 100);
        newIcon.set({
            strokeWidth: 0,
            strokeStyle: 'none',
            hasBorders: true,
            hasControls: false,
            perPixelTargetFind: true,
            top: feature.get('top'),
            left: feature.get('left'),
            flipX: feature.get('flipX'),
            flipY: feature.get('flipY'),
            pathOffset: {
                x: 0,
                y: 0
            }
        });
        if (!feature.get('multicoloured')) {
            if (feature.get('fill')) {
                newIcon.set('fill', this.resolveColour(feature, 'fill'));
            }
            canvas = this;
            stroke = function (o) {
                o.set('strokeWidth', feature.get('strokeWidth1'));
                o.set('_rsOriginalLeft', o.get('left'));
                o.set('_rsOriginalTop', o.get('top'));

                if (feature.get('strokeWidth1') === 0 || feature.get('strokeWidth1') === null) {
                    o.set('strokeWidth', null);
                    o.set('stroke', null);
                } else {
                    o.set('stroke', canvas.resolveColour(feature, 'strokeStyle1'));
                    o.set('strokeWidth', feature.get('strokeWidth1'));
                }
                if (o.getObjects) {
                    return o.getObjects().forEach(stroke);
                }
            };
            newIcon.forEachObject(stroke);
        }

        this.compensateIconBorders(feature, newIcon);

        newIcon.setAngle(feature.get('angle'));
        newIcon.set('visible', !feature.get('deleted')).set('hasBorders', false).set('hasControls', false);
        newIcon.emberModelID = feature.get('id');
        newIcon.emberModelType = 'feature';
        newIcon.RSZIndex = feature.get('zIndex');
        return newIcon;
    };

    RsCanvas.prototype.compensateIconBorders = function (feature, fabObj) {
        // bug702

        if (this.options.noIconBorderCompensate) {
            return;
        }

        fabObj = fabObj || this.featureFabOjs[feature.get('id')];

        fabObj.set('_rsHasCompensatedIconBorder', false);

        var compensate = function (o) {
            if (feature.get('strokeWidth1') && feature.get('strokeWidth1') && !fabObj.get('_rsHasCompensatedIconBorder')) {
                o.set('left', o.get('_rsOriginalLeft') - o.get('strokeWidth') / 2);
                o.set('top', o.get('_rsOriginalTop') - o.get('strokeWidth') / 2);
                fabObj.set('_rsHasCompensatedIconBorder', true);
            }
            if (o.getObjects) {
                return o.getObjects().forEach(compensate);
            }
        };

        fabObj.forEachObject(compensate);
    };

    RsCanvas.prototype.createText = function (feature) {
        if (feature.get('text') && !feature.get('isTextAndEmpty')) {
            var featureObj, font, fontProperties, textToPathInt;
            font = feature.get('fontFamily');
            fontProperties = {
                'fontSize': feature.get('fontSize'),
                'fill': this.resolveColour(feature, 'fill'),
                'letterSpacing': feature.get('letterSpacing'),
                'top': feature.get('top'),
                'left': feature.get('left'),
                'text': feature.get('text').toString().trim(),
                'strokeWidth': feature.get('strokeWidth'),
                'strokeStyle': this.resolveColour(feature, 'strokeStyle'),
                'strokeWidth1': feature.get('strokeWidth1'),
                'strokeStyle1': this.resolveColour(feature, 'strokeStyle1'),
                'strokeWidth2': feature.get('strokeWidth2'),
                'strokeStyle2': this.resolveColour(feature, 'strokeStyle2'),
                'strokeWidth3': feature.get('strokeWidth3'),
                'strokeStyle3': this.resolveColour(feature, 'strokeStyle3'),
                'strokeWidth4': feature.get('strokeWidth4'),
                'strokeStyle4': this.resolveColour(feature, 'strokeStyle4'),
                'fontFamily': font,
                'angle': feature.get('angle'),
                'opacity': feature.get('opacity') / 100,
                'flipX': feature.get('flipX'),
                'flipY': feature.get('flipY'),
                'textAlignment': feature.get('textAlignment'),
                'lineHeight': feature.get('lineHeight')
            };
            textToPathInt = new TextToPath($, fabric, this.canvas, fontProperties);
            featureObj = textToPathInt.getFabObj();
            featureObj.emberModelID = feature.get('id');
            featureObj.emberModelType = 'feature';
            featureObj.RSZIndex = feature.get('zIndex');
            featureObj.set('visible', !feature.get('deleted'));
            featureObj.textToPath = textToPathInt;
            featureObj.set('hasBorders', false);
            featureObj.set('hasControls', false).set('perPixelTargetFind', true);
            this.addToFeatureLookup(feature.get('id'), featureObj);
        }

        return new Ember.RSVP.Promise(function (resolve/*, reject*/) {
            return resolve();
        }, 'rs-canvas: createText');
    };

    RsCanvas.prototype.createMask = function (shape) {
        shape.clone((mask) => {
            mask.forEachObject((o) =>
                o.set({ strokeWidth: 0, stroke: null })
            );
            this.mask = mask;
            this.canvas.clipTo = (ctx) =>
                mask.render(ctx);
        });
    };

    RsCanvas.prototype.colourMask = function (colour) {
        if (this.options.maskOn && this.mask) {
            return this.mask.set('fill', colour);
        }
    };

    RsCanvas.prototype.resolveColour = function (feature, property) {
        if (this.options.colourResolver && feature.get(property)) {
            const c = this.options.colourResolver(feature, property);

            if (c) {
                return c;
            }

            rsLogger.warn(
                'ColourResolveWarning',
                `Could not resolve a colour for feature ${feature.get('id')}'s property '${property}'`
            );
        }
        return feature.get(property);
    };

    RsCanvas.prototype.loadSvgAndAddFeature = function loadSvgAndAddFeature(iconData, feature) {
        return new Ember.RSVP.Promise((resolve) =>
            fabric.loadSVGFromString(iconData, (svg, options) => {
                const icon = fabric.util.groupSVGElements(svg, options);
                const { left, width, top, height } = icon;

                icon.set({
                    originX: 'left',
                    left: left - width / 2,
                    originY: 'top',
                    top: top - height / 2
                });

                resolve(this._groupAndSetupIcon(icon, feature));
            })
        );
    };

    RsCanvas.prototype.loadSvgFromUrlAndAddFeature = function loadSvgFromUrlAndAddFeature(iconUrl, feature) {
        return new Ember.RSVP.Promise((resolve) =>
            fabric.loadSVGFromURL(iconUrl, (objects, options) => {
                const icon = fabric.util.groupSVGElements(objects, options);
                const {left, width, top, height} = icon;
                icon.set({
                    originX: 'left',
                    left: left - width / 2,
                    originY: 'top',
                    top: top - height / 2
                });
                resolve(this._groupAndSetupIcon(icon, feature));
            })
        );
    };

    RsCanvas.prototype.loadBitmapFromUrlAndAddFeature = function loadBitmapFromUrlAndAddFeature(iconUrl, feature) {
        return new Ember.RSVP.Promise((resolve) =>
            fabric.util.loadImage(iconUrl, (img) => {
                if (!img) {
                    rsLogger.warn('IconStateWarning', `Icon ${feature.id} did not load from URL: ${iconUrl}`);

                    _getPlaceholderGraphic(feature.get('design'))
                        .then((placeHolderGraphic) =>
                            this.loadSvgAndAddFeature(placeHolderGraphic.get('graphicData'), feature)
                        )
                        .then((fabObj) => resolve(fabObj));

                } else {
                    resolve(this._groupAndSetupIcon(new fabric.Image(img), feature));
                }

            }, null, {crossOrigin: 'anonymous'})
        );
    };

    RsCanvas.prototype._setStroke = function _addStroke(fabObjs, strokeParams) {
        fabObjs
            .forEach((fabObj) =>
                fabObj.set(strokeParams)
            );
    };

    RsCanvas.prototype._setBackgroundStroke = function _setBackgroundStroke(feature) {
        const strokeWidth = feature.get('strokeWidth1');
        const stroke = feature.get('strokeStyle1');
        const removeStroke = strokeWidth === 0 || strokeWidth === null;
        const strokeInternal = feature.get('strokeInternal1') === '1';
        const addStrokeParams = { stroke, strokeWidth };
        const removeStrokeParams = { strokeWidth: null, stroke: null };
        const fabObjs = this.featureFabObjs[`${feature.get('id')}__stroke`].getObjects();

        if (removeStroke) {
            this._setStroke(fabObjs, removeStrokeParams);
        } else {
            this._setStroke(fabObjs.filterBy('internal'), strokeInternal ? addStrokeParams : removeStrokeParams);
            this._setStroke(fabObjs.rejectBy('internal'), addStrokeParams);
        }
    };

    RsCanvas.prototype.setBackgroundStroke = function setBackgroundStroke(feature) {
        this._setBackgroundStroke(feature);
        this.render();
    };

    const _moveTo = ({ fabObj, zIndex }) => {
        const { _objects } = fabObj.canvas;
        const idx = _objects.indexOf(fabObj);

        if (idx !== -1) {
            _objects.splice(idx, 1);
        }
        _objects.splice(zIndex, 0, fabObj);
    };

    RsCanvas.prototype.setZIndexPosition = function setZIndexPosition(selectedFabObjs, backgroundFeature, allFabObjs) {
        const backgroundId = backgroundFeature.get('id');
        const backgroundFab = allFabObjs[backgroundId];
        const strokeFab = allFabObjs[`${backgroundId}__stroke`];
        const strokeInFront = backgroundFeature.get('strokeFront1') === '1';

        [{ fabObj: backgroundFab, zIndex: 0 }]
            .concat(
                selectedFabObjs
                    .map((fabObj, index) => ({ fabObj, zIndex: index + 2 }))
            )
            .concat({ fabObj: strokeFab, zIndex: (strokeInFront ? strokeFab.get('RSZIndex') : 1) })
            .filterBy('fabObj')
            .forEach(_moveTo);
    };

    RsCanvas.prototype.backgroundFeatureHasNoInternalBorders = function backgroundFeatureHasNoInternalBorders(feature) {
        return this.featureFabObjs[`${feature.get('id')}__stroke`]
            .getObjects()
            .every(({ internal = false }) => !internal);
    };

    return RsCanvas;

})();

function _getPlaceholderGraphic(design) {
    let designController = DesignController.create({model: design});
    return designController.getPlaceholderGraphic();
}

function getStrokeGroup(shapeGroup) {
    const getMovePointFromSvgString = (str) => {
        const tokens = /M\s*([\d\.]*),([\d\.]*)\s*[A-Za-z]/g.exec(str);
        return [parseFloat(_.nth(tokens, 1)), parseFloat(_.nth(tokens, 2))];
    };

    const convertToPathDescription = (shapeGroup) => {
        const shape = _.head(shapeGroup.getObjects());
        const { rx, ry, type, d, width, height } = shape;

        switch (type) {
            case 'path':
                return d;
            case 'ellipse':
                const { left: cx, top: cy } = shapeGroup;

                return toPath({ type, cx, cy, rx, ry });
            case 'rect':
                const { left, top } = shapeGroup;

                return toPath({ type, width, height, x: left - width / 2, y: top - height / 2 });
        }

        const loggerPath = 'lib__rs_canvas__get_stroke_group';
        const dummyCircle = { type: 'circle', cx: 0, cy: 0, r: 0 };

        rsLogger.error(loggerPath, `Unsupported type used as a Background shape: ${type}`);
        rsLogger.warn(loggerPath, `Dummy shape set as stroke object: ${JSON.stringify(dummyCircle)}`);

        return toPath(dummyCircle);
    };

    const richPaths = convertToPathDescription(shapeGroup)
        .split('M')
        .filter((str) => str)
        .map((str) => `M${str}`)
        .map((path, id) => ({
            id,
            path,
            segments: pointInSvgPolygon.segments(path),
            M: getMovePointFromSvgString(path)
        }));

    const disjointSet = disjointSetDS();

    richPaths
        .map((richPath) => {
            disjointSet.add(richPath);
            return richPath;
        })
        .forEach((richPath1) =>
            richPaths
                .filter(({ id }) => id !== richPath1.id)
                .filter(({ M }) => pointInSvgPolygon.isInside(M, richPath1.segments))
                .forEach((richPath2) =>
                    disjointSet.union(richPath1, richPath2)
                )
        );

    const extractCategories = (groupElements) => {
        const representative = richPaths[disjointSet.find(_.head(groupElements))];

        return {
            representative,
            children: groupElements.filter((element) => element !== representative)
        };
    };

    const strokePaths = disjointSet.extract()
        .map(extractCategories)
        .reduce((acc, { representative, children }) =>
            acc.concat(
                new fabric.Path(representative.path),
                children
                    .map(({ path }) =>
                        new fabric.Path(path).set({ internal: true })
                    )
            ), [])
        .map((path) => {
            const { toSVG } = path;

            path.toSVG = function (reviver) {
                return toSVG
                    .call(this, reviver)
                    .replace('/>', ' fill-opacity="0" />');
            };

            return path;
        });

    return new fabric.Group(strokePaths)
        .set({
            fill: 'transparent',
            selectable: false,
            evented: false,
            RSZIndex: 9990
        });
}

export default RsCanvas;
