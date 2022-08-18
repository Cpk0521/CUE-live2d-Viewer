"use strict";

var l2dviewer;
var l2dmaster;

PIXI.live2d.Live2DModel.prototype.motion = async function (group, index, priority) {
    if (priority === "FORCE")
      await this.internalModel.motionManager.stopAllMotions();
    const res =
      index === undefined
        ? await this.internalModel.motionManager.startRandomMotion(
            group,
            priority
          )
        : await this.internalModel.motionManager.startMotion(
            group,
            index,
            priority
          );
    return res;
};

function l2DViewer(){
    
    this._app = new PIXI.Application({
                    antialias: true,
                    autoStart: true, 
                    backgroundColor : 0xFFFFFF
                });
    this._containers = {}
    this._l2dModels = {}

    this.createCanvas = (div) => {

        let width = div.width() * 0.97;
        let height = (width / 17) * 9; 
        this._app.renderer.resize(width, height);
        div.html(this._app.view);

        this.loadBackground('./image/background/base_178.png')

        if (!this._containers['modelcontainer']){
            this._containers['modelcontainer'] = new PIXI.Container();
            this._containers['modelcontainer'].width = width;
            this._containers['modelcontainer'].height = height;
            this._app.stage.addChild(this._containers['modelcontainer']);
        }

        window.onresize = (e)=>{
            if(e === void 0) { e = null; }
            let width = div.width() * 0.97;
            let height = (width / 17) * 9;
            this._app.renderer.resize(width, height);

            if(this._containers['bgcontainer']){
                this._containers['bgcontainer'].children.forEach((child)=>{
                    child.width = width;
                    child.height = height;
                })
            }
        }
    }   

    this.loadBackground = (src) => {

        if (!this._containers['bgcontainer']){
            this._containers['bgcontainer'] = new PIXI.Container();
            this._app.stage.addChild(this._containers['bgcontainer']);
        }

        this._containers['bgcontainer'].removeChildren();

        let bg = new PIXI.Sprite(PIXI.Texture.from(src));
        bg.width = this._app.renderer.width;
        bg.height = this._app.renderer.height;

        this._containers['bgcontainer'].addChild(bg);

        this.log('background updated')
    }

    this.addModel = (M) => {
        // this._containers['modelcontainer'].removeChildren();

        if(this.isModelInList(M.getIndexName())){
            return
        }

        this._l2dModels[M.getIndexName()] = M
        this._containers['modelcontainer'].addChild(M._Model);

        M._Model.anchor.set(0.5);
        M._Model.scale.set(0.2);
        M._Model.position.set(this._app.screen.width/2, this._app.screen.height * 3/4);

        M._Model.autoInteract = false

        M._Model.buttonMode = true;
        M._Model.on("pointerdown", (e) => {
            M._Model.dragging = true;
            M._Model._pointerX = e.data.global.x - M._Model.x;
            M._Model._pointerY = e.data.global.y - M._Model.y;
        });

        M._Model.on("pointermove", (e) => {
            if (M._Model.dragging) {
                M._Model.position.x = e.data.global.x - M._Model._pointerX;
                M._Model.position.y = e.data.global.y - M._Model._pointerY;
            }
        });
        
        M._Model.on("pointerupoutside", () => (M._Model.dragging = false));
        M._Model.on("pointerup", () => (M._Model.dragging = false));

        this.log('model loaded')
    }

    this.removeModel = (name) => {
        if (this.isModelInList(name)){
            this._l2dModels[name]._Model.destroy()
            this._containers['modelcontainer'].removeChild(this._l2dModels[name]._Model)
            delete this._l2dModels[name]
        }

        this.log('model removed')
    }
    
    this.isModelInList = (name) => {
        return name in this._l2dModels 
    }

    this.findModel = (name) => {
        return this._l2dModels[name] ?? {}
    }

    this.log = (text = '') => {
        console.log(text)
    }
}


function l2dModel(){

    this.setModel = async(src) => {

        let settingsJSON = await fetch(src).then(res => res.json());
        settingsJSON.url = src;

        this._modelsetting = new PIXI.live2d.Cubism4ModelSettings(settingsJSON);
        this._Model = await PIXI.live2d.Live2DModel.from(settingsJSON);

        this.getMotionManager().on('motionLoaded', function (group, index, motion) {
            const curves = [];
            motion._motionData.curves.forEach((f) => {
              if (Array.isArray(curves[f.type])) curves[f.type].push(f);
              else curves[f.type] = [f];
            });
            motion._motionData.curves.splice(
              0,
              motion._motionData.curves.length,
              ...curves.flat()
            );
        })
    }

    this.setName = (char, cost) => {
        this._ModelName = char;
        this._costume = cost;
    }

    this.getIndexName = () => {
        return `${this._ModelName}_${this._costume}`
    }

    this.getSetting = () => {
        return this._modelsetting
    }

    this.getUrl = () => {
        return this._modelsetting?.url
    }

    this.getGroups = () => {
        return this._modelsetting?.groups
    }

    this.getExpressions = () => {
        return this._modelsetting?.expressions
    }

    this.getMotions = () => {
        return this._modelsetting?.motions
    }

    this.getCoreModel = () => {
        return this._Model?.internalMode.coreModel
    }

    this.getMotionManager = () => {
        return this._Model?.internalModel.motionManager
    }

    this.getFocusController = () => {
        return this._Model?.internalModel.focusController
    }

}


const setupCharacterSelect = (masterlist) => {
    let select = document.getElementById('characterSelect');
    let inner = `<option>Select</option>`

    masterlist.Master.map((val) => {
        inner += `<option value="${val.id}">${val.name}</option>`
    })

    select.innerHTML = inner

    select.onchange = (e) => {
        if (e.target.selectedIndex == 0) {
            return;
        }

        let cid = e.target.value;
        let options = masterlist.Master.find(x => x.id == cid)
        setupCostumeSelect(options)
    }
}

const setupCostumeSelect = (options) => {
    let select = document.getElementById('costumeSelect');
    let inner = ``

    options.live2d.map(val => {
        inner += `<option value="${val.costumeId}">${val.costumeName}</option>`
    })

    select.innerHTML = inner
}

const toggleTabContainer = (tabid) => {
    let tabcons = document.getElementsByClassName('tab-content')
    Array.from(tabcons).forEach(element => {
        element.classList.remove('shown'); 
    })

    let tabbtns = document.getElementsByClassName('tab-btn')
    Array.from(tabbtns).forEach(element => {
        element.classList.remove('btn-selecting'); 
    })

    let ele = document.getElementById(tabid)    
    ele?.classList.add('shown')

    let elebtn = document.getElementById(`${tabid}btn`)
    elebtn?.classList.add('btn-selecting')
}

const setupModelSetting = (M) => {
    let info_ModelName = document.getElementById('info-ModelName')
    let info_CostumeName = document.getElementById('info-CostumeName')

    info_ModelName.innerHTML = M._ModelName
    info_CostumeName.innerHTML = M._costume

    let backBtn = document.getElementById('back-btn')
    backBtn.onclick = () => {
        toggleTabContainer('Models')
    }

    let motionslist = document.getElementById('motion-list')

    let motions = M.getMotions()
    motionslist.innerHTML = ''

    for (const key in motions) {
        Array.from(motions[key]).forEach((x, index) => {
            let motionbtn = document.createElement("button");
            motionbtn.innerHTML = x['File'].replace('.motion3.json', "") ;
            motionbtn.addEventListener("click", ()=>{
                console.log(x['File']);
                M._Model.motion(key, index, 'FORCE')
            })

            motionslist.append(motionbtn)
        })
    }

}

$(document).ready(async() => {

    await fetch('./json/live2dMaster.json')
            .then(function(response) {
                if (!response.ok) {
                    throw Error(response.statusText);
                }
                return response;
            })
            .then(response => response.json())
            .then(json => {
                l2dmaster = json
            }).catch(function(error) {
                console.log('failed while loading index.json.');
            });

    setupCharacterSelect(l2dmaster)

    l2dviewer = new l2DViewer()
    l2dviewer.createCanvas($("#viewer"))
    
    document.getElementById('addL2DModelBtn').onclick = async () => {
        let charvalue = document.getElementById('characterSelect');
        let costvalue = document.getElementById('costumeSelect');

        if(charvalue.selectedIndex == 0 || costvalue.value == ''){
            return
        }

        let fulldata = l2dmaster.Master.find(x => {return x.id == charvalue.value})
        let costdata = fulldata.live2d.find(y => y.costumeId == costvalue.value)

        charvalue.selectedIndex = 0
        costvalue.innerHTML = ''

        if(l2dviewer.isModelInList(`${fulldata.name}_${costdata.costumeName}`)){
            return
        }
        
        let M = new l2dModel()
        await M.setModel(costdata.path)
        M.setName(fulldata.name, costdata.costumeName)
        l2dviewer.addModel(M)
        
        let modelsList = document.getElementById('ModelsList')

        let infoblock = document.createElement("div");
        infoblock.className = 'modelInfoBlock'
        infoblock.innerHTML += `<h3 class="ModelName">${fulldata.name}</h3>
                                <h5 class="CostumeName">【${costdata.costumeName}】</h5>`

        let removeBtn = document.createElement("button");
        removeBtn.className = "model-remove-btn"
        removeBtn.innerHTML = `<i class="fa-solid fa-xmark"></i>`
        removeBtn.onclick = () => {
            infoblock.remove();
            l2dviewer.removeModel(`${fulldata.name}_${costdata.costumeName}`)
        }
        infoblock.append(removeBtn)

        let settingBtn = document.createElement("button");
        settingBtn.className = "model-setting-btn"
        settingBtn.innerHTML = `<i class="fa-solid fa-ellipsis"></i>`
        settingBtn.onclick = () =>{
            toggleTabContainer('ModelSetting')
            setupModelSetting(l2dviewer.findModel(`${fulldata.name}_${costdata.costumeName}`))
        }
        infoblock.append(settingBtn)

        modelsList.append(infoblock)
    }

    Array.from(document.getElementsByClassName('collapsible')).forEach(x => {
        x.addEventListener('click', function() {
            this.classList.toggle("active");
            let content = this.nextElementSibling;
            if (content.style.display === "block") {
                content.style.display = "none";
              } else {
                content.style.display = "block";
              }
        })
    })



})