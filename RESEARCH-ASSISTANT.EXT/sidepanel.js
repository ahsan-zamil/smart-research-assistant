document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['researchNotes'], function(result) {
       if (result.researchNotes) {
        document.getElementById('notes').value = result.researchNotes;
       } 
    });

    document.getElementById('summarizeBtn').addEventListener('click', summarizeText);
    document.getElementById('saveNotesBtn').addEventListener('click', saveNotes);
});


async function summarizeText() {
    try {
        // Show loading spinner
        document.getElementById('loadingSpinner').style.display = 'block';
        document.getElementById('results').innerHTML = '';

        const [tab] = await chrome.tabs.query({ active:true, currentWindow: true});
        const [{ result }] = await chrome.scripting.executeScript({
            target: {tabId: tab.id},
            function: () => window.getSelection().toString()
        });

        if (!result) {
            hideLoadingSpinner();
            showResult('Please select some text first');
            return;
        }

        const response = await fetch('http://localhost:8080/api/research/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: result, operation: 'summarize'})
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const text = await response.text();
        hideLoadingSpinner();
        showResult(text.replace(/\n/g,'<br>'));

    } catch (error) {
        hideLoadingSpinner();
        showResult('Error: ' + error.message);
    }
}

function hideLoadingSpinner() {
    document.getElementById('loadingSpinner').style.display = 'none';
}


async function saveNotes() {
    const notes = document.getElementById('notes').value;
    chrome.storage.local.set({ 'researchNotes': notes}, function() {
        alert('Notes saved successfully');
    });
}


function showResult(content) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `
        <div class="result-item">
            <div class="result-content">
                <i class="fas fa-lightbulb" style="color: #4a6cff; margin-right: 8px;"></i>
                ${content}
            </div>
        </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
}