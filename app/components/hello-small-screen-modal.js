/* global $ */

import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'div',

    didInsertElement () {
        this.showModal();

        window.addEventListener("orientationchange", this.removeMaxWidth, false);
    },

    showModal: Ember.observer('shown', function () {
        if (this.get('shown', true)) {
            var $modal = this.$().find('.modal');
            $modal.modal('show');

            $modal.on('hidden.bs.modal', () => {
                this.set('shown', false);
            });

            $modal.on('shown.bs.modal', () => {
                //set max width to avoid landscape on iPhone
                var $modalDialog = this.$().find('.modal-dialog');
                $modalDialog.css('max-width', $modalDialog.width());
            });
        }
    }),

    removeMaxWidth () {
        $('.modal-dialog').css('max-width', 'initial');
    },

    willDestroyElement: function () {
        window.removeEventListener("orientationchange", this.removeMaxWidth, false);
    }
});
