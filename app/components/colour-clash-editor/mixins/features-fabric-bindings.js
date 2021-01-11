// TODO this mixin shares very similar functions to the fabric-bindings mixin, there may be scope for some refactoring here
// This mixin adds observers to the features attributes and updates the fabric canvas when the attributes change
// Extends controllers/design/editor
import Ember from 'ember';

export default Ember.Mixin.create({

    featuresChanged: function () {
        let features = this.get('model.features');

        features.forEach(function (feature) {
            feature.addObserver('fill', (feature) => {
                this.changeFill(feature);
            });
            feature.addObserver('strokeStyle1', (feature) => {
                this.strokeStyle1Changed(feature, 1);
            });
            feature.addObserver('strokeStyle2', (feature) => {
                this.strokeStyle2Changed(feature, 2);
            });
            feature.addObserver('strokeStyle3', (feature) => {
                this.strokeStyle3Changed(feature, 3);
            });
            feature.addObserver('strokeStyle4', (feature) => {
                this.strokeStyle4Changed(feature, 4);
            });
        }, this);

    }.observes('model.features.@each'),

    strokeStyle1Changed (feature) {
        this.changeStrokeStyle(feature, 1);
    },

    strokeStyle2Changed (feature) {
        this.changeStrokeStyle(feature, 2);
    },

    strokeStyle3Changed (feature) {
        this.changeStrokeStyle(feature, 3);
    },

    strokeStyle4Changed (feature) {
        this.changeStrokeStyle(feature, 4);
    },

    updateFabricTextObject (feature, changes) {

        let rsEditorCanvas = this.get('controllers.design/editor.rsEditorCanvas');

        if (rsEditorCanvas) {
            let fabricObj = rsEditorCanvas.featureFabObjs[feature.get('id')];
            let isFontSizeChange = false;

            if (fabricObj) {
                //apply the changes set
                Object.keys(changes).forEach(function (key) {
                    if (key === 'fontSize') {
                        isFontSizeChange = true;
                    }

                    rsEditorCanvas.update_texttopath(fabricObj, key, changes[key]);
                });

                rsEditorCanvas.update_texttopath(fabricObj, 'top', feature.get('top'));
                rsEditorCanvas.update_texttopath(fabricObj, 'left', feature.get('left'));

                let newFabricObj = rsEditorCanvas.replace_texttopath(fabricObj);

                if (newFabricObj) {
                    let this_vc = rsEditorCanvas.container;
                    this_vc.offsetObject(newFabricObj);
                }

                rsEditorCanvas.setZIndexPosition();
                rsEditorCanvas.render();
            }
        }
    },

    changeStrokeStyle(feature, strokeStyleNum) {
        const rsEditorCanvas = this.get('controllers.design/editor.rsEditorCanvas');

        if (!rsEditorCanvas || !rsEditorCanvas.featureFabObjs) {
            return;
        }

        const fabObj = rsEditorCanvas.featureFabObjs[feature.get('id')];

        if (!fabObj) {
            return;
        }

        const strokeStyle = `strokeStyle${strokeStyleNum}`;

        if (feature.get('isTextFeature')) {
            this.updateFabricTextObject(feature, {[strokeStyle]: feature.get(strokeStyle)});
        } else if (feature.get('type') === 'ComponentShape' && strokeStyle === 'strokeStyle1') {
            rsEditorCanvas.setBackgroundStroke(feature);
        } else if (feature.get('isIconFeature') && feature.get('strokeWidth1')) {
            const strokeWidth = 'strokeWidth1';

            if (isNaN(feature.get(strokeWidth))) {
                return;
            }

            const zeroStrokeWidth = feature.get(strokeWidth) === 0;
            const stroke = (o) => {
                o.set({
                    strokeWidth: (zeroStrokeWidth ? null : feature.get(strokeWidth)),
                    stroke: (zeroStrokeWidth ? null : feature.get('strokeStyle1'))
                });

                if (o.getObjects) {
                    o.getObjects().forEach(stroke);
                }
            };

            fabObj.forEachObject(stroke);
            rsEditorCanvas.compensateIconBorders(feature, fabObj);
            rsEditorCanvas.render();
        }
    },

    changeFill (feature) {
        let fill = feature.get('fill');
        let rsEditorCanvas = this.get('controllers.design/editor.rsEditorCanvas');
        let fillChangeObj = {};

        if (rsEditorCanvas && rsEditorCanvas.featureFabObjs) {

            if (feature.get('type') === 'Text') {

                fillChangeObj.fill = fill;
                this.updateFabricTextObject(feature, fillChangeObj);

            } else if (feature.get('type') === 'ComponentShape') {

                rsEditorCanvas.featureFabObjs[feature.get('id')].set('fill', feature.get('fill'));
                rsEditorCanvas.colourMask(feature.get('fill'));
                rsEditorCanvas.render();

            } else if (feature.get('type') === 'GraphicIcon') {

                if (rsEditorCanvas.featureFabObjs[feature.get('id')] && feature.get('fill')) {
                    rsEditorCanvas.featureFabObjs[feature.get('id')].set('fill', feature.get('fill'));
                }

                rsEditorCanvas.render();

            } else {
                if (rsEditorCanvas.featureFabObjs[feature.get('id')]) {
                    rsEditorCanvas.featureFabObjs[feature.get('id')].fill = feature.get('fill');
                }

                rsEditorCanvas.render();
            }
        }
    }

});
