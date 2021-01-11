/* global logger */

import Ember from 'ember';

export default Ember.Route.extend({
    _userActionService: Ember.inject.service('user-action-service'),

    beforeModel: function (params) {
        var route = this;

        return new Ember.RSVP.Promise(function (resolve) {
            Ember.run.later(route, function () {
                resolve(route.store.getById('position', params.position_id));
            }, 300);
        });
    },

    setupController: function (controller, model) {
        this._super(controller, model);

        Ember.run.later(this, function () {
            controller.set('enableDirtyAttributeObserver', true);
        }, 1);

        var feature = this.modelFor('feature');

        controller.send('removePlaceholderGraphics');
        controller.set('featureActive', false);
        controller.set('removedFeaturesPanelOn', false);

        if (!feature || feature.get('isDestroyed') || feature.get('deleted') || feature.get('position') !== model) {
            //   Make an interesting feature active
            feature = controller.get('interestingFeatures.firstObject');
        }
        //   Tell the Ember router where we are
        this.transitionTo('design.editor.feature', feature);
    },

    afterModel: function (model) {
        this.controllerFor('application').send('popSpinner');
        // FIXME - this looks like the source of the mirroring issues
        // MOT-1471-MirrorPrompt
        Ember.run.later(this, function () {
            // For some reason, positions are becoming dirty after automirror
            // http://redmine.motocal.com/issues/1101#note-7
            if (model && model.get('isDirty')) {
                model.save();
            }
        }, 1000);
    },

    activate () {
        this._super();

        this.controllerFor('application').send('clearAllToasts');

        Ember.run.scheduleOnce('routerTransitions', this, function () {
            this.controllerFor('interview').get('controllers.progressBar').send('designStage');
            this.controllerFor('interview').set('controllers.progressBar.isProgressBarVisible', true);
        });
    },

    deactivate () {
        this.unloadDeletedFeatures();
        this.controllerFor('interview').set('controllers.progressBar.isProgressBarVisible', false);
        this.controllerFor('design/editor').send('removePlaceholderGraphics');
        this.get('_userActionService').nuke();
    },

    unloadDeletedFeatures () {
        this.controllerFor('design/editor')
            .get('model.features')
            .filterBy('deleted')
            .forEach((feature) =>
                feature.unload()
            );
    },

    canvas: null,

    events: {
        deactivate: function () {
            // set any active features to inactive
            this.get('controller.features').forEach(function (feature) {
                if (feature.get('active') === true) {
                    feature.set('active', false);
                }
            });
            // set featureActive editor property to false
            this.set('controller.featureActive', false);
            this.set('activeFeature', null);
        }
    },

    actions: {
        loading: function () {
            this.controllerFor('application').send('pushSpinner');
        },

        error: function (reason, transition) {
            logger.error('EditorRoutingError', reason);
            this.transitionTo('design.selector',
                transition.params.manufacturer,
                transition.params.target,
                transition.params.target_category,
                transition.params.grouped_year,
                transition.params.design_id);
        }
    }
});
