(() => {
  'use strict';
  const M=window.GpioStudy;
  const $=id=>document.getElementById(id);
  const text=(id,value)=>{$(id).textContent=value;};
  const hex=value=>'0x'+(value>>>0).toString(16).toUpperCase().padStart(8,'0');
  const bits=(value,width=2)=>value.toString(2).padStart(width,'0');
  const on=(id,event,handler)=>$(id).addEventListener(event,handler);
  const metrics=(id,items)=>{$(id).innerHTML=items.map(([label,value])=>`<div class="metric"><span>${label}</span><strong>${value}</strong></div>`).join('');};
  const result=(id,message,uncertain=false)=>{text(id,message);$(id).classList.toggle('uncertain',uncertain);};
  const names={low:'LOW · 약 0V',high:'HIGH · 약 3.3V',hiz:'Hi-Z · 구동 해제',external:'입력 · 전압 미정',alternate:'AF · 다른 기능',analog:'아날로그 모드'};
  function ledDiagram(id,state,pin='PD3') {
    const low=state.drive==='low',high=state.drive==='high';
    $(id).innerHTML=`<svg viewBox="0 0 480 255" role="img" aria-labelledby="${id}-title ${id}-desc"><title id="${id}-title">${pin} 능동 LOW LED 회로</title><desc id="${id}-desc">${names[state.drive]}. LED ${state.led===null?'판단 불가':state.led?'켜짐':'꺼짐'}. LOW에서는 전원에서 LED와 저항, 핀을 거쳐 접지로 전류가 흐릅니다.</desc>
      <rect x="288" y="37" width="170" height="180" rx="12" fill="#e9efe8" stroke="#bccbc1" stroke-dasharray="4 4"/>
      <text x="20" y="48">+3.3 V</text><text x="329" y="23">VDD</text><text class="svg-small" x="300" y="205">MCU 출력단</text>
      <path class="wire" d="M30 80 H78 M110 80 H141 M183 80 H265 H350 M350 40 V50 M350 65 V125 M350 150 V174"/>
      ${!high?'<path class="wire" d="M350 50 L363 60"/>':''}${!low?'<path class="wire" d="M350 125 L366 143"/>':''}
      ${low?'<path class="flow" d="M30 80 H265 H350 V174"/>':''}
      ${high?'<path class="drive" d="M350 40 V80 H265"/>':''}
      <circle cx="93" cy="80" r="23" fill="${low?'#ffe2a0':'transparent'}"/>
      <path class="${low?'ledlit':'ledoff'}" d="M78 65 L106 80 L78 95 Z M109 62 V98" stroke-width="2.5"/>
      <path d="M94 58 l13 -10 M109 64 l13 -10" stroke="#aa500a" stroke-width="2"/>
      <path class="wire" d="M141 80 l5 -9 7 18 7 -18 7 18 7 -18 5 9 H183"/>
      <text class="svg-small" x="73" y="125">LED</text><text class="svg-small" x="140" y="125">330Ω</text>
      <circle cx="265" cy="80" r="6" fill="#087568"/><text x="240" y="59">${pin}</text>
      <path d="M335 179 H365 M341 186 H359 M347 193 H353" stroke="#586b73" stroke-width="2"/>
      <text class="svg-small" x="382" y="182">VSS</text>
      <text class="svg-small" x="375" y="95">위: ${high?'ON':'OFF'}</text><text class="svg-small" x="375" y="150">아래: ${low?'ON':'OFF'}</text>
      ${low?'<path d="M220 74 l10 6 -10 6 M344 153 l6 10 6 -10" fill="none" stroke="#aa500a" stroke-width="2.5"/>':''}
      <text x="20" y="176">${state.led===null?'? LED 판단 불가':state.led?'● LED 켜짐':'○ LED 꺼짐'}</text>
      <text class="svg-small" x="20" y="200">${names[state.drive]}</text><text class="svg-small" x="20" y="238">${low?'전류: 전원 → LED → 저항 → 핀 → 접지':high?'상단이 HIGH 구동 · LED 전위차 부족':state.drive==='hiz'?'닫힌 LED 전류 경로 없음 · 핀 전압 미정':'일반 GPIO 출력으로 판정하지 않는 상태'}</text></svg>`;
  }
  function basics() {
    let led=0;
    function renderLed(){
      ledDiagram('led-diagram',M.output({mode:1,type:0,odr:led}));
      $('led-low').setAttribute('aria-pressed',String(led===0));$('led-high').setAttribute('aria-pressed',String(led===1));
      result('led-result',led===0?'LED 켜짐 · PD3가 전류를 받아 접지로 흐르는 길을 엽니다. 전원 → LED → 330Ω → PD3 → VSS.':'LED 꺼짐 · PD3가 약 3.3V로 구동되어 LED 양쪽 전위차가 충분하지 않습니다.');
    }
    on('led-low','click',()=>{led=0;renderLed();});on('led-high','click',()=>{led=1;renderLed();});renderLed();
    let gpio={clock:false,mode:0,type:0,odr:0};
    function renderGpio(){
      $('gpio-clock').setAttribute('aria-pressed',String(gpio.clock));text('gpio-clock',gpio.clock?'Port D 클럭 끄기':'Port D 클럭 켜기');
      for(const key of ['mode','odr']){$('gpio-'+key).value=String(gpio[key]);$('gpio-'+key).disabled=!gpio.clock;}
      const state=M.output(gpio);ledDiagram('gpio-diagram',state);
      metrics('gpio-metrics',[['GPIODEN · 접근 클럭',gpio.clock?'1 · ON':'0 · OFF'],['MODER[7:6]',bits(gpio.mode)],['ODR[3] · 보존된 래치',gpio.odr],['현재 구동',names[state.drive]]]);
      const drive=state.led===null?'일반 출력이 아니므로 ODR만으로 LED를 판정하지 않습니다.':state.led?'LOW 구동 · LED 켜짐.':'HIGH 구동 · LED 꺼짐.';
      result('gpio-result',(gpio.clock?'레지스터 접근 가능. ':'클럭 OFF: 새 쓰기 차단, 기존 설정·래치는 유지. ')+drive,state.led===null);
      text('gpio-code',`RCC->AHB1ENR ${gpio.clock?'|= (1U << 3)':'&= ~(1U << 3)'};\n// 아래는 현재 보존된 설정을 설명하는 값입니다.\n// MODER[7:6] = ${bits(gpio.mode)}, ODR[3] = ${gpio.odr}\n${gpio.clock?'GPIOD->MODER = (GPIOD->MODER & ~(3U << 6))\n              | ('+gpio.mode+'U << 6);':'// 클럭 OFF에서는 GPIO 설정을 새로 쓰지 않습니다.'}`);
    }
    on('gpio-clock','click',()=>{gpio.clock=!gpio.clock;renderGpio();});
    for(const key of ['mode','odr'])on('gpio-'+key,'change',e=>{gpio=M.writeGPIO(gpio,key,Number(e.target.value));renderGpio();});
    on('gpio-reset','click',()=>{gpio={clock:false,mode:0,type:0,odr:0};renderGpio();});renderGpio();
    let selected=3,register=0,bitMessage='PD3이 선택되었습니다. 핀을 골라 해당 두 비트의 위치를 확인하세요.';
    for(let pin=15;pin>=0;pin--){const b=document.createElement('button');b.type='button';b.dataset.pin=pin;b.innerHTML=`PD${pin}<small>[${2*pin+1}:${2*pin}]</small>`;b.addEventListener('click',()=>{selected=pin;bitMessage=`PD${pin} 선택: 낮은 자리는 2×${pin}=${2*pin}입니다.`;renderBits();});$('pin-grid').appendChild(b);}
    function renderBits(){
      for(const button of $('pin-grid').querySelectorAll('button'))button.setAttribute('aria-pressed',String(Number(button.dataset.pin)===selected));
      $('bit-strip').innerHTML=Array.from({length:16},(_,i)=>{const pin=15-i;return `<div class="bit-cell ${pin===selected?'chosen':''}"><small>PD${pin}</small>${bits((register >>> (2*pin)) & 3)}</div>`;}).join('');
      text('bit-selected',`PD${selected} [${2*selected+1}:${2*selected}]`);text('bit-register',hex(register));
      result('bit-result',bitMessage);
      text('bit-code',`// PD${selected}의 두 비트만 지우고 새 값 넣기\nGPIOD->MODER = (GPIOD->MODER & ~(3UL << ${2*selected}))\n              | (${$('bit-mode').value}UL << ${2*selected});\n// 필드 마스크: ${hex((3 << (2*selected))>>>0)}`);
    }
    function apply(orOnly){const before=(register >>> (2*selected))&3;register=M.field(register,selected,Number($('bit-mode').value),orOnly);const after=(register >>> (2*selected))&3;bitMessage=`PD${selected}: ${bits(before)} → ${bits(after)}. ${orOnly?'OR는 기존 1을 지우지 않습니다.':'선택한 두 비트를 먼저 지우고 새 값을 넣었습니다.'} 다른 핀의 비트는 보존됩니다.`;renderBits();}
    on('bit-apply','click',()=>apply(false));on('bit-or','click',()=>apply(true));on('bit-mode','change',renderBits);
    on('bit-fault','click',()=>{register=0x90;selected=3;$('bit-mode').value='1';bitMessage='오류 예제: PD3=10, PD2=01. 원하는 PD3 출력 01을 OR만으로 만들어 보세요.';renderBits();});
    on('bit-reset','click',()=>{register=0;selected=3;$('bit-mode').value='1';bitMessage='학습용 MODER를 0으로 초기화했습니다.';renderBits();});renderBits();
  }
  function io(){
    let pressed=false;
    function renderSwitch(){
      const external=$('switch-external').checked,pull=$('switch-pull').value;
      const state=M.input({pressed,external,pull}),known=state.level!==null,led=known?state.level===0:null;
      text('switch-button',pressed?'스위치 놓기':'스위치 누르기');$('switch-button').setAttribute('aria-pressed',String(pressed));
      const reasons={pressed:'스위치가 접지로 연결되어 LOW입니다.',external:'외부 R4가 해제된 PD4를 HIGH로 바이어스합니다.',up:'외부 R4는 없지만 내부 풀업이 HIGH로 바이어스합니다.',down:'내부 풀다운이 LOW로 바이어스합니다. 단순 조건문은 눌림으로 판단합니다.',floating:'외부 R4도 내부 풀도 없습니다. 해제된 입력은 부동이며 0/1을 예측할 수 없습니다.',conflict:'외부 풀업과 내부 풀다운이 상충합니다. 분압·임계값을 계산하지 않는 이 모형에서는 판정 범위 밖입니다.'};
      $('switch-diagram').innerHTML=`<svg viewBox="0 0 480 290" role="img" aria-labelledby="switch-svg-title switch-svg-desc"><title id="switch-svg-title">PD4 풀업 스위치 회로</title><desc id="switch-svg-desc">${reasons[state.reason]}</desc>
      <text x="45" y="25">+3.3V</text><path class="wire ${external?'':'dashed'}" d="M90 35 V65 M90 107 V147 H390"/>
      ${external?'<path class="wire" d="M90 65 l-9 5 18 7 -18 7 18 7 -18 7 9 9"/>':'<path class="wire dashed" d="M90 65 V107"/>'}
      <text class="svg-small" x="112" y="83">R4 1kΩ ${external?'연결':'제거'}</text>
      ${pressed&&external?'<path class="flow" d="M90 35 V147 V240"/>':''}
      <circle cx="90" cy="147" r="5" fill="#087568"/><circle cx="390" cy="147" r="5" fill="#087568"/><text x="372" y="125">PD4</text>
      <path class="wire" d="M90 147 V177 M90 213 V240"/><path class="wire ${pressed?'live':''}" d="${pressed?'M90 177 V213':'M90 177 L65 206'}"/>
      <text class="svg-small" x="16" y="274">스위치 ${pressed?'닫힘':'열림'}</text>
      <path class="wire" d="M230 147 V190 M216 190 H244 M216 200 H244 M230 200 V240"/><text class="svg-small" x="249" y="207">C6 100nF</text>
      <path class="wire" d="M77 245 H103 M82 251 H98 M87 257 H93 M217 245 H243 M222 251 H238 M227 257 H233"/>
      <text class="svg-small" x="290" y="57">내부 풀: ${pull==='none'?'없음':pull==='up'?'UP':'DOWN'}</text>
      ${pull!=='none'?`<path class="drive dashed" d="M350 147 V${pull==='up'?70:235}"/><text class="svg-small" x="360" y="${pull==='up'?91:238}">${pull==='up'?'VDD':'VSS'}</text>`:''}
      <text x="290" y="273">입력: ${known?state.level:'? 미정'}</text></svg>`;
      metrics('switch-metrics',[['IDR[4]',known?state.level:'? · 미정'],['PUPDR[9:8]',pull==='none'?'00':pull==='up'?'01':'10'],['PD3 ODR[3] 명령',known?state.level:'예측 불가'],['LED',led===null?'? 판단 불가':led?'● 켜짐':'○ 꺼짐']]);
      const chain=[['핀 전압',known?(state.level?'HIGH':'LOW'):'미정'],['IDR[4]',known?state.level:'?'],['조건문',known?(state.level===0?'참 · 눌림':'거짓 · 놓음'):'결과 미정'],['PD3 LED',led===null?'예측 불가':led?'켜짐':'꺼짐']];
      $('switch-stages').innerHTML=chain.map(([title,value])=>`<div class="stage ${known?'on':'warn'}">${title}<strong>${value}</strong></div>`).join('');
      result('switch-result',(external?'원회로 R4 연결. ':'가상 비교: 외부 R4 제거. ')+reasons[state.reason],!known);
    }
    on('switch-button','click',()=>{pressed=!pressed;renderSwitch();});on('switch-external','change',renderSwitch);on('switch-pull','change',renderSwitch);
    on('switch-reset','click',()=>{pressed=false;$('switch-external').checked=true;$('switch-pull').value='none';renderSwitch();});renderSwitch();
    function renderDriver(){
      const type=Number($('driver-type').value),odr=Number($('driver-odr').value),speed=Number($('driver-speed').value),state=M.output({mode:1,type,odr});
      ledDiagram('driver-diagram',state);metrics('driver-metrics',[['OTYPER[3]',type],['ODR[3]',odr],['핀 구동',names[state.drive]],['OSPEEDR[7:6]',bits(speed)]]);
      result('driver-result',state.drive==='low'?'아래쪽 출력단 ON → PD3 LOW → LED 전류가 접지로 흐릅니다. 푸시풀과 오픈드레인 모두 LOW 구동이 가능합니다.':state.drive==='high'?'위쪽 출력단 ON → PD3 HIGH. 푸시풀은 HIGH도 능동 구동합니다.':'위·아래 출력단 모두 OFF → Hi-Z. ODR=1이지만 HIGH를 적극적으로 내보내지 않습니다. LED 전류 경로는 없고 핀 전압은 여기서 정하지 않습니다.',state.drive==='hiz');
      const width=[70,46,26,12][speed];
      $('speed-diagram').innerHTML=`<svg viewBox="0 0 480 205" role="img" aria-labelledby="speed-title speed-desc"><title id="speed-title">OSPEEDR 정성 파형</title><desc id="speed-desc">푸시풀 비교 파형. 설정 ${speed}에서 에지 기울기가 바뀌어도 명령 시점 간격은 일정합니다.</desc><path class="wire" d="M45 30 V150 H450"/><path class="wire dashed" d="M135 30 V150 M335 30 V150"/><text class="svg-small" x="5" y="44">H</text><text class="svg-small" x="5" y="146">L</text><path class="drive" d="M45 140 H135 C${135+width/4} 140 ${135+3*width/4} 45 ${135+width} 45 H335 C${335+width/4} 45 ${335+3*width/4} 140 ${335+width} 140 H445"/><text class="svg-small" x="105" y="173">명령 ①</text><text class="svg-small" x="307" y="173">명령 ②</text><text class="svg-small" x="100" y="197">같은 명령 간격 · 실제 시간 단위 없음</text></svg>`;
      text('speed-caption',`${['Low','Medium','High','Very high'][speed]} 설정의 개념도입니다. 위 출력단 선택과 독립적인 푸시풀 비교이며, 실제 ns·MHz·최대 주파수를 뜻하지 않습니다.`);
    }
    for(const id of ['driver-type','driver-odr','driver-speed'])on(id,'change',renderDriver);renderDriver();
    const registers={MODER:[0,'핀 모드를 읽고 씁니다.','uint32_t mode = GPIOD->MODER;'],OTYPER:[4,'출력단의 푸시풀/오픈드레인 형식을 읽고 씁니다.','uint32_t type = GPIOD->OTYPER;'],OSPEEDR:[8,'출력 에지 설정을 읽고 씁니다.','uint32_t speed = GPIOD->OSPEEDR;'],PUPDR:[12,'내부 풀업/풀다운 설정을 읽고 씁니다.','uint32_t pull = GPIOD->PUPDR;'],IDR:[16,'입력 논리 상태를 읽습니다. 출력 명령을 쓰는 칸이 아닙니다.','uint32_t input = GPIOD->IDR;'],ODR:[20,'출력 래치를 읽거나 씁니다. 실제 핀 전압과 항상 같지는 않습니다.','GPIOD->ODR |= (1U << 3);'],BSRR:[24,'지정 핀의 set/reset 명령을 씁니다. 현재 상태 저장값으로 읽지 않습니다.','GPIOD->BSRR = (1U << 19);']};
    function renderAddress(){const name=$('address-register').value,[offset,description,code]=registers[name],address=0x40020C00+offset;
      metrics('address-metrics',[['베이스',hex(0x40020C00)],['최종 주소',hex(address)]]);
      $('address-diagram').innerHTML=`<svg viewBox="0 0 480 140" role="img" aria-label="베이스 0x40020C00 더하기 오프셋 ${hex(offset)}는 ${hex(address)}"><rect x="15" y="20" width="190" height="80" rx="9" fill="#e2eee5" stroke="#b7ccc0"/><text x="33" y="48">GPIOD 베이스</text><text x="33" y="78">0x40020C00</text><text x="222" y="68">+</text><rect x="255" y="20" width="205" height="80" rx="9" fill="#fff1d9" stroke="#dfc69b"/><text x="275" y="48">${name} 오프셋</text><text x="275" y="78">${hex(offset)}</text><text class="svg-small" x="20" y="126">= ${hex(address)} · 32비트 레지스터 접근 예시</text></svg>`;
      result('address-result',`${name}: ${description}`);
      text('address-code',`// CMSIS 이름으로 접근\n${code}\n\n// 같은 주소를 포인터로 표현하는 원리\n${name==='BSRR'?`*(volatile uint32_t *)${hex(address)} = (1U << 19);`:`volatile uint32_t *reg = (volatile uint32_t *)${hex(address)};\nuint32_t value = *reg;`}\n// 메모리 맵 원리 설명이며, 실제 접근에는 포트 클럭 등 준비가 필요합니다.`);
    }
    on('address-register','change',renderAddress);renderAddress();
  }
  function advanced(){
    let race={step:0,current:0,snapshot:0,method:'odr'},lastBsrr=null;
    function renderRace(){
      $('race-read').disabled=race.step!==0;$('race-interrupt').disabled=race.step!==1;$('race-write').disabled=race.step!==2;
      for(const id of ['bsrr-set','bsrr-reset'])$(id).disabled=race.step<3;
      text('race-read',race.method==='odr'?'① 메인: ODR 읽기':'① 메인: 쓰기 전 대기 · 읽기 불필요');
      metrics('race-metrics',[['현재 ODR',hex(race.current)],['메인에 저장된 옛 값',race.method==='odr'&&race.step>0?hex(race.snapshot):'읽기 없음']]);
      $('race-bits').innerHTML=[4,3].map(pin=>`<div class="stage ${(race.current&(1<<pin))?'on':''}">PD${pin}<strong>ODR[${pin}]=${(race.current>>>pin)&1}</strong></div>`).join('');
      const timeline=[race.method==='odr'?'ODR=0을 메인 변수에 읽어 둠':'BSRR는 ODR 읽기가 필요 없음','다른 코드가 PD4 set: ODR=0x10','메인이 PD3 set 명령 수행'];
      $('race-timeline').innerHTML=timeline.map((label,index)=>`<li class="${race.step>index?'done':''}">${race.step>index?'✓':'○'} ${index+1}. ${label}</li>`).join('');
      const message=race.step===0?'①부터 순서대로 진행하세요. 초기 ODR=0입니다.':race.step===1?'메인이 잠시 멈춘 사이, 다른 코드가 같은 포트의 PD4를 바꾸도록 합니다.':race.step===2?'현재 ODR=0x10입니다. 메인이 옛 값을 쓰는지, 대상 비트 명령만 쓰는지 비교하세요.':race.method==='odr'?'ODR 방식 완료: 메인의 옛 값 0에 bit3만 넣어 썼으므로 PD4 변경이 사라졌습니다. 아래 BS3/BR3로도 현재 래치를 바꿀 수 있습니다.':'BSRR 방식 완료: PD3만 set했으므로 다른 코드가 바꾼 PD4=1을 보존했습니다. 아래 BS3/BR3도 PD4를 보존합니다.';
      result('race-result',message,race.step===3&&race.method==='odr');
      text('race-code',race.method==='odr'?'// ODR |= (1U << 3)의 읽기-수정-쓰기 개념\nuint32_t old = GPIOD->ODR;  // 0을 읽음\n// 여기서 다른 코드: GPIOD->BSRR = (1U << 4);\nGPIOD->ODR = old | (1U << 3); // 옛 0으로 PD4 변경 소실':'// 다른 코드가 PD4를 set한 뒤에도\nGPIOD->BSRR = (1U << 3);   // PD3만 set, PD4 보존\n// ODR을 읽어 되쓰지 않습니다.');
      text('bsrr-last','최근 BSRR 명령: '+(lastBsrr===null?'없음 · 경쟁 실험 완료 후 사용':hex(lastBsrr)+' · 저장 상태가 아닌 쓰기 명령'));
    }
    function resetRace(){race={step:0,current:0,snapshot:0,method:$('race-method').value};lastBsrr=null;renderRace();}
    on('race-method','change',resetRace);on('race-reset','click',resetRace);
    on('race-read','click',()=>{race.snapshot=race.current;race.step=1;renderRace();});
    on('race-interrupt','click',()=>{race.current=M.bsrr(race.current,16,0);race.step=2;renderRace();});
    on('race-write','click',()=>{race.current=M.finishRace(race);race.step=3;renderRace();});
    on('bsrr-set','click',()=>{race.current=M.bsrr(race.current,8,0);lastBsrr=8;renderRace();});
    on('bsrr-reset','click',()=>{race.current=M.bsrr(race.current,0,8);lastBsrr=0x80000;renderRace();});renderRace();
    const initialIrq=()=>({syscfg:false,route:'A',falling:true,rising:false,imr:false,nvic:false,pressed:false,pending:0,active:false,count:0});
    let irq=initialIrq(),irqMessage='SYSCFG 클럭을 켜고 EXTI4 소스를 PD4로 선택하세요.';
    function renderIrq(){
      for(const key of ['syscfg','falling','rising','imr','nvic'])$('irq-'+key).checked=irq[key];
      $('irq-route').value=irq.route;$('irq-route').disabled=!irq.syscfg;
      $('irq-enter').disabled=!M.canEnter(irq);$('irq-clear').disabled=!(irq.pending&16);$('irq-return').disabled=!irq.active;
      text('irq-switch',irq.pressed?'PD4 버튼 놓기':'PD4 버튼 누르기');$('irq-switch').setAttribute('aria-pressed',String(irq.pressed));
      const pending=Boolean(irq.pending&16),connected=irq.route==='D';
      $('irq-diagram').innerHTML=`<svg viewBox="0 0 480 240" role="img" aria-labelledby="irq-svg-title irq-svg-desc"><title id="irq-svg-title">PD4부터 EXTI4까지의 경로</title><desc id="irq-svg-desc">입력 ${irq.pressed?'LOW':'HIGH'}, EXTI4 소스 P${irq.route}4, pending ${Number(pending)}.</desc><rect x="20" y="30" width="130" height="75" rx="9" fill="#e2eee5" stroke="#b7ccc0"/><text x="39" y="61">PD4 버튼</text><text x="39" y="87">${irq.pressed?'LOW · 눌림':'HIGH · 놓음'}</text><path class="${connected?'drive':'wire dashed'}" d="M150 68 H200"/><text class="svg-small" x="162" y="49">→</text><rect x="200" y="30" width="250" height="75" rx="9" fill="#edf1e8" stroke="#b7ccc0"/><text x="220" y="61">SYSCFG: P${irq.route}4 → EXTI4</text><text class="svg-small" x="220" y="87">${connected?'PD4 연결됨':'PD4는 연결되지 않음'}</text><path class="wire" d="M325 105 V143"/><text class="svg-small" x="338" y="130">↓ 에지 감지</text><rect x="200" y="149" width="250" height="70" rx="9" fill="${pending?'#fff1d9':'#edf1e8'}" stroke="#b7ccc0"/><text x="220" y="178">EXTI PR[4] = ${Number(pending)}</text><text class="svg-small" x="220" y="204">IMR와 별개인 사건 기록</text><text class="svg-small" x="20" y="172">하강: ${irq.falling?'ON':'OFF'}</text><text class="svg-small" x="20" y="199">상승: ${irq.rising?'ON':'OFF'}</text></svg>`;
      metrics('irq-metrics',[['EXTICR2[3:0]',connected?'0011 · Port D':'0000 · Port A'],['EXTI_PR',hex(irq.pending)],['ISR 진입 횟수',irq.count],['CPU 모형',irq.active?'ISR 실행 중':'메인 루프']]);
      const stages=[['에지 기록',pending?'pending=1':'pending=0',pending],['EXTI IMR',irq.imr?'전달 허용':'전달 차단',irq.imr],['NVIC',irq.nvic?'IRQ 허용':'IRQ 차단',irq.nvic],['ISR',irq.active?'실행 중':M.canEnter(irq)?'진입 가능':'대기',irq.active||M.canEnter(irq)]];
      $('irq-stages').innerHTML=stages.map(([title,value,active])=>`<div class="stage ${active?'on':''}">${title}<strong>${value}</strong></div>`).join('');
      result('irq-result',irqMessage+(pending?' EXTI4 pending이 남아 있습니다.':' EXTI4 pending은 0입니다.'),pending&&!irq.active&&!M.canEnter(irq));
      text('irq-code',`// 현재 교육 모형의 설정\nRCC->APB2ENR ${irq.syscfg?'|= (1U << 14)':'&= ~(1U << 14)'};\n// EXTICR2[3:0] = ${connected?'3 (Port D)':'0 (Port A)'}\n// FTSR[4]=${Number(irq.falling)}, RTSR[4]=${Number(irq.rising)}, IMR[4]=${Number(irq.imr)}\n// NVIC EXTI4: ${irq.nvic?'enabled':'disabled'}\n// 사건 정리 명령: EXTI->PR = (1U << 4);`);
    }
    for(const key of ['syscfg','falling','rising','imr','nvic'])on('irq-'+key,'change',e=>{irq[key]=e.target.checked;irqMessage=key==='syscfg'?'SYSCFG 접근 클럭을 바꿨습니다. 이미 선택된 소스는 유지됩니다.':'감지·전달 설정을 바꿨습니다. 기존 pending을 자동으로 지우지 않습니다.';renderIrq();});
    on('irq-route','change',e=>{if(irq.syscfg)irq.route=e.target.value;irqMessage=`EXTI4의 입력 소스를 P${irq.route}4로 선택했습니다.`;renderIrq();});
    on('irq-switch','click',()=>{irq=M.irq(irq,irq.pressed?'release':'press');irqMessage=irq.pressed?'HIGH→LOW: 하강 에지가 발생했습니다.':'LOW→HIGH: 상승 에지가 발생했습니다.';renderIrq();});
    for(const [action,message] of [['enter','ISR에 진입했습니다. 진입만으로 pending이 지워지지 않습니다.'],['clear','EXTI->PR = (1U << 4) 직접 쓰기로 EXTI4만 지웠습니다.'],['return','메인 루프로 복귀했습니다. pending이 남고 전달이 허용되면 다시 진입할 수 있습니다.']])on('irq-'+action,'click',()=>{irq=M.irq(irq,action);irqMessage=message;renderIrq();});
    on('irq-reset','click',()=>{irq=initialIrq();irqMessage='실습을 처음으로 되돌렸습니다. PD4 소스 연결부터 해 보세요.';renderIrq();});renderIrq();
    function renderDebug(){
      const config={board:$('debug-board').value,port:$('debug-port').value,clock:$('debug-clock').value,pin:Number($('debug-pin').value),mode:Number($('debug-mode').value),odr:Number($('debug-odr').value)};
      const issues=M.diagnose(config),connected=!issues.some(issue=>['port','clock','pin','mode'].includes(issue));
      const state=connected?M.output({mode:1,type:0,odr:config.odr}):{drive:'external',led:null};
      ledDiagram('debug-diagram',state,'P'+config.board);
      metrics('debug-metrics',[['실제 LED 핀','P'+config.board],['코드 대상','P'+config.port+config.pin],['코드 MODER 필드',`[${2*config.pin+1}:${2*config.pin}] = ${bits(config.mode)}`],['ODR / BSRR reset',`${config.pin} / ${config.pin+16}`]]);
      const checks={port:'코드 포트 = 실제 LED 포트',clock:'코드 대상 포트의 클럭 ON',pin:'코드 핀 번호 = LED 핀 번호',mode:'대상 MODER = 01 출력',odr:'능동 LOW LED 켜기 명령 = 0'};
      $('debug-checks').innerHTML=Object.entries(checks).map(([key,label])=>`<li>${issues.includes(key)?'✕':'✓'} ${label}</li>`).join('');
      result('debug-result',issues.length===0?'목표 달성: PC/PD 포트와 핀 설정이 실제 보드에 맞습니다. LOW 구동으로 LED 전류 경로가 닫혔습니다.':`${issues.length}개 확인 항목이 맞지 않습니다. ${connected?'배선과 설정은 맞지만 HIGH라 LED가 꺼져 있습니다.':'실제 LED 핀을 LOW 출력한다고 보장할 수 없습니다. 회로와 코드 대상을 비교하세요.'}`,issues.length>0);
      const clockBit=config.clock==='C'?2:3;
      text('debug-code',`// 현재 선택한 설정안: 실제 LED P${config.board}\nRCC->AHB1ENR |= (1U << ${clockBit}); // GPIO${config.clock} 클럭\nGPIO${config.port}->MODER = (GPIO${config.port}->MODER & ~(3U << ${2*config.pin}))\n               | (${config.mode}U << ${2*config.pin});\nGPIO${config.port}->OTYPER &= ~(1U << ${config.pin}); // 푸시풀\nGPIO${config.port}->BSRR = (1U << ${config.odr===0?config.pin+16:config.pin}); // ${config.odr===0?'reset → LOW':'set → HIGH'}\n// 실제 보드의 초기화 순서·지연 요구까지 담은 전체 실행 코드는 아닙니다.`);
    }
    for(const key of ['board','port','clock','pin','mode','odr'])on('debug-'+key,'change',renderDebug);
    on('debug-fault','click',()=>{for(const [key,value] of Object.entries({board:'C6',port:'D',clock:'D',pin:'3',mode:'1',odr:'0'}))$('debug-'+key).value=value;renderDebug();});renderDebug();
  }
  const page=document.body.dataset.page;
  if(page==='basics')basics();else if(page==='io')io();else if(page==='advanced')advanced();
})();
