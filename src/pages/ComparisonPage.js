import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FabricJSCanvas, useFabricJSEditor } from 'fabricjs-react';
import { Circle } from 'fabric';

const people = [
    { id: 1, name: 'Person 1', prints: Array.from({ length: 10 }, (_, i) => `/images/person1/print1-${i + 1}.jpg`) },
    { id: 2, name: 'Person 2', prints: Array.from({ length: 10 }, (_, i) => `/images/person2/print2-${i + 1}.jpg`) },
    { id: 3, name: 'Person 3', prints: Array.from({ length: 10 }, (_, i) => `/images/person3/print3-${i + 1}.jpg`) }
];

const latentPrints = Array.from({ length: 5 }, (_, i) => `/images/latent/latent-${i + 1}.jpg`);

const ComparisonPage = () => {
    const { caseId } = useParams();
    const navigate = useNavigate();
    const { editor: knownEditor, onReady: onReadyKnown } = useFabricJSEditor();
    const { editor: latentEditor, onReady: onReadyLatent } = useFabricJSEditor();

    const [selectedPerson, setSelectedPerson] = useState(people[0]);
    const [selectedPrint, setSelectedPrint] = useState(selectedPerson.prints[0]);
    const [selectedLatentPrint, setSelectedLatentPrint] = useState(latentPrints[0]);

    const handlePersonChange = (event) => {
        const person = people.find(p => p.id === Number(event.target.value));
        setSelectedPerson(person);
        setSelectedPrint(person.prints[0]);
    };

    const handlePrintChange = (event) => {
        setSelectedPrint(event.target.value);
    };

    const handleLatentPrintChange = (event) => {
        setSelectedLatentPrint(event.target.value);
    };

    const loadImageToCanvas = (editor, imageUrl) => {
        if (editor && editor.canvas) {
            editor.canvas.clear();
            editor.canvas.setBackgroundImage(imageUrl, editor.canvas.renderAll.bind(editor.canvas), {
                scaleX: editor.canvas.width / 500,
                scaleY: editor.canvas.height / 500,
            });
        }
    };

    const addDot = (editor, pointer) => {
        const dot = new Circle({
            left: pointer.x,
            top: pointer.y,
            radius: 4,
            fill: 'red',
            selectable: false,
            hasBorders: false,
            hasControls: false,
            evented: false,  // This makes sure the dot won't interact with mouse events
            originX: 'center',
            originY: 'center',
        });
        editor.canvas.add(dot);
    };
    

    // Define the handleCanvasClick function
    const handleCanvasClick = (editor) => {
        if (editor && editor.canvas) {
            editor.canvas.on('mouse:down', (event) => {
                const pointer = editor.canvas.getPointer(event.e);
                addDot(editor, pointer);
            });
        }
    };

    useEffect(() => {
        if (knownEditor) {
            loadImageToCanvas(knownEditor, selectedPrint);
            handleCanvasClick(knownEditor); // Call the function within the effect
        }
    }, [knownEditor, selectedPrint, handleCanvasClick]); // Add handleCanvasClick to dependencies

    useEffect(() => {
        if (latentEditor) {
            loadImageToCanvas(latentEditor, selectedLatentPrint);
            handleCanvasClick(latentEditor); // Call the function within the effect
        }
    }, [latentEditor, selectedLatentPrint, handleCanvasClick]); // Add handleCanvasClick to dependencies

    useEffect(() => {
        if (knownEditor) {
            loadImageToCanvas(knownEditor, selectedPrint);
            handleCanvasClick(knownEditor);
        }
    }, [knownEditor, selectedPrint]);

    useEffect(() => {
        if (latentEditor) {
            loadImageToCanvas(latentEditor, selectedLatentPrint);
            handleCanvasClick(latentEditor);
        }
    }, [latentEditor, selectedLatentPrint]);

    return (
        <div>
            <Header />
            <main>
                <h2>Comparison for Case {caseId}</h2>
                <div className="canvas-container">
                    <div>
                        <h3>Known Prints</h3>
                        <div className="select-container">
                            <select onChange={handlePersonChange}>
                                {people.map(person => (
                                    <option key={person.id} value={person.id}>{person.name}</option>
                                ))}
                            </select>
                            <select onChange={handlePrintChange} value={selectedPrint}>
                                {selectedPerson.prints.map((print, index) => (
                                    <option key={print} value={print}>{`Finger ${index + 1}`}</option>
                                ))}
                            </select>
                        </div>
                        <FabricJSCanvas className="canvas" onReady={onReadyKnown} />
                    </div>
                    <div>
                        <h3>Latent Prints</h3>
                        <div className="select-container">
                            <select onChange={handleLatentPrintChange} value={selectedLatentPrint}>
                                {latentPrints.map((print, index) => (
                                    <option key={print} value={print}>{`Latent ${index + 1}`}</option>
                                ))}
                            </select>
                        </div>
                        <FabricJSCanvas className="canvas" onReady={onReadyLatent} />
                    </div>
                </div>
                <div className="go-to-submission">
                    <button className="mock-case-button" onClick={() => navigate(`/submission/${caseId}`)}>Go to Submission</button>
                </div>

            </main>
            <Footer />
        </div>
    );
};

export default ComparisonPage;
