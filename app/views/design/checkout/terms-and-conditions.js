/* global logger, Handlebars, $ */

import Ember from 'ember';

export default Ember.View.extend({
    templateName: 'design/checkout/terms-and-conditions',

    tsAndCsHTML: '',

    init: function () {
        let self = this;
        let appController = self.get('controller.controllers.application');
        let controller = self.get('controller');
        let i18n = controller.get('i18n');

        let errorMessage = i18n.t('checkout.terms_and_conditions.error_message');
        let loadingMessage = i18n.t('checkout.terms_and_conditions.loading_message');


        self.set('controller.tsAndCsHTML', loadingMessage);

        appController.send('pushSpinner');

        $.ajax({
            url: 'branding/html/terms-and-conditions.html',
            dataType: 'text',
            success: function (res) {
                let ss = new Handlebars.SafeString(res);
                self.set('controller.tsAndCsHTML', ss);
                appController.send('popSpinner');
            },
            error: function (jqXHR, textStatus, errorThrown) {
                logger.error('Failed to load terms and conditions', errorThrown);
                appController.send('popSpinner');
                self.set('controller.tsAndCsHTML', errorMessage);
            }
        });

        this._super();
    },

    didInsertElement: function () {
        var view = this;

        this.$().find('.modal')
            .modal({backdrop: 'static', show: true})
            .on('hide.bs.modal', function () {
                view.get('controller').transitionToRoute('design.checkout');
            });
    },

    willDestroyElement: function () {
        this.$().find('.modal').modal({show: false});
    }
});
