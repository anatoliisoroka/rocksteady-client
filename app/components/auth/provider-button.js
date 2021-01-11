import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'button',
    classNameBindings: [':auth-provider-button', 'isLoggingIn', 'providerKey'],
    providerKey: null,
    isLoggingIn: false,
    text: '',

    iconName: function () {
        let provider = this.get('providerKey');
        return 'icon/' + provider + '-logo';
    }.property('providerKey'),

    click() {
        this.sendAction('logIn', this.get('providerKey'));
    }
});
