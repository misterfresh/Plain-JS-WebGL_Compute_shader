import {GUI} from '/dependencies/dat.gui.js'

export class GUIPanel {
    num;
    separateWeight;
    alignmentWeight;
    cohesionWeight;

    resetFunction;

    constructor() {
        this.num = 0;
        this.reset();
    }

    reset() {
        this.separateWeight = 3.0;
        this.alignmentWeight = 1.0;
        this.cohesionWeight = 1.0;
    }

    static setGUITitle(gui, propertyName, title) {
        let propertyList = gui.domElement.getElementsByClassName('property-name');
        let length = propertyList.length;
        for (let i = 0; i < length; i++) {
            let element = propertyList[i];
            if (element.innerHTML === propertyName) {
                element.innerHTML = title;
            }
        }
    }
}
