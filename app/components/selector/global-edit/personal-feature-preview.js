/* global fabric */

import Ember from 'ember';
import config from '../../../config/environment';

export default Ember.Component.extend({
    tagName: 'canvas',
    personalFeatureToggled() {
        this.$().parent()
            .removeClass('selected')
            .addClass(this.get('feature.keep') ? 'selected' : '');
    },
    initRenderedPreviewDisplay() {
        this.get('featureFabObjs').then((featureFabObjs) => {
            const featureId = this.get('feature.id');
            const featureFabObj = featureFabObjs[featureId];
            this.set('throttledResizeId', `throttledresize.globalEdit.${featureId}`);

            this.$(window).on(this.get('throttledResizeId'), ({ target: { innerWidth } }) =>
                this.renderCanvas(this.prepareForRender(featureFabObj, innerWidth))
            );

            this.$(window).trigger(this.get('throttledResizeId'));
        });
    },
    initSelectionDisplay() {
        this.$().parent().click(() => {
            this.set('feature.keep', !this.get('feature.keep'));
            this.personalFeatureToggled();
        });
        this.personalFeatureToggled();
    },
    didInsertElement() {
        this.initRenderedPreviewDisplay();
        this.initSelectionDisplay();
    },
    willDestroyElement() {
        this.$(window).off(this.get('throttledResizeId'));
        this.$().parent().off('click');
    },
    renderCanvas(featureFab) {
        this.get('canvasInstance')
            .clear()
            .add(featureFab)
            .centerObjectH(featureFab)
            .centerObjectV(featureFab)
            .renderAll();
    },
    prepareForRender(featureFab, screenWidth) {
        if (!this.get('canvasInstance')) {
            this.createCanvasInstance();
        }
        const canvasWidth = this.get('canvasInstance.width');
        const canvasHeight = this.get('canvasInstance.height');
        const scale = this.obtainScaleMultiplier(screenWidth) * ((featureFab.getWidth() > featureFab.getHeight()) ?
            canvasWidth / featureFab.width : canvasHeight / featureFab.height);

        featureFab.set({
            left: canvasWidth / 2,
            top: canvasHeight / 2,
            scaleY: scale,
            scaleX: scale,
            angle: 0
        });

        return featureFab;
    },
    createCanvasInstance() {
        this.set('canvasInstance', new fabric.StaticCanvas(
            this.get('elementId'),
            { width: 210, height: 152 }
        ));
    },
    obtainScaleMultiplier(screenWidth) {
        if (screenWidth < config.APP.bootstrap_breakpoints.CUSTOM_MAX_WIDTH) {
            return 0.6;
        } else if (screenWidth < config.APP.bootstrap_breakpoints.XS_MAX_WIDTH) {
            return 0.7;
        } else if (screenWidth < config.APP.bootstrap_breakpoints.SM_MAX_WIDTH) {
            return 0.7;
        }
        return 0.6;
    }
});
