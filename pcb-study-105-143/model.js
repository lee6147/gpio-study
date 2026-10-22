(function(root){
 'use strict';
 const finite=(...values)=>{if(!values.every(Number.isFinite))throw Error('유한한 숫자를 입력하세요.');};
 function net(a,b,routed){return {logical:a===b,physical:a===b&&routed};}
 function mapping(packageMatch,reversed){return [...(!packageMatch?['package']:[]),...(reversed?['pins']:[])];}
 function checkDesign(footprint,connected){return [...(!footprint?['footprint']:[]),...(!connected?['net']:[])];}
 function trace(lengthMm,widthMm,thicknessUm,current){
  finite(lengthMm,widthMm,thicknessUm,current);if(lengthMm<=0||widthMm<=0||thicknessUm<=0)throw Error('길이·폭·두께는 양수입니다.');
  // shortcut: copper at 20°C and uniform DC section only; add thermal/AC models before predicting temperature or ampacity.
  const r=1.724e-8*(lengthMm/1000)/((widthMm/1000)*(thicknessUm/1e6));
  return {r,drop:current*r,power:current*current*r};
 }
 function buck(state){if(!['on','off'].includes(state))throw Error('ON/OFF 상태만 지원합니다.');return state==='on'?{switchOn:true,diodeOn:false,path:['input','switch','inductor','output','return']}:{switchOn:false,diodeOn:true,path:['ground','diode','inductor','output','return']};}
 const boards={A:{driver:'UCC27211',mosfet:'SQJQ466',shunt:0.002,gain:22,range:35},B:{driver:'IR2101STRPBF',mosfet:'IRF3205PBF',shunt:0.010,gain:15,range:10}};
 function boardSense(version,current){finite(current);const board=boards[version];if(!board)throw Error('알 수 없는 보드');return {...board,voltage:1.65+current*board.shunt*board.gain,inExample:Math.abs(current)<=board.range};}
 function placement(boardWidth,connectorX,holeOverlap){finite(boardWidth,connectorX);return [...(connectorX<0||connectorX+10>boardWidth?['outside']:[]),...(holeOverlap?['hole']:[])];}
 function kelvin(current,shuntMilliOhm,leadEachMilliOhm,kelvinSense){
  finite(current,shuntMilliOhm,leadEachMilliOhm);if(shuntMilliOhm<=0||leadEachMilliOhm<0)throw Error('저항 범위를 확인하세요.');
  const r=shuntMilliOhm/1000,errorV=kelvinSense?0:current*2*leadEachMilliOhm/1000,measuredV=current*r+errorV;
  // shortcut: sense-input current, offset and tolerances are omitted; include them for an accuracy budget.
  return {measuredV,errorV,estimatedI:measuredV/r,shuntPower:current*current*r};
 }
 function ntc(resistance){finite(resistance);if(resistance<=0)throw Error('NTC 저항은 양수입니다.');return 3.3*resistance/(3300+resistance);}
 function pour(netName,via,isolated,actualGap,ruleGap){finite(actualGap,ruleGap);if(actualGap<0||ruleGap<0)throw Error('간격은 음수일 수 없습니다.');const errors=[];if(netName!=='GND')errors.push('wrong-net');if(!via||isolated)errors.push('isolated');if(actualGap<ruleGap)errors.push('clearance');return {connected:netName==='GND'&&via&&!isolated,errors};}
 function returnPath(split,bridge){return {connected:!split||bridge,detour:split&&bridge};}
 function ldo(vin,vout,current){finite(vin,vout,current);if(vin<vout||vout<0||current<0)throw Error('강압 LDO의 계산 조건을 확인하세요.');return (vin-vout)*current;}
 const api={net,mapping,checkDesign,trace,buck,boardSense,placement,kelvin,ntc,pour,returnPath,ldo};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.PcbStudy=api;
})(typeof globalThis!=='undefined'?globalThis:this);
