import Ember from 'ember';

export default Ember.Component.extend({
    personalFeatureToggled: Ember.observer('personalFeatures.@each.keep', function () {
        const personalFeatures = this.get('personalFeatures');
        const selectedFeaturesNo = personalFeatures.reduce((sum, { keep }) => sum + (keep ? 1 : 0), 0);
        const selectAll = selectedFeaturesNo === personalFeatures.length;

        this.set('selectSome', selectedFeaturesNo && !selectAll);
        this.set('selectAll', selectAll);
    }),
    actions: {
        closeModal () {
            this.set('modalOpen', false);
        },
        onSelectAllToggled (selectAll) {
            this.set('personalFeatures', this.get('personalFeatures').map(({ ref, id }) =>
                ({ ref, keep: selectAll, id})
            ));
        },
        onClear () {
            this.sendAction(
                'action',
                this
                    .get('personalFeatures')
                    .filterBy('keep')
                    .mapBy('id')
            );
            this.send('closeModal');
        },
        noop () {}
    }
});
