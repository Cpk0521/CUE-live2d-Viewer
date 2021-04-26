var l2dviewer;
var charset;
var costset;

"use strict";
Setupcharselecter = ()=>{
    let charselectlist = "<option>Select</option>";
    $.each(charset, function(key,val){
        charselectlist += '<option value="'+val.id+'">'+val.Name+'</option>';
    });
    
    $('select#characterlist').html(charselectlist);

    $('select#characterlist').change((event) => {
        if (event.target.selectedIndex == 0) {
            return;
        }

        let cid = event.target.value;
        // console.log(cid);
        Setupcostselecter(cid);
        // this.Setupcostselecter(cid);
    });
}

Setupcostselecter = (cid)=>{
    let costselectlist = "";
    $.each(costset[String('000'+cid).slice(-3)], function(key,val){
        costselectlist += '<option value="'+val.path+'">'+val.name+'</option>';
        // console.log(key, val);
    });
    $('select#costumelist').html(costselectlist);
}

SetupModelRangeDisplay = (sr, rr, ar)=>{
    $('#scaleRange').val(sr);
    $('#angleRange').val(rr);
    $('#alphaRange').val(ar);

    $("[type=range]").each((index, element )=>{
        $(element).next().text($(element).val());
    });

    $("[type=range]").unbind();

    $('#scaleRange').on("input", (e)=>{
        $(e.target).next().text($(e.target).val());
        l2dviewer.modelOnChangeScale($(e.target).val());
    })

    $('#angleRange').on("input", (e)=>{
        $(e.target).next().text($(e.target).val());
        l2dviewer.modelOnChangeAngle($(e.target).val());
    })

    $('#alphaRange').on("input", (e)=>{
        $(e.target).next().text($(e.target).val());
        l2dviewer.modelOnChangeAlpha($(e.target).val());
    })
}

$(document).ready(() => {

    l2dviewer = new l2DViewer();

    $.getJSON("datalist/CharactorList.json", function(data) {
        charset = data.Charactor;
    }).done(function() {
        // l2dviewer.Setupcharselecter();
        Setupcharselecter();
    });

    $.getJSON("datalist/live2dList_v2.json", function(data) {
        costset = data;
    }).done(function() {
        console.log(costset);
    });

    $('#LoadModelBtn').click(()=>{
        let jsonpath = $('select#costumelist').val();
        if($('select#characterlist option:selected').index() != 0 && jsonpath != ''){
            l2dviewer.LoadModel(jsonpath);
            $('#openMedalBtn').toggle();
            $('#removelive2dModel').toggle();

            $('#ModelName').html($('select#characterlist option:selected').text());

            $('#CostumeName').toggle();
            $('#CostumeName').html("【" + $('select#costumelist option:selected').text() + "】");

            $('#tools').toggle();

            SetupModelRangeDisplay(0.2, 0, 1);
        }
        // console.log("Loading");rangenumber
    });

    $('#removelive2dModel').click(()=>{
        l2dviewer.clearCanvas();
        $('#openMedalBtn').toggle();
        $('#removelive2dModel').toggle();

        $('#ModelName').html("----");
        $('#CostumeName').toggle();

        $('#tools').toggle();
    })

});