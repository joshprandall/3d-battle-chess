import {getAttack} from './attacks.js';

export const STATES=['idle','engage','approach','anticipate','commit','contact','follow-through','recover','complete'];

const clamp01=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp01(x);return x*x*(3-2*x)};

export class CombatAnimationRuntime{
 constructor(definition){
  this.definition=definition;
  this.attack=getAttack(definition.attack);
  this.state='idle';
  this.stateTime=0;
  this.totalTime=0;
  this.contact=false;
  this.complete=false;
 }
 reset(){this.state='idle';this.stateTime=0;this.totalTime=0;this.contact=false;this.complete=false;}
 durationFor(state){
  const p=this.attack.phases;
  return ({engage:p.engage,approach:p.approach,anticipate:p.anticipate,commit:p.commit,'follow-through':p.follow,recover:p.recover})[state]||0;
 }
 next(){
  const order=['idle','engage','approach','anticipate','commit','contact','follow-through','recover','complete'];
  this.state=order[Math.min(order.length-1,order.indexOf(this.state)+1)];
  this.stateTime=0;
  if(this.state==='contact')this.contact=true;
  if(this.state==='complete')this.complete=true;
 }
 update(dt){
  if(this.complete)return this.pose();
  this.totalTime+=dt;this.stateTime+=dt;
  if(this.state==='idle')this.next();
  if(this.state==='contact')this.next();
  const d=this.durationFor(this.state);
  if(d>0&&this.stateTime>=d)this.next();
  return this.pose();
 }
 pose(){
  const d=Math.max(.0001,this.durationFor(this.state)),t=smooth(this.stateTime/d),style=this.attack.style||{};
  const locomotion=this.definition.locomotion;
  const heavy=!!style.heavy||this.definition.rig==='heavy-biped'||this.definition.rig==='mech';
  const leap=style.leap||0;
  return {
   state:this.state,t,
   rootDrive:this.state==='approach'?(style.drive||.6)*t:0,
   crouch:this.state==='anticipate'?(heavy ? .22 : .12)*t:0,
   windup:this.state==='anticipate'?t:0,
   attack:this.state==='commit'?t:this.contact?1:0,
   follow:this.state==='follow-through'?t:0,
   recover:this.state==='recover'?t:0,
   lift:(this.state==='approach'||this.state==='commit')?Math.sin(t*Math.PI)*leap:0,
   spin:style.spin&&this.state==='commit'?t*Math.PI*2:0,
   recoil:style.recoil&&this.state==='follow-through'?style.recoil*(1-t):0,
   blink:!!style.blink,
   locomotion
  };
 }
}
