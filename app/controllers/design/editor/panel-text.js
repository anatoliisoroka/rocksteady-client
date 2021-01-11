import Ember from 'ember';

import RegulatedFeatureMixin from '../../../mixins/regulated-feature';

export default Ember.Controller.extend(RegulatedFeatureMixin, {

    needs: ['design', 'design/editor', 'design/editor/feature', 'application'],

    isTouch: Ember.computed.alias('controllers.application.isTouch'),

    recent3Fonts: Ember.computed.alias('controllers.design/editor/feature.recent3Fonts'),
    recent3FillColours: Ember.computed.alias('controllers.design/editor/feature.recent3FillColours'),
    recent3Stroke1Colours: Ember.computed.alias('controllers.design/editor/feature.recent3Stroke1Colours'),
    recent3Stroke2Colours: Ember.computed.alias('controllers.design/editor/feature.recent3Stroke2Colours'),
    recent3Stroke3Colours: Ember.computed.alias('controllers.design/editor/feature.recent3Stroke3Colours'),
    recent3Stroke4Colours: Ember.computed.alias('controllers.design/editor/feature.recent3Stroke4Colours'),
    multiline: Ember.computed.alias('controllers.design/editor/feature.multiline'),

    _alignTo (where) {
        this.get('model')
            .setAndTrackAttributes([{ key: 'textAlignment', value: where }]);
    },

    actions: {
        alignLeft () {
            this._alignTo('left');
        },
        alignCentre () {
            this._alignTo('centre');
        },
        alignRight () {
            this._alignTo('right');
        },
        navigateToFontsSubpanel: function () {
            this.get('controllers.design/editor').set('activeProperty', 'font');
        },
        navigateToStroke1Subpanel: function () {
            this.get('controllers.design/editor').set('activeProperty', 'strokeStyle1');
        },
        navigateToStroke2Subpanel: function () {
            this.get('controllers.design/editor').set('activeProperty', 'strokeStyle2');
        },
        navigateToStroke3Subpanel: function () {
            this.get('controllers.design/editor').set('activeProperty', 'strokeStyle3');
        },
        navigateToStroke4Subpanel: function () {
            this.get('controllers.design/editor').set('activeProperty', 'strokeStyle4');
        },
        featureBackwards: function () {
            this.get('controllers.design/editor').send('featureBackwards');
        },
        featureForwards: function () {
            this.get('controllers.design/editor').send('featureForwards');
        },
        featureToFront: function () {
            this.get('controllers.design/editor').send('featureToFront');
        },
        featureToBack: function () {
            this.get('controllers.design/editor').send('featureToBack');
        }
    }
});
