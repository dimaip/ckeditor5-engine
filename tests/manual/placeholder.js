/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global console */

import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
import Enter from '@ckeditor/ckeditor5-enter/src/enter';
import Typing from '@ckeditor/ckeditor5-typing/src/typing';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import Undo from '@ckeditor/ckeditor5-undo/src/undo';
import Heading from '@ckeditor/ckeditor5-heading/src/heading';
import global from '@ckeditor/ckeditor5-utils/src/dom/global';
import { attachPlaceholder } from '../../src/view/placeholder';

ClassicEditor
	.create( global.document.querySelector( '#editor' ), {
		plugins: [ Enter, Typing, Paragraph, Undo, Heading ],
		toolbar: [ 'heading', '|', 'undo', 'redo' ]
	} )
	.then( editor => {
		const view = editor.editing.view;
		const viewDoc = view.document;
		const header = viewDoc.getRoot().getChild( 0 );
		const paragraph = viewDoc.getRoot().getChild( 1 );

		attachPlaceholder( view, header, 'Type some header text...' );
		attachPlaceholder( view, paragraph, 'Type some paragraph text...' );
		view.render();
	} )
	.catch( err => {
		console.error( err.stack );
	} );
