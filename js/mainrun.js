var l2dviewer;
var charset;
var costset;

$(document).ready(() => {

    // mv = new ModelViewer();
    l2dviewer = new l2DViewer();

    $.getJSON("datalist/CharactorList.json", function(data) {
        charset = data.Charactor;
    }).done(function() {
        l2dviewer.Setupcharselecter();
    });

    $.getJSON("datalist/live2dList_v2.json", function(data) {
        costset = data;
    }).done(function() {
        console.log(costset);
    });
    
});