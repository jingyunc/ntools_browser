var subject = localStorage.getItem("user-search") // get the subject name from search page

/**
 * loads the .nii data into a X.volume and returns it
 * @returns {X.volume}
 */
function load_volume() {
    var volume = new X.volume()
    if (localStorage.getItem("mode") === "UMB") {
        volume.file = `../${subject}/${subject}_T1.nii`;
        volume.labelmap.file = labelMap = `../${subject}/${subject}_default_labels.nii`
        volume.labelmap.colortable.file = `./colormap_seiztype.txt`
        volume.modified()
    } else {
        volume.file = `https://ievappwpdcpvm01.nyumc.org/?file=${subject}_T1.nii`
    }

    return volume;
};

/**
 * Loads the .pial data into two X.meshes and returns them
 * @returns {[X.mesh, X.mesh]}
 */
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
/**
 * Initializes the renderers and sets them to their needed container
 * @returns {[X.renderer3D, x.renderer2D, X.renderer2D, X.renderer2D]}
 */

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
    // destructure array of renderers
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

        threeD.add(volume);
   
        threeD.render(); // this one triggers the loading of LH and then the onShowtime for the 3d renderer
    };

    // the onShowtime function gets called automatically, just before the first rendering happens
    threeD.onShowtime = function () {

        // add the GUI once data is done loading
        var gui = new dat.GUI()

        var volumeGUI = gui.addFolder('Volume')
        volumeGUI.add(volume, 'opacity', 0, 1)
        volumeGUI.add(volume, 'lowerThreshold', volume.min, volume.max)
        volumeGUI.add(volume, 'upperThreshold', volume.min, volume.max)
        volumeGUI.add(volume, 'windowLow', volume.min, volume.max)
        volumeGUI.add(volume, 'windowHigh', volume.min, volume.max)

        // slice indicies
        volumeGUI.add(volume, 'indexX', 0, volume.dimensions[0] - 1)
        volumeGUI.add(volume, 'indexY', 0, volume.dimensions[1] - 1)
        volumeGUI.add(volume, 'indexZ', 0, volume.dimensions[2] - 1)
        volumeGUI.open()

        // hemisphere GUIs
        var leftHemisphereGUI = gui.addFolder('Left Hemisphere')
        leftHemisphereGUI.add(leftHemisphereMesh, 'visible')
        leftHemisphereGUI.add(leftHemisphereMesh, 'opacity', 0, 1)
        leftHemisphereGUI.open()

        var rightHemisphereGUI = gui.addFolder('Right Hemisphere')
        rightHemisphereGUI.add(rightHemisphereMesh, 'visible')
        rightHemisphereGUI.add(rightHemisphereMesh, 'opacity', 0, 1)
        rightHemisphereGUI.open()

        // making slices invisible
        var slicesGUI = gui.addFolder('Slices')
        slicesGUI.add(volume, 'visible') 
        slicesGUI.open()

        // fix original camera position
        threeD.camera.position = [0, 300, 0];

        load_electrodes(threeD, volumeGUI, volume);

        // this should ideally reset the colormap and labelmap of volume
        // whenever the menu is changed. It also will put the appropriate
        // color legend on the screen

        const displayMenu = document.getElementById('seizure-display-menu')
        const seizTypeList = document.getElementById('seiztype-list')
        const intPopList = document.getElementById('int-pop-list')
        displayMenu.addEventListener('change', event => {
          event.preventDefault()
          event.stopPropagation()
          const selectedSeizType = event.target.value

          if (selectedSeizType === "intPopulation") {
            intPopList.style.visibility = 'visible'
            seizTypeList.style.visibility = 'hidden'
           // volume.file = `../${subject}/${subject}_T1.nii`;
            volume.labelmap.file = `../${subject}/${subject}_intPopulation_labels.nii`
            volume.labelmap.colortable.file = './colormap_intpop.txt'
          } else {
            seizTypeList.style.visibility = 'visible'
            intPopList.style.visibility = 'hidden'
          //  volume.file = `../${subject}/${subject}_T1.nii`;
            volume.labelmap.file = `../${subject}/${subject}_${selectedSeizType}_labels.nii`
            volume.labelmap.colortable.file = './colormap_seiztype.txt'
          }

          volume.modified()
          threeD.resetViewAndRender()
        })
    };
};
