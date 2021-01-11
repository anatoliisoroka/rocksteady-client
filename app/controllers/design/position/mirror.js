import Ember from 'ember';
import FeatureController from '../feature';

export default Ember.Controller.extend({
    needs: ['design', 'application', 'design/selector', 'design/position'],
    mirrorPromptDoNotShowAgain: false,
    showAutoMirrorDoNotShowAgainOption: false,
    oppositePosition: Ember.computed.alias('controllers.design/position.oppositePosition'),
    sourcePosition : null,
    targetPosition: null,
    shouldPositionBeMirrored: null,
    canCopyFeatures: Ember.computed(
        'oppositePosition',
        'model',
        'activeShape.id',
        function () {
            this.set('sourcePosition', this.get('oppositePosition'));
            this.set('targetPosition', this.get('model'));
            return this.get('targetPosition').get('activeShape.id') === this.get('sourcePosition').get('activeShape.id');
        }
    ),
    computeMirroredAngle (featureAngle) {
        const mirroredAngle = 360 - featureAngle;

        if (mirroredAngle > 180) {
            return mirroredAngle - 360;
        }
        if (mirroredAngle < -180) {
            return mirroredAngle + 360;
        }

        return mirroredAngle;
    },
    cloneTheFeature (feature, clonedFeature, mirrorOption) {
        if (mirrorOption) {
            clonedFeature.setAttribute('left', this.get('targetPosition').get('activeShape.width') - feature.get('left'));
            let mirroredAngle = this.computeMirroredAngle(feature.get('angle'));
            clonedFeature.setAttribute('angle', mirroredAngle);

            if (clonedFeature.get('isIconFeature')) {
                var tags = this.store.getById('graphic', clonedFeature.getAttribute('icon').get('value')).get('tags');

                if (tags && (tags.anyBy('name', 'shapes') || tags.anyBy('name', 'styles')) && !tags.anyBy('name', 'noflip')) {
                    clonedFeature.setAttribute('flipX', !feature.get('flipX'));
                }
            }
        }
        const targetPosition = this.get('targetPosition');
        clonedFeature.set('mirroredFromFeature', feature);
        clonedFeature.set('position', targetPosition);
        targetPosition
            .get('features')
            .pushObject(clonedFeature);

        this.get('sourcePosition.design.features')
            .pushObject(clonedFeature);

        clonedFeature
            .get('fattributes')
            .setEach('position', targetPosition);
    },
    cloneSingleFeature (feature) {
        const clonedFeature = FeatureController
            .create({ model: feature, container: this.container, store: this.store })
            .clone({ preserveFeatureName: true, preserveFeatureCoords: true });

        if (clonedFeature) {
            this.cloneTheFeature(feature, clonedFeature, this.get('shouldPositionBeMirrored'));
        }
    },
    removeTargetFeatures () {
        this.get('targetPosition.features')
            .filterBy('canModify')
            .forEach((feature) => feature.unload());

        this.get('sourcePosition.features')
            .filterBy('canModify')
            .map((feature) => this.cloneSingleFeature(feature));
    },
    handleComponentShapeFillAndStroke () {
        const sourceComponentShape = this.get('sourcePosition').get('features').filterBy('type', 'ComponentShape').get('firstObject');
        const targetComponentShape = this.get('targetPosition').get('features').filterBy('type', 'ComponentShape').get('firstObject');
        const setTargetAttribute = (name) =>
            targetComponentShape.setAttribute(
                name,
                sourceComponentShape.getAttribute(name).get('value')
            );

        setTargetAttribute('fill');

        if (sourceComponentShape.getAttribute('strokeStyle1')) {
            ['strokeWidth1', 'strokeStyle1', 'strokeInternal1', 'strokeFront1']
                .forEach(setTargetAttribute);
        }
    },
    doMirrorOrCopy () {
        this.removeTargetFeatures();
        this.handleComponentShapeFillAndStroke();
    },
    mirrorOrCopyFeatures () {
        if (!this.get('targetPosition.hasActiveComponent')) {
            this.get('controllers.design/position')
                .addPosition()
                .then(this.doMirrorOrCopy());
        } else {
            this.doMirrorOrCopy();
        }
    },
    handleDoNotShowAgainMirrorPrompt () {
        if (this.get('mirrorPromptDoNotShowAgain')) {
            this.set('controllers.design.model.doNotShowAutoMirrorAgain', true);
        }
    },
    performMirrorCopyOperation () {
        if (this.get('targetPosition')) {
            this.mirrorOrCopyFeatures(this.get('targetPosition'), this.get('sourcePosition'), this.get('shouldPositionBeMirrored'));
        }
    },
    actions: {
        mirrorFeaturesFromOppositePosition () {
            this.handleDoNotShowAgainMirrorPrompt();
            this.set('shouldPositionBeMirrored', true);
            this.performMirrorCopyOperation();
            this.get('controllers.design.model').save();
        },
        copyFeaturesFromOppositePosition () {
            this.handleDoNotShowAgainMirrorPrompt();

            this.set('shouldPositionBeMirrored', false);
            this.performMirrorCopyOperation();
        },
        dismissMirrorModal () {
            // save the shit out of the design
            this.get('controllers.design.model').save();
            // this is needed to forcibly tell ember-data the positions do not need to be saved as the design saved them
            // we are stuck with this until we upgrade / un-spaghetti the code
            // http://stackoverflow.com/questions/13342250/how-to-manually-set-an-object-state-to-clean-saved-using-ember-data
            const dirtyPosition = this
                .get('controllers.design.model.positions')
                .findBy('isDirty');
            if (dirtyPosition) {
                dirtyPosition.transitionTo('loaded.saved');
            }
        },
        noThanks () {
            this.handleDoNotShowAgainMirrorPrompt();
            this.transitionToRoute('design.selector');
        }
    }
});
