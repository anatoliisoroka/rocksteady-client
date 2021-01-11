/* global logger */

import DS from 'ember-data';
import config from '../config/environment';

var DEFAULT_ICON_WIDTH = 57;

export default DS.Model.extend({

    type: 'QRON',
    icon: '',
    top: 0,
    left: 0,
    angle: 0,
    zIndex: 9999,
    multicoloured: true,
    deleted:    false,
    scale:      function () {

        // want the qron to be the size in config.APP.qron_size_mm so scale
        // based on motocal's px->mm constant e.g. if qron_size_mm is 14, then
        // scale should be ~0.7 this is based on the qron library generating
        // a qron of 57x57 (which is dependent on the encoded urls)

        var matches = (/width="(\d+)"/.exec(this.get('icon')));
        var iconWidth = DEFAULT_ICON_WIDTH;

        if (!matches) {
            logger.warn('QronSizeWarning', 'QRON feature is missing size. Defaulting to ' + DEFAULT_ICON_WIDTH + '... QRON may be printed incorrectly.');
        } else {
            iconWidth = parseInt(matches[1]);
        }

        var scale = 1 / (iconWidth * (1 / config.APP.motocal_mm_px_ratio) / config.APP.qron_size_mm);

        /*
         *logger.debug(
         *    'Based on the generated QRON feature of width = ' + iconWidth + 'px, ' +
         *    'the Motocal mm:px ratio = ' + config.APP.motocal_mm_px_ratio + ' and ' +
         *    'the desired QRON size = ' + config.APP.qron_size_mm + 'mm, ' +
         *    'I will scale the feature by ' + scale);
         */

        return scale;

    }.property()

});
