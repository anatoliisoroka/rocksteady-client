import Ember from 'ember';

var CLONED_FEATURE_OFFSET = 20;

export default Ember.Controller.extend({
    needs: ['design'],

    createBasicFeature: function (fType, fName, position, zIndex, left, top) {

        var newFeature = this.store.createRecord('feature', {
            component_id: position.get('activeComponent.id'),
            position: position,
            name: fName,
            type: fType,
            deleted: false,
            zIndex: zIndex,
            design: position.get('design')
        });

        newFeature.setAttribute('top', top);
        newFeature.setAttribute('left', left);
        newFeature.setAttribute('angle', 0);
        newFeature.setAttribute('opacity', 100);
        newFeature.setAttribute('flipX', false);
        newFeature.setAttribute('flipY', false);

        return newFeature;
    },

    clone: function (options = {}) {
        var feature = this.get('model'),
            clonedFeature,
            clonedFeatureOffset = options.preserveFeatureCoords ? 0 : CLONED_FEATURE_OFFSET,
            clonedFeatureName = feature.get('name') + (options.preserveFeatureName ? '' : ' (Cloned)');

        if (!feature) {
            return null;
        }

        if (feature.get('type') === 'GraphicIcon') {
            clonedFeature = this.createBasicFeature(
                'GraphicIcon',
                clonedFeatureName,
                this.get('model.position'),
                feature.get('zIndex')
                );

            clonedFeature.setAttribute('scale', feature.getAttribute('scale').get('value'));
            clonedFeature.setAttribute('icon', feature.getAttribute('icon').get('value'));
        }

        if (feature.get('type') === 'Text') {
            clonedFeature = this.createBasicFeature(
                'Text',
                clonedFeatureName,
                this.get('model.position'),
                feature.get('zIndex')
                );

            clonedFeature.setAttribute('text', feature.getAttribute('text').get('value'));
            clonedFeature.setAttribute('textAlignment', feature.getAttribute('textAlignment').get('value'));
            clonedFeature.setAttribute('lineHeight', feature.getAttribute('lineHeight').get('value'));
            clonedFeature.setAttribute('fontSize', feature.getAttribute('fontSize').get('value'));
            clonedFeature.setAttribute('fontFamily', feature.getAttribute('fontFamily').get('value'));
            clonedFeature.setAttribute('letterSpacing', feature.getAttribute('letterSpacing').get('value'));
            clonedFeature.setAttribute('strokeWidth2', feature.getAttribute('strokeWidth2').get('value'));
            clonedFeature.setAttribute('strokeWidth3', feature.getAttribute('strokeWidth3').get('value'));
            clonedFeature.setAttribute('strokeWidth4', feature.getAttribute('strokeWidth4').get('value'));
            clonedFeature.setAttribute('strokeStyle2', feature.getAttribute('strokeStyle2').get('value'));
            clonedFeature.setAttribute('strokeStyle3', feature.getAttribute('strokeStyle3').get('value'));
            clonedFeature.setAttribute('strokeStyle4', feature.getAttribute('strokeStyle4').get('value'));
        }

        if (clonedFeature) {
            clonedFeature.setAttribute('top', parseFloat(feature.getAttribute('top').get('value')) + clonedFeatureOffset);
            clonedFeature.setAttribute('left', parseFloat(feature.getAttribute('left').get('value')) + clonedFeatureOffset);

            clonedFeature.setAttribute('angle', feature.getAttribute('angle').get('value'));

            if (feature.getAttribute('fill')) {
                clonedFeature.setAttribute('fill', feature.getAttribute('fill').get('value'));
            }

            if (feature.getAttribute('strokeStyle1')) {
                clonedFeature.setAttribute('strokeWidth1', feature.getAttribute('strokeWidth1').get('value'));
                clonedFeature.setAttribute('strokeStyle1', feature.getAttribute('strokeStyle1').get('value'));
            }

            if (feature.getAttribute('opacity')) {
                clonedFeature.setAttribute('opacity', feature.getAttribute('opacity').get('value'));
            }

            if (feature.getAttribute('flipX') && feature.getAttribute('flipY')) {
                clonedFeature.setAttribute('flipX', feature.getAttribute('flipX').get('value'));
                clonedFeature.setAttribute('flipY', feature.getAttribute('flipY').get('value'));
            }

            clonedFeature.set('deleted', feature.get('deleted'));
        }

        return clonedFeature;
    }

});
