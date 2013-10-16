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
$(document).ready(function () {
    if (Caterpillar.Storage) {
        var storedSettings = Caterpillar.Storage.getStoredSettings();
        if (storedSettings) {

        }
    }
});


Caterpillar.Settings = new function () {
    this.defaultProjectId = "CT";
    this.defaultIssueId = "0000";

    this.etaMeasure = "PEH"; //Perfect estimation hour
    this.spike = "Spike";

    this.defaultStoryTemplates = {
        "CT": {
            type: "green",
            tasks: [
                {eta: 0, description: "Acceptance tests"}
            ]
        }};

    this.bagTrackerIssueUrl = "https://github.com/v-leo/agile-caterpillar/issues/";

    this.getDefaultStory = function (projectId) {
        return Caterpillar.Settings.defaultStoryTemplates[projectId];
    };

};
