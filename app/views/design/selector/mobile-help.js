import Ember from 'ember';

export default Ember.View.extend({
    templateName: 'design/selector/mobile-help',

    didInsertElement: function () {
        var $modal = this.$().find('.modal');
        $modal.modal({show: true})
            .on('hidden.bs.modal', () => {
                Ember.run.later(this, function () {
                    this.set('parentView.showMobileHelp', false);
                }, 400);
            });
    }
});
