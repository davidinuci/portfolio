// Mobile nav toggle
const burger = document.querySelector('.nav__burger');
const navLinks = document.querySelector('.nav__links');

burger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

// Close nav on link click
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
  });
});

// Contact form
// To enable real email delivery: set FORMSPREE to true and paste your endpoint
const FORMSPREE = false;
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.contact__form');
  if (form) form.style.display = FORMSPREE ? '' : 'none';
});

function handleSubmit(e) {
  e.preventDefault();
  const success = document.getElementById('form-success');

  if (FORMSPREE) {
    fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      body: new FormData(e.target),
      headers: { Accept: 'application/json' },
    }).then(res => {
      if (res.ok) {
        success.classList.add('visible');
        e.target.reset();
        setTimeout(() => success.classList.remove('visible'), 5000);
      }
    });
  } else {
    success.classList.add('visible');
    e.target.reset();
    setTimeout(() => success.classList.remove('visible'), 5000);
  }
}

// Scroll-in animation
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.values__card, .project-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.values__card, .project-card').forEach((el, i) => {
    el.style.transitionDelay = `${i * 0.08}s`;
  });
});

// Lightbox for case study images
(function () {
  const overlay = document.createElement('div');
  overlay.className = 'lightbox';
  overlay.innerHTML = '<button class="lightbox__close" aria-label="Close">&times;</button><img class="lightbox__img" />';
  document.body.appendChild(overlay);

  const lightboxImg = overlay.querySelector('.lightbox__img');

  function open(src, alt) {
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.addEventListener('click', (e) => {
    const img = e.target.closest('.cs-figure img');
    if (img) open(img.src, img.alt);
  });

  overlay.querySelector('.lightbox__close').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay || e.target === lightboxImg) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
})();

// Add visible class styles via JS
const style = document.createElement('style');
style.textContent = '.values__card.visible, .project-card.visible { opacity: 1 !important; transform: translateY(0) !important; }';
document.head.appendChild(style);
