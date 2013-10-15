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


$(document).ready(function () {
    Caterpillar.ContextMenu.__initCardsContextMenu__();
    Caterpillar.ContextMenu.__initHotKeys__();
});

Caterpillar.ContextMenu = new function () {
    var _this = this;

    //Need for tests
    this.__setThis__ = function (t) {
        _this = t;
    };

    this.getTaskCardContextMenu = function () {
        return $("#taskCardMenu");
    };

    this.getCardColorContextMenu = function () {
        return $("#cardColorMenu");
    };

    var SELECTED_CARD_KEY = "selected-card";

    this.__setSelectedCardToMenu__ = function (menu, card) {
        menu.data(SELECTED_CARD_KEY, card);
    };

    this.__getSelectedCardFromMenu__ = function (menu) {
        return menu.data(SELECTED_CARD_KEY);
    };

    this.__initHotKeys__ = function () {
        if (Caterpillar.HotKeys && Caterpillar.Selecting) {
            Caterpillar.HotKeys.registerHotKey({
                keyCode:93,
                callback:function (event) {
                    var card = Caterpillar.Selecting.getLastSelectedCard();
                    if (!card.length && !Caterpillar.Selecting.isLastSelectedCard(Caterpillar.DomService.getStoryCard())) {
                        var firstSelected = Caterpillar.Selecting.getSelectedCards().first();
                        if (firstSelected.length) {
                            Caterpillar.Util.scrollToElement(firstSelected);
                            card = firstSelected;
                        }
                    }

                    if (card.length > 0) {
                        _this.__setSelectedCardToMenu__(_this.getTaskCardContextMenu(), card);
                        var y = card.position().top + 50;
                        var x = card.position().left + 30;
                        _this.showTaskContextMenu(event, x, y);
                    }
                },
                condition:Caterpillar.HotKeys.notInputNotTextareaNotOverlay
            });
            Caterpillar.HotKeys.registerHotKey({
                keyCode:67,
                shiftKey:true,
                callback:function (event) {
                    var lastSelectedCard = Caterpillar.Selecting.getLastSelectedCardOrStoryCard();
                    if (lastSelectedCard.length > 0) {
                        _this.showCardColorContextMenu(event, lastSelectedCard);
                    } else {
                        var firstSelected = Caterpillar.Selecting.getSelectedCards().first();
                        if (firstSelected.length) {
                            Caterpillar.Util.scrollToElement(firstSelected);
                            _this.showCardColorContextMenu(event, firstSelected);
                        }
                    }
                },
                condition:Caterpillar.HotKeys.notInputNotTextareaNotOverlay
            });
        }
    };

    this.__initCardsContextMenu__ = function () {
        function getColorByItem(item) {
            var color = "";
            if (item.hasClass("menu-card-color-red")) {
                color = "red";
            } else if (item.hasClass("menu-card-color-yellow")) {
                color = "yellow";
            } else if (item.hasClass("menu-card-color-green")) {
                color = "green";
            } else if (item.hasClass("menu-card-color-blue")) {
                color = "blue";
            } else if (item.hasClass("menu-card-color-purple")) {
                color = "purple";
            }
            return color;
        }

        _this.getCardColorContextMenu().menu({
            select:function (event, ui) {
                function getCards() {
                    var cards = _this.__getSelectedCardFromMenu__(_this.getCardColorContextMenu());
                    if (Caterpillar.Selecting && Caterpillar.Selecting.isSelectedCard(cards)) {
                        cards = Caterpillar.Selecting.getSelectedCards();
                    }
                    return cards;
                }

                var item = ui.item;
                if (item.is(":visible")) {
                    _this.closeCardColorContextMenu();
                    event.preventDefault();
                    event.stopPropagation();
                    var color = getColorByItem(item);
                    Caterpillar.Core.changeCardColor(getCards(), color, true);
                }
            }
        });

        _this.getCardColorContextMenu().keydown(function (event) {
            if (event.which == 27 && _this.getCardColorContextMenu().is(":visible")) {
                _this.closeCardColorContextMenu();
                event.preventDefault();
                event.stopPropagation();
            }
        }).blur(function () {
                _this.closeCardColorContextMenu();
            });

        _this.getTaskCardContextMenu().menu({
            focus:function (event, ui) {
                var item = ui.item;
                if (item.is(":visible")) {
                    if (item.hasClass("menu-separator")) {
                        if (event.which == 38) {
                            event.preventDefault();
                            _this.getTaskCardContextMenu().menu("previous");
                        } else {
                            event.preventDefault();
                            _this.getTaskCardContextMenu().menu("next");
                        }
                    }
                }
            },
            select:function (event, ui) {
                function getCards() {
                    var cards = _this.__getSelectedCardFromMenu__(_this.getTaskCardContextMenu());
                    if (Caterpillar.Selecting && Caterpillar.Selecting.isSelectedCard(cards)) {
                        cards = Caterpillar.Selecting.getSelectedCards();
                    }
                    return cards;
                }

                var item = ui.item;
                if (item.is(":visible")) {
                    _this.closeTaskContextMenu();
                    event.preventDefault();
                    event.stopPropagation();

                    if (item.hasClass("menu-add-new-card")) {
                          Caterpillar.Core.addNewCard(true);
                    } else if (item.hasClass("menu-add-new-left-card")) {
                        Caterpillar.Core.addNewCard(true, _this.__getSelectedCardFromMenu__(_this.getTaskCardContextMenu()), true);
                    } else if (item.hasClass("menu-add-new-right-card")) {
                        Caterpillar.Core.addNewCard(true, _this.__getSelectedCardFromMenu__(_this.getTaskCardContextMenu()), false);
                    } else if (item.hasClass("menu-copy-task-card")) {
                        var selectedCard = _this.__getSelectedCardFromMenu__(_this.getTaskCardContextMenu());
                        var newCard = Caterpillar.Core.addNewCard(false, selectedCard, false);
                        Caterpillar.Core.updateCard(newCard, Caterpillar.Core.cardToJson(selectedCard));
                        if (Caterpillar.Storage) {
                            Caterpillar.Storage.saveOrUpdateStory(Caterpillar.Core.currentStoryToJson());
                        }
                    } else if (item.hasClass("menu-union-task-card")) {
                        if (Caterpillar.Selecting) {
                            Caterpillar.Core.unionCards(getCards());
                        }
                    } else if (item.hasClass("menu-split-task-card")) {
                        Caterpillar.Core.splitCard(_this.__getSelectedCardFromMenu__(_this.getTaskCardContextMenu()));
                    } else if (item.hasClass("menu-enable-task-card")) {
                        Caterpillar.Core.enableCards(getCards());
                    } else if (item.hasClass("menu-disable-task-card")) {
                        Caterpillar.Core.disableCards(getCards());
                    } else if (item.hasClass("menu-show-disabled-task-card")) {
                        Caterpillar.Core.setShowDisabledCards(true);
                    } else if (item.hasClass("menu-hide-disabled-task-card")) {
                        Caterpillar.Core.setShowDisabledCards(false);
                    } else if (item.hasClass("menu-remove-task-card")) {
                        Caterpillar.Core.removeCards(getCards(), event.shiftKey);
                    } else if (item.hasClass("menu-color")) {
                        var color = getColorByItem(item);
                        Caterpillar.Core.changeCardColor(getCards(), color, true);
                    }
                }
            }
        });

        _this.getTaskCardContextMenu().keydown(function (event) {
            if (event.which == 27 && _this.getTaskCardContextMenu().is(":visible")) {
                _this.closeTaskContextMenu();
                event.preventDefault();
                event.stopPropagation();
            }
        }).blur(function () {
                _this.closeTaskContextMenu();
            });

        window.oncontextmenu = function (event) {
            if (event.pageX < 780 && !Caterpillar.DomService.isTargetInputOrTextarea(event)) {
                event.preventDefault();
                event.stopPropagation();
                return false;
            } else {
                return true;
            }
        };

        $("div.task-card").live("mouseup", function (event) {
            if (event.which == 3 && !Caterpillar.DomService.isTargetInputOrTextarea(event)) {
                _this.__setSelectedCardToMenu__(_this.getTaskCardContextMenu(), $(this).parent());
                _this.showTaskContextMenu(event, event.pageX, event.pageY);
            }
        });

        _this.getTaskCardContextMenu().find("a").click(function () {
            _this.getTaskCardContextMenu().menu("select");
            return false;
        });
    };

    this.showTaskContextMenu = function (event, x, y) {
        _this.closeCardColorContextMenu();
        var menu = _this.getTaskCardContextMenu();
        menu.css("top", y + "px");
        menu.css("left", x + "px");
        menu.show().focus();
        menu.menu("focus", event, menu.find(">li:first-child"));
    };

    this.showCardColorContextMenu = function (event, card) {
        _this.closeTaskContextMenu();
        var menu = _this.getCardColorContextMenu();
        _this.__setSelectedCardToMenu__(menu, card);
        var y = card.position().top + 99;
        var x = card.position().left + 97;
        menu.css("top", y + "px");
        menu.css("left", x + "px");
        menu.show().focus();
        menu.menu("blur");
    };

    this.closeTaskContextMenu = function () {
        //_this.__setSelectedCardToMenu__(_this.getTaskCardContextMenu(), null);
        _this.getTaskCardContextMenu().hide();
    };

    this.closeCardColorContextMenu = function () {
        //_this.__setSelectedCardToMenu__(_this.getCardColorContextMenu(), null);
        _this.getCardColorContextMenu().hide();
    };
};