import Ember from 'ember';
import DS from 'ember-data';

export default DS.Model.extend({

    competingRegion: DS.belongsTo('region'),
    nationality: DS.belongsTo('region'),
    productLine: DS.belongsTo('productLine'),
    manufacturer: DS.belongsTo('manufacturer'),
    target: DS.belongsTo('target'),
    targetKit: DS.belongsTo('targetKit'),
    targetCategory: DS.belongsTo('targetCategory'),
    ruleSet: DS.belongsTo('ruleSet'),
    useCategory: DS.belongsTo('useCategory'),
    design_id: DS.attr('string'),
    promptedFeatures: Ember.A([]),
    use1: null,
    use2: null,
    use3: null,
    use4: null,
    use_id: function () {
        return this.get('use4.id') || this.get('use3.id') || this.get('use2.id') || this.get('use1.id');
    }.property('use4.id', 'use3.id', 'use2.id', 'use1.id'),

    description: Ember.computed(
        'productLine.id',
        'manufacturer.name',
        'target.name',
        'targetKit.name',
        'targetCategory.name',
        'ruleSet.name',
        'useCategory.name',
        'use1.name',
        'use2.name',
        'use3.name',
        'use4.name',
        function () {
            if (!this.get('productLine')) {
                return '';
            }

            const sections = [
                'manufacturer',
                'target',
                'targetKit',
                'targetCategory',
                'ruleSet',
                'useCategory',
                'use1',
                'use2',
                'use3',
                'use4'
            ];

            return sections
                .reduce((acc, section) => {
                    const name = this.get(`${section}.name`);

                    return name ? acc.concat(name) : acc;
                }, [])
                .join(' ');
        }
    )
});

