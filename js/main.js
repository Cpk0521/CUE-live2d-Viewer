var mv;

$(document).ready(() => {

    mv = new ModelViewer();

    $.getJSON('datalist/live2dList.json', function(data){
        $.each(data, function(key, val) {
            // console.log(key);
            $('#list').append($('<button/>').text(key).click(()=>{
                mv.LoadModel(val);
            }));
        });
    })

});

class ModelViewer {
    constructor() {
        this.l2d = PIXI.live2d;

        this.canvas = $("#canvas");

        this.app = new PIXI.Application({
                  view: document.getElementById("canvas"),
                  autoStart: true,
                  backgroundColor: 0x333333
                });
        
        let width = innerWidth;
        let height = 750;
        this.app.view.style.width = width + "px";
        this.app.view.style.height = height + "px";
        this.app.renderer.resize(width, height);

        this.model;
    }

    async LoadModel(jsonpath) {
        this.app.stage.removeChildren();

        this.model = await this.l2d.Live2DModel.from(jsonpath);

        this.app.stage.addChild(this.model);

        //setting
        this.model.scale.set(0.2);
        this.model.x = (this.app.screen.width - this.model.width)/2;
        // this.model.y = (this.app.screen.height - this.model.height)/2;        

        //draging
        this.model.buttonMode = true;
        this.model.on("pointerdown", (e) => {
            this.model.dragging = true;
            this.model._pointerX = e.data.global.x - this.model.x;
            this.model._pointerY = e.data.global.y - this.model.y;
        });

        this.model.on("pointermove", (e) => {
            if (this.model.dragging) {
                this.model.position.x = e.data.global.x - this.model._pointerX;
                this.model.position.y = e.data.global.y - this.model._pointerY;
            }
        });
        
        this.model.on("pointerupoutside", () => (this.model.dragging = false));
        this.model.on("pointerup", () => (this.model.dragging = false));


        //Animation
        //model.internalModel.motionManager.startMotion('', 1);
    }

}