(async () => {
    const CONFIG = {
        API_KEY: "API_KEY", //Nu am adaugat cheia pentru ca am folosit deja limita free de requesturi de la gemini 
        ENDPOINT: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        RETRY_LIMIT: 3,
        RETRY_DELAY_MS: 2000
    };

    const UI_CLASSES = {
        OVERLAY: 'misinfo-overlay',
        POPUP: 'safe-popup'
    };

    const getPageContent = () => {
        const clone = document.body.cloneNode(true);
        const trashTags = ['script', 'style', 'noscript', 'iframe', 'svg', 'nav', 'footer', 'header', 'aside', 'form'];
        
        trashTags.forEach(tag => clone.querySelectorAll(tag).forEach(e => e.remove()));
        
        return clone.innerText.replace(/\s+/g, ' ').substring(0, 5000).trim();
    };

    const displaySafePopup = () => {
        if (document.getElementById(UI_CLASSES.POPUP)) return;

        const popup = document.createElement('div');
        popup.id = UI_CLASSES.POPUP;
        Object.assign(popup.style, {
            position: 'fixed', top: '20px', right: '-300px', width: '250px', zIndex: '9999999',
            backgroundColor: 'white', color: '#2ecc71', padding: '15px 20px', borderRadius: '10px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)', fontFamily: 'sans-serif', fontWeight: 'bold',
            fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'right 0.5s ease-out'
        });
        
        popup.innerText = "Sursa este sigură.";
        document.body.appendChild(popup);
        
        requestAnimationFrame(() => popup.style.right = '20px');
        setTimeout(() => {
            popup.style.right = '-300px';
            setTimeout(() => popup.remove(), 500);
        }, 4000);
    };

    const displayWarning = (message) => {
        if (document.getElementById(UI_CLASSES.OVERLAY)) return;

        document.body.style.transition = 'filter 0.5s ease';
        document.body.style.filter = 'blur(15px)';

        const overlay = document.createElement('div');
        overlay.id = UI_CLASSES.OVERLAY;
        Object.assign(overlay.style, {
            position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh', zIndex: '9999999',
            backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        });

        const modal = document.createElement('div');
        Object.assign(modal.style, {
            background: 'white', width: '80%', maxWidth: '600px', padding: '40px', borderRadius: '15px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)', textAlign: 'center', color: 'black', fontFamily: 'sans-serif'
        });

        modal.innerHTML = `
            <div style="font-size: 26px; font-weight: bold; text-transform: uppercase; margin-bottom: 25px;">
                WARNING: ${message}
            </div>
            <button id="close-warning" style="padding: 12px 25px; font-size: 16px; cursor: pointer; border: none; borderRadius: 8px; background-color: #e74c3c; color: white; font-weight: bold;">
                Închide Avertismentul
            </button>`;

        overlay.appendChild(modal);
        document.documentElement.appendChild(overlay);

        document.getElementById('close-warning').onclick = () => {
            overlay.remove();
            document.body.style.filter = 'none';
        };
    };

    const fetchAnalysis = async (text) => {
        const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const prompt = `Current Date: ${today}. Analyze the following text. Return ONLY valid JSON: {"isLegit": boolean, "reason": string}. Text: ${text}`;

        for (let i = 0; i < CONFIG.RETRY_LIMIT; i++) {
            try {
                const response = await fetch(CONFIG.ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': CONFIG.API_KEY },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { responseMimeType: "application/json" }
                    })
                });

                if (response.ok) return await response.json();
                if (response.status !== 503) throw new Error(`API Error: ${response.status}`);
                
                await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY_MS));
            } catch (err) {
                if (i === CONFIG.RETRY_LIMIT - 1) throw err;
            }
        }
    };

    try {
        const content = getPageContent();
        const data = await fetchAnalysis(content);
        const result = JSON.parse(data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim());

        result.isLegit ? displaySafePopup() : displayWarning(result.reason);
    } catch (error) {
        console.error("Content Analysis Failed:", error);
    }
})();
