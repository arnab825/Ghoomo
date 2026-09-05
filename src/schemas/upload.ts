import { z } from 'zod';

/**
 * Strict File Upload Metadata Schema
 * Validates file upload metadata attributes before processing binary stream.
 */
export const FileUploadMetadataSchema = z.object({
  filename: z.string({
      required_error: 'Filename is required',
      invalid_type_error: 'Filename must be a string',
    })
    .trim()
    .min(3, 'Filename must be at least 3 characters')
    .max(100, 'Filename cannot exceed 100 characters')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Filename must only contain alphanumeric characters, dots, underscores, or hyphens')
    .refine((name) => !name.includes('..'), { message: 'Path traversal (..) is strictly forbidden in filename' })
    .refine((name) => !/\.(php|phtml|exe|sh|bat|cmd|js|ts|html|htm|svg|cgi|py)$/i.test(name), {
      message: 'Executable or script file extensions are strictly prohibited',
    }),
  mimeType: z.enum(
    ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    {
      errorMap: () => ({
        message: 'Invalid MIME type. Permitted types: image/jpeg, image/png, image/webp, application/pdf',
      }),
    }
  ),
  sizeBytes: z.number({
      required_error: 'File size is required',
      invalid_type_error: 'File size must be a number',
    })
    .int('File size must be an integer')
    .min(100, 'File must be at least 100 bytes')
    .max(5 * 1024 * 1024, 'File size cannot exceed 5 MB'),
  category: z.enum(['image', 'document'], {
    errorMap: () => ({ message: "Category must be either 'image' or 'document'" }),
  }),
}).strict();

export type FileUploadMetadata = z.infer<typeof FileUploadMetadataSchema>;
