/*
 * Code highlight (Elementor Pro's code highlight widget): the code coloured as Prism
 * colours it for Elementor, by the theme's own small tokenizer (window.harlowCodeHighlight),
 * with Prism's plugins the widget uses:
 *
 *   tokens            Prism's classes (token keyword, string, comment, function, tag,
 *                     attr-name, attr-value, selector, property...), so the six themes of
 *                     code-highlight.css colour them; markup (HTML, XML, SVG, with the CSS and
 *                     JavaScript inside), CSS, SCSS, Less, JavaScript, TypeScript, JSX, PHP
 *                     (alone or in HTML), JSON, Python, SQL, Bash, PowerShell, Ruby, YAML,
 *                     Markdown, Git, and the C family, Java, Go, Kotlin and Swift by a general
 *                     grammar
 *   line-numbers      the numbers down the side (pre.line-numbers), each as tall as its
 *                     line when long lines wrap (word-wrap)
 *   line-highlight    the lines of pre[data-line] ("1,3-5") marked
 *   copy-to-clipboard the toolbar's Copy button (.copy-to-clipboard)
 *
 * The page runs it on every code highlight; the editor runs it on the one it shows
 * (window.harlowWidgets['code-highlight']).
 */
(() => {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const wrap = (type, html) => `<span class="token ${type}">${html}</span>`;
  const words = (list, flags = '') => new RegExp(`\\b(?:${list.split(' ').join('|')})\\b`, flags);
  const compiled = new WeakMap();

  /*
   * A grammar is a list of [type, pattern, inside]: at each place the first pattern that
   * matches makes a token of its type (no type: no token of its own); `inside` colours what
   * the token holds (another grammar, or a function of the token's text).
   */
  function run(text, grammar) {
    if (!compiled.has(grammar)) {
      compiled.set(grammar, grammar.map(([type, re, inside]) => [type, new RegExp(re.source, `${re.flags.replace(/[gy]/g, '')}y`), inside]));
    }
    const rules = compiled.get(grammar);
    const plainRun = /[\w$]+|\s+|[\s\S]/y;
    let out = '';
    let plain = '';
    let i = 0;
    while (i < text.length) {
      let hit = null;
      for (const [type, re, inside] of rules) {
        re.lastIndex = i;
        const m = re.exec(text);
        if (m && m[0].length) {
          hit = [type, m[0], inside];
          break;
        }
      }
      if (!hit) {
        plainRun.lastIndex = i;
        const m = plainRun.exec(text);
        plain += m[0];
        i += m[0].length;
        continue;
      }
      if (plain) {
        out += esc(plain);
        plain = '';
      }
      const [type, value, inside] = hit;
      let body = esc(value);
      if (typeof inside === 'function') body = inside(value);
      else if (inside) body = run(value, inside);
      out += type ? wrap(type, body) : body;
      i += value.length;
    }
    return out + esc(plain);
  }

  const blockComment = /\/\*[\s\S]*?(?:\*\/|$)/;
  const lineComment = /\/\/.*/;
  const hashComment = /#.*/;
  const quoted = /"(?:\\[\s\S]|[^\\"\n])*"|'(?:\\[\s\S]|[^\\'\n])*'/;
  const number = /\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i;

  // Markup: a tag's name, attributes and values, as Prism nests them.
  function tag(value) {
    const m = /^(<\/?)([^\s>/]*)([\s\S]*?)(\/?>)$/.exec(value);
    if (!m) return esc(value);
    const attrs = run(m[3], [
      ['attr-value', /=\s*(?:"[^"]*"|'[^']*'|\{[^}]*\}|[^\s'">=]+)/, (v) => {
        const a = /^(=)(\s*)(["']?)([\s\S]*?)(["']?)$/.exec(v);
        return `${wrap('punctuation attr-equals', '=')}${a[2]}${a[3] ? wrap('punctuation', a[3]) : ''}${esc(a[4])}${a[5] ? wrap('punctuation', a[5]) : ''}`;
      }],
      ['attr-name', /[^\s>/=]+/],
    ]);
    return `${wrap('tag', wrap('punctuation', esc(m[1])) + esc(m[2]))}${attrs}${wrap('punctuation', esc(m[4]))}`;
  }
  // A script or style element: its tags as markup, what it holds in its own language.
  const embedded = (language, grammar) => (value) => {
    const open = /^<[^>]*>/.exec(value)[0];
    const close = /<\/[^>]*>$/.exec(value)[0];
    const inner = value.slice(open.length, value.length - close.length);
    return wrap('tag', tag(open)) + (inner ? `<span class="token ${language === 'css' ? 'style' : 'script'} language-${language}">${run(inner, grammar)}</span>` : '') + wrap('tag', tag(close));
  };

  const css = [
    ['comment', blockComment],
    ['atrule', /@[\w-]+[^;{]*?(?=\s*[;{])/, (v) => {
      const name = /^@[\w-]+/.exec(v)[0];
      return wrap('rule', esc(name)) + esc(v.slice(name.length));
    }],
    ['url', /\burl\((?:"[^"]*"|'[^']*'|[^)]*)\)/i],
    ['selector', /(?<=^|[{}\s;])[^{}\s;@][^{};]*?(?=\s*\{)/],
    ['string', quoted],
    ['property', /-{0,2}[a-z_][\w-]*(?=\s*:)/i],
    ['important', /!important\b/i],
    ['function', /[\w-]+(?=\()/],
    ['hexcode color', /#[\da-f]{3,8}\b/i],
    ['number', /-?(?:\d+(?:\.\d+)?|\.\d+)(?:%|[a-z]+)?/i],
    ['punctuation', /[(){};:,]/],
  ];
  const scss = [['comment', lineComment], ['variable', /\$[\w-]+/], ['placeholder', /%[\w-]+/], ...css];
  const less = [['comment', lineComment], ['variable', /@[\w-]+(?=\s*:)|@@?[\w-]+/], ...css];

  const jsKeywords = 'as async await break case catch class const continue debugger default delete do else export extends finally for from function get if import in instanceof let new of return set static super switch this throw try typeof var void while with yield';
  const js = [
    ['comment', blockComment],
    ['comment', lineComment],
    ['template-string string', /`(?:\\[\s\S]|\$\{[^}]*\}|[^\\`])*`/],
    ['string', quoted],
    ['regex', /(?<=(?:^|[(,=:[!&|?{};]|\breturn)\s*)\/(?![*/])(?:\\.|\[(?:\\.|[^\]\\\n])*\]|[^/\\\n[])+\/[dgimsuy]*/],
    ['keyword', words(jsKeywords)],
    ['boolean', /\b(?:true|false)\b/],
    ['keyword', /\b(?:null|undefined)\b/],
    ['class-name', /(?<=\b(?:class|extends|new|implements|instanceof)\s+)[\w$.]+/],
    ['function', /[\w$]+(?=\s*\()/],
    ['number', number],
    ['operator', /--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==?|\?\?=?|\.\.\.|[-+*/%&|^!=<>]=?|[~?:]/],
    ['punctuation', /[{}[\];(),.]/],
  ];
  const ts = [
    ['keyword', words('abstract declare enum implements interface is keyof namespace private protected public readonly type')],
    ['builtin', words('any boolean bigint never number object string symbol unknown')],
    ...js,
  ];
  const jsxTag = ['tag', /<\/?(?:[A-Za-z][\w.:-]*)?(?:\s+[\w:-]+(?:=(?:"[^"]*"|'[^']*'|\{[^}]*\}))?)*\s*\/?>/, tag];
  const jsx = [...js.slice(0, 4), jsxTag, ...js.slice(4)];
  const tsx = [...ts.slice(0, 2), ...jsx];

  const markup = [
    ['comment', /<!--[\s\S]*?(?:-->|$)/],
    ['prolog', /<\?[\s\S]+?\?>/],
    ['doctype', /<!DOCTYPE[\s\S]+?>/i],
    ['cdata', /<!\[CDATA\[[\s\S]*?\]\]>/i],
    [null, /<script\b[^>]*>[\s\S]*?<\/script\s*>/i, embedded('javascript', js)],
    [null, /<style\b[^>]*>[\s\S]*?<\/style\s*>/i, embedded('css', css)],
    ['tag', /<\/?(?!\d)[^\s>/=$<%]+(?:\s(?:\s*[^\s>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/, tag],
    ['entity', /&[\da-z]{1,8};|&#x?[\da-f]{1,8};/i],
  ];

  const phpCode = [
    ['delimiter important', /<\?(?:php|=)?|\?>/i],
    ['comment', blockComment],
    ['comment', /(?:\/\/|#(?!\[)).*/],
    ['string', /<<<\s*['"]?(\w+)['"]?\n[\s\S]*?\n\s*\1\b;?/],
    ['string', quoted],
    ['variable', /\$+(?:\w+\b|(?=\{))/],
    ['keyword', words('abstract and array as break callable case catch class clone const continue declare default die do echo else elseif empty enddeclare endfor endforeach endif endswitch endwhile enum eval exit extends final finally fn for foreach function global goto if implements include include_once instanceof insteadof interface isset list match namespace new or parent print private protected public readonly require require_once return self static switch throw trait try unset use var while xor yield', 'i')],
    ['boolean', /\b(?:true|false)\b/i],
    ['class-name', /(?<=\b(?:class|extends|implements|new|instanceof|trait|interface)\s+)\\?[\w\\]+/i],
    ['constant', /\b(?:null|NULL|[A-Z_][A-Z0-9_]{2,})\b/],
    ['function', /\b\w+(?=\s*\()/],
    ['number', number],
    ['operator', /->|\?->|=>|::|\?\?=?|\.\.\.|\*\*=?|<=>|[!=]==?|&&|\|\||[-+*/%.&|^!=<>]=?|[~?:@]/],
    ['punctuation', /[{}[\];(),]/],
  ];
  const phpInHtml = [
    [null, /<\?(?:php|=)?[\s\S]*?(?:\?>|$)/i, (v) => `<span class="token php language-php">${run(v, phpCode)}</span>`],
    ...markup,
  ];

  const json = [
    ['comment', blockComment],
    ['comment', lineComment],
    ['property', /"(?:\\.|[^\\"\r\n])*"(?=\s*:)/],
    ['string', /"(?:\\.|[^\\"\r\n])*"/],
    ['number', /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i],
    ['punctuation', /[{}[\],]/],
    ['operator', /:/],
    ['boolean', /\b(?:false|true)\b/],
    ['null keyword', /\bnull\b/],
  ];

  const python = [
    ['comment', hashComment],
    ['triple-quoted-string string', /(?:[rubf]|rb|br|fr|rf)?(?:"""[\s\S]*?"""|'''[\s\S]*?''')/i],
    ['string', /(?:[rubf]|rb|br|fr|rf)?(?:"(?:\\.|[^\\"\r\n])*"|'(?:\\.|[^\\'\r\n])*')/i],
    ['decorator annotation punctuation', /(?<=^|\n)[ \t]*@[\w.]+/],
    ['function', /(?<=\bdef\s+)\w+/],
    ['class-name', /(?<=\bclass\s+)\w+/],
    ['keyword', words('and as assert async await break class continue def del elif else except exec finally for from global if import in is lambda nonlocal not or pass print raise return try while with yield')],
    ['builtin', words('abs all any ascii bin bool bytearray bytes callable chr classmethod compile complex delattr dict dir divmod enumerate eval filter float format frozenset getattr globals hasattr hash help hex id input int isinstance issubclass iter len list locals map max memoryview min next object oct open ord pow property range repr reversed round set setattr slice sorted staticmethod str sum super tuple type vars zip')],
    ['boolean', /\b(?:True|False|None)\b/],
    ['function', /\b\w+(?=\s*\()/],
    ['number', /\b0(?:b[01_]+|o[0-7_]+|x[\da-f_]+)\b|(?:\b\d[\d_]*(?:\.[\d_]*)?|\B\.\d[\d_]*)(?:e[+-]?\d+)?j?(?!\w)/i],
    ['operator', /[-+%=]=?|!=|:=|\*\*?=?|\/\/?=?|<[<=>]?|>[=>]?|[&|^~]/],
    ['punctuation', /[{}[\];(),.:]/],
  ];

  const sql = [
    ['comment', /(?:--|#).*/],
    ['comment', blockComment],
    ['variable', /@[\w.$]+/],
    ['string', /'(?:\\[\s\S]|''|[^\\'])*'|"(?:\\[\s\S]|""|[^\\"])*"/],
    ['identifier punctuation', /`(?:\\[\s\S]|``|[^`\\])+`/],
    ['function', /\b(?:AVG|COALESCE|CONCAT|COUNT|FIRST|FORMAT|IFNULL|LAST|LCASE|LENGTH|LEN|LOWER|MAX|MID|MIN|MOD|NOW|ROUND|SUBSTRING|SUM|UCASE|UPPER)(?=\s*\()/i],
    ['boolean', /\b(?:FALSE|NULL|TRUE)\b/i],
    ['keyword', words('ACTION ADD AFTER ALL ALTER ANALYZE ANY AS ASC AUTO_INCREMENT BEFORE BEGIN BIGINT BINARY BLOB BOOLEAN BY CASCADE CASE CHAR CHECK COLLATE COLUMN COMMIT CONSTRAINT CREATE CROSS DATABASE DATE DATETIME DECIMAL DECLARE DEFAULT DELETE DESC DESCRIBE DISTINCT DOUBLE DROP EACH ELSE END ENGINE ESCAPE EXCEPT EXISTS EXPLAIN FLOAT FOR FOREIGN FROM FULL FUNCTION GRANT GROUP HAVING IF IGNORE INDEX INNER INSERT INT INTEGER INTERSECT INTO JOIN KEY LEFT LIMIT LOCK NATURAL NOT NULL OFFSET ON OR ORDER OUTER PRIMARY PROCEDURE REFERENCES RENAME REPLACE RETURN RETURNS REVOKE RIGHT ROLLBACK ROW ROWS SCHEMA SELECT SET SHOW TABLE TEMPORARY TEXT THEN TIMESTAMP TINYINT TO TOP TRANSACTION TRIGGER TRUNCATE UNION UNIQUE UNSIGNED UPDATE USE USING VALUES VARCHAR VIEW WHEN WHERE WHILE WITH', 'i')],
    ['number', /\b0x[\da-f]+\b|\b\d+(?:\.\d*)?|\B\.\d+\b/i],
    ['operator', /[-+*/=%^~]|&&?|\|\|?|!=?|<(?:=>?|<|>)?|>[>=]?|\b(?:AND|BETWEEN|DIV|ILIKE|IN|IS|LIKE|NOT|OR|REGEXP|RLIKE|XOR)\b/i],
    ['punctuation', /[;[\]()`,.]/],
  ];

  const bashVariable = /\$\{[^}]+\}|\$\([^)]*\)|\$\w+|\$[#?$!*@0-9-]/;
  const bash = [
    ['shebang important', /^#!\s*\/.*/],
    ['comment', /(?<=^|[^"{\\$\w])#.*/],
    ['string', /"(?:\\[\s\S]|\$\([^)]+\)|\$(?!\()|`[^`]+`|[^"\\`$])*"/, (v) => run(v, [['variable', bashVariable]])],
    ['string', /'[^']*'/],
    ['variable', bashVariable],
    ['function', /(?<=\bfunction\s+)\w+|\b\w+(?=\s*\(\))/],
    ['keyword', words('case do done elif else esac fi for function if in select then until while')],
    ['builtin class-name', words('alias bg bind break builtin caller cd command compgen complete continue declare dirs disown echo enable eval exec exit export fc fg getopts hash help history jobs kill let local logout mapfile popd printf pushd pwd read readarray readonly return set shift shopt source suspend test times trap type typeset ulimit umask unalias unset wait')],
    ['function', words('apt awk cat chmod chown cp curl cut date df diff du find git grep gzip head less ln ls make mkdir mv nano npm ping ps rm rsync scp sed sort ssh sudo tail tar tee touch tr uniq wc wget which xargs yum zip')],
    ['boolean', /\b(?:true|false)\b/],
    ['number', /(?<![\w.-])\d+(?:\.\d+)?\b/],
    ['operator', /\d?<>|>\||\+=|=[=~]?|!=?|<<[<-]?|[&\d]?>>|\d[<>]&?|[<>][&=]?|&[>&]?|\|[&|]?/],
    ['punctuation', /\$?\(\(?|\)\)?|\.\.|[{}[\];\\]/],
  ];

  const powershell = [
    ['comment', /<#[\s\S]*?#>/],
    ['comment', hashComment],
    ['string', /"(?:`[\s\S]|[^`"])*"|'(?:[^']|'')*'/],
    ['namespace', /\[[a-z][\w.]*(?:\[\])?\]/i],
    ['boolean', /\$(?:false|true)\b/i],
    ['variable', /\$\w+\b/],
    ['function', /\b(?:Add|Clear|Close|Compare|Connect|Convert|ConvertFrom|ConvertTo|Copy|Disable|Enable|Enter|Exit|Export|Find|ForEach|Format|Get|Import|Install|Invoke|Join|Measure|Move|New|Out|Read|Register|Remove|Rename|Restart|Resume|Select|Send|Set|Show|Sort|Split|Start|Stop|Suspend|Test|Uninstall|Update|Wait|Where|Write)-[a-z]+\b/i],
    ['keyword', words('Begin Break Catch Class Continue Data Do DynamicParam Else ElseIf End Exit Filter Finally For ForEach From Function If Param Process Return Switch Throw Trap Try Until Using Var While', 'i')],
    ['operator', /(?<=^|\W)(?:!|-(?:b?(?:and|x?or)|as|(?:not)?(?:contains|in|like|match)|eq|ge|gt|is(?:not)?|join|le|lt|ne|not|replace|sh[lr])\b|-[-=]?|\+[+=]?|[*/%]=?)/i],
    ['punctuation', /[|{}[\];(),.]/],
  ];

  // The C family, Java, Go, Kotlin, Swift, Ruby and the rest: comments, strings, keywords,
  // types, calls, numbers.
  const general = (extra, hash) => [
    ...extra,
    ['comment', blockComment],
    ['comment', hash ? hashComment : lineComment],
    ['string', /"""[\s\S]*?"""|"(?:\\[\s\S]|[^\\"\n])*"|'(?:\\[\s\S]|[^\\'\n])*'|`[^`]*`/],
    ['keyword', words('abstract and as async await auto break case catch char class const continue def default defer delegate do double elif else elsif end enum explicit export extends extern final finally float fn for foreach fun func go goto if impl implements import in init inline int interface internal is lambda let long loop match mod module mut namespace new not object operator or override package private protected pub public readonly ref register return sealed self short signed sizeof static struct super switch synchronized template this throw throws trait try typedef typename typeof union unless unsafe unsigned until use using val var virtual void volatile when where while with yield')],
    ['boolean', /\b(?:true|false|nil|null|None)\b/],
    ['class-name', /\b[A-Z][a-zA-Z0-9_]*\b/],
    ['function', /\b[a-zA-Z_]\w*(?=\s*\()/],
    ['number', number],
    ['operator', /[-+*/%=!<>&|^~?:]+/],
    ['punctuation', /[{}[\];(),.]/],
  ];
  const cLike = general([['macro property', /(?<=^|\n)[ \t]*#[ \t]*[a-z]+\b.*/]], false);
  const ruby = general([['symbol', /(?<!:):[a-z_]\w*[?!]?/i], ['variable', /[@$]+[a-z_]\w*/i]], true);
  const yaml = [
    ['comment', hashComment],
    ['atrule key', /[\w-][\w .-]*(?=\s*:(?:\s|$))/],
    ['string', quoted],
    ['boolean important', /\b(?:true|false|yes|no|null|~)\b/i],
    ['number', /[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?\b/i],
    ['punctuation', /---|[:[\]{}\-,|>?]/],
  ];
  const markdown = [
    ['title important', /(?<=^|\n)#{1,6}[ \t].*/],
    ['blockquote punctuation', /(?<=^|\n)>/],
    ['code', /```[\s\S]*?```|`[^`\n]+`/],
    ['bold important', /\*\*[^*\n]+\*\*|__[^_\n]+__/],
    ['italic', /\*[^*\n]+\*|_[^_\n]+_/],
    ['url', /!?\[[^\]\n]*\]\([^)\n]*\)/],
    ['list punctuation', /(?<=^|\n)[ \t]*(?:[*+-]|\d+\.)(?=[ \t])/],
    ['hr punctuation', /(?<=^|\n)(?:-{3,}|\*{3,})(?=\n|$)/],
  ];
  const git = [
    ['comment', /(?<=^|\n)#.*/],
    ['deleted', /(?<=^|\n)[-<].*/],
    ['inserted', /(?<=^|\n)[+>].*/],
    ['command', /(?<=^|\n)[ \t]*\$ git .*/],
    ['commit-sha1', /\b[\da-f]{40}\b/],
    ['coord', /(?<=^|\n)@@.*@@/],
  ];

  const GRAMMARS = {
    markup, html: markup, xml: markup, svg: markup, mathml: markup,
    css, scss, sass: scss, less,
    javascript: js, js, typescript: ts, ts, jsx, tsx,
    json, python, py: python, sql, bash, shell: bash, sh: bash, powershell, ps: powershell,
    ruby, rb: ruby, yaml, yml: yaml, markdown, md: markdown, git,
    c: cLike, cpp: cLike, csharp: cLike, cs: cLike, java: cLike, go: cLike, kotlin: cLike, swift: cLike,
    rust: cLike, dart: cLike, scala: cLike, objectivec: cLike,
    perl: general([['variable', /[$@%][\w:]+/]], true), r: general([], true),
  };

  // The code of a language, coloured.
  function highlight(code, language) {
    const lang = String(language || '').toLowerCase();
    if (lang === 'php') return run(code, /<\?(?:php|=)/i.test(code) ? phpInHtml : phpCode);
    return run(code, GRAMMARS[lang] || general([], false));
  }
  window.harlowCodeHighlight = { highlight };

  // The lines' boxes in the code, from its top: one line each, or as tall as it wraps.
  function lineBoxes(pre, code, lines, wraps) {
    const cs = getComputedStyle(code);
    let lh = parseFloat(cs.lineHeight);
    if (Number.isNaN(lh)) lh = parseFloat(cs.fontSize) * 1.5;
    if (!wraps) return lines.map((x, i) => ({ top: i * lh, height: lh }));
    // The code is inline: its lines are as wide as the box's content.
    const ps = getComputedStyle(pre);
    const width = pre.clientWidth - parseFloat(ps.paddingLeft) - parseFloat(ps.paddingRight);
    const sizer = document.createElement('span');
    sizer.className = 'line-numbers-sizer';
    sizer.style.cssText = `position:absolute;visibility:hidden;display:block;white-space:pre-wrap;word-wrap:break-word;width:${width}px;font:${cs.font};line-height:${cs.lineHeight};tab-size:${cs.tabSize}`;
    pre.appendChild(sizer);
    let top = 0;
    const boxes = lines.map((line) => {
      sizer.textContent = line || '\n';
      const height = sizer.getBoundingClientRect().height || lh;
      const box = { top, height };
      top += height;
      return box;
    });
    sizer.remove();
    return boxes;
  }

  function init(widget) {
    const box = widget.querySelector('[class*="prismjs-"]');
    const pre = box && box.querySelector('pre');
    const code = pre && pre.querySelector('code');
    if (!code) return undefined;
    if (!code.dataset.harlowSource) {
      // What the code is: the words of its xmp, as typed ("</xmp" was written "&lt;/xmp").
      code.dataset.harlowSource = code.textContent.replace(/&lt;\/xmp/gi, '</xmp');
    }
    const source = code.dataset.harlowSource;
    const language = (/language-([\w-]+)/.exec(code.className) || [])[1] || 'markup';
    code.innerHTML = highlight(source, language);

    const lines = source.replace(/\n$/, '').split('\n');
    const wraps = box.classList.contains('word-wrap');
    const off = [];

    // Line numbers.
    let rows = null;
    if (pre.classList.contains('line-numbers')) {
      rows = document.createElement('span');
      rows.className = 'line-numbers-rows';
      rows.setAttribute('aria-hidden', 'true');
      rows.innerHTML = '<span></span>'.repeat(lines.length);
      code.appendChild(rows);
    }

    // Marked lines.
    const ranges = (pre.getAttribute('data-line') || '').split(',').map((r) => r.trim()).filter(Boolean);
    const layout = () => {
      const boxes = lineBoxes(pre, code, lines, wraps);
      if (rows && wraps) {
        [...rows.children].forEach((row, i) => { row.style.height = `${boxes[i] ? boxes[i].height : 0}px`; });
      }
      pre.querySelectorAll(':scope > .line-highlight').forEach((el) => el.remove());
      ranges.forEach((range) => {
        const [a, b] = range.split('-').map(Number);
        const start = Math.max(1, a || 1);
        const end = Math.min(lines.length, b || start);
        if (!boxes[start - 1] || end < start) return;
        const mark = document.createElement('div');
        mark.className = 'line-highlight';
        mark.setAttribute('aria-hidden', 'true');
        mark.dataset.range = range;
        mark.dataset.start = String(start);
        if (end > start) mark.dataset.end = String(end);
        mark.style.top = `${code.offsetTop + boxes[start - 1].top}px`;
        mark.style.height = `${boxes[end - 1].top + boxes[end - 1].height - boxes[start - 1].top}px`;
        pre.appendChild(mark);
      });
    };
    if (ranges.length || (rows && wraps)) {
      layout();
      const onResize = () => layout();
      window.addEventListener('resize', onResize);
      off.push(() => window.removeEventListener('resize', onResize));
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    }

    // The toolbar's Copy button.
    let toolbar = null;
    if (box.classList.contains('copy-to-clipboard')) {
      toolbar = document.createElement('div');
      toolbar.className = 'code-toolbar';
      pre.parentNode.insertBefore(toolbar, pre);
      toolbar.appendChild(pre);
      const bar = document.createElement('div');
      bar.className = 'toolbar';
      bar.innerHTML = '<div class="toolbar-item"><button class="copy-to-clipboard-button" type="button" data-copy-state="copy"><span>Copy</span></button></div>';
      toolbar.appendChild(bar);
      const button = bar.querySelector('button');
      let timer = null;
      const say = (state, words) => {
        button.dataset.copyState = state;
        button.firstChild.textContent = words;
        clearTimeout(timer);
        timer = setTimeout(() => {
          button.dataset.copyState = 'copy';
          button.firstChild.textContent = 'Copy';
        }, 5000);
      };
      const fallback = () => {
        const area = document.createElement('textarea');
        area.value = source;
        area.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
        document.body.appendChild(area);
        area.select();
        let done = false;
        try { done = document.execCommand('copy'); } catch (e) { done = false; }
        area.remove();
        say(done ? 'copy-success' : 'copy-error', done ? 'Copied!' : 'Press Ctrl+C to copy');
      };
      button.addEventListener('click', () => {
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(source).then(() => say('copy-success', 'Copied!'), fallback);
        } else {
          fallback();
        }
      });
      off.push(() => clearTimeout(timer));
    }

    return () => {
      off.forEach((f) => f());
      if (toolbar && toolbar.parentNode) {
        toolbar.parentNode.insertBefore(pre, toolbar);
        toolbar.remove();
      }
      pre.querySelectorAll(':scope > .line-highlight').forEach((el) => el.remove());
      code.textContent = source;
    };
  }

  window.harlowWidgets = window.harlowWidgets || {};
  window.harlowWidgets['code-highlight'] = init;
  if (!window.harlowWidgetsManual) {
    document.querySelectorAll('.elementor-widget-code-highlight').forEach((el) => init(el));
  }
})();
