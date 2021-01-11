import Ember from 'ember';
import DS from 'ember-data';
import config from '../config/environment';
import rsLogger from '../lib/rs-logger';

export default DS.Model.extend({
    userActionService: Ember.inject.service('user-action-service'),

    name: DS.attr('string'),
    type: DS.attr('string'),
    zIndex: DS.attr('number'),
    fattributes: DS.hasMany('fattribute'),
    position: DS.belongsTo('position'),
    design: DS.belongsTo('design', {inverse: 'features'}),
    deleted: DS.attr('boolean', {defaultValue: false}),
    invalid: DS.attr('boolean', {defaultValue: false}),
    linked: DS.attr('boolean'),
    userSpecificInformation: DS.attr('boolean'),
    isThemeFeature: DS.attr('boolean', {defaultValue: false}),
    mirroredFromFeature: DS.belongsTo('feature'),
    designCategory: Ember.computed.alias('iconObject.designCategory'),

    getAttribute: function (key) {
        return this.get('fattributes').filterBy('key', key).get('firstObject');
    },

    setAndTrackAttributes (attrs = [], afterActions = {}) {
        this.get('userActionService')
            .appendAction({
                model: this,
                owner: 'fattribute',
                changes: attrs.map(({ key, value, flip = false }) => ({
                    name: key,
                    values: {
                        undo: flip ? value : this.getAttribute(key).get('value'),
                        redo: flip ? this.getAttribute(key).get('value') : value
                    }
                })),
                afterActions
            });

        attrs.forEach(({ key, value, flip = false }) =>
            this.setAttribute(key, flip ? this.getAttribute(key).get('value') : value));
    },

    setAttribute (key, value) {
        const attr = this.setAttributeOnly(key, value);
        const content = attr.get('content');

        this.set(`${key}_id`, value); // allow to distinguish colours with same rgb

        if (this.get(key) !== content) {
            this.set(key, content);
        }

        return attr;
    },

    // Set a feature attribute without setting a property on the feature. Used
    // for performance reasons by the fabric bindings mixin.

    setAttributeOnly: function (key, value) {

        var attr = this.getAttribute(key);

        // Does the Feature already have this attribute ?
        if (attr) {

            // Update existing attribute in the Store
            Ember.run(function () {
                attr.setContent(value);
            });

        } else {
            var name = key.underscore().replace('_', ' ').capitalize(),
                position = this.get('position'),
                design = position.get('design');

            Ember.assert('Feature has a position', position);
            Ember.assert('Position has a design', design);

            // Create a new attribute for the feature since it doesnt exist
            attr = this.store.createRecord('fattribute', {
                name:       name,
                value:      value,
                design:     design,
                position:   position
            });

            // Add the new Attribute to the list of fattributes of this feature#
            design.get('fattributes').pushObject(attr);
            this.get('fattributes').pushObject(attr);

        }

        return attr;
    },

    stroke1Available: function () {
        return true;
    }.property('type'),

    stroke2Available: Ember.computed.alias('isTextFeature'),

    stroke3Available: Ember.computed.alias('isTextFeature'),

    stroke4Available: Ember.computed.alias('isTextFeature'),

    stroke1Enabled: function () {
        return !!(this.get('strokeWidth1') > 0 && this.get('strokeStyle1'));
    }.property('strokeWidth1'),

    stroke2Enabled: function () {
        return !!(this.get('strokeWidth2') > 0 && this.get('strokeStyle2'));
    }.property('strokeStyle2', 'strokeWidth2'),

    stroke3Enabled: function () {
        return !!(this.get('strokeWidth3') > 0 && this.get('strokeStyle3'));
    }.property('strokeStyle3', 'strokeWidth3'),

    stroke4Enabled: function () {
        return !!(this.get('strokeWidth4') > 0 && this.get('strokeStyle4'));
    }.property('strokeStyle4', 'strokeWidth4'),

    // return the number of the outermost border
    // otherwise, returning false means all borders are disabled
    outermostBorder () {

        if (this.get('stroke4Enabled')) {
            return 4;
        } else if (this.get('stroke3Enabled')) {
            return 3;
        } else if (this.get('stroke2Enabled')) {
            return 2;
        } else if (this.get('stroke1Enabled')) {
            return 1;
        } else {
            return false;
        }
    },

    innermostBorder () {

        if (this.get('stroke1Enabled')) {
            return 1;
        } else if (this.get('stroke2Enabled')) {
            return 2;
        } else if (this.get('stroke3Enabled')) {
            return 3;
        } else if (this.get('stroke4Enabled')) {
            return 4;
        } else {
            return false;
        }
    },

    multicoloured: Ember.computed.and('isIconFeature', 'iconObject.multicoloured'),

    hasBlankText: Ember.computed('text', function () {
        return typeof this.get('text') === 'string' && !this.get('text').toString().trim();
    }),

    isTextAndEmpty: Ember.computed.and('isTextFeature', 'hasBlankText'),

    canModify: Ember.computed.or('isIconFeature', 'isTextFeature'),

    canIncreaseScale: function () {
        if (this.get('isUserAddedGraphic') && this.get('scale') >= config.APP.image_upload_max_scale) {
            return false;
        }

        if (this.get('isTextFeature') && this.get('fontSize') >= 1000) {
            return false;
        }

        return true;
    }.property('scale', 'isUserAddedGraphic', 'fontSize', 'type'),

    canDecreaseScale: function () {
        return (this.get('isIconFeature') && this.get('scale') > 0.1) ||
            (this.get('isTextFeature') && this.get('fontSize') > 10);
    }.property('scale', 'fontSize'),

    canIncreaseAngle: Ember.computed.lt('angle', 180),

    canDecreaseAngle: Ember.computed.gt('angle', -180),

    isUserAdded: function () {
        return !!this.get('name').match(/^User Added/) && !this.get('isThemeFeature');
    }.property('name'),

    iconObject: function () {
        return this.getAttribute('icon') ? this.store.getById('graphic', this.getAttribute('icon').get('value')) : null;
    }.property('icon'),

    isUserAddedGraphic: function () {
        return this.get('isIconFeature') && this.get('iconObject.name') === 'New Graphic';
    }.property('type', 'icon'),

    isIconFeature: Ember.computed.equal('type', 'GraphicIcon'),

    isBackgroundFeature: Ember.computed.equal('type', 'ComponentShape'),

    isTextFeature: Ember.computed.equal('type', 'Text'),

    isIconFeaturePlaceholder: Ember.computed.and('isIconFeature', 'iconObject.isPlaceholder'),

    unload () {
        this.get('fattributes')
            .compact()
            .forEach((fattribute) =>
                this.store.unloadRecord(fattribute)
            );

        this.store.unloadRecord(this);
    },

    prepareForRender () {
        this.get('fattributes')
            .forEach((fattribute) => {
                const key = fattribute.get('key');
                this.set(key, fattribute.get('content'));

                if (fattribute.get('content') === null) {
                    rsLogger.warn(
                        'AttributeIntegrityWarning',
                        `An attribute=${key} on feature=${this.get('id')} has no value. UI may be in an invalid state.`
                    );

                    if (key.match(/strokeStyle[1-4]/)) {
                        const colourId = this.get('position.features')
                            .findBy('type', 'ComponentShape')
                            .getAttribute('fill')
                            .get('value');

                        const backgroundColour = this.store.getById('colour', colourId);

                        const defaultColour = ['White', 'Black', 'Aluminium']
                            .find((name) => backgroundColour.get('name') !== name);

                        const defaultColourId = this.store.all('colour')
                            .findBy('name', defaultColour)
                            .get('id');

                        this.setAttribute(key, defaultColourId);

                        rsLogger.warn(
                            `models__feature__prepare_for_render`,
                            `Default value of "${defaultColourId}" has been used in order to resolve missing ${key}`
                        );
                    }
                }
            });

        if (!this.get('opacity') && config.APP.features.feature_opacity) {
            this.setAttribute('opacity', 100);
        }
    }
});
