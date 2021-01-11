/* globals logger */

import DS from 'ember-data';
import Ember from 'ember';

export default DS.Model.extend({

    position: DS.belongsTo('position', { inverse: 'components' }),
    name: DS.attr('string'),
    shape: DS.belongsTo('shape'),
    decals: DS.hasMany('decal'),
    shapes: DS.hasMany('shape'),
    quantity: DS.attr('number'),
    design: DS.belongsTo('design'),
    manufacturer: DS.belongsTo('manufacturer'),
    defaultShape: DS.belongsTo('shape'),
    activeShape: Ember.computed.alias('shape'),
    activeDecal: DS.belongsTo('decal', { async: true }),

    didLoad: function () {
        this.set('quantity', 1);
    },

    initDecal: function () {
        if (!this.get('activeDecal.id')) {
            this.setEconomyDecal();
        }
    }.observes('activeDecal'),

    setPremiumDecal: function () {
        var component = this,
            premiumDecalPrice = 0,
            premiumDecal;

        if (this.get('activeShape.decal_prices')) {
            this.get('activeShape.decal_prices').forEach(function (decalPrice) {
                if (decalPrice.price > premiumDecalPrice) {
                    premiumDecalPrice = decalPrice.price;
                    premiumDecal = component.store.getById('decal', decalPrice.decal_id);
                }
            });
        }

        component.set('activeDecal', premiumDecal);
    },

    setEconomyDecal: function () {
        var component = this,
            economyDecalPrice = -1,
            economyDecal;

        if (!this.get('activeShape.decal_prices')) {
            return logger.error('MissingDecalPricesWarning', 'Component ' + this.toString() + ' has an active shape with missing decal prices');
        }

        this.get('activeShape.decal_prices').forEach(function (decalPrice) {
            if (decalPrice.price < economyDecalPrice || economyDecalPrice === -1) {
                economyDecalPrice = decalPrice.price;
                economyDecal = component.store.getById('decal', decalPrice.decal_id);
            }
        });

        component.set('activeDecal', economyDecal);
    },

    alternativeShapes: function () {

        return this.store.all('shape').filter(function (shape) {

            var f = shape.get('components').filter(function (component) {
                return component.get('id') === this.get('id');
            }.bind(this));

            return !!f.length && shape.get('id') !== this.get('activeShape.id');

        }.bind(this));

    }.property('activeShape'),

    isActive: function () {
        return this.get('position.activeComponent') === this;
    }.property('position.activeComponent'),

    isDefault: function () {
        return this.get('position.defaultComponent') === this;
    }.property('position.defaultComponent'),

    features: function () {
        return this.get('position.features');
    }.property('position.features'),

    featuresIncludingQRON: function () {
        var a = Ember.ArrayController.create();

        a.addObjects(this.get('features'));

        if (this.get('activeShape.qronFeature')) {
            a.addObject(this.get('activeShape.qronFeature'));
        }

        return a;
    }.property('features', 'activeShape', 'activeShape.qronFeature'),

    x: function () {
        return this.get('position.x');
    }.property('position.x'),

    y: function () {
        return this.get('position.y');
    }.property('position.y'),

    width: function () {
        return this.get('activeShape.width');
    }.property('activeShape.width'),

    height: function () {
        return this.get('activeShape.height');
    }.property('activeShape.height'),

    componentShape: function () {
        return this.get('activeShape.svg');
    }.property('activeShape.svg'),

    activeFeatures: function () {
        return this.get('model.features').filterBy('deleted', false);
    }.property('model.features.@each.deleted'),

    /*
     * The price to order x quantity of this component.
     */
    totalPrice: function () {

        return this.get('singlePrice') * this.get('quantity');

    }.property('singlePrice', 'quantity'),

    hasPriceForDecal: function (decal) {
        return this.get('activeShape.decal_prices').anyBy('decal_id', parseInt(decal.get('id')));
    },

    /*
     *The price of a single decal of the activeShape of this component
     */
    singlePrice: function () {

        if (!this.get('activeDecal.id')) {
            this.setPremiumDecal();
        }

        var decalPrices = Ember.A(this.get('activeShape.decal_prices')),
            price = decalPrices.findBy('decal_id', parseInt(this.get('activeDecal.id'))).price;

        return price;

    }.property('activeShape', 'activeShape.decal_prices', 'activeDecal'),

    isIncluded: function () {
        return this.get('position.activeComponent') === this &&
            this.get('position.isIncluded');
    }.property('position.activeComponent', 'position.isIncluded')

});
