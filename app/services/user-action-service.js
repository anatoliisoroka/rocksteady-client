import Ember from 'ember';

export default Ember.Service.extend({
    _changeRouteService: Ember.inject.service('change-route-service'),
    _actions: {
        past: Ember.A(),
        future: Ember.A()
    },
    cannotUndo: Ember.computed.empty('_actions.past'),
    cannotRedo: Ember.computed.empty('_actions.future'),

    _handleUndoRedo (push, pop, type) {
        const action = pop.popObject();
        const { model } = action;

        this.get('_changeRouteService')
            .navigateTo(model)
            .then(() => {
                const { owner, changes = [], afterActions } = action;

                changes.forEach(({ name, values }) => {
                    const value = values[type];

                    switch (owner) {
                        case 'fattribute':
                            model.setAttribute(name, value);
                            break;
                        case 'feature':
                            model.set(name, value);
                            break;
                        default:
                            throw `Invalid action owner specified: ${owner}`;
                    }
                });

                if (!model.get('isIconFeaturePlaceholder')) {
                    push.pushObject(action);
                }

                const afterAction = afterActions && afterActions[type];

                if (afterAction) {
                    afterAction(changes);
                }
            });
    },
    undo () {
        if (this.get('cannotUndo')) {
            return;
        }

        this._handleUndoRedo(this.get('_actions.future'), this.get('_actions.past'), 'undo');
    },
    redo () {
        if (this.get('cannotRedo')) {
            return;
        }

        this._handleUndoRedo(this.get('_actions.past'), this.get('_actions.future'), 'redo');
    },
    appendAction (action) {
        this.get('_actions.past').pushObject(action);
        this.get('_actions.future').clear();
    },
    nuke () {
        this.get('_actions.past').clear();
        this.get('_actions.future').clear();
    }
});
