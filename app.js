const synth = window.speechSynthesis;

// Capture DOM References
const textInput = document.getElementById('text-input');
const langSelect = document.getElementById('lang-select');
const voiceSelect = document.getElementById('voice-select');
const rateRange = document.getElementById('rate-range');
const rateVal = document.getElementById('rate-val');
const pitchRange = document.getElementById('pitch-range');
const pitchVal = document.getElementById('pitch-val');

const btnSpeak = document.getElementById('btn-speak');
const btnPause = document.getElementById('btn-pause');
const btnStop = document.getElementById('btn-stop');
const btnClear = document.getElementById('btn-clear');
const btnPaste = document.getElementById('btn-paste');

const speakIcon = document.getElementById('speak-icon');
const speakText = document.getElementById('speak-text');
const pauseIcon = document.getElementById('pause-icon');

const charCount = document.getElementById('char-count');
const wordCount = document.getElementById('word-count');
const readTime = document.getElementById('read-time');

const filterAll = document.getElementById('filter-all');
const filterFemale = document.getElementById('filter-female');
const filterMale = document.getElementById('filter-male');

const profileContainer = document.getElementById('profile-container');
const totalProfilesBadge = document.getElementById('total-profiles-badge');

let allVoices = [];
let currentGenderFilter = 'all'; 
let textChunks = [];
let currentChunkIndex = 0;
let isUserPaused = false;

const maleNames = ['david', 'mark', 'george', 'ravi', 'prakash', 'male', 'microsoft sam', 'sean', 'kumar', 'karthik'];
const femaleNames = ['zira', 'hazel', 'samantha', 'susan', 'female', 'google uk english female', 'moira', 'tessa', 'karen', 'swara', 'vani', 'ani'];

function getVoiceGender(name) {
    const lower = name.toLowerCase();
    if (maleNames.some(m => lower.includes(m)) && !lower.includes('female')) return 'male';
    if (femaleNames.some(f => lower.includes(f))) return 'female';
    return 'female'; 
}

function displayVoices() {
    voiceSelect.innerHTML = '';
    profileContainer.innerHTML = '';
    const selectedLangCode = langSelect.value;

    let filtered = allVoices.filter(voice => {
        if (selectedLangCode !== 'all' && !voice.lang.startsWith(selectedLangCode)) return false;
        if (currentGenderFilter !== 'all' && getVoiceGender(voice.name) !== currentGenderFilter) return false;
        return true;
    });

    totalProfilesBadge.textContent = `${filtered.length} Profile${filtered.length === 1 ? '' : 's'} Found`;

    if(filtered.length === 0) {
        const opt = document.createElement('option');
        opt.textContent = `No matching profiles found`;
        voiceSelect.appendChild(opt);
        profileContainer.innerHTML = `<div class="col-span-full text-center py-6 text-slate-400">No matching voice profiles configuration.</div>`;
        return;
    }

    filtered.forEach((voice) => {
        const gender = getVoiceGender(voice.name);
        const genderLabel = gender.toUpperCase();
        
        const option = document.createElement('option');
        option.textContent = `[${genderLabel}] ${voice.name} (${voice.lang})`;
        option.value = voice.name;
        voiceSelect.appendChild(option);

        const card = document.createElement('div');
        card.className = "flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-sky-400 hover:bg-white transition shadow-sm";
        const isFemale = gender === 'female';
        
        card.innerHTML = `
            <div class="truncate pr-2">
                <div class="font-semibold text-slate-700 truncate">${voice.name}</div>
                <div class="text-[11px] text-slate-400">${voice.lang}</div>
            </div>
            <span class="text-[10px] font-bold px-2 py-1 rounded-md border shrink-0 ${isFemale ? 'bg-pink-50 text-pink-700 border-pink-100' : 'bg-blue-50 text-blue-700 border-blue-100'}">
                ${genderLabel}
            </span>
        `;
        profileContainer.appendChild(card);
    });
}

function loadVoices() {
    allVoices = synth.getVoices();
    displayVoices();
}

loadVoices();
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
}

langSelect.addEventListener('change', displayVoices);

function updateTabUI(activeButton) {
    [filterAll, filterFemale, filterMale].forEach(btn => {
        btn.className = "py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition flex items-center justify-center gap-1";
    });
    activeButton.className = "py-2 text-xs font-bold rounded-xl border border-blue-200 bg-blue-50 text-blue-600 transition flex items-center justify-center gap-1";
}

filterAll.addEventListener('click', () => { currentGenderFilter = 'all'; updateTabUI(filterAll); displayVoices(); });
filterFemale.addEventListener('click', () => { currentGenderFilter = 'female'; updateTabUI(filterFemale); displayVoices(); });
filterMale.addEventListener('click', () => { currentGenderFilter = 'male'; updateTabUI(filterMale); displayVoices(); });

function analyzeText() {
    const text = textInput.value;
    charCount.textContent = text.length.toLocaleString();
    const cleanText = text.trim().replace(/\s+/g, ' ');
    const words = cleanText === "" ? 0 : cleanText.split(' ').length;
    wordCount.textContent = words.toLocaleString();
    const totalSeconds = Math.ceil((words / 150) * 60);
    readTime.textContent = `${Math.floor(totalSeconds / 60)}m ${totalSeconds % 60}s`;
}

textInput.addEventListener('input', analyzeText);
rateRange.addEventListener('input', () => rateVal.textContent = `${rateRange.value}x`);
pitchRange.addEventListener('input', () => pitchVal.textContent = pitchRange.value);

function setEngineState(state) {
    if(state === 'speaking') {
        speakText.textContent = "Speaking...";
        speakIcon.className = "fa-solid fa-volume-high text-sky-400 animate-pulse";
        btnPause.disabled = false;
        btnStop.disabled = false;
        pauseIcon.className = "fa-solid fa-pause";
    } else if (state === 'paused') {
        speakText.textContent = "Speech Paused";
        speakIcon.className = "fa-solid fa-circle-pause text-amber-400";
        pauseIcon.className = "fa-solid fa-play text-sky-400";
    } else {
        speakText.textContent = "Generate Speech";
        speakIcon.className = "fa-solid fa-play";
        btnPause.disabled = true;
        btnStop.disabled = true;
    }
}

function speakNextChunk() {
    if (isUserPaused || currentChunkIndex >= textChunks.length) {
        if (currentChunkIndex >= textChunks.length) resetEngineState();
        return;
    }

    const chunkText = textChunks[currentChunkIndex].trim();
    if (!chunkText) {
        currentChunkIndex++;
        speakNextChunk();
        return;
    }

    const utterance = new SpeechSynthesisUtterance(chunkText);
    const selectedVoice = allVoices.find(v => v.name === voiceSelect.value);
    if (selectedVoice) utterance.voice = selectedVoice;

    utterance.rate = parseFloat(rateRange.value);
    utterance.pitch = parseFloat(pitchRange.value);

    utterance.onend = () => {
        currentChunkIndex++;
        speakNextChunk();
    };

    utterance.onerror = () => {
        currentChunkIndex++;
        speakNextChunk();
    };

    setEngineState('speaking');
    synth.speak(utterance);
}

function resetEngineState() {
    synth.cancel();
    textChunks = [];
    currentChunkIndex = 0;
    isUserPaused = false;
    setEngineState('idle');
}

btnSpeak.addEventListener('click', () => {
    if (synth.speaking && isUserPaused) {
        isUserPaused = false;
        speakNextChunk();
        return;
    }
    if (synth.speaking) return;
    if (!textInput.value.trim()) return;

    resetEngineState();
    const rawText = textInput.value;
    textChunks = rawText.match(/[^.!?।၊]+[.!?Target|।၊]*|\s+/g) || [rawText];
    isUserPaused = false;
    currentChunkIndex = 0;
    speakNextChunk();
});

btnPause.addEventListener('click', () => {
    if (synth.speaking && !isUserPaused) {
        isUserPaused = true;
        synth.cancel();
        setEngineState('paused');
    } else if (isUserPaused) {
        isUserPaused = false;
        speakNextChunk();
    }
});

btnStop.addEventListener('click', resetEngineState);
btnClear.addEventListener('click', () => { resetEngineState(); textInput.value = ''; analyzeText(); });

btnPaste.addEventListener('click', async () => {
    try {
        textInput.value += await navigator.clipboard.readText();
        analyzeText();
    } catch (err) {
        alert("Please paste text into the container manually.");
    }
});
