import type { Component } from "solid-js";
import { createSignal, onCleanup, onMount } from 'solid-js';

import { provideVSCodeDesignSystem, vsCodeButton } from "@vscode/webview-ui-toolkit";
import { vscode } from "./utilities/vscode";

import { getRand } from './utilities/getRand'

import { R } from './utilities/reactive_monad';

import { admonitionsPlugin } from "./utilities/admonitionsPlugin";
import { setEndOfContenteditable } from "./utilities/setEndOfContenteditable";


// Default SortableJS
import Sortable from 'sortablejs';


import { remark } from 'remark';
import remarkBreaks from 'remark-breaks'
import remarkDirective from 'remark-directive';


import remarkMdx from 'remark-mdx'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypePrism from 'rehype-prism-plus'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import rehypeFormat from 'rehype-format'
import rehypeStringify from 'rehype-stringify'



// In order to use the Webview UI Toolkit web components they
// must be registered with the browser (i.e. webview) using the
// syntax below.
provideVSCodeDesignSystem().register(vsCodeButton());

// To register more toolkit components, simply import the component
// registration function and call it from within the register
// function, like so:
//
// provideVSCodeDesignSystem().register(
//   vsCodeButton(),
//   vsCodeCheckbox()
// );
//
// Finally, if you would like to register all of the toolkit
// components at once, there's a handy convenience function:
//
// provideVSCodeDesignSystem().register(allComponents.register());




//=================================================================


const hFont = {};

const [cellsStream, cellsStreamNext] = createSignal([]);

const contentStreams = {};
const testList = {};
const ID = new Map(); //ID.get(cell)

const historyEdit = [];
const undoHistoryEdit = [];


let keybinds;
//==========================================

const keyMatch = evt => cmd =>
  (evt.shiftKey === keybinds[cmd].shiftKey) &&
  (evt.ctrlKey === keybinds[cmd].ctrlKey) &&
  (evt.altKey === keybinds[cmd].altKey) &&
  (evt.code == keybinds[cmd].code);


const sortableR = R(undefined);


const markHtml =
  (id: string) => {

    const rmPromise = remark()

      .use(remarkMdx)
      .use(remarkGfm)
      .use(remarkBreaks)
      .use(remarkMath)
      .use(remarkDirective)
      .use(admonitionsPlugin)
      .use(remarkRehype as any)
      .use(rehypePrism)
      .use(rehypeKatex)
      .use(rehypeFormat)
      .use(rehypeStringify)

      .process(testList[id]);

    rmPromise.then((html) => checkHtml(id)(html));
  };

const checkHtml = (id: string) => (html) => {

  const div = document.createElement('div');
  div.innerHTML = html.toString();

  const image = div.querySelector('img') != null;

  contentStreams[id].next(div);

  div.innerText.length <= 2 && !image
    ? showEdit(id)
    : showHtml(id);

};

const showHtml =
  (id: string) => {
    const elEdit = document.getElementById("edit" + id);
    elEdit.style.display = 'none';

    const parentEl = document.getElementById("html" + id);
    parentEl.style.display = '';
  };

const showEdit =
  (id: string) => {
    console.log('showEdit');

    const elHtml = document.getElementById("html" + id);
    elHtml.style.display = 'none';

    const elEdit = document.getElementById("edit" + id);
    elEdit.style.display = '';

  };

const showEditFocus =
  (id: string) => {
    console.log('showEditFocus');

    const elHtml = document.getElementById("html" + id);
    elHtml.style.display = 'none';

    const elEdit = document.getElementById("edit" + id);
    elEdit.style.display = '';

    elEdit.focus();

    setEndOfContenteditable(elEdit);
  };

const newCellID = R('');

const addCell = id => {

  const newCells = cells =>
    cells.flatMap(
      (el) =>
        id === ID.get(el)
          ? [el, Cell('')]
          : [el]
    );

  cellsStreamNext(cells => newCells(cells));

  const f = () => {
    document.getElementById('html' + newCellID.lastVal).style.display = 'none';
    document.getElementById('edit' + newCellID.lastVal).focus();
  };
  window.setTimeout(f, 0);

};

const deleteCell = id => {

  deletingID.next(id);

  const newCells = cells =>
    cells.flatMap(
      (el) =>
        id === ID.get(el)
          ? []
          : [el]
    );

  cellsStreamNext(cells => newCells(cells));

  console.log('onDelete');
  cellToMarkSave();

};

const deletingID = R(0);

const hStyle = idEdit => {

  const elEdit = document.getElementById(idEdit);

  const f0 = () => {
    const text = elEdit.innerText;

    elEdit.style.font =
      text.substring(0, 6) === '######'
        ? hFont[6]
        : text.substring(0, 5) === '#####'
          ? hFont[5]
          : text.substring(0, 4) === '####'
            ? hFont[4]
            : text.substring(0, 3) === '###'
              ? hFont[3]
              : text.substring(0, 2) === '##'
                ? hFont[2]
                : text.substring(0, 1) === '#'
                  ? hFont[1]
                  : hFont[0];
  };

  window.setTimeout(f0, 100);
};

const html = id => {

  testList[id] = document.getElementById("edit" + id).innerText;

  id === deletingID.lastVal
    ? undefined
    : markHtml(id);

};

const replaceSelected =
  before => after => {
    const sel = window.getSelection();

    const selStr = sel.toString();
    const text = before + selStr + after;

    const range = sel.getRangeAt(0);

    range.deleteContents();
    range.insertNode(document.createTextNode(text));


  };

const newlinesSelected =
  before => after => {
    const br1 = document.createElement('br');
    const br2 = document.createElement('br');

    const range = window.getSelection().getRangeAt(0);
    const clonedNode = range.cloneContents();
    range.deleteContents();
    range.insertNode(document.createTextNode(after));
    range.insertNode(br1);
    range.insertNode(clonedNode)
    range.insertNode(br2);
    range.insertNode(document.createTextNode(before));

  };

const replaceURLpaste =
  key => {
    const sel = window.getSelection();
    const selStr = sel.toString();

    navigator.clipboard.readText()
      .then(
        clipText => {
          const text = key + '[' + selStr + '](' + clipText + ')';
          const range = sel.getRangeAt(0);

          range.deleteContents();
          range.insertNode(document.createTextNode(text));
        }
      );
  };

const bold = (ev) => {
  ev.preventDefault();
  replaceSelected(' **')('** ');
};
const italic = (ev) => {
  ev.preventDefault();
  replaceSelected(' *')('* ');
};

//======================================================

const inlinecode = ev => id => {
  ev.preventDefault();
  replaceSelected('`')('`');
};
const inlinemath = ev => id => {
  ev.preventDefault();
  replaceSelected('$')('$');
};

const code = ev => id => {
  ev.preventDefault();
  newlinesSelected('```')('```');
};

const math = ev => id => {
  ev.preventDefault();
  newlinesSelected('$$$')('$$$');
};
const adomonition = ev => id => {
  ev.preventDefault();
  newlinesSelected(':::tip')(':::');
};


const urlPaste = ev => id => {
  ev.preventDefault();
  replaceURLpaste('');
};
const imgPaste = ev => id => {
  ev.preventDefault();
  replaceURLpaste('!');
};



//=======================================================

const undo = ev => id => {

  console.log('undo');

  const history = historyEdit[id];

  history.length === 1
    ? console.log('no previous History')
    : (() => {

      ev.preventDefault();

      const elEdit = document.getElementById("edit" + id);

      const undoHistory = undoHistoryEdit[id];

      undoHistory[undoHistory.length] = history[history.length - 1];

      const history1 =
        history.flatMap(
          (el, i) =>
            i === history.length - 1
              ? []
              : el
        );


      console.log(`history1`);
      console.log(history1);

      elEdit.innerText = history1[history1.length - 1];

      historyEdit[id] = history1;

      setEndOfContenteditable(elEdit);

      hStyle("edit" + id);
    })();
};


const redo = ev => id => {

  console.log('redo');

  ev.preventDefault();

  const elEdit = document.getElementById("edit" + id);

  const history = historyEdit[id];
  const undoHistory = undoHistoryEdit[id];

  undoHistory.length === 0
    ? console.log('no previous redoHistory')
    : (() => {

      history[history.length] = undoHistory[undoHistory.length - 1];

      elEdit.innerText = undoHistory[undoHistory.length - 1];

      undoHistoryEdit[id] =
        undoHistory.flatMap(
          (el, i) =>
            i === undoHistory.length - 1
              ? []
              : el
        );

      setEndOfContenteditable(elEdit);

      hStyle("edit" + id);
    })();

};

const Cell: Component = (text: string) => {
  const id = getRand();
  console.log(id);
  newCellID.next(id);
  const idEdit = "edit" + id;
  const idHtml = "html" + id;

  historyEdit[id] = [text];
  undoHistoryEdit[id] = [];

  const [contentStream, contentStreamNext] = createSignal();

  contentStreams[id] = contentStream;
  contentStreams[id].next = contentStreamNext;

  //---event----------------------------------------------
  const onKeyDown = ev => id => {


    const f0 = () => {
      console.log("history--------------");
      const elEdit = document.getElementById("edit" + id);
      const text = elEdit.innerText;

      console.log(text);
      const history = historyEdit[id];


      console.log(history);

      console.log(history[history.length - 1]);


      history[history.length - 1] === text
        ? undefined
        : history[history.length] = text;

      console.log(history);

    };

    keyMatch(ev)("undo")
      ? undo(ev)(id)
      : keyMatch(ev)("redo")
        ? redo(ev)(id)
        : keyMatch(ev)("cell-add")
          ? addCell(id)
          : keyMatch(ev)("cell-delete")
            ? deleteCell(id)
            : keyMatch(ev)("bold")
              ? bold(ev)
              : keyMatch(ev)("italic")
                ? italic(ev)
                : keyMatch(ev)("inlinecode")
                  ? inlinecode(ev)(id)
                  : keyMatch(ev)("code")
                    ? code(ev)(id)
                    : keyMatch(ev)("inlinemath")
                      ? inlinemath(ev)(id)
                      : keyMatch(ev)("math")
                        ? math(ev)(id)
                        : keyMatch(ev)("url-paste")
                          ? urlPaste(ev)(id)
                          : keyMatch(ev)("img-paste")
                            ? imgPaste(ev)(id)
                            : keyMatch(ev)("adomonition")
                              ? adomonition(ev)(id)
                              : window.setTimeout(f0, 0);


  };


  const onInput = idEdit => {
    console.log("onInput");
    console.log(idEdit);
    hStyle(idEdit);
  };

  const onBlur = id => {
    html(id);

    console.log('onBlur');
    cellToMarkSave();
  };


  //---event----------------------------------------------
  const onClick = id => showEditFocus(id);

  //------------------------------------------------------
  const div =

    <div class="cell" id={id}>

      <div class='celledit' id={idEdit}
        // chrome only !!! "plaintext-only"
        contenteditable={"plaintext-only" as any}
        onKeyDown={ev => onKeyDown(ev)(id)}
        onInput={ev => onInput(idEdit)}
        onBlur={ev => onBlur(id)}
        style={{ display: 'none' }}
      >
        {text}

      </div>

      <div class='cellhtml' id={idHtml}
        contenteditable={false}
        onClick={ev => onClick(id)}>

        {contentStreams[id]()}

      </div>

    </div>;
  //------------------------------------------------------

  ID.set(div, id);

  const initCell = () => {
    hStyle(idEdit);
    html(id);
  };

  window.setTimeout(
    () => initCell()
    , 0);


  return div;
};

//=================================================================


const onSort = evt => {

  console.log('onSort');
  cellToMarkSave();
}



const App: Component = () => {

  onMount(() => {
    console.log('onMount');

    document.addEventListener("DOMContentLoaded", function (event) {

      /*===== LINK ACTIVE =====*/
      const linkColor = document.querySelectorAll('.nav_link')

      function colorLink() {
        if (linkColor) {
          linkColor.forEach(l => l.classList.remove('active'))
          this.classList.add('active')
        }
      }
      linkColor.forEach(l => l.addEventListener('click', colorLink))

      // Your code to run since DOM is loaded and ready

      hFont[0] = getComputedStyle(document.getElementById('p')).font;
      hFont[1] = getComputedStyle(document.getElementById('h1')).font;
      hFont[2] = getComputedStyle(document.getElementById('h2')).font;
      hFont[3] = getComputedStyle(document.getElementById('h3')).font;
      hFont[4] = getComputedStyle(document.getElementById('h4')).font;
      hFont[5] = getComputedStyle(document.getElementById('h5')).font;
      hFont[6] = getComputedStyle(document.getElementById('h6')).font;

      hFont['bold'] = getComputedStyle(document.getElementById('bold')).font;
      hFont['italic'] = getComputedStyle(document.getElementById('italic')).font;


      vscode.postMessage({
        command: "requestLoad",
        text: "",
      });
    });


  });

  return (

    <main class="markdown-body">
      <div class="container">

        <div id="items">
          {cellsStream()}
        </div>

        <h1 id='h1'></h1>
        <h2 id='h2'></h2>
        <h3 id='h3'></h3>
        <h4 id='h4'></h4>
        <h5 id='h5'></h5>
        <h6 id='h6'></h6>
        <p id='p'></p>
        <p><strong id='bold'></strong></p>
        <p><em id='italic'></em></p>

      </div>
    </main>

  );
};

const cellToMarkSave = () =>
  window.setTimeout(
    () => save(cellToMark()),
    0);

const cellToMark = () => {

  const els = Array.from(document.getElementsByClassName('cell'));
  const texts = els.map((el: HTMLElement) => testList[el.id]);

  const text = texts.reduce((sum, a) => sum + '\n\n' + a);

  return text;

};
const save = (text: string) => {

  vscode.postMessage({
    command: "save",
    text: text,
  });

};



//=============================================================
const parseMd = (mdText: string) => {

  const separator = "@@!!################!!@@";

  const cellTexts =
    mdText
      .replace(/:{3}(.+)\n([\S\s]+?)\n:{3}/g,
        match => separator + match + separator)

      .split(separator)

      .flatMap(mdtext1 => {
        const first3 = mdtext1.slice(0, 3);

        return (first3 === ':::')
          ? [mdtext1]
          : mdtext1
            .replace(/`{3}([\w]*)\n([\S\s]+?)\n`{3}/g,
              match => separator + match + separator)
            .replace(/\${3}([\w]*)\n([\S\s]+?)\n\${3}/g,
              match => separator + match + separator)
            .split(separator)

            .flatMap(mdtext2 => {

              const first3 = mdtext2.slice(0, 3);

              return (first3 === '```'
                || first3 === '$$$')
                ? [mdtext2]
                : mdtext2
                  .split(/\n{2,}/g)
                  .flatMap(mdtext3 =>
                    mdtext3 === ''
                      ? []
                      : [mdtext3]);
            })

      });

  console.log(cellTexts);
  return cellTexts;
};

const mdtextR = R('');
//==========================================
mdtextR
  .map(mdText => parseMd(mdText))
  .map(mds => {

    const cells = mds.map(md => Cell(md));

    console.log(cells);

    cellsStreamNext(cells);

    const f = () => {

      sortableR.next(
        Sortable.create(
          document.getElementById('items'),
          {
            animation: 150,
            ghostClass: "ghost",
            onEnd: onSort
          })
      );
    };

    setTimeout(f, 0);
  });
//==========================================

//==========================================
window.addEventListener('message', event => {

  const message = event.data;

  message.cmd === 'keybinds'
    ? (() => {
      console.log("keybinds!!!!!!!!!!!!!");
      keybinds = message.obj;
      console.log(keybinds);
    })()
    : message.cmd === 'load'
      ? mdtextR.next(message.obj)
      : undefined;

});
//==========================================




export default App;
