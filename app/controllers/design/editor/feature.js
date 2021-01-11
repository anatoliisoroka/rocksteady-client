/* global tinycolor, logger */

import Ember from 'ember';
import DS from 'ember-data';
import RegulatedFeatureMixin from '../../../mixins/regulated-feature';
import FabricBindingsMixin from '../../../mixins/fabric-bindings';
import LinkedFeaturesMixin from '../../../mixins/linked-features';
import PersonalFeaturesMixin from '../../../mixins/personal-features';

import config from '../../../config/environment';

const mixins = [
    FabricBindingsMixin,
    LinkedFeaturesMixin,
    RegulatedFeatureMixin,
    PersonalFeaturesMixin
];
export default Ember.Controller.extend(...mixins, {
    needs: ['design/editor', 'design', 'application'],

    isTouch: Ember.computed.alias('controllers.application.isTouch'),

    userIsEditing: Ember.computed.alias('controllers.design/editor.featureActive'),

    newGraphicLoaded: null,
    selectedGraphicFilterTags: [],
    fillIsSelected: true,
    stroke1IsSelected: null,
    stroke2IsSelected: null,
    stroke3IsSelected: null,
    stroke4IsSelected: null,

    deletedFeatures: Ember.computed.alias('controllers.design/editor.deletedFeatures'),

    //border tabs must be activated
    //in sequence from 1 to 4
    border1Enabled: function () {
        return this.get('featureIsText') || this.get('featureIsComponentShape') || (this.get('featureIsIcon') && config.APP.features.icon_borders);
    }.property('model.stroke1Enabled'),
    border2Enabled: function () {
        return this.get('model.stroke2Enabled') || this.get('model.stroke1Enabled');
    }.property('model.stroke2Enabled', 'model.stroke1Enabled'),
    border3Enabled: function () {
        return this.get('model.stroke3Enabled') || this.get('model.stroke2Enabled');
    }.property('model.stroke3Enabled', 'model.stroke2Enabled'),
    border4Enabled: function () {
        return this.get('model.stroke4Enabled') || this.get('model.stroke3Enabled');
    }.property('model.stroke4Enabled', 'model.stroke3Enabled'),

    isEditTextAreaVisible: false,

    init: function () {
        this._super();
    },

    hasActiveProperty: function () {
        return this.get('activeProperty') !== null;
    }.property('activeProperty'),

    activeProperty: Ember.computed.alias('controllers.design/editor.activeProperty'),

    featureIsComponentShape: Ember.computed.equal('model.type', 'ComponentShape'),

    featureHasNoInternalBorders: Ember.computed('featureIsComponentShape', function() {
        if (!this.get('featureIsComponentShape')) {
            return false;
        }
        return this.get('controllers.design/editor.rsEditorCanvas')
            .backgroundFeatureHasNoInternalBorders(this.get('model'));
    }),

    featureIsIcon: Ember.computed.alias('model.isIconFeature'),

    iconIsMonocolour: Ember.computed.not('model.multicoloured'),

    featureIsText: Ember.computed.alias('model.isTextFeature'),

    monitorMultiline: function () {
        if (this.get('featureIsText')) {
            if (this.get('model.text').toString().trim().indexOf('\n') !== -1) {
                this.set('multiline', true);
            } else {
                this.set('multiline', false);
            }
        }
    }.observes('model.text', 'model.id').on('init'),

    onFeatureChanged: function () {
        if (this.get('featureIsText')) {
            this.set('isEditTextAreaVisible', false);
        }
    }.observes('userIsEditing'),

    isNotMultiline: Ember.computed.not('multiline'),

    strokeWidthReset: function () {
        if (this.get('featureIsText')) {
            if (this.get('strokeWidth') === null) {
                this.set('strokeWidth', 0);
            }
        }
    }.observes('model.strokeWidth'),

    featureActivated: function () {
        this.send('selectColourTab', 'fillIsSelected');
    }.observes('model.active'),

    turnStrokeOn (strokeNum) {
        const feature = this.get('model');
        const key = `strokeWidth${strokeNum}`;
        const featureStrokeWidth = feature.get(key);

        //check if it has any before
        if (!(featureStrokeWidth === null || featureStrokeWidth === 0)) {
            return;
        }

        const strokeStyleName = `strokeStyle${strokeNum}`;
        const colour = this.store.getById(
            'colour',
            feature.getAttribute(strokeStyleName).get('value')
        );
        const contrastingColour = this.store.getById('colour', colour.get('contrastingId'));
        const currentComponentColourName = this.get('controllers.design/editor.currentComponentColour').toUpperCase();
        const outermostBorder = feature.outermostBorder();

        const outermostColour = outermostBorder ?
            this.store.getById('colour', feature.getAttribute(`strokeStyle${outermostBorder}`).get('value')) :
            this.store.getById('colour', feature.getAttribute('fill').get('value'));

        if (colour.get('id') === outermostColour.get('id') ||
            colour.get('displayRgb').toUpperCase() === currentComponentColourName) {

            //check if contrast is same otherwise apply alternative
            if (contrastingColour.get('id') !== outermostColour.get('id') &&
                contrastingColour.get('displayRgb').toUpperCase() !== currentComponentColourName) {

                //then assign "contrastingId" for the first one
                feature.setAttribute(strokeStyleName, contrastingColour.get('id'));

            } else {
                //then assign "alternativeColour" for the first one
                feature.setAttribute(strokeStyleName, this.altColour().get('id'));
            }
        }

        const value = feature.get('isIconFeature') ? 1 : 10;

        feature.setAndTrackAttributes(
            [{ key, value }],
            { undo: () => this.send('selectColourTab', 'fillIsSelected') }
        );
    },

    actions: {

        backToMainPanel: function () {
            this.get('controllers.design/editor').send('backToMainPanel');
        },

        hideEditTextArea: function () {
            if (this.get('model.isTextAndEmpty')) {
                var f = this.get('controllers.design/editor.interestingFeatures.firstObject');

                if (f) {
                    this.transitionToRoute('design.editor.feature', f);
                }
            }

            this.set('isEditTextAreaVisible', false);
        },

        confirmTextEdit () {
            const value = this.get('model.previousTextValue');

            if (value) {
                this.get('model')
                    .setAndTrackAttributes([{ key: 'text', value, flip: true }]);
            }
            this.send('hideEditTextArea');
        },

        cancelTextEdit () {
            const previousValue = this.get('model.previousTextValue');

            if (previousValue) {
                this.set('model.text', previousValue);
            }
            this.send('hideEditTextArea');
        },

        selectColourTab (selectedTab) {
            const tabs = Ember.A([
                'fillIsSelected',
                ...[1, 2, 3, 4].map((value) => `stroke${value}IsSelected`)
            ]);

            tabs.reject((tab) => tab === selectedTab)
                .forEach((tab) =>
                    this.set(tab, false)
                );

            this.set(selectedTab, true);

            // turn on borders here
            if (selectedTab !== 'fillIsSelected') {
                const tabNum = parseInt(selectedTab.match(/[0-9]/));

                this.turnStrokeOn(tabNum);
            }
        },

        removeStroke: function (stroke_number) {
            this.get('model').setAndTrackAttributes(
                [{ key: `strokeWidth${stroke_number}`, value: 0 }],
                { redo: () => this.send('selectColourTab', 'fillIsSelected') }
            );
            this.send('selectColourTab', 'fillIsSelected');
        },

        propagateAttributeChange (key, value) {
            const feature = this.get('model');

            if (feature.get(key) !== value) {
                feature.setAndTrackAttributes([{ key, value }]);
            }
        },

        strokeToTheFront () {
            this.send('propagateAttributeChange', 'strokeFront1', '1');
        },

        strokeToTheBack () {
            this.send('propagateAttributeChange', 'strokeFront1', '0');
        },

        turnOnInternalBorders () {
            this.send('propagateAttributeChange', 'strokeInternal1', '1');
        },

        turnOffInternalBorders () {
            this.send('propagateAttributeChange', 'strokeInternal1', '0');
        }
    },

    graphicCollection: Ember.computed.alias('controllers.design.graphics'),

    recent3Graphics: function () {
        var attr = this.get('model').getAttribute('icon'),
            graphicIcon = this.get('model.iconObject'),
            recent3 = Ember.A([]);

        if (graphicIcon) {
            recent3.addObject(graphicIcon);
            recent3.addObjects(
                attr.get('design.graphics').
                objectsAt([0, 1, 2, 3]).
                without(graphicIcon));
            recent3 = recent3.reject(function (g) {
                return (!g || g.get('isPlaceholder'));
            });
            recent3 = recent3.slice(0, 3);
        }

        return recent3;
    }.property('model.icon'),

    designerGraphics: function () {
        if (this.get('model').getAttribute('icon')) {
            return this.get('model').getAttribute('icon').get('designerObjects');
        }
    }.property('model.icon'),

    ruleGraphics: function () {
        if (this.get('model').getAttribute('icon')) {
            return this.get('model').getAttribute('icon').get('ruleObjects');
        }
    }.property('model.icon'),

    designerFonts: function () {
        if (this.get('model').getAttribute('fontFamily')) {
            return this.get('model').getAttribute('fontFamily').get('designerObjects');
        }
    }.property('model.fontFamily'),

    ruleFonts: function () {
        if (this.get('model').getAttribute('fontFamily')) {
            return this.get('model').getAttribute('fontFamily').get('ruleObjects');
        }
    }.property('model.fontFamily'),

    allFonts: function () {
        return this.get('controllers.design.model.fonts').sortBy('name');
    }.property('controllers.design.model.fonts'),

    recent3Fonts: function () {
        var attr = this.get('model').getAttribute('fontFamily'),
        recent3 = Ember.A([]);

        if (attr) {
            var font = this.store.getById('font', attr.get('value'));

            recent3.addObject(font);
            recent3.addObjects(attr.get('design.fonts').objectsAt([0, 1, 2]).without(font));
            recent3 = recent3.slice(0, 3);
        }

        return recent3;
    }.property('model.fontFamily'),

    recent3FillColours: function () {
        return this.recent3Colours('fill', 'filterFillColours');
    }.property('model.fill_id', 'controllers.design/editor.currentComponentColour',
        'model.strokeStyle1', 'model.strokeStyle1_id', 'model.strokeWidth1',
        'model.strokeStyle2', 'model.strokeStyle2_id', 'model.strokeWidth2',
        'model.strokeStyle3', 'model.strokeStyle3_id', 'model.strokeWidth3',
        'model.strokeStyle4', 'model.strokeStyle4_id', 'model.strokeWidth4'),

    designerFillColours: function () {
        var fill = this.get('model').getAttribute('fill');

        if (fill) {
            var designerObjects = fill.get('designerObjects');

            if (designerObjects) {
                return this.filterFillColours(designerObjects);
            } else {
                return this.filterFillColours(this.get('controllers.design.kitColours'));
            }
        } else {
            return [];
        }
    }.property('model.fill', 'controllers.design/editor.currentComponentColour', 'model.strokeStyle1', 'model.strokeStyle2', 'model.strokeStyle3', 'model.strokeStyle4',
    'stroke1IsSelected', 'stroke2IsSelected', 'stroke3IsSelected', 'stroke4IsSelected'),

    ruleFillColours: function () {
        var fill = this.get('model').getAttribute('fill');

        if (fill) {
            var ruleObjects = fill.get('ruleObjects');
            return this.filterFillColours(ruleObjects);
        } else {
            return [];
        }
    }.property('model.fill', 'controllers.design/editor.currentComponentColour', 'model.strokeStyle1', 'model.strokeStyle2', 'model.strokeStyle3', 'model.strokeStyle4',
        'stroke1IsSelected', 'stroke2IsSelected', 'stroke3IsSelected', 'stroke4IsSelected'),

    filterFillColours: function (objects) {

        if (config.APP.allow_feature_same_colour_as_component) {

            return objects;

        } else {

            var self = this;
            var currentComponentColour = this.get('controllers.design/editor.currentComponentColour');

            //filter out the fill colour for the background
            //should not appear as an option for any text feature without a border
            if ((this.get('type') === 'Text' || !this.get('multicoloured')) &&
                this.get('type') !== 'ComponentShape' &&
                !this.get('content').outermostBorder()) {

                if (objects === undefined) {
                    objects = Ember.A([]);
                } else if (objects.constructor === DS.ManyArray) {
                    objects = objects.toArray();
                }

                objects = objects.filter(function (colour) {
                    if (colour.get('displayRgb') && currentComponentColour) {
                        return !self.compareHexidecimals(colour.get('displayRgb'), currentComponentColour);
                    } else {
                        return false;
                    }
                });
            }

            return objects;

        }
    },

    filterBorderColours: function (objects) {

        if (config.APP.allow_feature_same_colour_as_component) {

            return objects;

        } else {

            var self = this;

            if (objects === undefined) {
                objects = Ember.A([]);
            } else if (objects.constructor === DS.ManyArray) {
                objects = objects.toArray();
            }

            var tab = this.activeTab();

            var currentComponentColour = this.get('controllers.design/editor.currentComponentColour');
            var fillColour = this.get('fill');

            var outermostBorder = this.get('model').outermostBorder();
            var innermostBorder = this.get('model').innermostBorder();

            if (tab) {

                var tab_num = parseInt(tab.charAt(tab.length - 1)) || null;

                //the outermost border must not have the colour of the background fill
                if (tab_num === outermostBorder) {

                    objects = objects.filter(function (colour) {
                        return !self.compareHexidecimals(colour.get('displayRgb'), currentComponentColour);
                    });
                }

                //the innermost border must not have the colour of the feature fill
                if (tab_num === innermostBorder) {

                    objects = objects.filter(function (colour) {
                        return !self.compareHexidecimals(colour.get('displayRgb'), fillColour);
                    });
                }
            }

            return objects;

        }
    },

    //return true if two hexidecimal colour values are equal
    compareHexidecimals: function (hex1, hex2) {

        hex1 = hex1.toLowerCase();
        hex2 = hex2.toLowerCase();

        //remove the preceding # symbol from the hex values
        var hx1 = parseInt(hex1.substring(1, hex1.length), 16);
        var hx2 = parseInt(hex2.substring(1, hex2.length), 16);

        if (hx1 === hx2) {
            return true;
        }
        return false;
    },

    //sort colours by hue
    sortColours: function (colours) {
        if (typeof colours.toArray === 'function') {
            colours = colours.toArray();
        }

        if (config.APP.colour_sorter === 'none') {
            return colours;
        }

        if (!colours || typeof colours.sort !== 'function') {
            return;
        }

        var fn;

        if (config.APP.colour_sorter === 'hue') {
            fn = function (a, b) {
                var av = tinycolor(a.get('displayRgb')).toHsv().h;
                var bv = tinycolor(b.get('displayRgb')).toHsv().h;

                return bv - av;
            };
        } else if (config.APP.colour_sorter === 'saturation') {
            fn = function (a, b) {
                var av = tinycolor(a.get('displayRgb')).toHsv().s;
                var bv = tinycolor(b.get('displayRgb')).toHsv().s;

                return bv - av;
            };
        } else if (config.APP.colour_sorter === 'luminosity') {
            fn = function (a, b) {
                var av = tinycolor(a.get('displayRgb')).toHsv().l;
                var bv = tinycolor(b.get('displayRgb')).toHsv().l;

                return bv - av;
            };
        } else if (config.APP.colour_sorter === 'brightness') {
            fn = function (a, b) {
                var av = tinycolor(a.get('displayRgb')).getBrightness();
                var bv = tinycolor(b.get('displayRgb')).getBrightness();

                return bv - av;
            };
        } else if (config.APP.colour_sorter === 'id') {
            fn = function (a, b) {
                return a.get('id') - b.get('id');
            };
        } else if (config.APP.colour_sorter === 'name') {
            fn = function (a, b) {
                return a.get('name').localeCompare(b.get('name'));
            };
        }

        return colours.sort(fn);
    },

    mandateIconAttributes: function () {

        if (this.get('type') === 'GraphicIcon' && !this.get('model.multicoloured')) {
            // catch the case where user changes design graphic to
            // fillable/strokeable graphic

            if (!this.get('model.fill')) {
                var contrastingFillColour = this.filterFillColours(this.get('controllers.design.kitColours')).get('firstObject.id');
                this.get('model').setAttribute('fill', contrastingFillColour);
            }

            if (!this.get('strokeWidth1')) {
                this.get('model').setAttribute('strokeStyle1', this.get('designerStroke1Colours.firstObject.id'));
                this.get('model').setAttribute('strokeWidth1', 0);
            }
        }

    }.observes('model.icon'),

    recent3Colours: function (prop, filterFn) {
        if (!this.get('model')) {
            logger.warn('FeatureControllerModelWarning', 'Feature controller is missing model.');
            return [];
        }

        var attr = this.get('model.').getAttribute(prop),
        recent3 = Ember.A([]),
        colour;

        if (attr) {
            colour = this.store.getById('colour', attr.get('value'));

            recent3.addObject(colour);
            recent3.addObjects(attr.get('design.colours').objectsAt([0, 1, 2, 3, 4]).without(colour));

            if (filterFn) {
                recent3 = this[filterFn](recent3);
            }

            recent3 = recent3.slice(0, 3);
        } else {
            logger.warn('AttributeIntegrityWarning', 'Feature ' + this.get('model.id') + ' is missing attribute "' + prop + '"');

            recent3.addObjects(this.get('model.design.colours').objectsAt([0, 1, 2]));
        }

        return recent3;
    },

    ruleStroke1Colours: function () {
        var a = this.get('model').getAttribute('strokeStyle1');

        return a ? this.filterBorderColours(a.get('ruleObjects')) : [];
    }.property('controllers.design/editor.currentComponentColour', 'stroke1IsSelected'),

    designerStroke1Colours: function () {
        return this.filterBorderColours(this.get('designerFillColours'));
    }.property('controllers.design/editor.currentComponentColour', 'stroke1IsSelected'),

    recent3Stroke1Colours: function () {
        return this.recent3Colours('strokeStyle1', 'filterBorderColours');
    }.property('model.strokeStyle1_id', 'controllers.design/editor.currentComponentColour', 'stroke1IsSelected'),

    ruleStroke2Colours: function () {
        var a = this.get('model').getAttribute('strokeStyle2');

        return a ? this.filterBorderColours(a.get('ruleObjects')) : [];
    }.property('controllers.design/editor.currentComponentColour', 'stroke2IsSelected'),

    designerStroke2Colours: function () {
        return this.filterBorderColours(this.get('designerFillColours'));
    }.property('controllers.design/editor.currentComponentColour', 'stroke2IsSelected'),

    recent3Stroke2Colours: function () {
        return this.recent3Colours('strokeStyle2', 'filterBorderColours');
    }.property('model.strokeStyle2_id', 'controllers.design/editor.currentComponentColour', 'stroke2IsSelected'),

    ruleStroke3Colours: function () {
        var a = this.get('model').getAttribute('strokeStyle3');

        return a ? this.filterBorderColours(a.get('ruleObjects')) : [];
    }.property('controllers.design/editor.currentComponentColour', 'stroke3IsSelected'),

    designerStroke3Colours: function () {
        return this.filterBorderColours(this.get('designerFillColours'));
    }.property('controllers.design/editor.currentComponentColour', 'stroke3IsSelected'),

    recent3Stroke3Colours: function () {
        return this.recent3Colours('strokeStyle3', 'filterBorderColours');
    }.property('model.strokeStyle3_id', 'controllers.design/editor.currentComponentColour', 'stroke3IsSelected'),

    ruleStroke4Colours: function () {
        var a = this.get('model').getAttribute('strokeStyle4');

        return a ? this.filterBorderColours(a.get('ruleObjects')) : [];
    }.property('controllers.design/editor.currentComponentColour', 'stroke4IsSelected'),

    designerStroke4Colours: function () {
        return this.filterBorderColours(this.get('designerFillColours'));
    }.property('controllers.design/editor.currentComponentColour', 'stroke4IsSelected'),

    recent3Stroke4Colours: function () {
        return this.recent3Colours('strokeStyle4', 'filterBorderColours');
    }.property('model.strokeStyle4_id', 'controllers.design/editor.currentComponentColour', 'stroke4IsSelected'),

    colourCollection: function () {
        var allColours = this.get('controllers.design.model.colours');
        return this.sortColours(this.filterFillColours(allColours));
    }.property('controllers.design.allColours', 'model.fill', 'controllers.design/editor.currentComponentColour', 'stroke1IsSelected', 'stroke2IsSelected', 'stroke3IsSelected', 'stroke4IsSelected'),

    borderColourCollection: function () {
        var allColours = this.get('controllers.design.model.colours');
        return this.sortColours(this.filterBorderColours(allColours));
    }.property('controllers.design.allColours', 'model.fill', 'controllers.design/editor.currentComponentColour', 'stroke1IsSelected', 'stroke2IsSelected', 'stroke3IsSelected', 'stroke4IsSelected'),

    canCloneFeature: function () {
        return this && !!this.get('controllers.application.config.APP.features.clone_feature') && !this.get('isPlaceholder') &&
            (this.get('model.type') === 'Text' ||
                (this.get('model.type') === 'GraphicIcon' && !this.get('model.iconObject.isPlaceholder')));
    }.property('model.id', 'model.icon', 'controllers.application.config.APP.features.clone_feature')
});
