(function(root) {
  'use strict';
  const integer = (value,min,max) => Number.isInteger(value) && value >= min && value <= max;
  function output({mode,type,odr}) {
    if (mode !== 1) return {drive: ['external','','alternate','analog'][mode],led:null};
    return {drive: odr === 0 ? 'low' : type === 0 ? 'high' : 'hiz',led:odr === 0};
  }
  function writeGPIO(state,key,value) {
    if (!['mode','type','odr'].includes(key) || !integer(value,0,key === 'mode' ? 3 : 1)) throw new Error('유효하지 않은 GPIO 설정');
    return state.clock ? {...state,[key]:value} : {...state};
  }
  function field(register,pin,mode,orOnly=false) {
    if (!integer(register,0,0xFFFFFFFF) || !integer(pin,0,15) || !integer(mode,0,3)) throw new Error('유효하지 않은 비트 필드');
    const shift=2*pin;
    return ((orOnly ? register : register & ~(3 << shift)) | (mode << shift)) >>> 0;
  }
  function input({pressed,external,pull}) {
    // shortcut: steady-state bias only; add resistor, threshold and RC models when teaching actual voltages or timing.
    if (!['none','up','down'].includes(pull)) throw new Error('유효하지 않은 풀 설정');
    if (pressed) return {level:0,reason:'pressed'};
    if (external && pull === 'down') return {level:null,reason:'conflict'};
    if (external) return {level:1,reason:'external'};
    if (pull === 'none') return {level:null,reason:'floating'};
    return {level:pull === 'up' ? 1 : 0,reason:pull};
  }
  function bsrr(odr,set,reset) {
    if (![odr,set,reset].every(value=>integer(value,0,0xFFFF)) || (set & reset)) throw new Error('이 실습은 같은 핀의 동시 set/reset을 허용하지 않습니다.');
    return ((odr & ~reset) | set) & 0xFFFF;
  }
  function finishRace({current,snapshot,method}) {
    return method === 'odr' ? (snapshot | 8) : bsrr(current,8,0);
  }
  function canEnter(state) {
    return Boolean((state.pending & 0x10) && state.imr && state.nvic && !state.active);
  }
  function irq(state,action) {
    // shortcut: EXTI4 and delivery gates only; model NVIC pending, priorities and time before teaching interrupt latency.
    const next={...state};
    if (action === 'press' || action === 'release') {
      next.pressed=action === 'press';
      const edge=next.pressed !== state.pressed;
      if (edge && state.route === 'D' && (next.pressed ? state.falling : state.rising)) next.pending |= 0x10;
    } else if (action === 'enter' && canEnter(state)) {
      next.active=true; next.count++;
    } else if (action === 'clear') next.pending &= ~0x10;
    else if (action === 'return') next.active=false;
    return next;
  }
  function diagnose({board,port,clock,pin,mode,odr}) {
    const expectedPort=board[0], expectedPin=Number(board.slice(1));
    const issues=[];
    if (port !== expectedPort) issues.push('port');
    if (clock !== port) issues.push('clock');
    if (pin !== expectedPin) issues.push('pin');
    if (mode !== 1) issues.push('mode');
    if (odr !== 0) issues.push('odr');
    return issues;
  }
  const api={output,writeGPIO,field,input,bsrr,finishRace,canEnter,irq,diagnose};
  if (typeof module === 'object' && module.exports) module.exports=api;
  else root.GpioStudy=api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
