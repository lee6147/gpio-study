(function(){
'use strict';
const M=window.PcbStudy, states={};
const $=id=>document.getElementById(id), esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const txt=(x,y,s,cls='')=>'<text x="'+x+'" y="'+y+'" class="'+cls+'">'+esc(s)+'</text>';
const rect=(x,y,w,h,label='',cls='part')=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="7" class="'+cls+'"/>'+txt(x+9,y+h/2+5,label);
const line=(d,cls='wire',arrow=false)=>'<path d="'+d+'" class="'+cls+'" fill="none"'+(arrow?' marker-end="url(#arrow)"':'')+'/>';
const dot=(x,y,r=6,cls='pad')=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" class="'+cls+'"/>';
const svg=(n,title,body,h=300)=>'<svg viewBox="0 0 560 '+h+'" role="img" aria-labelledby="title'+n+'"><title id="title'+n+'">'+esc(title)+'</title><defs><marker id="arrow'+n+'" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#bd572b"/></marker></defs>'+body.replaceAll('url(#arrow)','url(#arrow'+n+')')+'</svg>';
function out(n,title,body,metrics,result,h){$('diagram'+n).innerHTML=svg(n,title,body,h);$('metrics'+n).innerHTML=metrics.map(([k,v])=>'<div class="metric"><span>'+esc(k)+'</span><strong>'+esc(v)+'</strong></div>').join('');$('result'+n).textContent=result;}
const num=(x,d=2)=>Number(x).toFixed(d), val=f=>Object.fromEntries([...f.elements].filter(e=>e.name).map(e=>[e.name,e.type==='checkbox'?e.checked:e.type==='range'?Number(e.value):e.value]));
function render(n,f,action){
 const v=val(f),s=states[n]||(states[n]={});
 f.querySelectorAll('[data-value]').forEach(o=>{const e=f.elements.namedItem(o.dataset.value);o.value=e.value;});
 if(n>8){renderExtra(n,f,action);return;}
 if(n===1){
 const names={power:'+5V',led:'R1 → LED',ground:'GND'},paths={power:'M100 80H210M160 80V130',led:'M290 80H350',ground:'M430 80H490V200H65V120M160 170V200'};
 let b=txt(28,30,'회로도 · 연결 관계')+line('M100 80H210M290 80H350M430 80H490V200H65V120M160 80V130M160 170V200')+rect(30,55,70,65,'H1')+rect(210,55,80,50,'R1')+rect(350,55,80,50,'LED')+rect(130,130,65,40,'C1')+line(paths[v.net],'selected')+txt(105,64,'+5V')+txt(28,225,'PCB · 부품 위치와 구리');
 b+=rect(40,240,470,150,'','board')+rect(65,260,55,35,'H1')+rect(180,260,70,35,'R1')+rect(350,305,65,35,'LED')+rect(200,325,60,35,'C1');
 const pp={power:'M120 278H180M150 278V345H200',led:'M250 278H380V305',ground:'M410 325H475V370H90V295M260 345H300V370'};
 b+=line(pp[v.net],v.route?'selected':'airwire')+txt(310,380,v.route?'실제 구리':'미배선 안내선');
 out(n,names[v.net]+' 연결',b,[['선택한 넷',names[v.net]],['물리적 상태',v.route?'구리로 배선':'미배선']],v.route?'선택한 넷을 구리로 연결했습니다. 회로도와 위치는 달라도 연결 관계는 같습니다.':'점선은 배선할 곳의 안내입니다. 아직 PCB 위의 물리적 연결이 아닙니다.',410);
 }else if(n===2){
 const desc={pad:['SMD 패드','부품 단자를 납땜하는 노출 구리 면'],tht:['THT 패드','부품 다리가 통과하는 도금 관통 패드'],trace:['트레이스','넷을 잇는 가는 구리 배선'],pour:['Copper pour','특정 넷으로 채운 넓은 구리 면'],mask:['솔더 마스크','구리를 덮는 보호층; 선택적 개방'],silk:['실크스크린','부품명·극성을 알리는 인쇄'],core:['절연 코어','구리 층 사이의 절연 재료'],via:['도금 비아','층간을 연결하는 도금 금속 통로']},hl=k=>v.feature===k?'hot':'';
 let b=txt(25,30,'보드 표면')+rect(25,45,510,130,'','board')+rect(50,65,50,45,'','copper '+hl('pad'))+rect(350,65,145,85,'','copper '+hl('pour'))+line('M100 90H220V120H350','copper-line '+hl('trace'))+dot(245,90,21,'copper '+hl('tht'))+dot(245,90,9,'hole')+dot(300,120,12,'copper '+hl('via'))+dot(300,120,4,'hole')+txt(50,150,'R1   +','silk '+hl('silk'))+rect(110,60,75,20,'','mask '+hl('mask'))+txt(25,205,'단면 · 두께는 확대하여 표시');
 b+=rect(30,230,500,40,'','core '+hl('core'))+rect(30,220,500,9,'','copper')+rect(30,271,500,9,'','copper')+rect(30,211,185,8,'','mask '+hl('mask'))+rect(285,211,245,8,'','mask '+hl('mask'))+rect(235,218,10,65,'','copper '+hl('via'))+rect(265,218,10,65,'','copper '+hl('via'))+txt(315,257,'절연층');
 out(n,desc[v.feature][0],b,[['요소',desc[v.feature][0]],['역할',desc[v.feature][1]]],desc[v.feature][1]+'. 색은 구분을 돕기 위한 모식도이며 실제 재료색·비율과 다릅니다.');
 }else if(n===3){
 const errors=M.mapping(v.package==='match',v.reverse);
 out(n,'심벌과 풋프린트 대응',txt(30,35,'회로 심벌')+rect(60,80,140,90)+txt(120,105,'H1')+txt(67,145,'1 GND')+txt(143,145,'2 +5V')+txt(315,35,'실제 풋프린트')+rect(320,70,220,120,'','board')+rect(330,95,40,55,'1','copper')+rect(450,95,40,55,'2','copper')+(v.package!=='match'?rect(390,95,40,55,'3','copper'):'')+line(v.reverse?'M95 170V230H470V150M165 170V205H350V150':'M95 170V205H350V150M165 170V230H470V150','airwire')+dot(95,170,4)+dot(165,170,4)+txt(315,265,v.reverse?'연결: 1→2, 2→1':'연결: 1→1, 2→2')+txt(30,288,'예시: 핀 번호와 패키지 크기를 각각 검토'),
 [['패키지',v.package==='match'?'일치':'불일치'],['핀 대응',v.reverse?'뒤바뀜':'1→1, 2→2']],errors.length?'문제: '+errors.map(e=>e==='package'?'부품 크기와 패드 간격 불일치':'핀 번호 뒤바뀜').join(' / ')+'. 전원 커넥터는 핀이 바뀌면 역극성 위험이 있으므로 번호와 넷을 대조합니다.':'심벌과 풋프린트의 핀 번호·패키지가 일치합니다. 실제 부품 데이터시트로 치수도 대조하세요.');
 }else if(n===4){
 const r=M.net(v.left,v.right,v.routed);
 out(n,'넷 이름과 배선',rect(45,85,150,80,'U1 · '+v.left)+rect(345,85,150,80,'H1 · '+v.right)+line('M195 125H345',r.physical?'selected':r.logical?'airwire':'wire')+txt(55,225,r.logical?'같은 이름 = 같은 논리 넷':'다른 이름 = 별개 넷'),
 [['논리 연결',r.logical?'같은 넷':'서로 다른 넷'],['물리 연결',r.physical?'배선 완료':'연결 없음']],r.logical?(r.physical?'동일한 넷에 실제 배선이 생겼습니다.':'회로도에서는 연결됩니다. PCB에서는 여전히 구리 배선이 필요합니다.'):'두 라벨은 서로 다른 넷입니다. 이 모형의 배선 버튼은 서로 다른 넷을 강제로 쇼트시키지 않습니다.');
 }else if(n===5){
 const errors=M.checkDesign(v.footprint,v.connected);
 if(action==='check'){s.checked=JSON.stringify(v);s.converted=false;}
 if(action==='convert')s.converted=s.checked===JSON.stringify(v)&&errors.length===0;
 const current=s.checked===JSON.stringify(v),ready=current&&!errors.length;
 out(n,'PCB 변환 전 확인',rect(30,95,145,80,'회로도')+line('M175 135H210',ready?'selected':'wire',true)+rect(215,95,135,80,ready?'검사 통과':'검사 단계')+line('M350 135H385',s.converted&&ready?'selected':'wire',true)+rect(390,95,140,80,s.converted&&ready?'':'PCB 대기')+(s.converted&&ready?txt(400,115,'PCB 생성')+rect(405,135,25,25,'','copper')+rect(485,135,25,25,'','copper')+line('M430 148H485','airwire'):'')+txt(35,230,'수정 뒤에는 다시 검사해야 합니다.'),
 [['검사 상태',current?errors.length+'개 문제':'검사 필요'],['변환 상태',s.converted&&ready?'완료':'대기']],s.converted&&ready?'검사를 통과한 설계를 PCB로 변환했습니다. 이후에도 배치·배선·DRC 확인은 별개입니다.':!current?'풋프린트와 연결을 수정한 뒤 “① 규칙 검사”를 누르세요.':errors.length?'변환 전 수정: '+errors.map(e=>e==='footprint'?'풋프린트 없음':'필수 넷 미연결').join(', '):'기초 검사가 통과했습니다. 이제 PCB 변환을 누를 수 있습니다.');
 }else if(n===6){
 const on=v.state==='on';M.buck(v.state);
 let b=txt(20,28,'비동기 buck · 연속 전류(CCM) 모형')+line('M50 80H145M205 80H255M335 80H480V245H50V80')+rect(145,60,60,40,on?'ON':'OFF')+rect(255,60,80,40,'L')+txt(28,60,'VIN')+txt(430,60,'VOUT')+dot(235,80)+txt(215,65,'SW')+line('M95 80V135M95 160V245M80 135H110M80 160H110')+txt(42,192,'Cin')+line('M395 80V135M395 160V245M380 135H410M380 160H410')+txt(410,160,'Cout')+rect(450,140,60,50,'부하')+line('M235 80V150M235 180V245')+'<path d="M220 180L235 155L250 180Z" class="diode"/>'+line('M218 150H252')+txt(255,175,'D')+txt(250,210,'A: GND / K: SW')+txt(35,275,'GND');
 b+=line(on?'M55 80H140':'M235 235V185','flow',true)+line('M340 80H385','flow',true)+line(on?'M440 245H120':'M440 245H240','flow',true);
 if(v.feedback)b+=rect(135,120,85,35,'제어기')+line('M430 80V290H177V155','feedback')+line('M177 120V100','feedback')+txt(245,310,'출력 감지 → 제어기');
 out(n,'buck '+v.state,b,[['상단 스위치',on?'도통':'차단'],['캐치 다이오드',on?'역바이어스':'전류 경로 도통']],on?'VIN에서 스위치·인덕터·부하로 전류가 흐릅니다. Cin은 입력과 GND 사이에 병렬로 놓입니다.':'인덕터 전류는 같은 방향을 유지하며 GND→다이오드→SW→L→부하→GND로 순환합니다. 스위치를 끈 즉시 L 전류가 0이 되는 모형이 아닙니다.',330);
 }else if(n===7){
 const blocks={ldo:['LDO','5V에서 3.3V로 선형 강압'],bypass:['바이패스','전원 핀 가까이 순간 전류를 공급'],dac:['DAC','디지털 값을 아날로그 전압으로 변환'],header:['헤더','외부 신호·전원 연결'],eeprom:['EEPROM','전원이 꺼져도 설정 데이터를 보관']};
 const loss=M.ldo(5,3.3,v.current/1000),cx=v.near?260:440;
 let b=rect(25,50,125,65,'5V → LDO',v.block==='ldo'?'part hot':'part')+rect(240,50,125,65,'MCU 3.3V')+line('M150 82H240')+rect(cx,155,85,50,'C',v.block==='bypass'?'part hot':'part')+line('M300 115V135H'+(cx+42)+'V155M'+(cx+42)+' 205V240H300','selected')+rect(30,255,130,40,'DAC',v.block==='dac'?'part hot':'part')+rect(210,255,130,40,'HEADER',v.block==='header'?'part hot':'part')+rect(390,255,140,40,'EEPROM',v.block==='eeprom'?'part hot':'part');
 const routes={ldo:'M150 82H240',dac:'M245 115V225H95V255',header:'M280 115V255',eeprom:'M350 115H540V235H460V255'};
 if(routes[v.block])b+=line(routes[v.block],'flow',true);
 out(n,blocks[v.block][0],b,[['선택 기능',blocks[v.block][1]],['LDO 이상 손실',num(loss,3)+' W']],blocks[v.block][1]+'. 바이패스가 '+(v.near?'가까워 전원·리턴 연결이 짧습니다.':'멀어 연결 경로가 길어졌습니다.')+' 손실은 (5−3.3)×I 계산만 하며 접합 온도는 예측하지 않습니다.',320);
 }else if(n===8){
 const e=f.elements.namedItem('current'),range=v.board==='A'?35:10;e.min=-range;e.max=range;if(Math.abs(v.current)>range){e.value=Math.sign(v.current)*range;v.current=Number(e.value);}f.querySelector('[data-value="current"]').value=e.value;
 const r=M.boardSense(v.board,v.current);
 out(n,'보드 '+v.board+' 판본',rect(25,55,220,80,r.driver)+rect(300,55,235,80,r.mosfet)+line('M245 95H300','selected',true)+rect(35,190,150,60,'Rs '+num(r.shunt*1000,0)+' mΩ')+line('M185 220H220','selected',true)+rect(225,190,130,60,'Gain '+r.gain)+line('M355 220H390','selected',true)+rect(395,190,140,60,num(r.voltage,3)+' V'),
 [['판본·예시 범위',v.board+' · ±'+r.range+' A'],['이상 ADC 전압',num(r.voltage,3)+' V']],v.board==='A'?'A: 인버터 하드웨어 PDF의 UCC27211·2 mΩ·22배를 함께 사용합니다. 출력 = 1.65 + I×0.002×22.':'B: 소형보드의 IR2101·10 mΩ·15배를 함께 사용합니다. 출력 = 1.65 + I×0.010×15. 판본 선택 시 전류 범위도 바뀝니다.');
 }
}
function renderExtra(n,f,action){
 const v=val(f),s=states[n]||(states[n]={});
 if(n===9){
 const errors=M.placement(v.width,v.x,v.hole),bw=v.width*3.5,cx=25+v.x*3.5;
 let b=rect(25,45,bw,200,'','board')+dot(45,65,10,'hole')+dot(bw+5,65,10,'hole')+rect(cx,100,35,65,'H',errors.length?'part hot':'part');
 if(v.hole)b+=dot(cx+17,125,17,'hole');
 out(n,'외곽과 커넥터 위치',b+txt(30,275,'보드 '+v.width+' mm / 커넥터 x='+v.x+' mm, 폭 10 mm'),[['외곽 범위',errors.includes('outside')?'커넥터 돌출':'외곽 안'],['체결 영역',v.hole?'간섭 설정':'간섭 없음']],errors.length?'기구 문제: '+errors.map(e=>e==='outside'?'커넥터가 외곽을 넘음':'체결 영역과 간섭').join(' · ')+'. 연결이 맞아도 조립이 불가능할 수 있습니다.':'이 단순 외곽·체결 검사는 통과했습니다. 실제 높이·케이블·공구 접근성은 추가로 확인합니다.');
 }else if(n===10){
 const dx=v.driver==='near'?350:70,ax=v.analog==='near'?340:80,ix=v.input==='near'?365:70;
 out(n,'기능별 배치',rect(25,45,510,250,'','board')+rect(390,80,120,60,'MOSFET')+rect(dx,175,120,55,'Driver')+line('M'+(dx+60)+' 175V155H450V140','selected')+rect(ax,240,140,40,'Analog/ADC')+rect(ix,50,65,28,'벌크 C')+rect(465,50,65,28,'입력 H1')+line('M'+(ix+65)+' 64H465','airwire')+txt(35,325,'프리셋 위치 · 길이와 면적은 상대 비교'),[['Driver 경로',v.driver==='near'?'짧은 프리셋':'긴 프리셋'],['아날로그 구역',v.analog==='near'?'스위칭부 근처':'이격 프리셋'],['입력–벌크 C',v.input==='near'?'짧은 프리셋':'긴 프리셋']],(v.driver==='far'?'게이트 경로가 깁니다. ':'게이트 경로가 짧습니다. ')+(v.analog==='near'?'민감 회로가 스위칭부에 가깝습니다. ':'민감 회로를 이격했습니다. ')+(v.input==='near'?'입력 커넥터와 벌크 C가 가깝습니다.':'벌크 C가 입력 커넥터에서 멉니다.')+' 고주파 입력 바이패스의 짧은 스위칭 루프는 실험 12에서 따로 봅니다. 수치 EMI 점수를 계산하는 실험은 아닙니다.',350);
 }else if(n===11){
 if(v.layers==='2'&&v.location==='inner'){f.elements.namedItem('location').value='outer';v.location='outer';}
 const r=M.trace(v.length,v.width,v.thickness,v.current),count=Number(v.layers);
 let b=txt(30,30,count+'층 단면 · 구리와 절연층');
 for(let i=0;i<count;i++){b+=rect(35,55+i*36,490,10,'','copper '+((v.location==='outer'&&i===0)||(v.location==='inner'&&i===1)?'hot':''));if(i<count-1)b+=rect(35,66+i*36,490,24,'','core');}
 b+=txt(35,235,'선택: '+(v.location==='outer'?'외층':'내층')+' / 20°C 균일 구리')+rect(35,260,Math.max(45,v.length*3),Math.min(45,v.width*8),'','copper')+txt(35,330,'L='+v.length+' mm / W='+v.width+' mm / t='+v.thickness+' μm');
 out(n,'구리 단면과 저항',b,[['배선 저항',num(r.r*1000,2)+' mΩ'],['전압 강하 / 손실',num(r.drop,3)+' V / '+num(r.power,3)+' W']],(count===2?'2층에는 내층 구리가 없어 외층으로 표시합니다. ':'동일 치수의 DC 저항은 같아도 내·외층의 실제 방열 조건은 다릅니다. ')+'R=ρL/(Wt), V=IR, P=I²R. 이 값만으로 허용전류나 온도 상승을 결정하지 않습니다.',355);
 }else if(n===12){
 const compact=v.route==='compact',y=compact?120:235,x=compact?350:480;
 let b=txt(30,30,'buck 입력 hot loop · 배치 평면 개념도')+rect(50,45,80,45,'Cin')+rect(240,45,95,45,'SW IC')+rect(x-35,y-20,70,40,'D')+line('M100 65H280H'+x+'V'+y+'H100Z','flow',true)+txt(100,y+45,'귀환')+txt(25,310,'상대 눈금이며 실제 mm가 아닙니다.');
 for(let i=0;i<Number(v.vias);i++)b+=dot(150+i*45,y,8,'pad');
 out(n,'입력 고주파 루프',b,[['상대 루프 면적',(x-100)*(y-65)+' u²'],['상대 경로 길이',2*(x-100+y-65)+' u']],compact?'Cin–입력 스위치–캐치 다이오드 연결 루프가 좁아졌습니다. SW 구리를 무조건 넓히는 것과 다릅니다.':'같은 회로라도 전류·귀환 경로가 크게 우회하면 루프 면적이 커집니다. 비아 개수만으로 인덕턴스나 EMI를 계산하지 않습니다.',340);
 }else if(n===13){
 if(!s.applied||action==='refill')s.applied={...v};
 const a=s.applied,r=M.pour(a.net,a.via,a.island,a.gap,a.rule),pending=JSON.stringify(v)!==JSON.stringify(a);
 const clearance=5+a.gap*15;
 let b=txt(25,30,'목표: 상층 GND pour → 비아 → 하층 GND')+rect(30,50,500,150,'','board')+rect(50,70,a.island?190:450,110,'','copper')+(a.island?rect(270,70,230,110,'','copper'):'')+txt(65,100,a.net+' pour')+(a.island?txt(315,95,'비아 구역'):'')+rect(400-clearance,100-clearance,75+2*clearance,35+2*clearance,'',a.gap<a.rule?'hole hot':'hole')+rect(400,100,75,35,'PAD','part')+txt(335,175,'간격 '+a.gap+' mm')+txt(30,235,'하층 GND')+line('M50 255H510','selected');
 if(a.via){const viaX=a.island?300:200;b+=dot(viaX,155,10,'pad');if(a.net==='GND')b+=line('M'+viaX+' 165V255','selected');}else b+=txt(65,170,'비아 없음');
 if(a.island)b+=rect(245,70,25,110,'','hole')+txt(55,175,'단절된 섬');
 out(n,'구리 채움 검사',b,[['적용 간격 / 규칙',a.gap+' / '+a.rule+' mm'],['채움 상태',pending?'수정 대기 · 다시 채우기':r.errors.length+'개 문제']],(pending?'“다시 채우기”를 눌러 갱신하세요. 현재 적용값: ':'')+(r.errors.length?r.errors.map(e=>({'wrong-net':'목표 GND와 다른 넷','missing-via':'하층 GND로 가는 비아 없음','isolated':'keepout으로 고립된 구리 조각','clearance':'규칙보다 작은 간격'}[e])).join(' / '):'GND 넷·층간 연결·간격 조건 충족')+'. 이 실험은 상층 구리가 하층 GND에 비아로만 연결되는 조건입니다.');
 }else if(n===14){
 const near=v.distance==='near',x=near?350:465,dis=v.gate==='discharge';
 let b=txt(20,25,'소형보드 B · 고측 게이트 경로')+rect(30,110,110,130,'IR2101')+txt(45,105,'VB')+txt(110,255,'VS')+txt(110,150,'HO')+rect(x,120,70,95,'MOSFET')+txt(x+4,115,'Gate')+txt(x+4,235,'Source')+line('M140 145H190M270 145H'+x+'M'+(x+35)+' 215V285H105V240')+rect(190,125,80,35,'R22 10Ω')+line('M155 145V75H190M270 75H278M300 75H310V145')+rect(190,55,80,35,'R24 10Ω')+'<path d="M300 65L280 75L300 85Z" class="diode"/>'+line('M278 62V88')+txt(278,45,'D2 ←')+line('M'+(x+35)+' 215V285H105V240','selected');
 b+=line(dis?'M'+(x-5)+' 145H275':'M145 145H185','flow',true);
 if(dis)b+=line('M310 137V75H303','flow',true)+line('M185 75H156V130','flow',true);
 b+=txt(145,325,dis?'방전: R22 및 R24·D2 병렬':'충전: R22 / D2 역바이어스');
 b+=rect(25,40,80,35,'C84')+line('M55 75V110','feedback');
 if(v.caps)b+=line('M95 75H15V285H105','feedback');
 else b+=txt(25,350,'오류: C84의 VS 귀환 누락');
 b+=txt(25,385,'부트스트랩: VB–C84–VS')+txt(25,420,'VCC')+line('M75 415H165M300 415H400','selected')+rect(165,395,135,40,'C80 / C81')+txt(410,420,'COM')+txt(25,465,'독립 전원 바이패스: VCC–C80/C81–COM');
 if(v.shared)b+=line('M'+(x+35)+' 285H20','flow',true)+txt(25,305,'전력 전류가 VS 귀환 공유');
 out(n,'게이트 '+(dis?'방전':'충전'),b,[['배치 경로',near?'가까운 프리셋':'먼 프리셋'],['C84 VS 귀환',v.caps?'연결':'누락']],(dis?'D2는 gate→driver 방향으로 도통하여 R24 경로를 추가합니다. R22에도 방전 전류가 흐를 수 있으며 분배량은 계산하지 않습니다.':'HO가 R22를 통해 게이트를 충전합니다. D2 캐소드는 driver 쪽이므로 이 방향은 역바이어스입니다.')+(v.shared?' Source 귀환을 전력 전류와 공유하여 공통 임피던스 영향이 생길 수 있습니다.':' 드라이버 귀환을 전력 경로와 구분합니다.')+(v.caps?' C84는 VB–VS로 연결됩니다.':' C84의 VS 귀환이 빠졌습니다.')+' C80/C81은 VCC–COM에 고정해 표시합니다. R25·C58 등은 경로 그림에서 생략했습니다.',490);
 }else if(n===15){
 const r=M.kelvin(v.current,v.shunt,v.lead,v.kelvin),a=v.kelvin?230:70,b=v.kelvin?330:490;
 out(n,'Kelvin 감지',txt(25,30,'전력 경로와 전압 감지 위치')+line('M30 95H530','copper-line')+rect(80,75,80,40,v.lead+' mΩ')+rect(230,65,100,60,v.shunt+' mΩ')+rect(400,75,80,40,v.lead+' mΩ')+line('M'+a+' 95V210H240M'+b+' 95V210H320','feedback')+rect(240,185,80,55,'측정')+dot(a,95)+dot(b,95)+line(v.current>=0?'M30 50H180':'M180 50H30','flow',true)+txt(350,50,v.current+' A')+txt(35,280,v.kelvin?'션트 양단에 별도 sense':'전력 배선 양 끝에서 sense'),[['측정 / 리드 오차',num(r.measuredV*1000,1)+' / '+num(r.errorV*1000,1)+' mV'],['환산 전류 / 션트 손실',num(r.estimatedI,2)+' A / '+num(r.shuntPower,3)+' W']],v.kelvin?'이상적인 무전류 sense 선이 션트 양단만 읽어 전력 리드 강하를 제외합니다. 증폭기 오프셋·저항 공차 등은 남습니다.':'양쪽 리드 전압 강하가 포함됩니다. 저항이 작은 션트일수록 같은 배선 저항의 비중이 커집니다.');
 }else if(n===16){
 const split=v.plane==='split',r=M.returnPath(split,v.bridge),voltage=M.ntc(v.ntc),done=[v.drc,v.mechanical,v.silk].filter(Boolean).length;
 let b=txt(20,25,'A. 기준면·신호 귀환')+rect(25,45,510,115,'','board');
 if(split)b+=rect(260,45,35,115,'','hole');
 b+=line('M55 75H500','flow',true)+line(!split?'M495 120H60':v.bridge?'M495 120H340V178H210V120H60':'M495 120H310','feedback')+txt(45,150,!r.connected?'귀환 경로 단절':r.detour?'우회 연결':'연속 귀환');
 if(v.stitch)b+=dot(105,120,8)+txt(130,115,'동일 GND 층 연결');
 b+=txt(20,220,'B. 바이패스 위치')+rect(35,240,95,45,'MCU')+rect(v.bypass?165:420,240,85,45,'C')+line('M130 250H'+(v.bypass?165:420)+'M130 275H'+(v.bypass?165:420),'selected')+txt(20,325,'C. NTC 분압 · 저항은 입력값')+txt(25,355,'3.3V')+rect(80,350,110,45,'R18 3.3kΩ')+line('M190 372H270','selected')+dot(230,372)+line('M230 372V410')+txt(205,425,'ADC')+line('M25 372H80')+rect(270,350,100,45,'NTC')+line('M370 372H415')+txt(420,375,'GND')+txt(25,455,'ADC '+num(voltage,3)+' V · '+(v.thermal?'발열원 가까이':'발열원에서 멀리'));
 out(n,'최종 설계 점검',b,[['기준면 귀환',!r.connected?'단절':r.detour?'우회':'연속'],['NTC ADC / 최종 확인',num(voltage,3)+' V / '+done+' of 3']],(!r.connected?'GND 분할로 귀환이 끊겼습니다. ':r.detour?'연결은 생겼지만 귀환 루프가 길어졌습니다. ':'연속 기준면이 신호 귀환을 지지합니다. ')+(v.bypass?'바이패스 연결이 짧습니다. ':'바이패스 연결이 깁니다. ')+'NTC 위치는 열 결합을 뜻합니다. 계산은 입력 저항만 쓰며 온도·응답 지연은 추정하지 않습니다. 체크 3개가 제조 승인을 뜻하지 않습니다.',480);
 }
}

document.querySelectorAll('[data-lab]').forEach(f=>{
 const n=Number(f.dataset.lab);f.addEventListener('submit',e=>e.preventDefault());
 f.addEventListener('input',()=>render(n,f));f.addEventListener('change',()=>render(n,f));
 f.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-reset')){f.reset();states[n]={};}render(n,f,b.dataset.action);});render(n,f);
});
window.PcbRender=render;
})();
