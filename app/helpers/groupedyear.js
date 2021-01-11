import Ember from 'ember';

var h = function (value) {
    var escaped = Ember.Handlebars.Utils.escapeExpression(value.get('name')),
        prettified = escaped.replace(/,/g, ', ');
    return new Ember.Handlebars.SafeString(prettified);
};

export default h;
