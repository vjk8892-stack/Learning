(function(){
"use strict";
var $=function(s,r){return (r||document).querySelector(s);};
var root=document.documentElement;

var gate=$("#gate"),splash=$("#gateSplash"),loginForm=$("#loginForm");
var emailInput=$("#loginEmail"),pwInput=$("#loginPassword"),pwToggle=$("#pwToggle");
var errorEl=$("#loginError"),submitBtn=$("#loginSubmit");
var localBanner=$("#localBanner"),signOutBtn=$("#signOut");
var loginHeading=$("#loginHeading");
var expiredBanner=$("#expiredBanner"),expiredBannerText=$("#expiredBannerText"),expiredBannerSignIn=$("#expiredBannerSignIn");
var forgotLink=$("#forgotLink");
var resetForm=$("#resetForm"),resetEmailInput=$("#resetEmail"),resetMsg=$("#resetMsg"),resetSubmitBtn=$("#resetSubmit"),resetBackBtn=$("#resetBack");
var newPasswordForm=$("#newPasswordForm"),newPwInput=$("#newPassword"),newPwConfirmInput=$("#newPasswordConfirm"),newPwToggle=$("#newPwToggle"),newPwError=$("#newPasswordError"),newPwSubmitBtn=$("#newPasswordSubmit"),newPwCancelBtn=$("#newPasswordCancel");

var BRAND=window.BRAND||"Learning";
if(loginHeading){loginHeading.textContent="Sign in to "+BRAND;}

var GENERIC_ERROR="Sign-in failed. Check your email and password and try again.";
var MAX_ATTEMPTS=5,LOCK_MS=60000;
var failCount=0,lockUntil=0,lockTimer=null;

function openApp(){
  root.classList.add("gate-open");
  gate.hidden=true;
  hideExpiredBanner();
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
  resetForm.hidden=true;
  newPasswordForm.hidden=true;
  gate.hidden=false;
}
function localOnly(){
  localBanner.hidden=false;
  signOutBtn.hidden=true;
  openApp();
}

var recoveryMode=false;
var hasSession=false;
function showReset(){
  loginForm.hidden=true;
  newPasswordForm.hidden=true;
  resetForm.hidden=false;
  gate.hidden=false;
  resetMsg.textContent="";
  resetMsg.classList.remove("success");
  resetEmailInput.value=emailInput.value||"";
  resetEmailInput.focus();
}
function backToLogin(){
  resetForm.hidden=true;
  newPasswordForm.hidden=true;
  showLogin();
}
function showNewPassword(fromRecovery){
  recoveryMode=!!fromRecovery;
  splash.hidden=true;
  loginForm.hidden=true;
  resetForm.hidden=true;
  newPasswordForm.hidden=false;
  gate.hidden=false;
  newPwError.textContent="";
  newPwInput.value="";
  newPwConfirmInput.value="";
  newPwInput.focus();
}
function hideNewPassword(){
  newPasswordForm.hidden=true;
  if(hasSession){gate.hidden=true;}
  else{showLogin();}
}

function showExpiredBanner(message){
  // A slim, non-blocking notice — NOT the full gate — so the visitor can
  // keep ticking tasks and editing notes locally while it shows; nothing
  // in localStorage is touched, and nothing here blocks interaction with
  // the rest of the page. Clicking its "Sign in to sync" button is what
  // brings up the login card, and only then as an overlay.
  expiredBannerText.textContent=message||"Session expired. Your changes are safe on this device.";
  expiredBanner.hidden=false;
}
function hideExpiredBanner(){expiredBanner.hidden=true;}
function showLoginOverlay(){
  // The login card on top of the still-visible, still-usable app — for
  // the deliberate, short act of typing credentials — as opposed to
  // showLogin()'s full teardown which hides the app entirely. Does not
  // touch root.classList, so whatever was on screen stays there.
  splash.hidden=true;
  resetForm.hidden=true;
  newPasswordForm.hidden=true;
  loginForm.hidden=false;
  gate.hidden=false;
  errorEl.textContent="";
  pwInput.value="";
  emailInput.focus();
}
expiredBannerSignIn.addEventListener("click",function(){showLoginOverlay();});
window.APP_AUTH_SHOW_EXPIRED=showExpiredBanner;

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

forgotLink.addEventListener("click",function(){showReset();});
resetBackBtn.addEventListener("click",function(){backToLogin();});

resetForm.addEventListener("submit",function(e){
  e.preventDefault();
  var email=resetEmailInput.value.trim();
  var GENERIC_RESET_MSG="If an account exists for that email, a reset link is on its way. Check your inbox.";
  if(!email){resetMsg.textContent=GENERIC_RESET_MSG;resetMsg.classList.add("success");return;}
  resetSubmitBtn.disabled=true;resetSubmitBtn.textContent="Sending…";
  client.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin}).then(function(){
    resetSubmitBtn.disabled=false;resetSubmitBtn.textContent="Send reset link";
    // Same message whether or not the email exists, same principle as the
    // sign-in error: never reveal account existence.
    resetMsg.textContent=GENERIC_RESET_MSG;
    resetMsg.classList.add("success");
  }).catch(function(){
    resetSubmitBtn.disabled=false;resetSubmitBtn.textContent="Send reset link";
    resetMsg.textContent=GENERIC_RESET_MSG;
    resetMsg.classList.add("success");
  });
});

newPwToggle.addEventListener("click",function(){
  var show=newPwInput.type==="password";
  newPwInput.type=show?"text":"password";
  newPwToggle.textContent=show?"Hide":"Show";
  newPwToggle.setAttribute("aria-label",show?"Hide password":"Show password");
});

newPasswordForm.addEventListener("submit",function(e){
  e.preventDefault();
  var pw=newPwInput.value,confirm=newPwConfirmInput.value;
  if(pw.length<12){newPwError.textContent="Password must be at least 12 characters.";return;}
  if(pw!==confirm){newPwError.textContent="Passwords do not match.";return;}
  newPwError.textContent="";
  newPwSubmitBtn.disabled=true;newPwSubmitBtn.textContent="Setting password…";
  client.auth.updateUser({password:pw}).then(function(res){
    newPwSubmitBtn.disabled=false;newPwSubmitBtn.textContent="Set password";
    if(res.error){
      newPwError.textContent="Could not set the new password. The reset link may have expired — request a new one.";
      return;
    }
    newPwInput.value="";newPwConfirmInput.value="";
    recoveryMode=false;
    hasSession=true;
    signOutBtn.hidden=false;
    newPasswordForm.hidden=true;
    openApp();
  }).catch(function(){
    newPwSubmitBtn.disabled=false;newPwSubmitBtn.textContent="Set password";
    newPwError.textContent="Could not set the new password. The reset link may have expired — request a new one.";
  });
});

newPwCancelBtn.addEventListener("click",function(){
  if(recoveryMode){
    // A recovery-token session with no password set yet isn't a normal
    // signed-in state to leave open — sign it out and return to the plain
    // login card rather than dropping the visitor into the app.
    recoveryMode=false;
    client.auth.signOut().then(function(){hasSession=false;showLogin();});
  }else{
    hideNewPassword();
  }
});

var localSignOutInProgress=false;
function doSignOut(){
  signOutBtn.disabled=true;
  localSignOutInProgress=true;
  client.auth.signOut().then(function(){
    signOutBtn.disabled=false;
    signOutBtn.hidden=true;
    hasSession=false;
    showLogin();
    localSignOutInProgress=false;
  });
}
window.APP_AUTH_SIGNOUT=doSignOut;
window.APP_AUTH_CHANGE_PASSWORD=function(){showNewPassword(false);};

signOutBtn.addEventListener("click",function(){
  if(window.APP_SYNC&&window.APP_SYNC.guardSignOut){window.APP_SYNC.guardSignOut(doSignOut);}
  else{doSignOut();}
});

showSplash();
client.auth.getSession().then(function(res){
  var session=res&&res.data&&res.data.session;
  if(session){
    hasSession=true;
    signOutBtn.hidden=false;
    openApp();
  }else{
    showLogin();
  }
}).catch(function(){
  showLogin();
});

client.auth.onAuthStateChange(function(event,session){
  if(event==="PASSWORD_RECOVERY"){
    hasSession=true;
    showNewPassword(true);
  }else if(event==="SIGNED_OUT"){
    signOutBtn.hidden=true;
    hasSession=false;
    // This tab's own Sign out already went through guardSignOut (see
    // doSignOut below), so there's nothing left to protect here. An event
    // that arrives WITHOUT that local flag came from somewhere else — most
    // likely another tab calling Sign out — and may be sitting on local
    // changes this tab never got a chance to warn about.
    if(!localSignOutInProgress&&window.APP_SYNC&&window.APP_SYNC.hasUnsyncedWork&&window.APP_SYNC.hasUnsyncedWork()){
      showExpiredBanner("Signed out in another tab. Your changes are safe on this device.");
    }else{
      showLogin();
    }
  }else if(session&&(event==="SIGNED_IN"||event==="TOKEN_REFRESHED"||event==="USER_UPDATED")){
    hasSession=true;
    signOutBtn.hidden=false;
    openApp();
  }
});

// Escape backs out of the login card only when it was opened voluntarily
// from the expired-session banner (a real session already exists and the
// app is usable underneath) — never during the mandatory initial-load
// gate, where there is nothing to go "back" to.
document.addEventListener("keydown",function(e){
  if(e.key==="Escape"&&hasSession&&!gate.hidden&&!loginForm.hidden){
    gate.hidden=true;
    errorEl.textContent="";
  }
});
})();
