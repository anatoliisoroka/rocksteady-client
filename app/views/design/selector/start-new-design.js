/* globals $ */

import Ember from 'ember';

export default Ember.View.extend({
    templateName: 'design/selector/startNewDesign',

    didInsertElement: function () {
        var view = this;
        this.$modal = this.$().find('.modal');

        this.$modal.modal({'backdrop': true, show: true})
            .on('hidden.bs.modal', function () {
                Ember.run(() => {
                    if (!$('#error-modal:visible').length && view && view.get('controller')) {

                        if (view.get('willStartNewDesign')) {
                            view.get('controller.controllers.application').send('restartInterview');
                        }
                        else {
                            view.get('controller').replaceRoute('design.selector');
                        }
                    }
                });
            }.bind(this));

        this._super();
    },

    actions: {
        startNewDesign () {
            this.get('controller').startNewDesign().then(() => {
                this.set('willStartNewDesign', true);
                this.$modal.modal('hide');
            });
        }
    }

});
