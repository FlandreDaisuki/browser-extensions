export const noop = () => {};

export const $find = (el, selectors) => el.querySelector(selectors);
export const $findAll = (el, selectors) => Array.from(el.querySelectorAll(selectors));
export const $ = (selectors) => document.querySelector(selectors);
export const $$ = (selectors) => Array.from(document.querySelectorAll(selectors));

export const $el = (tag, attr = {}, cb = noop) => {
  const el = document.createElement(tag);
  if (typeof(attr) === 'string') {
    el.textContent = attr;
  }
  else {
    Object.assign(el, attr);
  }
  cb(el);
  return el;
};

export const $html = (htmlText) => {
  const tmpEl = $el('div');
  tmpEl.innerHTML = htmlText;
  return tmpEl.firstElementChild;
};

export const $style = (stylesheet) => $el('style', stylesheet, (el) => document.head.appendChild(el));

export const $getValue = async(key, defaultValue) => {
  if (globalThis.GM_getValue) {
    return globalThis.GM_getValue(key, defaultValue);
  }
  else if (globalThis.GM.getValue){
    return globalThis.GM.getValue( key, defaultValue );
  }
};

export const $setValue = async(key, Value) => {
  if (globalThis.GM_setValue) {
    return globalThis.GM_setValue(key, Value);
  }
  else if (globalThis.GM.setValue){
    return globalThis.GM.setValue( key, Value );
  }
};

export const $getResourceText = (key) => {
  if (globalThis.GM_getResourceText) {
    return globalThis.GM_getResourceText(key);
  }
  else if (globalThis.GM.getResourceText){
    return globalThis.GM.getResourceText( key );
  }
};

export const $xhr = (details) => {
  const xhrFn = globalThis.GM_xmlhttpRequest ?? GM.xmlhttpRequest;
  return xhrFn(details);
};

export const throttle = (fn, timeout = 1000) => {
  let locked = false;
  return (...args) => {
    if (!locked){
      locked = true;
      fn(...args);
      setTimeout(() => {
        locked = false;
      }, timeout);
    }
  };
};

export const range = (start, end) => Array.from({ length: end - start }, (_, i) => i + start);

export const range0 = (end) => range(0, end);

export const sum = (...args) => args.flat(Infinity).reduce((a, b) => a + b, 0);

export const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });
