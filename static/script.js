/* ========================================
   ANIMATED COUNTERS
   ======================================== */

function animateCounters() {
    const counters = document.querySelectorAll('[data-target]');
    let animated = false;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !animated) {
                animated = true;
                
                counters.forEach(counter => {
                    const target = parseInt(counter.getAttribute('data-target'));
                    const suffix = counter.getAttribute('data-suffix') || '';
                    
                    let current = 0;
                    const increment = target / 60; // 60 steps
                    const duration = 1500; // 1.5 seconds
                    const step = duration / 60;
                    
                    const startTime = Date.now();
                    
                    const updateCounter = () => {
                        const elapsed = Date.now() - startTime;
                        const progress = Math.min(elapsed / duration, 1);
                        
                        current = progress * target;
                        counter.textContent = Math.floor(current) + suffix;
                        
                        if (progress < 1) {
                            requestAnimationFrame(updateCounter);
                        } else {
                            counter.textContent = target + suffix;
                        }
                    };
                    
                    updateCounter();
                });
                
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    
    // Observe the first counter
    if (counters.length > 0) {
        observer.observe(counters[0]);
    }
}

// Initialize counters when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', animateCounters);
} else {
    animateCounters();
}
/* ========================================
   CHART.JS INITIALIZATION
   ======================================== */
let contentChart;
let _dashboardData = null;
let _competitorChartsInit = false;

function initDashboard(data) {
    console.log('Initializing dashboard with data:', data);
    _dashboardData = data;

    initContentChart(data);                 // 🍩 donut (overview tab)
    initKeywordOpportunityChart(data);      // 📊 keywords tab bar chart

    setupNavigation();
    setupSearchForm();
}

function initCompetitorCharts() {
    if (_competitorChartsInit || !_dashboardData) return;
    _competitorChartsInit = true;
    initBubbleChart(_dashboardData);
    initContentDistributionChart(_dashboardData);
}

// ========================================
// 1. CONTENT TYPE DISTRIBUTION (FIXED)
// ========================================

function initContentChart(data) {
    const ctx = document.getElementById('contentChart');
    if (!ctx) return;

    const contentMixArray = data.contentMix || [];

    const labels = contentMixArray.map(item => item.type);
    const values = contentMixArray.map(item => item.count);
    if (labels.length === 0) return;

    const dominant = labels[values.indexOf(Math.max(...values))];

    contentChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                borderWidth: 2
            }]
        },
        options: {
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        afterLabel: (ctx) =>
                            ctx.label === dominant ? "🔥 Dominant" : ""
                    }
                }
            }
        }
    });
}

// ========================================
// 2. KEYWORD OPPORTUNITY (NEW)
// ========================================

function initKeywordOpportunityChart(data) {
    ['keywordChart', 'keywordChart2'].forEach(id => {
        const ctx = document.getElementById(id);
        if (!ctx) return;

        const competitors = (data.competitors || []).slice(0, 10);
        const labels = competitors.map(c => c.company_name || 'Unknown');
        const rankingKeywords = competitors.map(c => c.ranking_keywords || 0);
        const backlinks = competitors.map(c => c.backlinks || 0);

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Ranking Keywords',
                        data: rankingKeywords,
                        backgroundColor: 'rgba(54, 162, 235, 0.7)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1,
                        borderRadius: 4
                    },
                    {
                        label: 'Backlinks',
                        data: backlinks,
                        backgroundColor: 'rgba(255, 159, 64, 0.7)',
                        borderColor: 'rgba(255, 159, 64, 1)',
                        borderWidth: 1,
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                        callbacks: {
                            label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()}`
                        }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Competitor' },
                        ticks: {
                            maxRotation: 30,
                            callback: function(val) {
                                const label = this.getLabelForValue(val);
                                return label.length > 12 ? label.slice(0, 12) + '…' : label;
                            }
                        }
                    },
                    y: {
                        title: { display: true, text: 'Count' },
                        beginAtZero: true
                    }
                }
            }
        });
    });
}

// ========================================
// 3. BUBBLE CHART (NEW)
// ========================================

function initBubbleChart(data) {
    const ctx = document.getElementById('bubbleChart');
    if (!ctx) return;

    const competitors = (data.competitors || []).slice(0, 10);
    const labels = competitors.map(c => c.company_name || 'Unknown');

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Organic Traffic',
                    data: competitors.map(c => c.traffic || 0),
                    backgroundColor: 'rgba(99, 179, 237, 0.75)',
                    borderColor: 'rgba(99, 179, 237, 1)',
                    borderWidth: 1,
                    borderRadius: 5,
                    yAxisID: 'yTraffic'
                },
                {
                    label: 'Ranking Keywords',
                    data: competitors.map(c => c.ranking_keywords || 0),
                    backgroundColor: 'rgba(246, 173, 85, 0.75)',
                    borderColor: 'rgba(246, 173, 85, 1)',
                    borderWidth: 1,
                    borderRadius: 5,
                    yAxisID: 'yKeywords'
                }
            ]
        },
        options: {
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()}`
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Competitor' },
                    ticks: {
                        maxRotation: 30,
                        callback: function(val) {
                            const lbl = this.getLabelForValue(val);
                            return lbl.length > 14 ? lbl.slice(0, 14) + '…' : lbl;
                        }
                    }
                },
                yTraffic: {
                    type: 'linear',
                    position: 'left',
                    title: { display: true, text: 'Organic Traffic' },
                    beginAtZero: true,
                    grid: { drawOnChartArea: true }
                },
                yKeywords: {
                    type: 'linear',
                    position: 'right',
                    title: { display: true, text: 'Ranking Keywords' },
                    beginAtZero: true,
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });
}

function initContentDistributionChart(data) {
    const ctx = document.getElementById('contentChart');
    if (!ctx) return;

    const competitors = (data.competitors || []).slice(0, 10);

    // Count content types from top 10 SERP competitors
    const counts = {};
    competitors.forEach(c => {
        const type = c.content_type || 'Unknown';
        counts[type] = (counts[type] || 0) + 1;
    });

    const labels = Object.keys(counts);
    const values = Object.values(counts);
    const palette = [
        'rgba(99,179,237,0.8)', 'rgba(246,173,85,0.8)', 'rgba(154,230,180,0.8)',
        'rgba(252,129,129,0.8)', 'rgba(183,148,244,0.8)', 'rgba(251,211,141,0.8)'
    ];

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: palette.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            cutout: '60%',
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: ctx => ` ${ctx.label}: ${ctx.parsed} site${ctx.parsed > 1 ? 's' : ''}`
                    }
                }
            }
        }
    });
}

/* ========================================
   NAVIGATION & INTERACTIVITY
   ======================================== */

function setupNavigation() {
    // Navigation is handled by switchPage() in dashboard.html
    // This function is intentionally left as a no-op to avoid duplicate listeners
}

function showSection(page) {
    // Delegate to switchPage defined in dashboard.html inline script
    if (typeof switchPage === 'function') switchPage(page);
}

function setupSearchForm() {
    const searchForm = document.querySelector('.topbar-center form');
    const searchInput = document.querySelector('.search-input');
    
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            // Allow form to submit to Python backend
            // The form's action="/dashboard" will handle the POST
            console.log('Search form submitted');
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                // Form will submit via default behavior
                console.log('Enter pressed in search');
            }
        });
    }
}

/* ========================================
   UTILITY FUNCTIONS
   ======================================== */

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function getColorByPriority(priority) {
    const colors = {
        'High': 'rgba(16, 185, 129, 0.8)',
        'Medium': 'rgba(245, 158, 11, 0.8)',
        'Low': 'rgba(239, 68, 68, 0.8)'
    };
    return colors[priority] || 'rgba(99, 102, 241, 0.8)';
}

/* ========================================
   PAGE INITIALIZATION
   ======================================== */

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, checking for dashboard data...');
    
    // Check if we have dashboard data from Jinja template
    if (typeof dashboardData !== 'undefined') {
        console.log('Dashboard data found, initializing...');
        initDashboard(dashboardData);
    } else {
        console.log('No dashboard data found');
    }
    
    // Animate elements on page load
    animateDashboardOnLoad();

    // Initialize interactive visuals for home page
    initHeroParticles();
    init3DTiltCards();
});

/* ========================================
   HOME PAGE INTERACTIVE VISUALS
   ======================================== */

function initHeroParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    
    function resize() {
        const parent = canvas.parentElement;
        width = parent.offsetWidth;
        height = parent.offsetHeight;
        canvas.width = width;
        canvas.height = height;
    }
    
    window.addEventListener('resize', resize);
    resize();
    
    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 1.5;
            this.vy = (Math.random() - 0.5) * 1.5;
            this.radius = Math.random() * 2 + 1;
            this.baseAlpha = Math.random() * 0.5 + 0.1;
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;
        }
        
        draw(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(139, 111, 71, ${this.baseAlpha})`;
            ctx.fill();
        }
    }
    
    for (let i = 0; i < 70; i++) {
        particles.push(new Particle());
    }
    
    let mouse = { x: -1000, y: -1000 };
    canvas.parentElement.addEventListener('mousemove', (e) => {
        const rect = canvas.parentElement.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });
    canvas.parentElement.addEventListener('mouseleave', () => {
        mouse.x = -1000;
        mouse.y = -1000;
    });
    
    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw(ctx);
            
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 130) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(139, 111, 71, ${0.15 - dist/800})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
            
            const dxm = particles[i].x - mouse.x;
            const dym = particles[i].y - mouse.y;
            const distm = Math.sqrt(dxm * dxm + dym * dym);
            if (distm < 180) {
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(mouse.x, mouse.y);
                ctx.strokeStyle = `rgba(33, 40, 66, ${0.25 - distm/700})`;
                ctx.lineWidth = 1.5;
                ctx.stroke();
                
                particles[i].x += dxm * 0.015;
                particles[i].y += dym * 0.015;
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    animate();
}

function init3DTiltCards() {
    const cards = document.querySelectorAll('.interactive-card');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -8;
            const rotateY = ((x - centerX) / centerX) * 8;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            card.style.transition = 'none';
            card.style.zIndex = '10';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
            card.style.transition = 'transform 0.5s ease';
            card.style.zIndex = '1';
        });
    });
}

function animateDashboardOnLoad() {
    // Animate metric cards
    const metricCards = document.querySelectorAll('.metric-card');
    metricCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.animation = `fadeInUp 0.6s ease-out ${index * 0.1}s forwards`;
    });
    
    // Animate insight cards
    const insightCards = document.querySelectorAll('.insight-card');
    insightCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.animation = `fadeInUp 0.6s ease-out ${0.3 + index * 0.1}s forwards`;
    });
    
    // Animate chart cards
    const chartCards = document.querySelectorAll('.chart-card');
    chartCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.animation = `fadeInUp 0.6s ease-out ${0.6 + index * 0.1}s forwards`;
    });
}

/* ========================================
   CSS ANIMATIONS (inline for performance)
   ======================================== */

const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);