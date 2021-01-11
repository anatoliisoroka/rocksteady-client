/* jshint node: true */

module.exports = function (environment) {
    var ENV = {
        modulePrefix: 'motocal',
        version: '2018-w30-rc1',
        environment: environment,
        baseURL: '/',
        locationType: 'hash',

        i18n: {defaultLocale: 'en'},

        APP: {
            api_endpoint: '/api',
            auth_endpoint: '/api/auth/social/authorize',
            auth_redirect_path: '/app/html/login/callback.html',
            user_endpoint: '/api/me',
            analytic_events_endpoint: '/api/events',
            auth_extra_params: '',
            autosave: true,
            bootstrap_breakpoints: {
                CUSTOM_MAX_WIDTH: 479,
                XS_MAX_WIDTH: 767,
                SM_MAX_WIDTH: 991
            },
            shadows: true,
            bugsnag: false,
            qrons: true,
            gzip_pr_put_request: false,
            gzip_kit_put_request: false,
            image_upload_min_size: 1024 * 10, // 10KB
            image_upload_max_size: 1024 * 1024 * 1024, // 1MB
            image_upload_initial_scale: 0.3,
            image_upload_max_scale: 0.5,
            motocal_mm_px_ratio: 2.83464366,
            qron_size_mm: 13.5,
            qron_print_margin: 7,
            editor_canvas_redraw: 150,
            qron_bleed_compensation: 1,
            upg_endpoint: 'https://staging.monek.com/secure/rocksteadyv3/iPay.aspx',
            colour_sorter: 'hue',
            grid_spacing: 20,
            toastr_timeout: 20000,
            allow_feature_same_colour_as_component: true,
            prompt_to_save_after_seconds: (40 * 1000),
            prompt_to_save_after_seconds_touch: (20 * 1000),
            design_api_debug_parameters: true,
            minimum_shipping_cost: 20,
            best_practice_link: 'about:blank',
            facebook_share_url: 'https://www.facebook.com/dialog/share?display=popup&app_id=',
            facebook_share_id: '1498243230414608',
            features: {
                icon_borders: true,
                linked_features: true,
                svg_upload: false,
                show_paypal: true,
                feature_opacity: false,
                icon_flip: true,
                clone_feature: true,
                editor_grid: true,
                mirror_features: true,
                prompt_to_save: (environment === 'production' || environment === 'development'),
                discount_codes: true,
                auto_select: true,
                quick_decal_select: true,
                editor_feature_name: false,
                themes: true,
                import_theme_json: false,
                default_theme: false,
                user_tour: true,
                help_button: true,
                design_not_saved_alert: true
            },
            themes: {
                // theme_applied | theme_viewed | theme_purchased | theme_bookmarked | theme_info_viewed
                engagement_metric: 'theme_viewed',
                display_order_options_order: [
                    'new',
                    'popular',
                    'user-viewed',
                    'engagement-metric',
                    'user-bookmarked'
                ]
            },
            global_edit: {
                mandatory_recommended_colour_ids: [],
                colour_groups_display_order: []
            }
        },

        URLs: {
            marketing_site: 'http://www.motocal.com/',
            charity_work: 'http://www.motocal.com/about/charity-work',
            preview_url: 'http://vbox/share/%@_%@.htm'
        },
        mixpanel: {
            enabled: (environment === 'production'),
            token: '5863a25461c5b99397b64e829a7934a2'
        },
        google_analytics: {
            enabled: (environment === 'production'),
            tracking_id: 'UA-52441999-1'
        },
        product_lines: [],
        b2b: true
    };


    ENV.contentSecurityPolicy = {
        'default-src': '\'none\'',
        'script-src': '\'self\' \'unsafe-eval\' \'unsafe-inline\' http://www.google-analytics.com https://connect.facebook.net http://connect.facebook.net http://v2.zopim.com http://assets.zendesk.com *.zopim.com https://notify.bugsnag.com http://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js',
        'font-src': '\'self\' data: http://v2.zopim.com ',
        'connect-src': '\'self\' wss://*.zopim.com https://motocal.zendesk.com api.mixpanel.com https://notify.bugsnag.com https://storage.googleapis.com',
        'img-src': '\'self\' data: http://www.google-analytics.com https://stats.g.doubleclick.net http://v2.zopim.com https://v2assets.zopim.io https://www.facebook.com https://notify.bugsnag.com https://storage.googleapis.com https://www.google.com https://www.google.ie https://via.placeholder.com',
        'style-src': '\'self\' \'unsafe-inline\'',
        'media-src': '\'self\' http://v2.zopim.com ',
        'child-src': 'https://clients.universalpaymentgateway.com http://static.ak.facebook.com https://s-static.ak.facebook.com http://assets.zendesk.com http://www.facebook.com https://www.facebook.com http://staticxx.facebook.com'
    };


    if (environment === 'development') {
        ENV.APP.LOG_ACTIVE_GENERATION = false;
        ENV.APP.LOG_TRANSITIONS = false;
        ENV.APP.LOG_VIEW_LOOKUPS = false;
        ENV.APP.environment = 'dev';
        ENV.APP.logging = true;
        ENV.APP.debugging = true;
        ENV.APP.auth_redirect_path = '/html/login/callback.html';
    }

    if (environment === 'test') {
        ENV.APP.LOG_ACTIVE_GENERATION = false;
        ENV.APP.LOG_VIEW_LOOKUPS = false;
        ENV.APP.environment = 'test';
        ENV.APP.logging = true;
        ENV.APP.debugging = false;
        ENV.APP.testing = true;
        ENV.URLs.preview_url = 'https://test.motocal.com/share/%@_%@.htm';
        ENV.APP.bugsnag = false;
        ENV.APP.features.design_not_saved_alert = false;
    }

    if (environment === 'test' || environment === 'development') {
        ENV.APP.threeds_test = true;
        ENV.APP.threeds_action = 'NONE';
        ENV.APP.threeds_password = 'NeTb3714';
        ENV.exportApplicationGlobal = 'EmberApplicationGlobal';
        ENV.contentSecurityPolicy['child-src'] += ' http://localhost:4200 https://securecode.lisa.mastercard.com https://test.cap.attempts.securecode.com';
        ENV.contentSecurityPolicy['child-src'] += ' https://elite.monek.com/';
        ENV.APP.auth_endpoint = '/api/auth-sandbox/social/authorize';
        ENV.APP.features.user_tour = false;
        //ENV.APP.merchant_acc_override = '9900846'; // staging merchant acc
        //ENV.APP.merchant_acc_override = '9901349'; // test merchant acc
        //ENV.APP.merchant_acc_override = '0079400'; // production merchant acc (EUR)
        //ENV.APP.merchant_acc_override = '0079731'; // production merchant acc (AUD, CAD, USD)
        //ENV.APP.merchant_acc_override = '0079459'; // production merchant acc (GBP)
    }

    if (environment === 'production') {
        ENV.APP.environment = 'production';
        ENV.APP.logging = true;
        ENV.APP.debugging = false;
        ENV.APP.testing = false;
        ENV.APP.bugsnag = true;
        ENV.APP.gzip_pr_put_request = true;
        ENV.APP.threeds_test = false;
        ENV.APP.threeds_action = 'NONE';
        ENV.APP.threeds_password = 'shGI1853';
        ENV.URLs.preview_url = 'https://app.motocal.com/share/%@_%@.htm';

        ENV.zopim = {
            id: '3XTFJNxbHVe8JEhobBQCJaSz9axfFFFT'
        };
    }

    return ENV;
};
