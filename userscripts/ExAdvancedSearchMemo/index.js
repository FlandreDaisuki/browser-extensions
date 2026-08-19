import { $, $findAll, $getValue, $html, $setValue, $style } from './common.js';

/** @typedef {{name: string, query: string}} Memo */

const NAMESPACE = 'ExAdvancedSearchMemo';

/**
 * @param {Memo[]} defaultValue
 * @returns {Promise<Memo[]>}
 */
const load = (defaultValue = []) => $getValue(NAMESPACE, defaultValue);

/** @param {Memo[]} value */
const save = (value) => $setValue(NAMESPACE, value);

(() => {
  // cSpell: disable
  // #searchbox.idi
  //   table.itc
  //   div
  //     input#f_search
  //     input(type="submit" value="Search")
  //     input(type="button" value="Clear")
  //   div
  //     a [Show Advanced Options]
  //     a [Show File Search]
  // cSpell: enable
  const inputsBoxEl = $('table.itc + div');
  if (!inputsBoxEl) { return; }
  inputsBoxEl.classList.add('🔱-input-box');

  const memoLinksEl = $html('<ul class="🔱-memo-links"></ul>');
  if (!memoLinksEl){ return; }

  inputsBoxEl.insertAdjacentElement('afterend', memoLinksEl);
  const loadAllMemos = async() => {
    const allMemos = await load();
    const memoListHtmlText = allMemos
      .map((memo) => `
      <li>
        <a href="${ memo.query }">${ memo.name }</a>
        <button class="🔱-memo-edit" type="button">🖊️</button>
        <button class="🔱-memo-delete" type="button">🚮</button>
      </li>`)
      .join('');

    memoLinksEl.innerHTML = memoListHtmlText;

    /**  @param {MouseEvent} event */
    const editMemo = async(event) => {
      /** @type {HTMLElement | null} */
      const targetEl = event.target;
      if (!targetEl) { return; }

      const oldName = targetEl.previousElementSibling?.textContent;
      if (!oldName) { return; }

      const allMemos = await load();
      const foundRenamingMemo = allMemos.find((memo) => memo.name === oldName);
      if (!foundRenamingMemo) { return; }

      // eslint-disable-next-line no-alert
      const newName = prompt('Type the new name', oldName);
      if (!newName) { return; }

      const foundTheSameNewNameMemo = allMemos.find((memo) => memo.name === newName);
      if (foundTheSameNewNameMemo) {
        foundTheSameNewNameMemo.query = foundRenamingMemo.query;
        allMemos.splice(allMemos.indexOf(foundRenamingMemo), 1);
      }
      else {
        foundRenamingMemo.name = newName;
      }
      await save(allMemos);
      await loadAllMemos();
    };
    $findAll(memoLinksEl, '.🔱-memo-edit').forEach((editEl) => {
      editEl.onclick = editMemo;
    });

    const deleteMemo = async(event) => {
      const deletingName = event.target.previousElementSibling.previousElementSibling.textContent;

      // eslint-disable-next-line no-alert
      if (!confirm(`Really delete "${ deletingName }"?`)){ return; }

      const allMemos = await load();
      await save(allMemos.filter((memo) => {
        return memo.name && memo.name !== deletingName;
      }));
      await loadAllMemos();
    };
    $findAll(memoLinksEl, '.🔱-memo-delete').forEach((deleteEl) => {
      deleteEl.onclick = deleteMemo;
    });
  };
  loadAllMemos();

  const onMemoClick = async() => {
    const query = location.search;
    // eslint-disable-next-line no-alert
    const name = prompt('Type the name');

    const allMemos = await load();
    const foundTheSameNameMemo = allMemos.find((memo) => memo.name === name);
    if (foundTheSameNameMemo) {
      foundTheSameNameMemo.query = query;
      await save(allMemos);
    }
    else {
      await save(allMemos.concat({ name, query }));
    }
    await loadAllMemos();
  };
  const memoBtnEl = $html(
    '<input type="button" class="🔱-memo-btn" value="Memo"/>',
  );
  inputsBoxEl.appendChild(memoBtnEl);
  memoBtnEl.onclick = onMemoClick;
})();

$style(`
.🔱-input-box {
  display: flex;
  align-items: center;
}
.🔱-input-box #f_search {
  width: 100%;
}
ul.🔱-memo-links {
  list-style: none;

  display: flex;
  flex-flow: row wrap;
  gap: 8px;
  padding: 4px;
  border: 1px dashed;
}
ul.🔱-memo-links > li {
  display: inline-flex;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.2);
  padding: 4px 8px;
  border-radius: 8px;
}
ul.🔱-memo-links > li > a {
  margin-right: 12px;
}
ul.🔱-memo-links > li > button {
  display: inline-block;
  border: darkblue dotted 1px;
  background-color: white;
  cursor: pointer;
}
`);
