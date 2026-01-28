(() => {
  if (window.__dynamicIslandInjected) return;
  window.__dynamicIslandInjected = true;

  const MOVE_THRESHOLD = 12;
  const GHOST_MAX_LENGTH = 150;

  let startX = 0;
  let startY = 0;
  let isDraggingSelection = false;
  let islandVisible = false;
  let hoveredApp = null;
  let capturedText = '';

  // Auto-scroll state
  let autoScrollDirection = 0; // -1 left, 0 none, 1 right
  let scrollFrameId = null;

  function scrollLoop() {
    if (autoScrollDirection === 0) {
      if (scrollFrameId) {
        cancelAnimationFrame(scrollFrameId);
        scrollFrameId = null;
      }
      return;
    }
    // Speed 4px per frame (approx 240px/sec at 60fps)
    island.scrollLeft += autoScrollDirection * 4;
    scrollFrameId = requestAnimationFrame(scrollLoop);
  }

  /* ---------- GEMINI AUTOFILL INTEGRATION ---------- */
  if (window.location.hostname.includes('gemini.google.com')) {
    chrome.storage.local.get(['pendingGeminiPrompt'], (result) => {
      const prompt = result.pendingGeminiPrompt;
      if (prompt) {
        const interval = setInterval(() => {
          const input = document.querySelector('div[contenteditable="true"]');
          if (input) {
            clearInterval(interval);
            input.focus();
            input.textContent = prompt;
            if (input.dataset.placeholder || input.getAttribute('role') === 'textbox') {
              input.innerHTML = `<p>${prompt}</p>`;
            }
            input.dispatchEvent(new Event('input', { bubbles: true }));
            chrome.storage.local.remove('pendingGeminiPrompt');
          }
        }, 500);
        setTimeout(() => clearInterval(interval), 15000);
      }
    });
  }

  /* ---------- NOTION NOTE CREATION ---------- */
  if (window.location.hostname.includes('notion.so')) {
    chrome.storage.local.get(['pendingNotionNote'], (result) => {
      const noteText = result.pendingNotionNote;
      if (noteText) {
        const interval = setInterval(() => {
          const focused = document.activeElement;
          const isEditor = focused && focused.getAttribute('contenteditable') === 'true';
          const titleEditor = document.querySelector('div[placeholder="Untitled"]');

          if (isEditor || titleEditor) {
            clearInterval(interval);
            if (titleEditor) titleEditor.focus();
            else if (isEditor) focused.focus();

            document.execCommand('insertText', false, noteText);
            chrome.storage.local.remove('pendingNotionNote');
          }
        }, 500);
        setTimeout(() => clearInterval(interval), 15000);
      }
    });
  }

  /* ---------- TELEGRAM LANDING PAGE AUTO-CLICK ---------- */
  if (window.location.hostname === 't.me' || window.location.hostname === 'telegram.me') {
    const clickWeb = () => {
      const webBtn = document.querySelector('a.tgme_action_web_button') ||
        Array.from(document.querySelectorAll('button, a')).find(el => el.textContent && el.textContent.toUpperCase().includes('OPEN IN WEB'));
      if (webBtn) webBtn.click();
    };
    // Try immediately and shortly after load
    setTimeout(clickWeb, 100);
    window.addEventListener('load', () => setTimeout(clickWeb, 100));
  }

  /* ---------- STORAGE / REMOTE TOAST ---------- */
  const checkForPendingToast = () => {
    chrome.storage.local.get(['dynamic_island_toast'], (result) => {
      const data = result.dynamic_island_toast;
      if (data && Date.now() - data.timestamp < 10000) {
        setTimeout(showToast, 500);

        // KEEP: Auto-Expand Note Input for immediate pasting
        if (window.location.hostname.includes('keep.google.com')) {
          const expandInterval = setInterval(() => {
            let input = document.querySelector('div[aria-label="Take a note..."]');
            if (!input) {
              const divs = document.querySelectorAll('div');
              for (let i = 0; i < divs.length; i++) {
                if (divs[i].textContent === 'Take a note...') {
                  input = divs[i];
                  break;
                }
              }
            }

            if (input) {
              input.click(); // Expand
              clearInterval(expandInterval);
              setTimeout(() => {
                // Focus the Body (usually the last contenteditable)
                const editors = document.querySelectorAll('div[contenteditable="true"]');
                if (editors.length > 0) editors[editors.length - 1].focus();
              }, 300);
            }
          }, 500);
          setTimeout(() => clearInterval(expandInterval), 5000);
        }

        chrome.storage.local.remove('dynamic_island_toast');
      }
    });
  };

  /* ---------- SIDEBAR OVERLAY ---------- */
  let sidebarIframe = null;

  const toggleSidebar = () => {
    if (sidebarIframe) {
      const isHidden = sidebarIframe.style.transform.includes('100%');
      sidebarIframe.style.transform = isHidden ? 'translateX(0)' : 'translateX(100%)';
      return;
    }

    sidebarIframe = document.createElement('iframe');
    sidebarIframe.className = 'dynamic-island-sidebar';
    sidebarIframe.src = chrome.runtime.getURL('settings/index.html');
    document.body.appendChild(sidebarIframe);

    requestAnimationFrame(() => {
      sidebarIframe.classList.add('visible');
    });
  };

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggle_sidebar') {
      toggleSidebar();
    }
  });

  window.addEventListener('message', (event) => {
    if (event.data.action === 'close_sidebar' && sidebarIframe) {
      sidebarIframe.style.transform = 'translateX(100%)';
    }
  });

  /* ---------- APPLY SETTINGS ---------- */
  const applySettings = () => {
    chrome.storage.sync.get(['theme', 'iconShape', 'islandSize', 'appStyle', 'showLabels'], (settings) => {
      const island = document.querySelector('.dynamic-island');
      if (!island) return;

      if (settings.theme === 'light') {
        island.classList.add('light-mode');
      } else {
        island.classList.remove('light-mode');
      }

      const icons = island.querySelectorAll('.dynamic-island__icon');
      icons.forEach(icon => {
        icon.style.borderRadius =
          settings.iconShape === 'square' ? '0px' :
            settings.iconShape === 'rounded' ? '8px' : '50%';
      });

      island.style.transform = 'translateX(-50%)';

      if (settings.islandSize === 'small') {
        island.style.width = '248px';
      } else if (settings.islandSize === 'large') {
        island.style.width = '540px';
      } else {
        island.style.width = '355px';
      }
      island.style.justifyContent = 'space-evenly';

      if (settings.showLabels) {
        island.classList.add('show-labels');
      } else {
        island.classList.remove('show-labels');
      }

      // Apply app style
      island.classList.remove('style-default', 'style-colorful', 'style-pastel', 'style-tinted', 'style-minimal');
      const appStyle = settings.appStyle || 'default';
      island.classList.add(`style-${appStyle}`);
    });
  };

  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') applySettings();
  });

  /* ---------- RUN ON LOAD ---------- */
  checkForPendingToast();
  setTimeout(applySettings, 100);

  /* ---------- DRAG GHOST ---------- */
  const dragGhost = document.createElement('div');
  dragGhost.className = 'dynamic-island-ghost';
  document.documentElement.appendChild(dragGhost);

  /* ---------- TOAST POPUP ---------- */
  const toast = document.createElement('div');
  toast.className = 'dynamic-island-toast';
  toast.innerHTML = '📋 Copied! Press <kbd>Ctrl+V</kbd> to paste';
  document.documentElement.appendChild(toast);

  let toastTimeout = null;
  const showToast = () => {
    toast.classList.add('visible');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('visible');
    }, 4000);
  };

  /* ---------- APPS ---------- */
  const apps = [
    { id: 'chatgpt', name: 'ChatGPT', icon: 'assets/icons/openai-svgrepo-com.svg' },
    { id: 'gemini', name: 'Gemini', icon: 'assets/icons/google-gemini-icon.svg' },
    { id: 'drive', name: 'Drive', icon: 'assets/icons/google-drive-svgrepo-com.svg' },
    { id: 'mail', name: 'Mail', icon: 'assets/icons/google-mail-svgrepo-com.svg' },
    { id: 'translate', name: 'Translate', icon: 'assets/icons/google-translate-svgrepo-com.svg' },
    { id: 'search', name: 'Search', icon: 'assets/icons/search-4-svgrepo-com.svg' },
    { id: 'telegram', name: 'Telegram', icon: 'assets/icons/telegram-svgrepo-com.svg' },
    { id: 'whatsapp', name: 'WhatsApp', icon: 'assets/icons/whatsapp-svgrepo-com.svg' },
    { id: 'notion', name: 'Notion', icon: 'assets/icons/notion-svgrepo-com.svg' },
    { id: 'keep', name: 'Keep', icon: 'assets/icons/google-keep.svg' }
  ];

  /* ---------- ISLAND ---------- */
  const island = document.createElement('div');
  island.className = 'dynamic-island';

  apps.forEach(app => {
    const wrapper = document.createElement('div');
    wrapper.className = 'dynamic-island__app-wrapper';

    const icon = document.createElement('div');
    icon.className = 'dynamic-island__icon';
    icon.dataset.app = app.id;

    const img = document.createElement('img');
    img.src = chrome.runtime.getURL(app.icon);
    img.alt = app.id;

    icon.appendChild(img);
    wrapper.appendChild(icon);

    const label = document.createElement('div');
    label.className = 'dynamic-island__label';
    label.textContent = app.name;
    wrapper.appendChild(label);

    island.appendChild(wrapper);
  });
  document.documentElement.appendChild(island);

  /* ---------- LOGIC ---------- */
  const showIsland = () => {
    island.classList.add('visible');
    islandVisible = true;
    island.scrollLeft = 0;
  };

  const hideIsland = () => {
    island.classList.remove('visible');
    islandVisible = false;
    hoveredApp = null;
    autoScrollDirection = 0;
  };

  const showGhost = (text, x, y) => {
    const display = text.length > GHOST_MAX_LENGTH ? text.substring(0, GHOST_MAX_LENGTH) + '...' : text;
    dragGhost.textContent = display;
    dragGhost.style.left = `${x + 15}px`;
    dragGhost.style.top = `${y + 15}px`;
    dragGhost.classList.add('visible');
  };

  const hideGhost = () => dragGhost.classList.remove('visible');

  const updateGhostPosition = (x, y) => {
    dragGhost.style.left = `${x + 15}px`;
    dragGhost.style.top = `${y + 15}px`;
  };

  function updateHover(x, y) {
    hoveredApp = null;

    // Auto-scroll logic if dragging
    if (islandVisible) {
      const iRect = island.getBoundingClientRect();
      const edge = 60;

      if (x > iRect.right - edge && x < iRect.right + 20) {
        if (autoScrollDirection !== 1) {
          autoScrollDirection = 1;
          if (!scrollFrameId) scrollLoop();
        }
      } else if (x < iRect.left + edge && x > iRect.left - 20) {
        if (autoScrollDirection !== -1) {
          autoScrollDirection = -1;
          if (!scrollFrameId) scrollLoop();
        }
      } else {
        autoScrollDirection = 0;
      }
    } else {
      autoScrollDirection = 0;
    }

    island.querySelectorAll('.dynamic-island__icon').forEach(icon => {
      const r = icon.getBoundingClientRect();
      const hover =
        x >= r.left && x <= r.right &&
        y >= r.top && y <= r.bottom;

      icon.classList.toggle('hover', hover);
      if (hover) hoveredApp = icon.dataset.app;
    });
  }

  function openApp(app, text) {
    const q = encodeURIComponent(text);

    if (app === 'chatgpt')
      window.open(`https://chat.openai.com/?q=${q}`, '_blank');

    if (app === 'gemini') {
      chrome.storage.local.set({ pendingGeminiPrompt: text }, () => {
        window.open('https://gemini.google.com/app', '_blank');
      });
    }

    if (app === 'drive') {
      // User wants New Doc + Paste Popup
      navigator.clipboard.writeText(text).catch(() => { });
      chrome.storage.local.set({ dynamic_island_toast: { timestamp: Date.now() } }, () => {
        window.open('https://docs.new', '_blank');
      });
    }

    if (app === 'search')
      window.open(`https://www.google.com/search?q=${q}`, '_blank');

    if (app === 'translate')
      window.open(`https://translate.google.com/?text=${q}`, '_blank');

    // Direct Web Links
    // Telegram: Try Version Z (might support params better than A or K)
    const tgLink = encodeURIComponent(`tg://msg?text=${q}`);
    if (app === 'telegram') window.open(`https://web.telegram.org/z/#?tgaddr=${tgLink}`, '_blank');

    // WhatsApp: Keep Direct Web (works fine)
    if (app === 'whatsapp') window.open(`https://web.whatsapp.com/send?text=${q}`, '_blank');

    // Notion - Create New Page
    if (app === 'notion') {
      chrome.storage.local.set({ pendingNotionNote: text }, () => {
        window.open('https://notion.new', '_blank');
      });
    }

    // Keep - Manual Paste (Clipboard + Toast)
    if (app === 'keep') {
      navigator.clipboard.writeText(text).catch(() => { });
      chrome.storage.local.set({ dynamic_island_toast: { timestamp: Date.now() } }, () => {
        window.open('https://keep.google.com/', '_blank');
      });
    }

    if (app === 'mail')
      window.open(`https://mail.google.com/mail/?view=cm&fs=1&body=${q}`, '_blank');

    // Hide after action
    hideIsland();
  }

  function isClickInsideSelection(x, y, selection) {
    if (!selection || selection.rangeCount === 0) return false;
    const rects = selection.getRangeAt(0).getClientRects();
    return [...rects].some(r =>
      x >= r.left && x <= r.right &&
      y >= r.top && y <= r.bottom
    );
  }

  /* ---------- MOUSE DOWN ---------- */
  document.addEventListener('mousedown', e => {
    if (e.button !== 0) return;

    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;

    const text = sel.toString().trim();
    if (!text || !isClickInsideSelection(e.clientX, e.clientY, sel)) return;

    isDraggingSelection = true;
    capturedText = text;
    startX = e.clientX;
    startY = e.clientY;

    e.preventDefault();
  }, true);

  /* ---------- MOUSE MOVE ---------- */
  document.addEventListener('mousemove', e => {
    if (!isDraggingSelection || e.buttons !== 1) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (!islandVisible && Math.hypot(dx, dy) > MOVE_THRESHOLD) {
      showIsland();
      showGhost(capturedText, e.clientX, e.clientY);
    }

    if (islandVisible) {
      updateHover(e.clientX, e.clientY);
      updateGhostPosition(e.clientX, e.clientY);
    }
  }, true);

  /* ---------- MOUSE UP ---------- */
  document.addEventListener('mouseup', () => {
    if (islandVisible && hoveredApp && capturedText) {
      openApp(hoveredApp, capturedText);
    }

    isDraggingSelection = false;
    capturedText = '';
    hideIsland();
    hideGhost();
  }, true);

  /* ---------- ESC ---------- */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      isDraggingSelection = false;
      capturedText = '';
      hideIsland();
      hideGhost();
    }
  });
})();
