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

Caterpillar.Storage = new function () {
    var _this = this;

    //Need for tests
    this.__setThis__ = function (t) {
        _this = t;
    };

    var storageItemPrefix = "cardStorage";
    var settingsKey = "Caterpillar.Settings";

    this.saveOrUpdateStory = function (story) {
        if (window.localStorage && story && story.id) {
            window.localStorage[storageItemPrefix + story.id] = JSON.stringify(story);
        }
    };

    this.getStoredSettings = function () {
        if (window.localStorage) {
            var settings = window.localStorage[settingsKey];
            if (settings) {
                return JSON.parse(window.localStorage[settingsKey]);
            }
        }
    };

    this.getStoryFromStorage = function (storyId) {
        var story;
        if (window.localStorage && storyId && storyId.length > 0) {
            storyId = storyId.toUpperCase();
            var issueId = Caterpillar.Util.getIssueIdFromStoryId(storyId);
            if (issueId && Caterpillar.Util.isNotEmptyIssueId(issueId)) {
                var cardsStr = window.localStorage[storageItemPrefix + storyId];
                if (cardsStr) {
                    story = JSON.parse(cardsStr);

                    //convert old format
                    var save = false;
                    if (story.hasOwnProperty("type")) {
                        story.color = story.type;
                        delete story.type;
                        save = true;
                    }
                    var tasks = story.tasks;
                    if (tasks && tasks.length > 0) {
                        for (var i = 0; i < tasks.length; i++) {
                            var task = tasks[i];
                            if (task.hasOwnProperty("type")) {
                                task.color = task.type;
                                delete task.type;
                                save = true;
                            }
                        }
                    }
                    if (save) {
                        window.localStorage[storageItemPrefix + storyId] = JSON.stringify(story);
                    }
                }
            }
        }
        return story;
    };

    this.getAllStoriesFromStorage = function () {
        var stories = [];
        if (window.localStorage) {
            var pos = storageItemPrefix.length;
            for (var key in window.localStorage) {
                //noinspection JSUnfilteredForInLoop
                if (key.substr(0, pos) == storageItemPrefix) {
                    //noinspection JSUnfilteredForInLoop
                    var storyId = key.substr(pos);
                    var story = _this.getStoryFromStorage(storyId);
                    if (story) {
                        stories.push(story);
                    }
                }
            }
        }
        if (stories.length > 1) {
            stories.sort(function (story1, story2) {
                if (story1.id > story2.id) {
                    return 1;
                } else if (story1.id < story2.id) {
                    return -1;
                } else {
                    return 0;
                }
            });
        }
        return stories;
    };

    this.deleteStoryFromStorage = function (storyId) {
        if (window.localStorage) {
            delete window.localStorage[storageItemPrefix + storyId];
        }
    };

    this.getLastStoryId = function () {
        if (window.localStorage) {
            return window.localStorage.agileCaterpillarLastStoryId;
        }
    };

    this.updateLastStoryId = function (storyId) {
        if (window.localStorage) {
            window.localStorage.agileCaterpillarLastStoryId = storyId;
        }
    };

};