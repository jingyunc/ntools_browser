function load_volume() {
    var volume = new X.volume();
    volume.file = 'volume.nii';

    return volume;
};

function load_surfaces() {
    var leftHemisphere = new X.mesh();
    // var rh = new X.mesh();
    // var p = new X.mesh();

    leftHemisphere.file = '../fsaverage/lh.pial';
    leftHemisphere.color = [1, 1, 1];
    leftHemisphere.opacity = 0.3;

    return [leftHemisphere];
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

window.onload = function() {
    
    // destructure array
    var [threeD, sliceX, sliceY, sliceZ] = setup_renderers();

    volume = load_volume();

    load_electrodes(threeD);

    var [leftHemisphereMesh] = load_surfaces();
    
    sliceX.add(volume);
    sliceX.render();
    
    sliceX.onShowtime = function() {

        // this is triggered manually by sliceX.render() just 2 lines above
        // execution happens after volume is loaded

        sliceY.add(volume);
        sliceY.render();
        sliceZ.add(volume);
        sliceZ.render();

        threeD.add(volume);
        threeD.add(leftHemisphereMesh);

        // fix original camera position
        threeD.camera.position = [0, 360, 0];
        threeD.camera.rotate(new X.vector(450, 0, 0))

        threeD.render(); // this one triggers the loading of LH and then the onShowtime for the 3d renderer
    };  

    // the onShowtime function gets called automatically, just before the first rendering happens
    threeD.onShowtime = function() {
       

        
    
    };  
};
