import Ember from 'ember';
import RsCanvas from './rs-canvas';
import FeaturesController from '../controllers/features';

const __hasProp = {}.hasOwnProperty;
const __extends = (child, parent) => {
    for (let key in parent) {
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

const RsSingleComponentCanvasExport = (function (_super) {
    __extends(RsSingleComponentCanvas, _super);

    function RsSingleComponentCanvas(canvasID, options, data, component, shape) {
        this.canvasID = canvasID;
        this.data = data;
        this.shape = shape;
        this.component = component || data.get('component');
        this.position = this.component.get('position') || data.get('model');

        const virtualContainerSizeCue = options.virtualContainerSizeCue || this.position;
        const defaultOptions = {
            shadowBlend: '0 0 30px rgba(0,0,0,0.4)',
            shadowHard: '10px 10px 0px rgba(0,0,0,0.2)',
            skipComponentMask: true,
            maskOn: true,
            virtualContainerSizeCue,
            virtualContainerWidth: virtualContainerSizeCue.get('width'),
            virtualContainerHeight: virtualContainerSizeCue.get('height'),
            canvasType: 'static',
            createComponentShapesOnly: options.createComponentShapesOnly || false
        };

        this.options = Object.assign({}, options, defaultOptions);

        RsSingleComponentCanvas.__super__.constructor.call(this, this.canvasID, this.options, this.data);
    }

    RsSingleComponentCanvas.prototype.render = function () {
        const componentFabObj = this.componentFabObjs[this.component.get('id')];
        this.container = this.container || this.initVirtualContainer();

        if (this.component.get('isActive') && this.component.get('activeShape.id') === this.shape.get('id')) {
            const backgroundFeature = this.features
                .findBy('type', 'ComponentShape');

            const nonBackgroundFabObjs = FeaturesController
                .create({ model: this.features })
                .rejectBy('type', 'QRON')
                .rejectBy('type', 'ComponentShape')
                .mapBy('id')
                .map((id) => this.featureFabObjs[id])
                .compact();

            nonBackgroundFabObjs
                .concat(
                    this.featureFabObjs[`${backgroundFeature.get('id')}__stroke`],
                    componentFabObj
                )
                .forEach((fabObj) => {
                    this.canvas.add(fabObj);
                    this.container.offsetObject(fabObj);
                });

            if (this.options.maskOn) {
                this.createMask(componentFabObj);
            }

            this.setZIndexPosition(nonBackgroundFabObjs, backgroundFeature, this.featureFabObjs);

        } else {
            componentFabObj
                .set('fill', '#ccc')
                .forEachObject((o) =>
                    o.set({ stroke: 'none', strokeWidth: 0 })
                );
            this.canvas.add(componentFabObj);
            this.container.offsetObject(componentFabObj);
        }

        this.canvas.renderAll();
        return Ember.RSVP.Promise.resolve();
    };

    RsSingleComponentCanvas.prototype.createComponentLookUp = function () {
        return RsSingleComponentCanvas.__super__.createComponentLookUp.call(this, this.component, this.shape.get('svg'));
    };

    return RsSingleComponentCanvas;

})(RsCanvas);

export default RsSingleComponentCanvasExport;
