import Ember from 'ember';
import { guid } from '../utils/string-util';

// This mixin deals with the binding of property panel
// changes to the canvas.  For binding in the other direction
// look in the rs_editor_canvas.coffee file.
export default Ember.Mixin.create({
    _userActionService: Ember.inject.service('user-action-service'),
    canvas: Ember.computed.alias('controllers.design/editor.rsEditorCanvas'),

    observedAttrsMap: [
        { name: 'strokeFront1', handler: 'strokeFront1Changed' },
        { name: 'strokeInternal1', handler: 'strokeInternal1Changed' },
        { name: 'opacity', handler: 'opacityChanged' },
        { name: 'flipX', handler: 'flipXChanged' },
        { name: 'flipY', handler: 'flipYChanged' },
        { name: 'angle', handler: 'angleChanged' },
        { name: 'scale', handler: 'scaleChanged', type: 'icon' },
        { name: 'fill', handler: 'fillChanged' },
        ...mapByName([1, 2, 3, 4], 'strokeStyle'),
        ...mapByName([1, 2, 3, 4], 'strokeWidth'),
        { name: 'text', handler: 'textChanged', type: 'text' },
        { name: 'fontSize', handler: 'fontSizeChanged', type: 'text' },
        { name: 'fontFamily', handler: 'fontChanged', type: 'text' },
        { name: 'lineHeight', handler: 'lineHeightChanged', type: 'text' },
        { name: 'letterSpacing', handler: 'letterSpacingChanged', type: 'text' },
        { name: 'textAlignment', handler: 'textAlignmentChanged', type: 'text' },
        { name: 'icon', handler: 'graphicChanged', type: 'icon' }
    ],

    handleObservers (action) {
        const feature = this.get('model');

        if (!feature) {
            return;
        }

        this.get('observedAttrsMap')
            .filter(({ type }) => {
                if (type === 'text') {
                    return feature.get('isTextFeature');
                }
                if (type === 'icon') {
                    return feature.get('isIconFeature');
                }
                return true;
            })
            .forEach(({ name, handler }) =>
                Ember[`${action}Observer`](feature, name, this, this[handler])
            );
    },

    registerObservers () {
        this.handleObservers('add');
    },

    removeObservers () {
        this.handleObservers('remove');
    },

    strokeFront1Changed () {
        const feature = this.get('model');

        feature.setAttributeOnly(
            'strokeFront1',
            feature.get('strokeFront1')
        );

        const canvas = this.get('canvas');

        canvas.setZIndexPosition();
        canvas.drawGrid();
        canvas.render();
    },

    strokeInternal1Changed () {
        const feature = this.get('model');

        feature.setAttributeOnly(
            'strokeInternal1',
            feature.get('strokeInternal1')
        );

        this.get('canvas').setBackgroundStroke(feature);
    },

    flipAxisChanged (axis) {
        const attrName = `flip${axis}`;
        const feature = this.get('model');
        const canvas = this.get('canvas');
        const fabObj = canvas.featureFabObjs[feature.get('id')];
        const flipValue = feature.get(attrName);

        feature.setAttributeOnly(attrName, flipValue);

        if (feature.get('isIconFeature')) {
            fabObj[`setFlip${axis}`](flipValue);
            canvas.render();
        }
    },

    flipXChanged () {
        this.flipAxisChanged('X');
    },

    flipYChanged () {
        this.flipAxisChanged('Y');
    },

    opacityChanged () {
        const feature = this.get('model');
        const opacity = feature.get('opacity');

        if (isNaN(opacity)) {
            return;
        }
        const canvas = this.get('canvas');
        const fabObj = canvas.featureFabObjs[feature.get('id')];

        feature.setAttributeOnly('opacity', opacity);

        const opacityFraction = opacity / 100;

        if (feature.get('isTextFeature')) {
            canvas.update_texttopath(fabObj, 'opacity', opacityFraction);
        } else if (feature.get('isIconFeature')) {
            fabObj.setOpacity(opacityFraction);
        }

        canvas.render();
    },

    angleChanged () {
        const feature = this.get('model');
        const canvas = this.get('canvas');
        const fabObj = canvas.featureFabObjs[feature.get('id')];
        const angle = feature.get('angle');

        feature.setAttributeOnly('angle', angle);

        if (feature.get('isTextFeature')) {
            canvas.update_texttopath(fabObj, 'angle', angle);
        } else {
            fabObj.angle = angle;
        }

        fabObj.setCoords();
        canvas.render();
    },

    scaleChanged () {
        const feature = this.get('model');
        const canvas = this.get('canvas');
        const scale = feature.get('scale');

        if (isNaN(scale)) {
            return;
        }

        feature.setAttributeOnly('scale', scale);

        const fabObj = canvas.featureFabObjs[feature.get('id')]
            .set({
                top: feature.get('top'),
                left: feature.get('left')
            })
            .scale(scale);

        const { container } = canvas;

        container.offsetObject(fabObj);
        canvas.render();
    },

    fillChanged () {
        const feature = this.get('model');
        const canvas = this.get('canvas');
        const fill = feature.get('fill');
        const colour = this.store.getById(
            'colour',
            feature.getAttribute('fill').get('value')
        );
        const fabObj = canvas.featureFabObjs[feature.get('id')];
        const applyContrastingChanges = (contrastingChanges, attrName) =>
            contrastingChanges
                .map(({ feature, colours: { [attrName]: action } }) =>
                    this.updateFill(feature, action)
                );

        if (feature.get('isTextFeature')) {
            this.store
                .filter(
                    'colour',
                    (colour) => colour.get('displayRgb') === fill
                )
                .then(() => {
                    feature.setAttributeOnly('fill', colour.get('id'));
                    this.updateFabricTextObject(feature, { fill });
                });

            return;
        }

        if (feature.get('type') === 'ComponentShape') {
            const position = feature.get('position');

            if (feature.get('applyContrastingColour')) {
                feature.set('applyContrastingColour', undefined);
                this.store
                    .filter('feature', (feat) =>
                        (feat.get('isTextFeature') || feat.get('isIconFeature')) &&
                        feat.get('position.id') === position.get('id') &&
                        !feat.get('deleted'))
                    .then((features) => {
                        const contrastingChanges = features
                            .map((feature) => this.updateFill(feature))
                            .compact();
                        const previousColour = feature.get('previousColour');

                        feature.set('previousColour', undefined);

                        if (!previousColour) {
                            return;
                        }

                        this.get('_userActionService')
                            .appendAction({
                                model: feature,
                                owner: 'fattribute',
                                changes: [{
                                    name: 'fill',
                                    values: {
                                        undo: previousColour,
                                        redo: feature.getAttribute('fill').get('value')
                                    }
                                }],
                                afterActions: {
                                    redo: applyContrastingChanges.bind(this, contrastingChanges, 'redo'),
                                    undo: applyContrastingChanges.bind(this, contrastingChanges, 'undo')
                                }
                            });
                    });
            }

            fabObj.set('fill', feature.get('fill'));

            // Ensure mask is coloured the same as the component shape to stop
            // antialiasing problems.
            canvas.colourMask(feature.get('fill'));

        } else if (feature.get('isIconFeature')) {
            if (feature.get('multicoloured')) {
                return;
            }

            feature.setAttributeOnly('fill', colour.get('id'));

            if (fill) {
                fabObj.set('fill', fill);
            }

        } else {
            if (fabObj) {
                fabObj.fill = fill;
            }
        }

        canvas.render();
    },

    updateFill (feature, _colour) {
        const fill = feature.get('fill');

        if (!fill) {
            return null;
        }

        const currentComponentColour = this.get('controllers.design/editor.currentComponentColour').toUpperCase();
        const colour = _colour ?  null : this.contrastingColour(fill);

        if (feature.innermostBorder() || (fill.toUpperCase() !== currentComponentColour && !_colour)) {
            return null;
        }

        const colourIdPrev = feature.getAttribute('fill').get('value');
        const colourId = (_colour && _colour.id) || colour.get('id');

        if (feature.get('isTextFeature')) {
            const colourDisplayRgbPrev = feature.getAttribute('fill').get('content');
            const colourDisplayRgb = (_colour && _colour.displayRgb) || colour.get('displayRgb');

            feature.setAttribute('fill', colourId);
            this.updateFabricTextObject(feature, { 'fill': colourDisplayRgb });

            return {
                feature,
                colours: {
                    redo: { id: colourId, displayRgb: colourDisplayRgb },
                    undo: { id: colourIdPrev, displayRgb: colourDisplayRgbPrev }
                }
            };

        } else if (feature.get('isIconFeature')) {
            const canvas = this.get('canvas');

            feature.setAttribute('fill', colourId);
            canvas.featureFabObjs[feature.get('id')].fill = fill;
            canvas.render();
            return {
                feature,
                colours: {
                    redo: { id: colourId },
                    undo: { id: colourIdPrev }
                }
            };
        }

        return null;
    },

    //rerender a fabric text object, apply the 'changes' object
    updateFabricTextObject (feature, changes) {

        const canvas = this.get('canvas');
        const fabricObj = canvas.featureFabObjs[feature.get('id')];
        const doesFontSizeChange = Object
            .keys(changes)
            .reduce((acc, key) => {
                canvas.update_texttopath(fabricObj, key, changes[key]);
                return acc || key === 'fontSize';
            }, false);

        [ 'top', 'left' ]
            .forEach((attrName) =>
                canvas.update_texttopath(fabricObj, attrName, feature.get(attrName))
            );

        const newFabricObj = canvas.replace_texttopath(fabricObj);

        if (newFabricObj) {
            canvas.container.offsetObject(newFabricObj);
        }

        canvas.setZIndexPosition();
        canvas.render();

        if (!doesFontSizeChange) {
            // #bug465
            this.updateFabricTextObject(feature, { 'fontSize': feature.get('fontSize') });
        }
    },

    //returns the contrasting colour obj for a hexidecimal value
    contrastingColour (hex_code) {
        const colour = this.store.all('colour')
            .filterBy('displayRgb')
            .find((colour) =>
                colour.get('displayRgb').toLowerCase() === hex_code.toLowerCase()
            );

        return this.store.getById('colour', colour.get('contrastingId'));
    },

    // return a border colour from
    // designer fill palette that does not conflict with
    // currentComponentColour or fill.
    // returns an Colour obj
    altColour () {
        const feature = this.get('model');
        let designerColours = feature.getAttribute('fill').get('designerObjects');

        if (designerColours && designerColours.get('length')) {
            designerColours = designerColours.sortBy('id');
        } else {
            designerColours = this.get('controllers.design.kitColours');
        }

        const currentComponentColour = this.get('controllers.design/editor.currentComponentColour');
        const fill = feature.get('fill');

        const alt_colours = designerColours.reject((colour) =>
            [fill, currentComponentColour]
                .includes(colour.get('displayRgb').toUpperCase())
        );

        return alt_colours[0];
    },

    // called by each of the strokeStyle observers
    changeStrokeStyle (strokeStyleNum) {
        const canvas = this.get('canvas');
        const feature = this.get('model');
        const strokeStyleAttr = `strokeStyle${strokeStyleNum}`;

        if (feature.get('isTextFeature')) {
            this.updateFabricTextObject(
                feature,
                { [strokeStyleAttr]: feature.get(strokeStyleAttr) }
            );

        } else if (feature.get('type') === 'ComponentShape' && strokeStyleAttr === 'strokeStyle1') {
            canvas.setBackgroundStroke(feature);
        } else if (feature.get('isIconFeature') && feature.get('strokeWidth1')) {
            this.changeStrokeWidth(1);
        }
    },

    strokeStyle1Changed () {
        this.changeStrokeStyle(1);
    },

    strokeStyle2Changed () {
        this.changeStrokeStyle(2);
    },

    strokeStyle3Changed () {
        this.changeStrokeStyle(3);
    },

    strokeStyle4Changed () {
        this.changeStrokeStyle(4);
    },

    // Called by each strokeWidthObserver
    changeStrokeWidth (strokeWidthNum) {
        const strokeWidthAttr = `strokeWidth${strokeWidthNum}`;
        const feature = this.get('model');
        const canvas = this.get('canvas');

        feature.setAttributeOnly(strokeWidthAttr, feature.get(strokeWidthAttr));

        if (feature.get('isTextFeature')) {
            this.updateFill(feature);
            this.updateFabricTextObject(
                feature,
                { [strokeWidthAttr]: feature.get(strokeWidthAttr) }
            );
            return;
        }

        const setStrokeParams = (featureStrokeWidth) => (o) => {
            const zeroStrokeWidth = featureStrokeWidth === 0;

            o.set({
                strokeWidth: zeroStrokeWidth ? null : featureStrokeWidth,
                stroke: zeroStrokeWidth ? null : feature.get('strokeStyle1')
            });
        };
        const setStroke = setStrokeParams(feature.get(strokeWidthAttr));

        if (feature.get('type') === 'ComponentShape') {
            canvas.setBackgroundStroke(feature);

        } else if (feature.get('isIconFeature')) {
            const stroke = (o) => {
                setStroke(o);

                if (o.getObjects) {
                    o.getObjects().forEach(stroke);
                }
            };
            const fabObj = canvas.featureFabObjs[feature.get('id')];

            fabObj.forEachObject(stroke);
            canvas.compensateIconBorders(feature, fabObj);
            canvas.render();
        }
    },

    strokeWidth1Changed () {
        this.changeStrokeWidth(1);
    },

    strokeWidth2Changed () {
        this.changeStrokeWidth(2);
    },

    strokeWidth3Changed () {
        this.changeStrokeWidth(3);
    },

    strokeWidth4Changed () {
        this.changeStrokeWidth(4);
    },

    textChanged () {
        const feature = this.get('model');

        feature.setAttributeOnly('text', feature.get('text'));

        this.updateFabricTextObject(
            feature,
            { 'text': feature.get('text').toString().trim() }
        );
    },

    textAttributeChanged (name) {
        const feature = this.get('model');

        feature.setAttributeOnly(name, feature.get(name));

        this.updateFabricTextObject(
            feature,
            { [name]: feature.get(name) }
        );
    },

    lineHeightChanged () {
        //TODO Lineheight property should be disabled if text has only a single line
        // Carry on if feature is of type text

        const canvas = this.get('canvas');
        const fabObj = canvas.featureFabObjs[this.get('model.id')];

        this.textAttributeChanged('lineHeight');

        fabObj.setCoords();
        canvas.render();
    },

    fontSizeChanged () {
        this.textAttributeChanged('fontSize');
    },

    fontChanged () {
        const name = 'fontFamily';
        const feature = this.get('model');

        this.updateFabricTextObject(
            feature,
            { [name]: feature.get(name) }
        );
    },

    letterSpacingChanged () {
        this.textAttributeChanged('letterSpacing');
    },

    textAlignmentChanged () {
        this.textAttributeChanged('textAlignment');
    },

    graphicChanged() {
        const feature = this.get('model');
        const canvas = this.get('canvas');

        canvas.updateGraphic(feature)
            .then(() => {
                // Invalidate graphicLoaded property in order to
                // trigger a rerender on the preview canvas.  Bit of
                // a hack tbh.  Needs more thought.
                feature.set('newGraphicLoaded', guid());
                canvas.drawGrid();
                canvas.render();
            });
    },

    // TODO this observer can only unregister when user leaves the Editor
    deletedChanged: Ember.observer('model.deleted', function () {
        if (!this.get('userIsEditing')) {
            return;
        }

        const feature = this.get('model');
        const canvas = this.get('canvas');

        if (!canvas || !canvas.featureFabObjs) {
            return;
        }

        const fabObj = canvas.featureFabObjs[feature.get('id')];

        if (!fabObj) {
            return;
        }

        fabObj.set({ visible: !feature.get('deleted') });
        canvas.render();
    })
});

function mapByName(collection, name) {
    return collection
        .map((val) => (
            {name: `${name}${val}`, handler: `${name}${val}Changed`}
        ));
}
