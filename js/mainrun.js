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
        Setupcostselecter(cid);
    });
}

Setupcostselecter = (cid)=>{
    let costselectlist = "";
    $.each(costset[String('000'+cid).slice(-3)], function(key,val){
        costselectlist += '<option value="'+val.path+'">'+val.name+'</option>';
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

setupMotionsList = (datalist)=>{   
    $('#MotionsTools>.card-body').empty();
    $.each(datalist, (group, list)=>{
        let grouptitle = document.createElement("span");
        grouptitle.className = "d-flex py-1 my-1 border-bottom border-top";
        grouptitle.innerHTML = "\"" + group + "\"";
        $('#MotionsTools>.card-body').append(grouptitle);
        $.each(list, (index, file)=>{

            let motionbtn = document.createElement("button");
            motionbtn.className = "btn btn-info w-100 my-2 text-white";
            let name = file['File'].replace('.motion3.json', "")
            motionbtn.innerHTML = name ;
            motionbtn.addEventListener("click", ()=>{
                console.log(file['File']);
                l2dviewer.modelStartMotions(group, index);
            })
            
            $('#MotionsTools>.card-body').append(motionbtn);
        })
    })
}


$(document).ready(() => {

    l2dviewer = new l2DViewer($("#viewer"));

    $.getJSON("datalist/CharactorList.json", function(data) {
        charset = data.Charactor;
    }).done(function() {
        Setupcharselecter();
    });

    $.getJSON("datalist/live2dList_v2.json", function(data) {
        costset = data;
    }).done(function() {
        // console.log(costset);
    });

    $('#LoadModelBtn').click(()=>{
        let jsonpath = $('select#costumelist').val();
        if($('select#characterlist option:selected').index() != 0 && jsonpath != ''){
            l2dviewer.LoadModel(jsonpath);
            $('#openMedalBtn').toggle();
            $('#removelive2dModel').toggle();

            $('#ModelName').html($('select#characterlist option:selected').text());

            $('#CostumeName').toggle();
            $('#CostumeName').html("???" + $('select#costumelist option:selected').text() + "???");

            $('#tools').toggle();

            SetupModelRangeDisplay(0.2, 0, 1);
        }
    });

    $('#removelive2dModel').click(()=>{
        l2dviewer.clearCanvas();
        $('#openMedalBtn').toggle();
        $('#removelive2dModel').toggle();

        $('#ModelName').html("----");
        $('#CostumeName').toggle();

        $('#tools').toggle();
    })

    $('a.justify-content-between').click(function(){
        $(this).find("h5.fas").toggleClass('fas fa-plus fas fa-minus');
        // console.log($(this));
    });

});