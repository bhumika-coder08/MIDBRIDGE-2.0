import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { query } from './db.js';
import { runMigrations } from './migrate.js';
export async function seedDatabase() {
    console.log('Seeding MidBridge 2.0 database...');
    await runMigrations();
    const passwordHash = await bcrypt.hash('Password123!', 10);
    // 1. Seed Demo Users for all roles
    const users = [
        { id: 'usr-demo-001', email: 'user@midbridge.io', role: 'USER', name: 'Aarav Patel', nat: 'India', cur: 'India', dest: 'Germany', purp: 'Study' },
        { id: 'usr-admin-001', email: 'admin@midbridge.io', role: 'ADMIN', name: 'Elena Rostova', nat: 'Germany', cur: 'Germany', dest: 'United States', purp: 'Work' },
        { id: 'usr-auth-001', email: 'authority@midbridge.io', role: 'AUTHORITY', name: 'Federal Consular & Verification Office', nat: 'Germany', cur: 'Germany', dest: 'Germany', purp: 'Immigration' },
        { id: 'usr-univ-001', email: 'university@midbridge.io', role: 'UNIVERSITY', name: 'TUM International Admissions Directorate', nat: 'Germany', cur: 'Germany', dest: 'Germany', purp: 'Study' },
        { id: 'usr-verif-001', email: 'verifier@midbridge.io', role: 'VERIFIER', name: 'MidBridge 2.0 Identity Verification Hub', nat: 'United Kingdom', cur: 'United Kingdom', dest: 'United Kingdom', purp: 'Immigration' },
    ];
    await Promise.all(users.map(async (u) => {
        await query(`INSERT INTO users (id, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET email = $2, password_hash = $3, role = $4`, [u.id, u.email, passwordHash, u.role]);
        await query(`INSERT INTO profiles (id, user_id, full_name, nationality, current_country, destination_country, purpose, education_level, intended_course, institution, travel_date, preferred_language)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (user_id) DO UPDATE SET full_name = $3, nationality = $4, current_country = $5, destination_country = $6, purpose = $7`, [
            uuidv4(),
            u.id,
            u.name,
            u.nat,
            u.cur,
            u.dest,
            u.purp,
            'Master of Science',
            'Data Science & Informatics',
            'Technical University of Munich (TUM)',
            '2026-10-01',
            'en'
        ]);
    }));
    // 2. Seed 20 Supported Countries
    const countries = [
        { code: 'DE', name: 'Germany', region: 'Europe', flag: '🇩🇪', img: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1200&q=80', purposes: ['Study', 'Work', 'Research', 'Immigration'], summary: 'Premier European hub for engineering, tuition-free public universities, and the Opportunity Card (Chancenkarte) for skilled specialists.', weeks: 6, curr: 'EUR (€)', lang: 'German' },
        { code: 'US', name: 'United States', region: 'North America', flag: '🇺🇸', img: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1200&q=80', purposes: ['Study', 'Work', 'Research', 'Exchange'], summary: 'Global leader in higher education and technological research. Home to Ivy League institutions, Silicon Valley industry networks, and OPT programs.', weeks: 8, curr: 'USD ($)', lang: 'English' },
        { code: 'GB', name: 'United Kingdom', region: 'Europe', flag: '🇬🇧', img: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80', purposes: ['Study', 'Work', 'Research', 'Immigration'], summary: 'Historic universities, world-renowned research output, and a 2-year post-study Graduate Route work visa for international graduates.', weeks: 4, curr: 'GBP (£)', lang: 'English' },
        { code: 'CA', name: 'Canada', region: 'North America', flag: '🇨🇦', img: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?auto=format&fit=crop&w=1200&q=80', purposes: ['Study', 'Work', 'Immigration', 'Family relocation'], summary: 'Progressive immigration policy featuring the Express Entry system, Provincial Nominee Programs (PNP), and Post-Graduation Work Permit (PGWP).', weeks: 7, curr: 'CAD ($)', lang: 'English / French' },
        { code: 'AU', name: 'Australia', region: 'Oceania', flag: '🇦🇺', img: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1200&q=80', purposes: ['Study', 'Work', 'Research', 'Travel'], summary: 'Group of Eight top-tier universities, high quality of living, dynamic post-study work rights, and skilled migration pathways.', weeks: 6, curr: 'AUD ($)', lang: 'English' },
        { code: 'FR', name: 'France', region: 'Europe', flag: '🇫🇷', img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80', purposes: ['Study', 'Work', 'Research', 'Exchange'], summary: 'Rich academic heritage, affordable public Grandes Écoles and universities, and the Talent Passport scheme for researchers and tech innovators.', weeks: 5, curr: 'EUR (€)', lang: 'French' },
        { code: 'JP', name: 'Japan', region: 'Asia', flag: '🇯🇵', img: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80', purposes: ['Study', 'Work', 'Research'], summary: 'Technological powerhouse with premier national universities, MEXT government scholarships, and fast-track points-based visas for highly skilled professionals.', weeks: 5, curr: 'JPY (¥)', lang: 'Japanese' },
        { code: 'SG', name: 'Singapore', region: 'Asia', flag: '🇸🇬', img: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80', purposes: ['Study', 'Work', 'Research'], summary: 'Asia\'s foremost financial and tech nexus. Home to NUS and NTU, offering Employment Passes and ONE Pass for global leadership talent.', weeks: 3, curr: 'SGD ($)', lang: 'English / Mandarin / Malay' },
        { code: 'CH', name: 'Switzerland', region: 'Europe', flag: '🇨🇭', img: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=80', purposes: ['Study', 'Work', 'Research'], summary: 'Global leader in scientific research and precision innovation (ETH Zurich, EPFL), offering competitive PhD salaries and exceptional quality of life.', weeks: 8, curr: 'CHF (Fr)', lang: 'German / French / Italian' },
        { code: 'NL', name: 'Netherlands', region: 'Europe', flag: '🇳🇱', img: 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=1200&q=80', purposes: ['Study', 'Work', 'Research'], summary: 'High concentration of English-taught degree programs, the Orientation Year (Zoekjaar) work permit for graduates, and the 30% tax ruling for expats.', weeks: 4, curr: 'EUR (€)', lang: 'Dutch / English' },
        { code: 'IE', name: 'Ireland', region: 'Europe', flag: '🇮🇪', img: 'https://images.unsplash.com/photo-1590089415225-401ed6f9db8e?auto=format&fit=crop&w=1200&q=80', purposes: ['Study', 'Work', 'Research'], summary: 'European headquarters for global technology giants (Google, Meta, Apple), featuring English-medium education and the Third Level Graduate Scheme.', weeks: 6, curr: 'EUR (€)', lang: 'English / Irish' },
        { code: 'KR', name: 'South Korea', region: 'Asia', flag: '🇰🇷', img: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=1200&q=80', purposes: ['Study', 'Work', 'Research'], summary: 'Dynamic tech and cultural hub with prestigious SKY universities, Global Korea Scholarship (GKS), and expanding international graduate visas.', weeks: 4, curr: 'KRW (₩)', lang: 'Korean' },
        { code: 'NZ', name: 'New Zealand', region: 'Oceania', flag: '🇳🇿', img: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80', purposes: ['Study', 'Work', 'Immigration', 'Travel'], summary: 'Unmatched lifestyle balance, world-class environmental research, post-study work visas, and the Green List straight-to-residence pathway.', weeks: 6, curr: 'NZD ($)', lang: 'English' },
        { code: 'SE', name: 'Sweden', region: 'Europe', flag: '🇸🇪', img: 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=1200&q=80', purposes: ['Study', 'Work', 'Research'], summary: 'Pioneering sustainability and tech entrepreneurship, home of the Nobel Prize institutions, with generous PhD employment conditions.', weeks: 7, curr: 'SEK (kr)', lang: 'Swedish / English' },
        { code: 'FI', name: 'Finland', region: 'Europe', flag: '🇫🇮', img: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1200&q=80', purposes: ['Study', 'Work', 'Research'], summary: 'World\'s happiest country with renowned pedagogical standards, free postgraduate research, and a 2-year post-graduation job-seeker permit.', weeks: 5, curr: 'EUR (€)', lang: 'Finnish / Swedish' },
        { code: 'IT', name: 'Italy', region: 'Europe', flag: '🇮🇹', img: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80', purposes: ['Study', 'Work', 'Research', 'Exchange'], summary: 'Historic academic institutions (Bologna, Polimi), government regional DSU scholarships covering tuition and board, and rich cultural immersion.', weeks: 6, curr: 'EUR (€)', lang: 'Italian' },
        { code: 'ES', name: 'Spain', region: 'Europe', flag: '🇪🇸', img: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=1200&q=80', purposes: ['Study', 'Work', 'Travel', 'Exchange'], summary: 'Top-ranked European business schools (IE, IESE, ESADE), expanding Digital Nomad Visas, and favorable naturalization pathways for Ibero-American citizens.', weeks: 5, curr: 'EUR (€)', lang: 'Spanish' },
        { code: 'AE', name: 'United Arab Emirates', region: 'Middle East', flag: '🇦🇪', img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80', purposes: ['Work', 'Study', 'Immigration'], summary: 'Tax-free international business capital featuring the 10-year Golden Visa for exceptional students, researchers, investors, and specialized talents.', weeks: 2, curr: 'AED (د.إ)', lang: 'Arabic / English' },
        { code: 'CN', name: 'China', region: 'Asia', flag: '🇨🇳', img: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=1200&q=80', purposes: ['Study', 'Work', 'Research'], summary: 'Rising global research powerhouse, home to C9 League universities (Tsinghua, Peking), and Chinese Government Scholarships (CSC).', weeks: 4, curr: 'CNY (¥)', lang: 'Mandarin' },
        { code: 'IN', name: 'India', region: 'Asia', flag: '🇮🇳', img: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80', purposes: ['Study', 'Research', 'Exchange', 'Travel'], summary: 'World\'s fastest-growing major economy, premier technical institutes (IITs, IIMs), vibrant startup ecosystem, and Study in India programs.', weeks: 3, curr: 'INR (₹)', lang: 'Hindi / English' },
    ];
    await Promise.all(countries.map(async (c) => {
        await query(`INSERT INTO countries (code, name, region, flag_emoji, cover_image, popular_purposes, summary, processing_time_weeks, currency, language)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (code) DO UPDATE SET name = $2, region = $3, flag_emoji = $4, cover_image = $5, popular_purposes = $6, summary = $7, processing_time_weeks = $8, currency = $9, language = $10`, [c.code, c.name, c.region, c.flag, c.img, JSON.stringify(c.purposes), c.summary, c.weeks, c.curr, c.lang]);
        // Seed structured content for each country
        const contentSections = [
            {
                cat: 'overview',
                title: `Immigration & Education Ecosystem: ${c.name}`,
                content: `${c.name} offers structured cross-border pathways for international students, skilled workers, and researchers. Consular processing enforces biometric identity verification, certified academic documentation, and validated financial solvency proofs.`,
                org: `${c.name} Ministry of Foreign Affairs & Immigration`,
                url: `https://www.official-migration.${c.code.toLowerCase()}.gov`,
            },
            {
                cat: 'study',
                title: 'Higher Education Admission & Degree Recognition',
                content: `Admission to accredited institutions in ${c.name} requires certified secondary and tertiary transcripts, credential evaluations (such as Anabin, WES, or UK ENIC), standardized language proficiency certificates, and authenticated letters of acceptance.`,
                org: 'National Academic Recognition Directorate',
                url: `https://academic-mobility.${c.code.toLowerCase()}.edu`,
            },
            {
                cat: 'visa',
                title: 'National Visa & Residence Permit Regulations',
                content: `Applicants must complete the national consular visa application, attend an in-person biometric appointment, submit biometric photographs conforming to ICAO standards, and satisfy strict financial minimums for the duration of their stay.`,
                org: 'Federal Consular Service',
                url: `https://visa.${c.code.toLowerCase()}.gov`,
            },
            {
                cat: 'financial',
                title: 'Solvency & Blocked Account Requirements',
                content: `Proof of sufficient financial means must be demonstrated prior to visa issuance. Acceptable forms include regulated blocked accounts, government scholarship award letters, bank statements covering 6 months, or official institutional declarations of commitment.`,
                org: 'Federal Ministry of Finance',
                url: `https://solvency.${c.code.toLowerCase()}.gov`,
            },
            {
                cat: 'health',
                title: 'Statutory Health Insurance & Medical Clearances',
                content: `Comprehensive health insurance coverage compliant with local statutory minimums is mandatory from the first day of arrival. Depending on origin country, chest X-rays (tuberculosis screening) or medical fitness certificates may be required.`,
                org: 'National Public Health Authority',
                url: `https://health.${c.code.toLowerCase()}.gov`,
            },
            {
                cat: 'arrival',
                title: 'Resident Registration & Post-Arrival Protocols',
                content: `Within 14 days of landing, foreign nationals must complete municipal registration (Einwohnermeldeamt / Council Registration), obtain a local tax identification number, register for local banking, and book an appointment with the local foreigners authority for biometrics.`,
                org: 'Department of Municipal Affairs',
                url: `https://arrival.${c.code.toLowerCase()}.gov`,
            },
            {
                cat: 'emergency',
                title: 'Emergency Contacts & Consular Assistance',
                content: `Emergency Services: Police 112 / 911 / 999. In the event of document loss, contact the nearest consular diplomatic mission immediately. MidBridge 2.0 provides time-limited Emergency Profile tokens to share vital health and identity details safely.`,
                org: 'Consular Assistance Bureau',
                url: `https://emergency.${c.code.toLowerCase()}.gov`,
            }
        ];
        await Promise.all(contentSections.map(async (sec) => {
            const secId = `cnt-${c.code.toLowerCase()}-${sec.cat}`;
            await query(`INSERT INTO country_content (id, country_code, category, title, content, source_organization, source_url, last_checked)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET title = $4, content = $5, source_organization = $6, source_url = $7, last_checked = $8`, [secId, c.code, sec.cat, sec.title, sec.content, sec.org, sec.url, '2026-03-01']);
        }));
    }));
    // 3. Seed Scholarships with real source metadata
    const scholarships = [
        { id: 'sch-daad-epos', name: 'DAAD EPOS Postgraduate Scholarship', code: 'DE', prov: 'German Academic Exchange Service (DAAD)', lvl: 'Master / PhD', nat: '*', field: 'Development, Engineering, Public Health, Economics', fund: 'Full Tuition + Stipend', dl: '2026-10-31', desc: 'Fully funded scholarship covering €934 monthly stipend, comprehensive health insurance, travel allowances, and German language training.', src: 'https://www2.daad.de/deutschland/stipendien/datenbank/en/21148-scholarship-database/?status=3&origin=190&subjectGrps=&daad=&q=&page=1&detail=50076777', check: '2026-02-15' },
        { id: 'sch-chevening', name: 'Chevening International Fellowship', code: 'GB', prov: 'UK Foreign, Commonwealth & Development Office', lvl: 'Master of Science / Arts', nat: '*', field: 'All Fields of Study', fund: 'Full Tuition + Stipend', dl: '2026-11-05', desc: 'The UK government\'s flagship global scholarship program, covering university tuition fees, a monthly living allowance, economy return flights to the UK, and exclusive leadership events.', src: 'https://www.chevening.org/scholarships/', check: '2026-02-20' },
        { id: 'sch-fulbright', name: 'Fulbright Foreign Student Program', code: 'US', prov: 'U.S. Department of State & Binational Commissions', lvl: 'Master / PhD / Non-degree', nat: '*', field: 'Multidisciplinary', fund: 'Full Tuition + Stipend', dl: '2026-10-15', desc: 'Full funding for international graduate students, young professionals, and artists to study and conduct research in the United States.', src: 'https://foreign.fulbrightonline.org/', check: '2026-01-28' },
        { id: 'sch-mext', name: 'MEXT Japanese Government Scholarship', code: 'JP', prov: 'Ministry of Education, Culture, Sports, Science & Tech', lvl: 'Undergraduate / Master / PhD', nat: '*', field: 'Science, Technology, Humanities', fund: 'Full Tuition + Stipend', dl: '2026-06-15', desc: 'Full tuition exemption, round-trip airfare to Tokyo, and a monthly allowance of ¥144,000 to ¥145,000 for postgraduate research students.', src: 'https://www.studyinjapan.go.jp/en/planning/scholarship/mext-scholarships/', check: '2026-02-10' },
        { id: 'sch-eiffel', name: 'Eiffel Excellence Scholarship Program', code: 'FR', prov: 'Campus France / Ministry for Europe and Foreign Affairs', lvl: 'Master / Doctorate', nat: '*', field: 'Science, Law, Economics, Engineering', fund: 'Stipend + Travel', dl: '2027-01-10', desc: 'Prestige scholarship granting monthly allowances of €1,181 (Master) or €1,800 (PhD), international round-trip transport, health insurance, and cultural activities.', src: 'https://www.campusfrance.org/en/the-eiffel-scholarship-program', check: '2026-02-05' },
        { id: 'sch-aus-awards', name: 'Australia Awards Scholarships', code: 'AU', prov: 'Department of Foreign Affairs and Trade (DFAT)', lvl: 'Bachelor / Master / PhD', nat: '*', field: 'Health, Education, Agriculture, Governance', fund: 'Full Tuition + Stipend', dl: '2026-04-30', desc: 'Long-term awards covering full tuition, return air travel, establishment allowance, contribution to living expenses (CLE), and Overseas Student Health Cover (OSHC).', src: 'https://www.dfat.gov.au/people-to-people/australia-awards/australia-awards-scholarships', check: '2026-02-18' },
        { id: 'sch-swiss-gov', name: 'Swiss Government Excellence Scholarships', code: 'CH', prov: 'Federal Commission for Scholarships for Foreign Students', lvl: 'Postgraduate / PhD / Postdoc', nat: '*', field: 'Research across all academic disciplines', fund: 'Full Tuition + Stipend', dl: '2026-11-30', desc: 'Targeted at young researchers from abroad who have completed a master’s degree or PhD at renowned public research universities in Switzerland.', src: 'https://www.sbfi.admin.ch/sbfi/en/home/education/scholarships-and-grants/swiss-government-excellence-scholarships.html', check: '2026-01-15' },
        { id: 'sch-vanier-cgs', name: 'Vanier Canada Graduate Scholarships', code: 'CA', prov: 'Government of Canada (CIHR, NSERC, SSHRC)', lvl: 'Doctorate', nat: '*', field: 'Health, Natural Sciences, Humanities', fund: 'Full Tuition + Stipend', dl: '2026-11-01', desc: 'Valued at $50,000 per year for three years during doctoral studies, attracting world-class doctoral students to Canadian institutions.', src: 'https://vanier.gc.ca/en/home-accueil.html', check: '2026-02-12' },
        { id: 'sch-singapore-singa', name: 'Singapore International Graduate Award (SINGA)', code: 'SG', prov: 'A*STAR, NTU, NUS, SUTD', lvl: 'PhD in Science & Engineering', nat: '*', field: 'Biomedical, Computing, Physical Sciences', fund: 'Full Tuition + Stipend', dl: '2026-06-01', desc: 'Provides full tuition fees, a monthly stipend of S$2,700 (increased to S$3,200 after qualifying exam), one-time airfare grant, and settling-in allowance.', src: 'https://www.a-star.edu.sg/Scholarships/for-graduate-studies/singapore-international-graduate-award-singa', check: '2026-02-22' },
        { id: 'sch-gks-korea', name: 'Global Korea Scholarship (GKS)', code: 'KR', prov: 'National Institute for International Education (NIIED)', lvl: 'Master / PhD', nat: '*', field: 'Engineering, Korean Studies, Sciences', fund: 'Full Tuition + Stipend', dl: '2026-03-31', desc: 'Comprehensive financial support covering round-trip economy flights, tuition, settlement allowance, medical insurance, and 1 year of Korean language training.', src: 'https://www.studyinkorea.go.kr/en/sub/gks/allnew_invitation.do', check: '2026-02-01' },
        { id: 'sch-holland', name: 'NL Scholarship (formerly Holland Scholarship)', code: 'NL', prov: 'Dutch Ministry of Education & Dutch Research Universities', lvl: 'Bachelor / Master', nat: '*', field: 'All Accredited Dutch Programs', fund: 'Partial Grant', dl: '2026-05-01', desc: 'Financial contribution of €5,000 for non-EEA students during their first year of studies at participating Dutch higher education institutions.', src: 'https://www.studyinnl.org/finances/nl-scholarship', check: '2026-01-30' },
        { id: 'sch-nz-manaaki', name: 'Manaaki New Zealand Scholarships', code: 'NZ', prov: 'Ministry of Foreign Affairs and Trade (MFAT)', lvl: 'Postgraduate Diploma / Master / PhD', nat: '*', field: 'Climate Change, Food Security, Renewable Energy', fund: 'Full Tuition + Stipend', dl: '2026-02-28', desc: 'Full tuition fees, a living allowance of NZ$531 per week, establishment allowance, medical insurance, and return travel tickets.', src: 'https://www.nzscholarships.govt.nz/', check: '2026-01-20' },
    ];
    await Promise.all(scholarships.map(async (s) => {
        await query(`INSERT INTO scholarships (id, name, country_code, provider, level, eligible_nationalities, field, funding_type, deadline, description, official_source, last_checked)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE SET name = $2, provider = $4, deadline = $9, description = $10, official_source = $11, last_checked = $12`, [s.id, s.name, s.code, s.prov, s.lvl, s.nat, s.field, s.fund, s.dl, s.desc, s.src, s.check]);
    }));
    // 4. Seed Comprehensive Requirements Matrix (Nationality + Destination + Purpose)
    const requirementsData = [
        // Germany - Study
        { id: 'req-de-std-01', dest: 'DE', purp: 'Study', cat: 'Identity', title: 'Valid International Biometric Passport', desc: 'Must have at least 2 blank visa pages and validity extending at least 6 months beyond intended stay.', mand: true, stage: 2, url: 'https://visa.diplo.de/passport-guidance' },
        { id: 'req-de-std-02', dest: 'DE', purp: 'Study', cat: 'Academic', title: 'APS Certificate (Academic Evaluation Centre)', desc: 'Mandatory verification certificate for applicants from India, China, and Vietnam proving authenticity of academic records.', mand: true, stage: 3, url: 'https://aps-india.info/' },
        { id: 'req-de-std-03', dest: 'DE', purp: 'Study', cat: 'Academic', title: 'Official University Admission Letter (Zulassungsbescheid)', desc: 'Unconditional or conditional admission letter from a recognized German university or preparatory college (Studienkolleg).', mand: true, stage: 4, url: 'https://daad.de/admission-de' },
        { id: 'req-de-std-04', dest: 'DE', purp: 'Study', cat: 'Financial', title: 'Sperrkonto (Blocked Account) Solvency Proof', desc: 'Federally approved blocked account funded with minimum €11,904 (€992/month for 1 year) via Coracle, Expatrio, or Fintiba.', mand: true, stage: 5, url: 'https://auswaertiges-amt.de/en/sperrkonto' },
        { id: 'req-de-std-05', dest: 'DE', purp: 'Study', cat: 'Insurance', title: 'Statutory Health Insurance Coverage (Krankenversicherung)', desc: 'Confirmation of public statutory student insurance (TK, Barmer, or DAK) or equivalent incoming travel insurance.', mand: true, stage: 6, url: 'https://1000krankenkassen.de/' },
        { id: 'req-de-std-06', dest: 'DE', purp: 'Study', cat: 'Academic', title: 'Language Proficiency Certificate (IELTS/TOEFL or TestDaF)', desc: 'Official score card matching the university instruction language (typically IELTS 6.5+ or CEFR B2/C1 German).', mand: true, stage: 3, url: 'https://ielts.org' },
        { id: 'req-de-std-07', dest: 'DE', purp: 'Study', cat: 'Immigration', title: 'Videx National Visa Application Form', desc: 'Completed and signed VIDEX long-stay (Category D) application form with biometric barcode.', mand: true, stage: 7, url: 'https://videx-national.diplo.de/' },
        { id: 'req-de-std-08', dest: 'DE', purp: 'Study', cat: 'Arrival', title: 'City Registration Confirmation (Meldebescheinigung)', desc: 'Proof of address registration at the local Bürgeramt within 14 days of moving into local German accommodation.', mand: true, stage: 11, url: 'https://service.berlin.de/dienstleistung/120686/' },
        // Germany - Work
        { id: 'req-de-wrk-01', dest: 'DE', purp: 'Work', cat: 'Identity', title: 'International Biometric Passport', desc: 'Valid travel document with minimum 12 months remaining validity.', mand: true, stage: 2, url: 'https://make-it-in-germany.com' },
        { id: 'req-de-wrk-02', dest: 'DE', purp: 'Work', cat: 'Employment', title: 'Binding German Employment Contract or Job Offer', desc: 'Signed employment contract or binding offer with detailed job description and salary specified.', mand: true, stage: 4, url: 'https://make-it-in-germany.com/en/visa-residence/types/work-qualified-professionals' },
        { id: 'req-de-wrk-03', dest: 'DE', purp: 'Work', cat: 'Academic', title: 'Anabin / ZAB Statement of Comparability', desc: 'Official equivalence certificate confirming foreign university degree matches a German degree.', mand: true, stage: 3, url: 'https://anabin.kmk.org/' },
        { id: 'req-de-wrk-04', dest: 'DE', purp: 'Work', cat: 'Immigration', title: 'Declaration of Employment (Erklärung zum Beschäftigungsverhältnis)', desc: 'Standardized form completed by the prospective German employer for the Federal Employment Agency (BA).', mand: true, stage: 5, url: 'https://arbeitsagentur.de' },
        { id: 'req-de-wrk-05', dest: 'DE', purp: 'Work', cat: 'Insurance', title: 'Incoming Health Insurance Certificate', desc: 'Valid health insurance until statutory employer health insurance coverage takes effect upon start of employment.', mand: true, stage: 6, url: 'https://germany-visa.org' },
        // United States - Study
        { id: 'req-us-std-01', dest: 'US', purp: 'Study', cat: 'Identity', title: 'Passport Valid for Travel to the United States', desc: 'Must be valid for at least six months beyond your period of stay in the United States unless country-exempt.', mand: true, stage: 2, url: 'https://travel.state.gov' },
        { id: 'req-us-std-02', dest: 'US', purp: 'Study', cat: 'Academic', title: 'Form I-20 (Certificate of Eligibility for F-1)', desc: 'Official SEVIS-generated Form I-20 issued by the designated school official (DSO) at the admitted university.', mand: true, stage: 4, url: 'https://studyinthestates.dhs.gov/students' },
        { id: 'req-us-std-03', dest: 'US', purp: 'Study', cat: 'Financial', title: 'I-901 SEVIS Fee Receipt', desc: 'Confirmation payment receipt for the mandatory $350 SEVIS fee paid online prior to visa interview.', mand: true, stage: 5, url: 'https://fmjfee.com' },
        { id: 'req-us-std-04', dest: 'US', purp: 'Study', cat: 'Immigration', title: 'DS-160 Nonimmigrant Visa Application Confirmation', desc: 'Completed online form DS-160 with barcode page printed for the consular interview.', mand: true, stage: 7, url: 'https://ceac.state.gov/genniv/' },
        { id: 'req-us-std-05', dest: 'US', purp: 'Study', cat: 'Financial', title: 'Evidence of Financial Solvency (Bank Statements & Affidavits)', desc: 'Sufficient liquid funds or loans to cover the full estimated tuition and living expenses listed on Form I-20.', mand: true, stage: 5, url: 'https://travel.state.gov' },
        // United Kingdom - Study
        { id: 'req-gb-std-01', dest: 'GB', purp: 'Study', cat: 'Identity', title: 'Current Passport or Valid Travel Documentation', desc: 'Valid passport with at least one blank page for the Student visa vignette.', mand: true, stage: 2, url: 'https://gov.uk/student-visa' },
        { id: 'req-gb-std-02', dest: 'GB', purp: 'Study', cat: 'Academic', title: 'Confirmation of Acceptance for Studies (CAS)', desc: '14-digit reference number issued by the UK licensed student sponsor university.', mand: true, stage: 4, url: 'https://gov.uk/student-visa' },
        { id: 'req-gb-std-03', dest: 'GB', purp: 'Study', cat: 'Insurance', title: 'Immigration Health Surcharge (IHS) Payment', desc: 'Mandatory NHS healthcare surcharge (£776 per year of study) paid during visa application.', mand: true, stage: 6, url: 'https://gov.uk/healthcare-immigration-application' },
        { id: 'req-gb-std-04', dest: 'GB', purp: 'Study', cat: 'Medical', title: 'Tuberculosis (TB) Test Certificate', desc: 'TB clearance certificate from an approved Home Office testing clinic for residents of listed countries.', mand: true, stage: 8, url: 'https://gov.uk/tb-test-visa' },
        { id: 'req-gb-std-05', dest: 'GB', purp: 'Study', cat: 'Financial', title: '28-Day Financial Proof (Maintenance Requirement)', desc: 'Bank statement held continuously for 28 consecutive days proving living costs (£1,334/mo London, £1,023/mo outside).', mand: true, stage: 5, url: 'https://gov.uk/student-visa/money' },
        // Canada - Study
        { id: 'req-ca-std-01', dest: 'CA', purp: 'Study', cat: 'Academic', title: 'Letter of Acceptance (LOA) & Provincial Attestation Letter (PAL)', desc: 'Official acceptance from a Designated Learning Institution (DLI) accompanied by the required provincial attestation letter.', mand: true, stage: 4, url: 'https://canada.ca/en/immigration-refugees-citizenship.html' },
        { id: 'req-ca-std-02', dest: 'CA', purp: 'Study', cat: 'Financial', title: 'Guaranteed Investment Certificate (GIC) of $20,635 CAD', desc: 'Purchased through a participating Canadian financial institution as proof of living costs.', mand: true, stage: 5, url: 'https://canada.ca/study-permit' },
        { id: 'req-ca-std-03', dest: 'CA', purp: 'Study', cat: 'Immigration', title: 'Study Permit Application Form (IMM 1294)', desc: 'Submitted via IRCC secure online portal with biometrics and upfront medical exam where applicable.', mand: true, stage: 7, url: 'https://ircc.canada.ca' },
    ];
    await Promise.all(requirementsData.map(async (r) => {
        await query(`INSERT INTO requirements (id, nationality, destination, purpose, category, title, description, mandatory, stage_number, source_url, last_updated)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO UPDATE SET title = $6, description = $7, mandatory = $8, stage_number = $9, source_url = $10, last_updated = $11`, [r.id, null, r.dest, r.purp, r.cat, r.title, r.desc, r.mand, r.stage, r.url, '2026-03-01']);
    }));
    // 5. Seed a Demo Journey for user 'usr-demo-001' (India -> Germany -> Study)
    const journeyId = 'jrn-demo-001';
    await query(`INSERT INTO journeys (id, user_id, from_country, to_country, purpose, current_stage_number, current_stage_name, readiness_score, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (id) DO UPDATE SET current_stage_number = $6, current_stage_name = $7, readiness_score = $8`, [journeyId, 'usr-demo-001', 'India', 'Germany', 'Study', 5, 'Documentation', 62, 'Enrolled for Winter Semester 2026 at TUM. APS certificate verified. Blocked account in setup.']);
    // 6. Seed 12 Journey Stages for the Demo Journey
    const stages = [
        { num: 1, name: 'Researching', desc: 'Exploring target destinations, academic programs, and visa requirements.', status: 'COMPLETED' },
        { num: 2, name: 'Preparing', desc: 'Validating passport validity, translation requirements, and standardized testing.', status: 'COMPLETED' },
        { num: 3, name: 'Applying', desc: 'Submitting applications to universities or employers; academic evaluation (APS/ZAB).', status: 'COMPLETED' },
        { num: 4, name: 'Admitted/Approved', desc: 'Receiving official letter of admission or binding employment contract.', status: 'COMPLETED' },
        { num: 5, name: 'Documentation', desc: 'Gathering certified academic transcripts, biometric IDs, and official forms.', status: 'IN_PROGRESS' },
        { num: 6, name: 'Verification', desc: 'Document integrity hashing, AI analysis, and consular/authority verification.', status: 'IN_PROGRESS' },
        { num: 7, name: 'Visa/Immigration', desc: 'Booking consular biometric appointment, VIDEX forms, and visa processing.', status: 'NOT_STARTED' },
        { num: 8, name: 'Medical', desc: 'Statutory health insurance coverage confirmation and medical screenings.', status: 'NOT_STARTED' },
        { num: 9, name: 'Financial preparation', desc: 'Funding Sperrkonto blocked account or institutional sponsorship guarantees.', status: 'NOT_STARTED' },
        { num: 10, name: 'Travel', desc: 'Flight logistics, customs declarations, and document carriage checklists.', status: 'NOT_STARTED' },
        { num: 11, name: 'Arrival', desc: 'Municipal registration (Anmeldung), tax ID, and local bank account activation.', status: 'NOT_STARTED' },
        { num: 12, name: 'Settling in', desc: 'University matriculation, semester ticket, and residence permit card issuance.', status: 'NOT_STARTED' },
    ];
    await Promise.all(stages.map(async (st) => {
        const stId = `stg-${journeyId}-${st.num}`;
        await query(`INSERT INTO journey_stages (id, journey_id, stage_number, stage_name, description, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET stage_name = $4, description = $5, status = $6`, [stId, journeyId, st.num, st.name, st.desc, st.status]);
    }));
    // 7. Seed user_requirements linking requirements to the demo journey
    const deStdReqs = requirementsData.filter(r => r.dest === 'DE' && r.purp === 'Study');
    await Promise.all(deStdReqs.map(async (req) => {
        const urId = `ur-${journeyId}-${req.id}`;
        let status = 'NOT_UPLOADED';
        if (req.id === 'req-de-std-01')
            status = 'UPLOADED';
        if (req.id === 'req-de-std-02')
            status = 'VERIFIED';
        if (req.id === 'req-de-std-03')
            status = 'AI_ANALYZED';
        if (req.id === 'req-de-std-04')
            status = 'IN_PROGRESS';
        await query(`INSERT INTO user_requirements (id, journey_id, requirement_id, status, notes)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET status = $4, notes = $5`, [urId, journeyId, req.id, status, 'Tracked through MidBridge 2.0 requirement engine']);
    }));
    // 8. Seed Notifications and Reminders for the Demo User
    const notifications = [
        { id: 'notif-01', uid: 'usr-demo-001', title: 'APS Certificate Authenticated', msg: 'Your Academic Evaluation Centre certificate has been verified by the authority.', cat: 'VERIFICATION_RESULT', link: '/verification' },
        { id: 'notif-02', uid: 'usr-demo-001', title: 'Winter Semester Blocked Account', msg: 'Remember to allocate €11,904 to your Sperrkonto before your visa appointment.', cat: 'FINANCIAL', link: '/journey' },
        { id: 'notif-03', uid: 'usr-demo-001', title: 'DAAD EPOS Deadline Approaching', msg: 'The application window for DAAD EPOS closes on 31 October 2026.', cat: 'SCHOLARSHIP_REMINDER', link: '/scholarships' },
    ];
    await Promise.all(notifications.map(async (n) => {
        await query(`INSERT INTO notifications (id, user_id, title, message, category, link_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`, [n.id, n.uid, n.title, n.msg, n.cat, n.link]);
    }));
    const reminders = [
        { id: 'rem-01', uid: 'usr-demo-001', jid: journeyId, title: 'Finalize Sperrkonto Blocked Account Deposit', date: '2026-06-15', cat: 'Financial' },
        { id: 'rem-02', uid: 'usr-demo-001', jid: journeyId, title: 'VFS Global Visa Biometric Appointment Booking', date: '2026-07-01', cat: 'Visa' },
        { id: 'rem-03', uid: 'usr-demo-001', jid: journeyId, title: 'Techniker Krankenkasse (TK) Student Insurance Confirmation', date: '2026-07-15', cat: 'Insurance' },
    ];
    await Promise.all(reminders.map(async (rem) => {
        await query(`INSERT INTO reminders (id, user_id, journey_id, title, due_date, category)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`, [rem.id, rem.uid, rem.jid, rem.title, rem.date, rem.cat]);
    }));
    console.log('✓ MidBridge 2.0 database successfully seeded with 20 countries, scholarships, requirements, and demo accounts!');
}
if (process.argv[1] && process.argv[1].includes('seed')) {
    seedDatabase().then(() => process.exit(0)).catch(err => {
        console.error('Seeding failed:', err);
        process.exit(1);
    });
}
