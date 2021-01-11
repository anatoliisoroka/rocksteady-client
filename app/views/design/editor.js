/* global nipplejs, Modernizr, Detectizr, $ */

import Ember from 'ember';
import config from '../../config/environment';

export default Ember.View.extend({
    overflowController: false,
    keysBound: false,

    //leave two spaces to create an array of the key combination
    shortcuts: {
        'left': function () {
            this.move(-1, 'left');
        },

        'right': function () {
            this.move(1, 'left');
        },

        'up': function () {
            this.move(-1, 'top');
        },

        'down': function () {
            this.move(1, 'top');
        },

        '[  {': function () {
            if (this.af().get('canModify') && this.af().get('canDecreaseAngle')) {
                this.af().decrementProperty('angle', 1);
                this.controller.get('rsEditorCanvas').renderNow();
            }
        },

        ']  }': function () {
            if (this.af().get('canModify') && this.af().get('canIncreaseAngle')) {
                this.af().incrementProperty('angle', 1);
                this.controller.get('rsEditorCanvas').renderNow();
            }
        },

        'pageup': function () {
            if (this.af().get('canModify')) {
                this.controller.send('featureForwards');
            }
        },

        'pagedown': function () {
            if (this.af().get('canModify')) {
                this.controller.send('featureBackwards');
            }
        },

        '+  =  shift =': function () {
            if (this.af().get('canModify') && this.af().get('canIncreaseScale')) {
                if (this.af().get('type') === 'GraphicIcon') {
                    this.af().incrementProperty('scale', 0.05);
                } else if (this.af().get('type') === 'Text') {
                    this.af().incrementProperty('fontSize', 10);
                }

                this.controller.get('rsEditorCanvas').renderNow();
            }
        },

        '-': function () {
            if (this.af().get('canModify') && this.af().get('canDecreaseScale')) {
                if (this.af().get('type') === 'GraphicIcon') {
                    this.af().decrementProperty('scale', 0.05);
                } else if (this.af().get('type') === 'Text') {
                    this.af().decrementProperty('fontSize', 10);
                }

                this.controller.get('rsEditorCanvas').renderNow();
            }
        },

        'enter': function () {
            this.controller.send('setAsActive', this.controller.get('nextFeature'));
        },

        'del  delete': function () {
            if (this.af().get('canModify')) {
                this.controller.send('removeActiveFeature');
            }
        },

        'escape': function () {
            this.controller.transitionToRoute('design.selector');
        },

        '?': function () {
            window.tourMediator.trigger('show-shortcuts');
        }
    },

    onEditorGrid: function () {
        //deal with the keys
        this.unbindKeys();
        this.bindKeys();
    }.observes('controller.controllers.application.useEditorGrid'),

    applyOverflowController: function () {
        //just if touch
        if (!Modernizr.touch || !this.get('controller.isCanvasRendered')) {
            return;
        }

        //set .editor-canvas-container as it's re-rendered
        if (this.get('controller.zoom') > 100) {
            this.$editorCanvasContainer = $('.editor-canvas-container');
        }

        //bind overflow controller
        if (this.get('controller.zoom') > 100) {
            this.bindOverflowController();
        } else if (this.get('controller.zoom') === 100) {
            this.unbindOverflowController();
        }
    }.observes('controller.isCanvasRendered'),

    bindOverflowController: function () {
        //workaround as the view is not destroyed
        if ($('.nipple').length) {
            return;
        }

        this.nippleManager = nipplejs.create({
            zone: document.getElementById('nipple-controller'),
            mode: 'static',
            position: {left: '50px', top: '0px'},
            color: '#337ab7'
        });

        this.nippleManager.on('move', (ev, data) => {
            this.applyOverflowControllerScroll(data);

            //safari
            if (Detectizr.browser.name === 'safari') {
                clearInterval(this.nippleMoveInterval);
                this.nippleMoveInterval = setInterval(() => {
                    this.applyOverflowControllerScroll(data);
                }, 25);
            }
        });

        //safari
        if (Detectizr.browser.name === 'safari') {
            this.nippleManager.on('end', () => {
                clearInterval(this.nippleMoveInterval);
            });
        }
    },

    applyOverflowControllerScroll: function (data) {
        var x = 3 * data.force * Math.cos(data.angle.radian);
        var y = 3 * data.force * Math.sin(data.angle.radian);

        var scroll = {
            top: this.$editorCanvasContainer.scrollTop(),
            left: this.$editorCanvasContainer.scrollLeft()
        };

        this.$editorCanvasContainer.scrollTop(scroll.top - y);
        this.$editorCanvasContainer.scrollLeft(scroll.left + x);
    },

    unbindOverflowController: function () {
        if (typeof this.nippleManager !== 'undefined' && this.nippleManager.destroy) {
            this.nippleManager.destroy();
        }
    },

    bindKeys: function () {
        if (this.keysBound) {
            return;
        }

        var view = this,
            grid = this.get('controller.controllers.application.useEditorGrid') ? config.APP.grid_spacing : 5;

        var context = {
            controller: view.get('controller'),
            af: function () {
                return this.controller.get('activeFeature');
            },
            move: function (dir, prop) {
                var fabObj = this.controller.get('rsEditorCanvas').featureFabObjs[this.af().get('id')];

                if (fabObj && this.af().get('canModify')) {
                    fabObj.set(prop, fabObj.get(prop) + grid * dir);
                    fabObj.setCoords();
                    this.controller.get('rsEditorCanvas').setEmberObjPosition(fabObj);
                    this.controller.get('rsEditorCanvas').renderNow();
                }
            }
        };

        for (var i in this.shortcuts) {
            if (i.indexOf('  ') > 0) {
                var keys = i.split('  ');
                keys.forEach((key) => {
                    this.keys.bind(key, this.shortcuts[i].bind(context));
                });
            } else {
                this.keys.bind(i, this.shortcuts[i].bind(context));
            }
        }

        this.keysBound = true;
    },

    unbindKeys: function () {
        if (!this.keysBound) {
            return;
        }

        for (var i in this.shortcuts) {
            if (i.indexOf('  ') > 0) {
                var keys = i.split('  ');
                keys.forEach((key) => {
                    this.keys.unbind(key);
                });
            } else {
                this.keys.unbind(i);
            }
        }

        this.set('keysBound', false);
    },

    controllerBinKeys: function () {
        if (this.get('controller.bindKeys')) {
            this.bindKeys();
        } else {
            this.unbindKeys();
        }
    }.observes('controller.bindKeys'),

    didInsertElement: function () {
        //prevent problems on input/textarea
        this.$().on('focus', 'input[type="text"],textarea', () => {
            this.unbindKeys();
        });
        this.$().on('blur', 'input[type="text"],textarea', () => {
            this.bindKeys();
        });

        if (this.get('controller.model.isRegulated')) {
            var t = this.get('parentView.controller').get('i18n').t.bind(this.get('controller.i18n')),
                view = this;

            Ember.run.later(this, function () {
                if (view && !view.get('isDestroyed')) {
                    view.get('controller.controllers.application').send(
                        'toast',
                        t('regulationwarnings.regulatedposition').toString(),
                        'warning',
                        'toast-regulatedposition-warning'
                    );
                }
            }, 1000);
        }

        this.bindKeys();
    },

    willDestroyElement: function () {
        this.unbindOverflowController();
        this.unbindKeys();
        this.set('controller.zoom', 100);
    }
});


