(function() {
    // 1. Header scroll effect
    const header = document.querySelector('header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // 2. Navigation Active State Highlighter
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-links a');
    let hasActiveDropdownItem = false;
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (linkPath === currentPath) {
            link.classList.add('active');
            if (link.closest('.dropdown-menu')) {
                hasActiveDropdownItem = true;
            }
        } else {
            link.classList.remove('active');
        }
    });
    if (hasActiveDropdownItem) {
        const dropdownTrigger = document.querySelector('.dropdown-trigger');
        if (dropdownTrigger) dropdownTrigger.classList.add('active');
    }

    // 3. Scroll Reveal Animations (Intersection Observer)
    const fadeElems = document.querySelectorAll('.fade-in-up');
    if ('IntersectionObserver' in window && fadeElems.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
        
        fadeElems.forEach(el => observer.observe(el));
    } else {
        // Fallback if IntersectionObserver is not supported
        fadeElems.forEach(el => el.classList.add('in-view'));
    }

    // 4. Modal Accessible Setup
    const openBtn = document.getElementById('openBookingModal');
    const backdrop = document.getElementById('bookingModalBackdrop');
    const closeBtn = document.getElementById('modalCloseBtn');
    const inlineTrigger = document.getElementById('openInlineForm');
    const formWrap = document.getElementById('modalFormWrap');
    const modalForm = document.getElementById('modalBookingForm');
    const formMsg = document.getElementById('modalFormMsg');
    let lastFocused = null;

    if (backdrop) {
        function openModal() {
            lastFocused = document.activeElement;
            backdrop.classList.add('open');
            backdrop.setAttribute('aria-hidden', 'false');
            
            const first = backdrop.querySelector('a, button, input, [tabindex="0"]');
            if (first) first.focus();
            
            document.addEventListener('keydown', handleKeydown);
            document.body.style.overflow = 'hidden'; // prevent page scroll
        }

        function closeModal() {
            backdrop.classList.remove('open');
            backdrop.setAttribute('aria-hidden', 'true');
            document.removeEventListener('keydown', handleKeydown);
            document.body.style.overflow = ''; // restore scroll
            
            if (lastFocused) lastFocused.focus();
            if (formWrap) formWrap.style.display = 'none';
            if (formMsg) {
                formMsg.style.display = 'none';
                formMsg.textContent = '';
            }
        }

        function handleKeydown(e) {
            if (e.key === 'Escape') closeModal();
            
            // Tab key trapping
            if (e.key === 'Tab') {
                const focusables = backdrop.querySelectorAll('a[href], button:not([disabled]), textarea, input, [tabindex]:not([tabindex="-1"])');
                if (focusables.length === 0) return;
                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }

        if (openBtn) openBtn.addEventListener('click', openModal);
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) closeModal();
        });

        if (inlineTrigger && formWrap) {
            inlineTrigger.addEventListener('click', () => {
                const isHidden = formWrap.style.display === 'none' || !formWrap.style.display;
                formWrap.style.display = isHidden ? 'block' : 'none';
                if (isHidden) {
                    const firstInput = formWrap.querySelector('input');
                    if (firstInput) firstInput.focus();
                }
            });
        }
    }

    // 5. AJAX Form Handler (Unified submission for Make.com webhook)
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn ? submitBtn.textContent : 'Submit';
            
            // Create inline message element if it doesn't exist
            let msgEl = form.nextElementSibling;
            if (!msgEl || !msgEl.classList.contains('form-response-msg')) {
                msgEl = document.createElement('div');
                msgEl.className = 'form-response-msg';
                msgEl.style.marginTop = '1rem';
                msgEl.style.fontWeight = '600';
                msgEl.style.fontSize = '0.95rem';
                form.parentNode.insertBefore(msgEl, form.nextSibling);
            }

            // Input Trimming and Email Format Validation
            const nameInput = form.querySelector('input[name="name"]');
            const emailInput = form.querySelector('input[name="email"]');
            const phoneInput = form.querySelector('input[name="phone"]');

            if (nameInput) nameInput.value = nameInput.value.trim();
            if (phoneInput) phoneInput.value = phoneInput.value.trim();

            if (emailInput) {
                const emailVal = emailInput.value.trim();
                emailInput.value = emailVal;
                
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(emailVal)) {
                    msgEl.style.display = 'block';
                    msgEl.style.color = '#EF4444';
                    msgEl.textContent = 'Please enter a valid email address (e.g., yourname@example.com).';
                    return;
                }
            }
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Sending request...';
            }

            msgEl.style.display = 'block';
            msgEl.style.color = 'var(--primary)';
            msgEl.textContent = 'Submitting your request...';

            try {
                const formData = new FormData(form);
                const urlEncodedData = new URLSearchParams(formData).toString();

                const response = await fetch(form.action, {
                    method: 'POST',
                    body: urlEncodedData,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    msgEl.style.color = '#10B981'; // green success
                    msgEl.textContent = 'Thank you! Your request was received successfully. We will reach out to you shortly.';
                    form.reset();
                    
                    // If in modal, auto-close after 2.5s
                    if (form.id === 'modalBookingForm') {
                        setTimeout(() => {
                            closeModal();
                        }, 2500);
                    }
                } else {
                    msgEl.style.color = '#EF4444'; // red error
                    msgEl.textContent = 'Oops! We ran into a booking issue. Please try contacting us directly via WhatsApp or Call.';
                }
            } catch (err) {
                msgEl.style.color = '#EF4444';
                msgEl.textContent = 'Network error. Please check your internet connection and try again, or chat with us on WhatsApp.';
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            }
        });
    });

    // 6. Smooth anchor scrolling (if needed)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
})();
