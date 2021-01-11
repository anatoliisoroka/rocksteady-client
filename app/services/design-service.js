import Ember from 'ember';
import RsSelectorCanvas from '../lib/rs-selector-canvas';
import { getBrandingImageURL } from '../utils/url-util';

export default Ember.Service.extend({
    toPNG (design, options = {}) {
        const {
            width,
            height,
            excludeWatermark,
            transparentCanvas
        } = Object.assign(
            {},
            {
                width: 800,
                height: 419,
                excludeWatermark: false,
                transparentCanvas: false
            },
            options
        );

        return new Ember.RSVP.Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const fabCanvasOptions = {
                width,
                height,
                hideInactiveComponents: false
            };
            const selectorCanvas = new RsSelectorCanvas(canvas, fabCanvasOptions, design);
            const { canvas: fabCanvas } = selectorCanvas;

            selectorCanvas.render()
                .then(() => fabCanvas.setBackgroundColor(
                    transparentCanvas ? 'transparent' : 'white',
                    () => {
                        if (excludeWatermark) {
                            fabCanvas.renderAll();
                            resolve(fabCanvas.toDataURL());
                        } else {
                            fabCanvas.setOverlayImage(
                                getBrandingImageURL('selectmap-watermark.png'),
                                () => {
                                    fabCanvas.renderAll();
                                    //Some elements were not rendering on first call...
                                    selectorCanvas.render()
                                        .then(() => resolve(fabCanvas.toDataURL()));
                                },
                                { width, height, left: width / 2, top: height / 2 }
                            );
                        }
                    })
                );
        });
    }
});
