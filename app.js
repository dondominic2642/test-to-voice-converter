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

let currentGenderFilter = 'all'; 
let currentAudioPreview = null;
let isGlobalStopped = false;

// Global Voice Map Supporting Multi-Language Profiles
const mockProfiles = [
    { name: "Google US English", lang: "en", gender: "female", engineCode: "en-US" },
    { name: "Microsoft David Mobile", lang: "en", gender: "male", engineCode: "en-US" },
    { name: "Google മലയാളം (Malayalam)", lang: "ml", gender: "female", engineCode: "ml-IN" },
    { name: "Google தமிழ் (Tamil)", lang: "ta", gender: "female", engineCode: "ta-IN" },
    { name: "Google తెలుగు (Telugu)", lang: "te", gender: "male", engineCode: "te-IN" },
    { name: "Google हिन्दी (Hindi)", lang: "hi", gender: "female", engineCode: "hi-IN" },
    { name: "Google العربية (Arabic)", lang: "ar", gender: "female", engineCode: "ar-XA" }
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
        option.textContent = `[${genderLabel}] ${voice.name}`;
        option.value = voice.engineCode;
        voiceSelect.appendChild(option);

        const card = document.createElement('div');
        card.className = "flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-sky-400 hover:bg-white transition shadow-sm";
        const isFemale = voice.gender === 'female';
        
        card.innerHTML = `
            <div class="truncate pr-2">
                <div class="font-semibold text-slate-700 truncate">${voice.name}</div>
                <div class="text-[11px] text-slate-400">Language Group: ${voice.engineCode}</div>
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

// UNIVERSAL CHUNKING ALGORITHM: Safe for every language script globally
function splitTextIntoSafeChunks(text, maxLength = 140) {
    if (!text) return [];
    
    const chunks = [];
    let i = 0;

    while (i < text.length) {
        let endIndex = i + maxLength;
        
        if (endIndex >= text.length) {
            chunks.push(text.substring(i));
            break;
        }

        let spaceIndex = text.lastIndexOf(' ', endIndex);
        
        if (spaceIndex > i && spaceIndex > endIndex - 30) {
            chunks.push(text.substring(i, spaceIndex));
            i = spaceIndex + 1; 
        } else {
            chunks.push(text.substring(i, endIndex));
            i = endIndex;
        }
    }
    return chunks;
}

// HELPER FUNCTION: Introduces a tiny execution pause to bypass request blocks
const delay = ms => new Promise(res => setTimeout(res, ms));

// RATE-LIMIT PROTECTED SEQUENTIAL DOWNLOAD ENGINE
btnDownload.addEventListener('click', async () => {
    const text = textInput.value.trim();
    if (!text) {
        alert("Please enter text first!");
        return;
    }

    isGlobalStopped = false;
    downloadText.textContent = "Processing (0%)...";
    downloadIcon.className = "fa-solid fa-spinner animate-spin text-emerald-300";
    btnDownload.disabled = true;

    try {
        const lang = voiceSelect.value || "en-US";
        const format = downloadFormat.value;
        const safeChunks = splitTextIntoSafeChunks(text);
        const blobs = [];
        
        // Loop sequentially through chunks to prevent triggering server blocks
        for (let idx = 0; idx < safeChunks.length; idx++) {
            if (isGlobalStopped) return;
            
            // Update percentage progress indicator in real-time
            const progress = Math.round(((idx) / safeChunks.length) * 100);
            downloadText.textContent = `Processing (${progress}%)...`;

            const chunk = safeChunks[idx];
            const swiftUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(chunk)}`;
            
            const response = await fetch(swiftUrl);
            if (!response.ok) {
                throw new Error("Server throttled the request pipeline.");
            }
            
            const audioDataBlob = await response.blob();
            blobs.push(audioDataBlob);
            
            // Wait 120ms before requesting the next chunk to remain under the safety window
            await delay(120);
        }

        downloadText.textContent = "Compiling Package...";
        
        const mimeType = format === 'mp4' ? 'audio/mp4' : 'audio/mp3';
        const finalMergedBlob = new Blob(blobs, { type: mimeType });
        const downloadUrl = window.URL.createObjectURL(finalMergedBlob);
        
        const anchor = document.createElement('a');
        anchor.href = downloadUrl;
        anchor.download = `echospeak_universal_${Date.now()}.${format}`;
        document.body.appendChild(anchor);
        anchor.click();
        
        document.body.removeChild(anchor);
        window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
        console.error("Global compilation sequence error:", error);
        alert("Server protection triggered. Please shorten your text block slightly or try again in a moment.");
    } finally {
        downloadText.textContent = "Capture & Download File";
        downloadIcon.className = "fa-solid fa-download";
        btnDownload.disabled = false;
    }
});

// Live Preview Playing Engine
btnSpeak.addEventListener('click', async () => {
    const text = textInput.value.trim();
    if (!text) return;

    if (currentAudioPreview) currentAudioPreview.pause();
    isGlobalStopped = false;

    speakText.textContent = "Loading Audio...";
    speakIcon.className = "fa-solid fa-spinner animate-spin text-sky-400";

    try {
        const lang = voiceSelect.value || "en-US";
        const safeChunks = splitTextIntoSafeChunks(text);
        const blobs = [];
        
        for (let idx = 0; idx < safeChunks.length; idx++) {
            if (isGlobalStopped) return;
            const chunk = safeChunks[idx];
            const swiftUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(chunk)}`;
            
            const response = await fetch(swiftUrl);
            const dataBlob = await response.blob();
            blobs.push(dataBlob);
            
            await delay(120);
        }

        const combinedBlob = new Blob(blobs, { type: 'audio/mp3' });
        const playUrl = window.URL.createObjectURL(combinedBlob);

        currentAudioPreview = new Audio(playUrl);
        
        speakText.textContent = "Playing Voice...";
        speakIcon.className = "fa-solid fa-volume-high text-sky-400 animate-pulse";
        btnStop.disabled = false;

        currentAudioPreview.play();
        currentAudioPreview.onended = () => {
            speakText.textContent = "Generate Speech";
            speakIcon.className = "fa-solid fa-play";
            btnStop.disabled = true;
        };
    } catch (err) {
        console.error("Audio engine render crash:", err);
        speakText.textContent = "Generate Speech";
        speakIcon.className = "fa-solid fa-play";
    }
});

btnStop.addEventListener('click', () => {
    isGlobalStopped = true;
    if (currentAudioPreview) {
        currentAudioPreview.pause();
        currentAudioPreview.currentTime = 0;
    }
    speakText.textContent = "Generate Speech";
    speakIcon.className = "fa-solid fa-play";
    btnStop.disabled = true;
    
    downloadText.textContent = "Capture & Download File";
    downloadIcon.className = "fa-solid fa-download";
    btnDownload.disabled = false;
});

btnClear.addEventListener('click', () => {
    isGlobalStopped = true;
    if (currentAudioPreview) currentAudioPreview.pause();
    speakText.textContent = "Generate Speech";
    speakIcon.className = "fa-solid fa-play";
    btnStop.disabled = true;
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

// Run initial display on bootup
displayVoices();
