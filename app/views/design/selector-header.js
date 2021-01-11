import Ember from 'ember';
import config from '../../config/environment';

export default Ember.View.extend({

    flashHeaderPrice: false,
    savingChangedState: true,

    didInsertElement: function () {
        if (config.APP.tooltips && this.$()) {
            this.$().find('[title]').tooltip({container: 'body' });
        }
    },

    savingChangedStateObserver: function () {
        if (this.get('controller.controllers.application.bootstrapBreakpoint') === 'xs') {
            this.set('savingChangedState', false);
        } else {
            this.set('savingChangedState', true);

            Ember.run.later(this, function () {
                if (this && !this.get('isDestroyed')) {
                    this.set('savingChangedState', false);
                }
            }, 200);
        }
    }.observes('controller.controllers.design.isSaving'),

    priceObserver: function () {

        var view = this;

        if (this.get('lastPrice')) {
            this.set('flashHeaderPrice', true);
        }

        Ember.run.later(this, function () {
            if (view && !view.get('isDestroyed')) {
                view.set('flashHeaderPrice', false);
                view.set('lastPrice', view.get('controller.controllers.design.model.localTotalPrice'));
            }
        }, 1000);

    }.observes('controller.controllers.design.model.localTotalPrice'),

    mouseEnter: function () {
        if (!config.APP.testing) {
            this.get('controller').replaceRoute('design.selector');
        }
    },

    willDestroyElement: function () {
        if (config.APP.tooltips && this.$() && this.$().tooltip) {
            this.$().find('[title]').tooltip('destroy');
        }
    }
});
