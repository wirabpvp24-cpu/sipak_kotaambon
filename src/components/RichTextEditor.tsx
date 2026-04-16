import React from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    [{ 'font': [] }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'align': [] }],
    ['link', 'clean'],
  ],
};

const formats = [
  'header', 'font', 'size',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'list', 'align',
  'link'
];

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  return (
    <div className="bg-white rounded-lg overflow-hidden border border-input focus-within:ring-2 focus-within:ring-ring/50 transition-all">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="min-h-[300px]"
      />
      <style>{`
        .ql-container {
          font-family: inherit;
          font-size: 1rem;
          min-height: 250px;
        }
        .ql-editor {
          min-height: 250px;
        }
        .ql-toolbar.ql-snow {
          border: none;
          border-bottom: 1px solid var(--border);
          background: #f8fafc;
        }
        .ql-container.ql-snow {
          border: none;
        }
      `}</style>
    </div>
  );
}
