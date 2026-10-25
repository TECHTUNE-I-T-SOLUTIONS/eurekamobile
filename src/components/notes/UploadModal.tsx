import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import {
  X,
  UploadCloud,
  FileText,
  FileCode,
  FileCheck,
  AlertCircle,
  FileUp,
} from 'lucide-react-native';
import { notesApi } from '../../services/api/notes';

interface UploadModalProps {
  visible: boolean;
  onClose: () => void;
  onNoteUploaded: () => void;
}

export function UploadModal({ visible, onClose, onNoteUploaded }: UploadModalProps) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'file' | 'paste'>('file');

  // File picker state
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
    uri: string;
    mimeType?: string;
  } | null>(null);

  // Paste / manual text state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain', 'text/markdown', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const fileName = file.name.toLowerCase();
      const isValidExtension =
        fileName.endsWith('.pdf') ||
        fileName.endsWith('.txt') ||
        fileName.endsWith('.md');

      if (!isValidExtension) {
        Alert.alert(
          'Invalid File Type',
          'Please select a PDF, TXT, or Markdown (.md) document.'
        );
        return;
      }

      // Size check (max 25MB)
      const maxSize = 25 * 1024 * 1024;
      if (file.size && file.size > maxSize) {
        Alert.alert('File Too Large', 'Maximum file size is 25MB.');
        return;
      }

      setSelectedFile({
        name: file.name,
        size: file.size || 0,
        uri: file.uri,
        mimeType: file.mimeType,
      });

      // Auto set title if empty
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }

      // Simulate reading text or file content
      setContent(`[Attached Document: ${file.name}]\nSample parsed text from uploaded file. In a full production deployment, the file binary is uploaded to Supabase Storage and parsed via server-side PDF/TXT parser.`);
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to pick document.');
    }
  };

  const handleUpload = async () => {
    const finalTitle = title.trim();
    const finalContent = content.trim();

    if (!finalTitle || !finalContent) {
      Alert.alert('Missing Information', 'Please provide a title and document content.');
      return;
    }

    setUploading(true);
    setUploadProgress(20);

    try {
      setUploadProgress(60);
      const uploadedVia = selectedFile ? 'file' : 'paste';

      await notesApi.uploadNote({
        title: finalTitle,
        content: finalContent,
        uploadedVia,
        file: selectedFile
          ? {
              uri: selectedFile.uri,
              name: selectedFile.name,
              type:
                selectedFile.mimeType ||
                (selectedFile.name.endsWith('.pdf') ? 'application/pdf' : 'text/plain'),
            }
          : undefined,
        fileSize: selectedFile?.size,
        fileType: selectedFile?.name.split('.').pop(),
      });

      setUploadProgress(100);
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
        setSelectedFile(null);
        setTitle('');
        setContent('');
        onNoteUploaded();
        onClose();
        Alert.alert('Success', 'Note uploaded & queued for AI processing!');
      }, 500);
    } catch (error: any) {
      setUploading(false);
      setUploadProgress(0);
      Alert.alert('Upload Failed', error?.message || 'Could not upload note.');
    }
  };

  const getFileIcon = (name: string) => {
    if (name.endsWith('.pdf')) return <FileText size={24} color="#EF4444" />;
    if (name.endsWith('.md')) return <FileCode size={24} color="#3B82F6" />;
    return <FileText size={24} color="#10B981" />;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
        <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <UploadCloud size={24} color={theme.colors.primary} />
              <Text
                style={[
                  theme.typography.h3,
                  { color: theme.colors.textPrimary, marginLeft: 8 },
                ]}
              >
                Upload Course Notes
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Mode Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              onPress={() => setActiveTab('file')}
              style={[
                styles.tabButton,
                {
                  backgroundColor:
                    activeTab === 'file' ? theme.colors.primary : theme.colors.background,
                },
              ]}
            >
              <Text
                style={[
                  theme.typography.caption,
                  {
                    color:
                      activeTab === 'file'
                        ? theme.colors.primaryForeground
                        : theme.colors.textSecondary,
                    fontWeight: '700',
                  },
                ]}
              >
                Browse File (PDF, TXT, MD)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('paste')}
              style={[
                styles.tabButton,
                {
                  backgroundColor:
                    activeTab === 'paste' ? theme.colors.primary : theme.colors.background,
                },
              ]}
            >
              <Text
                style={[
                  theme.typography.caption,
                  {
                    color:
                      activeTab === 'paste'
                        ? theme.colors.primaryForeground
                        : theme.colors.textSecondary,
                    fontWeight: '700',
                  },
                ]}
              >
                Paste Transcript
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {activeTab === 'file' ? (
              <View style={styles.fileSection}>
                {selectedFile ? (
                  <View
                    style={[
                      styles.selectedFileCard,
                      { borderColor: theme.colors.surfaceBorder },
                    ]}
                  >
                    {getFileIcon(selectedFile.name)}
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text
                        style={[
                          theme.typography.body,
                          { color: theme.colors.textPrimary, fontWeight: '600' },
                        ]}
                        numberOfLines={1}
                      >
                        {selectedFile.name}
                      </Text>
                      <Text
                        style={[
                          theme.typography.caption,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedFile(null)}>
                      <X size={18} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={handlePickDocument}
                    style={[
                      styles.dropZone,
                      {
                        borderColor: theme.colors.primary,
                        backgroundColor: theme.colors.background,
                      },
                    ]}
                  >
                    <FileUp size={40} color={theme.colors.primary} />
                    <Text
                      style={[
                        theme.typography.h3,
                        { color: theme.colors.textPrimary, marginTop: 12 },
                      ]}
                    >
                      Tap to select document
                    </Text>
                    <Text
                      style={[
                        theme.typography.caption,
                        { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 4 },
                      ]}
                    >
                      Supports PDF, TXT, and Markdown files up to 25MB
                    </Text>
                  </TouchableOpacity>
                )}

                <Input
                  label="Document Title"
                  placeholder="e.g. CS201 Algorithms Lecture 3"
                  value={title}
                  onChangeText={setTitle}
                  style={{ marginTop: 0 }}
                />

                <Input
                  label="Extracted / Notes Preview"
                  placeholder="Content preview or notes summary..."
                  value={content}
                  onChangeText={setContent}
                  multiline
                  numberOfLines={4}
                  style={{ height: 100, textAlignVertical: 'top', marginTop: 0, padding: 2 }}
                />
              </View>
            ) : (
              <View style={styles.pasteSection}>
                <Input
                  label="Title"
                  placeholder="e.g. BIO101 Cellular respiration notes"
                  value={title}
                  onChangeText={setTitle}
                />
                <Input
                  label="Note Content / Transcript"
                  placeholder="Paste lecture notes, textbook chapters, or transcript text here..."
                  value={content}
                  onChangeText={setContent}
                  multiline
                  numberOfLines={8}
                  style={{ height: 180, textAlignVertical: 'top', marginTop: 0, padding: 2 }}
                />
              </View>
            )}

            {uploading && (
              <View style={styles.progressContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.textSecondary, marginLeft: 8 },
                  ]}
                >
                  Uploading & processing AI chunks ({uploadProgress}%)...
                </Text>
              </View>
            )}

            <Button
              title="Upload & Process Note"
              onPress={handleUpload}
              loading={uploading}
              size="lg"
              style={{ marginTop: 24, marginBottom: 12 }}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    padding: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(150,150,150,0.1)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  fileSection: {
    marginBottom: 12,
  },
  pasteSection: {
    marginBottom: 12,
  },
  dropZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedFileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(150,150,150,0.05)',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
});
