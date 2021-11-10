// This file contains functions for formatting json data and displaying graphical 
// representations. can possibly revise if we do not want to keep it in that format,
// and just use indices directly

// returns color of electrode
function get_color(type) {
  var electrodeColors = {
    "Early Spread" : [1, 1, 0],
    "Onset"        : [1, 0, 0],
    "Late Spread"  : [0, 1, 0],
    ""             : [1, 1, 1] // default (no color)
  };
  return electrodeColors[type]
}

// package each electrode together as an object for readability and easier iteration
function get_electrode_object(el, index) {
  return ({
    "elecID"   : el.elecID[index],
    "xCoor"    : el.coorX[index],
    "yCoor"    : el.coorY[index],
    "zCoor"    : el.coorZ[index],
    "elecType" : el.elecType[index],
    "intPopulation" : el.intPopulation[index],
    "seizType" : el.seizType[index],
    "visible"  : true // a default value for later filtering
  })
}

// create the graphical electrode on the canvas
function draw_electrode_fx(el) {
  // destructuring object properties. it is more readable for me, 
  var {xCoor, yCoor, zCoor, seizType, elecID} = el
  elSphere = new X.sphere()
  elSphere.center = [xCoor, yCoor, zCoor]
  elSphere.color = get_color(seizType)
  elSphere.radius = 1
  elSphere.visible = el.visible
  elSphere.caption = elecID

  elSphere.transform.matrix = 
    new Float32Array([
      -1, 0, 0, 0,
       0, 0, 1, 0,
       0, -1, 0, 0,
       0, 0, 0, 1
    ])

  elSphere.transform.flipX()

  return elSphere
}

// this function draws the opaque blue shperes around a selected node
function draw_selection_fx(el) {
  var {xCoor, yCoor, zCoor} = el
  elSphere = new X.sphere()
  elSphere.center = [xCoor, yCoor, zCoor]
  elSphere.color = [0, 0, 1]
  elSphere.opacity = 0.7
  elSphere.radius = 1.5
  elSphere.visible = false

  elSphere.transform.matrix = 
    new Float32Array([
      -1, 0, 0, 0,
       0, 0, 1, 0,
       0, -1, 0, 0,
       0, 0, 0, 1
  ])
    
  elSphere.transform.flipX()

  return elSphere
}

// create cylinder between to nodes
function draw_connection_fx(startNode, endNode) {
  var connection = new X.cylinder()
  connection.radius = 0.3
  connection.start = [startNode.xCoor, startNode.yCoor, startNode.zCoor]
  connection.end = [endNode.xCoor, endNode.yCoor, endNode.zCoor]

  connection.transform.matrix = 
    new Float32Array([
      -1, 0, 0, 0,
       0, 0, 1, 0,
       0, -1, 0, 0,
       0, 0, 0, 1
    ])
    
  connection.transform.flipX()

  return connection
}

// check if a checkbox is checked, and then set the cooresponding XTK objects visibility
function filter_visibility(electrodes, spheres, connections, data) {
  const onsetCheckbox = document.getElementById('onset-checkbox')
  const earlySpreadCheckbox = document.getElementById('early-spread-checkbox')
  const lateSpreadCheckbox = document.getElementById('late-spread-checkbox')
  const unlabeledCheckbox = document.getElementById('unlabeled-checkbox')
  const functionalMapCheckbox = document.getElementById('functional-map-checkbox')

  for (const el of electrodes) {
    if ((!onsetCheckbox.checked && el.seizType === "Onset") || 
        (!earlySpreadCheckbox.checked && el.seizType === "Early Spread") ||
        (!lateSpreadCheckbox.checked && el.seizType === "Late Spread") ||
        (!unlabeledCheckbox.checked && el.seizType === "")) 
    { 
      el.visible = false
    } else {
      el.visible = true;
    }
  }

  for (var i = 0; i < spheres.length; i++) {
    spheres[i].visible = electrodes[i].visible
  }

  var {fmapG1, fmapG2} = data
  var fmapEntries = fmapG1.length

  for (var i = 0; i < fmapEntries; i++) {
    if (functionalMapCheckbox.checked) {
      connections[i].visible = (electrodes[fmapG1[i] - 1].visible && electrodes[fmapG2[i] - 1].visible)
    } else {
      connections[i].visible = false;
    }
  }
}

// finds the two electrodes in the data and calls the cylinder renderer
function draw_fmap_connections(data, electrodes) {
  var {fmapG1, fmapG2} = data
  var fmapEntries = fmapG1.length

  var connections = []

  for (var i = 0; i < fmapEntries; i++) {
    var electrodeStartIndex = fmapG1[i]
    var electrodeEndIndex = fmapG2[i]

    // since the data is generated from matlab, the indices need to be offset to 0-based
    var startNode = electrodes[electrodeStartIndex - 1]
    var endNode = electrodes[electrodeEndIndex - 1]

    if (startNode && endNode) {
      connections.push(draw_connection_fx(startNode, endNode))
    }
  }

  return connections
}

// function for adding options based on electrode IDs
function fill_electrode_options(data, idArray, selectionSpheres) {
  const electrodeMenu = document.getElementById('electrode-menu')
  electrodeMenu.addEventListener('click', event => 
    print_electrode_info(data, event.target.value, idArray, selectionSpheres))
  // append HTML option to drop down menu
  for (const entry of data) {
    const newOption = document.createElement('option')
    newOption.value = entry.elecID
    newOption.innerHTML = entry.elecID
    electrodeMenu.appendChild(newOption)
  }
}

// find the electrode in the options and display the info on the panel
function print_electrode_info(data, electrode, idArray, selectionSpheres) {
  var selected_electrode = data.find(el=> el.elecID === electrode)
  if (selected_electrode) {
    var {elecType, intPopulation, seizType} = selected_electrode
    document.getElementById('electrode-type-label-inner').innerHTML = elecType
    document.getElementById('int-population-label-inner').innerHTML = intPopulation
    document.getElementById('seiz-type-label-inner').innerHTML = seizType

    highlight_selected_electrode(electrode, idArray, selectionSpheres)
  } else {
    console.log(`Could not find electrode with ID of ${electrode}`)
  }
}

// find the specific electrode to highlight
function highlight_selected_electrode(el, idArray, selector) {
  for (var i = 0; i < idArray.length; i++) {
    if (idArray[i] === el) {
      selector[i].visible = true;
    } else {
      selector[i].visible = false;
    }
  }
}

// inspired by https://stackoverflow.com/questions/5731863/mapping-a-numeric-range-onto-another
function map_interval(input, inputRange, outputRange) {
  var [inputStart, inputEnd] = inputRange
  var [outputStart, outputEnd] = outputRange
  return outputStart + ((outputEnd - outputStart) / (inputEnd - inputStart))
                     * (input - inputStart)
}        

function map_coordinate_to_slice_value(coordinate, midPoint) {
  if (coordinate < midPoint) {
    coordinate = (midPoint - coordinate) * -2
  } else if (coordinate === midPoint) {
    coordinate = 0
  }

  return coordinate / 2
}

// mainly for testing that canvas will draw in right place
function map_width_to_coordinate(sliceWindow) {
  var widthInterval = [0, sliceWindow.clientWidth]
  var heightInterval = [0, sliceWindow.clientHeight]
  var boxInterval = [-127.5, 127.5]

  sliceWindow.onclick = function(e) {
    var rect = e.target.getBoundingClientRect()
    var x = e.clientX - rect.left
    var y = e.clientY - rect.top
    var mappedX = map_interval(x, widthInterval, boxInterval)
    var mappedY = map_interval(y, heightInterval, boxInterval)
    console.log(`(${mappedX}, ${mappedY})`)
  }
}

function is_nearby_electrode(sliderCoordinate, elCoordinate) {
  const tolerance = 1
  return Math.abs(sliderCoordinate - elCoordinate) < tolerance
}

function get_nearby_electrodes(sliderCoordinate, data) {
  var nearby = data.filter(electrode => is_nearby_electrode(sliderCoordinate, electrode.xCoor))
  console.log(nearby)
  return nearby
}



function draw_electrodes_on_slices(data, volume) {
  const sliceXdiv = document.getElementById('sliceX')
  const sliceYdiv = document.getElementById('sliceY')
  const sliceZdiv = document.getElementById('sliceZ')

  map_width_to_coordinate(sliceXdiv)
  map_width_to_coordinate(sliceYdiv)
  map_width_to_coordinate(sliceZdiv)

  const {coorX, coorY, coorZ} = data
  const sliderControllers = volume.__controllers

  var xSlider = sliderControllers[5]
  var ySlider = sliderControllers[6]
  var zSlider = sliderControllers[7]

  var sliderRange = [0, 255]
  var coordinateRange = [-127.5, 127.5]

  xSlider.onChange(() => {
    var sliceXCoordinate = xSlider.object.kb
    var mappedCoordinate = map_interval(sliceXCoordinate, sliderRange, coordinateRange)
    get_nearby_electrodes(mappedCoordinate, data)
  })

  ySlider.onChange(() => {
    var sliceYCoordinate = ySlider.object.lb
    var mappedCoordinate = map_interval(sliceYCoordinate, sliderRange, coordinateRange)
  })

  zSlider.onChange(() => {
    var sliceZCoordinate = zSlider.object.mb
    var mappedCoordinate = map_interval(sliceZCoordinate, sliderRange, coordinateRange)
  })

}








function load_electrodes(renderer, volume) {
  (async () => {
    console.log("Loading Data...")
    var electrodeData = await(await fetch('./sample.json')).json();
    console.log("Done")

    document.getElementById('subject-id-lbl').innerHTML = electrodeData.subjID
    document.getElementById('num-seiz-types-lbl').innerHTML = electrodeData.totalSeizType

    var electrodeIDs = electrodeData.elecID

    // can choose any property here, but it must have same length as other properties
    var numberOfElectrodes = electrodeData.coorX.length;

    // create an array of electrode objects to access by property
    var electrodeObjects = Array
      .apply(null, Array(numberOfElectrodes))
      .map((_, index) => get_electrode_object(electrodeData, index))

    // create an array of electrode spheres we can access via a closure
    var electrodeSpheres = electrodeObjects.map(el => draw_electrode_fx(el))
    electrodeSpheres.forEach(el => renderer.add(el))

    // array of spheres that will show a highlighted sphere. default invisible
    var selectionSpheres = electrodeObjects.map(el => draw_selection_fx(el))
    selectionSpheres.forEach(el => renderer.add(el))

    // draw the connections between nodes based on fmap arrays
    var fmapConnections = draw_fmap_connections(electrodeData, electrodeObjects, renderer)
    fmapConnections.forEach(connection => renderer.add(connection))
    
    filter_visibility(electrodeObjects, electrodeSpheres, fmapConnections, electrodeData)
    fill_electrode_options(electrodeObjects, electrodeIDs, selectionSpheres)

    draw_electrodes_on_slices(electrodeObjects, volume)


    // var sphere = new X.sphere()
    // sphere.radius = 4
    // sphere.center = [127.5, 0, 0]
    // renderer.add(sphere)

    // event listeners really should be in their own function, but they also need to access
    // the array of XTK spheres
    // might be able to get away with using just one
    document
      .getElementById('unlabeled-checkbox')
      .addEventListener('click', 
        () => filter_visibility(electrodeObjects, electrodeSpheres, fmapConnections, electrodeData))

    document
      .getElementById('onset-checkbox')
      .addEventListener('click', 
        () => filter_visibility(electrodeObjects, electrodeSpheres, fmapConnections, electrodeData))

    document
      .getElementById('early-spread-checkbox')
      .addEventListener('click', 
        () => filter_visibility(electrodeObjects, electrodeSpheres, fmapConnections, electrodeData))

    document
      .getElementById('late-spread-checkbox')
      .addEventListener('click', 
        () => filter_visibility(electrodeObjects, electrodeSpheres, fmapConnections, electrodeData))
        
    document
      .getElementById('functional-map-checkbox')
      .addEventListener('click', 
        () => filter_visibility(electrodeObjects, electrodeSpheres, fmapConnections, electrodeData))
  })();
}


