import Ember from 'ember';

export default Ember.View.extend({

    didInsertElement: function () {

        this.$().append(this.get('controller.i18n').t('checkout.agree_terms').toString());

        this.$('a').on('click', function (e) {
            e.preventDefault();
            this.get('controller').send('showTermsAndConditions');
        }.bind(this));
    }
});
