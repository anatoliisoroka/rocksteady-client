import Ember from 'ember';
import config from '../../../../config/environment';

export default Ember.Controller.extend({

    needs: ['design', 'design/editor', 'design/editor/feature'],

    fileData: undefined,

    bestPracticeUrl: function() {
        return config.APP.best_practice_link;
    }.property()

});
