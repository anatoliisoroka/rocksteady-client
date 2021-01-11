import Ember from 'ember';
import RouteActivateStep from '../../../../../../../mixins/route-activate-step';

export default Ember.Route.extend(RouteActivateStep, {

    stepName: 'RuleSet',

    model: function (params) {
        // return a region from this method

        return new Ember.RSVP.Promise(function (resolve, reject) {
            var region = this.store.all('region').filter(function (item) {
                return item.get('slug') === params.region_slug;
            }).get('firstObject');

            return (region ? resolve(region) : reject('No such region: ' + params.region_slug));
        }.bind(this));
    },

    //load ruleset from previous step?
    setupController: function (controller, model) {
        var interviewController = this.controllerFor('interview');

        interviewController.set('model.competingRegion', model);

        if (!interviewController.get('model.productLine.isRegulated')) {
            return interviewController.send('gotoPromptedFeatures');
        }

        var data = {
            product_line_id: interviewController.get('model.productLine.id'),
            region_id: interviewController.get('model.competingRegion.id')
        };

        if (interviewController.get('model.target')) {
            data.target_id = interviewController.get('model.target.id');
        } else if (interviewController.get('model.targetCategory')) {
            data.target_category_id = interviewController.get('model.targetCategory.id');
        }

        //skip step if 0
        var ruleSetsFinder = this.store.find('ruleSet', data);
        interviewController.set('ruleSetHidden', false);
        ruleSetsFinder.then(function (ruleSetElements) {
            if (ruleSetElements.get('length') === 0 && interviewController.get('activeStep.name') === 'RuleSet' && !interviewController.get('ruleSetSkipped')) {
                interviewController.send('skipRuleSet');
                interviewController.send('showCompetitionToast');
                interviewController.send('hideRuleSet');
            }
            interviewController.set('ruleSetSkipped', true);
        });

        interviewController.set('ruleSets', ruleSetsFinder);
    },

    renderTemplate: function () {
        this.render('interview/rulesets', {
            into: 'interview',
            view: 'interview/ruleSetIndex',
            outlet: 'ruleSets',
            controller: this.controllerFor('interview')
        });
    },

    deactivate: function () {
        this._super();
        this.controllerFor('interview').get('model').set('ruleSet', null);
    }
});

