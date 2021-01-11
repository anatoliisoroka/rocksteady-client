import Ember from 'ember';

var MAX_FAVOURITE_TAGS = 10;

export default Ember.ArrayController.extend(Ember.Evented, {

    needs: ['design', 'design/editor', 'design/editor/feature', 'application', 'interview'],

    isTouch: Ember.computed.alias('controllers.application.isTouch'),

    /*
     *This controller combines sideloaded design graphics with graphics from an api
     *search to give a composite array that is pageable and filterable by tag.
     */

    favouriteTags: [],

    favouriteTagsObserver: function () {
        this.set('favouriteTags', this.store.all('tag'));
    }.observes('controllers.design.model').on('init'),

    tags: [],

    filteredKitGraphics: [],

    itemsPerPage: 32,
    curPage: 0,
    totalItems: 0,

    itemsPerPageObserver: function () {
        this.set('curPage', 0);
    }.observes('itemsPerPage'),

    curPagePlusOne: function () {
        return this.get('curPage') + 1;
    }.property('curPage'),

    totalPages: function () {
        return Math.ceil(this.get('totalItems') / this.get('itemsPerPage'));
    }.property('totalItems', 'itemsPerPage'),

    hasMoreThanOnePage: function () {
        return this.get('totalPages') > 1;
    }.property('totalPages'),

    cannotGotoPreviousPage: function () {
        return (this.get('curPage') <= 0);
    }.property('totalPages', 'curPage'),

    cannotGotoNextPage: function () {
        return (this.get('curPage') >= this.get('totalPages') - 1);
    }.property('totalPages', 'curPage'),

    cannotGotoFirstPage: function () {
        return (this.get('curPage') === 0);
    }.property('totalPages', 'curPage'),

    cannotGotoLastPage: function () {
        return (this.get('curPage') === this.get('totalPages') - 1);
    }.property('totalPages', 'curPage'),

    loadingGraphics: false,

    init () {
        this.set('filteredKitGraphics', this.get('controllers.design.model.usableGraphics'));

        this.get('controllers.interview').on('newDesign', () => {
            this.set('tags', []);
            this.get('content').clear();
        });
    },

    actions: {
        gotoNextPage: function () {
            this.set('curPage', this.get('curPage') + 1);
        },

        gotoPreviousPage: function () {
            this.set('curPage', this.get('curPage') - 1);
        },

        gotoFirstPage: function () {
            this.set('curPage', 0);
        },

        gotoLastPage: function () {
            this.set('curPage', this.get('totalPages') - 1);
        },

        addFavouriteTag: function (tag) {
            if (!this.get('favouriteTags').findBy('tag', tag.id)) {
                var tags = this.store.all('tag');

                if (tags.get('length') >= MAX_FAVOURITE_TAGS) {
                    var tagToRemove = tags.get('firstObject');
                    this.store.unloadRecord(tagToRemove);
                }

                this.store.push('tag', tag);
            }

            this.trigger('favouriteTagsChanged');
        },

        removeFavouriteTag: function (tag) {

            this.store.find('tag', tag.id).then(function (tag) {
                tag.unloadRecord();
            });

            this.trigger('favouriteTagsChanged');
        }
    },

    tagsChanged: function () {
        this.set('curPage', 0);
        this.fetchGraphics();
    }.observes('tags'),

    pagesChanged: function () {
        this.fetchGraphics();
    }.observes('curPage', 'itemsPerPage'),

    fetchGraphics: function () {
        var tags = this.get('tags');

        if (tags.length === 0) {
            this.set('filteredKitGraphics', this.get('controllers.design.model.usableGraphics'));
        } else {
            this.set('filteredKitGraphics', this.get('controllers.design.model.usableGraphics').filter(function (graphic) {
                var graphicTags = graphic.get('tags'),
                    yes = 0;

                if (!graphicTags) {
                    return false;
                }

                for (var j = 0; j < tags.length; j++) {
                    for (var i = 0; i < graphicTags.length; i++) {
                        if (graphicTags[i] && graphicTags[i].name && graphicTags[i].name.toLowerCase() === tags[j].toLowerCase()) {
                            yes++;
                        }
                    }
                }

                return (yes === tags.length);
            }));
        }

        var filteredKitGraphics = this.get('filteredKitGraphics');

        this.set('loadingGraphics', true);

        var limit = this.get('itemsPerPage');

        if (limit === 0) {
            limit = 32;
        }

        //apply filteredKitGraphics length
        var offset;
        var listOffset = (this.get('curPage') * this.get('itemsPerPage'));
        offset = Math.max(0, listOffset - filteredKitGraphics.length);

        var params = {
            offset: offset,
            limit: limit,
            tags: this.get('tags')
        };

        this.store.find('graphic', params).then((filteredSearchGraphics) => {
            this.get('content').clear();

            //deal with filteredKitGraphics
            if (filteredKitGraphics.length > listOffset) {
                var offsetKitGraphics = filteredKitGraphics.slice(listOffset - filteredKitGraphics.length, filteredKitGraphics.length);
                this.get('content').addObjects(offsetKitGraphics);
            }

            this.get('content').addObjects(filteredSearchGraphics);

            //FIXME workaround bad limit from server
            //The content length should never exceed the limit, the issue here is the objects are appended to the
            //DOM before an order->limit is applied
            if (this.get('content').length > limit) {
                var content = this.get('content');
                var contentLength = content.length;
                //FIXME Workaround, will need to be revisited
                content.removeObjects(content.slice(limit, contentLength));
            }

            var meta = this.store.metadataFor('graphic');

            if (meta && meta.total) {
                this.set('totalItems', meta.total + filteredKitGraphics.length);
            }

            this.set('loadingGraphics', false);

        });
    }.on('init')
});
