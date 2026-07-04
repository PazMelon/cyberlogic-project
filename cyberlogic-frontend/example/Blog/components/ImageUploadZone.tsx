import SharedImageUploadZone from '../../../../components/ui/ImageUploadZone';
import { uploadBlogImage } from '../../../api/admin';

interface BlogImageUploadZoneProps {
  value: string;
  onChange: (url: string) => void;
  aspectHint?: string;
  resolutionHint?: string;
  className?: string;
  compact?: boolean;
}

/**
 * Blog-specific thin wrapper around the shared ImageUploadZone.
 * Passes the `uploadBlogImage` function as the immediate-upload handler.
 */
export default function ImageUploadZone({
  value,
  onChange,
  aspectHint = '16:9 aspect ratio',
  resolutionHint = '1200×630px recommended',
  className = '',
  compact = false,
}: BlogImageUploadZoneProps) {
  const handleUpload = async (file: File): Promise<{ url: string }> => {
    const result = await uploadBlogImage(file);
    return { url: result.url };
  };

  return (
    <SharedImageUploadZone
      value={value || undefined}
      onChange={onChange}
      onUpload={handleUpload}
      label=""
      aspectHint={aspectHint}
      resolutionHint={resolutionHint}
      shape={compact ? 'banner' : 'landscape'}
      maxSizeMB={5}
      className={className}
    />
  );
}
