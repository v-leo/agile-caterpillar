$(document).ready(function () {
    CardTool.ContextMenu.__initCardsContextMenu__();
    CardTool.ContextMenu.__initHotKeys__();
});

CardTool.ContextMenu = new function () {
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
        if (CardTool.HotKeys && CardTool.Selecting) {
            CardTool.HotKeys.registerHotKey({
                keyCode:93,
                callback:function (event) {
                    var card = CardTool.Selecting.getLastSelectedCard();
                    if (!card.length && !CardTool.Selecting.isLastSelectedCard(CardTool.DomService.getStoryCard())) {
                        var firstSelected = CardTool.Selecting.getSelectedCards().first();
                        if (firstSelected.length) {
                            CardTool.Util.scrollToElement(firstSelected);
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
                condition:CardTool.HotKeys.notInputNotTextareaNotOverlay
            });
            CardTool.HotKeys.registerHotKey({
                keyCode:67,
                shiftKey:true,
                callback:function (event) {
                    var lastSelectedCard = CardTool.Selecting.getLastSelectedCardOrStoryCard();
                    if (lastSelectedCard.length > 0) {
                        _this.showCardColorContextMenu(event, lastSelectedCard);
                    } else {
                        var firstSelected = CardTool.Selecting.getSelectedCards().first();
                        if (firstSelected.length) {
                            CardTool.Util.scrollToElement(firstSelected);
                            _this.showCardColorContextMenu(event, firstSelected);
                        }
                    }
                },
                condition:CardTool.HotKeys.notInputNotTextareaNotOverlay
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
                    if (CardTool.Selecting && CardTool.Selecting.isSelectedCard(cards)) {
                        cards = CardTool.Selecting.getSelectedCards();
                    }
                    return cards;
                }

                var item = ui.item;
                if (item.is(":visible")) {
                    _this.closeCardColorContextMenu();
                    event.preventDefault();
                    event.stopPropagation();
                    var color = getColorByItem(item);
                    CardTool.Core.changeCardColor(getCards(), color, true);
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
                    if (CardTool.Selecting && CardTool.Selecting.isSelectedCard(cards)) {
                        cards = CardTool.Selecting.getSelectedCards();
                    }
                    return cards;
                }

                var item = ui.item;
                if (item.is(":visible")) {
                    _this.closeTaskContextMenu();
                    event.preventDefault();
                    event.stopPropagation();

                    if (item.hasClass("menu-add-new-card")) {
                          CardTool.Core.addNewCard(true);
                    } else if (item.hasClass("menu-add-new-left-card")) {
                        CardTool.Core.addNewCard(true, _this.__getSelectedCardFromMenu__(_this.getTaskCardContextMenu()), true);
                    } else if (item.hasClass("menu-add-new-right-card")) {
                        CardTool.Core.addNewCard(true, _this.__getSelectedCardFromMenu__(_this.getTaskCardContextMenu()), false);
                    } else if (item.hasClass("menu-copy-task-card")) {
                        var selectedCard = _this.__getSelectedCardFromMenu__(_this.getTaskCardContextMenu());
                        CardTool.Core.addNewCard(true, selectedCard, false, selectedCard);
                    } else if (item.hasClass("menu-union-task-card")) {
                        if (CardTool.Selecting) {
                            CardTool.Core.unionCards(getCards());
                        }
                    } else if (item.hasClass("menu-split-task-card")) {
                        CardTool.Core.splitCard(_this.__getSelectedCardFromMenu__(_this.getTaskCardContextMenu()));
                    } else if (item.hasClass("menu-enable-task-card")) {
                        CardTool.Core.enableCards(getCards());
                    } else if (item.hasClass("menu-disable-task-card")) {
                        CardTool.Core.disableCards(getCards());
                    } else if (item.hasClass("menu-show-disabled-task-card")) {
                        CardTool.Core.setShowDisabledCards(true);
                    } else if (item.hasClass("menu-hide-disabled-task-card")) {
                        CardTool.Core.setShowDisabledCards(false);
                    } else if (item.hasClass("menu-remove-task-card")) {
                        CardTool.Core.removeCards(getCards(), event.shiftKey);
                    } else if (item.hasClass("menu-color")) {
                        var color = getColorByItem(item);
                        CardTool.Core.changeCardColor(getCards(), color, true);
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
            if (event.pageX < 780) {
                event.preventDefault();
                event.stopPropagation();
                return false;
            } else {
                return true;
            }
        };

        $("div.task-card").live("mouseup", function (event) {
            if (event.which == 3 && !CardTool.DomService.isTargetInputOrTextarea(event)) {
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