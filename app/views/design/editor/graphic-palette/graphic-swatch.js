/* global $ */

import Ember from 'ember';
import config from '../../../../config/environment';

export default Ember.View.extend({
    _userActionService: Ember.inject.service('user-action-service'),
    classNames: ['graphic-swatch'],
    tagName: 'li',
    thumbnailSize: 32,
    attributeBindings: ['name', 'iconId:data-icon-id'],

    name: function () {
        var icon_name = this.get('content.name') + 'Icon';
        return icon_name.camelize();
    }.property('content.name'),

    iconId: Ember.computed.alias('content.id'),

    didInsertElement: function () {
        this._super();

        var graphic = this.get('content');
        var callback = null;

        if (graphic !== null) {

            var graphicType = graphic.get('graphicType');

            //if (graphicType === 'BITMAP') {
                callback = this.createSwatchBitmap;
            // } else {
            //     callback = this.createSwatchSVG;
            // }

            Ember.run.throttle(this, callback, 10);
        }

        var icon_name = this.get('content.name');

        if (config.APP.tooltips && this.$()) {
            this.$().tooltip({
                placement: 'top',
                'title': icon_name,
                html: false,
                container: 'body'
            });
        }
    },

    willDestroyElement: function () {
        if (config.APP.tooltips && this.$() && this.$().tooltip) {
            this.$().tooltip('destroy');
        }
    },

    click: function () {
        var view = this;

        Ember.run(function () {
            view.changeGraphic();
        });
    },

    changeGraphic: function () {
        const editorController = this.get('controller.controllers.design/editor');
        const featureController = this.get('controller.controllers.design/editor/feature');
        const feature = featureController ? featureController.get('model') : this.get('controller.model');
        const graphicType = this.get('content.graphicType');
        const graphic = this.get('content');

        if (graphicType !== 'SVG') {
            feature.set('scale', 0.1);
        } if(graphicType === 'SVG' && feature.get('iconObject.isBitmap')){
            const shapeArea = feature.get('position.activeShape.area');
            const imageArea = 143 * 143;
            const newScale = Math.sqrt(0.035 * (shapeArea / imageArea));
            feature.set('scale', newScale);
        }

        // make this icon a design "favourite"
        feature.get('design.graphics')
            .removeObject(graphic)
            .unshiftObject(graphic);

        const fill = feature.get('fill');
        const isUserAddedGraphic = feature.get('isUserAddedGraphic');
        const fillSameAsBackground = !feature.get('multicoloured') &&
            fill === editorController.get('currentComponentColour');

        const attributes = [{ key: 'icon', value: graphic.get('id') }]
            .concat(
                fillSameAsBackground ?
                    {
                        key: 'fill',
                        value: this.get('controller.controllers.design.kitColours')
                            .rejectBy('displayRgb', fill)
                            .get('firstObject.id')
                    }
                    :
                    []
            );
        if (feature.get('isIconFeaturePlaceholder')) {
            attributes
                .forEach(({ key, value }) => feature.setAttribute(key, value));
        } else {
            feature.setAndTrackAttributes(attributes);
        }

        if (config.APP.tooltips && this.$() && this.$().tooltip) {
            this.$().tooltip('hide');
        }

        this.get('parentView').send('showTouchGraphicNameTooltip', this.get('content'));
    },

    createSwatchSVG: function () {
        let graphic = this.get('content');
        let el = this.$();

        if (typeof graphic === 'object' && el) {
            let image = graphic.get('graphicData');
            el.append(image);

            if (!this.get('content.multicoloured')) {
                el.find('*').attr('fill', 'black');
            }
        }
    },

    createSwatchBitmap: function () {
        let graphic = this.get('content');
        let el = this.$();
        let graphicData = graphic.get('graphicData');
        let graphicUrl = graphic.get('graphicUrl');
        let src = '';

        if (typeof graphic === 'object' && el) {

            if (graphicUrl) {
                src = graphicUrl;
            } else if (graphicData) {
                src = graphicData;
            }

            let image = $('<img/>');
            image.attr('src', src);
            el.append(image);
        }
    },

    testAspectRatio: function (width, height) {
        if (width > height) {
            return 'landscape';
        } else if (width < height) {
            return 'portrait';
        } else {
            return 'square';
        }
    },

    actions: {
        showTooltip: function () {
            if (config.APP.tooltips && this.$() && this.$().tooltip) {
                this.$()
                    .tooltip('destroy')
                    .tooltip({
                        title: this.get('content.name'),
                        container: 'body'
                    })
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
