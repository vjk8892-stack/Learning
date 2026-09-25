(function(){
  var STORAGE_KEY="mock-sb-session";
  function makeClient(url,key,opts){
    var listeners=[];
    function readSession(){
      try{return JSON.parse(window.localStorage.getItem(STORAGE_KEY)||"null");}catch(e){return null;}
    }
    function writeSession(s){
      try{
        if(s){window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));}
        else{window.localStorage.removeItem(STORAGE_KEY);}
      }catch(e){}
    }
    var USERS={"owner@example.com":{password:"correct-password",id:"user-owner-1"}};
    function notify(event){var s=readSession();listeners.forEach(function(l){l(event,s);});}

    // Real Supabase lands the visitor back on the site with a URL hash
    // carrying a recovery token after they click the emailed reset link,
    // then fires onAuthStateChange("PASSWORD_RECOVERY", session). A test
    // simulates that by navigating to "...#type=recovery" before the page
    // (and this client) loads, exactly like the real redirect would.
    if(/[#&]type=recovery/.test(window.location.hash)){
      setTimeout(function(){
        var s={user:{id:"user-owner-1",email:"owner@example.com"},access_token:"mock-recovery-token"};
        writeSession(s);
        notify("PASSWORD_RECOVERY");
      },20);
    }

    return {
      auth:{
        getSession:function(){return Promise.resolve({data:{session:readSession()},error:null});},
        signInWithPassword:function(creds){
          return new Promise(function(resolve){
            setTimeout(function(){
              var u=USERS[creds.email];
              if(u&&u.password===creds.password){
                var s={user:{id:u.id,email:creds.email},access_token:"mock-token"};
                writeSession(s);notify("SIGNED_IN");
                resolve({data:{session:s},error:null});
              }else{
                resolve({data:{session:null},error:{message:"Invalid login credentials"}});
              }
            },20);
          });
        },
        signOut:function(){
          return new Promise(function(resolve){writeSession(null);notify("SIGNED_OUT");resolve({error:null});});
        },
        resetPasswordForEmail:function(email,opts){
          // Real Supabase never reveals whether the email exists; the mock
          // matches that by always resolving successfully.
          return new Promise(function(resolve){setTimeout(function(){resolve({data:{},error:null});},20);});
        },
        updateUser:function(attrs){
          return new Promise(function(resolve){
            setTimeout(function(){
              var s=readSession();
              if(!s){resolve({data:{user:null},error:{message:"Not signed in"}});return;}
              if(attrs&&attrs.password==="force-update-error"){
                resolve({data:{user:null},error:{message:"Simulated update failure"}});
                return;
              }
              notify("USER_UPDATED");
              resolve({data:{user:s.user},error:null});
            },20);
          });
        },
        onAuthStateChange:function(cb){listeners.push(cb);return {data:{subscription:{unsubscribe:function(){}}}};},
        // Test hook: forces the next N saves (progress or notes) to fail
        // with a 401/expired-JWT-shaped error instead of reaching the
        // fake REST backend, so a test can exercise the app's real
        // refresh-then-retry logic. Set via
        // page.evaluate("window.__mockForce401Count = 1").
        refreshSession:function(){
          // Capture the outcome NOW, at call time — a real API call's
          // result is determined by server-side state when the request is
          // made, not mutable afterward by something that changes while it
          // is still in flight. Reading window.__mockRefreshShouldFail
          // lazily inside the timeout let an unrelated, still-in-flight
          // refresh call from an earlier failure pick up a flag flip meant
          // for a later, separate attempt — a mock-only race, not
          // something a real backend could do.
          var shouldFail=!!window.__mockRefreshShouldFail;
          return new Promise(function(resolve){
            setTimeout(function(){
              if(shouldFail){
                resolve({data:{session:null},error:{message:"Simulated refresh failure"}});
                return;
              }
              var s=readSession();
              if(!s){resolve({data:{session:null},error:{message:"No session to refresh"}});return;}
              notify("TOKEN_REFRESHED");
              resolve({data:{session:s},error:null});
            },20);
          });
        }
      },
      from:function(table){
        function maybeForce401(){
          if(window.__mockForce401Count>0){
            window.__mockForce401Count--;
            return Promise.resolve({data:null,error:{status:401,message:"JWT expired"}});
          }
          return null;
        }
        if(table==="progress"){
          return {
            select:function(){
              var uid=null;
              return {
                eq:function(col,val){uid=val;return this;},
                maybeSingle:function(){
                  return fetch("/fake-rest/progress?user_id="+encodeURIComponent(uid)).then(function(r){return r.json();});
                }
              };
            },
            upsert:function(row){
              var forced=maybeForce401();
              if(forced){return forced;}
              return fetch("/fake-rest/progress",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(row)}).then(function(r){return r.json();});
            }
          };
        }
        if(table==="notes"){
          return {
            select:function(){
              var uid=null;
              return {
                eq:function(col,val){uid=val;return fetch("/fake-rest/notes?user_id="+encodeURIComponent(val)).then(function(r){return r.json();});}
              };
            },
            upsert:function(row){
              var forced=maybeForce401();
              if(forced){return forced;}
              return fetch("/fake-rest/notes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(row)}).then(function(r){return r.json();});
            },
            delete:function(){
              var uid=null,scope=null;
              var chain={
                eq:function(col,val){
                  if(col==="user_id"){uid=val;}else if(col==="scope"){scope=val;}
                  if(uid&&scope){
                    var forced=maybeForce401();
                    if(forced){return forced;}
                    return fetch("/fake-rest/notes?user_id="+encodeURIComponent(uid)+"&scope="+encodeURIComponent(scope),{method:"DELETE"}).then(function(r){return r.json();});
                  }
                  return chain;
                }
              };
              return chain;
            }
          };
        }
        throw new Error("mock only supports the progress and notes tables");
      }
    };
  }
  window.supabase={createClient:makeClient};
})();
