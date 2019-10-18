window.onload = function() {

    // Subject
    var subj = {
    'ID' : 'NY722',
    'Load' : update
    };

    // create and initialize a 3D renderer
    var r = new X.renderer3D();
    r.init();

    var lh = new X.mesh();
    var rh = new X.mesh();
    var p = new X.mesh();

    var ptMax = 200;
    var pt = [];
    for ( var i = 0; i< ptMax; i++ ) {
        pt[i] = new X.sphere();
    }

    r.camera.position = [0, 0, 200];
    r.render();


    // the onShowtime function gets called automatically, just before the first rendering happens
    r.onShowtime = function() {

        p.visible = false; // hide the mesh since we just want to use the oordinates
        var numberOfPoints = p.points.count;
        //alert(numberOfPoints);
        
        for ( var i = 0; i < numberOfPoints; i++) {            
            var point = p.points.get(i);
            //pt[i] = new X.sphere();
            pt[i].center =  [point[0], point[1], point[2]];
            pt[i].radius = 1.2;
            pt[i].color = [point[2], point[1], point[1]]; 
            pt[i].modified();
            r.add(pt[i]);
        }
        
        // supress the rest points
        for ( var i = numberOfPoints; i < ptMax; i++) {            
            pt[i].radius = 0.001;
            pt[i].color = [0, 0, 0];
            pt[i].modified();
        }
    };  

    function update() {
        lh.file = subj.ID + '/' + subj.ID + '_lh.pial';
        lh.color = [2, 0, 1];
        lh.opacity = 0.3;
                
        rh.file = subj.ID + '/' + subj.ID + '_rh.pial';
        rh.color = [0, 1, 1];
        rh.opacity = 0.2;

        p.file = subj.ID + '/' + subj.ID + '_T1.vtk';
        
        r.add(lh);
        r.add(rh);
        r.add(p);
    }

    // GUI
    function gui() {
        var gui = new dat.GUI();
    
        // Subject info
        var subjgui = gui.addFolder('Subject Info');
        subjgui.add(subj, 'ID');
        subjgui.add(subj,'Load');
        subjgui.open();

        // left hemisphere
        var lhgui = gui.addFolder('Left Hemisphere');
        lhgui.add(lh, 'visible');
        lhgui.add(lh, 'opacity', 0, 1);
        lhgui.addColor(lh, 'color');
        lhgui.open();
        
        // right hemisphere
        var rhgui = gui.addFolder('Right Hemisphere');
        rhgui.add(rh, 'visible');
        rhgui.add(rh, 'opacity', 0, 1);
        rhgui.addColor(rh, 'color');
        rhgui.open();

        // setup the callback
        for (c in gui.__controllers) {
            gui.__controllers[c].onFinishChange(update);
        }
    }

  update();

  gui();

};