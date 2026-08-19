import { $, $$, $el, $find, $html, $style, sleep } from '../common.js';
/* cSpell:ignore exhentai juicyads favcat searchnav favform */

/** @type {{abg: boolean, mt: boolean, pe: boolean, fw: boolean}} */
const uhpConfig = (() => {
  const _conf = Object.assign({ abg: true, mt: true, pe: true, fw: false }, GM_getValue('uhp'));
  GM_setValue('uhp', _conf);

  return new Proxy(_conf, {
    set(target, propertyKey, value) {
      const r = Reflect.set(target, propertyKey, value);
      GM_setValue('uhp', _conf);
      return r;
    },
  });
})();

// #region Ads-Be-Gone
if (uhpConfig.abg) {
  $style('iframe[src*="juicyads"] { display:none !important; }');
}
// #endregion Ads-Be-Gone

// #region More Thumbs
if (uhpConfig.mt) {
  (async () => {
    const u = new URL(location);
    if (!location.pathname.startsWith('/g/')) { return; }
    if (u.searchParams.get('report') === 'select') { return; }
    if (u.searchParams.get('act') === 'expunge') { return; }

    const NEXT_PAGE_SELECTOR = '.ptt td:last-child > a';
    const IMAGE_PARENT_SELECTOR = '#gdt';

    const imgParentEl = $(IMAGE_PARENT_SELECTOR);
    if (!imgParentEl) { return console.error('No imgParentEl'); }

    const paginationEl = $('table.ptb');
    const commentsAnchorEl = $('a[name="comments"]');
    if (!paginationEl) { return console.error('No paginationEl'); }
    if (!commentsAnchorEl) { return console.error('No commentsAnchorEl'); }

    const initialNextEl = $(NEXT_PAGE_SELECTOR);
    const initialNextUrl = initialNextEl?.href ?? '';

    const commentCount = $$('#cdiv > .c1').length;
    const moreThumbsControlsEl = $el('div', {
      className: (location.host === 'exhentai.org') ? 'dark' : '',
      id: '🔓-more-thumbs-controls',
    });
    moreThumbsControlsEl.innerHTML = `
      <span id="🔓-more-thumbs-status" aria-live="polite"></span>
      <button id="🔓-view-comments" type="button">
        Comments${commentCount ? ` (${commentCount})` : ''} ↓
      </button>
      <button id="🔓-resume-thumbs" type="button" hidden>Resume thumbs ↑</button>
    `;
    document.body.appendChild(moreThumbsControlsEl);

    const statusEl = $('#🔓-more-thumbs-status');
    const viewCommentsEl = $('#🔓-view-comments');
    const resumeThumbsEl = $('#🔓-resume-thumbs');

    const isCommentHash = (hash) => (
      hash === '#comments'
      || hash === '#ulcomment'
      || /^#c\d+$/.test(hash)
    );
    const getCommentHashTarget = () => {
      const name = location.hash.slice(1);
      return document.getElementById(name)
        ?? document.getElementsByName(name)[0]
        ?? commentsAnchorEl;
    };
    const getThumbCount = () => Array.from(imgParentEl.children)
      .filter((imgEl) => !imgEl.classList.contains('c'))
      .length;

    let isPaused = isCommentHash(location.hash);
    let hasMore = Boolean(initialNextUrl);
    let isIntersecting = false;
    let isLoading = false;
    let loadFailed = false;
    let navigationIntent = 0;
    let currentLoadPromise = Promise.resolve();
    let ob;

    const updateControls = () => {
      if (loadFailed) {
        moreThumbsControlsEl.dataset.state = 'error';
        statusEl.textContent = `Stopped · ${getThumbCount()} thumbnails`;
      }
      else if (!hasMore) {
        moreThumbsControlsEl.dataset.state = 'complete';
        statusEl.textContent = `All ${getThumbCount()} thumbnails`;
      }
      else if (isPaused) {
        moreThumbsControlsEl.dataset.state = 'paused';
        statusEl.textContent = `Paused · ${getThumbCount()} thumbnails`;
      }
      else if (isLoading) {
        moreThumbsControlsEl.dataset.state = 'loading';
        statusEl.textContent = `Loading · ${getThumbCount()} thumbnails`;
      }
      else {
        moreThumbsControlsEl.dataset.state = 'ready';
        statusEl.textContent = `${getThumbCount()} thumbnails`;
      }
      resumeThumbsEl.hidden = !isPaused || !hasMore;
    };

    /** @param {string} initUrl */
    async function* newPagedImgElsGen(initUrl) {
      let url = initUrl;
      /** @type {HTMLElement[]} */
      let imgEls = [];

      while (url) {
        const resp = await fetch(url, { credentials: 'same-origin' });

        url = '';
        imgEls = [];

        if (!resp.ok) {
          throw new Error(`Could not load thumbnails: HTTP ${resp.status}`);
        }
        const html = await resp.text();
        const docEl = (new DOMParser())
          .parseFromString(html, 'text/html')
          .documentElement;
        imgEls = Array.from($find(docEl, IMAGE_PARENT_SELECTOR)?.children ?? []);

        const nextEl = $find(docEl, NEXT_PAGE_SELECTOR);
        url = nextEl?.href ?? '';

        yield { hasNextPage: Boolean(url), imgEls };
      }

      return { hasNextPage: false, imgEls: [] };
    }

    const pagedImgEls = newPagedImgElsGen(initialNextUrl);

    const appendNextPage = async () => {
      const pagedImgElsResult = await pagedImgEls.next();
      if (pagedImgElsResult.done) {
        hasMore = false;
        return;
      }
      for (const imgEl of pagedImgElsResult.value.imgEls) {
        if (!imgEl.classList.contains('c')) {
          imgParentEl.appendChild(imgEl);
        }
      }
      hasMore = pagedImgElsResult.value.hasNextPage;
    };

    const loadVisiblePages = async () => {
      isLoading = true;
      updateControls();
      try {
        while (true) {
          if (!isIntersecting || isPaused || !hasMore) { break; }
          await appendNextPage();
          updateControls();
          if (!isPaused && hasMore) {
            await sleep(300);
          }
        }
      }
      catch (error) {
        loadFailed = true;
        hasMore = false;
        console.error(error);
      }
      finally {
        isLoading = false;
        if (!hasMore) {
          ob.disconnect();
        }
        updateControls();
      }
    };

    const startLoading = () => {
      if (isLoading || isPaused || !hasMore) { return; }
      currentLoadPromise = loadVisiblePages();
    };

    ob = new IntersectionObserver((entries) => {
      isIntersecting = entries[0].isIntersecting;
      if (isIntersecting) {
        startLoading();
      }
    });

    const pauseAndViewComments = async (targetEl, behavior = 'smooth') => {
      const intent = ++navigationIntent;
      isPaused = true;
      isIntersecting = false;
      ob.disconnect();
      updateControls();

      // Let an in-flight append settle so it cannot move the comments afterward.
      await currentLoadPromise;
      if (intent !== navigationIntent || !isPaused) { return; }
      targetEl.scrollIntoView({ behavior, block: 'start' });
    };

    const resumeMoreThumbs = () => {
      navigationIntent += 1;
      isPaused = false;
      updateControls();
      ob.observe(paginationEl);
      paginationEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    viewCommentsEl.onclick = () => pauseAndViewComments(commentsAnchorEl);
    resumeThumbsEl.onclick = resumeMoreThumbs;
    window.addEventListener('hashchange', () => {
      if (isCommentHash(location.hash)) {
        pauseAndViewComments(getCommentHashTarget(), 'auto');
      }
    });

    updateControls();
    if (isPaused) {
      requestAnimationFrame(() => pauseAndViewComments(getCommentHashTarget(), 'auto'));
    }
    else if (hasMore) {
      ob.observe(paginationEl);
    }
  })();
}
// #endregion More Thumbs

// #region Page Enlargement
if (uhpConfig.pe) {
  (async () => {
    if (!$('input[name="f_search"]')) { return; }
    if (!$('.itg')) { return; }

    const isTableLayout = Boolean($('table.itg'));

    const NEXT_PAGE_SELECTOR = '.ptt td:last-child > a, .searchnav a[href*="next="]';
    const IMAGE_PARENT_SELECTOR = isTableLayout ? 'table.itg > tbody' : 'div.itg';

    const imgParentEl = $(IMAGE_PARENT_SELECTOR);
    if (!imgParentEl) { return console.error('No imgParentEl'); }
    imgParentEl.innerHTML = '';

    const statusEl = $el('h1', { textContent: 'Loading...', id: '🔓-status' });
    $('table.ptb, .itg + .searchnav, #favform + .searchnav').replaceWith(statusEl);

    /** @param {string} initUrl */
    async function* newPagedImgElsGen(initUrl) {
      let url = initUrl;
      /** @type {HTMLElement[]} */
      let imgEls = [];

      while (url) {
        const resp = await fetch(url, { credentials: 'same-origin' });

        url = '';
        imgEls = [];

        if (resp.ok) {
          const html = await resp.text();
          const docEl = (new DOMParser())
            .parseFromString(html, 'text/html')
            .documentElement;
          imgEls = Array.from($find(docEl, IMAGE_PARENT_SELECTOR)?.children ?? []);

          const nextEl = $find(docEl, NEXT_PAGE_SELECTOR);
          url = nextEl?.href ?? '';
        }

        yield imgEls;
      }

      return [];
    }

    const pagedImgEls = newPagedImgElsGen(location.href);
    const replaceResult = async (ob) => {
      const pagedImgElsResult = await pagedImgEls.next();
      if (pagedImgElsResult.done) {
        statusEl.textContent = 'End';
        return ob.disconnect();
      }
      for (const imgEl of pagedImgElsResult.value) {
        imgParentEl.appendChild(imgEl);
      }
    };
    let isIntersecting = false;
    const ob = new IntersectionObserver(async (entries) => {
      isIntersecting = entries[0].isIntersecting;
      if (isIntersecting) {
        do {
          await replaceResult(ob);
          await sleep(300);
          if (!isIntersecting) { break; }
        } while (true);
      }
    });
    ob.observe(statusEl);
  })();
}
// #endregion Page Enlargement

// #region Full Width

if (uhpConfig.fw) {
  document.body.classList.add('🔓-full-width');
}

// #endregion Full Width

// #region ubp dialog setup

const uhpDialogEl = $el('dialog', { id: '🔓-dialog' });
uhpDialogEl.className = (location.host === 'exhentai.org') ? 'dark' : '';
uhpDialogEl.innerHTML = `
  <fieldset>
    <legend>Unlock Hath Perks</legend>
    <div role="group">

      <div class="option-grid">
        <label class="material-switch">
          <input type="checkbox" id="🔓-conf-abg" value="abg" />
        </label>
        <span class="🔓-conf-title">Ads-Be-Gone</span>
        <span class="🔓-conf-desc">Remove ads. You can use it with adblock webextensions.</span>
      </div>

      <div class="option-grid">
        <label class="material-switch">
          <input type="checkbox" id="🔓-conf-mt" value="mt" />
        </label>
        <span class="🔓-conf-title">More Thumbs</span>
        <span class="🔓-conf-desc">Scroll infinitely in gallery pages.</span>
      </div>

      <div class="option-grid">
        <label class="material-switch">
          <input type="checkbox" id="🔓-conf-pe" value="pe" />
        </label>
        <span class="🔓-conf-title">Page Enlargement</span>
        <span class="🔓-conf-desc">Scroll infinitely in search results pages.</span>
      </div>

      <div class="option-grid">
        <label class="material-switch">
          <input type="checkbox" id="🔓-conf-fw" value="fw" />
        </label>
        <span class="🔓-conf-title">Full Width</span>
        <span class="🔓-conf-desc">Utilize your monitor.</span>
      </div>

    </div>
  </fieldset>
`;
uhpDialogEl.onclick = (evt) => {
  if (evt.target === uhpDialogEl) {
    uhpDialogEl.close();
    if (uhpDialogEl.dataset.hasChanged) {
      location.reload();
    }
  }
};
document.body.appendChild(uhpDialogEl);

/** @type {HTMLInputElement[]} */
const checkboxEls = $$('dialog#🔓-dialog input[type="checkbox"]');
for (const checkboxEl of checkboxEls) {
  checkboxEl.checked = uhpConfig[checkboxEl.value];
  checkboxEl.onchange = () => {
    uhpConfig[checkboxEl.value] = checkboxEl.checked;
    uhpDialogEl.dataset.hasChanged = true;
  };
}

const nb = $('#nb');
nb.appendChild(
  $html(`
    <div>
      <a id="🔓-entry" href="javascript:;">Unlock Hath Perks</a>
    </div>
  `),
);

$('a#🔓-entry').onclick = () => uhpDialogEl.showModal();
// #endregion ubp dialog setup

// #region override e-h style

$style(`
/* nav bar */
#nb {
  width: initial;
  max-width: initial;
  max-height: initial;
  justify-content: center;
}

/* search input */
table.itc + p.nopm {
  display: flex;
  flex-flow: row wrap;
  justify-content: center;
}
input[name="f_search"] {
  width: 100%;
}

/* /favorites.php */
input[name="favcat"] + div {
  display: flex;
  flex-flow: row wrap;
  justify-content: center;
  gap: 8px;
}

/* gallery grid */
.gl1t {
  display: flex;
  flex-flow: column;
}
.gl1t > .gl3t {
  flex: 1;
}
.gl1t > .gl3t > a {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}`);

// #endregion override e-h style

// #region uhp style

$style(`
#🔓-status {
  text-align: center;
  font-size: 3rem;
  clear: both;
  padding: 2rem 0;
}

#🔓-more-thumbs-controls {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  max-width: calc(100vw - 2rem);
  padding: 0.65rem 0.75rem;
  border: 2px solid #7f1d1d;
  border-radius: 0.75rem;
  color: #3f0b0b;
  background: #fffaf0;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.45);
  font-family: system-ui, sans-serif;
  font-size: 0.9rem;

  &.dark {
    border-color: #f0b429;
    color: #fff;
    background: #181a1f;
  }

  &[data-state="complete"] {
    border-color: #16803c;
  }

  &.dark[data-state="complete"] {
    border-color: #4ade80;
  }

  &[data-state="error"] {
    border-color: #dc2626;
  }

  > span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 700;
  }

  > span::before {
    display: inline-block;
    margin-right: 0.4rem;
    color: #7f1d1d;
    content: "●";
  }

  &[data-state="loading"] > span::before {
    color: #ca8a04;
    content: "↻";
    animation: uhp-spin 1s linear infinite;
  }

  &[data-state="paused"] > span::before {
    color: #ca8a04;
    content: "⏸";
  }

  &[data-state="complete"] > span::before {
    color: #16803c;
    content: "✓";
  }

  &.dark[data-state="complete"] > span::before {
    color: #4ade80;
  }

  &[data-state="error"] > span::before {
    color: #dc2626;
    content: "!";
  }

  > button {
    flex: none;
    padding: 0.4rem 0.65rem;
    border: 1px solid #7f1d1d;
    border-radius: 0.45rem;
    color: #fff;
    background: #7f1d1d;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }

  > button:hover {
    filter: brightness(1.2);
  }

  &.dark > button {
    border-color: #f0b429;
    color: #181a1f;
    background: #f0b429;
  }

  > #🔓-resume-thumbs {
    border-color: #0369a1;
    background: #0369a1;
  }

  &.dark > #🔓-resume-thumbs {
    border-color: #38bdf8;
    background: #38bdf8;
  }

  > button[hidden] {
    display: none;
  }
}

@keyframes uhp-spin {
  to { transform: rotate(360deg); }
}

#🔓-dialog {
  padding: 1.2rem;
  background-color: floralwhite;
  border-radius: 1rem;
  font-size: 1.4rem;
  color: darkred;
  max-width: 950px;

  &.dark {
    background-color: dimgray;
    color: ghostwhite;
  }

  fieldset > legend {
    font-size: 2rem;
  }

  .option-grid {
    display: grid;
    grid-template-columns: max-content 14rem 1fr;
    column-gap: 1rem;
    padding: 0.5rem 1rem;
    align-items: center;
  }
}

.🔓-full-width :where(#gdt, div.ido) {
  max-width: initial !important;
  margin: 1rem !important;
}

@supports (display:grid) {
  .🔓-full-width .gld {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 0.5rem;
  }
}

/* Modified https://bootsnipp.com/snippets/featured/material-design-switch */
label.material-switch > input[type="checkbox"] {
  display: none;
}

label.material-switch {
  display: inline-block;
  position: relative;
  margin: 6px;
  border-radius: 8px;
  width: 40px;
  height: 16px;
  opacity: 0.3;
  background-color: rgb(0, 0, 0);
  box-shadow: inset 0px 0px 10px rgba(0, 0, 0, 0.5);
  transition: all 0.4s ease-in-out;
  cursor: pointer;
}

label.material-switch::after {
  position: absolute;
  top: -4px;
  left: -4px;
  border-radius: 16px;
  width: 24px;
  height: 24px;
  content: "";
  background-color: rgb(255, 255, 255);
  box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease-in-out;
}

label.material-switch:has(> input[type="checkbox"]:checked) {
  background-color: #0e0;
  opacity: 0.7;
}

label.material-switch:has(> input[type="checkbox"]:checked)::after {
  background-color: inherit;
  left: 20px;
}`);

// #endregion uhp style
