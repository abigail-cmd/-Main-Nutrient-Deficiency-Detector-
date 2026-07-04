
// Drives the 3-step assessment wizard on the landing page:
// nutrient selection (Step 0) -> personal information (Step 1)
// -> nutrient intake and submission (Step 2). Includes the
// validation gates that block advancement/submission on any
// blank required field (mirrored server-side in routes/mainRoutes.js
// as a hard backstop in case this script is bypassed).

const NUTRIENT_META={iron:{name:'Iron',unit:'mg',rda:'8–18 mg/day',ph:'8'},calcium:{name:'Calcium',unit:'mg',rda:'1000–1300 mg/day',ph:'1000'},vitaminA:{name:'Vitamin A',unit:'mcg',rda:'600–900 mcg/day',ph:'700'},vitaminC:{name:'Vitamin C',unit:'mg',rda:'45–90 mg/day',ph:'60'},protein:{name:'Protein',unit:'g',rda:'34–56 g/day',ph:'50'},magnesium:{name:'Magnesium',unit:'mg',rda:'240–410 mg/day',ph:'300'},zinc:{name:'Zinc',unit:'mg',rda:'8–11 mg/day',ph:'9'},fiber:{name:'Fiber',unit:'g',rda:'25–38 g/day',ph:'30'},fat:{name:'Fat',unit:'g',rda:'65–75 g/day',ph:'65'},carbohydrates:{name:'Carbohydrates',unit:'g',rda:'~130 g/day',ph:'200'}};

document.querySelectorAll('.np-card').forEach(c=>{c.addEventListener('click',()=>{const cb=c.querySelector('input[type="checkbox"]');cb.checked=!cb.checked;c.classList.toggle('picked',cb.checked)})});
function getSel(){return[...document.querySelectorAll('.np-card.picked')].map(c=>c.dataset.key)}
function getFocusSel(){return[...document.querySelectorAll('.np-card.picked')].filter(c=>['iron','calcium','vitaminA','vitaminC','protein'].includes(c.dataset.key)).map(c=>c.dataset.key)}

function goScreen(id,scroll){if(scroll===undefined)scroll=true;document.querySelectorAll('.sf-screen').forEach(s=>s.classList.remove('active'));document.getElementById(id).classList.add('active');if(scroll){document.getElementById('assessment-form').scrollIntoView({behavior:'smooth',block:'start'})}}
setTimeout(()=>goScreen('sf-pick',false),1400);

function goStep1(){
  if(!getFocusSel().length){document.getElementById('pick-warn').style.display='block';return}
  document.getElementById('pick-warn').style.display='none';
  goScreen('sf-step1');
}

function goStep2(){
  const req=['s1_fullName','s1_age','s1_gender','s1_activityLevel','s1_weight','s1_height','s1_calories'];
  let ok=true;
  req.forEach(id=>{const el=document.getElementById(id);if(!el.value){el.style.borderColor='#f87171';ok=false}else el.style.borderColor=''});
  if(!ok)return;
  const sel=getSel();
  document.getElementById('selected-chips').innerHTML=sel.map(k=>`<span style="display:inline-flex;align-items:center;gap:5px;background:#f0fdf4;border:1px solid #86efac;border-radius:999px;padding:3px 10px;font-size:11px;font-weight:600;color:#166534">${NUTRIENT_META[k].name}</span>`).join('');
  document.getElementById('nutrient-rows').innerHTML=sel.map(k=>`<div class="ni-row"><div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;color:#0f172a">${NUTRIENT_META[k].name}</div><div style="font-size:11px;color:#94a3b8;margin-top:2px">RDA: ${NUTRIENT_META[k].rda}</div></div><div class="ni-input-wrap"><input type="number" step="0.1" min="0" name="${k}" placeholder="${NUTRIENT_META[k].ph}" required><span class="ni-unit">${NUTRIENT_META[k].unit}</span></div></div>`).join('');
  // Send 0 for all unselected nutrients so backend gets them
  const all=Object.keys(NUTRIENT_META);
  const notSel=all.filter(k=>!sel.includes(k));
  const extra=document.createElement('div');
  extra.innerHTML=notSel.map(k=>`<input type="hidden" name="${k}" value="0">`).join('');
  document.getElementById('nutrient-rows').appendChild(extra);
  goScreen('sf-step2');
}

document.getElementById('sf-step2').addEventListener('submit',function(e){
  const nutrientInputs=[...document.querySelectorAll('#nutrient-rows input[type="number"]')];
  let ok=true;
  nutrientInputs.forEach(el=>{
    if(el.value.trim()===''){el.style.borderColor='#f87171';ok=false}
    else el.style.borderColor='';
  });
  if(!ok){e.preventDefault();return;}
  document.getElementById('h_fullName').value=document.getElementById('s1_fullName').value;
  document.getElementById('h_age').value=document.getElementById('s1_age').value;
  document.getElementById('h_gender').value=document.getElementById('s1_gender').value;
  document.getElementById('h_activityLevel').value=document.getElementById('s1_activityLevel').value;
  document.getElementById('h_weight').value=document.getElementById('s1_weight').value;
  document.getElementById('h_height').value=document.getElementById('s1_height').value;
  document.getElementById('h_currentCalorieIntake').value=document.getElementById('s1_calories').value;
  document.getElementById('h_selectedNutrients').value=getSel().join(',');
  const btn=document.getElementById('submit-btn');btn.disabled=true;btn.innerHTML='<i class="fa-solid fa-spinner fa-spin" style="font-size:11px"></i> Analysing…';
});
