/* global logger */

import Ember from 'ember';
import config from '../../../config/environment';

export default Ember.Route.extend({

    setupController: function (controller, model) {
        this._super(controller, model);

        if (!config.APP.features.auto_select || !controller.get('oppositePositionMatchingShape')) {
            this.transitionTo('design.selector');
        }

        if (this.controllerFor('design').wasBuiltEarlierThan('2015-w37-rc1')) {
            logger.warn('AutoselectAppVersionWarning', 'User tried to use the \'auto-select\' feature, but the kit was built with an unsupported app version=' + this.controllerFor('design').get('model.builtWithAppVersion'));
            this.transitionTo('design.selector');
        }
    }

});
