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

const VITE_BASE_URL_BACKEND = import.meta.env.VITE_BASE_URL_BACKEND
// Simulated fetch function (replace with real API call)
const fetchDocuments = async (): Promise<Document[]> => {
    try {
        const response = await fetch(`${VITE_BASE_URL_BACKEND}/api/documents`);
        if (!response.ok) {
            throw new Error('Failed to fetch documents');
        }
        const data = await response.json();
        // Map backend response to Document[]
        return (data.documents || []).map((doc: any) => ({
            id: doc.id || doc._id,
            name: doc.name,
            uploaded: doc.uploaded ? new Date(doc.uploaded).toLocaleDateString('en-CA') : '',
            status: doc.status,
        }));
    } catch (error) {
        throw error;
    }
};

const DocumentsPage: React.FC = () => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [openUploadModal, setOpenUploadModal] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
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
            setSelectedFiles([e.dataTransfer.files[0]]);
        }
    };

    const handleBrowseClick = () => {
        inputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFiles([e.target.files[0]]);
        }
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;
        setUploading(true);
        setUploadError(null);
        const formData = new FormData();
        selectedFiles.forEach((file) => {
            formData.append('file', file);
        });
        try {
            const response = await fetch(`${VITE_BASE_URL_BACKEND}/api/upload/document`, {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) {
                throw new Error('Upload failed');
            }
            // Refresh documents list after upload
            const docs = await fetchDocuments();
            setDocuments(docs);
            setOpenUploadModal(false);
            setSelectedFiles([]);
        } catch (err) {
            setUploadError('Failed to upload files');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-title-large font-semibold leading-tight text-light-fg-default dark:text-dark-fg-default">Documents</h1>
                <Button
                    onClick={() => setOpenUploadModal(true)}
                    className="font-medium text-sm px-4 py-2 rounded transition-all duration-150 hover:shadow-sm hover:-translate-y-0.5 hover:cursor-pointer"
                >
                    Upload
                </Button>
            </div>

            <Dialog
                open={openUploadModal}
                onOpenChange={(open) => {
                    setOpenUploadModal(open);
                    if (!open) {
                        setSelectedFiles([]);
                        setUploadError("")
                    }
                }}
            >
                <DialogContent className="max-w-md mx-auto">
                    <DialogHeader>
                        <DialogTitle>Upload Document</DialogTitle>
                    </DialogHeader>
                    <div
                        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-150 ${dragActive ? 'border-green bg-muted' : 'bg-card'}`}
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                    >
                        {selectedFiles.length === 0 ? (
                            <>
                                <span className="text-body-medium text-muted-foreground mb-2">Drag & drop files here</span>
                                <span className="text-body-small text-muted-foreground mb-4">or</span>
                                <Button variant="secondary" onClick={handleBrowseClick} className="mb-2">Browse from computer</Button>
                                <Input 
                                    ref={inputRef} 
                                    type="file" 
                                    className="hidden" 
                                    onChange={handleFileChange}
                                />
                            </>
                        ) : (
                            <>
                                <div className="w-full mb-4">
                                    <div className="font-medium mb-2">Selected files:</div>
                                    <ul className="text-sm text-muted-foreground mb-2">
                                        {selectedFiles.map((file, idx) => (
                                            <li key={idx}>{file.name}</li>
                                        ))}
                                    </ul>
                                    <Button 
                                        variant="default" 
                                        onClick={handleUpload} 
                                        disabled={uploading} 
                                        className="w-full cursor-pointer"
                                    >
                                        {uploading ? 'Uploading...' : 'Upload'}
                                    </Button>
                                    {uploadError && <div className="text-red-500 mt-2 text-sm">{uploadError}</div>}
                                </div>
                            </>
                        )}
                    </div>
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