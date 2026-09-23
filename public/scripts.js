'use strict';
const $ = id => document.getElementById(id);
const state = { animals: [], shelters: [], filtered: null, editing: null, deleting: null, loaded: false };
const pages = {
    overview: ['A little care goes a long way.', 'Your shelter network'],
    animals: ['Every animal, a story.', 'Manage animal records across your shelter network.'],
    shelters: ['A place to feel safe.', 'Your locations and the care they provide.'],
    adoptions: ['The next chapter.', 'Find the people and animals brought together through adoption.'],
    volunteers: ['Good people. Great care.', 'A directory of the people who make a difference.'],
    donors: ['Generosity that goes further.', 'Recognize the supporters behind every kind of care.']
};

const columns = { WorkerID:'Worker ID', firstName:'First name', lastName:'Last name', phoneNumber:'Phone', volunteerHours:'Hours', availability:'Availability', startDate:'Start date' };
const esc = value => String(value ?? '—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(url, body) {
    const response = await fetch(url, body === undefined ? {} : {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const result = await response.json();
    if (!response.ok || result.success === false) throw new Error(result.message || 'Could not complete the request. Please try again.');
    return result;
}
function notice(message) { 
    $('toast').textContent=message; $('toast').hidden=false; 
    clearTimeout(notice.timer);
    notice.timer=setTimeout(()=>$('toast').hidden=true,3500); 
}
function errorAt(id,error) { 
    $(id).textContent=error.message; $(id).hidden=false; 
}
function table(headers, rows, empty='No records found.') {
    return rows.length ? 
    `<table>
    <thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>` : `<div class="empty">${esc(empty)}</div>`;
}
function animalTable(rows, actions=false) {
    if (!rows.length) return '<div class="empty">No animals match your filters.<small>Try another search or add a new animal.</small></div>';
    return `<table>
    <thead><tr><th>Animal</th><th>Gender</th><th>Age</th><th>Color</th><th>Shelter</th>
    ${actions?'<th>Actions</th>':''}</tr></thead>
    <tbody>${rows.map(r=>`<tr>
        <td><div class="animal-cell"><span class="animal-badge">♧</span>
        <div>${esc(r[1])}<small>ANIMAL #${esc(r[0])}</small></div></div></td>
        <td><span class="gender ${r[2]==='M'?'male':''}">${r[2]==='M'?'Male':'Female'}</span></td>
        <td>${esc(r[3])} ${Number(r[3])===1?'year':'years'}</td>
        <td>${esc(r[4])}</td>
        <td>${esc(r[5])}</td>
        ${actions?`<td><div class="row-actions"><button data-edit="${esc(r[0])}" aria-label="Edit animal ${esc(r[0])}">Edit ↗</button><button class="remove" data-delete="${esc(r[0])}" aria-label="Remove animal ${esc(r[0])}">Remove</button></div></td>`:''}</tr>`).join('')}
    </tbody>
    </table>`;
}
function renderAnimals() {
    const q=$('animal-search').value.trim().toLowerCase(), shelter=$('shelter-filter').value, gender=$('gender-filter').value;
    const rows=state.animals.filter(r=>(!state.filtered || state.filtered.has(String(r[0]))) && (!q || [r[0],r[1],r[4]].some(v=>String(v).toLowerCase().includes(q))) && (!shelter || JSON.stringify([r[5],r[6]])===shelter) && (!gender || r[2]===gender));
    $('animal-table').innerHTML=animalTable(rows,true);
    $('animal-count').textContent=`Showing ${rows.length} of ${state.animals.length} animals`;
}
async function overview() {
    const results=await Promise.all([api('/get-all-types-animals'),api('/projection',{attributes:['WorkerID']}),api('/donors-all-categories')]);
    const breeds=results[0].data;
    if (!Array.isArray(breeds)) throw new Error('Could not load animal statistics.');
    const metrics=[['Animal records',state.animals.length,'Across your shelter network'],['Shelter locations',state.shelters.length,'Places that make a difference'],['Volunteers',results[1].data.length,'People behind the care'],['All-category donors',results[2].data.length,'Supporting every supply category']];
    $('stats').innerHTML=metrics.map(([label,note,sub])=>`<div class="stat"><div class="stat-label">${label}</div><strong>${note}</strong><small>${sub}</small></div>`).join('');
    const palette=['#627a43','#90a76c','#bdcba7','#d8dfc9','#eaeede'];let start=0;const total=breeds.reduce((n,r)=>n+r[1],0);
    const stops=breeds.map((r,i)=>{const end=start+(total?r[1]/total*100:0);
        const stop=`${palette[i%palette.length]} ${start}% ${end}%`;
        start=end;return stop;});
    $('donut').style.background=total?`conic-gradient(${stops.join(',')})`:'#e8eddf';
    $('donut-total').textContent=total;
    $('breed-legend').innerHTML=breeds.map((r,i)=>`<div class="legend-row"><i style="background:${palette[i%palette.length]}"></i>${esc(r[0])}<strong>${r[1]}</strong><small>${Math.round(r[1]/total*100)}%</small></div>`).join('');
    $('overview-table').innerHTML=animalTable(state.animals.slice(0,5));
}
async function shelters() {
    $('shelter-cards').innerHTML=state.shelters.map((s,i)=>`<article class="shelter-card"><div class="building">⌂</div><h3>${esc(s[0])}</h3><p>${esc(s[1])}</p><strong>${state.animals.filter(r=>r[5]===s[0]&&r[6]===s[1]).length}</strong> <span class="muted">animal records</span><a href="#animals" data-shelter="${i}">Explore animals →</a></article>`).join('');
    const [staff,average]=await Promise.all([api('/get-shelters-with-more-than-5-staff'),api('/get-shelters-with-more-than-average-animals')]);
    if (!Array.isArray(staff.data)||!Array.isArray(average.data)) throw new Error('Could not load shelter reports.');
    $('staff-table').innerHTML=table(['Address','Postal code','Staff'],staff.data);
    $('average-table').innerHTML=table(['Address','Postal code','Animals'],average.data);
}
async function volunteers() {
    const attrs=[...document.querySelectorAll('#volunteer-columns input:checked')].map(el=>el.value);
    if(!attrs.length){$('volunteer-results').innerHTML='<div class="empty">Choose at least one column to view volunteers.</div>';return;}
    const result=await api('/projection',{attributes:attrs});
    $('volunteer-results').innerHTML=table(attrs.map(a=>columns[a]),result.data);
}
async function donors() {const result=await api('/donors-all-categories');
    $('donor-results').innerHTML=table(['Email address','Donor name'],result.data,'No donors have contributed to every category yet.');}
async function route() {
    const page=Object.hasOwn(pages, location.hash.slice(1))?location.hash.slice(1):'overview';
    document.querySelectorAll('[data-view]').forEach(el=>el.hidden=el.dataset.view!==page);
    document.querySelectorAll('nav a').forEach(el=>{el.classList.toggle('active',el.dataset.page===page);
        if(el.dataset.page===page)el.setAttribute('aria-current','page');
        else el.removeAttribute('aria-current');
    });
    $('page-title').textContent=pages[page][0];
    $('page-description').textContent=pages[page][1];
    $('breadcrumb').textContent=page[0].toUpperCase()+page.slice(1);
    $('global-error').hidden=true;
    if (!state.loaded)return;
    try {if(page==='overview')await overview();
        if(page==='animals')renderAnimals();
        if(page==='shelters')await shelters();
        if(page==='volunteers')await volunteers();
        if(page==='donors')await donors();}catch(e){errorAt('global-error',e);
    }
    $('add-animal').hidden = page !== 'animals';
}
async function refresh() {
    const [a,s]=await Promise.all([api('/animals'),api('/shelters')]);state.animals=a.data;state.shelters=s.data;
    $('nav-count').textContent=a.data.length;
    const current=$('shelter-filter').value;
    $('shelter-filter').innerHTML='<option value="">All shelters</option>'+s.data.map(r=>`<option value="${esc(JSON.stringify(r))}">${esc(r[0])}</option>`).join('');
    $('shelter-filter').value=current;
    state.loaded=true;await route();
}
function openAnimal(id) {
    if(!state.loaded)return;
    const row=state.animals.find(r=>String(r[0])===String(id));state.editing=row?row[0]:null;
    const f=$('animal-form');f.reset();$('form-error').hidden=true;
    f.elements.shelter.innerHTML='<option value="">Choose a shelter</option>'+state.shelters.map(r=>`<option value="${esc(JSON.stringify(r))}">${esc(r[0])} · ${esc(r[1])}</option>`).join('');
    f.elements.animalID.readOnly=!!row;
    if(row){['animalID','breed','gender','age','color'].forEach((key,i)=>f.elements[key].value=row[i]);f.elements.shelter.value=JSON.stringify([row[5],row[6]]);}
    $('dialog-title').textContent=row?'Edit animal record':'Add an animal';$('save-animal').textContent=row?'Save changes':'Add animal';$('animal-dialog').showModal();
}
$('animal-form').addEventListener('submit',async e=>{
    e.preventDefault();const f=e.currentTarget;const values=Object.fromEntries(new FormData(f));
    const shelter=JSON.parse(values.shelter);
    delete values.shelter;
    values.shelterAddress=shelter[0];
    values.shelterPostalCode=shelter[1];
    $('save-animal').disabled=true;
    $('form-error').hidden=true;
    try{await api(state.editing===null?'/insert-animal':'/update-animal',values);
        $('animal-dialog').close();
        state.filtered=null;
        await refresh();notice('Animal record saved.');
    }catch(error){errorAt('form-error',error);}finally{$('save-animal').disabled=false;}
});
$('delete-form').addEventListener('submit',async e=>{e.preventDefault();
    $('confirm-delete').disabled=true;try{await api('/delete-animal',{animalID:state.deleting});
    $('delete-dialog').close();state.filtered=null;
    await refresh();notice('Animal record removed.');
}catch(error){errorAt('delete-error',error);

}finally{$('confirm-delete').disabled=false;}});
$('animal-table').addEventListener('click',e=>{const edit=e.target.closest('[data-edit]'),remove=e.target.closest('[data-delete]');
    if(edit)openAnimal(edit.dataset.edit);if(remove){state.deleting=remove.dataset.delete;const r=state.animals.find(r=>String(r[0])===state.deleting);
        $('delete-description').textContent=`You are removing ${r[1]} · Animal #${r[0]}.`;$('delete-error').hidden=true;$('delete-dialog').showModal();}});
document.querySelectorAll('.close-dialog').forEach(b=>b.onclick=()=>$('animal-dialog').close());['cancel-delete','cancel-delete-x'].forEach(id=>$(id).onclick=()=>$('delete-dialog').close());
$('add-animal').onclick=()=>openAnimal();
$('view-animals').onclick=()=>location.hash='animals';
['animal-search','shelter-filter','gender-filter'].forEach(id=>$(id).addEventListener('input',renderAnimals));
$('shelter-cards').onclick=e=>{const link=e.target.closest('[data-shelter]');
    if(link){$('shelter-filter').value=JSON.stringify(state.shelters[link.dataset.shelter]);$('animal-search').value='';
        $('gender-filter').value='';state.filtered=null;}};
function condition(){const row=document.createElement('div');
    row.className='condition';
    row.innerHTML=
        `<select aria-label="Filter logic">
            ND</option><option value="OR">OR</option>
        </select>
        <select aria-label="Filter field">
            <option value="breed">Breed</option>
            <option value="gender">Gender (M/F)</option>
            <option value="age">Age</option><option value="color">Color</option>
            <option value="shelter">Shelter address</option>
        </select>
        <input aria-label="Filter value" placeholder="Exact value" required>
        <button class="plain" type="button" aria-label="Remove condition">×</button>`;
    row.querySelector('button').onclick=()=>row.remove();
    $('conditions').append(row);}
$('advanced-toggle').onclick=()=>{const hidden=!$('advanced-form').hidden;
    $('advanced-form').hidden=hidden;$('advanced-toggle').setAttribute('aria-expanded',String(!hidden));
};
    $('add-condition').onclick=condition;condition();
$('clear-filters').onclick=()=>{state.filtered=null;
    $('conditions').replaceChildren();condition();
    $('animal-search').value='';
    $('shelter-filter').value='';
    $('gender-filter').value='';renderAnimals();
};
$('advanced-form').onsubmit=async e=>{e.preventDefault();
    const attributes=[...$('conditions').children].map((row,i)=>({logic:i?row.children[0].value:'',attribute:row.children[1].value,userInput:row.children[2].value}));
    try{const r=await api('/selection',{attributes});state.filtered=new Set(r.data.map(row=>String(row[0])));renderAnimals();
    }catch(error){errorAt('global-error',error);
    }};
$('adoption-form').onsubmit=async e=>{e.preventDefault();
    const button=e.currentTarget.querySelector('button');
    button.disabled=true;
    try{
        const r=await api('/join',{adopterName:$('adopter-name').value.trim()});
    $('adoption-results').innerHTML=table(['Adopter','Animal ID','Age','Gender','Breed'],r.data||[],r.status==='no_record'?'This adopter has no adoption records.':'No matching adopter found.');
    }catch(error){
        errorAt('global-error',error);
    }finally{
        button.disabled=false;
}};
$('volunteer-columns').innerHTML=Object.entries(columns).map(([key,label])=>
    `<label><input type="checkbox" value="${key}" ${['firstName','lastName','volunteerHours','availability'].includes(key)?'checked':''}>${label}</label>`).join('');
$('volunteer-form').onsubmit=async e=>{e.preventDefault();
    try{
        await volunteers();
    }catch(error){errorAt('global-error',error);
}};
$('refresh-donors').onclick=async()=>
    {try{
        await donors();
    }catch(error){errorAt('global-error',error);
}};
window.addEventListener('hashchange',route);
route();refresh().catch(error=>errorAt('global-error',error));
fetch('/check-db-connection').then(r=>r.text()).then(text=>$('connection').textContent=text.trim()==='connected'?'Database connected':'Database unavailable').catch(()=>$('connection').textContent='Connection unavailable');
