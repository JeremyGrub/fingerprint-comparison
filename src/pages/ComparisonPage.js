// src/pages/ComparisonPage.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

const ComparisonPage = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const { editor: knownEditor, onReady: onReadyKnown } = useFabricJSEditor();
  const { editor: latentEditor, onReady: onReadyLatent } = useFabricJSEditor();

  const [selectedPerson, setSelectedPerson] = useState(people[0]);
  const [selectedPrint, setSelectedPrint] = useState(people[0].prints[0]);
  const [selectedLatentPrint, setSelectedLatentPrint] = useState(latentPrints[0]);

  // Tools state
  const [dotColor, setDotColor] = useState('#ff0000');
  const [activeSide, setActiveSide] = useState('known'); // 'known' | 'latent'

  // History stacks per canvas (dot placement + clear)
  const knownHistory = useRef({ undo: [], redo: [] });
  const latentHistory = useRef({ undo: [], redo: [] });

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

  // Which canvas do tools apply to? (whichever you clicked last)
  const getActiveContext = () => {
    if (activeSide === 'known') {
      return { editor: knownEditor, history: knownHistory.current, imageUrl: selectedPrint };
    }
    return { editor: latentEditor, history: latentHistory.current, imageUrl: selectedLatentPrint };
  };

  // Load background + restore dots for that imageUrl
  const loadImageToCanvas = (editor, imageUrl) => {
    if (!editor?.canvas) return;

    editor.canvas.clear();

    // Keep your original scaling approach
    editor.canvas.setBackgroundImage(imageUrl, editor.canvas.renderAll.bind(editor.canvas), {
      scaleX: editor.canvas.width / 500,
      scaleY: editor.canvas.height / 500,
    });

    // Restore dots (with color)
    const savedDots = JSON.parse(localStorage.getItem(imageUrl)) || [];
    savedDots.forEach((dot) => {
      const restoredDot = new Circle({
        left: dot.x,
        top: dot.y,
        radius: DOT_RADIUS,
        fill: dot.color || '#ff0000',
        selectable: false,
        hasBorders: false,
        hasControls: false,
        evented: false,
        originX: 'center',
        originY: 'center',
      });
      editor.canvas.add(restoredDot);
    });

    editor.canvas.renderAll();
  };

  const addDot = (editor, pointer, imageUrl, history) => {
    if (!editor?.canvas) return;

    const dot = new Circle({
      left: pointer.x,
      top: pointer.y,
      radius: DOT_RADIUS,
      fill: dotColor,
      selectable: false,
      hasBorders: false,
      hasControls: false,
      evented: false,
      originX: 'center',
      originY: 'center',
    });

    editor.canvas.add(dot);
    editor.canvas.renderAll();

    // History: adding a dot is an undoable action
    history.undo.push({ type: 'add', object: dot, imageUrl });
    history.redo = [];

    // Persist (include color)
    const savedDots = JSON.parse(localStorage.getItem(imageUrl)) || [];
    savedDots.push({ x: pointer.x, y: pointer.y, color: dotColor });
    localStorage.setItem(imageUrl, JSON.stringify(savedDots));
  };

  // Attach click handler (prevents stacking multiple handlers)
  const handleCanvasClick = useCallback(
    (editor, imageUrl, history, sideName) => {
      if (!editor?.canvas) return;

      editor.canvas.off('mouse:down');

      editor.canvas.on('mouse:down', (event) => {
        setActiveSide(sideName);
        const pointer = editor.canvas.getPointer(event.e);
        addDot(editor, pointer, imageUrl, history);
      });
    },
    [dotColor]
  );

  // Load known canvas when image changes
  useEffect(() => {
    if (!knownEditor) return;
    loadImageToCanvas(knownEditor, selectedPrint);
    handleCanvasClick(knownEditor, selectedPrint, knownHistory.current, 'known');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [knownEditor, selectedPrint, handleCanvasClick]);

  // Load latent canvas when image changes
  useEffect(() => {
    if (!latentEditor) return;
    loadImageToCanvas(latentEditor, selectedLatentPrint);
    handleCanvasClick(latentEditor, selectedLatentPrint, latentHistory.current, 'latent');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latentEditor, selectedLatentPrint, handleCanvasClick]);

  // ============ Tools actions ============
  const clearDotsActive = () => {
    const { editor, history, imageUrl } = getActiveContext();
    if (!editor?.canvas) return;

    const dots = editor.canvas.getObjects().filter((obj) => obj.type === 'circle');
    if (dots.length === 0) return;

    // Save for undo
    history.undo.push({ type: 'clear', objects: dots, imageUrl });
    history.redo = [];

    // Remove dots + clear storage for this image
    dots.forEach((d) => editor.canvas.remove(d));
    editor.canvas.renderAll();
    localStorage.removeItem(imageUrl);
  };

  const undoActive = () => {
    const { editor, history, imageUrl } = getActiveContext();
    if (!editor?.canvas) return;

    const action = history.undo.pop();
    if (!action) return;

    if (action.type === 'add') {
      // remove the dot
      editor.canvas.remove(action.object);
      editor.canvas.renderAll();

      // remove last saved dot for that image (simple approach)
      const saved = JSON.parse(localStorage.getItem(imageUrl)) || [];
      saved.pop();
      localStorage.setItem(imageUrl, JSON.stringify(saved));
    }

    if (action.type === 'clear') {
      // re-add all removed dots
      action.objects.forEach((o) => editor.canvas.add(o));
      editor.canvas.renderAll();

      // rebuild storage from current dots
      const circles = editor.canvas.getObjects().filter((o) => o.type === 'circle');
      const rebuilt = circles.map((c) => ({ x: c.left, y: c.top, color: c.fill }));
      localStorage.setItem(imageUrl, JSON.stringify(rebuilt));
    }

    history.redo.push(action);
  };

  const redoActive = () => {
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
  };
  // ======================================

  return (
    <div>
      <Header />
      <main>
        <div className="comparison-header">
          <h2 className="comparison-title">Comparison for Case {caseId}</h2>
          <p className="comparison-subtitle">Click on an image to place dots on minutiae/characteristics.</p>
        </div>

        {/* NEW: wrapper for (2 panels) + (tools sidebar) */}
        <div className="comparison-layout">
          {/* Left: two main cards */}
          <div className="comparison-grid">
            {/* Known Prints */}
            <section className="comparison-card">
              <div className="comparison-card-top">
                <h3 className="comparison-card-title">Known Prints</h3>

                <div className="comparison-controls">
                  <select onChange={handlePersonChange} value={selectedPerson.id}>
                    {people.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                  </select>

                  <select onChange={handlePrintChange} value={selectedPrint}>
                    {selectedPerson.prints.map((print, index) => (
                      <option key={print} value={print}>
                        {`Finger ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="image-frame">
                <FabricJSCanvas className="canvas" onReady={onReadyKnown} />
              </div>
            </section>

            {/* Latent Prints */}
            <section className="comparison-card">
              <div className="comparison-card-top">
                <h3 className="comparison-card-title">Latent Prints</h3>

                <div className="comparison-controls">
                  <select onChange={handleLatentPrintChange} value={selectedLatentPrint}>
                    {latentPrints.map((print, index) => (
                      <option key={print} value={print}>
                        {`Latent ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="image-frame">
                <FabricJSCanvas className="canvas" onReady={onReadyLatent} />
              </div>
            </section>
          </div>

          {/* Right: Tools Sidebar */}
          <aside className="tools-card">
            <h3 className="tools-title">Tools</h3>

            <div className="tools-section">
              <div className="tools-meta">
                <span className="tools-meta-label">Active Canvas</span>
                <span className="tools-meta-value">{activeSide === 'known' ? 'Known' : 'Latent'}</span>
              </div>
            </div>

            <div className="tools-section">
              <label className="tools-label">Dot Color</label>
              <input
                className="tools-color"
                type="color"
                value={dotColor}
                onChange={(e) => setDotColor(e.target.value)}
              />
            </div>

            <div className="tools-section tools-row">
              <button type="button" className="tools-btn" onClick={undoActive}>
                Undo
              </button>
              <button type="button" className="tools-btn" onClick={redoActive}>
                Redo
              </button>
            </div>

            <div className="tools-section">
              <button type="button" className="tools-btn tools-danger" onClick={clearDotsActive}>
                Clear Minutiae
              </button>
            </div>

            <div className="tools-section tools-hint">
              Tip: click on the print to place dots. Tools apply to the canvas you clicked last.
            </div>
            <div className="tools-section">
                <button
                    className="submit-button"
                    onClick={() => navigate(`/submission/${caseId}`)}
                >
                    Go to Submissions
                </button>
            </div>

          </aside>
        </div>

      </main>
      <Footer />
    </div>
  );
};

export default ComparisonPage;
