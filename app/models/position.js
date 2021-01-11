import Ember from 'ember';
import DS from 'ember-data';

export default DS.Model.extend({

    name: DS.attr('string'),
    x: DS.attr('number'),
    y: DS.attr('number'),
    rotation: DS.attr('number'),
    width: DS.attr('number'),
    height: DS.attr('number'),
    components: DS.hasMany('component'),
    component: DS.belongsTo('component'), // the component coming down the line, use activeComponent or defaultComponent instead
    design: DS.belongsTo('design'),
    features: DS.hasMany('feature'),
    isRegulated: DS.attr('boolean'),
    grouping: DS.attr('number'),
    defaultComponent: DS.belongsTo('component'),
    activeComponent: Ember.computed.alias('component'),
    activeShape: Ember.computed.alias('activeComponent.activeShape'),
    covered:            false, // is position covered by a non-shareable shape from another position
    corrupt:            false, // has been marked as 'corrupt'
    fattributes: function () {
        return this.get('design.fattributes').filterBy('position', this);
    }.property('design.fattributes.length'),

    initComponent: function () {
        if (!this.get('_initialized') && this.get('design')) {
            this.setActiveShape(this.get('activeComponent'), this.get('activeComponent.activeShape'));
            this.set('_initialized', true);
        }
    }.observes('component', 'components', 'design'),

    hasActiveComponent: function () {
        return this.get('activeComponent') !== null;
    }.property('activeComponent'),

    alternativeComponents: function () {

        return this.get('components').filter(function (component) {
            return component.get('id') !== this.get('activeComponent.id');
        }.bind(this));

    }.property('components', 'activeComponent'),

    hasAlternatives: function () {

        return !Ember.isEmpty(this.get('alternativeComponents')) ||
            !Ember.isEmpty(this.get('activeComponent.alternativeShapes'));

    }.property('alternativeComponents.length', 'activeComponent', 'activeComponent.alternativeShapes.length'),

    price: Ember.computed.alias('activeComponent.totalPrice'),

    deactivate: function () {
        this.set('activeComponent', null);
    },

    mayContainShape: function (shape) {

        return this.get('components').any(function (component) {

            return component.get('activeShape') === shape  ||

            component.get('alternativeShapes').any(function (alternativeShape) {
                return (alternativeShape === shape);
            });

        });
    },

    isIncluded: function () {
        return this.get('hasActiveComponent') && !this.get('covered') && !this.get('corrupt');
    }.property('activeComponent', 'covered', 'corrupt'),

    isEditable: Ember.computed.not('covered'),

    componentShapes: function () {
        var as = Ember.A(),
            positionId = this.get('id');

        if (this.get('activeComponent')) {
            as.push({component: this.get('activeComponent'), shape: this.get('activeComponent.activeShape')});

            this.get('activeComponent.alternativeShapes').forEach(function (alternativeShape) {
                as.push({component: this.get('activeComponent'), shape: alternativeShape});
            }.bind(this));
        }

        this.get('alternativeComponents').forEach(function (component) {
            as.push({component: component, shape: component.get('activeShape')});

            component.get('alternativeShapes').forEach(function (alternativeShape) {
                as.push({component: component, shape: alternativeShape});
            }.bind(this));
        }.bind(this));

        as.forEach(function (componentShape, i) {
            if (!componentShape.shape.get('positionsIndex')) {
                componentShape.shape.set('positionsIndex', {});
            }

            if (!(positionId in componentShape.shape.get('positionsIndex'))) {
                componentShape.shape.get('positionsIndex')[positionId] = i;
            }

            if (!componentShape.index) {
                componentShape.index = componentShape.shape.get('positionsIndex')[positionId];
            }
        });

        return as;
    }.property('activeComponent', 'activeComponent.activeShape', 'alternativeComponents'),

    getComponentShapeAtIndex: function (index) {
        var positionId = this.get('id');

        return this.get('componentShapes').filter(function (componentShape) {
            return (componentShape.shape.get('positionsIndex') && componentShape.shape.get('positionsIndex')[positionId] === index);
        }).get('firstObject');
    },

    hasAlternativeShapes: Ember.computed.gt('componentShapes.length', 1),

    setDefaultShape: function () {
        this.setActiveShape(this.get('defaultComponent'), this.get('defaultComponent.defaultShape'));
    },

    setActiveShape: function (component, shape) {
        if (!shape || !component) {
            return;
        }

        if (!shape.get('shareable')) {
            if (component.get('position.design.positions')) {
                component.get('position.design.positions').forEach(function (position) {
                    if (position !== component.get('position') && position.mayContainShape(shape)) {
                        position.set('covered', true);
                    }
                });
            }
        } else {
            var shapeToCheck = this.get('activeComponent.activeShape') || component.get('activeShape');

            if (component.get('position.design.positions')) {
                component.get('position.design.positions').forEach(function (position) {
                    if (position !== component.get('position') && position.mayContainShape(shapeToCheck)) {
                        position.set('covered', false);
                    }
                }.bind(this));
            }
        }

        this.set('activeComponent', component);

        // FIXME - dmcnamara: two hacks below to convince ember about our model
        // relationships. careful now.

        if (this.get('activeComponent') !== component) {
            this.set('activeComponent', component);
            this.get('components').forEach(function (component) {
                component.set('position', this);
            }.bind(this));
        }

        if (component.get('activeShape') !== shape) {
            var prevActiveShape = component.get('activeShape');
            component.set('activeShape', shape);
            prevActiveShape.get('components').pushObject(component);
        }
    },

    frontMostFeature: function () {
        return this.get('features').sortBy('zIndex').get('lastObject');
    }.property('features.@each.zIndex'),

    usedColours: function () {
        let colours = this.get('design.colours');

        let usedColours = this.get('fattributes')
            .filterBy('isColour')
            .filterBy('isEnabled')
            .filterBy('feature.deleted', false)
            .filter(function (fattribute) {
                return fattribute.get('value') !== '';
            })
            .map(function (fattribute) {
                let colourId = fattribute.get('value') + '';
                let colour = colours.findBy('id', colourId);
                return {
                    feature: fattribute.get('feature'),
                    fattribute: fattribute,
                    attributeKey: fattribute.get('key'),
                    colour: colour,
                    colourId: colourId
                };
            }, this);

        return usedColours;
    }.property('fattributes.@each.content', 'features.@each.deleted')
});
