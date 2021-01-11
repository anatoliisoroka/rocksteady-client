import Ember from 'ember';

export default Ember.Component.extend({
    positionName: null,
    designId: null,
    stackOffset: 32,
    topOffset: 40,

    messages: Ember.A(),
    messageList: Ember.ArrayProxy.create({content: Ember.A([])}),

    numberOfMessages: Ember.computed('messageList', function () {
        let messageList = this.get('messageList');
        return messageList.length;
    }),

    handleMessages: function () {
        let messages = this.get('messages');

        let messagesSorted = messages.sortBy('position');

        messagesSorted.forEach(function (message, index) {
            if (typeof message.position !== 'undefined') {
                Ember.set(message, 'position', message.position);
            } else if (index === 0) {
                Ember.set(message, 'position', messages.length);
            } else {
                Ember.set(message, 'position', index + 1);
            }
        });

        this.set('messageList', messages);
    }.observes('messages.@each.usedColours'),

    handleMessageRemoval: function () {
        let messages = this.get('messages');
        let messageList = this.get('messageList');

        messages
            .filter((message) => {
                return message.shouldRemove;
            }).forEach(function (message) {
                this.removeMessage(message);
            }, this);

        messageList
            .sortBy('position')
            .forEach((message, index) => {
                Ember.set(message, 'position', index + 1);
            });

    }.observes('messages.@each.shouldRemove'),

    willDestroyElement(){
        let messageList = this.get('messageList');
        if (messageList) {
            messageList.clear();
        }
    },

    removeMessage(message) {
        let messageList = this.get('messageList');
        //Allow animation to complete
        Ember.run.later(() => {
            if (message.shouldRemove) {
                messageList.removeObject(message);
            }
        }, 800);
    },

    bringForward(selectedMessage) {
        let messageList = this.get('messageList');

        messageList
            .filter(function (message) {
                return message.group !== selectedMessage.group;
            })
            .sortBy('position')
            .forEach(function (otherMessage, index) {
                Ember.set(otherMessage, 'position', index + 1);
            });

        Ember.set(selectedMessage, 'position', messageList.length);
    },

    hideGroup(group, hidden){
        let storageVariable = this._getGroupStorageKey(group);
        window[storageVariable] = hidden;
    },

    _getGroupStorageKey(group){
        let positionName = this.get('positionName');
        let designId = this.get('designId');
        return ('hidden_colour_group_' + designId + '_' + positionName + '_' + group).replace(/\s+/ig, '_').toLowerCase();
    },

    actions: {

        removeMessage: function (messageCtrl) {
            return this.removeMessage(messageCtrl);
        },

        bringForward: function (message) {
            return this.bringForward(message);
        },

        hideGroup: function (group, hidden) {
            return this.hideGroup(group, hidden);
        }

    }
})
;
