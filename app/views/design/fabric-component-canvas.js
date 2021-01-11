/* global $ */

import Ember from 'ember';
import RsSingleComponentCanvas from '../../lib/rs-single-component-canvas';

export default Ember.View.extend({
    tagName: 'canvas',
    width: 200,
    height: 200,
    canvas: undefined,

    didInsertElement: function () {
        this._super();

        //var canvas, componentData, options, el;
        var options, el;

        options = {
            width: this.get('width'),
            height: this.get('height'),
            canvasType: 'static',
            canvasPadding: 5,
            maskOn: false,
            virtualContainerOn: true,
            dropShadow: false,
            virtualContainerSizeCue: this.get('virtualContainerSizeCue'),
            createComponentShapesOnly: true
        };

        if (this.get('content.component.isActive') && this.get('content.component.activeShape.id') === this.get('content.shape.id')) {
            options.dropShadow = true;
            options.createComponentShapesOnly = false;
        }

        el = this.$();

        // Need component and its feature before passing the data to createCanvas
        Ember.run.scheduleOnce('afterRender', this, function () {
            this.createCanvas(el, options);
        });
    },

    createCanvas: function (el, options) {
        if (!this.get('isDestroyed')) {
            if (this.content) {
                var canvas = new RsSingleComponentCanvas(el[0], options, this.get('controller'), this.content.component, this.content.shape);
                this.set('canvas', canvas.canvas);
            } else {
                this.set('canvas', $('<canvas/>'));
            }
        }
    }

});
