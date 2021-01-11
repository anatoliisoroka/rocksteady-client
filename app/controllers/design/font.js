/* global fabric, $, Modernizr */

import RsTextToPath from '../../lib/rs-text-to-path';
import Ember from 'ember';

fabric.Object.prototype.originX = fabric.Object.prototype.originY = 'center';

export default Ember.Controller.extend({

    prerenderSwatch: function () {

        var w, h;

        w = h = Modernizr.touch ? 40 : 48;

        var canvasEle = $('<canvas width="' + w + '" height="' + h + '"></canvas>')[0];

        var font = this.get('model').get('fontData');

        var fabricInstance = new fabric.StaticCanvas(canvasEle);

        var fontProperties = {
            'fontSize': 12,
            'fill': '#333333',
            'letterSpacing': 0,
            'strokeWidth': 0,
            'top': 0,
            'left': 0,
            'text': 'A9',
            'fontFamily': font,
            'angle': 0
        };

        var textToPathInst = new RsTextToPath($, fabric, fabricInstance, fontProperties);
        textToPathInst.render();
        var fabricObj = textToPathInst.getFabObj();
        fabricInstance.add(fabricObj).centerObjectH(fabricObj).centerObjectV(fabricObj).renderAll();

        var dataURL = canvasEle.toDataURL();

        this.get('model').set('swatchURL', dataURL);
    }

});
