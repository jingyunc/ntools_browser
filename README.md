# ntools_browser

**Web-based Electrode Visualization**

An add-on to [ntools_elec](https://github.com/HughWXY/ntools_elec), based on [XTK](https://github.com/xtk/X).

![Demo](Docs/demo1.png)

![General Design](Docs/design2.png)


## Stage 1: Visualize brain surfaces and electrodes in browser from existing ntools_elec outputs
- [x] Find toolbox for web-based visualization of Freesurfer files.
- [x] Create database of existing MRI scans and electrode coordinates for web visualization.
- [x] Convert ntools_elec outputs to XTK compatible format.
- [x] Create web service for accessing ntools_elec outputs.
## Stage 2: Edit and save attributes of electrodes in browser
- [x] Create GUI for subject selection and 3D redering options.
- [ ] Assign and save different atrributes to the electrodes (e.g. functional mapping, seizure mapping, resection mapping, etc.).
## Stage 3: Add user control
- [ ] Link to MCIT database of Kerbros ID/Password.
- [ ] Create white list of Kerbros ID for legit users.
## Suggested features
- [x] Render brain volume instead of cortical surface.
- [x] Opacity control of brain surface
- [x] Color-code fmap bars
- [ ] Color-code elecs on 2D slices
- [ ] Display legend for color-code
- [ ] Additional draw-down menu items for different types of fmap findings.
- [ ] Adopt BIDS format in json file.
- [ ] Interpolate surface color with electrode attributes (e.g. Garma band strength).
