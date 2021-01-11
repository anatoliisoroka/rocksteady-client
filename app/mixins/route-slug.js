import Ember from 'ember';

export default Ember.Mixin.create({

    slug: function () {
        return this.get('name') ? this.get('name').toString().replace(/[\W\s]/g, '_') : '-';
    }.property('name')

});

