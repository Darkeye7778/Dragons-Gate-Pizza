"use strict";

const moderationDisclosure = "A human moderator reviews every submission and makes the final decision. Automated checks may flag potential issues and suggest timestamps before manual review.";
const checkNames = {start:"Gameplay start",binder:"Binder complete",promos:"All nine promos owned",promoFrame:"Promo Frame shows all nine cards",end:"Final stat window"};
const inbox = {data:null,error:"",shared:{},busy:false,config:{game:"",references:{},reports:{}}};
try { Object.assign(inbox.config,JSON.parse(localStorage.getItem(key+"-moderation"))); }
catch (error) { console.error(error); }
if (inbox.config.references.promos && !inbox.config.references.promoFrame) {
  inbox.config.references.promoFrame=inbox.config.references.promos;
}
function saveModeration() {
  try { localStorage.setItem(key+"-moderation",JSON.stringify(inbox.config)); }
  catch { notify("The browser could not save your moderation settings."); }
}
function gameReference(value) {
  if (!value) return "";
  if (/^[\w-]{1,100}$/.test(value)) return value;
  const url = new URL(value);
  const first = url.pathname.split("/").filter(Boolean)[0];
  const slug = first === "games" ? url.pathname.split("/").filter(Boolean)[1] : first;
  if (!["speedrun.com","www.speedrun.com"].includes(url.hostname) || !/^[\w-]{1,100}$/.test(slug || "")) {
    throw Error("Paste a Speedrun.com game leaderboard URL, slug or game ID.");
  }
  return slug;
}
async function syncInbox() {
  if (inbox.busy) return;
  inbox.busy=true; inbox.error="";
  if (view==="moderation") render();
  try {
    const params = new URLSearchParams(inbox.config.game ? {game:inbox.config.game} : {});
    const response = await fetch("/api/moderation/queue?"+params,{signal:AbortSignal.timeout(45000)});
    const result = await response.json();
    if (!response.ok) throw Error(result.error || "The moderation inbox could not refresh.");
    inbox.data=result;
    if (result.stale) inbox.error="Unable to refresh the queue.";
    const ids=result.runs.map(run=>run.id);
    try {
      const reports=await Promise.all(Array.from({length:Math.ceil(ids.length/100)},async (_,i)=>{
        const batch=ids.slice(i*100,(i+1)*100);
        const response=await fetch("/api/run-lab/reports?ids="+batch.join(","),{signal:AbortSignal.timeout(10000)});
        if (!response.ok) throw Error("Shared scan results are unavailable.");
        return response.json();
      }));
      inbox.shared=Object.assign({},...reports);
    } catch (error) {
      notify(error.message);
    }
    if (!inbox.config.game && result.game.id) {
      inbox.config.game=result.game.id;
      saveModeration();
    }
  } catch (error) {
    inbox.error=error.name==="TimeoutError" ? "Speedrun.com took too long to respond." : error.message;
  } finally {
    inbox.busy=false;
    if (view==="moderation") render();
  }
}
function moderationSettings() {
  modal("Inbox settings",label("Speedrun.com leaderboard URL or game ID",input("game",inbox.config.game,'placeholder="Leave blank to look up Rip It! Card Collector"')),
    fd=>{inbox.config.game=gameReference(val(fd,"game"));inbox.data=null;saveModeration();},
    "","Save and refresh",syncInbox);
}
function recordingKey(value) {
  const url = new URL(value);
  const host=url.hostname.replace(/^(www|m)\./,"");
  if (host==="youtu.be") return "youtube:"+url.pathname.split("/")[1];
  if (host==="youtube.com" || host==="youtube-nocookie.com") {
    const id=url.searchParams.get("v") || url.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1];
    if (id) return "youtube:"+id;
  }
  url.hash="";
  return url.href;
}
function videosFor(r) { return [...new Set(r.videos.map(link).filter(Boolean))]; }
function reportedMs(r) { return Number.isFinite(r.seconds) && r.seconds>0 ? Math.round(r.seconds*1000) : null; }
function finishForRun(r) {
  if (/promo/i.test(r.category)) return finishId("promo");
  if (/100\s*%/.test(r.category)) return finishId("full");
  if (/any\s*%/i.test(r.category)) return finishId("any");
  return "";
}
function flagsFor(r) {
  const flags=[];
  const videos=videosFor(r);
  if (!videos.length) flags.push(r.videoText ? "Recording needs a link check" : "No recording link");
  if (reportedMs(r)==null) flags.push("No valid submitted time");
  const keys=videos.map(recordingKey);
  if (keys.length && inbox.data.runs.some(other=>other.id!==r.id && other.category!==r.category &&
      videosFor(other).some(url=>keys.includes(recordingKey(url))))) flags.push("Recording also linked in another pending category");
  if (!finishForRun(r)) flags.push("Review category rules manually");
  return flags;
}
const externalLink = (value, name) => {
  const url=link(value);
  return url ? `<a href="${e(url)}" target="_blank" rel="noopener noreferrer">${e(name)}</a>` : "";
};
function moderation() {
  const data=inbox.data;
  const when=data ? new Date(data.checkedAt).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"}) : "";
  return heading("Moderation inbox","Review pending submissions from Speedrun.com.")+
  `<section class="card stack"><div class="bar"><h2>${e(data?.game.name || "Rip It! Card Collector")}</h2><div class="actions">${btn("Review local video","mod-local")}${btn(inbox.busy ? "Refreshing…" : "Refresh queue","mod-refresh","","primary")}</div></div>
  <p role="status">${inbox.error ? e(inbox.error)+(data ? " Showing the last successful refresh." : "") : data ? `${data.runs.length} pending · Updated ${e(when)}${inbox.busy?" · Refreshing…":""}` : inbox.busy ? "Looking up the leaderboard…" : "Refresh to check the moderation queue."}</p><p class="muted">The queue refreshes automatically while this view is open.</p>
  ${data?.truncated ? '<p>Showing the oldest 1,000 pending submissions.</p>' : ""}
  ${data?.runs.length ? `<div class="table"><table><thead><tr><th>Runner / category</th><th>Submitted time</th><th>Prechecks</th><th>Review</th></tr></thead><tbody>${data.runs.map(r=>{
    const flags=flagsFor(r);
    return `<tr><td><strong>${e(r.players.join(", ") || r.id)}</strong><br>${e(r.category)}</td><td class="mono">${stamp(reportedMs(r))}</td><td>${flags.map(flag=>pill(flag)).join(" ") || "No metadata flags"}${(inbox.shared[r.id] || inbox.config.reports[r.id]) ? '<br><small>Video precheck saved</small>' : ""}</td><td>${btn("Review","mod-review",r.id)}</td></tr>`;
  }).join("")}</tbody></table></div>` : data && !inbox.error ? '<p class="hint">No submissions are awaiting review.</p>' : ""}</section>
  <section class="card section stack"><h2>Written rules disclosure</h2><p>${e(moderationDisclosure)}</p></section>`;
}
function moderationRun(id) {
  const r=inbox.data?.runs.find(run=>run.id===id);
  if (!r) return;
  const videos=videosFor(r);
  const direct=videos.find(url=>/\.(mp4|m4v|webm|ogv|mov)(?:[?#]|$)/i.test(url));
  const report=inbox.shared[id] || inbox.config.reports[id];
  const youtube=videos.map(recordingKey).map(key=>key.match(/^youtube:([A-Za-z0-9_-]{11})$/)?.[1]).find(Boolean);
  const flags=flagsFor(r);
  modal("Review "+e(r.category)+" submission",
    `<p>Submitted time <strong class="mono">${stamp(reportedMs(r))}</strong>${r.submitted ? " · "+e(new Date(r.submitted).toLocaleString()) : ""}</p>
    <div class="actions">${externalLink(r.url,"Open Speedrun.com run ↗")}${videos.map((url,i)=>externalLink(url,"Recording "+(i+1)+" ↗")).join("")}</div>
    ${r.comment ? `<p>${e(r.comment)}</p>` : ""}${r.videoText ? `<p>${e(r.videoText)}</p>` : ""}
    ${flags.length ? `<p>${e(flags.join(" · "))}</p>` : ""}
    ${report ? `<p>Last video precheck · ${e(new Date(report.at).toLocaleString())}</p>${moderationReport(report, r)}` : ""}
    ${youtube ? `<iframe id="submitted-youtube" title="Submitted YouTube recording" referrerpolicy="strict-origin" src="https://www.youtube-nocookie.com/embed/${youtube}" width="560" height="315" style="width:100%;border:0" allowfullscreen loading="lazy"></iframe>` : ""}
    ${youtube && report ? `<div class="actions">${report.start==null?"":btn("Jump to estimated start","youtube-seek",report.start)}${report.finish==null?"":btn("Jump to estimated finish","youtube-seek",report.finish)}</div>` : ""}
    ${label("Open the original video file",videoPicker+">","Video stays on your device. Add reference frames in the reviewer to enable visual checks.")}
    <div id="mod-player"></div>`,
    null,direct ? btn("Open direct video","mod-direct",direct) : "");
  const target=dialog.querySelector("#mod-player");
  const frame=dialog.querySelector("#submitted-youtube");
  if (frame) dialog.querySelectorAll('[data-action="youtube-seek"]').forEach(button=>{
    button.onclick=()=>{frame.src="https://www.youtube-nocookie.com/embed/"+youtube+"?start="+Math.floor(Number(button.dataset.value)/1000);};
  });
  const picker=dialog.querySelector('input[type="file"]');
  picker.onchange=()=>{
    const file=picker.files[0];
    if (file) showModerationFootage(target,r,file);
  };
  const directButton=dialog.querySelector('[data-action="mod-direct"]');
  if (directButton) directButton.onclick=()=>showModerationFootage(target,r,null,direct);
}

function reviewLocalModerationVideo() {
  modal("Review local video",
    label("Category",select("mod-category",Object.values(cats).map(name=>[name,name]),cats.any))+
    label("Submitted time (optional)",input("mod-time","",'placeholder="HH:MM:SS.mmm"'))+
    label("Video file",videoPicker+">","Open known-good footage to save reference frames, or precheck a submitted recording.")+
    '<div id="mod-player"></div>',null);
  const target=dialog.querySelector("#mod-player");
  const picker=dialog.querySelector('input[type="file"]');
  function update() {
    const file=picker.files[0];
    if (!file) return;
    const field=dialog.querySelector('[name="mod-time"]');
    const ms=time(field.value);
    if (field.value.trim() && ms==null) return notify("Enter a valid submitted time, or leave it blank.");
    const category=dialog.querySelector('[name="mod-category"]').value;
    showModerationFootage(target,{category,seconds:ms==null ? null : ms/1000},file);
  }
  picker.onchange=update;
  dialog.querySelector('[name="mod-category"]').onchange=update;
  dialog.querySelector('[name="mod-time"]').onchange=update;
}

function fingerprint(video,canvas) {
  const context=canvas.getContext("2d",{willReadFrequently:true});
  const x=video.videoWidth*0.08,y=video.videoHeight*0.08;
  context.drawImage(video,x,y,video.videoWidth-2*x,video.videoHeight-2*y,0,0,canvas.width,canvas.height);
  const rgba=context.getImageData(0,0,canvas.width,canvas.height).data;
  const samples=[];
  for (let i=0;i<rgba.length;i+=4) samples.push(Math.round((rgba[i]*3+rgba[i+1]*6+rgba[i+2])/10));
  return samples;
}
function frameDistance(a,b) {
  return a.reduce((sum,value,i)=>sum+Math.abs(value-b[i]),0)/a.length;
}
function seekForCheck(video,time,signal) {
  signal.throwIfAborted();
  const target=Math.max(0,Math.min(video.duration-0.001,time));
  if (!video.seeking && Math.abs(video.currentTime-target)<0.0001 && video.readyState>=2) return Promise.resolve();
  return new Promise((resolve,reject)=>{
    function finish(error) {
      clearTimeout(timeout);
      video.removeEventListener("seeked",complete);
      video.removeEventListener("error",failed);
      signal.removeEventListener("abort",cancel);
      if (error) reject(error); else resolve();
    }
    const complete=()=>finish(), failed=()=>finish(Error("The browser could not decode a video frame."));
    const cancel=()=>finish(signal.reason);
    const timeout=setTimeout(()=>finish(Error("Timed out seeking through the video.")),5000);
    video.addEventListener("seeked",complete,{once:true});
    video.addEventListener("error",failed,{once:true});
    signal.addEventListener("abort",cancel,{once:true});
    try { video.currentTime=target; } catch (error) { finish(error); }
  });
}
async function scanWindow(video,canvas,reference,from,to,signal) {
  const samples=[];
  for (let t=from; t<=to; t+=0.75) {
    await seekForCheck(video,t,signal);
    samples.push({t:video.currentTime,d:frameDistance(fingerprint(video,canvas),reference)});
  }
  const best=samples.sort((a,b)=>a.d-b.d)[0];
  if (!best || best.d>12) return null;
  let candidate=best;
  for(let t=Math.max(from,best.t-0.75); t<=Math.min(to,best.t+0.75);t+=0.05) {
    await seekForCheck(video,t,signal);
    const d=frameDistance(fingerprint(video,canvas),reference);
    if (d<=best.d+1 && video.currentTime<candidate.t) candidate={t:video.currentTime,d};
  }
  return Math.round(candidate.t*1000);
}
function moderationReport(report,r,allowSeek=false) {
  const finish=report.finishKey==="promos" && /promo/i.test(r.category) ? "promoFrame" : report.finishKey;
  const pair=report.start!=null && report.finish!=null && report.finish>=report.start;
  const delta=pair && reportedMs(r)!=null ? report.finish-report.start-reportedMs(r) : null;
  const timestamp=(ms,scanned)=>ms==null ? (scanned===false ? "Reference needed" : "No candidate") : allowSeek ?
    btn(stamp(ms),"mod-seek",ms,"textbtn mono") : stamp(ms);
  return `<div class="hint stack"><p>${e(checkNames.start)} · ${timestamp(report.start,report.startScanned)}${finish ? "<br>"+e(checkNames[finish])+" · "+timestamp(report.finish,report.finishScanned) : ""}${pair ? "<br>Candidate RTA · "+stamp(report.finish-report.start) : ""}${delta!=null ? " · "+stamp(delta,true)+" vs. submitted" : ""}</p><p>Visual matches are estimates. Confirm the exact transition and category requirements before making a decision.</p></div>`;
}
function showModerationFootage(target,r,file,direct) {
  if (target.querySelector("video")) target.querySelector("video").pause();
  if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl=undefined; }
  target.innerHTML=`<div id="mod-video"></div><div class="actions section">
    ${label("Reference frame type",select("ref",Object.entries(checkNames),"start"))}
    <button type="button" id="mod-save-ref">Save current frame as reference</button>
    <button type="button" class="primary" id="mod-scan">Scan for timing candidates</button>
  </div><p class="muted" id="mod-reference-status"></p><p role="status" id="mod-scan-status"></p><div id="mod-report"></div>`;
  const player=target.querySelector("#mod-video");
  showFootage(player,{in:0,url:direct},file,Boolean(direct));
  const video=player.querySelector("video");
  const canvas=document.createElement("canvas");
  canvas.width=32;canvas.height=18;
  const controls=target.querySelector(".actions.section");
  const scanStatus=target.querySelector("#mod-scan-status");
  const result=target.querySelector("#mod-report");
  const saveRef=target.querySelector("#mod-save-ref"), scan=target.querySelector("#mod-scan");
  const finishKey=finishForRun(r);
  function updateReferences() {
    const labels=[ "start",finishKey ].filter(Boolean).map(key=>checkNames[key]+": "+(inbox.config.references[key]?"saved":"needed"));
    target.querySelector("#mod-reference-status").textContent=labels.join(" · ");
    scan.disabled=!video.videoWidth || !video.duration || ![inbox.config.references.start,inbox.config.references[finishKey]].some(Boolean);
  }
  function showReport(report) {
    result.innerHTML=moderationReport(report,r,true);
    result.querySelectorAll('[data-action="mod-seek"]').forEach(button=>{
      button.onclick=()=>{video.pause();video.currentTime=Number(button.dataset.value)/1000;};
    });
  }
  video.addEventListener("loadeddata",()=>{
    updateReferences();
    const existing=inbox.shared[r.id] || inbox.config.reports[r.id];
    if (existing) showReport(existing);
    else if (!scan.disabled) void scan.onclick();
  },{once:true});
  video.addEventListener("error",()=>{
    scanStatus.textContent=direct ? "This host did not provide playable video access. Open the original file to run a precheck." : "The browser could not play this file.";
  });
  updateReferences();
  saveRef.onclick=()=>{
    if (video.readyState<2 || video.seeking) return notify("Wait for a frame to load first.");
    video.pause();
    try {
      const key=target.querySelector('select[name="ref"]').value;
      inbox.config.references[key]=fingerprint(video,canvas);
      saveModeration();
      updateReferences();
      notify("Saved reference for "+checkNames[key].toLowerCase()+".");
    } catch { notify("This video source did not allow reading frames. Open the original file instead."); }
  };
  scan.onclick=async()=>{
    const startRef=inbox.config.references.start, finishRef=inbox.config.references[finishKey];
    if (!startRef && !finishRef) return;
    const controller=new AbortController();
    const cancel=()=>controller.abort();
    const observer=new MutationObserver(()=>{if (!video.isConnected) cancel();});
    observer.observe(dialog,{childList:true,subtree:true});
    dialog.addEventListener("close",cancel,{once:true});
    video.pause();
    controls.querySelectorAll("button").forEach(button=>button.disabled=true);
    const picker=dialog.querySelector('input[type="file"]');
    if (picker) picker.disabled=true;
    scanStatus.textContent="Scanning the opening and expected finish windows…";
    try {
      const last=video.duration-0.001;
      const start=startRef ? await scanWindow(video,canvas,startRef,0,Math.min(last,60),controller.signal) : null;
      const expected=reportedMs(r)==null ? last : Math.min(last,reportedMs(r)/1000+(start??Number(state.rules.pre)*1000)/1000);
      const finish=finishRef ? await scanWindow(video,canvas,finishRef,Math.max(0,expected-25),Math.min(last,expected+25),controller.signal) : null;
      if (controller.signal.aborted) return;
      const report={start,finish,finishKey,startScanned:!!startRef,finishScanned:!!finishRef,at:new Date().toISOString(),source:file?.name || direct};
      if (r.id) {
        inbox.config.reports[r.id]=report;
        saveModeration();
      }
      let shared=false;
      if (r.id) {
        try {
          const response=await fetch("/api/run-lab/reports",{method:"POST",headers:{"Content-Type":"application/json"},
            body:JSON.stringify({runId:r.id,report}),signal:AbortSignal.timeout(10000)});
          if (!response.ok) throw Error("Unable to share the scan");
          inbox.shared[r.id]=await response.json();
          shared=true;
        } catch {
          delete inbox.shared[r.id];
          notify("Scan saved in this browser. Sharing failed.");
        }
      }
      showReport(report);
      scanStatus.textContent=r.id ? (shared ? "Precheck shared with moderators." : "Precheck saved in this browser.")+" Review the footage before making a decision." : "Precheck complete. Review the suggested frames in the video.";
      if (view==="moderation") render();
    } catch (error) {
      if (!controller.signal.aborted) scanStatus.textContent=error.message || "The video precheck could not finish.";
    } finally {
      observer.disconnect();
      dialog.removeEventListener("close",cancel);
      saveRef.disabled=false;
      if (picker) picker.disabled=false;
      if (video.isConnected) updateReferences();
    }
  };
}

setInterval(()=>{if (view==="moderation" && !document.hidden) void syncInbox();},60000);

const linkedRun=new URLSearchParams(location.search).get("run");
if (linkedRun && /^[a-z0-9]{8}$/i.test(linkedRun)) {
  go("moderation");
  void syncInbox().then(()=>{
    if (inbox.data?.runs.some(run=>run.id===linkedRun)) moderationRun(linkedRun);
    else if (!inbox.error) notify("This submission is no longer pending.");
  });
}
