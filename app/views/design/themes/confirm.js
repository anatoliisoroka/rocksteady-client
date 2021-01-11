import Ember from 'ember';

export default Ember.View.extend({
    templateName: 'design/themes/confirm',

    actions: {
        cancel: function () {
            this.get('controller').replaceRoute('design.themes');
        }
    },

    didInsertElement: function () {
        let modal = this.$().find('.modal');
        modal.modal({'backdrop': true, show: true});
        this._super(...arguments);
    },

    willDestroyElement: function () {
        let modal = this.$().find('.modal');
        modal.modal('hide');
        this._super(...arguments);
    }
});
