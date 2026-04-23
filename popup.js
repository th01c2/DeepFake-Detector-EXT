document.getElementById('verifyBtn').addEventListener('click', async () => {
    // Get the current active tab
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Inject and run the analysis script
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
    });
    
    window.close(); // Close the popup after clicking
});
