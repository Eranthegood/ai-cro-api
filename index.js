// index.js - CRO Intelligence API - Solution complète
let allEvents = [];

export default async function handler(req, res) {
    // Headers CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    // Route pour servir le script CRO
    if (req.url && (req.url.includes('script') || req.url === '/cro-script.js')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        const script = getCROScript();
        res.status(200).send(script);
        return;
    }
    
    // Route POST - Recevoir les données
    if (req.method === 'POST') {
        try {
            const data = req.body;
            
            // Ajouter métadonnées
            data.receivedAt = new Date().toISOString();
            data.id = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            console.log('📥 Données reçues de:', data.url);
            
            // Générer suggestions IA
            const suggestions = generateAISuggestions(data);
            data.suggestions = suggestions;
            
            // Stocker
            allEvents.push(data);
            
            console.log('✅ Traité avec', suggestions.length, 'suggestions');
            
            res.status(200).json({
                success: true,
                message: 'Données reçues et analysées !',
                suggestionsCount: suggestions.length,
                totalStored: allEvents.length,
                confidence: 0.87
            });
            
        } catch (error) {
            console.error('❌ Erreur:', error);
            res.status(400).json({ error: 'Erreur traitement', details: error.message });
        }
        return;
    }
    
    // Route GET - Dashboard par défaut
    const dashboardHTML = generateDashboard(req);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(dashboardHTML);
}

// Script CRO complet
function getCROScript() {
    return `
// 🎯 CRO Intelligence Script
console.log('🚀 CRO Intelligence Script chargé avec succès !');

const config = {
    serverUrl: window.location.origin,
    batchSize: 3,
    debug: true
};

let events = [];
let startTime = Date.now();

function analyzePageContext() {
    return {
        title: document.title,
        url: window.location.href,
        pageType: detectPageType(),
        viewport: { width: window.innerWidth, height: window.innerHeight },
        elementsCount: {
            buttons: document.querySelectorAll('button, input[type="submit"], .btn').length,
            links: document.querySelectorAll('a').length,
            forms: document.querySelectorAll('form').length,
            images: document.querySelectorAll('img').length
        },
        hasCallToAction: !!document.querySelector('button, .btn, .cta, input[type="submit"]'),
        hasTestimonials: !!document.querySelector('.testimonial, .review, .rating'),
        textLength: document.body.textContent.length,
        loadTime: performance.timing ? performance.timing.loadEventEnd - performance.timing.navigationStart : null
    };
}

function detectPageType() {
    const url = window.location.pathname.toLowerCase();
    if (url === '/' || url === '/index' || url === '/home') return 'homepage';
    if (url.includes('product')) return 'product';
    if (url.includes('cart')) return 'cart';
    if (url.includes('checkout')) return 'checkout';
    if (url.includes('contact')) return 'contact';
    if (url.includes('about')) return 'about';
    if (url.includes('pricing')) return 'pricing';
    return 'other';
}

function analyzeBehavior(eventsList) {
    const clicks = eventsList.filter(e => e.type === 'click');
    const scrolls = eventsList.filter(e => e.type === 'scroll');
    return {
        totalClicks: clicks.length,
        totalScrolls: scrolls.length,
        maxScrollPercent: Math.max(0, ...scrolls.map(s => s.scrollPercent || 0)),
        clickedElements: clicks.map(c => c.element?.tag || 'unknown'),
        timeSpent: Date.now() - startTime,
        engagementScore: clicks.length + Math.min(scrolls.length, 5)
    };
}

async function sendEvents(eventsList) {
    try {
        console.log('📤 Envoi de', eventsList.length, 'événements...');
        
        const payload = {
            events: eventsList,
            timestamp: Date.now(),
            url: window.location.href,
            pageContext: analyzePageContext(),
            behaviorAnalysis: analyzeBehavior(eventsList),
            sessionId: 'session_' + startTime
        };
        
        const response = await fetch(config.serverUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Données envoyées !', 'Suggestions:', result.suggestionsCount);
            if (config.debug) console.log('📋 Réponse:', result);
        } else {
            console.log('❌ Erreur envoi:', response.status);
        }
    } catch (error) {
        console.log('❌ Erreur:', error.message);
    }
}

function addEvent(eventData) {
    events.push(eventData);
    console.log('📝 Événement:', eventData.type);
    if (events.length >= config.batchSize) {
        sendEvents([...events]);
        events = [];
    }
}

function trackClick(event) {
    addEvent({
        type: 'click',
        timestamp: Date.now(),
        element: {
            tag: event.target.tagName,
            text: event.target.textContent?.substring(0, 50) || '',
            className: event.target.className,
            id: event.target.id
        },
        position: { x: event.clientX, y: event.clientY }
    });
}

function trackScroll() {
    const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
    addEvent({
        type: 'scroll',
        timestamp: Date.now(),
        scrollPercent: isNaN(scrollPercent) ? 0 : Math.max(0, Math.min(100, scrollPercent))
    });
}

// Event listeners
document.addEventListener('click', trackClick);
let scrollTimeout;
window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(trackScroll, 300);
});

// Envoi initial
window.addEventListener('load', () => {
    setTimeout(() => {
        addEvent({
            type: 'page_load',
            timestamp: Date.now(),
            loadTime: performance.timing ? performance.timing.loadEventEnd - performance.timing.navigationStart : null
        });
        console.log('📊 Page analysée:', analyzePageContext().pageType);
    }, 2000);
});

// Envoi final
window.addEventListener('beforeunload', () => {
    if (events.length > 0) {
        navigator.sendBeacon(config.serverUrl, JSON.stringify({
            events: events,
            timestamp: Date.now(),
            url: window.location.href,
            pageContext: analyzePageContext(),
            behaviorAnalysis: analyzeBehavior(events),
            sessionId: 'session_' + startTime,
            final: true
        }));
    }
});

// Debug
window.croDebug = {
    showEvents: () => console.log('📊 Événements:', events),
    forceSend: () => {
        if (events.length > 0) {
            sendEvents([...events]);
            events = [];
            console.log('🚀 Envoi forcé !');
            return true;
        }
        console.log('📭 Aucun événement');
        return false;
    },
    generateTestEvents: (count = 5) => {
        for (let i = 0; i < count; i++) {
            addEvent({ type: 'test_event', timestamp: Date.now(), testNumber: i + 1 });
        }
        console.log(\`🧪 \${count} événements générés\`);
        return count;
    }
};

console.log('✅ CRO Script prêt !');
console.log('💡 Debug: croDebug.showEvents(), croDebug.forceSend()');
    `;
}

// Générateur de suggestions IA
function generateAISuggestions(data) {
    const suggestions = [];
    const pageContext = data.pageContext || {};
    const behaviorAnalysis = data.behaviorAnalysis || {};
    
    if (!pageContext.hasCallToAction) {
        suggestions.push({
            title: "🎯 Ajouter un call-to-action principal",
            description: "Aucun bouton d'action détecté. Ajoutez un CTA visible.",
            impact: "+15-25% conversion",
            priority: "high",
            code: '<button style="background: #ff6b35; color: white; padding: 15px 30px; border: none; border-radius: 6px;">Action</button>'
        });
    }
    
    if (behaviorAnalysis.maxScrollPercent && behaviorAnalysis.maxScrollPercent < 50) {
        suggestions.push({
            title: "📊 Améliorer l'engagement initial",
            description: \`Utilisateurs ne scrollent qu'à \${behaviorAnalysis.maxScrollPercent}%. Renforcez le haut de page.\`,
            impact: "+20-30% engagement",
            priority: "high",
            code: "Déplacez les éléments importants dans les premiers 600px"
        });
    }
    
    if (behaviorAnalysis.totalClicks && behaviorAnalysis.totalClicks < 2) {
        suggestions.push({
            title: "🔗 Augmenter l'interactivité",
            description: "Peu d'interactions détectées. Ajoutez des éléments cliquables.",
            impact: "+25% engagement",
            priority: "medium",
            code: '<a href="#section" style="color: #ff6b35;">En savoir plus</a>'
        });
    }
    
    if (pageContext.loadTime && pageContext.loadTime > 3000) {
        suggestions.push({
            title: "⚡ Optimiser la vitesse",
            description: \`Page lente (\${Math.round(pageContext.loadTime/1000)}s). Optimisez les performances.\`,
            impact: "+7% conversion par seconde gagnée",
            priority: "high",
            code: "Compressez images, minifiez CSS/JS, utilisez CDN"
        });
    }
    
    return suggestions;
}

// Dashboard HTML
function generateDashboard(req) {
    const latestEvent = allEvents.length > 0 ? allEvents[allEvents.length - 1] : null;
    const totalSuggestions = allEvents.reduce((sum, e) => sum + (e.suggestions?.length || 0), 0);
    const latestSuggestions = latestEvent?.suggestions || [];
    
    return \`
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>🎯 CRO Intelligence Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
                margin: 0; padding: 20px; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                min-height: 100vh; color: #333;
            }
            .container { max-width: 1200px; margin: 0 auto; }
            .card { 
                background: white; padding: 25px; margin: 15px 0; border-radius: 12px; 
                box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            }
            .header { 
                background: linear-gradient(135deg, #ff6b35, #f7931e); color: white; 
                text-align: center;
            }
            .stats { 
                display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                gap: 15px; margin: 20px 0; 
            }
            .stat { 
                text-align: center; padding: 20px; 
                background: linear-gradient(135deg, #e8f4f8, #f1f9ff); 
                border-radius: 10px;
            }
            .stat-number { font-size: 2.5em; font-weight: bold; color: #ff6b35; }
            .stat-label { color: #666; font-size: 14px; margin-top: 5px; }
            .suggestion { 
                border-left: 5px solid #ff6b35; padding: 20px; margin: 15px 0; 
                background: linear-gradient(90deg, #fff8f6, #ffffff); 
                border-radius: 0 8px 8px 0;
            }
            .high { border-left-color: #e74c3c; }
            .medium { border-left-color: #f39c12; }
            .code { 
                background: #2d3748; color: #e2e8f0; padding: 15px; border-radius: 8px; 
                font-family: monospace; font-size: 13px; margin: 10px 0;
            }
            .install-code { 
                background: #f8f9fa; padding: 15px; border-radius: 8px; 
                font-family: monospace; border: 2px dashed #ff6b35; margin: 10px 0;
            }
            .success { color: #27ae60; font-weight: bold; }
            .pulse { animation: pulse 2s infinite; }
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="card header">
                <h1>🎯 CRO Intelligence Dashboard</h1>
                <p>Système d'analyse comportementale et suggestions IA</p>
                <div class="pulse success">✅ Système opérationnel</div>
            </div>
            
            <div class="card">
                <h2>📊 Statistiques Temps Réel</h2>
                <div class="stats">
                    <div class="stat">
                        <div class="stat-number">\${allEvents.length}</div>
                        <div class="stat-label">Sites Analysés</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number">\${totalSuggestions}</div>
                        <div class="stat-label">Suggestions IA</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number">\${allEvents.filter(e => e.behaviorAnalysis?.totalClicks > 0).length}</div>
                        <div class="stat-label">Sessions Actives</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number">\${latestEvent ? new Date(latestEvent.receivedAt).toLocaleDateString() : 'N/A'}</div>
                        <div class="stat-label">Dernière Analyse</div>
                    </div>
                </div>
            </div>
            
            \${latestSuggestions.length > 0 ? \`
            <div class="card">
                <h2>🎯 Dernières Suggestions IA</h2>
                <p><strong>Site :</strong> \${latestEvent.url}</p>
                <p><strong>Type :</strong> \${latestEvent.pageContext?.pageType || 'Unknown'}</p>
                
                \${latestSuggestions.map(s => \`
                    <div class="suggestion \${s.priority}">
                        <h3>\${s.title}</h3>
                        <p><strong>📝 Description :</strong> \${s.description}</p>
                        <p><strong>📈 Impact :</strong> \${s.impact}</p>
                        <p><strong>⚡ Priorité :</strong> \${s.priority}</p>
                        <div class="code">\${s.code}</div>
                    </div>
                \`).join('')}
            </div>
            \` : '<div class="card"><h2>🎯 Suggestions IA</h2><p>Installez le script sur un site pour voir des suggestions !</p></div>'}
            
            <div class="card">
                <h2>🚀 Installation du Script</h2>
                <p>Copiez ce code dans le &lt;head&gt; de votre site :</p>
                <div class="install-code">
&lt;script src="https://\${req.headers.host}/cro-script.js"&gt;&lt;/script&gt;
                </div>
                <p><small>✅ Le script démarre automatiquement l'analyse</small></p>
            </div>
            
            <div class="card">
                <h2>🔧 Liens Utiles</h2>
                <p><a href="/cro-script.js" target="_blank" style="color: #ff6b35;">📜 Voir le script CRO</a></p>
                <p><a href="javascript:location.reload()" style="color: #ff6b35;">🔄 Actualiser dashboard</a></p>
            </div>
        </div>
        
        <script>
            setTimeout(() => location.reload(), 30000);
        </script>
    </body>
    </html>
    \`;
}
