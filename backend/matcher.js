import { supabase } from './supabaseClient.js';

/**
 * Synonym map for fuzzy technology matching.
 * Maps normalized names to their aliases and related technologies.
 */
const SYNONYM_MAP = {
    // JavaScript ecosystem
    'react': ['reactjs', 'react.js', 'react js'],
    'next.js': ['nextjs', 'next js', 'next'],
    'vue': ['vuejs', 'vue.js', 'vue js'],
    'nuxt': ['nuxtjs', 'nuxt.js'],
    'angular': ['angularjs', 'angular.js'],
    'node.js': ['nodejs', 'node js', 'node'],
    'express': ['expressjs', 'express.js'],
    'typescript': ['ts'],
    'javascript': ['js', 'ecmascript', 'es6', 'es2015'],

    // Python ecosystem
    'python': ['python3', 'py'],
    'django': ['django rest framework', 'drf'],
    'flask': ['flask api'],
    'fastapi': ['fast api'],
    'scrapy': ['scrapy framework'],
    'playwright': ['playwright python', 'playwright js'],
    'selenium': ['selenium webdriver'],
    'beautifulsoup': ['bs4', 'beautiful soup'],

    // Databases
    'postgresql': ['postgres', 'pg', 'psql'],
    'mysql': ['mariadb'],
    'mongodb': ['mongo', 'mongoose'],
    'redis': ['redis cache'],
    'supabase': ['supabase db'],
    'firebase': ['firestore', 'firebase db'],

    // Cloud & DevOps
    'aws': ['amazon web services', 'ec2', 's3', 'lambda'],
    'gcp': ['google cloud', 'google cloud platform'],
    'azure': ['microsoft azure'],
    'docker': ['containerization', 'dockerfile'],
    'kubernetes': ['k8s'],
    'vercel': ['vercel hosting'],
    'netlify': ['netlify hosting'],

    // Mobile
    'react native': ['react-native', 'rn'],
    'flutter': ['dart flutter'],
    'swift': ['swiftui', 'ios development'],
    'kotlin': ['android development'],

    // E-commerce
    'shopify': ['shopify api', 'shopify liquid'],
    'woocommerce': ['woo commerce', 'woo'],
    'stripe': ['stripe api', 'stripe payments'],

    // AI/ML
    'openai': ['chatgpt', 'gpt', 'gpt-4', 'gpt-3.5'],
    'langchain': ['lang chain'],
    'tensorflow': ['tf'],
    'pytorch': ['torch'],

    // Web scraping
    'web scraping': ['scraping', 'data scraping', 'web crawler', 'crawler'],
    'cloudflare bypass': ['cloudflare', 'cf bypass', 'anti-bot bypass'],
    'proxy': ['rotating proxies', 'residential proxies', 'proxy rotation'],

    // CMS
    'wordpress': ['wp', 'wordpress cms'],
    'webflow': ['webflow cms'],

    // APIs
    'rest api': ['restful', 'rest', 'api development'],
    'graphql': ['gql', 'apollo graphql'],
};

/**
 * Category inference map — if a skill is present, these related skills are implied.
 */
const CATEGORY_INFERENCE = {
    'next.js': ['react', 'ssr', 'javascript', 'node.js'],
    'nuxt': ['vue', 'ssr', 'javascript', 'node.js'],
    'react native': ['react', 'javascript', 'mobile'],
    'supabase': ['postgresql', 'rest api', 'realtime'],
    'django': ['python', 'rest api'],
    'fastapi': ['python', 'rest api'],
    'flask': ['python', 'rest api'],
    'express': ['node.js', 'javascript', 'rest api'],
    'shopify': ['e-commerce', 'liquid', 'javascript'],
    'woocommerce': ['wordpress', 'php', 'e-commerce'],
    'scrapy': ['python', 'web scraping'],
    'playwright': ['web scraping', 'browser automation', 'javascript'],
    'selenium': ['web scraping', 'browser automation'],
    'langchain': ['python', 'openai', 'ai'],
    'flutter': ['dart', 'mobile'],
};

/**
 * Normalizes a skill string for comparison
 * @param {string} skill
 * @returns {string}
 */
function normalize(skill) {
    return skill.toLowerCase().trim().replace(/[^a-z0-9.\s]/g, '');
}

/**
 * Expands a skill list with synonyms and category inferences
 * @param {string[]} skills
 * @returns {Set<string>}
 */
function expandSkills(skills) {
    const expanded = new Set();

    for (const skill of skills) {
        const norm = normalize(skill);
        expanded.add(norm);

        // Add synonyms
        for (const [canonical, aliases] of Object.entries(SYNONYM_MAP)) {
            if (norm === normalize(canonical) || aliases.some(a => normalize(a) === norm)) {
                expanded.add(normalize(canonical));
                aliases.forEach(a => expanded.add(normalize(a)));
            }
        }

        // Add category inferences
        for (const [trigger, implied] of Object.entries(CATEGORY_INFERENCE)) {
            if (norm === normalize(trigger)) {
                implied.forEach(i => expanded.add(normalize(i)));
            }
        }
    }

    return expanded;
}

/**
 * Searches the Supabase database and finds the most relevant portfolio items & case studies
 * using fuzzy synonym matching and description text search.
 * @param {string[]} requiredSkills - List of skills parsed from the job description
 * @returns {Promise<object>} Top matching portfolios and case studies with relevance scores
 */
export async function matchEvidence(requiredSkills) {
    if (!requiredSkills || requiredSkills.length === 0) {
        // Fallback: Return latest items if no skills parsed
        const { data: portfolios } = await supabase.from('portfolio_items').select('*').limit(3);
        const { data: cases } = await supabase.from('case_studies').select('*').limit(2);
        return { matchedPortfolios: portfolios || [], matchedCaseStudies: cases || [] };
    }

    try {
        console.log('[Enhanced Matcher] Starting fuzzy match...');
        const startTime = Date.now();

        // Expand the required skills with synonyms and inferences
        const expandedRequired = expandSkills(requiredSkills);
        console.log(`[Enhanced Matcher] Expanded ${requiredSkills.length} skills → ${expandedRequired.size} search terms`);

        // Fetch all portfolio items and case studies
        const { data: portfolios, error: portError } = await supabase
            .from('portfolio_items')
            .select('*');

        const { data: cases, error: caseError } = await supabase
            .from('case_studies')
            .select('*');

        if (portError) console.error('Error fetching portfolios:', portError);
        if (caseError) console.error('Error fetching case studies:', caseError);

        // Score portfolio items with enhanced matching
        const scoredPortfolios = (portfolios || []).map(item => {
            let score = 0;
            const itemSkillsExpanded = expandSkills(item.technologies || []);

            // 1. Technology overlap (weighted 3x)
            const techOverlap = [...itemSkillsExpanded].filter(s => expandedRequired.has(s));
            score += techOverlap.length * 3;

            // 2. Description text search (weighted 1x per keyword hit)
            const descLower = (item.description || '').toLowerCase();
            for (const term of expandedRequired) {
                if (descLower.includes(term)) {
                    score += 1;
                }
            }

            // 3. Title match bonus (weighted 2x)
            const titleLower = (item.title || '').toLowerCase();
            for (const term of expandedRequired) {
                if (titleLower.includes(term)) {
                    score += 2;
                }
            }

            // 4. Metrics presence bonus — items with quantified results are more valuable
            if (item.metrics && item.metrics.length > 10) {
                score += 1;
            }

            return { ...item, score, matchedTerms: techOverlap };
        }).sort((a, b) => b.score - a.score);

        // Score case studies with enhanced matching
        const scoredCases = (cases || []).map(item => {
            let score = 0;
            const itemSkillsExpanded = expandSkills(item.technologies || []);

            // Technology overlap
            const techOverlap = [...itemSkillsExpanded].filter(s => expandedRequired.has(s));
            score += techOverlap.length * 3;

            // Problem/solution text search
            const textToSearch = `${item.problem || ''} ${item.solution || ''} ${item.result || ''}`.toLowerCase();
            for (const term of expandedRequired) {
                if (textToSearch.includes(term)) {
                    score += 1;
                }
            }

            // Title match bonus
            const titleLower = (item.title || '').toLowerCase();
            for (const term of expandedRequired) {
                if (titleLower.includes(term)) {
                    score += 2;
                }
            }

            // Result with metrics bonus
            if (item.result && /\d/.test(item.result)) {
                score += 1;
            }

            return { ...item, score, matchedTerms: techOverlap };
        }).sort((a, b) => b.score - a.score);

        console.log(`[Enhanced Matcher] Completed in ${Date.now() - startTime}ms`);
        console.log(`[Enhanced Matcher] Top portfolio: "${scoredPortfolios[0]?.title}" (score: ${scoredPortfolios[0]?.score})`);

        // Return top 3 portfolios and top 2 case studies
        return {
            matchedPortfolios: scoredPortfolios.slice(0, 3),
            matchedCaseStudies: scoredCases.slice(0, 2)
        };
    } catch (error) {
        console.error('[Enhanced Matcher] Error:', error);
        return { matchedPortfolios: [], matchedCaseStudies: [] };
    }
}
