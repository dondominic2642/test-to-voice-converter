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
const btnDownload = document.getElementById('btn-download');

const speakIcon = document.getElementById('speak-icon');
const speakText = document.getElementById('speak-text');
const downloadIcon = document.getElementById('download-icon');
const downloadText = document.getElementById('download-text');
const downloadFormat = document.getElementById('download-format');

const charCount = document.getElementById('char-count');
const wordCount = document.getElementById('word-count');
const readTime = document.getElementById('read-time');

const filterAll = document.getElementById('filter-all');
const filterFemale = document.getElementById('filter-female');
const filterMale = document.getElementById('filter-male');

const profileContainer = document.getElementById('profile-container');
const totalProfilesBadge = document.getElementById('total-profiles-badge');

// Global Speech Synthesis Hook for the local live reader preview
const synth = window.speechSynthesis;
let allVoices = [];
let currentGenderFilter = 'all'; 
let currentAudioPreview = null;

// Clean, high-fidelity profile dictionary for superfast processing
const mockProfiles = [
    { name: "Google US English", lang: "en", gender: "female", engineCode: "en-US" },
    { name: "Microsoft David Mobile", lang: "en", gender: "male", engineCode: "en-US" },
    { name: "Google മലയാളം Vani", lang: "ml", gender: "female", engineCode: "ml-IN" },
    { name: "Google தமிழ் Swara", lang: "ta", gender: "female", engineCode: "ta-IN" },
    { name: "Google తెలుగు Ravi", lang: "te", gender: "male", engineCode: "te-IN" }
];

function displayVoices() {
    voiceSelect.innerHTML = '';
    profileContainer.innerHTML = '';
    const selectedLangCode = langSelect.value;

    let filtered = mockProfiles.filter(voice => {
        if (selectedLangCode !== 'all' && voice.lang !== selectedLangCode) return false;
        if (currentGenderFilter !== 'all' && voice.gender !== currentGenderFilter) return false;
        return true;
    });

    totalProfilesBadge.textContent = `${filtered.length} Profile${filtered.length === 1 ? '' : 's'} Active`;

    filtered.forEach((voice) => {
        const genderLabel = voice.gender.toUpperCase();
        
        const option = document.createElement('option');
        option.textContent = `[${genderLabel}] ${voice.name} (${voice.lang})`;
        option.value = voice.engineCode;
        voiceSelect.appendChild(option);

        const card = document.createElement('div');
        card.className = "flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-sky-400 hover:bg-white transition shadow-sm";
        const isFemale = voice.gender === 'female';
        
        card.innerHTML = `
            <div class="truncate pr-2">
                <div class="font-semibold text-slate-700 truncate">${voice.name}</div>
                <div class="text-[11px] text-slate-400">System Code: ${voice.engineCode}</div>
            </div>
            <span class="text-[10px] font-bold px-2 py-1 rounded-md border shrink-0 ${isFemale ? 'bg-pink-50 text-pink-700 border-pink-100' : 'bg-blue-50 text-blue-700 border-blue-100'}">
                ${genderLabel}
            </span>
        `;
        profileContainer.appendChild(card);
    });
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
        speakText.textContent = "Playing Voice...";
        speakIcon.className = "fa-solid fa-volume-high text-sky-400 animate-pulse";
        btnStop.disabled = false;
    } else {
        speakText.textContent = "Generate Speech";
        speakIcon.className = "fa-solid fa-play";
        btnStop.disabled = true;
    }
}

// SUPERFAST INSTANT EXPORT LOGIC
btnDownload.addEventListener('click', async () => {
    const text = textInput.value.trim();
    if (!text) {
        alert("Please enter some text before trying to download!");
        return;
    }

    // Toggle Loading UI State
    downloadText.textContent = "Building File...";
    downloadIcon.className = "fa-solid fa-spinner animate-spin text-emerald-300";
    btnDownload.disabled = true;

    try {
        const lang = voiceSelect.value || "en-US";
        const format = downloadFormat.value; // mp3 or mp4
        
        // Instant streaming compilation endpoint construction
        const swiftUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(text)}`;
        
        // Fetch stream conversion elements directly 
        const response = await fetch(swiftUrl);
        const blob = await response.blob();
        
        // Re-containerize content extensions seamlessly based on UI settings
        const mimeType = format === 'mp4' ? 'audio/mp4' : 'audio/mp3';
        const fileBlob = new Blob([blob], { type: mimeType });
        const downloadUrl = window.URL.createObjectURL(fileBlob);
        
        // Execute automatic download prompt anchor link
        const anchor = document.createElement('a');
        anchor.href = downloadUrl;
        anchor.download = `echospeak_export_${Date.now()}.${format}`;
        document.body.appendChild(anchor);
        anchor.click();
        
        // Clean up temporary DOM nodes
        document.body.removeChild(anchor);
        window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
        console.error("Export sequence failed:", error);
        alert("Speed routing error occurred. Try a shorter sentence block.");
    } finally {
        // Reset Download Button Elements back to operational status
        downloadText.textContent = "Capture & Download File";
        downloadIcon.className = "fa-solid fa-download";
        btnDownload.disabled = false;
    }
});

// Live Preview Playing Engine
btnSpeak.addEventListener('click', () => {
    const text = textInput.value.trim();
    if (!text) return;

    if (currentAudioPreview) {
        currentAudioPreview.pause();
    }

    setEngineState('speaking');
    const lang = voiceSelect.value || "en-US";
    
    currentAudioPreview = new Audio(`https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(text)}`);
    currentAudioPreview.play();
    
    currentAudioPreview.onended = () => {
        setEngineState('idle');
    };
});

btnStop.addEventListener('click', () => {
    if (currentAudioPreview) {
        currentAudioPreview.pause();
        currentAudioPreview.currentTime = 0;
    }
    setEngineState('idle');
});

btnClear.addEventListener('click', () => {
    if (currentAudioPreview) currentAudioPreview.pause();
    setEngineState('idle');
    textInput.value = '';
    analyzeText();
});

btnPaste.addEventListener('click', async () => {
    try {
        textInput.value += await navigator.clipboard.readText();
        analyzeText();
    } catch (err) {
        alert("Please paste text into the container manually.");
    }
});

// Initial boot sequence run
displayVoices();
