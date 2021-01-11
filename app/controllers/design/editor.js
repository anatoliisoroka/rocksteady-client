/* global Detectizr */
import Ember from 'ember';
import config from '../../config/environment';
import rsLogger from '../../lib/rs-logger';
import PrintShapesMixin from '../../mixins/print-shapes';
import FeatureFabricBindingsMixin from '../../components/colour-clash-editor/mixins/features-fabric-bindings';
import FeatureController from './feature';

let IDLE_AUTOSAVE_TIMEOUT = 10 * 1000;

export default Ember.Controller.extend(Ember.Evented, PrintShapesMixin, FeatureFabricBindingsMixin, {
    _userActionService: Ember.inject.service('user-action-service'),
    needs: ['design','design/editor', 'progressBar', 'application', 'design/editor/feature'],

    rsEditorCanvas: null,
    removedFeaturesPanelOn: false,
    activeProperty: null,
    isCanvasRendered: false,
    enableDirtyAttributeObserver: false,
    activeFeature: undefined,
    zoom: 100,
    availableZoomScales: [100, 150, 250, 325],
    bindKeys: true,

    gridOn: Ember.computed.alias('rsEditorCanvas.options.drawGrid'),

    init: function () {

        Ember.run.later(this, function () {
            this.iterateModelAttributes();  // TODO: this appears redundant, remove when certain.
        }, IDLE_AUTOSAVE_TIMEOUT);

        if (Detectizr.device.model === 'ipad') {
            this.get('availableZoomScales').popObject();
        }
    },

    config: function () {
        return config;
    }.property(),

    activePropertyObserver: function () {
        this.set('controllers.application.editorSubPanelOpen', !!this.get('activeProperty'));
    }.observes('activeProperty'),

    isScrollable: Ember.computed('zoom', function () {
        return this.get('zoom') !== 100;
    }),

    iterateModelAttributes: function () {
        // ensure we get notified of a dirty attribute
        // debounce - delay calling before time elapsed. if called again must wait again
        Ember.run.debounce(this, function () {
            if (this.get('model') && this.get('model.fattributes')) {
                this.get('model.fattributes').forEach(function (attribute) {
                    attribute.get('value');
                });
            }
        }, 300);
    }.observes('model.fattributes.length'),

    updateZIndex() {
        const rsEditorCanvas = this.get('rsEditorCanvas');
        const { canvas } = rsEditorCanvas;
        const allFabObjs = canvas.getObjects();

        const zIndexActions = allFabObjs
            .filterBy('emberModelID')
            .reduce((acc, o) => {
                // for each fabobject linked to a feature
                // find fabric index of that position
                // and set the feature model to the new zIndex
                // Also update the RSZIndex property on the fabricObject
                const newZIndex = allFabObjs.indexOf(o);
                const { emberModelID } = o;
                const feature = this.get('model.features')
                    .findBy('id', emberModelID);
                const oldZIndex = feature.get('zIndex');

                feature.set('zIndex', newZIndex);
                o.set({ RSZIndex: newZIndex });

                return acc.concat({ feature, undo: oldZIndex, redo: newZIndex });
            }, []);

        const updateZIndex = (action) => {
            zIndexActions
                .forEach(({ feature, [action]: value }) =>
                    feature.set('zIndex', value)
                );

            const rsEditorCanvas = this.get('rsEditorCanvas');

            rsEditorCanvas.setZIndexPosition();
            rsEditorCanvas.drawGrid();
            rsEditorCanvas.render();
        };

        this.get('_userActionService')
            .appendAction({
                model: this.get('activeFeature'),
                afterActions: {
                    redo: updateZIndex.bind(null, 'redo'),
                    undo: updateZIndex.bind(null, 'undo')
                }
            });
    },

    componentShape: function () {
        return this.get('model.features').filterBy('type', 'ComponentShape').get('firstObject');
    }.property('model.features.@each'),

    currentComponentColour: function () {
        var componentShape = this.get('model.features').filterBy('type', 'ComponentShape');
        return componentShape.get('firstObject.fill');
    }.property('model.features.@each.fill'),

    backgroundStrokeInFront: Ember.computed('activeFeature.position.id', function() {
        const strokeFront1Value =  this.get('activeFeature.position.features')
            .findBy('type', 'ComponentShape')
            .getAttribute('strokeFront1')
            .get('value');

        return strokeFront1Value === '1';
    }),

    backgroundStrokeInBack: Ember.computed.not('backgroundStrokeInFront'),

    moveFeature(actionCallback) {
        const rsEditorCanvas = this.get('rsEditorCanvas');
        const fabObj = rsEditorCanvas.featureFabObjs[this.get('activeFeature.id')];

        actionCallback(fabObj);

        this.updateZIndex();
        rsEditorCanvas.drawGrid();
        rsEditorCanvas.render();
    },

    _removeActiveFeature (feature) {
        feature.set('deleted', true);
        if (feature.get('isIconFeaturePlaceholder')) {
            this.get('model.features').removeObject(feature);
        }
        this.send('setAsActive', this.get('interestingFeatures.firstObject'));
    },

    actions: {
        setZoom (nextZoom) {
            this.set('zoom', nextZoom);
        },

        removePlaceholderGraphics: function () {
            var controller = this;
            var featuresToRemove = [];

            if (controller.get('model.features')) {
                controller.get('model.features').forEach(function (feature) {
                    if (feature && feature.get('isIconFeature') &&
                        feature.getAttribute('icon') &&
                        feature.getAttribute('icon').get('value') &&
                        controller.store.getById('graphic', feature.getAttribute('icon').get('value')).get('isPlaceholder')) {
                        featuresToRemove.push(feature);
                    }
                });

                for (var i = 0; i < featuresToRemove.length; i++) {
                    controller.get('model.features').removeObject(featuresToRemove[i]);
                }
            }
        },

        removeRemovedFeaturesPanel: function (/*feature*/) {
            var controller = this;

            Ember.run(function () {
                controller.set('removedFeaturesPanelOn', false);
            });
        },

        setAsActive: function (feature) {
            if (this.get('activeFeature') !== feature) {
                this.set('featureActive', false);
                this.replaceRoute('design.editor.feature', feature);
            }
        },

        activate: function (feature) {
            var controller = this;

            if (feature && feature.get('isDestroyed')) {
                rsLogger.warn(
                    'ActivateDestroyedFeatureWarning',
                    `Tried to activate a destroyed feature: ${feature ? feature.toString() : '?'}`
                );
                return;
            }

            this.get('model.features').filterBy('active', true).forEach(function (anotherFeature) {
                if (anotherFeature && !anotherFeature.get('isDestroyed')) {
                    anotherFeature.set('active', false);
                }
            });

            if (!feature) {
                this.get('interestingFeatures').forEach(function (anotherFeature) {
                    if (anotherFeature && !anotherFeature.get('isDestroyed')) {
                        controller.send('activate', anotherFeature);
                    }
                });
            } else {
                feature.set('active', true);
                this.set('featureActive', true);
                // when changing feature, hide subpanel if showing.
                this.send('backToMainPanel');
                this.set('activeFeature', feature);
            }
        },

        backToMainPanel: function () {
            this.set('activeProperty', null);
        },

        addGraphic () {
            const appController = this.get('controllers.application');
            const designController = this.get('controllers.design');

            appController.send('pushSpinner');

            designController.getPlaceholderGraphic().then((placeholderGraphic) => {
                const position = this.get('model');
                const newFeature = this.basicFeature('GraphicIcon', 'User Added Graphic');
                const shapeArea = this.get('model.activeShape.area');
                const placeholderArea = 143 * 143; // Placeholder and all SVGs in product are normalised 143*143 px
                // Where an icon is added at scale 1 on the Kawasaki KX250F FNP
                const scale = Math.sqrt(0.035 * (shapeArea / placeholderArea));

                newFeature.setAttribute('scale', scale);
                newFeature.setAttribute('icon', placeholderGraphic.get('id'));
                newFeature.setAttribute('fill', this.backgroundFill(position).get('firstObject.contrastingId'));
                newFeature.setAttribute('strokeWidth1', 0);
                newFeature.setAttribute('strokeStyle1', 1);

                const designerColours = designController.get('kitColours').mapBy('id');
                newFeature.getAttribute('fill').set('designer', designerColours);

                const designerIcons = designController.get('model.usableGraphics').mapBy('id');
                newFeature.getAttribute('icon').set('designer', designerIcons);

                this.get('_userActionService')
                    .appendAction({
                        model: newFeature,
                        owner: 'feature',
                        changes: [{ name: 'deleted', values: { undo: true, redo: false } }],
                        afterActions: {
                            undo: () => this.send('setAsActive', this.get('interestingFeatures.firstObject'))
                        }
                    });

                position.get('features').pushObject(newFeature);
                designController.get('model.features').pushObject(newFeature);

                // set new Graphic Feature as active in property panel.
                this.send('setAsActive', newFeature);

                // Ensure removedFeatures Palette is closed.
                this.set('removedFeaturesPanelOn', false);

                this.get('rsEditorCanvas').updateGraphic(newFeature);
            }, (errorResponse) => {
                rsLogger.error('AddGraphicError', errorResponse);
                appController.send('showApplicationError', errorResponse);
            }).finally(() =>
                appController.send('popSpinner')
            );
        },

        addText () {
            const position = this.get('model');
            const rsEditorCanvas = this.get('rsEditorCanvas');
            const newFeature = this.basicFeature('Text', 'User Added Text');

            newFeature.setAttribute('text', this.get('i18n').t('editor.edit_text_feature_textarea'));
            newFeature.setAttribute('textAlignment', 'left');
            newFeature.setAttribute('lineHeight', 1);

            const colour = this.backgroundFill(position);
            //  This should be the contrast for the background
            newFeature.setAttribute('fill', colour.get('firstObject.contrastingId'));

            const shapeArea = this.get('model.activeShape.area');
            const textScale = 35;
            const newFontSize = parseInt(Math.sqrt(shapeArea / textScale));

            newFeature.setAttribute('fontSize', newFontSize);

            const designController = this.get('controllers.design');
            const defaultFont = designController.get('model.fonts.firstObject');

            newFeature.setAttribute('fontFamily', defaultFont.get('id'));
            newFeature.setAttribute('strokeWidth1', 0);
            newFeature.setAttribute('strokeStyle1', 1);
            newFeature.setAttribute('strokeWidth2', 0);
            newFeature.setAttribute('strokeStyle2', 1);
            newFeature.setAttribute('strokeWidth3', 0);
            newFeature.setAttribute('strokeStyle3', 1);
            newFeature.setAttribute('strokeWidth4', 0);
            newFeature.setAttribute('strokeStyle4', 1);
            newFeature.setAttribute('letterSpacing', 1);

            //   panel-feature-controller expects this to be set
            //
            //   We need to add the designerObjects for user added features
            //   The kitColours method returns designer and rule colours combined
            //

            const designerColours = designController.get('kitColours').mapBy('id');

            newFeature.getAttribute('fill').set('designer', designerColours);
            newFeature.getAttribute('strokeStyle1').set('designer', designerColours);
            newFeature.getAttribute('strokeStyle2').set('designer', designerColours);
            newFeature.getAttribute('strokeStyle3').set('designer', designerColours);
            newFeature.getAttribute('strokeStyle4').set('designer', designerColours);

            const designerFonts = designController.get('kitFonts').mapBy('id');
            newFeature.getAttribute('fontFamily').set('designer', designerFonts);

            this.get('_userActionService')
                .appendAction({
                    model: newFeature,
                    owner: 'feature',
                    changes: [{ name: 'deleted', values: { undo: true, redo: false } }],
                    afterActions: {
                        redo: () => this.set('controllers.design/editor/feature.isEditTextAreaVisible', false),
                        undo: () => this.send('setAsActive', this.get('interestingFeatures.firstObject'))
                    }
                });

            designController.get('model.features').pushObject(newFeature);
            position.get('features').pushObject(newFeature);

            rsEditorCanvas.createText(newFeature);
            rsEditorCanvas.data.get('model.features').pushObject(newFeature);

            // set new Text Feature as active in property panel.
            this.send('setAsActive', newFeature);

            // Ensure removedFeatures Palette is closed.
            this.set('removedFeaturesPanelOn', false);

            Ember.run.later(null, () => this.trigger('editingText'), 0);

            this.get('rsEditorCanvas').render();
        },

        showRemovedFeatures: function () {
            this.toggleProperty('removedFeaturesPanelOn');
        },

        removeActiveFeature () {
            const feature = this.get('activeFeature');

            if (!feature.get('canModify')) {
                return;
            }

            this.get('_userActionService')
                .appendAction({
                    model: feature,
                    owner: 'feature',
                    changes: [{ name: 'deleted', values: { undo: false, redo: true } }],
                    afterActions: {
                        redo: () => this._removeActiveFeature(feature),
                        undo: () => this.send('setAsActive', this.get('interestingFeatures.firstObject'))
                    }
                });
            this._removeActiveFeature(feature);
        },

        cloneActiveFeature: function () {
            this.get('controllers.application').send('pushSpinner');

            var feature = this.get('activeFeature'),
                position = this.get('model'),
                rsEditorCanvas = this.get('rsEditorCanvas'),
                canvas = this.get('rsEditorCanvas').canvas,
                frontMostFeature = position.get('frontMostFeature'),
                zIndex = (frontMostFeature ? frontMostFeature.get('zIndex') : canvas.getObjects().length) + 1,
                featureController = FeatureController.create({
                    model: feature,
                    container: this.container,
                    store: this.store
                }),
                clonedFeature = featureController.clone();

            if (clonedFeature) {
                clonedFeature.set('zIndex', zIndex);

                position.get('features').pushObject(clonedFeature);
                this.get('controllers.design.model').get('features').pushObject(clonedFeature);

                if (feature.get('isTextFeature')) {
                    rsEditorCanvas.createText(clonedFeature);
                }

                this.send('setAsActive', clonedFeature);

                if (clonedFeature.get('isIconFeature')) {
                    this.get('rsEditorCanvas').updateGraphic(clonedFeature);
                }

                this.get('_userActionService')
                    .appendAction({
                        model: clonedFeature,
                        owner: 'feature',
                        changes: [{ name: 'deleted', values: { undo: true, redo: false } }],
                        afterActions: {
                            undo: () => this.send('setAsActive', this.get('interestingFeatures.firstObject'))
                        }
                    });

                this.get('rsEditorCanvas').render();
            }

            this.get('controllers.application').send('popSpinner');
        },

        featureBackwards() {
            this.moveFeature((fabObj) => {
                fabObj.sendBackwards();
                fabObj.sendBackwards();
                if (this.get('backgroundStrokeInBack')) {
                    fabObj.sendBackwards();
                    fabObj.bringForward();
                }
                fabObj.bringForward();
            });
        },

        featureToBack() {
            this.moveFeature((fabObj) => {
                fabObj.sendToBack();
                fabObj.bringForward();
                if (this.get('backgroundStrokeInBack')) {
                    fabObj.bringForward();
                }
            });
        },

        featureForwards() {
            this.moveFeature((fabObj) => {
                fabObj.bringForward();
                if (this.get('gridOn')) {
                    fabObj.bringForward();
                    if (this.get('backgroundStrokeInFront')) {
                        fabObj.bringForward();
                        fabObj.sendBackwards();
                    }
                    fabObj.sendBackwards();
                } else {
                    if (this.get('backgroundStrokeInFront')) {
                        fabObj.bringForward();
                        fabObj.sendBackwards();
                    }
                }
            });
        },

        featureToFront() {
            this.moveFeature((fabObj) => {
                fabObj.bringToFront();
                if (this.get('backgroundStrokeInFront')) {
                    fabObj.sendBackwards();
                }
                if (this.get('gridOn')) {
                    fabObj.sendBackwards();
                }
            });
        }
    },

    basicFeature: function (fType, fName) {
        var position = this.get('model');
        var component = position.get('activeComponent');
        var featurePosition = this.getDefaultFeaturePosition(component);

        var canvas = this.get('rsEditorCanvas.canvas');
        var frontMostFeature = position.get('frontMostFeature');
        var zIndex = (frontMostFeature ? frontMostFeature.get('zIndex') : (canvas ? canvas.getObjects().length : 0)) + 1;

        var featureController = FeatureController.create({
            model: this.get('activeFeature'),
            container: this.container,
            store: this.store
        });

        return featureController.createBasicFeature(fType, fName, position, zIndex, featurePosition.left, featurePosition.top);
    },

    //
    //   Get the Colour for the Background Fill of a given position
    //
    backgroundFill: function (position) {
        //
        //   Find the background fill colour
        //
        var currentFeatures = position.get('features');

        var background = currentFeatures.filter(function (item) {
            return item.get('name') === 'Background';
        });

        var background_fill = background.get('firstObject.fill');

        var colour = this.store.all('colour').filter(function (item) {
            return item.get('displayRgb') === background_fill;
        });

        return colour;
    },

    deletedFeatures: Ember.computed.filterBy('model.features', 'deleted'),

    //
    //   Return a list of all features which can be displayed but
    //   don't include the boring background unless it is the
    //   only one available
    //
    interestingFeatures: function () {

        var features = Ember.ArrayController.create({
            content: this.get('model.features')
                .filterBy('deleted', false)
                .rejectBy('isDestroyed', true)
                .rejectBy('isTextAndEmpty', true)
                .rejectBy('type', 'QRON'),
            sortProperties: ['zIndex'],
            sortAscending: false
        }).get('arrangedContent');

        return features;
    }.property('model.features.@each.deleted', 'model.features.length', 'model.features.@each.isTextAndEmpty'),

    nextFeature: function () {
        // return the interesting feature after the active feature

        if (this.get('activeFeature') === this.get('interestingFeatures.lastObject')) {
            return this.get('interestingFeatures.firstObject');
        }

        var nextObject;

        this.get('interestingFeatures').forEach(function (item, index) {
            if (Ember.isEqual(item, this.get('activeFeature'))) {
                nextObject = this.get('interestingFeatures')[index + 1];
            }
        }.bind(this));

        if (!nextObject) {
            nextObject = this.get('activeFeature');
        }

        return nextObject;
    }.property('interestingFeatures', 'activeFeature'),

    getDefaultFeaturePosition: function (component) {
        var rsEditorCanvas = this.get('rsEditorCanvas'),
            path,
            componentCenterX = 0, componentCenterY = 0;

        if (!rsEditorCanvas) {
            return {left: 0, top: 0};
        }

        if (rsEditorCanvas.componentFabObjs) {
            var componentFabObj = rsEditorCanvas.componentFabObjs[component.get('id')];

            if (!componentFabObj) {
                return {left: 0, top: 0};
            }

            path = componentFabObj.getObjects()[0];
            componentCenterX = path.width / 2;
            componentCenterY = path.height / 2;
        }

        if (component.get('activeShape.initialFeaturePosition') && component.get('activeShape.initialFeaturePosition') === 'last') {

            var lastFeature;

            if (this.get('activeFeature') && this.get('activeFeature.type') !== 'ComponentShape') {
                lastFeature = this.get('activeFeature');
            } else {
                lastFeature = component
                    .get('position.features')
                    .reject(function (item) {
                        return item.get('type') === 'ComponentShape';
                    })
                    .get('lastObject');
            }

            if (lastFeature) {
                return {left: lastFeature.get('left'), top: lastFeature.get('top')};
            }
        }

        return {left: componentCenterX, top: componentCenterY};
    },

    askParentControllerToSave: function () {

        this.get('controllers.design').startSaveTimer({
            from: 'editor',
            delay: IDLE_AUTOSAVE_TIMEOUT
        });
    },

    propagateUserEdit () {  // called 5 times on editor init
        // FIXME this is for mirroring
        // this controls setting dirty properties and triggers the mirror prompt
        if (this.get('model.fattributes').isAny('isDirty') || this.get('model.features').isAny('isDirty')) {
            this.get('model').send('becomeDirty');   // TODO: this is probably not in use anymore
        }

        const modelIsNotSaving = !this.get('controllers.design.model.isSaving');

        if (this.get('enableDirtyAttributeObserver') && modelIsNotSaving) {
            this.askParentControllerToSave();
        }
    }
});
