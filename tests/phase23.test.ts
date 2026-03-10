import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';

describe('23 — Tiptap Editor & Post Creation', () => {
  describe('Tiptap dependencies', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    it('has @tiptap/core', () => expect(deps['@tiptap/core']).toBeDefined());
    it('has @tiptap/starter-kit', () => expect(deps['@tiptap/starter-kit']).toBeDefined());
    it('has @tiptap/extension-image', () => expect(deps['@tiptap/extension-image']).toBeDefined());
    it('has @tiptap/extension-link', () => expect(deps['@tiptap/extension-link']).toBeDefined());
    it('has @tiptap/extension-code-block-lowlight', () => expect(deps['@tiptap/extension-code-block-lowlight']).toBeDefined());
    it('has @tiptap/html', () => expect(deps['@tiptap/html']).toBeDefined());
    it('has lowlight', () => expect(deps['lowlight']).toBeDefined());
  });

  describe('editor page', () => {
    it('exists at src/pages/admin/editor.astro', () => {
      expect(existsSync('src/pages/admin/editor.astro')).toBe(true);
    });

    const editor = readFileSync('src/pages/admin/editor.astro', 'utf-8');

    it('imports Tiptap Editor', () => {
      expect(editor).toContain("from '@tiptap/core'");
    });

    it('imports StarterKit', () => {
      expect(editor).toContain("from '@tiptap/starter-kit'");
    });

    it('imports Image extension', () => {
      expect(editor).toContain("from '@tiptap/extension-image'");
    });

    it('imports Link extension', () => {
      expect(editor).toContain("from '@tiptap/extension-link'");
    });

    it('imports CodeBlockLowlight extension', () => {
      expect(editor).toContain("from '@tiptap/extension-code-block-lowlight'");
    });

    describe('toolbar', () => {
      it('has H1 button', () => expect(editor).toContain('data-action="h1"'));
      it('has H2 button', () => expect(editor).toContain('data-action="h2"'));
      it('has H3 button', () => expect(editor).toContain('data-action="h3"'));
      it('has bold button', () => expect(editor).toContain('data-action="bold"'));
      it('has italic button', () => expect(editor).toContain('data-action="italic"'));
      it('has bullet list button', () => expect(editor).toContain('data-action="bulletList"'));
      it('has ordered list button', () => expect(editor).toContain('data-action="orderedList"'));
      it('has link button', () => expect(editor).toContain('data-action="link"'));
      it('has code block button', () => expect(editor).toContain('data-action="codeBlock"'));
      it('has image button', () => expect(editor).toContain('data-action="image"'));
    });

    describe('metadata form', () => {
      it('has title input', () => expect(editor).toContain('id="post-title"'));
      it('has slug input', () => expect(editor).toContain('id="post-slug"'));
      it('has tags input', () => expect(editor).toContain('id="post-tags"'));
      it('has description textarea', () => expect(editor).toContain('id="post-description"'));
    });

    describe('auto-save', () => {
      it('has save indicator', () => expect(editor).toContain('id="save-indicator"'));
      it('uses 3-second debounce', () => expect(editor).toContain('3000'));
      it('shows saving state', () => expect(editor).toContain("'Saving...'"));
      it('shows saved state', () => expect(editor).toContain("'Saved'"));
    });

    describe('Firestore integration', () => {
      it('imports setDoc for saving', () => expect(editor).toContain('setDoc'));
      it('imports serverTimestamp', () => expect(editor).toContain('serverTimestamp'));
      it('saves to posts collection', () => expect(editor).toContain("doc(db, 'posts'"));
      it('sets draft status for new posts', () => expect(editor).toContain("data.status = 'draft'"));
      it('sets createdAt for new posts', () => expect(editor).toContain('data.createdAt = serverTimestamp()'));
      it('always sets updatedAt', () => expect(editor).toContain('updatedAt: serverTimestamp()'));
    });

    describe('image upload', () => {
      it('has hidden file input', () => expect(editor).toContain('id="image-upload"'));
      it('uploads to blog/{slug}/ path', () => expect(editor).toContain('`blog/${slug}/${filename}`'));
      it('uses uploadBytes', () => expect(editor).toContain('uploadBytes'));
      it('gets download URL after upload', () => expect(editor).toContain('getDownloadURL'));
    });

    describe('publish/unpublish', () => {
      it('has publish button', () => expect(editor).toContain('id="publish-btn"'));
      it('has preview button', () => expect(editor).toContain('id="preview-btn"'));
      it('sets publishedAt on publish', () => expect(editor).toContain('publishedAt: serverTimestamp()'));
      it('shows confirmation before publishing', () => expect(editor).toContain('sean-mcconnell.com/blog/'));
    });

    it('has auth gate redirecting to /admin', () => {
      expect(editor).toContain("window.location.href = '/admin'");
    });
  });

  describe('admin dashboard posts list', () => {
    const admin = readFileSync('src/pages/admin/index.astro', 'utf-8');

    it('imports Firestore query methods', () => {
      expect(admin).toContain('getDocs');
      expect(admin).toContain('deleteDoc');
      expect(admin).toContain('collection');
    });

    it('queries posts ordered by updatedAt', () => {
      expect(admin).toContain("orderBy('updatedAt'");
    });

    it('renders post cards with edit links', () => {
      expect(admin).toContain('/admin/editor?slug=');
    });

    it('has delete buttons with data-delete attribute', () => {
      expect(admin).toContain('data-delete=');
    });

    it('shows confirmation before delete', () => {
      expect(admin).toContain('confirm(');
    });

    it('new post button navigates to editor', () => {
      expect(admin).toContain("'/admin/editor'");
    });
  });

  describe('editor styles', () => {
    const editor = readFileSync('src/pages/admin/editor.astro', 'utf-8');

    it('has prose-editor heading styles', () => {
      expect(editor).toContain('.prose-editor h1');
      expect(editor).toContain('.prose-editor h2');
      expect(editor).toContain('.prose-editor h3');
    });

    it('has code block styles', () => {
      expect(editor).toContain('.prose-editor pre');
    });

    it('has image styles', () => {
      expect(editor).toContain('.prose-editor img');
    });
  });
});
