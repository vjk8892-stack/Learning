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
        onAuthStateChange:function(cb){listeners.push(cb);return {data:{subscription:{unsubscribe:function(){}}}};}
      },
      from:function(table){
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
              return fetch("/fake-rest/notes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(row)}).then(function(r){return r.json();});
            },
            delete:function(){
              var uid=null,scope=null;
              var chain={
                eq:function(col,val){
                  if(col==="user_id"){uid=val;}else if(col==="scope"){scope=val;}
                  if(uid&&scope){return fetch("/fake-rest/notes?user_id="+encodeURIComponent(uid)+"&scope="+encodeURIComponent(scope),{method:"DELETE"}).then(function(r){return r.json();});}
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
