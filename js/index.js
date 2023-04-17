"use strict";

var l2dviewer;
var l2dmaster;

PIXI.live2d.CubismConfig.setOpacityFromMotion = true

function l2DViewer(){
    
    this._app = new PIXI.Application({
                    antialias: true,
                    autoStart: true, 
                    backgroundColor : 0xFFFFFF
                });
    this.copyright = true
    this._containers = {}
    this._l2dModels = {}

    this.createCanvas = (div) => {

        let width = div.width() * 0.97;
        let height = (width / 2); 
        // let height = Math.floor(width / 16 * 9); 
        
        this._app.renderer.resize(width, height);
        div.html(this._app.view);

        this.loadBackground('./image/backgrounds/bg_004.png')

        if (!this._containers['modelcontainer']){
            this._containers['modelcontainer'] = new PIXI.Container();
            this._containers['modelcontainer'].width = width;
            this._containers['modelcontainer'].height = height;
            this._app.stage.addChild(this._containers['modelcontainer']);
        }

        // if(!this._containers['misclcontainer']) {
        //     this._containers['misclcontainer'] = new PIXI.Container();
        //     this._app.stage.addChild(this._containers['misclcontainer']);
        //     this.copyright = true
        //     const copyright = new PIXI.Sprite(PIXI.Texture.from('./image/misc/Title_CopyW.png'));
        //     copyright.anchor.set(1)
        //     copyright.position.set(this._app.screen.width, this._app.screen.height);
        //     copyright.width = 440
        //     copyright.height = 22
        //     this._containers['misclcontainer'].addChild(copyright);
        // }
        
        window.onresize = (e)=>{
            if(e === void 0) { e = null; }
            let width = div.width() * 0.97;
            let height = (width / 2); 
            this._app.renderer.resize(width, height);

            if(this._containers['bgcontainer']){
                this._containers['bgcontainer'].children.forEach((child)=>{
                    child.width = width;
                    child.height = height;
                })
            }

            // if(this._containers['misclcontainer']) {
            //     this._containers['misclcontainer'].children.forEach((child)=>{
            //         child.width = width / 440;
            //         child.height = height / 22;
            //         child.anchor.set(1)
            //         child.position.set(this._app.screen.width, this._app.screen.height);
            //     })
            // }
        }
    }   

    this.loadBackground = async (src) => {

        if (!this._containers['bgcontainer']){
            this._containers['bgcontainer'] = new PIXI.Container();
            this._app.stage.addChild(this._containers['bgcontainer']);
        }

        this._app.renderer.backgroundColor = 0xFFFFFF;
        this._containers['bgcontainer'].removeChildren();

        let bg = await new PIXI.Sprite(PIXI.Texture.from(src));
        bg.width = this._app.renderer.width;
        bg.height = this._app.renderer.height;

        this._containers['bgcontainer'].addChild(bg);
        
        
        this.log('background updated')
    }

    this.setBackgroundColor = (color) => {
        this._containers['bgcontainer'].removeChildren();
        this._app.renderer.backgroundColor = color
    }

    this.addModel = (M) => {
        
        if(this.isModelInList(M.getIndexName())){
            return
        }

        this._l2dModels[M.getIndexName()] = M
        this._containers['modelcontainer'].addChild(M._Model);

        
        M.setAnchor(.5)
        M.setScale(.2)
        M._Model.position.set(this._app.screen.width/2, this._app.screen.height * 3/4);
        M.pointerEventBind()

        let foreground = PIXI.Sprite.from(PIXI.Texture.WHITE);
        foreground.width = M._Model.internalModel.width;
        foreground.height = M._Model.internalModel.height;
        foreground.alpha = 0.2;
        foreground.visible = false
        M.setForeground(foreground)
        
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


    // this.switchCopyright = () => {
    //     this.copyright = !this.copyright
    //     this._containers['misclcontainer'].visible = this.copyright
    // }

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

        this._ParametersValues = {};

        this._ParametersValues.breath = [...this._Model.internalModel.breath._breathParameters] //Clone
        this._Model.breathing = false
        this._Model.internalModel.breath._breathParameters = [] //不搖頭
        
        this._ParametersValues.eyeBlink = [...this._Model.internalModel.eyeBlink._parameterIds] //Clone
        this._Model.eyeBlinking = false
        this._Model.internalModel.eyeBlink._parameterIds = [] //不眨眼

        this._ParametersValues.parameter = [] //Clone All Parameters Values
        this.getCoreModel()._parameterIds.map((p, index) => {
            let parameter = {}
            parameter.parameterIds = p
            parameter.max = this.getCoreModel()._parameterMaximumValues[index]
            parameter.min = this.getCoreModel()._parameterMinimumValues[index]
            parameter.defaultValue = this.getCoreModel()._parameterValues[index]

            this._ParametersValues.parameter.push(parameter)
        })

        this._ParametersValues.PartOpacity = [] //Clone All Part Opacity
        this.getCoreModel()._partIds.map((p, index) => {
            let part = {}
            part.partId = p
            part.defaultValue = this.getCoreModel().getPartOpacityById(p)

            this._ParametersValues.PartOpacity.push(part)
        })

        //重新排序
        // this.getMotionManager().on('motionLoaded', function (group, index, motion) {
        //     const curves = [];

        //     motion._motionData.curves.forEach((f) => {
        //       if (Array.isArray(curves[f.type])) curves[f.type].push(f);
        //       else curves[f.type] = [f];
        //     });

        //     motion._motionData.curves.splice(
        //       0,
        //       motion._motionData.curves.length,
        //       ...curves.flat()
        //     );

        // })
    }

    this.pointerEventBind = () => {
        
        this._Model.autoInteract = false;
        this._Model.interactive = true;
        this._Model.focusing = false;

        this._Model.buttonMode = true;

        this._Model.on("pointerdown", (e) => {
            this._Model.dragging = true;
            this._Model._pointerX = e.data.global.x - this._Model.x;
            this._Model._pointerY = e.data.global.y - this._Model.y;
        });

        this._Model.on("pointermove", (e) => {
            if (this._Model.dragging) {
                this._Model.position.x = e.data.global.x - this._Model._pointerX;
                this._Model.position.y = e.data.global.y - this._Model._pointerY;
            }
        });
        
        this._Model.on("pointerupoutside", () => (this._Model.dragging = false));
        this._Model.on("pointerup", () => (this._Model.dragging = false));

        let viewer = document.getElementById('viewer');
        viewer.addEventListener('pointerdown', (e) => {
            if(this._Model.focusing)
                this._Model.focus(e.clientX, e.clientY)
        });
    }

    this.setName = (char, cost) => {
        this._ModelName = char;
        this._costume = cost;
    }

    this.setAnchor = (val) => {
        this._Model.anchor.set(val);
    }

    this.setScale = (val) =>{
        this._Model.scale.set(val)
    }

    this.setAlpha = (val) => {
        this._Model.aplha = val
    }

    this.setAngle = (val) => {
        this._Model.angle = val
    }

    this.setForeground = (Sprite) => {
        this._Model.addChild(Sprite)
    }

    this.setForegroundVisible = (bool) => {
        this._Model.children[0].visible = bool
    }

    this.setInteractive = (bool) => {
        this._Model.interactive = bool
    }

    this.setLookatMouse = (bool) => {
        this._Model.focusing = bool
        if(!bool)
            this._Model.focus(this._Model.x, this._Model.y)
    }
    
    this.setParameters = (id, value) => {
        this.getCoreModel().setParameterValueById(id, value)
    }

    this.setPartOpacity = (id, value) => {
        this.getCoreModel().setPartOpacityById(id, value)
    }

    this.setBreathing = (bool) => {
        this._Model.breathing = bool
        if(!this._Model.breathing){
            this._Model.internalModel.breath._breathParameters = []
            return 
        }

        this._Model.internalModel.breath._breathParameters = [...this._ParametersValues.breath]
    }

    this.setEyeBlinking = (bool) => {
        this._Model.eyeBlinking = bool
        if(!this._Model.eyeBlinking){
            this._Model.internalModel.eyeBlink._parameterIds = []
            return 
        }

        this._Model.internalModel.eyeBlink._parameterIds = [...this._ParametersValues.eyeBlink]
    }

    this.loadExpression = (index) => {
        this.getExpressionManager().setExpression(index)
    }

    this.executeMotionByName = (name, type = '') => {
        let index = this._getMotionByName(type, name)
        this.loadMotion(type, index, 'FORCE')
    }

    this._getMotionByName = (type, name) => {
        let motions = this._modelsetting?.motions
        return motions[type].findIndex(motion => motion.Name == name)
    }

    this.loadMotion = (group, index, priority) => {
        this._Model.motion(group, index, priority)
    }


    this.getAnchor = () => {
        return this._Model.anchor
    }

    this.getScale = () => {
        return this._Model.scale
    }

    this.getAlpha = () => {
        return this.aplha
    }

    this.getAngle = () => {
        return this._Model.angle
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

    this.getParamById = (id) => {
        return this._ParametersValues.parameter.find(x => x.parameterIds == id)
    }

    this.getAllParameters = () => {
        return this._ParametersValues.parameter
    }

    this.getPartOpacityById = (id) => {
        return this._ParametersValues.PartOpacity.find(x => x.partId == id)
    }

    this.getAllPartOpacity = () => {
        return this._ParametersValues.PartOpacity
    }

    this.getCoreModel = () => {
        return this._Model.internalModel.coreModel
    }

    this.getMotionManager = () => {
        return this._Model?.internalModel.motionManager
    }

    this.getFocusController = () => {
        return this._Model?.internalModel.focusController
    }

    this.getExpressionManager = () => {
        return this._Model?.internalModel.motionManager.expressionManager
    }

}



const setupCharacterSelect = (data) => {
    let select = document.getElementById('characterSelect');
    let inner = `<option>Select</option>`

    data.Master.map((val) => {
        inner += `<option value="${val.id}">${val.name}</option>`
    })

    select.innerHTML = inner

    select.onchange = (e) => {
        if (e.target.selectedIndex == 0) {
            return;
        }

        let cid = e.target.value;
        let options = data.Master.find(x => x.id == cid)
        setupCostumeSelect(options)
    }
}

const setupCanvasBackgroundOption = (data) => {
    let list = document.getElementById('background-list');
    
    data.map((val)=>{
        let btn = document.createElement('button')
        btn.innerHTML = `<img src='./image/${val.thumbnail}'><img>`
        btn.onclick = () => {
            l2dviewer?.loadBackground(`./image/${val.background_src}`)
        }

        list.append(btn)
    })

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

    Array.from(document.getElementsByClassName('collapsible')).forEach(x => {
        x.classList.remove('active')
        let content = x.nextElementSibling;
        content.style.display = "none";
    })


    //SET UP SCALE PARAMETER
    let scale_Range = document.getElementById('scaleRange')
    let scale_Num = document.getElementById('scaleNum')
    scale_Range.value = M.getScale().x
    scale_Num.value = scale_Range.value
    scale_Range.oninput = function(e) {
        scale_Num.value = this.value
        M.setScale(this.value)
    }
    scale_Num.oninput = function(e){
        if(this.value == ""){
            this.value = scale_Range.value
            return
        }

        if(parseInt(this.value) < parseInt(this.min)){
            this.value = this.min;
        }
        if(parseInt(this.value) > parseInt(this.max)){
            this.value = this.max;
        }
        scale_Range.value = this.value
        M.setScale(this.value)
    }

    //SET UP ANGLE PARAMETER
    let angle_Range = document.getElementById('angleRange')
    let angle_Num = document.getElementById('angleNum')
    angle_Range.value = M.getAngle()
    angle_Num.value = angle_Range.value
    angle_Range.oninput = function(e){
        angle_Num.value = this.value
        M.setAngle(this.value)
    }
    angle_Num.oninput = function(e){
        if(this.value == ""){
            this.value = angle_Range.value
            return
        }

        if(parseInt(this.value) < parseInt(this.min)){
            this.value = this.min;
        }
        if(parseInt(this.value) > parseInt(this.max)){
            this.value = this.max;
        }
        angle_Range.value = this.value
        M.setAngle(this.value)
    }

    //SET UP MOUTHOPEN PARAMETER
    let paramMouthOpenYRange = document.getElementById('paramMouthOpenYRange')
    let paramMouthOpenYNum = document.getElementById('paramMouthOpenYNum')
    let param = M.getParamById('ParamMouthOpenY')
    paramMouthOpenYRange.max = param.max
    paramMouthOpenYRange.min = param.min
    paramMouthOpenYRange.value = M.getCoreModel().getPartOpacityById('ParamMouthOpenY')
    paramMouthOpenYNum.max = param.max
    paramMouthOpenYNum.min = param.min
    paramMouthOpenYNum.value = paramMouthOpenYRange.value
    paramMouthOpenYRange.oninput = function(e){
        paramMouthOpenYNum.value = this.value
        M.getCoreModel().setParameterValueById('ParamMouthOpenY', this.value)
    }
    paramMouthOpenYNum.oninput = function(e){
        if(this.value == ""){
            this.value = paramMouthOpenYRange.value
            return
        }

        if(parseInt(this.value) < parseInt(this.min)){
            this.value = this.min;
        }
        if(parseInt(this.value) > parseInt(this.max)){
            this.value = this.max;
        }
        paramMouthOpenYRange.value = this.value
        M.getCoreModel().setParameterValueById('ParamMouthOpenY', this.value)
    }

    //SET UP INTERACTIVE
    let focusingCheckbox = document.getElementById('FocusingCheckbox')    
    focusingCheckbox.checked = M._Model.focusing
    focusingCheckbox.onchange = function(e){
        M.setLookatMouse(this.checked);
    }

    // SET UP BREATH
    let breathingCheckbox = document.getElementById('breathingCheckbox')    
    breathingCheckbox.checked = M._Model.breathing
    breathingCheckbox.onchange = function(e){
        M.setBreathing(this.checked);
    }

    //SET UP EYEBLINKING
    let eyeBlinkingCheckbox = document.getElementById('eyeBlinkingCheckbox')    
    eyeBlinkingCheckbox.checked = M._Model.eyeBlinking
    eyeBlinkingCheckbox.onchange = function(e){
        M.setEyeBlinking(this.checked);
    }

    // SET UP FOREGROUND
    let foregroundCheckbox = document.getElementById('foregroundCheckbox')    
    foregroundCheckbox.checked = M._Model.children[0].visible
    foregroundCheckbox.onchange = function(e){
        M.setForegroundVisible(this.checked);
    }

    //Drag
    let dragCheckbox = document.getElementById('dragCheckbox')
    dragCheckbox.checked = M._Model.interactive
    dragCheckbox.onchange = function(e){
        M.setInteractive(this.checked)
    }


    //SET UP EXPRESSTIONS LIST
    let expressionslist = document.getElementById('expressions-list')
    let expressions = M.getExpressions()
    expressionslist.innerHTML = ''
    Array.from(expressions).forEach((exp, index)=>{
        let expbtn = document.createElement("button");
        expbtn.innerHTML = exp['Name']
        expbtn.addEventListener('click', ()=>{
            M.loadExpression(index)
        })

        expressionslist.append(expbtn)
    })

    //SET UP MOTIONS LIST
    let motionslist = document.getElementById('motion-list')
    let motions = M.getMotions()
    motionslist.innerHTML = ''

    for (const key in motions) {
        Array.from(motions[key]).forEach((m, index) => {

            if(m['File'].includes('loop')){
                return
            }

            let motionbtn = document.createElement("button");
            motionbtn.innerHTML = m['Name']
            motionbtn.addEventListener("click", ()=>{
                M.loadMotion(key, index, 'FORCE')
            })

            motionslist.append(motionbtn)
        })
    }

    //SET UP MODEL PARAMETER LIST
    let parameterslist = document.getElementById('parameters-list')
    let parameter = M.getAllParameters()
    parameterslist.innerHTML = ''

    parameter.map((param) => {
        let p_div = document.createElement("div");
        p_div.className = 'rangeOption'
        p_div.innerHTML += `<p>${param.parameterIds}</p>`

        let range = document.createElement("input");
        range.type = 'range'
        range.className = 'input-range'
        range.setAttribute('step', 0.01)
        range.setAttribute('min', param.min)
        range.setAttribute('max', param.max)
        range.value = param.defaultValue
        p_div.append(range)

        let text = document.createElement("input");
        text.type = 'number'
        text.setAttribute('step', 0.01)
        text.setAttribute('min', param.min)
        text.setAttribute('max', param.max)
        text.value = param.defaultValue
        p_div.append(text)

        range.addEventListener('input', function(e){
            text.value = this.value
            M.setParameters(param.parameterIds, this.value)
        })

        text.addEventListener('input', function(e){
            if(this.value == ""){
                this.value = range.value
                return
            }
    
            if(parseInt(this.value) < parseInt(this.min)){
                this.value = this.min;
            }
            if(parseInt(this.value) > parseInt(this.max)){
                this.value = this.max;
            }
            range.value = this.value
            M.setParameters(param.parameterIds, this.value)
        })

        parameterslist.append(p_div)
    })

    //SET UP MODEL PartOpacity LIST
    let partOpacityList = document.getElementById('partOpacity-list')
    let partOpacity = M.getAllPartOpacity()
    partOpacityList.innerHTML = ''

    partOpacity.map((param) => {
        let p_div = document.createElement("div");
        p_div.className = 'rangeOption'
        p_div.innerHTML += `<p>${param.partId}</p>`

        let range = document.createElement("input");
        range.type = 'range'
        range.className = 'input-range'
        range.setAttribute('step', 0.1)
        range.setAttribute('min', 0)
        range.setAttribute('max', 1)
        range.value = param.defaultValue
        p_div.append(range)

        let text = document.createElement("input");
        text.type = 'number'
        text.setAttribute('step', 0.1)
        text.setAttribute('min', 0)
        text.setAttribute('max', 1)
        text.value = param.defaultValue
        p_div.append(text)

        range.addEventListener('input', function(e){
            text.value = this.value
            M.setPartOpacity(param.partId, this.value)
        })

        text.addEventListener('input', function(e){
            if(this.value == ""){
                this.value = range.value
                return
            }
    
            if(parseInt(this.value) < parseInt(this.min)){
                this.value = this.min;
            }
            if(parseInt(this.value) > parseInt(this.max)){
                this.value = this.max;
            }
            range.value = this.value
            M.setPartOpacity(param.partId, this.value)
        })

        partOpacityList.append(p_div)
    })

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
                setupCharacterSelect(l2dmaster)
            }).catch(function(error) {
                console.log('failed while loading index.json.');
            });

    await fetch('./json/bg.json')
            .then(function(response) {
                if (!response.ok) {
                    throw Error(response.statusText);
                }
                return response;
            })
            .then(response => response.json())
            .then(json => {
                setupCanvasBackgroundOption(json)
            }).catch(function(error) {
                console.log('failed while loading index.json.');
            });

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

    document.getElementById("colorPicker").onchange = function(e) {
        l2dviewer.setBackgroundColor(String(this.value).replace(/#/, '0x'))
    }

    // let copyrightCheckbox = document.getElementById("copyrightCheckbox");
    // copyrightCheckbox.checked = l2dviewer.copyright
    // copyrightCheckbox.onchange = function(e){
    //     l2dviewer.switchCopyright()
    // }

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


// background 
// {
//     "thumbnail" : "backgroundthumbnail/background_thumb038.png",
//     "background_src" : "backgrounds/bg_038.png"
// },
// {
//     "thumbnail" : "backgroundthumbnail/background_thumb039.png",
//     "background_src" : "backgrounds/bg_039.png"
// },
// {
//     "thumbnail" : "backgroundthumbnail/background_thumb042.png",
//     "background_src" : "backgrounds/bg_042.png"
// },