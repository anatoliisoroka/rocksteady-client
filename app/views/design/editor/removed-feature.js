import Ember from 'ember';

export default Ember.View.extend({
    templateName: 'design/editor/removed_feature',
    tagName: 'li',
    classNames: ['removed-feature'],

    click: function () {
        this.addFeature();
    },

    addFeature: function () {
        this.get('controller').send('readdFeature');
    }

});
