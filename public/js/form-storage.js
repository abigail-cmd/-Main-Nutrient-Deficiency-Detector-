
// Drives the 3-step assessment wizard on the landing page:
// nutrient selection (Step 0) -> personal information (Step 1)
// -> nutrient intake and submission (Step 2). Includes the
// validation gates that block advancement/submission on any
// blank required field (mirrored server-side in routes/mainRoutes.js
// as a hard backstop in case this script is bypassed).
//
// NOTE: the "why" and "examples" fields mirror rules/nutrientInfo.js
// (the server-side source of truth used on the results/detail pages).
// This form is built client-side, so it carries its own copy — keep
// both in sync if this content changes.

const NUTRIENT_META={
  iron:{name:'Iron',unit:'mg',rda:'8–18 mg/day',ph:'8',why:'Carries oxygen in your blood. Too little can cause fatigue and anemia.',examples:[['100g cooked beef','2.7 mg'],['1 cup cooked spinach','6.4 mg'],['1 cup cooked lentils','6.6 mg']]},
  calcium:{name:'Calcium',unit:'mg',rda:'1000–1300 mg/day',ph:'1000',why:'Builds and maintains strong bones and teeth.',examples:[['1 cup milk','300 mg'],['1 cup yogurt','300 mg'],['1 slice cheddar cheese (28g)','200 mg']]},
  vitaminA:{name:'Vitamin A',unit:'mcg',rda:'600–900 mcg/day',ph:'700',why:'Supports healthy vision, immune function, and skin.',examples:[['1 medium carrot','500 mcg'],['1/2 cup cooked spinach','470 mcg'],['100g baked sweet potato','960 mcg']]},
  vitaminC:{name:'Vitamin C',unit:'mg',rda:'45–90 mg/day',ph:'60',why:'Supports immune function and helps absorb iron from plant foods.',examples:[['1 medium orange','70 mg'],['1 cup strawberries','85 mg'],['1 red bell pepper','150 mg']]},
  protein:{name:'Protein',unit:'g',rda:'34–56 g/day',ph:'50',why:'Builds and repairs muscle, skin, and other body tissue.',examples:[['100g grilled chicken breast','31 g'],['2 large eggs','12 g'],['1 cup cooked beans','15 g']]},
  magnesium:{name:'Magnesium',unit:'mg',rda:'240–410 mg/day',ph:'300',why:'Supports muscle/nerve function, blood sugar control, and bone health.',examples:[['1 oz (28g) almonds','80 mg'],['1 cup cooked spinach','157 mg'],['1 cup cooked black beans','120 mg']]},
  zinc:{name:'Zinc',unit:'mg',rda:'8–11 mg/day',ph:'9',why:'Supports immune function and wound healing.',examples:[['100g cooked beef','4.8 mg'],['1 cup chickpeas','2.5 mg'],['1 oz (28g) cashews','1.6 mg']]},
  fiber:{name:'Fiber',unit:'g',rda:'25–38 g/day',ph:'30',why:'Supports digestion and healthy blood sugar/cholesterol levels.',examples:[['1 cup cooked lentils','15 g'],['1 medium apple (with skin)','4.4 g'],['1 cup cooked oats','4 g']]},
  fat:{name:'Fat',unit:'g',rda:'65–75 g/day',ph:'65',why:'Provides energy and helps absorb vitamins A, D, E, and K.',examples:[['1 tbsp olive oil','14 g'],['1/4 avocado','7 g'],['1 oz (28g) almonds','14 g']]},
  carbohydrates:{name:'Carbohydrates',unit:'g',rda:'~130 g/day',ph:'200',why:'Your body\'s main energy source, especially for the brain and muscles.',examples:[['1 cup cooked rice','45 g'],['1 medium banana','27 g'],['1 slice bread','15 g']]},
};

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

function toggleExamples(btn){
  const panel=btn.nextElementSibling;
  const showing=panel.style.display==='block';
  panel.style.display=showing?'none':'block';
  btn.innerHTML=showing
    ?'<i class="fa-solid fa-circle-question" style="margin-right:4px"></i>Not sure how much you eat? See examples'
    :'<i class="fa-solid fa-circle-xmark" style="margin-right:4px"></i>Hide examples';
}

function goStep2(){
  const req=['s1_fullName','s1_age','s1_gender','s1_activityLevel','s1_weight','s1_height','s1_calories'];
  let ok=true;
  req.forEach(id=>{const el=document.getElementById(id);if(!el.value){el.style.borderColor='#f87171';ok=false}else el.style.borderColor=''});
  if(!ok)return;
  const sel=getSel();
  document.getElementById('selected-chips').innerHTML=sel.map(k=>`<span style="display:inline-flex;align-items:center;gap:5px;background:#f0fdf4;border:1px solid #86efac;border-radius:999px;padding:3px 10px;font-size:11px;font-weight:600;color:#166534">${NUTRIENT_META[k].name}</span>`).join('');
  document.getElementById('nutrient-rows').innerHTML=sel.map(k=>{
    const m = NUTRIENT_META[k];
    const examplesHtml = m.examples.map(([food,amt])=>`<div style="display:flex;justify-content:space-between;font-size:11.5px;color:#475569;padding:4px 0"><span>${food}</span><span style="font-weight:700;color:#0f172a">${amt}</span></div>`).join('');
    return `<div class="ni-row" style="flex-direction:column;align-items:stretch">
      <div style="display:flex;align-items:center;gap:10px;width:100%">
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;color:#0f172a">${m.name}</div>
          <div style="font-size:11px;color:#94a3b8;margin-top:2px">RDA: ${m.rda}</div>
        </div>
        <div class="ni-input-wrap"><input type="number" step="0.1" min="0" name="${k}" placeholder="${m.ph}" required><span class="ni-unit">${m.unit}</span></div>
      </div>
      <button type="button" onclick="toggleExamples(this)" style="background:none;border:none;padding:0;margin-top:8px;font-size:11px;font-weight:600;color:#059669;cursor:pointer;text-align:left">
        <i class="fa-solid fa-circle-question" style="margin-right:4px"></i>Not sure how much you eat? See examples
      </button>
      <div class="ni-examples" style="display:none;margin-top:8px;background:#f8fafc;border-radius:8px;padding:8px 12px">
        <p style="font-size:10.5px;color:#94a3b8;margin:0 0 4px">Approximate amounts, for reference:</p>
        ${examplesHtml}
      </div>
    </div>`;
  }).join('');
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
  showLoadingOverlay();
});

function showLoadingOverlay(){
  const overlay=document.createElement('div');
  overlay.id='page-loading-overlay';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(255,255,255,0.92);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;';
  overlay.innerHTML=`
    <div style="width:48px;height:48px;border:4px solid #d1fae5;border-top-color:#059669;border-radius:50%;animation:spin .8s linear infinite"></div>
    <p style="font-size:14px;font-weight:600;color:#0f172a;margin:0">Analysing your nutrient data…</p>
    <p style="font-size:12px;color:#64748b;margin:0">Comparing your intake against your age and sex-specific RDA values</p>
  `;
  document.body.appendChild(overlay);
}
