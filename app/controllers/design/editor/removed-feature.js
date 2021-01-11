import Ember from 'ember';

export default Ember.Controller.extend({
    needs: ['design/editor'],

    actions: {
        readdFeature: function () {
            this.set('model.hasBeenDeleted', true);
            this.set('model.deleted', false);
            this.replaceRoute('design.editor.feature', this.get('model'));
        }
    }

});
