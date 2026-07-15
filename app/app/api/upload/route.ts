// Supporting Documents upload (XF2-13, ADR-006): local-disk target for the
// demo — files land in app/public/uploads/ (gitignored) and are served
// statically at /uploads/*. Whitelisted formats per the live wizard.
import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { MAX_FILE_MB, type UploadedFile } from '@/lib/wizard-shared';

const ALLOWED_EXT = new Set([
  '.pdf',
  '.ppt',
  '.pptx',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.jpg',
  '.jpeg',
  '.png',
]);

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file in request.' }, { status: 400 });
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      return NextResponse.json({ error: `File is over ${MAX_FILE_MB} MB.` }, { status: 413 });
    }

    const original = path.basename(file.name || 'file');
    const ext = path.extname(original).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      return NextResponse.json(
        { error: 'Unsupported format. Allowed: PDF, PPT, Word, XLS, JPG, PNG.' },
        { status: 415 },
      );
    }

    // Random prefix: no collisions, no path tricks, original name kept for display.
    const stored = `${randomUUID()}${ext}`;
    const dir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, stored), Buffer.from(await file.arrayBuffer()));

    const result: UploadedFile = {
      name: original,
      url: `/uploads/${stored}`,
      mimetype: file.type || 'application/octet-stream',
      size: file.size,
    };
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Upload failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
