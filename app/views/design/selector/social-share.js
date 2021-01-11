/* globals $, logger */

import Ember from 'ember';
import {getPageURL} from '../../../utils/url-util';
import config from '../../../config/environment';

export default Ember.View.extend({
    templateName: 'design/selector/socialShare',
    classNames: ['share-design'],

    didInsertElement: function () {
        var view = this;
        var modal = this.$().find('.modal');

        modal.modal({'backdrop': true, show: true})
            .on('hidden.bs.modal', function () {
                Ember.run(function () {
                    if (!$('.email-design .modal').length && !$('#error-modal:visible').length && view && view.get('controller')) {
                        view.get('controller').replaceRoute('design.selector');
                    }
                });
            }.bind(this));

        this._super();
    },

    actions: {
        shareOnFacebook: function () {
            if (!this.get('controller.model.url')) {
                const message = 'Missing url from social share.';
                logger.error('FacebookShareError', 'Could not share on facebook: ' + JSON.stringify(message));
                this.get('controller.controllers.application').send('showApplicationError', message);
                return;
            }

            const w = 550,
                h = 550,
                l = (screen.width / 2) - (w / 2),
                t = (screen.height / 2) - (h / 2);
            const windowFeatures = [
                'toolbar=no',
                'location=no',
                'directories=no',
                'status=no',
                'menubar=no',
                'scrollbars=no',
                'resizable=yes',
                'copyhistory=no',
                `width=${w}`,
                `height=${h}`,
                `top=${t}`,
                `left=${l}`
            ];
            const url = `${config.APP.facebook_share_url}${config.APP.facebook_share_id}&href=${this.get('controller.model.url')}&redirect_uri=${getPageURL('close.htm')}`;

            window.open(url, 'Facebook', windowFeatures.join(', '));
            this.$().find('.modal').modal('hide');
        }
    }

});
