import Ember from 'ember';

export default Ember.Mixin.create({
    createRecord: function () {
        return new Ember.RSVP.Promise(function (resolve) {
            resolve();
        });
    },
    updateRecord: function () {
        return new Ember.RSVP.Promise(function (resolve) {
            resolve();
        });
    },
    find: function (store, type, id) {
        return new Ember.RSVP.Promise(function (resolve/*, reject*/) {
            var obj = {};
            obj[type] = {id: id};
            resolve(obj);
        });
    }
});

