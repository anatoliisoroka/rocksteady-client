import Ember from 'ember';

/** @namespace Ember.Component */
export default Ember.Component.extend({
    tagName: '',
    isChecked: false,
    enabled: true,
    title: '',
    name: '',
    label: '',
    position: 'left',

    positionLeft: Ember.computed('position', function () {
        return this.get('position') === 'left';
    }),

    positionRight: Ember.computed('positionLeft', function () {
        return !this.get('positionLeft');
    }),

    actions: {
        toggle() {
            let enabled = this.get('enabled');

            if (enabled) {
                const newCheckedStatus = !this.get('isChecked');
                this.set('isChecked', newCheckedStatus);
                this.sendAction('onToggled', newCheckedStatus);
            }
        }
    }
});
