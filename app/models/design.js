/* global moment */

import Ember from 'ember';
import DS from 'ember-data';
import Interview from './interview';
import FontController from '../controllers/design/font';
import config from '../config/environment';
import logger from '../lib/rs-logger';

export default Interview.extend({
    description: DS.attr('string'),
    width: DS.attr('number'),
    height: DS.attr('number'),
    fonts: DS.hasMany('font', {async: true}),
    colours: DS.hasMany('colour', {async: false}),
    positions: DS.hasMany('position'),
    components: DS.hasMany('component'),
    features: DS.hasMany('feature'),
    personalFeatures: DS.hasMany('personalFeature'),
    graphics: DS.hasMany('graphic', {async: true}),
    fattributes: DS.hasMany('fattribute'),
    shapes: DS.hasMany('shape'),
    manufacturers: DS.hasMany('manufacturer'),
    decals: DS.hasMany('decal'),
    createdDate: DS.attr('string'), // ISO8601 for future ember data compatibility
    lastModifiedDate: DS.attr('string'),
    isTargetCategory: DS.attr('boolean'),
    user: DS.belongsTo('user'),
    lastPrintRequestId: DS.attr('string'),
    currency: DS.belongsTo('currency'),
    regulation_id: DS.attr('raw'),
    builtWithAppVersion: DS.attr('string'),
    locale: DS.attr('string'),
    hasPromptedToSave: DS.attr('boolean'),
    theme: DS.belongsTo('theme'),
    revision: DS.attr('number'),
    uses: DS.attr('raw'),
    doNotShowAutoMirrorAgain: DS.attr('boolean'),
    builtWithFeatures: DS.hasMany('feature'),
    cumulativeDesignTime: DS.attr('number'),
    usePath: function () {
        return this.get('uses') ? this.get('uses').join('|') : '';
    }.property('uses'),
    usableGraphics: function () {
        return this.get('graphics').rejectBy('isPlaceholder', true);
    }.property('graphics.@each', 'graphics.length'),
    mostInterestingPosition: function () {

        // The most interesting position is defined as being the closest to the
        // center with a large skew on the y-axis.  i.e. aim to return the
        // front number plate

        var design = this,
            closestPosition = this.get('activePositions.firstObject'),
            minDist = -1,
            calcDistanceFromCentre = function (position) {
                return Math.sqrt(
                    Math.pow(position.get('x') - design.get('width') / 2, 2) +
                    Math.pow(position.get('y') - design.get('height') / 2, 2) * 10
                );
            };

        this.get('activePositions').forEach(function (position) {
            var d = calcDistanceFromCentre(position);

            if (minDist === -1 || d < minDist) {
                minDist = d;
                closestPosition = position;
            }
        });

        return closestPosition;
    }.property('activePositions.length'),
    furthestRightPosition: function () {
        return this.get('activePositions').reduce(function (previous, position) {
            return (position.get('x') > previous.get('x') ? position : previous);
        }, this.get('activePositions.firstObject'));
    }.property('activePositions.@each.x'),
    activeComponents: function () {
        return this.get('positions').filterBy('isIncluded', true).mapBy('activeComponent');
    }.property('positions.@each.isIncluded', 'components.@each.isActive'),
    activePositions: function () {
        return this.get('positions').filterBy('isIncluded', true);
    }.property('positions.@each.isIncluded'),
    uncoveredPositions: function () {
        return this.get('positions').filterBy('covered', false);
    }.property('positions.@each.isIncluded'),
    positionsWithNonDefaultShapes: function () {

        return this.get('positions').filter(function (position) {

            if (position.get('defaultComponent') !== position.get('activeComponent')) {
                return true;
            }

            if (position.get('activeComponent.activeShape') !== position.get('activeComponent.defaultShape')) {
                return true;
            }

            return false;

        });

    }.property('positions.@each.activeComponent', 'positions.@each.activeShape'),
    activeShapes: function () {

        return this.get('activeComponents').map(function (component) {
            return {
                component: component,
                shape: component.get('activeShape')
            };
        });
    }.property('positions.@each.isIncluded', 'positions.@each.activeComponent', 'components.@each.isActive', 'components.@each.activeShape'),
    euroBasePrice: function () {
        var _return = this.get('activeComponents').reduce(function (sum, component) {
            return sum + component.get('totalPrice');
        }, 0);

        return Math.ceil(_return * 100) / 100;
    }.property('components.@each.price', 'components.@each.quantity', 'components.@each.activeShape', 'components.@each.activeDecal', 'activeComponents', 'theme.price'),
    euroPrice: Ember.computed.alias('euroBasePrice'),
    euroTotalPrice: function () {
        var _return = this.get('euroBasePrice');

        if (parseFloat(this.get('theme.price'))) {
            _return += _return * parseFloat(this.get('theme.price'));
        }

        return _return;
    }.property('euroBasePrice', 'theme.price'),
    euroDiscountedTotalPrice: null,
    euroDiscountedBasePrice: null,
    localBasePrice: function () {
        return (this.get('euroBasePrice') * this.get('currency.fxRate'));
    }.property('euroBasePrice', 'currency'),
    localTotalPrice: function () {
        return (this.get('euroTotalPrice') * this.get('currency.fxRate'));
    }.property('euroTotalPrice', 'currency'),
    localStorageKey: function () {
        return 'design.' + this.get('id');
    }.property('id'),
    initUserFlagValue() {
        const userFlagFeature = this
            .get('personalFeatures')
            .find((feat) => feat.get('name') === 'User Flag');

        if (!userFlagFeature) {
            return;
        }

        userFlagFeature.set(
            'value',
            this.get('store')
                .getById('region', userFlagFeature.get('value'))
                .get('graphicId')
        );
    },
    prioritizeColours() {
        const prioritized = ['White', 'Black', 'Aluminium']
            .map((name) => this.get('colours').findBy('name', name));

        this.get('colours')
            .removeObjects(prioritized)
            .unshiftObjects(prioritized);
    },
    firstBuild: function () {
        this.set('createdDate', moment().toISOString());
        this.set('lastModifiedDate', this.get('createdDate'));
        this.set('builtWithAppVersion', config.APP.version);
        this.set('revision', 0);
        this.set('cumulativeDesignTime', 0);
        this.initUserFlagValue();
        this.prioritizeColours();
    },
    prepareForRender: function () {
        var design = this;

        // Ensure features have attribute properties set
        this.get('features').forEach(function (feature) {
            feature.prepareForRender();
        });

        // Destroy 'phantom' shapes that seem to randomly appear
        this.get('shapes').forEach(function (shape) {
            if (!shape.get('width')) {
                shape.destroy();
            }
        });

        this.get('colours').forEach(function (colour) {
            if (colour && !colour.get('isValid')) {
                logger.warn('InvalidColourWarning', 'Removed invalid colour \'' + colour.get('displayRgb') + '\' from the design.');
                design.get('colours').removeObject(colour);
            }
        });

        this.get('fonts').forEach(function (font) {
            FontController.create({model: font}).prerenderSwatch();
        });
    },
    didUpdate: function () {
        this.get('fattributes').forEach(function (attribute) {
            if (attribute.get('isDirty')) {
                attribute.save();
            }
        });
    },
    isComplete: function () {
        return this.get('shapes').every(function (shape) {
            if (shape.get('decal_prices.length') === 0) {
                logger.warn('DecalPricesMissingWarning', 'Shape ' + shape.get('internal_id') + ' is missing decal prices.');
            }
            return shape.get('decal_prices.length') > 0;
        });

    }.property('shapes.@each.decal_prices'),
    isRegulated: function () {
        return this.get('useCategory') || this.get('uses') || this.get('ruleSet');
    }.property('useCategory', 'uses', 'ruleSet'),
    hasThemeRegulationConflict: function () {

        if (!this.get('theme') || !this.get('isRegulated') || !this.get('theme.isRegulated')) {
            return false;
        }

        return (this.get('useCategory.name') !== this.get('theme.useCategoryName') ||
            this.get('usePath') !== this.get('theme.usePath') ||
            this.get('ruleSet.name') !== this.get('theme.ruleSetName'));

    }.property('theme', 'theme.isRegulated', 'useCategory', 'usePath', 'ruleSet'),

    usedColours: function () {

        let usedColours = this.get('fattributes')
            .filterBy('isColour')
            .filterBy('isEnabled')
            .filterBy('feature.deleted', false)
            .filterBy('position.isIncluded')
            .filterBy('feature.multicoloured', false)
            .map(function (fattribute) {
                let colourId = fattribute.get('value') + '';
                let colour = this.get('colours').findBy('id', colourId);

                // Defense against kits with missing colours
                if (colour) {
                    return {
                        feature: fattribute.get('feature'),
                        fattribute: fattribute,
                        attributeKey: fattribute.get('key'),
                        colour: colour,
                        colourId: colourId
                    };
                } else {
                    logger.warn('DesignColourMissing', 'Missing colour in design');
                }
            }, this)
            .compact();

        usedColours = usedColours.compact();

        return usedColours;
    }.property('fattributes.@each.value', 'positions.@each.isIncluded', 'features.@each.deleted'),

    usedColoursAccentColourGroups: function () {
        let usedColours = this.get('fattributes')
            .filterBy('isColour')
            .filterBy('isEnabled')
            .filterBy('position.isIncluded')
            .filterBy('feature.multicoloured', false)
            .filter((fattribute) => {
                let isBackground = fattribute.get('feature.isBackgroundFeature');
                let designCategory = fattribute.get('feature.designCategory');
                return isBackground || (designCategory === 'Fill' || designCategory === 'Design Element');
            })
            .map(function (fattribute) {
                let colourId = fattribute.get('value') + '';
                let colour = this.get('colours').findBy('id', colourId);

                // Defense against kits with missing colours
                if (colour) {
                    return {
                        feature: fattribute.get('feature'),
                        fattribute: fattribute,
                        attributeKey: fattribute.get('key'),
                        colour: colour,
                        colourId: colourId
                    };
                } else {
                    logger.warn('DesignColourMissing', 'Missing colour in design');
                }
            }, this)
            .compact();

        return usedColours;
    }.property('fattributes.@each.value', 'positions.@each.isIncluded'),

    personalPromptedFeaturesMappedToFeatures: Ember.computed(
        'features.@each.deleted',
        'positions.@each.isIncluded',
        function () {
            return this
                .get('personalFeatures')
                .filterBy('active', true)
                .filterBy('prompted', true)
                .mapBy('name')
                .reduce((features, name) => {
                    const designFeature = this.get('features')
                        .filterBy('deleted', false)
                        .filterBy('position.isIncluded', true)
                        .findBy('name', name);
                    return designFeature ? [...features, designFeature] : features;
                }, []);
        }
    )
});
