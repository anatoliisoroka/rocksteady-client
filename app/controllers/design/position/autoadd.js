import Ember from 'ember';

export default Ember.Controller.extend({

    needs: ['application', 'design/selector', 'design/position'],

    position: Ember.computed.alias('controllers.design/position.model'),
    oppositePosition: Ember.computed.alias('controllers.design/position.oppositePosition')

});

