import Ember from 'ember';
import PositionController from '../position';

const SMART_DECAL_GROUPS = {
    'number_plates': '^.*Plate$'
};

export default Ember.Controller.extend({
    needs: ['design/selector'],
    obtainPositionsCommon (key, positionsModel) {
        return this
            .get(positionsModel)
            .filter((position) =>
                position.get('name').match(SMART_DECAL_GROUPS[key])
            );
    },
    obtainPositionsForDecalGroup (key) {
        return this.obtainPositionsCommon(key, 'model.uncoveredPositions');
    },
    obtainActivePositionsForGroup (key) {
        return this.obtainPositionsCommon(key, 'model.activePositions');
    },
    obtainModelForSelectAll () {
        const activePositions = this.get('model.activePositions.length');
        const allActive = this.get('model.uncoveredPositions.length') === activePositions;
        return {
            name: this.get('i18n').t('selector.decals_all').toString(),
            selected: allActive,
            indeterminate: !allActive && activePositions
        };
    },
    obtainModelForGroupsSelection () {
        return Object
            .keys(SMART_DECAL_GROUPS)
            .filter((key) =>
                this.obtainPositionsForDecalGroup(key).get('length')
            )
            .map((key) => {
                const activeGroupPositionsNo = this
                    .obtainActivePositionsForGroup(key)
                    .get('length');
                const groupPositionIds = this
                    .obtainPositionsForDecalGroup(key)
                    .mapBy('id');
                const allActive = groupPositionIds.get('length') === activeGroupPositionsNo;
                return {
                    name: this.get('i18n').t(`selector.decals_${key}`).toString(),
                    id: key,
                    selected: allActive,
                    indeterminate: !allActive && activeGroupPositionsNo,
                    deps: groupPositionIds
                };
            });
    },
    obtainModelForPositionsSelection () {
        return this
            .get('model.positions')
            .filterBy('covered', false)
            .map((position) => (
                {
                    name: position.get('name'),
                    id: position.get('id'),
                    selected: position.get('isIncluded')
                }
            ));
    },
    obtainSelectModel () {
        return {
            all: this.obtainModelForSelectAll(),
            groups: [...this.obtainModelForGroupsSelection()],
            individuals: [...this.obtainModelForPositionsSelection()]
        };
    },
    obtainPosition (position) {
        return PositionController
            .create({
                model: position,
                store: this.store,
                container: this.container
            });
    },
    updatePositions (selectedPositions) {
        selectedPositions
            .map(({ id, selected }) => {
                const position = this.obtainPosition(
                    this.get('model.positions')
                        .findBy('id', id)
                );
                const included = position.get('model.isIncluded');

                if (selected && !included) {
                    position.addPosition();
                } else if (!selected && included) {
                    position.removePosition();
                }
            });
    },
    rerenderAndNavigateToSelector () {
        this.get('model')
            .save()
            .then(() =>
                this.get('controllers.design/selector')
                    .rerender()
            )
            .then(() =>
                this.transitionToRoute('design.selector')
            );
    },
    actions: {
        updateDecals (selectedPositions) {
            this.updatePositions(selectedPositions);
            this.rerenderAndNavigateToSelector();
        },
        openDecalsModal () {
            this.set('selectModel', this.obtainSelectModel());
            this.set('decalsModalOpen', true);
        },
        closeDecalsModal () {
            this.set('decalsModalOpen', false);
            this.replaceRoute('design.selector');
        }
    }
});
