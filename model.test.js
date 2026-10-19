'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('./model.js');

test('GPIO clock gating blocks new writes without removing an existing LOW output', () => {
  assert.equal(typeof M.writeGPIO, 'function');
  const state = {clock:false, mode:1, type:0, odr:0};
  const result = M.writeGPIO(state,'odr',1);
  assert.deepEqual(result,state);
  assert.equal(M.output(result).drive,'low');
  assert.equal(M.output(result).led,true);
});
test('output mode and output type determine drive, not the latch alone', () => {
  assert.equal(typeof M.output, 'function');
  for (const [mode,type,odr,drive,led] of [[0,0,0,'external',null],[2,0,0,'alternate',null],[3,0,0,'analog',null],[1,0,1,'high',false],[1,1,1,'hiz',false],[1,1,0,'low',true]]) {
    assert.deepEqual(M.output({mode,type,odr}),{drive,led});
  }
});
test('clock-enabled mode writes preserve other state and reject invalid controls', () => {
  assert.equal(typeof M.writeGPIO, 'function');
  assert.deepEqual(M.writeGPIO({clock:true,mode:0,type:0,odr:1},'mode',1),{clock:true,mode:1,type:0,odr:1});
  assert.throws(()=>M.writeGPIO({clock:true},'mode',4));
  assert.throws(()=>M.writeGPIO({clock:true},'unexpected',0));
});
test('clear/set replaces a two-bit field and preserves all neighboring pins', () => {
  assert.equal(typeof M.field, 'function');
  assert.equal(M.field(0xAAAAAAAA,3,1),0xAAAAAA6A);
  assert.equal(M.field(0x00000010,3,1),0x00000050);
  assert.equal(M.field(0xAAAAAAAA,15,1),0x6AAAAAAA);
  assert.equal(M.field(0,15,3),0xC0000000);
  assert.equal(M.field(0x80,3,1,true),0xC0);
  assert.throws(()=>M.field(0,16,1));
});
test('external pull-up keeps released PD4 HIGH when the internal pull is off', () => {
  assert.equal(typeof M.input, 'function');
  assert.deepEqual(M.input({pressed:false,external:true,pull:'none'}),{level:1,reason:'external'});
  assert.deepEqual(M.input({pressed:false,external:false,pull:'none'}),{level:null,reason:'floating'});
});
test('a closed switch reads LOW; opposed pulls are not mislabeled as floating or LOW', () => {
  assert.equal(typeof M.input, 'function');
  assert.deepEqual(M.input({pressed:true,external:true,pull:'down'}),{level:0,reason:'pressed'});
  assert.deepEqual(M.input({pressed:false,external:true,pull:'down'}),{level:null,reason:'conflict'});
  assert.deepEqual(M.input({pressed:false,external:false,pull:'down'}),{level:0,reason:'down'});
  assert.deepEqual(M.input({pressed:false,external:false,pull:'up'}),{level:1,reason:'up'});
});
test('BSRR changes only requested bits and rejects ambiguous same-pin commands in this lab', () => {
  assert.equal(typeof M.bsrr, 'function');
  assert.equal(M.bsrr(0x10,8,0),0x18);
  assert.equal(M.bsrr(0x18,0,8),0x10);
  assert.equal(M.bsrr(0,0x8000,0),0x8000);
  assert.equal(M.bsrr(0xFFFF,0,0x8000),0x7FFF);
  assert.throws(()=>M.bsrr(0,8,8));
});
test('stale ODR write loses the ISR bit but BSRR preserves it', () => {
  assert.equal(typeof M.finishRace, 'function');
  assert.equal(M.finishRace({current:0x10,snapshot:0,method:'odr'}),8);
  assert.equal(M.finishRace({current:0x10,snapshot:0,method:'bsrr'}),0x18);
});
const irq = overrides => ({route:'D',falling:true,rising:false,imr:false,nvic:false,pressed:false,pending:0,active:false,count:0,...overrides});
test('EXTI records a falling edge even while IMR and NVIC delivery are disabled', () => {
  assert.equal(typeof M.irq, 'function');
  const state = M.irq(irq(),'press');
  assert.equal(state.pending,0x10);
  assert.equal(M.canEnter(state),false);
  assert.equal(M.canEnter({...state,imr:true,nvic:true}),true);
});
test('wrong EXTI source or disabled edge cannot create pending', () => {
  assert.equal(typeof M.irq, 'function');
  assert.equal(M.irq(irq({route:'A'}),'press').pending,0);
  assert.equal(M.irq(irq({falling:false}),'press').pending,0);
  assert.equal(M.irq(irq({pressed:true,rising:true}),'release').pending,0x10);
  assert.equal(M.irq(irq({pressed:true}),'press').pending,0);
});
test('ISR entry requires delivery gates; return without W1C allows re-entry', () => {
  assert.equal(typeof M.irq, 'function');
  const blocked=irq({pending:0x10});
  assert.equal(M.irq(blocked,'enter').count,0);
  const entered=M.irq({...blocked,imr:true,nvic:true},'enter');
  assert.equal(entered.active,true);
  assert.equal(entered.pending,0x10);
  assert.equal(entered.count,1);
  assert.equal(M.canEnter(entered),false);
  assert.equal(M.canEnter(M.irq(entered,'return')),true);
});
test('W1C clears only EXTI4; a different pending line is preserved', () => {
  assert.equal(typeof M.irq, 'function');
  const cleared=M.irq(irq({pending:0x30,active:true,imr:true,nvic:true}),'clear');
  assert.equal(cleared.pending,0x20);
  assert.equal(M.canEnter(M.irq(cleared,'return')),false);
});
test('board revision diagnosis requires the correct port, clock, pin, mode, and LOW command', () => {
  assert.equal(typeof M.diagnose, 'function');
  const good={board:'C6',port:'C',clock:'C',pin:6,mode:1,odr:0};
  assert.deepEqual(M.diagnose(good),[]);
  assert.deepEqual(M.diagnose({...good,port:'D',clock:'D',pin:3}),['port','pin']);
  assert.deepEqual(M.diagnose({...good,clock:'D',mode:2,odr:1}),['clock','mode','odr']);
  assert.deepEqual(M.diagnose({board:'D3',port:'D',clock:'D',pin:3,mode:1,odr:0}),[]);
});
