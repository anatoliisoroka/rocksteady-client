import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'img',
    attributeBindings: ['src', 'alt'],
    src: null,

    didInsertElement() {
        let self = this;

        this.$().parent().addClass('loading');

        this.$().on('load', function (evt) {
            if (!self.get('isDestroyed')) {
                self.imageLoaded(evt);
            }
        }).on('error', function (evt) {
            if (!self.get('isDestroyed')) {
                self.imageError(evt);
            }
        });
    },

    willDestroyElement() {
        this.$().off('load', 'error');
    },

    imageLoaded() {
        this.$().parent().removeClass('loading');
        this.$().parent().addClass('loaded');
    },

    imageError() {
        this.$().parent().removeClass('loading');
        this.$().parent().addClass('loaded');
    }
});
