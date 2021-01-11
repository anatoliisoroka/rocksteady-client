import Ember from 'ember';

var checkRulesForAttribute = function (attr) {
    if (!attr) {
        return;
    }

    var rule = attr.get('rule'),
        iconClass = 'toast-regulatedfeature-warning-attr-' + attr.get('id'),
        value;

    if (!rule) {
        return;
    } else if (Ember.isArray(rule) && rule.length === 0) {
        return;
    } else if (!Ember.isArray(rule) && rule) {
        rule = [rule];
    }

    if (Ember.$.find('.' + iconClass).length) {
        return;
    }

    if (typeof rule[0] === 'number') {
        value = parseInt(attr.get('value'));
    } else {
        value = attr.get('value');
    }

    if (!rule.contains(value)) {
        (this.get('controller') ? this.get('controller.controllers.application') : this.get('controllers.application')).send(
            'toast',
             this.get('i18n').t('regulationwarnings.regulatedfeature').toString(),
            'warning',
            'toast-regulatedfeature-warning ' + iconClass
        );
    }
};

export default Ember.Mixin.create({

    i18n: Ember.inject.service(),

    regulatedIconObserver: function () {
        if (this.get('model').constructor.modelName === 'feature') {
            (checkRulesForAttribute.bind(this))(this.get('model').getAttribute('icon'));
        }
    }.observes('model.icon'),

    regulatedFillObserver: function () {
        if (this.get('model').constructor.modelName === 'feature') {
            (checkRulesForAttribute.bind(this))(this.get('model').getAttribute('fill'));
        }
    }.observes('model.fill'),

    regulatedFontFamilyObserver: function () {
        if (this.get('model').constructor.modelName === 'feature') {
            (checkRulesForAttribute.bind(this))(this.get('model').getAttribute('fontFamily'));
        }
    }.observes('model.fontFamily'),

    regulatedTextObserver: function () {
        if (this.get('model').constructor.modelName === 'feature') {
            (checkRulesForAttribute.bind(this))(this.get('model').getAttribute('text'));
        }
    }.observes('model.text'),

    regulatedStrokeStyle1Observer: function () {
        if (this.get('model').constructor.modelName === 'feature') {
            (checkRulesForAttribute.bind(this))(this.get('model').getAttribute('strokeStyle1'));
        }
    }.observes('model.strokeStyle1'),

    regulatedStrokeWidth1Observer: function () {
        if (this.get('model').constructor.modelName === 'feature') {
            Ember.run.later(this, function () {
                if (this.get('model')) {
                    (checkRulesForAttribute.bind(this))(this.get('model').getAttribute('strokeWidth1'));
                }
            }, 500);
        }
    }.observes('model.strokeWidth1'),

    regulatedStrokeStyle2Observer: function () {
        if (this.get('model').constructor.modelName === 'feature') {
            (checkRulesForAttribute.bind(this))(this.get('model').getAttribute('strokeStyle2'));
        }
    }.observes('model.strokeStyle2'),

    regulatedStrokeWidth2Observer: function () {
        if (this.get('model').constructor.modelName === 'feature') {
            Ember.run.later(this, function () {
                if (this.get('model')) {
                    (checkRulesForAttribute.bind(this))(this.get('model').getAttribute('strokeWidth2'));
                }
            }, 500);
        }
    }.observes('model.strokeWidth2'),

    regulatedStrokeStyle3Observer: function () {
        if (this.get('model').constructor.modelName === 'feature') {
            (checkRulesForAttribute.bind(this))(this.get('model').getAttribute('strokeStyle3'));
        }
    }.observes('model.strokeStyle3'),

    regulatedStrokeWidth3Observer: function () {
        if (this.get('model').constructor.modelName === 'feature') {
            Ember.run.later(this, function () {
                if (this.get('model')) {
                    (checkRulesForAttribute.bind(this))(this.get('model').getAttribute('strokeWidth3'));
                }
            }, 500);
        }
    }.observes('model.strokeWidth3'),

    regulatedStrokeStyle4Observer: function () {
        if (this.get('model').constructor.modelName === 'feature') {
            (checkRulesForAttribute.bind(this))(this.get('model').getAttribute('strokeStyle4'));
        }
    }.observes('model.strokeStyle4'),

    regulatedStrokeWidth4Observer: function () {
        if (this.get('model').constructor.modelName === 'feature') {
            Ember.run.later(this, function () {
                if (this.get('model')) {
                    (checkRulesForAttribute.bind(this))(this.get('model').getAttribute('strokeWidth4'));
                }
            }, 500);
        }
    }.observes('model.strokeWidth4')

});
