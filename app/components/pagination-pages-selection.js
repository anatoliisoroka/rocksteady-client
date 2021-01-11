import Ember from 'ember';

export default Ember.Component.extend({
    tagName: '',
    count: 0,

    currentPage: function () {
        return this.get('current') + 1;
    }.property('current'),

    pagesArray: function () {
        let current = this.get('currentPage');
        let count = this.get('count');
        let pagesArray = [];
        let maxSegments = 7;

        //If there are more number than available space
        if (count > maxSegments) {
            for (let i = 1; i <= maxSegments; i++) {
                let inversePageCount = count - (maxSegments - i);

                let pageItem;

                if (i === 1) {
                    pageItem = {
                        number: i,
                        numberText: i,
                        active: i === current
                    };
                } else if (i > 1) {
                    // Current page near the start
                    if (current < 4) {
                        if (i === 6) {
                            pageItem = {number: count, numberText: '...', active: false};
                        } else if (i > 6) {
                            pageItem = {
                                number: inversePageCount,
                                numberText: inversePageCount,
                                active: inversePageCount === current
                            };
                        } else {
                            pageItem = {
                                number: i,
                                numberText: i,
                                active: i === current
                            };
                        }
                        //Current page near the end
                    } else if (current > (count - 4)) {
                        if (i === 2) {
                            pageItem = {
                                number: 1,
                                numberText: '...',
                                active: false
                            };
                        } else {
                            pageItem = {
                                number: inversePageCount,
                                numberText: inversePageCount,
                                active: inversePageCount === current
                            };
                        }
                        // Current page in the middle
                    } else {
                        if (i === 1) {
                            pageItem = {
                                number: i,
                                numberText: i,
                                active: false
                            };
                        } else if (i === 2) {
                            pageItem = {
                                number: 0,
                                numberText: '...',
                                active: false
                            };
                        } else if (i === 3) {
                            pageItem = {
                                number: current - 1,
                                numberText: current - 1,
                                active: false
                            };
                        } else if (i === 4) {
                            pageItem = {
                                number: current,
                                numberText: current,
                                active: true
                            };
                        } else if (i === 5) {
                            pageItem = {
                                number: current + 1,
                                numberText: current + 1,
                                active: false
                            };
                        } else if (i === 6) {
                            pageItem = {
                                number: 0,
                                numberText: '...',
                                active: false
                            };
                        } else if (i === 7) {
                            pageItem = {
                                number: count,
                                numberText: count,
                                active: false
                            };
                        }
                    }
                }

                pagesArray.push(pageItem);
            }
        } else {
            for (let i = 1; i <= count; i++) {
                pagesArray.push({
                    number: i,
                    numberText: i,
                    active: i === current
                });
            }
        }

        return pagesArray;
    }.property('count', 'currentPage'),

    hasNext: function () {
        return this.get('currentPage') < this.get('count');
    }.property('currentPage', 'count'),

    hasPrevious: function () {
        return this.get('currentPage') > 1;
    }.property('currentPage'),

    actions: {
        next: function () {
            if (this.get('hasNext')) {
                this.sendAction('next');
            }
        },

        previous: function () {
            if (this.get('hasPrevious')) {
                this.sendAction('previous');
            }
        },

        change: function (page) {
            this.sendAction('change', page-1);
        }
    }
});
