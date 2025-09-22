import React, { useEffect, useState, useRef } from 'react';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '../components/ui/dialog';
import { Input } from '../components/ui/input';

type Document = {
    id: number;
    name: string;
    uploaded: string;
    status: string;
};

// Simulated fetch function (replace with real API call)
const fetchDocuments = async (): Promise<Document[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([
                { id: 1, name: 'Invoice_2025.pdf', uploaded: '2025-09-10', status: 'Processed' },
                { id: 2, name: 'Report_Q3.docx', uploaded: '2025-09-12', status: 'Pending' },
                { id: 3, name: 'Contract_Agreement.pdf', uploaded: '2025-09-15', status: 'Processed' },
            ]);
        }, 1200);
    });
};

const DocumentsPage: React.FC = () => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [open, setOpen] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        fetchDocuments()
            .then((docs) => {
                setDocuments(docs);
                setLoading(false);
            })
            .catch(() => {
                setError('Failed to fetch documents');
                setLoading(false);
            });
    }, []);

    // Drag and drop handlers
    const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            // Handle file upload logic here
            // e.dataTransfer.files
        }
    };

    const handleBrowseClick = () => {
        inputRef.current?.click();
    };

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-title-large font-semibold leading-tight text-light-fg-default dark:text-dark-fg-default">Documents</h1>
                <Button
                    onClick={() => setOpen(true)}
                    className="font-medium text-sm px-4 py-2 rounded transition-all duration-150 hover:shadow-sm hover:-translate-y-0.5 hover:cursor-pointer"
                >
                    Upload
                </Button>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md mx-auto">
                    <DialogHeader>
                        <DialogTitle>Upload Document</DialogTitle>
                    </DialogHeader>
                    <div
                        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-150 ${dragActive ? 'border-green bg-muted' : 'border-border bg-card'}`}
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                    >
                        <span className="text-body-medium text-muted-foreground mb-2">Drag & drop files here</span>
                        <span className="text-body-small text-muted-foreground mb-4">or</span>
                        <Button variant="secondary" onClick={handleBrowseClick} className="mb-2">Browse from computer</Button>
                        <Input 
                            ref={inputRef} 
                            type="file" 
                            multiple 
                            className="hidden" 
                            />
                    </div>
                    <DialogClose asChild>
                        <Button 
                            variant="ghost" 
                            className="mt-4 w-full border border-red-100 hover:cursor-pointer
                              hover:bg-red-50 hover:text-red-500
                              dark:hover:bg-red-900 dark:hover:text-red-100 dark:border-red-900"
                        >
                            Close
                        </Button>
                    </DialogClose>
                </DialogContent>
            </Dialog>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i} className="rounded-lg border bg-card shadow-sm">
                            <CardHeader>
                                <Skeleton className="h-6 w-2/3 mb-2" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-4 w-1/2 mb-1" />
                                <Skeleton className="h-4 w-1/3 mb-4" />
                                <Skeleton className="h-10 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : error ? (
                <div className="text-red-600 dark:text-dark-danger text-center">{error}</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {documents.map((doc) => (
                        <Card key={doc.id} className="rounded-lg border bg-card shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-150">
                            <CardHeader>
                                <CardTitle className="text-title-medium font-semibold leading-tight mb-2">{doc.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-body-small text-light-fg-muted dark:text-dark-fg-muted mb-1">Uploaded: {doc.uploaded}</div>
                                <div className="text-body-small text-light-fg-muted dark:text-dark-fg-muted mb-4">
                                    Status: <span className={doc.status === 'Processed' ? 'text-green-600' : 'text-yellow-600'}>{doc.status}</span>
                                </div>
                                <Button>
                                    View Document
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DocumentsPage;