(function() {

    //页面注入任务表单
    var newElement = document.createElement('div');
    var html = "<div id=\"secKillForm\">\n" +
        "    <div class=\"logo\">\n" +
        "        新增秒杀\n" +
        "    </div>\n" +
        "    <div class=\"filed\">\n" +
        "        <span class=\"name\">秒杀商品:</span><br/>\n" +
        "        <input type=\"text\" name=\"taskName\" value=\"\" id=\"taskName\" placeholder=\"请输入商品名称\" />\n" +
        "    </div>\n" +
        "    <div class=\"filed\">\n" +
        "        <span class=\"name\">选择器:</span><br/>\n" +
        "        <input type=\"radio\" name=\"selector\" id=\"rb1\" value=\"jQuery\" checked=\"checked\"/>\n" +
        "        <label for=\"rb1\">jQuery</label>\n" +
        "        <input type=\"radio\" name=\"selector\" id=\"rb2\" value=\"xPath\"/>\n" +
        "        <label for=\"rb2\">xPath</label>\n" +
        "    </div>\n" +
        "    <div class=\"filed\">\n" +
        "        <span class=\"name\">选取结果:</span><br/>\n" +
        "        <input type=\"text\" name=\"location\" id=\"location\" value=\"\" placeholder=\"#secKill-btn\"/>\n" +
        "    </div>\n" +
        "    <div class=\"button\" id=\"search\">\n" +
        "        定位(<span class=\"result\" id=\"count\">0</span>)\n" +
        "    </div>\n" +
        "    <div class=\"button\" id=\"reset\">\n" +
        "        重选\n" +
        "    </div>\n" +
        "    <div class=\"filed\">\n" +
        "        <span class=\"name\">秒杀时间:</span><br/>\n" +
        "        <input type=datetime-local value=\"2017-11-11T12:00:00\" step=\"1\" id=\"killTime\" name=\"killTime\">\n" +
        "    </div>\n" +
        "    <div class=\"filed\">\n" +
        "        <span class=\"name\">秒杀频率(ms):</span><br/>\n" +
        "        <input type=\"number\" name=\"frequency\"  id=\"frequency\"value=\"500\" placeholder=\"单位：毫秒（ms）\"/>\n" +
        "    </div>\n" +
        "    <div class=\"filed\">\n" +
        "        <span class=\"name\">秒杀次数:</span><br/>\n" +
        "        <input type=\"number\" name=\"count\" id=\"count\" value=\"10\" placeholder=\"尝试次数\"/>\n" +
        "    </div>\n" +
        "    <div class=\"button\" id=\"add\"> 新增 </div>\n" +
        "    <div class=\"button\" id=\"close\"> 关闭 </div>\n" +
        "</div>";
    newElement.innerHTML = html;
    document.getElementsByTagName("body")[0].appendChild(newElement);

    //设置秒杀名称
    $("#taskName").val("秒杀"+document.title);

    //光标定位元素获取location
    var targetSelected = false;

    //根据光标定位元素
    window.onmouseover = function(e) {
        if(!targetSelected) {
            $(".secKillTarget").removeClass("secKillTarget");
            $(e.target).addClass("secKillTarget");
        }
        $(e.target).click(function (event) {
            if($(this).attr("id") == "reset") {
                $(".secKillTarget").removeClass("secKillTarget");
                $("#secKillForm #location").val("");
                $("#secKillForm #count").text(0);
                targetSelected = false;
                return false;
            }
            if(!targetSelected) {
                targetSelected = true;
                var selector = $("#secKillForm input[name=selector]:checked").val();
                if(selector == "jQuery") {
                    var path = getDomPath(e.target);
                    $("#secKillForm #location").val(path.join(' > '));
                } else {
                    var path = getXPathTo(e.target);
                    $("#secKillForm #location").val(path);
                }
                $("#secKillForm #count").text(1);
                return false;
            }
        });
    };

    //定位元素
    $("#secKillForm #search").click(function () {
        var location = $("#secKillForm #location").val();
        var selector = $("#secKillForm input[name=selector]:checked").val();
        console.log(location);
        if($.trim(location) != ""){
            $(".secKillTarget").removeClass("secKillTarget");
            if(selector == "jQuery") {
                $(location).addClass("secKillTarget");
                $("#secKillForm #count").text($(location).length);
            } else {
                $(getElementsByXPath(location)).addClass("secKillTarget");
                $("#secKillForm #count").text(getElementsByXPath(location).length);
            }
        } else {
            alert("请输入选取结果");
        }
    });

    //关闭任务表单
    $("#secKillForm #close").click(function () {
        $(".secKillTarget").removeClass("secKillTarget");
        $("#secKillForm").remove();
    });

    //新增任务
    $("#secKillForm #add").click(function () {
        var killTask = {};
        var location =  $("#secKillForm #location").val();
        if(location == undefined || $.trim(location) == "") {
            alert("请设定秒杀按钮选择结果");
            return false;
        }
        killTask.url = window.location.href;
        killTask.id = new Date().getTime();
        killTask.name = $("#secKillForm #taskName").val();
        killTask.selector = $("#secKillForm input[name=selector]:checked").val();
        killTask.location = location;
        killTask.killTime = $("#secKillForm #killTime").val();
        killTask.frequency = $("#secKillForm #frequency").val();
        killTask.count = $("#secKillForm #count").val();
        killTask.status = 0;
        var db = new Dexie("secKill");
        db.version(1).stores({ task: 'id,name,url,selector,location,killTime,frequency,count,status'});
        db.task.put(killTask);
        alert("新增成功！");
    });
})();

/**
 * 根据点击元素 获取Jquery path
 * @param el
 * @returns {Array.<*>}
 */
function getDomPath(el) {
    var stack = [];
    while ( el.parentNode != null ) {
        console.log(el.nodeName);
        var sibCount = 0;
        var sibIndex = 0;
        for ( var i = 0; i < el.parentNode.childNodes.length; i++ ) {
            var sib = el.parentNode.childNodes[i];
            if ( sib.nodeName == el.nodeName ) {
                if ( sib === el ) {
                    sibIndex = sibCount;
                }
                sibCount++;
            }
        }
        if ( el.hasAttribute('id') && el.id != '' ) {
            stack.unshift(el.nodeName.toLowerCase() + '#' + el.id);
        } else if ( sibCount > 1 ) {
            stack.unshift(el.nodeName.toLowerCase() + ':eq(' + sibIndex + ')');
        } else {
            stack.unshift(el.nodeName.toLowerCase());
        }
        el = el.parentNode;
    }

    return stack.slice(1);
}

/**
 * 根据点击元素 获取 xPath
 * @param element
 * @returns {string}
 */
function getXPathTo(element) {
    if (element.id!=='')
        return 'id("'+element.id+'")';
    if (element===document.body)
        return element.tagName;

    var ix= 0;
    var siblings= element.parentNode.childNodes;
    for (var i= 0; i<siblings.length; i++) {
        var sibling= siblings[i];
        if (sibling===element)
            return getXPathTo(element.parentNode)+'/'+element.tagName+'['+(ix+1)+']';
        if (sibling.nodeType===1 && sibling.tagName===element.tagName)
            ix++;
    }
}

/**
 * 根据xPath查询节点
 * @param STR_XPATH
 * @returns {Array}
 */
function getElementsByXPath(STR_XPATH) {
    var xresult = document.evaluate(STR_XPATH, document, null, XPathResult.ANY_TYPE, null);
    var xnodes = [];
    var xres;
    while (xres = xresult.iterateNext()) {
        xnodes.push(xres);
    }
    return xnodes;
}

