// SchemaPage.tsx
import { Eye, Pencil, Trash2, Plus, X, GripVertical } from "lucide-react";
import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";

// --- TYPES for better data management ---
type Attribute = { [key: string]: string };
type Extraction = {
    id: number;
    extraction_class: string;
    extraction_text: string;
    attributes: Attribute;
    color: string; 
};
type Example = {
    id: number;
    text: string;
    extractions: Extraction[];
};
type Schema = {
    id: number;
    prompt: string;
    examples: Example[];
};

// --- MOCK DATA with more complexity ---
const initialSchemas: Schema[] = [
    {
        id: 1,
        prompt: "Extract characters, their emotions, and metaphorical relationships from Shakespearean text.",
        examples: [
            {
                id: 101,
                text: "But soft! What light through yonder window breaks? It is the east, and Juliet is the sun.",
                extractions: [
                    {
                        id: 1001,
                        extraction_class: "character",
                        extraction_text: "Juliet",
                        attributes: { emotional_state: "beloved" },
                        color: "#60a5fa" // blue-400
                    },
                    {
                        id: 1002,
                        extraction_class: "emotion",
                        extraction_text: "But soft!",
                        attributes: { feeling: "gentle awe" },
                        color: "#34d399" // green-400
                    },
                    {
                        id: 1003,
                        extraction_class: "relationship",
                        extraction_text: "Juliet is the sun",
                        attributes: { type: "metaphor" },
                        color: "#a78bfa" // purple-400
                    },
                ],
            },
        ],
    },
];

// --- Color assignment: only use user-set color, no hardcoded palette ---
function getClassColor(_className: string, colorOverride?: string) {
    return colorOverride || '#a3a3a3'; // fallback to gray if not set
}


const SchemaEditorModal = ({ schema, mode, onClose, onSave }: { schema: Schema | null, mode: 'add' | 'edit' | 'view', onClose: () => void, onSave: (schema: Schema) => void }) => {
    const [editableSchema, setEditableSchema] = useState<Schema | null>(null);
    const [activeExtractionId, setActiveExtractionId] = useState<number | null>(null);

    // Initialize state when schema prop changes
    React.useEffect(() => {
        if (schema) {
            setEditableSchema(JSON.parse(JSON.stringify(schema))); // Deep copy to prevent mutation
        } else {
            // Default structure for a new schema
            setEditableSchema({ id: Date.now(), prompt: "", examples: [{ id: Date.now(), text: "", extractions: [] }] });
        }
    }, [schema]);

    if (!editableSchema) return null;

    const example = editableSchema.examples[0];

    // --- Handlers for Interactivity ---
    const handleTextSelection = () => {
        if (mode === 'view') return;
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) return;

        const newExtraction: Extraction = {
            id: Date.now(),
            extraction_class: "new_class",
            extraction_text: selection.toString(),
            attributes: {},
            color: '#a3a3a3' // default gray, user can change
        };

        const updatedExtractions = [...example.extractions, newExtraction];
        updateExample({ ...example, extractions: updatedExtractions });
        setActiveExtractionId(newExtraction.id);
        window.getSelection()?.removeAllRanges();
    };

    const updateExample = (updatedExample: Example) => {
        setEditableSchema({
            ...editableSchema,
            examples: [updatedExample]
        });
    };

    const updateExtraction = (updatedExtraction: Extraction) => {
        const updatedExtractions = example.extractions.map(ext => ext.id === updatedExtraction.id ? updatedExtraction : ext);
        updateExample({ ...example, extractions: updatedExtractions });
    };

    const deleteExtraction = (id: number) => {
        const filteredExtractions = example.extractions.filter(ext => ext.id !== id);
        updateExample({ ...example, extractions: filteredExtractions });
    };

    const addAttribute = (extractionId: number) => {
        const extraction = example.extractions.find(ext => ext.id === extractionId);
        if (extraction) {
            const newAttributes = { ...extraction.attributes, [`new_key_${Date.now()}`]: "new_value" };
            updateExtraction({ ...extraction, attributes: newAttributes });
        }
    };

    const updateAttribute = (extractionId: number, oldKey: string, newKey: string, newValue: string) => {
        const extraction = example.extractions.find(ext => ext.id === extractionId);
        if (extraction) {
            const newAttributes: Attribute = {};
            for (const key in extraction.attributes) {
                if (key === oldKey) {
                    newAttributes[newKey] = newValue;
                } else {
                    newAttributes[key] = extraction.attributes[key];
                }
            }
            updateExtraction({ ...extraction, attributes: newAttributes });
        }
    };

    const deleteAttribute = (extractionId: number, keyToDelete: string) => {
        const extraction = example.extractions.find(ext => ext.id === extractionId);
        if (extraction) {
            const { [keyToDelete]: _, ...remainingAttributes } = extraction.attributes;
            updateExtraction({ ...extraction, attributes: remainingAttributes });
        }
    };


    
    let annotatedParts: React.ReactNode[] = [];
    if (example && example.text) {
        const sortedExtractions = [...example.extractions].sort((a, b) => example.text.indexOf(a.extraction_text) - example.text.indexOf(b.extraction_text));
        let lastIndex = 0;
        sortedExtractions.forEach(ext => {
            const index = example.text.indexOf(ext.extraction_text, lastIndex);
            if (index === -1) return;
            if (index > lastIndex) {
                annotatedParts.push(<span key={lastIndex}>{example.text.substring(lastIndex, index)}</span>);
            }
            annotatedParts.push(
                <mark
                    key={ext.id}
                    className={`p-1 rounded-md cursor-pointer ${activeExtractionId === ext.id ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`}
                    style={{ backgroundColor: getClassColor(ext.extraction_class, ext.color), color: '#222', border: '1px solid #888' }}
                    onClick={() => setActiveExtractionId(ext.id)}
                >
                    {ext.extraction_text}
                </mark>
            );
            lastIndex = index + ext.extraction_text.length;
        });
        if (lastIndex < example.text.length) {
            annotatedParts.push(<span key={lastIndex}>{example.text.substring(lastIndex)}</span>);
        }
    }


    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'add' && 'Add New Schema'}
                        {mode === 'edit' && 'Edit Schema'}
                        {mode === 'view' && 'View Schema'}
                    </DialogTitle>
                    <DialogDescription>
                        {mode !== 'view' ? "Highlight text in the example below to create an extraction. Click on an extraction to edit its details." : "Viewing the schema details."}
                    </DialogDescription>
                </DialogHeader>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow overflow-hidden p-4">
                    {/* Left Panel: Prompt & Interactive Text */}
                    <div className="flex flex-col space-y-4 overflow-y-auto p-2 ">
                        <div>
                            <label className="block text-sm font-medium mb-1">Prompt</label>
                            <Textarea
                                value={editableSchema.prompt}
                                onChange={e => setEditableSchema({ ...editableSchema, prompt: e.target.value })}
                                disabled={mode === 'view'}
                                rows={3}
                                placeholder="e.g., Extract user sentiment and key topics..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Example Text</label>
                            <Textarea
                                value={example.text}
                                onChange={e => updateExample({ ...example, text: e.target.value })}
                                disabled={mode === 'view'}
                                rows={5}
                                placeholder="Paste the text you want to extract from here..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Annotator</label>
                            <div
                                onMouseUp={handleTextSelection}
                                className="p-4 border rounded-md h-48 whitespace-pre-wrap text-lg leading-relaxed bg-gray-50 dark:bg-gray-800"
                            >
                                {annotatedParts}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Extractions List & Editor */}
                    <div className="flex flex-col space-y-4 overflow-y-auto pr-2">
                        <h3 className="font-semibold text-lg">Extractions</h3>
                        {example.extractions.length === 0 ? (
                            <div className="text-center text-gray-500 p-8 border-2 border-dashed rounded-lg">
                                {mode === 'view' ? 'No extractions for this example.' : 'Highlight text on the left to begin.'}
                            </div>
                        ) : (
                            example.extractions.map(ext => (
                                <div key={ext.id} className={`p-3 border rounded-lg ${activeExtractionId === ext.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-white dark:bg-gray-900'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <GripVertical className="h-5 w-5 text-gray-400" />
                                            <Input
                                                value={ext.extraction_class}
                                                onChange={(e) => updateExtraction({ ...ext, extraction_class: e.target.value })}
                                                className={`font-mono text-sm h-8`}
                                                style={{ backgroundColor: getClassColor(ext.extraction_class, ext.color), color: '#222', border: '1px solid #888' }}
                                                disabled={mode === 'view'}
                                            />
                                            {mode !== 'view' && (
                                                <input
                                                    type="color"
                                                    value={ext.color || getClassColor(ext.extraction_class)}
                                                    onChange={e => updateExtraction({ ...ext, color: e.target.value })}
                                                    className="ml-2 w-7 h-7 border-none bg-transparent cursor-pointer"
                                                    title="Pick color"
                                                    style={{ padding: 0, background: 'none' }}
                                                />
                                            )}
                                        </div>
                                        <Button size="icon" variant="ghost" onClick={() => deleteExtraction(ext.id)} disabled={mode === 'view'}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                    <blockquote className="border-l-4 pl-3 text-sm italic my-2">{ext.extraction_text}</blockquote>

                                    {/* Attributes Editor */}
                                    <div className="space-y-2 mt-3">
                                        <h4 className="text-xs font-semibold uppercase text-gray-500">Attributes</h4>
                                        {Object.entries(ext.attributes).map(([key, value]) => (
                                            <div key={key} className="flex items-center gap-2">
                                                <Input value={key} onChange={e => updateAttribute(ext.id, key, e.target.value, value)} placeholder="key" className="h-8" disabled={mode === 'view'} />
                                                <Input value={value} onChange={e => updateAttribute(ext.id, key, key, e.target.value)} placeholder="value" className="h-8" disabled={mode === 'view'} />
                                                <Button size="icon" variant="ghost" onClick={() => deleteAttribute(ext.id, key)} disabled={mode === 'view'}><X className="h-4 w-4" /></Button>
                                            </div>
                                        ))}
                                        {mode !== 'view' && (
                                            <Button variant="outline" size="sm" onClick={() => addAttribute(ext.id)} className="w-full mt-2">
                                                <Plus className="h-4 w-4 mr-2" /> Add Attribute
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <DialogFooter className="pt-4">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                    {mode !== 'view' && <Button onClick={() => onSave(editableSchema)}>Save Changes</Button>}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


// --- MAIN PAGE COMPONENT ---
export default function SchemaPage() {
    const [schemas, setSchemas] = useState(initialSchemas);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>("add");
    const [selectedSchema, setSelectedSchema] = useState<Schema | null>(null);

    const openModal = (mode: 'add' | 'edit' | 'view', schema?: Schema) => {
        setModalMode(mode);
        setSelectedSchema(schema || null);
        setModalOpen(true);
    };

    // No need to auto-assign colors; just preserve user-set color
    const ensureExtractionColors = (schema: Schema): Schema => schema;

    const handleSave = (schemaToSave: Schema) => {
        const schemaWithColors = ensureExtractionColors(schemaToSave);
        if (modalMode === 'add') {
            setSchemas([...schemas, schemaWithColors]);
        } else {
            setSchemas(schemas.map(s => s.id === schemaWithColors.id ? schemaWithColors : s));
        }
        setModalOpen(false);
        console.log(schemaWithColors)
    };

    const handleDelete = (id: number) => {
        setSchemas(schemas.filter(s => s.id !== id));
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8  min-h-screen">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Schemas</h1>
                <Button onClick={() => openModal('add')} className="flex items-center space-x-2">
                    <Plus className="h-5 w-5" />
                    <span>New Schema</span>
                </Button>
            </div>

            {/* Schema Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {schemas.map((schema) => (
                    <div key={schema.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 flex flex-col justify-between">
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Prompt</p>
                            <p className="font-semibold text-gray-800 dark:text-gray-200 mt-1 line-clamp-2">{schema.prompt}</p>
                            <div className="mt-4">
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Extractions</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {schema.examples[0].extractions.map(ext => (
                                        <Badge key={ext.id} style={{ backgroundColor: getClassColor(ext.extraction_class, ext.color), color: '#222', border: '1px solid #888' }}>{ext.extraction_class}</Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                        {/* Actions */}
                        <div className="flex justify-end space-x-2 mt-4">
                            <Button size="icon" variant="ghost" onClick={() => openModal('view', schema)}><Eye className="h-5 w-5" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => openModal('edit', schema)}><Pencil className="h-5 w-5" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(schema.id)}><Trash2 className="h-5 w-5 text-red-500" /></Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Render */}
            {modalOpen && (
                <SchemaEditorModal
                    schema={selectedSchema}
                    mode={modalMode}
                    onClose={() => setModalOpen(false)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}