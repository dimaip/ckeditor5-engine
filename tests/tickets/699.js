/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* globals document */

import ClassicTestEditor from '@ckeditor/ckeditor5-core/tests/_utils/classictesteditor';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';

import {
	upcastElementToElement
} from '../../src/conversion/upcast-converters';

import {
	downcastElementToElement
} from '../../src/conversion/downcast-converters';

import { getData as getModelData } from '../../src/dev-utils/model';
import { getData as getViewData } from '../../src/dev-utils/view';

describe( 'Bug ckeditor5-engine#699', () => {
	let element;

	beforeEach( () => {
		element = document.createElement( 'div' );

		document.body.appendChild( element );
	} );

	afterEach( () => {
		element.remove();
	} );

	it( 'the engine sets the initial selection on the first widget', () => {
		return ClassicTestEditor
			.create( element, { plugins: [ Paragraph, WidgetPlugin ] } )
			.then( editor => {
				editor.setData( '<widget></widget><p>foo</p>' );

				expect( getModelData( editor.model ) ).to.equal( '[<widget></widget>]<paragraph>foo</paragraph>' );
				expect( getViewData( editor.editing.view ) ).to.equal( '[<widget></widget>]<p>foo</p>' );

				return editor.destroy();
			} );
	} );
} );

function WidgetPlugin( editor ) {
	const schema = editor.model.schema;

	schema.register( 'widget', {
		isObject: true
	} );
	schema.extend( 'widget', { allowIn: '$root' } );

	editor.conversion.for( 'downcast' ).add( downcastElementToElement( {
		model: 'widget',
		view: 'widget'
	} ) );

	editor.conversion.for( 'upcast' ).add( upcastElementToElement( {
		model: 'widget',
		view: 'widget'
	} ) );
}
