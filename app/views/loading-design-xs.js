/* global $ */
import Ember from 'ember';

export default Ember.View.extend({
    templateName: 'loading-design-xs',
    waitingMessages: ['interview.loading_xs.msg1', 'interview.loading_xs.msg2',
        'interview.loading_xs.msg3', 'interview.loading_xs.msg4'],
    progress: 0,

    isLoadingObserver: function () {
        var isLoading = this.get('isLoading');
        if (isLoading) {
            this.initViewLogic();
        } else {
            this.endViewLogic();
        }
    }.observes('isLoading'),

    initViewLogic () {
        this.setDisplayedInformation();
        this.startProgressBar();
        this.startWaitingMessage();
        this.$().find('#loading-design-xs').fadeIn(600);
        //hide zopim
        $('.zopim').hide();
    },

    endViewLogic () {
        this.endProgressBar();
        this.endWaitingMessage();
        Ember.run.later(() => {
            this.$().find('#loading-design-xs').fadeOut(600);
            //show zopim
            $('.zopim').show();
        }, 300);
    },

    progressObserver: function () {
        if (this.$()) {
            this.$().find('.progress-bar').css('width', this.get('progress') + '%');
        }
    }.observes('progress'),

    setDisplayedInformation () {
        var interviewModel = this.get('controller.controllers.interview.model');
        //workaround...it was changing whatever the reason
        this.set('modelDescription', interviewModel.get('description'));

        if (this.$()) {
            if (interviewModel.get('productLine.imageUrl')) {
                this.$('.img.product-line').removeClass('hidden').css('background-image', 'url("' + interviewModel.get('productLine.imageUrl').replace(/(\r\n|\n|\r)/gm, "") + '")');
            } else {
                this.$('.img.product-line').addClass('hidden');
            }
            if (interviewModel.get('manufacturer.imageUrl')) {
                this.$('.img.manufacturer').removeClass('hidden').css('background-image', 'url("' + interviewModel.get('manufacturer.imageUrl').replace(/(\r\n|\n|\r)/gm, "") + '")');
            } else {
                this.$('.img.manufacturer').addClass('hidden');
            }
            if (interviewModel.get('ruleSet.imageUrl')) {
                this.$('.img.ruleSet').removeClass('hidden').css('background-image', 'url(' + interviewModel.get('ruleSet.imageUrl').replace(/(\r\n|\n|\r)/gm, "") + ')');
            } else {
                this.$('.img.ruleSet').addClass('hidden');
            }
        }

    },

    startWaitingMessage () {
        this.setNextWaitingMessage();
        this.waitingMessageInterval = setInterval(() => {
            this.setNextWaitingMessage();
        }, 3000);
    },

    setNextWaitingMessage () {
        this.waitingMessages.push(this.waitingMessages.shift());
        this.set('changeWaitingMessage', this.get('controller.i18n').t(this.waitingMessages[0]).toString());
    },

    endWaitingMessage () {
        window.clearInterval(this.waitingMessageInterval);
    },

    startProgressBar () {
        var progress = this.get('progress');
        this.set('progress', 20);
        this.progressBarInterval = setInterval(() => {
            if (progress < 45){
                this.set('progress', this.get('progress') + 1.5);
            } else if (progress < 80) {
                this.set('progress', this.get('progress') + 0.5);
            }
        }, 900);
    },

    endProgressBar () {
        this.set('progress', 100);
        window.clearInterval(this.progressBarInterval);
    },

    willDestroyElement: function () {
        clearInterval(this.waitingMessageInterval);
        clearInterval(this.progressBarInterval);
        $('#loading-design-xs-container').removeClass('shown');
    }
});
