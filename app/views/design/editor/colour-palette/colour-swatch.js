/* global logger */

import Ember from 'ember';
import config from '../../../../config/environment';

export default Ember.View.extend({
    tagName: 'li',
    templateName: 'design/editor/colour-swatch',
    attributeBindings: ['name'],

    classNames: ['rumble-colour-palette-item-wrapper'],
    // propertyName,
    // This how we tell if the palette refers to a fill or strokeStyle(n)
    // Ideally this would come from the valueBinding that is already set on the
    // parentView, but at there is no public method to access the bound property
    // name. For now ensure that propertyName as an attr on the colour-palette view

    fillColour: Ember.computed.alias('content.displayRgb'),
    propertyName: Ember.computed.alias('parentView.propertyName'),

    name: function () {
        var swatch_name = this.get('content.name') + 'Swatch';
        return swatch_name.camelize();
    }.property('content.name'),

    didInsertElement: function () {
        var self = this;
        this._super();
        this.addFill();

        if (config.APP.tooltips && this.$()) {
            this.$().tooltip({
                placement: 'top',
                'title': self.get('content.name'),
                html: false
            });
        }
    },

    willDestroyElement: function () {
        if (config.APP.tooltips && this.$() && this.$().tooltip) {
            this.$().tooltip('destroy');
        }
    },

    borderStyle: function () {
        if (this.get('fillColour') === '#ffffff' && this.get('location') === 'mainPanel') {
            return { border: '2px dotted #ddd' };
        } else {
            return { border: '2px solid ' + this.get('fillColour') };
        }
    }.property(),

    addFill: function () {
        this.$('.rumble-colour-palette-item').css({
            'background-color': this.get('fillColour')
        });

        this.$('.rumble-colour-palette-item').parent('li').css(
            this.get('borderStyle')
        );
    },

    click: function (e) {
        this.changeColour(e);
    },

    changeColour: function () {
        const key = this.get('propertyName');
        const value = this.get('content.id');

        if (key && value) {
            const feature = this.get('controller.model');
            const colour = this.get('content');

            if (feature.get('type') === 'ComponentShape' && !key.includes('strokeStyle')) {
                feature.set('previousColour', feature.getAttribute(key).get('value'));
                feature.set('applyContrastingColour', true);
                feature.setAttribute(key, value);
            } else {
                feature.setAndTrackAttributes([{ key, value }]);
            }

            // make this colour a design "favourite"
            feature.get('design.colours')
                .removeObject(colour)
                .unshiftObject(colour);
        } else {
            logger.error('SwatchPropertyNameError', 'Can\'t find propertyName or content for swatch');
        }

        if (config.APP.tooltips && this.$()) {
            this.$().tooltip('hide');
        }

        this.get('parentView').send('showTouchColourNameTooltip', this.get('content'));
    },

    actions: {
        showTooltip: function () {
            if (config.APP.tooltips && this.$() && this.$().tooltip) {
                this.$()
                    .tooltip('destroy')
                    .tooltip({ title: this.get('content.name') })
                    .tooltip('show');

                Ember.run.later(this, function () {
                    if (this.$() && this.$().tooltip) {
                        this.$().tooltip('destroy');
                    }
                }, 1000);
            }
        }
    }

});
