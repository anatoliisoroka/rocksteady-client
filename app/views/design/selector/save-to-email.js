/* globals $ */

import Ember from 'ember';

export default Ember.View.extend({
    templateName: 'design/selector/saveToEmail',
    classNames: ['email-design'],
    designService: Ember.inject.service('design-service'),
    selectorImage: undefined,

    actions: {
        hidePopover () {
            if (this.$()) {
                this.$().find('.modal').modal('hide');
            }
        }
    },

    didInsertElement () {
        this.$()
            .find('.modal')
            .modal({ 'backdrop': true, show: true })
            .on('shown.bs.modal', () => {
                if (this.$()) {
                    this.$().find('.email-address-input').focus();
                    this.$().find('.email-address-input').keyup((e) => {
                        if (e.keyCode === 13 && !this.get('controller.isEmailInvalid')) {
                            Ember.run(() => this.get('controller').send('save'));
                        }
                    });
                }
            })
            .on('hidden.bs.modal', () => {
                Ember.run(() => {
                    if (!$('#error-modal:visible').length && this && this.get('controller')) {
                        this.get('controller').replaceRoute('design.selector');
                    }
                });
            });

        this.get('designService')
            .toPNG(this.get('controller.controllers.design.model'))
            .then((selectorImage) =>
                this.set('selectorImage', selectorImage)
            );

        this._super();
    },

});
