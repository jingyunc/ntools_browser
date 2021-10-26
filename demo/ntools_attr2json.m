% ddir='..\docs\';
clear;
ddir='../docs/';

S.subjID='XXX';

T = readtable([ddir S.subjID '_coor.txt'],'Delimiter',' '); % ID,x,y,z,type,NaN
Xa = readtable([ddir S.subjID '_attributes.xlsx']);
Xf = readtable([ddir S.subjID '_short_functions.xlsx']);

% coor.txt
S.totalSeizType=1; %user input
S.SeizDisplay={'seizType','intPopulation','funMapping'}; %user input
S.elecID=T.Var1;
S.coorX=T.Var2;
S.coorY=T.Var3;
S.coorZ=T.Var4;
S.elecType=T.Var5;

%attributes.xlsx
S.intPopulation=Xa.InterictalPopulation;
S.intPopulation(isnan(S.intPopulation))=0; % set NaN to 0

for i=1:S.totalSeizType
    eval(['S.seizType(' num2str(i) ',:)=Xa.SeizureType' num2str(i) ';']);
end

%functions.xlsx
for i=1:size(Xf,1)
    S.fmapG1(i)=find(contains(S.elecID,[Xf.Contact{i} num2str(Xf.G1(i),'%02.f')]),1);
    S.fmapG2(i)=find(contains(S.elecID,[Xf.Contact{i} num2str(Xf.G2(i),'%02.f')]),1);    
end
S.fmapThreshold=Xf.Threshold;    
S.fmapMotor=nonan(Xf.Motor);
S.fmapSensory=nonan(Xf.Sensory);
S.fmapLanguage=nonan(Xf.Language);
S.fmapVisual=nonan(Xf.Visual);
S.fmapOther=nonan(Xf.Other);
S.fmapAfterDischarge=nonan(Xf.AfterDischarges);

s=jsonencode(S);

fid = fopen([ddir S.subjID '.json'], 'w');
if fid == -1, error('Cannot create JSON file'); end
fwrite(fid, s, 'char');
fclose(fid);

