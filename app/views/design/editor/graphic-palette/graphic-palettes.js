import Ember from 'ember';

export default Ember.View.extend({
    templateName: 'design/editor/graphic_palettes_view',
    classNames: ['graphics', 'property-module'],

    didInsertElement: function () {
        this._super();
    }
});
