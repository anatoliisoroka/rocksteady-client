import Ember from 'ember';

export default Ember.Controller.extend({
    needs: ['design', 'design/editor', 'design/editor/feature', 'application'],

    isTouch: Ember.computed.alias('controllers.application.isTouch'),
    recent3FillColours: Ember.computed.alias('controllers.design/editor/feature.recent3FillColours'),
    recent3Stroke1Colours: Ember.computed.alias('controllers.design/editor/feature.recent3Stroke1Colours'),

    internalBordersOn: Ember.computed('model.fattributes.@each.value', function() {
        if (this.get('controllers.design/editor/feature.featureHasNoInternalBorders')) {
            return false;
        }

        const fattr = this.get('model').getAttribute('strokeInternal1');

        return fattr ? fattr.get('value') === '1' : false;
    }),

    bordersInBack: Ember.computed('model.fattributes.@each.value', function() {
        const fattr = this.get('model').getAttribute('strokeFront1');

        return fattr ? fattr.get('value') === '0' : false;
    }),

    actions: {
        navigateToStroke1Subpanel: function () {
            this.get('controllers.design/editor').set('activeProperty', 'strokeStyle1');
        }
    }

});
