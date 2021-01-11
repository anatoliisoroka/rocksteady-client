/* globals $ */

import Ember from 'ember';

export default Ember.View.extend({
    templateName: 'design/themes/regulated',

    didInsertElement: function () {
        var view = this,
            modal = this.$().find('.modal');

        modal.modal({'backdrop': true, show: true})
            .on('hidden.bs.modal', function () {
                Ember.run(function () {
                    if (!$('#error-modal:visible').length && view && view.get('controller')) {
                        view.get('controller').replaceRoute('design.selector');
                    }
                });
            }.bind(this));

        this._super();
    }

});
