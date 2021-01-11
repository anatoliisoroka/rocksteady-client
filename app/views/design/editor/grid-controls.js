import Ember from 'ember';

export default Ember.View.extend({
    classNames: ['editor-grid-controls', 'btn-group'],
    templateName: 'design/editor/grid-controls',

    isGridActive: Ember.computed.alias('controller.controllers.application.useEditorGrid'),

    actions: {
        disableEditorGrid: function () {
            if (this.get('controller.controllers.application.useEditorGrid') === true) {
                this.set('controller.controllers.application.useEditorGrid', false);
            }
        },

        enableEditorGrid: function () {
            if (this.get('controller.controllers.application.useEditorGrid') === false) {
                this.set('controller.controllers.application.useEditorGrid', true);
            }
        }
    }
});
