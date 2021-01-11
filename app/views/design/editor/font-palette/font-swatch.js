import Ember from 'ember';
import config from '../../../../config/environment';

export default Ember.View.extend({
    classNames: ['font-swatch'],
    attributeBindings: ['name'],
    tagName: 'li',
    templateName: 'design/editor/font-swatch',

    name: function () {
        var font_name = this.get('content.name') + 'Font';
        return font_name.camelize();
    }.property('content.name'),

    didInsertElement: function () {
        this._super();

        var font_name = this.get('content.name');

        if (config.APP.tooltips && this.$()) {
            this.$().tooltip({
                placement: 'top',
                'title': font_name,
                html: false
            });
        }
    },

    willDestroyElement: function () {
        if (config.APP.tooltips && this.$() && this.$().tooltip) {
            this.$().tooltip('destroy');
        }
    },

    click: function () {
        this.changeFont();
    },

    changeFont: function () {
        const feature = this.get('controller.model');
        const font = this.get('content');

        feature.setAndTrackAttributes([{ key: 'fontFamily', value: font.get('id') }]);

        // make this colour a design "favourite"
        feature.get('design.fonts')
            .removeObject(font)
            .unshiftObject(font);

        if (config.APP.tooltips && this.$() && this.$().tooltip) {
            this.$().tooltip('hide');
        }

        this.get('parentView').send('showTouchFontNameTooltip', this.get('content'));
    },

    actions: {
        showTooltip: function () {
            if (config.APP.tooltips && this.$() && this.$().tooltip) {
                this.$()
                    .tooltip('destroy')
                    .tooltip({ title: this.get('content.name') })
                    .tooltip('show');

                Ember.run.later(this, function () {
                    if (this.$() && this.$().tooltip) {
                        this.$().tooltip('destroy');
                    }
                }, 1000);
            }
        }
    }
});
