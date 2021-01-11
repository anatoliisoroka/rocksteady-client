import Ember from 'ember';

export default Ember.View.extend({
    templateName: 'design/editor/graphic_palette_view',
    classNames: ['graphic-palette'],

    didInsertElement: function () {
        this._super();
    },

    actions: {
        showTouchGraphicNameTooltip: function (colour) {
            Ember.run.later(this, function () {
                this.get('childViews').forEach(function (view) {
                    if (view.get('content.id') === colour.get('id')) {
                        view.send('showTooltip');
                    }
                });
            }, 500);
        }
    }

});
