import Ember from 'ember';
import config from './config/environment';

var Router = Ember.Router.extend({
    location: config.locationType
});

Router.map(function () {
    this.route('start');

    this.resource('interview', {path: '/interview'}, function () {
        this.resource('interview.manufacturers', {path: '/:product_line_slug'}, function () {
            this.resource('interview.manufacturers.targets', {path: '/:manufacturer_slug'}, function () {   // resource required : targets eg:  MXV 450, Pegaso 650
                this.resource('interview.manufacturers.targets.targetCategories', {path: '/:target_slug'}, function () {   // path: /CB1000R      resource required :targetCategories is only really required if manufacturer is skipped or target is skipped
                    this.resource('interview.manufacturers.targets.targetCategories.groupedYears', {path: '/:target_category_slug'}, function () {   // this route will only be presented if manufacturer is skipped or target is skipped
                        this.resource('interview.manufacturers.targets.targetCategories.groupedYears.region', {path: '/:grouped_year_slug'}, function () {
                            this.resource('interview.manufacturers.targets.targetCategories.groupedYears.region.ruleSets', {path: '/:region_slug'}, function () {
                                this.resource('interview.manufacturers.targets.targetCategories.groupedYears.region.ruleSets.useCategories', {path: '/:ruleset_slug'}, function () {
                                    this.resource('interview.manufacturers.targets.targetCategories.groupedYears.region.ruleSets.useCategories.use1s', {path: '/:use_category_slug'}, function () {
                                        this.resource('interview.manufacturers.targets.targetCategories.groupedYears.region.ruleSets.useCategories.use1s.use2s', {path: '/:use1_slug'}, function () {
                                            this.resource('interview.manufacturers.targets.targetCategories.groupedYears.region.ruleSets.useCategories.use1s.use2s.use3s', {path: '/:use2_slug'}, function () {
                                                this.resource('interview.manufacturers.targets.targetCategories.groupedYears.region.ruleSets.useCategories.use1s.use2s.use3s.use4s', {path: '/:use3_slug'}, function () {
                                                    this.resource('interview.manufacturers.targets.targetCategories.groupedYears.region.ruleSets.useCategories.use1s.use2s.use3s.use4s.promptedFeatures', {path: '/:use4_slug'});
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    this.resource('design', {
        path: '/kits/:manufacturer/:target/:target_category/:grouped_year/:design_id'
    }, function () {
        this.resource('design.selector', {path: 'selector-map'}, function () {
            this.resource('design.position', {path: '/position/:position_id'}, function () {
                this.resource('design.position.alternatives', {path: '/alternatives'});
                this.resource('design.position.autoselect', {path: '/alternatives/:index/autoselect'});
                this.resource('design.position.mirror', {path: '/copy-features'});
                this.resource('design.position.automirror', {path: '/auto-copy-features'});
                this.resource('design.position.autoadd', {path: '/add'});
            });
            this.resource('design.selector.saveToEmail', {path: '/save'});
            this.resource('design.selector.startNewDesign', {path: '/start-new-design'});
            this.resource('design.selector.materials', {path: '/materials'});

            this.resource('design.selector.decals', {path: '/decals'});
            this.resource('design.selector.socialShare', {path: '/share'});
        });

        this.resource('design.themes', {path: '/themes'}, function () {
            this.resource('design.themes.confirm', { path: '/confirm/:theme_id'});
            this.resource('design.themes.regulated', { path: '/regulated/:theme_id'});
        });

        this.resource('design.checkout', { path: '/checkout'}, function () {
                this.resource('design.checkout.termsAndConditions', { path: '/terms-and-conditions'});
                this.resource('design.checkout.billing', { path: '/billing'});
                this.resource('design.checkout.purchased', { path: '/purchased/:email_address/:order_number'});
                this.resource('design.checkout.declined', { path: '/declined/:error'});
        });

        this.resource('design.editor', { path: '/position/:position_id/editor'}, function () {
                this.resource('design.editor.feature', { path: '/feature/:feature_id'},
                    function () {
                        this.resource('design.editor.feature.upload-image', { path: '/upload-image'});
                    });
        });

        this.resource('export-theme', { path: '/export-theme/:theme_name' });

    });

    this.route('incompatible-browser');
    this.route('application-error');
    this.route("not-found", { path: "*path"});

});

export default Router;
