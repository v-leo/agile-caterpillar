(function ($, undefined) {

    var DEFAULT_PAPER_SIZES = {
        "A7":{width:280, height:397},
        "A6":{width:397, height:560},
        "A5":{width:560, height:794},
        "A4":{width:794, height:1123},
        "A3":{width:1123, height:1588},
        "A2":{width:1588, height:2245},
        "A1":{width:2245, height:3178},
        "A0":{width:3178, height:4494}
    };

    $.widget("ct.printable", {
        options:{
            items:"> *",
            size:{
                paperSize:"A4",
                orientation:"portrait",
                width:794,
                height:1123
            },
            padding:{
                top:10,
                bottom:15,
                left:17,
                right:22
            }
        },
        _pageCount:0,
        _pageWidth:0,
        _pageHeight:0,
        _items:null,
        _create:function () {
            var page = this.element;
            page.addClass("ct-printable ct-printable-page");
            this._updatePageSize(this.options.size, false);
            page.width(this._pageWidth);
            page.height(this._pageHeight);
            var px = "px";
            page.css("padding", "0 " + this.options.padding.right + px + " 0 " + this.options.padding.left + px);
            this.refresh();
        },
        refresh:function () {
            var self = this;
            var page = this.element;
            page.find("div.ct-printable-marker").remove();
            this._items = page.find(this.options.items);
            this._items.addClass("ct-printable-item");

            var paddingLeft = this.options.padding.left;
            var paddingRight = this.options.padding.right;
            var paddingTop = this.options.padding.top;
            var paddingBottom = this.options.padding.bottom;

            this._createPageMargin(true, paddingTop).prependTo(page);
            //var pxPerMm = 3.779527559;
            var pageTotalHeight = this._pageHeight;
            var pageTotalWidth = this._pageWidth;

            var pageAvailableHeight = pageTotalHeight - paddingBottom - paddingTop;
            var pageAvailableWidth = pageTotalWidth - paddingLeft - paddingRight;

            var lastPageMarker = 0;
            var lastMaxItemLeft = 0;
            var lastPageWithBreak = 1;
            var printOffset = 0;
            this._items.each(function (index, el) {
                var item = $(el);
                var height = item.outerHeight(true);
                var top = item.offset().top + printOffset - parseInt(item.css("margin-top")) | 0;
                var left = item.offset().left - parseInt(item.css("margin-left")) | 0;
                var curPage = (top / pageTotalHeight | 0) + 1;
                var pageBottomMarker = curPage * pageTotalHeight;
                var itemBottomMarker = top + height;
                var pageAvailableBottomMarker = pageBottomMarker - paddingBottom;

                for (var i = lastPageWithBreak; i < curPage; i++) {
                    self._createPageHeader(i + 1, i * pageTotalHeight - printOffset, paddingLeft)
                        .insertBefore(item);
                }
                lastPageWithBreak = curPage;

                if (itemBottomMarker > pageAvailableBottomMarker &&
                    (height <= pageAvailableHeight || top >= (pageAvailableBottomMarker - pageTotalHeight * 0.05))) {
                    var nextTop = pageBottomMarker + paddingTop;
                    curPage++;

                    var offset = 0;
                    if (top < lastPageMarker && lastPageMarker < pageBottomMarker) {
                        offset = pageAvailableBottomMarker - lastPageMarker;
                    } else {
                        offset = pageAvailableBottomMarker - top - 1;
                    }

                    var floatType = lastMaxItemLeft < left && "left" || (lastMaxItemLeft > left && "right");
                    var width = pageAvailableWidth - left;

                    if (offset > 0) {
                        var offsetEl = $('<div class="ct-printable-marker ct-printable-offset"></div>')
                            .height(offset)
                            .css("float", floatType)
                            .insertBefore(item);
                        if (lastPageMarker > pageBottomMarker) {
                            offsetEl.width(width);
                        } else {
                            offsetEl.width(pageAvailableWidth).addClass("ct-printable-print-offset");
                            printOffset = printOffset + offset;
                        }
                    }

                    self._createPageMargin(false, paddingBottom, floatType)
                        .width(lastPageMarker > pageAvailableBottomMarker && width || pageAvailableWidth)
                        .insertBefore(item);

                    self._createPageMargin(true, paddingTop, floatType)
                        .width(lastPageMarker > pageBottomMarker && width || pageAvailableWidth)
                        .insertBefore(item);

                    self._createPageHeader(curPage, pageBottomMarker - printOffset, paddingLeft)
                        .insertBefore(item);

                    itemBottomMarker = height + nextTop;
                    lastPageWithBreak = curPage;
                }

                if (itemBottomMarker >= lastPageMarker) {
                    lastPageMarker = itemBottomMarker;
                    lastMaxItemLeft = left;
                }
            });

            var lastPage = (lastPageMarker / pageTotalHeight | 0) + 1;
            for (var i = lastPageWithBreak; i < lastPage; i++) {
                page.append(this._createPageHeader(i + 1, i * pageTotalHeight - printOffset, paddingLeft));
            }

            this._pageCount = lastPage;
            this._trigger("refresh", null, [this.element, lastPage]);
        },
        _destroy:function () {
            this.element.find("div.ct-printable-marker").remove();
            this.element.find(this.options.items).removeClass("ct-printable-item");
            this.element.removeClass("ct-printable ct-printable-page");
        },
        _updatePageSize:function (size, refresh) {
            var width = this._pageWidth;
            var height = this._pageHeight;
            if (size) {
                if (size.hasOwnProperty("paperSize")) {
                    var defaultSize = DEFAULT_PAPER_SIZES[size.paperSize.toUpperCase()] || defaultSize;
                    width = defaultSize.width;
                    height = defaultSize.height;
                    if ((size.hasOwnProperty("orientation") && size.orientation === "landscape")
                        || this.options.size.orientation === "landscape") {
                        width = defaultSize.height;
                        height = defaultSize.width;
                    }
                } else {
                    width = size.hasOwnProperty("width") && size.width || width;
                    height = size.hasOwnProperty("height") && size.height || height;
                }
                $.extend(this.options.size, size);
            } else {
                this.options.size = DEFAULT_PAPER_SIZES.A4;
                width = DEFAULT_PAPER_SIZES.A4.width;
                height = DEFAULT_PAPER_SIZES.A4.height;
            }
            this._pageWidth = width;
            this._pageHeight = height;
            if (refresh) {
                this.refresh();
            }
        },
        _updateItemsSelector:function (selector) {
            this.element.find(this.options.items).removeClass("ct-printable-item");
            this.options.items = selector;
            this.refresh();
        },
        _updatePagePadding:function (padding, refresh) {
            $.extend(this.element.padding, padding);
            if (refresh) {
                this.refresh();
            }
        },
        _setOption:function (key, value) {
            if (value === undefined) {
                return this.options[key];
            }
            switch (key) {
                case "size":
                    this._updatePageSize(value, true);
                    break;
                case "items":
                    this._updateItemsSelector(value);
                    break;
                case "padding":
                    this._updatePagePadding(value, true);
                    break;
                default:
                    this._super("_setOption", key, value);
            }
        },
        _createPageMargin:function (isTop, marginSize, floatType) {
            return $('<div class="ct-printable-marker"></div>')
                .addClass(isTop && "ct-printable-page-margin-top" || "ct-printable-page-margin-bottom")
                .height(marginSize)
                .css("float", floatType);
        },
        _createPageHeader:function (pageNumber, top, pagePaddingLeft) {
            return $('<div class="ct-printable-marker ct-printable-page-header"></div>')
                .offset({top:top})
                .css("margin-left", "-" + pagePaddingLeft + "px")
                .append($('<span></span>').html("&mdash; Page " + pageNumber + " &mdash;"))
        },
        pageCount:function () {
            return this._pageCount;
        },
        pageWidth:function () {
            return this._pageWidth;
        },
        pageHeight:function () {
            return this._pageHeight;
        }
    });
})(jQuery);

CardTool.Core = new function () {
    var _this = this;

    //Need for tests
    this.__setThis__ = function (t) {
        _this = t;
    };

    this.MIN_CARD_WIDTH = 366;
    this.MAX_CARD_WIDTH = 746;

    this.addNewCard = function (updateStorageFlag, position, beforeFlag, template) {
        var cardTemplate;
        if (template) {
            cardTemplate = template.clone();
            var color = template.data("card-color");
            if (color) {
                cardTemplate.data("card-color", color);
            }
        } else {
            cardTemplate = CardTool.DomService.getTaskCardTemplate().clone();
            cardTemplate.removeAttr("id");
        }

        if (CardTool.Selecting) {
            CardTool.Selecting.unSelectCards(cardTemplate);
            CardTool.Selecting.unSelectLastSelectedCard(cardTemplate);
        }

        if (position && position.length > 0) {
            if (beforeFlag) {
                position.before(cardTemplate);
            } else {
                position.after(cardTemplate);
            }
            _this.updateTaskIndexes();
        } else {
            var taskIndex = CardTool.DomService.getAllCardsNoCondition().length + 1;
            CardTool.DomService.getTasksContainer().append(cardTemplate);
            _this.updateTaskIndex(lastStoryId, cardTemplate, taskIndex);
            //noinspection JSValidateTypes
            $(window).scrollTop($(document).height());
        }
        CardTool.DomService.getStoryPage().printable("refresh");

        _this.initTaskToolbar(cardTemplate);
        _this.makeCardResizable(cardTemplate);

        if (updateStorageFlag) {
            CardTool.Storage.updateLocalStorage(_this.currentStoryToJson());
        }
        return cardTemplate;
    };

    this.addNewCardIfStoryIdValid = function (prependFlag) {
        if (CardTool.Util.isValidStoryId(CardTool.DomService.getStoryIdValueInput().val())) {
            var updateEstimation = CardTool.DomService.getAllCardsNoCondition().length == 0;
            var card;
            if (prependFlag == true) {
                card = _this.addNewCard(true, _this.getFirstCard(), true);
            } else {
                card = _this.addNewCard(true);
            }
            if (CardTool.Selecting) {
                CardTool.Selecting.setLastSelectedCard(card);
            }
            if (updateEstimation) {
                //noinspection JSCheckFunctionSignatures
                _this.updateTotalEstimation();
            }
        } else {
            CardTool.Util.alertWarn(MESSAGE_NULL_STORY_ID, TITLE_NULL_STORY_ID, startEditStoryId);
        }
    };

    this.updateTaskIndexes = function () {
        CardTool.DomService.getAllCardsNoCondition().each(function (index, cardElement) {
            _this.updateTaskIndex(lastStoryId, $(cardElement), index + 1);
        });
    };

    this.updateTaskIndex = function (storyId, card, index) {
        var span = CardTool.DomService.getCardIdSpan(card);
        span.html(storyId + " [" + index + "]");
    };

    this.disableCards = function (cards) {
        if (cards.length > 0) {
            CardTool.DomService.makeCardDisabled(cards);
            if (!CardTool.DomService.isShowDisabledCards()) {
                _this.updateHiddenEndingCardsDiv();
                if (CardTool.Selecting) {
                    CardTool.Selecting.setLastSelectedCardAfterRemoveOrHide(cards);
                }
                CardTool.DomService.getStoryPage().printable("refresh");
            }
            _this.updateStoryInfoVisibility();
            //noinspection JSCheckFunctionSignatures
            _this.updateTotalEstimation();
            CardTool.Storage.updateLocalStorage(_this.currentStoryToJson());
        }
    };

    this.changeCardColor = function (cards, color, updateStorage) {
        if (cards.length > 0) {
            cards.removeClass("card-color-red card-color-yellow card-color-green card-color-blue card-color-purple");
            cards.removeData("card-color");
            switch (color) {
                case "red":
                    cards.addClass("card-color-red");
                    cards.data("card-color", "red");
                    break;
                case "yellow":
                    cards.addClass("card-color-yellow");
                    cards.data("card-color", "yellow");
                    break;
                case "green":
                    cards.addClass("card-color-green");
                    cards.data("card-color", "green");
                    break;
                case "blue":
                    cards.addClass("card-color-blue");
                    cards.data("card-color", "blue");
                    break;
                case "purple":
                    cards.addClass("card-color-purple");
                    cards.data("card-color", "purple");
                    break;
            }
            if (updateStorage === true) {
                CardTool.Storage.updateLocalStorage(_this.currentStoryToJson());
            }
        }
    };

    this.enableCards = function (cards) {
        if (cards.length > 0) {
            CardTool.DomService.makeCardEnabled(cards);
            if (!CardTool.DomService.isShowDisabledCards()) {
                _this.updateHiddenEndingCardsDiv();
                CardTool.DomService.getStoryPage().printable("refresh");
            }
            _this.updateStoryInfoVisibility();
            //noinspection JSCheckFunctionSignatures
            _this.updateTotalEstimation();
            CardTool.Storage.updateLocalStorage(_this.currentStoryToJson());
        }
    };

    this.removeCards = function (cards, withoutConfirmation) {
        if (cards.length > 0 && !CardTool.DomService.isStoryCard(cards)) {
            if (withoutConfirmation == true) {
                if (CardTool.Selecting) {
                    CardTool.Selecting.setLastSelectedCardAfterRemoveOrHide(cards);
                }

                cards.each(function (index, el) {
                    $(el).remove();
                });
                _this.updateHiddenEndingCardsDiv();
                _this.updateStoryInfoVisibility();
                //noinspection JSCheckFunctionSignatures
                _this.updateTotalEstimation();
                _this.updateTaskIndexes();
                CardTool.DomService.getStoryPage().printable("refresh");
                CardTool.Storage.updateLocalStorage(_this.currentStoryToJson());
            } else {
                CardTool.Util.confirm(MESSAGE_REMOVE_TASKS_ON_DELETE, TITLE_REMOVE_TASKS_ON_DELETE,
                    _this.removeCards, [cards, true]);
            }
        }
    };

    this.updateCard = function (card, cardJson) {
        var isStory = CardTool.DomService.isStoryCard(card);
        if (isStory == true) {
            CardTool.DomService.getCardIdSpan(card).html(cardJson.id);
            CardTool.DomService.getStoryIdInput().val(cardJson.id);
            CardTool.DomService.getStoryIdValueInput().val(cardJson.id);
        }

        CardTool.DomService.getCardEtaSpan(card).html(CardTool.Util.estimationToString(cardJson.eta));
        var etaVal = CardTool.Util.parseEstimation(cardJson.eta);
        etaVal = etaVal != null ? etaVal : "";
        CardTool.DomService.getCardEtaInput(card).val(etaVal);
        CardTool.DomService.getCardEtaValueInput(card).val(etaVal);

        var div = CardTool.DomService.getCardContentDiv(card);
        var description = cardJson.description;
        if (!description) {
            if (isStory == true) {
                if (CardTool.Util.isValidStoryId(cardJson.id) || !CardTool.HotKeys) {
                    description = "Story description";
                } else {
                    description = "Press Shift+O to open or create story";
                }
            } else {
                description = "Task description";
            }
        }
        div.html(CardTool.Util.descriptionToHtml(description));
        if (cardJson.width) {
            var cardWidth = Math.min(Math.max(cardJson.width, _this.MIN_CARD_WIDTH), _this.MAX_CARD_WIDTH);
            CardTool.DomService.getCardUiDiv(card).width(cardWidth);
        }
        _this.changeCardColor(card, cardJson.type, false);
        _this.autoFitDescription(card);
        CardTool.DomService.getCardDescriptionTextarea(card).val(description);
        CardTool.DomService.getCardDescriptionValueInput(card).val(description);
    };

    this.updateTotalEstimation = function (notResetStoryEta) {
        var disabledTotalEta = 0;
        var enabledTotalEta = 0;
        var disabledCount = 0;
        var enabledCount = 0;
        var disabledSpikeExist = false;
        var enabledSpikeExist = false;
        var cards = CardTool.DomService.getAllCardsNoCondition();

        if (cards.length == 0) {
            CardTool.DomService.showStoryEstimation();
        } else {
            if (!CardTool.DomService.isShownTotalEstimation() && !CardTool.DomService.isShownEnabledEstimation()) {
                CardTool.DomService.showEnabledEstimation();
            }
        }

        if (cards.length > 0 || notResetStoryEta != true) {
            cards.each(function (index, el) {
                var card = $(el);
                var disabled = CardTool.DomService.isDisabledCard(card);
                var eta = CardTool.Util.parseEstimation(CardTool.DomService.getCardEtaValueInput(card).val());
                if (disabled) {
                    if (eta == null) {
                        disabledSpikeExist = true;
                    } else {
                        disabledTotalEta = disabledTotalEta + eta;
                    }
                    disabledCount++;
                } else {
                    if (eta == null) {
                        enabledSpikeExist = true;
                    } else {
                        enabledTotalEta = enabledTotalEta + eta;
                    }
                    enabledCount++;
                }
            });

            var totalEta = disabledTotalEta + enabledTotalEta;
            var storyCard = CardTool.DomService.getStoryCard();
            CardTool.DomService.getCardEtaValueInput(storyCard).val(totalEta);
            CardTool.DomService.getCardEtaInput(storyCard).val(totalEta);
            CardTool.DomService.getStoryStoryEtaSpan().html(CardTool.Util.estimationToString(0));
        }

        var disabledSpanText = "" + disabledTotalEta;
        var enabledSpanText = "" + enabledTotalEta;
        var totalSpanText = "" + totalEta;
        if (enabledSpikeExist || disabledSpikeExist) {
            totalSpanText = totalSpanText + "+";
        }
        if (enabledSpikeExist) {
            enabledSpanText = enabledSpanText + "+";
        }
        if (disabledSpikeExist) {
            disabledSpanText = disabledSpanText + "+";
        }
        totalSpanText = totalSpanText + " " + CardTool.Util.ETA_MEASURE;
        disabledSpanText = disabledSpanText + " " + CardTool.Util.ETA_MEASURE;
        enabledSpanText = enabledSpanText + " " + CardTool.Util.ETA_MEASURE;

        CardTool.DomService.getDisabledInfoSpan().html(disabledCount + " (" + disabledSpanText + ")");
        CardTool.DomService.getEnabledInfoSpan().html(enabledCount + " (" + enabledSpanText + ")");
        CardTool.DomService.getTotalInfoSpan().html(disabledCount + enabledCount + " (" + totalSpanText + ")");
        CardTool.DomService.getStoryTotalEtaSpan().html(totalSpanText);
        CardTool.DomService.getStoryEnabledEtaSpan().html(enabledSpanText);
    };

    this.splitCard = function (cardToSplit) {
        if (cardToSplit.length > 0) {
            var description = CardTool.DomService.getCardDescriptionValueInput(cardToSplit).val();
            var tasks = CardTool.Util.parseStringToJsonStory(description, false, false, false).tasks;
            if (tasks && tasks.length > 1) {
                var disabled = CardTool.DomService.isDisabledCard(cardToSplit);
                var color = cardToSplit.data("card-color");
                var etaToSplit = CardTool.Util.parseEstimation(CardTool.DomService.getCardEtaValueInput(cardToSplit).val());
                etaToSplit = etaToSplit ? etaToSplit : 0;
                var mod = etaToSplit % tasks.length;
                var nat = Math.floor(etaToSplit / tasks.length);
                var lastAdded;
                for (var i = tasks.length - 1; i >= 0; i--) {
                    var task = tasks[i];
                    lastAdded = _this.createNewTaskCard(
                        {eta:nat + ((mod - i) > 0 ? 1 : 0), description:task.description, disabled:disabled, type:color}, cardToSplit);
                }
                _this.removeCards(cardToSplit, true);
                CardTool.Util.scrollToElement(lastAdded);
            } else {
                CardTool.Util.alertInfo("There is nothing to split.", "Split task");
            }
        }
    };

    this.unionCards = function (cards) {
        if (cards.length > 1) {
            var newDescription = "";
            var newEstimation = 0;
            var enabled = false;
            cards.each(function (index, el) {
                var card = $(el);
                newEstimation = CardTool.Util.addEstimation(newEstimation, CardTool.DomService.getCardEtaValueInput(card).val());
                newDescription = newDescription + "\n" + CardTool.DomService.getCardDescriptionValueInput(card).val().replace(/(\s+\n)|(\s+$)/g, "");
                enabled = enabled || !CardTool.DomService.isDisabledCard(card);
            });
            var color = cards.first().data("card-color");
            newDescription = newDescription.substr(1);
            var card = _this.createNewTaskCard({eta:newEstimation, description:newDescription, disabled:!enabled, type:color}, cards.first());
            _this.removeCards(cards, true);
            if (CardTool.Selecting) {
                CardTool.Selecting.setLastSelectedCard(card);
            }
            CardTool.Util.scrollToElement(card);
        }
    };

    this.createNewTaskCard = function (cardJson, pos) {
        var cardTemplate = _this.addNewCard(false, pos);
        if (cardJson.disabled) {
            CardTool.DomService.makeCardDisabled(cardTemplate);
        }
        _this.updateCard(cardTemplate, cardJson);
        return cardTemplate;
    };


    this.makeCardResizable = function (card) {
        CardTool.DomService.getCardUiDiv(card).resizable({
            handles:"e",
            stop:function (event, ui) {
                var card = ui.element;
                _this.autoFitDescription(card);
                CardTool.DomService.getStoryPage().printable("refresh");
                CardTool.Storage.updateLocalStorage(_this.currentStoryToJson());
            }
        });
    };

    this.initTaskToolbar = function (card) {
        var buttonSet = CardTool.DomService.getCardToolbarButtonSet(card);
        CardTool.DomService.getAddNewToRightButton(buttonSet).button(
            {label:"New",
                icons:{
                    secondary:"ui-icon-triangle-1-e"
                }
            }
        ).click(function () {
                _this.addNewCard(true, CardTool.DomService.getCardByChild($(this)), false);
            });

        CardTool.DomService.getAddNewToLeftButton(buttonSet).button(
            {label:"New",
                icons:{
                    primary:"ui-icon-triangle-1-w"
                }
            }
        ).click(function () {
                _this.addNewCard(true, CardTool.DomService.getCardByChild($(this)), true);
            });

        CardTool.DomService.getDisableTaskButton(buttonSet).button(
            {label:"Disable",
                icons:{
                    primary:"ui-icon-cancel"
                }
            }).click(function () {
                _this.disableCards(CardTool.DomService.getCardByChild($(this)));
            });

        CardTool.DomService.getEnableTaskButton(buttonSet).button(
            {label:"Enable",
                icons:{
                    primary:"ui-icon-plus"
                }
            }).click(function () {
                _this.enableCards(CardTool.DomService.getCardByChild($(this)));
            });

        CardTool.DomService.getRemoveTaskButton(buttonSet).button(
            {label:"Remove",
                icons:{
                    primary:"ui-icon-trash"
                }
            }).click(function (event) {
                _this.removeCards(CardTool.DomService.getCardByChild($(this)), event.shiftKey);
            });

        CardTool.DomService.getColorButton(buttonSet).button(
            {label:"Color",
                icons:{
                    primary:"ui-icon-tag"
                }
            }).click(function (event) {
                CardTool.ContextMenu.showCardColorContextMenu(event, CardTool.DomService.getCardByChild($(this)));
            });

        buttonSet.buttonset();
    };

    this.currentStoryToJson = function () {
        var story;
        var storyId = CardTool.DomService.getStoryIdValueInput().val();
        var issueId = CardTool.Util.getIssueIdFromStoryId(storyId);
        if (storyId && CardTool.Util.isNotEmptyIssueId(issueId)) {
            story = _this.cardToJson(CardTool.DomService.getStoryCard());
            story.id = storyId;

            var tasks = [];
            CardTool.DomService.getAllCardsNoCondition().each(function (index, card) {
                tasks.push(_this.cardToJson($(card)));
            });
            story.tasks = tasks;
        }
        return story;
    };

    this.cardToJson = function (card) {
        var cardJson = {};
        cardJson.eta = CardTool.Util.parseEstimation(CardTool.DomService.getCardEtaValueInput(card).val());
        cardJson.description = CardTool.DomService.getCardDescriptionValueInput(card).val();
        if (CardTool.DomService.isDisabledCard(card)) {
            cardJson.disabled = true;
        }
        var color = card.data("card-color");
        if (color) {
            cardJson.type = color;
        }
        var width = CardTool.DomService.getCardUiDiv(card).width();
        if (width > _this.MIN_CARD_WIDTH) {
            cardJson.width = Math.min(width, _this.MAX_CARD_WIDTH);
        }
        return cardJson;
    };

    this.getNextCard = function (card) {
        return __getNextCard__(card);
    };

    this.getPrevCard = function (card) {
        return __getNextCard__(card, true);
    };

    function __getNextCard__(card, reverse) {
        var next = reverse && card.prev() || card.next();
        if (next.length && !next.hasClass("card-item")) {
            return __getNextCard__(next, reverse);
        } else if (!CardTool.DomService.isShowDisabledCards()) {
            if (next.length && CardTool.DomService.isDisabledCard(next)) {
                return __getNextCard__(next, reverse);
            }
        }
        return next;
    }

    this.getAllCards = function () {
        if (CardTool.DomService.isShowDisabledCards()) {
            return CardTool.DomService.getAllCardsNoCondition();
        } else {
            return CardTool.DomService.filterOutDisabledCards(CardTool.DomService.getAllCardsNoCondition());
        }
    };


    this.getNextAllCards = function (card) {
        return __getNextAllCards__(card);
    };

    this.getPrevAllCards = function (card) {
        return __getNextAllCards__(card, true);
    };


    function __getNextAllCards__(card, reverse) {
        var selector = "li.card-item";
        if (CardTool.DomService.isShowDisabledCards()) {
            return reverse && card.prevAll(selector) || card.nextAll(selector);
        } else {
            return CardTool.DomService.filterOutDisabledCards((reverse && card.prevAll(selector) || card.nextAll(selector)));
        }
    }

    this.getLastCard = function () {
        var lastCard = CardTool.DomService.getLastCardNoCondition();
        if (CardTool.DomService.isDisabledCard(lastCard) && !CardTool.DomService.isShowDisabledCards()) {
            lastCard = _this.getPrevCard(lastCard);
        }
        return lastCard;
    };


    this.getFirstCard = function () {
        var firstCard = CardTool.DomService.getFirstCardNoCondition();
        if (CardTool.DomService.isDisabledCard(firstCard) && !CardTool.DomService.isShowDisabledCards()) {
            firstCard = _this.getNextCard(firstCard);
        }
        return firstCard;
    };

    this.isLastCard = function (card) {
        return card[0] == CardTool.Core.getLastCard()[0];
    };

    this.isFirstCard = function (card) {
        return card[0] == CardTool.Core.getFirstCard()[0];
    };

    this.removeAllTaskCards = function () {
        CardTool.DomService.getAllCardsNoCondition().remove();
    };

    this.updateStoryInfoVisibility = function () {
        var disabledCardsCount = CardTool.DomService.getDisabledCards().length;
        if (disabledCardsCount > 0) {
            CardTool.DomService.getStoryInfoTr().show();
        } else {
            CardTool.DomService.getStoryInfoTr().hide();
        }
    };

    this.setShowDisabledCards = function (flag) {
        var isShowDisabled = CardTool.DomService.isShowDisabledCards();
        if (flag != isShowDisabled) {
            if (CardTool.Selecting) {
                var disabledCards = CardTool.DomService.getDisabledCards();
                CardTool.Selecting.unSelectLastSelectedCard(disabledCards);
                CardTool.Selecting.unSelectCards(disabledCards);
            }
            CardTool.DomService.setShowDisabledCards(!isShowDisabled);
            _this.updateHiddenEndingCardsDiv();
            if (isShowDisabled) {
                CardTool.DomService.getStoryPage().printable("option", "items", "li.card-item:not(.disabled-card),div.story-item");
            } else {
                CardTool.DomService.getStoryPage().printable("option", "items", "li.card-item,div.story-item");
            }
            if (flag) {
                _this.autoFitDescription(CardTool.DomService.getDisabledCards());
            }
        }
    };

    this.updateHiddenEndingCardsDiv = function () {
        var lastCard = CardTool.DomService.getLastCardNoCondition();
        var div = CardTool.DomService.getHiddenEndingCardsDiv();
        if (CardTool.DomService.isDisabledCard(lastCard) && !CardTool.DomService.isShowDisabledCards()) {
            div.show();
        } else {
            div.hide();
        }
    };

    this.autoFitDescription = function (cards) {
        cards.each(function (index, el ){
            var card = $(el);
            var contentTd = CardTool.DomService.getCardContentTd(card);
            var isStory = CardTool.DomService.isStoryCard(card);
            var fontSize = isStory && 20 || 16;
            var maxHeight = isStory && 190 || 205;
            contentTd.css("font-size", fontSize + "pt");
            while (fontSize >= 9 && contentTd.height() > maxHeight) {
                fontSize = fontSize - 1;
                contentTd.css("font-size", fontSize + "pt");
            }
        });
    };

    this.restoreStoryFromStorage = function (storyId) {
        if (storyId) {
            CardTool.Storage.updateLastStoryId(storyId);
        } else if (window.localStorage && window.localStorage.cardToolLastIssueId) {
            CardTool.Storage.updateLastStoryId(window.localStorage.cardToolLastIssueId);
        }

        CardTool.Core.removeAllTaskCards();
        var storyCard = CardTool.DomService.getStoryCard();
        CardTool.Core.updateCard(storyCard, {id:lastStoryId, eta:0, description:"", width:CardTool.Core.MIN_CARD_WIDTH, type:"default"});

        var isNew = false;
        var tasks;
        var story = CardTool.Storage.getStoryFromStorage(lastStoryId);
        if (story) {
            tasks = story.tasks;
            CardTool.Core.updateCard(storyCard, story);
        } else if (CardTool.Util.isValidStoryId(lastStoryId)) {
            var projectId = CardTool.Util.getProjectIdFromStoryId(lastStoryId);
            tasks = CardTool.Storage.getDefaultTasks(projectId);
            isNew = true;
        }

        if (tasks && tasks.length > 0) {
            var spikeExist = false;
            for (var i = 0; i < tasks.length; i++) {
                var task = tasks[i];
                if (task) {
                    CardTool.Core.createNewTaskCard(task);
                    if (CardTool.Util.parseEstimation(task.eta) == null) {
                        spikeExist = true;
                    }
                }
            }
        }

        CardTool.Core.updateHiddenEndingCardsDiv();
        CardTool.Core.updateStoryInfoVisibility();
        CardTool.Core.updateTotalEstimation(true);
        if (isNew == true) {
            CardTool.Storage.updateLocalStorage(_this.currentStoryToJson());
        }
        //noinspection JSValidateTypes
        $(window).scrollTop(0);
    };
};
