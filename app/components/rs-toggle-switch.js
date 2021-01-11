import Ember from 'ember';

export default Ember.Component.extend({
    tagName: '',
    value: true,
    disabled: false,

    icon1ClassName: Ember.computed('value', function() {
        const icon = `${this.get('icon1')}-`;

        if (this.get('disabled')) {
            return `${icon}disabled`;
        }

        return `${icon}${this.get('value') ? 'active' : 'inactive'}`;
    }),

    icon2ClassName: Ember.computed('value', function() {
        const icon = `${this.get('icon2')}-`;

        if (this.get('disabled')) {
            return `${icon}disabled`;
        }

        return `${icon}${this.get('value') ? 'inactive' : 'active'}`;
    }),

    button1ClassName: Ember.computed('value', function() {
        return `btn ${this.get('value') ? 'btn-primary' : 'btn-default'}`;
    }),

    button2ClassName: Ember.computed('value', function() {
        return `btn ${this.get('value') ? 'btn-default' : 'btn-primary'}`;
    }),

    actions: {
        toggle() {
            this.set('value', !this.get('value'));
            this.sendAction(this.get('value') ? 'action1' : 'action2');
        }
    }
});
