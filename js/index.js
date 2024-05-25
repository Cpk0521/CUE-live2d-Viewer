"use strict";

var l2dviewer;
var l2dmaster;

class l2dViewer{

    copyright = true
    containers = new Map()
    _l2dModels = new Map()
    
    constructor(element){
        if (document.getElementById("viewer")) {
            document.getElementById("viewer").remove();
        }
        
        this._element = element
        this._app = new PIXI.Application({
            hello : false,
            width : 1334,
            height : 750,
            backgroundColor : 0x000000
        });

        globalThis.__PIXI_APP__ = this._app;

        this._app.view.setAttribute("id", "viewer");
        element.appendChild(this._app.view);

        this._resizeViwer();
        window.addEventListener('resize', this._resizeViwer.bind(this));

        let bgcontainer = new PIXI.Container();
        this._app.stage.addChild(bgcontainer);
        this.containers.set('BG', bgcontainer);

        let modelcontainer = new PIXI.Container();
        this._app.stage.addChild(modelcontainer);
        this.containers.set('Models', modelcontainer);

        this.loadBG('./bg/background004_1/manifest.json')
    }

    _resizeViwer(){
        let elewidth = this._element.offsetWidth;
        let eleheight = this._element.offsetHeight;

        let ratio = Math.min(elewidth / 1334, eleheight / 750);
        
        let resizedX = 1334 * ratio;
        let resizedY = 750 * ratio;
        
        this._app.view.style.width = `${resizedX}px`;
        this._app.view.style.height = `${resizedY}px`;
    }
    
    setBGColor(color) {
        this.containers.get('BG').removeChildren();
        this._app.renderer.background.color  = color
    }

    loadBG(src) {
        this.setBGColor(0xFFFFFF);
        
        const bg = BGContainer.from(src);
        this.containers.get('BG').addChild(bg);

        console.log('background updated');
    }

    addModel(model){
        if(this._l2dModels.has(model.getIndexName())){
            return;
        }

        this._l2dModels.set(model.getIndexName(), model);
        this.containers.get('Models').addChild(model._Model);
        

        model.setAnchor(.5);
        model.setScale(.3);
        model._Model.position.set(this._app.screen.width/2, this._app.screen.height * 3/4);
        model.pointerEventBind();

        let foreground = PIXI.Sprite.from(PIXI.Texture.WHITE);
        foreground.width = model._Model.internalModel.width;
        foreground.height = model._Model.internalModel.height;
        foreground.alpha = 0.2;
        foreground.visible = false
        model.setForeground(foreground)

        console.log('model loaded')
    }

    removeModel(name) {
        let model = this._l2dModels.get(name)
        if(!model){
            return;
        }
        this.containers.get('Models').removeChild(model);
        model._Model.destroy();
        this._l2dModels.delete('name');

        console.log('model removed');
    }

    isModelInList(name){
        return this._l2dModels.has(name);
    }

    findModel(name){
        return this._l2dModels.get(name);
    }

    get app(){
        return this._app;
    }

}

class BGContainer extends PIXI.Container{

    static from(source){
        const bg = new this();
        bg._init(source);
        return bg;
    }

    async _init(source){
        let menifest = await fetch(source).then(res => res.json());
        const folder = source.split('manifest.json')[0]

        const ratio = 1334 / menifest.env.width;
        const scale = (menifest.env.height * ratio - 750) /2;

        this.name = menifest.env.name;

        menifest.elements.forEach((element) => {
            const url = folder + menifest.env.images + element.image
            
            const sprite = PIXI.Sprite.from(url);
            sprite.name = element.name;

            sprite.width = element.width * ratio;
            sprite.height = element.height * ratio;

            sprite.anchor.set(element.pivotX ?? 0.5, element.pivotY ?? 0.5);

            if(element.blendMode){
                sprite.blendMode = element.blendMode
            }

            sprite.position.set(element.x, element.y);
            this.addChild(sprite);
        });
    }

}

PIXI.live2d.CubismConfig.setOpacityFromMotion = true

class HeroModel{

    _container = new PIXI.Container()

    async create(src){
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
    }

    pointerEventBind() {
        
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

    setName(char, cost){
        this._ModelName = char;
        this._costume = cost;
    }

    setAnchor(x, y){
        if(!y) y = x
        this._Model.anchor.set(x, y);
    }

    setScale(val){
        this._Model.scale.set(val)
    }

    setAlpha(val){
        this._Model.aplha = val
    }

    setAngle(val){
        this._Model.angle = val
    }

    setForeground(Sprite){
        this._Model.addChild(Sprite)
    }

    setForegroundVisible(bool){
        this._Model.children[0].visible = bool
    }

    setInteractive(bool){
        this._Model.interactive = bool
    }

    setLookatMouse(bool){
        this._Model.focusing = bool
        if(!bool){
            this._Model.focus(this._Model.x, this._Model.y)
        }
    }

    //!!!!
    // setLookat(value){

    //     if(value == 0){
    //         this.getFocusController().focus(0, 0)
    //     }else{

    //         let bound = this._Model.getBounds()
    //         // console.log(bound)

    //         let center = { x: this._Model.x , y: this._Model.y }
    //         let r = this._Model.width
    //         // let half_h = this._Model.height / 2
            
    //         let rand = (value - 90) * (Math.PI / 180)
    //         let x = center.x + r * Math.cos(rand) 
    //         let y = (center.y) + r * Math.sin(rand)

    //         let testGraphics = new PIXI.Graphics()
    //         testGraphics.beginFill(0xff0000);
    //         testGraphics.drawRect(x, y, 10, 10);
    //         testGraphics.endFill();

    //         this._container.addChild(testGraphics)

    //         console.log(x, y)

    //         // this.getFocusController().focus(x, y)
    //         this._Model.focus(x, y)
    //         console.log(this._Model.focus)
    //     }   
    // }
    
    setParameters(id, value){
        this.getCoreModel().setParameterValueById(id, value)
    }

    setPartOpacity(id, value){
        this.getCoreModel().setPartOpacityById(id, value)
    }

    setBreathing(bool){
        this._Model.breathing = bool
        if(!this._Model.breathing){
            this._Model.internalModel.breath._breathParameters = []
            return 
        }

        this._Model.internalModel.breath._breathParameters = [...this._ParametersValues.breath]
    }

    setEyeBlinking(bool){
        this._Model.eyeBlinking = bool
        if(!this._Model.eyeBlinking){
            this._Model.internalModel.eyeBlink._parameterIds = []
            return 
        }

        this._Model.internalModel.eyeBlink._parameterIds = [...this._ParametersValues.eyeBlink]
    }

    loadExpression(index){
        this.getExpressionManager().setExpression(index)
    }

    executeMotionByName = (name, type = '') => {
        let index = this._getMotionByName(type, name)
        this.loadMotion(type, index, 'FORCE')
    }

    _getMotionByName = (type, name) => {
        let motions = this._modelsetting?.motions
        return motions[type].findIndex(motion => motion.Name == name)
    }

    loadMotion = (group, index, priority) => {
        this._Model.motion(group, index, priority)
    }


    getAnchor(){
        return this._Model.anchor
    }

    getScale(){
        return this._Model.scale
    }

    getAlpha(){
        return this.aplha
    }

    getAngle(){
        return this._Model.angle
    }

    getIndexName(){
        return `${this._ModelName}_${this._costume}`
    }

    getSetting(){
        return this._modelsetting
    }

    getUrl(){
        return this._modelsetting?.url
    }

    getGroups(){
        return this._modelsetting?.groups
    }

    getExpressions(){
        return this._modelsetting?.expressions
    }

    getMotions(){
        return this._modelsetting?.motions
    }

    getParamById(id){
        return this._ParametersValues.parameter.find(x => x.parameterIds == id)
    }

    getAllParameters(){
        return this._ParametersValues.parameter
    }

    getPartOpacityById(id){
        return this._ParametersValues.PartOpacity.find(x => x.partId == id)
    }

    getAllPartOpacity(){
        return this._ParametersValues.PartOpacity
    }

    getCoreModel(){
        return this._Model.internalModel.coreModel
    }

    getMotionManager(){
        return this._Model?.internalModel.motionManager
    }

    getFocusController(){
        return this._Model?.internalModel.focusController
    }

    getExpressionManager(){
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
            l2dviewer?.loadBG(`./bg/${val.background_src}`)
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

    //!!!!
    // let test_Range = document.getElementById('test')
    // let test_Num = document.getElementById('testNum')
    // test_Range.value = M.getAngle()
    // test_Num.value = test_Range.value
    // test_Range.oninput = function(e){
    //     test_Num.value = this.value
    //     M.setLookat(this.value)
    // }
    // test_Num.oninput = function(e){
    //     if(this.value == ""){
    //         this.value = test_Range.value
    //         return
    //     }

    //     if(parseInt(this.value) < parseInt(this.min)){
    //         this.value = this.min;
    //     }
    //     if(parseInt(this.value) > parseInt(this.max)){
    //         this.value = this.max;
    //     }
    //     test_Range.value = this.value
    //     M.setLookat(this.value)
        
    // }

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

    l2dviewer = new l2dViewer(document.getElementById('viewer-place'))
    
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
        
        let M = new HeroModel()
        // await M.setModel(costdata.path)
        await M.create(costdata.path)
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
        l2dviewer.setBGColor(String(this.value).replace(/#/, '0x'))
    }

    // let copyrightCheckbox = document.getElementById("copyrightCheckbox");
    // copyrightCheckbox.checked = l2dviewer.copyright
    // copyrightCheckbox.onchange = function(e){
    //     l2dviewer.switchCopyright()
    // }

    document.getElementById('snapshotBtn').onclick = async() => {
        if(!l2dviewer.app) return;
        const renderer = l2dviewer.app.renderer
        const texture = renderer.generateTexture(l2dviewer.app.stage, {
            region : {
                x : 0,
                y : 0,
                width : renderer.width,
                height : renderer.height
            }
        })
        const iamge = await renderer.extract.image(texture);
        let  screenshot = document.createElement('a');
        screenshot.download = 'snapshot.png'
        screenshot.href = iamge.src;
        screenshot.click();
    }

    document.getElementById('model_snapshotBtn').onclick = async() => {
        let container = l2dviewer.containers.get('Models');
        if(!container || !l2dviewer.app) return;
        const iamge = await l2dviewer.app.renderer.extract.image(container);
        let screenshot = document.createElement('a');
        screenshot.download = 'model_snapshot.png'
        screenshot.href = iamge.src;
        screenshot.click();
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