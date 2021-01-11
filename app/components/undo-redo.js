import Ember from 'ember';

export default Ember.Component.extend({
    classNames: ['undo-redo'],
    userActionService: Ember.inject.service('user-action-service'),
    undoDisabled: Ember.computed.alias('userActionService.cannotUndo'),
    redoDisabled: Ember.computed.alias('userActionService.cannotRedo'),

    actions: {
        undo () {
            this.get('userActionService').undo();
        },
        redo () {
            this.get('userActionService').redo();
        }
    }
});
