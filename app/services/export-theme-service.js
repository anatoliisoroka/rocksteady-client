import Ember from 'ember';
import rsLogger from '../lib/rs-logger';
import DesignAdapter from '../adapters/design';
import RsEditorCanvas from '../lib/rs-editor-canvas';
import config from '../config/environment';
import rsUiUtils from 'npm:rs-ui-utils';

export default Ember.Service.extend({
    store: Ember.inject.service('store'),
    designService: Ember.inject.service('design-service'),

    exportTheme (design, themeName) {
        this.prepareThemeForExport(design)
            .then((data) => {
                const fileName = `${themeName}.json`;
                const { theme, exporterVersion } = rsUiUtils.exportTheme(data, themeName);
                const exportMetadata = {
                    clientAppVersion: config.APP.version,
                    exporterVersion
                };

                rsUiUtils.downloadObjectAsFile(
                    Object.assign({}, theme, { exportMetadata }),
                    fileName
                );
            });
    },

    prepareThemeForExport (design) {
        const productLine = design.get('productLine.name');
        const targetCategory = design.get('targetCategory.name');
        const store = this.get('store');
        let promises = [];

        const themeDefaultsPromise = (productLine && targetCategory) ?
            new Ember.RSVP.Promise((resolve) =>
                Ember.$.ajax({
                    url: `branding/theme-defaults/${productLine}/${targetCategory}.json`,
                    dataType: 'json'
                }).then((newFeaturesValues) => {
                    const oldFeatures = design.get('features');

                    _(newFeaturesValues)
                        .pickBy((newFeatureValue) => !!newFeatureValue)
                        .forEach((newFeatureValue, k) =>
                            oldFeatures
                                .filterBy('name', k)
                                .forEach((oldFeature) => {
                                    if (oldFeature.get('isIconFeature')) {
                                        promises.push(store.find('graphic', newFeatureValue).then((graphic) => {
                                            oldFeature.set('iconObject', graphic);
                                        }));
                                    } else if (oldFeature.get('isTextFeature')) {
                                        oldFeature.setAttribute('text', newFeatureValue);
                                    }
                                })
                        );

                    Ember.run(null, resolve);
                }, (jqXHR, textStatus, errorThrown) => {
                    rsLogger.warn('FamOverrides', `Failed to load FAM overrides: ${errorThrown}`);
                    jqXHR.then = null; // tame jQuery's ill mannered promises
                    Ember.run(null, resolve);
                })
            )
            :
            Ember.RSVP.Promise.resolve();

        return new Ember.RSVP.Promise((resolve, reject) =>
            themeDefaultsPromise
                .then(() =>
                    Ember.RSVP.all(promises)
                )
                .then(() => {
                    const updateDesign = compose(
                        filterFeaturesWithExistingPositionAndAttributes,
                        filterFeaturesWithPositionAndAttributes,
                        flagFeaturesAsTheme,
                        filterUndeletedFeaturesAndAttributes
                    );

                    const json = updateDesign(new DesignAdapter().serializeFull(design._createSnapshot(), { store }));
                    const designPngPromise = this.get('designService')
                        .toPNG(
                            design,
                            {
                                excludeWatermark: true,
                                transparentCanvas: true,
                                width: design.get('width') * 0.5,
                                height: design.get('height') * 0.5
                            }
                        );

                    return Ember.RSVP.all([
                        json,
                        designPngPromise
                    ]);
                })
                .then(([ json, allPositionsSelectorPng ]) =>
                    Ember.RSVP.all([
                        json,
                        allPositionsSelectorPng,
                        themePngs(design)
                    ])
                )
                .then(([ json, allPositionsSelectorPng, themePreviews ]) =>
                    resolve({
                        data: Object.assign(
                            {},
                            json,
                            {
                                previews: themePreviews
                                    .concat([{ name: 'All Positions', image_url: allPositionsSelectorPng }])
                                    .filter(({ image_url }) => image_url)
                            }
                        ),
                        type: 'kit',
                        fileName: `${design.get('description')}.json`,
                        metadata: {
                            description: design.get('description'),
                            design_url: window.location.toString(),
                            product_line_id: design.get('productLine.id'),
                            target_id: design.get('target.id'),
                            target_category_id: design.get('targetCategory.id'),
                            manufacturer_id: design.get('manufacturer.id'),
                            grouped_year_id: design.get('targetKit.id'),
                            rule_set_id: design.get('ruleSet.id'),
                            use_category_id: design.get('useCategory.id'),
                            product_line_name: design.get('productLine.name'),
                            target_name: design.get('target.name'),
                            target_category_name: design.get('targetCategory.name'),
                            manufacturer_name: design.get('manufacturer.name'),
                            grouped_year: design.get('targetKit.name'),
                            rule_set_name: design.get('ruleSet.name'),
                            use_category_name: design.get('useCategory.name'),
                            use_path: design.get('usePath')
                        }
                    })
                )
                .catch((err) => {
                    rsLogger.error('service.exportThemeService:prepareThemeForExport', `Failed to generate JSON: ${err}`);
                    reject(err);
                })
        );
    }
});

function filterCommon(filterFn, design) {
    const { features, attributes } = design;
    const filteredFeatures = features
        .filter(filterFn);

    const filteredFeatureIds = filteredFeatures
        .map(({ link }) => link);

    const relevantAttributes = attributes
        .filter(({ feature_id }) => filteredFeatureIds.includes(feature_id));

    return Object.assign({}, design, { features: filteredFeatures, attributes: relevantAttributes });

}

function filterFeaturesWithExistingPositionAndAttributes(design) {
    const hasExistingPosition = ((designPositionIds) => ({ position_id }) =>
            designPositionIds.includes(position_id)
    )(design.positions.map(({ id }) => id));

    return filterCommon(hasExistingPosition, design);
}

function filterFeaturesWithPositionAndAttributes(design) {
    const hasPosition = ({ position_id }) => position_id;
    return filterCommon(hasPosition, design);
}

function filterUndeletedFeaturesAndAttributes(design) {
    const isExisting = ({ deleted }) => !deleted;
    return filterCommon(isExisting, design);
}

function flagFeaturesAsTheme(design) {
    return Object.assign({}, design, {
        features: design.features.map((feature) => Object.assign({}, feature, { is_theme_feature: true }))
    });
}

function themePngs(design) {
    let previews = [];

    const allPromises = design.get('positions')
        .map((position) =>
            pngForPosition(design, position)
                .then((pngData) => {
                        previews.push({
                            name: position.get('name'),
                            image_url: pngData
                        });
                })
                .catch((e) => {
                    rsLogger.warn('ext-dataexport', `${e}: ${position.get('name')}`)
                })
        );

    return Ember.RSVP.Promise
        .all(allPromises)
        .then(() => previews);
}

function pngForPosition(design, position) {
    return new Ember.RSVP.Promise(function (resolve, reject) {
        let shape = position.get('activeShape');

        if (!shape) {
            reject('Ignoring position with no active shape');
        }

        let positionIsIncluded = position.get('isIncluded');

        if (!positionIsIncluded) {
            reject('Ignoring not included position');
        }

        let rsEditorCanvasOptions = {
            width: shape.get('width'),
            height: shape.get('height'),
            canvasType: 'static',
            canvasPadding: 10,
            virtualContainerOn: true,
            maskOn: true,
            dropShadow: true,
            skipDeletedFeatures: true,
            showQRONs: false,
            noScale: false,
            redrawInterval: 0,
            shadowBlend: '0 0 30px rgba(0,0,0,0.4)',
            shadowHard: '10px 10px 0px rgba(0,0,0,0.2)',
            onRender: function (rsCanvas) {
                var d;

                try {
                    d = rsCanvas.canvas.toDataURL();

                    if (d.length < 10) {
                        throw 'Malformed data url';
                    }
                } catch (e) {
                    rsLogger.warn('ext-dataexport CorruptPositionWarning', 'Omitting corrupt position ' + position.toString() + ': ' + e);
                    reject();
                }

                resolve(d);
            }
        };
        let el = document.createElement('canvas');
        new RsEditorCanvas(el, rsEditorCanvasOptions, position);
    });
}

function compose(...fns) {
    return fns.reduce((f, g) => (...args) => f(g(...args)));
}
