import Ember from 'ember';

export default Ember.Component.extend({
    tagName: '',
    hasSubmitted: false,
    store: Ember.inject.service(),

    validForm: Ember.computed('isEmailValid', function () {
        return this.get('isEmailValid');
    }),

    featureChanged: function () {
        this.set('hasSubmitted', false);
    }.observes('subject'),

    didInsertElement () {
        let store = this.get('store');

        let myCountry = store
            .all('mycountry')
            .get('firstObject')
            .get('country');

        this.set('myCountry', myCountry);
    },

    fillParams ({ design, email, feature, country }) {
        const params = [
            { email },
            { feature },
            { country },
            { designId: design.get('id') },
            { product: design.get('productLine.name') },
            { targetCategory: design.get('targetCategory.name') },
            { make: design.get('manufacturer.name') },
            { model: design.get('target.name') },
            { year: design.get('targetKit.name') }
        ];
        return Object.assign({}, ...params.filter((param) => Object.values(param)[0]));
    },

    actions: {
        outsideClick () {
            this.send('closeModal');
        },
        closeModal () {
            this.set('modalOpen', false);
        },
        noop () {
        },
        submit () {
            if (this.get('validForm') && !this.get('hasSubmitted')) {
                const storeData = this.fillParams({
                    design: this.get('design'),
                    email: this.get('userEmail'),
                    feature: this.get('subject'),
                    country: this.get('myCountry')
                });

                this.get('store')
                    .createRecord('comingSoon', storeData)
                    .save()
                    .then(() => {
                        this.set('hasSubmitted', true);
                    }, () => {
                        this.set('hasSubmitted', true);
                    });
            }
        }
    }
});
