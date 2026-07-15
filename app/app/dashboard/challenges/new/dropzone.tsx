'use client';

import { useRef, useState } from 'react';
import { useWizardDispatch, useWizardSelector } from './store';
import { addFiles, removeFile } from './wizard-slice';
import { MAX_FILES, MAX_FILE_MB, type UploadedFile } from '@/lib/wizard-shared';

// Supporting Documents (step 3): drag-drop / click-to-select, uploads to
// /api/upload (local disk), max 10 files — formats per the live wizard.
const ACCEPT =
  '.pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png';

export function Dropzone() {
  const dispatch = useWizardDispatch();
  const files = useWizardSelector((s) => s.wizard.fields.files);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (picked: FileList | File[]) => {
    setError(null);
    const room = MAX_FILES - files.length;
    const batch = [...picked].slice(0, room);
    if ([...picked].length > room) setError(`Max ${MAX_FILES} files — some were skipped.`);
    if (!batch.length) return;
    setBusy(true);
    try {
      const uploaded: UploadedFile[] = [];
      for (const file of batch) {
        if (file.size > MAX_FILE_MB * 1024 * 1024) {
          setError(`"${file.name}" is over ${MAX_FILE_MB} MB — skipped.`);
          continue;
        }
        const form = new FormData();
        form.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: form });
        const data = (await res.json()) as UploadedFile & { error?: string };
        if (!res.ok || data.error) throw new Error(data.error || `Upload failed (${res.status})`);
        uploaded.push(data);
      }
      if (uploaded.length) dispatch(addFiles(uploaded));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-[var(--spacing-12)]">
      <div className="flex items-center justify-between">
        <span className="text-[length:var(--font-size-14)] text-[color:var(--color-grey-black)]">
          Supporting Documents
        </span>
        <span className="text-[length:var(--font-size-14)] text-[color:var(--color-grey-5)]">
          Max {MAX_FILES} files
        </span>
      </div>

      <div className="grid gap-[var(--spacing-16)] md:grid-cols-2">
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            upload(e.dataTransfer.files);
          }}
          className="flex flex-col items-center justify-center gap-[var(--spacing-12)] p-[var(--spacing-32)] rounded-[var(--radius-8)] cursor-pointer text-center min-h-[220px]"
          style={{
            background: 'var(--gradient-upload-card)',
            border: `1.5px dashed ${over ? 'var(--color-violet-upload)' : 'var(--color-grey-3)'}`,
          }}
        >
          <UploadIcon />
          <p className="text-[length:var(--font-size-15)] font-[var(--font-weight-semibold)] text-[color:var(--color-grey-black)]">
            Drag and drop files here, or click to select files
          </p>
          <p className="text-[length:var(--font-size-13)] text-[color:var(--color-grey-5)]">
            Supported formats: PDF, PPT, Word, XLS, JPG, PNG
          </p>
          <span className="mt-[var(--spacing-8)] h-[40px] px-[var(--spacing-24)] rounded-[var(--radius-40)] border border-solid border-[var(--color-grey-3)] bg-[var(--color-grey-white)] text-[length:var(--font-size-14)] flex items-center">
            {busy ? 'Uploading…' : 'Select Files'}
          </span>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files?.length) upload(e.target.files);
              e.target.value = '';
            }}
          />
        </div>

        <div className="flex flex-col gap-[var(--spacing-8)] p-[var(--spacing-16)] rounded-[var(--radius-8)] border border-solid border-[var(--color-grey-2)] min-h-[220px]">
          {files.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-[var(--spacing-8)] text-[color:var(--color-grey-5)]">
              <DocIcon />
              <span className="text-[length:var(--font-size-14)]">No files yet</span>
            </div>
          ) : (
            files.map((f) => (
              <div
                key={f.url}
                className="flex items-center gap-[var(--spacing-12)] px-[var(--spacing-12)] py-[var(--spacing-8)] rounded-[var(--radius-8)] bg-[var(--color-grey-1)]"
              >
                <DocIcon />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[length:var(--font-size-14)] text-[color:var(--color-grey-black)]">{f.name}</p>
                  <p className="text-[length:var(--font-size-12)] text-[color:var(--color-grey-5)]">
                    {(f.size / 1024).toFixed(0)} KB
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${f.name}`}
                  onClick={() => dispatch(removeFile(f.url))}
                  className="text-[color:var(--color-grey-5)] hover:text-[color:var(--color-error)]"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {error && (
        <p className="text-[length:var(--font-size-13)] text-[color:var(--color-error)]">{error}</p>
      )}
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 16V4m0 0l-4 4m4-4l4 4" stroke="var(--color-violet-upload)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" stroke="var(--color-violet-upload)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 2h8l4 4v16H6V2z"
        stroke="var(--color-grey-4)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M14 2v4h4" stroke="var(--color-grey-4)" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
