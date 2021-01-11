/* global logger */

import Ember from 'ember';

export default Ember.Controller.extend({

    needs: ['application', 'design/selector', 'design'],

    isPositionActive: Ember.computed.alias('model.hasActiveComponent'),
    hasAlternativeShapes: Ember.computed.alias('model.hasAlternativeShapes'),
    isTargetCategoryKit: Ember.computed.alias('controllers.design.model.isTargetCategory'),

    canMirrorFeatures: Ember.computed.and('oppositePosition', 'model.isIncluded'),

    designHasPositionGroupings: function () {
        return this.get('model.design.positions').any(function (position) {
            return !!position.get('grouping');
        });
    }.property('model.design.positions.@each.grouping'),

    oppositePosition: function () {

        if (this.get('designHasPositionGroupings')) {
            if (this.get('model.grouping')) {
                return this.get('model.design.positions')
                    .filterBy('grouping', this.get('model.grouping'))
                    .without(this.get('model'))
                    .get('firstObject');
            } else {
                return;
            }
        }

        var xpositions = this.get('model.design.positions')
            .filterBy('x', this.get('model.x'))
            .sortBy('y');

        var thisPosition = this.get('model');

        var indexOfThisPosition = xpositions.reduce(function (previousValue, xp, index) {
            return (xp === thisPosition ? index : previousValue);
        }, -1);

        if (xpositions.get('length') === 0 || indexOfThisPosition === -1 || xpositions.get('length') - 1 - indexOfThisPosition === indexOfThisPosition) {
            // middle position has no opposite
            return;
        }

        var indexOfOppositePosition = xpositions.get('length') - 1 - indexOfThisPosition;

        var oppositePosition = xpositions[indexOfOppositePosition];

        if (oppositePosition.get('covered') || oppositePosition.get('corrupt')) {
            return;
        }

        return oppositePosition;

    }.property('model.design.positions.length', 'model.design.positions.@each.isIncluded'),

    usedColours: function () {
        var controller = this,
            colours = Ember.A();

        this.get('model.features').forEach(function (f) {
            Ember.A(['fill', 'strokeStyle1', 'strokeStyle2', 'strokeStyle3', 'strokeStyle4']).forEach(function (a) {
                var fattribute = f.getAttribute(a);

                if (fattribute && fattribute.get('value')) {
                    var col = controller.store.getById('colour', fattribute.get('value'));

                    if (!col) {
                        logger.warn('MissingColourWarning', 'Could not find the colour \'' + fattribute.get('value') + '\' for feature ' + f.toString() + ' attribute ' + fattribute.toString());
                    } else {
                        colours.push(col);
                    }
                }
            });
        });

        colours = colours.uniq();

        return colours;
    }.property('features.@each.fill',
        'features.@each.strokeStyle2',
        'features.@each.strokeStyle1',
        'features.@each.strokeStyle1',
        'features.@each.strokeStyle1'),

    addPosition: function () {
        var controller = this;

        return this.get('controllers.application').runWithSpinner(this, function () {
            if (this.get('model.isEditable')) {
                var defaultComponent = controller.get('model.defaultComponent');

                if (defaultComponent) {
                    defaultComponent.set('quantity', 1);
                    controller.get('model').set('activeComponent', defaultComponent);
                } else {
                    logger.warn('MissingDefaultComponentWarning', 'Missing default component on position ' + controller.get('model').toString());
                }
            }
        });
    },

    removePosition: function () {
        var controller = this;

        return this.get('controllers.application').runWithSpinner(this, function () {
            controller.get('model').deactivate();
        });
    },

    setAlternativeShape: function (component, shape) {
        this.layoutFeaturesForNewShape(shape);
        this.get('model').setActiveShape(component, shape);
    },

    layoutFeaturesForNewShape: function (shape) {
        // task 955 - move features in this position so that they fit better on the new shape

        var oldShapeWidth = this.get('model.activeShape.width'),
            oldShapeHeight = this.get('model.activeShape.height'),
            newShapeWidth = shape.get('width'),
            newShapeHeight = shape.get('height');

        if (!oldShapeWidth || !newShapeWidth) {
            return;
        }

        this.get('model.features').forEach(function (feature) {

            if (!feature.get('canModify')) {
                return;
            }

            var left = feature.get('left'),
                top = feature.get('top'),
                relativeLeft = left / oldShapeWidth,
                relativeTop = top / oldShapeHeight,
                relativeSize = newShapeWidth / oldShapeWidth;

            // 1. Move features to new coordinates based on new shapes size

            feature.setAttribute('left', relativeLeft * newShapeWidth);
            feature.setAttribute('top', relativeTop * newShapeHeight);

            // 2. Re-size features when alternative shape selected. The idea
            //    here is that the features should be re-sized, so that if the
            //    user selects a new shape the design will look exactly the
            //    same or as close as possible to the original shape. The
            //    features should be re-sized to the difference between the
            //    size of the shapes.

            if (feature.get('type') === 'GraphicIcon') {
                var newScale = (feature.get('scale') * relativeSize);

                if ((newScale > feature.get('scale') && feature.get('canIncreaseScale')) ||
                    newScale < feature.get('scale')) {
                    feature.setAttribute('scale', newScale.toFixed(1));
                }
            }

            if (feature.get('type') === 'Text') {
                feature.setAttribute('fontSize', (feature.get('fontSize') * relativeSize).toFixed(0));
            }

        });

    },

    actions: {

        showAlternativeShapes: function () {
            this.replaceRoute('design.position.alternatives');
        }

    }
});
