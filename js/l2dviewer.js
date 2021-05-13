class l2DViewer{
    constructor() {

        this.l2d = PIXI.live2d;
        
        //component
        this.divviewer = $("#viewer");

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

        //container
        this.bgcontainer = new PIXI.Container();
        this.app.stage.addChild(this.bgcontainer);

        this.modelcontainer = new PIXI.Container();
        this.app.stage.addChild(this.modelcontainer);
        
        this.loadBackground('image/background/base_178.png');

        //model
        this.model;
        this.modelsetting;
    }

    async LoadModel(jsonpath) {

        this.modelcontainer.removeChildren();
    
        let settingsJSON = await fetch(jsonpath).then(res => res.json());
        settingsJSON.url = jsonpath;

        this.modelsetting = new this.l2d.Cubism4ModelSettings(settingsJSON);
        this.model = await this.l2d.Live2DModel.from(settingsJSON);
        
        this.modelcontainer.addChild(this.model);
        
        //display setting
        this.model.anchor.set(0.5);
        this.modelOnChangeScale(0.2);
        this.model.position.set(this.app.screen.width/2, this.app.screen.height * 2/3);

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

        setupMotionsList(this.model.internalModel.motionManager.definitions);
    }

    clearCanvas(){
        this.model.destroy();
        this.modelcontainer.removeChildren();
    }

    modelOnChangeScale(val){
        if(this.model){
            this.model.scale.set(val);
        }
    }

    modelOnChangeAngle(val){
        if(this.model){
            this.model.angle = val;
        }
    }

    modelOnChangeAlpha(val){
        if(this.model){
            this.model.alpha = val;
        }
    }

    modelStartMotions(group, index){
        if(!this.model.internalModel.motionManager.playing){
            this.model.motion(group, index);
            console.log(this.model.internalModel.motionManager.playing);
        }
    }

    loadBackground(url){
        const texture = PIXI.Texture.from(url);
        const bg = new PIXI.Sprite(texture);

        bg.width = this.app.renderer.width + 2;
        bg.height = this.app.renderer.height + 2;

        this.bgcontainer.addChild(bg);
        // const brt = new PIXI.BaseRenderTexture(PIXI.SCALE_MODES.LINEAR, 1);
        // const rt = new PIXI.RenderTexture(brt);
        // const sprite = new PIXI.Sprite(rt);
        // this.app.stage.addChild(sprite);
        console.log("Done");
    }

}
