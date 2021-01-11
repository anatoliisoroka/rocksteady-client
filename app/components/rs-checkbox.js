import Ember from 'ember';

export default Ember.Component.extend({
    isChecked: false,
    isIndeterminate: false,
    title: '',
    name: '',
    label: '',
    position: 'left',

    positionLeft: Ember.computed.equal('position', 'left'),
    positionRight: Ember.computed.not('positionLeft'),

    actions: {
        toggle () {
            const newCheckedStatus = !this.get('isChecked');
            this.set('isChecked', newCheckedStatus);
            this.sendAction('onToggled', newCheckedStatus, this.get('name'));
        }
    }
});
