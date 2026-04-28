/**
 * TalentLens — script.js
 *
 * Módulos:
 *  1. Navegação (scroll + highlight)
 *  2. Scroll Reveal
 *  3. Hero (cursor glow)
 *  4. Modal (config, abertura, fechamento, submissão)
 */

'use strict';

/* ============================================================
   UTILITÁRIOS DE PERFORMANCE
   ============================================================ */

/**
 * Retorna uma versão da função `fn` que só executa após `wait`ms
 * de inatividade. Cancela chamadas intermediárias automaticamente.
 *
 * Uso: validação de campo enquanto o usuário digita.
 *
 * @param {Function} fn    Função a executar
 * @param {number}   wait  Delay em milissegundos
 * @returns {Function}
 */
function debounce(fn, wait) {
  let timer;
  return function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

/* ============================================================
   1. NAVEGAÇÃO
   ============================================================ */

const navEl = document.getElementById('main-nav');

function handleNavScroll() {
  navEl.classList.toggle('scrolled', window.scrollY > 40);
}

window.addEventListener('scroll', handleNavScroll, { passive: true });


/* ============================================================
   2. SCROLL REVEAL
   ============================================================ */

/**
 * Observa elementos .reveal e adiciona .visible quando entram na tela.
 * Também aplica delay escalonado em filhos de grids para efeito cascata.
 */
function initScrollReveal() {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));
}

/**
 * Aplica transition-delay escalonado nos filhos diretos de grids,
 * criando o efeito de entrada em cascata.
 */
function initStaggeredReveal() {
  const STAGGER_SELECTORS = [
    '.problem-grid',
    '.features-grid',
    '.pricing-grid',
    '.candidate-list',
    '.benefits-list',
  ];

  STAGGER_SELECTORS.forEach((selector) => {
    document.querySelectorAll(selector).forEach((grid) => {
      Array.from(grid.children).forEach((child, index) => {
        if (!child.style.transitionDelay) {
          child.style.transitionDelay = `${index * 0.08}s`;
        }
      });
    });
  });
}


/* ============================================================
   3. HERO — CURSOR GLOW
   ============================================================ */

function initHeroGlow() {
  const heroEl = document.querySelector('.hero');
  if (!heroEl) return;

  const glowEl = heroEl.querySelector('.hero__glow');
  if (!glowEl) return;

  // rAF flag: garante no máximo 1 escrita de estilo por frame,
  // independentemente da frequência de mousemove.
  let rafPending = false;
  let pendingX = 0;
  let pendingY = 0;

  heroEl.addEventListener('mousemove', (e) => {
    const rect = heroEl.getBoundingClientRect();
    pendingX = e.clientX - rect.left;
    pendingY = e.clientY - rect.top;

    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(() => {
        glowEl.style.left      = `${pendingX}px`;
        glowEl.style.top       = `${pendingY}px`;
        glowEl.style.transform = 'translate(-50%, -50%)';
        rafPending = false;
      });
    }
  }, { passive: true });
}


/* ============================================================
   4. MODAL DE WAITLIST
   ============================================================ */

/**
 * Configurações de conteúdo por contexto.
 * Cada chave corresponde a um "modo" de abertura do modal.
 */
const MODAL_CONFIGS = {
  Starter: {
    tag:      '◆ Lista de Interesse',
    title:    'Você chegou cedo.<br><em>Guarde seu lugar.</em>',
    subtitle: 'O TalentLens ainda está sendo construído. Registre seu interesse e seja avisado assim que abrirmos o acesso.',
    badge:    'Interesse registrado',
    btnLabel: 'Entrar na lista →',
  },
  Growth: {
    tag:      '◆ Acesso Antecipado',
    title:    'Você chegou cedo.<br><em>Guarde seu lugar.</em>',
    subtitle: 'Estamos validando o TalentLens com os primeiros interessados. Deixe seus dados e seja um dos primeiros a testar quando lançarmos.',
    badge:    'Interesse registrado',
    btnLabel: 'Quero testar primeiro →',
  },
  Enterprise: {
    tag:      '◆ Contato Direto',
    title:    'Vamos conversar<br><em>sobre o seu contexto.</em>',
    subtitle: 'Para operações com alto volume. Deixe seus dados e nosso time entrará em contato antes mesmo do lançamento.',
    badge:    'Interesse registrado',
    btnLabel: 'Entrar em contato →',
  },
  demo: {
    tag:      '◆ Como Vai Funcionar',
    title:    'Veja o que estamos<br><em>construindo.</em>',
    subtitle: 'Registre seu interesse e receba uma prévia do TalentLens quando abrirmos o acesso para os primeiros usuários.',
    badge:    null,
    btnLabel: 'Quero ver como funciona →',
  },
  login: {
    tag:      '◆ Acesso à Plataforma',
    title:    'Ainda não temos<br><em>login disponível.</em>',
    subtitle: 'Estamos em fase inicial. Deixe seu e-mail e avisaremos assim que o acesso estiver disponível.',
    badge:    null,
    btnLabel: 'Quero ser avisado →',
  },
};

/* ── Referências DOM — resolvidas uma única vez ── */
const modal = {
  overlay:       document.getElementById('waitlist-modal'),
  closeBtn:      document.getElementById('modal-close-btn'),
  // form state
  formState:     document.getElementById('modal-form-state'),
  tagText:       document.getElementById('modal-tag-text'),
  title:         document.getElementById('modal-title'),
  subtitle:      document.getElementById('modal-subtitle'),
  planBadge:     document.getElementById('modal-plan-badge'),
  nameInput:     document.getElementById('modal-name'),
  emailInput:    document.getElementById('modal-email'),
  companyInput:   document.getElementById('modal-company'),
  feedbackToggle: document.getElementById('modal-feedback-toggle'),
  feedbackInput:  document.getElementById('modal-feedback'),
  errorMsg:       document.getElementById('modal-error'),
  submitBtn:     document.getElementById('modal-submit-btn'),
  submitLabel:   document.querySelector('#modal-submit-btn .modal-submit__label'),
  // success state
  successState:  document.getElementById('modal-success-state'),
  successPos:    document.getElementById('modal-success-position'),
  // network error state
  networkError:  document.getElementById('modal-network-error'),
  retryBtn:      document.getElementById('modal-retry-btn'),
};

/** Plano/contexto ativo. Persiste entre tentativas de envio. */
let activePlan  = 'Growth';

/** Contador simulado de pessoas na lista (incrementa a cada abertura). */
let waitlistCount = 342;

/* ──────────────────────────────────────────────
   FUNÇÕES PÚBLICAS (expostas no window)
   ────────────────────────────────────────────── */

/**
 * Abre o modal configurado para o contexto informado.
 * @param {string} plan  Chave de MODAL_CONFIGS
 */
function openModal(plan) {
  activePlan = plan;
  const cfg  = MODAL_CONFIGS[plan] || MODAL_CONFIGS.Growth;

  // Popula conteúdo dinâmico do formulário
  modal.tagText.innerHTML         = cfg.tag;
  modal.title.innerHTML           = cfg.title;
  modal.subtitle.textContent      = cfg.subtitle;
  modal.submitLabel.textContent   = cfg.btnLabel;

  // Badge do plano selecionado
  if (cfg.badge) {
    modal.planBadge.textContent = cfg.badge;
    modal.planBadge.classList.add('is-visible');
  } else {
    modal.planBadge.classList.remove('is-visible');
  }

  resetModal();

  modal.overlay.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => modal.nameInput.focus(), 120);
}

/**
 * Fecha o modal e restaura o scroll da página.
 */
function closeModal() {
  modal.overlay.classList.remove('is-open');
  document.body.style.overflow = '';
}

/**
 * Ação do CTA "Ver como funciona →" no estado de sucesso.
 * Fecha o modal e rola suavemente para a seção #how.
 */
function handleSuccessCTA() {
  closeModal();
  const target = document.getElementById('how');
  if (target) {
    setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
  }
}

// Expõe globalmente (usados via onclick no HTML)
window.openModal       = openModal;
window.closeModal      = closeModal;
window.handleSuccessCTA = handleSuccessCTA;


/* ──────────────────────────────────────────────
   FUNÇÕES INTERNAS
   ────────────────────────────────────────────── */

/**
 * Reseta todos os estados do modal para o inicial (formulário limpo).
 */
function resetModal() {
  // Mostra formulário
  modal.formState.classList.remove('is-hiding');
  modal.formState.style.display = 'block';

  // Esconde sucesso e erro de rede
  modal.successState.classList.remove('is-visible');
  modal.networkError.classList.remove('is-visible');

  // Limpa campos e erros
  modal.nameInput.value    = '';
  modal.emailInput.value   = '';
  modal.companyInput.value = '';
  modal.feedbackInput.value = '';
  modal.feedbackInput.classList.remove('is-open');
  modal.feedbackToggle.setAttribute('aria-expanded', 'false');
  clearFieldError();

  // Restaura botão
  setSubmitIdle();
}

/**
 * Valida o formato do e-mail.
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Exibe erro no campo de e-mail. */
function showFieldError(message) {
  modal.emailInput.classList.add('has-error');
  modal.errorMsg.textContent = message;
  modal.errorMsg.classList.add('is-visible');
}

/** Limpa erro do campo de e-mail. */
function clearFieldError() {
  modal.emailInput.classList.remove('has-error');
  modal.errorMsg.classList.remove('is-visible');
  modal.errorMsg.textContent = '';
}

/** Coloca o botão em estado de loading. */
function setSubmitLoading() {
  modal.submitBtn.disabled = true;
  modal.submitBtn.classList.add('is-loading');
  modal.submitBtn.setAttribute('aria-busy', 'true');
}

/** Restaura o botão ao estado normal. */
function setSubmitIdle() {
  modal.submitBtn.disabled = false;
  modal.submitBtn.classList.remove('is-loading');
  modal.submitBtn.removeAttribute('aria-busy');
  const cfg = MODAL_CONFIGS[activePlan] || MODAL_CONFIGS.Growth;
  modal.submitLabel.textContent = cfg.btnLabel;
}

/**
 * Transição de formulário → estado de sucesso.
 * Usa fade-out do form antes de exibir o sucesso.
 */
function showSuccess() {
  waitlistCount += 1;

  // Fade-out do formulário
  modal.formState.classList.add('is-hiding');

  setTimeout(() => {
    modal.formState.style.display = 'none';
    modal.formState.classList.remove('is-hiding');

    // Atualiza posição na lista
    if (modal.successPos) {
      modal.successPos.textContent = `Você é a pessoa nº ${waitlistCount} na lista`;
    }

    // Exibe sucesso com animação
    modal.successState.classList.add('is-visible');
  }, 260);
}

/**
 * Exibe o estado de erro de rede.
 */
function showNetworkError() {
  modal.formState.classList.add('is-hiding');

  setTimeout(() => {
    modal.formState.style.display = 'none';
    modal.formState.classList.remove('is-hiding');
    modal.networkError.classList.add('is-visible');
  }, 260);
}

/* ──────────────────────────────────────────────
   SUPABASE — configuração
   ────────────────────────────────────────────── */

const SUPABASE_URL = 'https://lvuxstpmbumxqolvamlo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2dXhzdHBtYnVteHFvbHZhbWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5ODg5MzgsImV4cCI6MjA5MDU2NDkzOH0.NHbuNI2yZzKeEPNqAEblPt2nxnUN307cUQTHNA7rIco'; // Project Settings → API → anon public (começa com eyJ...)

/**
 * Instância do cliente Supabase.
 * O SDK é carregado via CDN (supabase-js UMD) e expõe `window.supabase`.
 * A guard garante que o script não quebre caso o CDN falhe.
 */
const supabaseClient = (typeof window.supabase !== 'undefined')
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;


/**
 * Envia os dados do lead para a tabela "leads" no Supabase.
 *
 * Campos gravados:
 *   name     → nome completo
 *   email    → e-mail (único por registro)
 *   company  → empresa
 *   plan     → plano selecionado (Starter | Growth | Enterprise | demo | login)
 *   origin   → URL da página que originou o lead
 *   created_at → preenchido automaticamente pelo Supabase (default: now())
 *
 * @param {{ name: string, email: string, company: string, plan: string }} data
 * @returns {Promise<void>}  Resolve se salvo com sucesso, rejeita com Error em qualquer falha.
 */
async function submitToAPI(data) {
  // Fallback: se o CDN do Supabase não carregou, lança erro imediatamente
  if (!supabaseClient) {
    throw new Error('Supabase SDK não disponível.');
  }

  const { error } = await supabaseClient
    .from('leads')
    .insert([
      {
        name:     data.name     || null,
        email:    data.email,
        company:  data.company  || null,
        plan:     data.plan,
        feedback: data.feedback || null,
      },
    ]);

  // Supabase retorna { data, error } — lança o erro para o .catch() do caller
  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Handler principal do formulário.
 * Valida → loading → chama API → sucesso ou erro.
 */
function handleModalSubmit() {
  const email    = modal.emailInput.value.trim();
  const name     = modal.nameInput.value.trim();
  const company  = modal.companyInput.value.trim();
  const feedback = modal.feedbackInput.value.trim();

  // Validação de e-mail
  if (!email) {
    showFieldError('O e-mail é obrigatório.');
    modal.emailInput.focus();
    return;
  }

  if (!isValidEmail(email)) {
    showFieldError('Por favor, insira um e-mail válido.');
    modal.emailInput.focus();
    return;
  }

  clearFieldError();
  setSubmitLoading();

  submitToAPI({ name, email, company, feedback, plan: activePlan })
    .then(() => {
      showSuccess();
    })
    .catch(() => {
      setSubmitIdle();
      showNetworkError();
    });
}

/**
 * Volta do estado de erro de rede para o formulário.
 */
function retryFromNetworkError() {
  modal.networkError.classList.remove('is-visible');
  modal.formState.style.display = 'block';
  setTimeout(() => modal.emailInput.focus(), 80);
}


/* ──────────────────────────────────────────────
   EVENTOS DO MODAL
   ────────────────────────────────────────────── */

function initModalEvents() {
  // Fechar
  modal.closeBtn.addEventListener('click', closeModal);

  modal.overlay.addEventListener('click', (e) => {
    if (e.target === modal.overlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.overlay.classList.contains('is-open')) {
      closeModal();
    }
  });

  // Toggle de feedback
  modal.feedbackToggle.addEventListener('click', () => {
    const isOpen = modal.feedbackInput.classList.toggle('is-open');
    modal.feedbackToggle.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) modal.feedbackInput.focus();
  });

  // Enviar
  modal.submitBtn.addEventListener('click', handleModalSubmit);

  // Enviar via Enter (apenas quando foco está dentro do formulário)
  modal.formState.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !modal.submitBtn.disabled) {
      e.preventDefault();
      handleModalSubmit();
    }
  });

  // Tentar novamente após erro de rede
  modal.retryBtn.addEventListener('click', retryFromNetworkError);

  // ── Limpeza de erro no campo de e-mail ──────────────────────
  //
  // Estratégia em duas camadas:
  //
  // 1. blur (sem debounce): limpa imediatamente ao sair do campo.
  //    Cobre o caso mais comum — usuário digita, erra, corrige e
  //    clica em outro campo. Zero delay, zero overhead.
  //
  // 2. input + debounce 300ms: limpa enquanto o usuário ainda está
  //    digitando, mas só após 300ms de inatividade. Evita limpezas
  //    a cada tecla e mantém o feedback responsivo.
  //    Só executa se o campo realmente tem o estado de erro ativo,
  //    evitando qualquer toque desnecessário no DOM.
  //
  modal.emailInput.addEventListener('blur', () => {
    if (modal.emailInput.classList.contains('has-error')) {
      clearFieldError();
    }
  });

  const debouncedClearError = debounce(() => {
    if (modal.emailInput.classList.contains('has-error')) {
      clearFieldError();
    }
  }, 300);

  modal.emailInput.addEventListener('input', debouncedClearError);
}


/* ============================================================
   INICIALIZAÇÃO
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  handleNavScroll();       // estado inicial da nav
  initScrollReveal();      // observer de .reveal
  initStaggeredReveal();   // delays em cascata nos grids
  initHeroGlow();          // glow que segue o cursor no hero
  initModalEvents();       // eventos do modal de waitlist
});
