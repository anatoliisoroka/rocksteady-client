/* global logger */

import { cmpStringsWithNumbers } from '../utils/string-util';

export function initialize(application) {

    window.addEventListener('message', function (event) {
        if (event.source !== window || !event.data.type) {
            return;
        }

        const featureController = application.container.lookup('controller:design.editor.feature');

        if (!featureController) {
            return;
        }

        // populate the feature name dropdown in the editor only
        const currentRoute = application.container.lookup("controller:application").get("currentRouteName");

        if (event.data.type === 'fam_get_available_feature_names' && currentRoute === 'design.editor.feature.index') {
            const store = application.container.lookup('store:main');
            const design = store.all('design').get('lastObject');
            const features = design.get('features');
            const currentFeatureNames = features
                .rejectBy('deleted')
                .filterBy('type', featureController.get('model.type'))
                .rejectBy('type', 'ComponentShape')
                .mapBy('name')
                .uniq()
                .concat()
                .sort(cmpStringsWithNumbers);

            const currentFeatures = {
                names: currentFeatureNames,
                currentFeatureIdx: currentFeatureNames.findIndex((featureName) =>
                    featureName === featureController.get('model.name')
                )
            };

            logger.debug(JSON.stringify(currentFeatures.names));

            window.postMessage({
                type: 'fam_available_feature_names',
                version: '2.0',
                data: JSON.stringify(currentFeatures)
            }, '*');

        } else if (event.data.type === 'fam_set_current_feature_name') {
            const model = featureController.get('model');
            if (!event.data.name || !model) {
                window.postMessage({
                    type: 'fam_set_current_feature_name_err',
                    version: '2.0',
                    data: ''
                }, '*');
            } else {
                model.set('name', event.data.name);
                window.postMessage({
                    type: 'fam_set_current_feature_name_ok',
                    version: '2.0',
                    data: ''
                }, '*');
            }
        }
    });
}

export default {
    name: 'ext-featurename',
    initialize: initialize
};
