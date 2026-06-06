import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Supabase environment variables are missing.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log('Starting Supabase database seeding...');

    // 1. Seed Profile
    console.log('Seeding profiles...');
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
            id: '1',
            name: 'Muhammad Umer',
            headline: 'Full-Stack Developer | Next.js & Node.js Expert',
            base_rate: 45,
            bio: 'I build modern, high-performance web applications using React, Next.js, Node.js, and PostgreSQL. I specialize in database migrations, API integrations, and checkout speed optimization. I write clean, tested code and focus on business ROI.',
            tone: 'Conversational',
            updated_at: new Date().toISOString()
        });

    if (profileError) {
        console.error('Error seeding profile:', profileError);
    } else {
        console.log('Profile seeded successfully.');
    }

    // 2. Clear & Seed Portfolios
    console.log('Clearing old portfolios...');
    await supabase.from('portfolio_items').delete().neq('title', 'EMPTY_FILTER_VALUE');
    
    console.log('Inserting new portfolio_items...');
    const portfolioItems = [
        {
            title: 'Next.js SaaS Landing Page',
            description: 'A responsive, light-themed SaaS landing page with Stripe subscription billing integration.',
            technologies: ['React', 'Next.js', 'Stripe', 'CSS', 'Tailwind'],
            link: 'https://github.com/example/saas-page',
            metrics: 'Boosted conversion rates by 22% in 30 days.'
        },
        {
            title: 'Node.js Express REST API',
            description: 'Secure backend API with JWT authentication, rate limiting, and PostgreSQL integration.',
            technologies: ['Node.js', 'Express', 'PostgreSQL', 'Docker', 'API'],
            link: 'https://github.com/example/node-api',
            metrics: 'Reduced server response times by 35% under load.'
        },
        {
            title: 'Python WooCommerce Scraper',
            description: 'Scrapes e-commerce sites to automate bulk product imports to WooCommerce stores.',
            technologies: ['Python', 'BeautifulSoup', 'WooCommerce', 'API'],
            link: 'https://github.com/example/scraper',
            metrics: 'Saved clients 15+ hours of manual data entry weekly.'
        }
    ];

    const { error: portError } = await supabase.from('portfolio_items').insert(portfolioItems);
    if (portError) {
        console.error('Error inserting portfolios:', portError);
    } else {
        console.log('Portfolio items inserted successfully.');
    }

    // 3. Clear & Seed Case Studies
    console.log('Clearing old case studies...');
    await supabase.from('case_studies').delete().neq('title', 'EMPTY_FILTER_VALUE');

    console.log('Inserting new case_studies...');
    const caseStudies = [
        {
            title: 'Database Migration to PostgreSQL',
            problem: 'Client had a slow legacy MySQL database causing 4-second checkout delays and transactional errors during traffic spikes.',
            solution: 'Migrated database schema to PostgreSQL, optimized index structures, and set up pg_dump pipelines on staging.',
            result: 'Zero data loss, checkout latency reduced from 4s to 400ms, and zero transactional crashes.',
            technologies: ['PostgreSQL', 'SQL', 'Database Migration']
        },
        {
            title: 'Shopify Custom Checkout Automation',
            problem: 'Manual export/import of cart abandonment data to CRM was wasting hours and losing immediate recovery opportunities.',
            solution: 'Developed a custom integration utilizing Shopify webhook APIs to trigger automated recovery flows on Mailchimp.',
            result: 'Saved 10+ administrative hours/week and recovered $12k in abandoned carts within 45 days.',
            technologies: ['Shopify', 'API', 'Automation', 'Mailchimp']
        }
    ];

    const { error: caseError } = await supabase.from('case_studies').insert(caseStudies);
    if (caseError) {
        console.error('Error inserting case studies:', caseError);
    } else {
        console.log('Case studies inserted successfully.');
    }

    // 4. Clear & Seed Few-Shot Proposals
    console.log('Clearing old few-shot proposals...');
    await supabase.from('few_shot_proposals').delete().neq('platform', 'EMPTY_FILTER_VALUE');

    console.log('Inserting new few_shot_proposals...');
    const fewShots = [
        {
            platform: 'Upwork',
            niche: 'Web Development',
            job_description: 'Need a developer to fix WordPress slow loading and checkout page issues.',
            proposal: 'Hi there, I saw your post regarding WordPress slow checkout issues. Legacies in your WP checkout plugins often cause database write blocks during sessions. I have fixed this exact latency bug on 4 WordPress sites by optimizing the query pool and enabling Redis caching. I can patch yours in under 2 hours. Would you prefer a quick 10-minute discovery call, or should I send over a quick 2-page implementation checklist?',
            status: 'Won'
        }
    ];

    const { error: fewError } = await supabase.from('few_shot_proposals').insert(fewShots);
    if (fewError) {
        console.error('Error inserting few-shot proposals:', fewError);
    } else {
        console.log('Few-shot proposals inserted successfully.');
    }

    console.log('Database seeding complete!');
}

seed().catch(err => {
    console.error('Seeding crashed:', err);
});
