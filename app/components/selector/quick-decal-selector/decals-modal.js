import Ember from 'ember';

export default Ember.Component.extend({
    all: Ember.computed.alias('select.all'),
    groups: Ember.computed.alias('select.groups'),
    individuals: Ember.computed.alias('select.individuals'),

    obtainSuperiorCheckboxState (dependants) {
        const selected = dependants
            .reduce((sum, { selected }) => sum + (selected ? 1 : 0), 0);
        const selectAll = selected === dependants.length;

        return {
            indeterminate: selected && !selectAll,
            selected: selectAll
        };
    },
    groupAndIndividualChangeObserver: Ember.observer(
        'individuals.@each.selected',
        'groups.@each.selected',
        function () {
            const {
                indeterminate: indeterminateAll,
                selected: selectedAll
            } = this.obtainSuperiorCheckboxState([...this.get('individuals'), ...this.get('groups')]);

            this.set('all.indeterminate', indeterminateAll);
            this.set('all.selected', selectedAll);

            this.get('groups')
                .map(({ deps, id }) => {
                    const groupIndividuals = this
                        .get('individuals')
                        .filter(({ id }) => deps.includes(id));
                    const {
                        indeterminate: indeterminateGroup,
                        selected: selectedGroup
                    } = this.obtainSuperiorCheckboxState(groupIndividuals);
                    const group = this
                        .get('groups')
                        .filterBy('id', id);

                    group.setEach('indeterminate', indeterminateGroup);
                    group.setEach('selected', selectedGroup);
                });
        }),

    actions: {
        onSelectAllToggled (selectAll = !this.get('all.selected')) {
            this.set('all.selected', selectAll);
            ['groups', 'individuals']
                .map((key) =>
                    this.set(
                        key,
                        this.get(key)
                            .map((val) => Object.assign({}, val, { selected: selectAll }))
                    )
                );
        },
        onSelectGroupToggled (val, id) {
            const selected = (val === undefined) ?
                !this.get('groups').findBy('id', id).selected : val;
            const { deps } = this
                .get('groups')
                .findBy('id', id);
            this.set(
                'individuals',
                this.get('individuals')
                    .map((individual) =>
                        Object.assign({}, individual, deps.includes(individual.id) ? { selected } : {})
                    )
            );
        },
        onSelectIndividualToggled (id) {
            this.set(
                'individuals',
                this.get('individuals')
                    .map((individual) =>
                        Object.assign({}, individual, individual.id === id ? { selected: !individual.selected } : {}))
                );
        },
        onSelectDecals () {
            this.sendAction('updateAction', this.get('individuals'));
        },
        onCloseModal () {
            this.sendAction('closeModalAction');
        },
        noop () {}
    }
});
