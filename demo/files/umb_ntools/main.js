function load_volume() {
    var volume = new X.volume();
    volume.file = 'volume.nii';

    return volume;
};

function load_surfaces() {
    var lh = new X.mesh();
    // var rh = new X.mesh();
    // var p = new X.mesh();

    lh.file = 'lh.pial';
    lh.color = [1, 1, 1];
    lh.opacity = 0.3;
    
    return [lh];
};

function setup_renderers() {
    var r = new X.renderer3D();
    r.container = '3d';
    r.init();

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

    return [r, sliceX, sliceY, sliceZ];
}

window.onload = function() {
    
    all_renderers = setup_renderers();

    threeD = all_renderers[0];
    sliceX = all_renderers[1];
    sliceY = all_renderers[2];
    sliceZ = all_renderers[3];

    volume = load_volume();

    load_electrodes(threeD);

    surfaces = load_surfaces();
    
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
        threeD.add(surfaces[0]);

        threeD.camera.position = [-360, 0, 0];
        threeD.render(); // this one triggers the loading of LH and then the onShowtime for the 3d renderer
    };  

    // the onShowtime function gets called automatically, just before the first rendering happens
    threeD.onShowtime = function() {


        
    
    };  
};
