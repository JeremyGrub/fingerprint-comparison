// src/pages/ComparisonPage.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FabricJSCanvas, useFabricJSEditor } from 'fabricjs-react';
import { Circle } from 'fabric';

const people = [
  { id: 1, name: 'Person 1', prints: Array.from({ length: 10 }, (_, i) => `/images/person1/print1-${i + 1}.jpg`) },
  { id: 2, name: 'Person 2', prints: Array.from({ length: 10 }, (_, i) => `/images/person2/print2-${i + 1}.jpg`) },
  { id: 3, name: 'Person 3', prints: Array.from({ length: 10 }, (_, i) => `/images/person3/print3-${i + 1}.jpg`) },
];

const latentPrints = Array.from({ length: 5 }, (_, i) => `/images/latent/latent-${i + 1}.jpg`);

const DOT_RADIUS = 4;

const pageVariants = {
  initial: { opacity: 0, y: 14 },
  in:      { opacity: 1, y: 0 },
  out:     { opacity: 0, y: -10 },
};

const ComparisonPage = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const { editor: knownEditor, onReady: onReadyKnown } = useFabricJSEditor();
  const { editor: latentEditor, onReady: onReadyLatent } = useFabricJSEditor();

  const [selectedPerson, setSelectedPerson]           = useState(people[0]);
  const [selectedPrint, setSelectedPrint]             = useState(people[0].prints[0]);
  const [selectedLatentPrint, setSelectedLatentPrint] = useState(latentPrints[0]);

  // Tools state
  const [dotColor, setDotColor] = useState('#ff0000');
  const [activeSide, setActiveSide] = useState('known'); // 'known' | 'latent'

  // Mobile tab (only affects display on small screens)
  const [mobileTab, setMobileTab] = useState('known'); // 'known' | 'latent'

  // History stacks per canvas
  const knownHistory  = useRef({ undo: [], redo: [] });
  const latentHistory = useRef({ undo: [], redo: [] });

  // =========================
  // Identify / Exclude storage
  // =========================
  const STORAGE_KEY = `lla_case_${caseId}_decisions`;

  const loadCaseData = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { decisions: {}, identifiedByLatent: {} };
    } catch {
      return { decisions: {}, identifiedByLatent: {} };
    }
  };

  const saveCaseData = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const [caseData, setCaseData] = useState(() => loadCaseData());

  useEffect(() => {
    saveCaseData(caseData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseData]);

  const getLatentIndexFromUrl = (url) => {
    const match = url.match(/latent-(\d+)\.jpg$/);
    return match ? Number(match[1]) : 1;
  };

  const getFingerIndexFromUrl = (url) => {
    const match = url.match(/-(\d+)\.jpg$/);
    return match ? Number(match[1]) : 1;
  };

  const buildComboKey = ({ caseId: cId, latentIndex, personId, fingerIndex }) =>
    `case:${cId}|latent:${latentIndex}|person:${personId}|finger:${fingerIndex}`;

  const latentIndex = getLatentIndexFromUrl(selectedLatentPrint);
  const fingerIndex = getFingerIndexFromUrl(selectedPrint);
  const personId    = selectedPerson.id;

  const comboKey    = buildComboKey({ caseId, latentIndex, personId, fingerIndex });
  const comboStatus = caseData.decisions?.[comboKey] || null;

  // =========================
  // Confirm modal for Identify overwrite
  // =========================
  const [confirmOpen, setConfirmOpen]       = useState(false);
  const [pendingIdentify, setPendingIdentify] = useState(null);

  const getCurrentIdentifyForLatent = (latentNum) =>
    caseData.identifiedByLatent?.[`latent:${latentNum}`] || null;

  const applyIdentify = ({ latentIndex: lNum, personId: pId, fingerIndex: fNum, comboKey: key }) => {
    setCaseData((prev) => {
      const next = structuredClone(prev);
      next.decisions[key] = 'identify';
      next.identifiedByLatent[`latent:${lNum}`] = { personId: pId, fingerIndex: fNum };
      Object.keys(next.decisions).forEach((k) => {
        const sameLatent = k.includes(`case:${caseId}|latent:${lNum}|`);
        if (sameLatent && k !== key && next.decisions[k] === 'identify') {
          delete next.decisions[k];
        }
      });
      return next;
    });
  };

  const requestIdentify = useCallback(() => {
    const current = getCurrentIdentifyForLatent(latentIndex);
    const sameAsCurrent =
      current &&
      Number(current.personId)    === Number(personId) &&
      Number(current.fingerIndex) === Number(fingerIndex);

    if (sameAsCurrent) {
      applyIdentify({ latentIndex, personId, fingerIndex, comboKey });
      return;
    }
    if (current) {
      setPendingIdentify({ latentIndex, personId, fingerIndex, comboKey });
      setConfirmOpen(true);
      return;
    }
    applyIdentify({ latentIndex, personId, fingerIndex, comboKey });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latentIndex, personId, fingerIndex, comboKey, caseData]);

  const confirmUpdateIdentify = () => {
    if (!pendingIdentify) return;
    applyIdentify(pendingIdentify);
    setPendingIdentify(null);
    setConfirmOpen(false);
  };

  const cancelUpdateIdentify = () => {
    setPendingIdentify(null);
    setConfirmOpen(false);
  };

  const setExclude = useCallback(() => {
    setCaseData((prev) => {
      const next = structuredClone(prev);
      next.decisions[comboKey] = 'exclude';
      const latentKey    = `latent:${latentIndex}`;
      const currentIdent = next.identifiedByLatent?.[latentKey];
      if (
        currentIdent &&
        Number(currentIdent.personId)    === Number(personId) &&
        Number(currentIdent.fingerIndex) === Number(fingerIndex)
      ) {
        delete next.identifiedByLatent[latentKey];
      }
      return next;
    });
  }, [comboKey, latentIndex, personId, fingerIndex]);

  const clearDecision = useCallback(() => {
    setCaseData((prev) => {
      const next        = structuredClone(prev);
      const latentKey   = `latent:${latentIndex}`;
      const wasIdentify = next.decisions?.[comboKey] === 'identify';
      delete next.decisions[comboKey];
      const currentIdent = next.identifiedByLatent?.[latentKey];
      if (
        wasIdentify &&
        currentIdent &&
        Number(currentIdent.personId)    === Number(personId) &&
        Number(currentIdent.fingerIndex) === Number(fingerIndex)
      ) {
        delete next.identifiedByLatent[latentKey];
      }
      return next;
    });
  }, [comboKey, latentIndex, personId, fingerIndex]);

  // =========================
  // Existing handlers
  // =========================
  const handlePersonChange = (event) => {
    const person = people.find((p) => p.id === Number(event.target.value));
    setSelectedPerson(person);
    setSelectedPrint(person.prints[0]);
  };

  const handlePrintChange = (event) => {
    setSelectedPrint(event.target.value);
  };

  const handleLatentPrintChange = (event) => {
    setSelectedLatentPrint(event.target.value);
  };

  const getActiveContext = () => {
    if (activeSide === 'known') {
      return { editor: knownEditor, history: knownHistory.current, imageUrl: selectedPrint };
    }
    return { editor: latentEditor, history: latentHistory.current, imageUrl: selectedLatentPrint };
  };

  // =========================
  // Canvas loading + zoom setup
  // =========================
  const loadImageToCanvas = (editor, imageUrl) => {
    if (!editor?.canvas) return;

    // Sync canvas pixel dimensions to its DOM container so images scale correctly
    const canvasEl = editor.canvas.getElement();
    if (canvasEl) {
      const frame = canvasEl.closest('.image-frame');
      if (frame) {
        const w = frame.offsetWidth  || frame.clientWidth;
        const h = frame.offsetHeight || frame.clientHeight;
        if (w > 0 && h > 0) {
          editor.canvas.setWidth(w);
          editor.canvas.setHeight(h);
        }
      }
    }

    // Reset zoom/pan before loading new image
    editor.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    editor.canvas.clear();

    // Use uniform scale (contain) so fingerprints never stretch
    const SOURCE = 500;
    const scale  = Math.min(editor.canvas.width / SOURCE, editor.canvas.height / SOURCE);

    editor.canvas.setBackgroundImage(imageUrl, editor.canvas.renderAll.bind(editor.canvas), {
      scaleX:  scale,
      scaleY:  scale,
      originX: 'center',
      originY: 'center',
      left:    editor.canvas.width  / 2,
      top:     editor.canvas.height / 2,
    });
    const savedDots = JSON.parse(localStorage.getItem(imageUrl)) || [];
    savedDots.forEach((dot) => {
      const restoredDot = new Circle({
        left:        dot.x,
        top:         dot.y,
        radius:      DOT_RADIUS,
        fill:        dot.color || '#ff0000',
        selectable:  false,
        hasBorders:  false,
        hasControls: false,
        evented:     false,
        originX:     'center',
        originY:     'center',
      });
      editor.canvas.add(restoredDot);
    });
    editor.canvas.renderAll();
  };

  // One-time zoom + double-click-reset setup per canvas
  const setupZoom = useCallback((canvas) => {
    if (!canvas) return;

    canvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      zoom = Math.min(Math.max(zoom, 0.5), 5);
      canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });
  }, []);

  const addDot = useCallback(
    (editor, pointer, imageUrl, history) => {
      if (!editor?.canvas) return;
      const dot = new Circle({
        left:        pointer.x,
        top:         pointer.y,
        radius:      DOT_RADIUS,
        fill:        dotColor,
        selectable:  false,
        hasBorders:  false,
        hasControls: false,
        evented:     false,
        originX:     'center',
        originY:     'center',
      });
      editor.canvas.add(dot);
      editor.canvas.renderAll();
      history.undo.push({ type: 'add', object: dot, imageUrl });
      history.redo = [];
      const savedDots = JSON.parse(localStorage.getItem(imageUrl)) || [];
      savedDots.push({ x: pointer.x, y: pointer.y, color: dotColor });
      localStorage.setItem(imageUrl, JSON.stringify(savedDots));
    },
    [dotColor]
  );

  const handleCanvasClick = useCallback(
    (editor, imageUrl, history, sideName) => {
      if (!editor?.canvas) return;

      // Remove previous interaction listeners so they don't stack up
      editor.canvas.off('mouse:down');
      editor.canvas.off('mouse:move');
      editor.canvas.off('mouse:up');

      let isDragging = false;
      let lastX      = 0;
      let lastY      = 0;
      let startX     = 0;
      let startY     = 0;
      const PAN_THRESHOLD = 5; // px before treating movement as a pan

      editor.canvas.on('mouse:down', (opt) => {
        setActiveSide(sideName);
        if (sideName === 'known') setMobileTab('known');
        else setMobileTab('latent');

        const e = opt.e;
        isDragging = false;
        startX = lastX = e.clientX;
        startY = lastY = e.clientY;
      });

      editor.canvas.on('mouse:move', (opt) => {
        const e = opt.e;
        if (!e.buttons) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        if (!isDragging && Math.sqrt(dx * dx + dy * dy) > PAN_THRESHOLD) {
          isDragging = true;
        }

        if (isDragging) {
          const vpt = editor.canvas.viewportTransform;
          vpt[4] += e.clientX - lastX;
          vpt[5] += e.clientY - lastY;
          editor.canvas.requestRenderAll();
        }

        lastX = e.clientX;
        lastY = e.clientY;
      });

      editor.canvas.on('mouse:up', (opt) => {
        if (!isDragging) {
          // Instant dot placement — no delay
          const pointer = editor.canvas.getPointer(opt.e);
          addDot(editor, pointer, imageUrl, history);
        }
        isDragging = false;
      });
    },
    [addDot]
  );

  // Known canvas: one-time zoom setup
  useEffect(() => {
    if (!knownEditor?.canvas) return;
    setupZoom(knownEditor.canvas);
  }, [knownEditor, setupZoom]);

  // Latent canvas: one-time zoom setup
  useEffect(() => {
    if (!latentEditor?.canvas) return;
    setupZoom(latentEditor.canvas);
  }, [latentEditor, setupZoom]);

  // Known canvas: reload on image change
  useEffect(() => {
    if (!knownEditor) return;
    // rAF ensures the DOM is fully laid out before we read container dimensions
    requestAnimationFrame(() => {
      loadImageToCanvas(knownEditor, selectedPrint);
      handleCanvasClick(knownEditor, selectedPrint, knownHistory.current, 'known');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [knownEditor, selectedPrint, handleCanvasClick]);

  // Latent canvas: reload on image change
  useEffect(() => {
    if (!latentEditor) return;
    requestAnimationFrame(() => {
      loadImageToCanvas(latentEditor, selectedLatentPrint);
      handleCanvasClick(latentEditor, selectedLatentPrint, latentHistory.current, 'latent');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latentEditor, selectedLatentPrint, handleCanvasClick]);

  // =========================
  // Tool actions
  // =========================
  const clearDotsActive = useCallback(() => {
    const { editor, history, imageUrl } = getActiveContext();
    if (!editor?.canvas) return;
    const dots = editor.canvas.getObjects().filter((obj) => obj.type === 'circle');
    if (dots.length === 0) return;
    history.undo.push({ type: 'clear', objects: dots, imageUrl });
    history.redo = [];
    dots.forEach((d) => editor.canvas.remove(d));
    editor.canvas.renderAll();
    localStorage.removeItem(imageUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSide, knownEditor, latentEditor, selectedPrint, selectedLatentPrint]);

  const undoActive = useCallback(() => {
    const { editor, history, imageUrl } = getActiveContext();
    if (!editor?.canvas) return;
    const action = history.undo.pop();
    if (!action) return;
    if (action.type === 'add') {
      editor.canvas.remove(action.object);
      editor.canvas.renderAll();
      const saved = JSON.parse(localStorage.getItem(imageUrl)) || [];
      saved.pop();
      localStorage.setItem(imageUrl, JSON.stringify(saved));
    }
    if (action.type === 'clear') {
      action.objects.forEach((o) => editor.canvas.add(o));
      editor.canvas.renderAll();
      const circles  = editor.canvas.getObjects().filter((o) => o.type === 'circle');
      const rebuilt  = circles.map((c) => ({ x: c.left, y: c.top, color: c.fill }));
      localStorage.setItem(imageUrl, JSON.stringify(rebuilt));
    }
    history.redo.push(action);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSide, knownEditor, latentEditor, selectedPrint, selectedLatentPrint]);

  const redoActive = useCallback(() => {
    const { editor, history, imageUrl } = getActiveContext();
    if (!editor?.canvas) return;
    const action = history.redo.pop();
    if (!action) return;
    if (action.type === 'add') {
      editor.canvas.add(action.object);
      editor.canvas.renderAll();
      const saved = JSON.parse(localStorage.getItem(imageUrl)) || [];
      saved.push({ x: action.object.left, y: action.object.top, color: action.object.fill });
      localStorage.setItem(imageUrl, JSON.stringify(saved));
    }
    if (action.type === 'clear') {
      action.objects.forEach((o) => editor.canvas.remove(o));
      editor.canvas.renderAll();
      localStorage.removeItem(imageUrl);
    }
    history.undo.push(action);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSide, knownEditor, latentEditor, selectedPrint, selectedLatentPrint]);

  // Reset zoom + pan on both canvases
  const resetView = useCallback(() => {
    [knownEditor, latentEditor].forEach((ed) => {
      if (ed?.canvas) {
        ed.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        ed.canvas.requestRenderAll();
      }
    });
  }, [knownEditor, latentEditor]);

  // =========================
  // Keyboard shortcuts
  // =========================
  const actionsRef = useRef({});
  actionsRef.current = { undoActive, redoActive, requestIdentify, setExclude, clearDecision, clearDotsActive, resetView };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
      if (e.metaKey || e.ctrlKey) return;
      switch (e.key.toLowerCase()) {
        case 'u': actionsRef.current.undoActive();      break;
        case 'r': e.preventDefault(); actionsRef.current.redoActive(); break;
        case 'i': actionsRef.current.requestIdentify(); break;
        case 'e': actionsRef.current.setExclude();      break;
        case 'x': actionsRef.current.clearDecision();   break;
        case 'z': actionsRef.current.resetView();       break;
        default:  break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // =========================
  // Status helpers
  // =========================
  const getLatentStatus = (latentNum) => {
    const latentKey = `latent:${latentNum}`;
    if (caseData.identifiedByLatent?.[latentKey]) return 'identified';
    const hasExclusions = Object.entries(caseData.decisions || {}).some(
      ([key, value]) => key.includes(`case:${caseId}|latent:${latentNum}|`) && value === 'exclude'
    );
    if (hasExclusions) return 'in-progress';
    return 'none';
  };

  const getFingerStatus = (fingerNum) => {
    const key = buildComboKey({ caseId, latentIndex, personId: selectedPerson.id, fingerIndex: fingerNum });
    return caseData.decisions?.[key] || 'none';
  };

  const jumpToLatent = (latentNum) => {
    setSelectedLatentPrint(latentPrints[latentNum - 1]);
    const latentKey = `latent:${latentNum}`;
    const ident     = caseData.identifiedByLatent?.[latentKey];
    if (ident) {
      const p = people.find((x) => x.id === Number(ident.personId));
      if (p) {
        setSelectedPerson(p);
        const fNum = Number(ident.fingerIndex);
        if (fNum >= 1 && fNum <= 10) setSelectedPrint(p.prints[fNum - 1]);
      }
      setActiveSide('known');
    }
    setMobileTab('latent');
  };

  // =========================
  // Render
  // =========================
  return (
    <motion.div
      className="comparison-page-wrapper"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      <Header />

      <main className="comparison-main">

        {/* Page header bar */}
        <div className="comparison-header">
          <h2 className="comparison-title">Print Comparison</h2>
          <span className="comparison-case-id">CASE-{String(caseId).padStart(3, '0')}</span>
          <span className="comparison-subtitle">Click to place dots · Scroll to zoom · Drag to pan · Z to reset view</span>
        </div>

        {/* Mobile tab bar */}
        <div className="mobile-tab-bar">
          <div className="mobile-tab-bar-inner">
            <button
              className={`mobile-tab ${mobileTab === 'known' ? 'tab-active' : ''}`}
              onClick={() => { setMobileTab('known'); setActiveSide('known'); }}
            >
              Known Prints
            </button>
            <button
              className={`mobile-tab ${mobileTab === 'latent' ? 'tab-active' : ''} ${getLatentStatus(latentIndex) === 'identified' ? 'tab-identified' : ''}`}
              onClick={() => { setMobileTab('latent'); setActiveSide('latent'); }}
            >
              Latent Prints
            </button>
          </div>
        </div>

        {/* Main content: canvases + tools */}
        <div className="comparison-layout">

          <div className="comparison-grid">

            {/* Known Prints card */}
            <section
              className={`comparison-card ${activeSide === 'known' ? 'canvas-active' : ''}`}
              data-mobile-hidden={mobileTab === 'latent'}
            >
              <div className="comparison-card-top">
                <h3 className="comparison-card-title">Known Prints</h3>
                <div className="comparison-controls">
                  <select onChange={handlePersonChange} value={selectedPerson.id}>
                    {people.map((person) => (
                      <option key={person.id} value={person.id}>{person.name}</option>
                    ))}
                  </select>
                  <select onChange={handlePrintChange} value={selectedPrint}>
                    {selectedPerson.prints.map((print, index) => (
                      <option key={print} value={print}>{`Finger ${index + 1}`}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="image-frame">
                <FabricJSCanvas className="canvas" onReady={onReadyKnown} />
                <span className="zoom-hint">scroll=zoom · drag=pan</span>
              </div>

              <div className="finger-status-row">
                {selectedPerson.prints.map((printUrl, i) => {
                  const fNum   = i + 1;
                  const status = getFingerStatus(fNum);
                  return (
                    <div
                      key={printUrl}
                      className={`finger-status-pill finger-${status}`}
                      onClick={() => setSelectedPrint(printUrl)}
                      title={`Finger ${fNum} — ${status}`}
                    >
                      {fNum}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Latent Prints card */}
            <section
              className={`comparison-card ${activeSide === 'latent' ? 'canvas-active' : ''}`}
              data-mobile-hidden={mobileTab === 'known'}
            >
              <div className="comparison-card-top">
                <h3 className="comparison-card-title">Latent Prints</h3>
                <div className="comparison-controls">
                  <select onChange={handleLatentPrintChange} value={selectedLatentPrint}>
                    {latentPrints.map((print, index) => (
                      <option key={print} value={print}>{`Latent ${index + 1}`}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="image-frame">
                <FabricJSCanvas className="canvas" onReady={onReadyLatent} />
                <span className="zoom-hint">scroll=zoom · drag=pan</span>
              </div>

              <div className="latent-status-row">
                {latentPrints.map((_, i) => {
                  const status = getLatentStatus(i + 1);
                  return (
                    <div
                      key={i}
                      className={`latent-status-pill latent-${status}`}
                      onClick={() => jumpToLatent(i + 1)}
                      title={status === 'identified' ? 'Jump to identified match' : 'Switch latent'}
                    >
                      {i + 1}
                    </div>
                  );
                })}
              </div>
            </section>

          </div>{/* /comparison-grid */}

          {/* Tools sidebar */}
          <aside className="tools-card">

            <div className="tools-header">
              <span className="tools-title">Tools</span>
              <span className="tools-active-badge">
                <span className="tools-active-dot" />
                {activeSide === 'known' ? 'Known' : 'Latent'}
              </span>
            </div>

            {/* Dot color */}
            <div className="tools-section">
              <label className="tools-label">Dot Color</label>
              <input
                className="tools-color"
                type="color"
                value={dotColor}
                onChange={(e) => setDotColor(e.target.value)}
              />
            </div>

            {/* Undo / Redo */}
            <div className="tools-section">
              <div className="tools-row">
                <button type="button" className="tools-btn" onClick={undoActive}>
                  Undo <span className="kb">U</span>
                </button>
                <button type="button" className="tools-btn" onClick={redoActive}>
                  Redo <span className="kb">R</span>
                </button>
              </div>
            </div>

            {/* Reset view */}
            <div className="tools-section">
              <button type="button" className="tools-btn" onClick={resetView}>
                Reset View <span className="kb">Z</span>
              </button>
            </div>

            {/* Clear minutiae */}
            <div className="tools-section">
              <button type="button" className="tools-btn tools-danger" onClick={clearDotsActive}>
                Clear Dots
              </button>
            </div>

            <div className="tools-divider" />

            {/* Decision */}
            <div className="tools-section">
              <label className="tools-label">Decision</label>
              <div className="tools-row" style={{ marginBottom: '0.4rem' }}>
                <button
                  type="button"
                  className={`tools-btn ${comboStatus === 'identify' ? 'tools-identify-active' : ''}`}
                  onClick={requestIdentify}
                >
                  Identify <span className="kb">I</span>
                </button>
                <button
                  type="button"
                  className={`tools-btn ${comboStatus === 'exclude' ? 'tools-exclude-active' : ''}`}
                  onClick={setExclude}
                >
                  Exclude <span className="kb">E</span>
                </button>
              </div>
              <button type="button" className="tools-btn tools-subtle" onClick={clearDecision}>
                Clear Decision <span className="kb">X</span>
              </button>
            </div>

            <div className="tools-divider" />

            {/* Submit */}
            <div className="tools-section">
              <button className="submit-button" onClick={() => navigate(`/submission/${caseId}`)}>
                Go to Submissions
              </button>
            </div>

          </aside>

        </div>{/* /comparison-layout */}
      </main>

      <Footer />

      {/* Confirm overwrite modal */}
      {confirmOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <p className="modal-eyebrow">Overwrite Warning</p>
            <h3 className="modal-title">Update identified match?</h3>
            <p className="modal-text">
              This latent is already matched to a different person or finger.
              <br />
              Update to <b>Person {personId}</b> / <b>Finger {fingerIndex}</b>?
            </p>
            <div className="modal-actions">
              <button type="button" className="modal-btn modal-cancel" onClick={cancelUpdateIdentify}>Cancel</button>
              <button type="button" className="modal-btn modal-confirm" onClick={confirmUpdateIdentify}>Update</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ComparisonPage;
