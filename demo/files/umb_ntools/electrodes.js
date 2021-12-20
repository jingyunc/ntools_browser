// This file contains functions for formatting json data and displaying graphical 
// representations. can possibly revise if we do not want to keep it in that format,
// and just use indices directly

// ONE MAJOR POTENTIAL POINT OF CONFUSION.
// This file is large, and since I didn't want to use many globals, many functions 
// take lots of parameters and it can be a bit confusing to keep track of which parameter
// represents which data. The most confusing part you may run into is keeping straight what an 
// "electrodeObject" is vs an "electrodeSphere"
// An electrodeObject is a bundled javascript object that contains a data point for each property of an electrode.
// I know that "object" is a very ambiguous name. I am open to suggestions. Electrode Objects look like this
// for example

// {
//    elecID: G01
//    xCoor: 50,
//    yCoor: 70,
//    zCoor:, 90,
//      ...
// }

// an Electrode Sphere, on the other hand, reads from an electrode object to make an XTK sphere rendered to the screen
// with those properties. In general, I just find it so much easier to work with an array of objects, rather than
// one giant object full of arrays.

// returns color of electrode
/**
 * 
 * @param {string} type - seizure type
 * @returns {array} - the RGB color
 */
function get_seiztype_color(type) {

  // if type is null, return white
  if (!type) return [1, 1, 1]

  // the JSON is not always the same form for strings, so we trim space and make lowercase
  var lowerCaseType = type.toString().toLowerCase().replace(/\s+/g, ' ').trim()

  var electrodeColors = {
    // Seizure Type X
    "early spread": [1, 1, 0],
    "onset":        [1, 0, 0],
    "late spread":  [0, 1, 0.19],
    "very early spread": [1, 0.35, 0.12],
    "rapid spread": [0, 0, 1],
    "early onset": [0, 1, 1],
    // int pop
    "0": [1, 1, 1],
    "1": [0, 1, 0.19],
    "2": [0, 0, 0.9],
    "3": [1, 0, 1],
    "4": [0, 1, 1],
    "5": [0.27, 0.46, 0.2],
    "6": [0.4, 0.17, 0.57],
    "7": [0.76, 0.76, 0.76],
    "8": [0.46, 0.55, 0.65],
    "":  [1, 1, 1] // default (no color)
  };
  return electrodeColors[lowerCaseType]
}

// package each electrode together as an object for readability and easier iteration
/**
 * 
 * @param {JSON} el - the JSON data 
 * @param {number} index 
 * @param {array} bBox - original bounding box for electrodes. will be reset after call
 * @returns {object} - an object with all of the JSON properties shared at an index
 */
function get_electrode_object(el, index, bBox) {
  // set default to first seizure display
  var defaultSeizType = el.SeizDisplay[0]
  var [xOffset, yOffset, zOffset] = bBox

  // creates an electrode object based on the index of the JSON properties.
  // coordinates are offset by the bounding box
  var electrodeObject = {
    "elecID": el.elecID[index],
    "xCoor": (el.coorX[index] + xOffset),
    "yCoor": (el.coorY[index] + yOffset),
    "zCoor": (el.coorZ[index] + zOffset),
    "elecType": el.elecType[index],
    "intPopulation": el.intPopulation[index],
    "seizType": el[defaultSeizType][index],
    "visible": true, // a default value for later filtering
  }

  // the slice in which the electrode appears, based on the coordinates
  // have to redo the offset of the particular object
  electrodeObject.xSlice = Math.round(map_interval(
    (electrodeObject.xCoor - xOffset), [-127.5, 127.5], [0, 255]
  ))

  electrodeObject.ySlice = Math.round(map_interval(
    (electrodeObject.yCoor - yOffset), [-127.5, 127.5], [0, 255]
  ))

  electrodeObject.zSlice = Math.round(map_interval(
    (electrodeObject.zCoor - zOffset), [-127.5, 127.5], [0, 255]
  ))

  return electrodeObject
}

// create the graphical electrode on the canvas
function draw_electrode_fx(el) {
  // destructuring object properties. it is more readable for me, 
  var { xCoor, yCoor, zCoor, elecID, seizType, elecType } = el

  elSphere = new X.sphere()

  elSphere.center = [xCoor, yCoor, zCoor]
  // create the smaller magenta electrodes of this particular type
  if (elecType === "EG" || elecType === "MG") {
    elSphere.color = [1, 0, 1]
    elSphere.radius = 1 / 3
  } else {
    elSphere.color = get_seiztype_color(seizType)
    elSphere.radius = 1
  }
  elSphere.visible = el.visible
  elSphere.caption = elecID
 
  return elSphere
}

// this function draws the opaque blue shperes around a selected node
function draw_highlight_fx(el) {
  var { xCoor, yCoor, zCoor, elecID, elecType } = el
  elSphere = new X.sphere()

  elSphere.center = [xCoor, yCoor, zCoor]

  elSphere.color = [0, 0, 1]
  elSphere.opacity = 0.5
  if (elecType === "EG" || elecType === "MG") {
    elSphere.radius = 1.3 / 5
  } else {
    elSphere.radius = 1.3
  }
  elSphere.visible = false
  elSphere.caption = elecID
 // elSphere.modified()

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

// create a new X.cyilnder highlight between two nodes
function draw_fmap_highlight_fx(fmap) {
  var { start, end } = fmap
  var highlight = new X.cylinder()
  highlight.radius = 0.4
  highlight.start = start
  highlight.end = end
  highlight.opacity = 0.5
  highlight.color = [0, 0, 1]
  highlight.visible = false

  return highlight
}


// finds the two electrodes in the data and calls the cylinder renderer
/**
 * 
 * @param {JSON} data 
 * @param {array} electrodes - Electrode Objects
 * @returns {array} - array of X.cyilinders
 */
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

// function for adding options based on electrode IDs and jumping slices when one is 
// selected
/**
 * 
 * @param {array} elObjects 
 * @param {array} idArray 
 * @param {array} selectionSpheres 
 * @param {JSON} data 
 * @param {X.volume} volume 
 */
function fill_electrode_ID_box(elObjects, idArray, selectionSpheres, data, volume) {
  const electrodeMenu = document.getElementById('electrode-menu')
  electrodeMenu.addEventListener('click', event => {
    print_electrode_info(elObjects, event.target.value, idArray, selectionSpheres, data)
    var correspondingData = elObjects.find(e => e.elecID === event.target.value)

    if (event.target.value !== "None" && correspondingData) {

      const sliderControllers = volume.__controllers
      const { xSlice, ySlice, zSlice } = correspondingData
  
      var xSlider = sliderControllers[5]
      var ySlider = sliderControllers[6]
      var zSlider = sliderControllers[7]
  
      xSlider.object.indexX = xSlice
      ySlider.object.indexY = ySlice
      zSlider.object.indexZ = zSlice
    }
  })
  // append HTML option to drop down menu
  for (const entry of elObjects) {
    const newOption = document.createElement('option')
    newOption.value = entry.elecID
    newOption.innerHTML = entry.elecID
    electrodeMenu.appendChild(newOption)
  }
}

/**
 * 
 * @param {JSON} data 
 * @param {array} spheres 
 * @param {array} fmaps 
 */
function fill_seizure_type_box(data, spheres, fmaps) {
  const seizureTypes = data.SeizDisplay
  const displayMenu = document.getElementById('seizure-display-menu')

  // make ALL fmaps visible if user selects "Fun Mapping"
  displayMenu.addEventListener('change', event => {
    event.preventDefault()
    event.stopPropagation()
    if (event.target.value === "funMapping"){
      fmaps.forEach(fmap => fmap.visible = true)
    }

    const selectedSeizType = data[event.target.value]
    spheres.forEach((sphere, index) => {
      sphere.color = get_seiztype_color(selectedSeizType[index])
    })
  })

  // create the menu options for all of patients seizure types
  seizureTypes.forEach(type => {
    const newOption = document.createElement('option')
    newOption.value = type
    newOption.innerHTML = type
    displayMenu.appendChild(newOption)
  })
}
// redraw the fmaps, showing only the ones that have a caption
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
/**
 * 
 * @param {array} electrodeData - The electrode objects
 * @param {array} fmaps - the X.cyilinders
 * @param {array} fmapHighlights - the X.cylinders which highlight
 */
function add_event_to_fmap_menu(electrodeData, fmaps, fmapHighlights) {
  const fmapMenu = document.getElementById('fmap-menu')
  fmapMenu.addEventListener('click', event => {
    if (event.target.value !== "none") {
      redraw_fmaps(fmaps, electrodeData[event.target.value])
      document.getElementById('fmap-caption').innerText = 'No Functional Mapping Selected'
    } else {
      fmaps.forEach(fmap => fmap.visible = false)
    }
    fmapHighlights.forEach(fmap => fmap.visible = false)
  })
}

// find the electrode in the options and display the info on the panel
/**
 * 
 * @param {array} elObjects - the electrode object array
 * @param {string} ID - the ID from the ID array
 * @param {array} idArray - full list of IDs
 * @param {array} selectionSpheres - opaque blue spheres that surround an electrode
 * @param {JSON} data 
 */
function print_electrode_info(elObjects, ID, idArray, selectionSpheres, data) {
  // find the electrode with the ID being accessed
  var selected_electrode = elObjects.find(el => el.elecID === ID)
  if (selected_electrode) {
    update_labels(selected_electrode, data)
    highlight_selected_electrode(ID, idArray, selectionSpheres)
  } else {
    console.log(`Could not find electrode with ID of ${ID}`)
  }
}

// find the specific electrode to highlight by making all but one invisible
function highlight_selected_electrode(ID, idArray, selector) {
  for (var i = 0; i < idArray.length; i++) {
    if (idArray[i] === ID) {
      selector[i].visible = true;
    } else {
      selector[i].visible = false;
    }
  }
}

// make an electrode fmap highlighted by making all but one invisible
function highlight_selected_fmap(fmapHighlights, index) {
  fmapHighlights.forEach(fmap => fmap.visible = false)
  fmapHighlights[index].visible = true
}

// inspired by https://stackoverflow.com/questions/5731863/mapping-a-numeric-range-onto-another
/**
 * 
 * @param {number} input 
 * @param {array} inputRange 
 * @param {array} outputRange 
 * @returns {number}
 * 
 * This is the function that can map a coordinate on one interval to a coodinate on another.
 * This is primarily how we get a coordinate on the range of [-127.5, 127.5] to a slice index
 * on [0, 255]. This was originally called in multiple places, but it should now only be 
 * called when each electrode object is created. Since we always use thw two above intervals,
 * our conversion fraction is always one. But it might be useful in other cases, so it is good
 * to keep as is.
 */
function map_interval(input, inputRange, outputRange) {
  var [inputStart, inputEnd] = inputRange
  var [outputStart, outputEnd] = outputRange
  return outputStart + ((outputEnd - outputStart) / (inputEnd - inputStart))
    * (input - inputStart)
}

// changes the mosue to a crosshair for responsive selection
function add_mouse_hover(renderer) {
  renderer.interactor.onMouseMove= e => {
    var hoverObject = renderer.pick(e.clientX, e.clientY)
    if (hoverObject !== 0 ) {
      var selectedSphere = renderer.get(hoverObject) 
 
      if (selectedSphere.g === "sphere" || selectedSphere.g === "cylinder") {
        document.body.style.cursor = 'crosshair'
      } else {
        selectedSphere.visible = true
        document.body.style.cursor = 'auto'
        selectedSphere = null
        hoverObject = 0
      }
    }
  }
}
/**
 * 
 * @param {object} electrode - the selected electrode object
 * @param {JSON} data - the JSON
 * 
 * It might be a bit foolish to have the data in two different formats like this. It would
 * be better if we could have it all as one form, but there are times when having the ready
 * made arrays from the JSON is very useful
 */

function update_labels(electrode, data) {
  var {elecType, intPopulation} = electrode

  var seizTypeMenu = document.getElementById('seizure-display-menu')
  var intPopulationLabel = document.getElementById('int-population-label-inner')
  var seizTypeLabel = document.getElementById('seiz-type-label-inner')

  var selectedSeizType = seizTypeMenu.options[seizTypeMenu.selectedIndex].value
  var seizureTypeValues = data[selectedSeizType]
  var allElectrodeIDs = data.elecID

  document.getElementById('electrode-id-label-inner').innerHTML = electrode.elecID
  document.getElementById('electrode-type-label-inner').innerHTML = elecType
  if (selectedSeizType === "intPopulation") {
    intPopulationLabel.innerHTML = intPopulation
    seizTypeLabel.innerHTML = ''
  } else {
    seizTypeLabel.innerHTML = seizureTypeValues[allElectrodeIDs.indexOf(electrode.elecID)]
    intPopulationLabel.innerHTML = ''
  }
}

/**
 * 
 * @param {X.renderer3D} renderer  - The main renderer
 * @param {X.volume} volume        - The volume displayed on slices
 * @param {array} spheres          - Array of X.spheres that represent electrodes
 * @param {JSON} data              - Original JSON data
 * @param {array} selections       - Opaque blue spheres that highlight an electrode
 * @param {array} IDs              - Array of elecIDs
 * @param {array} electrodeObjects - array of data packaged into objects
 * @param {array} fmaps            - Array of X.cylinders
 * @param {array} fmapHighlights   - Opaque blue cyilnders that surround fmaps
 * 
 * This function is responsible for way too much. Would be good to find a way to break
 * it down into more reasonable components. It adds an event listener to the canvas,
 * does object picking, highlights an electrode, jumps the slices, and displays
 * captions on the panel
 */

function jump_slices_on_click(
  renderer, volume, spheres, data, 
  selections, IDs, electrodeObjects,
  fmaps, fmapHighlights
) {
  // get the main canvas
  var canvas = document.getElementsByTagName('canvas')[0]
    canvas.addEventListener('click', e => {
      // get an objects ID and pass it to renderer.get
      var clickedObject = renderer.pick(e.clientX, e.clientY)
      // check if it actually has an ID
      if (clickedObject !== 0) {
        var selectedObject = renderer.get(clickedObject)
        // ".g" is an object property that corresponds to the selected X.object's name
        if (selectedObject.g === "sphere") {
          // find the actual electrode in the array of XTK spheres
          var sphereIndex = spheres.indexOf(selectedObject)
          
          // fix crashing when a sphere is clicked twice. if no index is found, it will choose
          // -1, causing it to loop forever
          if (sphereIndex >= 0) {
            // electrodeObjects != xtk spheres!! The electrode objects are an array of objects. the OOP
            // style allows for all their data points to be bundled together
            var target = electrodeObjects[sphereIndex]
            
            // destructure out the needed properties
            var {elecID, xSlice, ySlice, zSlice} = target
            
            // highlight and show the needed captions on the menu
            highlight_selected_electrode(elecID, IDs, selections)
            update_labels(target, data)
       
            // the controllers from dat.gui
            const sliderControllers = volume.__controllers

            // sync with electrode menu options
            const electrodeIDMenuOptions = document.getElementById('electrode-menu').options
            electrodeIDMenuOptions.selectedIndex = sphereIndex + 1
           
            // IMPORTANT! Since these are static indices, they will have to be changed if new options are
            // ever added to dat.gui before the slider controllers
            var xSlider = sliderControllers[5]
            var ySlider = sliderControllers[6]
            var zSlider = sliderControllers[7]

            // move to the index property that matches with the slice number of the electrode
            xSlider.object.indexX = xSlice
            ySlider.object.indexY = ySlice
            zSlider.object.indexZ = zSlice
            
          }
        } else if (selectedObject.g === "cylinder") {
          // for an fmap, we do the same thing. check if it's not -1 (meaning found),
          // highlight, and display the caption
          var cylinderIndex = fmaps.indexOf(selectedObject)
          if (cylinderIndex >= 0) {
            document.getElementById('fmap-caption').innerText = selectedObject.caption
            highlight_selected_fmap(fmapHighlights, cylinderIndex)
          }
        }
      }
    }) // end of event lsitener
}

function load_electrodes(renderer, volumeGUI, volume) {
  // for now, the only way I know how to load a JSON in vanilla JS is with async/await. Some of these
  // calls may have to be switched back to jQuery if it doesn't work
  (async () => {
    var subject = localStorage.getItem("user-search")
    if (localStorage.getItem("mode") === "UMB") {
      var electrodeData = await (await fetch(`../${subject}/${subject}.json`)).json()
    } else {
      var electrodeData = await (await fetch (`https://ievappwpdcpvm01.nyumc.org/?file=${subject}.json`)).json()
    }
    
    // this is a work-around from a glitch with the "show all tags" button. we have to offset each coordinate
    // by the bounding box, then reset it. hopefully this can be fixed one day
    const oldBoundingBox = renderer.u

    document.getElementById('subject-id-lbl').innerHTML = electrodeData.subjID
    document.getElementById('num-seiz-types-lbl').innerHTML = electrodeData.totalSeizType

    // contains the array of IDs from the JSON
    var electrodeIDs = electrodeData.elecID

    // can choose any property here, but it must have same length as other properties to work
    var numberOfElectrodes = electrodeData.coorX.length;

    // create an array of electrode objects to access by property (e.g., object.elecID, object.xCoor, ...)
    var electrodeObjects = Array
      .apply(null, Array(numberOfElectrodes))
      .map((_, index) => get_electrode_object(electrodeData, index, oldBoundingBox))

    // create an array of electrode spheres (XTK spheres) and render them
    var electrodeSpheres = electrodeObjects.map(el => draw_electrode_fx(el, renderer))
    electrodeSpheres.forEach(el => renderer.add(el))

    // create an array of sphere IDs for the "show all tags" button
    var sphereIDs = electrodeSpheres.map(el => el.id)

    // array of spheres that will show a highlighted sphere. default invisible
    var selectionSpheres = electrodeObjects.map(el => draw_highlight_fx(el))
    selectionSpheres.forEach(el => renderer.add(el))

    // draw the connections between nodes based on fmap arrays
    var fmapConnections = draw_fmap_connections(electrodeData, electrodeObjects, renderer)
    fmapConnections.forEach(connection => renderer.add(connection))

    // draw highlights between the fmaps when selected. default invisible
    var fmapHighlights = fmapConnections.map(fmap => draw_fmap_highlight_fx(fmap))
    fmapHighlights.forEach(highlight => renderer.add(highlight))

    // adds the seizure types to the first drop down menu on the panel
    fill_seizure_type_box(electrodeData, electrodeSpheres, fmapConnections, volume, renderer)

    // adds the IDs to the elctrode ID menu and sets up event listeners
    fill_electrode_ID_box(electrodeObjects, electrodeIDs, selectionSpheres, 
                          electrodeData, electrodeSpheres, volumeGUI)
    jump_slices_on_click(renderer, volumeGUI, electrodeSpheres, electrodeData, selectionSpheres, 
                         electrodeIDs, electrodeObjects, fmapConnections, fmapHighlights)

    // adds functionality for hovering over particular electrodes on the scene
    add_mouse_hover(renderer)

    // adds the event listners to the functional map menu
    add_event_to_fmap_menu(electrodeData, fmapConnections, fmapHighlights)

    // adds event listener to the show-all-tags button on the menu
    const tagsBtn = document.getElementById('show-tags-btn')
    tagsBtn.addEventListener('click', () => {
      renderer.resetBoundingBox()
      renderer.showAllCaptions(sphereIDs)
    })

  })()
}
