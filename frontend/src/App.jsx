import React, { useState } from 'react';

// FIX: Import the default export properly
import FroalaEditorComponent from 'react-froala-wysiwyg';

// Core styles
import 'froala-editor/css/froala_style.min.css';
import 'froala-editor/css/froala_editor.pkgd.min.css';

// All plugins
import 'froala-editor/js/plugins.pkgd.min.js';

// FIX: Extract the actual component
const FroalaEditor = FroalaEditorComponent.default || FroalaEditorComponent;

function App() {
  const [content, setContent] = useState('<p>Start editing here...</p>');

  // Configuration with all tools
  const config = {
    toolbarButtons: [
      ['bold', 'italic', 'underline', 'strikeThrough'],
      ['fontFamily', 'fontSize'],
      ['textColor', 'backgroundColor'],
      ['paragraphFormat', 'alignLeft', 'alignCenter', 'alignRight', 'alignJustify'],
      ['formatOL', 'formatUL', 'indent', 'outdent'],
      ['insertLink', 'insertImage', 'insertVideo', 'insertTable'],
      ['emoticons', 'specialCharacters'],
      ['undo', 'redo', 'fullscreen', 'codeView']
    ],
    placeholderText: 'Write something amazing...',
    heightMin: 400,
    heightMax: 600,
    charCounterCount: true,
    charCounterMax: 5000,
    
    // Image upload settings
    imageUploadURL: '/api/upload',
    imageUploadMethod: 'POST',
    imageMaxSize: 5 * 1024 * 1024,
    imageAllowedTypes: ['jpeg', 'jpg', 'png', 'gif'],
    
    // Font options
    fontFamily: {
      'Arial,Helvetica,sans-serif': 'Arial',
      'Georgia,serif': 'Georgia',
      'Impact,Charcoal,sans-serif': 'Impact',
      'Tahoma,Geneva,sans-serif': 'Tahoma',
      '"Times New Roman",Times,serif': 'Times New Roman',
      'Verdana,Geneva,sans-serif': 'Verdana'
    },
    
    fontSize: ['8', '10', '12', '14', '16', '18', '20', '24', '30', '36', '48', '72'],
    
    events: {
      'contentChanged': function() {
        console.log('Content changed');
      }
    }
  };

  // Debug: Check what we're rendering
  console.log('FroalaEditor type:', typeof FroalaEditor);
  console.log('FroalaEditor is:', FroalaEditor);

  // Don't render if not a valid component
  if (typeof FroalaEditor !== 'function') {
    console.error('FroalaEditor is not a valid component');
    return <div>Error loading editor. Please check console.</div>;
  }

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>

      <div style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        overflow: 'hidden',
        background: 'white'
      }}>
        <FroalaEditor
          tag="textarea"
          model={content}
          onModelChange={(newContent) => {
            setContent(newContent);
          }}
          config={config}
        />
      </div>
    </div>
  );
}

export default App;