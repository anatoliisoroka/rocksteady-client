/* global $ */

import Ember from 'ember';

export default Ember.View.extend({
    templateName: 'design/position/autoselect',

    classNames: ['alternatives-autoselect'],

    actions: {
        hidePopover: function () {
            if (this.$()) {
                this.$().find('.modal').modal('hide');
            }
        }
    },

    didInsertElement: function () {

        var view = this;

        this._super();

        this.$().find('.modal')
            .modal({'backdrop': true, show: true})
            .on('hidden.bs.modal', function () {
                if (!$('#error-modal:visible').length && view && view.get('controller')) {
                    view.get('controller').replaceRoute('design.selector');
                }
            }.bind(this));
    }

});
