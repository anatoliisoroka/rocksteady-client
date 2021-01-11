import Ember from 'ember';

export default Ember.Component.extend({
    classNames: ['colour-selector'],
    acgColours: [],

    colourGroup: function(){
        let acgColours = this.get('acgColours');
        let colours = this.get('colours');
        return colours.map((colour) => {
            return {
                colour: colour,
                isAcgColour: acgColours.contains(colour)
            }
        });
    }.property('acgColours', 'colours'),

    actions: {
        selectColour(colour) {
            this.sendAction('selectColour', colour);
        }
    }
});
