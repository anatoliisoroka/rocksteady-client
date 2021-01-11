import Ember from 'ember';

export default Ember.View.extend({

    templateName: 'design/editor/edit-feature-text',
    classNames: ['edit-feature-text'],

    click () {
        this.get('controller.controllers.design/editor').send('backToMainPanel');
        this.set('controller.isEditTextAreaVisible', true);
        this.set('controller.model.previousTextValue', this.get('controller.model.text'));
        this.get('controller.controllers.design/editor').trigger('editingText');
    }
});
