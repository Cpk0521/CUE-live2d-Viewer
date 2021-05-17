class l2DViewer{
    constructor(divviewer) {

        this.l2d = PIXI.live2d;
        
        //create canvas
        this.app = new PIXI.Application({
                antialias: true,
                autoStart: true, 
                backgroundColor : 0xFFFFFF
            });

        //canvas setting
        let width = divviewer.width() * 0.95;
        let height = (width / 17) * 9;
        this.app.renderer.resize(width, height);
        divviewer.html(this.app.view);

        //container
        this.bgcontainer = new PIXI.Container();
        this.app.stage.addChild(this.bgcontainer);

        this.modelcontainer = new PIXI.Container();
        this.modelcontainer.width = width;
        this.modelcontainer.height = height;
        this.app.stage.addChild(this.modelcontainer);
        
        //backgound
        this.loadBackground('image/background/base_178.png');

        window.onresize = (e)=>{
            if(e === void 0) { e = null; }
            let width = divviewer.width() * 0.95;
            let height = (width / 17) * 9;
            this.app.renderer.resize(width, height);

            this.bgcontainer.children.forEach((child)=>{
                child.width = width;
                child.height = height;
            })
        }
        
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
        this.model.position.set(this.app.screen.width/2, this.app.screen.height * 3/4);

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
        this.bgcontainer.removeChildren();

        const bg = new PIXI.Sprite(PIXI.Texture.from(url));

        bg.width = this.app.renderer.width;
        bg.height = this.app.renderer.height;

        this.bgcontainer.addChild(bg);
      
        console.log("Done");
    }



}
