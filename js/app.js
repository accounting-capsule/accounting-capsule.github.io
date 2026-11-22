/* ============================================
   كبسولة المحاسب - Accounting in a Capsule
   Main JavaScript Application
   Version: 1.0.0
   ============================================ */

(function() {
    'use strict';

    // ===== Application State =====
    const AppState = {
        sidebarCollapsed: false,
        currentLang: localStorage.getItem('lang') || 'ar',
        user: JSON.parse(localStorage.getItem('user')) || null,
        notifications: [],
        chatOpen: false,
        commandPaletteOpen: false,
        theme: localStorage.getItem('theme') || 'light'
    };

    // ===== DOM Ready Handler =====
    document.addEventListener('DOMContentLoaded', function() {
        initApp();
    });

    function initApp() {
        initSidebar();
        initCommandPalette();
        initChatbot();
        initNotifications();
        initLanguageSwitcher();
        initMobileMenu();
        initAnimations();
        initCookieConsent();
        initCharts();
        initSearch();
        initFormValidation();
        initTooltips();
    }

    // ===== Sidebar Management =====
    function initSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const toggleBtn = document.querySelector('.sidebar-toggle');
        const main = document.querySelector('.main');

        if (!sidebar || !toggleBtn) return;

        // Restore state
        const savedState = localStorage.getItem('sidebarCollapsed');
        if (savedState === 'true') {
            sidebar.classList.add('collapsed');
            AppState.sidebarCollapsed = true;
        }

        toggleBtn.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            AppState.sidebarCollapsed = sidebar.classList.contains('collapsed');
            localStorage.setItem('sidebarCollapsed', AppState.sidebarCollapsed);

            // Trigger resize event for charts
            window.dispatchEvent(new Event('resize'));
        });

        // Mobile sidebar
        const mobileToggle = document.querySelector('.mobile-menu-btn');
        const mobileOverlay = document.querySelector('.mobile-overlay');

        if (mobileToggle) {
            mobileToggle.addEventListener('click', function() {
                sidebar.classList.add('mobile-open');
                if (mobileOverlay) mobileOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        }

        if (mobileOverlay) {
            mobileOverlay.addEventListener('click', function() {
                sidebar.classList.remove('mobile-open');
                mobileOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        }

        // Active nav item based on current page
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('.nav-item').forEach(item => {
            const href = item.getAttribute('href');
            if (href && href.includes(currentPage)) {
                item.classList.add('active');
            }
        });
    }

    // ===== Command Palette (Ctrl+K) =====
    function initCommandPalette() {
        const overlay = document.querySelector('.command-palette-overlay');
        const input = document.querySelector('.command-input');
        const searchTrigger = document.querySelector('.search-trigger');

        if (!overlay) return;

        // Open with keyboard shortcut
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                toggleCommandPalette();
            }
            if (e.key === 'Escape' && AppState.commandPaletteOpen) {
                toggleCommandPalette();
            }
        });

        // Open with click
        if (searchTrigger) {
            searchTrigger.addEventListener('click', toggleCommandPalette);
        }

        // Close on overlay click
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                toggleCommandPalette();
            }
        });

        // Search functionality
        if (input) {
            input.addEventListener('input', debounce(function() {
                filterCommandResults(this.value);
            }, 150));

            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    const selected = document.querySelector('.command-item.selected');
                    if (selected) {
                        executeCommand(selected);
                    }
                }
                if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    navigateResults(e.key === 'ArrowDown' ? 1 : -1);
                }
            });
        }

        function toggleCommandPalette() {
            AppState.commandPaletteOpen = !AppState.commandPaletteOpen;
            overlay.classList.toggle('active', AppState.commandPaletteOpen);

            if (AppState.commandPaletteOpen && input) {
                setTimeout(() => input.focus(), 100);
                input.value = '';
                filterCommandResults('');
            }
        }

        function filterCommandResults(query) {
            const items = document.querySelectorAll('.command-item');
            const sections = document.querySelectorAll('.command-section');
            query = query.toLowerCase().trim();

            items.forEach(item => {
                const text = item.textContent.toLowerCase();
                const match = !query || text.includes(query);
                item.style.display = match ? 'flex' : 'none';
                item.classList.remove('selected');
            });

            // Hide empty sections
            sections.forEach(section => {
                const visibleItems = section.querySelectorAll('.command-item:not([style*="none"])');
                section.style.display = visibleItems.length > 0 ? 'block' : 'none';
            });

            // Select first visible item
            const firstVisible = document.querySelector('.command-item:not([style*="none"])');
            if (firstVisible) firstVisible.classList.add('selected');
        }

        function navigateResults(direction) {
            const items = Array.from(document.querySelectorAll('.command-item:not([style*="none"])'));
            const current = document.querySelector('.command-item.selected');
            let index = current ? items.indexOf(current) : -1;

            index = (index + direction + items.length) % items.length;

            items.forEach(item => item.classList.remove('selected'));
            if (items[index]) {
                items[index].classList.add('selected');
                items[index].scrollIntoView({ block: 'nearest' });
            }
        }

        function executeCommand(item) {
            const href = item.getAttribute('data-href');
            if (href && href !== '#') {
                toggleCommandPalette();
                window.location.href = href;
            } else if (href === '#') {
                toggleCommandPalette();
                showToast('هذه الميزة هتكون متاحة قريبًا 🚧', 'info');
            }
        }

        // Click on command items
        document.querySelectorAll('.command-item').forEach(item => {
            item.addEventListener('click', function() {
                executeCommand(this);
            });
            item.addEventListener('mouseenter', function() {
                document.querySelectorAll('.command-item').forEach(i => i.classList.remove('selected'));
                this.classList.add('selected');
            });
        });
    }

    // ===== Chatbot Widget =====
    function initChatbot() {
        const toggle = document.querySelector('.chatbot-toggle');
        const panel = document.querySelector('.chatbot-panel');
        const closeBtn = document.querySelector('.chatbot-close');
        const input = document.querySelector('.chatbot-input input');
        const sendBtn = document.querySelector('.chatbot-input button');
        const messagesContainer = document.querySelector('.chatbot-messages');

        if (!toggle || !panel) return;

        // Predefined responses
        const botResponses = {
            'مرحبا': 'أهلاً بيك في كبسولة المحاسب! 🎉 أنا المساعد الذكي بتاعك. إزاي أقدر أساعدك النهاردة؟',
            'hello': 'Welcome to Accounting Capsule! 🎉 I am your smart assistant. How can I help you today?',
            'ضريبة': 'الضريبة في مصر بتختلف حسب نوع النشاط. للأفراد: تقدرية من 0% لـ 25%. للشركات: 22.5% للأرباح. عايز تفاصيل أكتر عن نوع معين؟',
            'tax': 'Tax rates vary by business type. In Egypt: Individuals 0-25%, Companies 22.5%. Need more details?',
            'excel': 'عندنا مجموعة ضخمة من شيتات Excel المحاسبية! فيه شيتات للمرتبات، المخزون، المبيعات، والميزانيات. عايز تتصفحهم؟',
            'شيت': 'شيتات Excel عندنا مقسمة لـ 3 أنواع: مجانية، مدفوعة، وVIP. كلها جاهزة للاستخدام مع معادلات ذكية.',
            'كورس': 'كورساتنا بتغطي: Excel للمحاسبين، التحليل المالي، الضرائب، وإدارة الأعمال. فيه كورسات مجانية ومدفوعة.',
            'course': 'Our courses cover: Excel for Accountants, Financial Analysis, Taxes, and Business Management.',
            'سعر': 'الشيتات المجانية متاحة للكل. الشيتات المدفوعة من 50 لـ 200 جنيه. الاشتراك VIP بـ 499 جنيه/شهر بيديك وصول لكل حاجة.',
            'price': 'Free sheets available to all. Paid sheets 50-200 EGP. VIP subscription 499 EGP/month for full access.',
            'تحميل': 'عشان تحمل أي ملف، لازم تسجل دخول الأول. التسجيل مجاني! بعد كده تقدر تحمل الشيتات المجانية فوراً.',
            'download': 'To download files, please log in first. Registration is free! Then you can download free sheets instantly.',
            'vip': 'الاشتراك VIP بيديك: وصول لكل الشيتات والكورسات، تحميل غير محدود، دعم فني مباشر، وتحديثات أول بأول.',
            'مساعدة': 'أنا هنا عشان أساعدك! ممكن تسألني عن: الشيتات، الكورسات، الأسعار، التسجيل، أو أي سؤال محاسبي.',
            'help': 'I am here to help! Ask me about: sheets, courses, pricing, registration, or any accounting question.',
            'شكرا': 'العفو! 🙏 لو عندك أي سؤال تاني، أنا هنا. بالتوفيق في شغلك!',
            'thanks': 'You are welcome! 🙏 If you have any other questions, I am here. Good luck with your work!',
            'default': 'شكراً لسؤالك! 🤔 ممكن توضح أكتر عشان أساعدك بشكل أفضل؟ أو تقدر تتواصل معانا مباشرة من صفحة "تواصل معنا".',
            'default_en': 'Thanks for your question! 🤔 Could you clarify more so I can help better? Or contact us directly from the "Contact Us" page.'
        };

        function toggleChat() {
            AppState.chatOpen = !AppState.chatOpen;
            panel.classList.toggle('active', AppState.chatOpen);
            if (AppState.chatOpen && input) {
                setTimeout(() => input.focus(), 100);
            }
        }

        toggle.addEventListener('click', toggleChat);
        if (closeBtn) closeBtn.addEventListener('click', toggleChat);

        function sendMessage() {
            const text = input.value.trim();
            if (!text) return;

            // Add user message
            addMessage(text, 'user');
            input.value = '';

            // Get bot response
            setTimeout(() => {
                const response = getBotResponse(text);
                addMessage(response, 'bot');
            }, 500 + Math.random() * 500);
        }

        function addMessage(text, type) {
            const message = document.createElement('div');
            message.className = `message ${type}`;
            message.innerHTML = `
                <p>${escapeHtml(text)}</p>
                <div class="message-time">${getCurrentTime()}</div>
            `;
            messagesContainer.appendChild(message);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        function getBotResponse(text) {
            const lowerText = text.toLowerCase();
            const lang = AppState.currentLang;

            for (const key in botResponses) {
                if (lowerText.includes(key.toLowerCase())) {
                    return botResponses[key];
                }
            }

            return lang === 'ar' ? botResponses.default : botResponses.default_en;
        }

        if (sendBtn) sendBtn.addEventListener('click', sendMessage);
        if (input) {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') sendMessage();
            });
        }

        // Welcome message
        if (messagesContainer && messagesContainer.children.length === 0) {
            setTimeout(() => {
                const welcome = AppState.currentLang === 'ar' 
                    ? botResponses['مرحبا'] 
                    : botResponses['hello'];
                addMessage(welcome, 'bot');
            }, 1000);
        }
    }

    // ===== Notifications System =====
    function initNotifications() {
        const notificationBtn = document.querySelector('.notification-btn');
        const notificationPanel = document.querySelector('.notification-panel');

        if (!notificationBtn) return;

        // Mock notifications
        const mockNotifications = [
            { id: 1, title: 'شيت جديد متاح', message: 'شيت إدارة المخزون 2026 تم إضافته', time: 'منذ 5 دقائق', read: false, type: 'download' },
            { id: 2, title: 'كورس جديد', message: 'Excel المتقدم للمحاسبين - متاح الآن', time: 'منذ ساعة', read: false, type: 'course' },
            { id: 3, title: 'تحديث النظام', message: 'تم تحديث 5 شيتات بميزات جديدة', time: 'منذ 3 ساعات', read: true, type: 'update' }
        ];

        notificationBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (notificationPanel) {
                notificationPanel.classList.toggle('active');
            }
        });

        document.addEventListener('click', function(e) {
            if (notificationPanel && !notificationPanel.contains(e.target) && !notificationBtn.contains(e.target)) {
                notificationPanel.classList.remove('active');
            }
        });
    }

    // ===== Language Switcher =====
    function initLanguageSwitcher() {
        const switcher = document.querySelector('.lang-switcher');
        if (!switcher) return;

        switcher.addEventListener('click', function() {
            const newLang = AppState.currentLang === 'ar' ? 'en' : 'ar';
            AppState.currentLang = newLang;
            localStorage.setItem('lang', newLang);
            document.body.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');

            // Update UI text (simplified - in production would reload page or use i18n)
            switcher.querySelector('span').textContent = newLang.toUpperCase();

            showToast(
                newLang === 'ar' ? 'تم تغيير اللغة إلى العربية' : 'Language changed to English',
                'success'
            );
        });
    }

    // ===== Mobile Menu =====
    function initMobileMenu() {
        // Handled in sidebar init
    }

    // ===== Scroll Animations =====
    function initAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        document.querySelectorAll('.fade-in, .animate-fade-in-up').forEach(el => {
            observer.observe(el);
        });

        // Animate bars on scroll
        document.querySelectorAll('.bar-fill').forEach(bar => {
            const targetHeight = bar.getAttribute('data-height') || '60%';
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setTimeout(() => {
                            bar.style.height = targetHeight;
                        }, 200);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });
            observer.observe(bar);
        });

        // Animate progress circles
        document.querySelectorAll('.progress-circle-fill').forEach(circle => {
            const targetOffset = circle.getAttribute('data-offset');
            if (targetOffset) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            setTimeout(() => {
                                circle.style.strokeDashoffset = targetOffset;
                            }, 300);
                            observer.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.5 });
                observer.observe(circle);
            }
        });
    }

    // ===== Cookie Consent =====
    function initCookieConsent() {
        const banner = document.querySelector('.cookie-banner');
        const acceptBtn = document.querySelector('.cookie-accept');

        if (!banner) return;

        const consent = localStorage.getItem('cookieConsent');
        if (consent === 'accepted') {
            banner.style.display = 'none';
        }

        if (acceptBtn) {
            acceptBtn.addEventListener('click', function() {
                localStorage.setItem('cookieConsent', 'accepted');
                banner.style.display = 'none';
                showToast('تم قبول سياسة الكوكيز', 'success');
            });
        }
    }

    // ===== Charts (CSS-based with JS animation) =====
    function initCharts() {
        // Bar chart animation handled in initAnimations
        // Additional chart logic can be added here
    }

    // ===== Search Functionality =====
    function initSearch() {
        const searchInputs = document.querySelectorAll('[data-search]');

        searchInputs.forEach(input => {
            const target = input.getAttribute('data-search');
            const container = document.querySelector(target);
            if (!container) return;

            input.addEventListener('input', debounce(function() {
                const query = this.value.toLowerCase().trim();
                const items = container.querySelectorAll('[data-searchable]');

                items.forEach(item => {
                    const text = item.textContent.toLowerCase();
                    item.style.display = (!query || text.includes(query)) ? '' : 'none';
                });
            }, 200));
        });
    }

    // ===== Form Validation =====
    function initFormValidation() {
        document.querySelectorAll('form[data-validate]').forEach(form => {
            form.addEventListener('submit', function(e) {
                let valid = true;

                form.querySelectorAll('[required]').forEach(field => {
                    if (!field.value.trim()) {
                        valid = false;
                        field.classList.add('error');

                        // Show error message
                        const errorMsg = field.parentElement.querySelector('.error-message');
                        if (errorMsg) {
                            errorMsg.textContent = 'هذا الحقل مطلوب';
                            errorMsg.style.display = 'block';
                        }
                    } else {
                        field.classList.remove('error');
                        const errorMsg = field.parentElement.querySelector('.error-message');
                        if (errorMsg) errorMsg.style.display = 'none';
                    }
                });

                // Email validation
                form.querySelectorAll('input[type="email"]').forEach(field => {
                    if (field.value && !isValidEmail(field.value)) {
                        valid = false;
                        field.classList.add('error');
                    }
                });

                if (!valid) {
                    e.preventDefault();
                    showToast('يرجى ملء جميع الحقول المطلوبة بشكل صحيح', 'error');
                }
            });

            // Real-time validation
            form.querySelectorAll('input, textarea, select').forEach(field => {
                field.addEventListener('blur', function() {
                    if (this.hasAttribute('required') && !this.value.trim()) {
                        this.classList.add('error');
                    } else {
                        this.classList.remove('error');
                    }
                });
            });
        });
    }

    // ===== Tooltips =====
    function initTooltips() {
        document.querySelectorAll('[data-tooltip]').forEach(el => {
            el.addEventListener('mouseenter', function() {
                const text = this.getAttribute('data-tooltip');
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                tooltip.textContent = text;
                tooltip.style.cssText = `
                    position: absolute;
                    background: var(--gray-900);
                    color: white;
                    padding: 0.5rem 0.75rem;
                    border-radius: var(--radius-sm);
                    font-size: 0.75rem;
                    z-index: 1000;
                    white-space: nowrap;
                    pointer-events: none;
                `;
                document.body.appendChild(tooltip);

                const rect = this.getBoundingClientRect();
                tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
                tooltip.style.left = rect.left + (rect.width - tooltip.offsetWidth) / 2 + 'px';

                this._tooltip = tooltip;
            });

            el.addEventListener('mouseleave', function() {
                if (this._tooltip) {
                    this._tooltip.remove();
                    this._tooltip = null;
                }
            });
        });
    }

    // ===== Toast Notifications =====
    function showToast(message, type = 'info') {
        const container = document.querySelector('.toast-container') || createToastContainer();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        const colors = {
            success: 'var(--secondary-500)',
            error: 'var(--red-500)',
            warning: 'var(--gold-500)',
            info: 'var(--primary-500)'
        };

        toast.innerHTML = `
            <i class="fas ${icons[type]}" style="color: ${colors[type]}; font-size: 1.25rem;"></i>
            <span style="flex: 1; font-size: 0.9375rem;">${escapeHtml(message)}</span>
            <button class="toast-close" style="background: none; border: none; color: var(--gray-400); cursor: pointer; padding: 0.25rem;">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(toast);

        // Auto remove
        const timeout = setTimeout(() => {
            toast.style.animation = 'fadeIn 0.3s ease-out reverse';
            setTimeout(() => toast.remove(), 300);
        }, 5000);

        // Manual close
        toast.querySelector('.toast-close').addEventListener('click', () => {
            clearTimeout(timeout);
            toast.remove();
        });
    }

    function createToastContainer() {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }

    // ===== Utility Functions =====
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // ===== Export for global access =====
    window.AccountingCapsule = {
        showToast,
        toggleSidebar: () => document.querySelector('.sidebar-toggle')?.click(),
        toggleChatbot: () => document.querySelector('.chatbot-toggle')?.click(),
        openCommandPalette: () => {
            const overlay = document.querySelector('.command-palette-overlay');
            if (overlay) overlay.classList.add('active');
        }
    };

})();

/* ============================================
   Launch fixes: graceful static behavior
   (added for first deploy - no backend yet)
   ============================================ */
document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    function launchToast(message, type) {
        if (window.AccountingCapsule && window.AccountingCapsule.showToast) {
            window.AccountingCapsule.showToast(message, type || 'info');
        }
    }

    // 1. Placeholder links (pages not built yet): courses, VIP, socials, etc.
    document.querySelectorAll('a[href="#"]').forEach(function(a) {
        a.addEventListener('click', function(e) {
            e.preventDefault();
            launchToast('هذه الميزة هتكون متاحة قريبًا 🚧', 'info');
        });
    });

    // 2. Google sign-in buttons (needs backend OAuth)
    document.querySelectorAll('.btn-social.google').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            launchToast('الدخول بحساب Google هيكون متاح قريبًا 🚧', 'info');
        });
    });

    // 3. Download buttons (files not uploaded yet)
    document.querySelectorAll('.download-card .btn, .download-card-premium .btn').forEach(function(btn) {
        if (btn.tagName === 'BUTTON' && !btn.getAttribute('data-ready')) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                launchToast('الملف ده لسه بيتجهز، هيكون متاح للتحميل قريبًا 📦', 'info');
            });
        }
    });

    // 4. Auth forms: local demo accounts (no backend)
    var page = window.location.pathname.split('/').pop() || 'index.html';

    function saveDemoUser(name, email) {
        var user = { name: name, email: email, role: 'member', joinedAt: new Date().toISOString() };
        try { localStorage.setItem('user', JSON.stringify(user)); } catch (err) {}
    }

    if (page === 'login.html') {
        var loginForm = document.querySelector('form[data-validate]');
        if (loginForm) {
            loginForm.addEventListener('submit', function(e) {
                e.preventDefault();
                var email = loginForm.querySelector('input[type="email"]');
                var pass = loginForm.querySelector('input[type="password"]');
                if (!email.value.trim() || !pass.value.trim()) return; // validation handler shows the error
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) return;
                var name = email.value.split('@')[0].replace(/[._-]+/g, ' ').trim() || 'مستخدم كبسولة المحاسب';
                saveDemoUser(name, email.value.trim());
                launchToast('تم تسجيل الدخول بنجاح ✅', 'success');
                setTimeout(function() { window.location.href = 'user-dashboard.html'; }, 600);
            });
        }
    }

    if (page === 'register.html') {
        var regForm = document.querySelector('form[data-validate]');
        if (regForm) {
            regForm.addEventListener('submit', function(e) {
                e.preventDefault();
                var name = regForm.querySelector('input[type="text"]');
                var email = regForm.querySelector('input[type="email"]');
                var passes = regForm.querySelectorAll('input[type="password"]');
                var terms = regForm.querySelector('input[type="checkbox"]');
                if (!name.value.trim() || !email.value.trim() || !passes[0].value || !passes[1].value) return;
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) return;
                if (passes[0].value.length < 8) {
                    launchToast('كلمة المرور لازم تكون 8 أحرف على الأقل', 'error');
                    return;
                }
                if (passes[0].value !== passes[1].value) {
                    launchToast('كلمتا المرور غير متطابقتين', 'error');
                    return;
                }
                if (terms && !terms.checked) {
                    launchToast('لازم توافق على شروط الاستخدام وسياسة الخصوصية', 'error');
                    return;
                }
                saveDemoUser(name.value.trim(), email.value.trim());
                launchToast('تم إنشاء حسابك بنجاح 🎉', 'success');
                setTimeout(function() { window.location.href = 'user-dashboard.html'; }, 600);
            });
        }
    }

    // 5. Show logged-in demo user name in sidebar user cards
    try {
        var stored = JSON.parse(localStorage.getItem('user'));
        if (stored && stored.name) {
            document.querySelectorAll('.user-card .user-name').forEach(function(el) { el.textContent = stored.name; });
            document.querySelectorAll('.user-card .user-avatar').forEach(function(el) { el.textContent = stored.name.charAt(0); });
            var roleEl = document.querySelector('.user-card .user-role');
            if (roleEl && stored.role === 'member') roleEl.textContent = 'عضو';
        }
    } catch (err) {}

    // 6. Contact form: send through FormSubmit (static form endpoint)
    if (page === 'contact.html') {
        var contactForm = document.querySelector('.contact-form form[data-validate]');
        if (contactForm) {
            contactForm.addEventListener('submit', function(e) {
                e.preventDefault();
                var nameF = contactForm.querySelector('input[type="text"]');
                var emailF = contactForm.querySelector('input[type="email"]');
                var subjectF = contactForm.querySelector('select');
                var msgF = contactForm.querySelector('textarea');
                if (!nameF.value.trim() || !emailF.value.trim() || !subjectF.value || !msgF.value.trim()) return;
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailF.value)) return;

                var submitBtn = contactForm.querySelector('button[type="submit"]');
                var original = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';

                fetch('https://formsubmit.co/ajax/1d9sxh@mail.instinct.com', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({
                        _subject: 'رسالة من موقع كبسولة المحاسب: ' + subjectF.options[subjectF.selectedIndex].text,
                        الاسم: nameF.value.trim(),
                        البريد: emailF.value.trim(),
                        الموضوع: subjectF.options[subjectF.selectedIndex].text,
                        الرسالة: msgF.value.trim()
                    })
                }).then(function(res) {
                    if (!res.ok) throw new Error('send failed');
                    return res.json();
                }).then(function() {
                    launchToast('تم إرسال رسالتك بنجاح ✅ هنرد عليك قريب', 'success');
                    contactForm.reset();
                }).catch(function() {
                    launchToast('حصلت مشكلة في الإرسال، جرب تاني أو ابعتلنا على البريد مباشرة', 'error');
                }).finally(function() {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = original;
                });
            });
        }
    }

    // 7. Newsletter signup forms (FormSubmit, same approach as the contact form)
    // Interim recipient: the site inbox below. Flip NEWSLETTER_ENDPOINT to the owner's email once decided (needs one-time FormSubmit activation on the new address).
    var NEWSLETTER_ENDPOINT = 'https://formsubmit.co/ajax/1d9sxh@mail.instinct.com';
    document.querySelectorAll('.newsletter-form').forEach(function(newsForm) {
        newsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var emailF = newsForm.querySelector('input[type="email"]');
            var honeyF = newsForm.querySelector('input[name="_honey"]');
            if (honeyF && honeyF.value) return;
            if (!emailF.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailF.value)) {
                launchToast('اكتب إيميل صحيح الأول', 'error');
                return;
            }
            var submitBtn = newsForm.querySelector('button[type="submit"]');
            var original = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> لحظة...';

            fetch(NEWSLETTER_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    _subject: 'اشتراك جديد في نشرة كبسولة المحاسب',
                    نوع_الرسالة: 'اشتراك نشرة بريدية',
                    البريد: emailF.value.trim(),
                    الصفحة: window.location.pathname
                })
            }).then(function(res) {
                if (!res.ok) throw new Error('send failed');
                return res.json();
            }).then(function() {
                launchToast('تم الاشتراك بنجاح ✅ أهلاً بيك في الكبسولة', 'success');
                newsForm.reset();
            }).catch(function() {
                launchToast('حصلت مشكلة في الاشتراك، جرب تاني', 'error');
            }).finally(function() {
                submitBtn.disabled = false;
                submitBtn.innerHTML = original;
            });
        });
    });
});
