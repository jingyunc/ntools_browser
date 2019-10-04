window.onload = function() {

  // Subject
  var subj = {
    'ID' : 'NY396',
    'Load' : update
  };

  // create and initialize a 3D renderer
  var r = new X.renderer3D();
  r.init();

  var lh = new X.mesh();
  var rh = new X.mesh();
  var p = new X.mesh();
    
  r.camera.position = [0, 0, 200];
  r.render();

  function update() {
        // create the left hemisphere mesh

        // .. attach a Freesurfer .smoothwm mesh
        lh.file = subj.ID + '/' + subj.ID + '_lh.pial';
        // change the color to a smooth red
        lh.color = [2, 0, 1];
        // add some transparency
        lh.opacity = 0.3;
        
        // ... and for the right hemisphere
        
        rh.file = subj.ID + '/' + subj.ID + '_rh.pial';
        // a smooth green color for this one
        rh.color = [0, 1, 1];
        // add some transparency
        rh.opacity = 0.9;


        //p.file = 'http://x.babymri.org/?pits.vtk';
        //p.file = 'NY741/NY741_autoNY741_coor_T1_2019-08-02.vtk';
        p.file = subj.ID + '/' + subj.ID + '_T1.vtk';
        
        // add the three objects
        r.add(lh);
        r.add(rh);
        r.add(p);
    
        
        // the onShowtime function gets called automatically, just before the first
        // rendering happens
        r.onShowtime = function() {

            p.visible = false; // hide the mesh since we just want to use the
            // coordinates
            
            var numberOfPoints = p.points.count; // in this example 411
            
            // for convenience, a container which holds all spheres
            spheres = new X.object();
            
            // grab the first coordinate triplet
            var firstPoint = p.points.get(0);
            
            // create a new sphere as a template for all other ones
            // this is an expensive operation due to CSG's mesh generation
            var newSphere = new X.sphere();
            newSphere.center = [firstPoint[0], firstPoint[1], firstPoint[2]];
            newSphere.radius = 1.2;
            // newSphere.color = [0, 0, 0.9];
            newSphere.modified(); // since we don't directly add the sphere, we have to
            // call the CSG creator manually
            
            // .. add the newSphere to our container
            spheres.children.push(newSphere);
            
            // loop through the points and copy the created sphere to a new X.object
            for ( var i = 1; i < numberOfPoints; i++) {
            
            var point = p.points.get(i);
            
            // copy the template sphere over to avoid generating new ones
            var copySphere = new X.object(newSphere);
            // .. and move it to the correct position
            copySphere.transform.translateX(point[0] - firstPoint[0]);
            copySphere.transform.translateY(point[1] - firstPoint[1]);
            copySphere.transform.translateZ(point[2] - firstPoint[2]+10);
            copySphere.color = [point[2], point[1], point[1]];
            // .. add the copySphere to our container
            spheres.children.push(copySphere);
        
        }
        
        // add the sphere container to the renderer
        r.add(spheres);

    };
  
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