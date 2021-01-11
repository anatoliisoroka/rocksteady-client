import Ember from 'ember';

export default Ember.Service.extend({
    _router: Ember.computed(function () {
        return this.get('container').lookup('router:main');
    }),

    navigateTo (model) {
        return this.get('_router').transitionTo('design.editor.feature', model).promise;
    }
});
