import Ember from 'ember';

export default Ember.View.extend({
    templateName: 'design/editor/font_palette_view',
    classNames: ['font-palette'],
    showMoreButton: false,
    didInsertElement: function () {
        this._super();
    },

    actions: {
        showTouchFontNameTooltip: function (colour) {
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
