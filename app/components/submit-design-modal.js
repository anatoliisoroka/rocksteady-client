import Ember from 'ember';
import rsLogger from '../lib/rs-logger';


export default Ember.Component.extend({
    tagName: '',
    hasSubmitted: false,
    hasError: false,
    store: Ember.inject.service(),
    designModel: null,
    myCountry: 'US',
    submitImageUrl: 'branding/images/selector/submit-design-success.svg',

    designId: Ember.computed.alias('designModel.id'),
    product: Ember.computed.alias('designModel.productLine.name'),
    targetCategory: Ember.computed.alias('designModel.targetCategory.name'),
    make: Ember.computed.alias('designModel.manufacturer.name'),
    model: Ember.computed.alias('designModel.target.name'),
    year: Ember.computed.alias('designModel.targetKit.qualifyingData'),

    validForm: Ember.computed('isNameValid', 'isEmailValid', 'isNumberValid', 'isDesignNameValid', 'isDesignDescriptionValid', function () {
        return (
            this.get('isNameValid') &&
            this.get('isEmailValid') &&
            this.get('isNumberValid') &&
            this.get('isDesignNameValid') &&
            this.get('isDesignDescriptionValid')
        );
    }),

    init(){
        this._super(arguments);

        let store = this.get('store');

        let myCountry = store
            .all('mycountry')
            .get('firstObject')
            .get('country');

        this.set('myCountry', myCountry || 'US');
    },

    didInsertElement(){
        (new Image()).src = this.get('submitImageUrl');

        Ember.run.later(() => {
            this.setModalBodyHeight();
        }, 800);

        Ember.$(window).on('debouncedresize.submit_design', function () {
            this.setModalBodyHeight();
        }.bind(this));

        Ember.$('.flag-dropdown').on('click', () => {
            this.setModalBodyHeight();
        });

        Ember.$('.flag-dropdown').on('keyup keydown', () => {
            this.delayedSetModalBodyHeight();
        });
    },

    willDestroyElement(){
        Ember.$(window).off('debouncedresize.submit_design');
    },

    delayedSetModalBodyHeight: function () {
        Ember.run.later(() => {
            this.setModalBodyHeight();
        }, 50);
    }.observes('hasSubmitted', 'hasError'),

    setModalBodyHeight: function () {
        const bodyOffset = 130;
        const scrollHeightOffset = 20;
        const $submitDesignBodyWrapper = Ember.$('.submit-design-body-wrapper');
        const $submitDesignBody = Ember.$('.submit-design-body');

        const submitDesignBodyHeight = $submitDesignBody.prop('scrollHeight') + scrollHeightOffset;
        const maxHeight = parseFloat(Ember.$(window).height()) - bodyOffset;

        $submitDesignBodyWrapper.height(Math.min(maxHeight, submitDesignBodyHeight));
    }.observes('modalOpen'),

    submitSuccess(){
        this.set('hasSubmitted', true);
    },

    submitError(e){
        this.set('hasError', true);
        rsLogger.log('submit_design', 'Submit Design POST failed: ' + e.statusText);
    },

    showInvalidFields(){
        this.set('nameValid', !!this.get('isNameValid'));
        this.set('emailValid', !!this.get('isEmailValid'));
        this.set('numberValid', !!this.get('isNumberValid'));
        this.set('designNameValid', !!this.get('isDesignNameValid'));
        this.set('designDescriptionValid', !!this.get('isDesignDescriptionValid'));
    },

    saveFormData(){
        let store = this.get('store');

        let storeData = {
            name: this.get('userName'),
            email: this.get('userEmail'),
            phone: this.get('number'),
            designName: this.get('designName'),
            designDescription: this.get('designDescription'),
            designer: this.get('becomeDesigner'),
            country: this.get('myCountry'),
            design_id: this.get('designId'),
            product: this.get('product'),
            targetCategory: this.get('targetCategory'),
            make: this.get('make'),
            model: this.get('model'),
            year: this.get('year')
        };

        store
            .createRecord('submit_design', storeData)
            .save()
            .then(
                this.submitSuccess.bind(this),
                this.submitError.bind(this)
            );
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
            if (this.get('validForm')) {
                this.saveFormData();
            } else {
                this.showInvalidFields();
            }
        }
    }
});
