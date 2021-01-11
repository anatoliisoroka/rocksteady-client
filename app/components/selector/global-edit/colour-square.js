import Ember from 'ember';

export default Ember.Component.extend({
    classNames: ['colour-square'],
    store: Ember.inject.service(),
    colourId: null,

    setColour: function () {
        const colourId = this.get('colourId');
        const store = this.get('store');

        if (colourId) {
            const colour = store.getById('colour', colourId);
            const displayRgb = colour.get('displayRgb');

            this.$().css({
                background: displayRgb
            });
        }
    }.observes('colourId').on('didInsertElement')
});
