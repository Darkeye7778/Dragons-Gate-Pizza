"use strict";
const $ = (selector) => document.querySelector(selector);
const e = (value) => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const key = "rip-it-run-lab-v1";
const cats = {any:"Any%",promo:"Promo%",full:"100%"};
const defaultFinish = {any:"binder",promo:"promoFrame",full:"end"};
const views = {overview:"Overview",attempt:"Attempt editor",compare:"Compare attempts",rules:"Timing rules",submissions:"Submissions",moderation:"Moderation inbox"};
const defaults = {
  pre:16, start:"Start RTA on the first frame actual gameplay begins after New Game is selected.",
  any:"End on the first frame the main binder visibly reaches 100.00% (all 1,800 cards).",
  promo:"Collect all nine promotional cards. Timing ends on the first frame the Promo Frame is displayed with all nine slots filled. Completing the main binder is optional.",
  full:"Complete the main binder and own all nine promo cards. End on the first frame the final stat window appears after the final piggy-bank interaction.",
  timer:"Use RTA measured from footage. Show an external timer when required by the leaderboard. If the leaderboard makes it optional, retain frame evidence for retiming.",
  recordings:"Use a separate dedicated playthrough and recording for each category submission."
};
const template = [
  ["menu","New Game selected"],["start","Gameplay begins · true start"],["binder","Main binder complete"],
  ["promos","All nine promos owned"],["promoFrame","Promo Frame shows all nine cards"],["end","Final stat window visible"]
];
const blankCheckpoint = ([id,name]) => ({id,name,ms:null,verified:false,note:""});
let state = {runs:[], submissions:[], rules:{...defaults}};
try {
  const saved = JSON.parse(localStorage.getItem(key));
  if (saved) state = {...saved,rules:{...defaults,...saved.rules}};
} catch (error) { console.error(error); }
const promoFrame = template.find(([id])=>id==="promoFrame");
for (const attempt of state.runs) {
  if (attempt.points.some(p=>p.id===promoFrame[0])) continue;
  const ownershipIndex=attempt.points.findIndex(p=>p.id==="promos");
  attempt.points.splice(ownershipIndex<0 ? attempt.points.length : ownershipIndex+1,0,blankCheckpoint(promoFrame));
}
const localFiles = new Map();
let footageControls;
let view = "overview", active = state.runs[0]?.id, comparison = {cat:"any", a:"", b:""}, filter = "any", objectUrl, db;
const dialog = $("#dialog");
const uid = () => crypto.randomUUID();
const run = () => state.runs.find(r => r.id === active);
const point = (r, id) => r?.points.find(p => p.id === id);
function time(input) {
  const value = String(input ?? "").trim();
  if (!/^(?:\d+:){0,2}\d+(?:\.\d{1,3})?$/.test(value)) return null;
  const parts = value.split(":").map(Number);
  if (parts.slice(1).some(n => n >= 60)) return null;
  const ms = Math.round(parts.reduce((sum,n) => sum * 60 + n, 0) * 1000);
  return Number.isSafeInteger(ms) ? ms : null;
}
function stamp(ms, signed = false) {
  if (ms == null) return "—";
  const n = Math.abs(ms), pad = (v, d = 2) => String(v).padStart(d,"0");
  const h = Math.floor(n / 3600000), m = Math.floor(n / 60000) % 60;
  return (ms < 0 ? "−" : signed && ms > 0 ? "+" : "") + (h ? h + ":" + pad(m) : pad(m)) + ":" + pad(Math.floor(n / 1000) % 60) + "." + pad(n % 1000, 3);
}
const finishId = cat => state.rules[cat+"End"] || defaultFinish[cat];
const finishName = cat => template.find(([id])=>id===finishId(cat))[1];
function elapsed(r, cat) {
  const start = point(r,"start"), end = point(r, finishId(cat));
  return start?.verified && end?.verified && start.ms != null && end.ms != null && end.ms >= start.ms ? end.ms - start.ms : null;
}
function importBackup() {
  const picker=document.createElement("input");
  picker.type="file";
  picker.accept="application/json,.json";
  picker.onchange=async ()=>{
    try {
      const incoming=JSON.parse(await picker.files[0].text());
      const backup=incoming.workspace;
      if (!backup || !Array.isArray(backup.runs) || !Array.isArray(backup.submissions) ||
          !backup.runs.every(run=>run && typeof run.id==="string" && Array.isArray(run.points) && Array.isArray(run.segments))) {
        throw Error("Invalid Run Lab backup.");
      }
      if (!confirm("Merge the backed-up attempts and submission records into this browser?")) return;
      const merge=(existing,records)=>[...new Map([...records,...existing].map(record=>[record.id,record])).values()];
      state={runs:merge(state.runs,backup.runs),submissions:merge(state.submissions,backup.submissions),
        rules:{...defaults,...backup.rules}};
      if (incoming.moderation) {
        inbox.config.references={...incoming.moderation.references,...inbox.config.references};
        inbox.config.reports={...incoming.moderation.reports,...inbox.config.reports};
        saveModeration();
      }
      active=state.runs[0]?.id;
      if (save()) {render();notify("Backup imported. Reopen any local footage you want to review.");}
    } catch (error) { notify(error.message || "Could not import backup."); }
  };
  picker.click();
}
function notify(message) {
  $("#toast").textContent = message;
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => { $("#toast").textContent = ""; }, 4700);
}
function save() {
  try { localStorage.setItem(key, JSON.stringify(state)); return true; }
  catch { notify("Browser storage is unavailable or full. Your latest changes could not be saved."); return false; }
}
function openDB() {
  if (db) return db;
  db = new Promise((resolve,reject) => {
    const req = indexedDB.open(key,1);
    req.onupgradeneeded = () => req.result.createObjectStore("footage");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return db;
}
async function clip(mode, id) {
  const store = (await openDB()).transaction("footage", mode === "get" ? "readonly" : "readwrite");
  const objects = store.objectStore("footage");
  const req = objects[mode](id);
  return new Promise((resolve,reject) => {
    store.oncomplete = () => resolve(req.result);
    store.onerror = () => reject(store.error);
    store.onabort = () => reject(store.error);
  });
}
function link(value) {
  try { const url = new URL(value); return ["http:","https:"].includes(url.protocol) ? url.href : ""; }
  catch { return ""; }
}
const btn = (label, action, value = "", cls = "") => `<button type="button" class="${cls}" data-action="${action}" data-value="${e(value)}">${label}</button>`;
const pill = (label, good = false) => `<span class="tag ${good ? "good" : ""}">${e(label)}</span>`;
const label = (name, body, hint = "") => `<label class="field">${name}${body}${hint ? `<small>${hint}</small>` : ""}</label>`;
const input = (name,value="",attrs="") => `<input name="${name}" value="${e(value)}" ${attrs}>`;
const area = (name,value="") => `<textarea name="${name}">${e(value)}</textarea>`;
const check = (name,text,value) => `<label class="check"><input name="${name}" type="checkbox" ${value ? "checked" : ""}> ${text}</label>`;
const options = (entries, current) => entries.map(([v,n]) => `<option value="${e(v)}" ${v === current ? "selected" : ""}>${e(n)}</option>`).join("");
const select = (name,entries,current,attrs="") => `<select name="${name}" ${attrs}>${options(entries,current)}</select>`;
const heading = (title,desc) => `<div class="intro"><h1>${title}</h1><p>${desc}</p></div>`;
const empty = (title, desc, action = "") => `<div class="empty"><h3>${title}</h3><p>${desc}</p>${action}</div>`;
const categoryMetrics = (labelFor,valueFor,descriptionFor) => Object.entries(cats).map(([cat,name])=>metric(labelFor(name),stamp(valueFor(cat)),descriptionFor(cat))).join("");
const metric = (name,value,desc) => `<div class="card metric"><small>${name}</small><strong class="mono">${value}</strong><p>${desc}</p></div>`;
function overview() {
  const best = cat => state.runs.filter(r => r.cat === cat).map(r => elapsed(r,cat)).filter(n => n != null).sort((a,b) => a-b)[0];
  return `<div class="hero"><div class="art" aria-hidden="true"><b>✦</b><b>◈</b></div><h1>Rip It! Run Lab</h1><p>Review footage, pin down timing frames, and find where your card-collecting runs gain or lose time.</p>${btn(state.runs.length ? "Open latest attempt →" : "＋ Log first attempt", state.runs.length ? "open" : "new", state.runs[0]?.id,"primary")}</div>
  <div class="grid category-metrics">${metric("Attempts",state.runs.length,"Logged recordings")}${categoryMetrics(name=>"Best "+name,best,()=>"Verified timing frames")}</div>
  <div class="grid cols2 section"><section class="card"><div class="bar"><h2>Recent attempts</h2>${btn("Compare →","view","compare","textbtn")}</div>${state.runs.length ? `<div class="table"><table><thead><tr><th>Attempt</th><th>Category</th><th>RTA</th></tr></thead><tbody>${state.runs.slice(0,7).map(r=>`<tr><td>${btn(e(r.name),"open",r.id,"textbtn")}</td><td>${pill(cats[r.cat])}</td><td class="mono">${stamp(elapsed(r,r.cat))}</td></tr>`).join("")}</tbody></table></div>` : empty("No attempts yet","Start with a run name, then attach footage or enter frame timestamps.",btn("Add attempt","new"))}</section>
  <section class="card"><div class="bar"><h2>Timing checkpoints</h2>${btn("Edit rules →","view","rules","textbtn")}</div><div class="flow">${[["New Game selected",`About ${state.rules.pre} seconds of pre-start footage expected`],["Gameplay begins","True RTA start for all categories"],...Object.entries(cats).map(([cat,name])=>[finishName(cat),name+" finish"])].map(([t,d])=>`<div class="step"><span></span><div><h3>${t}</h3><p>${d}</p></div></div>`).join("")}</div></section></div>`;
}
function attempt() {
  const r = run();
  if (!r) return heading("Attempt editor","Log footage and verify the frames that define each run.") + empty("No attempt selected","Create an attempt to start logging frame checks.",btn("New attempt","new","","primary"));
  const menu = point(r,"menu")?.ms, start = point(r,"start")?.ms;
  return heading(e(r.name),"Review footage and confirm the timeline for this attempt.") +
  `<div class="card bar">${label("Attempt", select("active",state.runs.map(x=>[x.id,x.name]),r.id,'id="active-run"'))}<div class="actions">${pill(cats[r.cat])}${btn("Edit attempt","edit")}</div></div>
  <div class="grid category-metrics">${metric("Pre-start",stamp(menu != null && start != null && start >= menu ? start-menu : null),`Expected about ${state.rules.pre}s`)}${categoryMetrics(name=>name+" RTA",cat=>elapsed(r,cat),cat=>"Start → "+e(finishName(cat)))}</div>
  <div class="stack section"><section class="card"><div class="bar"><h2>Footage segments</h2>${btn("＋ Add segment","segment")}</div><p class="muted">List clips in playback order. Run timestamps use one continuous footage timeline.</p>
  ${r.segments.length ? `<div class="table"><table><thead><tr><th>Order</th><th>Segment</th><th>Source in / out</th><th>Run position</th><th>Actions</th></tr></thead><tbody>${r.segments.map((s,i)=>`<tr><td>${i+1} · ${s.verified ? "Confirmed":"Pending"}</td><td><strong>${e(s.name)}</strong><br><small>${e(s.file || (s.url ? "Linked footage" : "No footage attached"))}</small></td><td class="mono">${stamp(s.in)} / ${stamp(s.out)}</td><td class="mono">${stamp(s.offset)} → ${stamp(s.out == null ? null : s.offset+s.out-s.in)}</td><td><div class="actions">${s.file || s.url ? btn("Review","review",s.id) : ""}${btn("Edit","segment",s.id)}${i ? btn("↑","segment-up",s.id) : ""}${i < r.segments.length-1 ? btn("↓","segment-down",s.id) : ""}</div></td></tr>`).join("")}</tbody></table></div>` : '<p class="hint section">Add a local video or a footage URL to begin.</p>'}</section>
  <section class="card"><div class="bar"><h2>Frame checks &amp; splits</h2>${btn("＋ Add split","point")}</div><div class="table"><table><thead><tr><th>Order / checkpoint</th><th>Footage time</th><th>From true start</th><th>Evidence</th><th>Actions</th></tr></thead><tbody>${r.points.map((p,i)=>`<tr><td><strong>${i+1}. ${e(p.name)}</strong><br>${pill(p.verified ? "Confirmed" : "Pending",p.verified)}</td><td class="mono">${stamp(p.ms)}</td><td class="mono">${stamp(start != null && p.ms != null ? p.ms-start : null,true)}</td><td>${e(p.note || "—")}${p.segment ? `<br><small>${e(r.segments.find(s=>s.id===p.segment)?.name || "Removed segment")}</small>` : ""}</td><td><div class="actions">${btn("Edit","point",p.id)}${i ? btn("↑","point-up",p.id) : ""}${i < r.points.length-1 ? btn("↓","point-down",p.id) : ""}</div></td></tr>`).join("")}</tbody></table></div></section>
  <section class="card"><div class="bar"><h2>Promo-card ownership &amp; timer evidence</h2>${btn("Edit evidence","evidence")}</div><div class="actions">${pill(r.promos.filter(Boolean).length + " / 9 promos owned")}${pill("External timer: "+r.timer)}${pill("Piggy-bank interaction: "+r.bank)}</div>${r.notes ? `<p class="section">${e(r.notes)}</p>` : ""}</section></div>`;
}
function compare() {
  const eligible = state.runs.filter(r=>r.cat === comparison.cat);
  const a = eligible.find(r=>r.id===comparison.a) ?? eligible[0];
  const b = eligible.find(r=>r.id===comparison.b) ?? eligible.find(r=>r.id!==a?.id);
  comparison.a = a?.id ?? ""; comparison.b = b?.id ?? "";
  const list = eligible.map(r=>[r.id,r.name]);
  const delta = (x,y) => x == null || y == null ? null : y-x;
  const cell = n => `<span class="mono ${n < 0 ? "gain" : n > 0 ? "loss" : ""}">${stamp(n,true)}</span>`;
  let rows = "";
  if (a && b && a.id !== b.id) {
    const endId = finishId(comparison.cat);
    const splitKey = p => template.some(([id])=>id===p.id) ? p.id : "custom:"+p.name.trim().toLowerCase();
    const timed = r => {
      const start = point(r,"start"), end = point(r,endId);
      if (!start?.verified || start.ms == null) return [];
      return r.points.filter(p=>p.verified && p.ms != null && p.ms >= start.ms && p.id !== "menu" &&
        (!end?.verified || end.ms == null || p.ms <= end.ms) &&
        (comparison.cat !== "any" || p.id === endId || !["promos","promoFrame","end"].includes(p.id))).sort((p,q)=>p.ms-q.ms);
    };
    const reference = timed(b);
    const primary = timed(a);
    const matches = primary.filter(p=>primary.filter(q=>splitKey(q)===splitKey(p)).length===1 && reference.filter(q=>splitKey(q)===splitKey(p)).length===1);
    let previousA,previousB, previousOrder=-1;
    rows = matches.map(p=>{
      const q = reference.find(x=>splitKey(x)===splitKey(p));
      const x = p.ms - point(a,"start").ms, y = q.ms - point(b,"start").ms;
      const order=reference.indexOf(q);
      const split = previousA == null || previousB == null || order < previousOrder ? null : delta(x-previousA,y-previousB);
      previousA = x; previousB = y; previousOrder=order;
      return `<tr><td>${e(p.name)}</td><td class="mono">${stamp(x)}</td><td class="mono">${stamp(y)}</td><td>${cell(delta(x,y))}</td><td>${cell(split)}</td></tr>`;
    }).join("");
  }
  return heading("Compare attempts","See where a run gained or lost time against a baseline.")+
  `<div class="card grid cols3">${label("Category",select("cat",Object.entries(cats),comparison.cat,'data-compare="cat"'))}${label("Baseline",select("a",list,comparison.a,'data-compare="a"'))}${label("Challenger",select("b",list,comparison.b,'data-compare="b"'))}</div>
  ${a && b && a.id !== b.id ? `<div class="grid cols3 section">${metric("Baseline RTA",stamp(elapsed(a,comparison.cat)),e(a.name))}${metric("Challenger RTA",stamp(elapsed(b,comparison.cat)),e(b.name))}${metric("Overall delta",cell(delta(elapsed(a,comparison.cat),elapsed(b,comparison.cat))),"Challenger minus baseline")}</div>
  <section class="card section"><div class="bar"><h2>Split breakdown</h2></div><p class="muted">Negative deltas are gains. Confirm both starts and use matching split names. Interval deltas use the previous shared checkpoint.</p>${rows ? `<div class="table"><table><thead><tr><th>Checkpoint</th><th>Baseline</th><th>Challenger</th><th>Cumulative Δ</th><th>Interval Δ</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<p class="hint section">No shared confirmed checkpoints yet.</p>'}</section>` : `<div class="section">${empty("Choose two distinct attempts","Add two attempts in the same category to compare them.",btn("New attempt","new"))}</div>`}`;
}
function rules() {
  const r = state.rules;
  return heading("Timing rules","Update the rules as you verify more footage or the leaderboard requirements change.")+`
  <form class="stack" id="rule-form"><section class="card stack"><h2>Shared timing</h2>${label("True start",area("start",r.start))}${label("Expected pre-start period (seconds)",input("pre",r.pre,'type="number" min="0" step="0.001" required'),"Reference only. RTA uses the actual confirmed start frame.")}${label("External timer requirement",select("timerMode",[["conditional","Follow leaderboard rules"],["required","Visible timer required"],["optional","Visible timer optional"]],r.timerMode || "conditional"))}${label("External timer notes",area("timer",r.timer))}${label("Separate recordings",area("recordings",r.recordings))}</section>
  <div class="grid category-rules">${Object.keys(cats).map(cat=>`<section class="card stack"><h2>${cats[cat]} finish rule</h2>${label("Category criteria",area(cat,r[cat]))}${label("Checkpoint used in RTA calculations",select(cat+"End",template.slice(2),finishId(cat)))}</section>`).join("")}</div><div><button class="primary">Save timing rules</button></div></form>`;
}
function submissions() {
  const list = state.submissions.filter(s=>s.cat === filter);
  return heading("Submissions","Keep dedicated recordings and leaderboard records for each category.")+
  `<div class="card"><div class="bar"><div class="actions">${Object.entries(cats).map(([c,n])=>btn(n,"filter",c,c===filter?"primary":"")).join("")}</div>${btn("＋ Add submission","submission","","primary")}</div><p class="hint">${e(state.rules.recordings)} ${e(state.rules.timer)} ${state.rules.timerMode === "required" ? "Current setting: visible timer required." : state.rules.timerMode === "optional" ? "Current setting: visible timer optional." : ""}</p><div class="section">${list.length ? `<div class="table"><table><thead><tr><th>Attempt</th><th>Recorded time</th><th>Evidence</th><th>Status</th><th></th></tr></thead><tbody>${list.map(s=>`<tr><td>${btn(e(state.runs.find(r=>r.id===s.run)?.name || "Attempt"),"open",s.run,"textbtn")}</td><td class="mono">${stamp(s.ms)}</td><td>${s.video ? `<a href="${e(s.video)}" target="_blank" rel="noopener">Recording</a><br>` : ""}${s.board ? `<a href="${e(s.board)}" target="_blank" rel="noopener">Leaderboard entry</a><br>` : ""}<small>${e(s.timer)} · ${e(s.date || "No date")}${state.rules.timerMode === "required" && s.timer !== "Visible" ? '<br><span class="warn">Visible timer evidence needed</span>' : ""}</small>${s.notes ? `<br><small>${e(s.notes)}</small>` : ""}</td><td>${pill(s.status,s.status==="Verified")}</td><td>${btn("Edit","submission",s.id)}</td></tr>`).join("")}</tbody></table></div>` : empty("No "+cats[filter]+" submissions","Add a submission when you have a dedicated attempt to track.")}</div></div>`;
}
function render() {
  $("#crumb").textContent = "Workspace / " + views[view];
  document.querySelectorAll("nav button").forEach(b => b.dataset.view===view ? b.setAttribute("aria-current","page") : b.removeAttribute("aria-current"));
  $("#content").innerHTML = view==="moderation" ? moderation() : {overview,attempt,compare,rules,submissions}[view]();
}
function go(next) { view=next; render(); window.scrollTo(0,0); }
function modal(title, body, submit, extra = "", submitLabel = "Save", afterSave) {
  if (dialog.open) dialog.close();
  footageControls = undefined;
  if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = undefined; }
  dialog.innerHTML = `<form class="stack"><div class="bar"><h2>${title}</h2>${btn("Close","close")}</div>${body}<p class="warn" role="alert" hidden></p><div class="actions">${submit ? `<button class="primary">${submitLabel}</button>` : ""}${extra}</div></form>`;
  const form = dialog.querySelector("form");
  form.onsubmit = async ev => {
    ev.preventDefault();
    if (!submit || form.dataset.busy) return;
    form.dataset.busy = "1";
    try {
      const result = await submit(new FormData(form));
      if (!save()) throw Error("The change could not be saved in browser storage.");
      dialog.close(); render(); notify("Saved");
      if (afterSave) await afterSave(result);
    } catch (error) {
      const warning = form.querySelector('[role="alert"]');
      warning.textContent = error.message; warning.hidden = false;
    } finally { delete form.dataset.busy; }
  };
  dialog.showModal();
}
const val = (fd,name) => String(fd.get(name) ?? "").trim();
function required(fd,name,msg) {
  const value = val(fd,name);
  if (!value) throw Error(msg);
  return value;
}
function parse(fd,name,title,mandatory=false) {
  const raw = val(fd,name), ms = time(raw);
  if ((raw || mandatory) && ms == null) throw Error(title + " must be seconds, MM:SS.mmm or H:MM:SS.mmm.");
  return ms;
}
function validatedLink(fd,name) {
  const raw = val(fd,name);
  const url = link(raw);
  if (raw && !url) throw Error("Enter a valid HTTP or HTTPS link.");
  return url;
}
const videoPicker = '<input name="file" type="file" accept="video/*,.mp4,.m4v,.mkv,.mov"';
function createRun(name,cat) {
  const r = {id:uid(),name,cat,points:template.map(blankCheckpoint),segments:[],promos:Array(9).fill(false),timer:"Unknown",bank:"Unknown",notes:""};
  state.runs.unshift(r);
  active=r.id;
  return r;
}
function attachLocalFile(segment,file) {
  segment.file=file.name;
  segment.local={size:file.size,modified:file.lastModified};
  localFiles.set(segment.id,file);
}
function openFullRecording() {
  const existing = view==="attempt" ? run() : undefined;
  modal("Open full recording",
    (existing ? '<p>Use the full recording for <strong>'+e(existing.name)+'</strong>.</p>' :
      label("Category",select("cat",Object.entries(cats),filter))) +
    label("Video file",videoPicker+" required>","Choose the full recording from your device."),
    fd=>{
      const file=fd.get("file");
      if (!file?.size) throw Error("Choose a video file.");
      const name=file.name.replace(/\.[^.]+$/,"") || file.name;
      const r=existing || createRun(name.slice(0,100),val(fd,"cat"));
      let segment=r.segments.find(s=>s.in===0 && s.offset===0 && s.out==null && s.file===file.name &&
        (!s.local || (s.local.size===file.size && s.local.modified===file.lastModified)));
      if (!segment) {
        segment={id:uid(),name:"Full recording",url:"",in:0,out:null,offset:0,verified:true};
        r.segments.unshift(segment);
      }
      attachLocalFile(segment,file);
      active=r.id;
      view="attempt";
      return segment.id;
    },"","Open in reviewer",review);
}
function editRun(existing) {
  modal(existing ? "Edit attempt" : "New attempt",
    label("Attempt name",input("name",existing?.name,'required maxlength="100" placeholder="e.g. Binder route, attempt 03"'))+
    label("Dedicated category",select("cat",Object.entries(cats),existing?.cat ?? filter,existing && state.submissions.some(s=>s.run===existing.id) ? "disabled" : "")),
    fd=>{
      const name = required(fd,"name","Enter an attempt name."), cat = val(fd,"cat") || existing.cat;
      if (existing) Object.assign(existing,{name,cat});
      else {
        createRun(name,cat);
      }
      view="attempt";
    }, existing ? btn("Delete attempt","remove-run","","danger") : "",existing ? "Save attempt" : "Create attempt");
}
function editSegment(id) {
  const r=run(), s=r.segments.find(x=>x.id===id);
  modal(s ? "Edit footage segment" : "Add footage segment",
    label("Segment name",input("name",s?.name,'required maxlength="100" placeholder="e.g. Intro and first shop loop"'))+
    label("Footage URL",input("url",s?.url,'type="url" placeholder="https://…"'))+
    label("Open local recording",videoPicker+">",s?.file ? "Current file: "+e(s.file) : "Plays directly from your device. Select the file again after reloading.")+
    `<div class="grid cols3">${label("Source in",input("in",s ? stamp(s.in) : "0","required"))}${label("Source out",input("out",s?.out != null ? stamp(s.out) : ""))}${label("Run position",input("offset",s ? stamp(s.offset) : stamp(r.segments.at(-1)?.out == null ? 0 : r.segments.at(-1).offset+r.segments.at(-1).out-r.segments.at(-1).in),"required"))}</div>`+
    '<p class="hint">Run position is where source in lands on the continuous footage timeline. Use seconds or HH:MM:SS.mmm.</p>'+
    check("verified","Confirm this segment’s position in the playback sequence",s?.verified),
    async fd=>{
      const name=required(fd,"name","Enter a segment name."), url=validatedLink(fd,"url");
      const start=parse(fd,"in","Source in",true), out=parse(fd,"out","Source out"), offset=parse(fd,"offset","Run position",true);
      if (out != null && out <= start) throw Error("Source out must follow source in.");
      const segment={id:s?.id || uid(),name,url,in:start,out,offset,verified:fd.has("verified"),file:s?.file || ""};
      segment.local = s?.local;
      const file=fd.get("file");
      if (file?.size) attachLocalFile(segment,file);
      if (s) Object.assign(s,segment); else r.segments.push(segment);
    },s ? btn("Remove segment","remove-segment",s.id,"danger") : "");
}
function editPoint(id, captured, segment) {
  const r=run(), p=r.points.find(x=>x.id===id), fixed=template.some(([key])=>key===id);
  modal(p ? "Edit frame check" : "Add split",
    (fixed ? `<h3>${e(p.name)}</h3>` : label("Checkpoint name",input("name",p?.name,'required maxlength="100" placeholder="Use the same name across attempts"')))+
    label("Continuous footage timestamp",input("ms",(captured ?? p?.ms) != null ? stamp(captured ?? p.ms) : ""),"Enter seconds or HH:MM:SS.mmm.")+
    label("Source segment",select("segment",[["","None"],...r.segments.map(s=>[s.id,s.name])],segment || p?.segment || ""))+
    label("Frame-check notes",area("note",p?.note),"Record visible evidence, source frame numbers or uncertainty.")+
    check("verified","Confirm this exact frame",p?.verified && captured == null),
    fd=>{
      const ms=parse(fd,"ms","Footage timestamp",fd.has("verified"));
      const name=fixed ? p.name : required(fd,"name","Enter a checkpoint name.");
      if (r.points.some(x=>x!==p && x.name.toLowerCase()===name.toLowerCase())) throw Error("Choose a distinct checkpoint name.");
      const entry={id:p?.id || uid(),name,ms,segment:val(fd,"segment"),note:val(fd,"note"),verified:fd.has("verified")};
      if (p) Object.assign(p,entry); else r.points.push(entry);
      },p && !fixed ? btn("Remove split","remove-point",p.id,"danger") : "");
}
function editEvidence() {
  const r=run();
  modal("Promo cards & timer evidence",
    '<h3>Promo-card ownership</h3><div class="grid cols3">'+r.promos.map((owned,i)=>check("promo"+i,"Slot "+(i+1),owned)).join("")+"</div>"+
    label("External timer visibility",select("timer",["Unknown","Visible","Absent"].map(x=>[x,x]),r.timer))+
    label("Final piggy-bank interaction",select("bank",["Unknown","Confirmed","Missing"].map(x=>[x,x]),r.bank))+
    label("Attempt notes",area("notes",r.notes)),
    fd=>{r.promos=r.promos.map((_,i)=>fd.has("promo"+i));r.timer=val(fd,"timer");r.bank=val(fd,"bank");r.notes=val(fd,"notes");});
}
function editSubmission(id) {
  const old=state.submissions.find(s=>s.id===id), cat=old?.cat || filter;
  const eligible=state.runs.filter(r=>r.cat===cat && !state.submissions.some(s=>s!==old && s.run===r.id));
  if (!eligible.length) {
    modal(cats[cat]+" submission",'<p>Add a dedicated attempt in this category before creating another submission record.</p>',null,btn("New attempt","new","","primary")); return;
  }
  const selected=eligible.find(r=>r.id===old?.run) || eligible[0];
  modal((old ? "Edit " : "Add ")+cats[cat]+" submission",
    label("Dedicated attempt",select("run",eligible.map(r=>[r.id,r.name]),selected.id))+
    label("Submission time",input("ms",old?.ms != null ? stamp(old.ms) : ""),"Leave blank to use confirmed footage timing when available.")+
    label("Recording URL",input("video",old?.video,'type="url"'))+
    label("Leaderboard entry URL",input("board",old?.board,'type="url"'))+
    `<div class="grid cols2">${label("Status",select("status",["Draft","Submitted","Verified","Rejected"].map(x=>[x,x]),old?.status || "Draft"))}${label("Submission date",input("date",old?.date,'type="date"'))}</div>`+
    label("Timer evidence",select("timer",["Use attempt evidence","Visible","Absent","Unknown"].map(x=>[x,x]),old?.timer || "Use attempt evidence"))+
    label("Submission notes",area("notes",old?.notes)),
    fd=>{
      const r=eligible.find(x=>x.id===val(fd,"run")), video=validatedLink(fd,"video"), board=validatedLink(fd,"board");
      if (video && state.submissions.some(s=>s!==old && s.cat!==cat && s.video===video)) throw Error("Use a separate recording for this category.");
      const timer=val(fd,"timer");
      const record={id:old?.id || uid(),cat,run:r.id,ms:parse(fd,"ms","Submission time") ?? elapsed(r,cat),video,board,
        status:val(fd,"status"),date:val(fd,"date"),timer:timer==="Use attempt evidence" ? r.timer : timer,notes:val(fd,"notes")};
      if (old) Object.assign(old,record); else state.submissions.unshift(record);
    },old ? btn("Delete record","remove-submission",old.id,"danger") : "");
}
async function review(id) {
  const r=run(), s=r.segments.find(x=>x.id===id);
  modal("Review "+e(s.name),`<div id="footage-player"></div>${s.url ? `<a href="${e(s.url)}" target="_blank" rel="noopener">Open source recording ↗</a>` : ""}
    ${label("Checkpoint",select("capture",r.points.map(p=>[p.id,p.name]),"start"))}`,null,btn("Edit checkpoint","capture",s.id,"primary"));
  const target=dialog.querySelector("#footage-player");
  let file=localFiles.get(s.id);
  if (!file && s.file && !s.local) {
    try { file=await clip("get",s.id); }
    catch { notify("The previously saved video could not be read."); }
  }
  if (!target.isConnected) return;
  if (file) {
    showFootage(target,s,file);
  } else if (s.file) {
    target.innerHTML = label("Reopen "+e(s.file), '<input type="file" accept="video/*,.mp4,.m4v,.mkv,.mov">', "Your segment settings and frame checks are saved. Choose the original recording to resume playback.");
    const picker = target.querySelector("input");
    picker.onchange = () => {
      const selected = picker.files[0];
      if (!selected) return;
      if (selected.name !== s.file || (s.local && (selected.size !== s.local.size || selected.lastModified !== s.local.modified))) {
        notify("Choose the original file, or replace it in Edit footage segment.");
        picker.value = "";
        return;
      }
      localFiles.set(s.id, selected);
      showFootage(target,s,selected);
    };
  } else if (/\.(mp4|webm|ogv|mov)(?:[?#]|$)/i.test(s.url)) {
    showFootage(target,s);
  } else {
    target.innerHTML = '<p>For a linked player, subtract source in from its timestamp and add the run position. Enter the result in the frame check.</p>';
  }
}

function showFootage(target, segment, file, cors=false) {
  const source = file ? (objectUrl = URL.createObjectURL(file)) : segment.url;
  target.innerHTML = `<div class="stack"><video controls preload="metadata" ${cors ? 'crossorigin="anonymous"' : ""} src="${e(source)}"></video>
    <div class="actions">${btn("−1 frame","step","-1")}${btn("+1 frame","step","1")}
    ${label("Frame rate (FPS)",input("fps","60",'type="number" min="1" step="0.001"'))}</div>
    <small id="source-time"></small><small id="frame-mode" role="status"></small></div>`;
  const video = target.querySelector("video");
  const timeLabel = target.querySelector("#source-time"), modeLabel = target.querySelector("#frame-mode");
  const fps = target.querySelector('[name="fps"]');
  const buttons = [...target.querySelectorAll('[data-action="step"]')];
  let frames, indexing = Boolean(file);
  function update() {
    const index = frames ? frameAtTime(frames,video.currentTime) : -1;
    const sourceTime = index >= 0 ? frames[index] : video.currentTime;
    timeLabel.textContent = "Source time " + stamp(Math.round(sourceTime * 1000)) +
      (index >= 0 ? ` · Frame ${index + 1} / ${frames.length}` : "");
    buttons.forEach(button => { button.disabled = indexing || video.seeking || !video.readyState; });
  }
  function setMode() {
    fps.closest("label").hidden = indexing || !!frames;
    modeLabel.textContent = indexing ? "Reading frame timestamps…" : frames ?
      "Frame stepping uses the recording’s presentation timestamps." :
      "Estimated stepping uses the entered FPS. Exact timestamps may differ, especially for variable-frame-rate footage.";
    update();
  }
  footageControls = {
    video,
    get indexing() { return indexing; },
    step(direction) {
      if (indexing || !video.readyState || video.seeking) return;
      video.pause();
      if (frames) {
        const current = frameAtTime(frames,video.currentTime);
        const next = current + direction;
        if (next < 0 || next >= frames.length) return;
        const start = frames[next], end = frames[next + 1] ?? video.duration;
        if (start < video.duration) video.currentTime = end > start ? (start + end) / 2 : start;
      } else if (Number(fps.value) >= 1) {
        video.currentTime = Math.max(0,Math.min(video.duration,video.currentTime+direction/Number(fps.value)));
      }
      update();
    },
    timestamp() {
      const index = frames ? frameAtTime(frames,video.currentTime) : -1;
      return Math.round((index >= 0 ? frames[index] : video.currentTime)*1000);
    }
  };
  video.onloadedmetadata = () => {
    if (segment.in && segment.in/1000 < video.duration) video.currentTime = segment.in/1000;
    update();
  };
  video.onerror = () => notify("This browser could not decode the video. Try an H.264 MP4 recording.");
  for (const event of ["timeupdate","seeking","seeked"]) video.addEventListener(event,update);
  setMode();
  if (file) {
    readMp4Frames(file).then(index => { frames = index; }, () => {}).finally(() => {
      indexing = false;
      if (target.isConnected) setMode();
    });
  }
}
function reorder(items,id,direction) {
  const i=items.findIndex(x=>x.id===id), j=i+direction;
  if (i<0 || j<0 || j>=items.length) return;
  [items[i],items[j]]=[items[j],items[i]];
  save();render();
}
function confirmDelete(title, body, onDelete) {
  modal(title,`<p>${body}</p>`,onDelete,"","Delete");
}
document.addEventListener("click",async ev=>{
  const b=ev.target.closest("button");
  if (!b) return;
  const action=b.dataset.action, id=b.dataset.value;
  if (b.dataset.view) { go(b.dataset.view); if (view==="moderation") void syncInbox(); return; }
  if (b.id==="new-run" || action==="new") editRun();
  if (action==="view") go(id);
  if (action==="open") { active=id;go("attempt"); }
  if (action==="edit") editRun(run());
  if (action==="segment") editSegment(id);
  if (action==="point") editPoint(id);
  if (action==="full-recording") openFullRecording();
  if (action==="lab-import") importBackup();
  if (action==="mod-local") reviewLocalModerationVideo();
  if (action==="mod-settings") moderationSettings();
  if (action==="mod-refresh") void syncInbox();
  if (action==="mod-review") moderationRun(id);
  if (action==="review") await review(id);
  if (action==="evidence") editEvidence();
  if (action==="submission") editSubmission(id);
  if (action==="filter") {filter=id;render();}
  if (action==="close") dialog.close();
  if (action==="step") footageControls?.step(Number(id));
  if (action==="capture") {
    const s=run().segments.find(x=>x.id===id), video=footageControls?.video;
    if (footageControls?.indexing || video?.seeking) { notify("Wait for the frame to finish loading."); return; }
    video?.pause();
    const source=video?.readyState ? footageControls.timestamp() : null;
    if (source != null && (source<s.in || (s.out!=null && source>s.out))) { notify("Seek to a frame inside the segment’s source in/out range.");return; }
    editPoint(dialog.querySelector('[name="capture"]').value,source==null ? null : source-s.in+s.offset,id);
  }
  if (["point-up","point-down","segment-up","segment-down"].includes(action)) {
    reorder(action.startsWith("point") ? run().points : run().segments,id,action.endsWith("up") ? -1 : 1);
  }
  if (action==="remove-point") confirmDelete("Remove split","Delete this custom frame check?",()=>{run().points=run().points.filter(p=>p.id!==id);});
  if (action==="remove-segment") confirmDelete("Remove segment","Remove this segment from the tracker? Frame-check notes and timestamps will be kept.",async()=>{
    const r=run(), s=r.segments.find(x=>x.id===id);
    if (s.file && !s.local) await clip("delete",id);
    localFiles.delete(id);
    r.segments=r.segments.filter(x=>x.id!==id);r.points.forEach(p=>{if(p.segment===id)p.segment="";});
  });
  if (action==="remove-submission") confirmDelete("Delete submission record","The dedicated attempt will be kept.",()=>{state.submissions=state.submissions.filter(s=>s.id!==id);});
  if (action==="remove-run") confirmDelete("Delete attempt","This removes the attempt and its submission records from the tracker.",async()=>{
    const r=run();await Promise.all(r.segments.filter(s=>s.file && !s.local).map(s=>clip("delete",s.id)));
    r.segments.forEach(s=>localFiles.delete(s.id));
    state.submissions=state.submissions.filter(s=>s.run!==r.id);
    state.runs=state.runs.filter(x=>x!==r);active=state.runs[0]?.id;
  });
});
dialog.addEventListener("close",()=>{
  if (dialog.open) return;
  footageControls = undefined;
  dialog.replaceChildren();
  if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl=undefined; }
});
document.addEventListener("change",ev=>{
  if (ev.target.id==="active-run"){active=ev.target.value;render();}
  const field=ev.target.dataset.compare;
  if (field){comparison[field]=ev.target.value;render();}
});
document.addEventListener("submit",ev=>{
  if(ev.target.id!=="rule-form")return;
  ev.preventDefault();
  const fd=new FormData(ev.target);
  state.rules=Object.fromEntries(fd);
  if(save()){render();notify("Timing rules saved");}
});
render();
