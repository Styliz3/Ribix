/* DoAI — Google Docs–style editor with Groq AI
// --- Selection helpers ---
function getSelectionText(){
const sel = window.getSelection();
return sel && sel.toString();
}
function replaceSelectionWithHTML(html){
const sel = window.getSelection();
if(!sel || sel.rangeCount===0) return;
const range = sel.getRangeAt(0);
range.deleteContents();
const frag = range.createContextualFragment(html);
range.insertNode(frag);
}


// --- Export (simple HTML download) ---
exportBtn.addEventListener('click', ()=>{
const blob = new Blob([
`<!doctype html><meta charset=\"utf-8\"><title>${escapeHtml(docTitle.value)}</title>`+
`<style>body{font-family:Inter,system-ui,Segoe UI,Roboto,Arial;padding:2rem;line-height:1.5}</style>`+
`<h1>${escapeHtml(docTitle.value)}</h1>`+
editor.innerHTML
], {type:'text/html'});
const a = document.createElement('a');
a.href = URL.createObjectURL(blob);
a.download = (docTitle.value||'DoAI-Doc')+'.html';
a.click();
});


function escapeHtml(s){ return s.replace(/[&<>\"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c])); }


// --- Groq Chat Completion ---
const systemPrompt = (
`You are DoAI, an expert writing assistant living inside a Google Docs–style editor.
User name: ${localStorage.getItem('doai.name')||'Writer'}.
Goals: improve clarity, correctness, and tone. Keep facts plausible and neutral. When asked to fix grammar, do not change meaning. When summarizing, prefer bullets; bold key terms. When translating, preserve proper nouns.
NEVER include prefaces like "Here is"—output the final text only, ready to paste back. Use clean HTML inline tags (<strong>, <em>, <u>, <ul>, <ol>, <li>, <p>, <h1>–<h3>) where appropriate. Avoid <div> wrappers. Do not include code blocks.
`);


async function askGroq({ selection, prompt }){
const apiKey = store.key;
if(!apiKey){ throw new Error('Add your Groq API key to run AI.'); }


const body = {
model: 'llama-3.3-70b-versatile',
messages: [
{ role:'system', content: systemPrompt },
{ role:'user', content: `Task: ${prompt}\n\nSelected text:\n${selection}\n\nReturn only the improved content as HTML.` }
],
temperature: 0.4,
max_tokens: 1200,
};


const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'Authorization': 'Bearer ' + apiKey
},
body: JSON.stringify(body)
});


if(!res.ok){
const txt = await res.text().catch(()=> '');
throw new Error(`Groq error ${res.status}: ${txt||res.statusText}`);
}
const data = await res.json();
const content = data?.choices?.[0]?.message?.content || '';
// Basic guard: strip markdown fences if any, trust inline HTML per system prompt
return content.replace(/^```[\s\S]*?```$/g,'').trim();
}


// Utility: show AI modal directly
function showAI({ lead, prefill }){
aiLead.textContent = lead||'What should I do?';
aiPrompt.value = prefill||'';
userNameInp.value = store.name;
apiKeyInp.value = store.key;
aiModal.style.display='flex';
}
})();
