// cultivation v3.1-fixed - Railway safe
const R=["Mortal","Qi","Foundation","Golden","Nascent","Soul","Void","Ascension","Earth","Heaven","King","Emperor","God","Supreme","Dao","Transcendent"];
const P=[10,50,200,800,3200,12000,50000,200000,800000,2500000,8000000,25000000,80000000,250000000,1000000000,5000000000];
const E=["👶","💨","🏔️","💛","👶","👻","🌌","🚀","🌍","☁️","👑","👑","⚡","💫","☯️","♾️"];
const A={wooden:20,iron:80,spirit:250,flame:600,dragon:1500,heaven:4000,relic:10000,slayer:30000,dao:100000,chaos:350000,void:800000,eternity:2000000};
const AP={wooden:100,iron:300,spirit:800,flame:2500,dragon:7000,heaven:20000,relic:60000,slayer:200000,dao:800000,chaos:3000000,void:7000000,eternity:20000000};
const PT={fox:100,wolf:300,tiger:800,phoenix:2000,kirin:6000,dragon:18000,tortoise:45000,ninetail:120000,chaos:400000,serpent:900000,qilin:2500000};
const PP={fox:500,wolf:1500,tiger:4000,phoenix:12000,kirin:35000,dragon:100000,tortoise:280000,ninetail:800000,chaos:3500000,serpent:8000000,qilin:25000000};
const PE={fox:{s:2000,i:"spirit pill",q:3,t:"wolf"},wolf:{s:5000,i:"dragon pill",q:3,t:"tiger"},tiger:{s:15000,i:"phoenix pill",q:3,t:"phoenix"},phoenix:{s:40000,i:"immortal pill",q:3,t:"kirin"},kirin:{s:120000,i:"god pill",q:3,t:"dragon"},dragon:{s:300000,i:"chaos pill",q:2,t:"ninetail"},ninetail:{s:1000000,i:"dao pill",q:2,t:"chaos"},chaos:{s:3000000,i:"dao pill",q:5,t:"serpent"},serpent:{s:8000000,i:"dao pill",q:10,t:"qilin"}};
const PL={qi:80,spirit:250,dragon:800,phoenix:2000,immortal:5000,god:15000,chaos:50000,dao:150000};
const BE=[{n:"Rabbit",p:30,r:20,d:"qi pill"},{n:"Wolf",p:180,r:70,d:"spirit pill"},{n:"Tiger",p:700,r:250,d:"dragon pill"},{n:"Dragon",p:15000,r:5000,d:"immortal pill"},{n:"Void",p:80000,r:20000,d:"god pill"},{n:"Demon",p:250000,r:60000,d:"chaos pill"}];
const DU={mortal:{q:100,c:50,r:200},spirit:{q:1000,c:200,r:800},dragon:{q:10000,c:1000,r:5000},immortal:{q:100000,c:5000,r:30000},god:{q:1000000,c:20000,r:150000}};
const TI={worm:{p:0,pr:0},fighter:{p:20,pr:500},warrior:{p:80,pr:2000},demon:{p:200,pr:5000},saint:{p:200,pr:5000},dragon:{p:600,pr:15000},sword:{p:1500,pr:40000},void:{p:4000,pr:100000},king:{p:12000,pr:300000},emperor:{p:50000,pr:1000000},trans:{p:250000,pr:5000000}};
const SP=[{n:"Nothing",c:25},{n:"100",c:20,s:100},{n:"500",c:15,s:500},{n:"qi x3",c:12,pl:"qi pill",a:3},{n:"dragon",c:8,pl:"dragon pill",a:1},{n:"god",c:5,pl:"god pill",a:1},{n:"fox",c:3,pe:"fox"},{n:"5000 JACKPOT",c:2,s:5000},{n:"dao RARE",c:1,pl:"dao pill",a:1},{n:"talent",c:0.5,ta:0.05},{n:"emperor",c:0.5,ti:"emperor"}];

if(!global.CB) global.CB={hp:10000000,m:10000000,n:"Chaos Titan",rw:500000,ls:Date.now(),at:{}};

function isAd(id){
  try{
    let a=global.GoatBot?.config?.adminBot||global.config?.adminBot||[];
    return a.map(String).includes(String(id));
  }catch(e){return false}
}
function get(d){
  let b={r:0,qi:0,m:100,st:500,ta:0.8,lc:Date.now(),pw:10,w:0,l:0,ar:null,se:null,inv:{},pe:null,hu:0,lh:0,ld:0,ldu:0,ti:"worm",sc:0,rb:0,lsp:0,dq:null,qp:{hu:0,du:0,ldu:0,sp:0},ts:0};
  let s=d?.data?.cultivation||{};
  return {...b,...s,inv:{...b.inv,...(s.inv||{})},qp:{...b.qp,...(s.qp||{})}};
}
function off(c){
  let h=Math.min((Date.now()-c.lc)/3600000,24);
  if(h<=0) return 0;
  let g=Math.floor(h*15*(c.r+1)*c.ta);
  c.qi=Math.min(c.m,c.qi+g);
  c.lc=Date.now();
  return g;
}
function tp(c){
  let tot=Number(c.pw)||0;
  if(c.ar && A[c.ar]) tot+=A[c.ar];
  if(c.pe && PT[c.pe]) tot+=PT[c.pe];
  if(c.ti && TI[c.ti]) tot+=TI[c.ti].p;
  return tot;
}
function f(n){
  n=Number(n)||0;
  if(n>=1000000000) return (n/1000000000).toFixed(1)+"B";
  if(n>=1000000) return (n/1000000).toFixed(1)+"M";
  if(n>=1000) return (n/1000).toFixed(1)+"K";
  return ""+n;
}
async function sv(u,id,d,c){
  await u.set(id,{data:{...(d?.data||{}),cultivation:c}});
}

module.exports={
  config:{
    name:"cultivation",
    aliases:["cult","tu"],
    version:"3.1-fixed",
    author:"ST",
    role:0,
    countDown:2,
    category:"game"
  },
  onStart: async function({message,event,args,usersData}){
    try{
      let sub=(args[0]||"help").toLowerCase();
      let s=event.senderID;
      let u=await usersData.get(s)||{data:{}};
      let c=get(u);
      let o=off(c);
      let S=async()=>await sv(usersData,s,u,c);
      let GN=async(id)=>{
        try{return await usersData.getName(id)}catch(e){return "?"}
      };

      if(sub=="help"){
        return message.reply("🌌 CULT v3.1 FIXED\n!cult starter - free\n!cult profile/break/hunt/dungeon/duel\n!cult spin/titles/evolve/quests/boss\nADMIN: !cult set realm 10 @user");
      }

      if(sub=="starter"){
        if(c.sc) return message.reply("Already claimed");
        c.sc=1;c.st+=1000;c.ta+=0.2;c.ar="wooden";
        c.inv["qi pill"]=(c.inv["qi pill"]||0)+5;
        await S(); return message.reply("🎁 +1000💎 +wooden +pills");
      }

      if(sub=="spin"||sub=="wheel"){
        if(Date.now()-(c.lsp||0)<10000) return message.reply("CD 10s");
        if(c.st<200) return message.reply("Need 200💎");
        c.lsp=Date.now();c.st-=200;c.ts++;c.qp.sp++;
        let tot=SP.reduce((a,b)=>a+b.c,0);
        let r=Math.random()*tot,ch=SP[0];
        for(let x of SP){r-=x.c;if(r<=0){ch=x;break;}}
        let m="🎰 "+ch.n+"\n";
        if(ch.s){c.st+=ch.s;m+="+ "+f(ch.s)+"💎";}
        else if(ch.pl){c.inv[ch.pl]=(c.inv[ch.pl]||0)+ch.a;m+="+ "+ch.a+"x "+ch.pl;}
        else if(ch.pe){c.pe=ch.pe;m+="Got pet "+ch.pe;}
        else if(ch.ta){c.ta=Math.min(5,c.ta+ch.ta);m+="+ "+ch.ta+" talent";}
        else if(ch.ti){c.ti=ch.ti;m+="Title "+ch.ti;}
        else m+="Nothing";
        await S(); return message.reply(m);
      }

      if(sub=="titles"||sub=="title"){
        let n=args.slice(1).join(" ").toLowerCase();
        if(!n){
          let l="👑 TITLES\n";
          for(let k in TI) l+=k+" +"+TI[k].p+"⚡ "+TI[k].pr+"💎\n";
          return message.reply(l+"You: "+c.ti+"\nUse: cult titles demon");
        }
        let t=TI[n]; if(!t) return message.reply("No title");
        if(c.st<t.pr) return message.reply("Need "+t.pr);
        c.st-=t.pr;c.ti=n;await S();return message.reply("Equipped "+n+" +"+t.p+"⚡");
      }

      if(sub=="evolve"){
        if(!c.pe) return message.reply("No pet");
        let e=PE[c.pe]; if(!e) return message.reply("Max!");
        if(args[1]!="ok") return message.reply("EVO "+c.pe+"->"+e.t+" Need "+f(e.s)+"💎 + "+e.q+"x "+e.i+"\nUse: cult evolve ok");
        if(c.st<e.s) return message.reply("Need "+f(e.s));
        if((c.inv[e.i]||0)<e.q) return message.reply("Need "+e.i);
        c.st-=e.s;c.inv[e.i]-=e.q;if(c.inv[e.i]<=0) delete c.inv[e.i];
        let old=c.pe;c.pe=e.t;await S();return message.reply("✨ "+old+"->"+c.pe);
      }

      if(sub=="quests"||sub=="q"){
        let day=new Date().toDateString();
        if(!c.dq||c.dq.day!=day){
          c.dq={day,qs:[{t:"hu",g:3,r:300,d:"Hunt 3"},{t:"du",g:2,r:500,d:"Dungeon 2"},{t:"ldu",g:1,r:400,d:"Duel 1"},{t:"sp",g:1,r:200,d:"Spin 1"}],cl:[]};
          c.qp={hu:0,du:0,ldu:0,sp:0};
        }
        if(args[1]=="claim"){
          let i=parseInt(args[2])-1;
          let q=c.dq.qs[i]; if(!q) return message.reply("quests claim 1-4");
          if(c.dq.cl.includes(i)) return message.reply("Claimed");
          if((c.qp[q.t]||0)<q.g) return message.reply((c.qp[q.t]||0)+"/"+q.g+" not done");
          c.dq.cl.push(i);c.st+=q.r;await S();return message.reply("+"+q.r+"💎 claimed");
        }
        let l="📜 QUESTS "+day+"\n";
        c.dq.qs.forEach((q,i)=>{
          let p=c.qp[q.t]||0;
          let done=p>=q.g?(c.dq.cl.includes(i)?"✅":"DONE claim "+(i+1)):p+"/"+q.g;
          l+=(i+1)+". "+q.d+" ["+done+"] +"+q.r+"💎\n";
        });
        return message.reply(l);
      }

      if(sub=="boss"||sub=="wb"){
        let b=global.CB;
        if(Date.now()-b.ls>21600000||b.hp<=0){
          b.n="Titan";b.m=10000000;b.hp=b.m;b.ls=Date.now();b.at={};b.rw=500000;
        }
        if(args[1]=="attack"){
          if(b.hp<=0) return message.reply("Dead wait 6h");
          let dmg=Math.floor(tp(c)*0.7+Math.random()*tp(c)*0.5+c.qi);
          b.hp=Math.max(0,b.hp-dmg);b.at[s]=(b.at[s]||0)+dmg;
          let m="Hit "+b.n+" "+f(dmg)+" dmg Boss "+f(b.hp)+"/"+f(b.m)+"\n";
          if(b.hp<=0){
            let tot=Object.values(b.at).reduce((a,b)=>a+b,0);
            let share=Math.floor(b.rw*(b.at[s]/tot));
            c.st+=share; m+="☠️ KILLED! +"+f(share)+"💎";
          }
          await S(); return message.reply(m);
        }
        if(args[1]=="top"){
          let so=Object.entries(b.at).sort((a,b)=>b[1]-a[1]).slice(0,10);
          let l="🏆 BOSS "+b.n+" "+f(b.hp)+"/"+f(b.m)+"\n";
          for(let i=0;i<so.length;i++) l+=(i+1)+". "+await GN(so[i][0])+" "+f(so[i][1])+"\n";
          return message.reply(l||"No attackers");
        }
        return message.reply("👹 "+b.n+" ❤️"+f(b.hp)+"/"+f(b.m)+" 💎"+f(b.rw)+" pool\ncult boss attack / cult boss top");
      }

      if(sub=="profile"||sub=="p"||sub=="me"){
        await S();
        let bar=Math.floor(c.qi/c.m*10);
        return message.reply(E[c.r]+" "+(o?"+"+o+" Qi\n":"")+await GN(s)+" ["+c.ti+"] R"+c.r+" "+R[c.r]+"\n⚡"+f(tp(c))+" 💨"+c.qi+"/"+c.m+" ["+"█".repeat(bar)+"░".repeat(10-bar)+"]\n🗡️"+(c.ar||"None")+" 🐾"+(c.pe||"None")+" 💎"+f(c.st)+" RB"+c.rb);
      }

      if(sub=="break"||sub=="bt"){
        if(c.qi<c.m) return message.reply("Need "+c.m+" Qi");
        let cost=Math.floor(c.m*0.8);
        if(c.st<cost) return message.reply("Need "+cost+"💎");
        if(c.r>=R.length-1) return message.reply("Max");
        let num=Math.min(6,3+Math.floor(c.r/3));
        let seq=Array.from({length:num},()=>Math.floor(Math.random()*4)+1);
        let info=await message.reply("⛈️ "+R[c.r]+"->"+R[c.r+1]+" Cost "+cost+"💎 Block "+num+" nums 1-4 Reply 30s");
        c.st-=cost;c.qi-=c.m;await S();
        if(info?.messageID) global.GoatBot.onReply.set(info.messageID,{commandName:"cultivation",author:s,type:"trib",seq,cost,old:c.m,exp:Date.now()+30000});
        return;
      }

      if(sub=="hunt"){
        if(Date.now()-(c.lh||0)<25000) return message.reply("CD "+Math.ceil((25000-(Date.now()-c.lh))/1000)+"s");
        let b=BE[Math.min(c.r,BE.length-1)];
        let my=tp(c)+Math.random()*100,en=b.p+Math.random()*50;
        c.lh=Date.now();
        if(my>en){c.st+=b.r;c.inv[b.d]=(c.inv[b.d]||0)+1;c.qi=Math.min(c.m,c.qi+40);c.hu++;c.qp.hu++;await S();return message.reply("🏹 WIN "+b.n+" +"+b.r+"💎 +"+b.d);}
        else{c.st=Math.max(0,c.st-15);await S();return message.reply("💀 LOSE "+b.n);}
      }

      if(sub=="dungeon"){
        let n=args.slice(1).join(" ").toLowerCase();
        if(!n){let l="🏰 DUNGEONS\n";for(let k in DU) l+=k+" req "+f(DU[k].q)+" cost "+DU[k].c+"→"+DU[k].r+"\n";return message.reply(l);}
        let d=DU[n]; if(!d) return message.reply("Not found");
        if(Date.now()-(c.ld||0)<240000) return message.reply("CD 4m");
        if(tp(c)<d.q) return message.reply("Need "+f(d.q)+"⚡");
        if(c.st<d.c) return message.reply("Need "+d.c+"💎");
        c.ld=Date.now();c.st-=d.c;c.st+=d.r;c.qp.du++;await S();return message.reply("🏰 CLEAR "+n+" +"+(d.r-d.c)+" net");
      }

      if(sub=="artifact"){
        let n=args.slice(1).join(" ").toLowerCase();
        if(!n){let l="🗡️ ARTS\n";for(let k in A) l+=k+" ⚡"+f(A[k])+" 💎"+AP[k]+"\n";return message.reply(l);}
        if(!A[n]) return message.reply("No art");
        if(c.st<AP[n]) return message.reply("Need "+AP[n]);
        c.st-=AP[n];c.ar=n;await S();return message.reply("Equipped "+n);
      }

      if(sub=="pet"){
        let n=args.slice(1).join(" ").toLowerCase();
        if(!n){let l="🐾 PETS\n";for(let k in PT) l+=k+" ⚡"+PT[k]+" 💎"+PP[k]+"\n";return message.reply(l);}
        if(!PT[n]) return message.reply("No pet");
        if(c.st<PP[n]) return message.reply("Need "+PP[n]);
        c.st-=PP[n];c.pe=n;await S();return message.reply("Tamed "+n);
      }

      if(sub=="inv"){
        let l="🎒 💎"+f(c.st)+"\n";
        for(let k in c.inv) l+=k+" x"+c.inv[k]+"\n";
        return message.reply(l||"Empty");
      }

      if(sub=="use"){
        let n=args.slice(1).join(" ").toLowerCase();
        if(!n||!c.inv[n]) return message.reply("No pill");
        if(n.includes("rebirth")){
          let b=Math.floor(c.r*150+c.rb*100);
          c.rb++;c.r=0;c.m=100;c.qi=0;c.pw=10;c.st+=b;
          c.inv[n]--;if(c.inv[n]<=0) delete c.inv[n];
          await S();return message.reply("🔁 REBIRTH #"+c.rb+" +"+b+"💎");
        }
        let q=PL[n.split(" ")[0]]||0;
        if(q) c.qi=Math.min(c.m,c.qi+q);
        c.inv[n]--;if(c.inv[n]<=0) delete c.inv[n];
        await S();return message.reply("Used "+n+" Qi "+c.qi+"/"+c.m);
      }

      if(sub=="daily"){
        let last=u.data.lastDaily||0;
        if(Date.now()-last<86400000) return message.reply("CD");
        let b=150+c.r*50;c.st+=b;u.data.lastDaily=Date.now();
        await usersData.set(s,{data:u.data});await S();return message.reply("🎁 DAILY +"+f(b)+"💎");
      }

      if(sub=="duel"){
        let tid=Object.keys(event.mentions||{})[0];
        if(!tid) return message.reply("Tag @");
        if(Date.now()-(c.ldu||0)<60000) return message.reply("CD 60s");
        let td=await usersData.get(tid),tc=get(td);
        let my=tp(c)+c.qi/10+Math.random()*50,en=tp(tc)+tc.qi/10+Math.random()*50;
        c.ldu=Date.now();c.qp.ldu++;
        if(my>en){c.w++;c.st+=80;tc.l++;tc.st=Math.max(0,tc.st-30);}
        else{c.l++;c.st=Math.max(0,c.st-30);tc.w++;tc.st+=80;}
        await S();await sv(usersData,tid,td,tc);return message.reply(my>en?"WIN +80💎 vs "+await GN(tid):"LOSE -30💎");
      }

      if(sub=="top"){
        let all=await usersData.getAll();
        let list=all.filter(x=>x?.data?.cultivation).map(x=>{
          let cc=get(x);return{id:x.userID||x.id,name:(x.name||"?").slice(0,12),r:cc.r,pw:tp(cc),rb:cc.rb};
        }).sort((a,b)=>b.r!=a.r?b.r-a.r:b.pw-a.pw).slice(0,10);
        let m="🏆 TOP\n";
        list.forEach((x,i)=>{m+=(i+1)+". "+x.name+" "+R[x.r]+" ⚡"+f(x.pw)+" RB"+x.rb+"\n";});
        return message.reply(m);
      }

      if(sub=="sect"){
        let a=(args[1]||"").toLowerCase();
        if(a=="create"){if(c.st<200) return message.reply("Need 200💎");c.st-=200;c.se=args.slice(2).join(" ");await S();return message.reply("Created "+c.se);}
        if(a=="join"){c.se=args.slice(2).join(" ");await S();return message.reply("Joined "+c.se);}
        if(a=="leave"){c.se=null;await S();return message.reply("Left");}
        return message.reply("sect create/join/leave");
      }

      if(sub=="set"||sub=="admin"||sub=="edit"){
        if(!isAd(s)) return message.reply("Admin only");
        let tid=Object.keys(event.mentions||{})[0]||s;
        let td=await usersData.get(tid),tc=get(td);
        let saveT=async()=>await sv(usersData,tid,td,tc);
        let f1=(args[1]||"").toLowerCase(),val=args[2],rest=args.slice(2).join(" ").toLowerCase();
        if(!f1) return message.reply("ADMIN: realm 0-15, stones, qi, maxqi, talent, power, artifact, pet, title, sect, rebirths, starter, boss respawn");
        if(f1=="reset"){tc={r:0,qi:0,m:100,st:500,ta:0.8,lc:Date.now(),pw:10,w:0,l:0,ar:null,se:null,inv:{},pe:null,hu:0,lh:0,ld:0,ldu:0,ti:"worm",sc:0,rb:0,lsp:0,dq:null,qp:{hu:0,du:0,ldu:0,sp:0},ts:0};await saveT();return message.reply("Reset "+await GN(tid));}
        if(f1=="realm"){let r=parseInt(val);if(isNaN(r)) return message.reply("0-15");tc.r=r;tc.pw=P[r];tc.m=Math.floor(100*Math.pow(2.6,r));await saveT();return message.reply("Set "+await GN(tid)+" -> "+R[r]);}
        if(f1=="stones"){tc.st=parseInt(val);await saveT();return message.reply("stones "+f(tc.st));}
        if(f1=="qi"){tc.qi=Math.min(tc.m,parseInt(val));await saveT();return message.reply("qi "+tc.qi);}
        if(f1=="maxqi"){tc.m=parseInt(val);await saveT();return message.reply("maxqi "+tc.m);}
        if(f1=="talent"){tc.ta=parseFloat(val);await saveT();return message.reply("talent "+tc.ta);}
        if(f1=="power"){tc.pw=parseInt(val);await saveT();return message.reply("power "+tc.pw);}
        if(f1=="artifact"){tc.ar=rest=="none"?null:rest;await saveT();return message.reply("artifact "+tc.ar);}
        if(f1=="pet"){tc.pe=rest=="none"?null:rest;await saveT();return message.reply("pet "+tc.pe);}
        if(f1=="title"){tc.ti=rest;await saveT();return message.reply("title "+tc.ti);}
        if(f1=="sect"){tc.se=args.slice(2).join(" ");await saveT();return message.reply("sect "+tc.se);}
        if(f1=="rebirths"){tc.rb=parseInt(val);await saveT();return message.reply("rb "+tc.rb);}
        if(f1=="starter"){tc.sc=val=="false"?0:1;await saveT();return message.reply("starter "+tc.sc);}
        if(f1=="boss"&&val=="respawn"){global.CB.hp=0;return message.reply("Boss will respawn next attack");}
        return message.reply("Unknown field");
      }

    }catch(e){
      return message.reply("Err "+e.message);
    }
  },
  onReply: async function({message,event,Reply,usersData}){
    try{
      if(String(event.senderID)!=String(Reply.author)) return;
      let u=await usersData.get(event.senderID),c=get(u);
      let inp=event.body.trim().split(/[\s,]+/).map(n=>parseInt(n)).filter(n=>!isNaN(n));
      let hits=0;
      for(let i=0;i<Math.min(inp.length,Reply.seq.length);i++) if(inp[i]==Reply.seq[i]) hits++;
      if(hits/Reply.seq.length>=0.7){
        c.r=Math.min(R.length-1,c.r+1);c.m=Math.floor(Reply.old*2.6);c.pw=P[c.r];c.qi=0;
        await sv(usersData,event.senderID,u,c);return message.reply("🔥 UP "+R[c.r]+" ⚡"+f(c.pw));
      }else{
        c.qi=Math.floor(Reply.old*0.2);c.pw=Math.max(10,c.pw-20);c.st+=Math.floor(Reply.cost*0.5);
        await sv(usersData,event.senderID,u,c);return message.reply("💥 FAIL "+hits+"/"+Reply.seq.length+" was "+Reply.seq.join(" "));
      }
    }catch(e){}
  }
};
