#!/usr/bin/env python
# coding: utf-8
# get_ipython().run_line_magic('pylab', 'inline')
import sys
import nibabel as nib
import numpy as np
import json
import re

# PROVIDE SUBJECT ID AS FIRST COMMAND LINE ARGUMENT
subject = sys.argv[1]

# PROVIDE PATH TO .json as SECOND COMMAND LINE ARGUMENT
with open(sys.argv[2]) as f:
    electrode_data = json.load(f)

number_of_electrodes = len(electrode_data['elecID'])

class Electrode:
    def __init__(self, xCoor, yCoor, zCoor, seizType, intPopulation):
        self.xCoor = xCoor
        self.yCoor = yCoor
        self.zCoor = zCoor
        self.seizType = seizType
        self.intPopulation = intPopulation
        
all_seiztypes = electrode_data["SeizDisplay"]

default_seizType = electrode_data["SeizDisplay"][0]

electrode_objects = []
for index in range(number_of_electrodes):
    xCoor = electrode_data['coorX'][index]
    yCoor = electrode_data['coorY'][index]
    zCoor = electrode_data['coorZ'][index]
    seizType = electrode_data[default_seizType][index]
    intPop = electrode_data['intPopulation'][index]
    electrode_objects.append(Electrode(xCoor, yCoor, zCoor, seizType, intPop))

def map_interval(input_val, input_range, output_range):
    (input_start, input_end) = input_range
    (output_start, output_end) = output_range
    
    return output_start + ((output_end - output_start) / (input_end - input_start)) * (input_val - input_start)

radius = 3 # maybe switch to scikit image draw
for seizType in all_seiztypes:
    # PROVIDE PATH TO .nii as THIRD COMMAND LINE ARGUMENT
    vol = sys.argv[3]

    volume = nib.load(vol)
    labels = np.zeros((volume.shape[0], volume.shape[1], volume.shape[2]), dtype=np.uint8)
    
    # really hacky way to make a default seiztype based on just the first seiztype
    # we're not making a labelmap for funMapping, since funMapping never exists as a 
    # JSON property
    if seizType == 'funMapping':
        current_seiztype_list = electrode_data[all_seiztypes[0]]
    else:
        current_seiztype_list = electrode_data[seizType]
    
    for index, electrode in enumerate(electrode_objects):
        first_interval = (-127.5, 127.5)
        second_interval = (0, 255)
        electrode_color = 1
  
        current_seiztype = current_seiztype_list[index]
        
        if seizType == 'intPopulation':
            # since 0 is the background on the colormap, offset by 1
            electrode_color = current_seiztype + 1
        else:
            if current_seiztype == None:
                electrode_color = 1
            else:
                current_seiztype = re.sub(' +', ' ', current_seiztype)
                current_seiztype = current_seiztype.lower()
                
                if current_seiztype == 'onset':
                    electrode_color = 2
                elif current_seiztype == 'early spread':
                    electrode_color = 3
                elif current_seiztype == 'late spread':
                    electrode_color = 4
                elif current_seiztype == 'very early spread':
                    electrode_color = 5
                elif current_seiztype == 'rapid spread':
                    electrode_color = 6
                elif current_seiztype == 'early onset':
                    electrode_color = 7
                else:
                    electrode_color = 1
        
        mapped_xCoor = int(round(map_interval(electrode.xCoor, first_interval, second_interval), 5))
        mapped_yCoor = int(round(map_interval(electrode.yCoor, first_interval, second_interval), 5))
        mapped_zCoor = int(round(map_interval(electrode.zCoor, first_interval, second_interval), 5))
     
        try:
            labels[mapped_xCoor:mapped_xCoor + radius + 1, mapped_yCoor:mapped_yCoor + radius + 1,
            mapped_zCoor:mapped_zCoor + radius + 1] = electrode_color
        except IndexError:
            continue
        
    labelmap = nib.Nifti1Image(labels, volume.affine)

    if seizType == 'funMapping':
        # again, a hacky way to make a default
        print("Saving Default Labels...")
        nib.save(labelmap, f'../{subject}/{subject}_default_labels.nii')
        print("Done")

    else:
        print(f'Generating Labels for {seizType}...')
        nib.save(labelmap, f'../{subject}/{subject}_{seizType}_labels.nii')
        print("Done")

print("Label Maps Generated")