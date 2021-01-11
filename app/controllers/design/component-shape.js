import Ember from 'ember';

export default Ember.Controller.extend({

    component: Ember.computed.alias('model.component'),
    shape: Ember.computed.alias('model.shape'),

    hasZeroQuantity: function () {
        return this.get('component.quantity') === '0';
    }.property('component.quantity')

});
