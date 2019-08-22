window.onload = function() {

    // create and initialize a 3D renderer
    var r = new X.renderer3D();
    r.init();
    
    // create the left hemisphere mesh
    var lh = new X.mesh();
    // .. attach a Freesurfer .smoothwm mesh
    lh.file = 'files/lh.pial';
    // change the color to a smooth red
    lh.color = [0.7, 0.7, 0.2];
    // add some transparency
    lh.opacity = 0.3;
    
    // ... and for the right hemisphere
    var rh = new X.mesh();
    rh.file = 'files/rh.pial';
    // a smooth green color for this one
    rh.color = [0, 0.7, 0];
    // add some transparency
    rh.opacity = 0.6;

    var p = new X.mesh();
    //p.file = 'http://x.babymri.org/?pits.vtk';
    p.file = 'files/NY722_041919_coor_T1_2019-04-22.vtk';
    
    // add the three objects
    r.add(lh);
    r.add(rh);
    r.add(p);
    
    
    // .. and start the loading and rendering!
    r.camera.position = [0, 0, 200];
    //r.render();
    
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
  
  // .. and render it
  r.render();
  
};
