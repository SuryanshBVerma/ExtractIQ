// SchemaPage.tsx
import { Eye, Pencil, Trash2, Plus, X, GripVertical } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { Skeleton } from "../components/ui/skeleton";
import toast from 'react-hot-toast';

// --- TYPES for better data management ---
type Attribute = { [key: string]: string };
type Extraction = {
    extraction_class: string;
    extraction_text: string;
    attributes: Attribute;
    color: string; 
};
type Example = {
    text: string;
    extractions: Extraction[];
};
type Schema = {
    id: string;
    prompt: string;
    examples: Example[];
    isExample?: boolean; 
};

// --- MOCK DATA with more complexity ---
const initialSchemas: Schema[] = [
    {
        id: "example-schema",
        isExample: true,
        prompt: "Extract characters, their emotions, and metaphorical relationships from Shakespearean text.",
        examples: [
            {
                text: "But soft! What light through yonder window breaks? It is the east, and Juliet is the sun.",
                extractions: [
                    {
                        extraction_class: "character",
                        extraction_text: "Juliet",
                        attributes: { emotional_state: "beloved" },
                        color: "#60a5fa" // blue-400
                    },
                    {
                        extraction_class: "emotion",
                        extraction_text: "But soft!",
                        attributes: { feeling: "gentle awe" },
                        color: "#34d399" // green-400
                    },
                    {
                        extraction_class: "relationship",
                        extraction_text: "Juliet is the sun",
                        attributes: { type: "metaphor" },
                        color: "#a78bfa" 
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

// --- API Functions ---
const API_BASE = "http://localhost:8000/api";

async function fetchSchemas(): Promise<Schema[]> {
    try {
        const response = await fetch(`${API_BASE}/schemas`);
        if (!response.ok) throw new Error('Failed to fetch schemas');
        return await response.json();
    } catch (error) {
        toast.error('Failed to load schemas');
        return [];
    }
}

async function createSchema(schema: { prompt: string; examples: Example[] }): Promise<Schema | null> {
    try {
        const response = await fetch(`${API_BASE}/schemas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(schema)
        });
        if (!response.ok) throw new Error('Failed to create schema');
        return await response.json();
    } catch (error) {
        toast.error('Failed to create schema');
        return null;
    }
}

async function updateSchema(id: string, schema: { prompt: string; examples: Example[] }): Promise<Schema | null> {
    try {
        const response = await fetch(`${API_BASE}/schemas/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(schema)
        });
        if (!response.ok) throw new Error('Failed to update schema');
        return await response.json();
    } catch (error) {
        toast.error('Failed to update schema');
        return null;
    }
}

async function deleteSchema(id: string): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE}/schemas/${id}`, {
            method: 'DELETE'
        });
        return response.ok;
    } catch (error) {
        toast.error('Failed to delete schema');
        return false;
    }
}


const SchemaEditorModal = ({ schema, mode, onClose, onSave }: { schema: Schema | null, mode: 'add' | 'edit' | 'view', onClose: () => void, onSave: (schema: Schema) => void }) => {
    const [editableSchema, setEditableSchema] = useState<Schema | null>(null);
    const [activeExtractionIndex, setActiveExtractionIndex] = useState<number | null>(null);

    React.useEffect(() => {
        if (schema) {
            setEditableSchema(JSON.parse(JSON.stringify(schema))); // Deep copy to prevent mutation
        } else {
            setEditableSchema({ 
                id: Date.now().toString(), 
                prompt: "", 
                examples: [{ text: "", extractions: [] }] 
            });
        }
    }, [schema]);

    if (!editableSchema) return null;

    const example = editableSchema.examples[0];

    const handleTextSelection = () => {
        if (mode === 'view') return;
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) return;

        const newExtraction: Extraction = {
            extraction_class: "new_class",
            extraction_text: selection.toString(),
            attributes: {},
            color: '#a3a3a3'
        };

        const updatedExtractions = [...example.extractions, newExtraction];
        updateExample({ ...example, extractions: updatedExtractions });
        setActiveExtractionIndex(updatedExtractions.length - 1);
        window.getSelection()?.removeAllRanges();
    };

    const updateExample = (updatedExample: Example) => {
        setEditableSchema({
            ...editableSchema,
            examples: [updatedExample]
        });
    };

    const updateExtraction = (index: number, updatedExtraction: Extraction) => {
        const updatedExtractions = [...example.extractions];
        updatedExtractions[index] = updatedExtraction;
        updateExample({ ...example, extractions: updatedExtractions });
    };

    const deleteExtraction = (index: number) => {
        const filteredExtractions = example.extractions.filter((_, i) => i !== index);
        updateExample({ ...example, extractions: filteredExtractions });
        if (activeExtractionIndex === index) {
            setActiveExtractionIndex(null);
        } else if (activeExtractionIndex !== null && activeExtractionIndex > index) {
            setActiveExtractionIndex(activeExtractionIndex - 1);
        }
    };

    const addAttribute = (extractionIndex: number) => {
        const extraction = example.extractions[extractionIndex];
        if (extraction) {
            const newAttributes = { ...extraction.attributes, [`new_key_${Date.now()}`]: "new_value" };
            updateExtraction(extractionIndex, { ...extraction, attributes: newAttributes });
        }
    };

    const updateAttribute = (extractionIndex: number, oldKey: string, newKey: string, newValue: string) => {
        const extraction = example.extractions[extractionIndex];
        if (extraction) {
            const newAttributes: Attribute = {};
            for (const key in extraction.attributes) {
                if (key === oldKey) {
                    newAttributes[newKey] = newValue;
                } else {
                    newAttributes[key] = extraction.attributes[key];
                }
            }
            updateExtraction(extractionIndex, { ...extraction, attributes: newAttributes });
        }
    };

    const deleteAttribute = (extractionIndex: number, keyToDelete: string) => {
        const extraction = example.extractions[extractionIndex];
        if (extraction) {
            const { [keyToDelete]: _, ...remainingAttributes } = extraction.attributes;
            updateExtraction(extractionIndex, { ...extraction, attributes: remainingAttributes });
        }
    };


    let annotatedParts: React.ReactNode[] = [];
    if (example && example.text) {
        const sortedExtractions = example.extractions.map((ext, index) => ({ ...ext, originalIndex: index }))
            .sort((a, b) => example.text.indexOf(a.extraction_text) - example.text.indexOf(b.extraction_text));
        let lastIndex = 0;
        sortedExtractions.forEach(ext => {
            const index = example.text.indexOf(ext.extraction_text, lastIndex);
            if (index === -1) return;
            if (index > lastIndex) {
                annotatedParts.push(<span key={lastIndex}>{example.text.substring(lastIndex, index)}</span>);
            }
            annotatedParts.push(
                <mark
                    key={`extraction-${ext.originalIndex}`}
                    className={`p-1 rounded-md cursor-pointer ${activeExtractionIndex === ext.originalIndex ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`}
                    style={{ backgroundColor: getClassColor(ext.extraction_class, ext.color), color: '#222', border: '1px solid #888' }}
                    onClick={() => setActiveExtractionIndex(ext.originalIndex)}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow overflow-hidden p-4">
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

                    <div className="flex flex-col space-y-4 overflow-y-auto pr-2">
                        <h3 className="font-semibold text-lg">Extractions</h3>
                        {example.extractions.length === 0 ? (
                            <div className="text-center text-gray-500 p-8 border-2 border-dashed rounded-lg">
                                {mode === 'view' ? 'No extractions for this example.' : 'Highlight text on the left to begin.'}
                            </div>
                        ) : (
                            example.extractions.map((ext, index) => (
                                <div key={`extraction-item-${index}`} className={`p-3 border rounded-lg ${activeExtractionIndex === index ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-white dark:bg-gray-900'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <GripVertical className="h-5 w-5 text-gray-400" />
                                            <Input
                                                value={ext.extraction_class}
                                                onChange={(e) => updateExtraction(index, { ...ext, extraction_class: e.target.value })}
                                                className={`font-mono text-sm h-8`}
                                                style={{ backgroundColor: getClassColor(ext.extraction_class, ext.color), color: '#222', border: '1px solid #888' }}
                                                disabled={mode === 'view'}
                                            />
                                            {mode !== 'view' && (
                                                <input
                                                    type="color"
                                                    value={ext.color || getClassColor(ext.extraction_class)}
                                                    onChange={e => updateExtraction(index, { ...ext, color: e.target.value })}
                                                    className="ml-2 w-7 h-7 border-none bg-transparent cursor-pointer"
                                                    title="Pick color"
                                                    style={{ padding: 0, background: 'none' }}
                                                />
                                            )}
                                        </div>
                                        <Button size="icon" variant="ghost" onClick={() => deleteExtraction(index)} disabled={mode === 'view'}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                    <blockquote className="border-l-4 pl-3 text-sm italic my-2">{ext.extraction_text}</blockquote>

                                    <div className="space-y-2 mt-3">
                                        <h4 className="text-xs font-semibold uppercase text-gray-500">Attributes</h4>
                                        {Object.entries(ext.attributes).map(([key, value]) => (
                                            <div key={key} className="flex items-center gap-2">
                                                <Input value={key} onChange={e => updateAttribute(index, key, e.target.value, value)} placeholder="key" className="h-8" disabled={mode === 'view'} />
                                                <Input value={value} onChange={e => updateAttribute(index, key, key, e.target.value)} placeholder="value" className="h-8" disabled={mode === 'view'} />
                                                <Button size="icon" variant="ghost" onClick={() => deleteAttribute(index, key)} disabled={mode === 'view'}><X className="h-4 w-4" /></Button>
                                            </div>
                                        ))}
                                        {mode !== 'view' && (
                                            <Button variant="outline" size="sm" onClick={() => addAttribute(index)} className="w-full mt-2">
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
    const [schemas, setSchemas] = useState<Schema[]>(initialSchemas);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>("add");
    const [selectedSchema, setSelectedSchema] = useState<Schema | null>(null);

    useEffect(() => {
        const loadSchemas = async () => {
            setLoading(true);
            try {
                const backendSchemas = await fetchSchemas();
                setSchemas([...initialSchemas, ...backendSchemas]);
            } catch (error) {
                setSchemas(initialSchemas);
            } finally {
                setLoading(false);
            }
        };
        
        loadSchemas();
    }, []);

    const openModal = (mode: 'add' | 'edit' | 'view', schema?: Schema) => {
        setModalMode(mode);
        setSelectedSchema(schema || null);
        setModalOpen(true);
    };

    const handleSave = async (schemaToSave: Schema) => {
        setLoading(true);
        try {
            if (modalMode === 'add') {
                const newSchema = await createSchema({
                    prompt: schemaToSave.prompt,
                    examples: schemaToSave.examples
                });
                
                if (newSchema) {
                    setSchemas([...schemas, newSchema]);
                    toast.success('Schema created successfully');
                } else {
                    throw new Error('Failed to create schema');
                }
            } else {
                if (!schemaToSave.isExample) {
                    const updatedSchema = await updateSchema(schemaToSave.id, {
                        prompt: schemaToSave.prompt,
                        examples: schemaToSave.examples
                    });
                    
                    if (updatedSchema) {
                        setSchemas(schemas.map(s => s.id === schemaToSave.id ? updatedSchema : s));
                        toast.success('Schema updated successfully');
                    } else {
                        throw new Error('Failed to update schema');
                    }
                } else {
                    setSchemas(schemas.map(s => s.id === schemaToSave.id ? schemaToSave : s));
                }
            }
            setModalOpen(false);
        } catch (error) {
            toast.error('Failed to save schema');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        const schema = schemas.find(s => s.id === id);
        if (schema?.isExample) {
            toast.error('Cannot delete example schema');
            return;
        }

        setLoading(true);
        try {
            const success = await deleteSchema(id);
            if (success) {
                setSchemas(schemas.filter(s => s.id !== id));
                toast.success('Schema deleted successfully');
            } else {
                throw new Error('Failed to delete schema');
            }
        } catch (error) {
            toast.error('Failed to delete schema');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8  min-h-screen">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Schemas</h1>
                <Button onClick={() => openModal('add')} disabled={loading} className="flex items-center space-x-2">
                    <Plus className="h-5 w-5" />
                    <span>{loading ? 'Loading...' : 'New Schema'}</span>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array.from({ length: 6 }).map((_, index) => (
                        <div key={`skeleton-${index}`} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
                            <div className="space-y-4">
                                <div>
                                    <Skeleton className="h-3 w-12 mb-2" />
                                    <Skeleton className="h-5 w-full" />
                                    <Skeleton className="h-5 w-3/4 mt-1" />
                                </div>
                                <div>
                                    <Skeleton className="h-3 w-16 mb-2" />
                                    <div className="flex gap-2">
                                        <Skeleton className="h-6 w-16" />
                                        <Skeleton className="h-6 w-20" />
                                        <Skeleton className="h-6 w-14" />
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-2 pt-4">
                                    <Skeleton className="h-8 w-8" />
                                    <Skeleton className="h-8 w-8" />
                                    <Skeleton className="h-8 w-8" />
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    schemas.map((schema) => (
                        <div key={schema.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 flex flex-col justify-between">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Prompt</p>
                                <p className="font-semibold text-gray-800 dark:text-gray-200 mt-1 line-clamp-2">{schema.prompt}</p>
                                <div className="mt-4">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Extractions</p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {schema.examples[0].extractions.map((ext, index) => (
                                            <Badge key={`badge-${index}`} style={{ backgroundColor: getClassColor(ext.extraction_class, ext.color), color: '#222', border: '1px solid #888' }}>{ext.extraction_class}</Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-2 mt-4">
                                <Button size="icon" variant="ghost" onClick={() => openModal('view', schema)}><Eye className="h-5 w-5" /></Button>
                                {!schema.isExample && (
                                    <>
                                        <Button size="icon" variant="ghost" onClick={() => openModal('edit', schema)}><Pencil className="h-5 w-5" /></Button>
                                        <Button size="icon" variant="ghost" onClick={() => handleDelete(schema.id)} disabled={loading}><Trash2 className="h-5 w-5 text-red-500" /></Button>
                                    </>
                                )}
                                {schema.isExample && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">Example</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

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