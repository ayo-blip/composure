import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileEdit, ArrowLeft, Upload, Trash2, FileText, AlertCircle, CheckCircle, Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  status: string;
  uploaded_at: string;
}

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];
const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.txt'];
const MAX_SIZE_MB = 20;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    uploaded: {
      label: 'Uploaded',
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      icon: <Clock className="w-3 h-3" />,
    },
    processing: {
      label: 'Processing',
      className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
    },
    ready: {
      label: 'Ready',
      className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      icon: <CheckCircle className="w-3 h-3" />,
    },
    error: {
      label: 'Error',
      className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      icon: <AlertCircle className="w-3 h-3" />,
    },
  };

  const { label, className, icon } = config[status] ?? config.uploaded;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {icon}
      {label}
    </span>
  );
}

export default function KnowledgeBase() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (profile?.organisation_id) fetchDocuments();
  }, [profile?.organisation_id]);

  // Poll every 10s while any document is still processing
  useEffect(() => {
    const hasProcessing = documents.some(d => d.status === 'processing' || d.status === 'uploaded');
    if (!hasProcessing) return;

    const interval = setInterval(fetchDocuments, 10000);
    return () => clearInterval(interval);
  }, [documents]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (error) {
      toast({ title: 'Error loading documents', description: error.message, variant: 'destructive' });
    } else {
      setDocuments(data || []);
    }
    setIsLoading(false);
  };

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `${file.name} is not supported. Only PDF, DOCX, and TXT files are allowed.`;
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `${file.name} is too large. Maximum file size is ${MAX_SIZE_MB}MB.`;
    }
    return null;
  };

  const uploadFile = async (file: File) => {
    if (!user || !profile?.organisation_id) return;

    const validationError = validateFile(file);
    if (validationError) {
      toast({ title: 'Invalid file', description: validationError, variant: 'destructive' });
      return;
    }

    const fileId = crypto.randomUUID();
    const documentId = crypto.randomUUID();
    const filePath = `${profile.organisation_id}/${fileId}-${file.name}`;

    const { error: storageError } = await supabase.storage
      .from('organisation-documents')
      .upload(filePath, file);

    if (storageError) {
      toast({ title: 'Upload failed', description: storageError.message, variant: 'destructive' });
      return;
    }

    const { error: dbError } = await supabase.from('documents').insert({
      id: documentId,
      organisation_id: profile.organisation_id,
      file_name: file.name,
      file_path: filePath,
      file_type: file.type,
      status: 'uploaded',
      uploaded_by: user.id,
    });

    if (dbError) {
      await supabase.storage.from('organisation-documents').remove([filePath]);
      toast({ title: 'Upload failed', description: dbError.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'File uploaded', description: `${file.name} is being processed.` });
    fetchDocuments();

    // Trigger processing in background — status badge updates via polling
    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-document`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ document_id: documentId }),
    }).catch(err => console.error('Failed to trigger processing:', err));
  };

  const handleFiles = async (files: FileList | File[]) => {
    setIsUploading(true);
    const fileArray = Array.from(files);
    for (const file of fileArray) {
      await uploadFile(file);
    }
    setIsUploading(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDelete = async (doc: Document) => {
    const { error: storageError } = await supabase.storage
      .from('organisation-documents')
      .remove([doc.file_path]);

    if (storageError) {
      toast({ title: 'Delete failed', description: storageError.message, variant: 'destructive' });
      return;
    }

    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', doc.id);

    if (dbError) {
      toast({ title: 'Delete failed', description: dbError.message, variant: 'destructive' });
      return;
    }

    setDocuments(docs => docs.filter(d => d.id !== doc.id));
    toast({ title: 'Document deleted', description: `${doc.file_name} has been removed.` });
  };

  const formatFileType = (mimeType: string) => {
    if (mimeType === 'application/pdf') return 'PDF';
    if (mimeType.includes('wordprocessingml')) return 'DOCX';
    if (mimeType === 'text/plain') return 'TXT';
    return mimeType;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="mr-2 p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-elegant">
            <FileEdit className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-semibold text-foreground">
              HR<span className="text-accent">CompoSure</span>
            </h1>
            <p className="text-xs text-muted-foreground">Knowledge Base</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="font-heading text-3xl font-semibold text-foreground mb-2">
              Knowledge Base
            </h2>
            <p className="text-muted-foreground">
              Upload your HR policies, procedures, handbooks, and collective agreements. HRCompoSure will use them to ground every response in your organisation's own guidelines. For unionized environments, upload your applicable collective agreement as a PDF so the AI can reference it when drafting.
            </p>
          </div>

          {/* Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`mb-8 border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-accent bg-accent/5'
                : 'border-border hover:border-muted-foreground/50 hover:bg-secondary/50'
            } ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS.join(',')}
              multiple
              className="hidden"
              onChange={handleFileInputChange}
            />
            {isUploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 text-accent animate-spin" />
                <p className="text-foreground font-medium">Uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
                  <Upload className="w-7 h-7 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-foreground font-medium">Drop files here or click to upload</p>
                  <p className="text-sm text-muted-foreground mt-1">PDF, DOCX, TXT — max {MAX_SIZE_MB}MB per file</p>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Your documents are encrypted and never used to train any model
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Document List */}
          <div>
            <h3 className="font-heading text-lg font-semibold text-foreground mb-4">
              Uploaded documents
              {documents.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">({documents.length})</span>
              )}
            </h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-border">
                <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No documents uploaded yet.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload your HR policies to personalise every response.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-card rounded-xl border border-border shadow-card p-4 flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{doc.file_name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {formatFileType(doc.file_type)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(doc.uploaded_at).toLocaleDateString()}
                        </span>
                        <StatusBadge status={doc.status} />
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                          <Trash2 className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete document?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{doc.file_name}" from your knowledge base. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(doc)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
