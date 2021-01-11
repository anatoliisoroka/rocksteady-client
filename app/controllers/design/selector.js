/* global logger, $ */

import Ember from 'ember';
import RsEditorCanvas from '../../lib/rs-editor-canvas';
import logger from '../../lib/rs-logger';
import config from '../../config/environment';

export default Ember.Controller.extend(Ember.Evented, {

    needs: ['fonts', 'design', 'application', 'progressBar', 'selectorHeader', 'design/themes'],

    store: Ember.inject.service(),

    isMobile: Ember.computed.not('controllers.application.isNotBreakpointXS'),

    lastActivePosition: undefined,

    colourClashEnabled: true,

    themesModalVisited: Ember.computed({
        get() {
            return sessionStorage.getItem(`themesModalVisited_${this.get('model.id')}`);
        },
        set(key, value) {
            sessionStorage.setItem(`themesModalVisited_${this.get('model.id')}`, value);
            return value;
        }
    }),
    themesModalNotVisited: Ember.computed.not('themesModalVisited'),

    showThemeBadge: Ember.computed.and('availableThemes', 'themesModalNotVisited'),

    showGlobalSelectorEdit: false,

    init: function () {

        if (this.get('controllers.design.model.positions.length') === 0) {
            logger.warn('NoPositionsWarning', 'Kit has no positions');
        }

        if (this.get('controllers.design.model.shapes.length') === 0) {
            logger.warn('NoShapesWarning', 'Kit has no shapes');
        }
    },

    decalsLabel: function () {
        if (this.get('model.activePositions.length') === 0) {
            return this.get('i18n').t('selector.decals_label_none');
        }

        if (this.get('model.activePositions.length') === this.get('model.uncoveredPositions.length')) {
            return this.get('i18n').t('selector.decals_label_all');
        }

        return this.get('i18n').t('selector.decals_label_some', {
            count: this.get('model.activePositions.length'),
            total: this.get('model.uncoveredPositions.length')
        });

    }.property('model.activePositions', 'model.uncoveredPositions'),

    rerender (delay) {
        return new Ember.RSVP.Promise((resolve, reject) =>
            Ember.run.scheduleOnce('render', null, () => {
                const view = this.get('view');

                if (view) {
                    view.renderCanvas(delay)
                        .then(resolve, reject);
                } else {
                    resolve();
                }
            })
        );
    },

    getSelectedFeatureFabObjs(features) {
        const promises = this
            .getPositionsOfPersonalFeatures(features)
            .map((position) =>
                this.getFeaturesForPosition(position)
            );
        return new Ember.RSVP.Promise((resolve) =>
            Ember.RSVP.all(promises).then((allFeaturesArr) =>
                resolve(allFeaturesArr.length ? Object.assign.apply({}, allFeaturesArr) : {})
            ));
    },
    getPositionsOfPersonalFeatures(features) {
        return this
            .get('model.activePositions')
            .filter((activePosition) =>
                features
                    .some((feature) =>
                        feature.get('position.id') === activePosition.get('id')
                    )
            );
    },
    getFeaturesForPosition(position) {
        return new Ember.RSVP.Promise((resolve) =>
            new RsEditorCanvas(
                document.createElement('canvas'),
                {onRender: ({featureFabObjs}) => resolve(featureFabObjs)},
                position
            )
        );
    },
    setupClearModal(title) {
        this.set('clearModalTitle', title || '');
        this.set('clearModalSelectAll', true);
        const personalFeatures = this.get('model.personalPromptedFeaturesMappedToFeatures');
        this.set(
            'clearModalPersonalFeatures',
            personalFeatures.map(({id}) => ({id, keep: true}))
        );
        this.set('featureFabObjs', this.getSelectedFeatureFabObjs(personalFeatures));

        Ember.run.scheduleOnce('afterRender', this, () =>
            $('div.clear-modal').find('div.modal-footer > button.btn-secondary').focus()
        );
    },

    accentColourGroups: function () {
        let usedColours = this.get('model.usedColoursAccentColourGroups');
        let usedColourGroups = {};

        usedColours.forEach((usedColour1) => {
            let groupId = usedColour1.colourId;

            if (usedColour1.feature.get('type') === 'ComponentShape' || usedColour1.feature.get('isIconFeature')) {
                usedColourGroups[groupId] = usedColourGroups[groupId] || [];
                usedColourGroups[groupId].push(usedColour1);
            }
        });

        let groupArray = [];

        _.each(usedColourGroups, (usedColourGroup, k) => {
            let name = usedColourGroup[0].colour.get('name');
            let canDelete = usedColourGroup.any((usedColour) =>
                usedColour.feature.get('name') === 'Background' && !usedColour.fattribute.get('isStrokeStyle')
            );

            let deleted = usedColourGroup.every((usedColourGroup) => {
                return usedColourGroup.feature.get('deleted');
            });

            groupArray.push({
                group: usedColourGroup,
                name: name,
                id: k,
                canDelete,
                deleted
            });
        });

        let accentColourGroups = groupArray.reject((group) => {
            return group.group.length < 1;
        });

        return accentColourGroups;

    }.property('model.usedColoursAccentColourGroups'),

    sortedAccentColourGroups: function () {
        return this.get('accentColourGroups')
            .sortBy('name')
            .reverse()
            .sortBy('group.length')
            .reverse();
    }.property('accentColourGroups'),

    setAllColourTabs: function () {
        this.setKitColours();
        this.setRecommendedColours();
        this.setSearchColours();
        this.setAcgColours();
    },

    kitColours: [],
    _getKitColours: function () {
        let usedColoursArray = this.get('model.usedColours').map((usedColour) => usedColour.colour);
        let uniqueColours = _.uniqBy(usedColoursArray, (usedColour) => usedColour.get('id'));
        let counts = _.countBy(usedColoursArray, (uniqueColour) => uniqueColour.get('id'));
        let sortedUniqueColours = _.sortBy(uniqueColours, (uniqueColour) => counts[uniqueColour.get('id')]).reverse();
        return sortedUniqueColours;
    },
    setKitColours: function () {
        this.set('kitColours', this._getKitColours())
    },

    recommendedColours: [],
    _getRecommendedColours: function () {
        const usedColours = this.get('model.usedColours').map((usedColour) => usedColour.colour);
        const uniqueUsedColours = _.uniqBy(usedColours, (usedColour) => usedColour.get('id'));
        const contrastingColours = this._getContrastingColours(uniqueUsedColours);
        const complementaryColours = this._getComplementaryColours(uniqueUsedColours);

        const usedAndAssociatedColours = usedColours.concat(contrastingColours).concat(complementaryColours);
        const mandatoryRecommendedColours = this._getMandatoryRecommendedColours();
        const recommendedColoursAndMandatory = usedAndAssociatedColours.concat(mandatoryRecommendedColours);
        const uniqueRecommendedColours = _.uniqBy(recommendedColoursAndMandatory, (usedColour) => usedColour.get('id'));

        const kitColours = this.get('kitColours');
        const uniqueRecommendedColoursWithoutKitColours = uniqueRecommendedColours.removeObjects(kitColours);
        const sortedUniqueRecommendedColoursWithoutKitColours = uniqueRecommendedColoursWithoutKitColours.sortBy('name');
        return sortedUniqueRecommendedColoursWithoutKitColours;
    },
    setRecommendedColours: function () {
        this.set('recommendedColours', this._getRecommendedColours());
    },

    searchColours: [],
    _getSearchColours: function () {
        if (this.get('model.colours')) {
            return this.get('model.colours').sortBy('name');
        } else {
            return [];
        }
    },
    setSearchColours: function () {
        this.set('searchColours', this._getSearchColours());
    },

    acgColours:[],
    _getAcgColours: function () {
        return this.get('model.usedColoursAccentColourGroups').map((group) => {
            return group.colour;
        });
    },
    setAcgColours: function(){
        let usedColours = this.get('model.usedColoursAccentColourGroups');
        this.set('acgColours', this._getAcgColours());
    },

    selectorImage: function () {
        let canvasUrl = this.get('view.canvasUrl');
        if (canvasUrl) {
            return canvasUrl || '';
        }
    }.property('view.canvasUrl'),

    actions: {

        transitionToEditor: function (positionID) {
            var controller = this,
                position = this.get('positions').findProperty('id', positionID);

            controller.set('lastActivePosition', position);

            this.trigger('zoomInPosition', position);

            Ember.run.later(this, function () {
                controller.transitionToRoute('design.editor', position);
            }, 500);
        },

        toggleGlobalSelectorEdit() {
            this.toggleProperty('showGlobalSelectorEdit');
            //Allow animations to complete smoothly before a full re-render
            this.rerender(350);
        },

        closeGlobalSelectorEdit() {
            this.set('showGlobalSelectorEdit', false);
            //Allow animations to complete smoothly before a full re-render
            this.rerender(350);
        },

        showThemes: function () {
            //Do not use replaceRoute as it does not show in history
            this.transitionToRoute('design.themes');
        },

        showQuickDecalSelector: function () {
            this.replaceRoute('design.selector.decals');
        },

        showMaterials: function () {
            this.replaceRoute('design.selector.materials');
        },

        showSocialShareError: function () {
            this.get('controllers.application').send(
                'toast',
                this.get('i18n').t('general.social_share_error').toString(),
                'error',
                'toast-socialshare-error'
            );

        },

        disableColourClash() {
            this.set('colourClashEnabled', false);
        },

        enableColourClash() {
            this.set('colourClashEnabled', true);
        },

        openClearModal(title) {
            this.setupClearModal(title);
            this.set('clearModalOpen', true);
        },

        clearFeaturesAndAttributes(idsOfPersonalFeaturesToKeep) {
            const obtainFeatureNamesToKeep = () =>
                [
                    'Background',
                    ...this.get('model.features')
                        .filter(({id}) => idsOfPersonalFeaturesToKeep.includes(id))
                        .mapBy('name')
                ];
            const obtainFeaturesToRemove = () => {
                const featureNamesToKeep = obtainFeatureNamesToKeep();
                return this.get('model.features')
                    .filterBy('canModify')
                    .reject((feature) =>
                        featureNamesToKeep.includes(feature.get('name')));
            };
            const removeFeatures = () =>
                obtainFeaturesToRemove()
                    .forEach((feature) =>
                        feature.unload()
                    );

            ////

            this.send('disableColourClash');
            Ember.run.once(this, () => {
                removeFeatures();
                this.get('controllers.design/themes').unapplyTheme();

                this.rerender()
                    .then(() => this.send('enableColourClash'));
            });
        },

        openSlidePanel() {
            this.set('slidePanelOpen', true);
        },

        closeSlidePanel() {
            this.set('slidePanelOpen', false);
            Ember.run.later(this, () => {
                this.get('controllers.design').saveIfModified();
            }, 550);
        },

        reRender() {
            this.rerender();
        },

        editAccentColourGroup(accentColourGroup) {
            this.setAllColourTabs();
            this.set('activeAccentColourGroup', accentColourGroup);
            this.send('openSlidePanel');
        },

        selectColourForAccentColourGroup(colour) {

            let aacg = this.get('activeAccentColourGroup');
            aacg.group.forEach((group) => {
                group.feature.setAttribute(group.attributeKey, colour.get('id'));
            });

            Ember.set(aacg, 'id', colour.get('id'));
            Ember.set(aacg, 'name', colour.get('name'));

            this.rerender();
        }
    },

    clearPositionSelection: function () {
        if (this.get('view.canvas')) {
            this.get('view.canvas').deactivateAllWithDispatch();
        }

        this.trigger('clearPositionSelection');
    },

    hideAllPopovers: function () {
        this.hideTooltipPopover();
        this.hideAlternativeShapesPopover();
    },

    hideTooltipPopover: function () {

        if (this.get('activeTooltipPopover') !== undefined) {
            var controller = this;

            Ember.run(function () {
                controller.get('activeTooltipPopover').remove();
                controller.set('activeTooltipPopover', undefined);
                controller.clearPositionSelection();
            });
        }
    },

    hideAlternativeShapesPopover: function () {
        if (this.get('activeAlternativeShapesPopover') !== undefined) {
            this.get('activeAlternativeShapesPopover').send('hidePopover');
        }
    },

    isPositionActive: function (positionID) {
        var positionModel = this.getPositionBasedOnID(positionID);
        return positionModel.get('hasActiveComponent');
    },

    getPositionBasedOnID: function (positionID) {
        return this.get('model.positions').findBy('id', positionID);
    },

    positionCanBeActivated: function (positionID) {
        var position = this.getPositionBasedOnID(positionID);
        return position.get('isEditable');
    },

    showDisplayMapContainer: function () {
        $('.display-map-container').show();
    },

    hideDisplayMapContainer: function () {
        $('.display-map-container').hide();
    },

    _getMandatoryRecommendedColours() {
        let mandatoryRecommendedColours = [];
        if (config.APP.global_edit && config.APP.global_edit.mandatory_recommended_colour_ids) {
            const mandatoryRecommendedColourIds = config.APP.global_edit.mandatory_recommended_colour_ids;
            mandatoryRecommendedColours = mandatoryRecommendedColourIds
                .map((colourId) => {
                    const store = this.get('store');
                    return store.getById('colour', colourId);
                })
                .compact();
        }
        return mandatoryRecommendedColours;
    },

    _getAssociatedColoursByIds(colours, idPropertyName) {
        let associatedColours = [];
        colours.forEach((colour) => {
            associatedColours = associatedColours.concat(colour.get(idPropertyName));
        });
        return associatedColours;
    },

    _getContrastingColours(colours) {
        return this._getAssociatedColoursByIds(colours, 'contrastingColours')
    },

    _getComplementaryColours(colours) {
        return this._getAssociatedColoursByIds(colours, 'complementaryColours');
    }
});
