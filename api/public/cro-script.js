// public/cro-script.js - Script CRO Intelligence simplifié
console.log('🚀 CRO Script chargé !');

const config = {
    // ⚠️ CETTE URL SERA AUTOMATIQUEMENT LA BONNE APRÈS DÉPLOIEMENT
    serverUrl: window.location.origin + '/api/events',
    batchSize: 3,
    debug: true
};

let events = [];
let startTime = Date.now();

// Analyser le contexte de la page
function analyzePageContext() {
    return {
        title: document.title,
        url: window.location.href,
        pageType: detectPageType(),
        viewport: {
            width: window.innerWidth,
            height: window.innerHeight
        },
        elementsCount: {
            buttons: document.querySelectorAll('button, input[type="submit"], .btn, [class*="btn"]').length,
            links: document.querySelectorAll('a').length,
            forms: document.querySelectorAll('form').length,
            images: document.querySelectorAll('img').length
        },
        hasCallToAction: !!document.querySelector('button, .btn, .cta, [class*="button"], input[type="submit"]'),
        hasTestimonials: !!document.querySelector('.testimonial, .review, .rating, [class*="testimonial"]'),
        textLength: document.body.textContent.length,
        loadTime: performance.timing ? performance.timing.loadEventEnd - performance.timing.navigationStart : null
    };
}

// Détecter le type de page
function detectPageType() {
    const url = window.location.pathname.toLowerCase();
    
    if (url === '/' || url === '/index' || url === '/home') return 'homepage';
    if (url.includes('product') || url.includes('/p/')) return 'product';
    if (url.includes('cart') || url.includes('panier')) return 'cart';
    if (url.includes('checkout') || url.includes('commande')) return 'checkout';
    if (url.includes('contact')) return 'contact';
    if (url.includes('about')) return 'about';
    if (url.includes('pricing') || url.includes('price')) return 'pricing';
    
    return 'other';
}

// Analyser le comportement utilisateur
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

// Envoyer les données au serveur
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
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Données envoyées avec succès !');
            console.log('🎯 Suggestions générées:', result.suggestionsCount);
            if (config.debug) console.log('📋 Réponse:', result);
        } else {
            console.log('❌ Erreur envoi:', response.status);
        }
        
    } catch (error) {
        console.log('❌ Erreur réseau:', error.message);
    }
}

// Ajouter un événement
function addEvent(eventData) {
    events.push(eventData);
    console.log('📝 Événement ajouté:', eventData.type);
    
    if (events.length >= config.batchSize) {
        sendEvents([...events]);
        events = [];
    }
}

// Tracker les clics
function trackClick(event) {
    const target = event.target;
    const data = {
        type: 'click',
        timestamp: Date.now(),
        element: {
            tag: target.tagName,
            text: target.textContent?.substring(0, 50) || '',
            className: target.className,
            id: target.id
        },
        position: {
            x: event.clientX,
            y: event.clientY
        }
    };
    
    addEvent(data);
}

// Tracker le scroll
function trackScroll() {
    const scrollPercent = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
    );
    
    const data = {
        type: 'scroll',
        timestamp: Date.now(),
        scrollPercent: isNaN(scrollPercent) ? 0 : Math.max(0, Math.min(100, scrollPercent))
    };
    
    addEvent(data);
}

// Event listeners
document.addEventListener('click', trackClick);

let scrollTimeout;
window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(trackScroll, 300);
});

// Envoi initial après chargement
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

// Envoi final avant fermeture
window.addEventListener('beforeunload', () => {
    if (events.length > 0) {
        // Envoi synchrone pour s'assurer que ça part
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

// Fonctions de debug
window.croDebug = {
    showEvents: () => {
        console.log('📊 Événements collectés:', events);
        console.log('📈 Analyse:', analyzeBehavior(events));
    },
    
    showPageData: () => {
        console.log('📄 Contexte page:', analyzePageContext());
    },
    
    forceSend: () => {
        if (events.length > 0) {
            sendEvents([...events]);
            events = [];
            console.log('🚀 Envoi forcé terminé !');
        } else {
            console.log('📭 Aucun événement à envoyer');
        }
    },
    
    generateTestEvents: (count = 5) => {
        for (let i = 0; i < count; i++) {
            addEvent({
                type: 'test_event',
                timestamp: Date.now(),
                testNumber: i + 1
            });
        }
        console.log(`🧪 ${count} événements de test générés`);
    }
};

console.log('✅ CRO Script prêt !');
console.log('💡 Debug: croDebug.showEvents(), croDebug.forceSend(), croDebug.generateTestEvents()');
console.log('📊 Dashboard:', config.serverUrl.replace('/api/events', ''));
