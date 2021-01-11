import Ember from 'ember';

import GroupedyearHelper from '../helpers/groupedyear';
import SvgHelper from '../helpers/svg';
import IslastHelper from '../helpers/islast';
import CarouselView from '../views/carousel';
import ConcatHelper from '../helpers/concat';

export function initialize(/* container, application */) {
    Ember.Handlebars.helper('svg', SvgHelper);
    Ember.Handlebars.helper('groupedyear', GroupedyearHelper);
    Ember.Handlebars.helper('carousel', CarouselView);
    Ember.Handlebars.helper('islast', IslastHelper);
    Ember.Handlebars.helper('concat', ConcatHelper);
}

export default {
    name: 'register-helpers',
    initialize: initialize
};
