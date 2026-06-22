'use client'
import dynamic from 'next/dynamic'
import 'react-quill-new/dist/quill.snow.css'

// react-quill-new touches `document`, so it must load client-side only.
const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => <div className="h-44 rounded-lg border border-slate-200 bg-slate-50" />,
})

// Outlook-style toolbar: fonts, size, bold/italic/underline/strike, text & highlight
// color, lists, alignment, links.
const modules = {
  toolbar: [
    [{ size: ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ align: [] }],
    ['link', 'clean'],
  ],
}

export default function RichEditor({
  value, onChange, placeholder,
}: {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}) {
  return (
    <div className="rich-editor">
      <ReactQuill theme="snow" value={value} onChange={onChange} modules={modules} placeholder={placeholder} />
    </div>
  )
}
