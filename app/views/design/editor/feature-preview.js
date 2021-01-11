/* global fabric, _ */

import Ember from 'ember';
import config from '../../../config/environment';
import rsLogger from '../../../lib/rs-logger';

// Note:
// Used in the property panel feature preview and the removed features panel
// Test in both if modifying.

export default Ember.View.extend({
    tagName: 'canvas',
    classNames: ['feature-preview-view', config.APP.shadows ? 'with-shadow' : ''],
    topBottomPadding: 60,
    leftRightPadding: 40,

    onEditorCanvasRender: function () {
        if (this.get('controller.controllers.design/editor.isCanvasRendered')) {
            Ember.run.scheduleOnce('afterRender', this, this.createCanvas);
        }
    }.observes('controller.controllers.design/editor.isCanvasRendered').on('init'),

    createCanvas () {
        if (!this.get('controller.controllers.design/editor.isCanvasRendered')) {
            return;
        }
        this.set('canvasInstance', new fabric.StaticCanvas(this.get('elementId')));
        this.get('canvasInstance').setWidth(this.get('canvasWidth'));
        this.get('canvasInstance').setHeight(this.get('canvasHeight'));
        this.cloneFabricObj();
    },

    cloneFabricObj () {
        const featureFabObjs = this.get('controller.controllers.design/editor.rsEditorCanvas.featureFabObjs');
        const feature = this.get('controller.model');

        const cloneFabricObject = (obj) => {
            let clone = null;

            obj.clone((clonedObj) => clone = clonedObj);
            return clone;
        };

        const obtainBackgroundWithStrokeObjects = (id, featureFabObjs) => {
            const background = cloneFabricObject(featureFabObjs[id]);
            const backgroundType = _.head(background.getObjects()).get('type');
            const options = backgroundType === 'ellipse' ?
                { left: -background.width / 2, top: -background.height / 2, pathOffset: { x: 0, y: 0 } } :
                { left: 0, top: 0 };
            const strokes = featureFabObjs[`${id}__stroke`].getObjects()
                .map((strokeObj) =>
                    cloneFabricObject(strokeObj).set(options)
                );

            return background.add(...strokes);
        };

        let targetObject = feature.get('name') === 'Background' ?
            obtainBackgroundWithStrokeObjects(feature.get('id'), featureFabObjs) :
            featureFabObjs[feature.get('id')];

        if (!targetObject)  {
            rsLogger.warn('FabricCloneWarning', 'Could not clone a fabric obj');
            return;
        }

        const addObjectToPreviewCanvas = (fabricObj, angle = 0) => {
            // This view is reused in the removed components panel, so need to
            // reset the object visibility because in this context it will be hidden

            const walkObject = (f) => {
                f.set('visible', true);
                if (f.get('type') === 'group') {
                    f.forEachObject(walkObject);
                }
            };

            walkObject(fabricObj);

            const canvasWidth = this.get('canvasWidth') - this.get('leftRightPadding');
            const canvasHeight = this.get('canvasHeight') - this.get('topBottomPadding');
            const scale = fabricObj.getWidth() > fabricObj.getHeight() ?
                canvasWidth / fabricObj.width :
                canvasHeight / fabricObj.height;

            fabricObj
                .set({ left: canvasWidth / 2, top: canvasHeight / 2, angle })
                .scale(scale * 0.7);

            this.get('canvasInstance')
                .add(fabricObj)
                .centerObjectH(fabricObj)
                .centerObjectV(fabricObj)
                .renderAll();
        };

        // in this context, we care about ellipses
        const ellipseWalker = (fabObj) =>
            (typeof fabObj.getObjects === 'function') ?
                fabObj.getObjects().some(ellipseWalker) :
                fabObj.get('type') === 'ellipse';

        const hasEllipse = this.get('location') === 'featurePreview' ? ellipseWalker(targetObject) : false;

        if (targetObject.get('type') !== 'group') {
            const max = Math.max(targetObject.getWidth(), targetObject.getHeight());

            targetObject = new fabric.Group()
                .add(targetObject)
                .set({
                    width: hasEllipse ? max : targetObject.getWidth(),
                    height: hasEllipse ? max : targetObject.getHeight()
                });
        }

        if (hasEllipse) {
            targetObject.cloneAsImage((o) =>
                addObjectToPreviewCanvas(o, 360 - targetObject.get('angle'))
            );
        } else {
            targetObject.clone(addObjectToPreviewCanvas);
        }
    },

    // Updates the preview canvas on changing properties.
    // re-renders the whole view
    featureChanged: Ember.observer(
        'controller.model.strokeInternal1',
        'controller.model.strokeFront1',
        'controller.model.id',
        'controller.model.icon',
        'controller.model.fill',
        'controller.model.text',
        'controller.model.opacity',
        'controller.model.fontFamily',
        'controller.model.strokeWidth',
        'controller.model.strokeWidth1',
        'controller.model.strokeWidth2',
        'controller.model.strokeWidth3',
        'controller.model.strokeWidth4',
        'controller.model.strokeStyle',
        'controller.model.strokeStyle1',
        'controller.model.strokeStyle2',
        'controller.model.strokeStyle3',
        'controller.model.strokeStyle4',
        'controller.model.textAlignment',
        'controller.model.lineHeight',
        'controller.model.letterSpacing',
        'controller.model.flipX',
        'controller.model.flipY',
        'controller.model.newGraphicLoaded',
        function () {
            Ember.run.debounce(this, 'createCanvas', config.APP.editor_canvas_redraw);
        }
    )
});


