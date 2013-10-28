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

(function ($, undefined) {

    var DEFAULT_PAPER_SIZES = {
        "A7": {width: 280, height: 397},
        "A6": {width: 397, height: 560},
        "A5": {width: 560, height: 794},
        "A4": {width: 794, height: 1123},
        "A3": {width: 1123, height: 1588},
        "A2": {width: 1588, height: 2245},
        "A1": {width: 2245, height: 3178},
        "A0": {width: 3178, height: 4494}
    };

    $.widget("ct.ctPrintable", {
        options: {
            items: "> *",
            size: {
                paperSize: "A4",
                orientation: "portrait",
                width: 794,
                height: 1123
            },
            padding: {
                top: 10,
                bottom: 15,
                left: 17,
                right: 22
            }
        },
        _pageCount: 0,
        _pageWidth: 0,
        _pageHeight: 0,
        _items: null,
        _create: function () {
            var page = this.element,
                px = "px";
            page.addClass("ct-printable ct-printable-page");
            this._updatePageSize(this.options.size, false);
            page.width(this._pageWidth);
            //page.height(this._pageHeight);
            page.css("padding", "0 " + this.options.padding.right + px + " 0 " + this.options.padding.left + px);
            this.refresh();
        },
        refresh: function () {
            var self = this,
                page = this.element;
            page.find("div.ct-printable-marker").remove();
            this._items = page.find(this.options.items);
            this._items.addClass("ct-printable-item");

            var paddingLeft = this.options.padding.left,
                paddingRight = this.options.padding.right,
                paddingTop = this.options.padding.top,
                paddingBottom = this.options.padding.bottom;

            this._createPageMargin(true, paddingTop).prependTo(page);
            //var pxPerMm = 3.779527559;
            var pageTotalHeight = this._pageHeight,
                pageTotalWidth = this._pageWidth,

                pageAvailableHeight = pageTotalHeight - paddingBottom - paddingTop,
                pageAvailableWidth = pageTotalWidth - paddingLeft - paddingRight,

                lastPageMarker = 0,
                lastMaxItemLeft = 0,
                lastPageWithBreak = 1,
                printOffset = 0;
            this._items.each(function (index, el) {
                var item = $(el),
                    height = item.outerHeight(true),
                    top = item.offset().top + printOffset - parseInt(item.css("margin-top")) | 0,
                    left = item.offset().left - parseInt(item.css("margin-left")) | 0,
                    curPage = (top / pageTotalHeight | 0) + 1,
                    pageBottomMarker = curPage * pageTotalHeight,
                    itemBottomMarker = top + height,
                    pageAvailableBottomMarker = pageBottomMarker - paddingBottom,
                    i;

                for (i = lastPageWithBreak; i < curPage; i++) {
                    self._createPageHeader(i + 1, i * pageTotalHeight - printOffset, paddingLeft)
                        .insertBefore(item);
                }
                lastPageWithBreak = curPage;

                if (itemBottomMarker > pageAvailableBottomMarker &&
                    (height <= pageAvailableHeight || top >= (pageAvailableBottomMarker - pageTotalHeight * 0.05))) {
                    var nextTop = pageBottomMarker + paddingTop,
                        offset = 0;

                    curPage++;

                    if (top < lastPageMarker && lastPageMarker < pageBottomMarker) {
                        offset = pageAvailableBottomMarker - lastPageMarker;
                    } else {
                        offset = pageAvailableBottomMarker - top - 1;
                    }

                    var floatType = lastMaxItemLeft < left && "left" || (lastMaxItemLeft > left && "right"),
                        width = pageAvailableWidth - left;

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

            var lastPage = (lastPageMarker / pageTotalHeight | 0) + 1,
                i;
            for (i = lastPageWithBreak; i < lastPage; i++) {
                page.append(this._createPageHeader(i + 1, i * pageTotalHeight - printOffset, paddingLeft));
            }

            this._pageCount = lastPage;
            this._trigger("refresh", null, {element: this.element, totalPageCount: lastPage});
        },
        _destroy: function () {
            this.element.find("div.ct-printable-marker").remove();
            this.element.find(this.options.items).removeClass("ct-printable-item");
            this.element.removeClass("ct-printable ct-printable-page");
        },
        _updatePageSize: function (size, refresh) {
            var width = this._pageWidth,
                height = this._pageHeight;
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
        _updateItemsSelector: function (selector) {
            this.element.find(this.options.items).removeClass("ct-printable-item");
            this.options.items = selector;
            this.refresh();
        },
        _updatePagePadding: function (padding, refresh) {
            $.extend(this.element.padding, padding);
            if (refresh) {
                this.refresh();
            }
        },
        _setOption: function (key, value) {
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
        _createPageMargin: function (isTop, marginSize, floatType) {
            return $('<div class="ct-printable-marker"></div>')
                .addClass(isTop && "ct-printable-page-margin-top" || "ct-printable-page-margin-bottom")
                .height(marginSize)
                .css("float", floatType);
        },
        _createPageHeader: function (pageNumber, top, pagePaddingLeft) {
            return $('<div class="ct-printable-marker ct-printable-page-header"></div>')
                .offset({top: top})
                .css("margin-left", "-" + pagePaddingLeft + "px")
                .append($('<span></span>').html("&mdash; Page " + pageNumber + " &mdash;"))
        },
        pageCount: function () {
            return this._pageCount;
        },
        pageWidth: function () {
            return this._pageWidth;
        },
        pageHeight: function () {
            return this._pageHeight;
        }
    });
})(jQuery);