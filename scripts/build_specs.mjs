// Generate readable Vega-Lite/Vega JSON. Edit this file, then run node scripts/build_specs.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'js');
const C = {ink:'#193c52', muted:'#516b79', teal:'#2678a8', amber:'#c4542f', navy:'#225578', pale:'#dcebf2', grid:'#e3ecef'};
const stateDomain=['NSW','VIC','QLD','WA','SA','TAS','NT','ACT'];
const stateRange=['#2458a8','#6553a4','#13766e','#9b542a','#a04459','#455c9d','#7c4b88','#566a34'];
const stateColour={field:'state',type:'nominal',scale:{domain:stateDomain,range:stateRange},legend:null};
const config={background:'transparent',font:'Arial',view:{stroke:null},
  axis:{labelColor:C.muted,titleColor:C.ink,labelFontSize:12,titleFontSize:12,titlePadding:12,gridColor:C.grid,domain:false,tickColor:C.grid,labelPadding:6},
  legend:{labelColor:C.muted,titleColor:C.ink,labelFontSize:11,titleFontSize:12,titlePadding:8,titleLimit:450,labelLimit:200,padding:10,orient:'bottom'},
  title:{anchor:'start',fontSize:15,color:C.ink,fontWeight:600},
  text:{font:'Arial',color:C.ink}};
const base={ $schema:'https://vega.github.io/schema/vega-lite/v5.json',width:'container',height:360,
  autosize:{type:'fit',contains:'padding'},config};
const save=(name,spec)=>fs.writeFileSync(path.join(out,`${name}.vg.json`),JSON.stringify({...base,...spec},null,2)+'\n');
const airports={url:'data/airports.json'};
const routes={url:'data/routes.json'};
const geo={url:'data/australia.geojson',format:{type:'json',property:'features'}};
// Equal-area Albers conic projection, with southern standard parallels for Australia.
const projection={type:'albers',rotate:[-134,0,0],center:[0,-27],parallels:[-18,-36]};
const land={data:geo,mark:{type:'geoshape',fill:'#eaf0fa',stroke:'#fff',strokeWidth:1.5}};
const airportTip=[{field:'airport',type:'nominal',title:'Airport'},
  {field:'fy',type:'nominal',title:'Financial year'},{field:'passengers',type:'quantitative',title:'Domestic passenger movements',format:','},
  {field:'change',type:'quantitative',title:'2025-26 vs 2024-25',format:'+.1%'},
  {field:'national_share',type:'quantitative',title:'Share of national movements',format:'.1%'}];
const majorNames=['Sydney','Melbourne','Brisbane','Perth','Adelaide','Cairns','Darwin','Hobart'];
const locations=JSON.parse(fs.readFileSync(path.join(root,'data/locations.json')));
const stateLabels=[{state:'WA',lon:121,lat:-26},{state:'NT',lon:133,lat:-20},{state:'SA',lon:135,lat:-30},
  {state:'QLD',lon:144,lat:-23},{state:'NSW',lon:147,lat:-32},{state:'VIC',lon:144,lat:-36.5},
  {state:'TAS',lon:146.5,lat:-42.4}];
const labels={data:{values:locations.filter(x=>majorNames.includes(x.airport))},mark:{type:'text',align:'left',dx:10,dy:-9,fontSize:12,fontWeight:600},
  encoding:{longitude:{field:'lon',type:'quantitative'},latitude:{field:'lat',type:'quantitative'},text:{field:'airport'}}};

save('01-airport-map',{height:550,projection,
  params:[{name:'Year',value:2026,bind:{input:'select',options:[2025,2026],labels:['2024-25','2025-26'],name:'Financial year: '}}],
  layer:[land,
    {data:airports,transform:[{filter:'datum.year == Year'}],
      mark:{type:'circle',color:C.teal,opacity:0.62,stroke:'#fff',strokeWidth:0.8},
      encoding:{longitude:{field:'lon',type:'quantitative'},latitude:{field:'lat',type:'quantitative'},
        size:{field:'passengers',type:'quantitative',title:'Passenger movements',scale:{type:'linear',domain:[0,26000000],range:[0,2800]},
          legend:{values:[1000000,5000000,10000000,25000000],format:'.2s',direction:'horizontal'}},
        order:{field:'passengers',sort:'descending'},tooltip:airportTip}},labels]});

save('02-airport-ranking',{height:375,data:airports,
  transform:[{filter:'datum.year == 2026 && datum.rank <= 12'}],
  layer:[{mark:{type:'rule',color:'#a8c1f7',strokeWidth:3},encoding:{
    y:{field:'airport',type:'nominal',sort:{field:'passengers',order:'descending',op:'max'},title:null,axis:{labelLimit:145}},
    x:{field:'passengers',type:'quantitative',title:'Domestic passenger movements (2025-26)',axis:{format:'.2s',tickCount:5},scale:{domain:[0,29000000]}},tooltip:airportTip}},
    {mark:{type:'point',color:C.teal,filled:true,size:75},encoding:{y:{field:'airport',type:'nominal',sort:{field:'passengers',order:'descending',op:'max'}},x:{field:'passengers',type:'quantitative'},tooltip:airportTip}},
    {mark:{type:'text',align:'left',dx:9,fontSize:11},encoding:{y:{field:'airport',type:'nominal',sort:{field:'passengers',order:'descending',op:'max'}},
      x:{field:'passengers',type:'quantitative'},text:{field:'passengers',type:'quantitative',format:'.3s'}}}]});

save('03-national-trend',{height:370,data:{url:'data/national.json'},
  layer:[
    {data:{values:[{start:2019.6,end:2022.2}]},mark:{type:'rect',color:'#d8dfe0',opacity:0.4},encoding:{x:{field:'start',type:'quantitative',scale:{domain:[2015,2025],zero:false}},x2:{field:'end'},y:{value:0},y2:{value:{expr:'height'}}}},
    {transform:[{filter:'datum.year <= 2025'}],mark:{type:'line',point:{filled:true,size:35},strokeWidth:2.5},encoding:{
      x:{field:'year',type:'quantitative',title:'Financial year ending June',axis:{format:'d',tickMinStep:1,tickCount:6},scale:{domain:[2015,2025],zero:false}},
      y:{field:'passengers',type:'quantitative',title:'Passenger trips (not unique people)',axis:{format:'.2s',tickCount:5},scale:{domain:[0,65000000]}},
      color:{field:'type',type:'nominal',title:null,scale:{domain:['Domestic','International'],range:[C.teal,C.amber]}},
      tooltip:[{field:'type',title:'Service'},{field:'fy',title:'Financial year'},{field:'passengers',title:'Passenger trips',format:','}]}},
    {data:{values:[{year:2020.8,passengers:64000000,text:'COVID-19 disruption'}]},mark:{type:'text',fontSize:11,color:C.muted},encoding:{x:{field:'year',type:'quantitative',scale:{domain:[2015,2025],zero:false}},y:{field:'passengers',type:'quantitative'},text:{field:'text'}}}]});

save('04-recovery-heatmap',{height:365,data:{url:'data/airport_history.json'},
  layer:[{mark:{type:'rect',stroke:'#fff',strokeWidth:2},encoding:{
    x:{field:'fy',type:'ordinal',title:'Financial year',sort:'ascending',axis:{labelAngle:{expr:'width < 650 ? -45 : 0'},labelFontSize:11}},
    y:{field:'airport',type:'nominal',title:null,sort:['Sydney','Melbourne','Brisbane','Perth','Adelaide','Gold Coast','Cairns','Canberra','Darwin','Hobart','Townsville']},
    color:{field:'index',type:'quantitative',title:'Share of 2018-19 traffic',scale:{domain:[0,0.5,1,1.3],range:['#eef3fc','#a7c2f3','#17459a','#102e65'],clamp:true},legend:{format:'.0%',values:[0,0.5,1,1.3],gradientLength:260}},
    tooltip:[{field:'airport',title:'Airport'},{field:'fy',title:'Financial year'},{field:'passengers',title:'Domestic + international movements',format:','},{field:'index',title:'Compared with 2018-19',format:'.1%'}]}},
    {transform:[{filter:'datum.year == 2021 || (width >= 650 && datum.year == 2025)'}],mark:{type:'text',fontSize:10},encoding:{
      x:{field:'fy',type:'ordinal',sort:'ascending'},y:{field:'airport',type:'nominal',sort:['Sydney','Melbourne','Brisbane','Perth','Adelaide','Gold Coast','Cairns','Canberra','Darwin','Hobart','Townsville']},
      text:{field:'index',type:'quantitative',format:'.0%'},color:{condition:{test:'datum.index > 0.8',value:'#fff'},value:C.ink}}}]});

save('05-recovery-dumbbell',{height:350,data:{url:'data/recovery.json'},
  encoding:{y:{field:'airport',type:'nominal',title:null,sort:{field:'passengers_2025',order:'descending'}}},
  layer:[
    {mark:{type:'rule',stroke:'#b7c8ce',strokeWidth:2.5},encoding:{x:{field:'passengers_2019',type:'quantitative',title:'Domestic + international passenger movements',axis:{format:'.2s',tickCount:5},scale:{domain:[0,48000000]}},x2:{field:'passengers_2025'}}},
    {transform:[{fold:['passengers_2019','passengers_2025'],as:['period','passengers']}],mark:{type:'point',filled:true,size:70},encoding:{x:{field:'passengers',type:'quantitative'},color:{field:'period',type:'nominal',title:null,scale:{domain:['passengers_2019','passengers_2025'],range:['#91a0aa',C.teal]},legend:{labelExpr:"datum.label == 'passengers_2019' ? '2018-19' : '2024-25'"}},
      tooltip:[{field:'airport',title:'Airport'},{field:'period',title:'Source column'},{field:'passengers',title:'Passenger movements',format:','},{field:'change',title:'Change since 2018-19',format:'+.1%'}]}}]});

save('06-state-choropleth',{height:530,projection,
  layer:[{data:geo,transform:[{lookup:'properties.state',from:{data:{url:'data/state_traffic.json'},key:'state',fields:['passengers','population','per_resident','airport_count','state_name']}}],
    mark:{type:'geoshape',stroke:'#fff',strokeWidth:2},encoding:{
      color:{field:'per_resident',type:'quantitative',title:'Movements per resident',scale:{domain:[0,10],range:['#eaf1ff','#174b9e']},legend:{gradientLength:260,values:[0,2,4,6,8,10]}},
      tooltip:[{field:'state_name',title:'State / territory'},{field:'per_resident',title:'Selected airport movements per resident',format:'.2f'},
        {field:'passengers',title:'Domestic movements, 2025-26',format:','},{field:'population',title:'ABS population, Dec 2025',format:','},{field:'airport_count',title:'Airports included'}]}},
    {data:{values:stateLabels},transform:[{lookup:'state',from:{data:{url:'data/state_traffic.json'},key:'state',fields:['per_resident']}}],
      mark:{type:'text',fontSize:13,fontWeight:600},encoding:{longitude:{field:'lon',type:'quantitative'},latitude:{field:'lat',type:'quantitative'},text:{field:'state'},color:{condition:{test:'datum.per_resident > 7',value:'#fff'},value:C.ink}}},
    {data:{values:[{lon:149.13,lat:-35.3,lon2:154,lat2:-37.5}]},mark:{type:'rule',stroke:C.navy,strokeWidth:1},encoding:{longitude:{field:'lon'},latitude:{field:'lat'},longitude2:{field:'lon2'},latitude2:{field:'lat2'}}},
    {data:{url:'data/state_traffic.json'},transform:[{filter:"datum.state == 'ACT'"},{calculate:"'ACT: ' + format(datum.per_resident, '.1f')",as:'label'}],mark:{type:'text',align:'left',fontSize:12,fontWeight:600,color:C.ink},encoding:{longitude:{datum:154},latitude:{datum:-37.5},text:{field:'label'}}}]});

save('07-state-waterfall',{height:350,data:{url:'data/waterfall.json'},
  layer:[{mark:{type:'bar',size:32},encoding:{
    x:{field:'state',type:'ordinal',sort:{field:'order',order:'ascending'},title:null,axis:{labelAngle:-25,labelFontSize:11}},
    y:{field:'start',type:'quantitative',title:'Change in passenger movements',axis:{format:'.2s',tickCount:5},scale:{domain:[0,2900000]}},y2:{field:'end'},
    color:{field:'kind',type:'nominal',title:null,scale:{domain:['Increase','Decrease','Total'],range:[C.teal,C.amber,C.navy]}},
    tooltip:[{field:'state',title:'Contribution'},{field:'change',title:'Change in movements',format:'+,d'}]}},
    {transform:[{calculate:"abs(datum.change) >= 100000 ? format(datum.change/1000000, '+.2f')+'m' : format(datum.change/1000, '+.0f')+'k'",as:'label'}],
      mark:{type:'text',dy:-9,fontSize:10},encoding:{x:{field:'state',type:'ordinal',sort:{field:'order',order:'ascending'}},y:{field:'end',type:'quantitative'},text:{field:'label'}}}]});

save('09-route-matrix',{height:385,data:{url:'data/matrix.json'},
  encoding:{x:{field:'destination_iata',type:'ordinal',title:null,sort:['SYD','MEL','BNE','PER','ADL','OOL','CNS','CBR','HBA','DRW','LST','TSV'],axis:{orient:'top',labelAngle:0}},
    y:{field:'origin_iata',type:'ordinal',title:null,sort:['SYD','MEL','BNE','PER','ADL','OOL','CNS','CBR','HBA','DRW','LST','TSV']},
    tooltip:[{field:'origin',title:'Airport 1'},{field:'destination',title:'Airport 2'},{field:'status',title:'Coverage'},{field:'passengers',title:'Passenger trips, both directions',format:','}]},
  layer:[{mark:{type:'rect',fill:'#eef2f8',stroke:'#fff',strokeWidth:2}},
    {transform:[{filter:'isValid(datum.passengers)'}],mark:{type:'rect',stroke:'#fff',strokeWidth:2},encoding:{color:{field:'passengers',type:'quantitative',title:'Passenger trips',scale:{type:'log',domain:[150000,8100000],range:['#dce7fb','#174b9e']},legend:{format:'.2s',values:[200000,1000000,4000000,8000000],gradientLength:220}}}}]});

save('10-aircraft-scatter',{height:375,data:routes,transform:[{filter:'datum.year == 2026'}],
  layer:[{mark:{type:'circle',color:C.teal,size:55,opacity:0.7,stroke:'#fff',strokeWidth:0.5},encoding:{
    x:{field:'flights',type:'quantitative',title:'Aircraft trips (including cargo)',scale:{domain:[0,60000]},axis:{format:'.2s',tickCount:5}},
    y:{field:'passengers',type:'quantitative',title:'Passenger trips',scale:{domain:[0,9000000]},axis:{format:'.2s',tickCount:5}},
    tooltip:[{field:'route',title:'Route'},{field:'passengers',title:'Passenger trips',format:','},{field:'flights',title:'Aircraft trips (including cargo)',format:','},{field:'seats',title:'Available seats',format:','}]}},
    {transform:[{filter:'datum.rank <= 3'},{calculate:"datum.origin_iata + ' – ' + datum.destination_iata",as:'label'}],mark:{type:'text',align:'right',dx:-8,dy:-9,fontSize:11},encoding:{x:{field:'flights',type:'quantitative'},y:{field:'passengers',type:'quantitative'},text:{field:'label'}}}]});

save('11-seat-utilisation',{height:400,data:routes,
  transform:[{filter:'datum.year == 2026 && datum.rank <= 12'},{calculate:'1 - datum.load_factor',as:'unoccupied'},
    {fold:['load_factor','unoccupied'],as:['status','proportion']}],
  mark:{type:'bar',size:19},encoding:{
    x:{field:'proportion',type:'quantitative',stack:'zero',title:'Share of available seats',scale:{domain:[0,1]},axis:{format:'.0%',tickCount:5}},
    y:{field:'route',type:'nominal',title:null,sort:{field:'passengers',order:'descending'},axis:{labelLimit:230,labelFontSize:11}},
    color:{field:'status',type:'nominal',title:null,scale:{domain:['load_factor','unoccupied'],range:[C.teal,'#e4eaf5']},legend:{labelExpr:"datum.label == 'load_factor' ? 'Occupied seats' : 'Unoccupied seats'"}},
    order:{field:'status',sort:'ascending'},tooltip:[{field:'route',title:'Route'},{field:'load_factor',title:'Published seat utilisation',format:'.1%'},{field:'passengers',title:'Passenger trips',format:','},{field:'seats',title:'Available seats',format:','}]}});

// Vega's native treemap transform keeps this advanced diagram in the required libraries.
const treemap={$schema:'https://vega.github.io/schema/vega/v5.json',description:'Domestic passenger movements at 58 selected airports, grouped by state, 2025-26.',
  width:900,height:380,padding:0,autosize:'none',
  data:[{name:'tree',url:'data/treemap.json',transform:[{type:'stratify',key:'id',parentKey:'parent'},
    {type:'treemap',field:'passengers',sort:{field:'value',order:'descending'},method:'squarify',round:true,size:[{signal:'width'},{signal:'height'}],paddingInner:3,paddingTop:18}]},
    {name:'leaves',source:'tree',transform:[{type:'filter',expr:'!datum.children'}]},
    {name:'states',source:'tree',transform:[{type:'filter',expr:'datum.depth == 1'}]}],
  scales:[{name:'colour',type:'ordinal',domain:stateDomain,range:stateRange}],
  marks:[{type:'rect',from:{data:'leaves'},encode:{enter:{x:{field:'x0'},y:{field:'y0'},x2:{field:'x1'},y2:{field:'y1'},fill:{scale:'colour',field:'state'},fillOpacity:{value:1},
    tooltip:{signal:"{'Airport': datum.name, 'State': datum.state, 'Domestic movements': format(datum.passengers, ','), 'Share of selected airports': format(datum.share, '.1%')}"}},update:{stroke:{value:'#fff'},strokeWidth:{value:0.4}},hover:{fillOpacity:{value:1},stroke:{value:'#172e42'},strokeWidth:{value:2}}}},
    {type:'text',from:{data:'leaves'},encode:{enter:{x:{signal:'(datum.x0 + datum.x1)/2'},y:{signal:'(datum.y0 + datum.y1)/2'},text:{field:'name'},align:{value:'center'},baseline:{value:'middle'},font:{value:'Arial'},fontSize:{value:12},fill:{value:'#fff'},
      opacity:{signal:'datum.x1-datum.x0 > 95 && datum.y1-datum.y0 > 24 ? 1 : 0'}}}},
    {type:'text',from:{data:'states'},encode:{enter:{x:{field:'x0',offset:4},y:{field:'y0',offset:12},text:{field:'name'},font:{value:'Arial'},fontSize:{value:11},fontWeight:{value:'bold'},fill:{value:C.ink}}}}]};
fs.writeFileSync(path.join(out,'12-airport-treemap.vg.json'),JSON.stringify(treemap,null,2)+'\n');

// Rank changes answer a different question from the volume and recovery plots.
save('13-airport-bump',{height:420,padding:{left:5,right:110,top:12,bottom:5},data:{url:'data/airport_history.json'},
  params:[{name:'RankAirport',value:'All airports',bind:{input:'select',name:'Highlight airport: ',options:['All airports',...majorNames,'Gold Coast','Canberra','Townsville']}}],
  transform:[{filter:'datum.year >= 2019'},{window:[{op:'rank',as:'traffic_rank'}],sort:[{field:'passengers',order:'descending'}],groupby:['year']}],
  encoding:{x:{field:'year',type:'quantitative',title:'Financial year ending June',scale:{domain:[2019,2025],zero:false},axis:{format:'d',values:[2019,2020,2021,2022,2023,2024,2025]}},
    y:{field:'traffic_rank',type:'quantitative',title:'Passenger rank among these 11 airports',scale:{domain:[11.5,0.5],zero:false},axis:{values:[1,2,3,4,5,6,7,8,9,10,11],format:'d'}},
    detail:{field:'airport'},color:{field:'airport',type:'nominal',scale:{domain:['Sydney','Melbourne','Brisbane','Perth','Adelaide','Gold Coast','Cairns','Canberra','Hobart','Darwin','Townsville'],range:['#2458a8','#6553a4','#a04459','#13766e','#8f5d20','#72528e','#247586','#526b38','#a55125','#35475c','#665f58']},legend:null},
    opacity:{condition:{test:"RankAirport == 'All airports' || datum.airport == RankAirport",value:1},value:0.12},
    tooltip:[{field:'airport',title:'Airport'},{field:'fy',title:'Financial year'},{field:'traffic_rank',title:'Rank among these airports',format:'d'},{field:'passengers',title:'Domestic + international movements',format:','}]},
  layer:[{mark:{type:'line',strokeWidth:2.7,point:{filled:true,size:42}}},
    {transform:[{filter:'datum.year == 2025'}],mark:{type:'text',align:'left',dx:10,fontSize:11,fontWeight:600},encoding:{text:{field:'airport'}}}]});

// Great-circle positions keep arrowheads on the same geographic links as the paths.
function along(a,b,t){
  const rad=Math.PI/180, v=p=>[Math.cos(p[1]*rad)*Math.cos(p[0]*rad),Math.cos(p[1]*rad)*Math.sin(p[0]*rad),Math.sin(p[1]*rad)];
  const u=v(a),w=v(b),omega=Math.acos(Math.max(-1,Math.min(1,u.reduce((s,x,i)=>s+x*w[i],0))));
  const A=Math.sin((1-t)*omega)/Math.sin(omega),B=Math.sin(t*omega)/Math.sin(omega),p=u.map((x,i)=>A*x+B*w[i]);
  return [Math.atan2(p[1],p[0])/rad,Math.atan2(p[2],Math.hypot(p[0],p[1]))/rad];
}
const arrowRoutes=JSON.parse(fs.readFileSync(path.join(root,'data/routes.json'))).filter(d=>d.year===2026).map(d=>{
  const [a,b]=d.geometry.coordinates;
  return {...d,arrowA:along(a,b,.28),aheadA:along(a,b,.26),arrowB:along(a,b,.72),aheadB:along(a,b,.74)};
});
fs.writeFileSync(path.join(root,'data/route_arrows.json'),JSON.stringify(arrowRoutes)+'\n');
const routeTip="{'Route':datum.route,'Passenger trips (both directions)':format(datum.passengers,','),'Aircraft trips (including cargo)':format(datum.flights,','),'Seat utilisation':format(datum.load_factor,'.1%')}";
const flow={$schema:'https://vega.github.io/schema/vega/v5.json',description:'Two-way domestic connections. Traffic is combined across both directions; arrowheads do not encode directional counts.',
  width:740,height:530,padding:5,autosize:{type:'fit',contains:'padding'},background:'transparent',
  signals:[{name:'Hub',value:'All airports',bind:{input:'select',name:'Routes connected to: ',options:['All airports','Sydney','Melbourne','Brisbane','Perth','Adelaide','Cairns','Canberra','Darwin','Hobart']}},
    {name:'RouteLimit',value:15,bind:{input:'range',min:5,max:62,step:1,name:'Maximum routes: '}},
    {name:'ShowArrows',value:true,bind:{input:'checkbox',name:'Show two-way arrows: '}}],
  data:[{name:'land',url:'data/australia.geojson',format:{type:'json',property:'features'}},
    {name:'routes',url:'data/route_arrows.json'},
    {name:'visible',source:'routes',transform:[{type:'filter',expr:"Hub == 'All airports' || datum.origin == Hub || datum.destination == Hub"},
      {type:'window',sort:{field:['passengers'],order:['descending']},ops:['row_number'],as:['visible_rank']},{type:'filter',expr:'datum.visible_rank <= RouteLimit'}]},
    {name:'arrows',source:'visible',transform:[{type:'fold',fields:['arrowA','arrowB'],as:['direction','coord']},
      {type:'formula',expr:"datum.direction == 'arrowA' ? datum.aheadA : datum.aheadB",as:'ahead'},
      {type:'geopoint',projection:'mapProjection',fields:['coord[0]','coord[1]'],as:['px','py']},
      {type:'geopoint',projection:'mapProjection',fields:['ahead[0]','ahead[1]'],as:['ax','ay']},
      {type:'formula',expr:'atan2(datum.ax-datum.px, datum.py-datum.ay)*180/PI',as:'angle'}]},
    {name:'airports',values:locations.filter(d=>majorNames.includes(d.airport)),transform:[{type:'geopoint',projection:'mapProjection',fields:['lon','lat'],as:['x','y']}]}],
  projections:[{name:'mapProjection',type:'albers',rotate:[-134,0,0],center:[0,-27],parallels:[-18,-36],fit:{signal:"data('land')"},size:{signal:'[width, max(260,height-65)]'}}],
  scales:[{name:'traffic',type:'linear',domain:[0,8100000],range:[.7,8.5],zero:true}],
  legends:[{strokeWidth:'traffic',title:'Trips (both directions)',titleLimit:280,orient:'bottom',direction:'horizontal',format:'.2s',values:[1000000,4000000,8000000],symbolType:'stroke',symbolStrokeColor:C.teal,symbolSize:400,labelColor:C.muted,titleColor:C.ink,titlePadding:10}],
  marks:[{type:'shape',from:{data:'land'},transform:[{type:'geoshape',projection:'mapProjection'}],encode:{update:{fill:{value:'#eaf0fa'},stroke:{value:'#fff'},strokeWidth:{value:1.5}}}},
    {type:'shape',from:{data:'visible'},transform:[{type:'geoshape',projection:'mapProjection',field:'datum.geometry'}],encode:{update:{stroke:{value:C.teal},strokeWidth:{scale:'traffic',field:'passengers'},strokeOpacity:{value:.58},fill:{value:null},tooltip:{signal:routeTip}},hover:{strokeOpacity:{value:1}}}},
    {type:'symbol',from:{data:'arrows'},encode:{update:{x:{field:'px'},y:{field:'py'},shape:{value:'triangle-up'},angle:{field:'angle'},size:{value:60},fill:{value:C.navy},opacity:{signal:'ShowArrows ? 1 : 0'},tooltip:{signal:routeTip}}}},
    {type:'symbol',from:{data:'airports'},encode:{update:{x:{field:'x'},y:{field:'y'},size:{value:24},fill:{value:C.navy}}}},
    {type:'text',from:{data:'airports'},encode:{update:{x:{field:'x',offset:9},y:{field:'y',offset:-9},text:{field:'airport'},font:{value:'Arial'},fontSize:{value:12},fontWeight:{value:600},fill:{value:C.ink}}}}]};
fs.writeFileSync(path.join(out,'08-route-flow-map.vg.json'),JSON.stringify(flow,null,2)+'\n');
console.log('Final set: 11 Vega-Lite charts and 2 native Vega diagrams (flow map + treemap).');
