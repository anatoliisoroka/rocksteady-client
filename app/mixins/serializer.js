import Ember from 'ember';

export default Ember.Mixin.create({
    serialize: function (snapshot, options) {
        var json = this._super(snapshot, options);

        snapshot.eachRelationship(function (name, relationship) {
            if (relationship.kind === 'hasMany' && snapshot.hasMany(name) && typeof snapshot.hasMany(name).mapBy === 'function') {
                json[name.singularize() + '_ids'] = snapshot.hasMany(name).mapBy('id');
            }
        });

        return json;
    }
});

