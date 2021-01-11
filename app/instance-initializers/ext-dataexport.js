import rsLogger from '../lib/rs-logger';

export function initialize(application) {

    window.addEventListener('message', (event) => {
        if (event.source !== window || !event.data.type) {
            return;
        }

        const container = application.container;
        const store = container.lookup('store:main');
        const exportThemeService = container.lookup('service:export-theme-service');
        const design = store.all('design').get('lastObject');

        if (event.data.type === 'qa_get_non_default_shapes') {
            rsLogger.debug('[qa-json] posting qa_non_default_shapes');

            if (!design) {
                throw 'No kit found.';
            }

            window.postMessage({
                type: 'qa_non_default_shapes',
                version: '2.0',
                data: design.get('positionsWithNonDefaultShapes.length')
            }, '*');
        }

        if (event.data.type === 'qa_get_kit_json') {
            rsLogger.debug('[qa-json] posting qa_json (kit)');
            if (!design) {
                throw 'No kit found.';
            }
            exportThemeService.prepareThemeForExport(design)
                .then((data) =>
                    window.postMessage(
                        { type: 'qa_json', version: '2.0', data: JSON.stringify(data) },
                        '*'
                    )
                );
        }
    });

    window.addEventListener('message', function (event) {
        if (event.source !== window || !event.data.type) {
            return;
        }

        if (event.data.type === 'fam_get_features_json') {
            var store = application.container.lookup('store:main'),

                getPositionName = function (f) {
                    return f.get('position.name');
                },

                getColourName = function (f, property) {
                    return (f.getAttribute(property) && store.getById('colour', f.getAttribute(property).get('value'))) ?
                        store.getById('colour', f.getAttribute(property).get('value')).get('name')
                        : undefined;
                },

                getIconId = function (f) {
                    return (f.getAttribute('icon') && store.getById('graphic', f.getAttribute('icon').get('value'))) ?
                        parseInt(store.getById('graphic', f.getAttribute('icon').get('value')).get('id'))
                        : undefined;
                },

                isIconMultiColoured = function (f) {
                    if (f.getAttribute('icon') && store.getById('graphic', f.getAttribute('icon').get('value'))) {
                        return store.getById('graphic', f.getAttribute('icon').get('value')).get('multicoloured');
                    }
                    return false;
                },

                getTextAlignment = function (f) {
                    return (f.getAttribute('textAlignment')) ?
                        f.getAttribute('textAlignment').get('value') : undefined;
                },

                getFontFamilyName = function (f) {
                    return (f.getAttribute('fontFamily') && store.getById('font', f.getAttribute('fontFamily').get('value'))) ?
                        store.getById('font', f.getAttribute('fontFamily').get('value')).get('name')
                        : undefined;
                },

                getInternalShapeId = function (f) {
                    return f.get('position.activeShape.internal_id') || f.get('position.defaultComponent.defaultShape.internal_id');
                },

                hasActiveShape = function (f) {

                    if (f.get('position.activeShape.internal_id') !== null) {
                        return true;
                    }

                    return false;
                },

                kit = store.all('design').get('lastObject'),

                features = kit.get('features');

            if (!features) {
                throw 'No features found -- have you built a kit?';
            }

            const featureMatrix = features
                .rejectBy('deleted')
                .map(function (f) {
                    return {
                        deleted: f.get('deleted'),
                        positionName: getPositionName(f),
                        shapeId: getInternalShapeId(f),
                        activeShape: hasActiveShape(f),
                        shapeWidth: f.get('position.activeShape.width'),
                        shapeHeight: f.get('position.activeShape.height'),
                        name: f.get('name'),
                        left: f.get('left'),
                        top: f.get('top'),
                        scale: f.get('scale'),
                        angle: f.get('angle'),
                        zIndex: f.get('zIndex'),
                        fillName: getColourName(f, 'fill'),
                        iconId: getIconId(f),
                        multicoloured: isIconMultiColoured(f),
                        type: f.get('type'),
                        strokeStyle1Name: getColourName(f, 'strokeStyle1'),
                        strokeStyle2Name: getColourName(f, 'strokeStyle2'),
                        strokeStyle3Name: getColourName(f, 'strokeStyle3'),
                        strokeStyle4Name: getColourName(f, 'strokeStyle4'),
                        strokeWidth1: f.get('strokeWidth1'),
                        strokeWidth2: f.get('strokeWidth2'),
                        strokeWidth3: f.get('strokeWidth3'),
                        strokeWidth4: f.get('strokeWidth4'),
                        strokeInternal1: f.get('strokeInternal1'),
                        strokeFront1: f.get('strokeFront1'),
                        letterSpacing: f.get('letterSpacing'),
                        textAlign: getTextAlignment(f),
                        fontSize: f.get('fontSize'),
                        fontFamily: getFontFamilyName(f),
                        lineHeight: f.get('lineHeight'),
                        text: f.get('text'),
                        flipX: !!f.get('flipX'),
                        flipY: !!f.get('flipY')
                    };
                });

            window.postMessage({
                type: 'fam_features_json',
                version: '2.0',
                data: JSON.stringify({
                    kitDescription: kit.get('description'),
                    createdDate: kit.get('createdDate'),
                    isTargetCategory: kit.get('isTargetCategory'),
                    targetCategoryName: kit.get('targetCategory.name'),
                    targetName: kit.get('target.name'),
                    groupedYearName: kit.get('targetKit.name'),
                    features: featureMatrix,
                    fileName: kit.get('description')
                })
            }, '*');
        }
    });
}

export default {
    name: 'ext-json',
    initialize
};
