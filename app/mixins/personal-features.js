import Ember from 'ember';

export default Ember.Mixin.create({
    personalFeaturesObserver: Ember.observer('model.icon', 'model.text', function () {
        if (this.get('userIsEditing') && ['Text', 'GraphicIcon'].includes(this.get('model.type'))) {
            Ember.run.once(this, 'updatePersonalFeature');
        }
    }),
    obtainFeatureValue (feature) {
        return feature.get('type') === 'Text' ?
            feature.get('text').replace(/^[\r\n]+|\.|[\r\n]+$/g, '') :
            feature.getAttribute('icon').get('value');
    },
    updatePersonalFeature () {
        const feature = this.get('model');
        feature.get('design.personalFeatures')
            .filterBy('name', feature.get('name'))
            .setEach('value', this.obtainFeatureValue(feature));
    }
});
