/*jshint node:true*/
/* global require, module */
var EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function(defaults) {
  var app = new EmberApp(defaults, {
      storeConfigInMeta: false,
      inlineContent: {
          'loading-spinner' : 'public/html/partials/loading-spinner.html',
          'favicons' : 'public/html/partials/favicons.html',
          'bust-cache' : 'public/html/partials/bust-cache.html',
          'fallback-application-error' : 'public/html/partials/fallback-application-error.html'
      },

      fingerprint: {
          enabled: true,
          exclude: ['images/placeholder.svg', 'images/motocal.png', 'images/background-grid-excluded.png', 'images/theme-blank.png', 'branding', 'large-circular-throbber', 'images/global_edit']
      },

      sprite: {
          debug: false,
          src: [
              'images/sprite/**/*.png'
          ],
          spritePath: 'assets/sprite.png',
          stylesheetPath: 'assets/sprite.css',
          stylesheet: 'css',
          stylesheetOptions: {
              prefix: 'sprite-',
              spritePath: 'sprite.png',
              pixelRatio: 1
          },
          layoutOptions: {
              padding: 2
          }
      },
      sassOptions: {
          extension: 'scss'
      },
      sourcemaps: {
          extensions: ['js', 'scss']
      },
      babel: {
          includePolyfill: true
      },
      intlTelInput: {
          includeUtilsScript: true
      }
  });

  // Use `app.import` to add additional libraries to the generated
  // output files.
  //
  // If you need to use different assets in different
  // environments, specify an object as the first parameter. That
  // object's keys should be the environment name and the values
  // should be the asset to use in that environment.
  //
  // If the library that you are including contains AMD or ES6
  // modules that you would like to import into your application
  // please specify an object with the list of modules as keys
  // along with the exports of each module as its value.


    app.import('bower_components/ember-inflector/ember-inflector.js');
    app.import('bower_components/modernizr/modernizr.js');
    app.import('bower_components/detectizr/dist/detectizr.js');
    app.import('bower_components/fabric/dist/fabric.js');
    app.import('bower_components/queue-async/queue.js');
    app.import('bower_components/bootstrap/dist/js/bootstrap.js');
    app.import('bower_components/jquery.appear.js/jquery.appear.js');
    app.import('bower_components/jquery.easing/js/jquery.easing.js');
    app.import('bower_components/bootstrap-touchspin/bootstrap-touchspin/bootstrap.touchspin.js');
    app.import('bower_components/modernizr-canvas-blending/modernizr-canvas-blending.js');
    app.import('bower_components/cookies-js/dist/cookies.min.js');
    app.import('bower_components/fastclick/lib/fastclick.js');
    app.import('bower_components/moment/moment.js');
    app.import('bower_components/tinycolor/tinycolor.js');
    app.import('bower_components/toastr/toastr.css');
    app.import('bower_components/toastr/toastr.js');
    app.import('bower_components/nouislider/Link.js');
    app.import('bower_components/nouislider/jquery.nouislider.js');
    app.import('bower_components/nouislider/jquery.nouislider.css');
    app.import('bower_components/bootstrap-tokenfield/bootstrap-tokenfield/bootstrap-tokenfield.css');
    app.import('bower_components/bootstrap-tokenfield/bootstrap-tokenfield/bootstrap-tokenfield.js');
    app.import('bower_components/pako/dist/pako.js');
    app.import('bower_components/jquery-smartresize/jquery.debouncedresize.js');
    app.import('bower_components/jquery-smartresize/jquery.throttledresize.js');
    app.import('bower_components/lodash/lodash.js');
    app.import('bower_components/Keypress/keypress.js');
    app.import('bower_components/jquery-dragster/jquery.dragster.js');
    app.import('bower_components/hammerjs/hammer.js');
    app.import('bower_components/nipplejs/dist/nipplejs.js');
    app.import('bower_components/metaphone/metaphone.js');
    app.import('bower_components/naivebayesclassifier/dist/NaiveBayesClassifier.js');
    app.import('bower_components/nprogress/nprogress.js');
    app.import('bower_components/custom-event-polyfill/custom-event-polyfill.js');


    app.import('bower_components/bootstrap-sass/assets/fonts/bootstrap/glyphicons-halflings-regular.eot', {
        destDir: 'fonts'
    });
    app.import('bower_components/bootstrap-sass/assets/fonts/bootstrap/glyphicons-halflings-regular.ttf', {
        destDir: 'fonts'
    });
    app.import('bower_components/bootstrap-sass/assets/fonts/bootstrap/glyphicons-halflings-regular.svg', {
        destDir: 'fonts'
    });
    app.import('bower_components/bootstrap-sass/assets/fonts/bootstrap/glyphicons-halflings-regular.woff', {
        destDir: 'fonts'
    });
    app.import('bower_components/bootstrap-sass/assets/fonts/bootstrap/glyphicons-halflings-regular.woff2', {
        destDir: 'fonts'
    });

    app.import('bower_components/tether/dist/js/tether.js');
    app.import('bower_components/tether-shepherd/dist/js/shepherd.js');
    app.import('bower_components/tether-shepherd/dist/css/shepherd-theme-arrows.css');

    app.import('bower_components/Swipe/swipe.js');

    if (app.env === 'production') {
        app.import('bower_components/bugsnag/src/bugsnag.js');
        app.options.inlineContent['google-analytics-snippet'] = 'public/html/partials/google-analytics-snippet.html';
        app.options.inlineContent['mixpanel-snippet'] = 'public/html/partials/mixpanel-snippet.html';
        app.options.inlineContent['analytics-loader'] = 'public/html/partials/analytics-loader.html';
    }

  return app.toTree();
};
