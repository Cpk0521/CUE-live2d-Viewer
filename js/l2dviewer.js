class l2DViewer{
    constructor() {

        this.l2d = PIXI.live2d;
        
        //component
        this.divviewer = $("#viewer");
        this.charselecter = $("select#characterlist");
        this.costselecter = $("select#costumelist");
        this.loadBtn = $('#loadbtn');

        this.loadBtn.click(()=>{
            if(this.costselecter.val()){
                console.log(this.costselecter.val())
                this.LoadModel(this.costselecter.val());
            }
        })

        //create canvas
        this.app = new PIXI.Application({
                antialias: true,
                autoStart: true, backgroundColor : 0x333333
            });

        // let width = window.innerWidth * 0.7;
        let width = this.divviewer.width() * 0.95;
        let height = (width / 17) * 9;
        this.app.renderer.resize(width, height);
        this.divviewer.html(this.app.view);

        window.onresize = (e)=>{
            if(e === void 0) { e = null; }
            let width = this.divviewer.width() * 0.95;
            let height = (width / 17) * 9;
            this.app.renderer.resize(width, height);
        }

        //model
        this.selectingModel;
    }


    async LoadModel(jsonpath) {
        this.app.stage.removeChildren();
    
        this.model = await this.l2d.Live2DModel.from(jsonpath);

        this.app.stage.addChild(this.model);

        //setting
        this.model.scale.set(0.2);
        this.model.x = (this.app.screen.width - this.model.width)/2;

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
    
    Setupcharselecter(){
        let charselectlist = "<option>Select</option>";
        $.each(charset, function(key,val){
            charselectlist += '<option value="'+val.id+'">'+val.Name+'</option>';
        });
        this.charselecter.html(charselectlist);

        this.charselecter.change((event) => {
            if (event.target.selectedIndex == 0) {
                return;
            }

            let cid = event.target.value;
            console.log(cid);
            this.Setupcostselecter(cid);

        });
    }

    Setupcostselecter(cid){
        let costselectlist = "";
        $.each(costset[String('000'+cid).slice(-3)], function(key,val){
            costselectlist += '<option value="'+val.path+'">'+val.name+'</option>';
            // console.log(key, val);
        });
        this.costselecter.html(costselectlist)
    }

}