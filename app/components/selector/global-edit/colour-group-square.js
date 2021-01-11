import Ember from 'ember';

export default Ember.Component.extend({
    classNames: ['colour-group-square'],

    colourGroupColours: Ember.computed.alias('colourGroup.group'),

    isGroup: Ember.computed.gt('colourGroupColours.length', 1),

    isUploadGroup: Ember.computed.equal('colourGroup.groupName', 'Upload'),

    isAcgColour:Ember.computed.alias('defaultColour.isAcgColour'),

    groupLength: Ember.computed.alias('colourGroupColours.length'),

    defaultColourId: Ember.computed.alias('colourGroup.default.id'),

    defaultColour: Ember.computed.alias('colourGroup.default'),

    actions: {
        selectColourGroup() {
            let isGroup = this.get('isGroup');
            if (isGroup) {
                this.sendAction('selectColourGroup', this.get('colourGroup'));
            } else {
                this.sendAction('selectColour', this.get('defaultColour'));
            }
        }
    }
});
