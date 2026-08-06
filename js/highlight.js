// ═══════════════════════════════════════════════════
// Java token-based syntax highlighter
// Returns HTML with line numbers, classed spans for theming
// ═══════════════════════════════════════════════════
(function (root) {
  const KEYWORDS = new Set([
    'abstract','assert','boolean','break','byte','case','catch','char','class',
    'const','continue','default','do','double','else','enum','extends','final',
    'finally','float','for','goto','if','implements','import','instanceof','int',
    'interface','long','native','new','package','private','protected','public',
    'return','short','static','strictfp','super','switch','synchronized','this',
    'throw','throws','transient','try','void','volatile','while',
    'null','true','false','var','record','sealed','permits','yield'
  ]);

  const TYPES = new Set([
    'String','Integer','Boolean','Long','Double','Float','Character','Byte','Short',
    'Object','Number','Math','System','Thread','Runnable','Callable','Iterable',
    'Comparable','AutoCloseable','Exception','RuntimeException','Error','Throwable',
    'List','Set','Map','Queue','Deque','Collection','Optional','Stream','Iterator',
    'ArrayList','LinkedList','HashSet','TreeSet','LinkedHashSet',
    'HashMap','TreeMap','LinkedHashMap','ConcurrentHashMap','CopyOnWriteArrayList',
    'AtomicInteger','AtomicLong','AtomicBoolean','AtomicReference',
    'ReentrantLock','ReadWriteLock','ReentrantReadWriteLock','Semaphore',
    'CountDownLatch','CyclicBarrier','BlockingQueue','ArrayBlockingQueue',
    'LinkedBlockingQueue','PriorityQueue','PriorityBlockingQueue','EnumMap',
    'ExecutorService','Executor','ThreadPoolExecutor','ScheduledExecutorService',
    'Executors','Future','CompletableFuture','TimeUnit','Collections','Arrays',
    'UUID','LocalDate','LocalTime','LocalDateTime','ZonedDateTime','Instant',
    'Duration','ChronoUnit','DateTimeFormatter','DayOfWeek',
    'StringBuilder','StringBuffer','Scanner','Random','Objects','Comparator',
    'Supplier','Consumer','Function','Predicate','BiFunction','BiConsumer',
    'UnaryOperator','BinaryOperator','Enum','Override','SuppressWarnings',
    'FunctionalInterface','Deprecated','SafeVarargs','IllegalStateException',
    'IllegalArgumentException','NullPointerException'
  ]);

  function esc(s) {
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function span(cls, txt) { return `<span class="${cls}">${esc(txt)}</span>`; }

  function tokenize(code) {
    let out = '', i = 0, len = code.length;
    while (i < len) {
      // single-line comment
      if (code[i]==='/' && code[i+1]==='/') {
        let j = i+2;
        while (j < len && code[j] !== '\n') j++;
        out += span('jc', code.slice(i, j)); i = j; continue;
      }
      // block comment
      if (code[i]==='/' && code[i+1]==='*') {
        let j = i+2;
        while (j < len-1 && !(code[j]==='*' && code[j+1]==='/')) j++;
        j += 2;
        out += span('jc', code.slice(i, j)); i = j; continue;
      }
      // string
      if (code[i]==='"') {
        if (code[i+1]==='"' && code[i+2]==='"') {
          let j = i+3;
          while (j < len-2 && !(code[j]==='"' && code[j+1]==='"' && code[j+2]==='"')) j++;
          j += 3;
          out += span('js', code.slice(i, j)); i = j; continue;
        }
        let j = i+1;
        while (j < len && code[j] !== '"' && code[j] !== '\n') {
          if (code[j]==='\\') j++;
          j++;
        }
        j++;
        out += span('js', code.slice(i, j)); i = j; continue;
      }
      // char
      if (code[i]==="'") {
        let j = i+1;
        while (j < len && code[j] !== "'" && code[j] !== '\n') {
          if (code[j]==='\\') j++;
          j++;
        }
        j++;
        out += span('js', code.slice(i, j)); i = j; continue;
      }
      // annotation
      if (code[i]==='@') {
        let j = i+1;
        while (j < len && /\w/.test(code[j])) j++;
        out += span('ja', code.slice(i, j)); i = j; continue;
      }
      // number
      if (/[0-9]/.test(code[i]) || (code[i]==='.' && /[0-9]/.test(code[i+1]||''))) {
        let j = i;
        if (code[i]==='0' && (code[i+1]==='x'||code[i+1]==='X')) {
          j += 2;
          while (j < len && /[0-9a-fA-F_]/.test(code[j])) j++;
        } else {
          while (j < len && /[0-9_\.]/.test(code[j])) j++;
          if (j < len && (code[j]==='e'||code[j]==='E')) {
            j++;
            if (code[j]==='+'||code[j]==='-') j++;
            while (j < len && /[0-9]/.test(code[j])) j++;
          }
          if (j < len && /[lLfFdD]/.test(code[j])) j++;
        }
        out += span('jn', code.slice(i, j)); i = j; continue;
      }
      // identifier
      if (/[a-zA-Z_$]/.test(code[i])) {
        let j = i;
        while (j < len && /[\w$]/.test(code[j])) j++;
        const word = code.slice(i, j);
        let k = j;
        while (k < len && (code[k]===' '||code[k]==='\t')) k++;
        const isCall = code[k]==='(';

        if (KEYWORDS.has(word)) {
          out += span('jk', word);
        } else if (isCall && !KEYWORDS.has(word)) {
          if (/^[A-Z]/.test(word)) out += span('jt', word);
          else out += span('jm', word);
        } else if (TYPES.has(word)) {
          out += span('jt', word);
        } else if (/^[A-Z][A-Z0-9_]+$/.test(word)) {
          out += span('jb', word);
        } else if (/^[A-Z]/.test(word)) {
          out += span('jt', word);
        } else {
          out += esc(word);
        }
        i = j; continue;
      }
      // anything else
      out += esc(code[i]);
      i++;
    }
    return out;
  }

  function highlight(rawCode) {
    if (!rawCode) return '';
    const tokenized = tokenize(rawCode);
    const lines = tokenized.split('\n');
    if (lines.length && lines[lines.length-1].trim() === '') lines.pop();
    let result = '<code>';
    lines.forEach((line, idx) => {
      result += `<span class="code-line">` +
        `<span class="line-num">${idx+1}</span>` +
        `<span class="line-content">${line || ' '}</span>` +
        `</span>`;
    });
    result += '</code>';
    return result;
  }

  root.HL = { highlight };
})(window);
