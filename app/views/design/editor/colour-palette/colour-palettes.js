import Ember from 'ember';

export default Ember.View.extend({
    templateName: 'design/editor/colour_palettes_view',

    didInsertElement: function () {
        this._super();
    },

    strokeStyle1Style: Ember.computed('controller.model.strokeStyle1', function () {
        var backgroundColour = this.get('controller.model.strokeStyle1');
        return new Ember.Handlebars.SafeString('background-color: ' + backgroundColour);
    }),

    strokeStyle2Style: Ember.computed('controller.model.strokeStyle2', function () {
        var backgroundColour = this.get('controller.model.strokeStyle2');
        return new Ember.Handlebars.SafeString('background-color: ' + backgroundColour);
    }),

    strokeStyle3Style: Ember.computed('controller.model.strokeStyle3', function () {
        var backgroundColour = this.get('controller.model.strokeStyle3');
        return new Ember.Handlebars.SafeString('background-color: ' + backgroundColour);
    }),

    strokeStyle4Style: Ember.computed('controller.model.strokeStyle4', function () {
        var backgroundColour = this.get('controller.model.strokeStyle4');
        return new Ember.Handlebars.SafeString('background-color: ' + backgroundColour);
    })
});
