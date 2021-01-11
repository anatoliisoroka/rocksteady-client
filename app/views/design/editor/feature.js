import Ember from 'ember';

export default Ember.View.extend({

    attributeBindings: ['isLoading'],

    didInsertElement: function () {
        var view = this;

        this._super();

        this.get('controller.controllers.design/editor').on('editingText', function () {
            view.set('controller.isEditTextAreaVisible', true);

            Ember.run.scheduleOnce('afterRender', this, function () {
                if (view.$()) {
                    //workaround focus blur focus to avoid unmoving issue #1047
                    view.$().find('.text-feature-input').focus().blur().focus().select();
                }
            });
        });

        Ember.run.later(this, function () {
            if (typeof this.$ === 'function' && typeof this.$() !== 'undefined') {
                this.$().find('.property-panel').removeClass('loading');
            }
        }, 500);

        Ember.run.later(this, function () {
            window.tourMediator.trigger('show-once-editor');
        }, 1000);
    }

});

