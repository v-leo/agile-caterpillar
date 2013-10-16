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
var Caterpillar = Caterpillar || {};

Caterpillar.WikiConverter = new function () {
    var _this = this;

    //Need for tests
    this.__setThis__ = function (t) {
        _this = t;
    };

    var WIKI_LIST_TYPE = {
        NUMERIC:"#",
        DISC:"*",
        SQUARE:"-"
    };

    this.__replaceWikiElementsForHtml__ = function (wiki) {
        if (wiki) {
            var result = Caterpillar.Util.escapeHtmlTags(wiki).replace(/'''''(.+?)'''''/g, "<strong><em>$1</em></strong>")
                .replace(/(^|\s)\*(([^\s].*?[^\s])|([^\s]))\*(\s|$)/g, "$1<strong>$2</strong>$5")
                .replace(/'''(.+?)'''/g, "<strong>$1</strong>")
                .replace(/''(.+?)''/g, "<em>$1</em>")
                .replace(/--(([^\s].*?[^\s])|([^\s]))--/g, "<del>$1</del>")
                .replace(/(^|\s)\+(([^\s].*?[^\s])|([^\s]))\+(\s|$)/g, "$1<ins>$2</ins>$5")
                .replace(/\{\{(.+?)\}\}/g, "<code>$1</code>")
                .replace(/\{color:(([a-zA-Z]+)|(#[a-fA-F0-9]{6}))\}(.*?)\{color\}/g, '<span style="color: $1; ">$4</span>');

            if (Caterpillar.Settings.bagTrackerIssueUrl && Caterpillar.Settings.bagTrackerIssueUrl.length > 0) {
                result = result.replace(/(^|\s+)([A-Z]+-[0-9]+)(\s+|$)/g, '$1<a class="issue-link" target="_blank" href="' + Caterpillar.Settings.bagTrackerIssueUrl + '$2" title="Issue $2">$2</a>$3')
            }

            return result;
        } else {
            return wiki;
        }
    };

    this.__replaceWikiElementsForText__ = function (wiki) {
        if (wiki) {
            return wiki.replace(/'''''(.+?)'''''/g, "$1")
                .replace(/(^|\s)\*(([^\s].*?[^\s])|([^\s]))\*(\s|$)/g, "$1$2$5")
                .replace(/'''(.+?)'''/g, "$1")
                .replace(/''(.+?)''/g, "$1")
                .replace(/--(([^\s].*?[^\s])|([^\s]))--/g, "$1")
                .replace(/(^|\s)\+(([^\s].*?[^\s])|([^\s]))\+(\s|$)/g, "$1$2$5")
                .replace(/\{\{(.+?)\}\}/g, "$1")
                .replace(/\{color:(([a-zA-Z]+)|(#[a-fA-F0-9]{6}))\}(.*?)\{color\}/g, '$4');
        } else {
            return wiki;
        }
    };

    this.__wikiToHtmlConfig__ = {
        emptyString:' ',
        paragraphPrefix:'<p>',
        paragraphSuffix:'</p>',
        tabPrefix:'<div class="wiki-tab">',
        tabSuffix:'</div>',
        getListPrefix:function (listType, level, itemIndex, itemsCount) {
            var result = "";
            if (itemIndex == 0) {
                if (listType == WIKI_LIST_TYPE.NUMERIC) {
                    if (itemsCount > 1) {
                        result = '<ol class="wiki-list ' + (level > 1 ? 'alphabetic-list' : 'numeric-list') + '">';
                    } else {
                        result = '<ul class="wiki-list circle-list">';
                    }
                } else if (listType == WIKI_LIST_TYPE.DISC) {
                    result = '<ul class="wiki-list disc-list">';
                } else if (listType == WIKI_LIST_TYPE.SQUARE) {
                    result = '<ul class="wiki-list square-list">';
                }
            } else if (itemIndex > 0) {
                result = "<li>";
                if (listType == WIKI_LIST_TYPE.NUMERIC && itemsCount > 1) {
                    result = result + '<div class="ol-list-container">';
                } else {
                    result = result + '<div class="ul-list-container">';
                }
            }
            return result;
        },
        getListSuffix:function (listType, level, itemIndex, itemsCount) {
            var result = "";
            if (itemIndex == 0) {
                if (listType == WIKI_LIST_TYPE.NUMERIC && itemsCount > 1) {
                    result = "</ol>";
                } else {
                    result = "</ul>";
                }
            } else if (itemIndex > 0) {
                result = "</div></li>";
            }
            return result;
        },
        replaceWikiElements:_this.__replaceWikiElementsForHtml__
    };


    this.__wikiToTextConfig__ = {
        emptyString:"",
        paragraphPrefix:"",
        paragraphSuffix:"\n",
        tabPrefix:"    ",
        tabSuffix:"",
        getListPrefix:function (listType, level, itemIndex) {
            var result = "";
            for (var i = 1; i < level; i++) {
                result = result + "    ";
            }
            if (listType == WIKI_LIST_TYPE.NUMERIC) {
                if (level == 1) {
                    result = result + itemIndex + ". ";
                } else {
                    result = result + String.fromCharCode(64 + itemIndex).toLowerCase() + ". ";
                }
            } else if (listType == WIKI_LIST_TYPE.DISC) {
                result = result + String.fromCharCode(64 + itemIndex).toLowerCase() + ") ";
            } else {
                result = result + "-  ";
            }
            return result;
        },
        getListSuffix:function () {
            return "";
        },
        replaceWikiElements:_this.__replaceWikiElementsForText__
    };

    this.wikiToHtml = function (wikiString) {
        var wikiModel = _this.__parseWikiString__(wikiString);
        return _this.__convertWikiNode__(wikiModel, _this.__wikiToHtmlConfig__);
    };

    this.wikiToText = function (wikiString) {
        var wikiModel = _this.__parseWikiString__(wikiString);
        return _this.__convertWikiNode__(wikiModel, _this.__wikiToTextConfig__);
    };

    /*this.__convertWiki__ = function (wikiString, config) {
     var htmlString = "";
     if (wikiString && wikiString.trim().length > 0) {
     var lines = wikiString.replace(/\s+$/g, "").split(/\n/g);
     var paramsStack = [
     {
     lineStart:"",
     tabsCount:0,
     endTag:"",
     listType:"",
     listItemIndex:0,
     level:0
     }
     ];
     for (var i = 0; i < lines.length; i++) {
     htmlString = htmlString + _this.__convertWikiLine__(lines[i], paramsStack, config);
     }
     var tabsCount = paramsStack[0].tabsCount;
     var closingTagsCount = paramsStack.length - 1;
     var j;
     for (j = 0; j < closingTagsCount; j++) {
     htmlString = htmlString + paramsStack.shift().endTag;
     }
     for (j = 0; j < tabsCount; j++) {
     htmlString = htmlString + config.tabSuffix;
     }
     }
     return htmlString;
     };*/

    /*this.__convertWikiLine__ = function (line, stack, config) {
     var resultLine = "";
     var content = line;
     var prevValues = stack[0];

     var tabs = /^>+/.exec(content);
     var curTabsCount = (tabs && tabs.length > 0) ? tabs[0].length : 0;
     content = content.substr(curTabsCount);

     var j;
     if (curTabsCount != prevValues.tabsCount) {
     for (j = 0; j < prevValues.level; j++) {
     resultLine = resultLine + stack.shift().endTag;
     }
     if (curTabsCount > prevValues.tabsCount) {
     for (j = 0; j < (curTabsCount - prevValues.tabsCount); j++) {
     resultLine = resultLine + config.tabPrefix;
     }
     } else {
     for (j = 0; j < (prevValues.tabsCount - curTabsCount); j++) {
     resultLine = resultLine + config.tabSuffix;
     }
     }

     prevValues = stack[0];
     }

     var offset = prevValues.level;
     var newListType = "";
     var curLevel = 0;

     if (/^[#\*\-]/.test(content)) {
     var prevStart = prevValues.lineStart;
     curLevel = prevValues.level;
     var prevLevel = prevValues.level;
     if (prevStart && prevLevel > 0) {
     var curStart = content.substr(0, prevLevel);
     if (curStart == prevStart) {
     newListType = content.substr(prevLevel, 1);
     if (newListType == WIKI_LIST_TYPE.NUMERIC || newListType == WIKI_LIST_TYPE.DISC || newListType == WIKI_LIST_TYPE.SQUARE) {
     curLevel = prevLevel + 1;
     } else {
     newListType = "";
     }
     offset = 0;
     } else {
     curStart = curStart.replace(/[^#\*\-]+/g, "");
     curLevel = curStart.length;
     if (curLevel == prevLevel || prevStart.substr(0, curLevel) != curStart) {
     var prevStartArr = prevStart.split('');
     var curStartArr = curStart.split('');
     for (var i = 0; i < curStartArr.length; i++) {
     if (curStartArr[i] != prevStartArr[i]) {
     newListType = curStartArr[i];
     curLevel = i + 1;
     offset = prevLevel - i;
     break;
     }
     }
     } else {
     offset = prevLevel - curLevel;
     }
     }
     } else {
     newListType = content.substr(0, 1);
     curLevel = 1;
     }

     content = content.substr(curLevel);
     }

     if (offset > 0) {
     for (j = 0; j < offset; j++) {
     resultLine = resultLine + stack.shift().endTag;
     }
     }

     var listTagStart = "";
     var listTagEnd = "";
     if (newListType) {
     listTagStart = config.getListPrefix(newListType, curLevel, 1);
     listTagEnd = config.getListSuffix(newListType, curLevel, 1);

     stack.unshift({
     lineStart:stack[0].lineStart + newListType,
     tabsCount:curTabsCount,
     endTag:listTagEnd,
     listType:newListType,
     listItemIndex:1,
     level:stack[0].level + 1
     });
     } else if (stack.length > 1) {
     prevValues = stack[0];
     prevValues.listItemIndex = prevValues.listItemIndex + 1;
     listTagStart = config.getListPrefix(prevValues.listType, prevValues.level, prevValues.listItemIndex);
     } else {
     stack[0].tabsCount = curTabsCount;
     }

     content = config.replaceWikiElements(content);
     resultLine = resultLine + listTagStart + config.paragraphPrefix + (content ? content : " ") + config.paragraphSuffix;

     return resultLine;
     };*/

    this.__convertWikiLine__ = function (line, curNode) {
        var content = line;

        var tabs = /^>+/.exec(content);
        var curTabsCount = (tabs && tabs.length > 0) ? tabs[0].length : 0;
        content = content.substr(curTabsCount);

        var j;
        if (curTabsCount != curNode.tabsCount) {
            if (curTabsCount > curNode.tabsCount) {
                for (j = curNode.tabsCount; j < curTabsCount; j++) {
                    var tab = {
                        parent:curNode,
                        lineStart:"",
                        tabsCount:j + 1,
                        nodeType:"tab",
                        listLevel:0,
                        children:[]
                    };
                    curNode.children.push(tab);
                    curNode = tab;
                }
            } else {
                while (curNode.parent && curNode.parent.tabsCount >= curTabsCount) {
                    curNode = curNode.parent;
                }
            }
        }

        var newListType = "";
        var curLevel = 0;

        if (/^[#\*\-]/.test(content)) {
            var prevStart = curNode.lineStart;
            curLevel = curNode.listLevel;
            var prevLevel = curNode.listLevel;
            if (prevStart && prevLevel > 0) {
                var curStart = content.substr(0, prevLevel);
                if (curStart == prevStart) {
                    newListType = content.substr(prevLevel, 1);
                    if (newListType == WIKI_LIST_TYPE.NUMERIC || newListType == WIKI_LIST_TYPE.DISC || newListType == WIKI_LIST_TYPE.SQUARE) {
                        curLevel = prevLevel + 1;
                    } else {
                        newListType = "";
                    }
                } else {
                    curStart = curStart.replace(/^([#\*\-]+)[^#\*\-].*/g, "$1");
                    curLevel = curStart.length;
                    if (curLevel == prevLevel || prevStart.substr(0, curLevel) != curStart) {
                        var prevStartArr = prevStart.split('');
                        var curStartArr = curStart.split('');
                        for (var i = 0; i < curStartArr.length; i++) {
                            if (curStartArr[i] != prevStartArr[i]) {
                                newListType = curStartArr[i];
                                curLevel = i + 1;
                                break;
                            }
                        }
                    }
                }
            } else {
                newListType = content.substr(0, 1);
                curLevel = 1;
            }

            content = content.substr(curLevel);
        }

        while (curLevel < curNode.listLevel) {
            curNode = curNode.parent;
        }

        if (newListType) {
            while (curLevel - 1 < curNode.listLevel) {
                curNode = curNode.parent;
            }

            var list = {
                parent:curNode,
                tabsCount:curNode.tabsCount,
                nodeType:"list",
                listType:newListType,
                listItemIndex:0,
                listLevel:curNode.listLevel + 1,
                children:[]
            };

            curNode.children.push(list);

            var firstItem = {
                parent:list,
                lineStart:curNode.lineStart + newListType,
                tabsCount:list.tabsCount,
                nodeType:list.nodeType,
                listType:list.listType,
                listItemIndex:1,
                listLevel:list.listLevel,
                children:[]
            };

            list.children.push(firstItem);
            curNode = firstItem;
        } else if (curNode.listItemIndex) {
            var nextItem = {
                parent:curNode.parent,
                lineStart:curNode.lineStart,
                tabsCount:curNode.tabsCount,
                nodeType:curNode.nodeType,
                listType:curNode.listType,
                listItemIndex:curNode.listItemIndex + 1,
                listLevel:curNode.listLevel,
                children:[]
            };

            curNode.parent.children.push(nextItem);
            curNode = nextItem;
        }

        var text = {
            content:content,
            nodeType:"text"
        };

        curNode.children.push(text);

        return curNode;
    };

    this.__parseWikiString__ = function (wikiString) {
        var root;
        if (wikiString && wikiString.trim().length > 0) {
            root = {
                lineStart:"",
                tabsCount:0,
                nodeType:"root",
                listLevel:0,
                children:[]
            };

            var lines = wikiString.replace(/\s+$/g, "").split(/\n/g);
            var nextNode = root;
            for (var i = 0; i < lines.length; i++) {
                nextNode = _this.__convertWikiLine__(lines[i], nextNode);
            }
        }
        return root;
    };

    this.__convertWikiNode__ = function (wikiNode, config) {
        if (!wikiNode) {
            return config.paragraphPrefix + config.emptyString + config.paragraphSuffix;
        } else if (wikiNode.nodeType == "text") {
            return config.paragraphPrefix + (config.replaceWikiElements(wikiNode.content) || " ") + config.paragraphSuffix;
        } else if (wikiNode.nodeType == "tab") {
            return config.tabPrefix + convertWikiNodes(wikiNode.children, config) + config.tabSuffix;
        } else if (wikiNode.nodeType == "list") {
            var itemsCount = wikiNode.listItemIndex > 0 ? wikiNode.parent.children.length : wikiNode.children.length;
            var prefix = config.getListPrefix(wikiNode.listType, wikiNode.listLevel, wikiNode.listItemIndex, itemsCount);
            var suffix = config.getListSuffix(wikiNode.listType, wikiNode.listLevel, wikiNode.listItemIndex, itemsCount);
            return prefix + convertWikiNodes(wikiNode.children, config) + suffix;
        } else if (wikiNode.nodeType == "root") {
            return convertWikiNodes(wikiNode.children, config);
        }
    };

    function convertWikiNodes(wikiNodes, config) {
        var result = "";
        for (var i = 0; i < wikiNodes.length; i++) {
            result = result + _this.__convertWikiNode__(wikiNodes[i], config);
        }
        return result;
    }
};
