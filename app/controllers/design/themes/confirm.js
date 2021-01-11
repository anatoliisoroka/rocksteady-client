import Ember from 'ember';
import rsLogger from '../../../lib/rs-logger';

export default Ember.Controller.extend({

    needs: ['design', 'design/themes', 'design/selector', 'application'],

    analytics: Ember.inject.service(),

    error: false,

    allPositionsPreviewUrl: function () {
        let previews = this.get('model.previews');
        if (previews) {
            let preview = previews.objectAt(0);
            if (preview) {
                return preview.image_url;
            }
        }
    }.property('model'),

    fillParams (design, theme_id) {
        const allParams = [
            { use_category_id: design.get('useCategory.id') },
            { rule_set_id: design.get('ruleSet.id') },
            { use_id: design.get('use_id') },
            { target_id: design.get('target.id') },
            { target_category_id: design.get('targetCategory.id') },
            { target_kit_id: design.get('targetKit.id') },
            { product_line_id: design.get('productLine.id') },
            { manufacturer_id: design.get('manufacturer.id') },
            { theme_id }
        ];
        // do not send params with empty values
        return Object.assign({}, ...allParams.filter((param) => Object.values(param)[0]));
    },
    isUserFlagFeature (featureName) {
        return featureName === 'User Flag';
    },
    obtainUserFlagValue (regionId) {
        return this
            .get('store')
            .getById('region', regionId)
            .get('graphicId');
    },
    setActiveStatus (personalFeature, linkedFeatureNames) {
        personalFeature.set(
            'active',
            linkedFeatureNames.includes(personalFeature.get('name'))
        );
    },
    createPersonalFeature (personalFeature) {
        return this.store.createRecord('personalFeature', personalFeature);
    },
    obtainValue (name, defaultValue) {
        return this.isUserFlagFeature(name) ?
            this.obtainUserFlagValue(defaultValue) : defaultValue;
    },
    mergePersonalAndLinkedFeatures (personalFeatures, linkedFeatures) {
        return linkedFeatures
            .map((linkedFeature) => {
                const name = linkedFeature.get('id');
                const personalFeature = personalFeatures.findBy('name', name);
                if (personalFeature && personalFeature.get('value')) {
                    return personalFeature;
                }

                const value = this.obtainValue(name, linkedFeature.get('defaultValue'));
                const prompted = linkedFeature.get('prompted');
                if (personalFeature) {
                    personalFeature.set('prompted', prompted);
                    personalFeature.set('value', value);
                    return personalFeature;
                }

                const newPersonalFeature = this.createPersonalFeature({ name, value, prompted });
                personalFeatures.pushObject(newPersonalFeature);
                return newPersonalFeature;
            });
    },
    obtainMergedPersonalFeatures (personalFeatures, linkedFeatures) {
        const linkedFeatureNames = linkedFeatures.mapBy('id');
        personalFeatures.forEach((personalFeature) =>
            this.setActiveStatus(personalFeature, linkedFeatureNames)
        );
        return this.mergePersonalAndLinkedFeatures(personalFeatures, linkedFeatures);
    },
    createAttribute (feature, value) {
        return this.store.createRecord(
            'fattribute',
            {
                name: (feature.get('isTextFeature') ? 'Text' : 'Icon'),
                value,
                position: feature.get('position')
            }
        );
    },
    valueAttributeNotIncluded (feature) {
        return !feature
            .get('fattributes')
            .mapBy('name')
            .includes(feature.get('isIconFeature') ? 'Icon' : 'Text');
    },
    createAndAssignAttribute (feature, theme, value) {
        const fattribute = this.createAttribute(feature, value);
        feature.get('fattributes').pushObject(fattribute);
        theme.get('fattributes').pushObject(fattribute);
    },
    mergeAttributesWithPersonalFeatures (theme, personalFeatures) {
        const personalFeatureNames = personalFeatures.mapBy('name');
        theme.get('features')
            .filter((feature) =>
                ['GraphicIcon', 'Text'].includes(feature.get('type')) &&
                personalFeatureNames.includes(feature.get('name'))
            )
            .forEach((feature) => {
                const personalFeature = personalFeatures.findBy('name', feature.get('name'));
                const value = personalFeature.get('value');
                const valueAttr = feature.get('fattributes')
                    .filterBy('name', feature.get('isIconFeature') ? 'Icon' : 'Text')
                    .get('firstObject');

                if (valueAttr) {
                    valueAttr.set('value', value);
                    if (Ember.isBlank(theme.get('fattributes').findBy('id', valueAttr.get('id')))) {
                        theme.get('fattributes').pushObject(valueAttr);
                    }
                } else {
                    this.createAndAssignAttribute(feature, theme, value);
                }
            });
    },
    setDefaultTextValueIfEmpty (theme) {
        theme.get('features')
            .filter((feature) =>
                feature.get('isTextFeature') && this.valueAttributeNotIncluded(feature)
            )
            .forEach((feature) =>
                this.createAndAssignAttribute(feature, theme, 'Edit')
            );
    },
    mergeThemeWithPersonalFeatures (theme, personalFeatures) {
        this.mergeAttributesWithPersonalFeatures(theme, personalFeatures);
        this.setDefaultTextValueIfEmpty(theme);
        return theme;
    },
    loadThemeAndPersonalFeatures (themeId) {
        const design = this.store.all('design').get('firstObject');
        return new Ember.RSVP.Promise((resolve, reject) =>
            Ember.RSVP
                .all([
                    this.store.fetchById('theme', themeId),
                    this.store.find('linkedFeature', this.fillParams(design, themeId))
                ])
                .then(([ theme, linkedFeatures ]) =>
                    resolve(
                        this.mergeThemeWithPersonalFeatures(
                            theme,
                            this.obtainMergedPersonalFeatures(design.get('personalFeatures'), linkedFeatures)
                        )
                    )
                )
                .catch((err) =>
                    reject(err)
                )
        );
    },

    actions: {
        confirmThemeSelection () {
            const applicationController = this.get('controllers.application');
            const themeId = this.get('model.id');

            applicationController.send('pushSpinner');

            this.loadThemeAndPersonalFeatures(themeId)
                .then((themeModel) => {
                    const selectorController = this.get('controllers.design/selector');
                    const themesController = this.get('controllers.design/themes');
                    selectorController.send('disableColourClash');

                    themesController.applyTheme(themeModel)
                        .then(() => {
                            if (this.get('controllers.design.model.hasThemeRegulationConflict')) {
                                this.replaceRoute('design.themes.regulated', themeModel.id);
                            } else {
                                this.replaceRoute('design.selector');
                            }
                        })
                        .catch((e) => {
                            rsLogger.error('ThemeApplyError', `Could not apply theme ${themeModel.id} because ${e}`);
                            themesController.unapplyTheme();
                            this.set('error', true);
                        })
                        .finally(() => {
                            applicationController.send('popSpinner');
                            selectorController.send('enableColourClash');
                        });
                });

            this.get('analytics').sendAnalyticsEvent('theme_applied', themeId);
        }
    }
});
