(() => {
  let controller, opening;
  window.ContentHub = { open() { if (controller) { controller.refresh(false, true); return; } if (opening) return opening; opening = mount().catch(() => { opening = null; const h = window.document.getElementById('contentHub'); h.textContent = '콘텐츠 화면을 불러오지 못했습니다. 페이지를 새로고침해 주세요.'; }); return opening; }, refresh() { return controller && controller.refresh(true); } };
  async function mount() {
    const host = window.document.getElementById('contentHub');
    const response = await fetch('content-hub.html'); if (!response.ok) throw new Error('화면을 불러오지 못했습니다');
    const html = await response.text();
    const root = host.shadowRoot || host.attachShadow({ mode: 'open' }); root.innerHTML = html;
    const sheetURL = 'https://docs.google.com/spreadsheets/d/1onONNURdaBteNOeEP4VGANBYLQHlipe451M4rnKqBLo/edit';
    const safeURL = value => { try { const u = new URL(String(value).trim()); return ['https:', 'http:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } };
    let pending = false, saving = false, cache = null, signature = '';
    async function request(params, post = false) {
      const config = window.CONFIG, u = new URL(config.API_URL);
      const body = { key: config.API_KEY, who: config.DEFAULT_PERSON, ...params };
      if (!post) Object.entries(body).forEach(([k,v]) => u.searchParams.set(k,v));
      const resp = await fetch(u, post ? { method: 'POST', body: JSON.stringify(body) } : {});
      if (!resp.ok) throw new Error('연결 오류 (' + resp.status + ')'); const data = await resp.json(); if (data.error) throw new Error(data.error); return data;
    }
    controller = createController();
    function createController() {
var CH = {
  hongzz:{name:'@dr.hongzz', short:'홍크크', type:'ig'},
  global:{name:'@dr.hongzz_global', short:'글로벌', type:'ig'},
  figo:{name:'@figo_seoul', short:'Figo', type:'ig'},
  arskin:{name:'@arskin_hongdae', short:'아르스킨', type:'ig'},
  won:{name:'원장 블로그', short:'원개블', type:'blog'},
  jasa:{name:'병원 블로그', short:'자사블', type:'blog'}
};
var ORDER = Object.keys(CH);
var posts = [], filter = 'all', view = 'cal', cur, selId = null;
var $ = function(id){ return root.getElementById(id); };
var num = function(s){ var n = parseInt(String(s||'').replace(/[^\d]/g,''),10); return isNaN(n) ? null : n; };
var fmt = function(n){ return n == null ? '—' : n.toLocaleString('ko-KR'); };
var esc = function(s){ return String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
var key = function(d){ return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); };
var mkey = function(y,m){ return y*12+m; };

function parse(data){
  var out = [];
  ORDER.forEach(function(ch){
    (data[ch]||[]).forEach(function(r){
      if (!safeURL(r[2])) return;
      var p = String(r[0]).match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
      if (!p || !r[2]) return;
      var d = new Date(+p[1], +p[2]-1, +p[3]);
      var o = { id: out.length, ch: ch, date: d, title: String(r[1]).replace(/^\[@[^\]]+\]\s*/,'').trim() || '(제목 없음)', url: safeURL(r[2]) };
      if (CH[ch].type === 'ig') {
        o.likes = num(r[3]); o.views = num(r[4]); o.comments = num(r[5]);
        var c = o.url.match(/instagram\.com\/(?:p|reels?|tv)\/([\w-]+)/); o.code = c && c[1];
        o.kind = /\/reels?\//.test(o.url) ? '릴스' : '피드';
      } else {
        o.kw = String(r[3]||'').split(/[,·]/).map(function(s){return s.trim();}).filter(Boolean);
        o.kind = '블로그';
      }
      out.push(o);
    });
  });
  out.sort(function(a,b){ return a.date-b.date || ORDER.indexOf(a.ch)-ORDER.indexOf(b.ch); });
  out.forEach(function(p,i){ p.id = i; });
  return out;
}

function visible(){ return posts.filter(function(p){ return filter==='all' || (filter==='ig' ? CH[p.ch].type==='ig' : filter==='blog' ? CH[p.ch].type==='blog' : p.ch===filter); }); }
function inMonth(list, y, m){ return list.filter(function(p){ return p.date.getFullYear()===y && p.date.getMonth()===m; }); }

function renderChips(){
  var mine = inMonth(posts, cur.y, cur.m);
  var cnt = function(f){ return mine.filter(function(p){ return f(p); }).length; };
  var defs = [['all','전체',null,cnt(function(){return true;})],['ig','인스타그램',null,cnt(function(p){return CH[p.ch].type==='ig';})],['blog','블로그',null,cnt(function(p){return CH[p.ch].type==='blog';})]]
    .concat(ORDER.map(function(c){ return [c, CH[c].short, c, cnt(function(p){return p.ch===c;})]; }));
  $('chips').innerHTML = defs.map(function(d){
    return '<button class="chip" data-f="'+d[0]+'" aria-pressed="'+(filter===d[0])+'">'+(d[2]?'<i class="dot" style="background:var(--c-'+d[2]+')"></i>':'')+esc(d[1])+' <b>'+d[3]+'</b></button>';
  }).join('');
}

function renderCal(){
  var y = cur.y, m = cur.m, first = new Date(y,m,1), start = new Date(y,m,1-((first.getDay()+6)%7));
  var last = new Date(y,m+1,0), weeks = Math.ceil(((first.getDay()+6)%7 + last.getDate())/7);
  var byDay = {}; visible().forEach(function(p){ (byDay[key(p.date)] = byDay[key(p.date)] || []).push(p); });
  var todayK = key(new Date()), html = '';
  for (var i=0;i<weeks*7;i++){
    var d = new Date(start); d.setDate(start.getDate()+i);
    var list = byDay[key(d)] || [], out = d.getMonth()!==m, shown = list.slice(0,4);
    html += '<div class="day'+(out?' out':'')+(key(d)===todayK?' today':'')+'"><div class="n">'+d.getDate()+'</div><div class="items">'+
      shown.map(function(p){ return '<button class="item'+(p.id===selId?' sel':'')+'" data-id="'+p.id+'" title="'+esc(CH[p.ch].name+' · '+p.title)+'"><i class="dot" style="background:var(--c-'+p.ch+')"></i><span style="min-width:0"><span class="acc">'+esc(CH[p.ch].short)+' · '+p.kind+'</span><span class="t">'+esc(p.title)+'</span></span></button>'; }).join('')+
      (list.length>4 ? '<button class="more" data-id="'+list[4].id+'">+'+(list.length-4)+'건 더보기</button>' : '')+'</div></div>';
  }
  $('grid').innerHTML = html;
}

function delta(a,b){
  if (b==null || a==null) return '<span class="delta flat">전월 데이터 없음</span>';
  if (b===0) return '<span class="delta flat">전월 0</span>';
  var r = (a-b)/b*100; var cls = r>0.5?'up':r<-0.5?'down':'flat';
  return '<span class="delta '+cls+'">전월 대비 '+(r>0?'▲ ':r<0?'▼ ':'')+Math.abs(r).toFixed(1)+'%</span>';
}
function igSum(list){
  var v = list.filter(function(p){ return p.views!=null; }), e = v.filter(function(p){ return p.likes!=null && p.comments!=null; });
  var views = v.reduce(function(s,p){return s+p.views;},0);
  var eng = e.reduce(function(s,p){return s+p.likes+p.comments;},0), ev = e.reduce(function(s,p){return s+p.views;},0);
  return { n:list.length, views: v.length?views:null, avg: v.length?Math.round(views/v.length):null, likes:list.reduce(function(s,p){return s+(p.likes||0);},0), comments:list.reduce(function(s,p){return s+(p.comments||0);},0), rate: ev?eng/ev*100:null };
}

function renderAna(){
  var y=cur.y, m=cur.m, pm = new Date(y,m-1,1), vis = visible();
  var now = inMonth(vis,y,m), prev = inMonth(vis,pm.getFullYear(),pm.getMonth());
  var ig = now.filter(function(p){return CH[p.ch].type==='ig';}), igP = prev.filter(function(p){return CH[p.ch].type==='ig';});
  var s = igSum(ig), sp = igSum(igP);
  var kpi = function(label,val,d,unit){ return '<div class="kpi"><span>'+label+'</span><b>'+val+(unit||'')+'</b>'+d+'</div>'; };
  var h = '<div class="kpis">'+
    kpi('총 발행', fmt(now.length), delta(now.length, prev.length), '건')+
    kpi('인스타 조회 합계', fmt(s.views), delta(s.views, sp.views))+
    kpi('인스타 평균 조회', fmt(s.avg), delta(s.avg, sp.avg))+
    kpi('반응률 (좋아요+댓글)/조회', s.rate==null?'—':s.rate.toFixed(2)+'%', sp.rate==null||s.rate==null?'<span class="delta flat">전월 '+(sp.rate==null?'—':sp.rate.toFixed(2)+'%')+'</span>':'<span class="delta '+(s.rate>=sp.rate?'up':'down')+'">전월 '+sp.rate.toFixed(2)+'% → '+(s.rate-sp.rate>=0?'+':'')+(s.rate-sp.rate).toFixed(2)+'%p</span>')+
    '</div>';

  // 계정별 표
  var rows = ORDER.filter(function(c){ return filter==='all'||filter===c||(filter==='ig'&&CH[c].type==='ig')||(filter==='blog'&&CH[c].type==='blog'); }).map(function(c){
    var a = now.filter(function(p){return p.ch===c;}), b = prev.filter(function(p){return p.ch===c;}), isIg = CH[c].type==='ig', t = igSum(a);
    var share = now.length ? (a.length/now.length*100).toFixed(1)+'%' : '—';
    return '<tr><td><span class="acc-cell"><i class="dot" style="background:var(--c-'+c+')"></i>'+esc(CH[c].name)+'</span></td><td>'+a.length+'</td><td>'+b.length+'</td><td>'+delta(a.length,b.length).replace('전월 대비 ','')+'</td><td>'+share+'</td>'+
      (isIg ? '<td>'+fmt(t.views)+'</td><td>'+fmt(t.avg)+'</td><td>'+fmt(t.likes)+'</td><td>'+fmt(t.comments)+'</td><td>'+(t.rate==null?'—':t.rate.toFixed(2)+'%')+'</td>' : '<td>—</td><td>—</td><td>—</td><td>—</td><td>—</td>')+'</tr>';
  }).join('');
  h += '<div class="card"><h3>계정별 성과<small>'+y+'년 '+(m+1)+'월 · 인스타 수치는 시트 기록 시점 누적값</small></h3><div class="tbl"><table><thead><tr><th>계정</th><th>발행</th><th>전월</th><th>증감</th><th>비중</th><th>조회 합계</th><th>평균 조회</th><th>좋아요</th><th>댓글</th><th>반응률</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>';

  // 6개월 추이 + TOP5
  var months = []; for (var i=5;i>=0;i--){ var d=new Date(y,m-i,1); months.push([d.getFullYear(), d.getMonth()]); }
  var chs = ORDER.filter(function(c){ return vis.some(function(p){return p.ch===c;}); });
  var stacks = months.map(function(mm){ var l = inMonth(vis,mm[0],mm[1]); return chs.map(function(c){ return l.filter(function(p){return p.ch===c;}).length; }); });
  var max = Math.max(1, Math.max.apply(null, stacks.map(function(s){ return s.reduce(function(a,b){return a+b;},0); })));
  var nice = Math.ceil(max/4)*4, W=760, H=230, L=30, B=24, T=10, bw=(W-L)/6*0.56;
  var svg = '<svg viewBox="0 0 '+W+' '+H+'" width="100%" role="img" aria-label="최근 6개월 채널별 발행 수">';
  for (var g=0; g<=4; g++){ var gv = nice*g/4, gy = H-B-(H-B-T)*g/4; svg += '<line x1="'+L+'" x2="'+W+'" y1="'+gy+'" y2="'+gy+'" stroke="var(--line)"/><text x="'+(L-6)+'" y="'+(gy+4)+'" text-anchor="end">'+gv+'</text>'; }
  stacks.forEach(function(st,i){
    var x = L + (W-L)/6*i + ((W-L)/6-bw)/2, yy = H-B, tot = 0;
    st.forEach(function(v,j){ if(!v) return; var hh=(H-B-T)*v/nice; yy-=hh; tot+=v; svg += '<rect x="'+x+'" y="'+yy+'" width="'+bw+'" height="'+hh+'" fill="var(--c-'+chs[j]+')"><title>'+CH[chs[j]].short+' '+v+'건</title></rect>'; });
    svg += '<text x="'+(x+bw/2)+'" y="'+(yy-4)+'" text-anchor="middle" style="fill:var(--ink);font-weight:600">'+tot+'</text><text x="'+(x+bw/2)+'" y="'+(H-6)+'" text-anchor="middle"'+(i===5?' style="fill:var(--ink);font-weight:600"':'')+'>'+(months[i][1]+1)+'월</text>';
  });
  svg += '</svg><div class="legend">'+chs.map(function(c){return '<span><i class="dot" style="background:var(--c-'+c+')"></i>'+CH[c].short+'</span>';}).join('')+'</div>';

  var top = ig.filter(function(p){return p.views!=null;}).sort(function(a,b){return b.views-a.views;}).slice(0,5);
  var topHtml = top.length ? '<ol class="top">'+top.map(function(p,i){ return '<li><button data-id="'+p.id+'"><span class="r">'+(i+1)+'</span><span class="tt">'+esc(p.title)+'<small>'+esc(CH[p.ch].name)+' · '+(p.date.getMonth()+1)+'/'+p.date.getDate()+' · 좋아요 '+fmt(p.likes)+' · 댓글 '+fmt(p.comments)+'</small></span><span class="v">'+fmt(p.views)+'</span></button></li>'; }).join('')+'</ol>' : '<p class="note">이 달에 조회수가 기록된 인스타 게시물이 없습니다.</p>';
  h += '<div class="row2"><div class="card"><h3>최근 6개월 발행 추이<small>채널별 건수</small></h3>'+svg+'</div><div class="card"><h3>조회수 TOP 5<small>클릭하면 게시물 보기</small></h3>'+topHtml+'</div></div>';

  // 요일 분포 + 블로그 키워드
  var dn = ['월','화','수','목','금','토','일'], dc = [0,0,0,0,0,0,0]; now.forEach(function(p){ dc[(p.date.getDay()+6)%7]++; });
  var dmax = Math.max.apply(null, dc.concat([1]));
  var dayBars = '<div class="bars">'+dn.map(function(n,i){ return '<div class="bar"><span>'+n+'요일</span><i style="width:'+(dc[i]/dmax*100)+'%;'+(dc[i]?'':'background:var(--line);width:4px')+'"></i><em>'+dc[i]+'</em></div>'; }).join('')+'</div>';
  var kw = {}; now.filter(function(p){return p.kw;}).forEach(function(p){ p.kw.forEach(function(k){ kw[k]=(kw[k]||0)+1; }); });
  var kws = Object.keys(kw).sort(function(a,b){return kw[b]-kw[a];}).slice(0,8), kmax = kws.length?kw[kws[0]]:1;
  var kwBars = kws.length ? '<div class="bars">'+kws.map(function(k){ return '<div class="bar"><span>'+esc(k)+'</span><i style="width:'+(kw[k]/kmax*100)+'%;background:var(--c-won)"></i><em>'+kw[k]+'</em></div>'; }).join('')+'</div>' : '<p class="note">이 달 블로그 키워드 기록이 없습니다.</p>';
  h += '<div class="row2"><div class="card"><h3>요일별 발행<small>'+(m+1)+'월</small></h3>'+dayBars+'</div><div class="card"><h3>블로그 키워드<small>'+(m+1)+'월 언급 횟수</small></h3>'+kwBars+'</div></div>';
  h += '<p class="note" style="min-width:0">진행 중인 달은 전월 전체와 비교됩니다. 조회수가 비어 있는 게시물은 평균·반응률 계산에서 제외합니다. 인스타 수치는 시트에 마지막으로 기록된 값입니다.</p>';
  $('anaView').innerHTML = h;
}

function showPost(id){
  var p = posts[id]; if (!p) return; selId = id;
  var c = CH[p.ch], d = p.date, wd = '일월화수목금토'[d.getDay()];
  var list = visible(), idx = list.indexOf(p);
  var h = '<div class="p-head"><span class="badge"><i class="dot" style="background:var(--c-'+p.ch+')"></i>'+esc(c.name)+'</span>'+
    '<h2>'+esc(p.title)+'</h2><dl><dt>발행일</dt><dd>'+d.getFullYear()+'년 '+(d.getMonth()+1)+'월 '+d.getDate()+'일 ('+wd+')</dd><dt>채널</dt><dd>'+(c.type==='ig'?'인스타그램':'네이버 블로그')+'</dd><dt>유형</dt><dd>'+p.kind+'</dd></dl>';
  if (c.type==='ig') {
    var rate = p.views && p.likes!=null ? ((p.likes+(p.comments||0))/p.views*100).toFixed(2)+'%' : '—';
    h += '<div class="stats"><div class="stat"><span>조회</span><b>'+fmt(p.views)+'</b></div><div class="stat"><span>좋아요</span><b>'+fmt(p.likes)+'</b></div><div class="stat"><span>댓글</span><b>'+fmt(p.comments)+'</b></div><div class="stat"><span>반응률</span><b>'+rate+'</b></div></div>';
  }
  h += '</div><div class="p-body">';
  if (c.type==='ig' && p.code) h += '<div class="preview-placeholder"><div>릴스는 원본에서 바로 열 수 있어요.</div><button data-preview="'+esc(p.code)+'">여기서 미리보기 불러오기</button></div><a class="open" href="'+esc(p.url)+'" target="_blank" rel="noopener">인스타그램에서 열기 ↗</a>';
  else h += '<div class="blogcard"><p>'+esc(p.title)+'</p>'+(p.kw&&p.kw.length?'키워드<div class="kw">'+p.kw.map(function(k){return '<span>'+esc(k)+'</span>';}).join('')+'</div>':'키워드 미입력')+'</div><a class="open" href="'+esc(p.url)+'" target="_blank" rel="noopener">' + (p.kind === '발행 일정' ? '원본 시트에서 보기 ↗' : c.type === 'ig' ? '인스타그램에서 열기 ↗' : '블로그 글 열기 ↗') + '</a>';
  h += '<div class="pn"><button data-id="'+(idx>0?list[idx-1].id:'')+'"'+(idx>0?'':' disabled')+'>← 이전 게시물</button><button data-id="'+(idx<list.length-1?list[idx+1].id:'')+'"'+(idx<list.length-1?'':' disabled')+'>다음 게시물 →</button></div></div>';
  $('panel').innerHTML = h;
  if (p.date.getFullYear()!==cur.y || p.date.getMonth()!==cur.m) { cur = {y:p.date.getFullYear(), m:p.date.getMonth()}; }
  if (view!=='cal') setView('cal'); else render();
  if (window.innerWidth <= 1100) $('panel').scrollIntoView({behavior:'smooth', block:'start'});
}

// ── 영상 기획 (시트 J:P 열) ──
var plan = [], planFilter = 'all', live = false, adding = false;
var PST = { wait:'촬영 대기', shot:'촬영 완료', up:'업로드 완료', rej:'기각' };
function pstat(v){ return v[1].trim()==='기각' || v[3].trim()==='기각' ? 'rej' : v[4].trim() ? 'up' : v[3].trim()==='⭕' ? 'shot' : 'wait'; }
// 시트 표기 "2026. 11. 5" ↔ 날짜 입력칸 "2026-11-05"
function toISO(s){ var p = String(s).match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/); return p ? p[1]+'-'+('0'+p[2]).slice(-2)+'-'+('0'+p[3]).slice(-2) : ''; }
function fromISO(s){ var p = String(s).split('-'); return p.length===3 ? p[0]+'. '+(+p[1])+'. '+(+p[2]) : ''; }
function opt(list, val){ if (val && list.indexOf(val)<0) list = list.concat([val]); return list.map(function(o){ return '<option'+(o===val?' selected':'')+' value="'+esc(o)+'">'+(o||'—')+'</option>'; }).join(''); }
function urlCell(i, val){
  var v = String(val||'').trim(), m = v.match(/instagram\.com\/(?:p|reels?|tv)\/([\w-]+)/), hit = m && posts.filter(function(p){ return p.code===m[1]; })[0];
  return '<div class="urlcell"><input class="url" data-k="'+i+'" value="'+esc(v)+'" placeholder="링크"'+(live?'':' disabled')+'>'+
    (/^https?:/.test(v) ? '<a href="'+esc(v)+'" target="_blank" rel="noopener" title="새 탭에서 열기">↗</a>' : '')+
    (hit ? '<a href="#" data-id="'+hit.id+'" title="캘린더에서 보기">▣</a>' : '')+'</div>';
}
function planRow(r){
  var v = r.v, dis = live ? '' : ' disabled', s = r.row ? pstat(v) : 'wait';
  return '<tr data-row="'+(r.row||'')+'"'+(r.row?'':' class="new"')+'><td><span class="st '+s+'">'+(r.row?PST[s]:'새 항목')+'</span></td>'+
    '<td><select class="sm" data-k="0"'+dis+'>'+opt(['','국내','영어'], v[0].trim())+'</select></td>'+
    '<td><select class="sm" data-k="1"'+dis+'>'+opt(['','숙제','내부촬영','기각'], v[1].trim())+'</select></td>'+
    '<td><input class="idea" data-k="2" value="'+esc(v[2])+'" placeholder="영상 아이디어"'+dis+'></td>'+
    '<td><select class="sm" data-k="3"'+dis+'>'+opt(['','⭕','기각'], v[3].trim())+'</select></td>'+
    '<td><input class="dt" type="date" data-k="4" value="'+toISO(v[4])+'"'+dis+'></td>'+
    '<td>'+urlCell(5, v[5])+'</td><td>'+urlCell(6, v[6])+'</td>'+
    '<td>'+(live ? '<button class="btn save" disabled>'+(r.row?'저장':'추가')+'</button>' : '')+'</td></tr>';
}
function renderPlan(){
  var cnt = {all:plan.length, wait:0, shot:0, up:0, rej:0}; plan.forEach(function(r){ cnt[pstat(r.v)]++; });
  $('planChips').innerHTML = [['all','전체'],['wait',PST.wait],['shot',PST.shot],['up',PST.up],['rej',PST.rej]].map(function(d){
    return '<button class="chip" data-pf="'+d[0]+'" aria-pressed="'+(planFilter===d[0])+'">'+d[1]+' <b>'+cnt[d[0]]+'</b></button>'; }).join('');
  var rows = plan.filter(function(r){ return planFilter==='all' || pstat(r.v)===planFilter; });
  $('planBody').innerHTML = (adding ? planRow({row:null, v:['','','','','','','']}) : '') + rows.map(planRow).join('');
  $('planAdd').disabled = !live || adding;
  $('planNote').textContent = live ? '내용을 수정한 뒤 저장을 누르면 팀원에게도 반영됩니다.' : '영상 기획 연결을 기다리고 있어요. 원본 시트에서 확인할 수 있습니다.';
}
function rowVals(tr){ var v = []; tr.querySelectorAll('[data-k]').forEach(function(el){ v[+el.dataset.k] = el.dataset.k==='4' ? fromISO(el.value) : el.value; }); return v; }
function toast(msg, err){ var t = $('toast'); t.textContent = msg; t.className = 'toast'+(err?' err':''); t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(function(){ t.hidden = true; }, err?6000:2500); }
$('planBody').addEventListener('input', function(e){ var tr = e.target.closest('tr'); if (!tr) return; tr.classList.add('dirty'); var b = tr.querySelector('.save'); if (b) b.disabled = false; });
$('planBody').addEventListener('click', function(e){
  var b = e.target.closest('.save'); if (!b) return;
  var tr = b.closest('tr'), row = +tr.dataset.row, after = rowVals(tr);
  var orig = plan.filter(function(r){ return r.row===row; })[0];
  if (saving) return; saving = true;
  b.disabled = true; b.textContent = '저장 중…';
  var done = function(p){
    saving = false; plan = p; adding = adding && !!row;
    cache = null;
    var others = [].filter.call($('planBody').querySelectorAll('tr.dirty'), function(x){ return x!==tr; }).length;
    // 다른 행을 고치는 중이면 화면 전체를 다시 그리지 않아 입력 중인 내용이 지워지지 않게 함
    // shortcut: 새 행을 추가할 땐 전체를 다시 그려서, 동시에 고치던 다른 행 입력은 사라짐. 자주 겹치면 행 단위 갱신으로 바꾸기
    if (others) { if (row) { const saved = plan.find(x => x.row === row); tr.outerHTML = planRow(saved); } else { tr.remove(); adding = false; $('planAdd').disabled = false; } } else renderPlan();
    toast(row ? '저장했어요' : '추가했어요');
  };
  var fail = function(err){ saving = false; b.disabled = false; b.textContent = row ? '저장' : '추가'; toast(err.message || String(err), true); };
  request(row ? { action: 'contentPlanSave', row: row, before: orig.v, after: after } : { action: 'contentPlanAdd', values: after }, true).then(function(data){ if (!Array.isArray(data.plan)) throw new Error('저장 결과를 확인하지 못했습니다. 새로고침해 주세요.'); done(data.plan); }).catch(fail);
});
$('planAdd').onclick = function(){ if (root.querySelector('tr.dirty')) return toast('수정 중인 행을 먼저 저장해 주세요.', true); adding = true; planFilter = 'all'; renderPlan(); var f = $('planBody').querySelector('.idea'); if (f) f.focus(); };

function setView(v){ if (view === 'plan' && (adding || root.querySelector('tr.dirty'))) { toast('수정 중인 영상 기획을 먼저 저장해 주세요.', true); return; } view = v; ['cal','ana','plan'].forEach(function(k){ $('v-'+k).setAttribute('aria-pressed', v===k); $(k+'View').hidden = v!==k; }); $('calTools').hidden = v==='plan'; render(); }
function render(){ if (view==='plan') return renderPlan(); $('month').textContent = cur.y+'.'+String(cur.m+1).padStart(2,'0'); renderChips(); if (view==='cal') renderCal(); else renderAna(); }

root.addEventListener('click', function(e){
  const preview = e.target.closest('[data-preview]'); if (preview) { const frame = window.document.createElement('iframe'); frame.className = 'embed'; frame.title = 'Instagram 게시물 미리보기'; frame.loading = 'lazy'; frame.referrerPolicy = 'strict-origin-when-cross-origin'; frame.src = 'https://www.instagram.com/p/' + encodeURIComponent(preview.dataset.preview) + '/embed/captioned/'; preview.parentElement.replaceWith(frame); return; }
  var t = e.target.closest('[data-id]'); if (t && t.dataset.id!=='') { e.preventDefault(); return showPost(+t.dataset.id); }
  var pf = e.target.closest('[data-pf]'); if (pf) { planFilter = pf.dataset.pf; return renderPlan(); }
  var f = e.target.closest('[data-f]'); if (f) { filter = f.dataset.f; render(); }
});
$('prev').onclick = function(){ var d=new Date(cur.y,cur.m-1,1); cur={y:d.getFullYear(),m:d.getMonth()}; render(); };
$('next').onclick = function(){ var d=new Date(cur.y,cur.m+1,1); cur={y:d.getFullYear(),m:d.getMonth()}; render(); };
$('today').onclick = function(){ var d=new Date(); cur={y:d.getFullYear(),m:d.getMonth()}; render(); };
$('v-cal').onclick = function(){ setView('cal'); };
$('v-ana').onclick = function(){ setView('ana'); };
$('v-plan').onclick = function(){ setView('plan'); };
root.addEventListener('keydown', function(e){ if (view==='plan' || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return; if (e.key==='ArrowLeft') $('prev').click(); if (e.key==='ArrowRight') $('next').click(); });

function init(data){
  posts = parse(data); plan = data.plan || []; $('updated').textContent = '· 업데이트 '+(data.updated||'');
  if (!cur) { var d = new Date(); cur = {y:d.getFullYear(), m:d.getMonth()}; }
  render();
}
async function refresh(force = false, background = false) {
  if (pending || saving) return;
  if (adding || root.querySelector('tr.dirty')) { if (!background) toast('수정 중인 영상 기획을 먼저 저장해 주세요.', true); return; }
  if (!force && cache && Date.now() - cache.time < 30000) return;
  pending = true; $('contentRefresh').disabled = true; $('syncState').textContent = '불러오는 중…';
  try {
    const data = await request({ action: 'content', fresh: force && !background ? '1' : '0' });
    if (!Array.isArray(data.hongzz) || !Array.isArray(data.plan)) throw new Error('콘텐츠 연결 준비 중');
    const changed = JSON.stringify({ ...data, updated: '' }) !== signature;
    signature = JSON.stringify({ ...data, updated: '' });
    cache = { time: Date.now() }; live = true;
    $('v-ana').disabled = false; $('v-plan').disabled = false;
    if (changed || !posts.length) init(data);
    const sync = data.instagram;
    $('syncState').textContent = sync && !sync.configured ? 'Instagram 연결 설정 필요 · 시트 기록 표시 중' : sync && (sync.accounts || []).some(a => !a.ok) ? '일부 Instagram 계정 동기화 실패 · 시트 기록 표시 중' : '방금 동기화 · 60초마다 자동 확인';
  } catch (err) {
    if (!cache) {
      try {
        const data = await request({ action: 'calendar' });
        if (!Array.isArray(data.grid)) throw new Error('캘린더 데이터를 불러오지 못했습니다.');
        calendarFallback(data.grid); live = false;
        $('v-ana').disabled = true; $('v-plan').disabled = true;
        $('updated').textContent = '· 콘텐츠 캘린더 연결됨';
        $('syncState').textContent = '계정 데이터 연결 오류 · 캘린더만 표시 중';
        render();
      } catch (fallbackError) { $('syncState').textContent = '연결 실패 · 새로고침을 눌러 다시 시도하세요'; }
    } else { $('syncState').textContent = '동기화 실패 · 마지막 확인 내용을 표시 중'; if (!background) toast('새로고침 실패: ' + err.message, true); }
  } finally { pending = false; $('contentRefresh').disabled = false; $('pullIndicator').classList.remove('visible'); }
}
function calendarFallback(grid) {
  const title = String((grid[2] || [])[1] || ''), month = parseInt(title, 10) || new Date().getMonth() + 1;
  const year = new Date().getFullYear(); cur = cur || { y: year, m: month - 1 };
  let days = null; posts = [];
  for (const row of grid) {
    const cells = row.slice(1, 8).map(x => String(x || ''));
    if (cells.some(x => /^\d{1,2}$/.test(x.trim())) && cells.every(x => !x.trim() || /^\d{1,2}$/.test(x.trim()))) { days = cells; continue; }
    if (!days) continue;
    cells.forEach((cell, i) => { if (!days[i]) return; cell.split('\n').filter(x => x.trim()).forEach(text => {
      const ch = /원개블/.test(text) ? 'won' : /자사블/.test(text) ? 'jasa' : /global/.test(text) ? 'global' : /figo/i.test(text) ? 'figo' : /arskin/.test(text) ? 'arskin' : 'hongzz';
      posts.push({ id: posts.length, ch, date: new Date(year, month - 1, +days[i]), title: text, url: sheetURL, kind: '발행 일정', likes: null, views: null, comments: null, kw: [], code: null });
    }); });
  }
}
$('contentRefresh').onclick = () => refresh(true);
let touchY = null, pullDistance = 0;
root.addEventListener('touchstart', e => { touchY = window.scrollY <= 0 && !e.target.closest('input,select,textarea,.tbl,.panel') ? e.touches[0].clientY : null; pullDistance = 0; }, { passive: true });
root.addEventListener('touchmove', e => { if (touchY === null) return; pullDistance = e.touches[0].clientY - touchY; if (pullDistance > 10 && e.cancelable) e.preventDefault(); if (pullDistance > 25) { $('pullIndicator').classList.add('visible'); $('pullIndicator').textContent = pullDistance > 85 ? '놓으면 새로고침' : '아래로 당겨 새로고침'; } }, { passive: false });
root.addEventListener('touchend', () => { if (touchY !== null && pullDistance > 85) refresh(true); else $('pullIndicator').classList.remove('visible'); touchY = null; pullDistance = 0; });
root.addEventListener('touchcancel', () => { touchY = null; pullDistance = 0; $('pullIndicator').classList.remove('visible'); });
window.addEventListener('focus', () => { if (!host.closest('.hidden')) refresh(false, true); });
window.document.addEventListener('visibilitychange', () => { if (!window.document.hidden && !host.closest('.hidden')) refresh(false, true); });
setInterval(() => { if (!window.document.hidden && !host.closest('.hidden')) refresh(true, true); }, 60000);
refresh(true);
return { refresh };

    }
  }
})();
