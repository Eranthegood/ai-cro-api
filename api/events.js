// api/events.js - Serveur CRO Intelligence simplifié pour débuter
let allEvents = [];

export default async function handler(req, res) {
    // Headers CORS pour éviter les erreurs
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Répondre aux requêtes OPTIONS
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    // Recevoir les données du script
    if (req.method === 'POST') {
        try {
            const data = req.body;
            
            // Ajouter des infos
            data.receivedAt = new Date().toISOString();
            data.id = Date.now();
            
            console.log('📥 Données reçues de:', data.url);
            
            // Générer suggestions simples
            const suggestions = generateSimpleSuggestions(data);
            data.suggestions = suggestions;
            
            // Stocker
            allEvents.push(data);
            
            console.log('✅ Traité avec', suggestions.length, 'suggestions');
            
            res.status(200).json({
                success: true,
                message: 'Données reçues !',
                suggestionsCount: suggestions.length,
                totalStored: allEvents.length
            });
            
        } catch (error) {
            console.error('❌ Erreur:', error);
            res.status(400).json({ error: 'Erreur traitement' });
        }
    }
    
    // Dashboard simple
    else if (req.method === 'GET') {
        const dashboardHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>🎯 CRO Intelligence Dashboard</title>
            <style>
                body { font-family: Arial; padding: 20px; background: #f5f5f5; }
                .card { background: white; padding: 20px; margin: 10px 0; border-radius: 8px; }
                .success { color: green; font-weight: bold; }
                .stat { display: inline-block; margin: 10px; padding: 15px; background: #e8f4f8; border-radius: 5px; }
                .suggestion { border-left: 4px solid #ff6b35; padding: 10px; margin: 10px 0; background: #fff8f6; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>🎯 CRO Intelligence Dashboard</h1>
                <p class="success">✅ Serveur en ligne et fonctionnel !</p>
                
                <div class="stat">
                    <strong>${allEvents.length}</strong><br>
                    Sites analysés
                </div>
                
                <div class="stat">
                    <strong>${allEvents.reduce((sum, e) => sum + (e.suggestions?.length || 0), 0)}</strong><br>
                    Suggestions générées
                </div>
                
                <div class="stat">
                    <strong>${allEvents.length > 0 ? new Date(allEvents[allEvents.length - 1].receivedAt).toLocaleString() : 'Aucune'}</strong><br>
                    Dernière analyse
                </div>
            </div>
            
            ${allEvents.length > 0 ? `
            <div class="card">
                <h2>🎯 Dernières Suggestions</h2>
                ${allEvents[allEvents.length - 1].suggestions?.map(s => `
                    <div class="suggestion">
                        <strong>${s.title}</strong><br>
                        ${s.description}<br>
                        <em>Impact: ${s.impact}</em>
                    </div>
                `).join('') || 'Aucune suggestion'}
            </div>
            ` : ''}
            
            <div class="card">
                <h2>🚀 Installation du Script</h2>
                <p>Copiez ce code dans votre site :</p>
                <code style="background: #f0f0f0; padding: 10px; display: block;">
                &lt;script src="${req.headers.host}/cro-script.js"&gt;&lt;/script&gt;
                </code>
            </div>
            
            <div class="card">
                <h2>📊 Données Brutes</h2>
                <details>
                    <summary>Voir toutes les données (${allEvents.length} événements)</summary>
                    <pre style="background: #f8f8f8; padding: 10px; overflow: auto; max-height: 300px;">
${JSON.stringify(allEvents, null, 2)}
                    </pre>
                </details>
            </div>
            
            <script>
                // Auto-refresh toutes les 30 secondes
                setTimeout(() => location.reload(), 30000);
            </script>
        </body>
        </html>
        `;
        
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(dashboardHTML);
    }
}

// Fonction simple de suggestions
function generateSimpleSuggestions(data) {
    const suggestions = [];
    const pageContext = data.pageContext || {};
    const behaviorAnalysis = data.behaviorAnalysis || {};
    
    // Suggestion 1: CTA manquant
    if (!pageContext.hasCallToAction) {
        suggestions.push({
            title: "Ajouter un call-to-action principal",
            description: "Aucun bouton d'action détecté. Ajoutez un CTA visible pour améliorer la conversion.",
            impact: "+15-25% conversion",
            priority: "high"
        });
    }
    
    // Suggestion 2: Scroll faible
    if (behaviorAnalysis.maxScrollPercent && behaviorAnalysis.maxScrollPercent < 50) {
        suggestions.push({
            title: "Améliorer l'engagement initial",
            description: `Les utilisateurs ne scrollent qu'à ${behaviorAnalysis.maxScrollPercent}%. Renforcez le contenu au-dessus de la ligne de flottaison.`,
            impact: "+20-30% engagement",
            priority: "medium"
        });
    }
    
    // Suggestion 3: Peu d'interactions
    if (behaviorAnalysis.totalClicks && behaviorAnalysis.totalClicks < 2) {
        suggestions.push({
            title: "Augmenter l'interactivité",
            description: "Peu d'interactions détectées. Ajoutez des éléments cliquables et des liens internes.",
            impact: "+25% engagement",
            priority: "medium"
        });
    }
    
    // Suggestion 4: Performance
    if (pageContext.loadTime && pageContext.loadTime > 3000) {
        suggestions.push({
            title: "Optimiser la vitesse de chargement",
            description: `Page lente (${Math.round(pageContext.loadTime/1000)}s). Optimisez images et scripts.`,
            impact: "+7% conversion par seconde gagnée",
            priority: "high"
        });
    }
    
    // Suggestion 5: Témoignages manquants
    if (pageContext.pageType === 'homepage' && !pageContext.hasTestimonials) {
        suggestions.push({
            title: "Ajouter des preuves sociales",
            description: "Page d'accueil sans témoignages. La preuve sociale renforce la confiance.",
            impact: "+10-20% conversion",
            priority: "medium"
        });
    }
    
    return suggestions;
}
