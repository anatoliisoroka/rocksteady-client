import Ember from 'ember';

export default Ember.Component.extend({

    toggleAccentColourGroupDeleted(accentColourGroup, deletedFlag) {
        accentColourGroup.group.forEach((group) => {
            let isStrokeStyle = group.fattribute.get('isStrokeStyle');

            if (isStrokeStyle) {
                group.fattribute.toggleStroke(deletedFlag);
            } else {
                let feature = group.feature;
                feature.set('deleted', deletedFlag);
            }
        });

        Ember.set(accentColourGroup, 'deleted', deletedFlag);
    },

    actions: {
        deleteAccentColourGroup: function (accentColourGroup) {
            const canDeleteGroup = !accentColourGroup.canDelete;
            let newDeletedFlag = !accentColourGroup.deleted;

            if (canDeleteGroup) {
                this.toggleAccentColourGroupDeleted(accentColourGroup, newDeletedFlag);
                this.sendAction('reRender');
            }
        },
        addAccentColourGroup: function (accentColourGroup) {
            let newDeletedFlag = !accentColourGroup.deleted;
            this.toggleAccentColourGroupDeleted(accentColourGroup, newDeletedFlag);
            this.sendAction('reRender');
        },
        editAccentColourGroup: function (accentColourGroup) {
            if (!accentColourGroup.deleted) {
                this.sendAction('editAccentColourGroup', accentColourGroup);
            }
        }
    }
});
