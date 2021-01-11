import Ember from 'ember';
import Resolver from 'ember/resolver';
import loadInitializers from 'ember/load-initializers';
import config from './config/environment';
import rsLogger from './lib/rs-logger';

Ember.MODEL_FACTORY_INJECTIONS = true;

var App = Ember.Application.extend(Ember.Evented, {
    modulePrefix: config.modulePrefix,
    podModulePrefix: config.podModulePrefix,
    Resolver: Resolver
});


window.logger = rsLogger;

loadInitializers(App, config.modulePrefix);

export default App;
