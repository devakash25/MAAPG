import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ownerApi } from '@/services';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatDate } from '@/utils/helpers';
import { useToast } from '@/components/ui/Toast';
import { FileText, Upload, Trash2, File, Image, FileSpreadsheet } from 'lucide-react';

const documentTypeIcons: Record<string, any> = {
  IDENTITY: File, OWNERSHIP: FileText, BUSINESS: FileSpreadsheet, BANK: File, PHOTO: Image, OTHER: File,
};

export default function OwnerDocumentsPage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadModal, setUploadModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({ name: '', type: 'IDENTITY' });

  const { data, isLoading } = useQuery({
    queryKey: ['ownerDocuments'],
    queryFn: () => ownerApi.getDocuments().then(res => res.data.data),
  });

  const uploadMutation = useMutation({
    mutationFn: (formData: any) => ownerApi.uploadDocument(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerDocuments'] });
      addToast('Document uploaded', 'success');
      setUploadModal(false);
      setSelectedFile(null);
      setUploadData({ name: '', type: 'IDENTITY' });
    },
    onError: () => addToast('Failed to upload document', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ownerApi.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerDocuments'] });
      addToast('Document deleted', 'success');
      setDeleteModal(null);
    },
    onError: () => addToast('Failed to delete document', 'error'),
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!uploadData.name) {
        setUploadData({ ...uploadData, name: file.name.replace(/\.[^/.]+$/, '') });
      }
    }
  };

  const handleUpload = () => {
    uploadMutation.mutate({
      name: uploadData.name,
      type: uploadData.type,
      url: selectedFile ? URL.createObjectURL(selectedFile) : '',
      fileName: selectedFile?.name || '',
    });
  };

  const documents = data || [];

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Documents</h1>
          <p className="text-gray-500 text-sm">Manage your property documents</p>
        </div>
        <Button onClick={() => setUploadModal(true)} className="w-full sm:w-auto">
          <Upload size={16} className="mr-2" /> Upload Document
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 md:p-6">
          {isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />)}</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No documents uploaded yet</p>
              <Button size="sm" className="mt-4" onClick={() => setUploadModal(true)}>
                <Upload size={16} className="mr-2" /> Upload Your First Document
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Document</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Uploaded</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc: any) => {
                      const Icon = documentTypeIcons[doc.type] || File;
                      return (
                        <tr key={doc.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                                <Icon size={18} className="text-sky-600" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{doc.name || doc.fileName}</p>
                                {doc.fileName && <p className="text-xs text-gray-500">{doc.fileName}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="secondary">{doc.type}</Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">{formatDate(doc.createdAt)}</td>
                          <td className="py-3 px-4 text-right">
                            <Button variant="ghost" size="sm" onClick={() => setDeleteModal(doc.id)} className="text-red-500">
                              <Trash2 size={16} />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {documents.map((doc: any) => {
                  const Icon = documentTypeIcons[doc.type] || File;
                  return (
                    <div key={doc.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
                            <Icon size={18} className="text-sky-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{doc.name || doc.fileName}</p>
                            <p className="text-xs text-gray-500">{doc.fileName}</p>
                          </div>
                        </div>
                        <Badge variant="secondary">{doc.type}</Badge>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t">
                        <span className="text-xs text-gray-500">{formatDate(doc.createdAt)}</span>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteModal(doc.id)} className="text-red-500"><Trash2 size={16} /></Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Upload Modal */}
      <Modal
        isOpen={uploadModal}
        onClose={() => { setUploadModal(false); setSelectedFile(null); }}
        title="Upload Document"
        footer={
          <>
            <Button variant="outline" onClick={() => { setUploadModal(false); setSelectedFile(null); }}>Cancel</Button>
            <Button onClick={handleUpload} disabled={!uploadData.name || uploadMutation.isPending}>
              {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Document Name</label>
            <input
              type="text"
              value={uploadData.name}
              onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}
              placeholder="Enter document name"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Document Type</label>
            <select
              value={uploadData.type}
              onChange={(e) => setUploadData({ ...uploadData, type: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none"
            >
              <option value="IDENTITY">ID Proof</option>
              <option value="OWNERSHIP">Property Ownership</option>
              <option value="BUSINESS">Business License</option>
              <option value="BANK">Bank Document</option>
              <option value="PHOTO">Photo</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-sky-400 transition-colors"
          >
            <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleFileSelect} />
            {selectedFile ? (
              <div>
                <File size={32} className="mx-auto text-sky-500 mb-2" />
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-gray-400 mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <Upload size={32} className="mx-auto text-gray-400 mb-3" />
                <p className="text-sm text-gray-500">Click to select a file</p>
                <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, DOC up to 10MB</p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Document"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteModal(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteModal && deleteMutation.mutate(deleteModal)}>Delete</Button>
          </>
        }
      >
        <p>Are you sure you want to delete this document? This action cannot be undone.</p>
      </Modal>
    </div>
  );
}
