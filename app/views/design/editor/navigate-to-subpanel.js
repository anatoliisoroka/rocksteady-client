import Ember from 'ember';
import config from '../../../config/environment';

export default Ember.View.extend({

    tagName: 'li',
    attributeBindings: ['name'],
    property: null,
    didInsertElement: function () {

        if (this.get('parentView.location') === 'subPanel') {
            this.set('isVisible', false);
            this.$().parent('li').css({'display' : 'none'});
        }

        if (this.get('controller.isTouch')) {
            this.$().append('<span class="more-icon sprite-touch-btn-more"></span>');
        } else {
            this.$().append('<span class="more-icon sprite-btn-more"></span>');
        }

        var property = this.get('property') || this.get('parentView.propertyName');
        this.set('property', property);

        if (property === 'fill') {
            this.$().attr('name', 'moreFillColours');
        } else if (property !== undefined && property.indexOf('strokeStyle') !== -1) {
            this.$().attr('name', 'moreBorderColours');
        }

        if (config.APP.tooltips && this.$()) {
            this.$().tooltip({
                placement: 'top',
                'title': this.get('controller.i18n').t('editor.see_more').toString(),
                html: true,
                container: 'body'
            });
        }
    },

    click: function () {
        if (config.APP.tooltips && this.$() && this.$().tooltip) {
            this.$().tooltip('hide');
        }

        this.changeActive();
    },

    changeActive: function () {
        this.get('controller.controllers.design/editor').set('activeProperty', this.get('property'));
    },

    willDestroyElement: function () {
        if (config.APP.tooltips && this.$() && this.$().tooltip) {
            this.$().tooltip('destroy');
        }
    }

});
