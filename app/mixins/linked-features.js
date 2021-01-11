import Ember from 'ember';

export default Ember.Mixin.create({
    handleToastDisplay (feature, changedFeatures) {
        if (feature.get('hasBeenDeleted')) {
            Ember.run.later(() => feature.set('hasBeenDeleted', false));
        } else if (changedFeatures && this.get('controllers.application.currentPath') !== 'design.selector.index') {
            const t = this.get('i18n').t.bind(this.get('i18n'));

            this.get('controllers.application').send(
                'toast',
                t('editor.linked_feature_flash').toString(),
                'success',
                'toast-linkedfeature'
            );
        }
    },
    isSamePosition (linkedFeature, feature) {
        return linkedFeature.get('position') === feature.get('position') && !linkedFeature.get('deleted');
    },
    updateAttribute (linkedFeature, feature, name, value = feature.getAttribute(name).get('value')) {
        linkedFeature.setAttribute(name, value);
    },
    updateLinkedTextFeature (linkedFeature, feature) {
        [
            'fontFamily',
            'strokeStyle1',
            'strokeStyle2',
            'strokeStyle3',
            'strokeStyle4',
            'fill',
            'strokeWidth1',
            'strokeWidth2',
            'strokeWidth3',
            'strokeWidth4'
        ].map((attrName) => this.updateAttribute(linkedFeature, feature, attrName));
        this.updateAttribute(linkedFeature, null, 'text', feature.get('text').replace(/^[\r\n]+|[\r\n]+$/g, ''));
    },
    updateLinkedIconFeature (linkedFeature, feature) {
        [
            'icon',
            'strokeWidth1',
            'fill',
            'strokeStyle1'
        ].map((attrName) => this.updateAttribute(linkedFeature, feature, attrName));
        this.updateAttribute(linkedFeature, null, 'multicoloured', feature.get('multicoloured'));

        if (feature.get('isUserAddedGraphic')) {
            // http://redmine.motocal.com/issues/1118
            this.updateAttribute(linkedFeature, null, 'scale', feature.get('scale'));
        }
    },
    doLinkFeatures () {
        const feature = this.get('model');
        if (!feature.get('linked') || (!feature.get('isTextFeature') && !feature.get('isIconFeature'))) {
            return;
        }
        const {
            changedFeatures,
            changedThisPosition
        } = feature
            .get('design.features')
            .rejectBy('id', feature.get('id'))
            .rejectBy('deleted')
            .filterBy('name', feature.get('name'))
            .filterBy('type', feature.get('type'))
            .reduce(({ changedFeatures, changedThisPosition }, linkedFeature) => {

                if (feature.get('isTextFeature')) {
                    this.updateLinkedTextFeature(linkedFeature, feature);
                } else if (feature.get('isIconFeature')) {
                    this.updateLinkedIconFeature(linkedFeature, feature);
                }

                return {
                    changedFeatures: changedFeatures + 1,
                    changedThisPosition: (changedThisPosition + (this.isSamePosition(linkedFeature, feature) ? 1 : 0))
                };

            }, { changedFeatures: 0, changedThisPosition: 0 });

        this.handleToastDisplay(feature, changedFeatures && (changedFeatures !== changedThisPosition));

        if (changedThisPosition && this.get('controllers.design/editor.fabricEditorCanvasView')) {

            // edge case when there's a linked feature on the same position
            // (i.e. after mirror a position then restore old user number from bin)

            this.get('controllers.design/editor.fabricEditorCanvasView').rerender();
        }
    },
    propagateLinkedFeatureChange () {
        if (!this.get('controllers.application.config.APP.features.linked_features')) {
            return;
        }
        if (this.get('userIsEditing')) {
            Ember.run.once(this, 'doLinkFeatures');
        }
    }
});
