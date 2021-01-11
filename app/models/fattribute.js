/* global logger */

import Ember from 'ember';
import DS from 'ember-data';

var Attribute = DS.Model.extend({

    position: DS.belongsTo('position'),
    feature: DS.belongsTo('feature'),
    name: DS.attr('string'),
    value: DS.attr('string'),
    designer: DS.attr('raw'),
    rule: DS.attr('raw'),
    exclude: DS.attr('raw'),
    design: DS.belongsTo('design'),

    content: function () {
        var _content;

        try {
            if (this.get('isColour') && this.get('value')) {
                let colour = this.get('design.colours').findBy('id', '' + this.get('value'));
                if (colour) {
                    _content = colour.get('displayRgb');
                } else {
                    logger.warn('Colour missing', 'Exception getting colour with id: ' + this.get('value') + ' for ' + this.get('name') + ' on feature ' + this.get('feature.id'));
                    _content = this.get('design.colours.firstObject.displayRgb');
                }
            } else if (this.get('isIcon')) {
                let graphic = this.store.getById('graphic', this.get('value'));
                let graphicUrl = graphic.get('graphicUrl');
                let graphicData = graphic.get('graphicData');
                _content = graphicUrl || graphicData;
            } else if (this.get('isFont')) {
                _content = this.get('design.fonts').findBy('id', '' + this.get('value')).get('fontData');
            } else if (this.get('isNumber')) {
                _content = parseFloat(this.get('value'));
            } else if (this.get('isBoolean')) {
                _content = (typeof this.get('value') === 'boolean' && this.get('value') === true) ||
                    (typeof this.get('value') === 'string' && this.get('value') === 'true');
            } else {
                _content = this.get('value');
            }
        } catch (e) {
            logger.warn('AttributeContentWarning', 'Exception getting attribute content. ' + this.get('key') + ':' + this.get('value') + ', error ' + e);
            void 0;
        }

        return _content;
    }.property('value'),

    setContent: function (content) {
        if ('' + content !== this.get('value')) {
            logger.debug('Setting fattribute content for feature=' + this.get('feature.id') + ': ' + this.get('name') + '=' + content);
            this.set('value', content);
        }
    },

    ruleObjects: function () {
        var self = this;
        var rules = Ember.A([]);
        var recordType = this.get('recordType');

        if (this.get('isRecord')) {
            if (this.get('rule')) {
                var ruleArray = this.get('rule');

                if (!Ember.isArray(ruleArray)) {
                    ruleArray = [ruleArray];
                }

                if (this.get('isColour')) {
                    rules = ruleArray.map(function (item /*, index*/) {
                        if (Ember.$.inArray(item, self.get('exclude')) === -1) {
                            return self.store.getById(recordType, item);
                        }
                    });
                } else {
                    rules = ruleArray.map(function (item /*, index*/) {
                        return self.store.getById(recordType, item);
                    });
                }
                rules = rules.filter(function (n) {
                    return n;
                }); // Clean array of undefineds
                return rules.uniq();
            }
        }
    }.property(),

    designerObjects: function () {
        var self = this;
        var designers = Ember.A([]);
        var recordType = this.get('recordType');

        if (this.get('isRecord')) {
            if (this.get('designer')) {
                if (this.get('isColour')) {
                    designers = this.get('designer').map(function (item /*, index*/) {
                        if (Ember.$.inArray(item, self.get('exclude')) === -1) {
                            return self.store.getById(recordType, item);
                        }
                    });
                } else {
                    designers = this.get('designer').map(function (item /*, index*/) {
                        return self.store.getById(recordType, item);
                    });
                }
                designers = designers.filter(function (n) {
                    return n;
                }); // Clean array of undefineds
                return designers.uniq().sortBy('id');
            }
        }
    }.property('designer'),

    // enforce camelized key name. e.g. "Stroke Width" => "strokeWidth"
    key: function () {
        return this.get('name') && this.get('name').camelize();
    }.property('name'),

    isRecord: function () {
        return this.get('isColour') || this.get('isFont') || this.get('isIcon');
    }.property('isColour', 'isFont', 'isIcon'),

    isColour: function () {
        return Ember.A(['fill', 'strokeStyle1', 'strokeStyle2', 'strokeStyle3', 'strokeStyle4']).indexOf(this.get('key')) !== -1;
    }.property('key'),

    isFont: function () {
        return this.get('key') === 'fontFamily';
    }.property('key'),

    isIcon: function () {
        return this.get('key') === 'icon';
    }.property('key'),

    isNumber: function () {
        return Ember.A(['top', 'left', 'angle', 'scale', 'fontSize', 'lineHeight', 'letterSpacing', 'strokeWidth1', 'strokeWidth2', 'strokeWidth3', 'strokeWidth4', 'opacity']).indexOf(this.get('key')) !== -1;
    }.property('key'),

    isBoolean: function () {
        return this.get('key') === 'flipX' || this.get('key') === 'flipY';
    }.property('key'),

    recordType: function () {
        if (this.get('isColour')) {
            return 'colour';
        } else if (this.get('isFont')) {
            return 'font';
        } else if (this.get('isIcon')) {
            return 'graphic';
            // return undefined
        } else {
            return undefined;
        }
    }.property('key'),

    isStrokeStyle: function () {
        return Ember.A(['strokeStyle1', 'strokeStyle2', 'strokeStyle3', 'strokeStyle4']).indexOf(this.get('key')) !== -1;
    }.property('key'),

    isEnabled: function () {
        if (this.get('isStrokeStyle')) {
            let strokeNumber = this.get('key').match(/\d/)[0];
            let strokeKey1 = 'feature.stroke' + strokeNumber + 'Enabled';
            let strokeKey2 = 'feature.strokeWidth' + strokeNumber;
            return this.get(strokeKey1) && this.get(strokeKey2);
        }
        return true;
    }.property(
        'feature', 'feature.stroke1Enabled', 'feature.stroke2Enabled', 'feature.stroke3Enabled', 'feature.stroke4Enabled',
        'feature.strokeWidth1', 'feature.strokeWidth2', 'feature.strokeWidth3', 'feature.strokeWidth4'
    ),

    toggleStroke: function (flag) {
        if (this.get('isStrokeStyle')) {
            let strokeNumber = this.get('key').match(/\d/)[0];
            let strokeKey = 'feature.strokeWidth' + strokeNumber;
            if (flag) {
                this.set('oldStrokeWidth', this.get(strokeKey));
                this.set(strokeKey, 0);
            } else {
                this.set(strokeKey, this.get('oldStrokeWidth'));
            }
        }
    }

});

Attribute.TYPES = Ember.A(['fill', // App.Colour
    'top', 'left', 'angle', 'scale', 'opacity',
    // Font
    'fontFamily', // App.Font
    'text', 'fontSize', 'textAlignment', 'lineHeight', 'letterSpacing',
    // Icon
    'icon', // App.Graphic
    'flipX', 'flipY',
    // Stroke
    'strokeWidth1', 'strokeWidth2', 'strokeWidth3', 'strokeWidth4', 'strokeStyle1', // App.Colour
    'strokeStyle2', // App.Colour
    'strokeStyle3', // App.Colour
    // TODO: remove strokeStyle4 and strokeStyle ?
    //       or standardise around strokeStyle, strokeStyle1, strokeStyle2
    'strokeStyle4' // App.Colour
]);

export default Attribute;
