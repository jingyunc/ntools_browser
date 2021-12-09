// This file contains functions for formatting json data and displaying graphical 
// representations. can possibly revise if we do not want to keep it in that format,
// and just use indices directly

// returns color of electrode
function get_seiztype_color(type) {
  var electrodeColors = {
    // Seizure Type X
    "Early Spread": [1, 1, 0],
    "Onset":        [1, 0, 0],
    "Late Spread":  [0, 1, 0.19],
    "Very Early Spread": [1, 0.35, 0.12],
    "":             [1, 1, 1] // default (no color)
  };
  return electrodeColors[type]
}

function get_int_population_color(type) {
  var electrodeColors = {
    "0": [1, 1, 1],
    "1": [0, 1, 0.19],
    "2": [0, 0, 0.9],
    "3": [1, 0, 1],
    "4": [0, 1, 1],
    "5": [0.27, 0.46, 0.2],
    "6": [0.4, 0.17, 0.57],
    "7": [0.76, 0.76, 0.76],
    "8": [0.46, 0.55, 0.65]
  }

  return electrodeColors[type]
}

// package each electrode together as an object for readability and easier iteration
function get_electrode_object(el, index) {
  return ({
    "elecID": el.elecID[index],
    "xCoor": el.coorX[index],
    "yCoor": el.coorY[index],
    "zCoor": el.coorZ[index],
    "elecType": el.elecType[index],
    "intPopulation": el.intPopulation[index],
    "seizType": el.seizType[index],
    "visible": true, // a default value for later filtering
  })
}

// create the graphical electrode on the canvas
function draw_electrode_fx(el) {
  // destructuring object properties. it is more readable for me, 
  var { xCoor, yCoor, zCoor, seizType, elecID } = el
  elSphere = new X.sphere()

  // var mappedXcoor = map_interval(xCoor, [0, 255], [-127.5, 127.5])
  // var mappedYcoor = map_interval(yCoor, [0, 255], [-127.5, 127.5])
  // var mappedZcoor = map_interval(zCoor, [0, 255], [-127.5, 127.5])

  // elSphere.center = [mappedXcoor, mappedYcoor, mappedZcoor]
  elSphere.center = [xCoor, yCoor, zCoor]

  elSphere.color = get_seiztype_color(seizType)
  elSphere.radius = 1
  elSphere.visible = el.visible
  elSphere.caption = elecID

  return elSphere
}

// this function draws the opaque blue shperes around a selected node
function draw_highlight_fx(el) {
  var { xCoor, yCoor, zCoor, elecID } = el
  elSphere = new X.sphere()

  // var mappedXcoor = map_interval(xCoor, [0, 255], [-127.5, 127.5])
  // var mappedYcoor = map_interval(yCoor, [0, 255], [-127.5, 127.5])
  // var mappedZcoor = map_interval(zCoor, [0, 255], [-127.5, 127.5])

  // elSphere.center = [mappedXcoor, mappedYcoor, mappedZcoor]
  elSphere.center = [xCoor, yCoor, zCoor]

  elSphere.color = [0, 0, 1]
  elSphere.opacity = 0.5
  elSphere.radius = 1.3
  elSphere.visible = false
  elSphere.caption = elecID

  return elSphere
}

// create cylinder between to nodes
function draw_connection_fx(startNode, endNode) {
  var connection = new X.cylinder()
  connection.radius = 0.3
  connection.start = [startNode.xCoor, startNode.yCoor, startNode.zCoor]
  connection.end = [endNode.xCoor, endNode.yCoor, endNode.zCoor]
  connection.visible = false

  return connection
}

// // check if a checkbox is checked, and then set the cooresponding XTK objects visibility
// function filter_visibility(electrodes, spheres, connections, data) {
//   const onsetCheckbox = document.getElementById('onset-checkbox')
//   const earlySpreadCheckbox = document.getElementById('early-spread-checkbox')
//   const lateSpreadCheckbox = document.getElementById('late-spread-checkbox')
//   const unlabeledCheckbox = document.getElementById('unlabeled-checkbox')
//   const functionalMapCheckbox = document.getElementById('functional-map-checkbox')

//   for (const el of electrodes) {
//     if ((!onsetCheckbox.checked && el.seizType === "Onset") ||
//       (!earlySpreadCheckbox.checked && el.seizType === "Early Spread") ||
//       (!lateSpreadCheckbox.checked && el.seizType === "Late Spread") ||
//       (!unlabeledCheckbox.checked && el.seizType === "")) {
//       el.visible = false
//     } else {
//       el.visible = true;
//     }
//   }

//   for (var i = 0; i < spheres.length; i++) {
//     spheres[i].visible = electrodes[i].visible
//   }

//   var { fmapG1, fmapG2 } = data
//   var fmapEntries = fmapG1.length

//   for (var i = 0; i < fmapEntries; i++) {
//     if (functionalMapCheckbox.checked) {
//       connections[i].visible = (electrodes[fmapG1[i] - 1].visible && electrodes[fmapG2[i] - 1].visible)
//     } else {
//       connections[i].visible = false;
//     }
//   }
// }

// finds the two electrodes in the data and calls the cylinder renderer

function draw_fmap_connections(data, electrodes) {
  var { fmapG1, fmapG2 } = data
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
function fill_electrode_ID_box(data, idArray, selectionSpheres) {
  const electrodeMenu = document.getElementById('electrode-menu')
  electrodeMenu.addEventListener('click', event => {
    print_electrode_info(data, event.target.value, idArray, selectionSpheres)
  })
  // append HTML option to drop down menu
  for (const entry of data) {
    const newOption = document.createElement('option')
    newOption.value = entry.elecID
    newOption.innerHTML = entry.elecID
    electrodeMenu.appendChild(newOption)
  }
}

function fill_seizure_type_box(data) {
  const seizureTypes = data.SeizDisplay
  const displayMenu = document.getElementById('seizure-display-menu')

  seizureTypes.forEach(type => {
    const newOption = document.createElement('option')
    newOption.value = type
    newOption.innerHTML = type
    displayMenu.appendChild(newOption)
  })
}

function redraw_fmaps(fmaps, captions) {
  fmaps.forEach((fmap, index) => {
    if (captions[index]) {
      fmap.visible = true
      fmap.caption = captions[index]
    } else {
      fmap.visible = false
      fmap.caption = null
    }
  })
}

function add_event_to_fmap_menu(electrodeData, fmaps) {
  const fmapMenu = document.getElementById('fmap-menu')
  fmapMenu.addEventListener('click', event => {
    if (event.target.value !== "none")
      redraw_fmaps(fmaps, electrodeData[event.target.value])
  })
}

// find the electrode in the options and display the info on the panel
function print_electrode_info(data, electrode, idArray, selectionSpheres) {
  var selected_electrode = data.find(el => el.elecID === electrode)
  if (selected_electrode) {
    update_labels(selected_electrode)
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

function add_mouse_hover(renderer) {
  renderer.interactor.onMouseMove= e => {
    var hoverObject = renderer.pick(e.clientX, e.clientY)
    if (hoverObject !== 0 ) {
      var selectedSphere = renderer.get(hoverObject) 
      if (selectedSphere.c === "sphere" || selectedSphere.c === "cylinder") {
        document.body.style.cursor = 'crosshair'
      } else {
        document.body.style.cursor = 'auto'
        selectedSphere = null
        hoverObject = 0
      }
    }
  }
}

function update_labels(electrode) {
  var {elecID, elecType, intPopulation, seizType} = electrode
  document.getElementById('electrode-id-label-inner').innerHTML = elecID
  document.getElementById('electrode-type-label-inner').innerHTML = elecType
  document.getElementById('int-population-label-inner').innerHTML = intPopulation
  document.getElementById('seiz-type-label-inner').innerHTML = seizType

}

function jump_slices_on_click(renderer, volume, spheres, data, selections) {
  var canvas = document.getElementsByTagName('canvas')[0]
    canvas.addEventListener('click', e => {
      var clickedObject = renderer.pick(e.clientX, e.clientY)
      if (clickedObject !== 0) {
        var clickedSphere = renderer.get(clickedObject)
        if (clickedSphere.c === "sphere") {
          var sphereIndex = spheres.indexOf(clickedSphere)
          // fix crashing when a sphere is clicked twice
          if (sphereIndex > 0) {
            var target = get_electrode_object(data, sphereIndex)
  
            var {elecID, xCoor, yCoor, zCoor} = target
            highlight_selected_electrode(elecID, data.elecID, selections)

            update_labels(target)
  
            const sliderControllers = volume.__controllers

            // sync with electrode menu options
            const electrodeIDMenuOptions = document.getElementById('electrode-menu').options
            electrodeIDMenuOptions.selectedIndex = sphereIndex + 1
           
            var sliderRange = [0, 255]
            var coordinateRange = [-127.5, 127.5]
  
            var mappedXCoor = map_interval(xCoor, coordinateRange, sliderRange)
            var mappedYCoor = map_interval(yCoor, coordinateRange, sliderRange)
            var mappedZCoor = map_interval(zCoor, coordinateRange, sliderRange)
  
            var xSlider = sliderControllers[5]
            var ySlider = sliderControllers[6]
            var zSlider = sliderControllers[7]
        
            xSlider.object.indexX = mappedXCoor
            xSlider.object.kb = mappedXCoor
  
            ySlider.object.indexY = mappedYCoor
            ySlider.object.lb = mappedYCoor
  
            zSlider.object.indexZ = mappedZCoor
            zSlider.object.mb = mappedZCoor
          }
        }
      }
    })
}

function load_electrodes(renderer, volume) {
  (async () => {
    var subject = localStorage.getItem("user-search")
    if (localStorage.getItem("mode") === "UMB") {
      var electrodeData = await (await fetch(`../${subject}/${subject}.json`)).json()
    } else {
      var electrodeData = await (await fetch (`https://ievappwpdcpvm01.nyumc.org/?file=${subject}.json`)).json()
    }

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
    var selectionSpheres = electrodeObjects.map(el => draw_highlight_fx(el))
    selectionSpheres.forEach(el => renderer.add(el))

    // draw the connections between nodes based on fmap arrays
    var fmapConnections = draw_fmap_connections(electrodeData, electrodeObjects, renderer)
    fmapConnections.forEach(connection => renderer.add(connection))

   // filter_visibility(electrodeObjects, electrodeSpheres, fmapConnections, electrodeData)
    fill_seizure_type_box(electrodeData)
    fill_electrode_ID_box(electrodeObjects, electrodeIDs, selectionSpheres)
    jump_slices_on_click(renderer, volume, electrodeSpheres, electrodeData, selectionSpheres)
    add_mouse_hover(renderer)
    add_event_to_fmap_menu(electrodeData, fmapConnections)
   
  })()
}


