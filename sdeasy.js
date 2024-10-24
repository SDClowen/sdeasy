$(function () {

    const lang = $("html").attr("lang");
    var i18nDTJson = [];

    $.ajax({
        url: `/public/json/${lang.toLowerCase()}.json`,
        dataType: "json",
        async: false,
        success: (data) => {
            i18nDTJson = data;
        }
    })

    var style = document.createElement("style");
    style.append(`
        @keyframes spinner {
            to {
                transform: rotate(360deg);
            }
        }

        .spinner {
            color: transparent !important;
            /*min-height: 50%;*/
            pointer-events: none;
            position: relative;
        }

        .spinner::after {
            animation: spinner .3s linear infinite;
            border-radius: 50%;
            border: 2px solid #ccc;
            border-top-color: var(--bs-primary);
            content: "";
            display: block;
            height: 1rem;
            left: 50%;
            margin-left: -.4rem;
            margin-top: -.4rem;
            position: absolute;
            top: 50%;
            width: 1rem;
            z-index: 1;
        }
    `)

    document.head.appendChild(style)

    window.addEventListener("popstate", function (e) {
        const p = this.window.location.pathname
        //this.window.location.href = p
        const lives = $("[data-url='" + p + "'], [href='" + p + "'][live='true']");
        if (!lives.length) {
            const dummyElement = $("<a style='display:none' live='true' href='" + p + "'></a>");
            $("body").append(dummyElement)
            dummyElement.trigger("click")
            dummyElement.remove()
        }
        else
            lives.trigger("click")

    });

    /**
     * Show active class on the linked tag after which page is viewed
     */
    const applyPathName = function () {
        if (location.pathname) {

            const pathElement = document.querySelector("ul a[href='" + location.pathname + "']")

            const pathElements = document.querySelectorAll("ul li a.active")
            pathElements.forEach(element => {
                element.classList.remove("active");
                element.removeAttribute("onclick");
            })

            if (pathElement) {
                pathElement.classList.add("active")
                //pathElement.attributes["href"] = "#";

                if (pathElement.hasAttribute("onclick"))
                    pathElement.removeAttribute("onclick");

                if (!pathElement.hasAttribute("live"))
                    pathElement.setAttribute("onclick", "return false")
            }
        }
    }

    // When page firstly load, apply the path name to sidebars
    applyPathName();

    /**
     * Show error message with alert lazy:run(); :=)
     */
    function error() {
        alert("There was a problem and the action could not be processed. Please try again later.");
    }

    /**
     * Active spinner animation on the element
     */
    $.fn.spinner = function () {
        this.toggleClass("spinner");
    };

    /**
     * Active spinner animation on the element
     */
    $.fn.resetForm = function () {

        for (let index = 0; index < this.length; index++) {
            const element = this[index];
            element.reset();
        }

        // TODO: FIXX
        // because of the form reset function does not reseting the textares!
    };

    /**
     * Show message on the element
     * @param {*} obj  the json variable
     */
    $.fn.message = function (obj) {
        if (!obj.message)
            return;

        if (!obj.visible)
            return;

        var msg = $(`<div class='alert alert-${obj.type} alert-dismissible' style="display: none" role="alert">${obj.message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`);
        this.append(msg);

        let readingTimeRemaining = (msg.text().length * 60 / 24) * 0.13 * 100 + 2000;

        msg.slideDown().delay(readingTimeRemaining).slideUp("slow", function () { $(this).remove(); });
    }

    /**
     * Go to the specified element in an animated way
     * @param {*} main Is the main element from which the animation will start.
     */
    $.fn.sdscroll = function (main = 'html, body') {
        var position = this.offset().top;
        $(main).animate({
            scrollTop: position
        }, 500, 'linear');
    }

    const parseRedirect = redirectUrl => {
        let index = redirectUrl.lastIndexOf(':');
        if (index === -1 || (redirectUrl.indexOf('://') > -1 && index <= redirectUrl.indexOf('://') + 2)) {
            return {
                url: redirectUrl,
                ms: 0
            };
        }

        return {
            url: redirectUrl.substring(0, index),
            ms: parseInt(redirectUrl.substring(index + 1)) || 0
        };
    };

    $.fn.initDataTable = function (dtData = null, outResult = null) {

        const current = $(this);

        let info = true,
            searching = true,
            paginate = true;

        if (current.attr("dt-info"))
            info = current.attr("dt-info") == "true";

        if (current.attr("dt-search"))
            searching = current.attr("dt-search") == "true";

        if (current.attr("dt-paginate"))
            paginate = current.attr("dt-paginate") == "true";

        let config = {
            //serverSide: true,
            responsive: true,
            autoWidth: false,
            searching: searching,
            processing: false,
            info: info,
            paging: paginate,
            language: i18nDTJson,
        };

        if (current.attr("datatable-enable-exports") == "true") {

            const getExportHeader = current.attr("export-header");
            const getExportFooter = current.attr("export-footer");


            config.dom = 'Blfrtip'
            config.bInfo = false
            config.buttons = [
                {
                    extend: 'copy',
                    messageTop: getExportHeader,
                    messageBottom: getExportFooter,
                },
                {
                    extend: 'excel',
                    messageTop: getExportHeader,
                    messageBottom: getExportFooter,
                    exportOptions: {
                        stripNewLines: false
                    }
                },
                {
                    extend: 'pdf',
                    messageTop: getExportHeader,
                    messageBottom: getExportFooter,
                },
                {
                    extend: 'print',
                    messageTop: getExportHeader,
                    messageBottom: getExportFooter,
                }
            ]
        }

        if (current.attr("datatable-ajax")) {
            config.ajax = {
                method: "post",
                url: current.attr("datatable-ajax"),
                dataType: "json",
                data: dtData,
                async: true,
                beforeSend: function () {
                    // Here, manually add the loading message.
                    current.children("tbody").html(
                        '<tr><td colspan="122" class="spinner p-4"></td></tr>'
                    );
                }
            };
        }

        if (current.attr("datatable-targets")) {
            var columns = current.attr("datatable-targets").split(',');
            if (columns.length > 0) {
                let columnsDefs = []
                columns.forEach(p, i => {
                    var splitData = p.split(':')

                    var targetIndex = splitData[0]
                    var targetType = splitData[1]
                    columnsDefs.push({ 'targets': targetIndex, 'type': targetType })
                })
            }
        }

        if (current.attr("datatable-sum-columns")) {
            var columns = current.attr("datatable-sum-columns").split(',');
            config.footerCallback = function (row, data, start, end, display) {
                var api = this.api(), data;

                // converting to interger to find total
                var intVal = function (i) {
                    return typeof i === 'string' ?
                        i.replace(/[\$,]/g, '') * 1 :
                        typeof i === 'number' ?
                            i : 0;
                };

                $(api.column(0).footer()).html('Toplam');

                columns.forEach(index => {
                    const total = api
                        .column(index)
                        .data()
                        .reduce(function (a, b) {
                            return (intVal(a) + intVal(b)).toFixed(1);
                        }, 0);

                    $(api.column(index).footer()).html(total);
                })
            }

        }

        current.DataTable(config);
    }

    $.fn.initSelect2 = function () {
        const $this = $(this);
        const ajaxUrl = $this.attr("select2-ajax");
        let jsonData = $this.attr("select2-data");
        const template = $this.attr("template");

        let config = {
            theme: "bootstrap-5",
            focus: true,
            dropdownParent: $this.parent(),
            minimumInputLength: -1,
            initialValue: true
        };

        if (jsonData) {
            var array = new Array();
            jsonData = $.parseJSON(jsonData)
            for (const [sKey, data] of Object.entries(jsonData)) {

                const percent = (data.size / data.capacity * 100).toFixed(1);

                array.push({
                    id: data.id,
                    text: data.title,
                    html: `<div class="d-flex justify-content-between">
                        <span>
                            ${data.title}<br>
                            <small class="text-muted">${data.name}</small>
                        </span>
                        <span>
                            <div class="progress border" role="progressbar" aria-label=""
                                aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100">
                                <div class="progress-bar progress-bar-striped progress-bar-animated"
                                    style="width: ${percent}%">
                                    ${percent}%
                                </div>
                            </div>
                            <small class="text-muted d-flex justify-content-between">
                                <span class="ps-1">${(data.size * 1.0).toFixed(1)}</span>
                                <span class="pe-1 ms-3">${(data.capacity * 1.0).toFixed(1)}</span>
                            </small>
                        </span>
                    </div>`
                });
            }

            config.data = array;
            config.escapeMarkup = function (markup) {
                return markup;
            }
            config.templateResult = function (data) {
                return data.html;
            }
            config.templateSelection = function (data) {
                return data.text;
            }
        }

        if (ajaxUrl) {
            config.minimumInputLength = 3;
            config.ajax = {
                delay: 250,
                url: ajaxUrl,
                dataType: 'json',
                type: "post",
                data: function (params) {
                    return {
                        value: params.term, // search term
                    };
                },
                processResults: function (data) {
                    return {
                        results: data.message
                    };
                }
            }
        }

        $this.select2(config)
    }

    const currentDateTime = () => {
        var tzoffset = new Date().getTimezoneOffset() * 60000; //offset in milliseconds
        var localISOString = new Date(Date.now() - tzoffset)
            .toISOString()
            .slice(0, -1);

        // convert to YYYY-MM-DDTHH:MM
        const datetimeInputString = localISOString.substring(
            0,
            ((localISOString.indexOf("T") | 0) + 6) | 0
        );

        return datetimeInputString;
    };

    const currentDate = () => {
        var tzoffset = new Date().getTimezoneOffset() * 60000; //offset in milliseconds
        var localISOString = new Date(Date.now() - tzoffset)
            .toISOString()
            .slice(0, 10);

        console.log(localISOString)
        return localISOString;
    };


    function updateTableIndexes(table) {
        let index = 0;
        let array = $(table + " tr th[scope=row]").toArray();
        array.forEach(row => {
            $(row).html(++index);
        });
    }

    $.fn.autoFillFormElements = function (jsonObj, target) {

        const form = $(this)

        if (!target)
            target = form

        if (!jsonObj)
            return;

        for (const [name, value] of Object.entries(jsonObj)) {
            let item = $('[name="' + name + '"]', form);
            if (!item.length)
                continue;

            if (item.is("select")) {
                const selectNames = target.data("select-name");
                if (selectNames && selectNames.includes(name)) {
                    const selectData = JSON.parse(target.attr(`data-select-${name}`))

                    if (selectData) {
                        item.html("");

                        for (const [sKey, sVal] of Object.entries(selectData)) {

                            const v = Object.values(sVal);
                            item.append(`<option value="${v[0]}">${v[1]}</option>`);
                        }
                    }
                }

                var index = item.find('[value="' + value + '"]');
                index.prop('selected', true);

                item.trigger("change");

                try {
                    item[0].tomselect.sync();
                } catch (error) {

                }
            }
            else if (item.is("input")) {
                var type = item.attr('type');

                switch (type) {
                    case 'checkbox':
                        item.attr('checked', value > 0);
                        break;
                    case 'radio':
                        item.each((element, elementValue) => {

                            if (elementValue.value == value) {
                                elementValue.checked = true;
                                $(elementValue).parent().tab('show');
                            }

                        });
                        break;
                    case 'file':
                        break;
                    default:
                        item.val(value);
                        break;
                }

                item.trigger("change");
            }
            else if (item.attr("tinymce")) {
                var editor = tinymce.get(name);
                if (editor != null) {
                    editor.setContent(value);
                    tinymce.triggerSave();
                }
            }
            else if (item.is("textarea")) {
                item.val(value);
                item.trigger("change");
            }
            else if (item.attr("selectize")) {
                item.selectize()[0].selectize.setValue(value);
            }
            else if (item.attr("select2")) {
                item.val(value).trigger("change");
            }
        }
    };

    $.fn.fillModalLazyData = function (jsonObj, target) {
        const form = $(this)

        const lazyData = form.find("[modal-lazy-data]");
        if (lazyData.length) {
            const totalLength = lazyData.length;

            let ajaxs = [];

            lazyData.each(function () {
                const $this = $(this);

                if (target.data("select-name") == $this.attr("name") &&
                    target.attr("modal-lazy-data")) {
                    $this.attr("modal-lazy-data", target.attr("modal-lazy-data"));
                }

                const lazyUrl = $this.attr("modal-lazy-data");
                ajaxs.push($.ajax({
                    url: lazyUrl,
                    type: "GET",
                    dataType: "html",
                    success: function (ajaxResult) {
                        $this.html(ajaxResult);
                    }
                }));
            });

            $.when.apply(this, ajaxs).done(function () {
                console.log("All ajax done!");
                form.autoFillFormElements(jsonObj, target);
            });
        }
        else
            form.autoFillFormElements(jsonObj, target);
    }

    $.fn.sdajax = function (spinnerObj, onAjaxDone, xhrUrl, xhrData = false, xhrType = "get", xhrDataType = "json") {

        if (spinnerObj)
            spinnerObj.spinner();

        const $this = $(this)

        const content = $($this.data("content"));

        const remove = $this.data("remove");
        let redirect = $this.attr("redirect");

        const dataTableAction = $this.attr("datatable-action");

        const autoUpdate = $this.data("auto-update");
        const autoUpdateType = $this.data("auto-update-type");
        const injectCode = $this.data("run");

        const insertTo = $this.data("insert-to");
        const insertType = $this.data("insert-type");
        const modalDispose = $this.data("dispose-modal");
        let autoScroll = $this.data("scroll");
        if (autoScroll == undefined)
            autoScroll = true;

        let settings = {};
        settings.xhr = function () {
            var xhr = new window.XMLHttpRequest();

            xhr.upload.addEventListener("progress", function (evt) {
                if (!$this[0].hasAttribute("file-upload"))
                    return;

                if (evt.lengthComputable) {
                    var percentComplete = evt.loaded / evt.total;
                    percentComplete = parseInt(percentComplete * 100);

                    $this.find("#upload-result").fadeIn();
                    $this.find("[data-upload-value]").text(percentComplete + "%");
                    $this.find("[data-upload-style-value]").css({
                        width: percentComplete + "%"
                    });

                    if (percentComplete === 100) {
                        $this.find("#upload-result").fadeOut();
                    }

                }
            }, false);

            return xhr;
        }
        settings.async = true;
        settings.type = xhrType;
        settings.url = xhrUrl;
        settings.dataType = xhrDataType;
        settings.data = xhrData;
        settings.processData = false;
        settings.contentType = false;
        settings.success = function (data) {

            if (remove && data.type == "success")
                $(remove).fadeOut("fast", function () { $(this).remove() });

            if (insertTo && data.type == "success" && !autoUpdate) {
                if (!insertType || insertType == "prepend")
                    $(data.message).prependTo(insertTo).fadeIn("slow");
                else
                    $(data.message).appendTo(insertTo).fadeIn("slow");
            }
            else if (content.length && xhrDataType == "html") {
                if (autoScroll)
                    content.sdscroll();

                content.html(data);
            }
            else if (content.length && data.message) {
                if (xhrDataType == "html")
                    content.html(data.message);
                else {
                    content.message(data);

                    if (autoScroll)
                        content.sdscroll(content.parent());
                }
            }

            if (data.type == "success") {

                if (modalDispose)
                    $(modalDispose).modal('hide');

                switch (dataTableAction) {
                    case "add":

                        const addingTable = $($this.attr("datatable")).DataTable();

                        let dataTableJson = data.message;
                        if (dataTableJson.datatable)
                            dataTableJson = dataTableJson.datatable;

                        addingTable.row.add(dataTableJson).draw();

                        break;

                    case "remove":

                        const table = $this.parents('table').DataTable();

                        var tr = $this.parents('tr');
                        if (tr.hasClass("child"))
                            tr = tr.prev();

                        var row = table.row(tr);

                        if (row.child.isShown()) {
                            row.child.hide();

                            tr.removeClass('shown');
                        }

                        row.remove().draw(true);

                        break;

                    case "update":
                        /*
                        const updatingTable = $($("").attr("datatable")).DataTable();
                        datatable.row.update(data.message).draw();*/
                        break;
                }

                // TODO: Extend this code block to app.js
                if (data.message.terminal) {
                    if (data.message.terminal.startsWith("<!--CUSTOM-->")) {
                        if (spinnerObj) spinnerObj.spinner();
                        var printContents = data.message.terminal;
                        var originalContents = document.body.innerHTML;
                        document.body.innerHTML = printContents;
                        window.print();
                        document.body.innerHTML = originalContents;
                    }
                    else
                        window.location.href = data.message.terminal;
                }

                const autoFill = $this.data("auto-fill");
                if (autoFill) {
                    $(autoFill).autoFillFormElements(data.message);
                }

                if (autoUpdate) {
                    const target = $this.data("parent");
                    if (autoUpdateType == "one")
                        $this.data("auto-update", "false");

                    for (const [key, value] of Object.entries(data.message)) {
                        let jsonDomItem = $(`[data-field=${key}]`, target);
                        if (jsonDomItem.length) {
                            const updateType = jsonDomItem.data("update-type");
                            const then = jsonDomItem.data("field-then");
                            if (typeof (then) !== "undefined") {
                                if (data.message[then])
                                    jsonDomItem.show();
                                else
                                    jsonDomItem.hide();
                            }

                            switch (updateType) {
                                case "img":
                                    jsonDomItem.find("img").attr("src", value);
                                    break;
                                case "json":
                                    jsonDomItem.data("json", value);
                                    break;
                                default:
                                    jsonDomItem.html(value);
                                    break;
                            }
                        }
                    }
                }

                if (data.scrollTo)
                    $(window).scrollTop($(data.scrollTo).offset().top);

                if (injectCode)
                    eval(injectCode);

                if (redirect) {
                    redirect = parseRedirect(redirect)
                    setTimeout(function () { window.location.href = redirect.url; }, redirect.ms);
                }
            }

            onAjaxDone?.(data);

            if (data.refresh)
                location.reload();

            if (data.redirect) {

                redirect = parseRedirect(data.redirect)

                setTimeout(function () { window.location.href = redirect.url }, redirect.ms);
            }
        };

        $.ajax(settings)
            .always(function () { if (spinnerObj) spinnerObj.spinner(); })
            .fail(function () { error() });
    }

    /**
     * Operates according to the conditions specified on all elements with the {data-url} tag. lazy:run(); :=)
     */
    $("body").on("click", "[href]", function () {
        if (window.location.pathname == $(this).attr("href"))
            return false;
    })

    $("body").on("click", "[data-url], [live='true']", function () {

        const $this = $(this);
        let actionType = $this.data("action-type");
        if (!actionType)
            actionType = "get";

        let actionDataType = $this.data("type");
        if (!actionDataType)
            actionDataType = "json";


        let spinner = $this.attr("spinner");
        if (typeof (spinner) !== "undefined") {
            if (spinner === "false")
                spinner = null;
            else
                spinner = $(spinner);
        }
        else
            spinner = $this;

        const live = $this.attr("live");
        let url = live ? $this.attr("href") : $this.data("url");
        let countable = $this.data("countable");

        const hasCountable = typeof (countable) !== "undefined";
        let num = 0;
        if (hasCountable) {
            num = parseInt(countable) + 1;
            url = url + "/" + num;
        }

        $this.sdajax(spinner, function (data) {
            if (hasCountable)
                $this.data("countable", num);

            if (live) {
                document.title = data.title;
                window.history.pushState(null, null, url)
                applyPathName()


                var dataContent = $this.data("content");
                if (!dataContent)
                    dataContent = "#content";

                $(dataContent).html(data.content);

                $(`${dataContent} [datatable=true]`).each(function () {

                    const current = $(this);

                    current.initDataTable();
                })

                $(`${dataContent} [select2=true]`).each(function () {

                    const current = $(this);

                    current.initSelect2();
                })
            }

        }, url, false, actionType, actionDataType);

        if($this.attr("block-return") === undefined)
            return false;
    });

    /**
     * Operates with ajax on all form elements lazy:run();
     */
    $("body").on('submit', '[role="form"]', function (event) {
        if (!event.isDefaultPrevented()) {
            event.preventDefault();

            const $this = $(this);
            const method = event.currentTarget.method;
            const action = event.currentTarget.action;
            const contentType = $this.data("type");

            const beforeFunc = $this.attr("before")
            if (beforeFunc)
                eval(beforeFunc);

            let button = null;
            if (event.hasOwnProperty("originalEvent"))
                button = $(event.originalEvent.submitter);
            else
                button = event.handleObj.handler.arguments[1].submitter;

            const afterFunc = $this.attr("after")

            $this.sdajax(button, function (data) {
                if (data.type == "success") {
                    const blockReseting = $this.data("block-reset")
                    if (!blockReseting)
                        $this.resetForm();
                }

                if (afterFunc)
                    eval(afterFunc);

            }, action, new FormData(this)/*$(this).serialize()*/, method, contentType);

            return false;
        }
    });

    /**
     * When the a tag is clicked on the charts, it updates with ajax. lazy:run(); :=)
     */
    $('[sd-chart-ajax] a').on("click", function (event) {
        if (event.isDefaultPrevented())
            return false;

        event.preventDefault();

        var $this = $(this);
        var $parent = $(this).parent();

        if ($this.attr("active"))
            return;

        $parent.find("a").removeClass("active");
        $this.addClass("active");

        var action = $parent.attr("sd-chart-ajax");
        var prefix = $parent.data("prefix");
        var chart = $parent.data("chart");
        var period = $this.attr("sd-chart-period");
        var $update = $(`#${prefix}update`);

        $update.spinner();

        $.ajax({
            type: "post",
            url: action,
            data: { period },
            dataType: "json",
            success: function (data) {
                if (data.type == "success") {
                    $update.text($this.text());

                    $(`#${prefix}result`).text(data.message.result);

                    if (data.message.percent < 0) {
                        $(`#${prefix}percent`).removeClass().addClass("text-danger");
                        $(`#${prefix}percent svg`).html('<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline>');
                    }
                    else if (data.message.percent > 0) {
                        $(`#${prefix}percent`).removeClass().addClass("text-success");
                        $(`#${prefix}percent svg`).html('<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline>');
                    }
                    else {
                        $(`#${prefix}percent`).removeClass().addClass("text-warning");
                        $(`#${prefix}percent svg`).html('<line x1="5" y1="12" x2="19" y2="12"></line>');
                    }

                    $(`#${prefix}percent span`).text(`${data.message.percent}%`);

                    ApexCharts.exec(chart, 'updateOptions', data.message.chart, false, true);
                }
                else
                    error();
            }
        })
            .always(() => {
                $update.spinner();
            });
    });

    /**
     * Auto fill the form inputs in the modal from the json
     */
    $(document).on("show.bs.modal", ".modal", (event) => {

        let target = $(event.relatedTarget);
        const modal = $(event.currentTarget);
        const titleContent = modal.find('.modal-title');
        const title = target.data('title');

        const private = modal.data("private");
        if (private) {
            if (!event.relatedTarget)
                target = $(document.createElement('span'));

            target.data("json", private.message.data)
            target.data("select-name", private.message.selectName)
            target.data("select", private.message.selectData)
            target.data("action", private.message.action)

            const splited = private.message.selectName.split(',');
            splited.forEach(p => {
                const splitedJson = private.message.selectData[p]
                target.attr(`data-select-${p.trim()}`, JSON.stringify(splitedJson))

                console.log(splitedJson)
            });

            modal.removeData("private");
        }

        var trigger = target.data("trigger");
        if (trigger)
            $(trigger).trigger(target.data("trigger-type"));

        var dataRun = target.data("run");
        if (dataRun)
            eval(dataRun)

        if (title)
            titleContent.html(title);


        const dataTableNames = target.attr("datatable-names");
        const dataTableUrls = target.attr("datatable-actions")

        if (dataTableNames && dataTableUrls) {
            const splitted = dataTableNames.split(',');
            const splittedUrls = dataTableUrls.split(',');

            splitted.forEach((dataTableName, i) => {

                const dataTableDom = $(dataTableName);

                dataTableDom.attr("datatable-ajax", splittedUrls[i])

                if (DataTable.isDataTable(dataTableName))
                    dataTableDom.DataTable().destroy();

                dataTableDom.initDataTable();
            })
        }

        const action = target.data("action");
        if (action) {
            const form = modal.find("form");

            const datatableAction = target.attr("datatable-action");
            if (datatableAction)
                form.attr("datatable-action", datatableAction);

            const dataTableName = target.attr("datatable-name");
            if (dataTableName)
                form.attr("datatable", dataTableName);

            // private call from dom elements
            const datatableAjax = target.attr("datatable-ajax");
            if (datatableAjax && dataTableName) {
                const dataTableDom = $(dataTableName);

                dataTableDom.attr("datatable-ajax", action);

                if (DataTable.isDataTable(dataTableName))
                    dataTableDom.DataTable().destroy();

                dataTableDom.initDataTable();
            }

            const targetAutoUpdate = target.data("auto-update");
            if (targetAutoUpdate) {
                const targetParent = target.data("parent");
                form.data("auto-update", targetAutoUpdate);
                form.data("parent", targetParent);
            }

            const selectize = form.find("select[selectize]");
            if (selectize.length)
                selectize.selectize()[0].selectize.setValue(0);

            form.attr("action", action);

            let getJson = target.data("get-json");
            if (getJson) {
                $.ajax({
                    url: getJson,
                    type: "GET",
                    dataType: "json",
                    success: function (data) {
                        form.fillModalLazyData(data, target);
                    }
                });
            }
            else {
                form.fillModalLazyData(target.data("json"), target)
            }
        }
    })

    $(document).on("hidden.bs.modal", ".modal", (event) => {
        const form = $(event.currentTarget).find("form");
        form.resetForm();
        form.find("textarea").val("");
    })

    $("body").on("click", "[submit]", function (event) {
        let data = $($(this).attr("submit"));
        data.trigger('submit', { submitter: $(this) });
    });

    $("input[data-input-toggle]").on("change", function () {
        var value = $(this).data("input-toggle");

        if ($(this).prop("checked"))
            $(value).slideDown("fast");
        else
            $(value).slideUp("fast");
    });

    $("[data-href]").on("click", function () {
        window.location = $(this).data("href");
    });

    $("[data-toggle]").on("change", function () {
        var value = $(this).data("toggle");
        $(value).fadeToggle();
    });

    $("[avatar-selector]").on("change", function () {
        let val = $(this).val();
        console.log(val);
    });

    $("[data-format]").on("change", function () {
        const $this = $(this);
        const dom = $($this.data("format"));
        const dataCurrency = $this.data("currency");
        // Create our number formatter.
        var formatter = new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: dataCurrency,
        });

        const value = formatter.format($this.val());
        dom.html(value.substring(1, value.length));
    });

    $(document).on("change", "[data-fill]", function () {

        const $this = $(this);
        let actionType = $this.data("action-type");
        if (!actionType)
            actionType = "get";

        let actionDataType = $this.data("type");
        if (!actionDataType)
            actionDataType = "json";

        const fillTo = $this.data("fill-to");
        const data = fillTo.split(",");
        const ajaxUrls = $this.data("fill").split(",");

        data.forEach((element, i) => {
            $(element).sdajax($(element), function (data) {
                const obj = $(element);

                if (!obj.attr("select2"))
                    obj.html(data);
                else {
                    obj.attr("select2-data", JSON.stringify(data));
                    obj.initSelect2();
                }

            }, `${ajaxUrls[i]}/${$this.val()}`, false, actionType, actionDataType);
            /*
            $.ajax({
                url: `${ajaxUrls[i]}/${$this.val()}`,
                type: "GET",
                dataType: "html",
                async: true,
                success: function (data) {
                    const obj = $(element);
                    obj.html(data);
                }
            });*/
        });

    });

    $(document).on('select2:open', () => {
        document.querySelector('.select2-search__field').focus();
    });

    function init() {

        // When page firstly load, apply the path name to sidebars
        applyPathName();

        /**
         * Operates according to the conditions specified on all elements with the {lazy-load} tag. lazy:run(); :=)
         */
        $("[lazy-load]").each(function () {

            const $this = $(this);

            let url = $this.attr("lazy-load");
            let actionType = $this.data("action-type");
            let type = $this.data("type");

            if (!type)
                actionType = "json";

            if (!actionType)
                actionType = "get";

            $this.sdajax($this, null, url, false, actionType, type);

            //return false;
        });

        $("[data-trigger = 'true']").each(function () {
            $(this).trigger('click');
        });

        $("[select2]").each(function (element) {

            const current = $(this);

            current.initSelect2();
        });

        $("[datatable=true]").each(function () {

            const current = $(this);

            if (DataTable.isDataTable(current))
                current.DataTable().destroy();

            current.initDataTable();
        });

        $("[current-datetime]").each(function () {
            $(this).val(currentDateTime());
        });

        $("[current-date]").each(function () {
            $(this).val(currentDate());
        });
    }

    init();

    var storedhash = window.location.pathname;
    window.setInterval(function () {
        if (window.location.pathname != storedhash) {
            storedhash = window.location.pathname;
            init();
        }
    }, 100);
});
