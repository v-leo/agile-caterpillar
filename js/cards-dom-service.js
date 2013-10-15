/*
 Agile Caterpillar - v0.1
 https://github.com/v-leo/agile-caterpillar

 The MIT License (MIT)

 Copyright (c) 2013 Vladimir Leontyev

 Permission is hereby granted, free of charge, to any person obtaining a copy of
 this software and associated documentation files (the "Software"), to deal in
 the Software without restriction, including without limitation the rights to
 use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 the Software, and to permit persons to whom the Software is furnished to do so,
 subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

Caterpillar.DomService = new function () {
    var _this = this;

    //Need for tests
    this.__setThis__ = function (t) {
        _this = t;
    };

    this.getStoryCard = function () {
        return $("#story-item");
    };

    this.getDisabledInfoSpan = function () {
        return $("#disabled-counter-span");
    };

    this.getEnabledInfoSpan = function () {
        return $("#enabled-counter-span");
    };

    this.getTotalInfoSpan = function () {
        return $("#total-counter-span");
    };

    this.getShowDisabledSwitcher = function () {
        return $("#show-disabled-switcher");
    };

    this.getShowTotalInfoSwitcher = function () {
        return $("#show-total-info");
    };

    this.getShowEnabledInfoSwitcher = function () {
        return $("#show-enabled-info");
    };

    this.showTotalEstimation = function () {
        var card = _this.getStoryCard();
        card.addClass("show-total-eta");
        card.removeClass("show-enabled-eta");
    };

    this.showEnabledEstimation = function () {
        var card = _this.getStoryCard();
        card.addClass("show-enabled-eta");
        card.removeClass("show-total-eta");
    };

    this.showStoryEstimation = function () {
        var card = _this.getStoryCard();
        card.removeClass("show-enabled-eta");
        card.removeClass("show-total-eta");
    };

    this.getHiddenEndingCardsDiv = function(){
        return $("#hidden-ending-cards");
    };

    this.isShownTotalEstimation = function () {
        return _this.getStoryCard().hasClass("show-total-eta");
    };

    this.isShownEnabledEstimation = function () {
        return _this.getStoryCard().hasClass("show-enabled-eta");
    };

    this.getStoryStoryEtaSpan = function () {
        return $("#story-eta-span");
    };

    this.getStoryTotalEtaSpan = function () {
        return $("#total-eta-span");
    };

    this.getStoryEnabledEtaSpan = function () {
        return $("#enabled-eta-span");
    };

    this.getCardUiDiv = function (card) {
        return card.find(">div.card");
    };

    this.getCardByChild = function (child) {
        return child.closest("li.card-item,div.story-item");
    };

    this.getTasksContainer = function () {
        return $("#tasks-container");
    };

    this.getStoryPage = function () {
        return $("#story-page");
    };

    this.getTaskCardTemplate = function () {
        return $("#card-template");
    };

    this.getStoryIdInput = function () {
        return $("#story-id-input");
    };

    this.getCardIdSpan = function (card) {
        return card.find("div.card-header td.card-id span");
    };

    this.getCardEtaSpan = function (card) {
        return card.find("div.card-header td.card-eta span");
    };

    this.getStoryIdValueInput = function () {
        return $("#story-id-value-input");
    };

    this.getCardIdValueInput = function (card) {
        return card.find(">input.card-id-value");
    };

    this.getCardEtaValueInput = function (card) {
        return card.find(">input.card-eta-value");
    };

    this.getCardDescriptionValueInput = function (card) {
        return card.find(">input.card-description-value");
    };

    this.getCardDescriptionTextarea = function (card) {
        return card.find("div.card-content textarea");
    };

    this.getCardEtaInput = function (card) {
        return card.find("div.card-header td.card-eta input.card-eta-input");
    };

    this.getCardContentTd = function (card) {
            return card.find("div.card-content td");
        };

    this.getCardContentDiv = function (card) {
        return card.find("div.card-content div.content-div");
    };

    this.getCardToolbarButtonSet = function (card) {
        return card.find("div.card-toolbar-container .card-button-set")
    };

    this.getAddNewToRightButton = function (toolBarButtonSet) {
        return toolBarButtonSet.find(">button.add-new-right");
    };

    this.getAddNewToLeftButton = function (toolBarButtonSet) {
        return toolBarButtonSet.find(">button.add-new-left");
    };

    this.getDisableTaskButton = function (toolBarButtonSet) {
        return toolBarButtonSet.find(">button.disable-task-card");
    };

    this.getEnableTaskButton = function (toolBarButtonSet) {
        return toolBarButtonSet.find(">button.enable-task-card");
    };

    this.getRemoveTaskButton = function (toolBarButtonSet) {
        return toolBarButtonSet.find(">button.remove-task-card");
    };

    this.getRemoveStoryButton = function (toolBarButtonSet) {
        return toolBarButtonSet.find(">button.remove-story");
    };

    this.getColorButton = function (toolBarButtonSet) {
        return toolBarButtonSet.find(">button.card-color");
    };

    this.getDisabledCards = function () {
        return _this.getTasksContainer().find(">li.disabled-card");
    };

    this.getStoryInfoTr = function () {
        return $("#story-info-tr");
    };

    this.getAllCardsNoCondition = function () {
        return _this.getTasksContainer().find(">li.card-item");
    };

    this.getFirstCardNoCondition = function () {
        return _this.getTasksContainer().find(">li.card-item:first-of-type");
    };

    this.getLastCardNoCondition = function () {
        return _this.getTasksContainer().find(">li.card-item:last-of-type");
    };

    this.filterOutDisabledCards = function (cards) {
        return cards.not(".disabled-card");
    };

    this.isStoryCard = function (card) {
        return card.hasClass("story-item");
    };

    this.isShowDisabledCards = function () {
        return _this.getStoryPage().hasClass("show-disabled-cards");
    };

    this.setShowDisabledCards = function (flag) {
        if (flag == true) {
            _this.getStoryPage().addClass("show-disabled-cards");
        } else {
            _this.getStoryPage().removeClass("show-disabled-cards");
        }
    };

    this.isDisabledCard = function (card) {
        return card.hasClass("disabled-card");
    };

    this.isLastElement = function (element) {
        return element.is(":last-child");
    };

    this.isFirstElement = function (element) {
        return element.is(":first-child");
    };

    this.isTargetInputOrTextarea = function (event) {
        var targetNode = event.target.nodeName.toUpperCase();
        return (targetNode == "INPUT" || targetNode == "TEXTAREA") && $(event.target).is(':visible');
    };

    this.isTargetContextMenu = function (event) {
        var target = $(event.target);
        return target.hasClass("context-menu") && target.is(':visible');
    };

    this.isOverlayVisible = function () {
        return $("div.ui-widget-overlay").is(':visible');
    };

    this.makeCardDisabled = function (card) {
        card.addClass("disabled-card");
    };

    this.makeCardEnabled = function (card) {
        card.removeClass("disabled-card");
    };

    this.startEditInputOrTextarea = function (element) {
        var parent = element.parent();
        parent.addClass("edit");
        element.focus();
    };

    this.cancelEditing = function (editingElement) {
        editingElement.parent().removeClass("edit");
    };

    this.__getAllCardEstimationSpans__ = function() {
        return $("div.card > div.card-header td.card-eta span");
    };

    this.__getAllCardContentTds__ = function() {
        return $("div.card > div.card-content td");
    };

    this.__getAllCardTextareas__ = function() {
        return $("div.card > div.card-content textarea");
    };

    this.__getAllCardEstimationInputs__ = function() {
        return $("div.card > div.card-header input.card-eta-input");
    };
};