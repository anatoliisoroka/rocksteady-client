/* globals logger */

import {guid} from '../utils/string-util';
import config from '../config/environment';

export function initialize(/*application*/) {
    config.APP.session_id = guid();

    if (logger) {
        logger.setSessionId(config.APP.session_id);
    }
}

export default {
    name: 'init-session-id',
    initialize: initialize
};
