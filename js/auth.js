(function(){
"use strict";
var $=function(s,r){return (r||document).querySelector(s);};
var root=document.documentElement;

var gate=$("#gate"),splash=$("#gateSplash"),loginForm=$("#loginForm");
var emailInput=$("#loginEmail"),pwInput=$("#loginPassword"),pwToggle=$("#pwToggle");
var errorEl=$("#loginError"),submitBtn=$("#loginSubmit");
var localBanner=$("#localBanner"),signOutBtn=$("#signOut");
var loginHeading=$("#loginHeading");

var BRAND=window.BRAND||"Learning";
if(loginHeading){loginHeading.textContent="Sign in to "+BRAND;}

var GENERIC_ERROR="Sign-in failed. Check your email and password and try again.";
var MAX_ATTEMPTS=5,LOCK_MS=60000;
var failCount=0,lockUntil=0,lockTimer=null;

function openApp(){
  root.classList.add("gate-open");
  gate.hidden=true;
}
function showLogin(){
  splash.hidden=true;
  loginForm.hidden=false;
  gate.hidden=false;
  root.classList.remove("gate-open");
  errorEl.textContent="";
  pwInput.value="";
  emailInput.focus();
}
function showSplash(){
  splash.hidden=false;
  loginForm.hidden=true;
  gate.hidden=false;
}
function localOnly(){
  localBanner.hidden=false;
  signOutBtn.hidden=true;
  openApp();
}

function clearLock(){
  if(lockTimer){clearInterval(lockTimer);lockTimer=null;}
  failCount=0;
  submitBtn.disabled=false;emailInput.disabled=false;pwInput.disabled=false;
}
function tickLock(){
  var remain=Math.ceil((lockUntil-Date.now())/1000);
  if(remain<=0){clearLock();errorEl.textContent="";return;}
  errorEl.textContent="Too many attempts. Try again in "+remain+"s.";
}
function applyLock(){
  lockUntil=Date.now()+LOCK_MS;
  submitBtn.disabled=true;emailInput.disabled=true;pwInput.disabled=true;
  tickLock();
  lockTimer=setInterval(tickLock,1000);
}

var cfg=window.APP_CONFIG;
if(!cfg||!cfg.url||!cfg.anonKey){
  localOnly();
  return;
}
if(!window.supabase||!window.supabase.createClient){
  // The supabase-js CDN script did not load. Fail open to local-only rather than
  // trap the owner behind a splash screen that can never resolve.
  localOnly();
  return;
}

var client=window.supabase.createClient(cfg.url,cfg.anonKey,{auth:{persistSession:true,autoRefreshToken:true}});
window.APP_AUTH_CLIENT=client;

pwToggle.addEventListener("click",function(){
  var show=pwInput.type==="password";
  pwInput.type=show?"text":"password";
  pwToggle.textContent=show?"Hide":"Show";
  pwToggle.setAttribute("aria-label",show?"Hide password":"Show password");
});

loginForm.addEventListener("submit",function(e){
  e.preventDefault();
  if(lockTimer){return;}
  var email=emailInput.value.trim(),pw=pwInput.value;
  if(!email||!pw){errorEl.textContent=GENERIC_ERROR;return;}
  errorEl.textContent="";
  submitBtn.disabled=true;submitBtn.textContent="Signing in…";
  client.auth.signInWithPassword({email:email,password:pw}).then(function(res){
    submitBtn.textContent="Sign in";
    if(res.error){
      submitBtn.disabled=false;
      failCount++;
      pwInput.value="";
      if(failCount>=MAX_ATTEMPTS){applyLock();}
      else{errorEl.textContent=GENERIC_ERROR;}
      return;
    }
    clearLock();
    pwInput.value="";
    signOutBtn.hidden=false;
    openApp();
  }).catch(function(){
    submitBtn.disabled=false;submitBtn.textContent="Sign in";
    errorEl.textContent=GENERIC_ERROR;
  });
});

signOutBtn.addEventListener("click",function(){
  signOutBtn.disabled=true;
  client.auth.signOut().then(function(){
    signOutBtn.disabled=false;
    signOutBtn.hidden=true;
    showLogin();
  });
});

showSplash();
client.auth.getSession().then(function(res){
  var session=res&&res.data&&res.data.session;
  if(session){
    signOutBtn.hidden=false;
    openApp();
  }else{
    showLogin();
  }
}).catch(function(){
  showLogin();
});

client.auth.onAuthStateChange(function(event,session){
  if(event==="SIGNED_OUT"){
    signOutBtn.hidden=true;
    showLogin();
  }else if(session&&(event==="SIGNED_IN"||event==="TOKEN_REFRESHED"||event==="USER_UPDATED")){
    signOutBtn.hidden=false;
    openApp();
  }
});
})();
