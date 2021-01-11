import Ember from 'ember';

export default Ember.View.extend({

    didInsertElement: function () {
        var view = this;

        this.$().find('.modal')
            .modal({backdrop: 'static', show: true})
            .on('hide.bs.modal', function () {
                view.get('controller.controllers.design/checkout').transitionToRoute('design.selector');
            });
    }

});
