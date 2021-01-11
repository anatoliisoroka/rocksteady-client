import Ember from 'ember';

export default Ember.Route.extend({
    model: function (params) {
        // return a grouped year from this method
        //
        if (params.grouped_year_slug === '-') {
            return this.modelFor('interview');
        }

        return new Ember.RSVP.Promise(function (resolve, reject) {
            this.store.find('targetKit', {
                target_id: this.modelFor('interview.manufacturers.targets.targetCategories').get('id')
            }).then(function (groupedYears) {
                var groupedYear = groupedYears.filter(function (item) {
                    return item.get('slug') === params.grouped_year_slug;
                }).get('firstObject');

                return (groupedYear ? resolve(groupedYear) : reject('No such grouped year: ' + params.grouped_year_slug));
            });
        }.bind(this));
    },

    setupController: function (controller, model) {
        if (model.constructor.modelName === 'target-kit') {
            this.controllerFor('interview').set('model.targetKit', model);
        }
    }
});

