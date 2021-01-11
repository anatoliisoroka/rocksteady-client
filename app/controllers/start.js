/* globals metaphone, NaiveBayesClassifier */

import Ember from 'ember';
import {getImageURL} from '../utils/url-util';

var slugify = function (component) {
    return component.toString().replace(/[\W\s]/g, '_');
};

var metaphonizer = function (text) {
    var tokens = text.split(' ');
    for (var i = 0; i < tokens.length; i++) {
        if (tokens[i].match(/\d/)) {
            void 0;
        } else {
            tokens[i] = metaphone(tokens[i]);
        }
        tokens[i] = tokens[i].toUpperCase();
    }
    return tokens;
};

export default Ember.Controller.extend({

    init: function () {
        var controller = this;

        // Train classifier here:
        // https://bitbucket.org/rocksteady-technology/snippets/src/dc0ecd502fffe28d57bcdad25a597f2faaadd080/interviewbayes/?at=master

        Ember.$.get('interview-classifier.json').then(function (classifierJSON) {
            classifierJSON.options = { tokenizer: metaphonizer };
            controller.set('classifier', NaiveBayesClassifier.withClassifier(classifierJSON));
        });
    },

    classifier: undefined,
    naturalText: '',
    placeholderText: 'Enter your vehicle model , e.g. \'Black Dream\'',

    search: function () {
        if (this.get('naturalText') === '') {
            this.get('results').clear();
            return;
        }

        var classifications = this.get('classifier').categorize(this.get('naturalText').trim());

        var keysSorted = Object.keys(classifications.categories).sort(function (a, b) {
            return classifications.categories[b] - classifications.categories[a];
        });

        this.get('results').clear();

        for (var i = 0; i < keysSorted.length && i < 10; i++) {
            var result = JSON.parse(keysSorted[i]);

            this.get('results').pushObject({
                image: getImageURL('bike.png'),
                name: result.join(' '),
                path: result
            });
        }
    },

    naturalTextObserver: function () {
        if (this.get('classifier')) {
            Ember.run.debounce(this, 'search', 500);
        }
    }.observes('naturalText'),

    results: [],

    actions: {
        chooseResult: function (result) {
            this.transitionToRoute('interview.manufacturers.targets.targetCategories.groupedYears.region.ruleSets',
                'Test_Motorbike_Decals',
                slugify(result.path[0]),
                slugify(result.path[1]),
                '-',
                slugify(result.path[2]),
                'IE'
            );
        }
    }

});

