// This file contains functions for formatting json data and displaying graphical 
// representations. can possibly revise if we do not want to keep it in that format,
// and just use indices directly

// returns color of electrode

function get_seiztype_color(type) {

  // if type is null
  if (!type) return [1, 1, 1]

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
function get_electrode_object(el, index, bBox) {
  var defaultSeizType = el.SeizDisplay[0]
  var [xOffset, yOffset, zOffset] = bBox

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
function draw_electrode_fx(el, renderer) {
  // destructuring object properties. it is more readable for me, 
  var { xCoor, yCoor, zCoor, elecID, seizType, elecType } = el

  elSphere = new X.sphere()

  elSphere.center = [xCoor, yCoor, zCoor]
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
  elSphere.modified()

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
function fill_electrode_ID_box(elObjects, idArray, selectionSpheres, data, spheres, volume) {
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

function fill_seizure_type_box(data, spheres, fmaps, volume) {
  const seizureTypes = data.SeizDisplay
  const displayMenu = document.getElementById('seizure-display-menu')
  const seizTypeList = document.getElementById('seiztype-list')
  const intPopList = document.getElementById('int-pop-list')
  var subject = localStorage.getItem("user-search")

  displayMenu.addEventListener('click', event => {
    // need to add functional map support separetely 
    if (event.target.value === "funMapping"){
      fmaps.forEach(fmap => fmap.visible = true)
    } else {
      if (event.target.value === "intPopulation") {
        intPopList.style.visibility = 'visible'
        seizTypeList.style.visibility = 'hidden'
        volume.labelmap.file = null
        volume.labelmap.colortable.file = null
        volume.labelmap.file = `../${subject}/${subject}_intPopulation_labels.nii`
        volume.labelmap.colortable.file = './colormap_intpop.txt'
        volume.modified()
      } else {
        seizTypeList.style.visibility = 'visible'
        intPopList.style.visibility = 'hidden'
        volume.labelmap.file = null
        volume.labelmap.colortable.file = null
        volume.labelmap.file = `../${subject}/${subject}_${event.target.value}_labels.nii`
        volume.labelmap.colortable.file = './colormap_seiztype.txt'
        volume.modified()
      }

      console.log(volume.labelmap.file)

      const selectedSeizType = data[event.target.value]
      spheres.forEach((sphere, index) => {
        sphere.color = get_seiztype_color(selectedSeizType[index])
      })
    }

  })

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
function print_electrode_info(elObjects, electrode, idArray, selectionSpheres, data) {
  var selected_electrode = elObjects.find(el => el.elecID === electrode)
  if (selected_electrode) {
    update_labels(selected_electrode, data)
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

function highlight_selected_fmap(fmapHighlights, index) {
  fmapHighlights.forEach(fmap => fmap.visible = false)
  fmapHighlights[index].visible = true
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

function jump_slices_on_click(
  renderer, volume, spheres, data, 
  selections, IDs, electrodeObjects,
  fmaps, fmapHighlights
) {
  var canvas = document.getElementsByTagName('canvas')[0]
    canvas.addEventListener('click', e => {
      var clickedObject = renderer.pick(e.clientX, e.clientY)
      if (clickedObject !== 0) {
        var clickedSphere = renderer.get(clickedObject)
        if (clickedSphere.g === "sphere") {
          var sphereIndex = spheres.indexOf(clickedSphere)
          
          // fix crashing when a sphere is clicked twice
          if (sphereIndex >= 0) {
            var target = electrodeObjects[sphereIndex]
  
            var {elecID, xSlice, ySlice, zSlice} = target

            highlight_selected_electrode(elecID, IDs, selections)
            update_labels(target, data)
       
            const sliderControllers = volume.__controllers

            // sync with electrode menu options
            const electrodeIDMenuOptions = document.getElementById('electrode-menu').options
            electrodeIDMenuOptions.selectedIndex = sphereIndex + 1
           
            var xSlider = sliderControllers[5]
            var ySlider = sliderControllers[6]
            var zSlider = sliderControllers[7]

            xSlider.object.indexX = xSlice
            ySlider.object.indexY = ySlice
            zSlider.object.indexZ = zSlice
            
          }
        } else if (clickedSphere.g === "cylinder") {
          var cylinderIndex = fmaps.indexOf(clickedSphere)
          if (cylinderIndex >= 0) {
            document.getElementById('fmap-caption').innerText = clickedSphere.caption
            highlight_selected_fmap(fmapHighlights, cylinderIndex)
          }
        }
      }
    })
}

function load_electrodes(renderer, volumeGUI, volume) {
  (async () => {
    var subject = localStorage.getItem("user-search")
    if (localStorage.getItem("mode") === "UMB") {
      var electrodeData = await (await fetch(`../${subject}/${subject}.json`)).json()
    } else {
      var electrodeData = await (await fetch (`https://ievappwpdcpvm01.nyumc.org/?file=${subject}.json`)).json()
    }
    
    const oldBoundingBox = renderer.u

    document.getElementById('subject-id-lbl').innerHTML = electrodeData.subjID
    document.getElementById('num-seiz-types-lbl').innerHTML = electrodeData.totalSeizType

    var electrodeIDs = electrodeData.elecID

    // can choose any property here, but it must have same length as other properties
    var numberOfElectrodes = electrodeData.coorX.length;

    // create an array of electrode objects to access by property
    var electrodeObjects = Array
      .apply(null, Array(numberOfElectrodes))
      .map((_, index) => get_electrode_object(electrodeData, index, oldBoundingBox))

    // create an array of electrode spheres we can access via a closure
    var electrodeSpheres = electrodeObjects.map(el => draw_electrode_fx(el, renderer))
    electrodeSpheres.forEach(el => renderer.add(el))

    // create an array of sphere IDs
    var sphereIDs = electrodeSpheres.map(el => el.id)

    // array of spheres that will show a highlighted sphere. default invisible
    var selectionSpheres = electrodeObjects.map(el => draw_highlight_fx(el))
    selectionSpheres.forEach(el => renderer.add(el))

    // draw the connections between nodes based on fmap arrays
    var fmapConnections = draw_fmap_connections(electrodeData, electrodeObjects, renderer)
    fmapConnections.forEach(connection => renderer.add(connection))

    var fmapHighlights = fmapConnections.map(fmap => draw_fmap_highlight_fx(fmap))
    fmapHighlights.forEach(highlight => renderer.add(highlight))

    // fmapIDs = fmapConnections.map(fmap => fmap.id)
    // console.log(fmapIDs)

    fill_seizure_type_box(electrodeData, electrodeSpheres, fmapConnections, volume)
    fill_electrode_ID_box(electrodeObjects, electrodeIDs, selectionSpheres, 
                          electrodeData, electrodeSpheres, volumeGUI)
    jump_slices_on_click(renderer, volumeGUI, electrodeSpheres, electrodeData, selectionSpheres, 
                         electrodeIDs, electrodeObjects, fmapConnections, fmapHighlights)
    add_mouse_hover(renderer)
    add_event_to_fmap_menu(electrodeData, fmapConnections, fmapHighlights)

    const tagsBtn = document.getElementById('show-tags-btn')
    tagsBtn.addEventListener('click', () => {
      renderer.resetBoundingBox()
      renderer.showAllCaptions(sphereIDs)
    })

  })()
}


