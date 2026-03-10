import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';

describe('24 — Preview & Publish Workflow', () => {
  describe('preview page', () => {
    it('exists at src/pages/admin/preview.astro', () => {
      expect(existsSync('src/pages/admin/preview.astro')).toBe(true);
    });

    const preview = readFileSync('src/pages/admin/preview.astro', 'utf-8');

    it('imports generateHTML from @tiptap/html', () => {
      expect(preview).toContain("from '@tiptap/html'");
      expect(preview).toContain('generateHTML');
    });

    it('imports all Tiptap extensions for rendering', () => {
      expect(preview).toContain("from '@tiptap/starter-kit'");
      expect(preview).toContain("from '@tiptap/extension-image'");
      expect(preview).toContain("from '@tiptap/extension-link'");
      expect(preview).toContain("from '@tiptap/extension-code-block-lowlight'");
    });

    it('reads slug from URL params', () => {
      expect(preview).toContain("new URLSearchParams(window.location.search).get('slug')");
    });

    it('loads post from Firestore', () => {
      expect(preview).toContain("doc(db, 'posts', slug)");
    });

    it('renders post title', () => {
      expect(preview).toContain('id="preview-title"');
    });

    it('renders post date', () => {
      expect(preview).toContain('id="preview-date"');
    });

    it('renders reading time', () => {
      expect(preview).toContain('id="preview-reading-time"');
      expect(preview).toContain('min read');
    });

    it('renders tags', () => {
      expect(preview).toContain('id="preview-tags"');
    });

    it('renders post body HTML', () => {
      expect(preview).toContain('id="preview-body"');
    });

    it('has preview mode banner', () => {
      expect(preview).toContain('Preview Mode');
    });

    it('has auth gate', () => {
      expect(preview).toContain('ADMIN_EMAIL');
      expect(preview).toContain("window.location.href = '/admin'");
    });

    it('has prose-blog styles', () => {
      expect(preview).toContain('.prose-blog h1');
      expect(preview).toContain('.prose-blog p');
      expect(preview).toContain('.prose-blog pre');
    });
  });

  describe('editor publish/unpublish (built in Phase 23)', () => {
    const editor = readFileSync('src/pages/admin/editor.astro', 'utf-8');

    it('publish button sets status to published', () => {
      expect(editor).toContain("status: 'published'");
    });

    it('unpublish button sets status to draft', () => {
      expect(editor).toContain("status: 'draft'");
    });

    it('publish sets publishedAt timestamp', () => {
      expect(editor).toContain('publishedAt: serverTimestamp()');
    });

    it('shows confirmation dialog before publishing', () => {
      expect(editor).toContain('sean-mcconnell.com/blog/');
      expect(editor).toContain('confirm(');
    });

    it('preview button opens preview in new tab', () => {
      expect(editor).toContain("window.open(`/admin/preview?slug=");
    });

    it('changes button text based on status', () => {
      expect(editor).toContain("publishBtn.textContent = 'Unpublish'");
      expect(editor).toContain("publishBtn.textContent = 'Publish'");
    });
  });
});
