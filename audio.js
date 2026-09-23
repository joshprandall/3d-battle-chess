const AudioCtor=()=>window.AudioContext||window.webkitAudioContext;

export class GameAudio{
  constructor(){
    this.enabled=true;
    this.mode='3d';
    this.theme='classic';
    this.ctx=null;
    this.music=[];
    this.master=null;
  }
  async ensure(){
    if(!this.enabled)return false;
    const Ctor=AudioCtor();
    if(!Ctor)return false;
    if(!this.ctx)this.ctx=new Ctor();
    if(this.ctx.state==='suspended')await this.ctx.resume().catch(()=>{});
    if(!this.music.length)this.startMusic();
    return true;
  }
  setMode(mode){this.mode=mode==='2d'?'2d':'3d'}
  setTheme(theme){this.theme=theme||'classic'}
  async setEnabled(enabled){
    this.enabled=!!enabled;
    if(this.enabled)await this.ensure();
    else this.stopMusic();
  }
  startMusic(){
    if(!this.ctx||this.music.length||!this.enabled)return;
    const now=this.ctx.currentTime;
    const master=this.ctx.createGain();
    master.gain.setValueAtTime(.0001,now);
    master.gain.exponentialRampToValueAtTime(.032,now+.7);
    master.connect(this.ctx.destination);
    const themeRoots={classic:55,arcane:58.27,monsters:46.25,brick:65.41,cosmic:49};
    const root=themeRoots[this.theme]||55;
    const ratios=[1,1.5,2];
    for(const [i,ratio] of ratios.entries()){
      const osc=this.ctx.createOscillator(),gain=this.ctx.createGain();
      osc.type=i===0?'sine':this.theme==='cosmic'?'triangle':'sine';
      osc.frequency.value=root*ratio;
      gain.gain.value=i===0?.55:.18;
      osc.connect(gain).connect(master);
      osc.start();
      this.music.push({osc,gain});
    }
    const lfo=this.ctx.createOscillator(),lfoGain=this.ctx.createGain();
    lfo.frequency.value=.09;lfoGain.gain.value=.007;
    lfo.connect(lfoGain).connect(master.gain);lfo.start();
    this.music.push({osc:lfo,gain:lfoGain});
    this.master=master;
  }
  stopMusic(){
    for(const node of this.music){try{node.osc.stop()}catch{}try{node.osc.disconnect()}catch{}try{node.gain.disconnect()}catch{}}
    this.music=[];
    try{this.master?.disconnect()}catch{}
    this.master=null;
  }
  tone(freq,duration=.12,volume=.05,type='triangle',endFreq=null,delay=0){
    if(!this.ctx||!this.enabled)return;
    const t=this.ctx.currentTime+delay,osc=this.ctx.createOscillator(),gain=this.ctx.createGain();
    osc.type=type;osc.frequency.setValueAtTime(Math.max(20,freq),t);
    if(endFreq)osc.frequency.exponentialRampToValueAtTime(Math.max(20,endFreq),t+duration);
    gain.gain.setValueAtTime(.0001,t);
    gain.gain.exponentialRampToValueAtTime(Math.max(.001,volume),t+.012);
    gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
    osc.connect(gain).connect(this.ctx.destination);osc.start(t);osc.stop(t+duration+.02);
  }
  noise(duration=.12,volume=.04,delay=0,highpass=180){
    if(!this.ctx||!this.enabled)return;
    const length=Math.max(1,Math.floor(this.ctx.sampleRate*duration)),buffer=this.ctx.createBuffer(1,length,this.ctx.sampleRate),data=buffer.getChannelData(0);
    for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*(1-i/length);
    const src=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter(),gain=this.ctx.createGain(),t=this.ctx.currentTime+delay;
    src.buffer=buffer;filter.type='highpass';filter.frequency.value=highpass;gain.gain.value=volume;
    src.connect(filter).connect(gain).connect(this.ctx.destination);src.start(t);
  }
  async move(role='p'){
    if(this.mode!=='3d'||!this.enabled)return;
    if(!await this.ensure())return;
    const f={p:105,n:135,b:155,r:80,q:175,k:92}[role]||110;
    this.tone(f,.07,.032,'triangle',f*.72);
    if(role==='n'||role==='r'||role==='k')this.noise(.055,.018,.02,90);
  }
  async attack(theme='classic',role='p'){
    if(this.mode!=='3d'||!this.enabled)return;
    this.theme=theme||this.theme;
    if(!await this.ensure())return;
    const profiles={
      p:()=>{this.tone(185,.09,.05,'square',120);this.noise(.07,.03,0,260)},
      n:()=>{this.noise(.17,.055,0,650);this.tone(540,.18,.045,'triangle',210)},
      b:()=>{this.tone(330,.26,.04,'sine',720);this.tone(495,.22,.025,'sine',880,.035)},
      r:()=>{this.tone(72,.24,.075,'triangle',42);this.noise(.16,.065,.015,55)},
      q:()=>{this.noise(.16,.04,0,420);this.tone(410,.28,.052,'sawtooth',155);this.tone(620,.2,.025,'sine',320,.025)},
      k:()=>{this.tone(95,.28,.08,'square',52);this.noise(.19,.055,.02,80);this.tone(260,.15,.03,'triangle',120,.05)}
    };
    (profiles[role]||profiles.p)();
    if(theme==='arcane')this.tone(780,.34,.022,'sine',390,.04);
    if(theme==='monsters')this.tone(64,.3,.035,'sawtooth',38,.02);
    if(theme==='brick')this.noise(.11,.05,.045,900);
    if(theme==='cosmic')this.tone(960,.3,.025,'sine',240,.025);
  }
}
