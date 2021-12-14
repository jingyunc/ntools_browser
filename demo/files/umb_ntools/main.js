var subject = localStorage.getItem("user-search")

function load_volume() {
    var volume = new X.volume()
    if (localStorage.getItem("mode") === "UMB") {
        volume.file = `../${subject}/${subject}_T1.nii`;
        var labelMap = `../${subject}/${subject}_labels.nii`
        if (labelMap) {
            volume.labelmap.file = labelMap
            volume.labelmap.colortable.file = `./colormap.txt`
        }
    } else {
        volume.file = `https://ievappwpdcpvm01.nyumc.org/?file=${subject}_T1.nii`
    }

    return volume;
};

function load_surfaces() {
    var leftHemisphere = new X.mesh();
    var rightHemisphere = new X.mesh();

    if (localStorage.getItem("mode") === "UMB") {
        leftHemisphere.file = `../${subject}/${subject}_lh.pial`
        rightHemisphere.file = `../${subject}/${subject}_rh.pial`
    } else {
        leftHemisphere.file = `https://ievappwpdcpvm01.nyumc.org/?file=${subject}_lh.pial`
        rightHemisphere.file = `https://ievappwpdcpvm01.nyumc.org/?file=${subject}_rh.pial`
    }

    leftHemisphere.color = [1, 1, 1]
    rightHemisphere.color = [1, 1, 1]

    leftHemisphere.opacity = 0.5
    rightHemisphere.opacity = 0.5

    return [leftHemisphere, rightHemisphere];
};

function setup_renderers() {
    var threeDRenderer = new X.renderer3D();
    threeDRenderer.container = '3d';
    threeDRenderer.init();

    var sliceX = new X.renderer2D();
    sliceX.container = 'sliceX';
    sliceX.orientation = 'X';

    sliceX.init();

    var sliceY = new X.renderer2D();
    sliceY.container = 'sliceY';
    sliceY.orientation = 'Y';
    sliceY.init();

    var sliceZ = new X.renderer2D();
    sliceZ.container = 'sliceZ';
    sliceZ.orientation = 'Z';
    sliceZ.init();

    return [threeDRenderer, sliceX, sliceY, sliceZ];
}

window.onload = function () {
    // destructure array
    var [threeD, sliceX, sliceY, sliceZ] = setup_renderers();

    volume = load_volume();

    var [leftHemisphereMesh, rightHemisphereMesh] = load_surfaces();

    threeD.add(leftHemisphereMesh)
    threeD.add(rightHemisphereMesh)
   
    sliceX.add(volume);
    sliceX.render();

    sliceX.onShowtime = function () {
        // this is triggered manually by sliceX.render() just 2 lines above
        // execution happens after volume is loaded

        sliceY.add(volume);
        sliceY.render();
        sliceZ.add(volume);
        sliceZ.render();

        var mySphere = new X.sphere()
        sliceX.add(mySphere)

        threeD.add(volume);
   
        threeD.render(); // this one triggers the loading of LH and then the onShowtime for the 3d renderer
    };

    window.addEventListener('resize', function () {
        threeD.camera.position = [0, 300, 0]
    }, true);

    // the onShowtime function gets called automatically, just before the first rendering happens
    threeD.onShowtime = function () {

        var gui = new dat.GUI()

        var volumeGUI = gui.addFolder('Volume')
        volumeGUI.add(volume, 'opacity', 0, 1)
        volumeGUI.add(volume, 'lowerThreshold', volume.min, volume.max)
        volumeGUI.add(volume, 'upperThreshold', volume.min, volume.max)
        volumeGUI.add(volume, 'windowLow', volume.min, volume.max)
        volumeGUI.add(volume, 'windowHigh', volume.min, volume.max)

        volumeGUI.add(volume, 'indexX', 0, volume.dimensions[0] - 1)
        volumeGUI.add(volume, 'indexY', 0, volume.dimensions[1] - 1)
        volumeGUI.add(volume, 'indexZ', 0, volume.dimensions[2] - 1)
        volumeGUI.open()


        var leftHemisphereGUI = gui.addFolder('Left Hemisphere')
        leftHemisphereGUI.add(leftHemisphereMesh, 'visible')
        leftHemisphereGUI.add(leftHemisphereMesh, 'opacity', 0, 1)
        leftHemisphereGUI.open()

        var rightHemisphereGUI = gui.addFolder('Right Hemisphere')
        rightHemisphereGUI.add(rightHemisphereMesh, 'visible')
        rightHemisphereGUI.add(rightHemisphereMesh, 'opacity', 0, 1)
        rightHemisphereGUI.open()

        var slicesGUI = gui.addFolder('Slices')
        slicesGUI.add(volume, 'visible') 
        slicesGUI.open()

        // fix original camera position
        threeD.camera.position = [0, 300, 0];
   
        load_electrodes(threeD, volumeGUI);

        slicesGUI.__controllers[0].__onChange = () => {
            var xval = volumeGUI.__controllers[5].object.indexX
            var yval = volumeGUI.__controllers[6].object.indexY
            var zval = volumeGUI.__controllers[7].object.indexZ

            volume.children[0].children.forEach(child => child.visible = false)
            volume.children[1].children.forEach(child => child.visible = false)
            volume.children[2].children.forEach(child => child.visible = false)

            volume.children[0].children[Math.floor(xval)].visible = true
            volume.children[1].children[Math.floor(yval)].visible = true
            volume.children[2].children[Math.floor(zval)].visible = true
        }
    };
};
