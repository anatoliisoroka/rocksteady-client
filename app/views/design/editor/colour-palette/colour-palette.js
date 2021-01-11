import Ember from 'ember';

export default Ember.View.extend({
    tagName: 'ul',
    classNames: ['colour-palette'],
    templateName: 'design/editor/colour-palette',
    attributeBindings: ['name'],

    showMoreButton: false,

    didInsertElement: function () {
        this._super();
    },

    actions: {
        showTouchColourNameTooltip: function (colour) {
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
