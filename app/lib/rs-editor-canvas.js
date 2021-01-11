/* globals fabric, logger */

import Ember from 'ember';
import RsCanvas from './rs-canvas';
import FeaturesController from '../controllers/features';

var RsEditorCanvasExport,
__hasProp = {}.hasOwnProperty,
__extends = function (child, parent) {
    for (var key in parent) {
        if (__hasProp.call(parent, key)) {
            child[key] = parent[key];
        }
    }

    function Ctor() {
        this.constructor = child;
    }

    Ctor.prototype = parent.prototype;
    child.prototype = new Ctor();
    child.__super__ = parent.prototype;
    return child;
};

RsEditorCanvasExport = (function (_super) {
    __extends(RsEditorCanvas, _super);

    function RsEditorCanvas(canvasID, options, data) {
        this.canvasID = canvasID;
        this.options = options;
        this.data = data;
        this.options.shadowBlend = this.options.shadowBlend || '0 0 300px rgba(0,0,0,0.3)';
        this.options.shadowHard = this.options.shadowHard || '20px 20px 0px rgba(0,0,0,0.2)';
        this.component = this.data.get('activeComponent') || this.data.get('model.activeComponent');
        this.options.virtualContainerWidth = this.component.get('width');
        this.options.virtualContainerHeight = this.component.get('height');
        this.gridOffset = {x: 0, y: 0};
        RsEditorCanvas.__super__.constructor.call(this, this.canvasID, this.options, this.data);
    }

    RsEditorCanvas.prototype.handleData = function () {
        var grid = this.options.gridSpacing;

        this.container = this.initVirtualContainer();

        return new Ember.RSVP.Promise((function (_this) {
            return function (resolve/*, reject*/) {
                return RsEditorCanvas.__super__.handleData.call(_this).then(function () {
                    if (_this.component) {
                        _this.canvas.on('object:moving', function (e) {
                            if (grid > 1 && e.target.emberModelType !== 'component') {
                                var newLeft = Math.round(e.target.left / grid) * grid + _this.gridOffset.x,
                                    newTop = Math.round(e.target.top / grid) * grid + _this.gridOffset.y;

                                if (newLeft !== e.target.left || newTop !== e.target.top) {
                                    e.target.set({
                                        left: newLeft,
                                        top: newTop
                                    });

                                    return _this.renderNow();
                                }
                            } else {
                                return _this.renderNow();
                            }
                        });
                        _this.canvas.on('object:modified', function (e) {
                            _this.setEmberObjPosition(e.target);
                        });
                        _this.canvas.on('mouse:down', function (event) {
                            _this.data.send('removeRemovedFeaturesPanel');
                            if (!event.target && event.e && event.e.touches && event.e.touches[0]) {
                                event.target = _this.canvas.findTarget(event.e.touches[0]);
                            }
                            if (event.target) {
                                const emberObj = _this.data.get('model.features')
                                    .findBy('id', event.target.emberModelID);

                                if (emberObj) {
                                    Ember.run.later(() => _this.data.send('setAsActive', emberObj), 100);
                                }
                            }
                        });
                    }

                    _this.drawGrid();

                    return resolve();
                });
            };
        })(this));
    };

    RsEditorCanvas.prototype.setZIndexPosition = function () {
        if (!this.component.get('isActive')) {
            return;
        }

        const nonBackgroundFabObjs = FeaturesController
            .create({ model: this.features })
            .rejectBy('deleted')
            .rejectBy('type', 'ComponentShape')
            .mapBy('id')
            .map((id) => this.featureFabObjs[id])
            .compact();

        const backgroundFeature = this.features
            .findBy('type', 'ComponentShape');

        RsEditorCanvas.__super__.setZIndexPosition(nonBackgroundFabObjs, backgroundFeature, this.featureFabObjs);
    };

    RsEditorCanvas.prototype.addToFeatureLookup = function (id, featureObj) {
        this.featureFabObjs[id] = featureObj;
        this.addObjToCanvas(featureObj);
        this.setZIndexPosition();
    };

    RsEditorCanvas.prototype.addObjToCanvas = function (obj) {
        this.canvas.add(obj);
        if (!this.options.noScale) {
            return this.container.offsetObject(obj);
        }
    };

    RsEditorCanvas.prototype.initCanvas = function (canvasID, canvasType, canvasEnv) {
        var canvas;
        canvas = RsEditorCanvas.__super__.initCanvas.call(this, canvasID, canvasType, canvasEnv);
        canvas.rsRenderAll = canvas.renderAll;
        canvas.renderAll = function () {};
        return canvas;
    };

    RsEditorCanvas.prototype.update_texttopath = function (fabObj, prop, value) {
        var ttpInstance;
        ttpInstance = fabObj.textToPath;
        if (ttpInstance && typeof ttpInstance[prop] === 'function') {
            return ttpInstance[prop](value);
        }
    };

    RsEditorCanvas.prototype._removeObjectsFromCanvas = function (id) {
        this.canvas.getObjects()
            .filterBy('emberModelID', id)
            .forEach((o) => this.canvas.remove(o));
    };

    RsEditorCanvas.prototype.replace_texttopath = function ({ emberModelID, emberModelType, RSZIndex, textToPath }) {
        if (!textToPath) {
            logger.debug('!ttpInstance');
            return;
        }

        this._removeObjectsFromCanvas(emberModelID);

        const newFabObj = textToPath.getFabObj()
            .set({
                emberModelID,
                emberModelType,
                RSZIndex,
                textToPath,
                hasBorders: false,
                perPixelTargetFind: true,
                hasControls: false
            });

        this.featureFabObjs[emberModelID] = newFabObj;
        this.canvas.add(newFabObj);
        newFabObj.moveTo(RSZIndex);

        return newFabObj;
    };

    RsEditorCanvas.prototype.updateGraphic = function (feature) {
        const featureId = feature.get('id');

        this._removeObjectsFromCanvas(featureId);
        this.render();
        return this.createIcon(feature)
            .then((newIcon) => {
                if (newIcon) {
                    this.featureFabObjs[featureId] = newIcon.set({ hasBorders: false, hasControls: false });
                }
            });
    };

    RsEditorCanvas.prototype.setEmberObjPosition = function (fabObj) {
        const feature = this.data.get('model.features').findBy('id', fabObj.emberModelID);

        if (!feature) {
            return;
        }

        const { x: offsetX, y: offsetY } = this.container.rmOffsetOnObject(fabObj);

        if (feature.get('isTextFeature')) {
            ['top', 'left']
                .forEach((attrName) => this.update_texttopath(fabObj, attrName, fabObj.get(attrName)));
        }

        const updateTranslation = (top, left) => {
            if (feature.get('isTextFeature')) {
                ['top', 'left', 'fontSize']
                    .forEach((attrName) => this.update_texttopath(fabObj, attrName, feature.get(attrName)));

                const newFabricObj = this.replace_texttopath(fabObj);

                if (newFabricObj) {
                    this.container.offsetObject(newFabricObj);
                }
            } else {
                fabObj
                    .set({ top, left})
                    .scale(feature.get('scale'));
                this.container.offsetObject(fabObj);
            }

            this.setZIndexPosition();
            this.renderNow();
        };

        const getAttrValue = (arr, action, name) =>
            arr.findBy('name', name).values[action];

        feature.setAndTrackAttributes(
            [{ key: 'top', value: offsetY }, { key: 'left', value: offsetX }],
            {
                redo: (changes) => {
                    const value = getAttrValue.bind(null, changes, 'redo');

                    updateTranslation(value('top'), value('left'));
                },
                undo: (changes) => {
                    const value = getAttrValue.bind(null, changes, 'undo');

                    updateTranslation(value('top'), value('left'));
                }
            }
        );
    };

    RsEditorCanvas.prototype.undrawGrid = function () {
        const gridObject = this.canvas.getObjects().findBy('RSTGrid');

        this.canvas.remove(gridObject);
    };

    RsEditorCanvas.prototype.drawGrid = function () {
        if (this.options.drawGrid) {
            var gridSpacing = this.options.gridSpacing,
                w = this.canvas.getWidth(),
                h = this.canvas.getHeight(),
                componentShape = this.getComponentShape(),
                gridProperties = { stroke: '#ddd', selectable: false, opacity: 0.5},
                gridPropertiesCentreLine = { stroke: '#ddd', selectable: false, opacity: 1.0};

            this.undrawGrid();

            if (!componentShape) {
                return logger.warn('ComponentShapeGridWarning', 'Can\'t draw the grid because there is no component shape fabric object.');
            }

            if (gridSpacing > 1) {
                let grid = [];

                var bbox = componentShape.getBoundingRect(),
                    centreH = bbox.top + (bbox.height / 2),
                    centreV = bbox.left + (bbox.width / 2);

                for (var i = centreH, j = centreH; i > bbox.top; i -= gridSpacing) {
                    grid.push(new fabric.Line([0, i, w, i], gridProperties));
                    grid.push(new fabric.Line([0, j, w, j], gridProperties));
                    j += gridSpacing;
                }

                this.gridOffset.y = centreH - Math.round(centreH / gridSpacing) * gridSpacing;

                grid.push(new fabric.Line([0, centreH, w, centreH], gridPropertiesCentreLine));

                for (i = centreV, j = centreV; i > bbox.left; i -= gridSpacing) {
                    grid.push(new fabric.Line([i, 0, i, h], gridProperties));
                    grid.push(new fabric.Line([j, 0, j, h], gridProperties));
                    j += gridSpacing;
                }

                this.gridOffset.x = centreV - Math.round(centreV / gridSpacing) * gridSpacing;

                grid.push(new fabric.Line([centreV, 0, centreV, h], gridPropertiesCentreLine));

                const gridGroup = new fabric.Group(grid)
                    .set({ selectable: false, evented: false, RSTGrid: true });

                this.canvas.add(gridGroup);
                gridGroup.moveTo(100000);
                this.canvas.hoverCursor = 'move';
            }

            this.renderNow();
        }
    };

    RsEditorCanvas.prototype.applyZoom = function () {
        this.renderNow();
    };

    return RsEditorCanvas;

})(RsCanvas);

export default RsEditorCanvasExport;
