import React, { useEffect, useState } from 'react';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

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

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
            <h1 className="text-title-large font-semibold leading-tight text-light-fg-default dark:text-dark-fg-default mb-6">Documents</h1>
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
                                    Status: <span className={doc.status === 'Processed' ? 'text-green' : 'text-yellow-600'}>{doc.status}</span>
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