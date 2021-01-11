/* globals $ */

import Ember from 'ember';

export default Ember.View.extend({
    templateName: 'design/position/mirror',
    classNames: ['mirror-features'],

    done: false,
    fmcvRendered: false,
    isWorking: false,

    renderedThisPosition: function () {
        if (this.get('parentView.parentView.fabricMapCanvasView')) {
            var canvas = this.get('parentView.parentView.fabricMapCanvasView').renderSinglePosition(this.get('controller.model'));
            return canvas.toDataURL();
        }
    }.property('controller.model', 'done', 'fmcvRendered'),

    renderedOppositePosition: function () {
        if (this.get('parentView.parentView.fabricMapCanvasView')) {
            var canvas = this.get('parentView.parentView.fabricMapCanvasView').renderSinglePosition(this.get('controller.oppositePosition'));
            return canvas.toDataURL();
        }
    }.property('controller.oppositePosition', 'fmcvRendered'),

    actions: {
        mirrorFeatures: function () {
            this.send('dispatchControllerAction', 'mirrorFeaturesFromOppositePosition');
        },

        copyFeatures: function () {
            this.send('dispatchControllerAction', 'copyFeaturesFromOppositePosition');
        },

        dispatchControllerAction: function (action) {
            var view = this;

            this.set('isWorking', true);

            this.get('controller.controllers.application').send('pushSpinner');

            Ember.run.later(this, function () {
                if (view && !view.get('isDestroyed') && view.get('controller') && view.get('parentView')) {
                    view.get('controller').send(action);

                    view.get('parentView.parentView').rerender().then(function () {
                        view.get('controller.controllers.application').send('popSpinner');
                        view.set('done', true);
                    });
                } else {
                    view.get('controller.controllers.application').send('popSpinner');
                }
            }, 100);
        }
    },

    didInsertElement: function () {
        var view = this;
        var modal = this.$().find('.modal');

        modal.modal({'backdrop': true, show: true})
            .on('hidden.bs.modal', function () {
                Ember.run(function () {
                    if (!$('#error-modal:visible').length && view && view.get('controller')) {
                        view.get('controller').replaceRoute('design.selector');
                    }
                });
            }.bind(this));

        if (this.get('parentView.parentView.fabricMapCanvasView')) {
            this.get('parentView.parentView.fabricMapCanvasView').one('rendered', function () {
                if (view && !view.get('isDestroyed')) {
                    view.set('fmcvRendered', true);
                }
            });
        }

        this._super();
    },

    willDestroyElement: function () {
    }

});
