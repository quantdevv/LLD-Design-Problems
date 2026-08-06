// ═══════════════════════════════════════════════════
// LLD problem renderer — produces the body HTML for one problem
// ═══════════════════════════════════════════════════
(function (root) {
  function esc(s) {
    return s == null ? '' : String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function md(s) {
    return String(s||'')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/`([^`]+)`/g,'<code class="ic">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g,'<em>$1</em>')
      .replace(/\n/g,'<br/>');
  }

  const DIFF_MAP = {
    hard:'ptag-hard', medium:'ptag-med', easy:'ptag-easy',
    pattern:'ptag-pat', concept:'ptag-cyan'
  };

  // ─────────────────────────────────────────────
  // sub-renderers
  // ─────────────────────────────────────────────
  function renderHeader(p, idx) {
    const num = String(idx+1).padStart(2,'0');
    let h = `<header class="prob-header" data-section="header">`;
    h += `<div class="prob-eyebrow"><span class="prob-num">Problem ${num}</span>`;
    (p.tags||[]).forEach(t => {
      const cls = DIFF_MAP[t.type] || 'ptag-pat';
      h += `<span class="ptag ${cls}">${esc(t.label)}</span>`;
    });
    h += `</div>`;
    h += `<h1 class="prob-title">${esc(p.title)}</h1>`;
    h += `<p class="prob-desc">${md(p.description)}</p>`;
    h += `</header>`;
    return h;
  }

  function renderUnderstanding(p) {
    if (!p.prompt && !p.clarifying_questions?.length) return '';
    let h = `<section class="sec" data-section="understanding" id="sec-understanding">`;
    h += sectionHead('01', 'Understanding the Problem', 'How a strong candidate scopes the prompt');
    if (p.prompt) {
      h += `<div class="prompt-box">`;
      h += `<div class="prompt-tag">Interviewer says</div>`;
      h += `<div class="prompt-text">${esc(p.prompt)}</div>`;
      h += `</div>`;
    }
    if (p.prompt_note) h += `<p class="lede">${md(p.prompt_note)}</p>`;
    if (p.clarifying_questions?.length) {
      h += `<h3 class="subhead">Clarifying questions worth asking</h3>`;
      h += `<div class="clarify">`;
      p.clarifying_questions.forEach((q, i) => {
        h += `<div class="clarify-item">`;
        h += `<div class="clarify-row clarify-q"><span class="clarify-tag clarify-tag-q">Q${i+1}</span><div>${md(q.question)}</div></div>`;
        h += `<div class="clarify-row clarify-a"><span class="clarify-tag clarify-tag-a">A</span><div>${md(q.answer)}</div></div>`;
        if (q.why) h += `<div class="clarify-why"><strong>Why this matters →</strong> ${md(q.why)}</div>`;
        h += `</div>`;
      });
      h += `</div>`;
    }
    h += `</section>`;
    return h;
  }

  function renderRequirements(p) {
    if (!p.functional_requirements && !p.non_functional_requirements
        && !p.primary_scope && !p.termination_points) return '';
    let h = `<section class="sec" data-section="requirements" id="sec-requirements">`;
    h += sectionHead('02', 'Requirements & Scope', 'What we promise to deliver — and what breaks the contract');

    const grid = [];
    if (p.functional_requirements) grid.push(reqBox('Functional', p.functional_requirements, 'fr'));
    if (p.non_functional_requirements) grid.push(reqBox('Non-Functional', p.non_functional_requirements, 'nfr'));
    if (grid.length) h += `<div class="req-grid">${grid.join('')}</div>`;

    if (p.primary_scope || p.termination_points) {
      h += `<div class="scope-grid">`;
      if (p.primary_scope) {
        h += `<div class="scope-col scope-primary">`;
        h += `<div class="scope-head"><span class="scope-dot scope-dot-g"></span>Primary Scope</div>`;
        h += `<ul class="scope-list">`;
        p.primary_scope.forEach(s => h += `<li>${md(s)}</li>`);
        h += `</ul></div>`;
      }
      if (p.termination_points) {
        h += `<div class="scope-col scope-term">`;
        h += `<div class="scope-head"><span class="scope-dot scope-dot-r"></span>Termination &amp; Error Points</div>`;
        h += `<ul class="scope-list">`;
        p.termination_points.forEach(s => h += `<li>${md(s)}</li>`);
        h += `</ul></div>`;
      }
      h += `</div>`;
    }
    h += `</section>`;
    return h;
  }

  function reqBox(title, data, kind) {
    let h = `<div class="req-box req-${kind}">`;
    h += `<div class="req-title">${title} Requirements</div>`;
    if (data.core?.length) {
      h += `<div class="req-section">`;
      h += `<div class="req-section-tag req-tag-in">In Scope</div><ul class="req-list">`;
      data.core.forEach((r,i) => {
        h += `<li class="req-item"><span class="req-num">${i+1}</span><div>${md(r)}</div></li>`;
      });
      h += `</ul></div>`;
    }
    if (data.out_of_scope?.length) {
      h += `<div class="req-section">`;
      h += `<div class="req-section-tag req-tag-out">Out of Scope</div><ul class="req-list">`;
      data.out_of_scope.forEach(r => {
        h += `<li class="req-item req-item-out"><span class="req-num req-num-out">×</span><div>${md(r)}</div></li>`;
      });
      h += `</ul></div>`;
    }
    h += `</div>`;
    return h;
  }

  function renderEntities(p) {
    if (!p.entities?.length && !p.relationships?.length) return '';
    let h = `<section class="sec" data-section="entities" id="sec-entities">`;
    h += sectionHead('03', 'Entities & Relationships', 'Pick the nouns that hold state — discard the rest');
    if (p.entity_intro) h += `<p class="lede">${md(p.entity_intro)}</p>`;
    if (p.entities?.length) {
      h += `<div class="entity-grid">`;
      p.entities.forEach(e => {
        const v = e.verdict === 'yes' ? 'yes' : e.verdict === 'no' ? 'no' : 'maybe';
        h += `<div class="entity-card entity-${v}">`;
        h += `<div class="entity-head"><span class="entity-name">${esc(e.name)}</span>`;
        h += `<span class="entity-badge entity-badge-${v}">${esc(e.verdict_label||'')}</span></div>`;
        h += `<div class="entity-role">${md(e.role)}</div>`;
        h += `</div>`;
      });
      h += `</div>`;
    }
    if (p.relationships?.length) {
      h += `<h3 class="subhead">Ownership map</h3>`;
      h += `<div class="rel-table"><table>`;
      h += `<thead><tr><th>Entity</th><th>Owns</th><th>Relationship</th></tr></thead><tbody>`;
      p.relationships.forEach(r => {
        h += `<tr><td><strong>${esc(r.entity)}</strong></td><td>${md(r.owns)}</td><td>${md(r.rel)}</td></tr>`;
      });
      h += `</tbody></table></div>`;
    }
    h += `</section>`;
    return h;
  }

  function renderClasses(p) {
    if (!p.classes?.length) return '';
    let h = `<section class="sec" data-section="classes" id="sec-classes">`;
    h += sectionHead('04', 'Class Design', 'UML-style breakdown across model / service / controller layers');
    if (p.mvc_note) h += `<div class="callout callout-purple"><div class="callout-tag">MVC Mapping</div>${md(p.mvc_note)}</div>`;

    // group by layer
    const buckets = { Model: [], Service: [], Controller: [], Other: [] };
    p.classes.forEach(c => {
      const layer = c.layer || 'Other';
      (buckets[layer] || buckets.Other).push(c);
    });
    const order = ['Model','Service','Controller','Other'];
    h += `<div class="class-board">`;
    order.forEach(layer => {
      const list = buckets[layer];
      if (!list.length) return;
      h += `<div class="layer-col layer-col-${layer.toLowerCase()}">`;
      h += `<div class="layer-head"><span class="layer-dot"></span>${layer} Layer</div>`;
      h += `<div class="layer-cards">`;
      list.forEach(c => {
        const tcls = c.type === 'interface' ? 'iface' : c.type === 'abstract' ? 'abs' : '';
        h += `<div class="cd-card ${tcls}">`;
        h += `<div class="cd-head">`;
        if (c.type === 'interface') h += `<span class="cd-stereotype">«interface»</span>`;
        else if (c.type === 'abstract') h += `<span class="cd-stereotype cd-stereotype-abs">«abstract»</span>`;
        h += `<span class="cd-name">${esc(c.name)}</span>`;
        h += `</div>`;
        h += `<div class="cd-body">`;
        if (c.fields?.length) {
          h += `<div class="cd-section-fields">`;
          c.fields.forEach(f => {
            h += `<div class="cd-line"><span class="cd-vis">−</span><span class="cd-fld">${esc(f.name)}</span><span class="cd-typ">: ${esc(f.type)}</span></div>`;
          });
          h += `</div>`;
        }
        if (c.fields?.length && c.methods?.length) h += `<div class="cd-divider"></div>`;
        if (c.methods?.length) {
          h += `<div class="cd-section-methods">`;
          c.methods.forEach(m => {
            h += `<div class="cd-line"><span class="cd-vis cd-vis-pub">+</span><span class="cd-mth">${esc(m.name)}</span><span class="cd-typ">: ${esc(m.returns)}</span></div>`;
          });
          h += `</div>`;
        }
        h += `</div></div>`;
      });
      h += `</div></div>`;
    });
    h += `</div>`;
    h += `</section>`;
    return h;
  }

  function renderSchema(p) {
    if (!p.db_schema?.length) return '';
    let h = `<section class="sec" data-section="schema" id="sec-schema">`;
    h += sectionHead('05', 'Database Schema', 'Tables, keys, and the indices that earn their keep');
    h += `<div class="schema-grid">`;
    p.db_schema.forEach(t => {
      h += `<div class="schema-card">`;
      h += `<div class="schema-head"><span class="schema-icon">▤</span>${esc(t.table)}</div>`;
      h += `<div class="schema-body">`;
      t.columns.forEach(c => {
        h += `<div class="schema-row">`;
        h += `<span class="schema-col-name">${esc(c.name)}</span>`;
        h += `<span class="schema-col-type">${esc(c.type)}</span>`;
        h += `<span class="schema-col-flags">`;
        if (c.pk) h += `<span class="schema-flag schema-pk">PK</span>`;
        if (c.fk) h += `<span class="schema-flag schema-fk">FK</span>`;
        if (c.idx) h += `<span class="schema-flag schema-idx">IDX</span>`;
        h += `</span></div>`;
      });
      h += `</div></div>`;
    });
    h += `</div>`;
    if (p.schema_note) h += `<div class="callout callout-blue"><div class="callout-tag">Indexing note</div>${md(p.schema_note)}</div>`;
    h += `</section>`;
    return h;
  }

  function renderCode(p) {
    if (!p.code_sections?.length) return '';
    let h = `<section class="sec" data-section="code" id="sec-code">`;
    h += sectionHead('06', 'Code Implementation', 'Production-shaped Java — flow, edge cases, and the "why"');
    p.code_sections.forEach((cs, i) => {
      h += `<div class="code-section">`;
      if (cs.label) h += `<h3 class="code-label">${esc(cs.label)}</h3>`;
      if (cs.flow) h += `<div class="callout callout-green"><div class="callout-tag">Flow</div>${md(cs.flow)}</div>`;
      if (cs.edge_cases) h += `<div class="callout callout-red"><div class="callout-tag">Edge Cases</div>${md(cs.edge_cases)}</div>`;
      if (p.code_lang === 'Java') {
        h += `<div class="code-wrapper" data-code-idx="${i}">`;
        h += `<div class="code-header">`;
        h += `<div class="code-dots"><span class="code-dot code-dot-r"></span><span class="code-dot code-dot-y"></span><span class="code-dot code-dot-g"></span></div>`;
        h += `<span class="code-lang-badge">${esc(cs.label||'Java')}</span>`;
        h += `<div class="code-actions">`;
        h += `<button class="code-btn" data-act="wrap" title="Toggle word-wrap">⇄ Wrap</button>`;
        h += `<button class="code-btn code-btn-copy" data-act="copy">Copy</button>`;
        h += `</div>`;
        h += `</div>`;
        h += `<pre class="java-code">${HL.highlight(cs.code)}</pre>`;
        h += `</div>`;
      } else {
        h += `<pre class="plain-code"><code>${esc(cs.code)}</code></pre>`;
      }
      h += `</div>`;
    });
    h += `</section>`;
    return h;
  }

  function renderPatterns(p) {
    if (!p.patterns?.length) return '';
    let h = `<section class="sec" data-section="patterns" id="sec-patterns">`;
    h += sectionHead('07', 'Design Patterns', 'Why each pattern was chosen — not just which');
    h += `<div class="pattern-grid">`;
    p.patterns.forEach((pt, i) => {
      h += `<div class="pattern-card">`;
      h += `<div class="pattern-i">${String(i+1).padStart(2,'0')}</div>`;
      h += `<div class="pattern-body">`;
      h += `<div class="pattern-name">${esc(pt.name)}</div>`;
      h += `<div class="pattern-why">${md(pt.why)}</div>`;
      if (pt.where) h += `<div class="pattern-where"><span class="pw-tag">Where</span> ${md(pt.where)}</div>`;
      h += `</div></div>`;
    });
    h += `</div></section>`;
    return h;
  }

  function renderConcurrency(p) {
    if (!p.concurrency?.length) return '';
    let h = `<section class="sec" data-section="concurrency" id="sec-concurrency">`;
    h += sectionHead('08', 'Concurrency Deep Dive', 'Race conditions you spot before the interviewer asks');
    h += `<div class="conc-list">`;
    p.concurrency.forEach((c,i) => {
      h += `<div class="conc-card">`;
      h += `<div class="conc-icon">⚠</div>`;
      h += `<div class="conc-body">`;
      h += `<div class="conc-issue">${esc(c.issue)}</div>`;
      h += `<div class="conc-fix">${md(c.fix)}</div>`;
      h += `</div></div>`;
    });
    h += `</div></section>`;
    return h;
  }

  function renderDeepDives(p) {
    if (!p.deep_dives?.length) return '';
    let h = `<section class="sec" data-section="deepdives" id="sec-deepdives">`;
    h += sectionHead('09', 'Deep Dives', 'Follow-up questions you should be ready for');
    h += `<div class="dd-list">`;
    p.deep_dives.forEach((d, i) => {
      h += `<details class="dd-card" ${i===0?'open':''}>`;
      h += `<summary class="dd-summary">`;
      h += `<span class="dd-q-tag">Q${i+1}</span>`;
      h += `<span class="dd-q-text">${md(d.question)}</span>`;
      h += `<span class="dd-chev">▾</span>`;
      h += `</summary>`;
      h += `<div class="dd-answer">${md(d.answer)}</div>`;
      h += `</details>`;
    });
    h += `</div></section>`;
    return h;
  }

  function sectionHead(num, title, sub) {
    return `<div class="sec-head">
      <div class="sec-num">${num}</div>
      <div><div class="sec-title">${title}</div>
      <div class="sec-sub">${sub}</div></div>
    </div>`;
  }

  // ─────────────────────────────────────────────
  // master assemble
  // ─────────────────────────────────────────────
  function renderProblem(p, idx) {
    if (p._missing) {
      return `<div class="missing-card">
        <div class="missing-num">${String(idx+1).padStart(2,'0')}</div>
        <div class="missing-title">${esc(p.title)}</div>
        <div class="missing-desc">${md(p.description)}</div>
      </div>`;
    }
    return [
      renderHeader(p, idx),
      renderUnderstanding(p),
      renderRequirements(p),
      renderEntities(p),
      renderClasses(p),
      renderSchema(p),
      renderCode(p),
      renderPatterns(p),
      renderConcurrency(p),
      renderDeepDives(p),
    ].join('');
  }

  // section list for in-page TOC
  function getSections(p) {
    const out = [{id:'sec-top', label:'Overview'}];
    if (p.prompt || p.clarifying_questions?.length) out.push({id:'sec-understanding', label:'Understanding', n:'01'});
    if (p.functional_requirements || p.non_functional_requirements || p.primary_scope) out.push({id:'sec-requirements', label:'Requirements', n:'02'});
    if (p.entities?.length) out.push({id:'sec-entities', label:'Entities', n:'03'});
    if (p.classes?.length) out.push({id:'sec-classes', label:'Class Design', n:'04'});
    if (p.db_schema?.length) out.push({id:'sec-schema', label:'DB Schema', n:'05'});
    if (p.code_sections?.length) out.push({id:'sec-code', label:'Code', n:'06'});
    if (p.patterns?.length) out.push({id:'sec-patterns', label:'Patterns', n:'07'});
    if (p.concurrency?.length) out.push({id:'sec-concurrency', label:'Concurrency', n:'08'});
    if (p.deep_dives?.length) out.push({id:'sec-deepdives', label:'Deep Dives', n:'09'});
    return out;
  }

  root.LLDRender = { renderProblem, getSections, esc, md };
})(window);
